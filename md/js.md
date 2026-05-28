# JS 파일 구조 요약

번들: `/js/bundle.js` (배포용 단일 파일)
원본: `/js/*.js` (개발용, 아래 순서대로 번들링)

---

## constants.js — 전역 상수
| 상수 | 설명 |
|------|------|
| `BASE_ICON` / `WH_ICON` | 아이콘 CDN URL |
| `VISUAL_SLOTS` | 렌더링할 장비 슬롯 번호 배열 |
| `LAYOUT_LEFT/RIGHT/BTM` | 장비 슬롯 배치 순서 |
| `SLOT_META` | 슬롯번호 → 한글명 |
| `STAT_KR` | 영문 스탯키 → 한글명 |
| `FDID_MAP` | 종족+성별 → 3D 모델 FDID |
| `EMOJI_MAP` | 클래스ID → 이모지 |
| `CLASS_COLOR` | 클래스ID → 색상 hex |
| `CLASS_NAME_TO_ID` | 클래스명 → ID |
| `CLASS_SPEC_EN_TO_KR` | 클래스별 영문spec → 한글spec |
| `IS_SLOTS` / `IS_ICON_BASE` | 아이템 슬롯 목록, 아이콘 URL |
| `IS_CLASSES` / `IS_CLASS_ARMOR` / `IS_CLASS_WEAPON` | 직업별 착용 가능 방어구·무기 |
| `IS_DUNGEONS` / `IS_RAIDS` | 던전·레이드 인스턴스명 목록 |
| `IS_ALL_STATS` | 아이템 능력치 필터 목록 |

> `KR_TO_TREE_KEY` 는 `navigation.js` 상단에 정의됨 (constants.js 아님)

---

## core.js — 핵심 유틸
| 함수/요소 | 설명 |
|---------|------|
| `getSpellIcon(spellId)` | 스펠 아이콘 비동기 조회 (캐시) — `/data/spell_icons.json` 우선, 폴백: nether.wowhead.com `dataEnv=4,1,11,''` 순 시도 |
| `addLog(msg, type)` | URL에 `?debug` 있을 때만 `#logBox` 출력 (기본 비활성화) |
| `switchVTab(tab)` | 상단 탭 전환 (viewer/items/stats/raid/compare/notices), 사이드바 숨김 제어 |
| XHR 인터셉터 | `XMLHttpRequest.open/send` 패치 — PROXY_HOST 통신의 `.mo3`/`.m2` 파일 200/404 결과를 `addLog`로 출력 |

**switchVTab 내 사이드바 제어**
- `isRaid || isStats || isItems` 일 때 `.sidebar` 숨김
- `isViewer` 진입 시 `setTimeout(syncEqStatCardToSummary, 400)` 호출

---

## navigation.js — 페이지 전환
| 함수 | 설명 |
|------|------|
| `showViewer()` | 랜딩 → 뷰어 페이지 |
| `goBack()` | 뷰어 → 랜딩 페이지, 검색창 초기화 |
| `goStats()` | `showViewer()` + `switchVTab('stats')` |
| `switchTab(tab)` | 내부 탭 전환 (현재 UI에서 실질 동작 없음) |
| `buildLoadmapPreview(cls)` | `TBC_CLASS_TREES` + `TBC_TREE_MAP` 기반 스킬 로드맵 미리보기 |
| `switchTalentGroup(group)` | Active/Secondary 스킬 그룹 전환 |
| `renderNoticesPage()` | 공지사항 렌더 (역순 출력) |
| `_md(text)` | 마크다운 → HTML 변환 (공지용) |
| `_setHash(h)` | `history.replaceState`로 URL 해시 변경 |
| `_preloadFromHash()` | 데이터 로드 전 즉시 해당 탭 UI 표시 (렌더 없이) |
| `_initFromHash()` | 데이터 로드 후 해시에 맞는 탭으로 정상 진입 |

**Hash 라우팅 매핑**
```js
_HASH_TO_TAB = {
  '아이템검색':'items', '공지사항':'notices', '캐릭터뷰어':'viewer',
  '스탯랭킹':'stats',  '스킬통계':'stats',   '레이드':'raid'
}
```

**KR_TO_TREE_KEY** (navigation.js 상단 정의)
```js
{ '마법사':'mage', '전사':'warrior', '드루이드':'druid', ... }
```

---

## data.js — 데이터 로드 및 전역 DB 구성

### loadData() 로드 순서
1. `notices.json` → `window._notices`
2. `user_login_log.json` → `LOGIN_LOG_DB` (로컬: `/data/`, 프로덕션: Firebase Storage URL) — `row.n`/`row.d` 기반 캐릭터 중심 포맷
3. `itemsEra.json` → `ITEMS_ERA`
4. `tbc_talents.json` → `TBC_TALENT_BY_ID`, `TBC_TREE_MAP`, `TBC_CLASS_TREES`, `TBC_TREE_EN_NAME`, `TALENT_MAX_FROM_TREE`, `LOADMAP_SPELL_TO_TID`
5. `soop.json` → `window._soopMap` (캐릭터명→entry), `window._soopMapById` (character_id→entry)
6. `dim_appearance.json` → `apMap` (local)
7. **캐릭터 데이터**: 로컬 `/data/characters.json`, 프로덕션 Firebase Storage `characters.json` (`version.json`으로 캐시버스팅)
8. `GUILD_DB`, `STATS_DB`, `STATS_DB_V2`, `SPEC_DB`, `CHAR_DB` 구성
9. 파생 스탯 집계: 적중도/치명타/극대화 → `STATS_DB_V2`
10. 주문 치유량/주문 공격력 → `STATS_DB_V2`
11. GearScore 계산 → `STATS_DB_V2.gear_score`
12. 전투력 보정 → `STATS_DB_V2.attack_power`
13. 숙련도 통합 → `STATS_DB_V2.skill_rating`
14. `LOADMAP_SPELL_TO_TID` 보완 (specsFlat + TALENT_META)
15. `buildGuildUI()`, `updateSnapDateUI()`, `_initFromHash()` 호출

### TBCA_P1_LOOKUP 전역 빌드 (즉시실행 async)
- `tbca_bis_updated.json` 비동기 로드
- `{tbcaSpecKey: {item_id: {tier, rank, item_phase, source_type, source_ko, source_location}}}`

### 전역 DB 객체
| 변수 | 구조 | 설명 |
|------|------|------|
| `GUILD_DB` | `{name: {character_id, level, rank_name, rank_num, class_name, class_id, avatar_img, last_login_timestamp, last_login_timestamp_KST, snapshot_date, average_item_level}}` | 길드 멤버 기본 정보 |
| `CHAR_DB` | `{name: {name, race_id, gender_int, viewer_gender, race_name, class_name, class_id, gender_label, emoji, average_item_level, appearance, items}}` | 장비·외형 상세 |
| `SPEC_DB` | `{name: {active: [{spec, pts, talents:{tid:{rank,spell_id,base_spell_id,name,desc}}}], secondary: [...]}}` | 특성 트리 데이터 |
| `STATS_DB` / `STATS_DB_V2` | `{name: {character_name, health, strength_effective, ..., gear_score, hit_rating, spell_hit_rating, crit_rating, spell_crit_rating, healing_power, spell_dmg, attack_power, skill_rating}}` | 스탯 수치 + 파생 스탯 |
| `LOGIN_LOG_DB` | `{name: {'YYYY-MM-DD': ['HH:MM:SS', ...]}}` | 날짜별 로그인 시간 목록 (키=실제 로그인 날짜) |
| `TBCA_P1_LOOKUP` | `{tbcaSpecKey: {item_id: {...}}}` | BIS 아이템 룩업 |
| `window._soopMap` | `{character_name: soopEntry}` | SOOP 프로필 (이름 기반) |
| `window._soopMapById` | `{character_id: soopEntry}` | SOOP 프로필 (ID 기반, 우선순위 높음) |
| `CLASS_POSITION` | `{className: {stats:[{k,l,fmt}]}}` | 클래스별 랭킹 스탯 정의 |

### STATS_DB_V2 파생 스탯 집계 규칙
- **슬롯 중복 제거**: `[...new Set(Object.values(cd.items||{}))]` — slot16=slot15 참조 중복 대응
- **아이템 마법부여 필드**: `enchantSource` (마법부여 이름, `enchant_source`), `enchantSourceId` (아이템 아이콘 조회용 ID, `enchant_source_id`)
- **적중도 집계 소스**: `stat_str` + 착용효과(`착용 효과: 적중도가 N만큼`) + 마법부여(`적중도 +N`) + 젬효과 + 소켓보너스
- **주문 치유량/공격력**: 결합 마법부여(`주문 공격력 및 치유량 +N`, `치유 및 주문 공격력 +N`) 먼저 처리 후 개별 패턴 — 중복 방지를 위해 `remaining=enc.replace(결합Re,'')`
- **GearScore**: `GearScoreCalc.lua` 기준. `슬롯별 보정값 × ((ilvl-A)/B) × 1.8618 × qScale`. Legendary=Epic×1.3, 마법부여 +5%, 젬 +5/개, 헌터 무기 보정
- **숙련도(`skill_rating`)**: 착용효과 `숙련도가 N만큼` + 마법부여·젬·소켓보너스 `숙련도 +N` 합산 (낚시 제외)

### 기타 함수
| 함수 | 설명 |
|------|------|
| `buildCharDB(eqData, apData)` | legacy — 장비·외형 별도 배열로 CHAR_DB 구성 (loadData 내부 로직과 동일) |
| `getSnapshotDateKR()` | GUILD_DB 최신 snapshot_date → KST 문자열 반환 (UTC→KST 변환) |
| `updateSnapDateUI()` | `#headerSnapDate`, `#landingSnapDate` UI 갱신 |
| `closeNoticeModal()` | 공지 모달 닫기 + localStorage `noticeModalSeen=1` |

---

## guild.js — 사이드바 길드 UI + 캐릭터 선택
| 함수 | 설명 |
|------|------|
| `buildGuildUI()` | 사이드바 멤버 목록 전체 렌더 (등급·클래스 필터 버튼 포함) |
| `toggleSidebar()` | 사이드바 접기/펼치기 |
| `toggleCenterInfoCard()` | 중앙 정보 카드 접기/펼치기 |
| `setRankFilter(rank)` | 등급 필터 적용 (다중선택, 전체 클릭 시 단독) |
| `setClassFilter(cls)` | 클래스 필터 적용 (토글 방식) |
| `applyGuildFilter()` | 현재 필터로 목록 전체 재빌드 |
| `quickSelect(name)` | 검색창/클릭에서 캐릭터 바로 선택 |
| `renderLoginHeatmap(name, rankName)` | `#charBarRight`에 로그인 잔디 히트맵 렌더 |
| `selectChar(name)` | 캐릭터 선택 → WebGL cleanup → 장비/스탯/특성 렌더 |

**buildGuildUI 등급 카테고리**
`all / 길드마스터 / 고정멤버 / 버튜버 / 스윗기사단 / 네임드 / 시청자`
기본 활성: `버튜버`, 클래스 기본 활성: `사냥꾼`

**renderLoginHeatmap 로직**
- `LOGIN_LOG_DB[name]` 기반
- 오전 9시 미만 로그아웃 시 전날도 로그인으로 추론 (`isInferred`)
- 시청자는 `2026-04-07` 이전 데이터 없음 (`hm-nodata` 표시)
- 현재 월 기준 주간 그리드 (Mon 시작), `showHeatmapTT` 호출

**selectChar 아바타 우선순위**
`_soopMapById[character_id].profile_img` → `_soopMap[name].profile_img` → `gm.avatar_img`

**selectChar WebGL 정리**
```js
_lastViewer.setAnimPaused(true)
canvas.getContext('webgl').getExtension('WEBGL_lose_context').loseContext()
model_3d.innerHTML = '' (초기화)
```
사이드바 재빌드 없이 `dataset.name` 기준 `.active` 토글만 수행

---

## character.js — 캐릭터 뷰어 렌더
| 함수 | 설명 |
|------|------|
| `renderChar()` | 선택된 캐릭터 전체 렌더 진입점 |
| `buildStatsView(char)` | 좌측 스탯 패널 렌더 (요약·코어·전체) |
| `buildEquipment(char)` | 장비 슬롯 렌더 |
| `makeSlot(slotNum, item)` | 개별 장비 슬롯 HTML 생성 |
| `buildInfoCard(char)` | 캐릭터 정보 카드 |
| `buildTalentTrees(char)` | 우측 스킬 트리 렌더 |
| `buildItemStatsPanel(char)` | 아이템 스탯 합계 패널 (ALL STATS 적중도/치유증가/공격증가 포함, slot 15/16 중복 제거) |
| `buildItemAnalysis(char)` | 인챈트 분석 패널 렌더 — 합산효과(bar chart) → 보석 리스트 → 마법부여 리스트 순 출력 |
| `buildRadarSVG(...)` | 레이더 차트 SVG 생성 |
| `buildCompactRadarSVG(totalStats,axes,baseSum,spellSum,enchSum,hitBase,hitSpell,hitEnc,critEnc)` | 3분리 소스(장비스탯/착용효과/마법부여)로 레이더 차트 생성 |
| `buildQualityBar(char)` | 아이템 등급 바 렌더 + 레이더 3분리 집계 (baseSum/spellSum/enchSum) |
| `syncEqStatCardToSummary()` | 레이더 카드 ↔ 요약 동기화 |

**모듈 레벨 상수**
| 상수 | 용도 |
|------|------|
| `_ENCHANT_RE_PANEL` | `buildItemStatsPanel` 마법부여 파싱용 RegExp 맵 |
| `_ENCHANT_RE_RADAR` | `buildQualityBar` 레이더 차트 마법부여 파싱용 RegExp 맵 (인챈트 분석 합산효과에도 재사용) |
| `_ENCHANT_RE_ALLSTATS` | `buildStatsView` ALL STATS 마법부여 파싱용 RegExp 맵 |
| `_HIT_PARTS` | 적중도 세부 분류 배열 — 주문/치명타/원거리/극대화 등 서브타입 최우선 매칭 |
| `_SKILL_PARTS` | 숙련도 세부 분류 배열 — 방어/회피/방패/무기 막기 등 서브타입 최우선 매칭 |
| `_RADAR_SKIP` | 인챈트 분석 합산 시 `_ENCHANT_RE_RADAR`에서 제외할 키 Set |
| `_statRankCache` | `{className:{stat:sortedVals[]}}` — 직업별 스탯 랭킹 정렬 배열 세션 캐시 |

> `/g` 플래그 RegExp는 사용 전 `re.lastIndex=0` 리셋 필수

**레이더 차트 3분리 집계** (`buildQualityBar`)
- `baseSum` — `it.stats` (장비 고유 스탯)
- `spellSum` — `it.spell` 착용효과 패턴
- `enchSum` — `_ENCHANT_RE_RADAR` 각 축별 정규식 + 결합 마법부여

**rankOf 캐싱** (`buildStatsView`)
- 같은 직업 첫 클릭 시 1회 정렬 후 `_statRankCache`에 캐시, 이후 세션 내 재계산 없음

---

## stats.js — 왁타버스 통계

### 탭 전환
| 함수 | 설명 |
|------|------|
| `switchStTab(tab)` | rank/skill 탭 전환, 해시 갱신, 드롭다운 active 표시 |
| `toggleStatsDropdown()` | 통계 드롭다운 토글 |
| `goStatsTab(tab)` | 드롭다운 닫기 + `switchVTab('stats')` + `switchStTab(tab)` |
| `renderStatsPage()` | 통계 전체 진입점 — 랭크 필터 초기화 + 각 섹션 렌더 |

### 검색
| 함수 | 설명 |
|------|------|
| `searchChar()` | 랜딩 페이지 검색 |
| `searchFromViewer()` | 뷰어 헤더 검색창 검색 |

### 랭킹 상태 변수
```js
_stActiveClass  // 현재 선택 직업
_stSortKey      // 정렬 기준 스탯 키
_stSortDir      // 'asc' | 'desc' (기본 'desc')
_stRankPage     // 현재 페이지 (0-indexed, 30명/페이지)
_stRankFilter   // Set - 랭크 필터 (기본: new Set(['버튜버','고정멤버']))
_activeRole     // 역할 필터 ('딜러' | '서포터' | '탱커')
```

### 길드 통계 함수
| 함수 | 설명 |
|------|------|
| `buildGuildRoleOverview()` | 역할 분포 도넛 차트 카드 (`#gdRoleCard`) |
| `buildRoleDashboard()` | 탱딜힐 역할 선택 → `_renderRoleRank(role,data)` |
| `selectRoleRank(role)` | 역할 선택 및 랭킹 렌더 |
| `buildActivityDashboard()` | 접속 활성도 대시보드 |
| `buildMvpCards()` | MVP 카드 (최고 스탯 캐릭터) |
| `buildLevelDist(cls)` | 레벨 분포도 HTML |
| `_calcRoleData()` | 직업·특성 기반 딜/탱/힐 분류 |
| `_classifyRole(name)` | 캐릭터 1명 역할 판별 |

### 랭킹 함수
| 함수 | 설명 |
|------|------|
| `_stFilteredNames()` | 현재 랭크 필터 기준 대상 목록 반환 |
| `stToggleRank(key)` | 랭크 필터 토글 |
| `_stUpdateRankFilter()` | 랭크 필터 UI 갱신 |
| `stSetClass(cls)` | 랭킹 직업 선택 |
| `stSortBy(key)` | 랭킹 정렬 기준 변경 |
| `stGoPage(page)` | 랭킹 페이지 이동 |
| `stSearchNick()` | 닉네임 검색 → 해당 페이지 이동 + 하이라이트 |
| `stRenderClassTable(cls)` | 스탯 랭킹 테이블 렌더 (페이지네이션 포함) |
| `_stUpdateClsPicker()` | 직업 선택 피커 UI 갱신 |

**RANK_FILTER_GROUPS 기본값**
```js
{ '버튜버+고정': ['버튜버','고정멤버'], '전체': null }
```

---

## skillstats.js — 스킬 트리 통계
| 함수 | 설명 |
|------|------|
| `initSkillStatsTab()` | 직업 피커 초기화 (기본값: 마법사-냉기) |
| `skSelectClass(className)` | 직업 선택 → 스펙 피커 빌드 |
| `skSelectSpec(specName)` | 스펙 선택 → 트리 렌더 |
| `renderSkillStats(cls, spec)` | 스킬 트리 통계 렌더 (히트맵 방식) |
| `renderSkillDataframe(cls, spec, chars, total)` | 우측 스킬 선택 분포표 렌더 |

---

## items.js — 아이템 찾기
| 함수 | 설명 |
|------|------|
| `openItemSetup()` | 아이템 탭 진입점 |
| `isFilteredItems()` | 현재 필터 조건으로 아이템 목록 반환 (확장팩 필터 포함) |
| `isRenderList()` | 아이템 목록 헤더 갱신 |
| `isRenderItems()` | 아이템 행 렌더 |
| `isSelectClass(cls)` | 직업 필터 선택 |
| `isToggleExpansion(exp)` | 확장팩(CLASSIC / 불타는 성전) 토글 + 던전/레이드 버튼 노출 제어 |
| `_isRebuildInstanceSel()` | 확장팩 선택값에 맞춰 인스턴스 드롭다운 재구성 |
| `isToggleInstCat(cat)` | 던전/레이드 카테고리 토글 + 드롭다운 갱신 |
| `isSelectInstance(val)` | 특정 인스턴스 선택 |
| `isClearInstance()` | 인스턴스 필터 초기화 |
| `isClearStats()` / `isClearSlots()` | 능력치·슬롯 필터 초기화 |
| `isRenderRoute()` | 우측 던전 루트 카드 렌더 |
| `_isWhInit()` | Wowhead 샘플 카드 초기화 |
| `_isWhFetch()` | Worker 프록시 통해 Wowhead XML 호출 → htmlTooltip 파싱, 결과 캐시 |
| `isWhShowTooltip(e)` | hover 시 Wowhead 툴팁 표시 |
| `isWhMoveTooltip(e)` | 마우스 이동에 따라 툴팁 위치 갱신 |
| `isWhHideTooltip()` | 툴팁 숨김 |

**필터 상태 변수**
```js
_isLvMin / _isLvMax   // 레벨 구간
_isStats              // Set - 선택된 능력치
_isSlots              // Set - 선택된 장비 슬롯
_isClass              // 선택된 직업
_isExpansion          // '클래식' | '불타는 성전' | ''
_isInstCat            // 'DUNGEON' | 'RAID' | ''
_isInstance           // 선택된 인스턴스명
_isSearch             // 검색 텍스트
_isCartItems          // Set - 장바구니 item_id
```

---

## raid.js — 레이드 상세
| 함수 | 설명 |
|------|------|
| `openRaid(cell)` | 레이드 클릭 → 상세 오버레이 오픈 |
| `closeRaid()` | 오버레이 닫기 |
| `renderKpi(data)` | KPI 카드 렌더 |
| `renderBars(rows, type)` | 개인 랭킹 바 차트 렌더 |
| `renderDpsLog(csvText)` | DPS 시계열 SVG 렌더 |
| `raidSetTab(btn, type)` | DPS/DTPS/HPS/Dispels 탭 전환 |

---

## compare.js — 캐릭터 비교
| 함수 | 설명 |
|------|------|
| `cmpDrop(e, side)` | 드래그앤드롭으로 캐릭터 배치 |
| `cmpDragStart(event, name)` | 사이드바 멤버 드래그 시작 |
| `cmpSetChar(side, name)` | 특정 사이드에 캐릭터 세팅 |
| `renderCmpSlot(side)` | 비교 슬롯 렌더 |
| `renderCmpStats()` | 양측 스탯 비교 렌더 |

---

## tooltips.js — 툴팁
| 함수 | 설명 |
|------|------|
| `showTalentTT(tid, rank, ...)` | 특성 hover 툴팁 |
| `showItemTT(slotNum, e)` | 장비 아이템 툴팁 |
| `showStatTT(e, label, ...)` | 스탯 hover 툴팁 |
| `showRadarAxisTT(e,label,total,base,spell,enc,hitBase,hitSpell,hitEnc,critEnc)` | 레이더 축 툴팁 — 장비스탯/착용효과/마법부여 3행 표시 |
| `showHeatmapTT(dateStr, loginTime, e, noData, isInferred)` | 로그인 히트맵 셀 툴팁 |
| `showGsTT(event)` | 기어스코어 계산식 툴팁 |
| `showQualBarTT(event)` | 아이템 등급 바 툴팁 |
| `showIAGemTT(gemName, gemEff, e)` | 인챈트 분석 보석 아이콘 hover 툴팁 (효과만 표시, 이름 제외) |
| `showIAEncTT(name, eff, e)` | 인챈트 분석 마법부여 아이콘 hover 툴팁 (효과만 표시, 이름 제외) |
| `moveTT(e)` / `hideTT()` | 툴팁 이동·숨김 |

---

## legal.js — 법적 고지
| 함수 | 설명 |
|------|------|
| `openLegal(type)` | 이용약관/개인정보 모달 오픈 (`type`: 'terms' / 'privacy') |
| `closeLegal()` | 모달 닫기 |
