# 절대규칙
- 항상 수정하기전에 백업을 할것
- TASK 를 함부로 실행하지말고, 허락을 받을 것

# WEB_PROJECT 작업 요약



## 현재 아키텍처

| 역할 | 서비스 |
|---|---|
| 웹사이트 파일 서버 (HTML/JSON/이미지) | Firebase Hosting |
| 길드원 데이터 파일 (characters.json) | Firebase Hosting |
| 3D 캐릭터 모델 프록시 + 캐싱 | Cloudflare Worker + R2 |
| Firestore | 현재 쓰기만 발생 (제거 검토 중) |

---

## Firebase Firestore 읽기 할당량 초과 문제

### 원인
1. **`check_firestore.py` 18번째 줄**: `len(db.collection('characters').get())` → 실행마다 ~981 reads 전체 소비
2. **프론트엔드 캐시**: `sessionStorage` 사용 → 탭/세션마다 초기화되어 매번 Firestore 전체 읽기 발생

### 시도한 방법들 (실패)
- `sessionStorage` → `localStorage` 전환: 데이터 4.55MB로 localStorage 5MB 한도 초과, 저장 실패
- 구버전 캐시 키(`wowgg_chars_v3`) 정리: 저장 자체가 불가능해 근본 해결 안 됨

---

## 최종 해결: 정적 JSON 파일 방식 (Firestore reads = 0)

### 구조
```
data/*.json 4개 파일
    ↓ migrate_to_firestore.py 실행
data/characters.json 생성 (4.55MB, 981개 캐릭터)
    ↓ firebase deploy
Firebase Hosting 서버에 업로드
    ↓ 유저 접속
fetch('/data/characters.json') → Firestore 전혀 안 거침
```

### 변경 내용

#### `index.html`
- Firebase SDK 스크립트 태그 제거
- Firestore 호출 전체 제거
```javascript
// 전: db.collection('characters').get() → ~981 reads
// 후: fetch('/data/characters.json')    → reads = 0
```

#### `migrate_to_firestore.py`
- 실행 시 `data/characters.json` 자동 생성

#### `check_firestore.py`
```python
# 전: len(db.collection('characters').get())  → ~981 reads
# 후: db.collection('characters').count().get()[0][0].value → 1 read
```

### 데이터 갱신 방법 (앞으로)
```cmd
cd C:\Users\고채석\OneDrive\Desktop\AI\WEB_PROJECT
python migrate_to_firestore.py
firebase deploy --only hosting
```

---

## Firebase Hosting 사용량 영향

| 항목 | 변경 전 | 변경 후 |
|---|---|---|
| Firestore 읽기 | 방문마다 ~981 reads | **0 reads** |
| Hosting 저장용량 | 397.3MB | 401.9MB (+4.55MB) |
| Hosting 다운로드 | 적음 | 첫 방문 시 +4.55MB (재방문은 브라우저 캐시) |
| Firestore 쓰기 | migrate 실행 시 발생 | migrate 실행 시 발생 (제거 검토 중) |

---

## 남은 과제

- `migrate_to_firestore.py`에서 Firestore 업로드 코드 제거 검토
  - Firestore를 다른 용도(모바일 앱, 관리자 페이지 등)로 쓸 계획 없으면 제거해도 무방
  - 제거 시 쓰기 할당량도 0으로 절약 가능


## Console 스크래핑 코드 모음 (2026-04-01)

### 공통 패턴 — JSON 파일 다운로드

스크래핑 결과를 JSON으로 저장하는 공통 코드. `result` 변수는 반드시 **같은 IIFE 스코프** 안에서 정의해야 함.
콘솔에서 별도로 실행하면 `ReferenceError: result is not defined` 발생.

```javascript
const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
const a = document.createElement('a');
a.href = URL.createObjectURL(blob);
a.download = 'output.json';
a.click();
```

---

### 1. Wowhead TBC 탤런트 계산기 — 직업별 스킬 데이터

**대상 URL:** `https://www.wowhead.com/tbc/talent-calc/{class}`
**출력 파일:** `{class}_talents.json`

```javascript
(() => {
  const result = {};

  document.querySelectorAll('.ctc-tree-box').forEach(box => {
    // 스펙명은 같은 박스 내 .ctc-tree-header
    const specName = box.querySelector('.ctc-tree-header')?.textContent?.trim() || 'unknown';
    const talents = [];

    box.querySelectorAll('[data-row]').forEach(cell => {
      const row = cell.getAttribute('data-row');
      const col = cell.getAttribute('data-col');
      const link = cell.querySelector('a[href*="/spell="]');
      if (!link) return;
      const match = link.getAttribute('href').match(/\/spell=(\d+)\/([^/?#]+)/);
      if (!match) return;
      talents.push({
        spellId: match[1],
        row,
        col,
        spell_name_en: match[2].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      });
    });

    result[specName] = talents;
  });

  console.log('스펙 목록:', Object.keys(result)); // ["Balance", "Feral Combat", "Restoration"]

  const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'druid_talents.json'; // 직업마다 파일명 변경
  a.click();
  return result;
})();
```

**핵심 선택자:**
- `.ctc-tree-box` — 스펙 단위 컨테이너
- `.ctc-tree-header` — 스펙 이름 텍스트 (Balance / Feral Combat / Restoration)
- `[data-row]`, `[data-col]` — 탤런트 셀 위치
- `a[href*="/spell="]` — spell ID + 영문 이름 추출 (`/spell=16814/starlight-wrath` 형식)

---

### 2. Warcraft Logs — 해제(Dispel) 탭 데이터

**대상:** Warcraft Logs 레이드 로그 → 해제 탭
**출력 파일:** `dispels_data.json`

```javascript
(() => {
  const result = [];

  document.querySelectorAll('.dialog-block').forEach(block => {
    const title = block.querySelector('.dialog-title')?.textContent?.trim() || '';

    // Dispelled % 파싱
    const dispelInfo = [...block.querySelectorAll('*')]
      .find(el => el.textContent?.includes('Dispelled:'))?.textContent?.trim() || '';

    const headers = [...block.querySelectorAll('thead th, thead td')]
      .map(c => c.textContent.trim());
    const rows = [...block.querySelectorAll('tbody tr')]
      .map(tr => [...tr.querySelectorAll('td')].map(c => c.textContent.trim()));

    if (title || rows.length) result.push({ title, dispelInfo, headers, rows });
  });

  console.log(JSON.stringify(result, null, 2));

  const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'dispels_data.json';
  a.click();
  return result;
})();
```

**출력 구조:**
```json
[
  {
    "title": "게헨나스의 저주",
    "dispelInfo": "Dispelled: 82.1% (32) ...",
    "headers": ["Name", "Count", "% of Casts"],
    "rows": [["냘친", "11", "..."], ...]
  }
]
```

---

### 3. Warcraft Logs — Highcharts 그래프 데이터

**대상:** Warcraft Logs 레이드 로그 → 가한 피해 / 치유량 등 그래프 탭
**출력 파일:** `highcharts_data.json`

```javascript
// 사전 확인: Highcharts 객체 존재 여부
typeof Highcharts  // "object" 이면 사용 가능

(() => {
  const charts = Highcharts.charts.filter(Boolean);
  const result = charts.map((chart, i) => ({
    chart_index: i,
    title: chart.title?.textStr || '',
    series: chart.series.map(s => ({
      name: s.name,
      data: s.data.map(p => ({
        x: p.x,        // 시간 (밀리초, 전투 시작 기준)
        y: p.y,        // 값 (DPS / HPS 등)
        name: p.name || null,
      }))
    }))
  }));

  console.log(JSON.stringify(result, null, 2));

  const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'highcharts_data.json';
  a.click();
  return result;
})();
```

**출력 구조:**
```json
[{
  "chart_index": 0,
  "title": "",
  "series": [{
    "name": "Total",
    "data": [
      { "x": 0, "y": 0, "name": null },
      { "x": 57397.57, "y": 451.6, "name": null }
    ]
  }]
}]
```

**후처리 (Python) — Total 시리즈만 추출 → CSV:**

```python
import json, csv

with open('highcharts_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

results = []
for chart in data:
    for series in chart['series']:
        if series['name'] == 'Total':
            for pt in series['data']:
                ms = pt['x']
                total_sec = int(ms / 1000)
                m, s = total_sec // 60, total_sec % 60
                results.append({
                    'time_ms': ms,
                    'time_str': f'{m:02d}:{s:02d}',
                    'total': pt['y']
                })

with open('highcharts_total.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=['time_ms', 'time_str', 'total'])
    writer.writeheader()
    writer.writerows(results)
```

출력: `time_ms`, `time_str` (MM:SS), `total` 3컬럼 CSV








