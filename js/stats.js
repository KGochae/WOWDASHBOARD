// ── 통계 내부 탭 전환 ─────────────────────────────────────────
const _stMainTitle={
  rank:'WAKTAVERSE STATS 랭킹',
  skill:'직업별 스킬 트리 통계',
};
function switchStTab(tab){
  const _rankNoticeKey=(()=>{const d=new Date();return d.toLocaleDateString();})();
  if(tab==='rank' && localStorage.getItem('rankNoticeShown')!==_rankNoticeKey){
    localStorage.setItem('rankNoticeShown',_rankNoticeKey);
    const ov=document.createElement('div');
    ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center';
    const box=document.createElement('div');
    box.style.cssText='background:#1a1a2e;color:#fff;padding:28px 32px;border-radius:12px;font-size:15px;line-height:1.8;max-width:500px;width:90%;box-shadow:0 8px 32px rgba(0,0,0,.5)';
    box.innerHTML='<div style="font-size:13px;font-weight:600;letter-spacing:.05em;color:#7b8ebd;margin-bottom:12px">📢 Blizzard API 데이터 안내</div><p style="margin:0 0 6px;color:#e0e4f0">해당 능력치는 유저가 <strong>마지막으로 로그아웃된 시점</strong>의 데이터가 정각마다 <br>업데이트되고 있습니다.</p><p style="margin:0 0 8px;color:#aab0c4;font-size:14px">• 메인 아이템이 장착되어 있지 않다면 기어스코어가 낮게 측정될 수 있으니 확인해주세요!(EX.낚시대) </p><p style="margin:0 0 20px;color:#aab0c4;font-size:14px">• 또한 로그아웃 전, 버프를 전부 해제하고 로그아웃 해주시면 좀 더 정확한 비교가 가능합니다. 감사합니다🥲</p><div style="text-align:right"><button onclick="this.closest(\'[style*=fixed]\').remove()" style="background:#4e7bef;color:#fff;border:none;padding:8px 24px;border-radius:6px;cursor:pointer;font-size:14px">확인</button></div>';
    ov.appendChild(box);
    document.body.appendChild(ov);
  }
  ['rank','skill'].forEach(t=>{
    document.getElementById(`sttab-${t}`)?.classList.toggle('active',t===tab);
    const p=document.getElementById(`stpanel-${t}`);
    if(p) p.style.display=t===tab?'flex':'none';
  });
  const _sHash={rank:'스탯랭킹',skill:'특성인챈트통계'};
  if(_sHash[tab]) _setHash(_sHash[tab]);
  // 헤더 타이틀 업데이트
  const title=document.getElementById('stTitleMain');
  if(title) title.textContent=_stMainTitle[tab]||'';
  const sub=document.getElementById('stTitleSub');
  if(sub) sub.textContent=tab==='skill'?'길드원들이 어떤 스킬트리를 주로 선택하는지 확인해보세요. 현재 활성화된 스킬데이터를 기준으로 집계됩니다.':'';
  // 드롭다운 active 표시
  document.querySelectorAll('.v-dropdown-item').forEach(el=>{
    el.classList.toggle('active', el.dataset.tab===tab);
  });
  if(tab==='skill') initSkillStatsTab();
}

let _stCurrentMode='rank';
function switchStMode(mode){
  _stCurrentMode=mode;
  const filterCol=document.getElementById('stRankFilterCol');
  const lbBtn=document.getElementById('stModeLbBtn');
  const gdBtn=document.getElementById('stModeGuildBtn');
  const body=document.getElementById('stClsBody');
  if(mode==='guild'){
    filterCol?.classList.add('collapsed');
    lbBtn?.classList.remove('active');
    gdBtn?.classList.add('active');
    const gdRankCol=document.getElementById('gdRankFilterCol');
    if(gdRankCol) gdRankCol.style.display='flex';
    if(body){
      body.innerHTML=`<div class="gd-act-chart-wrap">
        <div class="gd-card">
          <div class="gd-ch">
            <span class="gd-ct">등급별 접속률</span>
            <span id="gdActNoDataNote" style="font-size:10px;color:var(--text3);font-weight:500;letter-spacing:0;text-transform:none;margin-right:auto;padding-left:8px"></span>
            <div id="gdActLineGran" class="gd-act-gran"></div>
            <button id="gdActMonthBtn" class="gd-month-btn" onclick="_actLineOpenCal(this)">전체 ▾</button>
          </div>
          <div id="gdActLineChart"></div>
        </div>
        <div class="gd-card">
          <div class="gd-ch"><span class="gd-ct">접속 현황</span></div>
          <div id="gdActFunnel"></div>
        </div>
      </div>
      <div class="gd-gs-dist-wrap">
        <div class="gd-card">
          <div class="gd-ch"><span class="gd-ct">직업 비율</span></div>
          <div id="gdGsPie" style="flex:1;min-height:0;overflow:visible;padding:3px;box-sizing:border-box;"></div>
        </div>
        <div class="gd-card">
          <div class="gd-ch"><span class="gd-ct">기어스코어 분포도</span></div>
          <div id="gdGsChart" style="flex:1;min-height:0;"></div>
        </div>
      </div>
      <div class="gd-attend-rank-wrap">
        <div class="gd-card">
          <div class="gd-ch"><span class="gd-ct">스트리머 접속 랭킹</span><span style="font-size:10px;color:var(--text3);font-weight:500;letter-spacing:0;text-transform:none;padding-left:8px">※ 유저마다 데이터 권한 허용 시점이 다르기 때문에 오차가 존재합니다.</span><button id="gdAttendMonthBtn" class="gd-month-btn" style="margin-left:auto" onclick="attendOpenMonthCal(this)">— ▾</button><div class="st-rank-search-wrap" style="width:fit-content;margin-left:8px;padding-bottom:0"><input id="gdAttendSearch" class="st-rank-search" type="text" placeholder="닉네임 검색..." onkeydown="if(event.key==='Enter')gdAttendSearchFn()"/><button class="st-rank-search-btn" onclick="gdAttendSearchFn()">이동</button></div></div>
          <div id="gdAttendRank"></div>
        </div>
      </div>`;
      buildGuildActivityChart();
      _buildActActivityCard();
      buildGsDistChart();
      _buildAttendRankTable();
    }
  } else {
    filterCol?.classList.remove('collapsed');
    lbBtn?.classList.add('active');
    gdBtn?.classList.remove('active');
    const gdRankCol2=document.getElementById('gdRankFilterCol');
    if(gdRankCol2) gdRankCol2.style.display='none';
    if(body) body.innerHTML='<div id="stClsRank" class="st-cls-rank-list"><div id="stRankLoading" class="st-rank-loading"><div class="st-rank-spinner"></div></div></div>';
    if(typeof stRenderClassTable==='function') stRenderClassTable(_stActiveClass);
  }
}

// ── 헤더 드롭다운 ────────────────────────────────────────────
function toggleStatsDropdown(){
  const dd=document.getElementById('statsDropdown');
  dd.classList.toggle('open');
}
function goStatsTab(tab){
  document.getElementById('statsDropdown').classList.remove('open');
  switchVTab('stats');
  switchStTab(tab);
  if(typeof window.logFA==='function')window.logFA('stat_ranking',{tab});
}
// 외부 클릭 시 드롭다운 닫기
document.addEventListener('click',e=>{
  const wrap=document.getElementById('vtab-stats-wrap');
  if(wrap&&!wrap.contains(e.target)){
    document.getElementById('statsDropdown')?.classList.remove('open');
  }
});

// ── 검색 ────────────────────────────────────────────────────
function searchChar(){
  const name=document.getElementById('landingInput').value.trim();
  const errEl=document.getElementById('landingError');
  if(!name)return;
  if(CHAR_DB[name]||SPEC_DB[name]||STATS_DB[name]||GUILD_DB[name]){
    errEl.classList.remove('show');showViewer();switchVTab('viewer');selectChar(name);
    if(typeof syncSidebarToChar==='function')syncSidebarToChar(name);
    if(typeof window.logFA==='function')window.logFA('search_character',{name});
  }else{errEl.classList.add('show');document.getElementById('landingErrorMsg').textContent=`"${name}" — 해당 유저가 없습니다.`;}
}
function searchFromViewer(){
  const name=document.getElementById('viewerInput').value.trim();
  if(!name)return;
  if(CHAR_DB[name]||SPEC_DB[name]||STATS_DB[name]||GUILD_DB[name]){
    switchVTab('viewer');selectChar(name);document.getElementById('viewerInput').value='';
    if(typeof window.logFA==='function')window.logFA('search_character',{name});
  }else addLog(`❌ "${name}" — 해당 유저가 없습니다`,'err');
}

// ── CLASS별 포지션 정의 ───────────────────────────────────────
const CLASS_POSITION={
  '전사':  {pos:'탱커/딜러', stats:[
    {k:'gear_score',     l:'기어스코어',  fmt:v=>Math.round(v)},
    // 딜
    {k:'attack_power',   l:'공격력',      fmt:v=>Math.round(v)},
    {k:'main_hand_dps',  l:'메인핸드DPS', fmt:v=>v.toFixed(1)},
    {k:'melee_crit',     l:'근접치명타',  fmt:v=>`${v.toFixed(1)}%`},
    {k:'hit_rating',     l:'적중도',      fmt:v=>Math.round(v)},
     // 방어
    {k:'health',         l:'생명력',      fmt:v=>Math.round(v).toLocaleString()},
    {k:'armor_effective',l:'방어도',      fmt:v=>Math.round(v).toLocaleString()},
    {k:'defense_effective',l:'방어숙련',  fmt:v=>Math.round(v)},
    {k:'dodge',           l:'회피',  fmt:v=>`${v.toFixed(1)}%`},
    ]},
  '성기사':{pos:'탱커/힐러/딜러', stats:[
    {k:'gear_score',     l:'기어스코어',  fmt:v=>Math.round(v)},
    // 딜
    {k:'attack_power',   l:'공격력',      fmt:v=>Math.round(v)},
    {k:'spell_power',    l:'주문력',      fmt:v=>Math.round(v)},
    {k:'healing_power',  l:'치유증가량',  fmt:v=>Math.round(v)},
    {k:'spell_dmg',      l:'공격증가량',  fmt:v=>Math.round(v)},
    {k:'intellect_effective',l:'지능',    fmt:v=>Math.round(v)},
    // 방어
    {k:'health',         l:'생명력',      fmt:v=>Math.round(v).toLocaleString()},
    {k:'power',          l:'마나',        fmt:v=>Math.round(v).toLocaleString()},
    {k:'defense_effective',l:'방어숙련',  fmt:v=>Math.round(v)},
    {k:'armor_effective',l:'방어도',      fmt:v=>Math.round(v).toLocaleString()},
    {k:'dodge',           l:'회피',  fmt:v=>`${v.toFixed(1)}%`},


  ]},

  '사냥꾼':{pos:'원거리 딜러', stats:[
    {k:'gear_score',     l:'기어스코어',  fmt:v=>Math.round(v)},
    // 딜 
    {k:'attack_power',   l:'공격력',      fmt:v=>Math.round(v)},
    {k:'agility_effective',l:'민첩',      fmt:v=>Math.round(v)},
    {k:'main_hand_dps',  l:'메인핸드DPS', fmt:v=>v.toFixed(1)},
    {k:'hit_rating',     l:'적중도',      fmt:v=>Math.round(v)},
    {k:'crit_rating',    l:'치명타적중도', fmt:v=>Math.round(v)},
    {k:'ranged_crit',    l:'원거리치명타',fmt:v=>`${v.toFixed(1)}%`}, 
    // 방어
    {k:'health',         l:'생명력',      fmt:v=>Math.round(v).toLocaleString()},


  ]},

  '도적':  {pos:'근접 딜러', stats:[
    {k:'gear_score',     l:'기어스코어',  fmt:v=>Math.round(v)},
    {k:'attack_power',   l:'공격력',      fmt:v=>Math.round(v)},
    {k:'main_hand_dps',  l:'메인핸드DPS', fmt:v=>v.toFixed(1)},
    {k:'off_hand_dps',   l:'오프핸드DPS', fmt:v=>v.toFixed(1)},
    {k:'melee_crit',     l:'근접치명타',  fmt:v=>`${v.toFixed(1)}%`},
    {k:'hit_rating',     l:'적중도',      fmt:v=>Math.round(v)},
    {k:'crit_rating',    l:'치명타적중도', fmt:v=>Math.round(v)},
    {k:'agility_effective',l:'민첩',      fmt:v=>Math.round(v)},
    {k:'health',         l:'생명력',      fmt:v=>Math.round(v).toLocaleString()},

  ]},
  '사제':  {pos:'힐러/딜러', stats:[
    {k:'gear_score',     l:'기어스코어',  fmt:v=>Math.round(v)},
    {k:'healing_power',  l:'치유증가량',  fmt:v=>Math.round(v)},
    {k:'spell_dmg',      l:'공격증가량',  fmt:v=>Math.round(v)},
    {k:'spell_power',    l:'주문력',      fmt:v=>Math.round(v)},
    {k:'intellect_effective',l:'지능',    fmt:v=>Math.round(v)},
    {k:'spirit_effective',l:'정신',       fmt:v=>Math.round(v)},
    {k:'health',         l:'생명력',      fmt:v=>Math.round(v).toLocaleString()},
    {k:'power',          l:'마나',        fmt:v=>Math.round(v).toLocaleString()},
    {k:'spell_crit',     l:'주문치명타',  fmt:v=>`${v.toFixed(1)}%`},
    {k:'mana_regen',     l:'마나재생',    fmt:v=>`${Math.round(v)}/5s`},



  ]},
  '주술사':{pos:'힐러/딜러', stats:[
    {k:'gear_score',     l:'기어스코어',  fmt:v=>Math.round(v)},
    {k:'spell_power',    l:'주문력',      fmt:v=>Math.round(v)},
    {k:'intellect_effective',l:'지능',    fmt:v=>Math.round(v)},
    {k:'health',         l:'생명력',      fmt:v=>Math.round(v).toLocaleString()},
    {k:'power',          l:'마나',        fmt:v=>Math.round(v).toLocaleString()},
    {k:'healing_power',  l:'치유증가량',  fmt:v=>Math.round(v)},
    {k:'spell_dmg',      l:'공격증가량',  fmt:v=>Math.round(v)},
    {k:'attack_power',   l:'공격력',      fmt:v=>Math.round(v)},
    {k:'hit_rating',     l:'적중도',      fmt:v=>Math.round(v)},
    {k:'mana_regen',     l:'마나재생',    fmt:v=>`${Math.round(v)}/5s`},

  ]},
  '마법사':{pos:'원거리 딜러', stats:[
    {k:'gear_score',     l:'기어스코어',  fmt:v=>Math.round(v)},
    {k:'spell_power',    l:'주문력',      fmt:v=>Math.round(v)},
    {k:'spell_crit',     l:'주문치명타',  fmt:v=>`${v.toFixed(1)}%`},
    {k:'spell_hit_rating',l:'주문적중도', fmt:v=>Math.round(v)},
    {k:'spell_crit_rating',l:'극대화적중도', fmt:v=>Math.round(v)},
    {k:'spell_penetration',l:'마법관통',  fmt:v=>Math.round(v)},
    {k:'mana_regen',     l:'마나재생',    fmt:v=>`${Math.round(v)}/5s`},
    {k:'intellect_effective',l:'지능',    fmt:v=>Math.round(v)},
    {k:'health',         l:'생명력',      fmt:v=>Math.round(v).toLocaleString()},
    {k:'power',          l:'마나',        fmt:v=>Math.round(v).toLocaleString()},


  ]},
  '흑마법사':{pos:'원거리 딜러', stats:[
    {k:'gear_score',     l:'기어스코어',  fmt:v=>Math.round(v)},
    {k:'spell_power',    l:'주문력',      fmt:v=>Math.round(v)},
    {k:'spell_crit',     l:'주문치명타',  fmt:v=>`${v.toFixed(1)}%`},
    {k:'spell_hit_rating',l:'주문적중도', fmt:v=>Math.round(v)},
    {k:'spell_crit_rating',l:'극대화적중도', fmt:v=>Math.round(v)},
    {k:'mana_regen',     l:'마나재생',    fmt:v=>`${Math.round(v)}/5s`},
    {k:'intellect_effective',l:'지능',    fmt:v=>Math.round(v)},
    {k:'health',         l:'생명력',      fmt:v=>Math.round(v).toLocaleString()},
    {k:'power',          l:'마나',        fmt:v=>Math.round(v).toLocaleString()},


  ]},
  '드루이드':{pos:'탱커/힐러/딜러', stats:[
    {k:'gear_score',     l:'기어스코어',  fmt:v=>Math.round(v)},
    {k:'attack_power',   l:'공격력',      fmt:v=>Math.round(v)},
    {k:'spell_power',    l:'주문력',      fmt:v=>Math.round(v)},
    {k:'healing_power',  l:'치유증가량',  fmt:v=>Math.round(v)},
    {k:'spell_dmg',      l:'공격증가량',  fmt:v=>Math.round(v)},
    // 방어
    {k:'health',         l:'생명력',      fmt:v=>Math.round(v).toLocaleString()},
    {k:'power',          l:'마나',        fmt:v=>Math.round(v).toLocaleString()},
    {k:'defense_effective',l:'방어숙련',  fmt:v=>Math.round(v)},
    {k:'armor_effective',l:'방어도',      fmt:v=>Math.round(v).toLocaleString()},
    {k:'mana_regen',     l:'마나재생',    fmt:v=>`${Math.round(v)}/5s`},


  ]},
};

// ── 통계 페이지 렌더 ──────────────────────────────────────────
let _stActiveClass='';
let _stSortKey='';
let _stRankFilter=new Set(['버튜버','고정멤버']); // 기본값: 버튜버+고정멤버
let _stRankPage=0;
let _attendRankPage=0;
let _attendRankMonth=new Date().getMonth()+1;
let _attendRankRows=[];
let _stHealerMode=false;
const MAIN_RANKS=new Set(['길드마스터','고정멤버','버튜버']);

// 랭크 필터 버튼 정의 (버튜버 버튼은 길드마스터 포함)
const _RANK_FILTER_GROUPS={
  '버튜버':  ['버튜버','길드마스터'],
  '고정멤버':['고정멤버'],
  '네임드':  ['네임드'],
  '점핑권':  ['점핑권'],
  '스윗기사단':['스윗기사단'],
  '시청자':  ['시청자'],  
};
const _RANK_FILTER_COLORS={
  '버튜버':'#d4789a','고정멤버':'#7ec8a0',
  '네임드':'#b07adb','점핑권':'#88aacc','시청자':'#787878',
  '스윗기사단':'#b07adb'
};

function _stFilteredNames(){
  if(!_stRankFilter.size) return Object.keys(GUILD_DB);
  const allowed=new Set();
  for(const key of _stRankFilter)
    (_RANK_FILTER_GROUPS[key]||[key]).forEach(r=>allowed.add(r));
  return Object.entries(GUILD_DB)
    .filter(([,gm])=>allowed.has(gm.rank_name))
    .map(([name])=>name);
}

function stToggleRank(key){
  if(_stRankFilter.has(key)) _stRankFilter.delete(key);
  else _stRankFilter.add(key);
  _stUpdateRankFilter();
  _stSortKey='';_stRankPage=0;
  if(_stHealerMode) stRenderHealerRank();
  else stRenderClassTable(_stActiveClass);
}

function _stUpdateRankFilter(){
  document.querySelectorAll('#stRankFilter .st-rank-btn').forEach(btn=>{
    const key=btn.dataset.rank;
    const on=_stRankFilter.has(key);
    const col=_RANK_FILTER_COLORS[key]||'#aaa';
    btn.classList.toggle('active',on);
    btn.style.color=on?col:'';
    btn.style.borderColor=on?col+'88':'';
    btn.style.background=on?col+'22':'';
  });
  // 구 체크박스 동기화
  const isVtuberOnly=_stRankFilter.size===1&&_stRankFilter.has('버튜버');
  ['chkVtuberOnly','chkVtuberOnly2'].forEach(id=>{
    const el=document.getElementById(id);if(el)el.checked=isVtuberOnly;
  });
}

function toggleVtuberOnly(v){
  _stRankFilter=v?new Set(['버튜버']):new Set();
  _stUpdateRankFilter();
  _stSortKey='';
  _renderStatsFull();
}
function _renderStatsFull(){
  _activeRole='딜러';
  const panel=document.getElementById('stRoleRankPanel');
  if(panel){panel.classList.remove('open');panel.innerHTML='';}
  stRenderClassTable(_stActiveClass );
}

// ── CLASS 랭킹 접기/펼치기 ────────────────────────────────────
let _stSortDir='desc'; // 'asc' | 'desc'

function _stClassColors(){
  const m={};
  Object.entries(GUILD_DB).forEach(([name,gm])=>{
    const cid=CLASS_NAME_TO_ID[gm.class_name];
    if(cid) m[name]=CLASS_COLOR[cid]||'#909090';
  });
  return m;
}

function renderStatsPage(){
  const data=Object.values(STATS_DB_V2);
  if(!data.length) return;
  const existingClasses=[...new Set(
    Object.values(GUILD_DB).map(g=>g.class_name).filter(c=>c&&CLASS_POSITION[c])
  )].sort((a, b) => b.localeCompare(a));
  const DEFAULT_CLASS='흑마법사';
  if(!_stActiveClass||!existingClasses.includes(_stActiveClass))
    _stActiveClass=existingClasses.includes(DEFAULT_CLASS)?DEFAULT_CLASS:(existingClasses[0]||'');

  // 랭크 필터 버튼 빌드
  const rankFilterEl=document.getElementById('stRankFilter');
  if(rankFilterEl){
    const existingRanks=new Set(Object.values(GUILD_DB).map(g=>g.rank_name).filter(Boolean));
    const visibleKeys=Object.keys(_RANK_FILTER_GROUPS).filter(key=>
      (_RANK_FILTER_GROUPS[key]||[key]).some(r=>existingRanks.has(r))
    );
    rankFilterEl.innerHTML=visibleKeys.map(key=>
      `<div class="sidebar-cat st-rank-btn" data-rank="${key}" role="button" tabindex="0"
        onclick="stToggleRank('${key}')">${key}</div>`
    ).join('');
    _stUpdateRankFilter();
    try{localStorage.setItem('stRankFilterHTML',rankFilterEl.innerHTML);}catch(e){}
  }

  const picker=document.getElementById('stClsPicker');
  if(picker){
    picker.innerHTML='';
    existingClasses.forEach(cls=>{
      const cid=CLASS_NAME_TO_ID[cls];
      const col=CLASS_COLOR[cid]||'var(--gold)';
      const btn=document.createElement('div');
      btn.className='sk-pick-btn';
      btn.textContent=cls;
      btn.dataset.class=cls;
      btn.dataset.color=col;
      btn.onclick=()=>stSetClass(cls);
      picker.appendChild(btn);
    });
    try{localStorage.setItem('stClsPickerHTML',picker.innerHTML);}catch(e){}
  }
  if(_stCurrentMode!=='guild') stRenderClassTable(_stActiveClass);
  _stUpdateClsPicker();
}

function _stUpdateClsPicker(){
  document.querySelectorAll('#stClsPicker .sk-pick-btn').forEach(b=>{
    const col=b.dataset.color;
    const on=b.dataset.class===_stActiveClass;
    b.classList.toggle('active',on);
    b.style.color=on?col:'';
    b.style.borderColor=on?col+'88':'';
    b.style.background=on?col+'22':'';
  });
}
function stSetClass(cls){
  _stHealerMode=false;
  _stActiveClass=cls;
  _stSortKey='';
  _stSortDir='desc';
  _stRankPage=0;
  _stUpdateHealerBtn();
  _stUpdateClsPicker();
  stRenderClassTable(cls);
}

const _HEALER_SPECS=new Set(['신성','수양','복원','회복']);

function _stUpdateHealerBtn(){
  const btn=document.getElementById('stHealerBtn');
  if(!btn) return;
  const col='#7bb899';
  btn.classList.toggle('active',_stHealerMode);
  btn.style.color=_stHealerMode?col:'';
  btn.style.borderColor=_stHealerMode?col+'88':'';
  btn.style.background=_stHealerMode?col+'22':'';
}

function stToggleHealerMode(){
  _stHealerMode=!_stHealerMode;
  _stUpdateHealerBtn();
  if(_stHealerMode){
    stRenderHealerRank();
  }else{
    stRenderClassTable(_stActiveClass);
  }
}

function stRenderHealerRank(){
  const el=document.getElementById('stClsRank');
  if(!el) return;

  const data=Object.values(STATS_DB_V2);
  const filtered=new Set(_stFilteredNames());

  function healPwr(name){
    const d=data.find(d=>d.character_name===name);
    const base=d?.healing_power||0;
    const sp=SPEC_DB[name]?.active?.reduce((b,s)=>s.pts>b.pts?s:b,{pts:0,spec:''})?.spec||'';
    const st=STATS_DB[name]||{};
    const cls=(GUILD_DB[name]||{}).class_name||'';
    if(cls==='성기사'&&sp==='신성') return base+Math.floor((st.intellect_effective||0)*0.35);
    if(cls==='사제'&&sp==='신성') return base+Math.floor((st.spirit_effective||0)*0.25);
    if(cls==='주술사'&&sp==='복원') return base+Math.floor((st.intellect_effective||0)*0.30);
    return base;
  }

  const allRows=Object.entries(GUILD_DB)
    .filter(([name,gm])=>{
      const spec=SPEC_DB[name]?.active?.reduce((b,s)=>s.pts>b.pts?s:b,{pts:0,spec:''})?.spec||'';
      if(!_HEALER_SPECS.has(spec)) return false;
      const d=data.find(d=>d.character_name===name);
      return d&&(d.healing_power>0||d.gear_score>0);
    })
    .map(([name])=>({name,hp:healPwr(name)}))
    .sort((a,b)=>b.hp-a.hp);
  const allHealerCount=allRows.length;
  function trueRank(name){return allRows.findIndex(r=>r.name===name)+1;}

  const rows=Object.entries(GUILD_DB)
    .filter(([name,gm])=>{
      if(!filtered.has(name)) return false;
      const spec=SPEC_DB[name]?.active?.reduce((b,s)=>s.pts>b.pts?s:b,{pts:0,spec:''})?.spec||'';
      return _HEALER_SPECS.has(spec);
    })
    .map(([name,gm])=>{
      const d=data.find(d=>d.character_name===name)||null;
      const spec=SPEC_DB[name]?.active?.reduce((b,s)=>s.pts>b.pts?s:b,{pts:0,spec:''})?.spec||'';
      return {name,gm,d,spec};
    })
    .filter(r=>r.d&&(r.d.healing_power>0||r.d.gear_score>0))
    .sort((a,b)=>healPwr(b.name)-healPwr(a.name));

  if(!rows.length){
    el.innerHTML=`<div style="color:var(--text3);font-size:14px;padding:16px 0">힐러 스탯 데이터 없음</div>`;
    return;
  }

  const col='#7bb899';
  const RANK_COLOR_ST={'길드마스터':'#ffd700','고정멤버':'#7ec8a0','버튜버':'#d4789a','스윗기사단':'#b07adb','네임드':'#b07adb'};
  const MAIN_RANKS_SET=new Set(['길드마스터','고정멤버','버튜버']);
  const vtuberRows=rows.filter(r=>MAIN_RANKS_SET.has(r.gm.rank_name));

  const _bothRe=/공격력과 치유량이 최대 (\d+)/;
  const _healDmgRe=/치유량이 최대 (\d+)만큼, 공격력이 최대 (\d+)/;
  const _enchBothRe=/주문\s*공격력\s*및\s*치유량?\s*\+(\d+)/g;
  const _enchRevRe=/치유\s*및\s*주문\s*공격력\s*\+(\d+)/g;
  const _enchHealRe=/주문\s*치유량\s*\+(\d+)/g;
  function calcBreakdown(name){
    let spellVal=0,enchVal=0;
    for(const it of [...new Set(Object.values(CHAR_DB[name]?.items||{}))]){
      for(const s of(it.spell||[])){
        if(s.includes('계열'))continue;
        const m2=s.match(_healDmgRe);if(m2){spellVal+=parseInt(m2[1]);continue;}
        const m1=s.match(_bothRe);if(m1)spellVal+=parseInt(m1[1]);
      }
      const enc=it.enchant||'';
      for(const m of enc.matchAll(_enchBothRe))enchVal+=parseInt(m[1]);
      for(const m of enc.matchAll(_enchRevRe))enchVal+=parseInt(m[1]);
      const rem=enc.replace(_enchBothRe,'').replace(_enchRevRe,'');
      for(const m of rem.matchAll(_enchHealRe))enchVal+=parseInt(m[1]);
    }
    return {spellVal,enchVal};
  }

  // ── 공통 헬퍼: 아바타 HTML ──
  function makeAvatar(gm, name, clsCol, avatarClass){
    const charId=gm.character_id||null;
    const soopEntry=(charId&&window._soopMapById?.[charId])||window._soopMap?.[name]||null;
    const imgSrc=soopEntry?.profile_img||gm.avatar_img||null;
    const cid=CLASS_NAME_TO_ID[gm.class_name];
    return imgSrc
      ?`<img src="${imgSrc}" alt="${name}" class="${avatarClass}" style="border-color:${clsCol}" onerror="this.style.display='none'">`
      :`<div class="${avatarClass}-empty" style="border-color:${clsCol}">${EMOJI_MAP[cid]||'⚔'}</div>`;
  }

  function calcTiedRank(sortedRows, idx, getVal){
    const val=getVal(sortedRows[idx]);
    let r=idx+1;
    while(r>1 && getVal(sortedRows[r-2])===val) r--;
    return r;
  }

  // ── 공통 헬퍼: 1등 카드 HTML ──
  // [통일] 카드 생성 함수로 분리 — 치유/방어 모두 동일 구조 사용
function makeTopCard({name, gm, statVal, statLabel, statColor, extraStats, title}){
    const cid=CLASS_NAME_TO_ID[gm.class_name];
    const clsCol=CLASS_COLOR[cid]||'var(--text3)';
    const rcol=RANK_COLOR_ST[gm.rank_name]||'var(--text3)';
    const spec=SPEC_DB[name]?.active?.reduce((b,s)=>s.pts>b.pts?s:b,{pts:0,spec:''})?.spec||'';
    const imgHtml=makeAvatar(gm, name, clsCol, 'gc-avatar');
    const inlineHtml=extraStats.map((s,i)=>`
      ${i>0?'<span class="gc-inline-sep"></span>':''}
      <span class="gc-inline-item">
        <span class="gc-inline-label">${s.label}</span>
        <span class="gc-inline-val" style="color:${s.color||'var(--text1)'}">${s.val}</span>
      </span>`).join('');
    return `${title?`<div class="gc-card-title">${title}</div>`:''}
    <div class="glass-card title_rnk_tbl-card">
      <div class="gc-header">
        <div class="gc-top-rank">#1</div>
        ${imgHtml}
        <div class="gc-name-block">
          <div class="gc-name">${name}</div>
          <div class="gc-meta" style="color:${clsCol}">${gm.class_name} · ${spec}</div>
        </div>
        <div class="title_rnk_tbl-big" style="color:${statColor}">
          <div class="title_rnk_tbl-label">${statLabel}</div>
          <div class="title_rnk_tbl-num">${statVal>0?statVal.toLocaleString():'-'}</div>
          <div class="gc-inline-stats">${inlineHtml}</div>
        </div>
      </div>
    </div>`;
  }
  // ── 공통 헬퍼: 2~10등 테이블 행 HTML ──
  // [통일] 행 생성 함수로 분리 — 치유/방어 모두 동일 구조 사용
  function makeTableRow({name, gm, rank, statVal, statColor, extraCols}){
    const cid=CLASS_NAME_TO_ID[gm.class_name];
    const clsCol=CLASS_COLOR[cid]||'var(--text3)';
    const rcol=RANK_COLOR_ST[gm.rank_name]||'var(--text3)';
    const spec=SPEC_DB[name]?.active?.reduce((b,s)=>s.pts>b.pts?s:b,{pts:0,spec:''})?.spec||'';
    const imgHtml=makeAvatar(gm, name, clsCol, 'st-rank-avatar');
    const numCls=rank<=1?'r1':rank===2?'r2':rank===3?'r3':'';
    const extraHtml=extraCols.map(c=>`<td class="st-stat-col" style="${c.style||''}">${c.val}</td>`).join('');
    const statCell=`<td class="st-stat-col" style="color:${statColor};font-weight:700">${statVal>0?statVal.toLocaleString():'-'}</td>`;
    return `<tr style="animation:stRowSlideIn 0.6s ease both;animation-delay:${(rank-2)*0.05}s">
      <td class="num ${numCls}">${rank}</td>
      <td class="img-col">${imgHtml}</td>
      <td class="nick-col">
        <div class="st-rank-name">${name}</div>
        <div class="st-rank-meta">
          <span style="color:${clsCol};font-weight:700">${gm.class_name}</span>
          <span style="color:rgba(255,255,255,.2)">·</span>
          <span style="color:var(--text2)">${spec}</span>
        </div>
      </td>
      ${statCell}
      ${extraHtml}
    </tr>`;
  }

  // ── 1등 카드 (치유증가량) ──
  const r0=rows[0];
  const cardHtml=makeTopCard({
    name:r0.name, gm:r0.gm,
    statVal:healPwr(r0.name),
    statLabel:'치유증가량',
    statColor:col,
    title:'치유증가량 TOP10',
    extraStats:[
      {label:'상위', val:`${(trueRank(r0.name) / allHealerCount * 100).toFixed(1)}%`, color:'#7bb899'},
    ]
  });

  // ── 2~10등 테이블 행 (치유증가량) ──
  const tableRows=rows.slice(1,10).map((r,i)=>{
    return makeTableRow({
      name:r.name, gm:r.gm, rank:calcTiedRank(rows,i+1,x=>healPwr(x.name)),
      statVal:healPwr(r.name),
      statColor:'rgba(255,255,255,.85)',
      extraCols:[
        {val:`${(trueRank(r.name) / allHealerCount * 100).toFixed(1)}%`, style:'font-size:11px;color:var(--text2)'},
      ]
    });
  }).join('');

  // ── 방어숙련도 랭킹 ──
  const defCol='#7ab3d4';
  const defAllRows=Object.entries(GUILD_DB)
    .map(([name,gm])=>{
      const d=data.find(d=>d.character_name===name)||null;
      const spec=SPEC_DB[name]?.active?.reduce((b,s)=>s.pts>b.pts?s:b,{pts:0,spec:''})?.spec||'';
      return {name,gm,d,spec};
    })
    .filter(r=>r.d&&r.d.defense_effective>0)
    .sort((a,b)=>(b.d.defense_effective||0)-(a.d.defense_effective||0));
  const defRows=defAllRows.filter(r=>filtered.has(r.name));
  const defAllCount=defAllRows.length;
  function defTrueRank(name){return defAllRows.findIndex(r=>r.name===name)+1;}

  const emptyLayout=`
    <div class="title_rnk_tbl-layout">
      <div class="glass-card title_rnk_tbl-card gc-empty-card"></div>
      <table class="st-rank-table title_rnk_tbl">
        <thead><tr>
          <th class="num">#</th>
          <th class="img-col"></th>
          <th class="nick-col">닉네임</th>
          <th class="st-stat-col">-</th>
          <th class="st-stat-col">-</th>
        </tr></thead>
        <tbody><tr><td colspan="6" class="gc-empty-msg">준비 중</td></tr></tbody>
      </table>
    </div>`;

  let defLayout=emptyLayout;
  if(defRows.length>0){
    // ── 1등 카드 (방어숙련도) ──
    // [통일] makeTopCard 함수 사용 — 치유 카드와 동일한 구조
    const defCardHtml=makeTopCard({
      name:defRows[0].name, gm:defRows[0].gm,
      statVal:defRows[0].d.defense_effective||0,
      statLabel:'방어숙련도',
      statColor:defCol,
      title:'방어숙련도 TOP10',
      extraStats:[
        // [통일] 상위% 인라인 스탯 — 치유 카드와 동일한 gc-inline-stats 구조
        // {label:'상위', val:`${Math.round(defTrueRank(defRows[0].name)/defAllCount*100,1)}%`, color:defCol},
        { label: '상위', val: `${(defTrueRank(defRows[0].name) / defAllCount * 100).toFixed(1)}%`, color: defCol},
      ]
    });


    
    // ── 2~10등 테이블 행 (방어숙련도) ──
    // [통일] makeTableRow 함수 사용 — 치유 테이블과 동일한 구조/스타일
    const defTableRows=defRows.slice(1,10).map((r,i)=>
      makeTableRow({
        name:r.name, gm:r.gm, rank:calcTiedRank(defRows,i+1,x=>x.d.defense_effective||0),
        statVal:r.d.defense_effective||0,
        statColor:'rgba(255,255,255,.85)',
        extraCols:[
          // [통일] 상위% — 치유 테이블과 동일한 font-size/color 스타일
          {val:`${(defTrueRank(r.name) / defAllCount * 100).toFixed(1)}%`, style:'font-size:11px;color:var(--text2);'},
        ]
      })
    ).join('');

    defLayout=`
      <div class="title_rnk_tbl-layout">
        ${defCardHtml}
        <table class="st-rank-table title_rnk_tbl">
          <thead><tr>
            <th class="num" style="color:var(--text2)">#</th>
            <th class="img-col"></th>
            <th class="nick-col" style="color:var(--text2)">닉네임</th>
            <th class="st-stat-col" style="color:var(--text2)">방어숙련도</th>
            <th class="st-stat-col" style="color:var(--text2)">상위%</th>
          </tr></thead>
          <tbody>${defTableRows}</tbody>
        </table>
      </div>`;
  }

  // ── 명예킬 랭킹 ──
  const hkCol='#e8a03c';
  const hkAllRows=Object.entries(GUILD_DB)
    .map(([name,gm])=>{
      const d=data.find(d=>d.character_name===name)||null;
      return {name,gm,d};
    })
    .filter(r=>r.d&&r.d.honorable_kills>0)
    .sort((a,b)=>(b.d.honorable_kills||0)-(a.d.honorable_kills||0));
  const hkRows=hkAllRows.filter(r=>filtered.has(r.name));
  const hkAllCount=hkAllRows.length;
  function hkTrueRank(name){return hkAllRows.findIndex(r=>r.name===name)+1;}

  let hkLayout=`
    <div class="title_rnk_tbl-layout">
      <div class="glass-card title_rnk_tbl-card gc-empty-card"></div>
      <table class="st-rank-table title_rnk_tbl">
        <thead><tr>
          <th class="num">#</th><th class="img-col"></th>
          <th class="nick-col">닉네임</th>
          <th class="st-stat-col">-</th>
        </tr></thead>
        <tbody><tr><td colspan="4" class="gc-empty-msg">데이터 없음</td></tr></tbody>
      </table>
    </div>`;
  if(hkRows.length>0){
    const hkCardHtml=makeTopCard({
      name:hkRows[0].name, gm:hkRows[0].gm,
      statVal:hkRows[0].d.honorable_kills||0,
      statLabel:'명예킬',
      statColor:hkCol,
      title:'명예킬 TOP10',
      extraStats:[
        {label:'상위', val:`${(hkTrueRank(hkRows[0].name) / hkAllCount * 100).toFixed(1)}%`, color:hkCol},
      ]
    });
    const hkTableRows=hkRows.slice(1,10).map((r,i)=>
      makeTableRow({
        name:r.name, gm:r.gm, rank:calcTiedRank(hkRows,i+1,x=>x.d.honorable_kills||0),
        statVal:r.d.honorable_kills||0,
        statColor:'rgba(255,255,255,.85)',
        extraCols:[
          {val:`${(hkTrueRank(r.name) / hkAllCount * 100).toFixed(1)}%`, style:'font-size:11px;color:var(--text2)'},
        ]
      })
    ).join('');
    hkLayout=`
      <div class="title_rnk_tbl-layout">
        ${hkCardHtml}
        <table class="st-rank-table title_rnk_tbl">
          <thead><tr>
            <th class="num" style="color:var(--text2)">#</th>
            <th class="img-col"></th>
            <th class="nick-col" style="color:var(--text2)">닉네임</th>
            <th class="st-stat-col" style="color:var(--text2)">명예킬</th>
            <th class="st-stat-col" style="color:var(--text2)">상위%</th>
          </tr></thead>
          <tbody>${hkTableRows}</tbody>
        </table>
      </div>`;
  }

  el.innerHTML=`
    <div class="gc-rank-row">
      <div class="title_rnk_tbl-layout">
        ${cardHtml}
        <table class="st-rank-table title_rnk_tbl">
          <thead><tr>
            <th class="num" style="color:var(--text2)">#</th>
            <th class="img-col"></th>
            <th class="nick-col" style="color:var(--text2)">닉네임</th>
            <th class="st-stat-col" style="color:var(--text2)">치유증가량</th>
            <th class="st-stat-col" style="color:var(--text2)">상위%</th>
          </tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>
      ${defLayout}
      ${hkLayout}
    </div>`;
}


function stSortBy(key){
  if(_stSortKey===key) _stSortDir=_stSortDir==='desc'?'asc':'desc';
  else{_stSortKey=key;_stSortDir='desc';}
  _stRankPage=0;
  stRenderClassTable(_stActiveClass);
}

function stGoPage(page){
  _stRankPage=page;
  stRenderClassTable(_stActiveClass);
}
function attendGoPage(page){
  _attendRankPage=page;
  _buildAttendRankTable();
}
function attendSetMonth(m){
  _attendRankMonth=m;
  _attendRankPage=0;
  _buildAttendRankTable();
}
function gdAttendSearchFn(){
  const q=(document.getElementById('gdAttendSearch')?.value||'').trim();
  if(!q) return;
  const idx=_attendRankRows.findIndex(r=>r.name===q||r.name.includes(q));
  if(idx===-1){alert(`"${q}" — 해당 유저가 없습니다.`);return;}
  _attendRankPage=Math.floor(idx/10);
  _buildAttendRankTable();
}

function stSearchNick(){
  const q=(document.getElementById('stRankSearch')?.value||'').trim();
  if(!q) return;

  // 필터 초기화
  _stVtuberOnly=false;
  ['chkVtuberOnly','chkVtuberOnly2'].forEach(id=>{const el=document.getElementById(id);if(el)el.checked=false;});

  // 해당 닉네임의 클래스 찾기
  const gm=GUILD_DB[q];
  if(!gm){alert(`"${q}" — 해당 유저가 없습니다.`);return;}

  // 클래스 전환
  const cls=gm.class_name;
  if(!CLASS_POSITION[cls]){alert(`"${q}" — 클래스 데이터가 없습니다.`);return;}
  _stActiveClass=cls;
  _stSortKey='';
  _stSortDir='desc';
  _stUpdateClsPicker();

  // 해당 유저의 페이지 찾기
  const pos=CLASS_POSITION[cls];
  const sortKey=pos.stats[0].k;
  const data=Object.values(STATS_DB_V2);
  const rows=Object.entries(GUILD_DB)
    .filter(([name,g])=>g.class_name===cls)
    .map(([name])=>({name,d:data.find(d=>d.character_name===name)||null}))
    .filter(r=>r.d);
  rows.sort((a,b)=>(b.d[sortKey]||0)-(a.d[sortKey]||0));

  const idx=rows.findIndex(r=>r.name===q);
  if(idx===-1){alert(`"${q}" — 스탯 데이터가 없습니다.`);return;}

  _stRankPage=Math.floor(idx/30);
  stRenderClassTable(cls);

  setTimeout(()=>{
    const trs=document.querySelectorAll('#stClsRank tbody tr');
    const localIdx=idx%30;
    if(trs[localIdx]){
      trs[localIdx].style.background='rgba(200,200,200,.12)';
      trs[localIdx].scrollIntoView({block:'center',behavior:'smooth'});
      setTimeout(()=>{if(trs[localIdx])trs[localIdx].style.background='';},1800);
    }
  },50);
}

function stRenderClassTable(cls){
  const _rankEl=document.getElementById('stClsRank');
  if(!_rankEl) return;
  const pos=CLASS_POSITION[cls];
  if(!pos){_rankEl.innerHTML='';return;}
  const stats=pos.stats;
  const cid=CLASS_NAME_TO_ID[cls];
  const col=CLASS_COLOR[cid]||'#909090';
  const classColors=_stClassColors();
  const data=Object.values(STATS_DB_V2);
  if(!_gdNoDataNames.length){
    _gdNoDataNames=Object.keys(GUILD_DB).filter(name=>{
      const d=data.find(d=>d.character_name===name);
      return !d||!(d.health>0||d.gear_score>0);
    });
  }
  const _now=Date.now();
  const _lastLoginLabel = ts => {
    if (!ts) return '';
    const n = typeof ts === 'number' ? ts : new Date(ts).getTime();
    if (isNaN(n)) return '';
    const ms = n < 1e12 ? n * 1000 : n;
    const diffM = Math.floor((_now - ms) / (1000 * 60));
    if (diffM < 0) return '';
    if (diffM < 60) return `${diffM}분 전`;
    const diffH = Math.floor(diffM / 60);
    if (diffH < 24) return `${diffH}시간 전`;
    const diffD = Math.floor(diffH / 24);
    return `${diffD}일 전`;
  };

  // 현재 정렬 기준 (미설정 시 첫 번째 스탯 기본)
  const sortKey=_stSortKey||stats[0].k;
  if(!_stSortKey) _stSortKey=stats[0].k;

  const filtered=new Set(_stFilteredNames());
  const members=Object.entries(GUILD_DB)
    .filter(([name,gm])=>gm.class_name===cls&&filtered.has(name))
    .map(([name])=>name);

  const _hasStats=d=>d&&(d.health>0||d.gear_score>0);
  const rowsWithData=members
    .map(name=>({name,d:data.find(d=>d.character_name===name)||null}))
    .filter(r=>_hasStats(r.d));
  const rowsNoData=members
    .filter(name=>!_hasStats(data.find(d=>d.character_name===name)))
    .map(name=>({name,d:null}));

  // 특성 스펙 보너스 (치유증가량/공격증가량 전용)
  rowsWithData.forEach(r=>{
    const sp=SPEC_DB[r.name]?.active?.reduce((b,s)=>s.pts>b.pts?s:b,{pts:0,spec:''})?.spec||'';
    const st=STATS_DB[r.name]||{};
    let bHeal=0,bDmg=0;
    if(cls==='성기사'&&sp==='신성'){const b=Math.floor((st.intellect_effective||0)*0.35);bHeal=b;bDmg=b;}
    else if(cls==='사제'&&sp==='신성'){const b=Math.floor((st.spirit_effective||0)*0.25);bHeal=b;bDmg=b;}
    else if(cls==='주술사'&&sp==='복원'){const b=Math.floor((st.intellect_effective||0)*0.30);bHeal=b;bDmg=b;}
    else if(cls==='드루이드'&&sp==='조화'){const b=Math.floor((st.intellect_effective||0)*0.25);bHeal=b;bDmg=b;}
    r._bHeal=bHeal; r._bDmg=bDmg;
  });
  const sv=(r,k)=>{
    if(!r.d) return 0;
    const base=r.d[k]||0;
    if(k==='healing_power') return base+(r._bHeal||0);
    if(k==='spell_dmg') return base+(r._bDmg||0);
    return base;
  };

  rowsWithData.sort((a,b)=>{
    const av=sv(a,sortKey), bv=sv(b,sortKey);
    return _stSortDir==='desc'?bv-av:av-bv;
  });

  const rows=[...rowsWithData,...rowsNoData];

  if(!rows.length){
    _rankEl.innerHTML=`<div style="color:var(--text3);font-size:14.3px;padding:12px 0">해당 클래스 스탯 데이터 없음</div>`;
    return;
  }

  const PAGE_SIZE=30;
  const totalPages=Math.ceil(rows.length/PAGE_SIZE);
  if(_stRankPage>=totalPages) _stRankPage=totalPages-1;
  const pageStart=_stRankPage*PAGE_SIZE;

  // 스탯 최고값은 전체 기준
  const statMaxAll={};
  stats.forEach(s=>{
    statMaxAll[s.k]=Math.max(...rows.map(r=>sv(r,s.k)));
  });

  const pageRows=rows.slice(pageStart,pageStart+PAGE_SIZE);

  const globalRankCls=g=>g===0?'r1':g===1?'r2':g===2?'r3':'';
  const thCls=k=>k!==sortKey?'sortable':`sortable sort-${_stSortDir}`;

  // 페이지네이션 UI
  const pageBtn=(label,page,disabled,active)=>
    `<button class="st-page-btn${active?' active':''}" ${disabled?'disabled':''} onclick="stGoPage(${page})">${label}</button>`;
  let paginationHtml='';
  if(totalPages>1){
    const p=_stRankPage;
    let btns=pageBtn('&laquo;',0,p===0,false);
    btns+=pageBtn('&#8249;',p-1,p===0,false);
    // 페이지 번호: 현재 페이지 주변 ±2
    const start=Math.max(0,p-2), end=Math.min(totalPages-1,p+2);
    if(start>0) btns+=`<span class="st-page-ellipsis">…</span>`;
    for(let i=start;i<=end;i++) btns+=pageBtn(i+1,i,false,i===p);
    if(end<totalPages-1) btns+=`<span class="st-page-ellipsis">…</span>`;
    btns+=pageBtn('&#8250;',p+1,p===totalPages-1,false);
    btns+=pageBtn('&raquo;',totalPages-1,p===totalPages-1,false);
    paginationHtml=`<div class="st-pagination">${btns}<span class="st-page-info">${pageStart+1}–${Math.min(pageStart+PAGE_SIZE,rows.length)} / ${rows.length}명</span></div>`;
  }

  let html=`<div class="st-rank-notice">
  📢 데이터는 <strong>유저가 마지막으로 로그아웃된 시점</strong>(부특성 로그아웃시 부특성 기준으로 측정)의 데이터가 반영됩니다. 로그아웃전 아이템을 확인해주세요!
  <div class="st-criteria-wrap">
    <span class="st-calc-toggle">집계기준 보기</span>
    <div id="stCalcCriteria" class="st-criteria-panel">
      <div class="sc-section">
        <div class="sc-title">1. 직접 집계 (API 미제공)</div>
        <div class="sc-body">
          <span class="sc-label">치유 · 공격 증가량</span>
          <span class="sc-src">아이템 기본 능력치 · 착용효과 · 세트효과 · 보석 · 마법부여</span>
          <span class="sc-src" style="margin-top:4px;color:var(--text2)">클래스 특성 상시효과</span>
          <div class="sc-spec-grid">
            <span class="sc-spec-badge pala">성기사-신성 &nbsp;+ 지능 × 35%</span>
            <span class="sc-spec-badge priest">사제-신성 &nbsp;+ 정신력 × 25%</span>
            <span class="sc-spec-badge shaman">주술사-복원 &nbsp;+ 지능 × 30%</span>
            <span class="sc-spec-badge druid">드루이드-조화 &nbsp;+ 지능 × 25%</span>
          </div>
        </div>
        <div class="sc-body" style="margin-top:7px">
          <span class="sc-label">적중도 <span style="font-weight:400;color:var(--text3)">(주문 · 치명타 · 극대화 적중도)</span></span>
          <span class="sc-src">아이템 기본 능력치 · 착용효과 · 세트효과 · 보석 · 마법부여</span>
        </div>
      </div>
      <div class="sc-section" style="border-top:1px solid var(--border);padding-top:10px;">
        <div class="sc-title">2. Blizzard API 제공</div>
        <div class="sc-body">
          <span class="sc-src" style="color:var(--text2)">나머지 모든 능력치는 유저가 마지막으로 <strong style="color:var(--text1)">로그아웃된 시점</strong>의 수치로 집계됩니다.</span>
        </div>
      </div>
    </div>
  </div>
</div><div style="display:flex;align-items:center;gap:12px;width:100%"><span id="stRankSearchNoDataNote" style="font-size:12px;color:var(--text3);font-weight:500;letter-spacing:0;text-transform:none;white-space:nowrap;flex-shrink:0"></span><div class="st-rank-search-wrap"><input id="stRankSearch" class="st-rank-search" type="text" placeholder="닉네임 검색..." onkeydown="if(event.key==='Enter')stSearchNick()"/><button class="st-rank-search-btn" onclick="stSearchNick()">이동</button></div></div><table class="st-rank-table">
    <thead><tr>
      <th class="num">#</th>
      <th class="img-col"></th>
      <th class="nick-col">닉네임</th>
      <th class="item-col">P2_BIS</th>
      <th class="login-col">기준</th>
      <th class="lv-col">레벨</th>
      <th class="rank-col">등급</th>
      ${stats.map(s=>{
        const helpBtn=s.k==='gear_score'
          ?` <span class="st-col-help" onmouseenter="showGsTT(event)" onmousemove="moveTT(event)" onmouseleave="hideTT()" onclick="event.stopPropagation()">?</span>`
          :'';
        return `<th class="${thCls(s.k)} st-stat-col" onclick="stSortBy('${s.k}')">${s.l}${helpBtn}</th>`;
      }).join('')}
    </tr></thead>
    <tbody>
    ${pageRows.map((r,i)=>{
      const globalIdx=pageStart+i;
      const gm=GUILD_DB[r.name]||{};
      const RANK_COLOR_ST={'길드마스터':'#ffd700','고정멤버':'#7ec8a0','버튜버':'#d4789a','스윗기사단':'#b07adb','네임드':'#b07adb'};
      const rcol=RANK_COLOR_ST[gm.rank_name]||'var(--text3)';
      const clsId=CLASS_NAME_TO_ID[gm.class_name];
      const clsCol=CLASS_COLOR[clsId]||'var(--text3)';
      const charId=gm.character_id||null;
      const soopEntry=(charId&&window._soopMapById?.[charId])||window._soopMap?.[r.name]||null;
      const soopImg=soopEntry?.profile_img||null;
      const wowImg=gm.avatar_img||null;
      const imgSrc=soopImg||wowImg;
      const imgHtml=imgSrc
        ?`<img src="${imgSrc}" alt="${r.name}" class="st-rank-avatar" style="border-color:${clsCol}" onerror="this.style.display='none'">`
        :`<div class="st-rank-avatar-empty" style="border-color:${clsCol}">${EMOJI_MAP[clsId]||'⚔'}</div>`;
      const rankBadge=gm.rank_name
        ?`<span style="color:${rcol};font-size:11px;font-weight:700;padding:2px 7px;border-radius:4px;border:1px solid ${rcol}44;background:${rcol}11">${gm.rank_name}</span>`
        :'';
      const safeN=r.name.replace(/'/g,"\\'");
      if(!r.d){
        return `<tr style="animation:stRowSlideIn 0.8s ease both;animation-delay:${i*0.04}s;opacity:.5;cursor:pointer" onclick="quickSelect('${safeN}','statrnk')">
          <td class="num">${globalIdx+1}</td>
          <td class="img-col">${imgHtml}</td>
          <td class="nick-col"><div class="st-rank-name">${r.name}</div></td>
          <td class="item-col"></td>
          <td class="login-col" style="text-align:center;font-size:11px;color:rgba(255,255,255,.35);line-height:1.6">${_lastLoginLabel(gm.last_login_timestamp)}</td>
          <td class="lv-col">${gm.level||''}</td>
          <td class="rank-col">${rankBadge}</td>
          <td colspan="${stats.length}" style="color:var(--text3);font-size:12px;font-style:italic;text-align:center;padding:6px 0;">데이터 접근이 비활성화된 유저입니다. 배틀넷 계정설정에서 [게임 데이터 및 프로필 공개설정] - [사용함] 체크가 되어있는지 확인해주세요</td>
        </tr>`;
      }
      const activeSpec=SPEC_DB[r.name]?.active?.reduce((b,s)=>s.pts>b.pts?s:b,{pts:0,spec:''})?.spec||'';
      const metaParts=[];
      if(gm.class_name) metaParts.push(`<span style="color:${clsCol};font-weight:700">${gm.class_name}</span>`);
      if(activeSpec) metaParts.push(`<span style="color:var(--text2)">${activeSpec}</span>`);
      const metaHtml=metaParts.length?`<div class="st-rank-meta">${metaParts.join('<span style="color:rgba(255,255,255,.2)">·</span>')}</div>`:'';
      return `<tr style="animation:stRowSlideIn 0.8s ease both;animation-delay:${i*0.04}s;cursor:pointer" onclick="quickSelect('${safeN}','statrnk')">

      <td class="num ${globalRankCls(globalIdx)}">${globalIdx+1}</td>
      <td class="img-col">${imgHtml}</td>
      <td class="nick-col">
        <div class="st-rank-name">${r.name}</div>
        ${metaHtml}
      </td>
      <td class="item-col" onclick="event.stopPropagation()"><span class="st-item-btn" onmouseenter="stShowItemPopup('${r.name.replace(/'/g,"\\'")}',event)" onmousemove="stMoveItemPopup(event)" onmouseleave="stHideItemPopup()">BIS</span></td>
      <td class="login-col" style="text-align:center;font-size:11px;color:rgba(255,255,255,.45);line-height:1.6">${_lastLoginLabel(gm.last_login_timestamp)}</td>
      <td class="lv-col">${gm.level||''}</td>
      <td class="rank-col">${rankBadge}</td>
      ${stats.map(s=>{
        const v=sv(r,s.k)||undefined;
        const isSort=s.k===sortKey;
        const isMax=v!=null&&v>0&&v===statMaxAll[s.k];
        const bg=isMax?`background:${col}18;`:(isSort?'background:rgba(255,255,255,.03);':'');
        return `<td class="st-stat-col" style="${bg}${isMax?`outline:1px solid ${col}33;`:''}">`+
          `<span class="st-rank-val"${isMax?` style="color:${col};font-weight:700"`:''}>` +
          `${v!=null&&v>0?s.fmt(v):''}</span></td>`;
      }).join('')}
    </tr>`;}).join('')}
    </tbody>
  </table></div>${paginationHtml}`;
  _rankEl.innerHTML=html;

  const noteEl2=document.getElementById('stRankSearchNoDataNote');
  if(noteEl2){
    noteEl2.innerHTML=_gdNoDataNames.length>0
      ?`※ 데이터 비공개 유저 ${_gdNoDataNames.length}명 <span class="st-col-help" onmouseenter="_showNoDataTT(event)" onmousemove="moveTT(event)" onmouseleave="hideTT()">?</span>`
      :'';
    noteEl2.style.color=_gdNoDataNames.length>0?'#ffffff':'var(--text1)';
  }

  // 현재 페이지 캐릭터 이미지 백그라운드 프리로드
  _stPreloadPageItems(pageRows.map(r=>r.name));
}

// ── 아이템 팝업 (랭킹 테이블 hover) ─────────────────────────
const _stItemPopupCache=new Map(); // name → innerHTML string

function _stClearItemPopupCache(){ _stItemPopupCache.clear(); }

function _stBuildItemPopupHtml(name){
  if(_stItemPopupCache.has(name)) return _stItemPopupCache.get(name);
  const char=CHAR_DB[name];
  if(!char?.items){
    const h='<div style="color:var(--text3);font-size:12px;padding:6px 2px">장비 데이터 없음</div>';
    _stItemPopupCache.set(name,h); return h;
  }
  const className=char.class_name||GUILD_DB[name]?.class_name||'';
  const tbcaKey=_getTbcaSpecKey(name, className);
  const ALL_SLOTS=[...LAYOUT_LEFT,...LAYOUT_RIGHT,...LAYOUT_BTM]; // 19개
  let bisCnt=0, altCnt=0;
  const slotHtml=ALL_SLOTS.map(s=>{
    const item=char.items[s];
    if(!item) return `<div class="st-item-slot" data-q="EMPTY"></div>`;
    let bisAttr='', bisHtml='';
    if(tbcaKey&&item.id){
      let bi=(TBCA_P1_LOOKUP[tbcaKey]||{})[String(item.id)];
      if(!bi&&tbcaKey==='DruidFeral')
        bi=(TBCA_P1_LOOKUP['DruidCat']||{})[String(item.id)]||(TBCA_P1_LOOKUP['DruidBear']||{})[String(item.id)];
      if(bi){
        bisAttr=`data-bis="${bi.rank===1?'bis':'alt'}"`;
        if(bi.rank===1) bisCnt++; else altCnt++;
        const rc=bi.rank===1?'#ffd700':'#d0d8e8';
        bisHtml=`<div class="slot-bis-rank" style="color:${rc};border-color:${rc}55;background:linear-gradient(rgba(0,0,0,.55),rgba(0,0,0,.55)),${rc}33">#${bi.rank}</div>`;
      }
    }
    const _iid=item.id?` data-iid="${item.id}"`:'';
    const _onerr=item.id?'_cvFetchIcon(this)':"this.style.display='none'";
    const imgHtml=item.icon?`<img src="${item.icon}" alt="${(item.name||'').replace(/"/g,'&quot;')}"${_iid} onerror="${_onerr}">`:''
    return `<div class="st-item-slot" ${bisAttr} data-q="${item.q||''}">${bisHtml}${imgHtml}</div>`;
  }).join('');
  const bisBar=(bisCnt||altCnt)?`<div class="st-item-bis-bar">
    <span class="st-item-bis-badge p2">P2</span>
    ${bisCnt?`<span class="st-item-bis-badge bis">BIS <b>${bisCnt}</b></span>`:''}
    ${altCnt?`<span class="st-item-bis-badge alt">ALT <b>${altCnt}</b></span>`:''}
  </div>`:'';
  const h=`${bisBar}<div class="st-item-slots-grid">${slotHtml}</div>`;
  _stItemPopupCache.set(name,h);
  return h;
}

// 페이지 진입 시 이미지 프리로드 (브라우저 HTTP 캐시에 적재)
function _stPreloadPageItems(names){
  const ALL_SLOTS=[...LAYOUT_LEFT,...LAYOUT_RIGHT,...LAYOUT_BTM];
  names.forEach(name=>{
    const items=CHAR_DB[name]?.items;
    if(!items) return;
    ALL_SLOTS.forEach(s=>{ if(items[s]?.icon){ const i=new Image(); i.src=items[s].icon; } });
  });
}

function stShowItemPopup(name, e){
  let pop=document.getElementById('st-item-popup');
  if(!pop){
    pop=document.createElement('div');
    pop.id='st-item-popup';
    pop.className='st-item-popup';
    document.body.appendChild(pop);
  }
  const html=_stBuildItemPopupHtml(name);
  if(pop.dataset.cur!==name){ pop.innerHTML=html; pop.dataset.cur=name; }
  pop.style.display='block';
  _stPositionItemPopup(e, pop);
}

function stMoveItemPopup(e){
  const pop=document.getElementById('st-item-popup');
  if(!pop||pop.style.display==='none') return;
  _stPositionItemPopup(e, pop);
}

function _stPositionItemPopup(e, pop){
  const z=parseFloat(getComputedStyle(document.documentElement).zoom)||1;
  const cx=e.clientX/z, cy=e.clientY/z;
  const pw=pop.offsetWidth||300, ph=pop.offsetHeight||200;
  let left=cx+14, top=cy+14;
  if(left+pw>window.innerWidth-8) left=cx-pw-8;
  if(top+ph>window.innerHeight-8) top=window.innerHeight-ph-8;
  if(top<8) top=8;
  pop.style.left=left+'px';
  pop.style.top=top+'px';
}

function stHideItemPopup(){
  const pop=document.getElementById('st-item-popup');
  if(pop) pop.style.display='none';
}

// ── 등급별 접속 활성률 라인차트 ──────────────────────────────────

const _RANK_LINE_COL={
  '전체':      '#7ec8a0',
  '버튜버':    '#d4789a',  // 길드마스터+고정멤버 포함
  '스윗기사단':'#b07adb',
  '네임드':    '#88aadd',
  '시청자':    '#708899',
};

let _gdRankFilter='전체';
let _actLineActive=null;
let _actLineGranularity='daily';
let _actLineMonth=null;
let _gdNoDataNames=[];

let _gsDistRankFilter=new Set(['전체']);
let _gsDistSelectedClass=null;

function buildGuildActivityChart(){
  const granEl=document.getElementById('gdActLineGran');
  const chartEl=document.getElementById('gdActLineChart');
  if(!chartEl) return;

  const _sv2=Object.values(STATS_DB_V2);
  _gdNoDataNames=Object.keys(GUILD_DB).filter(name=>{
    const d=_sv2.find(d=>d.character_name===name);
    return !d||!(d.health>0||d.gear_score>0);
  });
  const noteEl=document.getElementById('gdActNoDataNote');
  if(noteEl) noteEl.innerHTML=_gdNoDataNames.length>0
    ?`※ 데이터 접근 불가 유저 ${_gdNoDataNames.length}명 <span class="st-col-help" onmouseenter="_showNoDataTT(event)" onmousemove="moveTT(event)" onmouseleave="hideTT()">?</span>`
    :'';

  // 전체 날짜 범위
  const todayKST=new Date(Date.now()+9*3600000).toISOString().slice(0,10);
  const allDates=[];
  for(let d=new Date('2026-04-08');d.toISOString().slice(0,10)<=todayKST;d=new Date(d.getTime()+86400000))
    allDates.push(d.toISOString().slice(0,10));

  const months=[...new Set(allDates.map(d=>d.slice(0,7)))];

  // 월 필터
  const dates=_actLineMonth ? allDates.filter(d=>d.startsWith(_actLineMonth)) : allDates;

  // 등급별 멤버 분류 (길드마스터+고정멤버 → 버튜버 합산), 전체는 모든 멤버
  const rankMembers={'전체':Object.keys(GUILD_DB)};
  Object.entries(GUILD_DB).forEach(([name,gm])=>{
    let r=gm.rank_name; if(!r) return;
    if(r==='길드마스터'||r==='고정멤버') r='버튜버';
    if(!rankMembers[r]) rankMembers[r]=[];
    rankMembers[r].push(name);
  });

  const orderedRanks=Object.keys(_RANK_LINE_COL).filter(r=>rankMembers[r]?.length);

  _actLineActive=new Set([_gdRankFilter]);

  // 등급별 일별 활성률 (rank_login_by_date / rank_by_date 기반)
  const rankRates={};
  orderedRanks.forEach(rank=>{
    rankRates[rank]=dates.map(date=>{
      if(rank==='전체'){
        const logged=Object.values(window.LOGIN_RANK_LOGIN_BY_DATE?.[date]||{}).reduce((a,v)=>a+v,0);
        const total=Object.values(window.LOGIN_RANK_BY_DATE?.[date]||{}).reduce((a,v)=>a+v,0);
        return total>0?logged/total:0;
      }
      const logged=(window.LOGIN_RANK_LOGIN_BY_DATE?.[date]?.[rank])||0;
      const total=(window.LOGIN_RANK_BY_DATE?.[date]?.[rank])||0;
      return total>0?logged/total:0;
    });
  });

  // 일간/주간 토글 (오른쪽)
  if(granEl){
    granEl.innerHTML=
      `<button class="gd-gran-btn${_actLineGranularity==='daily'?' active':''}" onclick="_actLineSetGran('daily')">일간</button>`+
      `<button class="gd-gran-btn${_actLineGranularity==='weekly'?' active':''}" onclick="_actLineSetGran('weekly')">주간</button>`;
  }

  const selLabel=_actLineMonth?`${parseInt(_actLineMonth.slice(5),10)}월`:'날짜';
  const monthBtn=document.getElementById('gdActMonthBtn');
  if(monthBtn) monthBtn.textContent=selLabel+' ▾';

  _buildGdRankBtns(rankMembers,orderedRanks);

  const dailyCounts=dates.map(date=>{
    if(_gdRankFilter==='전체') return Object.values(window.LOGIN_RANK_LOGIN_BY_DATE?.[date]||{}).reduce((a,v)=>a+v,0);
    return (window.LOGIN_RANK_LOGIN_BY_DATE?.[date]?.[_gdRankFilter])||0;
  });
  const dailyTotals=dates.map(date=>{
    if(_gdRankFilter==='전체') return window.LOGIN_TOTAL_BY_DATE?.[date]||0;
    return (window.LOGIN_RANK_BY_DATE?.[date]?.[_gdRankFilter])||0;
  });

  // 주간 집계
  let dispDates=dates, dispRates=rankRates, dispCounts=dailyCounts, dispTotals=dailyTotals;
  if(_actLineGranularity==='weekly'){
    const w=_actLineWeekly(dates,rankRates,orderedRanks);
    dispDates=w.dates; dispRates=w.rates;
    const wLen=dispDates.length;
    dispCounts=Array.from({length:wLen},(_,bi)=>{
      const idxs=Array.from({length:Math.min(7,dates.length-bi*7)},(__,j)=>bi*7+j);
      return idxs.reduce((a,idx)=>a+dailyCounts[idx],0)/idxs.length;
    });
    dispTotals=Array.from({length:wLen},(_,bi)=>{
      const idxs=Array.from({length:Math.min(7,dates.length-bi*7)},(__,j)=>bi*7+j);
      return idxs.reduce((a,idx)=>a+dailyTotals[idx],0)/idxs.length;
    });
  }

  chartEl.innerHTML=_buildActLineSVG(dispDates,dispRates,orderedRanks,{logged:dispCounts,totals:dispTotals});
}

function _actLineWeekly(dates,rankRates,ranks){
  const buckets=[];
  for(let i=0;i<dates.length;i+=7){
    const chunk=dates.slice(i,Math.min(i+7,dates.length));
    if(!chunk.length) continue;
    buckets.push({date:chunk[0],idxs:chunk.map((_,j)=>i+j)});
  }
  const wRates={};
  ranks.forEach(rank=>{
    wRates[rank]=buckets.map(b=>{
      const vals=b.idxs.map(idx=>rankRates[rank][idx]||0);
      return vals.reduce((a,v)=>a+v,0)/vals.length;
    });
  });
  return {dates:buckets.map(b=>b.date),rates:wRates};
}

function _actLineToggle(rank){ _gdToggleRank(rank); }

function _gdToggleRank(rank){
  _gdRankFilter=rank;
  _gsDistRankFilter=new Set([rank]);
  _gsDistSelectedClass=null;
  buildGuildActivityChart();
  _buildActActivityCard();
  buildGsDistChart();
}

function _buildGdRankBtns(rankMembers,orderedRanks){
  const el=document.getElementById('gdRankFilterBtns');
  if(!el) return;
  el.innerHTML=orderedRanks.map(r=>{
    const col=_RANK_LINE_COL[r], on=_gdRankFilter===r;
    return `<div class="sidebar-cat${on?' active':''}" ${on?`style="border-color:${col};color:${col}"`:''}
      onclick="_gdToggleRank('${r}')">${r}</div>`;
  }).join('');
}



function _actLineSetGran(g){ _actLineGranularity=g; buildGuildActivityChart(); }
function _actLineSetMonth(m){ _actLineMonth=m||null; buildGuildActivityChart(); }

function _gdMonthCalShow(btn,items,selectedVal,onSelect){
  document.querySelectorAll('.gd-month-cal').forEach(e=>e.remove());
  const rect=btn.getBoundingClientRect();
  const cal=document.createElement('div');
  cal.className='gd-month-cal';
  cal.style.top=(rect.bottom+4)+'px';
  cal.style.left=rect.left+'px';
  const allItem=items.find(it=>it.monthNum==null);
  const allVal=allItem?String(allItem.val):'';
  const allActive=String(selectedVal)===allVal;
  const enabledMap={};
  items.filter(it=>it.monthNum!=null).forEach(it=>{enabledMap[it.monthNum]=String(it.val);});
  let months='';
  for(let m=1;m<=12;m++){
    const val=enabledMap[m];
    const isEnabled=val!==undefined;
    const isActive=isEnabled&&String(selectedVal)===val;
    months+=`<div class="gd-mc-month${isEnabled?' enabled':''}${isActive?' active':''}"${isEnabled?` data-val="${val}"`:''} >${m}월</div>`;
  }
  cal.innerHTML=`<div class="gd-mc-all${allActive?' active':''}" data-val="${allVal}">날짜</div><div class="gd-mc-year">2026</div><div class="gd-mc-grid">${months}</div>`;
  document.body.appendChild(cal);
  cal.addEventListener('click',e=>{
    const t=e.target.closest('[data-val]');
    if(!t)return;
    const v=t.dataset.val;
    cal.remove();
    onSelect(v);
  });
  setTimeout(()=>{
    document.addEventListener('click',function _close(e){
      if(!cal.contains(e.target)&&e.target!==btn){cal.remove();document.removeEventListener('click',_close);}
    });
  },0);
}

function _actLineOpenCal(btn){
  const todayKST=new Date(Date.now()+9*3600000).toISOString().slice(0,10);
  const allDates=[];
  for(let d=new Date('2026-04-08');d.toISOString().slice(0,10)<=todayKST;d=new Date(d.getTime()+86400000))
    allDates.push(d.toISOString().slice(0,10));
  const months=[...new Set(allDates.map(d=>d.slice(0,7)))];
  const items=[{val:'',label:'전체',monthNum:null}];
  months.forEach(m=>items.push({val:m,label:parseInt(m.slice(5),10)+'월',monthNum:parseInt(m.slice(5),10)}));
  _gdMonthCalShow(btn,items,_actLineMonth||'',v=>_actLineSetMonth(v));
}

function attendOpenMonthCal(btn){
  const now=new Date();
  const curMonth=now.getMonth();
  const prevMonth=curMonth===0?11:curMonth-1;
  const items=[
    {val:'0',label:'전체',monthNum:null},
    {val:String(prevMonth+1),label:(prevMonth+1)+'월',monthNum:prevMonth+1},
    {val:String(curMonth+1),label:(curMonth+1)+'월',monthNum:curMonth+1}
  ];
  _gdMonthCalShow(btn,items,String(_attendRankMonth),v=>attendSetMonth(+v));
}

function _buildActLineSVG(dates,rankRates,ranks,barCounts){
  const VW=1000,VH=300,pL=52,pR=barCounts?52:26,pT=16,pB=44;
  const cW=VW-pL-pR, cH=VH-pT-pB;
  const n=dates.length;
  if(n<2) return '<div style="color:var(--text3);padding:16px;font-size:13px">데이터 없음</div>';

  const xOf=i=>pL+(i/(n-1))*cW;
  const yOf=v=>pT+(1-v)*cH;

  const grids=[0,0.25,0.5,0.75,1].map(v=>{
    const y=yOf(v).toFixed(1);
    return `<line x1="${pL}" y1="${y}" x2="${VW-pR}" y2="${y}" stroke="rgba(255,255,255,.06)" stroke-width="1"/>
      <text x="${pL-10}" y="${y}" text-anchor="end" dominant-baseline="central" font-size="10" fill="#b8b8b8">${Math.round(v*100)}%</text>`;
  }).join('');

  const tickStep=Math.max(1,Math.floor(n/14));
  const xTicks=dates.map((date,i)=>{
    if(i%tickStep!==0&&i!==n-1) return '';
    const lbl=date.slice(5).replace('-','/');
    return `<text x="${xOf(i).toFixed(1)}" y="${VH-pB+16}" text-anchor="middle" font-size="10" fill="#b8b8b8">${lbl}</text>`;
  }).join('');

  const paths=ranks.filter(r=>_actLineActive.has(r)).map(rank=>{
    const col=_RANK_LINE_COL[rank]||'#888';
    const pts=rankRates[rank].map((v,i)=>[xOf(i),yOf(v)]);
    let line=`M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for(let i=0;i<pts.length-1;i++){
      const prev=i>0?pts[i-1]:pts[i],cur=pts[i],next=pts[i+1],nxt2=i<pts.length-2?pts[i+2]:next;
      const t=0.18;
      line+=` C${(cur[0]+(next[0]-prev[0])*t).toFixed(1)},${(cur[1]+(next[1]-prev[1])*t).toFixed(1)} ${(next[0]-(nxt2[0]-cur[0])*t).toFixed(1)},${(next[1]-(nxt2[1]-cur[1])*t).toFixed(1)} ${next[0].toFixed(1)},${next[1].toFixed(1)}`;
    }
    return `<path d="${line}" fill="none" stroke="${col}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" opacity=".9"/>`;
  }).join('');

  // 일별 길드원수 바 차트
  let barsSvg='', rightAxis='';
  const bc=barCounts;
  if(bc&&bc.logged&&bc.logged.length===n){
    const maxCnt=Math.max(...bc.totals.filter(v=>v>0),Math.max(...bc.logged),1);
    const barW=Math.max(3,(cW/(n+1))*0.7);
    const yBar=v=>(pT+cH-(v/maxCnt)*cH).toFixed(1);
    const bgBars=bc.totals.map((tot,i)=>{
      if(!tot) return '';
      const bh=((tot/maxCnt)*cH).toFixed(1);
      return `<rect x="${(xOf(i)-barW/2).toFixed(1)}" y="${yBar(tot)}" width="${barW.toFixed(1)}" height="${bh}" fill="rgba(120,170,255,0.10)" rx="2"/>`;
    }).join('');
    const fgBars=bc.logged.map((cnt,i)=>{
      const bh=((cnt/maxCnt)*cH).toFixed(1);
      return `<rect x="${(xOf(i)-barW/2).toFixed(1)}" y="${yBar(cnt)}" width="${barW.toFixed(1)}" height="${bh}" fill="rgba(120,170,255,0.30)" rx="2"/>`;
    }).join('');
    barsSvg=bgBars+fgBars;
    rightAxis=[0,0.5,1].map(v=>{
      const y=yOf(v).toFixed(1);
      return `<text x="${VW-pR+11}" y="${y}" text-anchor="start" dominant-baseline="central" font-size="10" fill="rgba(120,170,255,0.55)">${Math.round(v*maxCnt)}</text>`;
    }).join('');
  }

  const hoverW=Math.max(2,cW/(n-1)).toFixed(1);
  const isWeekly=_actLineGranularity==='weekly';
  const hovers=dates.map((date,i)=>{
    const x=(xOf(i)-parseFloat(hoverW)/2).toFixed(1);
    let tipData=ranks.filter(r=>_actLineActive.has(r))
      .map(r=>`${r}:${Math.round((rankRates[r][i]||0)*100)}`).join('|');
    if(bc&&bc.logged&&bc.logged.length===n)
      tipData+=`|cnt:${Math.round(bc.logged[i])}:${Math.round(bc.totals[i]||0)}`;
    const lbl=isWeekly?date.slice(5).replace('-','/')+'~':date.slice(5).replace('-','/');
    return `<rect x="${x}" y="${pT}" width="${hoverW}" height="${cH}" fill="transparent"
      onmouseenter="_actLineTT(event,'${lbl}','${tipData}')"
      onmousemove="moveTT(event)" onmouseleave="hideTT()"/>`;
  }).join('');

  return `<svg width="100%" viewBox="0 0 ${VW} ${VH}" style="display:block;overflow:visible;" preserveAspectRatio="none">
${grids}${barsSvg}${xTicks}${rightAxis}${paths}${hovers}
  </svg>`;
}

function _actLineTT(e,lbl,tipData){
  let cntRow='';
  const parts=tipData.split('|').filter(p=>p);
  const rows=parts.map(p=>{
    const segs=p.split(':');
    const rank=segs[0], val=segs[1];
    if(rank==='cnt'){
      const total=segs[2]||'';
      cntRow=`<div style="display:flex;justify-content:space-between;align-items:center;gap:20px;margin-top:5px">
        <span style="font-size:12px;color:rgba(120,170,255,0.75);font-weight:700">접속인원</span>
        <span style="font-size:13px;color:#fff;font-weight:800">${val}<span style="font-size:11px;color:rgba(120,170,255,0.55);font-weight:400"> / ${total}명</span></span>
      </div>`;
      return '';
    }
    const col=_RANK_LINE_COL[rank]||'#aaa';
    const lbl=rank==='전체'?'접속률':rank;
    return `<div style="display:flex;justify-content:space-between;align-items:center;gap:20px;margin-top:5px">
      <span style="font-size:12px;color:${col};font-weight:700">${lbl}</span>
      <span style="font-size:13px;color:#fff;font-weight:800">${val}%</span>
    </div>`;
  }).join('');
  document.getElementById('tooltip').innerHTML=`
    <div style="font-size:11px;color:var(--text3);margin-bottom:3px">${lbl} 접속률</div>
    <hr class="tt-sep"/>${rows}${cntRow}`;
  document.getElementById('tooltip').classList.add('show');
  moveTT(e);
}

// ── 기어스코어 분포도 ──────────────────────────────────────────

function buildGsDistChart(){
  const chartEl=document.getElementById('gdGsChart');
  const pieEl=document.getElementById('gdGsPie');
  if(!chartEl) return;

  const sv2=Object.values(STATS_DB_V2);
  const getGs=name=>(sv2.find(d=>d.character_name===name)||{}).gear_score||0;

  const allMembers=Object.keys(GUILD_DB).filter(n=>getGs(n)>0);

  const rankMembers={'전체':allMembers};
  allMembers.forEach(name=>{
    const gm=GUILD_DB[name];
    let r=gm.rank_name; if(!r) return;
    if(r==='길드마스터'||r==='고정멤버') r='버튜버';
    if(!rankMembers[r]) rankMembers[r]=[];
    rankMembers[r].push(name);
  });
  const orderedRanks=Object.keys(_RANK_LINE_COL).filter(r=>rankMembers[r]?.length);

  const activeRank=_gdRankFilter;
  const members=rankMembers[activeRank]||[];
  const gsVals=members.map(getGs).filter(v=>v>0);
  const rankCol=_RANK_LINE_COL[activeRank]||'#7ec8a0';

  const classCounts={};
  members.forEach(name=>{
    const cls=GUILD_DB[name]?.class_name;
    if(cls) classCounts[cls]=(classCounts[cls]||0)+1;
  });
  const classData=Object.entries(classCounts)
    .map(([cls,cnt])=>{
      const cid=CLASS_NAME_TO_ID[cls]||0;
      return {cls,cnt,col:CLASS_COLOR[cid]||'#a0a0a0'};
    })
    .sort((a,b)=>b.cnt-a.cnt);

  // 선택 직업의 GS 값 (더블 바 모드)
  let clsVals=null, clsCol=null;
  if(_gsDistSelectedClass){
    const clsMembers=members.filter(n=>GUILD_DB[n]?.class_name===_gsDistSelectedClass);
    clsVals=clsMembers.map(getGs).filter(v=>v>0);
    const cid=CLASS_NAME_TO_ID[_gsDistSelectedClass]||0;
    clsCol=CLASS_COLOR[cid]||'#a0a0a0';
  }

  chartEl.innerHTML=_buildGsBarSVG(gsVals,rankCol,clsVals,clsCol);

  if(pieEl){
    pieEl.innerHTML=_buildGsTreemapSVG(classData,members.length,_gsDistSelectedClass,rankCol);
  }
}

function _gsDistToggleRank(rank){ _gdToggleRank(rank); }

function _gsDistSelectClass(cls){
  _gsDistSelectedClass=(_gsDistSelectedClass===cls)?null:cls;
  buildGsDistChart();
}

function _buildGsBarSVG(vals,barCol,clsVals,clsCol){
  const VW=1000,VH=400,pL=40,pR=12,pT=16,pB=36;
  const cW=VW-pL-pR,cH=VH-pT-pB;
  if(!vals.length) return '<div style="color:var(--text3);padding:16px;font-size:13px">데이터 없음</div>';

  const BUCKET=100;
  const allVals=clsVals?[...vals,...clsVals]:vals;
  const minGs=Math.floor(Math.min(...allVals)/BUCKET)*BUCKET;
  const maxGs=Math.ceil(Math.max(...allVals)/BUCKET)*BUCKET;
  const buckets=[];
  for(let g=minGs;g<=maxGs;g+=BUCKET) buckets.push(g);
  const n=buckets.length;
  if(n<1) return '<div style="color:var(--text3);padding:16px;font-size:13px">데이터 없음</div>';

  const counts=buckets.map(b=>vals.filter(v=>v>=b&&v<b+BUCKET).length);
  const clsCounts=clsVals?buckets.map(b=>clsVals.filter(v=>v>=b&&v<b+BUCKET).length):null;
  const maxCount=Math.max(...counts,1);
  const baseY=pT+cH;
  const slotW=cW/n;
  const barW=Math.max(slotW*0.74,2);
  const barX=i=>pL+i*slotW+(slotW-barW)/2;
  const rx=barW<10?1:3;

  const hex=barCol.replace('#','');
  const rr=parseInt(hex.slice(0,2),16),gg=parseInt(hex.slice(2,4),16),bb=parseInt(hex.slice(4,6),16);

  const grids=[0,0.25,0.5,0.75,1].map(v=>{
    const y=(pT+(1-v)*cH).toFixed(1);
    return `<line x1="${pL}" y1="${y}" x2="${VW-pR}" y2="${y}" stroke="rgba(255,255,255,.06)" stroke-width="1"/>
      <text x="${pL-5}" y="${y}" text-anchor="end" dominant-baseline="central" font-size="10" fill="#b8b8b8">${Math.round(v*maxCount)}</text>`;
  }).join('');

  const tickStep=Math.max(1,Math.floor(n/12));
  const xTicks=buckets.map((b,i)=>{
    if(i%tickStep!==0&&i!==n-1) return '';
    return `<text x="${(barX(i)+barW/2).toFixed(1)}" y="${VH-pB+14}" text-anchor="middle" font-size="10" fill="#b8b8b8">${b}</text>`;
  }).join('');

  const bars=buckets.map((b,i)=>{
    const cnt=counts[i];
    const h=Math.max((cnt/maxCount)*cH,cnt>0?1:0);
    const x=barX(i).toFixed(1);
    const bw=barW.toFixed(1);

    if(clsCounts){
      // 더블 바: 배경=전체(회색), 전경=선택직업(컬러 오버레이)
      const clsCnt=clsCounts[i];
      const bgH=Math.max(h,0);
      const fgH=Math.max((clsCnt/maxCount)*cH,clsCnt>0?1:0);
      const bgBar=bgH>0?`<rect x="${x}" y="${(baseY-bgH).toFixed(1)}" width="${bw}" height="${bgH.toFixed(1)}" rx="${rx}" fill="rgba(255,255,255,.12)"/>`:'' ;
      const fgBw=(barW*0.6).toFixed(1);
      const fgX=(barX(i)+(barW-barW*0.6)/2).toFixed(1);
      const fgBar=fgH>0?`<rect x="${fgX}" y="${(baseY-fgH).toFixed(1)}" width="${fgBw}" height="${fgH.toFixed(1)}" rx="${rx}" fill="${clsCol}" opacity="0.88"/>`:'' ;
      const hover=`<rect x="${x}" y="${pT}" width="${bw}" height="${cH}" fill="transparent"
        onmouseenter="_gsDistTT(event,'${b}',${cnt},${clsCnt})"
        onmousemove="moveTT(event)" onmouseleave="hideTT()"/>`;
      return bgBar+fgBar+hover;
    }else{
      const opacity=0.55+0.45*(cnt/maxCount);
      return `<rect x="${x}" y="${(baseY-h).toFixed(1)}" width="${bw}" height="${h.toFixed(1)}" rx="${rx}"
        fill="rgba(${rr},${gg},${bb},${opacity.toFixed(2)})"
        onmouseenter="_gsDistTT(event,'${b}',${cnt})"
        onmousemove="moveTT(event)" onmouseleave="hideTT()"/>`;
    }
  }).join('');

  return `<svg width="100%" height="100%" viewBox="0 0 ${VW} ${VH}" style="display:block;overflow:visible;" preserveAspectRatio="xMidYMid meet">
    ${grids}${xTicks}${bars}
  </svg>`;
}

function _treemapLayout(items,x,y,w,h,gap){
  if(!items.length) return [];
  if(items.length===1) return [{item:items[0],x,y,w,h}];
  const total=items.reduce((s,d)=>s+d.cnt,0);
  let acc=0,splitIdx=items.length-1;
  for(let i=0;i<items.length-1;i++){
    acc+=items[i].cnt;
    if(acc*2>=total){splitIdx=i+1;break;}
  }
  const leftFrac=items.slice(0,splitIdx).reduce((s,d)=>s+d.cnt,0)/total;
  const left=items.slice(0,splitIdx),right=items.slice(splitIdx);
  if(w>=h){
    const lw=Math.max(0,w*leftFrac-gap/2);
    const rw=Math.max(0,w-lw-gap);
    return[..._treemapLayout(left,x,y,lw,h,gap),..._treemapLayout(right,x+lw+gap,y,rw,h,gap)];
  }else{
    const lh=Math.max(0,h*leftFrac-gap/2);
    const rh=Math.max(0,h-lh-gap);
    return[..._treemapLayout(left,x,y,w,lh,gap),..._treemapLayout(right,x,y+lh+gap,w,rh,gap)];
  }
}

const _CLS_EN={전사:'warrior',성기사:'paladin',사냥꾼:'hunter',도적:'rogue',사제:'priest',주술사:'shaman',마법사:'mage',흑마법사:'warlock',드루이드:'druid'};
function _buildGsTreemapSVG(classData,total,selectedCls,rankCol){
  if(!total||!classData.length) return '<div style="color:var(--text3);padding:16px;font-size:13px">데이터 없음</div>';
  const VW=280,VH=220,GAP=3;
  const BADGE_H=15,BADGE_R=4,PX=6,ICON_SZ=18,NAME_FZ=8;
  const PAD=2;
  const rects=_treemapLayout(classData,PAD,PAD,VW-PAD*2,VH-PAD*2,GAP);

  const cells=rects.map(({item,x,y,w,h},i)=>{
    const isSelected=selectedCls===item.cls;
    const pct=Math.round(item.cnt/total*100);
    const clsCol=item.col||'#a0a0a0';
    const baseCol=rankCol||'#7ec8a0';
    const rankOpacity=Math.min(0.75,0.1+pct*0.018).toFixed(2);
    const dim=selectedCls&&!isSelected?' opacity="0.28"':'';
    const sel=isSelected?` stroke="${clsCol}" stroke-width="2"`:'';
    const iconUrl=`https://wow.zamimg.com/images/wow/icons/large/classicon_${_CLS_EN[item.cls]||'warrior'}.jpg`;
    const badgeW=pct>=10?30:24;
    const badgeBx=x+w-badgeW-PX;
    const badgeBy=y+h-BADGE_H-PX;
    const badgeCy=badgeBy+BADGE_H/2;
    const showIcon=h>24&&w>24;
    const nameX=x+PX+ICON_SZ+4;
    const nameY=y+PX+ICON_SZ/2+NAME_FZ/3;
    const showName=showIcon&&w>60&&h>36;
    const showBadge=w>=badgeW+PX*2&&h>=BADGE_H+PX*2;

    return `<g style="cursor:pointer"${dim}
      onclick="_gsDistSelectClass('${item.cls}')"
      onmouseenter="_gsPieTT(event,'${item.cls}',${item.cnt},${pct})"
      onmousemove="moveTT(event)" onmouseleave="hideTT()">
      <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="7" fill="${baseCol}" fill-opacity="${rankOpacity}"${sel}/>
      ${showIcon?`<image href="${iconUrl}" x="${(x+PX).toFixed(1)}" y="${(y+PX).toFixed(1)}" width="${ICON_SZ}" height="${ICON_SZ}" style="image-rendering:auto" clip-path="inset(0 round 4px)"/>`:''}
      ${showName?`<text x="${nameX.toFixed(1)}" y="${nameY.toFixed(1)}" font-size="${NAME_FZ}" font-weight="800" fill="rgba(255,255,255,0.85)" letter-spacing="0.3">${item.cls}</text>`:''}
      ${showBadge?`<rect x="${badgeBx.toFixed(1)}" y="${badgeBy.toFixed(1)}" width="${badgeW}" height="${BADGE_H}" rx="${BADGE_R}" fill="transparent"/>
      <text x="${(badgeBx+badgeW/2).toFixed(1)}" y="${badgeCy.toFixed(1)}" font-size="9" font-weight="700" fill="#fff" text-anchor="middle" dominant-baseline="central">${pct}%</text>`:''}
    </g>`;
  }).join('');

  return `<svg width="100%" height="100%" viewBox="0 0 ${VW} ${VH}" style="display:block;" preserveAspectRatio="xMidYMid meet">
    ${cells}
  </svg>`;
}

function _gsDistTT(e,gs,cnt,clsCnt){
  const tt=document.getElementById('tooltip');
  if(clsCnt!==undefined&&_gsDistSelectedClass){
    const pct=cnt>0?Math.round(clsCnt/cnt*100):0;
    tt.innerHTML=`
      <div style="font-size:11px;color:var(--text3);margin-bottom:3px">GS ${gs} ~ ${+gs+100}</div>
      <hr class="tt-sep"/>
      <div style="display:flex;justify-content:space-between;gap:16px;margin-top:5px">
        <span style="font-size:12px;color:var(--text3)">전체</span>
        <span style="font-size:13px;color:#fff;font-weight:800">${cnt}명</span>
      </div>
      <div style="display:flex;justify-content:space-between;gap:16px;margin-top:4px">
        <span style="font-size:12px;color:var(--text3)">${_gsDistSelectedClass}</span>
        <span style="font-size:13px;color:#fff;font-weight:800">${clsCnt}명 (${pct}%)</span>
      </div>`;
  }else{
    tt.innerHTML=`
      <div style="font-size:11px;color:var(--text3);margin-bottom:3px">GS ${gs} ~ ${+gs+100}</div>
      <hr class="tt-sep"/>
      <div style="font-size:13px;color:#fff;font-weight:800;margin-top:5px">${cnt}명</div>`;
  }
  tt.classList.add('show');
  moveTT(e);
}

function _gsPieTT(e,cls,cnt,pct){
  document.getElementById('tooltip').innerHTML=`
    <div style="font-size:12px;color:var(--text2);margin-bottom:3px">${cls}</div>
    <hr class="tt-sep"/>
    <div style="display:flex;justify-content:space-between;gap:16px;margin-top:5px">
      <span style="font-size:12px;color:var(--text3)">인원</span>
      <span style="font-size:13px;color:#fff;font-weight:800">${cnt}명</span>
    </div>
    <div style="display:flex;justify-content:space-between;gap:16px;margin-top:4px">
      <span style="font-size:12px;color:var(--text3)">비율</span>
      <span style="font-size:13px;color:#fff;font-weight:800">${pct}%</span>
    </div>`;
  document.getElementById('tooltip').classList.add('show');
  moveTT(e);
}

function _buildActActivityCard(){
  const funnelEl=document.getElementById('gdActFunnel');
  if(!funnelEl) return;

  const now=Date.now();
  const KST=9*60*60*1000;
  const todayKST=Math.floor((now+KST)/86400000);
  const toKSTDays=ms=>todayKST-Math.floor((ms+KST)/86400000);
  const daysSince=ts=>{
    if(!ts) return null;
    const n=typeof ts==='number'?ts:new Date(ts).getTime();
    if(isNaN(n)) return null;
    const ms=n<1e12?n*1000:n;
    return toKSTDays(ms);
  };

  // 활성 등급 색상 기반 TIERS 생성
  const activeRank=(_actLineActive&&_actLineActive.size)?[..._actLineActive][0]:'전체';
  const baseCol=_RANK_LINE_COL[activeRank]||'#7ec8a0';
  const [_br,_bg,_bb]=[parseInt(baseCol.slice(1,3),16),parseInt(baseCol.slice(3,5),16),parseInt(baseCol.slice(5,7),16)];
  const mkCol=(a)=>`rgba(${_br},${_bg},${_bb},${a})`;
  const TIERS=[
    {label:'3일 이내',  col:mkCol(1.0),  bg:mkCol(0.15), max:3},
    {label:'7일 이내',  col:mkCol(0.75), bg:mkCol(0.10), max:7},
    {label:'14일 이내', col:mkCol(0.50), bg:mkCol(0.07), max:14},
    {label:'14일 초과', col:'rgba(120,120,120,1)', bg:'rgba(120,120,120,.08)', max:null},
  ];

  // 등급 필터 적용
  const rankMembersLocal={'전체':Object.keys(GUILD_DB)};
  Object.entries(GUILD_DB).forEach(([name,gm])=>{
    let r=gm.rank_name; if(!r) return;
    if(r==='길드마스터') r='버튜버';
    if(!rankMembersLocal[r]) rankMembersLocal[r]=[];
    rankMembersLocal[r].push(name);
  });
  const filteredMembers=rankMembersLocal[activeRank]||Object.keys(GUILD_DB);

  const counts=[0,0,0,0];
  filteredMembers.forEach(name=>{
    const gm=GUILD_DB[name]||{};
    const logData=window.LOGIN_LOG_DB?.[name]||{};
    const logDates=Object.keys(logData).sort();
    const lastLogDate=logDates[logDates.length-1];
    const days=lastLogDate ? toKSTDays(new Date(lastLogDate).getTime()) : daysSince(gm.last_login_timestamp);
    if(days===null) return;
    if(days<=3) counts[0]++;
    else if(days<=7) counts[1]++;
    else if(days<=14) counts[2]++;
    else counts[3]++;
  });

  const total=counts.reduce((s,c)=>s+c,0)||1;
  funnelEl.innerHTML=TIERS.map((t,i)=>{
    const pct=Math.round(counts[i]/total*100);
    return `<div class="af-row-sm">
      <div class="af-row-header-sm">
        <span style="font-size:12px;font-weight:700;color:var(--text2)">${t.label}</span>
        <span style="font-size:12px;font-weight:900;color:${t.col}">${counts[i]}명</span>
      </div>
      <div class="af-bar-wrap-sm" style="${pct>=85?'position:relative;':''}">
        <div class="af-bar-fill" style="width:${Math.max(pct,4)}%;background:${t.col};opacity:.7;"></div>
        <span style="font-size:15px;font-weight:800;${pct>=85?'position:absolute;right:5px;top:50%;transform:translateY(-50%);color:#fff;':`padding-left:5px;color:${t.col};`}white-space:nowrap;">${pct}%</span>
      </div>
    </div>`;
  }).join('');
}

function _buildAttendRankTable(){
  const el=document.getElementById('gdAttendRank');
  if(!el)return;

  const now=new Date();
  const curYear=now.getFullYear();
  const curMonth=now.getMonth();
  const prevMonth=curMonth===0?11:curMonth-1;
  const prevYear=curMonth===0?curYear-1:curYear;

  const btnEl2=document.getElementById('gdAttendMonthBtn');
  if(btnEl2){
    const lbl=_attendRankMonth===0?'날짜':_attendRankMonth==='0'?'날짜':_attendRankMonth+'월';
    btnEl2.textContent=lbl+' ▾';
  }
  const rangeStart=new Date(prevYear,prevMonth,8);
  const rangeEnd=new Date(curYear,curMonth+1,0);
  const today=new Date(curYear,curMonth,now.getDate());
  const startDow=(rangeStart.getDay()+6)%7;
  const gridStart=new Date(prevYear,prevMonth,8-startDow);
  const weeks=Math.ceil((rangeEnd.getTime()-gridStart.getTime())/86400000/7)+1;

  const aprilTotal=new Date(prevYear,prevMonth+1,0).getDate()-7; // 4/8~4/30 = 23일
  const mayTotal=now.getDate(); // 현달 오늘까지 일수
  const isPrev=_attendRankMonth===prevMonth+1;
  const isCur=_attendRankMonth===curMonth+1;

  const RANK_COLOR={'길드마스터':'#ffd700','고정멤버':'#7ec8a0','버튜버':'#d4789a','스윗기사단':'#b07adb','네임드':'#b07adb','시청자':'#708899'};
  const nowMs=Date.now();
  const loginLabel=ts=>{
    if(!ts)return '';
    const n=typeof ts==='number'?ts:new Date(ts).getTime();
    if(isNaN(n))return '';
    const ms=n<1e12?n*1000:n;
    const diffM=Math.floor((nowMs-ms)/60000);
    if(diffM<60)return `${diffM}분 전`;
    const diffH=Math.floor(diffM/60);
    if(diffH<24)return `${diffH}시간 전`;
    return `${Math.floor(diffH/24)}일 전`;
  };

  const LATE_TRACKED={32308503:'4/27',32453304:'4/27',32452781:'4/25',32310249:'4/12',31838936:'4/17'};

  const rows=[];
  for(const [name,gm] of Object.entries(GUILD_DB)){
    const rank=gm.rank_name;
    if(rank!=='버튜버'&&rank!=='길드마스터'&&rank!=='고정멤버')continue;
    const loginDates=window.LOGIN_LOG_DB?.[name]||{};

    const trackNote=LATE_TRACKED[gm.character_id]?`※ ${LATE_TRACKED[gm.character_id]} 데이터 권한 허용`:'';

    const inferredDates=new Set();
    for(const [ds,times] of Object.entries(loginDates)){
      if(!times||!times.length)continue;
      if(times.some(t=>parseInt(t.slice(0,2),10)<10)){
        const [_y,_m,_d]=ds.split('-').map(Number);
        const pd=new Date(_y,_m-1,_d-1);
        const prev=`${pd.getFullYear()}-${String(pd.getMonth()+1).padStart(2,'0')}-${String(pd.getDate()).padStart(2,'0')}`;
        if(!loginDates[prev])inferredDates.add(prev);
      }
    }

    let aprilDays=0,mayDays=0;
    let maxStreak=0,curStreak=0;
    let cells='';
    for(let w=0;w<weeks;w++){
      for(let d=0;d<7;d++){
        const date=new Date(gridStart.getTime()+(w*7+d)*86400000);
        if(date<rangeStart||date>rangeEnd){cells+=`<div class="hm-cell hm-empty"></div>`;continue;}
        const y=date.getFullYear(),m=date.getMonth()+1,dy=date.getDate();
        const ds=`${y}-${String(m).padStart(2,'0')}-${String(dy).padStart(2,'0')}`;
        const loginTime=loginDates[ds]||null;
        const isInferred=!loginTime&&inferredDates.has(ds);
        const isActive=!!(loginTime||isInferred);
        if(date>=rangeStart&&date<=today){
          if(isActive){
            if(date.getMonth()===prevMonth)aprilDays++;
            else if(date.getMonth()===curMonth)mayDays++;
            curStreak++;
            if(curStreak>maxStreak)maxStreak=curStreak;
          } else {
            curStreak=0;
          }
        }
        const lt=loginTime?`'${loginTime.join('|')}'`:'null';
        cells+=`<div class="hm-cell${isActive?' hm-on':''}${isInferred?' hm-inferred':''}" onmouseenter="showHeatmapTT('${ds}',${lt},event,false,${isInferred})" onmousemove="moveTT(event)" onmouseleave="hideTT()"></div>`;
      }
    }

    const aprilPct=Math.round(aprilDays/aprilTotal*100);
    const mayPct=Math.round(mayDays/mayTotal*100);
    const totalPct=Math.round((aprilDays+mayDays)/(aprilTotal+mayTotal)*100);
    const hmGrid=`<div class="hm-wrap hm-multi"><div class="hm-grid" style="grid-template-columns:repeat(${weeks},10px)">${cells}</div></div>`;
    rows.push({name,gm,aprilDays,aprilPct,aprilTotal,mayDays,mayPct,mayTotal,totalPct,maxStreak,hmGrid,trackNote});
  }

  if(isPrev) rows.sort((a,b)=>b.aprilPct-a.aprilPct||b.mayPct-a.mayPct);
  else if(isCur) rows.sort((a,b)=>b.mayPct-a.mayPct||b.aprilPct-a.aprilPct);
  else rows.sort((a,b)=>b.totalPct-a.totalPct||b.mayPct-a.mayPct);

  // 공동 등수 계산 (dense ranking: 1,1,2,3...)
  let tiedRank=1;
  for(let i=0;i<rows.length;i++){
    if(i>0){
      const p=rows[i-1],c=rows[i];
      const diff=isPrev?(c.aprilPct!==p.aprilPct):isCur?(c.mayPct!==p.mayPct):(c.totalPct!==p.totalPct);
      if(diff) tiedRank++;
    }
    rows[i].rank=tiedRank;
  }

  _attendRankRows=rows;

  const PAGE_SIZE=10;
  const totalPages=Math.ceil(rows.length/PAGE_SIZE);
  if(_attendRankPage>=totalPages)_attendRankPage=Math.max(0,totalPages-1);
  const pageStart=_attendRankPage*PAGE_SIZE;
  const pageRows=rows.slice(pageStart,pageStart+PAGE_SIZE);

  const pageBtn=(label,page,disabled,active)=>
    `<button class="st-page-btn${active?' active':''}" ${disabled?'disabled':''} onclick="attendGoPage(${page})">${label}</button>`;
  let paginationHtml='';
  if(totalPages>1){
    const p=_attendRankPage;
    let btns=pageBtn('&laquo;',0,p===0,false);
    btns+=pageBtn('&#8249;',p-1,p===0,false);
    const start=Math.max(0,p-2),end=Math.min(totalPages-1,p+2);
    if(start>0)btns+=`<span class="st-page-ellipsis">…</span>`;
    for(let i=start;i<=end;i++)btns+=pageBtn(i+1,i,false,i===p);
    if(end<totalPages-1)btns+=`<span class="st-page-ellipsis">…</span>`;
    btns+=pageBtn('&#8250;',p+1,p===totalPages-1,false);
    btns+=pageBtn('&raquo;',totalPages-1,p===totalPages-1,false);
    paginationHtml=`<div class="st-pagination">${btns}<span class="st-page-info">${pageStart+1}–${Math.min(pageStart+PAGE_SIZE,rows.length)} / ${rows.length}명</span></div>`;
  }

  const rowsHtml=pageRows.map((r,i)=>{
    const globalIdx=pageStart+i;
    const rcol=RANK_COLOR[r.gm.rank_name]||'var(--text3)';
    const rankBadge=r.gm.rank_name
      ?`<span style="color:${rcol};font-size:11px;font-weight:700;padding:2px 7px;border-radius:4px;border:1px solid ${rcol}44;background:${rcol}11">${r.gm.rank_name}</span>`
      :'';
    const pctColor=p=>p>=70?'#7ec8a0':p>=40?'#d4a855':'rgba(255,255,255,.35)';
    const numCls=r.rank===1?'r1':r.rank===2?'r2':r.rank===3?'r3':'';
    const rowBg=r.rank===1?'background:linear-gradient(90deg,rgba(43, 255, 0, 0.07) 0%,transparent 60%);'
      :r.rank===2?'background:linear-gradient(90deg,rgba(192,192,192,.07) 0%,transparent 60%);'
      :r.rank===3?'background:linear-gradient(90deg,rgba(205,127,50,.07) 0%,transparent 60%);'
      :'';
    const clsId=CLASS_NAME_TO_ID[r.gm.class_name];
    const clsCol=CLASS_COLOR[clsId]||'var(--text3)';
    const charId=r.gm.character_id||null;
    const soopEntry=(charId&&window._soopMapById?.[charId])||window._soopMap?.[r.name]||null;
    const imgSrc=soopEntry?.profile_img||r.gm.avatar_img||null;
    const imgHtml=imgSrc
      ?`<img src="${imgSrc}" alt="${r.name}" class="st-rank-avatar" style="border-color:${clsCol}" onerror="this.style.display='none'">`
      :`<div class="st-rank-avatar-empty" style="border-color:${clsCol}">${EMOJI_MAP[clsId]||'⚔'}</div>`;
    return `<tr style="${rowBg}">
      <td class="num ${numCls}">${r.rank}</td>
      <td class="img-col">${imgHtml}</td>
      <td class="nick-col"><div class="st-rank-name">${r.name}</div>${r.trackNote?`<div style="font-size:10px;color:rgba(255,196,64,.7);margin-top:2px">${r.trackNote}</div>`:''}</td>
      <td class="login-col" style="font-size:11px;color:rgba(255,255,255,.45);line-height:1.6">${loginLabel(r.gm.last_login_timestamp)}</td>
      <td class="rank-col">${rankBadge}</td>
      <td style="padding:8px 10px;vertical-align:middle">${r.hmGrid}</td>
      <td style="width:1px;padding:3px 12px;text-align:right;white-space:nowrap"><span style="font-size:15px;font-weight:900;color:${r.maxStreak>=14?'#7ec8a0':r.maxStreak>=7?'#d4a855':'rgba(255,255,255,.5)'}">${r.maxStreak}</span><span style="font-size:11px;color:rgba(255,255,255,.3);margin-left:2px">일</span></td>
      ${isPrev?`<td style="width:1px;padding:3px 8px 3px 12px;font-size:15px;font-weight:900;color:${pctColor(r.aprilPct)};text-align:right;white-space:nowrap">${r.aprilPct}%<span style="font-size:11px;font-weight:500;color:rgba(255,255,255,.3);margin-left:4px">(${r.aprilDays}/${r.aprilTotal})</span></td>`:isCur?`<td style="width:1px;padding:3px 8px 3px 12px;font-size:15px;font-weight:900;color:${pctColor(r.mayPct)};text-align:right;white-space:nowrap">${r.mayPct}%<span style="font-size:11px;font-weight:500;color:rgba(255,255,255,.3);margin-left:4px">(${r.mayDays}/${r.mayTotal})</span></td>`:`<td style="width:1px;padding:3px 8px 3px 12px;font-size:15px;font-weight:900;color:${pctColor(r.totalPct)};text-align:right;white-space:nowrap">${r.totalPct}%<span style="font-size:11px;font-weight:500;color:rgba(255,255,255,.3);margin-left:4px">(${r.aprilDays+r.mayDays}/${r.aprilTotal+r.mayTotal})</span></td>`}
    </tr>`;
  }).join('');

  el.innerHTML=`<div class="st-rank-table-wrap">
    <table class="st-rank-table">
      <thead><tr>
        <th class="num">#</th>
        <th class="img-col"></th>
        <th class="nick-col">닉네임</th>
        <th class="login-col">기준</th>
        <th class="rank-col">등급</th>
        <th style="min-width:60px;text-align:left;padding-left:10px">접속 기록</th>
        <th style="width:1px;text-align:right;padding:3px 12px;white-space:nowrap">최대 연속 접속일</th>
        ${isPrev?`<th style="width:1px;text-align:right;padding:3px 8px 3px 12px;white-space:nowrap">${prevMonth+1}월 접속률<span style="font-size:10px;font-weight:400;color:rgb(255, 255, 255);margin-left:4px">(4/8~)</span></th>`:isCur?`<th style="width:1px;text-align:right;padding:3px 8px 3px 12px;white-space:nowrap">${curMonth+1}월 접속률</th>`:`<th style="width:1px;text-align:right;padding:3px 8px 3px 12px;white-space:nowrap">총 접속률</th>`}
      </tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  </div>${paginationHtml}`;
}

function _showNoDataTT(e){
  const tt=document.getElementById('tooltip');
  const names=_gdNoDataNames;
  const rows=names.map(name=>{
    const gm=GUILD_DB[name]||{};
    const RANK_COLOR={'길드마스터':'#ffd700','고정멤버':'#7ec8a0','버튜버':'#d4789a','스윗기사단':'#b07adb','네임드':'#88aadd','시청자':'#708899'};
    const rcol=RANK_COLOR[gm.rank_name]||'var(--text3)';
    return `<div style="display:flex;justify-content:space-between;gap:16px;padding:2px 0;font-size:12px">
      <span style="color:var(--text)">${name}</span>
      <span style="color:${rcol};font-size:11px">${gm.rank_name||''}</span>
    </div>`;
  }).join('');
  tt.innerHTML=`
    <div style="font-size:12px;font-weight:700;color:var(--text2);margin-bottom:6px">데이터 접근 불가 유저</div>
    <hr class="tt-sep"/>
    <div style="margin-top:6px">${rows}</div>
    <div style="margin-top:8px;font-size:11px;color:var(--text3);line-height:1.6;border-top:1px solid rgba(255,255,255,.08);padding-top:6px">※ 배틀넷 계정설정에서 [게임 데이터 및 프로필 공개설정] - [사용함] 체크가 되어있는지 확인해주세요 (비활성화시 데이터 수집이 불가능합니다)</div>`;
  tt.classList.add('show');
  moveTT(e);
}

