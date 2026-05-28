# WOW.GG — Waktaverse WOW Guild Dashboard

왁타버스 WOW 길드원들의 캐릭터 정보를 한눈에 확인할 수 있는 팬사이트 대시보드입니다.

> **Fan Site** — This is an unofficial fan project. Not affiliated with Blizzard Entertainment.

---

## Features

- **캐릭터 뷰어** — 장비, 스탯, 특성 트리, 3D 모델 뷰어
- **기어스코어** — GearScoreCalc.lua 기준 자동 계산
- **스탯 랭킹** — 직업별 적중도/치유량/공격력 등 랭킹 테이블
- **스킬/특성 통계** — 길드원 특성 선택 히트맵 & 분포표
- **아이템 찾기** — 던전/레이드별 BIS 아이템 필터 검색
- **로그인 히트맵** — 길드원 월별 접속 기록 잔디 시각화
- **길드 통계** — 역할(딜/탱/힐) 분포, 접속 활성도 대시보드

---

## Tech Stack

| 구분 | 기술 |
|------|------|
| Frontend | Vanilla HTML / CSS / JavaScript |
| 캐릭터 데이터 | Firebase Storage (정적 JSON) |
| 로그인 로그 | Firebase Storage |
| 아이템 툴팁 | Cloudflare Workers 프록시 → Wowhead XML API |
| 3D 모델 | WoW Model Viewer (zamimg CDN) |
| 아이콘 CDN | render.worldofwarcraft.com / nether.wowhead.com |

---

## Project Structure

```
index.html              메인 앱
css/style.css           전체 스타일
js/
  ├── bundle.js         배포용 번들 (원본 소스 합본)
  ├── constants.js      전역 상수
  ├── core.js           핵심 유틸 (탭 전환, 로그)
  ├── navigation.js     페이지·해시 라우팅
  ├── data.js           데이터 로드 및 전역 DB 구성
  ├── guild.js          사이드바, 로그인 히트맵, 캐릭터 선택
  ├── character.js      캐릭터 뷰어 렌더
  ├── stats.js          왁타버스 통계 (랭킹, 역할 분포, MVP)
  ├── skillstats.js     스킬 트리 통계
  ├── items.js          아이템 찾기
  ├── tooltips.js       툴팁 렌더
  ├── compare.js        캐릭터 비교
  ├── raid.js           레이드 상세
  └── legal.js          이용약관/개인정보 모달
data/
  ├── notices.json      공지사항
  ├── spell_icons.json  스펠 아이콘 캐시
  ├── tbc_talents.json  TBC 특성 트리 DB
  ├── dim_appearance.json  3D 외형 데이터
  ├── soop.json         SOOP 프로필 매핑
  ├── items_merged.json 아이템 DB (Classic+TBC, 3,736개)
  ├── itemsEra.json     아이템 표시ID (3D 렌더용)
  ├── atlasloot_bis.json  BIS 아이템 목록
  ├── tbca_bis_updated.json  TBCA BIS Phase 1
  └── raid/             레이드 CSV 데이터
skill_loadmap/
  └── class_skill_tree.json  직업별 스킬 트리 데이터
worker/index.js         Cloudflare Worker (Wowhead XML 프록시)
background/             레이드 배경 이미지
lib/                    WoW Model Viewer 라이브러리
build_bundle.py         번들 빌드 스크립트
firebase.json           Firebase Hosting 설정
```

---

## Local Development

```bash
# 로컬 서버 실행 (Python)
python -m http.server 8000

# 브라우저에서 접속
http://localhost:8000
```

디버그 로그 활성화:
```
http://localhost:8000?debug
```

JS 수정 후 번들 재생성:
```bash
python build_bundle.py
```

---

## Data Pipeline

캐릭터 데이터는 배틀넷 API → Python 스크래퍼 → Firebase Storage 경로로 수집됩니다.
로그인 로그는 별도 DAG(wow_dag_async.py)로 매시 55분 수집 후 Firebase Storage에 저장됩니다.
앱 로드 시 Firebase Storage에서 `characters.json`, `user_login_log.json`을 fetch합니다.

---

[새로운기능 - 레이드 시너지] - header tab [25인 레이드 구성] 추가
-> 레이드를 짤때, 어떤 길드원을 데려가야할지에 대한 고민으로 부터 나온 기능

1. [WOW classic 불타는 성전 기념서버 기준] 으로 레이드 캐릭터-특성별 조합 시너지를 토대로 최적의 팀을 구성할 수 있는 기능
2. 각 클래스-특성 끼리의 시너지 데이터를 우선 정리 (정확성 필요 - 매우중요)

3. 레이드 구성전용 사이드바 추가  [유저 - 클래스 - 특성 - 포지션 (힐러/탱커/딜러) -기어스코어 - 핵심 스탯 1개 (힐러- 치유증가량 / 탱커- 방어숙련도 / 딜러- 주문력 or 공격력 or 전투력) ]
4. 사이드 바에서 유저를 끌어와서 레이드 구성(한공대당 5명) - 각 팀별 시너지 요약




[아이템 및 인챈트 통계]
- 스킬/특성 통계영역에 아이템 및 인챈트 통계 추가
- st-mode-btn active 을  필터로 만들어줘 [테마필터]  - [특성 통계] - [인챈트 통계] 
- 클래스 - 특성 별 -  아이템 슬롯별로 어떤 마법부여, 보석을 썼는지 요약하는 통계 기능  (필터는 사이드 그대로 이용 , 인챈트 데이터 가져오는 로직은 pr-item-panel 확인) 
[본격적인 시작전 ui 고민] 
- gear-wrap 에 있는 itemslot 위치 구성만 그대로 가져오고, 시각화 하고싶은데 어떤 방법 이있을까? 기획을 세워줘



st-rank-notice 오른쪽에 집계 기준을 설명해줬으면 좋겠어 (집계기준보기 << 접고 필수있도록>>)

[집계 기준]
1. API 에서 제공되지 않은 능력치
1-1 치유 및 공격 증가량 
아이템 기본 능력치, 착용효과, 세트효과, 보석, 마법부여  
일부 클래스 특성 (여기에 오늘 추가한 내용 요약 EX. 성기사-신성 지능 35%...)

1-2 적중도 (주문 적중도, 치명타 적중도, 극대화 적중도)  
아이템 기본 능력치, 착용효과, 세트효과, 보석, 마법부여, 

2. 나머지 능력치들
유저가 로그아웃된 시점의 능력치 


[좋아 이제 연출방향을 알려줄게]
1. 화면이 점점 어두워지면서 5초동안 fade out
2. count 크게 10 ~ 1
3. "최다 호드킬"  soop profile img - 닉네임 - 값  을 text는 타이포그래피 연출로, 애니메이션 fade in 되게해줘. 숫자 값들은 0~n 까지 넘어가는 연출


1. [데이터] 길드등급은 [버튜버, 고정멤버] 등급 기준으로 해주고, [CSS] 폰트는 pretendard 기준으로 해줘.   
2. 우선 통계항목들은 전부지워주고,  [TEST 통계]  CHARACTER_NAME = "왁두" 의 "방어숙련도" 값으로 카드를 띄워줘. 
3. 여기서 연출이 필요해. 타이틀 먼저 띄우고  - soop 프로필사진을 중앙에 크게 나온뒤 왼쪽으로 옮겨지면서 "방어숙련도" 값이 count 되게 해줘




## 인챈트 요약 ui 패치
1. 보석 및 마법부여 이름은 hovor 했을때 같이 뜨도록해줘. (수량은 그대로 유지)
2. 보석 옆에 마법부여 COL 을 추가해서 2COL 로 나열해줘. 마법부여도 동일한 마법부여가 있으면 수량을 표시해줘 
3. class="ia-bar-chart" , class="ia-2col", 소켓보너스 까지  "인챈트 요약" 영역으로  그리고 "기어스코어 변화 차트" 부터 "아이템 요약" 영역으로 구분해줘. 
4. 즉, 기어스코어 변화는 "stats-section-title panel-section-hd" CSS 이어야합니다.

1. "인챈트 요약" 을 "아이템 요약" 으로 변경
2. [기어스코어 변화] 영역 아래에 [BIS/ALT]를 요약할거야.
3. 획득+TierToken , 상인, 토큰 등 아이템 출처별로 어떤 아이템을 얻었는지 요약해줘.( 획득 및 tiertoken의 경우 레이드별로도 같이 요약) notion card ui 형태로. 




## WOW RECAP 
RECAP 탭을 만들어서, 스크롤을 내려가면서 그동안의 여정을 RECAP 형태로 요약할거야. 현재 사용중인 TABLE CSS 및  디자인 CSS 를 참고해서 UI 통일성을 줘.

[내용]
WAKTAVERSE WOW RECAP 본격적으로 데이터를 수집한 4월8일 ~ 현재 까지의 WOW 통계입니다.


[주제]
[왁타버스 전체 길드원]-[4월8일 998명 ~ 현재 O명] 길드원 감소 없이 꾸준히 유지하고 있어요

[버튜버] - 4월8일 240명 ~ 현재 O명 -  N명 으로 감소했어요. 
- 버튜버 최후의 생존자  (4월8일 240명 -> 5월N일 N명 -> 그 중 5월 접속률 90% 이상 버튜버는? N명) - soop img  접속기록 heatamp table로 크게 요약
- 가장 높은 기어스코어를 달성한 왁타버스 길드원 (버튜버, 네임드, 스윗기사단, 시청자 등급별로 차례대로) + 주간 기어스코어 성장률
- WOW 클립중 가장 많은 조회수를 달성한 순간은? - [soopclip vieao 화면 영역 크게]

[CSS]
* 모든 폰트는 지금 사용중인 pretendard
* 시계열 날짜순으로 아래로 내려가면서 스크롤 할때마다 text가 나오도록해야해 event.js 를 참고해보면 animation이 자동으로 적용되는데, 이건 scroll animation 느낌으로 , 애니메이션 추가해서 TEXT에는 타이포그래픽  주면서 적절한 FADE IN-OUT 


[RECAP 부분을 좀더 수정하려고해]  




[레이드 추억들]
3.13 OO 레이드 버츄얼 25인 레이드 최초 클리어
LINK:

4.1  OO 레이드... 
LINK:

5.13 그룰레이드
LINK: https://vod.sooplive.com/player/195500523


