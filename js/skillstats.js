// ── SKILL / ITEM 통계 ────────────────────────────────────────

// 싱글턴 커스텀 툴팁
let _skTip=null;
function _getSkTip(){
  if(!_skTip){
    _skTip=document.createElement('div');
    _skTip.id='sk-hover-tip';
    document.body.appendChild(_skTip);
    document.addEventListener('scroll',_hideSkTip,true);
  }
  return _skTip;
}
function _hideSkTip(){if(_skTip)_skTip.style.display='none';}

function _showSkTip(e, entry, iconSrc, pct, count, total){
  const tip=_getSkTip();
  const nm=entry.ranks?.[0]?.name||String(entry.id);
  const desc=entry.ranks?.[0]?.description||'';

  tip.innerHTML=`
    <div class="sk-tip-head">
      <div class="sk-tip-icon"><img src="${iconSrc}" alt="${nm}"></div>
      <div>
        <div class="sk-tip-name">${nm}</div>
      </div>
    </div>
    <div class="sk-tip-body">
      ${desc?`<div class="sk-tip-desc">${desc}</div>`:''}
      <div class="sk-tip-adopt">선택률 ${Math.round(pct*100)}% (${count}/${total}명)</div>
    </div>`;

  tip.style.display='block';
  _posSkTip(e);
}

function _posSkTip(e){
  if(!_skTip||_skTip.style.display==='none')return;
  const z=parseFloat(getComputedStyle(document.documentElement).zoom)||1;
  const mx=e.clientX/z, my=e.clientY/z;
  const tw=_skTip.offsetWidth||260, th=_skTip.offsetHeight||120;
  const vw=window.innerWidth, vh=window.innerHeight;
  let x=mx+14, y=my+14;
  if(x+tw>vw-8) x=mx-tw-10;
  if(y+th>vh-8) y=my-th-10;
  _skTip.style.left=x+'px';
  _skTip.style.top=y+'px';
}

const SPEC_BG={
  '냉기':'linear-gradient(180deg,#0a1a2a,#0d2035)','비전':'linear-gradient(180deg,#12082a,#180c38)',
  '화염':'linear-gradient(180deg,#2a0a05,#3a1208)','암흑':'linear-gradient(180deg,#1a0a2a,#25103a)',
  '고통':'linear-gradient(180deg,#1a0a2a,#25103a)','파괴':'linear-gradient(180deg,#2a0808,#380a0a)',
  '악마':'linear-gradient(180deg,#0a1a0a,#0d2510)','야성':'linear-gradient(180deg,#1a1205,#28180a)',
  '조화':'linear-gradient(180deg,#0a1a0a,#0d2510)','회복':'linear-gradient(180deg,#051a0a,#082510)',
  '야수':'linear-gradient(180deg,#1a1205,#251a08)','사격':'linear-gradient(180deg,#0a1a10,#0d2514)',
  '생존':'linear-gradient(180deg,#051a12,#08251a)','수양':'linear-gradient(180deg,#1a1a1a,#252525)',
  '신성':'linear-gradient(180deg,#1a1605,#25200a)','보호':'linear-gradient(180deg,#0a0e1a,#0d1225)',
  '징벌':'linear-gradient(180deg,#1a1205,#251a08)','전투':'linear-gradient(180deg,#1a0a05,#28120a)',
  '잠행':'linear-gradient(180deg,#0a0a1a,#0d0d25)','암살':'linear-gradient(180deg,#150510,#20091a)',
  '무기':'linear-gradient(180deg,#1a1010,#251515)','방어':'linear-gradient(180deg,#0a0e1a,#0d1225)',
  '분노':'linear-gradient(180deg,#1a0808,#220d0d)','고양':'linear-gradient(180deg,#1a1208,#252010)',
  '정기':'linear-gradient(180deg,#080e1a,#0d1522)','복원':'linear-gradient(180deg,#051a0a,#082510)',
};

let _skActiveClass='';
let _skActiveSpec='';
let _skMode='skill';
let _skGemColorFilter='전체';
let _skGemData=null;

async function _ensureSkGemData(){
  if(!_skGemData){
    try{const r=await fetch('/data/gem_data.json');_skGemData=await r.json();}
    catch(e){_skGemData={};}
  }
}

function skSetGemColorFilter(color){
  _skGemColorFilter=color;
  document.querySelectorAll('.sk-gcf-btn').forEach(b=>b.classList.toggle('active',b.dataset.color===color));
  if(_skActiveClass&&_skActiveSpec) renderEnchantStats(_skActiveClass,_skActiveSpec);
}

function skSwitchMode(mode){
  _skMode=mode;
  document.getElementById('skModeSkill').classList.toggle('active',mode==='skill');
  document.getElementById('skModeEnchant').classList.toggle('active',mode==='enchant');
  document.getElementById('skMainBody').style.display=mode==='skill'?'':'none';
  document.getElementById('skEnchantBody').style.display=mode==='enchant'?'':'none';
  if(typeof window.logFA==='function')window.logFA(mode==='skill'?'static_skill_view':'static_enchant_view',{});
  if(mode==='enchant'&&_skActiveClass&&_skActiveSpec) renderEnchantStats(_skActiveClass,_skActiveSpec);
  if(mode==='skill'&&_skActiveClass&&_skActiveSpec) renderSkillStats(_skActiveClass,_skActiveSpec);
}

function initSkillStatsTab(){
  const picker=document.getElementById('skClassPicker');
  if(!picker||picker.children.length>0)return;
  Object.keys(KR_TO_TREE_KEY).forEach(cls=>{
    const cid=CLASS_NAME_TO_ID[cls];
    const col=CLASS_COLOR[cid]||'var(--gold)';
    const btn=document.createElement('div');
    btn.className='sk-pick-btn';
    btn.textContent=cls;
    btn.dataset.class=cls;
    btn.dataset.color=col;
    btn.onclick=()=>skSelectClass(cls);
    picker.appendChild(btn);
  });
  // 기본값: 마법사 - 냉기
  skSelectClass('마법사');
  skSelectSpec('냉기');
}

function skSelectClass(className){
  _skActiveClass=className;
  _skActiveSpec='';
  // 직업 버튼 active 표시
  document.querySelectorAll('#skClassPicker .sk-pick-btn').forEach(b=>{
    const col=b.dataset.color;
    const on=b.dataset.class===className;
    b.classList.toggle('active',on);
    b.style.color=on?col:'';
    b.style.borderColor=on?col+'88':'';
    b.style.background=on?col+'22':'';
  });
  // 초기화
  document.getElementById('skTreeContainer').innerHTML='';
  // 스펙 picker 빌드
  const specPicker=document.getElementById('skSpecPicker');
  const specLabel=document.getElementById('skSpecLabel');
  const cid=CLASS_NAME_TO_ID[className];
  const col=CLASS_COLOR[cid]||'var(--gold)';
  const specs=Object.values(CLASS_SPEC_EN_TO_KR[className]||{});
  if(!specs.length){specPicker.style.display='none';if(specLabel)specLabel.style.display='none';return;}
  specPicker.innerHTML='';
  specs.forEach(specKr=>{
    const btn=document.createElement('div');
    btn.className='sk-pick-btn';
    btn.textContent=specKr;
    btn.dataset.spec=specKr;
    btn.dataset.color=col;
    btn.onclick=()=>skSelectSpec(specKr);
    specPicker.appendChild(btn);
  });
  specPicker.style.display='flex';
  if(specLabel)specLabel.style.display='';
  // 첫 번째 스펙 자동 선택
  if(specs.length>0) skSelectSpec(specs[0]);
}

function skSelectSpec(specName){
  _skActiveSpec=specName;
  const cid=CLASS_NAME_TO_ID[_skActiveClass];
  const col=CLASS_COLOR[cid]||'var(--gold)';
  document.querySelectorAll('#skSpecPicker .sk-pick-btn').forEach(b=>{
    const on=b.dataset.spec===specName;
    b.classList.toggle('active',on);
    b.style.color=on?col:'';
    b.style.borderColor=on?col+'88':'';
    b.style.background=on?col+'22':'';
  });
  if(_skMode==='enchant') renderEnchantStats(_skActiveClass, specName);
  else renderSkillStats(_skActiveClass, specName);
}

function _skHeatStyle(pct){
  if(pct<0.05) return 'filter:grayscale(1) brightness(.45);opacity:.5;border-color:rgba(120,120,120,.3);';
  const a=Math.min(1,(0.18+pct*0.82)).toFixed(2);
  let s=`border-color:rgba(255,196,64,${a});border-width:2px;`;
  if(pct>0.45){
    const glowA=Math.min(0.9,(pct-0.45)*1.6).toFixed(2);
    s+=`box-shadow:0 0 ${Math.round(4+pct*12)}px rgba(255,196,64,${glowA});`;
  }
  return s;
}

async function renderSkillDataframe(className, specName, chars, total){
  const wrap=document.getElementById('skDataframe');
  const subtitle=document.getElementById('skDfSubtitle');
  if(!wrap)return;

  if(subtitle) subtitle.textContent=`${className} · ${specName} · ${total}명`;

  if(total===0){
    wrap.innerHTML='<div class="sk-df2-empty">해당 조건 유저 없음</div>';
    return;
  }

  const treeKey=KR_TO_TREE_KEY[className];
  const classTrees=treeKey&&window.TBC_CLASS_TREES?.[treeKey];
  if(!classTrees){wrap.innerHTML='<div class="sk-df2-empty">스킬 트리 데이터 없음</div>';return;}

  // 모든 스펙 트리의 스킬 집계
  const rows=[];
  for(const [sKr, treeId] of Object.entries(classTrees)){
    const entries=window.TBC_TREE_MAP?.[treeId]||[];
    const tidCounts={};
    for(const name of chars){
      const activeSpecs=SPEC_DB[name]?.active||[];
      const matchSpec=activeSpecs.find(sp=>sp.spec===sKr);
      if(!matchSpec)continue;
      for(const [tidStr,tdata] of Object.entries(matchSpec.talents)){
        if(tdata.rank>0) tidCounts[tidStr]=(tidCounts[tidStr]||0)+1;
      }
    }
    for(const entry of entries){
      const tid=String(entry.id);
      const count=tidCounts[tid]||0;
      if(count===0)continue;
      rows.push({entry, sKr, count, pct:count/total});
    }
  }

  rows.sort((a,b)=>b.pct-a.pct);

  const cid=CLASS_NAME_TO_ID[className];
  const classCol=CLASS_COLOR[cid]||'#ffc440';

  const table=document.createElement('div');
  table.className='sk-df2';

  const hd=document.createElement('div');
  hd.className='sk-df2-hd';
  hd.innerHTML='<span>#</span><span></span><span style="padding-left:6px">스킬명</span><span style="text-align:center">특성</span><span>선택률</span><span style="text-align:right">인원</span>';
  table.appendChild(hd);

  for(let i=0;i<rows.length;i++){
    const {entry, sKr, count, pct}=rows[i];
    const nm=entry.ranks?.[0]?.name||String(entry.id);
    const specCol=sKr===specName?classCol:'rgba(255,255,255,.4)';
    const barPct=Math.round(pct*100);

    const row=document.createElement('div');
    row.className='sk-df2-row';
    row.innerHTML=`
      <span class="sk-df2-idx">${i+1}</span>
      <div class="sk-df2-icon"><img src="${entry.icon?`${WH_ICON}/${entry.icon}.jpg`:`${WH_ICON}/inv_misc_questionmark.jpg`}" alt="${nm}"></div>
      <span class="sk-df2-name" title="${nm}">${nm}</span>
      <span class="sk-df2-spec" style="color:${specCol};border-color:${specCol}22">${sKr}</span>
      <div class="sk-df2-bar-wrap">
        <div class="sk-df2-bar-bg"><div class="sk-df2-bar-fg" style="width:${barPct}%;background:${specCol}cc"></div></div>
        <span class="sk-df2-pct" style="color:${specCol}">${barPct}%</span>
      </div>
      <span class="sk-df2-count">${count}/${total}</span>`;
    table.appendChild(row);
  }

  if(rows.length===0){
    const empty=document.createElement('div');
    empty.className='sk-df2-empty';
    empty.textContent='선택된 스킬 데이터 없음';
    table.appendChild(empty);
  }

  wrap.innerHTML='';
  wrap.appendChild(table);
}

async function renderSkillStats(className, specName){
  const container=document.getElementById('skTreeContainer');
  container.innerHTML='';
  if(!className||!specName)return;

  const treeKey=KR_TO_TREE_KEY[className];
  const classTrees=treeKey&&window.TBC_CLASS_TREES?.[treeKey];
  if(!classTrees){
    container.innerHTML='<div style="color:var(--text3);padding:24px">스킬 트리 데이터 없음</div>';
    return;
  }
  if(!classTrees[specName]){
    container.innerHTML='<div style="color:var(--text3);padding:24px">해당 스펙 트리 없음</div>';
    return;
  }

  // 1. 필터: 60+ & 클래스 일치 & active 스펙 중 MAIN(최고 pts) 스펙이 specName
  const chars=Object.keys(GUILD_DB).filter(n=>{
    if(GUILD_DB[n]?.class_name!==className)return false;
    if((GUILD_DB[n]?.level||0)<60)return false;
    const activeSpecs=SPEC_DB[n]?.active||[];
    if(!activeSpecs.length)return false;
    const main=[...activeSpecs].sort((a,b)=>b.pts-a.pts)[0];
    return main?.spec===specName;
  });

  const total=chars.length;

  // 데이터프레임 렌더 (chars/total 확정 후 즉시)
  renderSkillDataframe(className, specName, chars, total);

  if(total===0){
    container.innerHTML='<div style="color:var(--text3);padding:24px">해당 조건 유저 없음</div>';
    return;
  }

  const classCol=CLASS_COLOR[Object.values(GUILD_DB).find(g=>g.class_name===className)?.class_id]||'#aaa';

  // 스펙 트리 렌더 (각 스펙별로 해당 유저들의 집계)
  const wrap=document.createElement('div');
  wrap.className='sk-specs-row';
  container.appendChild(wrap);

  for(const [sKr, treeId] of Object.entries(classTrees)){
    const entries=window.TBC_TREE_MAP?.[treeId]||[];
    const sEn=window.TBC_TREE_EN_NAME?.[treeId]||sKr;

    const tidCounts={};
    const specTotal=total;
    let specHolders=0;
    for(const name of chars){
      const activeSpecs=SPEC_DB[name]?.active||[];
      const matchSpec=activeSpecs.find(sp=>sp.spec===sKr);
      if(!matchSpec)continue;
      specHolders++;
      for(const [tidStr,tdata] of Object.entries(matchSpec.talents)){
        if(tdata.rank>0) tidCounts[tidStr]=(tidCounts[tidStr]||0)+1;
      }
    }

    const grid={};
    let maxRow=0,maxCol=0;
    for(const e of entries){
      const r=Number(e.row),c=Number(e.col);
      if(!grid[r])grid[r]={};
      grid[r][c]=e;
      if(r>maxRow)maxRow=r;
      if(c>maxCol)maxCol=c;
    }
    const cols=maxCol+1;

    const treeEl=document.createElement('div');
    treeEl.className='sk-spec-tree';
    treeEl.style.backgroundImage=`linear-gradient(rgba(0,0,0,.75),rgba(0,0,0,.75)),url('images/talent_background_tbc/${treeKey}_${treeId}.jpg')`;
    treeEl.style.backgroundSize='cover';
    treeEl.style.backgroundPosition='center';
    if(sKr===specName) treeEl.style.boxShadow=`0 0 0 2px ${classCol}99, 0 4px 24px rgba(0,0,0,.5)`;

    const hd=document.createElement('div');hd.className='sk-spec-header';
    hd.innerHTML=`<span class="sk-spec-name" style="color:${sKr===specName?classCol:'var(--text2)'}">${sKr}</span>`
      +`<span class="sk-spec-en">${sEn}</span>`
      +`<span style="margin-left:auto;font-size:11px;color:var(--text3)">${specHolders}/${total}명</span>`;
    treeEl.appendChild(hd);

    const gridEl=document.createElement('div');
    gridEl.className='sk-spec-grid';
    gridEl.style.gridTemplateColumns=`repeat(${cols},52px)`;

    for(let row=0;row<=maxRow;row++){
      for(let col=0;col<cols;col++){
        const entry=grid[row]?.[col];
        if(!entry){
          const ph=document.createElement('div');ph.className='t-icon-ph sk-ph';
          gridEl.appendChild(ph);
          continue;
        }
        const tid=String(entry.id);
        const count=tidCounts[tid]||0;
        const pct=specTotal>0?count/specTotal:0;

        const iconEl=document.createElement('div');
        iconEl.className='t-icon sk-icon';
        const hs=_skHeatStyle(pct);
        if(hs)iconEl.style.cssText=hs;

        const img=document.createElement('img');
        img.src=entry.icon?`${WH_ICON}/${entry.icon}.jpg`:`${WH_ICON}/inv_misc_questionmark.jpg`;
        img.alt=entry.ranks?.[0]?.name||String(entry.id);
        if(pct<0.05){
          img.style.filter='grayscale(1) brightness(.55)';
        }else if(pct<0.25){
          const g=(1-(pct-0.05)/0.2).toFixed(2);
          img.style.filter=`grayscale(${g}) brightness(${(0.7+pct).toFixed(2)})`;
        }
        iconEl.appendChild(img);

        iconEl.addEventListener('mouseenter',ev=>{
          _showSkTip(ev,entry,img.src,pct,count,specTotal);
        });
        iconEl.addEventListener('mousemove',_posSkTip);
        iconEl.addEventListener('mouseleave',_hideSkTip);

        if(pct>=0.05){
          const badge=document.createElement('div');
          badge.className='sk-pct-badge';
          badge.textContent=Math.round(pct*100)+'%';
          iconEl.appendChild(badge);
        }

        gridEl.appendChild(iconEl);
      }
    }

    treeEl.appendChild(gridEl);
    wrap.appendChild(treeEl);
  }
}

function _buildEnchantStats(className, specName){
  const chars=Object.keys(GUILD_DB).filter(n=>{
    if(GUILD_DB[n]?.class_name!==className)return false;
    if((GUILD_DB[n]?.level||0)<60)return false;
    const activeSpecs=SPEC_DB[n]?.active||[];
    if(!activeSpecs.length)return false;
    const main=[...activeSpecs].sort((a,b)=>b.pts-a.pts)[0];
    return main?.spec===specName;
  });
  const total=chars.length;
  const gems={};    // gemName -> {itemId, gemEff, count}
  const enchants={};// enchantId -> {name, sourceId, eff, count}

  chars.forEach(name=>{
    const cd=CHAR_DB[name];
    if(!cd)return;
    const seen=new Set();
    Object.values(cd.items||{}).forEach(it=>{
      if(!it||seen.has(it))return;
      seen.add(it);
      if(it.enchantId&&it.enchantSource){
        const key=it.enchantId;
        if(!enchants[key])enchants[key]={name:it.enchantSource,sourceId:it.enchantSourceId||null,eff:(it.enchant||'').replace(/^마법부여:\s*/,''),count:0};
        enchants[key].count++;
      }
      (it.gemIds||[]).forEach((gid,gi)=>{
        const gemName=(it.gemNames||[])[gi]||'';
        const gemEff=(it.gemEffectsRaw||[])[gi]||'';
        if(!gemName)return;
        if(!gems[gemName]){
          const sc=_skGemData?(_skGemData[String(gid)]?.sockets||[]):[];
          gems[gemName]={itemId:gid,gemEff,count:0,socketColors:sc};
        }
        gems[gemName].count++;
      });
    });
  });

  const gemList=Object.entries(gems).sort((a,b)=>b[1].count-a[1].count);
  const enchList=Object.entries(enchants).sort((a,b)=>b[1].count-a[1].count);
  return{chars,total,gemList,enchList};
}

const _SK_SOCKET_COLORS={'붉은색':'#c41e3a','노란색':'#d4aa00','파란색':'#1a6ecf','얼개':'#808080'};

function _makeEncRow(rank, name, count, maxCount, classCol, sockets){
  const barPct=maxCount>0?Math.round(count/maxCount*100):0;
  const hasSocket=sockets&&sockets.length>0;
  const socketBoxes=hasSocket
    ?(sockets||[]).map(s=>`<span class="ia-socket-box" style="border-color:${_SK_SOCKET_COLORS[s]||'#555'}" title="${s}"></span>`).join('')
    :'';
  const socketCol=hasSocket
    ?`<div class="sk-df2-sockets">${socketBoxes}</div>`
    :(sockets?`<div class="sk-df2-sockets"></div>`:'');
  const row=document.createElement('div');
  row.className='sk-df2-row'+(sockets!==undefined?' sk-df2-row--gems':'');
  row.innerHTML=`
    <span class="sk-df2-idx">${rank}</span>
    <div class="sk-df2-icon"><img src="${WH_ICON}/inv_misc_questionmark.jpg" alt="${name}"></div>
    <span class="sk-df2-name" title="${name}">${name}</span>
    ${socketCol}
    <div class="sk-df2-bar-wrap">
      <div class="sk-df2-bar-bg"><div class="sk-df2-bar-fg" style="width:${barPct}%;background:${classCol}cc"></div></div>
    </div>
    <span class="sk-df2-count" style="color:${classCol};font-weight:800">${count}개</span>`;
  return row;
}

async function renderEnchantStats(className, specName){
  await _ensureSkGemData();
  const gemWrap=document.getElementById('skEncGemList');
  const enchWrap=document.getElementById('skEncEnchList');
  const sub=document.getElementById('skEncSubtitle');
  if(!gemWrap||!enchWrap)return;

  const{total,gemList:rawGemList,enchList}=_buildEnchantStats(className,specName);
  const gemList=_skGemColorFilter==='전체'
    ?rawGemList
    :rawGemList.filter(([,{socketColors}])=>socketColors.includes(_skGemColorFilter));
  if(sub)sub.textContent=`${className} · ${specName} · ${total}명`;

  const cid=CLASS_NAME_TO_ID[className];
  const classCol=CLASS_COLOR[cid]||'#ffc440';
  const empty='<div class="sk-df2-empty">데이터 없음</div>';
  const hd='<div class="sk-df2-hd"><span>#</span><span></span><span style="padding-left:6px">이름</span><span></span><span style="text-align:right">착용수</span></div>';
  const hdGem='<div class="sk-df2-hd"><span>#</span><span></span><span style="padding-left:6px">이름</span><span>소켓</span><span></span><span style="text-align:right">착용수</span></div>';

  // 보석
  if(!gemList.length){gemWrap.innerHTML=empty;}
  else{
    const maxGem=gemList[0][1].count;
    const table=document.createElement('div');table.className='sk-df2 sk-df2--enc sk-df2--gems';
    table.innerHTML=hdGem;
    gemList.forEach(([gemName,{itemId,gemEff,count,socketColors}],i)=>{
      const row=_makeEncRow(i+1,gemName,count,maxGem,classCol,socketColors);
      table.appendChild(row);
      const img=row.querySelector('img');
      if(itemId)getItemIcon(itemId).then(ic=>{if(ic)img.src=`${WH_ICON}/${ic}.jpg`;});
      if(gemEff){
        row.addEventListener('mouseenter',e=>showIAGemTT(gemName,gemEff,e));
        row.addEventListener('mousemove',moveTT);
        row.addEventListener('mouseleave',hideTT);
      }
    });
    gemWrap.innerHTML='';
    gemWrap.appendChild(table);
  }

  // 마법부여
  if(!enchList.length){enchWrap.innerHTML=empty;}
  else{
    const maxEnch=enchList[0][1].count;
    const table=document.createElement('div');table.className='sk-df2 sk-df2--enc';
    table.innerHTML=hd;
    enchList.forEach(([enchId,{name,sourceId,eff,count}],i)=>{
      const row=_makeEncRow(i+1,name,count,maxEnch,classCol);
      table.appendChild(row);
      const img=row.querySelector('img');
      const setIcon=ic=>{if(ic)img.src=`${WH_ICON}/${ic}.jpg`;};
      if(sourceId){
        getItemIcon(sourceId).then(ic=>{
          if(ic)setIcon(ic);else getEnchantInfo(enchId).then(info=>{if(info?.icon)setIcon(info.icon);});
        });
      }else{
        getEnchantInfo(enchId).then(info=>{if(info?.icon)setIcon(info.icon);});
      }
      if(eff){
        row.addEventListener('mouseenter',e=>showIAEncTT(name,eff,e));
        row.addEventListener('mousemove',moveTT);
        row.addEventListener('mouseleave',hideTT);
      }
    });
    enchWrap.innerHTML='';
    enchWrap.appendChild(table);
  }
}
