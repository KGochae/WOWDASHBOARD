# 데이터 구조 요약

---

## 데이터 소스 개요
| 소스 | 위치 | 로드 방식 |
|------|------|-----------|
| 캐릭터 전체 데이터 | Firebase Storage `characters.json` (로컬: `/data/characters.json`) | `loadData()` → fetch, `version.json`으로 캐시버스팅 |
| 아이템 DB | `/data/items_merged.json` | `isLoadData()` → fetch |
| 외형 데이터 | `/data/dim_appearance.json` | `loadData()` → fetch |
| TBC 특성 DB | `/data/tbc_talents.json` | `loadData()` → fetch |
| SOOP 프로필 | `/data/soop.json?v=timestamp` | `loadData()` → fetch |
| 로그인 로그 | Firebase Storage `user_login_log.json` (로컬: `/data/user_login_log.json`) | `loadData()` → fetch |
| TBCA BIS | `/data/tbca_bis_updated.json` | 즉시실행 async (TBCA_P1_LOOKUP 빌드) |
| 레이드 로그 | `/data/raid/*.csv` | `openRaid()` → fetch |
| 공지사항 | `/data/notices.json` | `loadData()` → fetch |
| 스펠 아이콘 | `/data/spell_icons.json` | `getSpellIcon()` → fetch (캐시) |
| 스킬 트리 | `window.CLASS_SKILL_TREE` (JS 전역) | JS 번들 로드 시 |

> `items_classic_tbc.json` 은 더 이상 사용하지 않음. `items_merged.json` 으로 대체됨.

---

## characters.json (Firebase Storage / 로컬 정적 JSON)
캐릭터 1명의 전체 데이터 구조:

```json
{
  "character_id": 123,
  "character_name": "닉네임",
  "level": 70,
  "rank_name": "버튜버",
  "rank_num": 2,
  "class_name": "마법사",
  "class_id": 8,
  "race_id": 1,
  "avatar_img": "url",
  "last_login_timestamp": 1700000000,
  "last_login_timestamp_KST": "2024-01-01 12:34:56",
  "average_item_level": 141,
  "viewer_gender": "male",
  "snapshot_date": "2024-01-01",
  "stats": { ... },
  "equipment": [ ... ],
  "specializations": [ ... ]
}
```

> Firestore 직접 읽기 방식에서 정적 JSON 방식으로 변경됨 (Firestore reads = 0)

---

## 전역 DB 객체

### GUILD_DB
```js
GUILD_DB["닉네임"] = {
  character_id: 123,          // SOOP 프로필 매칭용 (있으면 _soopMapById 우선)
  level: 70,
  rank_name: "버튜버",        // 길드마스터 / 고정멤버 / 버튜버 / 스윗기사단 / 네임드 / 시청자
  rank_num: 2,
  class_name: "마법사",
  class_id: 8,
  last_login_timestamp: 1700000000,
  last_login_timestamp_KST: "2024-01-01 01:28:48",
  snapshot_date: "2024-01-01",
  average_item_level: 141,
  avatar_img: "url"
}
```

### CHAR_DB
```js
CHAR_DB["닉네임"] = {
  name: "닉네임",
  race_id: 1,
  race_name: "인간",
  class_name: "마법사",
  class_id: 8,
  gender_int: 0,          // 0=남 1=여 (dim_appearance 우선)
  viewer_gender: 1,        // 1-gender_int
  gender_label: "남성",
  emoji: "🔥",
  average_item_level: 141,
  appearance: {
    race, gender, skin, face, hairStyle, hairColor, facialStyle
  },
  items: {
    1: { name, q, qkr, did, id, icon, sub, armor, bind, req, ilvl, dur,
         stats, enchant, enchantId, gems, gemNames, gemEffects, gemEffectsRaw,
         socketBonus, setName, setDisplay, setEffects, spell, proc, w, itype },
    // ...
  }
}
```

> **슬롯 중복 주의**: `items[15]`와 `items[16]`은 동일 객체 참조 (BACK 슬롯).
> 합산 집계 시 반드시 `[...new Set(Object.values(cd.items))]` 로 중복 제거할 것.

### SPEC_DB
```js
SPEC_DB["닉네임"] = {
  active: [
    {
      spec: "냉기",
      pts: 51,
      talents: {
        "1001": { rank: 3, spell_id: 12347, base_spell_id: 12345, name: "강화 냉기 화살", desc: "설명..." },
      }
    }
  ],
  secondary: [ ... ]
}
```

### STATS_DB / STATS_DB_V2
```js
STATS_DB["닉네임"] = {
  character_name: "닉네임",
  health: 8000,
  strength_effective: 100,
  agility_effective: 80,
  // ... characters.json stats 필드 그대로
}

STATS_DB_V2["닉네임"] = {
  // STATS_DB 모든 필드 +
  gear_score: 1420,          // GearScoreCalc.lua 기준 계산값
  hit_rating: 120,           // 장비+착용효과+마법부여+젬+소켓보너스 합산
  spell_hit_rating: 96,
  crit_rating: 85,
  spell_crit_rating: 30,
  healing_power: 600,
  spell_dmg: 450,
  attack_power: 1200,        // 서버값 + 전투력 +N 보정
  skill_rating: 44,          // 방어·무기막기·방패막기·회피 등 모든 숙련도 합산
}
```

### LOGIN_LOG_DB
```js
LOGIN_LOG_DB["닉네임"] = {
  "2026-04-07": ["23:45:12"],
  "2026-04-08": ["01:10:00", "09:30:00"],
  // ...
}
```
- `user_login_log.json` 에서 `LOGIN_LOG_DB[row.n] = row.d` 로 직접 할당
- 키는 **실제 로그인 날짜** (snapshot_date 아님)
- 값은 `HH:MM:SS` 문자열 배열
- 오전 9시 미만 로그아웃 시 전날도 로그인으로 추론 (`renderLoginHeatmap`의 `inferredDates`)

### TBCA_P1_LOOKUP
```js
TBCA_P1_LOOKUP["tbcaSpecKey"] = {
  "12345": { tier: "S", rank: 1, item_phase: 1, source_type: "raid", source_ko: "카라잔", source_location: "프린스 말차자" }
}
```
- `tbca_bis_updated.json` 에서 즉시실행 async로 빌드
- 동일 item_id가 여러 슬롯에 있으면 rank 낮은 것(더 좋은 순위)만 유지

### window._soopMap / _soopMapById
```js
window._soopMap["닉네임"] = {
  character_name: "닉네임",
  character_id: 123,
  profile_img: "https://...",
  // soop.json 필드
}
window._soopMapById[123] = { ... }  // character_id 기반 (아바타 매칭 우선)
```

---

## dim_appearance.json
위치: `/data/dim_appearance.json`
3D 외형 상세 데이터 — Firestore 미포함 필드 보완

```json
{
  "character_name": "닉네임",
  "race_id": 1,
  "race_name": "인간",
  "class_id": 8,
  "class_name": "마법사",
  "gender_int": 0,
  "Skin_Color_display_order": 0,
  "Face_display_order": 1,
  "Hair_Style_display_order": 2,
  "Hair_Color_display_order": 0,
  "Facial_Hair_display_order": 0,
  "Markings_display_order": 0
}
```

---

## user_login_log.json
위치: Firebase Storage (로컬: `/data/user_login_log.json`)
형식: 캐릭터 중심 배열 (2026-05-06 구조 변경)

```json
[
  {
    "n": "닉네임",
    "r": "버튜버",
    "c": "마법사",
    "id": 123,
    "d": {
      "2026-04-07": ["23:45:12"],
      "2026-04-08": ["01:10:00", "09:30:00"]
    }
  }
]
```
- `d`의 키: 실제 로그인 날짜 (`last_login_timestamp_KST` 앞 10자), snapshot_date 아님
- `d`의 값: `HH:MM:SS` 문자열 배열
- DAG(`wow_login_log_dag.py`)에서 생성, gzip 압축 업로드
- `loadData()`에서 `LOGIN_LOG_DB[row.n] = row.d` 로 직접 할당

⚠️ snapshot_date를 키로 쓰면 과거 로그인이 모든 스냅샷 날짜에 중복 기록되어 히트맵 전체 셀이 활성화되는 버그 발생

---

## tbc_talents.json
위치: `/data/tbc_talents.json`
전체 TBC 특성 데이터 소스

```json
{
  "classes": [
    {
      "slug": "mage",
      "trees": [
        { "id": 41, "name": "Frost" }
      ]
    }
  ],
  "talentsByClass": {
    "mage": [
      {
        "id": 1001,
        "treeId": 41,
        "maxRank": 5,
        "row": 0, "col": 1,
        "icon": "spell_frost_frostbolt02",
        "ranks": [
          { "rank": 1, "spellId": 12345, "name": "강화 냉기 화살", "description": "설명..." }
        ]
      }
    ]
  }
}
```

**loadData에서 파생되는 전역 객체**
| 전역 | 설명 |
|------|------|
| `TBC_TALENT_BY_ID[id]` | talent 전체 객체 |
| `TBC_TREE_MAP[treeId]` | 트리별 talent 배열 |
| `TBC_CLASS_TREES[slug][krSpecName]` | 직업+특성 한글명 → treeId |
| `TBC_TREE_EN_NAME[treeId]` | treeId → 영문 특성명 |
| `TALENT_MAX_FROM_TREE[id]` | talent id → maxRank |
| `LOADMAP_SPELL_TO_TID[spellId]` | spellId → talent_id |

---

## tbca_bis_updated.json
위치: `/data/tbca_bis_updated.json`
TBCA BIS 아이템 목록 (Phase 1 기준)

```json
{
  "tbcaSpecKey": {
    "slots": [
      {
        "slot": "HEAD",
        "p1": [
          {
            "item_id": 29012,
            "tier": "S",
            "rank": 1,
            "item_phase": 1,
            "source": {
              "source_type": "raid",
              "source_ko": "카라잔",
              "source_location": "프린스 말차자"
            }
          }
        ]
      }
    ]
  }
}
```

---

## atlasloot_bis.json
위치: `data/atlasloot_bis.json`. `parse_atlasloot_bis.py`로 생성.

### 구조
```
{
  "phase0": { spec_key: { name_en, name_kr, class_en, spec_en, phase, slots: { slot: { name_kr, items: [{rank, item_id, sources:[...]}] } } } },
  "phase1": { ... },
  "phase2": { ... },
  "_sources": { "item_id": [ source_obj, ... ] }   ← 던전/레이드 전체 드랍 역색인
}
```

### source 객체 구조
```json
{
  "instance_key": "Karazhan",
  "instance_en": "Karazhan",
  "instance_kr": "카라잔",
  "type": "raid",         // "dungeon" | "raid" | "world"
  "version": "tbc",       // "classic" | "tbc"
  "boss_en": "Nightbane",
  "boss_kr": "나이트베인"
}
```

---

## items_merged.json
아이템 배열 (3,736개). `isLoadData()`에서 로드.

### 전체 필드 구조
```json
{
  "item_id": 29011,
  "name": "전쟁의 인도자 철갑투구",
  "quality": "영웅",
  "item_level": 120,
  "required_level": 70,
  "required_classes": "전사",
  "inventory_type": "머리",
  "inventory_type_id": "HEAD",
  "item_class": "방어구",
  "item_subclass": "판금",
  "binding": "획득 시 귀속",
  "armor": 1227,
  "stats": { "힘": 15, "민첩성": 17, "체력": 53 },
  "equip_bonus": [ "착용 효과: ..." ],
  "weapon": null,
  "set_id": 654,
  "set_name": "세트명",
  "set_items": [ { "id": 29012, "name": "..." } ],
  "set_effects": [ "(2) 세트 효과: ..." ],
  "sockets": ["얼개", "노란색"],
  "socket_bonus": "보석 장착 보너스: ...",
  "sell_price": 15875,
  "is_equippable": true,
  "sources": [
    {
      "encounter_id": 18478,
      "encounter_name": "라그나로스",
      "instance_id": 3790,
      "instance_name": "화산 심장부",
      "expansion": "클래식",
      "category": "RAID",
      "image_url": "..."
    }
  ],
  "icon": "inv_helmet_58"
}
```

### quality 값
`하급 / 일반 / 고급 / 희귀 / 영웅 / 전설 / 유물`

### inventory_type 정규화 값
`머리 / 목 / 어깨 / 등 / 가슴 / 손목 / 손 / 허리 / 다리 / 발 / 손가락 / 장신구 / 한손 장비 / 양손 장비 / 보조장비 / 원거리 장비`

---

## Wowhead XML API
프록시: `https://wow-proxy.wowak.workers.dev/wowhead-xml/{version}/{item_id}`
- `version`: `classic` | `tbc`

---

## 레이드 CSV 파일 (`/data/raid/`)
| 파일 | 내용 |
|------|------|
| `MoltenCore_DPS_time.csv` | 시간대별 DPS 로그 (SVG 차트용) |
| `MoltenCore_입힌피해.csv` | 개인별 가한 데미지 |
| `MoltenCore_받은피해.csv` | 개인별 막은 피해 |
| `MoltenCore_치유.csv` | 개인별 치유량 |
| `MoltenCore_dispels_clean.csv` | 개인별 저주 해제 수 |
| `MoltenCore_death.csv` | 사망 기록 |

---

## notices.json
```json
[
  {
    "id": "notice-1",
    "title": "공지 제목",
    "date": "2024-01-01",
    "content": "마크다운 텍스트"
  }
]
```

---

## 스킬 트리 데이터 (`window.CLASS_SKILL_TREE`)
`/skill_loadmap/` 폴더의 JS 파일에서 전역 등록.

```js
CLASS_SKILL_TREE = {
  "mage": {
    "Frost": [
      { spellId, spell_name_kr, spell_name_en, spell_desc_kr, cast_time_kr, cooldown_kr, row, col, allSpellIds }
    ]
  }
}

LOADMAP_SPELL_TO_TID = {
  "12345": "1001"   // spellId → talent_id
}
```

---

## 주요 데이터 흐름
```
Firebase Storage (characters.json) → loadData()
  → GUILD_DB  (기본 정보, character_id 포함)
  → SPEC_DB   (특성)
  → STATS_DB  (스탯)
  → CHAR_DB   (장비)
  → STATS_DB_V2 (파생 스탯: gear_score, hit_rating, healing_power 등)

user_login_log.json → loadData()
  → LOGIN_LOG_DB (날짜별 로그인 기록)

tbc_talents.json → loadData()
  → TBC_TALENT_BY_ID, TBC_TREE_MAP, TBC_CLASS_TREES 등

soop.json → loadData()
  → _soopMap, _soopMapById (아바타 프로필 매칭)

tbca_bis_updated.json → 즉시실행 async
  → TBCA_P1_LOOKUP

items_merged.json → isLoadData()
  → _itbcData (3,736개 아이템 배열)

CLASS_SKILL_TREE (JS 번들)
  + SPEC_DB
  → renderSkillStats() (히트맵)
  → renderSkillDataframe() (분포표)
```
