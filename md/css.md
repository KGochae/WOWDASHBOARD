# style.css 구조 요약

파일 위치: `/css/style.css`
전체 구성: CSS 변수 → 기반 레이아웃 → 각 페이지/컴포넌트별 스타일

---

## CSS 변수 (`:root`)
```css
--bg:#0a0a0a   --bg2:#111111   --bg3:#1a1a1a   --bg4:#222222
--border:rgba(255,255,255,.05)   --border2:rgba(255,255,255,.08)
--gold:#a0a0a0  --gold2:#c8c8c8  --gold3:#e8e8e8
--text:#f0f0f0  --text2:#b8b8b8  --text3:#787878
```

---

## 랜딩 페이지 (`#page-landing`)
| 클래스 | 설명 |
|--------|------|
| `.landing-nav` | 상단 전체 너비 네비게이션 바 (position:absolute, top:50px) |
| `.landing-nav-item` | 네비 항목 |
| `.landing-nav-item.nav-disabled` | 데이터 로드 전 비활성 상태 (opacity:.35, pointer-events:none) |
| `.landing-nav-has-drop` | 드롭다운 있는 항목 (통계), 호버 시 `.landing-nav-drop` 표시 |
| `.landing-nav-drop` / `.landing-nav-drop-item` | 통계 서브메뉴 드롭다운 |
| `.lnav-arrow` | ▾ 화살표 아이콘 |
| `.landing-layout` / `.landing-left` | 레이아웃 컨테이너 / 좌측 컨텐츠 영역 |
| `.landing-hero` | 브랜드 타이틀 영역 |
| `.landing-brand-tag` | "WOWGG" 태그 |
| `.landing-main-title` | 메인 타이틀 (Cinzel 폰트) |
| `.landing-search-section` | 검색창 래퍼 |
| `.wow-search-wrap` | 검색 인풋 그룹 (`.loading` 상태: 스피너 표시, 인풋 비활성) |
| `.wow-search-deco` | ⌕ 검색 장식 아이콘 |
| `.search-spinner` | 로딩 스피너 |
| `.wow-search-input` / `.wow-search-btn` | 검색 인풋·버튼 |
| `.landing-error` | 오류 메시지 (기본 숨김, `.show` 클래스로 표시) |
| `.landing-kpi-row` | 랜딩 KPI 카드 행 (flex, gap:12px) |
| `.landing-kpi-card` | KPI 카드 (hover 시 translateY(-2px), border 강조) |
| `.kpi-number` | KPI 숫자 (대형 폰트) |
| `.kpi-label` | KPI 라벨 (10px, letter-spacing:1.4px, uppercase) |

---

## 뷰어 헤더 (`.v-header`)
| 클래스 | 설명 |
|--------|------|
| `.v-logo` | WOW.GG 로고 (cursor:pointer) |
| `.v-sep` | 구분선 |
| `.v-search-wrap` | 검색창 |
| `.v-tabs` / `.v-tab` | 탭 목록·탭 아이템 |
| `.v-tab.active` | 활성 탭 |
| `.v-dropdown-wrap` | 통계 드롭다운 래퍼 |
| `.v-dropdown` / `.v-dropdown.open` | 드롭다운 메뉴 (`.open` 클래스로 표시) |
| `.v-dropdown-item` / `.v-dropdown-item.active` | 드롭다운 항목·활성 항목 |

---

## 레이아웃 (`.main-layout`)
| 클래스 | 설명 |
|--------|------|
| `.main-layout` | 메인 레이아웃 (flex, padding:16px 200px) |
| `.main-layout.stats-mode` | 통계 탭 시 padding:20px 50px |
| `.viewer-column` | 뷰어 컬럼 (flex:1, 사이드바 펼침 시 translateX(50px)) |
| `.viewer-area` | 통합 캐릭터 뷰어 카드 (glassmorphism, max-width:1100px) |
| `.bottom-card` | 하단 추가 카드 영역 |

---

## 사이드바 (`.sidebar`)
| 클래스 | 설명 |
|--------|------|
| `.sidebar` | position:absolute, 좌측 벽 고정 (width:270px, z-index:10) |
| `.sidebar.collapsed` | 접힌 상태 (width:32px) |
| `.sidebar-hd` | 헤더 (GUILD MEMBERS + 토글 버튼) |
| `.sidebar-toggle` | ◀ 토글 아이콘 (접힌 상태 rotate(180deg)) |
| `.sidebar-cat-label` | 등급·클래스 구분 레이블 (font-size:12px, font-weight:800, uppercase) |
| `.sidebar-cats` | 등급 필터 버튼 영역 |
| `.sidebar-class-cats` | 클래스 필터 버튼 영역 |
| `.sidebar-cat` | 필터 버튼 (border:1px solid, rounded) |
| `.sidebar-cat.active` | 활성 필터 버튼 |
| `.sidebar-cat.class-cat` | 클래스 필터 버튼 (클래스 컬러 동적 적용) |
| `.sidebar-list` | 멤버 목록 (flex:1, overflow-y:auto) |
| `.guild-row` | 멤버 행 (flex, draggable, `.active` 시 강조) |
| `.gr-dot` | 클래스 색상 점 (5×5px, border-radius:50%) |
| `.gr-name` | 닉네임 (flex:1, ellipsis) |
| `.gr-rank` | 등급 라벨 (9px, 등급별 색상) |
| `.gr-class` | 클래스명 (10px, width:44px) |
| `.gr-lv` / `.gr-lv.maxlv` | 레벨 (Lv.60+ 시 `#ffe066`) |

---

## 캐릭터 뷰어 패널 (`.viewer-area`)
| 클래스 | 설명 |
|--------|------|
| `.char-info-bar` | 캐릭터 정보 바 (아바타·이름·배지·히트맵) |
| `.char-avatar` | 아바타 컨테이너 (border-color 동적 적용 — 등급별 RANK_COLOR) |
| `.char-name-row` | 레벨 + 닉네임 행 |
| `.char-badges` | 배지 컨테이너 |
| `.cbadge` | 배지 (padding:2px 9px, border-radius:4px, font-size:12px) |
| `.cbadge-rank` | 등급 배지 (회색 계열) |
| `.cbadge-ok` | 녹색 배지 |
| `.cbadge-no` | 빨간 배지 |
| `.char-bar-right` | 우측 히트맵 영역 (`renderLoginHeatmap` 렌더 대상) |
| `.content-area` | 3분할 패널 래퍼 |
| `.panel-left` / `.panel-center` / `.panel-right` | 스탯 / 장비 / 스킬 패널 |
| `.eq-stat-card` | 장비 스탯 카드 (평균 아이템 레벨 + 기어스코어 + 레이더) |
| `.eq-ilvl-card` | 평균 아이템 레벨 카드 |
| `.eq-gs-card` | 기어스코어 카드 |
| `.eq-gs-label-row` | 기어스코어 라벨 행 (라벨 + ? 힌트 아이콘) |
| `.gs-hint-icon` | ? 아이콘 (hover 시 계산식 툴팁) |
| `.pct-badge` | 백분위 배지 (동적 표시, `#avgIlvlBadge` / `#gsBadge`) |
| `.eq-radar-lbl` | 레이더 차트 라벨 |
| `.gear-wrap` | 장비 슬롯 전체 래퍼 |
| `.gear-q-bar` | 아이템 등급 바 (hover 시 등급 분포 툴팁) |
| `.q-bar-track` | 등급 바 내부 트랙 (`buildQualityBar` 동적 렌더) |
| `.gear-cols` | 좌·모델·우 3컬럼 |
| `.eq-col` | 좌우 장비 슬롯 열 |
| `.model-col` / `.model-wrap` | 3D 모델 컬럼·래퍼 |
| `.eq-bottom` | 하단 장비 슬롯 (무기류 등, `#colBottom`) |
| `.item-stats-panel` | 아이템 스탯 합계 패널 |
| `.tg-tab` / `.tg-tab.active` | Active/Secondary 탭 |
| `.talent-trees` | 특성 트리 컨테이너 |
| `.stats-section-title` / `.panel-section-hd` | 패널 섹션 헤더 (인챈트 분석 최상단 타이틀에도 적용) |
| `.pr-tab-strip` | 뷰어 우측 북마크 탭 스트립 (viewer-area 내 position:absolute, right:-32px) |
| `.pr-panel-tab` | 북마크 탭 버튼 (writing-mode:vertical-rl, `.active` 시 금색 좌측 테두리) |
| `.overlay` / `.overlay-text` | 3D 모델 미로드 오버레이 |

---

## 인챈트 분석 패널 (`#pr-item-panel` / `.ia-*`)
| 클래스 | 설명 |
|--------|------|
| `#pr-item-panel` | 인챈트 분석 패널 컨테이너 (padding:0 0 8px, 좌우 패딩 없음) |
| `.ia-section-hd` | 섹션 구분 헤더 (보석/마법부여 소항목, 10px uppercase) |
| `.ia-bar-chart` | 합산효과 bar chart 컨테이너 (eq-card-right 스타일 카드: bg3, border, border-radius:5px, padding:10px) |
| `.ia-bar-row` | bar 한 줄 (grid: 80px 1fr 36px) |
| `.ia-bar-label` | 스탯 이름 (11px, text-align:left) |
| `.ia-bar-track` / `.ia-bar-fill` | 바 트랙·채움 (파란 그라데이션) |
| `.ia-bar-val` | 수치 (+N, `#8ec2f0`) |
| `.ia-row2` | 보석/마법부여 아이템 행 (flex, bg3, border-radius:5px) |
| `.ia-icon` | 아이템/마법부여 아이콘 (28×28px, hover 시 tooltip) |
| `.ia-row2-body` | 아이콘 옆 텍스트 영역 (flex-col, align-items:center) |
| `.ia-gem-name` | 보석 이름 (`#a8d0a8`) |
| `.ia-enc-name` | 마법부여 이름 |
| `.ia-gem-cnt` | 보석 개수 (×N, margin-left:auto) |
| `.ia-cnt` | 섹션 헤더 내 아이템 수 뱃지 |
| `.ia-empty` | 데이터 없음 메시지 |

**인챈트 분석 패널 구조**
1. `stats-section-title panel-section-hd` — "인챈트 분석" 타이틀 (좌우 패딩 없이 꽉 참)
2. 내부 `div[padding:0 8px]` — 아래 항목 감쌈
   - `ia-section-hd` "스탯 요약" + `ia-bar-chart` (합산효과)
   - `ia-section-hd` "보석 N" + `ia-row2` 목록 (count 내림차순)
   - `ia-section-hd` "마법부여 N" + `ia-row2` 목록

---

## 로그인 히트맵 (`.hm-*`)
| 클래스 | 설명 |
|--------|------|
| `.hm-wrap` | 히트맵 래퍼 (flex, row, gap:6px) |
| `.hm-label` | 월 라벨 (10px, var(--text3)) |
| `.hm-grid` | 주간 그리드 (grid-template-rows:repeat(7,8px), grid-auto-flow:column) |
| `.hm-cell` | 날짜 셀 (8×8px, border-radius:2px) |
| `.hm-on` | 로그인 있음 (`#2ea043` 녹색) |
| `.hm-inferred` | 전날 추론 (`#1a5c2a`, opacity:.7) |
| `.hm-nodata` | 데이터 없음 (시청자 2026-04-07 이전, × 표시) |
| `.hm-empty` | 해당 월 외 빈 칸 (transparent) |

---

## 통계 페이지 (`.stats-page`)
| 클래스 | 설명 |
|--------|------|
| `.stats-page` | 통계 전체 컨테이너 (flex-col, bg2, border-radius:8px) |
| `.st-tab-bar` | 탭 헤더 바 (padding:20px 28px 16px, 어두운 그라데이션 bg) |
| `.st-tab-hd` | 탭 제목 영역 (`.st-title-main` 44px, `.st-title-sub` 12px) |
| `.st-tabs` / `.st-tab` | 탭 목록·탭 항목 |
| `.st-tab.active` | 활성 탭 (color:#fff) |
| `.st-tab-panel` | 탭 패널 (flex:1) |
| `.stats-page-inner` | 내부 스크롤 컨테이너 (padding:0 28px 28px, flex-col, gap:20px) |
| `.stats-section-card` | 카드 컨테이너 (bg3%, border-radius:14px, glassmorphism shadow) |
| `.stats-section-label` | 카드 제목 |
| `.stats-main-grid` | 2열 그리드 (1fr 1fr) |
| `.st-filter-bar` / `.st-viewer-filter` | 필터 바·버튜버 필터 체크박스 바 |
| `.st-viewer-chk` | 체크박스 + 라벨 (font-weight:700) |

### 레벨 분포 KPI
| 클래스 | 설명 |
|--------|------|
| `.lv-kpi-row` | KPI 카드 행 (flex, gap:8px, flex-wrap) |
| `.lv-kpi-card` | KPI 카드 (glassmorphism, border-radius:12px) |
| `.lv-kpi-val` / `.lv-kpi-unit` | 수치·단위 |
| `.lv-kpi-label` | 라벨 (10px, uppercase) |
| `.lv-kpi-delta` | 변화량 |
| `.lv-kpi-delta--up` | 상승 (`#6dba8e`) |
| `.lv-kpi-delta--down` | 하락 (`#d4918e`) |
| `.lv-kpi-delta--none` | 변화 없음 (opacity:.2) |

### 스탯 랭킹
| 클래스 | 설명 |
|--------|------|
| `.st-cls-tabs` / `.st-cls-tab` | 직업 선택 탭 |
| `.st-cls-tab.active` | 활성 직업 탭 (border-color:currentColor) |
| `.st-rank-table` | 랭킹 테이블 |
| `.st-rank-val` | 스탯 수치 |
| `th.sortable` / `.sort-asc` / `.sort-desc` | 정렬 가능 헤더 |
| `.st-rank-search-wrap` / `.st-rank-search` / `.st-rank-search-btn` | 닉네임 검색 |
| `.st-pagination` | 페이지네이션 컨테이너 |
| `.st-page-btn` / `.st-page-btn.active` | 페이지 버튼 |
| `.st-lv-select` | 레벨 분포 클래스 드롭다운 |
| `.st-section-toggle` / `.st-toggle-arrow` / `.st-toggle-arrow.open` | 섹션 접기/펼치기 |

### 길드 통계 대시보드 (`.gd-*`)
| 클래스 | 설명 |
|--------|------|
| `.gd-dash` | 대시보드 레이아웃 (flex, row, gap:14px, max-width:1200px) |
| `.gd-main-col` | 메인 컬럼 (flex:1) |
| `.gd-right-col` | 우측 컬럼 (flex:0 0 260px) |
| `.gd-card` | 공통 카드 (glassmorphism, border-radius:20px, padding:18px) |
| `.gd-ch` | 카드 헤더 행 (flex, justify-content:space-between) |
| `.gd-ct` | 카드 타이틀 (12px, font-weight:800, uppercase) |
| `.gd-sel` | 카드 내 드롭다운 셀렉트 |
| `.gd-r1` | Row 1: 1fr + 280px 그리드 (Hero + 역할 분포) |
| `.gd-r2` | Row 2: 1fr + 340px 그리드 (활성도 + 멤버 상세) |
| `.gd-hero-ttl` / `.gd-hero-sub` | Hero 카드 제목·부제목 |
| `.gd-chk-vtuber` | 버튜버 필터 체크박스 |
| `.gd-act-kpi2` | 접속 활성도 KPI 4열 그리드 |
| `.gd-act-list2` | 활성도 멤버 목록 |
| `.gd-act-detail-card` | 멤버 상세 카드 |

### 활성도 테이블
| 클래스 | 설명 |
|--------|------|
| `.act-df-table` | 활성도 멤버 테이블 전체 |
| `.act-df-hd` | 헤더 (sticky, grid 5열: 번호·이름·레벨·평균일수·기타) |
| `.act-df-row` | 멤버 행 (hover 강조) |
| `.act-df-avatar` / `.act-df-avatar-ph` | 아바타 이미지·플레이스홀더 |

### 역할 분포 (`.role-*`)
| 클래스 | 설명 |
|--------|------|
| `.role-3col` | 딜·힐·탱 3열 그리드 |
| `.role-kpi-inner` | 역할 KPI 카드 (hover translateY(-2px), `.active-role` 테두리 강조) |
| `.role-kpi-inner.dps` / `.heal` / `.tank` | 역할별 색상 테마 (dps:#d4918e, heal:#7bb899, tank:#7a9fd4) |
| `.role-kpi-inner::before` | 상단 3px 컬러 바 |
| `.role-kpi-label` | 역할명 라벨 |
| `.role-kpi-count` | 인원수 (36px, font-weight:900) |
| `.role-kpi-pct` | 비율 배지 |
| `.role-rank-panel` / `.role-rank-panel.open` | 역할 선택 시 확장 랭킹 패널 |
| `.role-rank-item` | 랭킹 행 (grid 4열: 순위·이름·메타·평균일수) |
| `.rri-num.r1/r2/r3` | 금/은/동 순위 색상 |
| `.role-criteria-wrap` / `.role-criteria-icon` / `.role-criteria-tip` | 역할 분류 기준 툴팁 |

### MVP 카드 (`.st-mvp-*`)
| 클래스 | 설명 |
|--------|------|
| `.st-mvp-card` | MVP 카드 컨테이너 |
| `.st-mvp-top-bar` | 상단 컬러 바 (3px) |
| `.st-mvp-category` / `.st-mvp-name` / `.st-mvp-cls` | 카테고리·이름·클래스 |
| `.st-mvp-avatar` | 아바타 (80×80px, border-radius:50%) |
| `.st-mvp-stat-label` / `.st-mvp-stat-val` | 스탯 라벨·수치 |

### 스킬 통계 탭 (`.sk-*`)
| 클래스 | 설명 |
|--------|------|
| `.sk-cards-row` | 두 카드를 나란히 (align-items:stretch) |
| `.sk-section` | 카드 컨테이너 (bg2, border, radius:14px) |
| `.sk-item-card` | 오른쪽 스킬 분포 카드 |
| `.sk-picker-label` / `.sk-picker-group` / `.sk-pick-btn` | 직업·스킬 선택 피커 |
| `.sk-legend-row` | 범례 + 스킬 피커 한 줄 |
| `.sk-spec-picker-inline` | 스킬 피커 인라인 래퍼 |
| `.sk-spec-tree` | 개별 특성 트리 블록 |
| `.sk-pct-badge` | 선택률 % 배지 |

---

## 아이템 찾기 (`.is-*`)
| 클래스 | 설명 |
|--------|------|
| `.is-header` | 제목 영역 |
| `.is-filter-col` | 필터 사이드바 (width:260px) |
| `.is-sec` / `.is-sec-hd` | 필터 섹션·헤더 |
| `.is-exp-btns` / `.is-exp-btn` | 확장팩(CLASSIC/불성) 토글 버튼 |
| `.is-inst-cat-btns` / `.is-inst-cat-btn` | 던전/레이드 토글 버튼 |
| `.is-instance-sel` | 인스턴스 드롭다운 |
| `.is-item-row` | 아이템 행 |
| `.is-detail` | 아이템 상세 아코디언 |
| `.is-route-card` | 던전 루트 카드 |
| `.is-cls-btn` / `.is-cls-btn.on` | 직업 선택 버튼 |

---

## 레이드 (`.rd-*` / `.raid-detail`)
| 클래스 | 설명 |
|--------|------|
| `.rd-header` | 레이드 이름 + DPS 로그 SVG |
| `.rd-kpi` / `.rd-kpi-grid` | KPI 카드 영역 |
| `.rd-kpi-head` | KPI 헤더 (label + right) |
| `.rd-kpi-stat-grid` | 2열 스탯 그리드 |
| `.rd-kpi-stat-card` | 스탯 카드 (border-right/bottom 구분선) |
| `.rd-chart` / `.raid-bar-list` | 개인 랭킹 바 차트 |
| `.rd-ftab` / `.rd-ftab.active` | DPS/DTPS/HPS/Dispels 필터 탭 |

---

## 비교하기 (`.compare-page` / `.cmp-*`)
| 클래스 | 설명 |
|--------|------|
| `.cmp-cards-row` | 좌우 캐릭터 카드 행 |
| `.cmp-card` | 드롭 영역 카드 (left/right) |
| `.cmp-vs-divider` | VS 구분선 |
| `.cmp-stats-scroll` | 스탯 비교 스크롤 영역 |

---

## 반응형 브레이크포인트
| 범위 | padding |
|------|---------|
| 기본 Wide 1441px–1920px | `16px 200px` |
| 중간 1200px–1440px | 축소 padding |
| 2K 1921px+ | 확장 padding |

---

## 공통 유틸리티
| 클래스 | 설명 |
|--------|------|
| `#tooltip` | 전역 hover 툴팁 |
| `.load-bar` / `.load-fill` | 상단 로딩 진행바 (height:2px, gold 색상) |
| `#legalModal` | 법적 고지 모달 |
| `.overlay` / `.overlay-text` | 3D 모델 미로드 오버레이 |
| `.page-footer` | 하단 푸터 (이용약관·개인정보·버전) |
| `.footer-data-ver` | 데이터 버전 표시 (JS가 `updateSnapDateUI`로 갱신) |
| `.footer-link` / `.footer-sep` / `.footer-copy` | 푸터 링크·구분선·copyright |
| `.notice-card` / `.notice-date` / `.notice-title` / `.notice-md` | 공지사항 카드 |
