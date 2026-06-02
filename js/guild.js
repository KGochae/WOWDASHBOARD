function toggleSidebar(){
  document.getElementById('sidebar').classList.toggle('collapsed');
}

// ── CENTER INFO CARD 접기/펼치기 ─────────────────────────────
function toggleCenterInfoCard(){
  const body=document.getElementById('centerInfoCard');
  const icon=document.getElementById('centerInfoCardToggleIcon');
  const collapsed=body.style.display==='none';
  body.style.display=collapsed?'':'none';
  if(icon) icon.textContent=collapsed?'▼':'▶';
}

// ── 길드 UI 빌드 ─────────────────────────────────────────────
const CLASS_NAME_TO_ID={전사:1,성기사:2,사냥꾼:3,도적:4,사제:5,주술사:7,마법사:8,흑마법사:9,드루이드:11};
function buildGuildUI(){
  const catEl=document.getElementById('sidebarCats');
  const classCatEl=document.getElementById('sidebarClassCats');
  const allNames=new Set([...Object.keys(GUILD_DB),...Object.keys(SPEC_DB)]);

  // 등급 카테고리: 전체/마스터/고정/버튜버/시청자 — 전체 제외 다중선택
  const RANK_COL={'고정멤버':'#7ec8a0','버튜버':'#d4789a','스윗기사단':'#b07adb','네임드':'#b07adb','시청자':'#6a9fd4'};
  const rankCats=[
    {id:'all',label:'전체'},
    {id:'고정멤버',label:'고멤'},
    {id:'버튜버',label:'버튜버'},
    {id:'스윗기사단',label:'스윗기사단'},
    {id:'네임드',label:'네임드'},
    {id:'시청자',label:'시청자'},
  ];
  catEl.innerHTML=`<div class="sidebar-cat-label">길드</div>`+rankCats.map(c=>{
    const col=RANK_COL[c.id]||'';
    const isInit=c.id==='버튜버';
    const style=col&&isInit?` style="color:${col};border-color:${col}88;background:${col}22"`:' style=""';
    return `<div class="sidebar-cat${isInit?' active':''}" role="button" tabindex="0" data-rank="${c.id}" data-color="${col}"${style} onclick="setRankFilter('${c.id}')">${c.label}</div>`;
  }).join('');

  // 직업 카테고리
  const existingClasses=[...new Set([...allNames].map(n=>GUILD_DB[n]?.class_name).filter(Boolean))].sort();
  const initCls='사냥꾼';
  classCatEl.innerHTML=`<div class="sidebar-cat-label">클래스</div>`+existingClasses.map(cls=>{
    const cid=CLASS_NAME_TO_ID[cls];
    const col=CLASS_COLOR[cid]||'var(--gold)';
    const isInit=cls===initCls;
    const style=isInit?` style="color:${col};border-color:${col}88;background:${col}22"`:' style=""';
    return `<div class="sidebar-cat class-cat${isInit?' active':''}" role="button" tabindex="0" data-class="${cls}" data-color="${col}"${style}
      onclick="setClassFilter('${cls}')">${cls}</div>`;
  }).join('');

  window._allNames=[...allNames];
  window._rankFilters=new Set(['버튜버']);
  window._classFilter=initCls;
  window._specFilter='all';
  buildSpecCats(initCls);
  applyGuildFilter();
}

function setRankFilter(rank){
  if(!window._rankFilters) window._rankFilters=new Set(['all']);
  if(rank==='all'){
    window._rankFilters=new Set(['all']);
  }else{
    window._rankFilters.delete('all');
    if(window._rankFilters.has(rank)) window._rankFilters.delete(rank);
    else window._rankFilters.add(rank);
    if(window._rankFilters.size===0) window._rankFilters.add('all');
  }
  document.querySelectorAll('.sidebar-cat[data-rank]').forEach(b=>{
    const on=window._rankFilters.has(b.dataset.rank);
    b.classList.toggle('active',on);
    const col=b.dataset.color||'';
    if(on&&col){
      b.style.color=col;
      b.style.borderColor=col+'88';
      b.style.background=col+'22';
    }else{
      b.style.color='';
      b.style.borderColor='';
      b.style.background='';
    }
  });
  applyGuildFilter();
}

function setClassFilter(cls){
  const isActive=window._classFilter===cls;
  window._classFilter=isActive?'all':cls;
  document.querySelectorAll('.sidebar-cat[data-class]').forEach(b=>{
    const on=b.dataset.class===window._classFilter;
    b.classList.toggle('active',on);
    const col=b.dataset.color||'';
    if(on){
      b.style.color=col;
      b.style.borderColor=col+'88';
      b.style.background=col+'22';
    }else{
      b.style.color='';
      b.style.borderColor='';
      b.style.background='';
    }
  });
  buildSpecCats(window._classFilter);
  applyGuildFilter();
}

function buildSpecCats(cls){
  const el=document.getElementById('sidebarSpecCats');
  if(!el)return;
  window._specFilter='all';
  if(!cls||cls==='all'){el.innerHTML='';return;}
  const cid=CLASS_NAME_TO_ID[cls];
  const col=CLASS_COLOR[cid]||'var(--gold)';
  const specs=new Set();
  (window._allNames||[]).forEach(n=>{
    if(GUILD_DB[n]?.class_name!==cls)return;
    const top=(SPEC_DB[n]?.active||[]).reduce((b,s)=>s.pts>b.pts?s:b,{pts:0,spec:''});
    if(top.spec)specs.add(top.spec);
  });
  if(!specs.size){el.innerHTML='';return;}
  el.innerHTML=`<div class="sidebar-cat-label">특성</div>`+[...specs].map(spec=>{
    const safe=spec.replace(/'/g,"\\'");
    return `<div class="sidebar-cat spec-cat" role="button" tabindex="0" data-spec="${spec}" data-color="${col}" style="" onclick="setSpecFilter('${safe}')">${spec}</div>`;
  }).join('');
}

function setSpecFilter(spec){
  const isActive=window._specFilter===spec;
  window._specFilter=isActive?'all':spec;
  document.querySelectorAll('.spec-cat').forEach(b=>{
    const on=b.dataset.spec===window._specFilter;
    b.classList.toggle('active',on);
    const col=b.dataset.color||'';
    if(on){
      b.style.color=col;
      b.style.borderColor=col+'88';
      b.style.background=col+'22';
    }else{
      b.style.color='';
      b.style.borderColor='';
      b.style.background='';
    }
  });
  applyGuildFilter();
}

function applyGuildFilter(){
  const listEl=document.getElementById('sidebarList');
  let names=window._allNames||[];
  const rankFilters=window._rankFilters||new Set(['all']);
  const cls=window._classFilter||'all';

  if(!rankFilters.has('all')) names=names.filter(n=>{
    const r=GUILD_DB[n]?.rank_name;
    return rankFilters.has(r)||(r==='길드마스터'&&rankFilters.has('버튜버'));
  });
  if(cls!=='all')  names=names.filter(n=>GUILD_DB[n]?.class_name===cls);

  const spec=window._specFilter||'all';
  if(spec!=='all') names=names.filter(n=>{
    const top=(SPEC_DB[n]?.active||[]).reduce((b,s)=>s.pts>b.pts?s:b,{pts:0,spec:''});
    return top.spec===spec;
  });

  names.sort((a,b)=>(STATS_DB_V2[b]?.gear_score||0)-(STATS_DB_V2[a]?.gear_score||0));

  const RANK_COLOR={'길드마스터':'#ffd700','고정멤버':'#7ec8a0','버튜버':'#d4789a','스윗기사단':'#b07adb','네임드':'#b07adb'};
  const _ac2=currentChar?.name;
  listEl.innerHTML=names.map(n=>{
    const gm=GUILD_DB[n]||{};
    const col=CLASS_COLOR[gm.class_id]||'#5a5268';
    const cn=gm.class_name||'';
    const rBorderCol=RANK_COLOR[gm.rank_name]||'rgba(255,255,255,.2)';
    const charId=gm.character_id||null;
    const soopEntry=(charId&&window._soopMapById?.[charId])||window._soopMap?.[n]||null;
    const avatarSrc=soopEntry?.profile_img||gm.avatar_img||null;
    const emoji=(CHAR_DB[n]?.emoji)||'⚔';
    const avatarHtml=avatarSrc
      ?`<img class="gr-avatar" src="${avatarSrc}" style="border-color:${rBorderCol}" alt="${n}">`
      :`<div class="gr-avatar-ph" style="border-color:${rBorderCol};color:${col}">${emoji}</div>`;
    const specs=SPEC_DB[n]||{};
    const topSpec=(specs.active||[]).reduce((best,sp)=>sp.pts>best.pts?sp:best,{pts:0,spec:''});
    const specName=topSpec.spec||'';
    return `<div class="guild-row${n===_ac2?' active':''}"
      role="button" tabindex="0"
      draggable="true"
      data-name="${n}"
      ondragstart="cmpDragStart(event,'${n.replace(/'/g,"\\'")}')"
      onclick="quickSelect('${n.replace(/'/g,"\\'")}','sidebar')">
      ${avatarHtml}
      <div class="gr-info">
        <div class="gr-name">${n}</div>
        ${specName?`<div class="gr-spec">${specName}</div>`:''}
      </div>
      <div class="gr-right">
        <div class="gr-gs">GS ${Math.round(STATS_DB_V2[n]?.gear_score||0)||''}</div>
        ${cn?`<div class="gr-cls" style="color:${col}">${cn}</div>`:''}
      </div>
    </div>`;
  }).join('');
}

// 하위 호환
function filterGuild(cat){ setRankFilter(cat==='all'?'all':cat); }

function syncSidebarToChar(name){
  const gm=GUILD_DB[name]||{};
  const rank=gm.rank_name==='길드마스터'?'버튜버':gm.rank_name||'';
  const cls=gm.class_name||'';
  if(!rank&&!cls)return;

  if(rank){
    window._rankFilters=new Set([rank]);
    document.querySelectorAll('.sidebar-cat[data-rank]').forEach(b=>{
      const on=window._rankFilters.has(b.dataset.rank);
      b.classList.toggle('active',on);
      const col=b.dataset.color||'';
      if(on&&col){b.style.color=col;b.style.borderColor=col+'88';b.style.background=col+'22';}
      else{b.style.color='';b.style.borderColor='';b.style.background='';}
    });
  }
  if(cls){
    window._classFilter=cls;
    document.querySelectorAll('.sidebar-cat[data-class]').forEach(b=>{
      const on=b.dataset.class===cls;
      b.classList.toggle('active',on);
      const col=b.dataset.color||'';
      if(on){b.style.color=col;b.style.borderColor=col+'88';b.style.background=col+'22';}
      else{b.style.color='';b.style.borderColor='';b.style.background='';}
    });
    buildSpecCats(cls);
  }
  applyGuildFilter();
}

function quickSelect(name,source){
  if(CHAR_DB[name]||SPEC_DB[name]||STATS_DB[name]||GUILD_DB[name]){
    document.getElementById('landingError').classList.remove('show');
    if(document.getElementById('page-landing').style.display!=='none')showViewer();
    switchVTab('viewer');
    selectChar(name);
    if(source&&typeof window.logFA==='function')window.logFA('search_character_'+source,{name});
  }else{
    document.getElementById('landingError').classList.add('show');
    document.getElementById('landingErrorMsg').textContent=`"${name}" — 해당 유저가 없습니다`;
  }
}

// ── 로그인 잔디 렌더링 ────────────────────────────────────────
function renderLoginHeatmap(name, rankName){
  const el=document.getElementById('charBarRight');
  if(!el)return;

  const loginDates=window.LOGIN_LOG_DB?.[name]||{};
  const fsDate=window.LOGIN_FS_DB?.[name]||null;

  // 오전 9시 미만(00~08시) 로그아웃이면 전날도 로그인으로 간주
  const inferredDates=new Set();
  for(const [dateStr,times] of Object.entries(loginDates)){
    if(!times||!times.length)continue;
    const hasEarlyHour=times.some(t=>parseInt(t.slice(0,2),10)<10);
    if(hasEarlyHour){
      const [_y,_m,_d]=dateStr.split('-').map(Number);
      const pd=new Date(_y,_m-1,_d-1);
      const prev=`${pd.getFullYear()}-${String(pd.getMonth()+1).padStart(2,'0')}-${String(pd.getDate()).padStart(2,'0')}`;
      if(!loginDates[prev])inferredDates.add(prev);
    }
  }

  // 범위: 첫 로그인 월 ~ 현재 월 말일 (전체 이력)
  const now=new Date();
  const curYear=now.getFullYear(), curMonth=now.getMonth();

  let startYear=curYear, startMonth=curMonth;
  const allDates=Object.keys(loginDates).sort();
  if(allDates.length){
    startYear=parseInt(allDates[0].slice(0,4));
    startMonth=parseInt(allDates[0].slice(5,7))-1;
  }

  const rangeStart=new Date(startYear,startMonth,1);
  const rangeEnd=new Date(curYear,curMonth+1,0);

  // 그리드 시작: rangeStart 주의 월요일
  const startDow=(rangeStart.getDay()+6)%7;
  const gridStart=new Date(startYear,startMonth,1-startDow);

  // 총 주 수
  const weeks=Math.ceil((rangeEnd.getTime()-gridStart.getTime())/86400000/7)+1;

  // 셀 빌드
  let cells='';
  for(let w=0;w<weeks;w++){
    for(let d=0;d<7;d++){
      const date=new Date(gridStart.getTime()+(w*7+d)*86400000);
      if(date<rangeStart||date>rangeEnd){
        cells+=`<div class="hm-cell hm-empty"></div>`;
        continue;
      }
      const y=date.getFullYear(),m=date.getMonth(),dy=date.getDate();
      const dateStr=`${y}-${String(m+1).padStart(2,'0')}-${String(dy).padStart(2,'0')}`;
      if(fsDate&&dateStr<fsDate){
        cells+=`<div class="hm-cell hm-empty"></div>`;
        continue;
      }
      const loginTime=loginDates[dateStr]||null;
      const isInferred=!loginTime&&inferredDates.has(dateStr);
      const isActive=!!(loginTime||isInferred);
      const lt=loginTime?`'${loginTime.join('|')}'`:'null';
      cells+=`<div class="hm-cell${isActive?' hm-on':''}${isInferred?' hm-inferred':''}" onmouseenter="showHeatmapTT('${dateStr}',${lt},event,false,${isInferred})" onmousemove="moveTT(event)" onmouseleave="hideTT()"></div>`;
    }
  }

  el.innerHTML=`
    <div class="hm-wrap hm-multi">
      <div class="hm-scroll-outer">
        <div class="hm-grid" style="grid-template-columns:repeat(${weeks},10px)">${cells}</div>
      </div>
    </div>`;

  const _outer=el.querySelector('.hm-scroll-outer');
  if(_outer)_outer.scrollLeft=_outer.scrollWidth;
}

// ── 캐릭터 선택 ──────────────────────────────────────────────
function selectChar(name){
  const char=CHAR_DB[name]||null;
  const gm=GUILD_DB[name]||{};
  currentChar={name,...(char||{})};

  document.getElementById('charName').textContent=name;
  if(typeof _syncRefreshBtnState==='function')_syncRefreshBtnState(name);

  // 아바타 — soop 프로필 우선(character_id 매칭), 없으면 wow 아바타
  const avatarEl=document.getElementById('charAvatar');
  const charId=gm.character_id||char?.character_id||null;
  const soopEntry=(charId&&window._soopMapById?.[charId])||window._soopMap?.[name]||null;
  const soopImg=soopEntry?.profile_img||null;
  const avatarSrc=soopImg||gm.avatar_img||null;
  if(avatarSrc){
    avatarEl.innerHTML=`<img src="${avatarSrc}" alt="${name}" onerror="this.src='${gm.avatar_img||''}';this.onerror=()=>{this.parentNode.textContent='${(char?.emoji)||'⚔'}'}"/>`;
  }else avatarEl.textContent=(char?.emoji)||'⚔';
  const _AVATAR_RANK_COLOR={'길드마스터':'#ffd700','고정멤버':'#7ec8a0','버튜버':'#d4789a','스윗기사단':'#b07adb','네임드':'#b07adb'};
  avatarEl.style.borderColor=_AVATAR_RANK_COLOR[gm.rank_name]||'var(--border2)';

  // 메타 배지
  const fdidKey=`${char?.race_id}_${char?.viewer_gender}`;
  const hasMo3=char&&!!FDID_MAP[fdidKey];
  const RCOL={'인간':'#e8c890','드워프':'#c89858','나이트 엘프':'#b888d8','노움':'#f8a8c8','드레나이':'#88c8f8'};
  const CCOL={'전사':'#c69b3a','성기사':'#f48cba','사냥꾼':'#aad372','도적':'#fff468','사제':'#c2d6e8','주술사':'#2090e0','마법사':'#69ccf0','흑마법사':'#9482c9','드루이드':'#ff7c0a'};
  const rn=char?.race_name||gm.race_name||'';
  const cn=char?.class_name||gm.class_name||'';
  const rc=RCOL[rn]||'#c4a870'; const cc=CCOL[cn]||'#c4a870';
  document.getElementById('charLevel').textContent=gm.level?`LV.${gm.level}`:'LV.—';
  const lastLogin=(()=>{
    const kst=gm.last_login_timestamp_KST;
    if(!kst)return '';
    const loginMs=Date.parse(kst.replace(' ','T')+'+09:00');
    if(isNaN(loginMs))return '';
    const diffMs=Date.now()-loginMs;
    const diffMin=Math.floor(diffMs/60000);
    if(diffMin<1)return '방금 전';
    if(diffMin<60)return `${diffMin}분 전`;
    const diffH=Math.floor(diffMin/60);
    if(diffH<24)return `${diffH}시간 전`;
    const diffD=Math.floor(diffH/24);
    if(diffD<30)return `${diffD}일 전`;
    const diffMo=Math.floor(diffD/30);
    return `${diffMo}개월 전`;
  })();
  // 스킬 pts 표시
  const specs=SPEC_DB[name]||{};
  const topSpec=(specs.active||[]).reduce((best,sp)=>sp.pts>best.pts?sp:best,{pts:0,spec:''});

  document.getElementById('charBadges').innerHTML=`
    ${cn?`<span class="cbadge" style="color:${cc};border-color:${cc}33;font-weight:800">${cn}</span>`:''}
    ${topSpec.spec?`<span class="cbadge" style="color:${cc};border-color:${cc}22">${topSpec.spec}</span>`:''}
    ${soopEntry?.soop_url?`<a class="cbadge cbadge-soop" href="${soopEntry.soop_url}" target="_blank" rel="noopener"><img src="/images/logo/SOOP_LOGO_White.svg" class="cbadge-soop-logo" alt="SOOP"></a>`:''}
    ${(gm.rank_name&&gm.rank_name!=='버튜버'&&gm.rank_name!=='길드마스터')?(()=>{const rc=_AVATAR_RANK_COLOR[gm.rank_name]||'#888';return`<span class="cbadge cbadge-rank" style="color:${rc};border-color:${rc}44">${gm.rank_name}</span>`;})():''}
    ${lastLogin?`<span class="cbadge" style="color:var(--text2);border-color:var(--border);font-size:13px">🕐 ${lastLogin}</span>`:''}
  `;
  const activeTop=(specs.active||[]).reduce((b,sp)=>sp.pts>b.pts?sp:b,{pts:0,spec:''});
  const secTop=(specs.secondary||[]).reduce((b,sp)=>sp.pts>b.pts?sp:b,{pts:0,spec:''});
  document.getElementById('active-pts').textContent=activeTop.spec||'';
  document.getElementById('secondary-pts').textContent=secTop.spec||'';

  // model-wrap 배경 — active 메인 특성 이미지
  const _mw=document.querySelector('.model-wrap');
  if(_mw){
    const _slug=KR_TO_TREE_KEY[cn];
    const _tid=_slug&&window.TBC_CLASS_TREES?.[_slug]?.[activeTop.spec];
    if(_slug&&_tid){
      _mw.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)),url('images/talent_background_tbc/${_slug}_${_tid}.jpg')`;
      _mw.style.backgroundSize='cover';
      _mw.style.backgroundPosition='center';
      _mw.style.maskImage='radial-gradient(ellipse at center, black 40%, transparent 99%)';
      _mw.style.webkitMaskImage='radial-gradient(ellipse at center, black 40%, transparent 99%)';
    }else{
      _mw.style.backgroundImage='';
      _mw.style.maskImage='';
      _mw.style.webkitMaskImage='';
    }
  }

  // 로그인 잔디
  renderLoginHeatmap(name, gm.rank_name||'');

  // 장비창 & 렌더
  if(char){
    buildEquipment(char);
    buildItemStatsPanel(char);
    buildQualityBar(char);
    buildGsLineChart(char.name);
    buildInfoCard(char);
    // 이전 WebGL 뷰어 정리 — canvas를 DOM에서 제거하기 전에 수행해야 참조 유효
    if(window._lastViewer){
      try{ window._lastViewer.setAnimPaused(true); }catch(e){}
      try{
        const _pc=document.querySelector('#model_3d canvas');
        if(_pc){
          const _gl=_pc.getContext('webgl')||_pc.getContext('experimental-webgl');
          _gl?.getExtension('WEBGL_lose_context')?.loseContext();
        }
      }catch(e){}
      window._lastViewer=null;
    }
    document.getElementById('model_3d').innerHTML=
      `<div class="overlay" id="overlay"><div class="spin"></div><div class="overlay-text">소환 중...</div></div>`;
    document.getElementById('loadBar').style.width='0';
    document.getElementById('sidebarList')?.classList.add('rendering');
    renderChar();
  } else {
    // 장비 데이터 없음 — 슬롯 초기화 + 뷰어 메시지
    ['colLeft','colRight','colBottom'].forEach(id=>{ document.getElementById(id).innerHTML=''; });
    buildItemStatsPanel(null);
    buildQualityBar(null);
    buildGsLineChart(name);
    buildInfoCard(null);
    document.getElementById('model_3d').innerHTML=
      `<div class="overlay" style="opacity:1;pointer-events:none">
        <div class="no-data-msg">※ 배틀넷 계정설정에서 [게임 데이터 및 프로필 공개설정] - [사용함] 체크가 되어있는지 확인해주세요. (비활성화시 데이터 수집이 불가능합니다)</div>
      </div>`;
  }

  // 탤런트 트리 / 아이템 분석
  buildTalentTrees(currentChar);
  const _itemPanel=document.getElementById('pr-item-panel');
  if(_itemPanel&&_itemPanel.style.display!=='none'&&typeof buildItemAnalysis==='function')
    buildItemAnalysis(currentChar);
  // 사이드바 active 클래스만 토글 (전체 재빌드 없이)
  document.querySelectorAll('#sidebarList .guild-row').forEach(r=>{
    r.classList.toggle('active',r.dataset.name===name);
  });
  // stats 패널 즉시 갱신
  if(typeof buildStatsView==='function')buildStatsView(currentChar);
  else if(typeof buildStatsPanel==='function')buildStatsPanel(currentChar);
}

// ── 캐릭터 새로고침 ───────────────────────────────────────────
const WORKER_URL = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ? 'http://localhost:8787'
  : 'https://wow-proxy.wowak.workers.dev';

const REFRESH_COOLDOWN_MS = 5 * 60 * 1000;
function _rbSet(btn,icon,txt){if(!btn)return;const ic=btn.querySelector('.rbtn-icon'),lb=btn.querySelector('.rbtn-txt');if(ic)ic.textContent=icon;if(lb)lb.textContent=txt;}
const _REFRESH_LS_KEY = 'wowak_refresh_last_at';
let _refreshTicker = null;

function _loadRefreshMap() {
  try { return JSON.parse(localStorage.getItem(_REFRESH_LS_KEY) || '{}'); }
  catch { return {}; }
}
function _saveRefreshAt(name) {
  const m = _loadRefreshMap();
  m[name] = Date.now();
  // 만료된 엔트리 청소
  const cutoff = Date.now() - REFRESH_COOLDOWN_MS;
  for (const k of Object.keys(m)) if (m[k] < cutoff) delete m[k];
  try { localStorage.setItem(_REFRESH_LS_KEY, JSON.stringify(m)); } catch {}
}
function _getRefreshAt(name) {
  return _loadRefreshMap()[name] || 0;
}

function _setRefreshBar(pct, visible) {
  const bar  = document.getElementById('charRefreshBar');
  const fill = document.getElementById('charRefreshBarFill');
  if (!bar || !fill) return;
  bar.style.opacity = visible ? '1' : '0';
  fill.style.width  = pct + '%';
}

function _syncRefreshBtnState(name) {
  const btn = document.getElementById('charRefreshBtn');
  if (!btn) return;
  btn.classList.remove('spinning');
  if (_refreshTicker) { clearInterval(_refreshTicker); _refreshTicker = null; }
  const last = _getRefreshAt(name) || 0;
  const remain = REFRESH_COOLDOWN_MS - (Date.now() - last);
  if (remain <= 0) {
    _rbSet(btn,'↻','Update');
    btn.style.color = '#f2f4f7';
    btn.style.cursor = 'pointer';
    btn.style.pointerEvents = '';
    return;
  }
  const render = () => {
    const r = REFRESH_COOLDOWN_MS - (Date.now() - _getRefreshAt(name));
    if (r <= 0) { _syncRefreshBtnState(name); return; }
    const s = Math.ceil(r / 1000);
    const mm = Math.floor(s / 60), ss = s % 60;
    _rbSet(btn,'↻',`${mm}:${String(ss).padStart(2,'0')}`);
  };
  btn.style.color = '#888';
  btn.style.cursor = 'not-allowed';
  btn.style.pointerEvents = 'none';
  render();
  _refreshTicker = setInterval(render, 1000);
}

async function refreshCurrentCharacter() {
  if (!currentChar?.name) return;
  const name = currentChar.name;
  const btn = document.getElementById('charRefreshBtn');

  const last = _getRefreshAt(name) || 0;
  if (Date.now() - last < REFRESH_COOLDOWN_MS) return;

  if (_refreshTicker) { clearInterval(_refreshTicker); _refreshTicker = null; }
  if (btn) {
    _rbSet(btn,'↻','Update');
    btn.style.color = '#888';
    btn.style.cursor = 'not-allowed';
    btn.style.pointerEvents = 'none';
    btn.classList.add('spinning');
  }
  _setRefreshBar(0, true);
  requestAnimationFrame(() => _setRefreshBar(85, true));
  const _barTimer = setTimeout(() => _setRefreshBar(95, true), 3000);

  try {
    const res = await fetch(`${WORKER_URL}/blizzard/character/${encodeURIComponent(name)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const fresh = await res.json();
    if (fresh.error) throw new Error(fresh.error);

    // GUILD_DB: rank는 보존 (Blizzard API에서 안 옴), 메타만 갱신
    const prevGuild = GUILD_DB[name] || {};
    GUILD_DB[name] = {
      ...prevGuild,
      character_id:             fresh.character_id || prevGuild.character_id,
      level:                    fresh.level ?? prevGuild.level,
      class_name:               fresh.class_name || prevGuild.class_name,
      class_id:                 fresh.class_id || prevGuild.class_id,
      avatar_img:               fresh.avatar_img || prevGuild.avatar_img,
      last_login_timestamp:     fresh.last_login_timestamp ?? prevGuild.last_login_timestamp,
      last_login_timestamp_KST: fresh.last_login_timestamp_KST || prevGuild.last_login_timestamp_KST,
      snapshot_date:            fresh.snapshot_date || prevGuild.snapshot_date,
      average_item_level:       fresh.average_item_level ?? prevGuild.average_item_level,
    };

    // STATS_DB / STATS_DB_V2 갱신
    if (fresh.stats) {
      const statsObj = { character_name: name, ...fresh.stats, honorable_kills: fresh.honorable_kills || 0 };
      STATS_DB[name]    = statsObj;
      STATS_DB_V2[name] = statsObj;
    }

    // SPEC_DB 갱신
    const specEntry = _buildSpecDbEntry(fresh.specializations);
    if (specEntry) SPEC_DB[name] = specEntry;

    // CHAR_DB: items 변환 + 기존 appearance/race_id 등 보존
    const prevChar = CHAR_DB[name] || {};
    const itemsObj = _buildItemsObjFromEquipment(fresh.equipment);
    CHAR_DB[name] = {
      ...prevChar,
      name,
      class_name:         fresh.class_name || prevChar.class_name,
      class_id:           fresh.class_id || prevChar.class_id,
      race_id:            fresh.race_id || prevChar.race_id,
      average_item_level: fresh.average_item_level ?? prevChar.average_item_level,
      items:              itemsObj,
    };

    // 파생 스탯 재계산 (gear_score / attack_power 보정 / skill_rating / resilience_rating / 세트 효과)
    _recomputeCharDerivedStats(name);

    // 상위%/평균 바 캐시 무효화 (클래스 단위로 캐싱되므로 해당 클래스 전체 삭제)
    const _refreshClass = GUILD_DB[name]?.class_name || CHAR_DB[name]?.class_name;
    if (_refreshClass && typeof _statRankCache !== 'undefined') delete _statRankCache[_refreshClass];

    // LOGIN_LOG_DB 즉시 머지
    if (fresh.last_login_timestamp_KST && typeof fresh.last_login_timestamp_KST === 'string') {
      const m = fresh.last_login_timestamp_KST.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})$/);
      if (m) {
        const [, date, time] = m;
        window.LOGIN_LOG_DB = window.LOGIN_LOG_DB || {};
        window.LOGIN_LOG_DB[name] = window.LOGIN_LOG_DB[name] || {};
        const arr = window.LOGIN_LOG_DB[name][date] = window.LOGIN_LOG_DB[name][date] || [];
        if (!arr.includes(time)) arr.push(time);
        window.LOGIN_FS_DB = window.LOGIN_FS_DB || {};
        window.LOGIN_FS_DB[name] = window.LOGIN_FS_DB[name] || date;
      }
    }

    // GS_LOG_RAW 즉시 머지 — 활성 스펙 기준
    const _gs = STATS_DB_V2[name]?.gear_score;
    if (_gs && fresh.snapshot_date) {
      const utcMs = Date.parse(fresh.snapshot_date.replace(' ', 'T') + 'Z');
      if (!isNaN(utcMs)) {
        const kstDate = new Date(utcMs + 9 * 3600 * 1000).toISOString().slice(0, 10);
        const activeSpec = (SPEC_DB[name]?.active || []).reduce((b, s) => s.pts > b.pts ? s : b, { pts: 0, spec: '' }).spec || '';
        if (activeSpec) {
          window.GS_LOG_RAW = window.GS_LOG_RAW || {};
          window.GS_LOG_RAW[name] = window.GS_LOG_RAW[name] || {};
          window.GS_LOG_RAW[name][kstDate] = window.GS_LOG_RAW[name][kstDate] || {};
          window.GS_LOG_RAW[name][kstDate][activeSpec] = { gs: Math.round(_gs) };
        }
      }
    }

    _saveRefreshAt(name);
    selectChar(name);
  } catch (e) {
    console.error('refresh failed:', e);
    clearTimeout(_barTimer);
    _setRefreshBar(0, false);
    if (btn) {
      _rbSet(btn,'✕','');
      setTimeout(() => _syncRefreshBtnState(name), 2000);
    }
    return;
  }

  clearTimeout(_barTimer);
  _setRefreshBar(100, true);
  setTimeout(() => _setRefreshBar(0, false), 400);
  _syncRefreshBtnState(name);
}
