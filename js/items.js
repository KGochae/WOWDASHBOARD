// js/items.js — BIS 아이템 탭 (tbca_bis_updated.json + Wowhead XML)

// ── 상태 ────────────────────────────────────────────────────
var _bisData       = null;
var _bisActiveKey  = '';
var _bisPhase      = 'p1';
var _bisSlotFilter = 'Head';
var _bisSrcFilter  = new Set();
var _bisCart       = new Map();   // compositeKey → {itemId,activeKey,phase,slot,rank,classKo,specKo}
var _bisInitDone   = false;
const _bisWhCache    = {};          // item_id → {name, icon, qualityId, html, source}
const _bisSpellIdMap = {};          // item_id → spellId (전문 기술 crafted items)
const _BIS_LS_KEY  = 'bis_wh_cache';
const _BIS_LS_TTL  = 24 * 60 * 60 * 1000;

const BIS_ICON_BASE = 'https://render.worldofwarcraft.com/classic-kr/icons/56/';
const BIS_ICON_FB   = BIS_ICON_BASE + 'inv_misc_questionmark.jpg';

const BIS_QUALITY_COLOR = [
  '#9d9d9d','#9d9d9d','#1eff00','#0070dd','#a335ee','#ff8000','#e6cc80',
];

const BIS_SLOT_KR = {
  Head:'머리', Neck:'목', Shoulders:'어깨', Back:'등', Chest:'가슴',
  Wrist:'손목', Hands:'손', Waist:'허리', Legs:'다리', Feet:'발',
  Ring:'손가락', Trinket:'장신구',
  'Off Hand':'보조손', 'One Hand':'한손', 'Two Hand':'양손',
  'Ranged/Relic':'원거리',
};

const IS_CLASS_COLORS = {
  '전사':'#C79C3E','성기사':'#F58CBA','사냥꾼':'#ABD473','도적':'#FFF569',
  '사제':'#FFFFFF','주술사':'#0070DE','마법사':'#69CCF0','흑마법사':'#9482C9','드루이드':'#FF7D0A',
};

const _SRC_STYLE = {
  '획득':       { bg:'rgba(255,100,100,.18)', col:'#ff8080' },
  'PvP':        { bg:'rgba(255,140,0,.18)',   col:'#ffaa40' },
  '퀘스트':     { bg:'rgba(255,215,0,.18)',   col:'#ffd700' },
  '전문 기술':  { bg:'rgba(100,255,150,.18)', col:'#80ff90' },
  '상인':       { bg:'rgba(100,180,255,.18)', col:'#80c8ff' },
  '평판':       { bg:'rgba(180,100,255,.18)', col:'#c080ff' },
  '이벤트':     { bg:'rgba(200,200,200,.18)', col:'#cccccc' },
  '토큰':       { bg:'rgba(255,180,60,.18)',  col:'#ffb43c' },
  '알 수 없음': { bg:'rgba(100,100,100,.15)', col:'#888888' },
};

const _PROF_MAP = { 1:'연금술',2:'가죽세공',3:'재봉술',4:'공학',5:'대장도장이',6:'보석세공',7:'마법부여' };
const _SRC_TYPE_MAP = { 1:'획득',2:'획득',3:'전문 기술',4:'퀘스트',5:'상인',6:'평판',7:'이벤트' };

// ── localStorage 캐시 ───────────────────────────────────────
function _bisLoadLSCache() {
  try {
    const raw = localStorage.getItem(_BIS_LS_KEY);
    if (!raw) return;
    const stored = JSON.parse(raw);
    const now = Date.now();
    const pruned = {};
    for (const [id, entry] of Object.entries(stored)) {
      if (entry.ts && (now - entry.ts) < _BIS_LS_TTL) {
        _bisWhCache[+id] = entry.data;
        pruned[id] = entry;
      }
    }
    // 만료 항목 제거
    if (Object.keys(pruned).length !== Object.keys(stored).length) {
      localStorage.setItem(_BIS_LS_KEY, JSON.stringify(pruned));
    }
  } catch(e) {}
}

function _bisWriteLSCache(itemId, data) {
  try {
    const raw = localStorage.getItem(_BIS_LS_KEY);
    const stored = raw ? JSON.parse(raw) : {};
    stored[itemId] = { ts: Date.now(), data };
    localStorage.setItem(_BIS_LS_KEY, JSON.stringify(stored));
  } catch(e) {}
}

// ── 진입점 ──────────────────────────────────────────────────
async function openItemSetup() {
  if (!_bisInitDone) await _isInit();
  if(typeof window.logFA==='function')window.logFA('item_search_open',{});
}

async function _isInit() {
  _bisInitDone = true;
  _bisLoadLSCache();
  const root = document.getElementById('item-setup-main-area');

  if (!document.getElementById('is-style')) {
    const s = document.createElement('style');
    s.id = 'is-style';
    s.textContent = `
      /* 구조 */
      .is-header { padding:18px 24px 12px 12px; border-bottom:1px solid var(--border); background:var(--bg2); flex-shrink:0; }
      .is-header-title { font-size:22px; font-weight:700; color:var(--text); letter-spacing:-.01em; }
      .is-header-sub { font-size:12px; color:var(--text2); margin-top:3px; }
      .is-body { flex:1; display:flex; overflow-x:auto; overflow-y:hidden; }
      #is-filter-col { width:260px; flex-shrink:0; overflow-y:auto; border-right:1px solid var(--border); padding:14px 12px; background:var(--bg2); scrollbar-width:none; }
      #is-filter-col::-webkit-scrollbar { display:none; }
      #is-main-col { flex:1 0 450px; min-width:450px; overflow:hidden; display:flex; flex-direction:column; }
      #is-main-hd { flex-shrink:0; padding:12px 18px 10px; border-bottom:1px solid var(--border); background:var(--bg2); }
      #is-main-list { flex:1; overflow-y:auto; overflow-x:hidden; padding:14px 18px; }
      .is-col-title { font-size:15px; font-weight:700; color:var(--text); margin-bottom:14px; padding-bottom:10px; border-bottom:1px solid var(--border); }
      .is-cls-btns { display:flex; flex-wrap:wrap; gap:4px; }
      /* 섹션 */
      .is-sec { margin-bottom:18px; padding-bottom:16px; border-bottom:1px solid var(--border); }
      .is-sec:last-child { border-bottom:none; margin-bottom:0; }
      .is-sec-hd { font-size:10px; font-weight:700; color:var(--text3); letter-spacing:.07em; text-transform:uppercase; margin-bottom:8px; display:flex; align-items:center; justify-content:space-between; }
      .is-sec-reset { background:none; border:none; color:var(--text3); cursor:pointer; font-size:10px; font-family:inherit; padding:0; }
      .is-sec-reset:hover { color:var(--text2); }
      /* 버튼 */
      .is-cls-btn { background:var(--bg3); border:1px solid var(--border); color:var(--text3); padding:3px 9px; border-radius:4px; cursor:pointer; font-size:11px; font-family:inherit; transition:all .12s; }
      .is-cls-btn:hover { border-color:var(--border2); color:var(--text2); }
      /* 슬롯 드롭다운 */
      #is-slot-sel { width:100%; background:var(--bg3); border:1px solid var(--border2); border-radius:4px; padding:5px 8px; font-size:12px; color:var(--text); font-family:inherit; cursor:pointer; outline:none; }
      #is-slot-sel:focus { border-color:var(--gold2); }
      #is-slot-sel option { background:var(--bg3); color:var(--text); }
      /* 출처 체크박스 */
      #is-src-checks { display:grid; grid-template-columns:1fr 1fr; gap:0 4px; }
      .is-chk { display:flex; align-items:center; gap:7px; cursor:pointer; padding:3px 5px; border-radius:3px; user-select:none; }
      .is-chk:hover { background:rgba(255,255,255,.04); }
      .is-chk input { accent-color:var(--gold2); cursor:pointer; width:12px; height:12px; flex-shrink:0; }
      .is-chk span { font-size:12px; color:var(--text2); }
      /* 페이즈 버튼 */
      .is-phase-btns { display:flex; gap:5px; flex-wrap:wrap; }
      .is-phase-btn { flex:1; min-width:36px; padding:5px 0; border-radius:4px; border:1px solid var(--border2); background:var(--bg3); color:var(--text2); font-size:11px; font-family:inherit; cursor:pointer; transition:all .12s; text-align:center; }
      .is-phase-btn:hover { border-color:var(--gold2); color:var(--text); }
      .is-phase-btn.on { border-color:var(--gold2); background:rgba(200,168,74,.12); color:var(--gold2); font-weight:700; }
      /* 야성 서브 버튼 */
      .is-feral-sub { margin-left:4px; background:rgba(255,125,10,.08) !important; border-color:rgba(255,125,10,.3) !important; color:#FF7D0A !important; }
      .is-feral-sub.on { background:rgba(255,125,10,.22) !important; border-color:#FF7D0A !important; }
      /* 아이템 리스트 */
      .is-list-hd { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
      .is-list-title { font-size:14px; font-weight:600; color:var(--text); }
      .is-list-count { font-size:11px; color:var(--text3); }
      .is-list-empty { color:var(--text3); font-size:13px; }
      /* 슬롯 구분선 */
      .is-slot-sep { font-size:10px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--text3); padding:10px 0 5px; border-bottom:1px solid var(--border); margin-bottom:4px; display:flex; align-items:center; gap:6px; }
      .is-slot-sep:first-child { padding-top:0; }
      .is-slot-sep-en { font-size:9px; opacity:.35; font-weight:400; text-transform:none; letter-spacing:0; }
      /* 아이템 행 */
      .is-item-row { display:flex; align-items:center; gap:10px; padding:6px 8px; border-radius:5px; cursor:default; border:1px solid var(--border); background:var(--bg2); transition:background .1s, border-color .1s; margin-bottom:3px; }
      .is-item-row:hover { background:var(--bg3); border-color:var(--border2); }
      .is-item-row.in-cart { border-color:rgba(200,168,74,.4); background:rgba(200,168,74,.05); }
      .is-item-info { flex:1; min-width:0; }
      .is-item-name { font-size:13px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .is-item-name.loading { color:var(--text3) !important; }
      .is-item-sub { font-size:10px; color:var(--text3); margin-top:1px; }
      .is-item-right { display:flex; align-items:center; gap:6px; flex-shrink:0; }
      .is-cat-badge { font-size:10px; padding:1px 5px; border-radius:3px; }
      .is-cart-chk { accent-color:var(--gold2); cursor:pointer; width:14px; height:14px; }
      .is-rank-num { font-size:13px; font-weight:900; color:var(--text3); width:22px; text-align:center; flex-shrink:0; line-height:1; }
      .is-rank-num.r1 { color:#ffd700; }
      .is-rank-num.r2 { color:#c0c0c0; }
      .is-rank-num.r3 { color:#cd7f32; }
      /* 아이콘 */
      .is-icon { width:40px; height:40px; border-radius:4px; flex-shrink:0; object-fit:cover; border:1px solid rgba(255,255,255,.12); background:var(--bg4); transition:opacity .2s; }
      .is-icon.loading { opacity:0; }
      /* 루트 패널 */
      #is-route-col { width:320px; flex-shrink:0; overflow-y:auto; border-left:1px solid var(--border); padding:14px 12px; background:var(--bg2); display:flex; flex-direction:column; gap:10px; scrollbar-width:none; }
      #is-route-col::-webkit-scrollbar { display:none; }
      /* Wowhead 카드 */
      .is-wh-sample { border:1px solid var(--border2); border-radius:8px; background:var(--bg3); padding:12px; }
      .is-wh-sample-title { font-size:10px; font-weight:700; color:var(--text3); letter-spacing:.07em; text-transform:uppercase; margin-bottom:10px; display:flex; align-items:center; justify-content:space-between; }
      .is-wh-sample-badge { font-size:9px; padding:1px 6px; border-radius:3px; background:rgba(255,196,64,.12); color:var(--gold2); font-weight:600; }
      .is-wh-item-card { display:flex; align-items:center; gap:10px; padding:8px; border-radius:6px; border:1px solid rgba(163,53,238,.35); background:rgba(163,53,238,.05); }
      .is-wh-icon { width:44px; height:44px; border-radius:4px; border:2px solid rgba(163,53,238,.5); object-fit:cover; flex-shrink:0; }
      .is-wh-info { flex:1; min-width:0; }
      .is-wh-name { font-size:13px; font-weight:700; color:#a335ee; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .is-wh-sub { font-size:10px; color:var(--text3); margin-top:2px; }
      /* 획득처 (hover) */
      .is-src-box { margin-top:10px; padding-top:10px; border-top:1px solid var(--border); }
      .is-src-title { font-size:10px; font-weight:700; color:var(--text3); letter-spacing:.07em; text-transform:uppercase; margin-bottom:8px; }
      .is-src-row { display:flex; align-items:flex-start; gap:8px; padding:5px 0; border-bottom:1px solid var(--border); }
      .is-src-row:last-child { border-bottom:none; }
      .is-src-tag { font-size:10px; font-weight:700; padding:1px 6px; border-radius:3px; white-space:nowrap; flex-shrink:0; }
      .is-src-name { font-size:12px; color:var(--text2); flex:1; min-width:0; }
      /* 장바구니 루트 */
      .is-cart-panel { border:1px solid var(--border2); border-radius:8px; background:var(--bg3); padding:12px; }
      .is-cart-panel-title { font-size:10px; font-weight:700; color:var(--text3); letter-spacing:.07em; text-transform:uppercase; margin-bottom:10px; display:flex; align-items:center; justify-content:space-between; }
      .is-cart-clear { background:none; border:none; color:var(--text3); cursor:pointer; font-size:10px; font-family:inherit; padding:0; }
      .is-cart-clear:hover { color:#d4918e; }
      /* Google Sheets 내보내기 */
      .is-gs-area { margin-top:10px; border-top:1px solid var(--border); padding-top:10px; display:flex; align-items:center; gap:6px; }
      .is-gs-btn { flex:1; background:rgba(255,255,255,.04); border:1px solid var(--border2); color:var(--text2); padding:6px 10px; border-radius:6px; cursor:pointer; font-size:11px; font-family:inherit; font-weight:600; transition:all .12s; text-align:center; display:flex; align-items:center; justify-content:center; gap:5px; }
      .is-gs-btn:hover:not(:disabled) { background:rgba(255,255,255,.08); color:var(--text); }
      .is-gs-btn:disabled { opacity:.4; cursor:not-allowed; }
      .is-gs-btn.open { color:#6dba8e; border-color:rgba(109,186,142,.4); }
      .is-gs-btn.open:hover { background:rgba(109,186,142,.08); }
      .is-cart-empty { color:var(--text3); font-size:12px; }
      .is-cart-item { display:flex; align-items:center; gap:8px; padding:5px 0; border-bottom:1px solid var(--border); }
      .is-cart-item:last-child { border-bottom:none; }
      .is-cart-item-icon { width:32px; height:32px; border-radius:3px; border:1px solid rgba(255,255,255,.1); flex-shrink:0; object-fit:cover; }
      .is-cart-item-info { flex:1; min-width:0; }
      .is-cart-item-name { font-size:12px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .is-cart-item-src { font-size:10px; color:var(--text3); margin-top:1px; }
      .is-cart-item-rm { background:none; border:none; color:var(--text3); cursor:pointer; font-size:14px; padding:0 2px; line-height:1; }
      .is-cart-item-rm:hover { color:#d4918e; }
      .is-cart-group-hd { font-size:11px; font-weight:800; color:var(--text1); letter-spacing:.06em; text-transform:uppercase; padding:8px 0 3px; border-top:1px solid var(--border2); margin-top:4px; }
      .is-cart-group-hd:first-child { border-top:none; margin-top:0; }
      .is-cart-phase-hd { font-size:10px; font-weight:700; color:var(--text2); letter-spacing:.05em; padding:4px 0 1px 6px; text-transform:uppercase; }
      .is-cart-slot-hd { font-size:10px; color:var(--text2); padding:4px 0 1px 6px; }
      #is-filter-col.is-filter-loading { pointer-events:none; opacity:.45; }
      /* Wowhead 툴팁 */
      #is-wh-tooltip { position:fixed; z-index:9999; pointer-events:none; display:none; max-width:300px; min-width:180px; }
      .is-wh-tt-inner { background:var(--bg3); border:1px solid var(--border2); border-radius:5px; padding:12px 14px; box-shadow:0 4px 20px rgba(0,0,0,.7); font-size:12px; line-height:1.6; color:var(--text2); }
      .is-wh-tt-inner table { border-collapse:collapse; width:100%; }
      .is-wh-tt-inner td { padding:0; vertical-align:top; }
      .is-wh-tt-inner th { padding:0; vertical-align:top; text-align:right; }
      .is-wh-tt-inner b { color:var(--text); font-weight:600; }
      .is-wh-tt-inner a { color:var(--text2); text-decoration:none; }
      .is-wh-tt-inner .q0,.is-wh-tt-inner .q1 { color:#9d9d9d; }
      .is-wh-tt-inner .q2 { color:#1eff00; }
      .is-wh-tt-inner .q3 { color:#0070dd; }
      .is-wh-tt-inner .q4 { color:#a335ee; }
      .is-wh-tt-inner .q5 { color:#ff8000; }
      .is-wh-tt-inner .q6 { color:#e6cc80; }
      .is-wh-tt-inner .c1  { color:#C79C3E; }
      .is-wh-tt-inner .c2  { color:#F58CBA; }
      .is-wh-tt-inner .c3  { color:#ABD473; }
      .is-wh-tt-inner .c4  { color:#FFF569; }
      .is-wh-tt-inner .c5  { color:#FFFFFF; }
      .is-wh-tt-inner .c7  { color:#69CCF0; }
      .is-wh-tt-inner .c8  { color:#9482C9; }
      .is-wh-tt-inner .c11 { color:#FF7D0A; }
      .is-wh-tt-inner .whtt-sellprice { display:flex; align-items:center; gap:3px; color:var(--text3); font-size:11px; margin-top:4px; }
      .is-wh-tt-inner .moneygold::after   { content:'금'; color:var(--gold2); margin-left:1px; }
      .is-wh-tt-inner .moneysilver::after { content:'은'; color:#b0b0b0; margin-left:1px; }
      .is-wh-tt-inner .moneycopper::after { content:'동'; color:#cd7f32; margin-left:1px; }
      .is-wh-tt-loading { color:var(--text3); font-size:12px; }
      .is-wh-reagents { border-top:1px solid var(--border2); margin-top:8px; padding-top:8px; }
      .is-wh-reagents-title { font-size:10px; color:var(--text3); font-weight:600; text-transform:uppercase; letter-spacing:.06em; margin-bottom:5px; }
      .is-wh-reagent { display:flex; align-items:center; gap:6px; margin-bottom:3px; }
      .is-wh-reagent-icon { width:20px; height:20px; border-radius:3px; flex-shrink:0; }
      .is-wh-reagent-name { font-size:11px; flex:1; }
      .is-wh-reagent-count { font-size:11px; color:var(--text3); }
    `;
    document.head.appendChild(s);
  }

  root.innerHTML = `
    <div class="is-header">
      <div class="is-header-title">BiS 아이템</div>
      <div class="is-header-sub"> TBCA/AtlasLoot/LOON 에드온 순으로 수집한 직업 · 특성 · 페이즈 별 BIS 장비 목록입니다. 아이템 설명은 WOWHEAD TBC 기준으로 노출됩니다. </div>
    </div>
    <div class="is-body">
      <div id="is-filter-col">
        <div class="is-col-title">카테고리 설정</div>
        <div class="is-sec">
          <div class="is-sec-hd">직업</div>
          <div id="is-class-btns" class="is-cls-btns"></div>
        </div>
        <div class="is-sec" id="is-spec-sec" style="display:none">
          <div class="is-sec-hd">특성</div>
          <div id="is-spec-btns" class="is-cls-btns"></div>
        </div>
        <div class="is-sec">
          <div class="is-sec-hd">페이즈</div>
          <div class="is-phase-btns" id="is-phase-btns"></div>
        </div>
        <div class="is-sec">
          <div class="is-sec-hd">슬롯</div>
          <select id="is-slot-sel" onchange="bisSelectSlot(this.value)"></select>
        </div>
        <div class="is-sec">
          <div class="is-sec-hd">출처 <button class="is-sec-reset" onclick="bisResetSrc()">초기화</button></div>
          <div id="is-src-checks"></div>
        </div>
      </div>
      <div id="is-main-col">
        <div id="is-main-hd"></div>
        <div id="is-main-list"></div>
      </div>
      <div id="is-route-col">
        <div class="is-cart-panel">
          <div class="is-cart-panel-title">
            장바구니
            <button class="is-cart-clear" onclick="bisClearCart()">전체 해제</button>
          </div>
          <div id="is-cart-list"><div class="is-cart-empty">아이템을 체크하여 장바구니에 담으세요!</div></div>
          <div class="is-gs-area" id="bisGsArea" style="display:none">
            <button class="is-gs-btn" id="bisGsBtn" onclick="bisExportToSheet()">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="5" y="3" width="14" height="18" rx="2"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>
              구글 시트로 열기
            </button>
          </div>
        </div>
      </div>
    </div>`;

  // 툴팁 div
  if (!document.getElementById('is-wh-tooltip')) {
    const tt = document.createElement('div');
    tt.id = 'is-wh-tooltip';
    tt.innerHTML = '<div class="is-wh-tt-inner" id="is-wh-tt-inner"></div>';
    document.body.appendChild(tt);
  }

  // BIS 데이터 로드
  document.getElementById('is-main-list').innerHTML =
    '<div style="color:var(--text3);font-size:13px;padding:4px">데이터 로드 중...</div>';
  try {
    const r = await fetch('/data/tbca_bis_updated.json?v=' + Date.now());
    _bisData = await r.json();
    // 전문 기술 아이템 spellId 맵 사전 구축
    for (const entry of Object.values(_bisData)) {
      for (const slot of (entry.slots || [])) {
        for (const phase of ['p1','p2','p3','p4','p5']) {
          for (const it of (slot[phase] || [])) {
            if (it.source?.source_type === '전문 기술' && it.source?.source_location) {
              _bisSpellIdMap[it.item_id] = it.source.source_location;
            }
          }
        }
      }
    }
  } catch(e) {
    document.getElementById('is-main-list').innerHTML =
      `<div style="color:#d4918e">데이터 로드 실패: ${e.message}</div>`;
    return;
  }

  // 직업 버튼
  const clsWrap = document.getElementById('is-class-btns');
  const clsGroups = _bisGroupByClass();
  for (const [cls] of Object.entries(clsGroups)) {
    const b = document.createElement('button');
    b.className = 'is-cls-btn';
    b.textContent = cls;
    b.dataset.cls = cls;
    b.onclick = () => bisSelectCls(cls);
    clsWrap.appendChild(b);
  }

  // 페이즈 버튼
  const phaseWrap = document.getElementById('is-phase-btns');
  ['p1','p2','p3','p4','p5'].forEach(p => {
    const b = document.createElement('button');
    b.className = 'is-phase-btn' + (p === _bisPhase ? ' on' : '');
    b.textContent = p.toUpperCase();
    b.dataset.phase = p;
    b.onclick = () => bisSelectPhase(p);
    phaseWrap.appendChild(b);
  });

  // 슬롯 드롭다운 (초기값: 머리)
  const slotOrder = ['Head','Neck','Shoulders','Back','Chest','Wrist','Hands','Waist','Legs','Feet','Ring','Trinket','One Hand','Two Hand','Off Hand','Ranged/Relic'];
  const slotSel = document.getElementById('is-slot-sel');
  slotOrder.forEach(slot => {
    const opt = document.createElement('option');
    opt.value = slot;
    opt.textContent = BIS_SLOT_KR[slot] || slot;
    if (slot === 'Head') opt.selected = true;
    slotSel.appendChild(opt);
  });

  // 출처 체크박스
  const srcWrap = document.getElementById('is-src-checks');
  ['획득','PvP','퀘스트','전문 기술','상인','평판','토큰'].forEach(type => {
    const lbl = document.createElement('label');
    lbl.className = 'is-chk';
    lbl.innerHTML = `<input type="checkbox" data-src="${type}"><span style="color:${(_SRC_STYLE[type]||{}).col||'var(--text2)'}">${type}</span>`;
    lbl.querySelector('input').addEventListener('change', e => {
      e.target.checked ? _bisSrcFilter.add(type) : _bisSrcFilter.delete(type);
      isRenderList();
    });
    srcWrap.appendChild(lbl);
  });

  // 기본 선택
  const firstCls = Object.keys(clsGroups)[0];
  bisSelectCls(firstCls, true);
}

// ── 클래스별 그룹핑 ──────────────────────────────────────────
function _bisGroupByClass() {
  if (!_bisData) return {};
  const groups = {};
  for (const [key, v] of Object.entries(_bisData)) {
    const cls = v.class_ko || v.class;
    if (!groups[cls]) groups[cls] = [];
    // Bear/Cat → 야성 sentinel
    if (v.spec === 'Bear' || v.spec === 'Cat') {
      if (!groups[cls].find(s => s.key === '_feral')) {
        groups[cls].push({ key: '_feral', spec: '야성' });
      }
    } else {
      groups[cls].push({ key, spec: v.spec_ko || v.spec });
    }
  }
  return groups;
}

// ── 선택 핸들러 ──────────────────────────────────────────────
function bisSelectCls(cls, silent) {
  const col = IS_CLASS_COLORS[cls] || 'var(--text)';
  document.querySelectorAll('#is-class-btns .is-cls-btn').forEach(b => {
    const on = b.dataset.cls === cls;
    b.classList.toggle('on', on);
    b.style.borderColor = on ? col : '';
    b.style.color       = on ? col : '';
    b.style.background  = on ? col + '22' : '';
  });

  const groups = _bisGroupByClass();
  const specs = groups[cls] || [];
  const specSec = document.getElementById('is-spec-sec');
  const specWrap = document.getElementById('is-spec-btns');
  if (specSec) specSec.style.display = specs.length > 1 ? '' : 'none';
  if (specWrap) {
    specWrap.innerHTML = '';
    specs.forEach(({key, spec}) => {
      const b = document.createElement('button');
      b.className = 'is-cls-btn';
      b.textContent = spec;
      b.dataset.key = key;
      if (key === '_feral') {
        b.onclick = () => _bisToggleFeralSub(col);
      } else {
        b.onclick = () => bisSelectKey(key);
      }
      specWrap.appendChild(b);
    });
    // 야성 서브 버튼 (곰/표범) — 초기 숨김
    if (specs.find(s => s.key === '_feral')) {
      [['DruidBear','곰'],['DruidCat','표범']].forEach(([fk, label]) => {
        const fb = document.createElement('button');
        fb.className = 'is-cls-btn is-feral-sub';
        fb.textContent = label;
        fb.dataset.feral = fk;
        fb.style.display = 'none';
        fb.onclick = () => bisSelectKey(fk);
        specWrap.appendChild(fb);
      });
    }
  }

  const firstKey = specs[0]?.key === '_feral' ? 'DruidCat' : specs[0]?.key;
  if (firstKey) {
    if (silent) setTimeout(() => bisSelectKey(firstKey), 0);
    else bisSelectKey(firstKey);
  }
}

function _bisToggleFeralSub(col) {
  const subBtns = document.querySelectorAll('#is-spec-btns [data-feral]');
  const isHidden = subBtns[0]?.style.display === 'none';
  subBtns.forEach(fb => fb.style.display = isHidden ? '' : 'none');
  if (isHidden) {
    // 표범 자동 선택
    const cat = [...subBtns].find(b => b.dataset.feral === 'DruidCat');
    if (cat) bisSelectKey('DruidCat');
  }
}

function bisSelectKey(key) {
  if (!_bisData?.[key]) return;
  _bisActiveKey = key;

  const v = _bisData[key];
  const cls = v.class_ko || v.class;
  const col = IS_CLASS_COLORS[cls] || 'var(--text)';

  const feralKeys = new Set(['DruidBear', 'DruidCat']);
  const parentKey = feralKeys.has(key) ? '_feral' : key;

  // 일반 spec 버튼 활성화
  document.querySelectorAll('#is-spec-btns .is-cls-btn:not(.is-feral-sub)').forEach(b => {
    const on = b.dataset.key === parentKey;
    b.classList.toggle('on', on);
    b.style.borderColor = on ? col : '';
    b.style.color       = on ? col : '';
    b.style.background  = on ? col + '22' : '';
  });

  // 야성 서브 버튼 처리
  const feralSubs = document.querySelectorAll('#is-spec-btns .is-feral-sub');
  if (feralKeys.has(key)) {
    feralSubs.forEach(fb => {
      fb.style.display = '';
      fb.classList.toggle('on', fb.dataset.feral === key);
    });
  } else {
    feralSubs.forEach(fb => { fb.style.display = 'none'; fb.classList.remove('on'); });
  }

  isRenderList();
}

function bisSelectPhase(phase) {
  _bisPhase = phase;
  document.querySelectorAll('#is-phase-btns .is-phase-btn').forEach(b => {
    b.classList.toggle('on', b.dataset.phase === phase);
  });
  isRenderList();
}

function bisSelectSlot(val) {
  _bisSlotFilter = val || null;
  isRenderList();
}

function bisResetSrc() {
  _bisSrcFilter.clear();
  document.querySelectorAll('#is-src-checks input[type=checkbox]').forEach(cb => cb.checked = false);
  isRenderList();
}

// ── 리스트 렌더 ─────────────────────────────────────────────
function isRenderList() {
  const hd   = document.getElementById('is-main-hd');
  const list = document.getElementById('is-main-list');
  if (!hd || !list || !_bisData || !_bisActiveKey) return;

  const entry = _bisData[_bisActiveKey];
  if (!entry) return;

  const cls = entry.class_ko || entry.class;
  const spec = entry.spec_ko  || entry.spec;
  const col  = IS_CLASS_COLORS[cls] || '#aaa';

  hd.innerHTML = `
    <div class="is-list-hd">
      <span class="is-list-title">${cls}</span>
      <span style="font-size:13px;font-weight:700;color:${col}">· ${spec}</span>
      <span class="is-list-count">${_bisPhase.toUpperCase()}</span>
    </div>`;

  const allIds = new Set();
  const slotList = [];

  for (const slotData of entry.slots) {
    if (_bisSlotFilter && slotData.slot !== _bisSlotFilter) continue;
    const phaseItems = slotData[_bisPhase] || [];
    if (!phaseItems.length) continue;

    // 출처 필터
    const toShow = _bisSrcFilter.size > 0
      ? phaseItems.filter(it => {
          const st = it.source?.source_type;
          if (!st) return false;
          if (_bisSrcFilter.has(st)) return true;
          if (st === 'Tier Token' && _bisSrcFilter.has('획득')) return true;
          return false;
        })
      : phaseItems;
    if (!toShow.length) continue;

    slotList.push({ slotData, toShow });
    toShow.forEach(it => allIds.add(it.item_id));
  }

  if (!slotList.length) {
    list.innerHTML = '<div class="is-list-empty">해당 페이즈 데이터 없음</div>';
    return;
  }

  let html = '<div id="bis-item-list">';
  for (const { slotData, toShow } of slotList) {
    const slotKr = BIS_SLOT_KR[slotData.slot] || slotData.slot;
    html += `<div class="is-slot-sep">${slotKr}<span class="is-slot-sep-en">${slotData.slot}</span></div>`;

    for (const it of toShow) {
      const cached    = _bisWhCache[it.item_id];
      const name      = cached ? cached.name : `#${it.item_id}`;
      const icon      = cached ? cached.icon : BIS_ICON_FB;
      const qc        = cached ? (BIS_QUALITY_COLOR[cached.qualityId] || '#9d9d9d') : '';
      const rankCls   = it.rank === 1 ? 'r1' : it.rank === 2 ? 'r2' : it.rank === 3 ? 'r3' : '';
      const tierBg    = it.rank === 1 ? 'rgba(255,215,0,.14)'  : 'rgba(255,255,255,.05)';
      const tierCol   = it.rank === 1 ? '#ffd700'              : 'var(--text3)';
      const tierLbl   = it.rank === 1 ? 'BiS' : 'Alt';
      const nameLoaded = cached ? '' : ' loading';
      const iconLoaded = cached ? '' : ' loading';
      const _ck       = `${_bisActiveKey}||${_bisPhase}||${slotData.slot}||${it.item_id}`;
      const inCart    = _bisCart.has(_ck) ? ' in-cart' : '';
      const cartChk   = _bisCart.has(_ck) ? 'checked' : '';

      // tbca source 우선 (상세 데이터), fallback → wowhead 파싱 source
      const activeSrc = it.source && Object.keys(it.source).length ? it.source : cached?.source;
      const srcTxt = _bisSrcDetail(activeSrc);

      // 전문 기술 아이템의 스펠 ID 수집 (재료 fetch용)
      if (it.source?.source_type === '전문 기술' && it.source?.source_location) {
        _bisSpellIdMap[it.item_id] = it.source.source_location;
      }

      html += `<div class="is-item-row${inCart}" data-item-id="${it.item_id}">
        <span class="is-rank-num ${rankCls}">${it.rank}</span>
        <img class="is-icon${iconLoaded}" src="${icon}" alt=""
          style="border-color:${qc ? qc+'55' : 'rgba(255,255,255,.12)'}; cursor:help"
          onerror="this.src='${BIS_ICON_FB}'"
          onmouseenter="bisShowTT(this,${it.item_id})"
          onmouseleave="bisHideTT()">
        <div class="is-item-info">
          <div class="is-item-name${nameLoaded}" style="color:${qc||'var(--text3)'}">${name}</div>
          <div class="is-item-sub" id="is-item-src-${it.item_id}">${srcTxt}</div>
        </div>
        <div class="is-item-right">
          <span class="is-cat-badge" style="background:${tierBg};color:${tierCol}">${tierLbl}</span>
          <input type="checkbox" class="is-cart-chk" ${cartChk}
            onchange="bisToggleCart(${it.item_id},this.checked,'${slotData.slot}',${it.rank})"
            onclick="event.stopPropagation()">
        </div>
      </div>`;
    }
  }
  html += '</div>';
  list.innerHTML = html;

  // 캐시 없는 것만 fetch
  const toFetch = [...allIds].filter(id => !_bisWhCache[id]);
  if (toFetch.length) _bisBatchFetch(toFetch);
}

// ── 장바구니 ────────────────────────────────────────────────
function bisToggleCart(itemId, checked, slot, rank) {
  const entry = _bisData?.[_bisActiveKey];
  const ck = `${_bisActiveKey}||${_bisPhase}||${slot}||${itemId}`;
  if (checked) {
    _bisCart.set(ck, {
      itemId, activeKey: _bisActiveKey, phase: _bisPhase, slot, rank,
      classKo: entry?.class_ko || entry?.class || '',
      specKo:  entry?.spec_ko  || entry?.spec  || '',
    });
  } else {
    _bisCart.delete(ck);
  }
  _gsLastExported = false;
  // 현재 뷰에서 같은 item_id 행은 이 context 키가 같으므로 toggle
  document.querySelectorAll(`.is-item-row[data-item-id="${itemId}"]`).forEach(row => {
    row.classList.toggle('in-cart', checked);
  });
  _bisUpdateCartPanel();
}

function bisRemoveCart(ck) {
  const e = _bisCart.get(ck);
  if (!e) return;
  _bisCart.delete(ck);
  _gsLastExported = false;
  // 현재 뷰에서 같은 context면 체크 해제
  document.querySelectorAll(`.is-item-row[data-item-id="${e.itemId}"] .is-cart-chk`).forEach(cb => cb.checked = false);
  document.querySelectorAll(`.is-item-row[data-item-id="${e.itemId}"]`).forEach(row => row.classList.remove('in-cart'));
  _bisUpdateCartPanel();
}

function bisClearCart() {
  _bisCart.clear();
  _gsLastExported = false;
  document.querySelectorAll('.is-cart-chk').forEach(cb => cb.checked = false);
  document.querySelectorAll('.is-item-row').forEach(row => row.classList.remove('in-cart'));
  _bisUpdateCartPanel();
}

function _bisUpdateCartPanel() {
  const panel = document.getElementById('is-cart-list');
  if (!panel) return;

  // 그룹화: activeKey > phase > slot
  const groups = new Map(); // activeKey → Map(phase → Map(slot → [entries]))
  for (const [ck, e] of _bisCart) {
    if (!groups.has(e.activeKey)) groups.set(e.activeKey, new Map());
    const byPhase = groups.get(e.activeKey);
    if (!byPhase.has(e.phase)) byPhase.set(e.phase, new Map());
    const bySlot = byPhase.get(e.phase);
    if (!bySlot.has(e.slot)) bySlot.set(e.slot, []);
    bySlot.get(e.slot).push({ ck, ...e });
  }

  let html = '';
  for (const [ak, byPhase] of groups) {
    const firstEntry = [...byPhase.values()][0];
    const firstSlot  = firstEntry ? [...firstEntry.values()][0] : null;
    const sample     = firstSlot?.[0];
    const groupLabel = sample ? `${sample.classKo} · ${sample.specKo}` : ak;
    html += `<div class="is-cart-group-hd">${groupLabel}</div>`;

    for (const [phase, bySlot] of byPhase) {
      html += `<div class="is-cart-phase-hd">${phase.toUpperCase()}</div>`;
      for (const [slot, entries] of bySlot) {
        const slotKr = BIS_SLOT_KR[slot] || slot;
        html += `<div class="is-cart-slot-hd">${slotKr}</div>`;
        for (const e of entries) {
          const id     = e.itemId;
          const cached = _bisWhCache[id];
          const name   = cached?.name || `#${id}`;
          const icon   = cached?.icon || BIS_ICON_FB;
          const qc     = cached ? (BIS_QUALITY_COLOR[cached.qualityId] || '#9d9d9d') : '#9d9d9d';
          const meta   = _bisData?.[ak]?.slots.find(s => s.slot === slot)?.[phase]?.find(it => it.item_id === id);
          const activeSrc = meta?.source && Object.keys(meta.source).length ? meta.source : cached?.source;
          const srcTxt = _bisSrcDetail(activeSrc);
          html += `<div class="is-cart-item">
            <img class="is-cart-item-icon" src="${icon}" onerror="this.src='${BIS_ICON_FB}'" alt="">
            <div class="is-cart-item-info">
              <div class="is-cart-item-name" style="color:${qc}">${name}</div>
              <div class="is-cart-item-src">${srcTxt}</div>
            </div>
            <button class="is-cart-item-rm" onclick="bisRemoveCart('${e.ck}')" title="제거">×</button>
          </div>`;
        }
      }
    }
  }
  panel.innerHTML = html;

  // Google Sheets 버튼 상태
  const gsArea = document.getElementById('bisGsArea');
  const gsBtn  = document.getElementById('bisGsBtn');
  if (gsArea && gsBtn) {
    gsArea.style.display = _bisCart.size ? '' : 'none';
    if (_gsLastExported) {
      gsBtn.innerHTML = '✓ 복사됨 — 새 시트에 Ctrl+V';
      gsBtn.className = 'is-gs-btn open';
    } else {
      gsBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="5" y="3" width="14" height="18" rx="2"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg> 구글 시트로 열기 (Ctrl V를 눌러주세요!)';
      gsBtn.className = 'is-gs-btn';
    }
    gsBtn.onclick = bisExportToSheet;
  }
}


// ── Google Sheets 내보내기 (클립보드 TSV + sheets.new) ─────────
let _gsLastExported = false;

function _bisCartSrcParts(itemId, activeKey, phase, slot) {
  if (_bisData && activeKey && phase && slot) {
    const sd = _bisData[activeKey]?.slots.find(s => s.slot === slot);
    const it = sd?.[phase]?.find(x => x.item_id === itemId);
    if (it?.source?.source_type) {
      const s = it.source;
      return { type: s.source_type || '', ko: s.source_ko || '', location: s.source_location || '' };
    }
  }
  const ws = _bisWhCache[itemId]?.source;
  if (ws?.source_type && ws.source_type !== '알 수 없음') {
    return { type: ws.source_type || '', ko: ws.source_ko || '', location: ws.source_location || '' };
  }
  return { type: '', ko: '', location: '' };
}

async function bisExportToSheet() {
  if (!_bisCart.size) return;

  // TSV 생성 (헤더 + 데이터 행)
  const rows = [['직업', '특성', '페이즈', '슬롯', '이미지', '아이템명', '출처 유형', '세부 출처', '위치']];
  for (const [, e] of _bisCart) {
    const id   = e.itemId;
    const src  = _bisCartSrcParts(id, e.activeKey, e.phase, e.slot);
    const icon = _bisWhCache[id]?.icon || '';
    const slotKr = BIS_SLOT_KR[e.slot] || e.slot;
    rows.push([
      e.classKo,
      e.specKo,
      e.phase.toUpperCase(),
      slotKr,
      icon ? `=IMAGE("${icon}")` : '',
      _bisWhCache[id]?.name || `#${id}`,
      src.type,
      src.ko,
      src.type === '전문 기술' ? '' : src.location,
    ]);
  }
  const tsv = rows.map(r => r.map(c => String(c).replace(/[\t\n]/g, ' ')).join('\t')).join('\n');

  const gsBtn = document.getElementById('bisGsBtn');
  try {
    await navigator.clipboard.writeText(tsv);
    window.open('https://sheets.new', '_blank');
    _gsLastExported = true;
    _bisUpdateCartPanel();
  } catch (_) {
    // clipboard 실패 시 textarea fallback
    const ta = document.createElement('textarea');
    ta.value = tsv;
    ta.style.cssText = 'position:fixed;top:-9999px';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    window.open('https://sheets.new', '_blank');
    _gsLastExported = true;
    _bisUpdateCartPanel();
  }
}

// ── 일괄 Wowhead fetch (동시 worker N개로 풀 가동, 느린 응답이 빠른 응답 막지 않음) ──
async function _bisBatchFetch(ids) {
  const fc = document.getElementById('is-filter-col');
  fc?.classList.add('is-filter-loading');
  const CONCURRENCY = 8;
  let cursor = 0;
  const worker = async () => {
    while (cursor < ids.length) {
      const id = ids[cursor++];
      try {
        const data = await _bisWhFetch(id);
        if (data) _bisUpdateRows(id, data);
      } catch (_) {}
    }
  };
  try {
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, ids.length) }, worker));
  } finally {
    fc?.classList.remove('is-filter-loading');
  }
}

function _bisUpdateRows(itemId, data) {
  const qc = BIS_QUALITY_COLOR[data.qualityId] || '#9d9d9d';
  document.querySelectorAll(`.is-item-row[data-item-id="${itemId}"]`).forEach(row => {
    const nameEl = row.querySelector('.is-item-name');
    const iconEl = row.querySelector('.is-icon');
    if (nameEl) { nameEl.textContent = data.name; nameEl.style.color = qc; nameEl.classList.remove('loading'); }
    if (iconEl) { iconEl.src = data.icon; iconEl.style.borderColor = qc + '55'; iconEl.classList.remove('loading'); }
  });
  // source sub — tbca JSON source가 이미 있으면 건드리지 않고 wowhead source는 캐싱만
  const srcEl = document.getElementById(`is-item-src-${itemId}`);
  if (srcEl && !srcEl.textContent.trim()) {
    const txt = _bisSrcDetail(data.source);
    if (txt) srcEl.innerHTML = txt;
  }
  // 장바구니 패널도 갱신 (해당 아이템이 담겨있으면)
  if ([..._bisCart.values()].some(e => e.itemId === itemId)) _bisUpdateCartPanel();
}

// ── Wowhead XML fetch ────────────────────────────────────────
async function _bisWhFetch(itemId) {
  const cached = _bisWhCache[itemId];
  const spellId = _bisSpellIdMap[itemId];
  // 전문 기술 아이템이고 재료 없으면 캐시 무시하고 재fetch
  if (cached && (!spellId || (cached.reagents && cached.reagents.length))) return cached;

  const itemUrl = `${window.PROXY_HOST}/wowhead-xml/tbc/${itemId}`;
  try {
    const r = await fetch(itemUrl, { signal: AbortSignal.timeout(8000) });

    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const xml = await r.text();
    const parser = new DOMParser();
    const doc    = parser.parseFromString(xml, 'application/xml');

    const name      = doc.querySelector('item > name')?.textContent || `#${itemId}`;
    const iconName  = doc.querySelector('item > icon')?.textContent || '';
    const icon      = iconName ? BIS_ICON_BASE + iconName + '.jpg' : BIS_ICON_FB;
    const qualityId = +(doc.querySelector('item > quality')?.getAttribute('id') ?? 1);
    const ttNode    = doc.querySelector('htmlTooltip');
    const html      = ttNode?.textContent || '';
    const source    = _bisParseSource(xml);

    // item XML createdBy 먼저, 없으면 nether spell tooltip에서 파싱
    const reagents = [];
    doc.querySelectorAll('createdBy spell reagent').forEach(r => {
      reagents.push({ name: r.getAttribute('name'), quality: +r.getAttribute('quality'), icon: r.getAttribute('icon'), count: +r.getAttribute('count') });
    });
    if (!reagents.length && spellId) {
      const spellReagents = await _bisSpellFetchReagents(spellId);
      reagents.push(...spellReagents);
    }

    const result = { name, icon, qualityId, html, source, reagents };
    _bisWhCache[itemId] = result;
    _bisWriteLSCache(itemId, result);
    return result;
  } catch(e) {
    return null;
  }
}

// nether.wowhead.com spell tooltip에서 재료 파싱
async function _bisSpellFetchReagents(spellId) {
  try {
    const r = await fetch(`https://nether.wowhead.com/tbc/tooltip/spell/${spellId}?locale=ko`, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return [];
    const data = await r.json();
    const tooltip = data.tooltip || '';

    // 재료: 섹션 추출 (indent q1 div)
    const secMatch = tooltip.match(/재료:<br \/><div class="indent q1">([\s\S]*?)<\/div>/);
    if (!secMatch) return [];

    const section = secMatch[1];
    const ids = [];
    const linkRe = /href="[^"]*\/item=(\d+)\/[^"]*">([^<]*)<\/a>(?:&nbsp;\((\d+)\))?/g;
    let m;
    while ((m = linkRe.exec(section)) !== null) {
      ids.push({ itemId: +m[1], name: m[2], count: m[3] ? +m[3] : 1 });
    }
    if (!ids.length) return [];

    // 각 재료 아이콘/품질 보완
    const reagents = await Promise.all(ids.map(async ({ itemId, name, count }) => {
      try {
        const ir = await fetch(`https://nether.wowhead.com/tbc/tooltip/item/${itemId}?locale=ko`, { signal: AbortSignal.timeout(8000) });
        if (ir.ok) {
          const d = await ir.json();
          return { name: d.name || name, quality: d.quality ?? 1, icon: d.icon || '', count };
        }
      } catch(_) {}
      return { name, quality: 1, icon: '', count };
    }));
    return reagents;
  } catch(_) {
    return [];
  }
}

function _bisParseSource(xmlText) {
  const srcMatch   = xmlText.match(/"source":\[(\d+)\]/);
  const smMatch    = xmlText.match(/"sourcemore":\[(\{[^\]]*\})\]/);
  const arenaMatch = xmlText.match(/"reqarenartng":(\d+)/);

  if (!srcMatch) return { source_type:'알 수 없음', source_ko:'' };

  const srcCode = +srcMatch[1];
  let source_type, source_ko = '';

  if (srcCode === 5) {
    if (arenaMatch) {
      source_type = 'PvP';
      source_ko   = `투기장 점수 (레이팅 ${arenaMatch[1]}+)`;
    } else if (!smMatch) {
      source_type = 'PvP';
      source_ko   = '명예 점수';
    } else {
      source_type = '상인';
    }
  } else {
    source_type = _SRC_TYPE_MAP[srcCode] || '알 수 없음';
  }

  if (smMatch) {
    const sm = smMatch[1];
    const nMatch = sm.match(/"n":"([^"]+)"/);
    const pMatch = sm.match(/"p":(\d+)/);
    if (srcCode === 3 && pMatch) {
      source_ko = _PROF_MAP[+pMatch[1]] || '전문 기술';
    } else if (nMatch && !source_ko) {
      source_ko = nMatch[1];
    }
  }

  if (srcCode === 3 && source_ko) {
    source_ko = source_ko.replace(/\((\d+)\)(\s*\(\d+\))?/, '(숙련도 $1)');
  }

  return { source_type, source_ko };
}

function _bisSrcDetail(src) {
  if (!src || !src.source_type || src.source_type === '알 수 없음') return '';
  const st = _SRC_STYLE[src.source_type] || _SRC_STYLE['알 수 없음'];
  const isProf = src.source_type === '전문 기술';
  let ko = src.source_ko || '';
  if (isProf && ko) ko = ko.replace(/\((\d+)\)/, '(숙련도 $1)');
  let txt = `<span style="color:${st.col};font-weight:700">${src.source_type}</span>`;
  if (ko)                           txt += ` · <span style="color:var(--text)">${ko}</span>`;
  if (src.source_location && !isProf) txt += ` <span style="color:var(--text3)">(${src.source_location})</span>`;
  return txt;
}

function _bisReagentHTML(reagents) {
  if (!reagents || !reagents.length) return '';
  const rows = reagents.map(r => {
    const col = BIS_QUALITY_COLOR[r.quality] || '#9d9d9d';
    return `<div class="is-wh-reagent"><img class="is-wh-reagent-icon" src="${BIS_ICON_BASE}${r.icon}.jpg"><span class="is-wh-reagent-name" style="color:${col}">${r.name}</span><span class="is-wh-reagent-count">×${r.count}</span></div>`;
  }).join('');
  return `<div class="is-wh-reagents"><div class="is-wh-reagents-title">재료</div>${rows}</div>`;
}

// ── Wowhead 툴팁 표시 ────────────────────────────────────────
async function bisShowTT(iconEl, itemId) {
  const tt    = document.getElementById('is-wh-tooltip');
  const inner = document.getElementById('is-wh-tt-inner');
  if (!tt || !inner) return;

  const cached = _bisWhCache[itemId];
  if (cached) {
    inner.innerHTML = (cached.html || `<div class="is-wh-tt-loading">#${itemId}</div>`) + _bisReagentHTML(cached.reagents);
  } else {
    inner.innerHTML = `<div class="is-wh-tt-loading">로딩 중...</div>`;
    tt.style.display = 'block';
    _bisPosTT(iconEl, tt);
    const data = await _bisWhFetch(itemId);
    if (!tt || tt.style.display === 'none') return;
    if (data) {
      _bisUpdateRows(itemId, data);
      inner.innerHTML = (data.html || `<div class="is-wh-tt-loading">#${itemId}</div>`) + _bisReagentHTML(data.reagents);
    } else {
      inner.innerHTML = `<div class="is-wh-tt-loading" style="color:#d4918e">툴팁 없음 (#${itemId})</div>`;
    }
  }
  tt.style.display = 'block';
  _bisPosTT(iconEl, tt);
}

function _bisPosTT(iconEl, tt) {
  const r   = iconEl.getBoundingClientRect();
  const gap = 10;
  const ttW = 300;
  const ttH = tt.offsetHeight || 200;
  const vw  = window.innerWidth;
  const vh  = window.innerHeight;

  // 오른쪽 공간 있으면 오른쪽, 없으면 왼쪽
  let x = r.right + gap;
  if (x + ttW > vw) x = r.left - ttW - gap;
  x = Math.max(6, Math.min(x, vw - ttW - 6));

  // 아이콘 상단 기준, 아래로 넘치면 위로 올림
  let y = r.top;
  if (y + ttH > vh) y = vh - ttH - 6;
  y = Math.max(6, y);

  tt.style.left = x + 'px';
  tt.style.top  = y + 'px';
}

function bisHideTT() {
  const tt = document.getElementById('is-wh-tooltip');
  if (tt) tt.style.display = 'none';
}

