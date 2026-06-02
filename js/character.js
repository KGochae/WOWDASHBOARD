let _renderGen=0;
let _gemData=null;

// viewer.min.js 내부 에러 콘솔 차단
{
  const _ce=console.error;
  console.error=function(...a){
    const s=String(a[0]||'');
    if(s.includes('program linking')||s.includes('Cannot read properties of null')||s.includes('Cannot set properties of undefined'))return;
    _ce.apply(console,a);
  };
}
window.addEventListener('error',function(e){
  if(e.filename&&e.filename.includes('viewer.min.js')){e.preventDefault();}
},true);

// ── 가슴/로브 슬롯 캐시 (displayId → 5 or 20) ────────────────
// 확정된 결과만 localStorage에 저장. 네트워크 오류는 캐싱 안 함(다음 요청 때 재시도)
const _CHEST_SLOT_CACHE=(()=>{
  try{const s=localStorage.getItem('_chestSlotCache');return s?JSON.parse(s):{};}
  catch(e){return {};}
})();
function _saveChestSlotCache(){
  try{localStorage.setItem('_chestSlotCache',JSON.stringify(_CHEST_SLOT_CACHE));}catch(e){}
}

// ── 모듈 레벨 RegExp 상수 (함수 호출마다 재생성 방지) ─────────
const _ENCHANT_RE_PANEL={
  stamina:[/체력\s*\+(\d+)/g,/\+(\d+)\s*체력/g],
  strength:[/(?<![주문])힘\s*\+(\d+)/g,/\+(\d+)\s*(?<![주문])힘/g],
  agility:[/민첩성?\s*\+(\d+)/g,/\+(\d+)\s*민첩성?/g],
  intellect:[/지능\s*\+(\d+)/g,/\+(\d+)\s*지능/g],
  spirit:[/정신력?\s*\+(\d+)/g,/\+(\d+)\s*정신력?/g],
  hit:[/적중\s*\+(\d+)/g,/\+(\d+)\s*적중/g,/적중도\s*\+(\d+)/g,/\+(\d+)\s*적중도/g,/극대화\s*적중도\s*\+(\d+)/g,/\+(\d+)\s*극대화\s*적중도/g],
  crit:[/치명타\s*\+(\d+)/g,/\+(\d+)\s*치명타/g,/(?<!적중도\s)극대화\s*\+(\d+)/g,/\+(\d+)\s*(?<!적중도\s)극대화/g],
  defense:[/방어\s*\+(\d+)/g,/\+(\d+)\s*방어/g],
  parry:[/막기\s*\+(\d+)/g,/\+(\d+)\s*막기/g],
  attack_power:[/공격력\s*\+(\d+)/g,/\+(\d+)\s*공격력/g],
  spell_power:[/주문\s*(?:공격력|극대화|적중도|힘)\s*\+(\d+)/g,/\+(\d+)\s*주문\s*(?:공격력|극대화|적중도|힘)/g,/주문력\s*\+(\d+)/g,/\+(\d+)\s*주문력/g,/주문\s*\+(\d+)/g,/\+(\d+)\s*주문/g,/치유량\s*\+(\d+)/g,/\+(\d+)\s*치유량/g],
};
const _ENCHANT_RE_RADAR={
  stamina:[/체력\s*\+(\d+)/g,/\+(\d+)\s*체력/g],
  strength:[/(?<![주문])힘\s*\+(\d+)/g,/\+(\d+)\s*(?<![주문])힘/g],
  agility:[/민첩성?\s*\+(\d+)/g,/\+(\d+)\s*민첩성?/g],
  intellect:[/지능\s*\+(\d+)/g,/\+(\d+)\s*지능/g],
  spirit:[/정신력?\s*\+(\d+)/g,/\+(\d+)\s*정신력?/g],
  hit:[/적중도\s*\+(\d+)/g],
  crit:[/치명타\s*\+(\d+)(?!\s*적중도)/g,/(?<!적중도\s)극대화\s*\+(\d+)/g],
  defense:[/방어\s*\+(\d+)/g,/\+(\d+)\s*방어/g],
  parry:[/막기\s*\+(\d+)/g,/\+(\d+)\s*막기/g],
  attack_power:[/전투력\s*\+(\d+)/g,/(?<!주문\s)공격력\s*\+(\d+)/g],
  healing_power:[/주문\s*치유량\s*\+(\d+)/g],
  spell_dmg:[/주문\s*공격력\s*\+(\d+)/g],
  skill:[/숙련도\s*\+(\d+)/g],
  resilience:[/탄력도\s*\+(\d+)/g],
};
const _ENCHANT_RE_ALLSTATS={
  stamina:[/체력\s*\+(\d+)/g,/모든\s*능력치\s*\+(\d+)/g],
  strength:[/(?<![주문\s])힘\s*\+(\d+)/g,/모든\s*능력치\s*\+(\d+)/g],
  agility:[/민첩성?\s*\+(\d+)/g,/모든\s*능력치\s*\+(\d+)/g],
  intellect:[/지능\s*\+(\d+)/g,/모든\s*능력치\s*\+(\d+)/g],
  spirit:[/정신력?\s*\+(\d+)/g,/모든\s*능력치\s*\+(\d+)/g],
  hit:[/적중도\s*\+(\d+)/g,/주문\s*적중도\s*\+(\d+)/g,/주문\s*극대화\s*적중도\s*\+(\d+)/g,/치명타\s*적중도\s*\+(\d+)/g,/극대화\s*적중도\s*\+(\d+)/g],
  crit:[/치명타\s*\+(\d+)/g,/(?<!적중도\s)극대화\s*\+(\d+)/g],
  defense:[/방어\s*\+(\d+)/g,/\+(\d+)\s*방어/g],
  parry:[/막기\s*\+(\d+)/g,/\+(\d+)\s*막기/g],
  attack_power:[/전투력\s*\+(\d+)/g,/공격력\s*\+(\d+)/g,/주문\s*공격력\s*및\s*치유량?\s*\+(\d+)/g],
  spell_power:[/주문\s*공격력\s*\+(\d+)/g,/주문력\s*\+(\d+)/g,/주문\s*치유량\s*\+(\d+)/g,/치유량\s*\+(\d+)/g,/주문\s*공격력\s*및\s*치유량?\s*\+(\d+)/g],
};
// 직업별 스탯 랭킹 캐시 — 세션 내 재계산 방지
const _statRankCache={};

// ── 장비 합산 스탯 + 마법 부여 패널 ─────────────────────────
function buildItemStatsPanel(char){
  const el=document.getElementById('itemStatsPanel');
  if(!el)return;
  const items=char?.items?Object.values(char.items).filter(Boolean):[];
  if(!items.length){el.style.display='none';return;}
  const STAT_DISPLAY=[
    {k:'stamina',l:'체력'},{k:'strength',l:'힘'},{k:'agility',l:'민첩'},
    {k:'intellect',l:'지능'},{k:'spirit',l:'정신'},{k:'hit',l:'적중'},
    {k:'crit',l:'치명타'},{k:'defense',l:'방어'},{k:'parry',l:'막기'},
  ];
  // 장비 스탯 합산
  const statSum={};
  items.forEach(it=>{Object.entries(it.stats||{}).forEach(([k,v])=>{statSum[k]=(statSum[k]||0)+v;});});
  // 마법 부여 스탯 파싱 + 합산
  const ENCHANT_RE=_ENCHANT_RE_PANEL;
  const enchSum={};
  Object.values(char.items).forEach(it=>{
    const enc=it?.enchant||'';
    if(!enc)return;
    const enchParts=enc.split(/\s*\/\s*/);
    for(const part of enchParts){
      for(const[k,reArr]of Object.entries(ENCHANT_RE)){
        reArr.forEach(re=>{
          re.lastIndex=0;
          for(const m of part.matchAll(re)) enchSum[k]=(enchSum[k]||0)+parseInt(m[1]);
        });
      }
    }
  });
  // 총합 = 장비 + 마법부여
  const totalStats={};
  STAT_DISPLAY.forEach(s=>{
    const v=(statSum[s.k]||0)+(enchSum[s.k]||0);
    if(v>0) totalStats[s.k]=v;
  });
  const visStats=STAT_DISPLAY.filter(s=>totalStats[s.k]>0);
  // 마법 부여 (슬롯별 텍스트)
  const enchants=[];
  Object.entries(char.items).forEach(([slot,it])=>{
    if(it?.enchant)enchants.push({slot:SLOT_META[parseInt(slot)]||`슬롯${slot}`,text:it.enchant});
  });
  el.style.display='none';
}

function buildRadarSVG(totalStats,axes){
  const W=220,H=220,cx=110,cy=110,R=78,n=axes.length;
  const vals=axes.map(s=>totalStats[s.k]||0);
  const gmax=Math.max(...vals)||1;
  const norm=vals.map(v=>v/gmax);
  const ang=i=>(i*2*Math.PI/n)-Math.PI/2;
  // grid polygons
  let grid='';
  for(let lv=1;lv<=4;lv++){
    const r=R*lv/4;
    const pts=axes.map((_,i)=>`${(cx+r*Math.cos(ang(i))).toFixed(1)},${(cy+r*Math.sin(ang(i))).toFixed(1)}`).join(' ');
    grid+=`<polygon points="${pts}" fill="none" stroke="rgba(255,255,255,${lv===4?0.18:0.08})" stroke-width="1"/>`;
  }
  // axis lines
  const axlines=axes.map((_,i)=>{
    const ex=(cx+R*Math.cos(ang(i))).toFixed(1),ey=(cy+R*Math.sin(ang(i))).toFixed(1);
    return `<line x1="${cx}" y1="${cy}" x2="${ex}" y2="${ey}" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>`;
  }).join('');
  // data polygon
  const dpts=norm.map((v,i)=>`${(cx+R*v*Math.cos(ang(i))).toFixed(1)},${(cy+R*v*Math.sin(ang(i))).toFixed(1)}`).join(' ');
  const poly=`<polygon points="${dpts}" fill="rgba(114,169,238,0.28)" stroke="#72a9ee" stroke-width="1.8" stroke-linejoin="round"/>`;
  // dots
  const dots=norm.map((v,i)=>`<circle cx="${(cx+R*v*Math.cos(ang(i))).toFixed(1)}" cy="${(cy+R*v*Math.sin(ang(i))).toFixed(1)}" r="3" fill="#72a9ee" opacity=".85"/>`).join('');
  // labels
  const labels=axes.map((s,i)=>{
    const lx=cx+(R+16)*Math.cos(ang(i)),ly=cy+(R+16)*Math.sin(ang(i));
    const anchor=lx<cx-4?'end':lx>cx+4?'start':'middle';
    const v=totalStats[s.k]||0;
    return `<text x="${lx.toFixed(1)}" y="${(ly+3.5).toFixed(1)}" font-size="9.5" fill="rgba(255,255,255,0.6)" text-anchor="${anchor}" font-family="inherit">${s.l}</text>
    <text x="${lx.toFixed(1)}" y="${(ly+14).toFixed(1)}" font-size="8.5" fill="rgba(114,169,238,0.85)" text-anchor="${anchor}" font-family="inherit">+${Math.round(v)}</text>`;
  }).join('');
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="overflow:visible">${grid}${axlines}${poly}${dots}${labels}</svg>`;
}

function buildCompactRadarSVG(totalStats,axes,baseSum,spellSum,enchSum,col){
  col=col||'#72a9ee';
  baseSum=baseSum||{};spellSum=spellSum||{};enchSum=enchSum||{};
  const W=200,H=180,cx=100,cy=90,R=76,n=axes.length;
  const LBL=R+22; // 라벨 오프셋
  const vals=axes.map(s=>totalStats[s.k]||0);
  const gmax=Math.max(...vals)||1;
  const norm=vals.map(v=>v/gmax);
  const ang=i=>(i*2*Math.PI/n)-Math.PI/2;
  let grid='';
  for(let lv=1;lv<=3;lv++){
    const r=R*lv/3;
    const pts=axes.map((_,i)=>`${(cx+r*Math.cos(ang(i))).toFixed(1)},${(cy+r*Math.sin(ang(i))).toFixed(1)}`).join(' ');
    grid+=`<polygon points="${pts}" fill="none" stroke="rgba(255,255,255,${lv===3?0.18:0.08})" stroke-width="1"/>`;
  }
  const axlines=axes.map((_,i)=>{
    const ex=(cx+R*Math.cos(ang(i))).toFixed(1),ey=(cy+R*Math.sin(ang(i))).toFixed(1);
    return `<line x1="${cx}" y1="${cy}" x2="${ex}" y2="${ey}" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>`;
  }).join('');
  const dpts=norm.map((v,i)=>`${(cx+R*v*Math.cos(ang(i))).toFixed(1)},${(cy+R*v*Math.sin(ang(i))).toFixed(1)}`).join(' ');
  const poly=`<polygon points="${dpts}" fill="${col}40" stroke="${col}" stroke-width="1.8" stroke-linejoin="round"/>`;
  const dots=norm.map((v,i)=>`<circle cx="${(cx+R*v*Math.cos(ang(i))).toFixed(1)}" cy="${(cy+R*v*Math.sin(ang(i))).toFixed(1)}" r="3" fill="${col}" opacity=".9"/>`).join('');
  const labels=axes.map((s,i)=>{
    const lx=cx+LBL*Math.cos(ang(i)),ly=cy+LBL*Math.sin(ang(i));
    const anchor=lx<cx-4?'end':lx>cx+4?'start':'middle';
    return `<text x="${lx.toFixed(1)}" y="${(ly+4).toFixed(1)}" font-size="16" fill="rgba(255,255,255,0.92)" text-anchor="${anchor}" font-family="inherit" font-weight="600">${s.l}</text>`;
  }).join('');
  // 호버 투명 원
  const hits=axes.map((s,i)=>{
    const hx=(cx+R*norm[i]*Math.cos(ang(i))).toFixed(1),hy=(cy+R*norm[i]*Math.sin(ang(i))).toFixed(1);
    const base=Math.round(baseSum[s.k]||0);
    const spell=Math.round(spellSum[s.k]||0);
    const enc=Math.round(enchSum[s.k]||0);
    const ttl=Math.round(totalStats[s.k]||0);
    return `<circle cx="${hx}" cy="${hy}" r="12" fill="transparent" style="cursor:pointer"
      onmouseenter="showRadarAxisTT(event,'${s.l}',${ttl},${base},${spell},${enc})"
      onmousemove="moveTT(event)" onmouseleave="hideTT()"/>`;
  }).join('');
  // viewBox: 라벨(R+22=98) + 텍스트 너비(~44px) 여유 포함
  return `<svg width="100%" height="100%" viewBox="-46 -28 292 236" style="overflow:visible;display:block">${grid}${axlines}${poly}${dots}${labels}${hits}</svg>`;
}

// ── GS 주간 라인 차트 ─────────────────────────────────────────
function buildGsLineChart(name){
  const el=document.getElementById('gsLineChart');
  if(!el)return;
  const _gsCol=CLASS_COLOR[CLASS_NAME_TO_ID[GUILD_DB[name]?.class_name||'']]||'#c98df5';
  const rawEntry=window.GS_LOG_RAW?.[name];
  if(!rawEntry){el.innerHTML='';return;}
  const activeSpec=(SPEC_DB[name]?.active||[]).reduce((b,s)=>s.pts>b.pts?s:b,{pts:0,spec:''}).spec||'';
  const daily=Object.entries(rawEntry)
    .map(([date,specMap])=>{
      const gs=(activeSpec&&specMap[activeSpec]?.gs)||Object.values(specMap)[0]?.gs||0;
      return {date,gs};
    })
    .filter(p=>p.gs>0)
    .sort((a,b)=>a.date.localeCompare(b.date));
  if(daily.length<2){el.innerHTML='';return;}
  // 주간 집계: 각 주의 마지막 GS
  const weekMap={};
  daily.forEach(({date,gs})=>{
    const d=new Date(date+'T00:00:00');
    const day=d.getDay();
    const mon=new Date(d);mon.setDate(d.getDate()-(day===0?6:day-1));
    const wk=mon.toISOString().slice(0,10);
    if(!weekMap[wk]||date>weekMap[wk].date)weekMap[wk]={date,gs,wk};
  });
  const pts=Object.values(weekMap).sort((a,b)=>a.wk.localeCompare(b.wk));
  if(pts.length<2){el.innerHTML='';return;}
  const W=400,H=54,pL=2,pR=2,pT=6,pB=18;
  const gw=W-pL-pR,gh=H-pT-pB;
  const gsMin=Math.min(...pts.map(p=>p.gs));
  const gsMax=Math.max(...pts.map(p=>p.gs));
  const rng=Math.max(gsMax-gsMin,50);
  const tx=i=>pL+i/(pts.length-1)*gw;
  const ty=v=>pT+gh-(v-gsMin)/rng*gh;
  const linePts=pts.map((p,i)=>`${tx(i).toFixed(1)},${ty(p.gs).toFixed(1)}`).join(' ');
  const areaD=`M${tx(0).toFixed(1)},${(pT+gh).toFixed(1)} `+
    pts.map((p,i)=>`L${tx(i).toFixed(1)},${ty(p.gs).toFixed(1)}`).join(' ')+
    ` L${tx(pts.length-1).toFixed(1)},${(pT+gh).toFixed(1)} Z`;
  const last=pts[pts.length-1];
  const lx=tx(pts.length-1),ly=ty(last.gs);
  const gid='gsg'+name.replace(/[^a-zA-Z0-9]/g,'');
  const delta=last.gs-pts[0].gs;
  const deltaStr=delta>0?`+${delta}`:String(delta);
  const _today=new Date();
  const labels=pts.map((p,i)=>{
    const d=i===pts.length-1?_today:new Date(p.wk+'T00:00:00');
    return {x:(tx(i)/W*100).toFixed(1),text:`${d.getMonth()+1}/${d.getDate()}`};
  });
  el.innerHTML=`<div style="position:relative;">
    <div style="position:absolute;top:2px;right:2px;font-size:9px;color:var(--text3);line-height:1;text-align:right;">
      <span style="color:var(--text2);font-weight:700;">${last.gs.toLocaleString()}</span>
      <span style="color:${delta>=0?'#80e865':'#e06060'};margin-left:3px;">${deltaStr}</span>
    </div>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="width:100%;height:${H}px;display:block;">
      <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${_gsCol}" stop-opacity=".2"/>
        <stop offset="100%" stop-color="${_gsCol}" stop-opacity="0"/>
      </linearGradient></defs>
      <path d="${areaD}" fill="url(#${gid})"/>
      <polyline fill="none" stroke="${_gsCol}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" points="${linePts}"/>
      ${pts.map((p,i)=>i===pts.length-1
        ?`<circle cx="${tx(i).toFixed(1)}" cy="${ty(p.gs).toFixed(1)}" r="3" fill="${_gsCol}"/>`
        :`<circle cx="${tx(i).toFixed(1)}" cy="${ty(p.gs).toFixed(1)}" r="1.8" fill="${_gsCol}" opacity=".6"/>`
      ).join('')}
    </svg>
    <div style="position:relative;height:14px;">
      ${labels.map(l=>`<span style="position:absolute;left:${l.x}%;transform:translateX(-50%);font-size:9px;color:var(--text3);white-space:nowrap;">${l.text}</span>`).join('')}
    </div>
  </div>`;
}

// ── 아이템 통계 카드 (평균 ilvl + GS 뱃지) ────────────────────
function buildQualityBar(char){
  const card=document.getElementById('eqStatCard');
  const avgEl=document.getElementById('avgIlvlVal');
  const hide=()=>{if(card)card.style.display='none';};
  if(!card)return;
  const items=char?.items?Object.values(char.items).filter(Boolean):[];
  if(!items.length){hide();return;}
  // 평균 아이템 레벨 (API 수집값 우선, 없으면 장비 평균으로 폴백)
  const avg=char&&char.average_item_level?char.average_item_level:
    (()=>{const il=items.filter(it=>it.ilvl>0);return il.length?Math.round(il.reduce((s,it)=>s+it.ilvl,0)/il.length):0;})();
  if(avgEl)avgEl.textContent=avg||'—';

  // 아이템 평균 레벨 뱃지
  const avgBadge=document.getElementById('avgIlvlBadge');
  if(avg&&avgBadge){
    const cname2=char?.name;
    const charClass2=GUILD_DB[cname2]?.class_name||char?.class_name||'';
    const allIlvl=Object.entries(CHAR_DB)
      .filter(([n])=>(GUILD_DB[n]?.class_name||'')===(charClass2)&&n!==cname2)
      .map(([,cd])=>{
        const v=cd.average_item_level;if(v>0)return v;
        const its=cd.items?Object.values(cd.items).filter(it=>it&&it.ilvl>0):[];
        return its.length?Math.round(its.reduce((s,it)=>s+it.ilvl,0)/its.length):0;
      })
      .filter(v=>v>0)
      .concat(avg)
      .sort((a,b)=>b-a);
    const rank=(allIlvl.findIndex(v=>v<=avg)+1)||allIlvl.length;
    const pct=Math.round((rank/allIlvl.length)*100);
    const cls=pct<=10?'pb-hi':pct<=50?'pb-md':'pb-lo';
    avgBadge.textContent=`상위 ${pct}%`;
    avgBadge.className=`pct-badge ${cls}`;
    avgBadge.style.display='';
  }else if(avgBadge){avgBadge.style.display='none';}

  // GearScore 카드 업데이트
  const gsEl=document.getElementById('gsVal');
  const gsBadge=document.getElementById('gsBadge');
  if(gsEl){
    const cname=char?.name;
    const sv2=cname?STATS_DB_V2[cname]:null;
    const gs=sv2?.gear_score;
    gsEl.textContent=gs?gs.toLocaleString():'—';
    if(gs&&gsBadge){
      const charClass=GUILD_DB[cname]?.class_name||char?.class_name||'';
      const allGS=Object.entries(STATS_DB_V2)
        .filter(([n,d])=>d.gear_score>0&&(GUILD_DB[n]?.class_name||'')===(charClass))
        .map(([,d])=>d.gear_score)
        .sort((a,b)=>b-a);
      const pool=allGS.length?allGS:Object.values(STATS_DB_V2).map(d=>d.gear_score).filter(v=>v>0).sort((a,b)=>b-a);
      const rank=(pool.findIndex(v=>v<=gs)+1)||pool.length;
      const total=pool.length;
      const pct=Math.round((rank/total)*100);
      const gsCls=pct<=10?'pb-hi':pct<=50?'pb-md':'pb-lo';
      gsBadge.textContent=`상위 ${pct}%`;
      gsBadge.className=`pct-badge ${gsCls}`;
      gsBadge.style.display='';
    }else if(gsBadge){gsBadge.style.display='none';}
  }

  // 레이더 차트 (총 합산 스탯)
  const radarWrap=document.getElementById('eqRadarWrap');
  if(radarWrap&&char){
    const STAT_AXES=[
      {k:'stamina',l:'체력'},{k:'strength',l:'힘'},{k:'agility',l:'민첩'},
      {k:'intellect',l:'지능'},{k:'spirit',l:'정신'},{k:'hit',l:'적중도'},
      {k:'defense',l:'방어'},{k:'parry',l:'막기'},
      {k:'attack_power',l:'전투력'},{k:'skill',l:'숙련도'},
    ];
    const ENCHANT_RE=_ENCHANT_RE_RADAR;
    // base = 장비 고유 스탯 (it.stats), spell = 착용효과, ench = 마법부여+젬+소켓보너스
    const baseSum={},spellSum={},enchSum={};
    const apRe=/전투력이\s*(\d+)만큼/g;
    const healDmgSpellRe=/치유량이 최대 (\d+)만큼, 공격력이 최대 (\d+)/;
    const bothSpellRe=/공격력과 치유량이 최대 (\d+)/;
    const uniqItems=[...new Set(items)];
    uniqItems.forEach(it=>{
      Object.entries(it.stats||{}).forEach(([k,v])=>{baseSum[k]=(baseSum[k]||0)+v;});
      for(const s of (it.spell||[])){
        for(const m of s.matchAll(apRe)) spellSum['attack_power']=(spellSum['attack_power']||0)+parseInt(m[1]);
        // 적중도: 모든 "XXX 적중도가 N만큼" 타입
        const mh=s.match(/착용 효과:.*?적중도가 (\d+)만큼/);if(mh) spellSum['hit']=(spellSum['hit']||0)+parseInt(mh[1]);
        // 숙련도: 모든 "XXX 숙련도가 N만큼" 타입 (낚시 제외)
        if(!s.includes('낚시')){const msk=s.match(/숙련도가 (\d+)만큼/);if(msk) spellSum['skill']=(spellSum['skill']||0)+parseInt(msk[1]);}
        if(s.includes('계열'))continue;
        const m2=s.match(healDmgSpellRe);
        if(m2){
          spellSum['healing_power']=(spellSum['healing_power']||0)+parseInt(m2[1]);
          spellSum['spell_dmg']=(spellSum['spell_dmg']||0)+parseInt(m2[2]);
          continue;
        }
        const m1=s.match(bothSpellRe);
        if(m1){
          const n=parseInt(m1[1]);
          spellSum['healing_power']=(spellSum['healing_power']||0)+n;
          spellSum['spell_dmg']=(spellSum['spell_dmg']||0)+n;
        }
      }
    });
    const enchBothRe=/주문\s*공격력\s*및\s*치유량?\s*\+(\d+)/g;
    uniqItems.forEach(it=>{
      const enc=it?.enchant||'';if(!enc)return;
      for(const m of enc.matchAll(enchBothRe)){
        const v=parseInt(m[1]);
        enchSum['healing_power']=(enchSum['healing_power']||0)+v;
        enchSum['spell_dmg']=(enchSum['spell_dmg']||0)+v;
      }
      const remaining=enc.replace(enchBothRe,'');
      for(const part of remaining.split(/\s*\/\s*/)){
        for(const[k,reArr]of Object.entries(ENCHANT_RE)){
          reArr.forEach(re=>{
            re.lastIndex=0;
            for(const m of part.matchAll(re)) enchSum[k]=(enchSum[k]||0)+parseInt(m[1]);
          });
        }
      }
    });
    // 젬 효과 — enchSum에 합산
    uniqItems.forEach(it=>{
      for(const eff of (it.gemEffects||[])){
        if(eff.includes('낚시'))continue;
        for(const[k,reArr]of Object.entries(ENCHANT_RE)){
          reArr.forEach(re=>{
            re.lastIndex=0;
            for(const m of eff.matchAll(re)) enchSum[k]=(enchSum[k]||0)+parseInt(m[1]);
          });
        }
      }
    });
    // 소켓 보너스 — enchSum에 합산
    uniqItems.forEach(it=>{
      const sb=it.socketBonus||'';if(!sb)return;
      for(const m of sb.matchAll(/주문 공격력 및 치유량 \+(\d+)/g)){const v=parseInt(m[1]);enchSum['healing_power']=(enchSum['healing_power']||0)+v;enchSum['spell_dmg']=(enchSum['spell_dmg']||0)+v;}
      const sbR=sb.replace(/주문 공격력 및 치유량 \+\d+/g,'');
      for(const[k,reArr]of Object.entries(ENCHANT_RE)){
        reArr.forEach(re=>{re.lastIndex=0;for(const m of sbR.matchAll(re))enchSum[k]=(enchSum[k]||0)+parseInt(m[1]);});
      }
    });
    const totalStats={};
    STAT_AXES.forEach(s=>{
      const v=(baseSum[s.k]||0)+(spellSum[s.k]||0)+(enchSum[s.k]||0);
      if(v>0)totalStats[s.k]=v;
    });

    // 적중도 = hit 합산(모든 적중도 타입) + 잔여 crit, 분리값 보존
    const _hitBase=baseSum['hit']||0,_hitSpell=spellSum['hit']||0,_hitEnc=enchSum['hit']||0;
    const _critEnc=enchSum['crit']||0;
    const _hitOnly=_hitBase+_hitSpell+_hitEnc;
    if(_hitOnly>0||_critEnc>0) totalStats['hit']=_hitOnly+_critEnc;

    // 적중도 세부 분류 (툴팁용) — 타입별 착용효과/마법부여 분리
    {
      const hbd={};
      const addH=(key,field,v)=>{if(!hbd[key])hbd[key]={spell:0,enc:0};hbd[key][field]+=v;};
      const SP_PATS=[
        [/착용 효과: 원거리 치명타 적중도가 (\d+)만큼/,'ranged'],
        [/착용 효과: 주문 극대화 적중도가 (\d+)만큼/,'spellCrit'],
        [/착용 효과: 치명타 및 극대화 적중도가 (\d+)만큼/,'critBoth'],
        [/착용 효과: 치명타 적중도가 (\d+)만큼/,'crit'],
        [/착용 효과: 주문 적중도가 (\d+)만큼/,'spellHit'],
        [/착용 효과: 적중도가 (\d+)만큼/,'pure'],
      ];
      const ENC_PATS=[
        [/^원거리 치명타 적중도\s*\+(\d+)$/,'ranged'],
        [/^주문 극대화 적중도\s*\+(\d+)$/,'spellCrit'],
        [/^치명타 적중도\s*\+(\d+)$/,'crit'],
        [/^주문\s*적중도\s*\+(\d+)$/,'spellHit'],
        [/^적중도\s*\+(\d+)$/,'pure'],
      ];
      uniqItems.forEach(it=>{
        for(const s of(it.spell||[])){
          for(const[re,key]of SP_PATS){
            const m=s.match(re);if(!m)continue;
            if(key==='critBoth'){const v=parseInt(m[1]);addH('crit','spell',v);addH('spellCrit','spell',v);}
            else addH(key,'spell',parseInt(m[1]));
            break;
          }
        }
        const enc=it.enchant||'';
        for(const part of enc.split(/\s*\/\s*/)){
          const t=part.trim().replace(/^마법부여:\s*/,'');
          for(const[re,key]of ENC_PATS){const m=t.match(re);if(m){addH(key,'enc',parseInt(m[1]));break;}}
        }
        for(const g of(it.gemEffects||[])){
          for(const[re,key]of ENC_PATS){const m=g.match(re);if(m){addH(key,'enc',parseInt(m[1]));break;}}
        }
        const sb=it.socketBonus||'';
        for(const[re,key]of ENC_PATS){const m=sb.match(re);if(m){addH(key,'enc',parseInt(m[1]));break;}}
      });
      if(_hitBase>0) hbd.base=_hitBase;
      if(_critEnc>0) hbd.critStandalone=_critEnc;
      window._lastHitBreakdown=hbd;
    }
    // 숙련도 세부 분류 (툴팁용) — 타입별 착용효과/마법부여 분리
    {
      const sbd={};
      const addS=(key,field,v)=>{if(!sbd[key])sbd[key]={spell:0,enc:0};sbd[key][field]+=v;};
      const SP_SKILL=[
        [/착용 효과: 방어 숙련도가 (\d+)만큼/,'defense'],
        [/착용 효과: 회피 숙련도가 (\d+)만큼/,'dodge'],
        [/착용 효과: 방패 막기 숙련도가 (\d+)만큼/,'block'],
        [/착용 효과: 무기 막기 숙련도가 (\d+)만큼/,'parry'],
        [/숙련도가 (\d+)만큼/,'weapon'],
      ];
      const ENC_SKILL=[
        [/방어\s*숙련도\s*\+(\d+)/,'defense'],
        [/회피\s*숙련도\s*\+(\d+)/,'dodge'],
        [/방패\s*막기\s*숙련도\s*\+(\d+)/,'block'],
        [/무기\s*막기\s*숙련도\s*\+(\d+)/,'parry'],
        [/숙련도\s*\+(\d+)/,'weapon'],
      ];
      uniqItems.forEach(it=>{
        for(const s of(it.spell||[])){
          if(s.includes('낚시'))continue;
          for(const[re,key]of SP_SKILL){const m=s.match(re);if(m){addS(key,'spell',parseInt(m[1]));break;}}
        }
        const enc=it.enchant||'';
        for(const part of enc.split(/\s*\/\s*/)){
          const t=part.trim().replace(/^마법부여:\s*/,'');
          if(t.includes('낚시'))continue;
          for(const[re,key]of ENC_SKILL){const m=t.match(re);if(m){addS(key,'enc',parseInt(m[1]));break;}}
        }
        for(const g of(it.gemEffects||[])){
          if(g.includes('낚시'))continue;
          for(const[re,key]of ENC_SKILL){const m=g.match(re);if(m){addS(key,'enc',parseInt(m[1]));break;}}
        }
        const sb=it.socketBonus||'';
        for(const[re,key]of ENC_SKILL){const m=sb.match(re);if(m){addS(key,'enc',parseInt(m[1]));break;}}
      });
      window._lastSkillBreakdown=sbd;
    }

    // 치유증가/공격증가 축 — 레이더 차트는 아이템 집계만 (스펙 보너스 제외)
    const healP=(baseSum['healing_power']||0)+(spellSum['healing_power']||0)+(enchSum['healing_power']||0);
    const spellD=(baseSum['spell_dmg']||0)+(spellSum['spell_dmg']||0)+(enchSum['spell_dmg']||0);
    if(healP>0) totalStats['healing_power']=healP;
    if(spellD>0) totalStats['spell_dmg']=spellD;

    const allAxes=[
      ...STAT_AXES,
      {k:'healing_power',l:'치유증가'},
      {k:'spell_dmg',l:'공격증가'},
    ].filter(s=>totalStats[s.k]>0)
     .sort((a,b)=>(totalStats[b.k]||0)-(totalStats[a.k]||0))
     .slice(0,5);
    const _radarCol=CLASS_COLOR[CLASS_NAME_TO_ID[char.class_name||GUILD_DB[char.name]?.class_name||'']]||'#72a9ee';
    radarWrap.innerHTML=allAxes.length>=3?buildCompactRadarSVG(totalStats,allAxes,baseSum,spellSum,enchSum,_radarCol):'';
    const radarSvg=radarWrap.querySelector('svg');
    if(radarSvg){
      radarSvg.classList.remove('radar-enter');
      void radarSvg.offsetWidth;
      radarSvg.classList.add('radar-enter');
      radarSvg.addEventListener('animationend',()=>radarSvg.classList.remove('radar-enter'),{once:true});
    }
  }
  card.style.display='flex';
  requestAnimationFrame(syncEqStatCardToSummary);
}

function syncEqStatCardToSummary(){
  const viewerCol=document.getElementById('viewer-column');
  if(!viewerCol||viewerCol.style.display==='none')return;
  const summaryEl=document.querySelector('#stats-content .stat-cards');
  const card=document.getElementById('eqStatCard');
  if(!summaryEl||!card||card.style.display==='none')return;
  const leftCol=card.querySelector('.eq-card-left');
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    const z=parseFloat(getComputedStyle(document.documentElement).zoom)||1;
    const sr=summaryEl.getBoundingClientRect();
    // .stat-cards의 실제 렌더링 높이를 직접 사용 — 스크롤 위치와 무관하게 안정적
    const targetH=sr.height/z;
    const maxAllowed=window.innerHeight/z;
    if(targetH>60&&targetH<maxAllowed) card.style.height=targetH+'px';
    const gw=document.querySelector('.gear-wrap');
    if(gw) card.style.width=gw.offsetWidth+'px';
    // eq-card-left 너비를 하나의 stat-card 너비에 맞춤
    const singleCard=document.querySelector('#stats-content .stat-cards .stat-card');
    if(leftCol&&singleCard){
      leftCol.style.width=(singleCard.getBoundingClientRect().width/z)+'px';
    }
  }));
}
// resize 시 eq-stat-card 재동기화 (gear-wrap 침범 방지)
{let _rsTimer=null;window.addEventListener('resize',()=>{clearTimeout(_rsTimer);_rsTimer=setTimeout(syncEqStatCardToSummary,200);});}
// 브라우저 탭 전환 후 복귀 시 재동기화
document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(syncEqStatCardToSummary,100);});

// ── 장비창 ───────────────────────────────────────────────────
function buildEquipment(char){
  const cL=document.getElementById('colLeft'),cR=document.getElementById('colRight'),cB=document.getElementById('colBottom');
  cL.innerHTML='';cR.innerHTML='';cB.innerHTML='';
  const tbcaKey=_getTbcaSpecKey(char.name, char.class_name||'');
  LAYOUT_LEFT.forEach(s=>cL.appendChild(makeSlot(s,char.items?.[s],tbcaKey)));
  LAYOUT_RIGHT.forEach(s=>cR.appendChild(makeSlot(s,char.items?.[s],tbcaKey)));
  LAYOUT_BTM.forEach(s=>cB.appendChild(makeSlot(s,char.items?.[s],tbcaKey)));
}
function makeSlot(slotNum,item,tbcaKey){
  const el=document.createElement('div');el.className='slot';el.id=`slot_${slotNum}`;
  if(item){
    el.dataset.q=item.q;
    if(tbcaKey&&item.id){
      let bisInfo=(TBCA_P1_LOOKUP[tbcaKey]||{})[String(item.id)];
      if(!bisInfo&&tbcaKey==='DruidFeral')
        bisInfo=(TBCA_P1_LOOKUP['DruidCat']||{})[String(item.id)]||(TBCA_P1_LOOKUP['DruidBear']||{})[String(item.id)];
      if(bisInfo){
        el.dataset.bis=bisInfo.rank===1?'bis':'alt';
        const isBis=bisInfo.rank===1;
        const rankCol=isBis?'#ffd700':'#d0d8e8';
        const badge=document.createElement('div');
        badge.className='slot-bis-rank';
        badge.textContent=`#${bisInfo.rank}`;
        badge.style.color=rankCol;
        badge.style.borderColor=rankCol+'55';
        badge.style.background=`linear-gradient(rgba(0,0,0,.75),rgba(0,0,0,.75)),${rankCol}33`;
        el.appendChild(badge);
      }
    }
    if(item.icon){const img=new Image();img.src=item.icon;img.alt=item.name;if(item.id)img.dataset.iid=String(item.id);img.onerror=()=>_cvFetchIcon(img);el.appendChild(img);}
    if(item.dur){
      const pct=Math.round(item.dur[0]/item.dur[1]*100);
      const col=pct>50?'#00cc66':pct>25?'#ccaa00':'#ff4444';
      el.insertAdjacentHTML('beforeend',`<div class="slot-dur"><div class="slot-dur-fill" style="width:${pct}%;background:${col}"></div></div>`);
    }
    el.addEventListener('mouseenter',e=>showItemTT(slotNum,e));
    el.addEventListener('mousemove',e=>moveTT(e));
    el.addEventListener('mouseleave',hideTT);
  }else{el.dataset.q='EMPTY';}
  return el;
}



// ── INFO CARD (아이템 통계) ───────────────────────────────────
function buildInfoCard(char){
  const el=document.getElementById('centerInfoCard');
  if(!el)return;
  const items=char?.items?Object.values(char.items).filter(Boolean):[];
  if(!items.length){
    el.className='center-info-card-body empty';
    el.innerHTML='—';return;
  }
  el.className='center-info-card-body';

  // 품질별 카운트
  const QUAL_ORDER=['LEGENDARY','EPIC','RARE','UNCOMMON','COMMON'];
  const QUAL_KR={LEGENDARY:'전설',EPIC:'영웅',RARE:'정예',UNCOMMON:'희귀',COMMON:'일반'};
  const QUAL_COL={LEGENDARY:'#ff8000',EPIC:'#a335ee',RARE:'#0070dd',UNCOMMON:'#1eff00',COMMON:'#b8b8b8'};
  const qCount={};
  items.forEach(it=>{if(it.q)qCount[it.q]=(qCount[it.q]||0)+1;});

  let qHtml='';
  QUAL_ORDER.forEach(q=>{
    if(!qCount[q])return;
    qHtml+=`<span class="ic-qual-badge" style="color:${QUAL_COL[q]};background:${QUAL_COL[q]}18;border:1px solid ${QUAL_COL[q]}44">${QUAL_KR[q]} <b>${qCount[q]}</b></span>`;
  });

  // 아이템 스탯 합산
  const STAT_DISPLAY=[
    {k:'stamina',l:'체력',c:'#e25822'},{k:'strength',l:'힘',c:'#c8985a'},
    {k:'agility',l:'민첩',c:'#aad372'},{k:'intellect',l:'지능',c:'#69ccf0'},
    {k:'spirit',l:'정신',c:'#c3a0d8'},{k:'hit',l:'적중',c:'#ffe080'},
    {k:'crit',l:'치명타',c:'#f0c060'},{k:'defense',l:'방어',c:'#a0a0c0'},
  ];
  const statSum={};
  items.forEach(it=>{
    Object.entries(it.stats||{}).forEach(([k,v])=>{statSum[k]=(statSum[k]||0)+v;});
  });
  const visStats=STAT_DISPLAY.filter(s=>statSum[s.k]>0);

  const SC='#a8b4c4'; // 합산 스탯 통일 색상
  let sBadges='';
  visStats.forEach(({k,l})=>{
    sBadges+=`<span class="ic-qual-badge" style="color:${SC};background:${SC}14;border:1px solid ${SC}38">${l} <b>+${Math.round(statSum[k]).toLocaleString()}</b></span>`;
  });
  const displayedKeys=new Set(STAT_DISPLAY.map(s=>s.k));
  Object.entries(statSum).forEach(([k,v])=>{
    if(!displayedKeys.has(k)&&v>0)
      sBadges+=`<span class="ic-qual-badge" style="color:${SC};background:${SC}14;border:1px solid ${SC}38">${STAT_KR[k]||k} <b>+${Math.round(v).toLocaleString()}</b></span>`;
  });

  // 카테고리별 효과
  const badge=(txt,c)=>`<span class="ic-qual-badge" style="color:${c};background:${c}14;border:1px solid ${c}38;white-space:normal;word-break:keep-all;line-height:1.35">${txt}</span>`;
  const spellArr=[], enchantSet=new Set(), procSet=new Set();
  items.forEach(it=>{
    if(it.enchant)enchantSet.add(it.enchant);
    (it.spell||[]).forEach(s=>spellArr.push(s));
    (it.proc||[]).forEach(s=>procSet.add(s));
  });
  const spellHtml=spellArr.map(t=>badge(t,'#78a890')).join('');
  const enchantHtml=[...enchantSet].map(t=>badge(t,'#a890c8')).join('');
  const procHtml=[...procSet].map(t=>badge(t,'#c8a060')).join('');

  el.innerHTML=`
    <div class="ic-section-title">아이템 등급 · ${items.length}개</div>
    <div class="ic-qual-row">${qHtml||'<span style="color:var(--text3)">—</span>'}</div>
    ${sBadges?`<div class="ic-section-title">장비 합산 스탯</div><div class="ic-qual-row" style="row-gap:5px">${sBadges}</div>`:''}
    ${spellHtml?`<div class="ic-section-title" style="margin-top:8px">착용 효과</div><div class="ic-qual-row" style="row-gap:5px">${spellHtml}</div>`:''}
    ${enchantHtml?`<div class="ic-section-title" style="margin-top:8px">마법 부여</div><div class="ic-qual-row" style="row-gap:5px">${enchantHtml}</div>`:''}
    ${procHtml?`<div class="ic-section-title" style="margin-top:8px">발동 효과</div><div class="ic-qual-row" style="row-gap:5px">${procHtml}</div>`:''}
  `;
}

// ── STATS VIEW 빌드 ──────────────────────────────────────────
function buildStatsView(char){
  const el=document.getElementById('stats-content');
  if(!el)return;
  const gm=GUILD_DB[char.name]||{};
  const myStats=STATS_DB[char.name];
  const className=char.class_name||gm.class_name||'';
  const level=gm.level||0;
  const keyStats=CLASS_KEY_STATS[className]||CLASS_KEY_STATS['마법사'];
  const classCol=CLASS_COLOR[CLASS_NAME_TO_ID[className]]||'#a0a0a0';

  if(!myStats){
    el.innerHTML=`<div class="no-data-msg">※ 배틀넷 계정설정에서 [게임 데이터 및 프로필 공개설정] - [사용함] 체크가 되어있는지 확인해주세요 (비활성화시 데이터 수집이 불가능합니다)</div>`;
    return;
  }

  // 같은 직업 + 유사 레벨(±5) 비교군 (평균 바 표시용)
  const peers=Object.values(STATS_DB).filter(d=>{
    const g=GUILD_DB[d.character_name]||{};
    return g.class_name===className && Math.abs((g.level||0)-level)<=5 && d.character_name!==char.name;
  });

  function rankOf(stat){
    const myVal=myStats[stat]||0;
    if(!myVal)return null;
    if(!_statRankCache[className])_statRankCache[className]={};
    if(!_statRankCache[className][stat]){
      _statRankCache[className][stat]=Object.values(STATS_DB)
        .filter(d=>(GUILD_DB[d.character_name]||{}).class_name===className)
        .map(d=>d[stat]||0)
        .filter(v=>v>0)
        .sort((a,b)=>b-a);
    }
    const sorted=_statRankCache[className][stat];
    if(!sorted.length)return null;
    const rank=(sorted.indexOf(myVal)+1)||sorted.length;
    return {rank,total:sorted.length};
  }

  function rankBadge(stat){
    const r=rankOf(stat);
    if(!r)return '';
    const pct=Math.round((r.rank/r.total)*100);
    const cls=pct<=10?'pct-top':pct<=50?'pct-mid':'pct-low';
    return `<span class="pct-badge ${cls}">상위 ${pct}%</span>`;
  }

  // 하위호환: percentile → rankOf 기반
  function percentile(stat){
    const r=rankOf(stat);
    if(!r)return null;
    return Math.round((r.total-r.rank)/Math.max(r.total-1,1)*100);
  }
  function pctBadge(stat){ return rankBadge(stat); }

  const specData=SPEC_DB[char.name];
  const activeSpecs=(specData?.active||[]).map(s=>`${s.spec} ${s.pts}pts`);
  const secondarySpecs=(specData?.secondary||[]).map(s=>`${s.spec} ${s.pts}pts`);
  const activeSpec0=(specData?.active?.[0]?.spec)||'';
  let _specHealBonus=0, _specDmgBonus=0;
  if(className==='성기사'&&activeSpec0==='신성'){const b=Math.floor((myStats.intellect_effective||0)*0.35);_specHealBonus=b;_specDmgBonus=b;}
  else if(className==='사제'&&activeSpec0==='신성'){const b=Math.floor((myStats.spirit_effective||0)*0.25);_specHealBonus=b;_specDmgBonus=b;}
  else if(className==='주술사'&&activeSpec0==='복원'){const b=Math.floor((myStats.intellect_effective||0)*0.30);_specHealBonus=b;_specDmgBonus=b;}
  else if(className==='드루이드'&&activeSpec0==='조화'){const b=Math.floor((myStats.intellect_effective||0)*0.25);_specHealBonus=b;_specDmgBonus=b;}
  const hp=myStats.health||0, mp=myStats.power||0, ap=myStats.attack_power||0;
  const casters=['마법사','사제','흑마법사'];
  const isCaster=casters.includes(className);
  const mainCrit=className==='사냥꾼'?(myStats.ranged_crit||0):isCaster?(myStats.spell_crit||0):(myStats.melee_crit||0);

  let h='';

  // 요약 카드 — 등수 표시
  h+=`<div class="stats-section-title panel-section-hd" style="display:flex;align-items:center;gap:5px">능력치<span class="gs-hint-icon" onmouseenter="showStatCriteriaTT(event)" onmousemove="moveTT(event)" onmouseleave="hideTT()">?</span></div>`;
  h+=`<div class="stats-section"><div class="stat-cards">
    <div class="stat-card"><div class="stat-card-label">생명력</div><div class="stat-card-val" style="color:var(--text)">${hp.toLocaleString()}</div><div class="stat-card-sub">${rankBadge('health')}</div></div>`;
  if(mp>0)h+=`<div class="stat-card"><div class="stat-card-label">마나/분노</div><div class="stat-card-val" style="color:var(--text)">${mp.toLocaleString()}</div><div class="stat-card-sub">${rankBadge('power')}</div></div>`;
  h+=`<div class="stat-card"><div class="stat-card-label">${isCaster?'주문치명타%':'공격력'}</div><div class="stat-card-val" style="color:var(--text)">${isCaster?`${mainCrit.toFixed(1)}%`:ap.toLocaleString()}</div><div class="stat-card-sub">${rankBadge(isCaster?'spell_crit':'attack_power')}</div></div>
    <div class="stat-card"><div class="stat-card-label">방어도</div><div class="stat-card-val" style="color:var(--text)">${(myStats.armor_effective||0).toLocaleString()}</div><div class="stat-card-sub">${rankBadge('armor_effective')}</div></div>
  </div></div>`;

  // 무기 섹션 (main_hand_dps 데이터 있을 때만)
  const mhDps=myStats.main_hand_dps||0;
  if(mhDps>0){
    const ohDps=myStats.off_hand_dps||0;
    const fmtSpd=v=>v?`${v.toFixed(1)}s`:'—';
    const fmtDmg=(mn,mx)=>mn||mx?`${Math.round(mn)}~${Math.round(mx)}`:'—';
    h+=`<div class="stats-section"><div class="stats-section-title">WEAPON</div>
      <div style="display:grid;grid-template-columns:1fr${ohDps>0?' 1fr':''};gap:6px;">
        <div style="background:var(--bg3);border:1px solid var(--border);border-radius:5px;padding:8px 10px;">
          <div style="font-size:11.7px;color:var(--text3);letter-spacing:1px;margin-bottom:6px">MAIN HAND</div>
          <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px">
            <span style="font-size:23.4px;font-weight:900;color:#ffaa44">${mhDps.toFixed(1)}</span>
            <span style="font-size:11.7px;color:var(--text3)">DPS</span>
          </div>
          <div style="font-size:13px;color:var(--text2)">${fmtDmg(myStats.main_hand_damage_min,myStats.main_hand_damage_max)} <span style="color:var(--text3)">· ${fmtSpd(myStats.main_hand_speed)}</span></div>
        </div>
        ${ohDps>0?`<div style="background:var(--bg3);border:1px solid var(--border);border-radius:5px;padding:8px 10px;">
          <div style="font-size:11.7px;color:var(--text3);letter-spacing:1px;margin-bottom:6px">OFF HAND</div>
          <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px">
            <span style="font-size:23.4px;font-weight:900;color:#ddaa33">${ohDps.toFixed(1)}</span>
            <span style="font-size:11.7px;color:var(--text3)">DPS</span>
          </div>
          <div style="font-size:13px;color:var(--text2)">${fmtDmg(myStats.off_hand_damage_min,myStats.off_hand_damage_max)} <span style="color:var(--text3)">· ${fmtSpd(myStats.off_hand_speed)}</span></div>
        </div>`:''}
      </div></div>`;
  }

  // 핵심 스탯 바
  const floatKeys=new Set(['melee_crit','spell_crit','ranged_crit','melee_haste','spell_haste','ranged_haste','dodge','parry','block']);
  const zeroAllowed=new Set(['spell_crit','melee_crit','ranged_crit','spell_haste','melee_haste','ranged_haste']);
  h+=`<div class="stats-section"><div class="stats-section-title">CORE STATS · ${className}</div>`;
  for(const {k,l,c,f} of keyStats){
    let val=myStats[k]||0;
    if(k==='healing_power') val+=_specHealBonus;
    else if(k==='spell_dmg') val+=_specDmgBonus;
    if(val===0&&!zeroAllowed.has(k))continue;
    // main_hand_dps / off_hand_dps 는 WEAPON 섹션에서 이미 표시하므로 바에서 제외
    if(k==='main_hand_dps'||k==='off_hand_dps') continue;
    const maxRef=STAT_MAX_REF[k]||1000;
    const fillPct=Math.min(100,Math.round(val/maxRef*100));
    let avgPct=null;
    if(peers.length){
      const vals=peers.map(d=>d[k]||0).filter(v=>v>0);
      if(vals.length){const avg=vals.reduce((a,b)=>a+b,0)/vals.length;avgPct=Math.min(100,Math.round(avg/maxRef*100));}
    }
    const dv=floatKeys.has(k)?`${val.toFixed(1)}%`
      :f==='int'?val.toLocaleString()
      :f==='dps'?val.toFixed(1)
      :val.toLocaleString();
    const r=rankOf(k);
    const avgValStr=avgPct!==null?(()=>{
      const vals=peers.map(d=>d[k]||0).filter(v=>v>0);
      if(!vals.length)return null;
      const avg=vals.reduce((a,b)=>a+b,0)/vals.length;
      return floatKeys.has(k)?`${avg.toFixed(1)}%`:f==='dps'?avg.toFixed(1):Math.round(avg).toLocaleString();
    })():null;
    const ttArgs=`'${l}','${dv}',${r?r.rank:0},${r?r.total:0},${avgValStr!==null?`'${avgValStr}'`:'null'},'${className}'`;
    h+=`<div class="stat-row" style="cursor:default"
      onmouseenter="showStatTT(event,${ttArgs})"
      onmousemove="moveTT(event)"
      onmouseleave="hideTT()">
      <div class="stat-label">${l}</div>
      <div class="stat-bar-wrap">
        <div class="stat-bar-fill" style="width:${fillPct}%;background:linear-gradient(90deg,${classCol}66,${classCol})"></div>
        ${avgPct!==null?`<div class="stat-bar-avg" style="left:${avgPct}%"></div>`:''}
      </div>
      <div class="stat-value" style="color:var(--text)">${dv}</div>
    </div>`;
  }
  h+=`</div>`;

  // 저항
  const resStats=[{k:'fire_resistance_effective',l:'화염저항',c:'#ff6030'},{k:'shadow_resistance_effective',l:'암흑저항',c:'#9482c9'},{k:'nature_resistance_effective',l:'자연저항',c:'#55aa44'},{k:'arcane_resistance_effective',l:'비전저항',c:'#69ccf0'},{k:'holy_resistance_effective',l:'신성저항',c:'#ffe080'}].filter(r=>(myStats[r.k]||0)>0);
  if(resStats.length){
    h+=`<div class="stats-section"><div class="stats-section-title">RESISTANCES</div>`;
    for(const {k,l,c} of resStats){
      const val=myStats[k]||0,fp=Math.min(100,Math.round(val/400*100));
      h+=`<div class="stat-row"><div class="stat-label">${l}</div><div class="stat-bar-wrap"><div class="stat-bar-fill" style="width:${fp}%;background:linear-gradient(90deg,${c}66,${c})"></div></div><div class="stat-value" style="color:${c}">${val}</div><div class="stat-pct"></div></div>`;
    }
    h+=`</div>`;
  }

  // ALL STATS — RESISTANCES 아래에 이어서 렌더
  // slot 15/16 중복 제거: data.js에서 back 아이템이 양쪽 키에 할당되어 동일 객체 참조 → Set으로 dedupe
  const charItems=char.items?[...new Set(Object.values(char.items))]:[];

  // enchant 정규식 정의
  const ENCHANT_RE=_ENCHANT_RE_ALLSTATS;

  // enchant 능력치 합산 (ALL STATS용)
  const ENCHANT_MAPPING={
    stamina:'stamina_effective',
    strength:'strength_effective',
    agility:'agility_effective',
    intellect:'intellect_effective',
    spirit:'spirit_effective',
    hit:'hit_rating',
    crit:'crit_rating',
    attack_power:'attack_power',
    spell_power:'spell_power',
  };
  const enchAllStats={};
  for(const it of charItems){
    const enc=it?.enchant||'';
    if(!enc)continue;
    const enchParts=enc.split(/\s*\/\s*/);
    for(const part of enchParts){
      for(const[k,reArr]of Object.entries(ENCHANT_RE)){
        reArr.forEach(re=>{
          re.lastIndex=0;
          for(const m of part.matchAll(re)){
            const mapped=ENCHANT_MAPPING[k];
            if(mapped) enchAllStats[mapped]=(enchAllStats[mapped]||0)+parseInt(m[1]);
          }
        });
      }
    }
  }
  const _rr=(l,dv)=>`<div style="display:flex;justify-content:space-between;gap:10px;padding:6px 8px;background:var(--bg3);border-radius:4px;border:1px solid var(--border)"><span style="font-size:13px;color:var(--text3);white-space:nowrap">${l}</span><span style="font-size:14.3px;font-weight:600;color:var(--text)">${dv}</span></div>`;
  const STAT_GROUPS=[
    {title:'기본 능력치',stats:[
      {k:'strength_effective',l:'힘',raw:true},{k:'agility_effective',l:'민첩성',raw:true},
      {k:'stamina_effective',l:'체력',raw:true},{k:'intellect_effective',l:'지능',raw:true},
      {k:'spirit_effective',l:'정신력',raw:true},{k:'armor_effective',l:'방어도',raw:true},
    ]},
    {title:'근접',stats:[
      {k:'attack_power',l:'공격력',raw:true},
      {k:'main_hand_dps',l:'메인핸드DPS',f:'f1'},{k:'off_hand_dps',l:'오프핸드DPS',f:'f1'},
      {k:'melee_crit',l:'근접치명타',f:'pct'},{k:'melee_haste',l:'근접가속',f:'pct'},
      {k:'hit_rating',l:'적중도',raw:true},{k:'crit_rating',l:'치명타 적중도',raw:true},
    ]},
    {title:'원거리',stats:[
      {k:'ranged_crit',l:'원거리치명타',f:'pct'},{k:'ranged_haste',l:'원거리가속',f:'pct'},
    ]},
    {title:'주문',stats:[
      {k:'spell_power',l:'주문력',raw:true},
      {k:'healing_power',l:'치유증가량',raw:true},{k:'spell_dmg',l:'공격증가량',raw:true},
      {k:'spell_penetration',l:'마법관통'},
      {k:'spell_crit',l:'주문치명타',f:'pct'},{k:'spell_haste',l:'주문가속',f:'pct'},
      {k:'mana_regen',l:'마나재생/5s'},{k:'mana_regen_combat',l:'전투마나재생/5s'},
      {k:'spell_hit_rating',l:'주문 적중도',raw:true},{k:'spell_crit_rating',l:'주문 극대화 적중도',raw:true},
    ]},
    {title:'방어',stats:[
      {k:'defense_effective',l:'방어숙련'},
      {k:'dodge',l:'회피',f:'pct'},{k:'parry',l:'반격',f:'pct'},{k:'block',l:'막기',f:'pct'},
      {k:'resilience_rating',l:'탄력도',raw:true},
    ]},
  ];

  // 모든 스탯 수집 후 pct/non-pct 분리
  const nonPctRows=[];
  const pctRows=[];
  for(const grp of STAT_GROUPS){
    for(const {k,l,f,raw} of grp.stats){
      let v=raw?(myStats[k]||0):((myStats[k]||0)+(enchAllStats[k]||0));
      if(k==='healing_power') v+=_specHealBonus;
      else if(k==='spell_dmg') v+=_specDmgBonus;
      const dv=f==='pct'?`${v.toFixed(2)}%`:f==='f1'?v.toFixed(1):v.toLocaleString();
      const row=_rr(l,dv);
      if(f==='pct') pctRows.push(row);
      else nonPctRows.push(row);
    }
  }

  const allCols=(rows)=>{
    const half=Math.ceil(rows.length/2);
    const left=rows.slice(0,half).join('');
    const right=rows.slice(half).join('');
    return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 16px;">
      <div style="display:flex;flex-direction:column;gap:4px;">${left}</div>
      <div style="display:flex;flex-direction:column;gap:4px;">${right}</div>
    </div>`;
  };

  const ah=`<div class="stats-section">
    <div class="stats-section-title">ALL STATS</div>
    ${allCols(nonPctRows)}
    ${pctRows.length?`<div style="margin-top:10px;border-top:1px solid var(--border);padding-top:10px;">${allCols(pctRows)}</div>`:''}
  </div>`;

  el.innerHTML=h+ah;
  requestAnimationFrame(()=>{
    document.querySelectorAll('#stats-content .stat-bar-fill').forEach(b=>{
      const w=b.style.width;b.style.width='0';
      requestAnimationFrame(()=>{b.style.width=w;});
    });
  });
}
// ── 탤런트 트리 빌드 ─────────────────────────────────────────
async function buildTalentTrees(char){
  const container=document.getElementById('talentTrees');
  const specs=SPEC_DB[char.name];
  if(!specs){
    container.innerHTML='';
    return;
  }

  container.innerHTML='';

  // ✅ SPECIALIZATION 요약 (TALENTS 패널 상단)
  const activeRaw=(specs.active||[]);
  const secondaryRaw=(specs.secondary||[]);
  const activeSpecs=activeRaw.map(s=>`${s.spec} ${s.pts}pts`);
  const secondarySpecs=secondaryRaw.map(s=>`${s.spec} ${s.pts}pts`);
  const maxIdx=arr=>arr.length?arr.reduce((mi,s,i,a)=>s.pts>a[mi].pts?i:mi,0):-1;
  const activeMaxI=maxIdx(activeRaw);
  const secondaryMaxI=maxIdx(secondaryRaw);

  const group=currentTalentGroup;
  const specList=specs[group]||[];
  if(!specList.length){
    const emptyDiv=document.createElement('div');
    emptyDiv.style.cssText='color:var(--muted);font-size:15.6px;padding:16px;font-family:Rajdhani,sans-serif';
    emptyDiv.textContent=`${group==='active'?'Active':'Secondary'} 스킬 데이터 없음`;
    container.appendChild(emptyDiv);
    return;
  }

  for(const sp of specList){
    const treeEl=document.createElement('div');treeEl.className='spec-tree';
    const _treeKey=KR_TO_TREE_KEY[char.class_name];
    const _treeId=_treeKey&&window.TBC_CLASS_TREES?.[_treeKey]?.[sp.spec];
    if(_treeKey&&_treeId){
      treeEl.style.backgroundImage=`linear-gradient(rgba(0,0,0,.75),rgba(0,0,0,.75)),url('images/talent_background_tbc/${_treeKey}_${_treeId}.jpg')`;
      treeEl.style.backgroundSize='cover';
      treeEl.style.backgroundPosition='center';
    }else{
      treeEl.style.background='var(--panel)';
    }
    treeEl.style.border='1px solid rgba(255,255,255,.06)';

    // 헤더
    const headerEl=document.createElement('div');headerEl.className='spec-tree-header';
    headerEl.innerHTML=`
      <div class="spec-tree-icon"><img src="" alt="${sp.spec}" onerror="this.style.display='none'" id="spec-icon-${sp.spec.replace(/\s/g,'_')}"/></div>
      <div class="spec-tree-name">${sp.spec}</div>
      <div class="spec-tree-pts">${sp.pts} pts</div>
    `;
    treeEl.appendChild(headerEl);

    // 그리드
    const gridEl=document.createElement('div');gridEl.className='spec-tree-grid';

    // 찍은 talent map: {tid: {rank, spell_id, base_spell_id, name, desc, ...}}
    const spentMap=sp.talents;

    // 아이콘 생성 — talentId 직접 사용
    function makeTreeIcon(tid,iconname){
      const spent=spentMap[tid]||null;
      const tbcEntry=window.TBC_TALENT_BY_ID?.[tid];
      const meta=TALENT_META[tid];
      const rank=spent?.rank||0;
      const maxRank=(window.TALENT_MAX_FROM_TREE?.[tid])||(meta?.max)||'?';
      const isFull=rank>0&&rank>=maxRank;
      const resolvedIcon=iconname||(tbcEntry?.icon)||null;

      const iconEl=document.createElement('div');
      iconEl.className=`t-icon ${rank>0?(isFull?'spent full':'spent'):'unspent'}`;
      const img=document.createElement('img');
      img.alt=spent?.name||meta?.name||String(tid);
      if(resolvedIcon){
        img.src=`${WH_ICON}/${resolvedIcon}.jpg`;
      } else {
        img.src=`${WH_ICON}/inv_misc_questionmark.jpg`;
      }
      iconEl.appendChild(img);

      const badge=document.createElement('div');
      badge.className=`t-rank ${isFull?'full':rank>0?'partial':'zero'}`;
      badge.textContent=`${rank}/${maxRank}`;
      iconEl.appendChild(badge);

      iconEl.addEventListener('mouseenter',e=>showTalentTT(tid,rank,maxRank,spent,e));
      iconEl.addEventListener('mousemove',e=>moveTT(e));
      iconEl.addEventListener('mouseleave',hideTT);
      return iconEl;
    }

    // tbc_talents.json 기반 그리드 렌더링
    const treeKey=KR_TO_TREE_KEY[char.class_name];
    const treeId=treeKey&&window.TBC_CLASS_TREES?.[treeKey]?.[sp.spec];
    const treeEntries=treeId&&window.TBC_TREE_MAP?.[treeId];

    let firstGridTid=null;
    if(treeEntries){
      const tGrid={};let maxRow=0;
      for(const e of treeEntries){
        const r=Number(e.row),c=Number(e.col);
        if(!tGrid[r])tGrid[r]={};
        tGrid[r][c]=e;
        if(r>maxRow)maxRow=r;
      }
      outer:
      for(let row=0;row<=maxRow;row++){
        for(let col=0;col<=3;col++){
          const entry=tGrid[row]?.[col];
          if(entry&&spentMap[entry.id]&&spentMap[entry.id].rank>0){firstGridTid=entry.id;break outer;}
        }
      }
      gridEl.style.gridTemplateColumns='repeat(4,46px)';
      for(let row=0;row<=maxRow;row++){
        for(let col=0;col<=3;col++){
          const entry=tGrid[row]?.[col];
          if(entry){
            gridEl.appendChild(makeTreeIcon(entry.id,entry.icon));
          } else {
            const ph=document.createElement('div');ph.className='t-icon-ph';
            gridEl.appendChild(ph);
          }
        }
      }
    } else {
      // 폴백: SPEC_TALENTS 순서대로
      const specTids=(SPEC_TALENTS[sp.spec]||[]).slice().sort((a,b)=>a-b);
      gridEl.style.gridTemplateColumns='repeat(4,46px)';
      for(const tid of specTids){
        if(firstGridTid===null&&spentMap[tid]&&spentMap[tid].rank>0)firstGridTid=tid;
        gridEl.appendChild(makeTreeIcon(tid));
      }
    }

    treeEl.appendChild(gridEl);
    container.appendChild(treeEl);

    // spec 헤더 아이콘 (그리드 첫 번째 활성 재능 기준)
    if(firstGridTid){
      const _ic=window.TBC_TALENT_BY_ID?.[firstGridTid]?.icon;
      if(_ic){
        const el=document.getElementById(`spec-icon-${sp.spec.replace(/\s/g,'_')}`);
        if(el)el.src=`${WH_ICON}/${_ic}.jpg`;
      }
    }
  }
}

// ── 렌더링 ───────────────────────────────────────────────────
async function renderChar(){
  const gen=++_renderGen;
  const char=currentChar;if(!char||!char.race_id)return;
  const ov=document.getElementById('overlay');
  if(ov){ov.className='overlay';ov.innerHTML=`<div class="spin"></div><div class="overlay-text">소환 중...</div>`;}
  document.getElementById('loadBar').style.width='0';

  const fdidKey=`${char.race_id}_${char.viewer_gender}`;
  if(!FDID_MAP[fdidKey]){
    if(ov)ov.innerHTML=`<div class="no-model-msg">⚠️ mo3 없음</div>`;
    btn.disabled=false;btn.textContent='다시 불러오기';
    addLog(`❌ mo3 없음: race=${char.race_id} gender=${char.viewer_gender}`,'err');
    document.getElementById('sidebarList')?.classList.remove('rendering');
    return;
  }
  const rawItems=(Object.keys(char.items||{}).map(Number)
    .filter(s=>char.items[s].did>0&&VISUAL_SLOTS.includes(s))
    .map(s=>[s,Math.round(char.items[s].did)]));

  // slot 5(가슴) 슬롯 확인 — displayId 단위 캐싱
  const chestItem=rawItems.find(([s])=>s===5);
  const resolveChest=async()=>{
    if(!chestItem)return;
    const did=chestItem[1];
    if(_CHEST_SLOT_CACHE[did]!==undefined){chestItem[0]=_CHEST_SLOT_CACHE[did];return;}
    const url=`${window.PROXY_HOST}/modelviewer/tbc/meta/armor/5/${did}.json`;
    try{
      const r=await fetch(url,{method:'HEAD',signal:AbortSignal.timeout(1500)});
      _CHEST_SLOT_CACHE[did]=r.ok?5:20;
      _saveChestSlotCache();
      if(!r.ok)chestItem[0]=20;
    }catch(e){chestItem[0]=20;}
  };

  // ✅ module 로딩 대기 + 가슴 슬롯 fetch 병렬 실행
  try{
    await Promise.all([
      waitFor(()=>typeof window.generateModels==='function',10000,'generateModels 로딩 타임아웃'),
      resolveChest(),
    ]);
  }catch(e){
    if(gen!==_renderGen)return;
    if(ov)ov.innerHTML=`<div class="no-model-msg">❌ 뷰어 로딩 실패</div>`;
    addLog(`❌ ${e.message}`,'err');
    document.getElementById('sidebarList')?.classList.remove('rendering');
    return;
  }
  if(gen!==_renderGen)return;

  const items=rawItems;
  window._mo3Map={};
  const charFdid=FDID_MAP[fdidKey]?.fdid;
  if(charFdid)window._mo3Map[String(charFdid)]={slot:0,name:char.race_name+' '+char.gender_label,did:charFdid};
  items.forEach(([slot,did])=>{window._mo3Map[String(did)]={slot,name:char.items[slot]?.name||'',did};});
  document.getElementById('loadBar').style.width='40%';

  addLog(`[소환] ${char.name} | ${FDID_MAP[fdidKey]?.label} | 아이템 ${items.length}개`,'info');
  const wrap=document.querySelector('.model-wrap');
  const wr=wrap?wrap.getBoundingClientRect():null;
  const aspect=(wr&&wr.height>0)?wr.width/wr.height:320/440;
  const ap={...char.appearance,items};
  function stretchCanvas(){
    const c=document.querySelector('#model_3d canvas'),d=document.querySelector('#model_3d>div[style]');
    if(c){c.style.width='100%';c.style.height='100%';c.style.display='block';}
    if(d){d.style.width='100%';d.style.height='100%';}
  }
  // 애니메이션은 오버레이 제거 후 백그라운드에서 적용
  function applyAnimAsync(viewer,anim,capturedGen){
    (async()=>{
      await new Promise(resolve=>{
        const t=setInterval(()=>{
          if(capturedGen!==_renderGen){clearInterval(t);resolve();return;}
          if(typeof viewer?.renderer?.actors?.[0]?.setAnimation==='function'){clearInterval(t);resolve();}
        },100);
        setTimeout(()=>{clearInterval(t);resolve();},8000);
      });
      if(capturedGen!==_renderGen)return;
      if(typeof viewer?.renderer?.actors?.[0]?.setAnimation==='function')
        viewer.renderer.actors[0].setAnimation(anim);
    })();
  }
  // 오버레이 제거 후 다음 rAF 프레임에서 해제 — 그 시점이 모델이 실제로 화면에 그려진 순간
  const _unlockSidebar=()=>requestAnimationFrame(()=>document.getElementById('sidebarList')?.classList.remove('rendering'));
  try{
    const viewer=await window.generateModels(aspect,'#model_3d',ap,'classic');
    if(gen!==_renderGen){
      try{const _c=viewer?.canvas||null;if(_c){const _g=_c.getContext('webgl')||_c.getContext('experimental-webgl');_g?.getExtension('WEBGL_lose_context')?.loseContext();}}catch(e){}
      return;
    }

    window._lastViewer=viewer;
    stretchCanvas();
    document.getElementById('overlay')?.classList.add('gone');
    document.getElementById('loadBar').style.width='100%';
    _unlockSidebar();
    addLog('[완료] 렌더링 성공 ✅','ok');
    applyAnimAsync(viewer,'Stand',gen);
  }catch(e){
    if(gen!==_renderGen)return;
    addLog('[재시도] noCharCustomization','warn');
    try{
      const viewer=await window.generateModels(aspect,'#model_3d',{race:char.race_id,gender:char.viewer_gender,items,noCharCustomization:true},'classic');
      if(gen!==_renderGen){
        try{const _c=viewer?.canvas||null;if(_c){const _g=_c.getContext('webgl')||_c.getContext('experimental-webgl');_g?.getExtension('WEBGL_lose_context')?.loseContext();}}catch(e){}
        return;
      }

      window._lastViewer=viewer;
      stretchCanvas();
      document.getElementById('overlay')?.classList.add('gone');
      document.getElementById('loadBar').style.width='100%';
      _unlockSidebar();
      addLog('[완료] noCharCustomization 성공 ✅','ok');
      applyAnimAsync(viewer,'Stand',gen);
    }catch(e2){
      if(gen!==_renderGen)return;
      const ov2=document.getElementById('overlay');
      if(ov2)ov2.innerHTML=`<div class="no-model-msg">❌ ${e2.message}</div>`;
      document.getElementById('sidebarList')?.classList.remove('rendering');
      addLog(`[실패] ${e2.message}`,'err');
    }
  }
}

// ── 패널-오른쪽 탭 전환 ─────────────────────────────────────
function switchPRTab(tab){
  const skillPanel=document.getElementById('pr-skill-panel');
  const itemPanel=document.getElementById('pr-item-panel');
  document.querySelectorAll('.pr-panel-tab').forEach(t=>t.classList.toggle('active',t.id===`prtab-${tab}`));
  if(tab==='skill'){
    if(skillPanel)skillPanel.style.display='';
    if(itemPanel)itemPanel.style.display='none';
  }else{
    if(skillPanel)skillPanel.style.display='none';
    if(itemPanel){itemPanel.style.display='';buildItemAnalysis(currentChar);}
  }
}

// ── 아이템 분석 패널 ─────────────────────────────────────────

const _GEM_SOCKET_COLORS={
  '붉은색':'#c41e3a',
  '노란색':'#d4aa00',
  '파란색':'#1a6ecf',
  '얼개':'#808080',
};

async function buildItemAnalysis(char){
  const panel=document.getElementById('pr-item-panel');
  if(!panel||panel.style.display==='none')return;
  if(!char){panel.innerHTML='<div class="ia-empty">캐릭터를 선택해주세요</div>';return;}
  const _iaCol=CLASS_COLOR[CLASS_NAME_TO_ID[char.class_name||GUILD_DB[char.name]?.class_name||'']]||'#72a9ee';
  if(!_gemData){
    try{const r=await fetch('/data/gem_data.json');_gemData=await r.json();}catch(e){_gemData={};}
  }

  const seenItems=new Set();
  const rawEnchants=[];
  const rawGems=[];
  const rawSocketBonuses=[];
  Object.entries(char.items||{}).forEach(([,it])=>{
    if(!it||seenItems.has(it))return;
    seenItems.add(it);
    if(it.enchantId&&it.enchantSource){
      const eff=(it.enchant||'').replace(/^마법부여:\s*/,'');
      rawEnchants.push({enchantId:it.enchantId,enchantSourceId:it.enchantSourceId||null,name:it.enchantSource,eff});
    }
    (it.gemIds||[]).forEach((gid,gi)=>{
      const gemName=(it.gemNames||[])[gi]||'';
      const gemEff=(it.gemEffectsRaw||[])[gi]||'';
      if(gemName)rawGems.push({itemId:gid,gemName,gemEff});
    });
    if(it.socketBonus)rawSocketBonuses.push(it.socketBonus);
  });

  const groups={};
  rawGems.forEach(({itemId,gemName,gemEff})=>{
    if(!groups[gemName])groups[gemName]={count:0,itemId,gemEff};
    groups[gemName].count++;
  });
  const groupList=Object.entries(groups).sort((a,b)=>b[1].count-a[1].count);
  const totalGems=rawGems.length;

  const GEM_STAT_LABELS={
    stamina:'체력',strength:'힘',agility:'민첩',intellect:'지능',spirit:'정신',
    all_stats:'모든 능력치',
    crit:'치명타',defense:'방어',parry:'막기',
    attack_power:'전투력',healing_power:'주문 치유량',spell_dmg:'주문 공격력',
    hit_pure:'적중도',hit_spell:'주문 적중도',hit_crit:'치명타 적중도',
    hit_spell_crit:'주문 극대화 적중도',hit_ranged_crit:'원거리 치명타 적중도',
    skill_weapon:'숙련도',skill_defense:'방어 숙련도',skill_dodge:'회피 숙련도',
    skill_block:'방패 막기 숙련도',skill_parry:'무기 막기 숙련도',
    mp5:'5초당 마나',
    resilience:'탄력도',
  };
  const _HIT_PARTS=[
    {k:'hit_ranged_crit',re:/원거리\s*치명타\s*적중도\s*\+(\d+)/},
    {k:'hit_spell_crit', re:/주문\s*극대화\s*적중도\s*\+(\d+)/},
    {k:'hit_crit',       re:/치명타\s*적중도\s*\+(\d+)/},
    {k:'hit_spell',      re:/주문\s*적중도\s*\+(\d+)/},
    {k:'hit_pure',       re:/적중도\s*\+(\d+)/},
  ];
  const _SKILL_PARTS=[
    {k:'skill_defense',re:/방어\s*숙련도\s*\+(\d+)/},
    {k:'skill_dodge',  re:/회피\s*숙련도\s*\+(\d+)/},
    {k:'skill_block',  re:/방패\s*막기\s*숙련도\s*\+(\d+)/},
    {k:'skill_parry',  re:/무기\s*막기\s*숙련도\s*\+(\d+)/},
    {k:'skill_weapon', re:/숙련도\s*\+(\d+)/},
  ];
  const _RADAR_SKIP=new Set(['hit','skill']);
  const agg={};
  const _addToAgg=(effText)=>{
    if(!effText)return;
    const bothRe=/주문\s*공격력\s*및\s*치유량?\s*\+(\d+)/g;
    const allRe=/모든\s*능력치\s*\+(\d+)/g;
    const mp5Re=/5초당\s*마나\s*회복량?\s*\+(\d+)/g;
    for(const m of effText.matchAll(bothRe)){const v=parseInt(m[1]);agg.healing_power=(agg.healing_power||0)+v;agg.spell_dmg=(agg.spell_dmg||0)+v;}
    for(const m of effText.matchAll(allRe)){agg.all_stats=(agg.all_stats||0)+parseInt(m[1]);}
    for(const m of effText.matchAll(mp5Re)){agg.mp5=(agg.mp5||0)+parseInt(m[1]);}
    const text=effText.replace(bothRe,'').replace(allRe,'').replace(mp5Re,'');
    for(const part of text.split(/\s*\/\s*/)){
      for(const{k,re}of _HIT_PARTS){const m=part.match(re);if(m){agg[k]=(agg[k]||0)+parseInt(m[1]);break;}}
      for(const{k,re}of _SKILL_PARTS){const m=part.match(re);if(m){agg[k]=(agg[k]||0)+parseInt(m[1]);break;}}
    }
    for(const[k,reArr]of Object.entries(_ENCHANT_RE_RADAR)){
      if(_RADAR_SKIP.has(k))continue;
      for(const re of reArr){re.lastIndex=0;for(const m of text.matchAll(re)){const v=parseInt(m[1]||0);if(v>0)agg[k]=(agg[k]||0)+v;}}
    }
  };
  rawGems.forEach(g=>_addToAgg(g.gemEff));
  rawSocketBonuses.forEach(sb=>_addToAgg(sb));
  rawEnchants.forEach(e=>_addToAgg(e.eff));

  let html='';

  // 인챈트 요약 HTML (나중에 맨 아래에 추가)
  const encGroups={};
  rawEnchants.forEach(({enchantId,enchantSourceId,name,eff})=>{
    if(!encGroups[name])encGroups[name]={count:0,enchantId,enchantSourceId,name,eff};
    encGroups[name].count++;
  });
  const encGroupList=Object.entries(encGroups).sort((a,b)=>b[1].count-a[1].count);
  const sbTotals={};
  rawSocketBonuses.forEach(sb=>{
    sb.split('/').map(s=>s.trim()).filter(Boolean).forEach(part=>{
      const m=part.match(/^(.+?)\s*\+(\d+)$/);
      if(m){const key=m[1].trim();sbTotals[key]=(sbTotals[key]||0)+parseInt(m[2]);}
      else sbTotals[part]=(sbTotals[part]||0);
    });
  });
  const sbEntries=Object.entries(sbTotals);
  let _enchantHtml='<div class="stats-section-title panel-section-hd" style="backdrop-filter:none;-webkit-backdrop-filter:none;background:transparent;justify-content:space-between;">인챈트 요약<button onclick="goStatsTab(\'skill\');skSwitchMode(\'enchant\')" style="font-size:10px;color:var(--text3);background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:4px;padding:2px 7px;cursor:pointer;line-height:1.6;">인챈트 통계</button></div><div style="padding:10px 8px 10px">';
  const aggEntries=Object.entries(agg).filter(([,v])=>v>0);
  if(aggEntries.length){
    const maxVal=Math.max(...aggEntries.map(([,v])=>v));
    _enchantHtml+=`<div class="ia-bar-chart">`;
    aggEntries.forEach(([k,v])=>{
      const pct=Math.round((v/maxVal)*100);
      _enchantHtml+=`<div class="ia-bar-row">
        <div class="ia-bar-label">${GEM_STAT_LABELS[k]||k}</div>
        <div class="ia-bar-track"><div class="ia-bar-fill" style="width:${pct}%;background:linear-gradient(90deg,${_iaCol}88,${_iaCol})"></div></div>
        <div class="ia-bar-val">+${v}</div>
      </div>`;
    });
    _enchantHtml+=`</div>`;
  }
  _enchantHtml+=`<div class="ia-2col">`;
  _enchantHtml+=`<div class="ia-col"><div class="ia-section-hd">보석 <span class="ia-cnt">${totalGems}</span></div>`;
  if(groupList.length){
    _enchantHtml+=`<div class="ia-icon-grid">`;
    groupList.forEach(([,{count,itemId}],i)=>{
      _enchantHtml+=`<div class="ia-icon-wrap"><img class="ia-icon" id="gi_${i}" src="${WH_ICON}/inv_misc_questionmark.jpg"/>${count>1?`<span class="ia-cnt-badge">×${count}</span>`:''}</div>`;
    });
    _enchantHtml+=`</div>`;
  }else{_enchantHtml+=`<div class="ia-empty">없음</div>`;}
  _enchantHtml+=`</div>`;
  _enchantHtml+=`<div class="ia-col"><div class="ia-section-hd">마법부여 <span class="ia-cnt">${rawEnchants.length}</span></div>`;
  if(encGroupList.length){
    _enchantHtml+=`<div class="ia-icon-grid">`;
    encGroupList.forEach(([,{count}],i)=>{
      _enchantHtml+=`<div class="ia-icon-wrap"><img class="ia-icon" id="ei_${i}" src="${WH_ICON}/inv_misc_questionmark.jpg"/>${count>1?`<span class="ia-cnt-badge">×${count}</span>`:''}</div>`;
    });
    _enchantHtml+=`</div>`;
  }else{_enchantHtml+=`<div class="ia-empty">없음</div>`;}
  _enchantHtml+=`</div></div>`;
  _enchantHtml+=`<div class="ia-section-hd">소켓 보너스 <span class="ia-cnt">${rawSocketBonuses.length}</span></div>`;
  if(sbEntries.length){
    _enchantHtml+=`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px;">`;
    sbEntries.forEach(([key,val])=>{_enchantHtml+=`<span style="font-size:10px;color:#9a9a9a;background:rgba(150,150,150,.1);border:1px solid rgba(150,150,150,.2);border-radius:3px;padding:2px 6px;white-space:nowrap;">${key}${val?` +${val}`:''}</span>`;});
    _enchantHtml+=`</div>`;
  }else{_enchantHtml+=`<div class="ia-empty">소켓 보너스 없음</div>`;}
  _enchantHtml+=`</div>`;

  // GS 라인 차트 (아이템 요약 섹션)
  {
    const _gsRaw=window.GS_LOG_RAW?.[char.name];
    if(_gsRaw){
      const _aSpec=(SPEC_DB[char.name]?.active||[]).reduce((b,s)=>s.pts>b.pts?s:b,{pts:0,spec:''}).spec||'';
      const _allSpecs=[...new Set(Object.values(_gsRaw).flatMap(sm=>Object.keys(sm)))];
      if(_allSpecs.length){
        window._gsItemChartName=char.name;
        window._gsItemChartCol=_iaCol;
        const selSpec=_aSpec||_allSpecs[0];
        const specOptsDivs=_allSpecs.map(s=>`<div onclick="_gsSpecSel('${s}')" style="padding:5px 10px;font-size:10px;cursor:pointer;color:${s===selSpec?'var(--text)':'var(--text3)'};background:${s===selSpec?'rgba(255,255,255,.06)':'transparent'};" onmouseenter="this.style.background='rgba(255,255,255,.1)'" onmouseleave="this.style.background='${s===selSpec?'rgba(255,255,255,.06)':'transparent'}';">${s}</div>`).join('');
        html+=`<div class="stats-section-title panel-section-hd">기어스코어 변화</div>`;
        html+=`<div style="padding:10px 8px 10px;position:relative;"><div style="position:absolute;top:8px;left:8px;z-index:10;display:inline-block;"><div id="gs-spec-dd-btn" onclick="_gsSpecDDToggle()" style="background:var(--bg3);color:var(--text3);border:1px solid var(--border2);border-radius:6px;font-size:10px;padding:2px 7px;cursor:pointer;display:flex;align-items:center;gap:4px;user-select:none;font-weight:400;letter-spacing:0;text-transform:none;"><span id="gs-spec-dd-val">${selSpec}</span><span style="opacity:.45;font-size:8px;line-height:1;">▾</span></div><div id="gs-spec-dd-list" style="display:none;position:absolute;left:0;top:calc(100% + 4px);background:var(--bg2);border:1px solid var(--border2);border-radius:8px;overflow:hidden;z-index:200;min-width:100%;box-shadow:0 6px 16px rgba(0,0,0,.5);">${specOptsDivs}</div></div><div id="gs-item-chart-wrap">${_buildGsItemChartHTML(char.name,selSpec,_iaCol)}</div></div>`;
      }
    }
  }

  // BIS/ALT 아이템 요약 섹션
  {
    const _tbcaKey=_getTbcaSpecKey(char.name,char.class_name||'');
    if(_tbcaKey&&window.TBCA_P1_LOOKUP){
      const _bisItems=[];
      const _seenBisId=new Set();
      Object.entries(char.items||{}).forEach(([slotNum,item])=>{
        if(!item||!item.id||!seenItems.has(item))return;
        if(_seenBisId.has(item.id))return;
        _seenBisId.add(item.id);
        let bi=(TBCA_P1_LOOKUP[_tbcaKey]||{})[String(item.id)];
        if(!bi&&_tbcaKey==='DruidFeral')
          bi=(TBCA_P1_LOOKUP['DruidCat']||{})[String(item.id)]||(TBCA_P1_LOOKUP['DruidBear']||{})[String(item.id)];
        if(!bi)return;
        _bisItems.push({slot:parseInt(slotNum),item,bi});
      });
      if(_bisItems.length){
        const _sg={};
        _bisItems.forEach(e=>{
          const st=e.bi.source_type||'기타';
          if(!_sg[st])_sg[st]=[];
          _sg[st].push(e);
        });
        const _drop=[...(_sg['획득']||[]),   ...(_sg['Tier Token']||[])];
        delete _sg['획득'];delete _sg['Tier Token'];
        if(_drop.length)_sg['__drop__']=_drop;
        const _order=[
          {k:'__drop__',label:'드롭 / 티어 토큰',byRaid:true},
          {k:'토큰',label:'명예 토큰',byRaid:false},
          {k:'상인',label:'상인',byRaid:false},
          {k:'PvP',label:'PvP',byRaid:false},
          {k:'전문 기술',label:'전문 기술',byRaid:false},
          {k:'평판',label:'평판',byRaid:false},
          {k:'퀘스트',label:'퀘스트',byRaid:false},
          {k:'기타',label:'기타',byRaid:false},
        ];
        const _iconEl=(item,bi)=>{
          const col=bi.rank===1?'#ffd700':'#b0bcd8';
          const src=item.icon||`${WH_ICON}/inv_misc_questionmark.jpg`;
          const iid=item.id?` data-iid="${item.id}"`:'';
          return `<div style="position:relative;flex-shrink:0;" title="${item.name} (#${bi.rank})">
            <img src="${src}"${iid} style="width:28px;height:28px;border-radius:4px;border:1.5px solid ${col}44;display:block;" onerror="_cvFetchIcon(this)"/>
            <span style="position:absolute;bottom:-1px;right:-1px;font-size:7px;font-weight:800;color:${col};background:rgba(0,0,0,.75);border-radius:2px;padding:0 2px;line-height:1.5;">${bi.rank}</span>
          </div>`;
        };
        const _cardHd=(label,cnt)=>`<div style="display:flex;align-items:center;gap:5px;margin-bottom:7px;">
          <span style="font-size:10px;font-weight:700;color:var(--text1);">${label}</span>
          <span style="font-size:9px;color:var(--text3);background:rgba(255,255,255,.07);border-radius:10px;padding:1px 5px;">${cnt}</span>
        </div>`;
        html+=`<div class="stats-section-title panel-section-hd" style="backdrop-filter:none;-webkit-backdrop-filter:none;background:transparent;">P2 ALT/BIS</div>`;
        {
          const _bc=_bisItems.filter(e=>e.bi.rank===1).length;
          const _ac=_bisItems.filter(e=>e.bi.rank!==1).length;
          const _mx=Math.max(_bc,_ac,1);
          html+=`<div style="padding:8px 10px 8px;background:transparent;">
            <div style="display:flex;align-items:center;gap:7px;margin-bottom:5px;">
              <span style="font-size:9px;font-weight:800;color:#ffd700;width:22px;text-align:right;flex-shrink:0;letter-spacing:.5px;">BiS</span>
              <div style="flex:1;height:7px;background:rgba(255,255,255,.07);border-radius:4px;overflow:hidden;">
                <div style="height:100%;width:${(_bc/_mx*100).toFixed(1)}%;background:linear-gradient(90deg,#b87a20,#ffd700);border-radius:4px;"></div>
              </div>
              <span style="font-size:11px;font-weight:900;color:#ffd700;width:16px;flex-shrink:0;">${_bc}</span>
            </div>
            <div style="display:flex;align-items:center;gap:7px;">
              <span style="font-size:9px;font-weight:800;color:#b0bcd8;width:22px;text-align:right;flex-shrink:0;letter-spacing:.5px;">Alt</span>
              <div style="flex:1;height:7px;background:rgba(255,255,255,.07);border-radius:4px;overflow:hidden;">
                <div style="height:100%;width:${(_ac/_mx*100).toFixed(1)}%;background:linear-gradient(90deg,#5a6a84,#b0bcd8);border-radius:4px;"></div>
              </div>
              <span style="font-size:11px;font-weight:900;color:#b0bcd8;width:16px;flex-shrink:0;">${_ac}</span>
            </div>
          </div>`;
        }
        html+=`<div style="padding:10px 8px 10px;display:grid;grid-template-columns:1fr 1fr;gap:6px;align-items:flex-start;">`;
        // 왼쪽: 드롭 / 티어 토큰
        const _dropIts=_sg['__drop__'];
        if(_dropIts&&_dropIts.length){
          html+=`<div style="flex:1;min-width:0;border-radius:8px;overflow:hidden;">`;
          html+=`<div style="background:rgba(0,0,0,.55);padding:7px 10px 5px;border-bottom:1px solid rgba(255,255,255,.06);">`;
          html+=`<span style="font-size:10px;font-weight:700;color:var(--text1);">드롭 / 티어 토큰</span> <span style="font-size:9px;color:var(--text3);background:rgba(255,255,255,.07);border-radius:10px;padding:1px 5px;">${_dropIts.length}</span>`;
          html+=`</div>`;
          const _byLoc={};
          _dropIts.forEach(e=>{const loc=e.bi.source_location||'월드드랍';if(!_byLoc[loc])_byLoc[loc]=[];_byLoc[loc].push(e);});
          Object.entries(_byLoc).sort(([a],[b])=>a.localeCompare(b,'ko')).forEach(([loc,litems])=>{
            const _baseLoc=loc.replace(/\s*\(H\)|\s*\(영웅\)/g,'').trim();
            const _imgUrl=window.TBC_DUNGEON_SRC?.[_baseLoc]?.image_url||'';
            if(_imgUrl){
              html+=`<div style="
                background:linear-gradient(to bottom,rgba(0,0,0,.82) 0%,rgba(0,0,0,.5) 35%,rgba(0,0,0,.5) 65%,rgba(0,0,0,.82) 100%),url('${_imgUrl}') center/cover no-repeat;
                padding:7px 10px 8px;
              ">
                <div style="font-size:9px;font-weight:700;color:rgba(255,255,255,.9);letter-spacing:.3px;margin-bottom:5px;">${loc} <span style="font-weight:400;opacity:.5;">(${litems.length})</span></div>
                <div style="display:grid;grid-template-columns:repeat(4,28px);gap:4px;">`;
            }else{
              html+=`<div style="background:rgba(255,255,255,.02);padding:7px 10px 8px;">
                <div style="font-size:9px;font-weight:700;color:rgba(255,255,255,.9);letter-spacing:.3px;margin-bottom:5px;">${loc} <span style="font-weight:400;opacity:.5;">(${litems.length})</span></div>
                <div style="display:grid;grid-template-columns:repeat(4,28px);gap:4px;">`;
            }
            litems.forEach(({item,bi})=>{html+=_iconEl(item,bi);});
            html+=`</div></div>`;
          });
          html+=`</div>`;
        }
        // 오른쪽: 나머지 출처
        const _otherOrder=[
          {k:'토큰',label:'명예 토큰'},
          {k:'상인',label:'상인'},
          {k:'PvP',label:'PvP'},
          {k:'전문 기술',label:'전문 기술'},
          {k:'평판',label:'평판'},
          {k:'퀘스트',label:'퀘스트'},
          {k:'기타',label:'기타'},
        ];
        const _hasOther=_otherOrder.some(({k})=>_sg[k]?.length);
        if(_hasOther){
          html+=`<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:5px;">`;
          for(const{k,label}of _otherOrder){
            const its=_sg[k];
            if(!its||!its.length)continue;
            html+=`<div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:10px 10px;">`;
            html+=_cardHd(label,its.length);
            html+=`<div style="display:flex;flex-wrap:wrap;gap:4px;">`;
            its.forEach(({item,bi})=>{html+=_iconEl(item,bi);});
            html+=`</div></div>`;
          }
          html+=`</div>`;
        }
        html+=`</div>`;
      }
    }
  }

  html+=_enchantHtml;
  panel.innerHTML=html;

  // 보석 아이콘 + 툴팁 (소켓 정보 포함)
  groupList.forEach(([gemName,{itemId,gemEff}],i)=>{
    const gemInfo=_gemData[String(itemId)]||null;
    const sockets=gemInfo?gemInfo.sockets||[]:[];
    const img=document.getElementById(`gi_${i}`);
    if(img){
      img.addEventListener('mouseenter',e=>showIAGemTT(gemName,gemEff,sockets,e));
      img.addEventListener('mousemove',moveTT);
      img.addEventListener('mouseleave',hideTT);
      if(itemId)getItemIcon(itemId).then(ic=>{if(ic)img.src=`${WH_ICON}/${ic}.jpg`;});
    }
  });

  // 마법부여 아이콘 + 툴팁
  encGroupList.forEach(([,g],i)=>{
    const el=document.getElementById(`ei_${i}`);
    if(!el)return;
    el.addEventListener('mouseenter',e=>showIAEncTT(g.name,g.eff,e));
    el.addEventListener('mousemove',moveTT);
    el.addEventListener('mouseleave',hideTT);
    const setIcon=ic=>{if(ic)el.src=`${WH_ICON}/${ic}.jpg`;};
    if(g.enchantSourceId){
      getItemIcon(g.enchantSourceId).then(ic=>{
        if(ic)setIcon(ic);else getEnchantInfo(g.enchantId).then(info=>{if(info?.icon)setIcon(info.icon);});
      });
    }else{
      getEnchantInfo(g.enchantId).then(info=>{if(info?.icon)setIcon(info.icon);});
    }
  });

}

function _buildGsItemChartHTML(name,spec,col){
  col=col||window._gsItemChartCol||'#c98df5';
  const _gsRaw=window.GS_LOG_RAW?.[name];
  if(!_gsRaw)return '';
  const _daily=Object.entries(_gsRaw)
    .map(([date,sm])=>({date,gs:spec?sm[spec]?.gs||0:Object.values(sm)[0]?.gs||0}))
    .filter(p=>p.gs>0).sort((a,b)=>a.date.localeCompare(b.date));
  if(_daily.length<2)return '<div class="ia-empty">데이터 없음</div>';
  const _wkMap={};
  _daily.forEach(({date,gs})=>{
    const d=new Date(date+'T00:00:00');const day=d.getDay();
    const mon=new Date(d);mon.setDate(d.getDate()-(day===0?6:day-1));
    const wk=mon.toISOString().slice(0,10);
    if(!_wkMap[wk]||date>_wkMap[wk].date)_wkMap[wk]={date,gs,wk};
  });
  const _pts=Object.values(_wkMap).sort((a,b)=>a.wk.localeCompare(b.wk));
  if(_pts.length<2)return '<div class="ia-empty">데이터 없음</div>';
  const VW=400,VH=120,pL=4,pR=4,pT=14,pB=14;
  const cW=VW-pL-pR,cH=VH-pT-pB;
  const gsMin=Math.min(..._pts.map(p=>p.gs));
  const gsMax=Math.max(..._pts.map(p=>p.gs));
  const rng=Math.max(gsMax-gsMin,50);
  const n=_pts.length;
  const xOf=i=>pL+i/(n-1)*cW;
  const yOf=v=>pT+cH-(v-gsMin)/rng*cH;
  const pts2=_pts.map((p,i)=>[xOf(i),yOf(p.gs)]);
  const t=0.18;
  let line=`M${pts2[0][0].toFixed(1)},${pts2[0][1].toFixed(1)}`;
  for(let i=0;i<n-1;i++){
    const prev=i>0?pts2[i-1]:pts2[i],cur=pts2[i],next=pts2[i+1],nxt2=i<n-2?pts2[i+2]:next;
    line+=` C${(cur[0]+(next[0]-prev[0])*t).toFixed(1)},${(cur[1]+(next[1]-prev[1])*t).toFixed(1)} ${(next[0]-(nxt2[0]-cur[0])*t).toFixed(1)},${(next[1]-(nxt2[1]-cur[1])*t).toFixed(1)} ${next[0].toFixed(1)},${next[1].toFixed(1)}`;
  }
  const area=line+` L${pts2[n-1][0].toFixed(1)},${(pT+cH).toFixed(1)} L${pts2[0][0].toFixed(1)},${(pT+cH).toFixed(1)} Z`;
  const gid='iag'+name.replace(/[^a-zA-Z0-9]/g,'');
  const grids=[0,0.5,1].map(v=>{
    const y=(pT+(1-v)*cH).toFixed(1);
    return `<line x1="${pL}" y1="${y}" x2="${VW-pR}" y2="${y}" stroke="rgba(255,255,255,.05)" stroke-width="1"/>`;
  }).join('');
  const _todayIA=new Date();
  const dots=_pts.map((p,i)=>{
    const d=i===n-1?_todayIA:new Date(p.wk+'T00:00:00');
    const lbl=`${d.getMonth()+1}/${d.getDate()}`;
    const tipGs=p.gs.toLocaleString();
    const xl=(pts2[i][0]/VW*100).toFixed(2);
    const yt=(pts2[i][1]/VH*100).toFixed(2);
    const isLast=i===n-1;
    return `<div style="position:absolute;left:${xl}%;top:${yt}%;transform:translate(-50%,-50%);padding:6px;border-radius:50%;cursor:pointer;z-index:1;" onmouseenter="_gsItemTT(event,'${lbl}','${tipGs}')" onmouseleave="hideTT()"><div style="width:${isLast?7:5}px;height:${isLast?7:5}px;border-radius:50%;background:${isLast?col:'var(--bg3)'};border:1.5px solid ${col};pointer-events:none;"></div></div>`;
  }).join('');
  const specLabel=`<div style="position:absolute;bottom:4px;right:4px;display:flex;align-items:center;gap:3px;z-index:1;pointer-events:none;"><div style="width:5px;height:5px;border-radius:50%;background:${col};flex-shrink:0;"></div><span style="font-size:9px;color:var(--text3);">${spec}</span></div>`;
  return `<div style="height:120px;position:relative;margin-top:4px;">
    ${specLabel}
    <svg width="100%" height="100%" viewBox="0 0 ${VW} ${VH}" preserveAspectRatio="none" style="position:absolute;inset:0;display:block;overflow:visible;">
      <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${col}" stop-opacity=".22"/>
        <stop offset="100%" stop-color="${col}" stop-opacity="0"/>
      </linearGradient></defs>
      ${grids}
      <path d="${area}" fill="url(#${gid})"/>
      <path d="${line}" fill="none" stroke="${col}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" opacity=".9"/>
    </svg>
    ${dots}
  </div>`;
}
window._buildGsItemChartHTML=_buildGsItemChartHTML;

function _updateGsItemChart(spec){
  const wrap=document.getElementById('gs-item-chart-wrap');
  if(!wrap)return;
  wrap.innerHTML=_buildGsItemChartHTML(window._gsItemChartName,spec,window._gsItemChartCol);
}
window._updateGsItemChart=_updateGsItemChart;

function _gsSpecDDToggle(){
  const list=document.getElementById('gs-spec-dd-list');
  if(!list)return;
  list.style.display=list.style.display==='none'?'block':'none';
}
function _gsSpecSel(spec){
  const val=document.getElementById('gs-spec-dd-val');
  if(val)val.textContent=spec;
  const list=document.getElementById('gs-spec-dd-list');
  if(list)list.style.display='none';
  _updateGsItemChart(spec);
}
document.addEventListener('click',function(e){
  const btn=document.getElementById('gs-spec-dd-btn');
  const list=document.getElementById('gs-spec-dd-list');
  if(!list||list.style.display==='none')return;
  if(!btn?.contains(e.target)&&!list.contains(e.target))list.style.display='none';
});
window._gsSpecDDToggle=_gsSpecDDToggle;
window._gsSpecSel=_gsSpecSel;

function _gsItemTT(e,lbl,gs){
  const tt=document.getElementById('tooltip');
  tt.style.width='auto';
  tt.innerHTML=`<div style="font-size:10px;color:var(--text3);margin-bottom:3px;">${lbl}</div><div style="font-size:13px;font-weight:700;color:${window._gsItemChartCol||'#c98df5'};">${gs}</div>`;
  tt.classList.add('show');
  const z=parseFloat(getComputedStyle(document.documentElement).zoom)||1;
  const r=e.currentTarget.getBoundingClientRect();
  const sx=(r.left+r.width/2)/z, sy=r.top/z;
  requestAnimationFrame(()=>{
    const tw=tt.offsetWidth,th=tt.offsetHeight;
    let left=sx-tw/2, top=sy-th-4;
    if(left<4)left=4;
    if(left+tw>window.innerWidth-4)left=window.innerWidth-tw-4;
    if(top<4)top=(r.bottom/z)+4;
    tt.style.left=left+'px';
    tt.style.top=top+'px';
  });
}
window._gsItemTT=_gsItemTT;

// ── 아이콘 오류 폴백 (zamimg CDN → worker item ID 조회) ──────
function _cvFetchIcon(img) {
  const src = img.src || '';
  const nameMatch = src.match(/\/([^\/]+)\.jpg(?:\?.*)?$/i);
  if (nameMatch) {
    const iconName = nameMatch[1];
    const zamSrc = `${WH_ICON}/${iconName}.jpg`;
    if (src !== zamSrc) {
      img.onerror = () => _cvFetchIconById(img);
      img.src = zamSrc;
      return;
    }
  }
  _cvFetchIconById(img);
}

async function _cvFetchIconById(img) {
  const id = img.dataset.iid;
  if (!id || !window.PROXY_HOST) { img.style.display = 'none'; return; }
  img.onerror = null;
  try {
    const r = await fetch(`${window.PROXY_HOST}/wowhead-xml/tbc/${id}`, { signal: AbortSignal.timeout(5000) });
    if (!r.ok) { img.style.display = 'none'; return; }
    const text = await r.text();
    const doc = new DOMParser().parseFromString(text, 'application/xml');
    const iconName = doc.querySelector('item > icon')?.textContent;
    if (iconName) {
      img.onerror = () => { img.style.display = 'none'; };
      img.src = `${WH_ICON}/${iconName}.jpg`;
    } else {
      img.style.display = 'none';
    }
  } catch(e) { img.style.display = 'none'; }
}

// ── 툴팁 ────────────────────────────────────────────────────
