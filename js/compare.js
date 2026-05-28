// ── 캐릭터 비교 ──────────────────────────────────────────────
let _cmpLeft=null,_cmpRight=null;

function cmpDragStart(e,name){
  e.dataTransfer.setData('cmp-char',name);
  e.dataTransfer.effectAllowed='copy';
}
function cmpDragOver(e,side){
  e.preventDefault();
  document.getElementById(side==='left'?'cmpCardL':'cmpCardR').classList.add('cmp-dz-over');
}
function cmpDragLeave(e,side){
  if(e.currentTarget.contains(e.relatedTarget))return;
  document.getElementById(side==='left'?'cmpCardL':'cmpCardR').classList.remove('cmp-dz-over');
}
function cmpDrop(e,side){
  e.preventDefault();
  document.getElementById(side==='left'?'cmpCardL':'cmpCardR').classList.remove('cmp-dz-over');
  const name=e.dataTransfer.getData('cmp-char');
  if(name) cmpSetChar(side,name);
}
function cmpSetChar(side,name){
  if(side==='left') _cmpLeft=name; else _cmpRight=name;
  renderCmpSlot(side);
  renderCmpStats();
}
function cmpClear(side){
  if(side==='left') _cmpLeft=null; else _cmpRight=null;
  renderCmpSlot(side);
  renderCmpStats();
}
function renderCmpSlot(side){
  const name=side==='left'?_cmpLeft:_cmpRight;
  const el=document.getElementById(side==='left'?'cmpCardL':'cmpCardR');
  if(!el)return;
  if(!name){
    el.innerHTML=`<div class="cmp-empty"><div style="font-size:33.8px;opacity:.15">⚔</div><div>드래그하여 배치</div></div>`;
    return;
  }
  const gm=GUILD_DB[name]||{};
  const ch=CHAR_DB[name];
  const cid=gm.class_id||CLASS_NAME_TO_ID[gm.class_name]||0;
  const col=CLASS_COLOR[cid]||'#a0a0a0';
  const avatarContent=gm.avatar_img
    ?`<img src="${gm.avatar_img}" alt="${name}" onerror="this.parentNode.innerHTML='${ch?.emoji||'⚔'}'"/>`
    :(ch?.emoji||'⚔');
  el.innerHTML=`<div class="cmp-char-inner">
    <div class="cmp-avatar">${avatarContent}</div>
    <div class="cmp-char-info">
      <div class="cmp-char-name">${name}</div>
      <div class="cmp-char-badges">
        ${gm.level?`<span class="cmp-badge" style="color:var(--text2)">Lv.${gm.level}</span>`:''}
        ${gm.race_name?`<span class="cmp-badge" style="color:#c4a870">${gm.race_name}</span>`:''}
        ${gm.class_name?`<span class="cmp-badge" style="color:${col};border-color:${col}33">${gm.class_name}</span>`:''}
        ${gm.rank_name?`<span class="cmp-badge">${gm.rank_name}</span>`:''}
      </div>
    </div>
    <div class="cmp-close" onclick="cmpClear('${side}')">×</div>
  </div>`;
}
function renderCmpStats(){
  const el=document.getElementById('cmpStatsBody');
  if(!el)return;
  if(!_cmpLeft&&!_cmpRight){el.innerHTML='<div class="cmp-notice">두 캐릭터를 배치하면 핵심 스탯을 비교합니다</div>';return;}
  if(!_cmpLeft||!_cmpRight){el.innerHTML='<div class="cmp-notice">한 명을 더 배치해주세요</div>';return;}
  const gmL=GUILD_DB[_cmpLeft]||{},gmR=GUILD_DB[_cmpRight]||{};
  const clsL=gmL.class_name||'',clsR=gmR.class_name||'';
  const stL=STATS_DB[_cmpLeft]||{},stR=STATS_DB[_cmpRight]||{};
  const colL=CLASS_COLOR[CLASS_NAME_TO_ID[clsL]]||'#a0a0a0';
  const colR=CLASS_COLOR[CLASS_NAME_TO_ID[clsR]]||'#a0a0a0';
  // 두 직업 key stats 합집합 (중복 제거)
  const seen=new Set();const defs=[];
  [...(CLASS_KEY_STATS[clsL]||[]),...(CLASS_KEY_STATS[clsR]||[])].forEach(s=>{
    if(!seen.has(s.k)){seen.add(s.k);defs.push(s);}
  });
  if(!defs.length){el.innerHTML='<div class="cmp-notice">스탯 정의 없음</div>';return;}
  const floatKeys=new Set(['melee_crit','spell_crit','ranged_crit','melee_haste','spell_haste','ranged_haste','dodge','parry','block']);
  const sameClass=clsL===clsR;
  let html=sameClass
    ?`<div class="cmp-stat-sec-title">⚔ ${clsL} 핵심 스탯</div>`
    :`<div class="cmp-stat-sec-title" style="color:var(--ps-yellow)">⚠ 다른 직업 비교 — ${clsL} vs ${clsR}</div>`;
  for(const {k,l,f} of defs){
    const vL=stL[k]||0,vR=stR[k]||0;
    if(vL===0&&vR===0)continue;
    const maxV=Math.max(vL,vR,0.001);
    const pL=Math.round(vL/maxV*100),pR=Math.round(vR/maxV*100);
    const fmt=v=>floatKeys.has(k)?`${v.toFixed(1)}%`:f==='dps'?v.toFixed(1):f==='int'?v.toLocaleString():Math.round(v).toLocaleString();
    const winL=vL>vR,winR=vR>vL,tie=vL===vR;
    // 승자: 직업 컬러 / 패자: 밝은 회색
    const barColL=winL||tie?colL:'rgba(180,180,180,.35)';
    const barColR=winR||tie?colR:'rgba(180,180,180,.35)';
    const txtColL=winL||tie?colL:'var(--text3)';
    const txtColR=winR||tie?colR:'var(--text3)';
    const diff=Math.abs(vL-vR);
    const diffStr=tie?'=':(floatKeys.has(k)?`+${diff.toFixed(1)}%`:f==='dps'?`+${diff.toFixed(1)}`:`+${Math.round(diff).toLocaleString()}`);
    const diffCol=tie?'var(--text3)':winL?colL:colR;
    html+=`<div class="cmp-stat-row">
      <span class="cmp-val cmp-val-l${winL?' cmp-win':''}" style="color:${txtColL}">${fmt(vL)}</span>
      <div class="cmp-bar-track cmp-bar-mirror"><div class="cmp-bar-fill" style="width:${pL}%;background:${barColL}"></div></div>
      <div class="cmp-stat-name">${l}<br><span style="font-size:10.4px;font-weight:800;color:${diffCol};letter-spacing:.2px">${diffStr}</span></div>
      <div class="cmp-bar-track"><div class="cmp-bar-fill" style="width:${pR}%;background:${barColR}"></div></div>
      <span class="cmp-val cmp-val-r${winR?' cmp-win':''}" style="color:${txtColR}">${fmt(vR)}</span>
    </div>`;
  }
  el.innerHTML=`<div class="cmp-stat-sec-title" style="margin-bottom:4px;color:var(--text3)">
    <span style="color:${colL}">${_cmpLeft}</span>
    <span style="margin:0 10px;color:var(--text3)">vs</span>
    <span style="color:${colR}">${_cmpRight}</span>
  </div>${html}`;
  // 바 애니메이션
  requestAnimationFrame(()=>{
    document.querySelectorAll('#cmpStatsBody .cmp-bar-fill').forEach(b=>{
      const w=b.style.width;b.style.width='0';
      requestAnimationFrame(()=>{b.style.width=w;});
    });
  });
}
window.cmpDragStart=cmpDragStart;window.cmpDragOver=cmpDragOver;
window.cmpDragLeave=cmpDragLeave;window.cmpDrop=cmpDrop;window.cmpClear=cmpClear;

window.renderChar=renderChar;window.searchChar=searchChar;
window.searchFromViewer=searchFromViewer;window.goBack=goBack;
window.switchTab=switchTab;window.switchTalentGroup=switchTalentGroup;
window.filterGuild=filterGuild;window.quickSelect=quickSelect;
window.setRankFilter=setRankFilter;window.setClassFilter=setClassFilter;
window.applyGuildFilter=applyGuildFilter;
window.addLog=addLog;window.buildStatsView=buildStatsView;
window.toggleSidebar=toggleSidebar;
window.toggleCenterInfoCard=toggleCenterInfoCard;

// ── waitFor 유틸 ─────────────────────────────────────────────
function waitFor(condition,timeout=10000,msg='타임아웃'){
  return new Promise((resolve,reject)=>{
    const start=Date.now();
    const check=()=>{
      if(condition())return resolve();
      if(Date.now()-start>timeout)return reject(new Error(msg));
      setTimeout(check,200);
    };
    check();
  });
}

loadData();
