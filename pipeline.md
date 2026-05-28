# WOW.GG 데이터 파이프라인 설계

## 전체 흐름

```
GCP VM (24시간 상시 가동)
  └── Apache Airflow 스케줄러
        └── DAG (3시간마다 자동 실행)
              ├── Blizzard API 토큰 발급 (24시간 유효, 하루 1회)
              ├── 길드원 ~350명 데이터 수집 (asyncio + aiohttp 비동기)
              ├── characters.json 가공
              └── Firebase 업로드 → 웹 반영
```

---

## 1. GCP VM 세팅

- GCP Compute Engine VM 인스턴스 상시 가동
- 내 PC와 무관하게 독립적으로 동작 (PC 꺼져있어도 정상 실행)
- 필요 설치: Apache Airflow (Docker-compose 또는 직접 설치)
- 환경변수 또는 Airflow Variables에 등록:
  - Blizzard API `client_id` / `client_secret`
  - Firebase 서비스 계정 JSON

---

## 2. Airflow DAG 구성

### 스케줄
```
schedule_interval: "0 */3 * * *"   # 3시간마다 실행
```

### Task 순서
```
[1] get_token
      → OAuth2 client_credentials 방식으로 토큰 발급

[2] collect_guild_roster
      → 길드 멤버 목록 조회 (rank 0~5 필터링)

[3] collect_char_details (~350명, 비동기 병렬)
      → 캐릭터 프로필 + media (avatar)
      → 장비 (equipment)
      → 능력치 (statistics)
      → 외형 (appearance)
      → 특성 (specializations)

[4] load_guild_members / load_equipment / load_appearance
    load_statistics / load_specializations  (병렬 실행)
      → 각 tmp 파일 파싱 후 fact/dim 저장

[5] build_characters_json
      → characters.json 통합 가공

[6] upload_firebase_snapshot
      → Firebase Storage 최신본 + 날짜별 snapshot 업로드
```

---

### characters.json 구조 최적화
- specializations에서 spell 효과 필드 7개 제거 (`spell_name_kr/en`, `spell_desc_kr`, `cast_time_kr`, `power_cost_kr`, `range_kr`, `cooldown_kr`)
- 해당 데이터는 `skill_loadmap/class_skill_tree.json`으로 이전 (spell_id로 조인)
- characters.json 크기: **8.3MB → 5.9MB (28% 절약)**
- wow_dag.py `_parse_specialization_rows`: 8개 필드만 수집 (`character_id`, `character_name`, `spec_group_active`, `spec_name_kr`, `spec_spent_points`, `talent_id`, `spell_id`, `talent_rank`)

### class_skill_tree.json 확장
- 기존 필드에 `spell_desc_kr`, `cast_time_kr`, `power_cost_kr`, `range_kr`, `cooldown_kr` 추가
- 947개 스펠 중 531개 매칭 (579개 탤런트 엔트리 기준)
- data.js에서 characters.json 로드 전 선행 fetch → `SKILLS_MAP` 구성 후 SPEC_DB 빌드 시 조인

### 비동기 DAG 신규 작성 (wow_dag_async.py)
- `ThreadPoolExecutor` 중첩 구조 문제(스레드 생성 오버헤드, GIL 경쟁) 해결
- `asyncio` + `aiohttp` 기반 완전 비동기 수집
- `asyncio.Semaphore(30)` 으로 동시 요청 30개 제한 (~85 req/s)
- 캐릭터당 6개 서브 엔드포인트를 `asyncio.gather`로 동시 fetch
- 예상 수집 시간: 350명 기준 **~35초** (기존 283초 대비 8배 향상)
- dag_id: `wow_guild_firebase_async`, execution_timeout: 10분

---

---

## 7. BigQuery 데이터 마트

### 구성 목표
Firebase Storage의 일별 snapshot 데이터를 BigQuery에 적재하여 분석용 데이터 마트 구축

### GCP 리소스
| 항목 | 값 |
|---|---|
| 프로젝트 ID | `wowak-3edc9` |
| 버킷 | `wowak-3edc9.firebasestorage.app` |
| BigQuery 데이터셋 | `game_snapshots` |
| BigQuery 테이블 | `character_snapshots` |
| 리전 | `asia-northeast3` (서울) |

### 현재 적재 현황 (2026-04-15 기준)
- 적재 기간: `2026-04-01` ~ `2026-04-14` (14일치)
- 총 레코드: 약 13,571개
- 적재 필드 (9개):
  - `character_id` (INTEGER)
  - `character_name` (STRING)
  - `level` (INTEGER)
  - `rank_name` (STRING)
  - `class_name` (STRING)
  - `last_login_timestamp` (INTEGER)
  - `average_item_level` (INTEGER)
  - `snapshot_date` (TIMESTAMP)
  - `stats` (STRING, JSON 직렬화 / 없는 날짜는 NULL)

### 테이블 구성
- 파티션: `snapshot_date` 기준 일별 (`DAY`)
- 클러스터: `class_name`, `rank_name`
- stats NULL 패턴: 04-01 ~ 04-07은 일부만 존재, 04-08부터 거의 전체 적재

### 적재 방식
- Firebase Storage의 `snapshots/YYYY-MM-DD/characters.json` (JSON Array) 파일을
  Python 스크립트로 NDJSON 변환 후 `bq load` 명령어로 적재
- `--noreplace` 옵션으로 기존 데이터에 append

### 데이터 마트 레이어 설계
```
wowak-3edc9
├── game_snapshots/             ← 현재 구축 완료
│   └── character_snapshots     (파티션: snapshot_date, 클러스터: class_name, rank_name)
├── analytics/                  ← 분석 테마별 집계 (예정)
│   ├── daily_class_stats
│   ├── daily_rank_stats
│   ├── character_growth
│   └── weekly_summary
└── mart_equipment/             ← 장비 데이터 마트 (예정)   
    └── equipment_snapshots
```

### 향후 개선 예정
- [ ] Airflow DAG에 BigQuery 자동 적재 Task 추가 (`[7] load_bigquery_snapshot`)
- [ ] `analytics` 데이터셋 구성 및 집계 쿼리 작성

### 비용
- 적재(Load): 무료
- 스토리지: 무료 (10GB 한도 내)
- 쿼리: 사실상 무료 (파티셔닝 적용 시 월 1TB 무료 한도 내)

---

## 8. 요약

| 항목 | 내용 |
|---|---|
| PC 꺼져도 동작? | **YES** — GCP VM이 독립 실행 |
| 자동 수집 주기 | 3시간마다 (Airflow 스케줄) |
| 수집 방식 | asyncio + aiohttp 비동기 (wow_dag_async.py) |
| 예상 수집 시간 | 350명 기준 ~35초 |
| 데이터 업로드 후 웹 반영 | 새로고침 필요 (정적 JSON 기준) |
| API 토큰 부담 | 하루 1회 발급, 사실상 무시 가능 |
| API 호출 한도 초과 여부 | **NO** — Semaphore(30) 제한, ~85 req/s |
| characters.json 원본 크기 | ~18MB (비압축 기준) |
| characters.json 전송 크기 | ~2~3MB (gzip 압축 적용) |
