# WOW Guild Dashboard
- 🌐 [wowak-3edc9.web.app](https://wowak-3edc9.web.app)

## Overview
- 해당 프로젝트는 3개월간 진행된 월드 오브 워크래프트 버츄얼 스트리머 레이드 콘텐츠를 보며 "스트리머들이 콘텐츠에 몰입할 수 있는 환경을 만들자”라는 목표로 만들어진 서비스입니다.
- 라이트 유저들이 아이템과 스킬 정보를 찾는 데 어려움을 겪고 있는 모습이 있었고, 또한 레이드 참가자 선발 시 성장 현황을 비교할 수 있는 기준이 필요하다고 생각했습니다.
- 이를 위해 게임사 API와 Airflow를 활용해 ETL 자동화 환경을 구축하고, 직업별 아이템 및 스킬 통계와 캐릭터 정보를 확인할 수 있는 검색 서비스를 개발했습니다.



---

## Features

### 캐릭터 뷰어
> 길드원들과 비교한 유저의 능력치 및 장비 지표요약 

<img width="1642" height="1329" alt="image" src="https://github.com/user-attachments/assets/af00f71a-500d-4949-ab60-f6ae70ee7143"/>


- 장비 슬롯 전체 표시 (아이콘·아이템레벨·품질 색상)
- **3D 캐릭터 모델** — WoW Model Viewer (WebGL, zamimg CDN)
- **기어스코어** — 공식 GearScoreCalc 를 활용하여 유저의 장비 지표를 계산 및 변화량 시각화
- **레이더 차트** — 장비 고유 스탯 / 착용효과 / 마법부여 3가지 소스 분리 시각화
- 특성 트리 시각화 - 유저가 어떤 특성을 찍었는지 확인
- 인챈트 분석 패널 — 마법부여·보석 수량 요약, 합산 효과 바 차트
- 데이터 업데이트 — Cloudflare Worker → Blizzard API 직접 실시간으로 조회

---

### BIS 아이템 찾기
> 직업, 페이즈별 BEST IN SLOT 아이템 검색기능

<img width="1569" height="939" alt="image" src="https://github.com/user-attachments/assets/2368d356-1636-493e-aad5-7c200dda87de" />

- 직업·특성·슬롯·페이즈·출처 복합 필터
- 장바구니 CSV 데이터 저장
- Wowhead XML API 프록시 툴팁

---

### 스탯 랭킹
> 레이드 선발시 길드원 내 성장현황을 한눈에 확인 하기 위한 리더보드  
<img width="2707" height="1110" alt="image" src="https://github.com/user-attachments/assets/610a33b3-3fcb-4281-ae72-2caf6c4c57e5" />

- 직업별 주스탯 랭킹 테이블 (30명/페이지, 다중 정렬)
- 길드 등급 필터 (버튜버, 시청자 등)


---

### 특성·인챈트 통계
> 직업별로 어떤 특성을 찍어야할지, 어떤 인챈트를 사용해 주능력치를 올려야하는지 확인할 수 있는 기능
  <table>                                                                          
    <tr>
      <td><img width="840" alt="image" src="https://github.com/user-attachments/assets/84a94bf3-136a-412f-b23e-c8dba6f9e514" /></td>                              
      <td><img width="796" alt="image" src="https://github.com/user-attachments/assets/b706b2aa-f46a-4405-9545-0333152eb34a" /></td>
    </tr>
  </table>

- 직업·특성별 스킬 트리 히트맵, 특성 선택 분포표
- 직업·특성별 인챈트 사용 통계


---

### 길드 통계 대시보드
> 길드원의 게임 활성도를 확인하기 위한 기능 
 
<img width="2342" height="1215" alt="image" src="https://github.com/user-attachments/assets/2d6e5203-e67e-48db-9217-653834fe1937" />

- 접속 활성도 대시보드
- 클래스별 기어스코어 분포도



### 대표 콘텐츠 활용
> 카라잔 CK - 3팀으로 나눠 레이드 대결을 하는 콘텐츠에서 팀 선정을 위해 스트리머들의 능력치를 탐색하는데 활용되었습니다.
#### 관련클립
[![영상 썸네일](https://videoimg.sooplive.com/php/SnapshotLoad.php?rowKey=20260514_934D00E8_294009147_1_r&column=2&t=1778859173)](https://vod.sooplive.com/player/197695107)


### 서비스 개선 
> 사이트를 이용하는 스트리머분들의 [피드백](https://vod.sooplive.com/player/195583683)을 받아 개선하고 있습니다.
* 능력치가 높은 유저를 탐색하는 과정이 불편하다는 피드백
  * 리더보드에서 유저를 클릭 하거나 사이드바 필터를 추가해 바로 캐릭터 뷰어로 이동될 수 있도록 탐색 과정을 개선

#### 업데이트 내용
| 사이드바 필터 & 정렬 | 리더보드 캐릭터 이동 |
|---|---|                         
| 길드원 리스트에서 클래스·특성별 필터 적용 및 기어스코어 순 정렬 기능 추가 |리더보드에서 기어스코어 상위 유저 클릭 시 캐릭터 뷰어로 즉시 이동 |
| ![사이드바](https://github.com/user-attachments/assets/8b9da5fe-cfb3-43c6-8cef-cfec93a9b5f4) | ![리더보드](https://github.com/user-attachments/assets/89d17241-3e04-45b3-8eae-ef549c85f12c) |





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
        └── Firebase Analytics   ← 웹 관리 및 분석
```


### Data Pipeline - AIRFLOW 

**스케줄:** `54 * * * *` (매시 54분, KST) · `max_active_runs=1` · 단일 DAG 실행 시간 ~분 단위

```
[start]
   ↓
[get_token]                Blizzard OAuth2 client_credentials → access_token (XCom push)
   ↓
[collect_guild_roster]     GET /data/wow/guild/{realm}/{guild}/roster
                           → 길드원 메타(rank_num<10) 필터링 → roster_rows, char_names (XCom)
   ↓
[collect_char_details]     asyncio + aiohttp (Semaphore=50, ~167 req/s)
                           ├─ /profile/wow/character/{realm}/{name}  (루트)
                           └─ asyncio.gather:
                                ├─ media           → avatar_img
                                ├─ equipment       → 장비 슬롯/마법부여/보석/세트
                                ├─ statistics      → 37개 스탯 필드
                                ├─ appearance      → 종족/성별/외형 customizations
                                ├─ specializations → 특성 트리·talent_rank·spell_id
                                └─ pvp_summary     → honorable_kills
                           → /tmp/*.json 5개 파일 저장 (XCom 우회, 메모리 절약)
   ↓
   ├─[load_guild_members] ── dim_guild_members_{date}.json  (roster + extra 머지, KST 타임스탬프)
   ├─[load_equipment]     ── fact_equipment_{date}.json     (_parse_equipment_row, itemsEra 보강)
   ├─[load_appearance]    ── dim_appearance_{date}.json     (customizations → display_order 펼침)
   ├─[load_statistics]    ── fact_statistics_{date}.json    (json_normalize + 컬럼 rename)
   └─[load_specializations]── fact_specializations_{date}.json (talent 평탄화)
   ↓ (위 5개 fan-in)
[build_characters_json]    캐릭터 1명 = {meta + stats + equipment[] + specializations[]}
                           → /tmp/characters.json 단일 통합 파일
   ↓
[upload_firebase_snapshot] gzip(level=9) 압축 → GCS bucket 3-way 업로드
                           ├─ characters.json                        (Content-Encoding: gzip, max-age=86400)
                           ├─ snapshots/{YYYY-MM-DD}/characters_{HH}.json  (시간별 백업)
                           └─ version.json {chars: YYYYMMDDHHMM}     (no-store, 프론트 캐시버스팅)
   ↓
[update_login_log]         user_login_log.json 증분 머지 (snapshot 단계 생략)
                           ├─ 기존 gzip 다운로드 → 캐릭터 맵 복원
                           ├─ last_login_timestamp_KST 의 (date, time) delta 만 append
                           ├─ 안전장치: 신규 캐릭터 수 < 기존이면 RuntimeError로 abort
                           └─ gzip 재업로드
   ↓
[done]
```


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



