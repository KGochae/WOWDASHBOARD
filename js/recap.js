// recap.js — WAKTAVERSE WOW RECAP  (epilogue 단독 페이지)

// ── 3D MODEL DATA ─────────────────────────────────────────────
const _RC_DATES  = ['2026-04-08','2026-04-26','2026-05-10','2026-05-26'];
const _RC_LABELS = ['2026. 04. 08','2026. 04. 26','2026. 05. 10','2026. 05. 26'];
const _RC_SUFFIX = {'2026-04-08':'260408','2026-04-26':'260426','2026-05-10':'260510','2026-05-26':'260526'};

const _rcDateCache = {};
const _rcViewers   = [null, null, null, null];
let   _rcCurrentName = null;
let   _rcLoadedCount = 0;

function _rcOnModelResult() {
  _rcLoadedCount++;
  const pct = Math.round(_rcLoadedCount / _RC_DATES.length * 100);
  const bar = document.getElementById('rc-loading-bar');
  if (bar) bar.style.width = pct + '%';
  if (_rcLoadedCount >= _RC_DATES.length) {
    setTimeout(() => {
      const wrap = document.getElementById('rc-loading-bar-wrap');
      if (wrap) { wrap.style.opacity = '0'; setTimeout(() => { wrap.style.display = 'none'; }, 500); }
      const recapArea = document.getElementById('recap-main-area');
      if (recapArea) recapArea.style.overflowY = 'auto';
    }, 400);
  }
}

// ── DATA FETCH ────────────────────────────────────────────────

async function _rcFetchDate(date) {
  const suffix = _RC_SUFFIX[date];
  if (_rcDateCache[suffix]) return _rcDateCache[suffix];
  const raw = await fetch(`/recap_data/recap_${suffix}.json`).then(r => r.json());
  const byName = {}, byId = {};
  raw.forEach(e => {
    if (e.n) byName[e.n] = e;
    if (e.id) byId[e.id] = e;
  });
  _rcDateCache[suffix] = { byName, byId };
  return _rcDateCache[suffix];
}

// ── WEBGL CLEANUP ─────────────────────────────────────────────

function _rcCleanAll() {
  _rcViewers.forEach((v, i) => {
    if (v) { try { v.setAnimPaused?.(true); } catch(e) {} }
    const wrap = document.getElementById(`rc-model-3d-${i}`);
    if (wrap) {
      const c = wrap.querySelector('canvas');
      if (c) {
        try {
          const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
          gl?.getExtension('WEBGL_lose_context')?.loseContext();
        } catch(e) {}
      }
      wrap.innerHTML = '';
    }
  });
  _rcViewers.fill(null);
}

// ── 단일 날짜 모델 렌더 ────────────────────────────────────────

async function _rcRenderOne(name, date, idx) {
  const overlay = document.getElementById(`rc-overlay-${idx}`);
  const msg     = document.getElementById(`rc-msg-${idx}`);
  const wrapId  = `rc-model-3d-${idx}`;

  if (overlay) { overlay.style.display = 'flex'; overlay.innerHTML = '<div class="spin"></div>'; }
  if (msg) msg.textContent = '';

  let data;
  try { data = await _rcFetchDate(date); }
  catch(e) {
    if (overlay) overlay.style.display = 'none';
    if (msg) msg.textContent = '로딩 실패';
    _rcOnModelResult(); return;
  }

  const entry = data.byName[name];
  if (!entry || !entry.ap || !entry.eq?.length) {
    if (overlay) overlay.style.display = 'none';
    if (msg) msg.textContent = '해당 날짜에 데이터가 없는 유저입니다';
    _rcOnModelResult(); return;
  }

  const [race, gender, skin, face, hairStyle, hairColor, facialStyle] = entry.ap;
  const items = entry.eq.map(p => [...p]);

  if (!FDID_MAP[`${race}_${gender}`]) {
    if (overlay) overlay.style.display = 'none';
    if (msg) msg.textContent = '지원하지 않는 종족';
    _rcOnModelResult(); return;
  }

  const chestItem = items.find(([s]) => s === 5);
  const resolveChest = async () => {
    if (!chestItem || !window.PROXY_HOST) return;
    const did = chestItem[1];
    if (_CHEST_SLOT_CACHE[did] !== undefined) { chestItem[0] = _CHEST_SLOT_CACHE[did]; return; }
    try {
      const r = await fetch(`${window.PROXY_HOST}/modelviewer/tbc/meta/armor/5/${did}.json`, { method: 'HEAD', signal: AbortSignal.timeout(1500) });
      _CHEST_SLOT_CACHE[did] = r.ok ? 5 : 20;
      _saveChestSlotCache();
      if (!r.ok) chestItem[0] = 20;
    } catch(e) { chestItem[0] = 20; }
  };

  try {
    await Promise.all([
      waitFor(() => typeof window.generateModels === 'function', 10000, '뷰어 타임아웃'),
      resolveChest(),
    ]);
  } catch(e) {
    if (overlay) overlay.style.display = 'none';
    if (msg) msg.textContent = '뷰어 로딩 실패';
    _rcOnModelResult(); return;
  }

  const wrap   = document.getElementById(wrapId);
  const wr     = wrap?.getBoundingClientRect();
  const aspect = (wr && wr.height > 0) ? wr.width / wr.height : 0.55;
  const ap     = { race, gender, skin, face, hairStyle, hairColor, facialStyle, items };

  const _stretch = () => {
    const c = wrap?.querySelector('canvas');
    const d = wrap?.querySelector('div[style]');
    if (c) { c.style.width = '100%'; c.style.height = '100%'; c.style.display = 'block'; }
    if (d) { d.style.width = '100%'; d.style.height = '100%'; }
  };
  const _anim = v => setTimeout(() => {
    try { v?.renderer?.actors?.[0]?.setAnimation?.('Stand'); } catch(e) {}
  }, 2000);

  try {
    const viewer = await window.generateModels(aspect, `#${wrapId}`, ap, 'classic');
    _rcViewers[idx] = viewer;
    _stretch();
    if (overlay) overlay.style.display = 'none';
    _anim(viewer);
    _rcOnModelResult();
  } catch(e) {
    try {
      const viewer = await window.generateModels(aspect, `#${wrapId}`,
        { race, gender, items, noCharCustomization: true }, 'classic');
      _rcViewers[idx] = viewer;
      _stretch();
      if (overlay) overlay.style.display = 'none';
      _anim(viewer);
      _rcOnModelResult();
    } catch(e2) {
      if (overlay) overlay.style.display = 'none';
      if (msg) msg.textContent = '모델 로딩 실패';
      _rcOnModelResult();
    }
  }
}

// ── ITEM HISTORY ─────────────────────────────────────────────

const _RC_CLASS_COLOR = {
  '전사':'#c69b3a','성기사':'#f48cba','사냥꾼':'#aad372','도적':'#fff468',
  '사제':'#c2d6e8','주술사':'#0070de','마법사':'#69ccf0','흑마법사':'#9482c9','드루이드':'#ff7c0a',
};

const _RC_Q_COLOR = {
  '전설':'#ff8000','영웅급':'#a335ee','희귀':'#0070dd',
  '고급':'#1eff00','일반':'#9d9d9d','하급':'#9d9d9d',
};

let _rcItemsDB     = null;
let _rcUniqueItems = null;

async function _rcLoadItemsDB() {
  if (_rcItemsDB) return _rcItemsDB;
  _rcItemsDB = await fetch('/recap_data/item_meta.json').then(r => r.json());
  return _rcItemsDB;
}

async function _rcLoadUniqueItems() {
  if (_rcUniqueItems) return _rcUniqueItems;
  const raw = await fetch('/recap_data/character_unique_items.json').then(r => r.json());
  _rcUniqueItems = {};
  raw.forEach(entry => { if (entry.n) _rcUniqueItems[entry.n] = entry; });
  return _rcUniqueItems;
}

async function _rcRenderItems(name) {
  const area = document.getElementById('rc-items-area');
  if (!area) return;
  area.classList.remove('rc-section-visible', 'rc-phase2');
  area.style.display = 'none';

  let itemsDB, uniqueItems;
  try {
    [itemsDB, uniqueItems] = await Promise.all([_rcLoadItemsDB(), _rcLoadUniqueItems()]);
  } catch(e) { return; }

  const entry = uniqueItems[name];
  if (!entry || !entry.items?.length) return;

  const groups = {};
  for (const iid of entry.items) {
    const item = itemsDB[String(iid)];
    if (!item || (item.cat !== 'RAID' && item.cat !== 'DUNGEON')) continue;
    const key = item.src || '기타';
    if (!groups[key]) groups[key] = { image_url: item.img || null, cat: item.cat || '', items: [] };
    groups[key].items.push(item);
  }
  if (!Object.keys(groups).length) return;

  const rows = Object.entries(groups).map(([inst, g]) => {
    const bgStyle = g.image_url ? `background-image:url('${g.image_url}')` : '';
    const icons = g.items.map((item, i) => {
      const color   = _RC_Q_COLOR[item.q] || '#9d9d9d';
      const iconSrc = item.ic ? `${WH_ICON}/${item.ic}.jpg` : `${WH_ICON}/inv_misc_questionmark.jpg`;
      const delay   = Math.min(i * 0.035, 1.4).toFixed(2);
      return `<div class="rc-item-icon" style="--qi:${color};--id:${delay}s" title="${item.n || iid}">` +
             `<img src="${iconSrc}" alt="" loading="lazy"></div>`;
    }).join('');
    return `<div class="rc-source-row">
      <div class="rc-source-bg" style="${bgStyle}"></div>
      <div class="rc-source-overlay"></div>
      <div class="rc-source-info">
        <div class="rc-source-name">${inst}</div>
        <div class="rc-source-count">${g.items.length}개 획득</div>
      </div>
      <div class="rc-source-items">${icons}</div>
    </div>`;
  }).join('');

  const raidDungeonCount = Object.values(groups).reduce((s, g) => s + g.items.length, 0);
  const gsChartHTML = _rcBuildGsChartOnly(name);

  area.innerHTML = `
    <div class="rc-items-intro">
      <div>
        <div class="rc-items-date-range" style="text-align:center">4월 26일 — 5월 26일 - 장착된 아이템 기준</div>
        <div class="rc-items-sentence-text">던전/레이드 아이템 총<br><span class="rc-items-count">${raidDungeonCount}</span>개를<br>획득했어요.</div>
      </div>
    </div>
    <div class="rc-items-left">
      <div class="rc-items-summary">
        <div class="rc-items-date-range">4월 26일 — 5월 26일 - 장착된 아이템 기준</div>
        <div class="rc-items-summary-row">던전/레이드 아이템 총 <span class="rc-items-count-inline">${raidDungeonCount}</span>개를 획득했어요.</div>
      </div>
      ${gsChartHTML ? `<div class="rc-gs-chart-area"><div class="rc-gs-chart-label">기어스코어 변화</div>${gsChartHTML}</div>` : ''}
    </div>
    <div class="rc-items-right">${rows}</div>`;
  area.style.display = 'flex';

  const ioSection = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('rc-section-visible');
        const countEl = e.target.querySelector('.rc-items-intro .rc-items-count');
        if (countEl) _rcAnimateCount(countEl, raidDungeonCount);

        // 인트로가 끝날 때까지 다음 챕터로 스크롤 불가
        const recapArea = document.getElementById('recap-main-area');
        if (recapArea) recapArea.style.overflowY = 'hidden';

        setTimeout(() => {
          e.target.classList.add('rc-phase2');
          const gsLine = area.querySelector('.rc-gs-line');
          if (gsLine) {
            const len = gsLine.getTotalLength();
            gsLine.style.strokeDasharray = len;
            gsLine.style.strokeDashoffset = len;
          }
          requestAnimationFrame(() => {
            const gsArea = area.querySelector('.rc-gs-chart-area');
            if (gsArea) gsArea.classList.add('rc-chart-anim');
          });
          setTimeout(() => {
            const io = new IntersectionObserver(entries2 => {
              entries2.forEach(e2 => {
                if (e2.isIntersecting) { e2.target.classList.add('rc-visible'); io.unobserve(e2.target); }
              });
            }, { threshold: 0.1 });
            area.querySelectorAll('.rc-source-row').forEach(row => io.observe(row));
          }, 700);

          // phase2 시작 — 스크롤 해제 + Chapter 3 snap section 등록
          if (recapArea) recapArea.style.overflowY = 'auto';
          document.getElementById('rc-page-wrap')?.classList.add('rc-chapter3-ready');
        }, 2600);
        ioSection.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });
  ioSection.observe(area);
}

// ── GS CHART ONLY ─────────────────────────────────────────────

function _rcBuildGsChartOnly(name) {
  const raw = window.GS_LOG_RAW?.[name];
  if (!raw) return '';

  const filtered = Object.fromEntries(
    Object.entries(raw).filter(([date]) => date >= '2026-04-26' && date <= '2026-05-26')
  );
  if (!Object.keys(filtered).length) return '';

  const specCount = {};
  Object.values(filtered).forEach(sm => {
    Object.keys(sm).forEach(s => { if (sm[s]?.gs > 0) specCount[s] = (specCount[s] || 0) + 1; });
  });
  const spec = Object.entries(specCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  const col = (window.CLASS_COLOR?.[window.CLASS_NAME_TO_ID?.[window.GUILD_DB?.[name]?.class_name || ''] || '']) || '#c98df5';

  const daily = Object.entries(filtered)
    .map(([date, sm]) => ({ date, gs: spec ? (sm[spec]?.gs || 0) : (Object.values(sm)[0]?.gs || 0) }))
    .filter(p => p.gs > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (daily.length < 2) return '';

  const weekMap = {};
  daily.forEach(({ date, gs }) => {
    const d = new Date(date + 'T00:00:00'); const day = d.getDay();
    const sun = new Date(d); sun.setDate(d.getDate() - day);
    const wk = `${sun.getFullYear()}-${String(sun.getMonth()+1).padStart(2,'0')}-${String(sun.getDate()).padStart(2,'0')}`;
    if (!weekMap[wk] || date > weekMap[wk].date) weekMap[wk] = { date, gs, wk };
  });

  const pts = Object.values(weekMap).sort((a, b) => a.wk.localeCompare(b.wk));
  if (pts.length < 2) return '';

  const VW = 400, VH = 130, pL = 10, pR = 10, pT = 30, pB = 14;
  const cW = VW - pL - pR, cH = VH - pT - pB;
  const gsMin = Math.min(...pts.map(p => p.gs));
  const gsMax = Math.max(...pts.map(p => p.gs));
  const rng = Math.max(gsMax - gsMin, 50);
  const n = pts.length;
  const xOf = i => pL + i / (n - 1) * cW;
  const yOf = v => pT + cH - (v - gsMin) / rng * cH;
  const coords = pts.map((p, i) => [xOf(i), yOf(p.gs)]);

  const t = 0.18;
  let linePath = `M${coords[0][0].toFixed(1)},${coords[0][1].toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const prev = i > 0 ? coords[i-1] : coords[i];
    const cur = coords[i], next = coords[i+1];
    const nxt2 = i < n - 2 ? coords[i+2] : next;
    linePath += ` C${(cur[0]+(next[0]-prev[0])*t).toFixed(1)},${(cur[1]+(next[1]-prev[1])*t).toFixed(1)} ${(next[0]-(nxt2[0]-cur[0])*t).toFixed(1)},${(next[1]-(nxt2[1]-cur[1])*t).toFixed(1)} ${next[0].toFixed(1)},${next[1].toFixed(1)}`;
  }
  const areaPath = linePath + ` L${coords[n-1][0].toFixed(1)},${(pT+cH).toFixed(1)} L${coords[0][0].toFixed(1)},${(pT+cH).toFixed(1)} Z`;
  const gid = 'rcg' + name.replace(/[^a-zA-Z0-9]/g, '');

  const grids = [0, 0.5, 1].map(v => {
    const y = (pT + (1 - v) * cH).toFixed(1);
    return `<line x1="${pL}" y1="${y}" x2="${VW-pR}" y2="${y}" stroke="rgba(255,255,255,.05)" stroke-width="1"/>`;
  }).join('');

  const dots = pts.map((p, i) => {
    const xl = (coords[i][0] / VW * 100).toFixed(2);
    const yt = (coords[i][1] / VH * 100).toFixed(2);
    const delay = (i * 0.12 + 0.9).toFixed(2);
    const isLast = i === n - 1;
    const sz = isLast ? 9 : 7;
    const d = new Date((isLast ? p.date : p.wk) + 'T00:00:00');
    const lbl = `${d.getMonth()+1}/${d.getDate()}`;
    const tipGs = p.gs.toLocaleString();
    return `<div class="rc-gs-dot" style="position:absolute;left:${xl}%;top:${yt}%;transform:translate(-50%,-50%);transition-delay:${delay}s;z-index:2;padding:6px;cursor:pointer;"
      onmouseenter="window._gsItemChartCol='${col}';_gsItemTT(event,'${lbl}','${tipGs}')" onmouseleave="hideTT()">
      <div style="position:absolute;bottom:calc(100% + 4px);left:50%;transform:translateX(-50%);white-space:nowrap;font-size:10px;font-weight:${isLast?'700':'500'};color:${isLast?col:'rgba(255,255,255,0.75)'};">${p.gs.toLocaleString()}</div>
      <div style="width:${sz}px;height:${sz}px;border-radius:50%;background:${isLast?col:'var(--bg3)'};border:2px solid ${col};pointer-events:none;"></div>
    </div>`;
  }).join('');

  const specLabel = spec ? `<div style="position:absolute;bottom:4px;right:4px;display:flex;align-items:center;gap:3px;z-index:3;pointer-events:none;"><div style="width:5px;height:5px;border-radius:50%;background:${col};flex-shrink:0;"></div><span style="font-size:13px;font-weight:600;color:var(--text2);">${spec}</span></div>` : '';

  return `<div style="position:relative;width:100%;height:100%;">
    ${specLabel}
    <svg width="100%" height="100%" viewBox="0 0 ${VW} ${VH}" preserveAspectRatio="none" style="position:absolute;inset:0;display:block;overflow:visible;">
      <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${col}" stop-opacity=".22"/>
        <stop offset="100%" stop-color="${col}" stop-opacity="0"/>
      </linearGradient></defs>
      ${grids}
      <path d="${areaPath}" fill="url(#${gid})"/>
      <path class="rc-gs-line" d="${linePath}" fill="none" stroke="${col}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" opacity=".9"/>
    </svg>
    ${dots}
  </div>`;
}

// ── GS INSET (left column 내 GS 차트 HTML 생성) ───────────────

function _rcBuildGsInsetHTML(name) {
  const raw = window.GS_LOG_RAW?.[name];
  if (!raw) return '';

  const specDb = window.SPEC_DB?.[name];
  const activeSpec = specDb?.active?.reduce((b, s) => s.pts > b.pts ? s : b, {pts:0,spec:''})?.spec || '';
  const spec = activeSpec || Object.keys(Object.values(raw)[0] || {})[0] || '';

  const daily = Object.entries(raw)
    .map(([date, sm]) => ({
      date,
      gs: (spec && sm[spec]?.gs) || Object.values(sm)[0]?.gs || 0
    }))
    .filter(p => p.gs > 0)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (daily.length < 2) return '';

  const weekMap = {};
  daily.forEach(({date, gs}) => {
    const d = new Date(date + 'T00:00:00');
    const day = d.getDay();
    const mon = new Date(d);
    mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    const wk = mon.toISOString().slice(0, 10);
    if (!weekMap[wk] || date > weekMap[wk].date) weekMap[wk] = {date, gs, wk};
  });

  const pts = Object.values(weekMap).sort((a, b) => a.wk.localeCompare(b.wk));
  if (pts.length < 2) return '';

  const first = pts[0];
  const last  = pts[pts.length - 1];
  const delta = last.gs - first.gs;
  const deltaStr = (delta >= 0 ? '+' : '') + delta.toLocaleString();
  const col = (window.CLASS_COLOR?.[window.CLASS_NAME_TO_ID?.[window.GUILD_DB?.[name]?.class_name || ''] || '']) || '#c98df5';

  const chartHTML = typeof _buildGsItemChartHTML === 'function'
    ? _buildGsItemChartHTML(name, spec, col)
    : '';

  return `<div class="rc-gs-inset-hd">
      <span class="rc-gs-inset-label">기어스코어 성장</span>
      <span class="rc-gs-inset-delta" style="color:${delta >= 0 ? '#80e865' : '#e06060'}">${deltaStr}</span>
    </div>
    <div class="rc-gs-inset-vals">
      <span class="rc-gs-inset-from">${first.gs.toLocaleString()}</span>
      <span class="rc-gs-inset-arrow">→</span>
      <span class="rc-gs-inset-to" style="color:${col}">${last.gs.toLocaleString()}</span>
    </div>
    ${chartHTML}`;
}

// ── LOGIN HEATMAP (Chapter 3) ─────────────────────────────────

function _rcBuildLoginHeatmap(loginDates, inferredDates, firstDate, endDate, col) {
  const start = new Date(firstDate + 'T00:00:00');
  const end   = new Date(endDate   + 'T00:00:00');

  const gs = new Date(start); gs.setDate(start.getDate() - start.getDay());
  const ge = new Date(end);   ge.setDate(end.getDate()   + (6 - end.getDay()));

  const weeks = Math.round((ge - gs) / 86400000 / 7) + 1;

  const CELL = 14, GAP = 3, COL_W = CELL + GAP;
  const DAY_COL_W = 24;

  const monthPos = [];
  let prevM = -1;
  for (let w = 0; w < weeks; w++) {
    const d = new Date(gs.getTime() + w * 7 * 86400000);
    if (d.getMonth() !== prevM) { monthPos.push({ m: d.getMonth(), w }); prevM = d.getMonth(); }
  }
  const monthLabels = monthPos.map(({ m, w }) =>
    `<span style="position:absolute;left:${w * COL_W}px;font-size:10px;color:var(--text3);font-weight:600;">${m + 1}월</span>`
  ).join('');

  let cells = '';
  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < 7; d++) {
      const date = new Date(gs.getTime() + (w * 7 + d) * 86400000);
      const y = date.getFullYear(), mo = date.getMonth(), dy = date.getDate();
      const ds = `${y}-${String(mo+1).padStart(2,'0')}-${String(dy).padStart(2,'0')}`;
      if (date < start || date > end) { cells += `<div class="rc-hm-cell rc-hm-empty"></div>`; continue; }
      const times = loginDates[ds];
      const isInf = !times && inferredDates.has(ds);
      const isOn  = !!times || isInf;
      const lt    = times ? `'${times.join('|')}'` : 'null';
      cells += `<div class="rc-hm-cell${isOn?' rc-hm-on':''}${isInf?' rc-hm-inferred':''}"` +
        `${isOn?` style="--hm-col:${col}"`:''}` +
        ` onmouseenter="showHeatmapTT('${ds}',${lt},event,false,${isInf})"` +
        ` onmousemove="moveTT(event)" onmouseleave="hideTT()"></div>`;
    }
  }

  const dayLabels = ['일','월','화','수','목','금','토']
    .map((l, i) => `<div class="rc-hm-day-label">${i%2===0?l:''}</div>`).join('');

  return `<div class="rc-hm-outer">
    <div style="position:relative;height:16px;margin-left:${DAY_COL_W+4}px;margin-bottom:4px;">${monthLabels}</div>
    <div class="rc-hm-body">
      <div class="rc-hm-days">${dayLabels}</div>
      <div class="rc-hm-cells">${cells}</div>
    </div>
  </div>`;
}

function _rcRenderLoginChapter(name) {
  const area = document.getElementById('rc-login-area');
  if (!area) return;
  area.classList.remove('rc-section-visible', 'rc-phase2');
  area.style.display = 'none';

  const loginDates = window.LOGIN_LOG_DB?.[name] || {};
  const allDates   = Object.keys(loginDates).sort();
  if (!allDates.length) return;

  const firstDate = allDates[0];
  const endDate   = '2026-05-26';
  const col = (window.CLASS_COLOR?.[window.CLASS_NAME_TO_ID?.[window.GUILD_DB?.[name]?.class_name || ''] || '']) || '#c98df5';

  const inferredDates = new Set();
  for (const [dateStr, times] of Object.entries(loginDates)) {
    if (!times?.length) continue;
    if (times.some(t => parseInt(t.slice(0, 2), 10) < 10)) {
      const [_y, _m, _d] = dateStr.split('-').map(Number);
      const pd = new Date(_y, _m - 1, _d - 1);
      const prev = `${pd.getFullYear()}-${String(pd.getMonth()+1).padStart(2,'0')}-${String(pd.getDate()).padStart(2,'0')}`;
      if (!loginDates[prev]) inferredDates.add(prev);
    }
  }

  const isOn = ds => !!loginDates[ds] || inferredDates.has(ds);

  const countRange = (from, to) => {
    let total = 0, cnt = 0;
    for (let d = new Date(from + 'T00:00:00'); d <= new Date(to + 'T00:00:00'); d.setDate(d.getDate() + 1)) {
      const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      total++;
      if (isOn(ds)) cnt++;
    }
    return { cnt, total };
  };

  const aprilFrom = firstDate > '2026-04-30' ? null : (firstDate > '2026-04-01' ? firstDate : '2026-04-01');
  const mayFrom   = firstDate > '2026-05-26' ? null : (firstDate > '2026-05-01' ? firstDate : '2026-05-01');

  const apr = aprilFrom ? countRange(aprilFrom, '2026-04-30') : { cnt: 0, total: 0 };
  const may = mayFrom   ? countRange(mayFrom,   '2026-05-26') : { cnt: 0, total: 0 };
  const total = countRange(firstDate, endDate);
  const aprPct = apr.total ? Math.round(apr.cnt / apr.total * 100) : 0;
  const mayPct = may.total ? Math.round(may.cnt / may.total * 100) : 0;

  let maxStreak = 0, cur = 0;
  for (let d = new Date(firstDate + 'T00:00:00'); d <= new Date(endDate + 'T00:00:00'); d.setDate(d.getDate() + 1)) {
    const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    if (isOn(ds)) { cur++; if (cur > maxStreak) maxStreak = cur; } else cur = 0;
  }

  const heatmap = _rcBuildLoginHeatmap(loginDates, inferredDates, firstDate, endDate, col);
  const [fy, fm, fd] = firstDate.split('-');

  area.innerHTML = `
    <div class="rc-login-left">
      <div class="rc-login-title">당신의<br>접속 기록</div>
      <div class="rc-login-first-date">데이터 기록 시작일: ${fy}.${fm}.${fd}</div>
      <div class="rc-login-stats">
        <div class="rc-login-stat">
          <div class="rc-login-stat-val-wrap">
            <span class="rc-login-stat-val" data-target="${aprPct}">0</span><span class="rc-login-stat-unit">%</span>
          </div>
          <div class="rc-login-stat-label">4월 접속률</div>
          <div class="rc-login-stat-sub">${apr.cnt}/${apr.total}일</div>
        </div>
        <div class="rc-login-stat">
          <div class="rc-login-stat-val-wrap">
            <span class="rc-login-stat-val" data-target="${mayPct}">0</span><span class="rc-login-stat-unit">%</span>
          </div>
          <div class="rc-login-stat-label">5월 접속률</div>
          <div class="rc-login-stat-sub">${may.cnt}/${may.total}일</div>
        </div>
        <div class="rc-login-stat">
          <span class="rc-login-stat-val" data-target="${maxStreak}" style="color:${col}">0</span>
          <div class="rc-login-stat-label">최대 연속 접속</div>
          <div class="rc-login-stat-sub">연속 일</div>
        </div>
      </div>
    </div>
    <div class="rc-login-right">${heatmap}</div>`;

  area.style.display = 'flex';

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('rc-section-visible');
      setTimeout(() => {
        e.target.querySelectorAll('.rc-login-stat-val').forEach(el => {
          _rcAnimateCount(el, parseInt(el.dataset.target, 10));
        });
      }, 900);
      io.unobserve(e.target);
    });
  }, { threshold: 0.08 });
  io.observe(area);
}

// ── COUNT ANIMATION ──────────────────────────────────────────

function _rcAnimateCount(el, target) {
  const duration = 1600;
  const start = performance.now();
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  function step(now) {
    const p = Math.min((now - start) / duration, 1);
    el.textContent = Math.round(easeOut(p) * target);
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ── SEARCH ───────────────────────────────────────────────────

async function _rcGetClass(name) {
  for (const date of _RC_DATES) {
    try {
      const data = await _rcFetchDate(date);
      const entry = data.byName[name];
      if (entry?.cn) return entry.cn;
    } catch(e) {}
  }
  return null;
}

async function rcSearchModel() {
  const input = document.getElementById('rc-model-input');
  const name  = input?.value?.trim();
  if (!name) return;

  _rcCurrentName = name;
  _rcLoadedCount = 0;
  _rcCleanAll();

  const recapArea = document.getElementById('recap-main-area');
  if (recapArea) { recapArea.style.overflowY = 'hidden'; recapArea.scrollTop = 0; }

  const barWrap = document.getElementById('rc-loading-bar-wrap');
  if (barWrap) { barWrap.style.display = 'block'; barWrap.style.opacity = '1'; }
  const loadBar = document.getElementById('rc-loading-bar');
  if (loadBar) loadBar.style.width = '0%';

  const pageWrap = document.getElementById('rc-page-wrap');
  pageWrap?.classList.add('searched');
  pageWrap?.classList.remove('rc-chapter3-ready');

  const sub = document.getElementById('rc-char-subtitle');
  if (sub) {
    sub.innerHTML = `왁타버스 길드의 영원한 <span class="rc-sub-name">${name}</span>`;
    _rcGetClass(name).then(cn => {
      if (sub && cn) {
        const col = _RC_CLASS_COLOR[cn] || 'var(--gold)';
        sub.innerHTML = `왁타버스 길드 영원한 <span class="rc-sub-class" style="color:${col}">${cn}</span> <span class="rc-sub-name">${name}</span>`;
      }
    });
  }

  for (let i = 0; i < _RC_DATES.length; i++) {
    _rcRenderOne(name, _RC_DATES[i], i);
  }

  _rcRenderItems(name);
  _rcRenderLoginChapter(name);
}

// ── ENTRY POINT ───────────────────────────────────────────────

function openRecapPage() {
  const area = document.getElementById('recap-main-area');
  if (area.dataset.built) return;
  area.dataset.built = '1';
  area.innerHTML = _buildRecapHTML();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      area.querySelectorAll('[data-rca]').forEach(el => el.classList.add('rca-visible'));
    });
  });
}

// ── HTML BUILD ────────────────────────────────────────────────

function _buildRecapHTML() {
  const cards = _RC_DATES.map((_, i) => `
    <div class="rc-model-card">
      <div class="rc-model-viewer-wrap">
        <div class="rc-model-date-label">${_RC_LABELS[i]}</div>
        <div id="rc-model-3d-${i}"></div>
        <div class="rc-model-overlay" id="rc-overlay-${i}" style="display:none"><div class="spin"></div></div>
        <div class="rc-model-msg" id="rc-msg-${i}"></div>
      </div>
    </div>`).join('');

  return `
    <div class="rc-page-wrap" id="rc-page-wrap">

      <div class="rc-snap-section rc-snap-section-models">
        <div class="rc-hero" id="rc-hero">
          <div class="rc-hero-bg"></div>
          <div class="rc-center-content">
            <div class="rc-ep-tag" data-rca>RECAP</div>
            <div class="rc-ep-title" data-rca>당신의 모험을 돌아보며...</div>
            <div class="rc-ep-desc" data-rca>
              캐릭터의 성장 기록을 확인해 보세요 👀
            </div>
            <div class="rc-model-search" data-rca>
              <input type="text" id="rc-model-input" placeholder="닉네임 입력..."
                onkeydown="if(event.key==='Enter')rcSearchModel()" />
              <button class="rc-model-search-btn" onclick="rcSearchModel()">검색</button>
            </div>
          </div>
        </div>

        <div class="rc-char-subtitle" id="rc-char-subtitle"></div>

        <div class="rc-models-section" id="rc-models-section">
          ${cards}
        </div>
        <div class="rc-loading-bar-wrap" id="rc-loading-bar-wrap" style="display:none">
          <div class="rc-loading-bar" id="rc-loading-bar"></div>
        </div>
      </div>

      <div class="rc-snap-section rc-snap-section-items">
        <div class="rc-items-area" id="rc-items-area"></div>
      </div>

      <div class="rc-snap-section rc-snap-section-login">
        <div class="rc-login-area" id="rc-login-area"></div>
      </div>

    </div>`;
}
