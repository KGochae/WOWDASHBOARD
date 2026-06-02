// ── TBCA BIS P1 Lookup (loadData 완료 후 defer 빌드) ─────────
// {tbcaSpecKey: {item_id: {tier,rank,source_type,source_ko,source_location}}}
window.TBCA_P1_LOOKUP={};

// ── 장비 슬롯 매핑 (slot_type → 슬롯 번호) ───────────────────
const _EQ_SLOT_MAP={
  HEAD:1,NECK:2,SHOULDER:3,SHIRT:4,CHEST:5,
  WAIST:6,LEGS:7,FEET:8,WRIST:9,HANDS:10,
  FINGER_1:11,FINGER_2:12,TRINKET_1:13,TRINKET_2:14,
  BACK:16,MAIN_HAND:21,OFF_HAND:22,RANGED:18,TABARD:19,
};
// stat_str 한글 스탯명 → 영문 키
const _EQ_STAT_KR={'힘':'strength','민첩성':'agility','체력':'stamina','지능':'intellect','정신력':'spirit'};

// ── equipment 배열 → items 객체 변환 (data.js 내 두 곳의 인라인 로직과 동일) ─
function _buildItemsObjFromEquipment(equipment){
  const itemsObj={};
  if(!equipment||!equipment.length)return itemsObj;
  for(const it of equipment){
    const itype=it.inventory_type_kr||'';
    const s=(_EQ_SLOT_MAP[it.slot_type]||(itype==='겉옷'?5:0));
    if(!s)continue;
    const item_id=it.item_id;
    const era=(typeof ITEMS_ERA!=='undefined'&&ITEMS_ERA[String(item_id)])||{};
    const display_id=parseInt(era.displayId||it.display_id||0)||0;
    const stats={};let armor=0;
    for(const seg of(it.stat_str||'').split('|')){
      const t=seg.trim();
      const ms=t.match(/^([가-힣]+)\s*\+(\d+)$/);
      if(ms){const k=_EQ_STAT_KR[ms[1]];if(k)stats[k]=parseInt(ms[2]);}
      const am=t.match(/방어도\s*(\d+)/);if(am)armor=parseInt(am[1]);
      const mheal=t.match(/^주문\s*치유량\s*\+(\d+)$/);if(mheal)stats.healing_power=parseInt(mheal[1]);
      const msdmg=t.match(/^주문\s*공격력\s*\+(\d+)$/);if(msdmg)stats.spell_dmg=parseInt(msdmg[1]);
      const mheff=t.match(/^치유\s*효과\s*증가\s*\+(\d+)$/);if(mheff)stats.healing_power=(stats.healing_power||0)+parseInt(mheff[1]);
      const mcrit=t.match(/^치명타\s*적중도\s*\+(\d+)$/);if(mcrit)stats.crit_rating=(stats.crit_rating||0)+parseInt(mcrit[1]);
      const mscrit=t.match(/^주문\s*극대화\s*적중도\s*\+(\d+)$/);if(mscrit)stats.spell_crit_rating=(stats.spell_crit_rating||0)+parseInt(mscrit[1]);
      const mshi=t.match(/^주문\s*적중도\s*\+(\d+)$/);if(mshi)stats.spell_hit_rating=(stats.spell_hit_rating||0)+parseInt(mshi[1]);
      const mrsil=t.match(/^탄력도\s*\+(\d+)$/);if(mrsil)stats.resilience_rating=(stats.resilience_rating||0)+parseInt(mrsil[1]);
    }
    const sp=it.equip_bonus_str||'';
    itemsObj[s]={name:it.item_name||'',q:it.quality||'COMMON',qkr:it.quality_kr||'',
      did:display_id,id:item_id,
      icon:(era.icon&&typeof BASE_ICON!=='undefined')?`${BASE_ICON}/${era.icon}.jpg`:(it.icon_url||''),
      sub:it.item_subclass||'',armor,bind:it.binding||'',
      req:it.req_level||null,ilvl:parseInt(era.itemLevel)||parseInt(it.item_level)||0,
      dur:it.dur_cur?[parseInt(it.dur_cur),parseInt(it.dur_max)]:null,
      stats,enchant:it.enchant_str||null,
      enchantId:it.enchant_id||null,
      enchantSource:it.enchant_source||null,
      enchantSourceId:it.enchant_source_id||null,
      gems:(it.gem_ids||[]).length,
      gemIds:it.gem_ids||[],
      gemNames:it.gems?it.gems.split(' / ').filter(Boolean):[],
      gemEffects:it.gem_effects?it.gem_effects.split(' | ').flatMap(g=>g.split(' / ')).filter(Boolean):[],
      gemEffectsRaw:it.gem_effects?it.gem_effects.split(' | ').filter(Boolean):[],
      socketBonus:it.socket_bonus||null,
      setName:it.set_name||null,setDisplay:it.set_display||null,
      setEffects:it.set_effects?it.set_effects.split('|').map(x=>x.trim()).filter(Boolean):[],
      spell:sp.split('|').map(x=>x.trim()).filter(x=>x&&x.includes('착용')),
      proc:sp.split('|').map(x=>x.trim()).filter(x=>x&&x.includes('발동')),
      w:it.w_min?{min:it.w_min,max:it.w_max,speed:it.w_speed,dps:it.w_dps}:null,
      itype,};
    if(s===16)itemsObj[15]=itemsObj[16];
  }
  return itemsObj;
}

// ── Firestore REST 디코더: {fields:{k:{kindValue}}} → JS 객체 ─
function _fromFsValue(v){
  if(!v||typeof v!=='object')return null;
  if('nullValue'    in v)return null;
  if('booleanValue' in v)return v.booleanValue;
  if('integerValue' in v)return parseInt(v.integerValue);
  if('doubleValue'  in v)return v.doubleValue;
  if('stringValue'  in v)return v.stringValue;
  if('timestampValue' in v)return v.timestampValue;
  if('arrayValue'   in v)return (v.arrayValue.values||[]).map(_fromFsValue);
  if('mapValue'     in v){
    const o={}; for(const[k,val]of Object.entries(v.mapValue.fields||{}))o[k]=_fromFsValue(val); return o;
  }
  return null;
}
function _fsDocToObj(doc){return _fromFsValue({mapValue:{fields:doc.fields||{}}});}

// ── Firestore 갱신분 조회 후 메모리 DB 덮어쓰기 ───────────────
async function applyFirestoreRefreshes(){
  const PROJECT='wowak-3edc9';
  const API_KEY='***REMOVED***';
  const url=`https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/character_refreshes?key=${API_KEY}&pageSize=300`;
  const res=await fetch(url);
  if(!res.ok)return;
  const data=await res.json();
  const docs=data.documents||[];
  if(!docs.length)return;
  let applied=0;
  for(const doc of docs){
    const fr=_fsDocToObj(doc);
    const name=fr.character_name;
    if(!name||!GUILD_DB[name])continue;
    const snapMs=Date.parse((GUILD_DB[name].snapshot_date||'').replace(' ','T')+'Z')||0;
    if((fr.updated_at_ms||0)<=snapMs)continue;  // characters.json이 더 신선함 → skip

    // GUILD_DB: rank 보존
    const pg=GUILD_DB[name];
    GUILD_DB[name]={...pg,
      character_id:fr.character_id??pg.character_id,
      level:fr.level??pg.level,
      class_name:fr.class_name||pg.class_name,
      class_id:fr.class_id||pg.class_id,
      avatar_img:fr.avatar_img||pg.avatar_img,
      last_login_timestamp:fr.last_login_timestamp??pg.last_login_timestamp,
      last_login_timestamp_KST:fr.last_login_timestamp_KST||pg.last_login_timestamp_KST,
      snapshot_date:fr.snapshot_date||pg.snapshot_date,
      average_item_level:fr.average_item_level??pg.average_item_level,
    };
    // STATS_DB / V2
    if(fr.stats){
      const so={character_name:name,...fr.stats,honorable_kills:fr.honorable_kills||0};
      STATS_DB[name]=so; STATS_DB_V2[name]=so;
    }
    // SPEC_DB
    const sp=_buildSpecDbEntry(fr.specializations);
    if(sp)SPEC_DB[name]=sp;
    // CHAR_DB
    const pc=CHAR_DB[name]||{};
    CHAR_DB[name]={...pc,
      name,
      class_name:fr.class_name||pc.class_name,
      class_id:fr.class_id||pc.class_id,
      race_id:fr.race_id||pc.race_id,
      average_item_level:fr.average_item_level??pc.average_item_level,
      items:_buildItemsObjFromEquipment(fr.equipment||[]),
    };
    _recomputeCharDerivedStats(name);

    // LOGIN_LOG_DB 머지 — last_login_timestamp_KST 'YYYY-MM-DD HH:MM:SS' → date/time 분리
    if(fr.last_login_timestamp_KST&&typeof fr.last_login_timestamp_KST==='string'){
      const m=fr.last_login_timestamp_KST.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})$/);
      if(m){
        const [,date,time]=m;
        window.LOGIN_LOG_DB[name]=window.LOGIN_LOG_DB[name]||{};
        const arr=window.LOGIN_LOG_DB[name][date]=window.LOGIN_LOG_DB[name][date]||[];
        if(!arr.includes(time))arr.push(time);
        window.LOGIN_FS_DB[name]=window.LOGIN_FS_DB[name]||date;
      }
    }

    // GS_LOG_RAW 머지 — snapshot_date(UTC)→KST 날짜, 활성 스펙별 gs 기록
    const _gs=STATS_DB_V2[name]?.gear_score;
    if(_gs&&fr.snapshot_date){
      const utcMs=Date.parse(fr.snapshot_date.replace(' ','T')+'Z');
      if(!isNaN(utcMs)){
        const kst=new Date(utcMs+9*3600*1000);
        const kstDate=kst.toISOString().slice(0,10);
        const activeSpec=(SPEC_DB[name]?.active||[]).reduce((b,s)=>s.pts>b.pts?s:b,{pts:0,spec:''}).spec||'';
        if(activeSpec){
          window.GS_LOG_RAW[name]=window.GS_LOG_RAW[name]||{};
          window.GS_LOG_RAW[name][kstDate]=window.GS_LOG_RAW[name][kstDate]||{};
          window.GS_LOG_RAW[name][kstDate][activeSpec]={gs:Math.round(_gs)};
        }
      }
    }

    applied++;
  }
}

// ── 단일 캐릭터 파생 스탯 재계산 (gear_score / attack_power / skill_rating / resilience_rating / 세트 효과) ──
function _recomputeCharDerivedStats(name){
  const cd=CHAR_DB[name];if(!cd||!STATS_DB_V2[name])return;
  const d=STATS_DB_V2[name];
  const items=cd.items||{};
  const uniqItems=[...new Set(Object.values(items))];

  // gear_score
  {
    const _GS_F={EPIC:{A:26.0,B:1.2},RARE:{A:0.75,B:1.8},UNCOMMON:{A:8.0,B:2.0},COMMON:{A:0.0,B:2.25}};
    const _GS_QS={LEGENDARY:1.3,EPIC:1.0,RARE:1.0,UNCOMMON:1.0,COMMON:0.005,POOR:0.005};
    const _GS_SM={1:1.0,2:0.5625,3:0.75,5:1.0,6:0.75,7:1.0,8:0.75,9:0.5625,10:0.75,
                  11:0.5625,12:0.5625,13:0.5625,14:0.5625,16:0.5625,18:0.3164,21:1.0,22:1.0};
    const _GS_NO_ENCH=new Set([2,6,11,12,13,14]);
    const isHunter=cd.class_id===3;
    let gs=0;
    for(const[slot,it]of Object.entries(items)){
      const s=parseInt(slot);if(s===15)continue;
      let slotMod=_GS_SM[s];if(!slotMod)continue;
      if(it.itype==='양손 장비')slotMod=slotMod*2;
      const ilvl=it.ilvl;if(!ilvl)continue;
      const q=it.q==='LEGENDARY'?'EPIC':it.q;
      const coef=_GS_F[q];if(!coef)continue;
      const qScale=_GS_QS[it.q]||1.0;
      let itemGs=Math.floor(((ilvl-coef.A)/coef.B)*slotMod*1.8618*qScale+1e-9);
      if(itemGs<0)itemGs=0;
      if(isHunter){
        if(s===21||s===22)itemGs=Math.floor(itemGs*0.3164+1e-9);
        else if(s===18)itemGs=Math.floor(itemGs*5.3224+1e-9);
      }
      if(!_GS_NO_ENCH.has(s)&&(it.enchantId||it.enchant))itemGs=Math.floor(itemGs*1.05+1e-9);
      gs+=itemGs+(it.gems||0)*5;
    }
    d.gear_score=gs||null;
  }

  // attack_power 보정
  {
    const _apEncRe=/전투력 \+(\d+)/g;
    let apBonus=0;
    for(const it of uniqItems){
      for(const g of(it.gemEffects||[])){const m=g.match(/^전투력 \+(\d+)$/);if(m)apBonus+=parseInt(m[1]);}
      const sb=it.socketBonus||'';{const m=sb.match(/전투력 \+(\d+)/);if(m)apBonus+=parseInt(m[1]);}
      const enc=it.enchant||'';for(const m of enc.matchAll(_apEncRe))apBonus+=parseInt(m[1]);
    }
    if(apBonus)d.attack_power=(d.attack_power||0)+apBonus;
  }

  // skill_rating
  {
    let skill=0;
    for(const it of uniqItems){
      for(const s of(it.spell||[])){
        if(s.includes('낚시'))continue;
        const m=s.match(/숙련도가 (\d+)만큼/);if(m)skill+=parseInt(m[1]);
      }
      const enc=it.enchant||'';
      for(const m of enc.matchAll(/숙련도\s*\+(\d+)/g))skill+=parseInt(m[1]);
      for(const g of(it.gemEffects||[])){
        if(g.includes('낚시'))continue;
        const m=g.match(/숙련도 \+(\d+)$/);if(m)skill+=parseInt(m[1]);
      }
      const sb=it.socketBonus||'';
      for(const m of sb.matchAll(/숙련도 \+(\d+)/g))skill+=parseInt(m[1]);
    }
    d.skill_rating=skill;
  }

  // resilience_rating
  {
    let res=0;
    for(const it of uniqItems){
      res+=(it.stats?.resilience_rating||0);
      for(const s of(it.spell||[])){const m=s.match(/탄력도가 (\d+)만큼/);if(m)res+=parseInt(m[1]);}
      const enc=it.enchant||'';
      for(const m of enc.matchAll(/탄력도\s*\+(\d+)/g))res+=parseInt(m[1]);
      for(const g of(it.gemEffects||[])){const m=g.match(/^탄력도 \+(\d+)$/);if(m)res+=parseInt(m[1]);}
      const sb=it.socketBonus||'';
      {const m=sb.match(/탄력도 \+(\d+)/);if(m)res+=parseInt(m[1]);}
    }
    d.resilience_rating=res;
  }

  // 적중도/치명타/극대화 집계 (hit_rating / spell_hit_rating / crit_rating / spell_crit_rating)
  {
    let hit=0,spellHit=0,crit=0,spellCrit=0;
    for(const it of uniqItems){
      crit+=(it.stats?.crit_rating||0);
      spellCrit+=(it.stats?.spell_crit_rating||0);
      spellHit+=(it.stats?.spell_hit_rating||0);
      for(const s of(it.spell||[])){
        const m=s.match(/^착용 효과: 적중도가 (\d+)만큼/);if(m)hit+=parseInt(m[1]);
        const ms=s.match(/^착용 효과: 주문 적중도가 (\d+)만큼/);if(ms)spellHit+=parseInt(ms[1]);
        const mbc=s.match(/치명타 및 극대화 적중도가 (\d+)만큼/);if(mbc){const v=parseInt(mbc[1]);crit+=v;spellCrit+=v;}
        else{const mc=s.match(/치명타 적중도가 (\d+)만큼/);if(mc)crit+=parseInt(mc[1]);}
        const msc=s.match(/주문(?:의)?\s*극대화 적중도가 (\d+)만큼/);if(msc)spellCrit+=parseInt(msc[1]);
      }
      const enc=it.enchant||'';
      for(const part of enc.split(/\s*\/\s*/)){
        const t=part.trim().replace(/^마법부여:\s*/,'');
        const em=t.match(/^적중도\s*\+(\d+)$/);if(em){hit+=parseInt(em[1]);continue;}
        const esm=t.match(/^주문\s*적중도\s*\+(\d+)$/);if(esm){spellHit+=parseInt(esm[1]);continue;}
        const ecm=t.match(/치명타\s*적중도\s*\+(\d+)/);if(ecm){crit+=parseInt(ecm[1]);continue;}
        const escm=t.match(/주문\s*극대화\s*적중도\s*\+(\d+)/);if(escm)spellCrit+=parseInt(escm[1]);
      }
      for(const g of(it.gemEffects||[])){
        const m=g.match(/^적중도 \+(\d+)$/);if(m){hit+=parseInt(m[1]);continue;}
        const ms=g.match(/^주문 적중도 \+(\d+)$/);if(ms){spellHit+=parseInt(ms[1]);continue;}
        const mc=g.match(/^치명타 적중도 \+(\d+)$/);if(mc){crit+=parseInt(mc[1]);continue;}
        const msc=g.match(/^주문 극대화 적중도 \+(\d+)$/);if(msc)spellCrit+=parseInt(msc[1]);
      }
      const sb=it.socketBonus||'';
      {const m=sb.match(/^적중도 \+(\d+)$/);if(m)hit+=parseInt(m[1]);}
      {const ms=sb.match(/^주문 적중도 \+(\d+)$/);if(ms)spellHit+=parseInt(ms[1]);}
      {const mc=sb.match(/치명타 적중도 \+(\d+)/);if(mc)crit+=parseInt(mc[1]);}
      {const msc=sb.match(/주문 극대화 적중도 \+(\d+)/);if(msc)spellCrit+=parseInt(msc[1]);}
    }
    d.hit_rating=hit;d.spell_hit_rating=spellHit;d.crit_rating=crit;d.spell_crit_rating=spellCrit;
  }

  // 주문 치유량/주문 공격력 집계 (healing_power / spell_dmg)
  {
    const _bothRe=/공격력과 치유량이 최대 (\d+)/;
    const _healDmgRe=/치유량이 최대 (\d+)만큼, 공격력이 최대 (\d+)/;
    const _enchBothRe=/주문\s*공격력\s*및\s*치유량?\s*\+(\d+)/g;
    const _enchRevBothRe=/치유\s*및\s*주문\s*공격력\s*\+(\d+)/g;
    const _enchHealRe=/주문\s*치유량\s*\+(\d+)/g;
    const _enchDmgRe=/주문\s*공격력\s*\+(\d+)/g;
    let healPow=0,spellDmg=0;
    for(const it of uniqItems){
      healPow+=(it.stats?.healing_power||0);
      spellDmg+=(it.stats?.spell_dmg||0);
      for(const s of(it.spell||[])){
        if(s.includes('계열'))continue;
        const m2=s.match(_healDmgRe);
        if(m2){healPow+=parseInt(m2[1]);spellDmg+=parseInt(m2[2]);continue;}
        const m1=s.match(_bothRe);
        if(m1){const n=parseInt(m1[1]);healPow+=n;spellDmg+=n;}
      }
      const enc=it.enchant||'';
      for(const m of enc.matchAll(_enchBothRe)){const v=parseInt(m[1]);healPow+=v;spellDmg+=v;}
      for(const m of enc.matchAll(_enchRevBothRe)){const v=parseInt(m[1]);healPow+=v;spellDmg+=v;}
      const remaining=enc.replace(_enchBothRe,'').replace(_enchRevBothRe,'');
      for(const m of remaining.matchAll(_enchHealRe))healPow+=parseInt(m[1]);
      for(const m of remaining.matchAll(_enchDmgRe))spellDmg+=parseInt(m[1]);
      for(const g of(it.gemEffects||[])){
        const mb=g.match(/^주문 공격력 및 치유량 \+(\d+)$/);if(mb){const v=parseInt(mb[1]);healPow+=v;spellDmg+=v;continue;}
        const mh=g.match(/^주문 치유량 \+(\d+)$/);if(mh){healPow+=parseInt(mh[1]);continue;}
        const md=g.match(/^주문 공격력 \+(\d+)$/);if(md)spellDmg+=parseInt(md[1]);
      }
      const sb=it.socketBonus||'';
      for(const m of sb.matchAll(/주문 공격력 및 치유량 \+(\d+)/g)){const v=parseInt(m[1]);healPow+=v;spellDmg+=v;}
      const sbR=sb.replace(/주문 공격력 및 치유량 \+\d+/g,'');
      for(const m of sbR.matchAll(/주문 치유량 \+(\d+)/g))healPow+=parseInt(m[1]);
      for(const m of sbR.matchAll(/주문 공격력 \+(\d+)/g))spellDmg+=parseInt(m[1]);
    }
    d.healing_power=healPow;d.spell_dmg=spellDmg;
  }

  // 세트 효과
  {
    const seenSet=new Set();
    for(const it of uniqItems){
      if(!it.setName||seenSet.has(it.setName))continue;
      seenSet.add(it.setName);
      for(const fx of(it.setEffects||[])){
        if(!fx.startsWith('세트 효과:'))continue;
        const t=fx.replace(/^세트 효과:\s*/,'');
        {const m=t.match(/탄력도\s*\+(\d+)/);if(m){d.resilience_rating=(d.resilience_rating||0)+parseInt(m[1]);continue;}}
        {const m=t.match(/공격력과 치유량이 최대 (\d+)/);if(m){const v=parseInt(m[1]);d.healing_power=(d.healing_power||0)+v;d.spell_dmg=(d.spell_dmg||0)+v;continue;}}
        {const m=t.match(/치유량이 최대 (\d+)만큼.*공격력이 최대 (\d+)/);if(m){d.healing_power=(d.healing_power||0)+parseInt(m[1]);d.spell_dmg=(d.spell_dmg||0)+parseInt(m[2]);continue;}}
        {const m=t.match(/주문 적중도가 (\d+)만큼/);if(m){d.spell_hit_rating=(d.spell_hit_rating||0)+parseInt(m[1]);continue;}}
        {const m=t.match(/치명타 적중도가 (\d+)만큼/);if(m){d.crit_rating=(d.crit_rating||0)+parseInt(m[1]);continue;}}
        {const m=t.match(/주문의?\s*극대화 적중도가 (\d+)만큼/);if(m){d.spell_crit_rating=(d.spell_crit_rating||0)+parseInt(m[1]);continue;}}
        {const m=t.match(/전투력이 (\d+)만큼/);if(m){d.attack_power=(d.attack_power||0)+parseInt(m[1]);continue;}}
        if(!t.includes('주문')){const m=t.match(/적중도가 (\d+)만큼/);if(m){d.hit_rating=(d.hit_rating||0)+parseInt(m[1]);continue;}}
        if(!t.includes('낚시')){const m=t.match(/숙련도가 (\d+)만큼/);if(m)d.skill_rating=(d.skill_rating||0)+parseInt(m[1]);}
      }
    }
  }
}

// ── specializations 배열 → SPEC_DB 형식 변환 ─────────────────
function _buildSpecDbEntry(specializations){
  if(!specializations||!specializations.length)return null;
  const tmp={active:{},secondary:{}};
  for(const sp of specializations){
    const grp=sp.spec_group_active?'active':'secondary';
    if(!tmp[grp][sp.spec_name_kr])
      tmp[grp][sp.spec_name_kr]={spec:sp.spec_name_kr,pts:sp.spec_spent_points,talents:{}};
    const _desc=(typeof TBC_TALENT_DESC!=='undefined'&&TBC_TALENT_DESC[sp.talent_id]?.[sp.talent_rank])||'';
    tmp[grp][sp.spec_name_kr].talents[sp.talent_id]={
      rank:sp.talent_rank,spell_id:sp.spell_id,
      base_spell_id:sp.spell_id-(sp.talent_rank-1),
      name:(typeof TBC_TALENT_NAME!=='undefined'&&TBC_TALENT_NAME[sp.talent_id])||'',desc:_desc,
    };
  }
  return {active:Object.values(tmp.active),secondary:Object.values(tmp.secondary)};
}

// ── 데이터 로드 ──────────────────────────────────────────────
async function loadData(){
  const _isLocal=location.hostname==='localhost'||location.hostname==='127.0.0.1';
  const _STORAGE='https://firebasestorage.googleapis.com/v0/b/wowak-3edc9.firebasestorage.app/o';
  const _loginUrl=_isLocal?'/data/user_login_log.json':`${_STORAGE}/user_login_log%2Fuser_login_log.json?alt=media`;

  // ── version.json + characters.json 체인을 나머지 6개와 동시에 시작 ──
  // version.json(733ms)을 기다리는 동안 소형 파일들이 병렬로 완료됨
  const _charsProm=_isLocal
    ? fetch(`/data/characters.json?v=${Date.now()}`).catch(()=>null)
    : fetch(`${_STORAGE}/version.json?alt=media`,{cache:'no-store'})
        .then(r=>r.json()).catch(()=>({chars:Date.now()}))
        .then(ver=>{
          document.querySelectorAll('.footer-data-ver').forEach(el=>el.textContent=`${ver.chars}`);
          return fetch(`${_STORAGE}/characters.json?alt=media&v=${ver.chars}`);
        }).catch(()=>null);

  addLog('  캐릭터 데이터 로딩 중...','ok');

  // ── 7개 fetch 병렬 실행 (characters는 위 체인 재사용) ────────
  const [noticesRes,loginRes,talentsRes,soopRes,dimRes,charsRes,gsLogRes,dungeonSrcRes]=await Promise.all([
    fetch('/data/notices.json').catch(()=>null),
    fetch(_loginUrl).catch(()=>null),
    fetch('/data/tbc_talents.json').catch(()=>null),
    fetch(`/data/soop.json?v=${Date.now()}`).catch(()=>null),
    fetch('/data/dim_appearance.json').catch(()=>null),
    _charsProm,
    (_isLocal?fetch(`data/gearscore_log.json?v=${Date.now()}`):fetch(`${_STORAGE}/gearscore_log%2Fgearscore_log.json?alt=media&v=${Date.now()}`)).catch(()=>null),
    fetch('/data/tbc_dungeon_sources.json').catch(()=>null),
  ]);

  // ── JSON 파싱 병렬 실행 ──────────────────────────────────────
  const [noticesData,loginRows,tbcRaw,soopArr,apArr,allDocs,gsLogArr,dungeonSrcRaw]=await Promise.all([
    noticesRes?.ok?noticesRes.json().catch(()=>[]):Promise.resolve([]),
    loginRes?.ok?loginRes.json().catch(()=>[]):Promise.resolve([]),
    talentsRes?.ok?talentsRes.json().catch(()=>null):Promise.resolve(null),
    soopRes?.ok?soopRes.json().catch(()=>[]):Promise.resolve([]),
    dimRes?.ok?dimRes.json().catch(()=>[]):Promise.resolve([]),
    charsRes?.ok?charsRes.json().catch(()=>[]):Promise.resolve([]),
    gsLogRes?.ok?gsLogRes.json().catch(()=>[]):Promise.resolve([]),
    dungeonSrcRes?.ok?dungeonSrcRes.json().catch(()=>({})):Promise.resolve({}),
  ]);

  // ── notices ──────────────────────────────────────────────────
  window._notices=noticesData;

  // ── user_login_log ───────────────────────────────────────────
  window.LOGIN_LOG_DB={};
  window.LOGIN_FS_DB={};
  window.LOGIN_TOTAL_BY_DATE={};
  window.LOGIN_RANK_BY_DATE={};
  window.LOGIN_RANK_LOGIN_BY_DATE={};
  for(const row of loginRows){
    if(row.__meta__){
      window.LOGIN_TOTAL_BY_DATE=row.total_by_date||{};
      window.LOGIN_RANK_BY_DATE=row.rank_by_date||{};
      window.LOGIN_RANK_LOGIN_BY_DATE=row.rank_login_by_date||{};
      continue;
    }
    if(!row.n||!row.d)continue;
    LOGIN_LOG_DB[row.n]=row.d;
    const fs=row.fs||Object.keys(row.d).sort()[0]||null;
    if(fs) LOGIN_FS_DB[row.n]=fs;
  }


  // ── tbc_talents ──────────────────────────────────────────────
  let TBC_TALENT_DESC={}; // {talentId: {rank: description}}
  let TBC_TALENT_NAME={}; // {talentId: name}
  window.TBC_TALENT_BY_ID={};
  window.TBC_TREE_MAP={};
  window.TBC_CLASS_TREES={};
  window.TBC_TREE_EN_NAME={};
  window.TALENT_MAX_FROM_TREE={};
  if(tbcRaw){
    try{
      const _slugToKrClass={};
      for(const[kr,slug] of Object.entries(KR_TO_TREE_KEY)) _slugToKrClass[slug]=kr;
      for(const cls of (tbcRaw.classes||[])){
        const slug=cls.slug;
        const krClass=_slugToKrClass[slug];
        const enToKr=(krClass&&CLASS_SPEC_EN_TO_KR[krClass])||{};
        window.TBC_CLASS_TREES[slug]={};
        for(const tree of (cls.trees||[])){
          const krName=enToKr[tree.name]||tree.name;
          window.TBC_CLASS_TREES[slug][krName]=tree.id;
          window.TBC_TREE_EN_NAME[tree.id]=tree.name;
        }
      }
      for(const[,talents] of Object.entries(tbcRaw.talentsByClass||{})){
        for(const t of talents){
          window.TBC_TALENT_BY_ID[t.id]=t;
          window.TALENT_MAX_FROM_TREE[t.id]=t.maxRank;
          if(!window.TBC_TREE_MAP[t.treeId]) window.TBC_TREE_MAP[t.treeId]=[];
          window.TBC_TREE_MAP[t.treeId].push(t);
          TBC_TALENT_NAME[t.id]=t.ranks?.[0]?.name||'';
          const _rm={};
          for(const rv of (t.ranks||[])){
            _rm[rv.rank]=rv.description||'';
            const k=String(rv.spellId);
            if(!window.LOADMAP_SPELL_TO_TID[k]) window.LOADMAP_SPELL_TO_TID[k]=t.id;
          }
          TBC_TALENT_DESC[t.id]=_rm;
        }
      }
      // druid: tbc_talents.json='복원' vs 배틀넷 API='회복' 불일치 보정
      if(window.TBC_CLASS_TREES['druid']?.['복원']!==undefined)
        window.TBC_CLASS_TREES['druid']['회복']=window.TBC_CLASS_TREES['druid']['복원'];
      addLog(`  ✅ tbc_talents 로드: ${Object.keys(window.TBC_TALENT_BY_ID).length}개 재능`,'ok');
    }catch(e){ addLog(`  ⚠️ tbc_talents 로드 오류: ${e.message}`,'warn'); }
  }

  // ── soop ─────────────────────────────────────────────────────
  window._soopMap={};
  window._soopMapById={};
  for(const s of soopArr){
    window._soopMap[s.character_name]=s;
    if(s.character_id) window._soopMapById[s.character_id]=s;
  }

  // ── dim_appearance map ───────────────────────────────────────
  const apMap={};
  for(const ap of apArr) apMap[ap.character_name]=ap;

  // ── 캐릭터 데이터 가공 (정적 JSON - Firestore reads = 0) ──────
  try{
    addLog('  데이터 로드 완료','ok');
    const _sw=document.getElementById('searchWrap');
    _sw.classList.remove('loading');
    document.getElementById('landingInput').placeholder='캐릭터 이름을 입력해주세요 (ex.왁두)';

    const specsFlat=[];

    for(const d of allDocs){
      const name=d.character_name;

      // GUILD_DB
      GUILD_DB[name]={
        character_id:d.character_id||null,
        level:d.level,rank_name:d.rank_name,rank_num:d.rank_num,
        class_name:d.class_name,class_id:d.class_id,
        avatar_img:d.avatar_img||null,
        last_login_timestamp:d.last_login_timestamp||null,
        last_login_timestamp_KST:d.last_login_timestamp_KST||null,
        snapshot_date:d.snapshot_date,
        average_item_level:d.average_item_level||0,
      };

      // STATS_DB, STATS_DB_V2
      if(d.stats){
        const statsObj={character_name:name,...d.stats,honorable_kills:d.honorable_kills||0};
        STATS_DB[name]=statsObj;
        STATS_DB_V2[name]=statsObj;
      }

      // SPEC_DB
      if(d.specializations&&d.specializations.length>0){
        const tmp={active:{},secondary:{}};
        for(const sp of d.specializations){
          const grp=sp.spec_group_active?'active':'secondary';
          if(!tmp[grp][sp.spec_name_kr])
            tmp[grp][sp.spec_name_kr]={spec:sp.spec_name_kr,pts:sp.spec_spent_points,talents:{}};
          const _desc=TBC_TALENT_DESC[sp.talent_id]?.[sp.talent_rank]||'';
          tmp[grp][sp.spec_name_kr].talents[sp.talent_id]={
            rank:sp.talent_rank,spell_id:sp.spell_id,
            base_spell_id:sp.spell_id-(sp.talent_rank-1),
            name:TBC_TALENT_NAME[sp.talent_id]||'',desc:_desc,
          };
          specsFlat.push({...sp,character_name:name});
        }
        SPEC_DB[name]={
          active:Object.values(tmp.active),
          secondary:Object.values(tmp.secondary),
        };
      }

      // CHAR_DB (장비)
      if(d.equipment&&d.equipment.length>0){
        const ap=apMap[name]||{};
        const race_id=ap.race_id||d.race_id||0;
        const gender_int=ap.gender_int!=null?ap.gender_int:(1-(d.viewer_gender??0));
        const viewer_gender=1-gender_int;
        const appearance={
          race:race_id,gender:viewer_gender,
          skin:ap.Skin_Color_display_order??0,face:ap.Face_display_order??0,
          hairStyle:ap.Hair_Style_display_order??0,hairColor:ap.Hair_Color_display_order??0,
          facialStyle:ap.Facial_Hair_display_order??ap.Markings_display_order??0,
        };
        const itemsObj={};
        for(const it of d.equipment){
          const itype=it.inventory_type_kr||'';
          const s=(_EQ_SLOT_MAP[it.slot_type]||(itype==='겉옷'?5:0));
          if(!s)continue;
          const item_id=it.item_id;
          const era=ITEMS_ERA[String(item_id)]||{};
          const display_id=parseInt(era.displayId||it.display_id||0)||0;
          const stats={};let armor=0;
          for(const seg of(it.stat_str||'').split('|')){
            const t=seg.trim();
            const ms=t.match(/^([가-힣]+)\s*\+(\d+)$/);
            if(ms){const k=_EQ_STAT_KR[ms[1]];if(k)stats[k]=parseInt(ms[2]);}
            const am=t.match(/방어도\s*(\d+)/);if(am)armor=parseInt(am[1]);
            const mheal=t.match(/^주문\s*치유량\s*\+(\d+)$/);if(mheal)stats.healing_power=parseInt(mheal[1]);
            const msdmg=t.match(/^주문\s*공격력\s*\+(\d+)$/);if(msdmg)stats.spell_dmg=parseInt(msdmg[1]);
            const mheff=t.match(/^치유\s*효과\s*증가\s*\+(\d+)$/);if(mheff)stats.healing_power=(stats.healing_power||0)+parseInt(mheff[1]);
            const mcrit=t.match(/^치명타\s*적중도\s*\+(\d+)$/);if(mcrit)stats.crit_rating=(stats.crit_rating||0)+parseInt(mcrit[1]);
            const mscrit=t.match(/^주문\s*극대화\s*적중도\s*\+(\d+)$/);if(mscrit)stats.spell_crit_rating=(stats.spell_crit_rating||0)+parseInt(mscrit[1]);
            const mshi=t.match(/^주문\s*적중도\s*\+(\d+)$/);if(mshi)stats.spell_hit_rating=(stats.spell_hit_rating||0)+parseInt(mshi[1]);
            const mrsil=t.match(/^탄력도\s*\+(\d+)$/);if(mrsil)stats.resilience_rating=(stats.resilience_rating||0)+parseInt(mrsil[1]);
          }
          const sp=it.equip_bonus_str||'';
          itemsObj[s]={name:it.item_name||'',q:it.quality||'COMMON',qkr:it.quality_kr||'',
            did:display_id,id:item_id,
            icon:(era.icon)?`${BASE_ICON}/${era.icon}.jpg`:(it.icon_url||''),
            sub:it.item_subclass||'',armor,bind:it.binding||'',
            req:it.req_level||null,ilvl:parseInt(era.itemLevel)||parseInt(it.item_level)||0,
            dur:it.dur_cur?[parseInt(it.dur_cur),parseInt(it.dur_max)]:null,
            stats,enchant:it.enchant_str||null,
            enchantId:it.enchant_id||null,
            enchantSource:it.enchant_source||null,
            enchantSourceId:it.enchant_source_id||null,
            gems:(it.gem_ids||[]).length,
            gemIds:it.gem_ids||[],
            gemNames:it.gems?it.gems.split(' / ').filter(Boolean):[],
            gemEffects:it.gem_effects?it.gem_effects.split(' | ').flatMap(g=>g.split(' / ')).filter(Boolean):[],
            gemEffectsRaw:it.gem_effects?it.gem_effects.split(' | ').filter(Boolean):[],
            socketBonus:it.socket_bonus||null,
            setName:it.set_name||null,setDisplay:it.set_display||null,
            setEffects:it.set_effects?it.set_effects.split('|').map(x=>x.trim()).filter(Boolean):[],
            spell:sp.split('|').map(x=>x.trim()).filter(x=>x&&x.includes('착용')),
            proc:sp.split('|').map(x=>x.trim()).filter(x=>x&&x.includes('발동')),
            w:it.w_min?{min:it.w_min,max:it.w_max,speed:it.w_speed,dps:it.w_dps}:null,
            itype,};
          if(s===16)itemsObj[15]=itemsObj[16];
        }
        CHAR_DB[name]={name,race_id,gender_int,viewer_gender,
          race_name:ap.race_name||'',
          class_name:ap.class_name||d.class_name||'',
          class_id:ap.class_id||d.class_id||0,
          gender_label:gender_int===1?'남성':'여성',
          emoji:EMOJI_MAP[ap.class_id||d.class_id]||'⚔',
          average_item_level:d.average_item_level||0,
          appearance,items:itemsObj,};
      }
    }

    addLog(`  ✅ Firestore ${allDocs.length}명 로드`,'ok');
    addLog(`  ✅ 스킬 데이터 ${Object.keys(SPEC_DB).length}명`,'ok');

    // ── 랜딩 KPI 카드 업데이트 ──
    {
      const totalMembers = allDocs.length;
      const vtuberLv60 = allDocs.filter(c => c.rank_name === '버튜버' && c.level >= 60).length;
      function animateCount(el, target, duration=900){
        if(!el) return;
        const start = performance.now();
        const update = (now) => {
          const t = Math.min((now - start) / duration, 1);
          const ease = 1 - Math.pow(1 - t, 3);
          el.textContent = Math.round(ease * target).toLocaleString();
          if(t < 1) requestAnimationFrame(update);
          else el.textContent = target.toLocaleString();
        };
        requestAnimationFrame(update);
      }
      animateCount(document.getElementById('kpi-total'), totalMembers);
      animateCount(document.getElementById('kpi-vtuber'), vtuberLv60, 800);
    }

    // 적중도/치명타/극대화 집계
    {
      for(const[cname,cd]of Object.entries(CHAR_DB)){
        let hit=0,spellHit=0,crit=0,spellCrit=0;
        for(const it of [...new Set(Object.values(cd.items||{}))]){
          // stat_str 직접 스탯
          crit+=(it.stats?.crit_rating||0);
          spellCrit+=(it.stats?.spell_crit_rating||0);
          spellHit+=(it.stats?.spell_hit_rating||0);
          // 착용효과
          for(const s of(it.spell||[])){
            const m=s.match(/^착용 효과: 적중도가 (\d+)만큼/);if(m)hit+=parseInt(m[1]);
            const ms=s.match(/^착용 효과: 주문 적중도가 (\d+)만큼/);if(ms)spellHit+=parseInt(ms[1]);
            const mbc=s.match(/치명타 및 극대화 적중도가 (\d+)만큼/);if(mbc){const v=parseInt(mbc[1]);crit+=v;spellCrit+=v;}
            else{const mc=s.match(/치명타 적중도가 (\d+)만큼/);if(mc)crit+=parseInt(mc[1]);}
            const msc=s.match(/주문(?:의)?\s*극대화 적중도가 (\d+)만큼/);if(msc)spellCrit+=parseInt(msc[1]);
          }
          // 마법부여
          const enc=it.enchant||'';
          for(const part of enc.split(/\s*\/\s*/)){
            const t=part.trim().replace(/^마법부여:\s*/,'');
            const em=t.match(/^적중도\s*\+(\d+)$/);if(em){hit+=parseInt(em[1]);continue;}
            const esm=t.match(/^주문\s*적중도\s*\+(\d+)$/);if(esm){spellHit+=parseInt(esm[1]);continue;}
            const ecm=t.match(/치명타\s*적중도\s*\+(\d+)/);if(ecm){crit+=parseInt(ecm[1]);continue;}
            const escm=t.match(/주문\s*극대화\s*적중도\s*\+(\d+)/);if(escm)spellCrit+=parseInt(escm[1]);
          }
          // 젬
          for(const g of(it.gemEffects||[])){
            const m=g.match(/^적중도 \+(\d+)$/);if(m){hit+=parseInt(m[1]);continue;}
            const ms=g.match(/^주문 적중도 \+(\d+)$/);if(ms){spellHit+=parseInt(ms[1]);continue;}
            const mc=g.match(/^치명타 적중도 \+(\d+)$/);if(mc){crit+=parseInt(mc[1]);continue;}
            const msc=g.match(/^주문 극대화 적중도 \+(\d+)$/);if(msc)spellCrit+=parseInt(msc[1]);
          }
          // 소켓 보너스
          const sb=it.socketBonus||'';
          {const m=sb.match(/^적중도 \+(\d+)$/);if(m)hit+=parseInt(m[1]);}
          {const ms=sb.match(/^주문 적중도 \+(\d+)$/);if(ms)spellHit+=parseInt(ms[1]);}
          {const mc=sb.match(/치명타 적중도 \+(\d+)/);if(mc)crit+=parseInt(mc[1]);}
          {const msc=sb.match(/주문 극대화 적중도 \+(\d+)/);if(msc)spellCrit+=parseInt(msc[1]);}
        }
        if(STATS_DB_V2[cname]){
          STATS_DB_V2[cname].hit_rating=hit;STATS_DB_V2[cname].spell_hit_rating=spellHit;
          STATS_DB_V2[cname].crit_rating=crit;STATS_DB_V2[cname].spell_crit_rating=spellCrit;
        }
      }
    }

    // 주문 치유량/주문 공격력 계산 후 STATS_DB_V2 주입
    {
      // 착용효과 패턴
      const _bothRe=/공격력과 치유량이 최대 (\d+)/;
      const _healDmgRe=/치유량이 최대 (\d+)만큼, 공격력이 최대 (\d+)/;
      // 인챈트: "주문 공격력 및 치유량 +N" / "치유 및 주문 공격력 +N" (결합) — 먼저 처리
      const _enchBothRe=/주문\s*공격력\s*및\s*치유량?\s*\+(\d+)/g;
      const _enchRevBothRe=/치유\s*및\s*주문\s*공격력\s*\+(\d+)/g;
      // 인챈트: 주문 치유량 +N / 주문 공격력 +N (개별)
      const _enchHealRe=/주문\s*치유량\s*\+(\d+)/g;
      const _enchDmgRe=/주문\s*공격력\s*\+(\d+)/g;
      for(const[cname,cd]of Object.entries(CHAR_DB)){
        let healPow=0,spellDmg=0;
        for(const it of [...new Set(Object.values(cd.items||{}))]){
          healPow+=(it.stats?.healing_power||0);
          spellDmg+=(it.stats?.spell_dmg||0);
          // 착용 효과 파싱 (특정 계열 제외)
          for(const s of(it.spell||[])){
            if(s.includes('계열'))continue;
            const m2=s.match(_healDmgRe);
            if(m2){healPow+=parseInt(m2[1]);spellDmg+=parseInt(m2[2]);continue;}
            const m1=s.match(_bothRe);
            if(m1){const n=parseInt(m1[1]);healPow+=n;spellDmg+=n;}
          }
          // 마법부여 파싱 — 결합 패턴 먼저, 이후 개별 패턴 (중복 방지)
          const enc=it.enchant||'';
          let remaining=enc;
          for(const m of enc.matchAll(_enchBothRe)){const v=parseInt(m[1]);healPow+=v;spellDmg+=v;}
          for(const m of enc.matchAll(_enchRevBothRe)){const v=parseInt(m[1]);healPow+=v;spellDmg+=v;}
          remaining=enc.replace(_enchBothRe,'').replace(_enchRevBothRe,'');
          for(const m of remaining.matchAll(_enchHealRe))healPow+=parseInt(m[1]);
          for(const m of remaining.matchAll(_enchDmgRe))spellDmg+=parseInt(m[1]);
          // 젬 효과 파싱
          for(const g of(it.gemEffects||[])){
            const mb=g.match(/^주문 공격력 및 치유량 \+(\d+)$/);if(mb){const v=parseInt(mb[1]);healPow+=v;spellDmg+=v;continue;}
            const mh=g.match(/^주문 치유량 \+(\d+)$/);if(mh){healPow+=parseInt(mh[1]);continue;}
            const md=g.match(/^주문 공격력 \+(\d+)$/);if(md)spellDmg+=parseInt(md[1]);
          }
          // 소켓 보너스 파싱
          const sb=it.socketBonus||'';
          let sbR=sb;
          for(const m of sb.matchAll(/주문 공격력 및 치유량 \+(\d+)/g)){const v=parseInt(m[1]);healPow+=v;spellDmg+=v;}
          sbR=sb.replace(/주문 공격력 및 치유량 \+\d+/g,'');
          for(const m of sbR.matchAll(/주문 치유량 \+(\d+)/g))healPow+=parseInt(m[1]);
          for(const m of sbR.matchAll(/주문 공격력 \+(\d+)/g))spellDmg+=parseInt(m[1]);
        }
        const _sv2=STATS_DB_V2[cname];
        if(_sv2){
          _sv2.healing_power=healPow;_sv2.spell_dmg=spellDmg;
        }
      }
    }

    // GearScore 계산 후 STATS_DB_V2 주입 (초기 로드 1회만 실행)
    // GearScoreCalc.lua 기준: 단일 공식, Legendary=Epic*1.3, 젬 +5/개, 마법부여 +5%, 헌터 무기 보정
    {
      const _GS_F={EPIC:{A:26.0,B:1.2},RARE:{A:0.75,B:1.8},UNCOMMON:{A:8.0,B:2.0},COMMON:{A:0.0,B:2.25}};
      const _GS_QS={LEGENDARY:1.3,EPIC:1.0,RARE:1.0,UNCOMMON:1.0,COMMON:0.005,POOR:0.005};
      const _GS_SM={1:1.0,2:0.5625,3:0.75,5:1.0,6:0.75,7:1.0,8:0.75,9:0.5625,10:0.75,
                    11:0.5625,12:0.5625,13:0.5625,14:0.5625,16:0.5625,18:0.3164,21:1.0,22:1.0};
      // 인챈트 불가 슬롯: 목걸이(2), 허리(6), 반지(11,12), 장신구(13,14)
      const _GS_NO_ENCH=new Set([2,6,11,12,13,14]);
      for(const[cname,cd]of Object.entries(CHAR_DB)){
        let gs=0;
        const isHunter=cd.class_id===3;
        for(const[slot,it]of Object.entries(cd.items||{})){
          const s=parseInt(slot);
          if(s===15)continue;
          let slotMod=_GS_SM[s];if(!slotMod)continue;
          if(it.itype==='양손 장비') slotMod=slotMod*2;
          const ilvl=it.ilvl;if(!ilvl)continue;
          const q=it.q==='LEGENDARY'?'EPIC':it.q;
          const coef=_GS_F[q];if(!coef)continue;
          const qScale=_GS_QS[it.q]||1.0;
          let itemGs=Math.floor(((ilvl-coef.A)/coef.B)*slotMod*1.8618*qScale + 1e-9);
          if(itemGs<0)itemGs=0;
          // Lua와 동일한 순서: hunter 보정 → enchant floor
          if(isHunter){
            if(s===21||s===22) itemGs=Math.floor(itemGs*0.3164 + 1e-9);
            else if(s===18)    itemGs=Math.floor(itemGs*5.3224 + 1e-9);
          }
          if(!_GS_NO_ENCH.has(s)&&(it.enchantId||it.enchant)) itemGs=Math.floor(itemGs*1.05 + 1e-9);
          gs+=itemGs+(it.gems||0)*5;
        }
        if(STATS_DB_V2[cname])STATS_DB_V2[cname].gear_score=gs||null;
      }
    }
    // 전투력 보정 — 젬/소켓보너스/마법부여의 "전투력 +N"을 서버 기본값에 합산
    {
      const _apEncRe=/전투력 \+(\d+)/g;
      for(const[cname,cd]of Object.entries(CHAR_DB)){
        let apBonus=0;
        for(const it of [...new Set(Object.values(cd.items||{}))]){
          for(const g of(it.gemEffects||[])){
            const m=g.match(/^전투력 \+(\d+)$/);if(m)apBonus+=parseInt(m[1]);
          }
          const sb=it.socketBonus||'';
          {const m=sb.match(/전투력 \+(\d+)/);if(m)apBonus+=parseInt(m[1]);}
          const enc=it.enchant||'';
          for(const m of enc.matchAll(_apEncRe))apBonus+=parseInt(m[1]);
        }
        if(STATS_DB_V2[cname]&&apBonus)
          STATS_DB_V2[cname].attack_power=(STATS_DB_V2[cname].attack_power||0)+apBonus;
      }
    }
    // 숙련도 통합 집계 — 방어·무기막기·방패막기·회피·단독 숙련도 전부 skill_rating으로 합산
    {
      for(const[cname,cd]of Object.entries(CHAR_DB)){
        let skill=0;
        for(const it of [...new Set(Object.values(cd.items||{}))]){
          // 착용효과: "XXX 숙련도가 N만큼" (낚시 제외)
          for(const s of(it.spell||[])){
            if(s.includes('낚시'))continue;
            const m=s.match(/숙련도가 (\d+)만큼/);if(m)skill+=parseInt(m[1]);
          }
          // 마법부여·젬·소켓보너스: "숙련도 +N"
          const enc=it.enchant||'';
          for(const m of enc.matchAll(/숙련도\s*\+(\d+)/g))skill+=parseInt(m[1]);
          for(const g of(it.gemEffects||[])){
            if(g.includes('낚시'))continue;
            const m=g.match(/숙련도 \+(\d+)$/);if(m)skill+=parseInt(m[1]);
          }
          const sb=it.socketBonus||'';
          for(const m of sb.matchAll(/숙련도 \+(\d+)/g))skill+=parseInt(m[1]);
        }
        if(STATS_DB_V2[cname])STATS_DB_V2[cname].skill_rating=skill;
      }
    }
    // 탄력도 집계 — stat_str·착용효과·마법부여·젬·소켓보너스 합산
    {
      for(const[cname,cd]of Object.entries(CHAR_DB)){
        let res=0;
        for(const it of [...new Set(Object.values(cd.items||{}))]){
          res+=(it.stats?.resilience_rating||0);
          for(const s of(it.spell||[])){
            const m=s.match(/탄력도가 (\d+)만큼/);if(m)res+=parseInt(m[1]);
          }
          const enc=it.enchant||'';
          for(const m of enc.matchAll(/탄력도\s*\+(\d+)/g))res+=parseInt(m[1]);
          for(const g of(it.gemEffects||[])){
            const m=g.match(/^탄력도 \+(\d+)$/);if(m)res+=parseInt(m[1]);
          }
          const sb=it.socketBonus||'';
          {const m=sb.match(/탄력도 \+(\d+)/);if(m)res+=parseInt(m[1]);}
        }
        if(STATS_DB_V2[cname])STATS_DB_V2[cname].resilience_rating=res;
      }
    }
    // 달성된 세트 효과 집계 — set_name별 dedup, (N) 접두사 없는 효과만 active
    {
      for(const[cname,cd]of Object.entries(CHAR_DB)){
        if(!STATS_DB_V2[cname])continue;
        const d=STATS_DB_V2[cname];
        const seenSet=new Set();
        for(const it of [...new Set(Object.values(cd.items||{}))]) {
          if(!it.setName||seenSet.has(it.setName))continue;
          seenSet.add(it.setName);
          for(const fx of(it.setEffects||[])){
            if(!fx.startsWith('세트 효과:'))continue;
            const t=fx.replace(/^세트 효과:\s*/,'');
            // 탄력도 +N
            {const m=t.match(/탄력도\s*\+(\d+)/);if(m){d.resilience_rating=(d.resilience_rating||0)+parseInt(m[1]);continue;}}
            // 공격력과 치유량이 최대 N (둘 다 동일값)
            {const m=t.match(/공격력과 치유량이 최대 (\d+)/);if(m){const v=parseInt(m[1]);d.healing_power=(d.healing_power||0)+v;d.spell_dmg=(d.spell_dmg||0)+v;continue;}}
            // 치유량이 최대 N만큼, 공격력이 최대 M
            {const m=t.match(/치유량이 최대 (\d+)만큼.*공격력이 최대 (\d+)/);if(m){d.healing_power=(d.healing_power||0)+parseInt(m[1]);d.spell_dmg=(d.spell_dmg||0)+parseInt(m[2]);continue;}}
            // 주문 적중도
            {const m=t.match(/주문 적중도가 (\d+)만큼/);if(m){d.spell_hit_rating=(d.spell_hit_rating||0)+parseInt(m[1]);continue;}}
            // 치명타 적중도
            {const m=t.match(/치명타 적중도가 (\d+)만큼/);if(m){d.crit_rating=(d.crit_rating||0)+parseInt(m[1]);continue;}}
            // 주문 극대화 적중도
            {const m=t.match(/주문의?\s*극대화 적중도가 (\d+)만큼/);if(m){d.spell_crit_rating=(d.spell_crit_rating||0)+parseInt(m[1]);continue;}}
            // 전투력
            {const m=t.match(/전투력이 (\d+)만큼/);if(m){d.attack_power=(d.attack_power||0)+parseInt(m[1]);continue;}}
            // 적중도 (주문 제외, 근접 공격 적중도 포함)
            if(!t.includes('주문')){const m=t.match(/적중도가 (\d+)만큼/);if(m){d.hit_rating=(d.hit_rating||0)+parseInt(m[1]);continue;}}
            // 숙련도 (낚시 제외)
            if(!t.includes('낚시')){const m=t.match(/숙련도가 (\d+)만큼/);if(m)d.skill_rating=(d.skill_rating||0)+parseInt(m[1]);}
          }
        }
      }
    }
    // LOADMAP_SPELL_TO_TID 구성
    for(const d of specsFlat){
      window.LOADMAP_SPELL_TO_TID[String(d.spell_id)]=d.talent_id;
      if(d.talent_rank>1){
        const base=d.spell_id-(d.talent_rank-1);
        for(let r=0;r<d.talent_rank-1;r++){
          const sid=String(base+r);
          if(!window.LOADMAP_SPELL_TO_TID[sid])
            window.LOADMAP_SPELL_TO_TID[sid]=d.talent_id;
        }
      }
    }
    for(const[tid,meta]of Object.entries(TALENT_META)){
      if(!meta.spell||!meta.max)continue;
      for(let r=0;r<meta.max;r++){
        const sid=String(meta.spell-r);
        if(!window.LOADMAP_SPELL_TO_TID[sid])
          window.LOADMAP_SPELL_TO_TID[sid]=Number(tid);
      }
    }

  }catch(e){
    addLog(`  ⚠️ Firestore 로드 실패: ${e.message}`,'warn');
  }

  // ── GS_LOG_RAW: {charName: {date: {spec: {gs}}}} ────────────
  window.GS_LOG_RAW={};
  if(Array.isArray(gsLogArr)){
    gsLogArr.filter(e=>!e.__meta__&&e.n&&e.d).forEach(e=>{window.GS_LOG_RAW[e.n]=e.d;});
  }

  window.TBC_DUNGEON_SRC=dungeonSrcRaw&&typeof dungeonSrcRaw==='object'?dungeonSrcRaw:{};

  // Firestore 갱신분 적용 (characters.json 이후 → DB 덮어쓰기)
  try{ await applyFirestoreRefreshes(); }catch(e){console.warn('[firestore apply skip]',e);}

  buildGuildUI();
  updateSnapDateUI();
  if(document.getElementById('stats-main-area')?.style.display!=='none') renderStatsPage();
  document.getElementById('lnav-items')?.classList.remove('nav-disabled');
  document.getElementById('lnav-stats')?.classList.remove('nav-disabled');
  document.getElementById('lnav-raidbuilder')?.classList.remove('nav-disabled');
  document.getElementById('landing-gs-rank-btn')?.classList.remove('nav-disabled');
  _initFromHash();

  // TBCA BIS Lookup — 주 로드 완료 후 백그라운드 빌드 (캐릭터 페이지 진입 전 완료 목적)
  (async()=>{
    try{
      const r=await fetch('/data/tbca_bis_updated.json?v=' + Date.now());
      if(!r.ok)return;
      const raw=await r.json();
      for(const[specKey,entry]of Object.entries(raw)){
        const map={};
        for(const slot of(entry.slots||[])){
          // p1 먼저 수집 — p2 없는 아이템의 fallback
          for(const item of(slot.p1||[])){
            const iid=String(item.item_id);
            const src=item.source||{};
            if(!map[iid]||(map[iid].item_phase===1&&item.rank<map[iid].rank))
              map[iid]={tier:item.tier,rank:item.rank,item_phase:1,
                source_type:src.source_type||'',source_ko:src.source_ko||'',source_location:src.source_location||''};
          }
          // p2 오버레이 — p2가 있으면 항상 p1보다 우선
          for(const item of(slot.p2||[])){
            const iid=String(item.item_id);
            const src=item.source||{};
            if(!map[iid]||map[iid].item_phase<2||(map[iid].item_phase===2&&item.rank<map[iid].rank))
              map[iid]={tier:item.tier,rank:item.rank,item_phase:2,
                source_type:src.source_type||'',source_ko:src.source_ko||'',source_location:src.source_location||''};
          }
        }
        TBCA_P1_LOOKUP[specKey]=map;
      }
    }catch(e){console.warn('[TBCA_BIS] 로드 실패',e);}
  })();
}

function closeNoticeModal(){
  const el=document.getElementById('notice-modal-overlay');
  if(el)el.style.display='none';
  localStorage.setItem('noticeModalSeen','1');
}

function getSnapshotDateKR(){
  const dates=Object.values(GUILD_DB).map(g=>g.snapshot_date).filter(Boolean);
  if(!dates.length)return'';
  const latest=[...dates].sort().pop();
  try{
    // snapshot_date는 UTC로 저장되므로 'Z' 접미사 붙여 명시적 UTC 파싱
    const utcStr=String(latest).replace(' ','T').replace(/Z?$/,'Z');
    const d=new Date(utcStr);
    if(isNaN(d))return String(latest);
    const opt={timeZone:'Asia/Seoul'};
    const p=new Intl.DateTimeFormat('ko-KR',{...opt,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).formatToParts(d);
    const get=t=>p.find(x=>x.type===t)?.value.padStart(2,'0');
    return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;
  }catch(e){return String(latest);}
}

function updateSnapDateUI(){
  const snap=getSnapshotDateKR();
  const label=snap?`데이터 최신 업로드일: ${snap}`:'';
  ['headerSnapDate'].forEach(id=>{
    const el=document.getElementById(id);
    if(el)el.textContent=label;
  });
  // 랜딩 페이지 수집 시간 (YY-MM-DD HH:MM:SS .VER)
  const landingEl=document.getElementById('landingSnapDate');
  if(landingEl&&snap){
    const yy=snap.slice(2); // YYYY-MM-DD HH:MM:SS → YY-MM-DD HH:MM:SS
    landingEl.textContent=`${yy} .VER`;
  }
}

// ── CHAR_DB ──────────────────────────────────────────────────
function buildCharDB(eqData,apData){
  const apMap={};for(const ap of apData)apMap[ap.character_name]=ap;
  const eqMap={};
  for(const it of eqData){const n=it.character_name;if(!eqMap[n])eqMap[n]=[];eqMap[n].push(it);}
  for(const[charName,items]of Object.entries(eqMap)){
    const ap=apMap[charName]||{};
    const race_id=ap.race_id||0,gender_int=ap.gender_int??0,viewer_gender=1-gender_int;
    const appearance={race:race_id,gender:viewer_gender,
      skin:ap.Skin_Color_display_order??0,face:ap.Face_display_order??0,
      hairStyle:ap.Hair_Style_display_order??0,hairColor:ap.Hair_Color_display_order??0,
      facialStyle:ap.Facial_Hair_display_order??ap.Markings_display_order??0,};
    const itemsObj={};
    for(const it of items){
      const itype=it.inventory_type_kr||'';
      const s=(_EQ_SLOT_MAP[it.slot_type]||(itype==='겉옷'?5:0));
      if(!s)continue;
      const item_id=it.item_id;
      const era=ITEMS_ERA[String(item_id)]||{};
      const display_id=parseInt(era.displayId||it.display_id||0)||0;
      const stats={};let armor=0;
      for(const seg of(it.stat_str||'').split('|')){
        const t=seg.trim();
        const ms=t.match(/^([가-힣]+)\s*\+(\d+)$/);
        if(ms){const k=_EQ_STAT_KR[ms[1]];if(k)stats[k]=parseInt(ms[2]);}
        const am=t.match(/방어도\s*(\d+)/);if(am)armor=parseInt(am[1]);
        const mheal=t.match(/^주문\s*치유량\s*\+(\d+)$/);if(mheal)stats.healing_power=parseInt(mheal[1]);
        const msdmg=t.match(/^주문\s*공격력\s*\+(\d+)$/);if(msdmg)stats.spell_dmg=parseInt(msdmg[1]);
        const mheff=t.match(/^치유\s*효과\s*증가\s*\+(\d+)$/);if(mheff)stats.healing_power=(stats.healing_power||0)+parseInt(mheff[1]);
        const mcrit=t.match(/^치명타\s*적중도\s*\+(\d+)$/);if(mcrit)stats.crit_rating=(stats.crit_rating||0)+parseInt(mcrit[1]);
        const mscrit=t.match(/^주문\s*극대화\s*적중도\s*\+(\d+)$/);if(mscrit)stats.spell_crit_rating=(stats.spell_crit_rating||0)+parseInt(mscrit[1]);
        const mshi=t.match(/^주문\s*적중도\s*\+(\d+)$/);if(mshi)stats.spell_hit_rating=(stats.spell_hit_rating||0)+parseInt(mshi[1]);
        const mrsil=t.match(/^탄력도\s*\+(\d+)$/);if(mrsil)stats.resilience_rating=(stats.resilience_rating||0)+parseInt(mrsil[1]);
      }
      const sp=it.equip_bonus_str||'';
      itemsObj[s]={name:it.item_name||'',q:it.quality||'COMMON',qkr:it.quality_kr||'',
        did:display_id,id:item_id,
        icon:(era.icon)?`${BASE_ICON}/${era.icon}.jpg`:(it.icon_url||''),
        sub:it.item_subclass||'',armor,bind:it.binding||'',
        req:it.req_level||null,ilvl:parseInt(era.itemLevel)||parseInt(it.item_level)||0,
        dur:it.dur_cur?[parseInt(it.dur_cur),parseInt(it.dur_max)]:null,
        stats,enchant:it.enchant_str||null,
        enchantId:it.enchant_id||null,
        enchantSource:it.enchant_source||null,
        enchantSourceId:it.enchant_source_id||null,
        gems:(it.gem_ids||[]).length,
        gemNames:it.gems?it.gems.split(' / ').filter(Boolean):[],
        gemEffects:it.gem_effects?it.gem_effects.split(' | ').flatMap(g=>g.split(' / ')).filter(Boolean):[],
        gemEffectsRaw:it.gem_effects?it.gem_effects.split(' | ').filter(Boolean):[],
        socketBonus:it.socket_bonus||null,
        setName:it.set_name||null,setDisplay:it.set_display||null,
        setEffects:it.set_effects?it.set_effects.split('|').map(x=>x.trim()).filter(Boolean):[],
        spell:sp.split('|').map(x=>x.trim()).filter(x=>x&&x.includes('착용')),
        proc:sp.split('|').map(x=>x.trim()).filter(x=>x&&x.includes('발동')),
        w:it.w_min?{min:it.w_min,max:it.w_max,speed:it.w_speed,dps:it.w_dps}:null,itype,};
      if(s===16)itemsObj[15]=itemsObj[16];
    }
    CHAR_DB[charName]={name:charName,race_id,gender_int,viewer_gender,
      race_name:ap.race_name||'',class_name:ap.class_name||'',class_id:ap.class_id||0,
      gender_label:gender_int===1?'남성':'여성',emoji:EMOJI_MAP[ap.class_id]||'⚔',
      appearance,items:itemsObj,};
  }
}

// ── 사이드바 접기/펼치기 ─────────────────────────────────────
