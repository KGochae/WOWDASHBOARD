// ── 마크다운 → HTML 변환 (간이) ──────────────────────────────
function _md(text){
  return text
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/^## (.+)$/gm,'<h2>$1</h2>')
    .replace(/^### (.+)$/gm,'<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,'<em>$1</em>')
    .replace(/`([^`]+)`/g,'<code>$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g,'<a href="$2" target="_blank">$1</a>')
    .replace(/^- (.+)$/gm,'<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>)(\n<li>|$)/g,(m,li,next)=>li+(next==='\n<li>'?'\n<li>':''))
    .replace(/(<li>.*(?:\n<li>.*)*)/g,'<ul>$&</ul>')
    .split('\n\n').map(b=>b.startsWith('<h')||b.startsWith('<ul')?b:`<p>${b.replace(/\n/g,'<br>')}</p>`).join('\n');
}

// ── 공지사항 렌더 ─────────────────────────────────────────────
function renderNoticesPage(){
  const el=document.getElementById('noticesBody');
  const notices=window._notices||[];
  if(!notices.length){el.innerHTML='<div class="notice-empty">등록된 공지사항이 없습니다.</div>';return;}
  el.innerHTML=[...notices].reverse().map(n=>`
    <div class="notice-card">
      <div class="notice-date">${n.date||''}</div>
      <div class="notice-title">${n.title||'(제목 없음)'}</div>
      <div class="notice-md">${_md(n.content||'')}</div>
    </div>
  `).join('');
}

// ── 페이지 전환 ──────────────────────────────────────────────
function showViewer(){
  document.getElementById('page-landing').style.display='none';
  document.getElementById('page-viewer').style.display='flex';
}
function goBack(){
  document.getElementById('page-viewer').style.display='none';
  const l=document.getElementById('page-landing');
  l.style.display='flex';
  document.getElementById('landingInput').value='';
  document.getElementById('landingError').classList.remove('show');
  history.replaceState(null,'',location.pathname);
}
function goStats(){
  showViewer();
  switchVTab('stats');
}

// ── 탭 전환 ─────────────────────────────────────────────────
function switchTab(tab){
  currentTab=tab;
  // no tabs in new UI
  // no tabs
  // no tabs
  // always visible
  // always visible
  // always visible
  // stats auto-updates
}
let currentLmClass=null;
// 한국어 직업명 → class_skill_tree.json 키 매핑
const KR_TO_TREE_KEY={
  '마법사':'mage','전사':'warrior','드루이드':'druid',
  '사냥꾼':'hunter','사제':'priest','성기사':'paladin',
  '도적':'rogue','주술사':'shaman','흑마법사':'warlock'
};
function buildLoadmapPreview(cls){
  const container=document.getElementById('talentTrees');
  container.innerHTML='';

  const treeKey=KR_TO_TREE_KEY[cls];
  const classTrees=treeKey&&window.TBC_CLASS_TREES?.[treeKey];

  if(!classTrees){
    container.innerHTML='<div style="color:var(--text3);font-size:15.6px;padding:16px">로드맵 데이터 없음</div>';
    return;
  }

  for(const [specKr, treeId] of Object.entries(classTrees)){
    const entries=window.TBC_TREE_MAP?.[treeId]||[];
    const specEn=window.TBC_TREE_EN_NAME?.[treeId]||specKr;

    const grid={};
    let maxRow=0;
    for(const e of entries){
      const r=Number(e.row),c=Number(e.col);
      if(!grid[r])grid[r]={};
      grid[r][c]=e;
      if(r>maxRow)maxRow=r;
    }

    const treeEl=document.createElement('div');treeEl.className='spec-tree';
    treeEl.style.backgroundImage=`linear-gradient(rgba(0,0,0,.75),rgba(0,0,0,.75)),url('images/talent_background_tbc/${treeKey}_${treeId}.jpg')`;
    treeEl.style.backgroundSize='cover';
    treeEl.style.backgroundPosition='center';
    treeEl.style.border='1px solid rgba(255,255,255,.06)';
    const headerEl=document.createElement('div');headerEl.className='spec-tree-header';
    headerEl.innerHTML=`<div class="spec-tree-name">${specKr}</div><div style="margin-left:auto;font-size:11.7px;opacity:.4">${specEn}</div>`;
    treeEl.appendChild(headerEl);

    const gridEl=document.createElement('div');gridEl.className='spec-tree-grid';
    gridEl.style.gridTemplateColumns='repeat(4,46px)';

    for(let row=0;row<=maxRow;row++){
      for(let col=0;col<=3;col++){
        const e=grid[row]?.[col];
        if(e){
          const iconEl=document.createElement('div');
          iconEl.className='t-icon';
          iconEl.title=`${e.ranks?.[0]?.name||e.id}  (r${row} c${col})`;
          const img=document.createElement('img');
          img.src=e.icon?`${WH_ICON}/${e.icon}.jpg`:`${WH_ICON}/inv_misc_questionmark.jpg`;
          img.alt=e.ranks?.[0]?.name||String(e.id);
          iconEl.appendChild(img);
          gridEl.appendChild(iconEl);
        } else {
          const ph=document.createElement('div');ph.className='t-icon-ph';
          gridEl.appendChild(ph);
        }
      }
    }

    treeEl.appendChild(gridEl);
    container.appendChild(treeEl);
  }
}
function switchTalentGroup(group){
  currentTalentGroup=group;
  document.getElementById('tgtab-active').classList.toggle('active',group==='active');
  document.getElementById('tgtab-secondary').classList.toggle('active',group==='secondary');
  if(currentChar)buildTalentTrees(currentChar);
}

// ── Hash Routing ─────────────────────────────────────────────
function _setHash(h){ history.replaceState(null,'','#'+encodeURIComponent(h)); }
function _pushHash(h){
  const cur=decodeURIComponent(location.hash.replace('#',''));
  if(cur===h){ history.replaceState(null,'','#'+encodeURIComponent(h)); return; }
  history.pushState(null,'','#'+encodeURIComponent(h));
}
window.addEventListener('popstate',()=>{ if(typeof GUILD_DB!=='undefined'&&Object.keys(GUILD_DB).length) _initFromHash(); });

// hash → vtab 매핑
const _HASH_TO_TAB={
  '아이템검색':'items','공지사항':'notices','캐릭터뷰어':'viewer',
  '스탯랭킹':'stats','특성인챈트통계':'stats','레이드':'raid'
};
const _TAB_CONTAINER={
  viewer:'viewer-column',items:'item-setup-main-area',
  stats:'stats-main-area',notices:'notices-main-area',
  raid:'raid-main-area',compare:'compare-main-area'
};

// 데이터 로드 전: 즉시 해당 탭 UI 표시 (렌더링 없이)
function _preloadFromHash(){
  const h=decodeURIComponent(location.hash.replace('#',''));
  const tab=_HASH_TO_TAB[h];
  if(!tab) return;
  showViewer();
  Object.entries(_TAB_CONTAINER).forEach(([t,id])=>{
    const el=document.getElementById(id);
    if(el) el.style.display=(t===tab?(t==='raid'?'block':'flex'):'none');
  });
  const sidebar=document.querySelector('.sidebar');
  if(sidebar) sidebar.style.display=(tab==='raid'||tab==='stats'||tab==='items')?'none':'';
  if(tab==='stats'){
    const isSkill=h==='특성인챈트통계';
    const rankPanel=document.getElementById('stpanel-rank');
    const skillPanel=document.getElementById('stpanel-skill');
    if(rankPanel) rankPanel.style.display=isSkill?'none':'flex';
    if(skillPanel) skillPanel.style.display=isSkill?'flex':'none';
    if(!isSkill){
      try{
        const rf=localStorage.getItem('stRankFilterHTML');
        const cp=localStorage.getItem('stClsPickerHTML');
        if(rf){const el=document.getElementById('stRankFilter');if(el)el.innerHTML=rf;}
        if(cp){const el=document.getElementById('stClsPicker');if(el)el.innerHTML=cp;}
      }catch(e){}
    }
  }
}

// 데이터 로드 후: 정상 switchVTab 호출로 렌더링
function _initFromHash(){
  const h=decodeURIComponent(location.hash.replace('#',''));
  const map={
    '아이템검색':()=>{showViewer();switchVTab('items');},
    '공지사항':()=>{showViewer();switchVTab('notices');},
    '캐릭터뷰어':()=>{showViewer();switchVTab('viewer');},
    '스탯랭킹':()=>{showViewer();switchVTab('stats');switchStTab('rank');},
    '특성인챈트통계':()=>{showViewer();switchVTab('stats');switchStTab('skill');},
    '레이드':()=>{showViewer();switchVTab('raid');},
  };
  if(h && map[h]) { map[h](); return; }
}

_preloadFromHash();

