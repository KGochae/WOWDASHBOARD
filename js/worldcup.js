// ── 캐릭터 월드컵 ────────────────────────────────────────────
let _wcPool = [];
let _wcWinners = [];
let _wcRound = 0;
let _wcCurRound = 0;
let _wcMatchIdx = 0;
let _wcLeft = null;
let _wcRight = null;
let _wcViewers = {};
let _wcGen = 0;

function openWorldcup() {
  _wcCleanupViewers();
  const chars = _wcEligible();
  const el = document.getElementById('worldcup-main-area');
  const avail = [4, 8, 16, 32].filter(n => n <= chars.length);
  el.innerHTML = `
    <div class="wc-setup">
      <div class="wc-setup-title">WOW 버튜버 다라이 월드컵</div>
      <div class="wc-setup-sub">버튜버 Lv.70+ · ${chars.length}명 참가 가능</div>
      <div class="wc-size-btns">
        ${avail.map(n => `<button class="wc-size-btn" onclick="wcStart(${n})">${n}강</button>`).join('')}
      </div>
    </div>`;
}

function _wcEligible() {
  return Object.keys(GUILD_DB).filter(n => {
    const g = GUILD_DB[n];
    return g.rank_name === '버튜버' && g.level >= 70;
  });
}

function wcStart(size) {
  const chars = _wcEligible().sort(() => Math.random() - 0.5).slice(0, size);
  _wcPool = chars;
  _wcWinners = [];
  _wcRound = size;
  _wcCurRound = size;
  _wcMatchIdx = 0;
  _wcNextMatch();
}

function _wcNextMatch() {
  if (_wcPool.length === 0 && _wcWinners.length === 1) {
    _wcShowChampion(_wcWinners[0]);
    return;
  }
  if (_wcPool.length === 0) {
    _wcPool = _wcWinners.sort(() => Math.random() - 0.5);
    _wcWinners = [];
    _wcCurRound = _wcPool.length;
    _wcMatchIdx = 0;
  }
  _wcLeft = _wcPool.shift();
  _wcRight = _wcPool.shift();
  _wcMatchIdx++;
  _wcRenderBattle();
}

function _wcCardInfo(name) {
  const g = GUILD_DB[name];
  const byId = g?.character_id && window._soopMapById?.[g.character_id];
  const byNm = window._soopMap?.[name];
  const avatar = (byId?.profile_img) || (byNm?.profile_img) || g?.avatar_img || '';
  const col = CLASS_COLOR[g.class_id] || '#aaa';
  const img = avatar ? `<img class="wc-soop-avatar" src="${avatar}" alt="${name}">` : `<div class="wc-soop-avatar wc-soop-ph">${name[0]}</div>`;
  return `
    <div class="wc-card-info">
      ${img}
      <div class="wc-card-name">${name}</div>
      <div class="wc-card-meta" style="color:${col}">${g.class_name}</div>
    </div>`;
}

function _wcRenderBattle() {
  _wcCleanupViewers();
  _wcGen++;
  const total = _wcCurRound / 2;
  const roundLabel = _wcCurRound === 2 ? '결승' : `${_wcCurRound}강`;
  const el = document.getElementById('worldcup-main-area');
  el.innerHTML = `
    <div class="wc-battle">
      <div class="wc-round-info">${roundLabel} &nbsp;·&nbsp; ${_wcMatchIdx} / ${total} 경기</div>
      <div class="wc-cards-row">
        <div class="wc-char-card" id="wc-card-left">
          <div class="wc-model-wrap" id="wc-model-left">
            <div class="overlay"><div class="spin"></div><div class="overlay-text">소환 중...</div></div>
          </div>
          ${_wcCardInfo(_wcLeft)}
          <button class="wc-vote-btn" onclick="wcVote('L')" disabled>선택</button>
        </div>
        <div class="wc-vs">VS</div>
        <div class="wc-char-card" id="wc-card-right">
          <div class="wc-model-wrap" id="wc-model-right">
            <div class="overlay"><div class="spin"></div><div class="overlay-text">소환 중...</div></div>
          </div>
          ${_wcCardInfo(_wcRight)}
          <button class="wc-vote-btn" onclick="wcVote('R')" disabled>선택</button>
        </div>
      </div>
      <div class="wc-progress-bar">
        <div class="wc-progress-fill" style="width:${Math.round((_wcMatchIdx-1)/total*100)}%"></div>
      </div>
    </div>`;
  const gen = _wcGen;
  let _wcDoneCount = 0;
  const _wcOnReady = () => {
    if (++_wcDoneCount < 2 || _wcGen !== gen) return;
    document.querySelectorAll('.wc-vote-btn').forEach(b => b.disabled = false);
  };
  _wcRenderModel(_wcLeft, 'wc-model-left', 'left', gen, _wcOnReady);
  _wcRenderModel(_wcRight, 'wc-model-right', 'right', gen, _wcOnReady);
}

async function _wcRenderModel(name, containerId, key, gen, onReady) {
  const char = CHAR_DB[name];
  if (!char) { onReady?.(); return; }
  const fdidKey = `${char.race_id}_${char.viewer_gender}`;
  const wrap = document.getElementById(containerId);
  if (!wrap) { onReady?.(); return; }
  if (!FDID_MAP[fdidKey]) {
    wrap.innerHTML = '<div class="no-model-msg">모델 없음</div>';
    onReady?.(); return;
  }
  const rawItems = Object.keys(char.items || {}).map(Number)
    .filter(s => char.items[s].did > 0 && VISUAL_SLOTS.includes(s))
    .map(s => [s, Math.round(char.items[s].did)]);
  const chestItem = rawItems.find(([s]) => s === 5);
  if (chestItem) {
    const did = chestItem[1];
    try {
      const r = await fetch(`${window.PROXY_HOST}/modelviewer/tbc/meta/armor/5/${did}.json`, {method:'HEAD', signal:AbortSignal.timeout(1500)});
      if (!r.ok) chestItem[0] = 20;
    } catch(e) { chestItem[0] = 20; }
  }
  if (_wcGen !== gen) return;
  try {
    await waitFor(() => typeof window.generateModels === 'function', 10000, '뷰어 로딩 타임아웃');
  } catch(e) {
    const w = document.getElementById(containerId);
    if (w) w.innerHTML = '<div class="no-model-msg">❌ 뷰어 로딩 실패</div>';
    onReady?.(); return;
  }
  if (_wcGen !== gen) return;
  const w = document.getElementById(containerId);
  if (!w) return;
  const wr = w.getBoundingClientRect();
  const aspect = (wr && wr.height > 0) ? wr.width / wr.height : 320 / 440;
  const ap = {...char.appearance, items: rawItems};
  const selector = '#' + containerId;
  function stretchCanvas() {
    const c = w.querySelector('canvas'), d = w.querySelector('div[style]');
    if (c) { c.style.width = '100%'; c.style.height = '100%'; c.style.display = 'block'; }
    if (d) { d.style.width = '100%'; d.style.height = '100%'; }
  }
  function _loseCtx(viewer) {
    try { const _c = viewer?.canvas; if (_c) { const _g = _c.getContext('webgl') || _c.getContext('experimental-webgl'); _g?.getExtension('WEBGL_lose_context')?.loseContext(); } } catch(e) {}
  }
  try {
    const viewer = await window.generateModels(aspect, selector, ap, 'classic');
    if (_wcGen !== gen) { _loseCtx(viewer); return; }
    _wcViewers[key] = viewer;
    stretchCanvas();
    w.querySelector('.overlay')?.classList.add('gone');
    onReady?.();
    try {
      await waitFor(() => typeof viewer?.renderer?.actors?.[0]?.setAnimation === 'function', 8000, '');
      if (_wcGen === gen) viewer.renderer.actors[0].setAnimation('Stand');
    } catch(e) {}
  } catch(e) {
    if (_wcGen !== gen) return;
    try {
      const viewer = await window.generateModels(aspect, selector, {race:char.race_id, gender:char.viewer_gender, items:rawItems, noCharCustomization:true}, 'classic');
      if (_wcGen !== gen) { _loseCtx(viewer); return; }
      _wcViewers[key] = viewer;
      stretchCanvas();
      w.querySelector('.overlay')?.classList.add('gone');
      onReady?.();
    } catch(e2) {
      if (_wcGen !== gen) return;
      const w2 = document.getElementById(containerId);
      if (w2) w2.innerHTML = '<div class="no-model-msg">❌ 소환 실패</div>';
      onReady?.();
    }
  }
}

function wcVote(side) {
  const winner = side === 'L' ? _wcLeft : _wcRight;
  const winCard = document.getElementById(side === 'L' ? 'wc-card-left' : 'wc-card-right');
  const loseCard = document.getElementById(side === 'L' ? 'wc-card-right' : 'wc-card-left');
  if (winCard) winCard.classList.add('wc-winner');
  if (loseCard) loseCard.classList.add('wc-loser');
  document.querySelectorAll('.wc-vote-btn').forEach(b => b.disabled = true);
  _wcWinners.push(winner);
  setTimeout(_wcNextMatch, 700);
}

function _wcShowChampion(name) {
  _wcCleanupViewers();
  _wcGen++;
  const g = GUILD_DB[name];
  const col = CLASS_COLOR[g.class_id] || '#aaa';
  const el = document.getElementById('worldcup-main-area');
  el.innerHTML = `
    <div class="wc-champion">
      <div class="wc-champion-title">우승자</div>
      <div class="wc-champion-card">
        <div class="wc-champion-model-wrap" id="wc-model-champ">
          <div class="overlay"><div class="spin"></div><div class="overlay-text">소환 중...</div></div>
        </div>
        <div class="wc-champion-name">${name}</div>
        <div class="wc-champion-meta" style="color:${col}">${g.class_name}</div>
        <div class="wc-champion-lv">Lv.${g.level}</div>
      </div>
      <button class="wc-restart-btn" onclick="openWorldcup()">다시 시작</button>
    </div>`;
  _wcRenderModel(name, 'wc-model-champ', 'champ', _wcGen);
}

function _wcCleanupViewers() {
  _wcGen++;
  for (const key of Object.keys(_wcViewers)) {
    const v = _wcViewers[key];
    if (v) {
      try { v.setAnimPaused(true); } catch(e) {}
      try { const _c = v.canvas; if (_c) { const _g = _c.getContext('webgl') || _c.getContext('experimental-webgl'); _g?.getExtension('WEBGL_lose_context')?.loseContext(); } } catch(e) {}
    }
    delete _wcViewers[key];
  }
}
