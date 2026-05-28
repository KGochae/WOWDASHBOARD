// ── 레이드 ──────────────────────────────────────────────────
const RAID_LABELS={R:'라그나로스',O:'',H:''};
const RAID_SUB={R:'화염의 땅 · 40인 레이드',O:'',H:''};
const BAR_COLORS={dps:'#e8603c',dtps:'#5b8cde',hps:'#4caf7d'};
let _raidData={};  // 현재 열린 레이드 데이터 캐시

function fmtAmount(n){
  if(n>=1e6) return (n/1e6).toFixed(2)+'M';
  if(n>=1e3) return (n/1e3).toFixed(1)+'K';
  return String(n);
}
function parseAmount(raw){ return parseInt((raw||'').split('$')[0])||0; }

// color_tone 팔레트 기반: 투명하게 적용
// #3F7CAC Steel blue / #95AFBA Cadet gray / #BDC4A7 Sage / #D5E1A3 Tea green / #E2F89C Mindaro
const BAR_GRADIENTS={
  dps: ['rgba(63,124,172,.55)','rgba(149,175,186,.3)'],   // Steel blue → Cadet gray
  dtps:['rgba(189,196,167,.55)','rgba(213,225,163,.3)'],  // Sage → Tea green
  hps: ['rgba(213,225,163,.55)','rgba(226,248,156,.3)'],  // Tea green → Mindaro
};
let _activeTab='dps';

function renderBars(rows,type){
  const el=document.getElementById('raid-bar-main');
  if(!rows||!rows.length){el.innerHTML='<div style="color:rgba(255,255,255,.3);font-size:12px;padding:16px">데이터 없음</div>';return;}
  const max=Math.max(...rows.map(r=>r.val));
  const soopMap=window._soopMap||{};

  el.innerHTML=rows.map((r,i)=>{
    const pct=max>0?Math.round(r.val/max*100):0;
    const overhealNum=(r.overheal!=null&&r.overheal!=='-')?parseFloat(r.overheal):null;
    const effectiveW=overhealNum!=null?Math.round(pct*(1-overhealNum/100)):pct;
    const overhealW=overhealNum!=null?(pct-effectiveW):0;

    // 클래스별 파스텔 그라데이션
    const cls=(GUILD_DB[r.name]||{}).class_name||'';
    const cid=CLASS_NAME_TO_ID[cls];
    const hex=CLASS_COLOR[cid]||'#7a8a99';
    const {r:pr,g:pg,b:pb}=_toPastel(hex);
    const barGrad=`linear-gradient(to right,rgba(${pr},${pg},${pb},.68),rgba(${pr},${pg},${pb},.22))`;

    const s=soopMap[r.name]||{};
    const avatarHtml=s.profile_img
      ?`<img src="${s.profile_img}" alt="${r.name}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;object-position:center top;flex-shrink:0;border:1.5px solid rgba(255,255,255,.2)">`
      :`<div style="width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.08);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:rgba(255,255,255,.3);border:1.5px solid rgba(255,255,255,.1)">${r.name.charAt(0)}</div>`;

    const tooltip=r.overheal!=null?`
      <div class="raid-tooltip">
        <div class="raid-tooltip-row"><span class="raid-tooltip-label">Overheal</span><span class="raid-tooltip-val">${overhealNum!=null?r.overheal:'없음'}</span></div>
        <div class="raid-tooltip-row"><span class="raid-tooltip-label">HPS</span><span class="raid-tooltip-val">${r.hps}</span></div>
      </div>`:'';

    return `<div class="raid-bar-row">
      <div class="raid-bar-bg" style="width:${effectiveW}%;background:${barGrad}"></div>
      ${overhealW>0?`<div class="raid-bar-bg-oh" style="left:${effectiveW}%;width:${overhealW}%"></div>`:''}
      <div class="raid-bar-inner">
        ${avatarHtml}
        <span class="raid-bar-name">${r.name}</span>
        <span class="raid-bar-val">${fmtAmount(r.val)}</span>
      </div>
      ${tooltip}
    </div>`;
  }).join('');
}

function raidSetTab(btn,type){
  document.querySelectorAll('.rd-ftab').forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
  _activeTab=type;
  renderBars(_raidData[type]||[], type);
}

// ── KPI 카드 공통 유틸 ───────────────────────────────────────
function _hexRgba(hex,a){
  const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  return {r,g,b,rgba:`rgba(${r},${g},${b},${a})`};
}
function _toPastel(hex){
  const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  const t=0.62;
  return {r:Math.round(r+(255-r)*t),g:Math.round(g+(255-g)*t),b:Math.round(b+(255-b)*t)};
}
function _fmtBig(v){
  if(v>=1e9) return (v/1e9).toFixed(2)+'B';
  if(v>=1e6) return (v/1e6).toFixed(1)+'M';
  if(v>=1e3) return (v/1e3).toFixed(0)+'K';
  return v.toFixed(0);
}

function _fmtClearTime(t){
  if(!t||t==='—') return '—';
  const m=t.match(/^(\d+):(\d+)/);
  if(!m) return t;
  const totalSec=parseInt(m[1])*60+parseInt(m[2]);
  const h=Math.floor(totalSec/3600);
  const min=Math.floor((totalSec%3600)/60);
  const sec=totalSec%60;
  const parts=[];
  if(h>0) parts.push(`${h}시`);
  parts.push(`${min}분`);
  parts.push(`${sec}초`);
  return parts.join(' ');
}

function _kpiDetail(rows){
  // class breakdown
  const clsMap={};
  const total=rows.reduce((s,r)=>s+r.val,0)||1;
  rows.forEach(r=>{
    const cls=(GUILD_DB[r.name]||{}).class_name||'기타';
    const cid=CLASS_NAME_TO_ID[cls];
    const hex=CLASS_COLOR[cid]||'#888';
    if(!clsMap[cls]) clsMap[cls]={cls,hex,val:0};
    clsMap[cls].val+=r.val;
  });
  const clsList=Object.values(clsMap).sort((a,b)=>b.val-a.val).slice(0,5);
  // stacked bar segments — pastel class colors (matches ranking bar tone)
  const stackedSegs=clsList.map(c=>{
    const pct=(c.val/total*100).toFixed(1);
    const pctInt=Math.round(parseFloat(pct));
    const {r:pr,g:pg,b:pb}=_toPastel(c.hex);
    return `<div class="rd-kpi-cls-stacked-seg" style="width:${pct}%;background:rgba(${pr},${pg},${pb},.75);">
      <div class="rd-kpi-cls-seg-tooltip">
        <div class="rd-kpi-cls-seg-tooltip-row"><span class="rd-kpi-cls-seg-tooltip-label">Class</span><span class="rd-kpi-cls-seg-tooltip-val">${c.cls}</span></div>
        <div class="rd-kpi-cls-seg-tooltip-row"><span class="rd-kpi-cls-seg-tooltip-label">비중</span><span class="rd-kpi-cls-seg-tooltip-val">${pctInt}%</span></div>
      </div>
    </div>`;
  }).join('');
  const classBars=`<div class="rd-kpi-cls-stacked-bar">${stackedSegs}</div>`;
  return `<div class="rd-kpi-stat-detail">
    <div class="rd-kpi-stat-section">
      ${classBars}
    </div>
  </div>`;
}

function renderKpi(data){
  const el=document.getElementById('rd-kpi-grid');
  if(!el) return;

  const totalDmg    = (data.dps||[]).reduce((s,r)=>s+r.val,0);
  const totalDtps   = (data.dtps||[]).reduce((s,r)=>s+r.val,0);
  const totalHps    = (data.hps||[]).reduce((s,r)=>s+r.val,0);
  const totalDispel = (data.dispels||[]).reduce((s,r)=>s+r.val,0);
  const totalDeath  = (data.deaths||[]).reduce((s,r)=>s+r.val,0);
  const clearTime   = _fmtClearTime(data.clearTime||'');

  // legend — 헤더에 딱 한 번만 렌더링 (dps 기준)
  const legendEl=document.getElementById('rd-kpi-legend');
  if(legendEl){
    const srcRows=data.dps||[];
    const total=srcRows.reduce((s,r)=>s+r.val,0)||1;
    const clsMap={};
    srcRows.forEach(r=>{
      const cls=(GUILD_DB[r.name]||{}).class_name||'기타';
      const cid=CLASS_NAME_TO_ID[cls];
      const hex=CLASS_COLOR[cid]||'#888';
      if(!clsMap[cls]) clsMap[cls]={cls,hex,val:0};
      clsMap[cls].val+=r.val;
    });
    const clsList=Object.values(clsMap).sort((a,b)=>b.val-a.val).slice(0,5);
    legendEl.innerHTML=clsList.map(c=>{
      const {r:pr,g:pg,b:pb}=_toPastel(c.hex);
      return `<span class="rd-kpi-cls-legend-item">
        <span class="rd-kpi-cls-dot" style="background:rgba(${pr},${pg},${pb},1);"></span>
        <span class="rd-kpi-cls-name">${c.cls}</span>
      </span>`;
    }).join('');
  }

  const mkCard=(label,valHtml,rows)=>`
    <div class="rd-kpi-stat-card">
      <div class="rd-kpi-stat-top">
        <div class="rd-kpi-label">${label}</div>
        <div class="rd-kpi-stat-val">${valHtml}</div>
      </div>
      ${rows&&rows.length?_kpiDetail(rows):''}
    </div>`;

  el.innerHTML=`<div class="rd-kpi-stat-grid">
    ${mkCard('총 데미지', _fmtBig(totalDmg), data.dps)}
    ${mkCard('총 받은피해', _fmtBig(totalDtps), data.dtps)}
    ${mkCard('총 치유량', _fmtBig(totalHps), data.hps)}
    ${mkCard('총 저주해제', totalDispel>0?totalDispel.toLocaleString():'—', data.dispels)}
    ${mkCard('총 사망', totalDeath>0?totalDeath.toString():'—', data.deaths)}
  </div>`;
}

function renderDpsLog(csvText){
  const svg=document.getElementById('rd-dps-svg');
  if(!svg||!csvText) return;

  const rows=csvText.trim().split('\n').slice(1)
    .map(l=>{const c=l.split(',');return{t:c[1]||'',v:parseFloat(c[2])||0};})
    .filter(r=>r.t);
  if(rows.length<2) return;

  const maxV=Math.max(...rows.map(r=>r.v));
  if(!maxV) return;

  const VW=1000, VH=148, padT=10, padB=6, labelH=18;
  const h=VH-padT-padB-labelH;  // 차트 높이

  const coords=rows.map((r,i)=>[
    (i/(rows.length-1))*VW,
    padT+(1-r.v/maxV)*h
  ]);

  /* 카디널 스플라인 → 부드러운 베지어 */
  function makePath(cs){
    let d=`M${cs[0][0].toFixed(1)},${cs[0][1].toFixed(1)}`;
    for(let i=0;i<cs.length-1;i++){
      const prev=i>0?cs[i-1]:cs[i];
      const cur=cs[i], next=cs[i+1];
      const next2=i<cs.length-2?cs[i+2]:next;
      const t=0.18;
      const cp1x=cur[0]+(next[0]-prev[0])*t;
      const cp1y=cur[1]+(next[1]-prev[1])*t;
      const cp2x=next[0]-(next2[0]-cur[0])*t;
      const cp2y=next[1]-(next2[1]-cur[1])*t;
      d+=` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${next[0].toFixed(1)},${next[1].toFixed(1)}`;
    }
    return d;
  }

  const linePath=makePath(coords);
  const chartBottom=padT+h;
  const areaPath=linePath+` L${VW},${chartBottom} L0,${chartBottom} Z`;

  /* 수직 그리드 + x축 label — 8구간 (0 포함 9개 tick) */
  const tickCount=8;
  const grids=Array.from({length:tickCount+1},(_,i)=>{
    const ratio=i/tickCount;
    const x=(ratio*VW).toFixed(1);
    const dataIdx=Math.round(ratio*(rows.length-1));
    const label=rows[dataIdx]?.t||'';
    const anchor=i===0?'start':i===tickCount?'end':'middle';
    return `
      <line x1="${x}" y1="${padT}" x2="${x}" y2="${chartBottom}" stroke="rgba(255,255,255,0.07)" stroke-width="1"/>
      <text x="${x}" y="${chartBottom+13}" text-anchor="${anchor}"
        font-size="8.5" fill="rgba(255,255,255,0.3)" font-family="Pretendard,sans-serif">${label}</text>`;
  }).join('');

  /* 클리어 시간 = 마지막 timestamp */
  const clearEl=document.getElementById('rd-clear-time');
  if(clearEl){
    const lastT=rows[rows.length-1]?.t||'';
    clearEl.innerHTML=lastT?`CLEAR TIME <strong>${lastT}</strong>`:'';
  }

  svg.innerHTML=`
    <defs>
      <linearGradient id="dpsg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(201,162,39,0.5)"/>
        <stop offset="70%" stop-color="rgba(201,162,39,0.1)"/>
        <stop offset="100%" stop-color="rgba(201,162,39,0)"/>
      </linearGradient>
    </defs>
    ${grids}
    <path d="${areaPath}" fill="url(#dpsg)" stroke="none"/>
    <path d="${linePath}" fill="none" stroke="rgba(201,162,39,0.88)" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>
  `;
}

function renderDispel(dispels){
  if(!dispels||!dispels.length) return;
  // 평균 해제율
  const validPcts=dispels.filter(d=>d.dispelled_pct!=null).map(d=>d.dispelled_pct);
  const avgPct=validPcts.length?Math.round(validPcts.reduce((a,b)=>a+b,0)/validPcts.length):0;
  document.getElementById('rd-dispel-avg').innerHTML=
    `평균 해제율 <strong>${avgPct}%</strong> <span style="font-size:11px;color:rgba(255,255,255,.35)">(${dispels.length}개 디버프)</span>`;

  // 전체 dispellers 합산
  const dispellerMap={};
  dispels.forEach(d=>{
    (d.dispellers||[]).forEach(p=>{
      dispellerMap[p.name]=(dispellerMap[p.name]||0)+p.count;
    });
  });
  const sorted=Object.entries(dispellerMap).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const maxCnt=sorted[0]?.[1]||1;
  document.getElementById('rd-dispel-list').innerHTML=sorted.map(([name,cnt])=>`
    <div class="rd-dispel-row">
      <span class="rd-dispel-name">${name}</span>
      <div class="rd-dispel-track"><div class="rd-dispel-fill" style="width:${Math.round(cnt/maxCnt*100)}%"></div></div>
      <span class="rd-dispel-cnt">${cnt}</span>
    </div>`).join('');
}

async function openRaid(cell){
  const name=cell.dataset.name;
  const csv=cell.dataset.csv;
  if(!name||!csv) return;

  const detail=document.getElementById('raid-detail');
  detail.style.backgroundImage=cell.style.backgroundImage;
  detail.style.backgroundPosition=cell.style.backgroundPosition||'center';
  document.getElementById('rd-title').textContent=RAID_LABELS[name]||name;
  document.getElementById('rd-subtitle').textContent=RAID_SUB[name]||'';
  detail.classList.add('open');

  // 기본 탭 active 초기화
  document.querySelectorAll('.rd-ftab').forEach((t,i)=>t.classList.toggle('active',i===0));

  // soop.json 항상 최신으로 재로드 (캐시 우회)
  try{const r=await fetch(`/data/soop.json?v=${Date.now()}`);if(r.ok){const arr=await r.json();window._soopMap={};arr.forEach(s=>window._soopMap[s.character_name]=s);}else{console.warn('[soop] fetch 실패',r.status);}}catch(e){console.error('[soop] 로드 오류',e);}

  const [dpsCsv,dtpsCsv,hpsCsv,dispelCsv,dpsTimeCsv,deathCsv]=await Promise.all([
    fetch(`data/raid/${csv}_입힌피해.csv`).then(r=>r.text()),
    fetch(`data/raid/${csv}_받은피해.csv`).then(r=>r.text()),
    fetch(`data/raid/${csv}_치유.csv`).then(r=>r.text()),
    fetch(`data/raid/${csv}_dispels_clean.csv`).then(r=>r.text()).catch(()=>''),
    fetch(`data/raid/${csv}_DPS_time.csv`).then(r=>r.text()).catch(()=>''),
    fetch(`data/raid/${csv}_death.csv`).then(r=>r.text()).catch(()=>''),
  ]);

  function parseCsv(text,nameCol,amtCol){
    return text.trim().split('\n').slice(1)
      .map(line=>{const c=line.split(',');return{name:(c[nameCol]||'').trim(),val:parseAmount(c[amtCol]||'')};})
      .filter(r=>r.name&&r.val>0).sort((a,b)=>b.val-a.val);
  }
  function parseCsvByFloat(text,nameCol,valCol){
    return text.trim().split('\n').slice(1)
      .map(line=>{const c=line.split(',');return{name:(c[nameCol]||'').trim(),val:parseFloat(c[valCol]||'0')||0};})
      .filter(r=>r.name&&r.val>0).sort((a,b)=>b.val-a.val);
  }
  function parseHealCsv(text){
    return text.trim().split('\n').slice(1)
      .map(line=>{const c=line.split(',');return{name:(c[1]||'').trim(),val:parseAmount(c[2]||''),overheal:(c[3]||'').trim(),hps:(c[5]||'').trim()};})
      .filter(r=>r.name&&r.val>0).sort((a,b)=>b.val-a.val);
  }
  function parseDispelCsv(text){
    const map={};
    text.trim().split('\n').slice(1).forEach(line=>{
      const c=line.split(',');
      const name=(c[5]||'').trim();
      const cnt=parseInt(c[6]||'0')||0;
      if(name&&cnt>0) map[name]=(map[name]||0)+cnt;
    });
    return Object.entries(map).map(([name,val])=>({name,val})).sort((a,b)=>b.val-a.val);
  }
  function parseDeathCsv(text){
    const map={};
    text.trim().split('\n').slice(1).forEach(line=>{
      const c=line.split(',');
      const name=(c[4]||'').replace(/^\uFEFF/,'').trim();
      if(name) map[name]=(map[name]||0)+1;
    });
    return Object.entries(map).map(([name,val])=>({name,val})).sort((a,b)=>b.val-a.val);
  }

  const dpsTimeRows=dpsTimeCsv?dpsTimeCsv.trim().split('\n').slice(1).map(l=>l.split(',')[1]||'').filter(Boolean):[];
  _raidData={
    dps:      parseCsv(dpsCsv,1,2),
    dpsByDps: parseCsvByFloat(dpsCsv,1,4),
    dtps:     parseCsv(dtpsCsv,0,1),
    dtpsByDtps: parseCsvByFloat(dtpsCsv,0,4),
    hps:      parseHealCsv(hpsCsv),
    hpsByHps: parseCsvByFloat(hpsCsv,1,5),
    dispels:  parseDispelCsv(dispelCsv),
    deaths:   parseDeathCsv(deathCsv),
    clearTime: dpsTimeRows.length ? dpsTimeRows[dpsTimeRows.length-1] : '',
  };

  renderKpi(_raidData);
  renderDpsLog(dpsTimeCsv);
  _activeTab='dps';
  renderBars(_raidData.dps, 'dps');
}

function closeRaid(){
  document.getElementById('raid-detail').classList.remove('open');
  _raidData={};
}

