const ITEM_ICON_CACHE={};
const ITEM_ICON_PENDING={};
const ENCHANT_INFO_CACHE={};
const ENCHANT_INFO_PENDING={};
async function getEnchantInfo(spellId){
  if(ENCHANT_INFO_CACHE[spellId])return ENCHANT_INFO_CACHE[spellId];
  if(ENCHANT_INFO_PENDING[spellId])return ENCHANT_INFO_PENDING[spellId];
  ENCHANT_INFO_PENDING[spellId]=(async()=>{
    // locale=4 (ko_KR) 우선, 실패 시 locale=0 (en)
    const TRIES=[{env:4,locale:4},{env:4,locale:0},{env:1,locale:0}];
    for(const {env,locale} of TRIES){
      try{
        const r=await fetch(`https://nether.wowhead.com/tooltip/spell/${spellId}?dataEnv=${env}&locale=${locale}`,{signal:AbortSignal.timeout(4000)});
        if(r.ok){
          const j=await r.json();
          const ic=(j.icon||'').toLowerCase();
          const nm=j.name||'';
          if(ic||nm){
            const info={icon:ic||null,name:nm||null};
            ENCHANT_INFO_CACHE[spellId]=info;
            delete ENCHANT_INFO_PENDING[spellId];
            return info;
          }
        }
      }catch(e){}
    }
    delete ENCHANT_INFO_PENDING[spellId];
    return null;
  })();
  return ENCHANT_INFO_PENDING[spellId];
}
async function getItemIcon(itemId){
  if(ITEM_ICON_CACHE[itemId])return ITEM_ICON_CACHE[itemId];
  if(ITEM_ICON_PENDING[itemId])return ITEM_ICON_PENDING[itemId];
  ITEM_ICON_PENDING[itemId]=(async()=>{
    const ENVS=[4,1,11,''];
    for(const env of ENVS){
      try{
        const url=env===''
          ?`https://nether.wowhead.com/tooltip/item/${itemId}`
          :`https://nether.wowhead.com/tooltip/item/${itemId}?dataEnv=${env}&locale=0`;
        const r=await fetch(url,{signal:AbortSignal.timeout(4000)});
        if(r.ok){
          const j=await r.json();
          const ic=(j.icon||'').toLowerCase();
          if(ic){ITEM_ICON_CACHE[itemId]=ic;delete ITEM_ICON_PENDING[itemId];return ic;}
        }
      }catch(e){}
    }
    delete ITEM_ICON_PENDING[itemId];
    return null;
  })();
  return ITEM_ICON_PENDING[itemId];
}

async function getSpellIcon(spellId){
  if(SPELL_ICON_CACHE[spellId])return SPELL_ICON_CACHE[spellId];
  if(SPELL_ICON_PENDING[spellId])return SPELL_ICON_PENDING[spellId];

  SPELL_ICON_PENDING[spellId]=(async()=>{
    // 1. 로컬 캐시 JSON (/data/spell_icons.json 있으면 즉시 사용)
    try{
      if(!window._spellIconsLoaded){
        window._spellIconsLoaded=true;
        const r=await fetch('/data/spell_icons.json');
        if(r.ok)Object.assign(SPELL_ICON_CACHE,await r.json());
      }
      if(SPELL_ICON_CACHE[spellId])return SPELL_ICON_CACHE[spellId];
    }catch(e){}
    // 2. nether.wowhead.com tooltip API (CORS 허용)
    // dataEnv 폴백: 4(TBC Classic) → 1(Vanilla) → 11(Classic Era) → 파라미터없음
    // TBC 2.0 패치 스펠(31xxx대)은 dataEnv=4에서 icon=null일 수 있음
    const ENVS=[4,1,11,''];
    for(const env of ENVS){
      try{
        const url=env===''
          ?`https://nether.wowhead.com/tooltip/spell/${spellId}`
          :`https://nether.wowhead.com/tooltip/spell/${spellId}?dataEnv=${env}&locale=0`;
        const r=await fetch(url,{signal:AbortSignal.timeout(4000)});
        if(r.ok){
          const j=await r.json();
          const ic=(j.icon||'').toLowerCase();
          if(ic){
            SPELL_ICON_CACHE[spellId]=ic;
            delete SPELL_ICON_PENDING[spellId];
            return ic;
          }
        }
      }catch(e){}
    }
    delete SPELL_ICON_PENDING[spellId];
    return null;
  })();
  return SPELL_ICON_PENDING[spellId];
}

// ── viewer.min.js race-condition 에러 억제 ──────────────────
// rAF 패치: 드로우 루프 내부 에러를 직접 차단 (window.onerror 만으로는 rAF 에러 불가)
(function(){
  const _raf=window.requestAnimationFrame;
  window.requestAnimationFrame=function(cb){
    return _raf.call(window,function(ts){
      try{cb(ts);}catch(e){
        if(((e&&e.stack)||'').indexOf('viewer.min.js')===-1)throw e;
      }
    });
  };
  const _prev=window.onerror;
  window.onerror=function(msg,src,line,col,err){
    if(src&&src.indexOf('viewer.min.js')!==-1)return true;
    return _prev?_prev.call(this,msg,src,line,col,err):false;
  };
  window.addEventListener('unhandledrejection',function(e){
    if(((e.reason&&e.reason.stack)||'').indexOf('viewer.min.js')!==-1)e.preventDefault();
  });
})();

// ── XHR 인터셉터 ────────────────────────────────────────────
window._mo3Map={};
const _o=XMLHttpRequest.prototype.open,_s=XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.open=function(m,u,...r){this._u=u;return _o.call(this,m,u,...r);};
XMLHttpRequest.prototype.send=function(...a){
  this.addEventListener('load',function(){
    const u=this._u||'';const _ph=window.PROXY_HOST||'';if(!_ph||!u.startsWith(_ph))return;
    const sh=u.replace(_ph+'/modelviewer/tbc/','').replace(_ph+'/modelviewer/live/','');
    // 구버전 .mo3 포맷 감시
    if(u.includes('.mo3')){
      const fdid=u.match(/mo3\/(\d+)\.mo3/)?.[1]||'';
      const isChar=Object.values(FDID_MAP).some(f=>String(f.fdid)===fdid);
      const info=window._mo3Map[fdid];
      if(this.status===200){
        if(isChar){const lbl=Object.entries(FDID_MAP).find(([,f])=>String(f.fdid)===fdid)?.[1]?.label||fdid;addLog(`  ✅ 캐릭터 [${lbl}]`,'ok');}
        else if(info)addLog(`  ✅ ${SLOT_META[info.slot]||info.slot} — ${info.name}`,'ok');
        else addLog(`  ✅ mo3/${fdid}`,'ok');
      }else if(this.status===404){
        if(isChar){const lbl=Object.entries(FDID_MAP).find(([,f])=>String(f.fdid)===fdid)?.[1]?.label||fdid;addLog(`  ❌ 캐릭터 없음 [${lbl}]`,'err');}
        else if(info)addLog(`  ❌ ${SLOT_META[info.slot]||info.slot} — ${info.name}`,'err');
        else addLog(`  ❌ mo3/${fdid}`,'err');
      }
    // 신버전 .m2 포맷 감시
    }else if(u.includes('/m2/')){
      const fdid=u.match(/m2\/(\d+)\.m2/)?.[1]||'';
      const isChar=Object.values(FDID_MAP).some(f=>String(f.fdid)===fdid);
      const info=window._mo3Map[fdid];
      if(this.status===200){
        if(isChar){const lbl=Object.entries(FDID_MAP).find(([,f])=>String(f.fdid)===fdid)?.[1]?.label||fdid;addLog(`  ✅ 캐릭터 [${lbl}]`,'ok');}
        else if(info)addLog(`  ✅ ${SLOT_META[info.slot]||info.slot} — ${info.name}`,'ok');
        else addLog(`  ✅ m2/${fdid}`,'ok');
      }else if(this.status===404){
        if(isChar){const lbl=Object.entries(FDID_MAP).find(([,f])=>String(f.fdid)===fdid)?.[1]?.label||fdid;addLog(`  ❌ 캐릭터 없음 [${lbl}]`,'err');}
        else if(info)addLog(`  ❌ ${SLOT_META[info.slot]||info.slot} — ${info.name}`,'err');
        else addLog(`  ❌ m2/${fdid}`,'err');
      }
    }else if(this.status===404&&u.includes('meta/'))addLog(`  ❌ ${sh}`,'err');
  });
  return _s.call(this,...a);
};

// ── 로그 ────────────────────────────────────────────────────
// URL에 ?debug 있을 때만 로그 활성화
window._DEBUG=new URLSearchParams(location.search).has('debug');
function addLog(msg,type='info'){
  if(!window._DEBUG) return;
  const box=document.getElementById('logBox');
  box.style.display='block';
  if(box.textContent==='대기 중...')box.innerHTML='';
  const s=document.createElement('span');s.className=`l-${type}`;s.textContent=msg+'\n';
  box.appendChild(s);box.scrollTop=box.scrollHeight;
}

// ── 뷰어 탭 전환 ─────────────────────────────────────────────
function switchVTab(tab){
  const isViewer=tab==='viewer';
  const isStats=tab==='stats';
  const isNotices=tab==='notices';
  const isRaid=tab==='raid';
  const isItems=tab==='items';
  const isCompare=tab==='compare';
  const isRaidBuilder=tab==='raidbuilder';
  const isRecap=tab==='recap';
  document.getElementById('viewer-column').style.display=isViewer?'flex':'none';
  document.getElementById('compare-main-area').style.display=isCompare?'flex':'none';
  document.getElementById('stats-main-area').style.display=isStats?'flex':'none';
  document.getElementById('notices-main-area').style.display=isNotices?'flex':'none';
  document.getElementById('raid-main-area').style.display=isRaid?'block':'none';
  document.getElementById('item-setup-main-area').style.display=isItems?'flex':'none';
  document.getElementById('raid-builder-main-area').style.display=isRaidBuilder?'flex':'none';
  const _recapMain=document.getElementById('recap-main-area');
  if(_recapMain) _recapMain.style.display=isRecap?'block':'none';
  const _recapClose=document.getElementById('recap-close-btn');
  if(_recapClose) _recapClose.style.display=isRecap?'block':'none';
  // 사이드바 숨김
  const sidebar=document.querySelector('.sidebar');
  if(sidebar) sidebar.style.display=(isRaid||isStats||isItems||isRaidBuilder||isRecap)?'none':'';
  document.querySelector('.main-layout')?.classList.toggle('stats-mode',isStats);
  document.querySelector('.main-layout')?.classList.toggle('raid-mode',isRaidBuilder);
  document.querySelector('.main-layout')?.classList.toggle('items-mode',isItems);
  document.querySelectorAll('.v-tab').forEach(t=>t.classList.toggle('active',t.id===`vtab-${tab}`));
  if(isViewer) setTimeout(syncEqStatCardToSummary, 400);
  if(isStats){ renderStatsPage(); applyStatsZoom(); }
  if(isNotices) renderNoticesPage();
  if(isRaid) openRaid({dataset:{name:'R',csv:'MoltenCore'},style:{backgroundImage:"url('background/R.webp')",backgroundPosition:'20% center'}});
  if(isItems) openItemSetup();
  if(isRaidBuilder) initRaidBuilder();
  document.getElementById('page-viewer')?.classList.toggle('recap-mode', isRecap);
  if(isRecap) openRecapPage();
  const _vHash={items:'아이템검색',notices:'공지사항',viewer:'캐릭터뷰어',raid:'레이드',raidbuilder:'레이드구성'};
  if(_vHash[tab]) _pushHash(_vHash[tab]);
}


document.addEventListener('keydown',function(e){
  if((e.key==='Enter'||e.key===' ')&&e.target.getAttribute('role')==='button'&&e.target.tagName!=='BUTTON'){
    e.preventDefault();
    e.target.click();
  }
});

