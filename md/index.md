# index.html 구조 요약

## 전체 페이지 구조
```
body
├── #page-landing          랜딩 검색 페이지
└── #page-viewer           메인 뷰어 페이지
    ├── .v-header          상단 탭 네비게이션
    ├── .load-bar          로딩 진행바
    └── .main-layout
        ├── .sidebar               길드 멤버 사이드바
        ├── #viewer-column
        │   └── #viewer-main-area  캐릭터 뷰어 (기본 탭)
        ├── #stats-main-area       왁타버스 통계 탭
        ├── #compare-main-area     캐릭터 비교 탭 (현재 주석 처리)
        ├── #notices-main-area     공지사항 탭
        ├── #item-setup-main-area  아이템 찾기 탭 (JS 동적 렌더)
        └── #raid-main-area        레이드 탭 (현재 주석 처리)
```

---

## #page-landing
- `.landing-nav` : 상단 전체 너비 네비게이션 바
  - `#lnav-items` : 아이템 검색 → `showViewer(); switchVTab('items')` — 데이터 로드 전 `.nav-disabled`
  - `#lnav-stats` : Waktaverse WOW 통계 (호버 드롭다운) — 데이터 로드 전 `.nav-disabled`
    - 드롭다운: `goStatsTab('rank')` / `goStatsTab('skill')` (길드 통계 항목 현재 주석 처리)
  - 레이드 항목 현재 HTML 주석 처리됨
- `.landing-layout` > `.landing-left` : 브랜드 타이틀 + 검색창
- `#searchWrap` : 검색 인풋 래퍼 (데이터 로딩 중 `.loading` 클래스)
- `#landingInput` : 검색 인풋 (데이터 로드 완료 후 활성화, placeholder 변경)
- `#landingError` / `#landingErrorMsg` : 검색 오류 메시지
- `.landing-kpi-row` : 랜딩 KPI 카드 행
  - `#kpi-total` : 전체 길드원 수 (애니메이션 카운트)
  - `#kpi-vtuber` : 버튜버 Lv.60+ 수 (애니메이션 카운트)
- `.page-footer` : 이용약관 / 개인정보 / `.footer-data-ver` (버전 표시)

---

## .v-header (상단 탭바)
| 요소 | ID/Class | 동작 |
|------|----------|------|
| 로고 | `.v-logo` | `goBack()` |
| 검색창 | `#viewerInput` | `searchFromViewer()` |
| 캐릭터 뷰어 탭 | `#vtab-viewer` | `switchVTab('viewer')` |
| 아이템 검색 탭 | `#vtab-items` | `switchVTab('items')` |
| 통계 드롭다운 | `#vtab-stats-wrap` > `#vtab-stats` | `toggleStatsDropdown()` |
| 통계 드롭다운 메뉴 | `#statsDropdown` | 스탯 랭킹 / 스킬·특성 통계 |
| ~~레이드 탭~~ | ~~`#vtab-raid`~~ | 현재 HTML 주석 처리됨 |
| ~~비교하기 탭~~ | ~~`#vtab-compare`~~ | 현재 HTML 주석 처리됨 |
| 공지사항 탭 | `#vtab-notices` | `switchVTab('notices')` |
| 스냅샷 날짜 | `#headerSnapDate` | `updateSnapDateUI()`로 갱신 |

통계 드롭다운 항목: `goStatsTab('rank')` / `goStatsTab('skill')` (길드 통계 주석 처리됨)

---

## .sidebar (길드 멤버 사이드바)
```
#sidebar
├── .sidebar-hd            GUILD MEMBERS + 접기 토글
├── #sidebarCats           등급 필터 버튼 (JS 동적 렌더, .sidebar-cat-label + .sidebar-cat)
├── #sidebarClassCats      클래스 필터 버튼 (JS 동적 렌더)
└── #sidebarList           멤버 목록 (JS 동적 렌더)
    └── .guild-row[data-name]   각 멤버 행 (드래그 가능)
        ├── .gr-dot        클래스 색상 점
        ├── .gr-name       닉네임
        ├── .gr-rank       등급 라벨
        ├── .gr-class      클래스명
        └── .gr-lv[.maxlv] 레벨 (Lv.60+ 시 .maxlv)
```

---

## #viewer-main-area (캐릭터 뷰어)
```
.viewer-area
├── .char-info-bar             캐릭터 정보 바
│   ├── #charAvatar            아바타 (SOOP 프로필 이미지 우선)
│   ├── .char-info
│   │   ├── .char-name-row
│   │   │   ├── #charLevel
│   │   │   └── #charName
│   │   └── #charBadges        종족/직업/특성/등급/마지막 접속 배지 (.cbadge)
│   └── #charBarRight          로그인 잔디 히트맵 (.hm-wrap)
└── .content-area
    ├── .panel-left            스탯 패널 (#stats-content)
    ├── .panel-center          캐릭터 장비 뷰어
    │   ├── #eqStatCard        장비 스탯 카드
    │   │   ├── .eq-card-left
    │   │   │   ├── .eq-ilvl-card  평균 아이템 레벨 (#avgIlvlVal, #avgIlvlBadge)
    │   │   │   └── .eq-gs-card    기어스코어 (#gsVal, #gsBadge, .gs-hint-icon)
    │   │   └── .eq-card-right
    │   │       └── #eqRadarWrap   레이더 차트
    │   ├── .gear-wrap
    │   │   ├── .gear-q-bar        아이템 등급 바 (#qualBarTrack)
    │   │   └── .gear-cols
    │   │       ├── #colLeft       좌측 장비 슬롯
    │   │       ├── .model-col
    │   │       │   ├── #model_3d  3D 모델 뷰어
    │   │       │   └── #colBottom 하단 장비 슬롯 (무기류 등)
    │   │       └── #colRight      우측 장비 슬롯
    │   └── #itemStatsPanel    아이템 스탯 합계 패널
    └── .panel-right           스킬/특성 패널
        ├── .tg-tabs
        │   ├── #tgtab-active      Active 탭 + #active-pts
        │   └── #tgtab-secondary   Secondary 탭 + #secondary-pts
        └── #talentTrees           특성 트리 렌더 영역
```

---

## #stats-main-area (왁타버스 통계)
JS가 동적으로 렌더. `renderStatsPage()` 진입점.

탭 전환: `switchStTab('rank' | 'skill')`

| 탭 ID | 탭명 | 주요 요소 |
|-------|------|-----------|
| `#sttab-rank` → `#stpanel-rank` | 스탯 랭킹 | `#stClsPicker` 직업선택, `#stRankFilter` 랭크필터, `#stRankSearch` 닉네임검색, `#stClsRank` 테이블 |
| `#sttab-skill` → `#stpanel-skill` | 스킬 통계 | `#skClassPicker` / `#skSpecPicker`, `#skTreeContainer` 트리, `#skDataframe` 분포표 |

길드 통계 탭(`#stpanel-guild`)은 HTML에서 제거됨 (주석 처리 또는 미사용)

**스탯 랭킹 기본 랭크 필터**: 버튜버 + 고정멤버 (`_stRankFilter = new Set(['버튜버','고정멤버'])`)

---

## #item-setup-main-area (아이템 찾기)
JS(`items.js`)가 동적으로 렌더링. 구조:
```
.is-header          제목 + 설명
.is-body
├── #is-filter-col  필터 사이드바 (직업 / 레벨구간 / 던전레이드 / 능력치 / 슬롯)
├── #is-main-col    아이템 목록
└── #is-route-col   우측 패널
    ├── .is-wh-sample      Wowhead XML API 테스트 샘플 카드 (상단)
    │   └── #is-wh-card    hover 시 Wowhead 한국어 툴팁 표시
    └── #is-route-cards    던전 루트 카드 (장바구니 기반)

#is-wh-tooltip  body 직접 부착 (fixed, z-index:9999)
```

---

## 로그인 히트맵 (`#charBarRight`)
`renderLoginHeatmap(name, rankName)` 호출 → `.hm-wrap` 렌더

```
.hm-wrap
├── .hm-label     월 라벨 (예: "4월")
└── .hm-grid      주간 그리드 (Mon 시작, grid-template-columns: repeat(N, 10px))
    └── .hm-cell  날짜 셀
        .hm-on        로그인 있음
        .hm-inferred  전날 추론 (오전 9시 미만 로그아웃)
        .hm-nodata    데이터 수집 전 (시청자, 2026-04-07 이전)
        .hm-empty     해당 월 외 빈 칸
```

---

## 전역 요소
| ID | 역할 |
|----|------|
| `#tooltip` | 공통 hover 툴팁 컨테이너 |
| `#logBox` | 개발 로그 박스 (?debug 파라미터 시 활성) |
| `#legalModal` | 이용약관/개인정보 모달 |
| `window.PROXY_HOST` | Cloudflare Workers URL |
| `window.CONTENT_PATH` | 모델뷰어 에셋 CDN 경로 |

---

## 스크립트 로드 순서
```html
1. window.PROXY_HOST / window.CONTENT_PATH 설정 (인라인)
2. jQuery 3.5.1 (CDN)
3. WoW Model Viewer (zamimg CDN)
4. /js/bundle.js  ← 앱 JS 전체 번들
5. /lib/wow-model-viewer/index.js (ES module, generateModels)
6. Firebase Analytics (ES module, </body> 직전)
```

---

## Firebase Analytics

Firebase Hosting(`wowak-3edc9.web.app`) 배포 환경에서만 동작. 로컬(`localhost`)은 비활성.

### 초기화 (`index.html` `</body>` 직전)
```html
<script type="module">
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
  import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-analytics.js";
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
  window.logFA = (event, params) => logEvent(analytics, event, params || {});
</script>
```
- `window.logFA(eventName, params)` 로 전역 호출
- `typeof window.logFA === 'function'` 체크 후 호출 (로컬 환경 안전 처리)

### 추적 이벤트 목록

**Firebase 자동 수집**
| 이벤트 | 의미 |
|--------|------|
| `page_view` | 페이지 로드 |
| `session_start` | 새 세션 시작 |
| `first_visit` | 기기당 최초 방문 |
| `user_engagement` | 1초 이상 페이지 포커스 유지 |

**커스텀 이벤트**
| 이벤트 | 파라미터 | 트리거 위치 |
|--------|----------|-------------|
| `tab_duration` | `{tab, seconds}` | `core.js` `switchVTab()` / `visibilitychange` / `pagehide` |
| `stat_ranking` | `{tab}` | `stats.js` `goStatsTab(tab)` |
| `search_character` | `{name}` | `stats.js` `searchChar()` / `searchFromViewer()` |
| `item_search_open` | — | `items.js` `openItemSetup()` |
| `static_skill_view` | — | `skillstats.js` `skSwitchMode('skill')` |
| `static_enchant_view` | — | `skillstats.js` `skSwitchMode('enchant')` |

### 체류시간 추적 (`core.js`)
- `switchVTab()` 호출 시 이전 탭 체류시간 계산 → `tab_duration` 전송
- 탭 전환 없이 페이지 이탈 시 `visibilitychange` / `pagehide` 이벤트로 전송
- 2초 미만 체류는 무시

### 확인 방법
- Firebase 콘솔 → Analytics → **DebugView**: 실시간 확인
- Firebase 콘솔 → Analytics → **Events**: 24시간 후 집계 데이터 확인

---

## Hash Routing
`navigation.js`의 `_preloadFromHash()` (즉시) + `_initFromHash()` (데이터 로드 후)

| URL 해시 | 진입 탭 |
|----------|---------|
| `#아이템검색` | 아이템 찾기 |
| `#공지사항` | 공지사항 |
| `#캐릭터뷰어` | 캐릭터 뷰어 |
| `#스탯랭킹` | 통계 > 스탯 랭킹 |
| `#스킬통계` | 통계 > 스킬 통계 |
| `#레이드` | 레이드 |
