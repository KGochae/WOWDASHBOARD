# WOW.GG — Waktaverse Guild Dashboard

왁타버스 WOW 클래식 TBC 길드원의 캐릭터 정보를 실시간으로 조회하고 분석하는 대시보드입니다.

**Live →** [wowak-3edc9.web.app](https://wowak-3edc9.web.app)

---

## Overview

해당 프로젝트는 월드 오브 워크래프트 버츄얼 스트리머 레이드 콘텐츠를 보며 스트리머들이 콘텐츠에 더 쉽게 몰입할 수 있는 환경을 만들자”라는 목표로 만들어진 서비스입니다.
라이트 유저들이 아이템과 스킬 정보를 찾는 데 어려움을 겪고 있는 모습이 있었고, 또한 레이드 참가자 선발 시 성장 현황을 비교할 수 있는 기준이 필요하다고 생각했습니다.
이를 위해 게임사 API와 Airflow를 활용해 ETL 자동화 환경을 구축하고, 직업별 아이템 및 스킬 통계와 캐릭터 정보를 확인할 수 있는 검색 서비스를 개발했습니다.

---

## Features

### 캐릭터 뷰어
- 장비 슬롯 전체 표시 (아이콘·아이템레벨·품질 색상)
- **3D 캐릭터 모델** — WoW Model Viewer (WebGL, zamimg CDN)
- **기어스코어** — GearScoreCalc.lua 포팅, 슬롯 보정·품질 배율·마법부여/젬 보정 포함
- **레이더 차트** — 장비 고유 스탯 / 착용효과 / 마법부여 3가지 소스 분리 시각화
- **로그인 히트맵** — GitHub 잔디 형태, 오전 9시 미만 로그아웃 시 전날 추론 반영
- 특성 트리 시각화 (Active / Secondary 그룹)
- 인챈트 분석 패널 — 마법부여·보석 수량 요약, 합산 효과 바 차트
- 아이템 스탯 합계 패널 (적중도/치유량/공격력 등 파생 스탯 포함)
- **실시간 새로고침** — Cloudflare Worker → Blizzard API 직접 조회

### 스탯 랭킹
- 직업별 스탯 랭킹 테이블 (30명/페이지, 다중 정렬)
- 길드 등급 필터 (버튜버, 시청자 등)
- 상위 백분위·직업 평균 대비 바 표시
- 닉네임 검색 → 해당 페이지 자동 이동

### 길드 통계 대시보드
- 역할(딜/탱/힐) 분포 도넛 차트
- 접속 활성도 대시보드
- MVP 카드 (스탯별 최고 캐릭터)
- 레벨 분포도

### 특성·인챈트 통계
- 직업·특성별 스킬 트리 히트맵 (전체 길드원 집계)
- 특성 선택 분포표
- 보석 색상 필터링 (붉은·노란·파란·얼개)
- 슬롯별 마법부여·보석 사용 현황

### 아이템 찾기
- Classic / TBC 3,736개 아이템 DB
- 직업·레벨구간·던전/레이드·능력치·슬롯 복합 필터
- 장바구니 기반 던전 루트 카드
- Wowhead XML API 프록시 툴팁

---

## Architecture

```
Browser
  └── Firebase Hosting (index.html + bundle.js)
        ├── Firebase Storage     ← characters.json, user_login_log.json (1시간 주기 스냅샷)
        ├── Cloudflare Worker    ← /blizzard/character/:name (실시간 Blizzard API 프록시)
        │     ├── Blizzard OAuth2 API
        │     ├── Firestore (character_refreshes) ← 실시간 갱신 캐시
        │     └── Cloudflare R2  ← 3D 모델 파일, itemsEra.json 캐시
        ├── zamimg CDN           ← WoW Model Viewer (WebGL)
        └── Firebase Analytics   ← 탭 체류시간, 검색 이벤트 추적
```

**데이터 파이프라인**
유저가 로그아웃된 시점에서 데이터가 업데이트 되는 특성상, Apache Airflow DAG(`wow_dag_async.py`)가 매시 55분 Blizzard API를 배치 수집해 Firebase Storage에 `characters.json` / `user_login_log.json`을 업로드합니다. 유저가 실시간 새로고침 버튼을 누르면 Cloudflare Worker가 단일 캐릭터를 직접 조회하고 Firestore에 저장, 다음 클라이언트 로드 시 스냅샷보다 최신 데이터가 자동 적용됩니다.

---

## Tech Stack

| 구분 | 기술 |
|------|------|
| Frontend | Vanilla JS / CSS (프레임워크 없음, 번들: `build_bundle.py`) |
| Hosting | Firebase Hosting |
| 데이터 저장 | Firebase Storage (JSON), Firestore (실시간 갱신) |
| 실시간 API 프록시 | Cloudflare Workers (Blizzard API, Wowhead XML) |
| 모델 캐시 | Cloudflare R2 |
| 3D 렌더 | WoW Model Viewer (zamimg CDN, WebGL) |
| 데이터 파이프라인 | Apache Airflow + Python |

---

## Key Implementation Details

**파생 스탯 계산**
배틀넷 API가 제공하지 않는 적중도·주문 치유량·공격력·기어스코어를 아이템 `stat_str`, 착용효과, 마법부여, 보석, 세트 효과 문자열을 정규식으로 파싱해 직접 집계합니다 (`data.js: _recomputeCharDerivedStats`).

**GearScore**
GearScoreCalc.lua 공식을 JS로 포팅. 슬롯별 가중치 × `((ilvl - A) / B) × 1.8618 × 품질배율`. Legendary = Epic × 1.3, 마법부여 +5%, 젬 +5/개, 헌터 무기 보정 포함.

**실시간 데이터 머지**
`refreshCurrentCharacter()`는 Cloudflare Worker에서 신선한 데이터를 받아 기존 `GUILD_DB / STATS_DB / SPEC_DB / CHAR_DB`에 인플레이스 머지합니다. 랭킹 캐시(`_statRankCache`)를 무효화해 통계 탭도 즉시 반영합니다.

**로그인 히트맵 추론**
로그아웃 시각이 오전 9시 미만이면 전날 새벽까지 플레이한 것으로 추론해 전날 셀도 `hm-inferred`로 표시합니다.

**Hash 라우팅**
`#스탯랭킹`, `#아이템검색` 등 한글 해시로 URL 직접 진입 및 탭 상태 복원을 지원합니다.

---

## Project Structure

```
index.html                  메인 앱 (SPA)
css/style.css               전체 스타일
js/
  constants.js              전역 상수 (슬롯·스탯·클래스·던전 메타)
  core.js                   탭 전환, 로그, XHR 인터셉터
  navigation.js             페이지·해시 라우팅
  data.js                   데이터 로드 및 전역 DB 구성, 파생 스탯 계산
  guild.js                  사이드바, 캐릭터 선택, 실시간 새로고침, 로그인 히트맵
  character.js              캐릭터 뷰어 (장비·스탯·특성·레이더 차트)
  stats.js                  스탯 랭킹, 길드 통계 대시보드
  skillstats.js             특성·인챈트 통계
  items.js                  아이템 찾기 및 필터
  tooltips.js               공통 툴팁 렌더러
  legal.js                  이용약관·개인정보 모달
worker/index.js             Cloudflare Worker (Blizzard API, Wowhead XML 프록시)
firebase.json               Firebase Hosting 설정
build_bundle.py             JS 번들 빌드 스크립트
```

---

## Local Development

```bash
# 로컬 서버 실행
python -m http.server 8000

# 브라우저 접속
http://localhost:8000

# 디버그 로그 활성화
http://localhost:8000?debug

# JS 수정 후 번들 재생성
python build_bundle.py
```

Cloudflare Worker 로컬 실행 (실시간 새로고침 사용 시):
```bash
cd _dev/worker
wrangler dev --remote
# → http://127.0.0.1:8787
```

---
