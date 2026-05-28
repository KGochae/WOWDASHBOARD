function showIAEncTT(name,eff,e){
  const parts=(eff||'').split('/').map(s=>s.trim()).filter(Boolean);
  const tt=document.getElementById('tooltip');
  tt.innerHTML=`<div style="font-size:11px;font-weight:800;color:var(--text);margin-bottom:4px;letter-spacing:.3px;">${name||''}</div>`+
    parts.map(p=>`<div style="font-size:12px;color:var(--text2);line-height:1.5">${p}</div>`).join('');
  tt.classList.add('show');moveTT(e);
}
function showIAGemTT(gemName,gemEff,sockets,e){
  const _SCOLS={'붉은색':'#c41e3a','노란색':'#d4aa00','파란색':'#1a6ecf','얼개':'#808080'};
  const parts=(gemEff||'').split('/').map(s=>s.trim()).filter(Boolean);
  const tt=document.getElementById('tooltip');
  let html=`<div style="font-size:11px;font-weight:800;color:#a8d0a8;margin-bottom:4px;letter-spacing:.3px;">${gemName||''}</div>`;
  html+=parts.map(p=>`<div style="font-size:12px;color:var(--text2);line-height:1.5">${p}</div>`).join('');
  if(sockets&&sockets.length){
    html+=`<div style="display:flex;gap:5px;align-items:center;margin-top:5px;flex-wrap:wrap;">`;
    sockets.forEach(s=>{
      const col=_SCOLS[s]||'#808080';
      html+=`<span style="display:inline-flex;align-items:center;gap:3px;">
        <span style="display:inline-block;width:8px;height:8px;border-radius:2px;border:1.5px solid ${col};"></span>
        <span style="font-size:10px;color:${col};font-weight:700;">${s}</span>
      </span>`;
    });
    html+=`</div>`;
  }
  tt.innerHTML=html;
  tt.classList.add('show');moveTT(e);
}

function showTalentTT(tid,rank,maxRank,spent,e){
  const meta=TALENT_META[tid];
  const tbc=window.TBC_TALENT_BY_ID?.[tid];
  if(!meta&&!tbc&&!spent)return;
  const rMax=tbc?.ranks?.[tbc?.ranks?.length-1];
  const desc=spent?.desc||(meta?.desc)||rMax?.description||'';
  const name=spent?.name||(meta?.name)||rMax?.name||String(tid);
  const specLabel=meta?.spec||'';
  document.getElementById('tooltip').innerHTML=`
    <div class="tt-name">${name}</div>
    ${specLabel?`<div class="tt-type">재능 · ${specLabel}</div>`:'<div class="tt-type">재능</div>'}
    <hr class="tt-sep">
    <div class="tt-rank">${rank>0?`${rank}/${maxRank} 랭크`:`0/${maxRank} (미습득)`}</div>
    ${desc?`<div class="tt-desc">${desc}</div>`:''}
  `;
  document.getElementById('tooltip').classList.add('show');moveTT(e);
}
// (class_kr, spec_kr) → tbca_bis_updated.json 스펙 키
const _SPEC_KEY_MAP={
  '드루이드':{'조화':'DruidBalance','야성':'DruidFeral','회복':'DruidRestoration'}, // DruidFeral=Cat+Bear 통합 sentinel
  '사냥꾼':  {'야수':'HunterBM','사격':'HunterMM','생존':'HunterSV'},
  '마법사':  {'비전':'MageArcane','화염':'MageFire','냉기':'MageFrost'},
  '성기사':  {'신성':'PaladinHeal','보호':'PaladinTank','징벌':'PaladinRet'},
  '사제':    {'수양':'PriestHoly','신성':'PriestHoly','암흑':'PriestShadow'},
  '도적':    {'전투':'RogueDPS','암살':'RogueDPS','잠행':'RogueDPS'},
  '주술사':  {'정기':'ShamanElemental','고양':'ShamanEnhancement','복원':'ShamanRestoration'},
  '흑마법사':{'고통':'WarlockAffliction','악마':'WarlockDemonology','파괴':'WarlockDestruction'},
  '전사':    {'무기':'WarriorArms','분노':'WarriorFury','방어':'WarriorProt'},
};

function _getTbcaSpecKey(charName, classKr){
  const specData=SPEC_DB?.[charName];
  const activeRaw=(specData?.active||[]);
  if(!activeRaw.length)return null;
  const mainSpec=activeRaw.reduce((a,b)=>b.pts>a.pts?b:a).spec;
  return (_SPEC_KEY_MAP[classKr]||{})[mainSpec]||null;
}

function showItemTT(slotNum,e){
  if(!currentChar?.items)return;
  const item=currentChar.items[slotNum];if(!item)return;
  const stats=Object.entries(item.stats||{}).filter(([,v])=>v>0);

  // BIS 정보 조회 (클래스+주특성 기준)
  const tbcaKey=_getTbcaSpecKey(currentChar.name, currentChar.class_name||'');
  let bisInfo=(TBCA_P1_LOOKUP[tbcaKey]||{})[String(item.id)];
  let bisSubSpec='';
  if(tbcaKey==='DruidFeral'){
    const catInfo=(TBCA_P1_LOOKUP['DruidCat']||{})[String(item.id)];
    const bearInfo=(TBCA_P1_LOOKUP['DruidBear']||{})[String(item.id)];
    if(catInfo&&bearInfo){bisInfo=catInfo.rank<=bearInfo.rank?catInfo:bearInfo;bisSubSpec='Cat/Bear';}
    else if(catInfo){bisInfo=catInfo;bisSubSpec='Cat';}
    else if(bearInfo){bisInfo=bearInfo;bisSubSpec='Bear';}
  }
  let bisBadge='';
  let srcBlock='';
  if(bisInfo){
    const isBis=bisInfo.rank===1;
    const phaseCol=(bisInfo.item_phase||1)>=2?'#ff6b6b':'#7ec8e3';
    const phaseTxt=`P${bisInfo.item_phase||1}`;
    const rankCol=isBis?'#ffd700':'#d0d8e8';
    const rankTxt=isBis?`BIS #${bisInfo.rank}`:`Alt #${bisInfo.rank}`;
    const badge=(col,txt)=>`<span style="margin-left:5px;font-size:10px;font-weight:700;white-space:nowrap;color:${col};background:${col}22;border:1px solid ${col}55;border-radius:3px;padding:1px 5px;vertical-align:middle;flex-shrink:0">${txt}</span>`;
    bisBadge=badge(phaseCol,phaseTxt)+badge(rankCol,rankTxt);
    if(bisSubSpec)bisBadge+=badge('#a0e8b0',bisSubSpec);

    const srcType=bisInfo.source_type;
    const srcKo=bisInfo.source_ko;
    const srcLoc=bisInfo.source_location;
    const locLine=(srcLoc&&!/^\d+$/.test(srcLoc))?`<div class="tt-ireq" style="color:var(--text2)">${srcLoc}</div>`:'';
    if(srcType||srcKo){
      srcBlock=`<hr class="tt-isep">
      ${srcType?`<div class="tt-bind" style="color:var(--text3)">${srcType}</div>`:''}
      ${srcKo?`<div class="tt-bind" style="color:var(--text2);font-weight:600">${srcKo}</div>`:''}
      ${locLine}`;
    }
  }

  const tt=document.getElementById('tooltip');
  const hasExtra=bisInfo||item.setName||(item.gemNames&&item.gemNames.length)||(item.setEffects&&item.setEffects.length);
  tt.style.width=hasExtra?'300px':'260px';
  const setBlock=item.setName?`
    <hr class="tt-isep">
    <div style="font-size:12px;font-weight:700;color:#e8b84b;margin-bottom:3px">${item.setDisplay||item.setName}</div>
    ${(item.setEffects||[]).map(eff=>`<div style="font-size:12px;color:#e8b84b;opacity:.8;line-height:1.45;margin-bottom:2px">${eff}</div>`).join('')}
  `:'';
  tt.innerHTML=`
    <div class="tt-iname ${item.q}" style="display:flex;align-items:center;flex-wrap:nowrap;gap:0;font-size:15px">${item.name}${bisBadge}</div>
    <div class="tt-sub" style="font-size:12px">${item.sub}${item.armor>0?` · 방어도 ${item.armor}`:''}</div>
    ${item.bind?`<div class="tt-bind" style="font-size:12px">${item.bind}</div>`:''}
    ${item.ilvl?`<div style="font-size:11px;color:var(--text3);margin-top:1px">아이템 레벨 ${item.ilvl}</div>`:''}
    <hr class="tt-isep">
    ${stats.map(([k,v])=>`<div class="tt-stat" style="font-size:13px">+${v} ${STAT_KR[k]||k}</div>`).join('')}
    ${item.w?`<div class="tt-stat" style="font-size:13px">${item.w.min}–${item.w.max} 피해 &nbsp;<span style="color:var(--text3)">${item.w.speed}속도 (${parseFloat(item.w.dps).toFixed(2)} dps)</span></div>`:''}
    ${item.enchant?`<div class="tt-enchant" style="font-size:12px">${item.enchant}</div>`:''}
    ${(item.gemNames&&item.gemNames.length)?`<hr class="tt-isep">${item.gemNames.map((n,i)=>`<div class="tt-gem" style="font-size:12px"><span class="tt-gem-name">${n}</span><span class="tt-gem-sep"> : </span><span class="tt-gem-effect">${item.gemEffectsRaw?.[i]||item.gemEffects?.[i]||''}</span></div>`).join('')}${item.socketBonus?`<div class="tt-socket-bonus" style="font-size:11px">소켓 보너스: ${item.socketBonus}</div>`:''}`: ''}
    ${(item.spell||[]).length||(item.proc||[]).length?`<hr class="tt-isep">`:''}
    ${(item.spell||[]).map(s=>`<div class="tt-spell" style="font-size:12px;line-height:1.4">${s}</div>`).join('')}
    ${(item.proc||[]).map(s=>`<div class="tt-proc" style="font-size:12px;line-height:1.4">${s}</div>`).join('')}
    ${setBlock}
    ${item.dur?`<hr class="tt-isep"><div class="tt-ireq" style="font-size:11px">내구도 ${item.dur[0]}/${item.dur[1]}</div>`:''}
    ${item.req?`<div class="tt-ireq" style="font-size:11px">최소 레벨 ${item.req}</div>`:''}
    ${srcBlock}
  `;
  tt.classList.add('show');moveTT(e);
}
let _ttZoom=1,_ttRAF=0,_ttLastX=0,_ttLastY=0;
function _ttUpdateZoom(){_ttZoom=parseFloat(getComputedStyle(document.documentElement).zoom)||1;}
_ttUpdateZoom();
window.addEventListener('resize',_ttUpdateZoom);
function _ttApply(){
  _ttRAF=0;
  const tt=document.getElementById('tooltip');
  if(!tt||!tt.classList.contains('show'))return;
  const z=_ttZoom;
  const cx=_ttLastX/z, cy=_ttLastY/z;
  const x=cx+14, y=cy+14;
  const ttW=parseInt(tt.style.width)||260;
  tt.style.left=(x+ttW>window.innerWidth?cx-ttW-4:x)+'px';
  tt.style.top=(y+300>window.innerHeight?cy-tt.offsetHeight-8:y)+'px';
}
function moveTT(e){
  _ttLastX=e.clientX; _ttLastY=e.clientY;
  if(_ttRAF)return;
  _ttRAF=requestAnimationFrame(_ttApply);
}
function hideTT(){
  if(_ttRAF){cancelAnimationFrame(_ttRAF);_ttRAF=0;}
  const tt=document.getElementById('tooltip');tt.classList.remove('show');tt.style.width='';
}

function showStatTT(e, label, val, rank, total, avgVal, className){
  const rankLabel = rank===1?'🥇 1위':rank===2?'🥈 2위':rank===3?'🥉 3위':`${rank}위`;
  const rankLine = (rank>0&&total>0)
    ? `<div style="font-size:13px;color:var(--text2);margin-top:5px">${className} ${total}명 중 <span style="color:var(--text);font-weight:700">${rankLabel}</span></div>`
    : '';
  const avgLine = avgVal!=null
    ? `<div style="font-size:13px;color:var(--text3);margin-top:3px">5±레벨대 평균 <span style="color:var(--text2);font-weight:600">${avgVal}</span></div>`
    : '';
  document.getElementById('tooltip').innerHTML=`
    <div class="tt-name" style="color:var(--text)">${label}</div>
    <hr class="tt-sep"/>
    <div style="font-size:20.8px;font-weight:800;color:var(--text1)">${val}</div>
    ${rankLine}${avgLine}
  `;
  document.getElementById('tooltip').classList.add('show');
  moveTT(e);
}

function showRadarAxisTT(e,label,total,base,spell,enc){
  const tt=document.getElementById('tooltip');
  tt.style.width='';
  let content='';
  const _bdRow=(lbl,sl,el)=>`<div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin-top:5px"><span style="font-size:12px;color:var(--text3);white-space:nowrap">${lbl}</span><span style="font-size:12px;white-space:nowrap">${sl}${el}</span></div>`;
  if(label==='적중도'){
    tt.style.width='max-content';
    const hbd=window._lastHitBreakdown||{};
    const ORDER=[['pure','적중도'],['crit','치명타 적중도'],['spellHit','주문 적중도'],['spellCrit','주문 극대화 적중도'],['ranged','원거리 치명타 적중도']];
    const rows=ORDER.map(([key,lbl])=>{
      const d=hbd[key];if(!d||(d.spell===0&&d.enc===0))return'';
      const sl=d.spell>0?`<span style="color:#ffb97a;font-weight:600"> 착용효과 +${d.spell}</span>`:'';
      const el=d.enc>0?`<span style="color:var(--ps-green);font-weight:600"> 마법부여 +${d.enc}</span>`:'';
      return _bdRow(lbl,sl,el);
    }).filter(Boolean);
    if(hbd.base>0) rows.unshift(`<div style="font-size:12px;color:var(--text3);margin-top:5px">장비스탯 <span style="color:var(--text2);font-weight:600">+${hbd.base}</span></div>`);
    content=rows.join('');
  } else if(label==='숙련도'){
    tt.style.width='max-content';
    const sbd=window._lastSkillBreakdown||{};
    const ORDER=[['weapon','무기 숙련도'],['defense','방어 숙련도'],['dodge','회피 숙련도'],['block','방패 막기 숙련도'],['parry','무기 막기 숙련도']];
    content=ORDER.map(([key,lbl])=>{
      const d=sbd[key];if(!d||(d.spell===0&&d.enc===0))return'';
      const sl=d.spell>0?`<span style="color:#ffb97a;font-weight:600"> 착용효과 +${d.spell}</span>`:'';
      const el=d.enc>0?`<span style="color:var(--ps-green);font-weight:600"> 마법부여 +${d.enc}</span>`:'';
      return _bdRow(lbl,sl,el);
    }).filter(Boolean).join('');
  } else {
    const baseLine=base>0?`<div style="font-size:13px;color:var(--text3);margin-top:4px">장비스탯 <span style="color:var(--text2);font-weight:600">+${base.toLocaleString()}</span></div>`:'';
    const spellLine=spell>0?`<div style="font-size:13px;color:#ffb97a;margin-top:2px">착용효과 <span style="font-weight:600">+${spell.toLocaleString()}</span></div>`:'';
    const encLine=enc>0?`<div style="font-size:13px;color:var(--ps-green);margin-top:2px">마법부여 <span style="font-weight:600">+${enc.toLocaleString()}</span></div>`:'';
    content=baseLine+spellLine+encLine;
  }
  tt.innerHTML=`
    <div class="tt-name" style="color:var(--text)">${label}</div>
    <hr class="tt-sep"/>
    <div style="font-size:20.8px;font-weight:800;color:var(--text2)">+${total.toLocaleString()}</div>
    ${content}
  `;
  tt.classList.add('show');
  moveTT(e);
}

function showInfoTT(e){
  document.getElementById('tooltip').innerHTML=`
    <div class="tt-name" style="color:var(--text);font-size:16.9px">CLASS 스탯 랭킹</div>
    <hr class="tt-sep"/>
    <div style="font-size:14.3px;color:var(--text2);line-height:1.8">
      직업별 <b style="color:var(--text)">핵심 스탯</b>을 기준으로<br>
      길드원 순위를 한눈에 비교합니다.
    </div>
    <hr class="tt-sep"/>
    <div style="font-size:13px;color:var(--text3);line-height:1.7">
      · 상단 탭 — 직업 선택<br>
      · 컬럼 헤더 클릭 — 해당 스탯 기준 정렬<br>
      · 포지션(탱커·힐러·딜러)에 따라 표시 스탯이 다릅니다
    </div>
  `;
  document.getElementById('tooltip').classList.add('show');
  moveTT(e);
}
window.showInfoTT=showInfoTT;

function showStatCriteriaTT(e){
  document.getElementById('tooltip').innerHTML=`
    <div class="tt-name" style="font-size:14px;color:var(--text1);margin-bottom:4px">상위% 계산 기준</div>
    <hr class="tt-sep"/>
    <div style="font-size:12px;color:var(--text2);line-height:1.9">
    데이터는 유저가 마지막 로그아웃한 시점의 캐릭터 정보를 기준으로 측정됩니다. 버프가 포함될 수 있습니다. <br>
    각 스탯의 <b style="color:var(--text)">상위%</b>는 <b style="color:var(--gold2)">같은 직업에 해당하는</b> 길드원을 기준으로 측정됩니다.
    </div>
  `;
  document.getElementById('tooltip').classList.add('show');
  moveTT(e);
}
window.showStatCriteriaTT=showStatCriteriaTT;

function showGsTT(e){
  const tt=document.getElementById('tooltip');
  tt.style.width='320px';
  const lbl=(t,c='rgba(255,255,255,.35)')=>`<td style="color:${c};padding-right:8px;white-space:nowrap;vertical-align:top">${t}</td>`;
  const val=t=>`<td style="color:var(--text3);line-height:1.75">${t}</td>`;
  tt.innerHTML=`
    <div class="tt-name" style="color:var(--gold2);font-size:14.3px;margin-bottom:4px">기어스코어</div>
    <div style="font-size:12px;color:var(--text2);line-height:1.7;margin-bottom:8px">
      장착 아이템의 <b style="color:var(--text)">레벨·품질·슬롯·마법부여·젬</b>을<br>종합한 캐릭터 장비 강도 지표입니다. GearScoreTBCClassic 에드온 공식과 동일한 계산법이 적용됩니다.
    </div>
    <hr class="tt-sep"/>
    <div style="font-size:10px;color:var(--text3);font-family:monospace;background:rgba(255,255,255,.04);padding:5px 8px;border-radius:3px;margin-bottom:8px;line-height:1.7">
      GS = &Sigma; floor((ilvl&minus;A)/B &times; 슬롯배율 &times; 1.8618 &times; 품질보정 &times; 마부보정)<br>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ 젬 &times; 5
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:10.5px;color:var(--text3)">
      <tr>${lbl('품질 계수')}${val('영웅(A=26,B=1.2) / 희귀(A=0.75,B=1.8) / 고급(A=8,B=2.0) / 일반(A=0,B=2.25)')}</tr>
      <tr>${lbl('슬롯배율')}${val('머리·가슴·다리·방패·주손·보조손 <b style="color:var(--text2)">1.0</b> / 양손무기 <b style="color:var(--text2)">2.0</b> / 어깨·허리·발·손 <b style="color:var(--text2)">0.75</b> / 목·등·손목·반지·장신구 <b style="color:var(--text2)">0.5625</b> / 원거리·투척 <b style="color:var(--text2)">0.3164</b>')}</tr>
      <tr>${lbl('품질보정')}${val('전설 <b style="color:var(--text2)">×1.3</b> (영웅 공식 적용) &nbsp; 영웅·희귀·고급 <b style="color:var(--text2)">×1.0</b> &nbsp; 일반·불량 <b style="color:var(--text2)">×0.005</b>')}</tr>
      <tr>${lbl('마부보정')}${val('마법부여 장착 시 <b style="color:var(--text2)">×1.05</b> <span style="color:var(--text3)">(목·허리·반지·장신구 제외)</span>')}</tr>
      <tr>${lbl('젬')}${val('젬 1개당 <b style="color:var(--text2)">+5</b> 고정 합산')}</tr>
      <tr>${lbl('사냥꾼 보정')}${val('주손·보조손 <b style="color:var(--text2)">×0.3164</b> / 원거리 <b style="color:var(--text2)">×5.3224</b>')}</tr>
    </table>
  `;
  tt.classList.add('show');
  moveTT(e);
}
window.showGsTT=showGsTT;

function showQualBarTT(e){
  const el=e.currentTarget;
  let data;
  try{data=JSON.parse(el.dataset.qual||'[]');}catch(err){return;}
  if(!data.length)return;
  const total=data.reduce((s,d)=>s+d.n,0);
  const tt=document.getElementById('tooltip');
  tt.style.width='150px';
  tt.innerHTML=`
    <div class="tt-name" style="color:var(--text)">아이템 등급</div>
    <hr class="tt-sep"/>
    ${data.map(d=>`
      <div style="display:flex;align-items:center;gap:5px;margin-top:3px">
        <div style="width:6px;height:6px;border-radius:2px;background:${d.col};flex-shrink:0"></div>
        <span style="font-size:11px;color:var(--text2);min-width:48px">${d.kr}</span>
        <span style="font-size:11px;font-weight:700;color:var(--text)">${d.n}개</span>
        <span style="font-size:10px;color:var(--text3)">${Math.round(d.n/total*100)}%</span>
      </div>
    `).join('')}
  `;
  tt.classList.add('show');moveTT(e);
}
window.showQualBarTT=showQualBarTT;

function showHeatmapTT(dateStr, loginTime, e, noData=false, isInferred=false){
  const [y,m,d]=dateStr.split('-');
  const dateLabel=`${parseInt(m)}월 ${parseInt(d)}일`;
  let body;
  if(noData){
    body=`<div style="font-size:13px;color:var(--text3)">데이터 수집X</div>`;
  }else if(isInferred){
    body=`<div style="font-size:12px;color:var(--text3);line-height:1.5">API는 로그아웃된 시점의 데이터 기준으로 측정됩니다. 마지막 접속시간이 다음날 새벽대인 경우 접속한것으로 인정합니다.</div>`;
  }else if(loginTime){
    const times=typeof loginTime==='string'?loginTime.split('|'):[loginTime];
    const rows=times.map((t,i)=>`<div style="font-size:14px;font-weight:700;color:#2ea043">${i+1}: ${t}</div>`).join('');
    body=`<div style="font-size:13px;color:var(--text3);margin-bottom:4px">마지막 접속 기록</div>${rows}`;
  }else{
    body=`<div style="font-size:13px;color:var(--text3)">알수 없음</div>`;
  }
  document.getElementById('tooltip').innerHTML=`<div class="tt-name" style="color:var(--text)">${dateLabel}</div><hr class="tt-sep"/>${body}`;
  document.getElementById('tooltip').classList.add('show');
  moveTT(e);
}
window.showHeatmapTT=showHeatmapTT;

