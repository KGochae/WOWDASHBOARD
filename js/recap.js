// recap.js — WAKTAVERSE WOW RECAP  (epilogue 단독 페이지)

// ── 3D MODEL DATA ─────────────────────────────────────────────
const _RC_DATES  = ['2026-04-08','2026-04-26','2026-05-10','2026-05-26'];
const _RC_LABELS = ['2026. 04. 08','2026. 04. 26','2026. 05. 10','2026. 05. 26'];
const _RC_SUFFIX = {'2026-04-08':'260408','2026-04-26':'260426','2026-05-10':'260510','2026-05-26':'260526'};

const _rcDateCache = {};
const _rcViewers   = [null, null, null, null];
let   _rcCurrentName = null;

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
    return;
  }

  const entry = data.byName[name];
  if (!entry || !entry.ap || !entry.eq?.length) {
    if (overlay) overlay.style.display = 'none';
    if (msg) msg.textContent = '해당 날짜에 데이터가 없는 유저입니다';
    return;
  }

  const [race, gender, skin, face, hairStyle, hairColor, facialStyle] = entry.ap;
  const items = entry.eq;

  if (!FDID_MAP[`${race}_${gender}`]) {
    if (overlay) overlay.style.display = 'none';
    if (msg) msg.textContent = '지원하지 않는 종족';
    return;
  }

  try {
    await waitFor(() => typeof window.generateModels === 'function', 10000, '뷰어 타임아웃');
  } catch(e) {
    if (overlay) overlay.style.display = 'none';
    if (msg) msg.textContent = '뷰어 로딩 실패';
    return;
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
  } catch(e) {
    try {
      const viewer = await window.generateModels(aspect, `#${wrapId}`,
        { race, gender, items, noCharCustomization: true }, 'classic');
      _rcViewers[idx] = viewer;
      _stretch();
      if (overlay) overlay.style.display = 'none';
      _anim(viewer);
    } catch(e2) {
      if (overlay) overlay.style.display = 'none';
      if (msg) msg.textContent = '모델 로딩 실패';
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

  const gsInsetHTML = _rcBuildGsInsetHTML(name);

  area.innerHTML = `
    <div class="rc-items-left">
      <div class="rc-items-summary">
        <div class="rc-items-date-range">4월 26일 — 5월 26일</div>
        <div class="rc-items-sentence">
          <div class="rc-items-sentence-text">레이드 아이템 총<br><span class="rc-items-count">${raidDungeonCount}</span>개를<br>획득했어요.</div>
          ${gsInsetHTML ? `<div class="rc-gs-inset rc-gs-inset--inline">${gsInsetHTML}</div>` : ''}
        </div>
      </div>
    </div>
    <div class="rc-items-right">${rows}</div>`;
  area.style.display = 'flex';

  // 섹션 자체 스크롤 reveal
  const ioSection = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('rc-section-visible');
        const countEl = e.target.querySelector('.rc-items-count');
        if (countEl) _rcAnimateCount(countEl, raidDungeonCount);
        ioSection.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });
  ioSection.observe(area);

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('rc-visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  area.querySelector('.rc-items-right')?.querySelectorAll('.rc-source-row').forEach(row => io.observe(row));
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
  _rcCleanAll();

  document.getElementById('rc-page-wrap')?.classList.add('searched');

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
            <div class="rc-ep-tag" data-rca>Epilogue</div>
            <div class="rc-ep-title" data-rca>당신의 모험을<br>돌아보며</div>
            <div class="rc-ep-desc" data-rca>
              4월 8일부터 5월 26일까지<br>캐릭터의 성장 기록을 확인해 보세요.
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
      </div>

      <div class="rc-snap-section rc-snap-section-items">
        <div class="rc-items-area" id="rc-items-area"></div>
      </div>

    </div>`;
}
