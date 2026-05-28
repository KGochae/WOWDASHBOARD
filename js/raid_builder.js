/* ===== raid_builder.js ===== */

// ── 상태 ─────────────────────────────────────────────────────
let _rbGroups = Array(5).fill(null).map(() => Array(5).fill(null));
let _rbDragSrc = null; // { name, fromGroup, fromSlot } or { name, fromGroup:null }
let _rbPoolFilter = { ranks: new Set(['버튜버','고정멤버']), role: 'all', cls: 'all' };
let _rbInitialized = false;

// ── 스펙 조회 헬퍼 ───────────────────────────────────────────

function rbGetSpec(name) {
  const s = SPEC_DB[name];
  if (!s || !s.active || !s.active.length) return null;
  return s.active.reduce((b, a) => a.pts > b.pts ? a : b, { pts: 0, spec: '' }).spec || null;
}

function rbGetSecondarySpec(name) {
  const s = SPEC_DB[name];
  if (!s || !s.secondary || !s.secondary.length) return null;
  return s.secondary.reduce((b, a) => a.pts > b.pts ? a : b, { pts: 0, spec: '' }).spec || null;
}

function rbGetSpecInfo(name) {
  const gm = GUILD_DB[name];
  if (!gm) return null;
  const clsMap = RB_SPEC_INFO[gm.class_name];
  if (!clsMap) return null;
  const spec = rbGetSpec(name);
  return (spec && clsMap[spec]) || clsMap['*'] || null;
}

function rbGetRole(name) {
  return rbGetSpecInfo(name)?.role || '딜러';
}

function rbGetKeyStat(name) {
  const info = rbGetSpecInfo(name);
  const v2 = STATS_DB_V2[name] || {};
  if (!info) return { label: 'GS', val: Math.round(v2.gear_score || 0) };
  const val = v2[info.keyStatField] || 0;
  return { label: info.keyStatLabel, val: Math.round(val) };
}

function rbIsAssigned(name) {
  return _rbGroups.some(g => g.includes(name));
}

// ── 드래그 앤 드롭 ───────────────────────────────────────────

function rbDragStart(event, name, fromGroup, fromSlot) {
  _rbDragSrc = { name, fromGroup: fromGroup ?? null, fromSlot: fromSlot ?? null };
  event.dataTransfer.setData('text/plain', name);
  event.dataTransfer.effectAllowed = 'move';
  event.currentTarget.style.opacity = '0.5';
}

function rbDragEnd(event) {
  event.currentTarget.style.opacity = '';
}

function rbDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  event.currentTarget.classList.add('drag-over');
}

function rbDragLeave(event) {
  event.currentTarget.classList.remove('drag-over');
}

function rbDrop(event, gi, si) {
  event.preventDefault();
  event.currentTarget.classList.remove('drag-over');
  if (!_rbDragSrc) return;

  const { name, fromGroup, fromSlot } = _rbDragSrc;
  const displaced = _rbGroups[gi][si]; // 기존 슬롯 멤버

  if (fromGroup !== null && fromSlot !== null) {
    // 슬롯→슬롯: 자리 교환
    _rbGroups[fromGroup][fromSlot] = displaced || null;
  }
  // 풀→슬롯 또는 슬롯→슬롯: 목표 슬롯에 배치
  _rbGroups[gi][si] = name;
  _rbDragSrc = null;
  rbRender();
}

function rbDropToPool(event) {
  event.preventDefault();
  event.currentTarget.classList.remove('drag-over');
  if (_rbDragSrc?.fromGroup !== null && _rbDragSrc?.fromSlot !== null) {
    _rbGroups[_rbDragSrc.fromGroup][_rbDragSrc.fromSlot] = null;
    _rbDragSrc = null;
    rbRender();
  }
}

function rbRemoveFromSlot(gi, si) {
  _rbGroups[gi][si] = null;
  rbRender();
}

function rbClearAll() {
  _rbGroups = Array(5).fill(null).map(() => Array(5).fill(null));
  rbRender();
}

// ── 시너지 계산 ──────────────────────────────────────────────

function rbCollectProvides(names) {
  const s = new Set();
  names.forEach(n => {
    if (!n) return;
    rbGetSpecInfo(n)?.provides.forEach(p => s.add(p));
  });
  return s;
}

// ── 초보자용 시너지 설명 ──────────────────────────────────────
// synergy_id → { icon: wowhead icon name, short: 간단설명 }
const _WH_ICON = 'https://wow.zamimg.com/images/wow/icons/small/';
// key = RB_SYNERGY_DEFS key (spellId 숫자 또는 한국어명 문자열)
const RB_PLAIN = {
  // 탤런트 기반 (spellId key, tbc_talents.json icon 활용)
  19506: { icon:'ability_trueshot',                          short:'공격력 증가' },
  20218: { icon:'spell_holy_mindvision',                     short:'신성 공격력 증가' },
  30706: { icon:'spell_fire_totemofwrath',                   short:'주문 적중·극대화 증가' },
  16190: { icon:'spell_frost_summonwaterelemental',          short:'마나 대량 재생' },
  28595: { icon:'spell_frost_chillingblast',                 short:'냉기 주문 극대화 증가' },
  34460: { icon:'ability_hunter_ferociousinspiration',       short:'공격력 증가' },
  17007: { icon:'spell_nature_unyeildingstamina',            short:'물리 치명타 증가' },
  30811: { icon:'spell_nature_unleashedrage',                short:'공격력 증가' },
  34914: { icon:'spell_holy_stoicism',                       short:'마나 재생 (흡혈)' },
  15286: { icon:'spell_shadow_unsummonbuilding',             short:'체력 재생 (흡혈)' },
  33891: { icon:'ability_druid_treeoflife',                  short:'치유력 증가' },
  10060: { icon:'spell_holy_powerinfusion',                  short:'주문력·시전 강화' },
  15334: { icon:'spell_shadow_blackplague',                  short:'암흑 피해 취약' },
  33195: { icon:'spell_shadow_misery',                       short:'모든 주문 피해 증가' },
  34503: { icon:'ability_rogue_findweakness',                short:'민첩 → 전투력' },
  24858: { icon:'spell_nature_forceofnature',                short:'주문 극대화 증가' },
  29859: { icon:'ability_warrior_bloodfrenzy',               short:'물리 피해 취약' },
  3043:  { icon:'ability_hunter_aspectofthemonkey',          short:'적중 감소' },
  33602: { icon:'spell_nature_faeriefire',                   short:'물리 적중 +3%' },
  20337: { icon:'ability_paladin_artofwar',                  short:'치명타 +3%' },
  30909: { icon:'spell_shadow_curseofmannoroth',             short:'근접 공격력 감소' },
  32484: { icon:'spell_shadow_contagion',                    short:'원소저주 +3%' },
  33182: { icon:'spell_holy_aspiration',                     short:'정신력 → 주문력' },
  25895: { icon:'spell_holy_sealofprotection',               short:'위협 감소' },
  // 기본기 (한국어명 key)
  '신비한 광휘':     { icon:'spell_holy_magicalsentry',          short:'지능 증가' },
  '강인함':         { icon:'spell_holy_wordfortitude',           short:'체력 증가' },
  '야생의 표식':    { icon:'spell_nature_regeneration',          short:'전 능력치 증가' },
  '명령의 외침':    { icon:'ability_warrior_rallyingcry',        short:'체력 증가' },
  '어둠의 저항':    { icon:'spell_shadow_antishadow',            short:'암흑 저항 증가' },
  '신성한 정신':    { icon:'spell_holy_divinespirit',            short:'정신력 증가' },
  '소생':          { icon:'spell_nature_reincarnation',          short:'전투 부활' },
  '강령석':        { icon:'inv_misc_orb_04',                     short:'전투 부활' },
  '성기사 축복':   { icon:'spell_holy_sealofwisdom',             short:'전 능력치 증가' },
  '지혜의 심판':   { icon:'spell_holy_righteousfury',            short:'마나 회복' },
  '빛의 심판':     { icon:'spell_holy_holy4',                    short:'체력 회복' },
  '집중의 오라':   { icon:'spell_holy_mindsooth',                short:'집중력 증가' },
  '헌신의 오라':   { icon:'spell_holy_devotionaura',             short:'방어도 증가' },
  '응보의 오라':   { icon:'spell_holy_crusade',                  short:'신성 피해 반사' },
  '바람힘 토템':   { icon:'spell_nature_windfury',               short:'근접 공격력 증가' },
  '파멸의 바람 토템': { icon:'spell_nature_slowingtotem',        short:'주문력 증가' },
  '마나 샘 토템':  { icon:'spell_nature_manaregentotem',         short:'마나 재생' },
  '대지의 힘 토템': { icon:'spell_nature_earthbindtotem',        short:'힘·민첩 증가' },
  '허공의 은총 토템': { icon:'spell_nature_invisibilitytotem',   short:'민첩 증가' },
  '피의 흥분':     { icon:'spell_nature_bloodlust',              short:'전투 가속' },
  '원소의 저주':   { icon:'spell_shadow_chilltouch',             short:'원소 저항 감소' },
  '무모함의 저주': { icon:'spell_shadow_chilltouch',             short:'방어도 감소·공격력 증가' },
  '방어구 약화':   { icon:'ability_warrior_sunder',              short:'방어도 감소' },
  '요정의 불꽃':   { icon:'spell_nature_faeriefire',             short:'방어도 감소' },
  '사냥꾼의 낙인': { icon:'ability_hunter_snipertraining',       short:'공격력 증가' },
  '갑옷 노출':     { icon:'ability_rogue_expose',                short:'방어도 감소' },
  '사기 저하의 외침': { icon:'spell_shadow_deathscream',         short:'공격력 감소' },
  '천둥 강타':     { icon:'spell_nature_thunderclap',            short:'공격속도 감소' },
  '전투의 외침':   { icon:'ability_warrior_battleshout',         short:'공격력 증가' },
  '활력':          { icon:'spell_nature_lightning',              short:'마나 급속 재생' },
  '빠른 귀환':     { icon:'ability_hunter_misdirection',         short:'위협 전가' },
  '피의 협약':     { icon:'spell_shadow_bloodboil',              short:'체력 증가' },
};

// ── 클래스 시너지 콤보 ────────────────────────────────────────
const RB_CLASS_COMBOS = [
  {
    title: '방어도 시너지',
    label: '분노 전사 + 도적 + 드루이드',
    scope: '공대 전체',
    color: '#c79c6e',
    desc: '세 직업의 방어도 감소 스킬을 조합하면 적의 방어도를 최대 5,260 깎아 공대 전체 물리 딜러의 실질 피해량을 크게 높입니다.',
    skills: '방어구 약화 (전사)  −2,600\n갑옷 노출 (도적)     −2,050\n요정의 불꽃 (드루이드) −610',
    check: ns => {
      const hasWarrior = ns.some(n => GUILD_DB[n]?.class_name === '전사' && rbGetRole(n) === '딜러');
      const hasRogue   = ns.some(n => GUILD_DB[n]?.class_name === '도적');
      const hasDruid   = ns.some(n => GUILD_DB[n]?.class_name === '드루이드');
      return [hasWarrior, hasRogue, hasDruid].filter(Boolean).length >= 2;
    },
  },
  {
    title: '암흑 시너지',
    label: '암흑 사제 + 흑마법사',
    scope: '파티 한정',
    color: '#9d85d4',
    desc: '암흑 취약 디버프와 마나 흡혈 효과가 결합해 흑마법사의 암흑 피해를 최대 15% 증폭하고 장기전 마나 지속력도 올립니다.',
    skills: '어둠의 매듭: 암흑 취약 +10%\n흡혈의 손길: 피해량의 일부를 파티 마나로 회복',
    check: ns => ns.some(n => GUILD_DB[n]?.class_name === '사제' && rbGetSpec(n) === '암흑') &&
                 ns.some(n => GUILD_DB[n]?.class_name === '흑마법사'),
  },
  {
    title: '주문 피해 시너지',
    label: '암흑 사제 + 주문 딜러',
    scope: '공대 전체',
    color: '#9d85d4',
    desc: '적에게 걸리는 주문 취약 디버프가 공대 전체 주문 딜러의 피해를 5% 일괄 상승시킵니다.',
    skills: '불행: 모든 주문 피해 +5%\n(마법사·흑마법사·조화 드루이드·정기 주술사 모두 적용)',
    check: ns => ns.some(n => GUILD_DB[n]?.class_name === '사제' && rbGetSpec(n) === '암흑') &&
                 ns.some(n => ['마법사','흑마법사'].includes(GUILD_DB[n]?.class_name) ||
                   (GUILD_DB[n]?.class_name === '드루이드' && rbGetSpec(n) === '조화') ||
                   (GUILD_DB[n]?.class_name === '주술사' && rbGetSpec(n) === '정기')),
  },
  {
    title: '주문 적중 시너지',
    label: '정기 주술사 + 주문 딜러',
    scope: '파티 한정',
    color: '#0070de',
    desc: '토템 하나로 파티 주문 딜러 전체의 적중률과 크리티컬 확률을 동시에 높여 딜 안정성을 크게 개선합니다.',
    skills: '격노의 토템: 주문 적중 +3% · 주문 극대화 +3%',
    check: ns => {
      const hasEle    = ns.some(n => GUILD_DB[n]?.class_name === '주술사' && rbGetSpec(n) === '정기');
      const hasCaster = ns.some(n => ['마법사','흑마법사'].includes(GUILD_DB[n]?.class_name) ||
        (GUILD_DB[n]?.class_name === '사제' && rbGetSpec(n) === '암흑') ||
        (GUILD_DB[n]?.class_name === '드루이드' && rbGetSpec(n) === '조화'));
      return hasEle && hasCaster;
    },
  },
  {
    title: '근딜 시너지',
    label: '고양 주술사 + 근접 딜러',
    scope: '파티 한정',
    color: '#0070de',
    desc: '추가 타격 확률과 치명타 연계 전투력 버프가 겹쳐 근접 딜러가 많을수록 전체 데미지 증폭 효과가 커집니다.',
    skills: '바람힘 토템: 공격 시 16% 확률로 추가 타격\n해방된 분노: 치명타 발생 시 전투력 +10%',
    check: ns => {
      const hasEnh   = ns.some(n => GUILD_DB[n]?.class_name === '주술사' && rbGetSpec(n) === '고양');
      const hasMelee = ns.some(n => ['전사','도적'].includes(GUILD_DB[n]?.class_name) ||
        (GUILD_DB[n]?.class_name === '성기사' && rbGetSpec(n) === '징벌') ||
        (GUILD_DB[n]?.class_name === '드루이드' && rbGetSpec(n) === '야성'));
      return hasEnh && hasMelee;
    },
  },
  {
    title: '원소 시너지',
    label: '흑마법사 + 주문 딜러',
    scope: '공대 전체',
    color: '#9482c9',
    desc: '원소 저항 감소 저주가 적에게 걸려 공대 전체 주문 딜러의 화염·냉기·비전·자연 피해를 13% 높입니다.',
    skills: '원소의 저주: 화염·냉기·비전·자연 피해 +13%\n(공대 전체 주문 딜러 동시 적용)',
    check: ns => ns.some(n => GUILD_DB[n]?.class_name === '흑마법사') &&
                 ns.some(n => ['마법사','사제'].includes(GUILD_DB[n]?.class_name) ||
                   (GUILD_DB[n]?.class_name === '드루이드' && rbGetSpec(n) === '조화') ||
                   (GUILD_DB[n]?.class_name === '주술사' && rbGetSpec(n) === '정기')),
  },
  {
    title: '야성 시너지',
    label: '야성 드루이드 + 딜러',
    scope: '파티 한정',
    color: '#ff7d0a',
    desc: '변신 유지만으로 파티 딜러 전체에 치명타 +5% 오라를 상시 제공합니다. 근접·원거리 구분이 없습니다.',
    skills: '무리의 우두머리: 근접·원거리 치명타 +5%\n(시전 없이 야수 변신 유지만으로 발동)',
    check: ns => ns.some(n => GUILD_DB[n]?.class_name === '드루이드' && rbGetSpec(n) === '야성') &&
                 ns.some(n => rbGetRole(n) === '딜러'),
  },
  {
    title: '주문 시너지',
    label: '조화 드루이드 + 주문 딜러',
    scope: '파티 한정',
    color: '#ff7d0a',
    desc: '달빛야수 변신 오라로 파티 주문 딜러 전체의 크리티컬 확률을 쿨다운 없이 상시 높입니다.',
    skills: '달빛야수 변신: 주문 극대화 +5%\n(변신 유지 중 파티 주문 딜러 전체 상시 적용)',
    check: ns => {
      const hasBal    = ns.some(n => GUILD_DB[n]?.class_name === '드루이드' && rbGetSpec(n) === '조화');
      const hasCaster = ns.some(n => ['마법사','흑마법사'].includes(GUILD_DB[n]?.class_name) ||
        (GUILD_DB[n]?.class_name === '사제' && rbGetSpec(n) === '암흑') ||
        (GUILD_DB[n]?.class_name === '주술사' && rbGetSpec(n) === '정기'));
      return hasBal && hasCaster;
    },
  },
  {
    title: '힐 시너지',
    label: '회복 드루이드 + 힐러',
    scope: '파티 한정',
    color: '#ff7d0a',
    desc: '생명의 나무 변신이 파티 힐러 전체의 치유량에 드루이드 정신력의 25%를 고정 추가합니다.',
    skills: '생명의 나무: 힐러 치유량 +정신력 25%\n(드루이드 정신력이 높을수록 보너스 증가)',
    check: ns => ns.some(n => GUILD_DB[n]?.class_name === '드루이드' && rbGetSpec(n) === '회복') &&
                 ns.some(n => rbGetRole(n) === '힐러' && GUILD_DB[n]?.class_name !== '드루이드'),
  },
];

function rbShowBuffTT(k, e) {
  const def = RB_SYNERGY_DEFS[k];
  if (!def) return;
  const tt = document.getElementById('tooltip');
  const scopeLabel = def.scope === 'raid' ? '공대 전체' : def.scope === 'target' ? '대상 디버프' : '파티 한정';
  const scopeColor = def.scope === 'raid' ? '#e8a84a' : def.scope === 'target' ? '#d46c6c' : '#7ab8d4';
  const displayName = def.wowName || def.name;
  const displayDesc = (def.talentDesc || def.desc || '').replace(/\\n/g, '<br>');
  tt.innerHTML =
    `<div class="tt-name" style="color:${def.color}">${displayName}</div>` +
    `<div class="tt-combo-scope" style="color:${scopeColor}">${scopeLabel}</div>` +
    `<hr class="tt-sep">` +
    `<div class="tt-combo-desc">${displayDesc}</div>`;
  tt.classList.add('show');
  moveTT(e);
}

function rbBuffChipHTML(k) {
  const pl = RB_PLAIN[k];
  const def = RB_SYNERGY_DEFS[k];
  const label = pl ? pl.short : (def?.name || k);
  const color = def?.color || '#aaa';
  const iconHtml = pl?.icon
    ? `<img class="rb-buff-icon" src="${_WH_ICON}${pl.icon}.jpg" onerror="this.style.display='none'" alt="">`
    : '';
  const hasTT = def?.desc ? `onmouseenter="rbShowBuffTT(${typeof k==='number'?k:`'${k}'`},event)" onmousemove="moveTT(event)" onmouseleave="hideTT()"` : '';
  return `<span class="rb-buff-chip" style="color:${color}" ${hasTT}>${iconHtml}${label}</span>`;
}

function rbShowComboTT(idx, e) {
  const c = RB_CLASS_COMBOS[idx];
  if (!c?.desc) return;
  const tt = document.getElementById('tooltip');
  const scopeColor = c.scope === '공대 전체' ? '#e8a84a' : '#7ab8d4';
  tt.innerHTML =
    `<div class="tt-name" style="color:${c.color}">${c.title}</div>` +
    `<div class="tt-combo-scope" style="color:${scopeColor}">${c.scope}</div>` +
    `<div class="tt-combo-label" style="color:${c.color};font-size:10.5px;margin-top:2px">${c.label}</div>` +
    `<hr class="tt-sep">` +
    `<div class="tt-combo-desc">${c.desc}</div>` +
    `<hr class="tt-sep">` +
    `<div class="tt-skill-summary">${(c.skills||'').replace(/\n/g,'<br>')}</div>`;
  tt.classList.add('show');
  moveTT(e);
}

function rbClassSynergyHTML(names) {
  const matched = RB_CLASS_COMBOS.map((c, i) => ({ c, i })).filter(({ c }) => c.check(names));
  if (!matched.length) return '';
  const rows = matched.map(({ c, i }) =>
    `<div class="rb-combo-row"
      onmouseenter="rbShowComboTT(${i},event)"
      onmousemove="moveTT(event)"
      onmouseleave="hideTT()">
      <span class="rb-combo-dot" style="background:${c.color}"></span>
      <span class="rb-combo-label" style="color:${c.color}">${c.title}</span>
    </div>`
  ).join('');
  return `<div class="rb-party-lbl">클래스 시너지</div>${rows}`;
}

// ── HTML 생성 ─────────────────────────────────────────────────

function rbMemberCardHTML(name, inPool) {
  const gm = GUILD_DB[name] || {};
  const cls = gm.class_name || '';
  const clsId = gm.class_id || 0;
  const spec = rbGetSpec(name) || '';
  const role = rbGetRole(name);
  const ks = rbGetKeyStat(name);
  const gs = Math.round(STATS_DB_V2[name]?.gear_score || 0);
  const color = CLASS_COLOR[clsId] || '#888';
  const assigned = rbIsAssigned(name);

  const roleCls = `rb-role-${role}`;
  const safeN = name.replace(/'/g, "\\'");

  if (inPool) {
    const soopImg = window._soopMap?.[name]?.profile_img || '';
    const avatarSrc = soopImg || gm.avatar_img || '';
    const emoji = CHAR_DB?.[name]?.emoji || '⚔';
    const avatarHtml = avatarSrc
      ? `<img class="rb-mc-avatar" src="${avatarSrc}" alt="${name}" onerror="this.style.display='none'">`
      : `<div class="rb-mc-avatar rb-mc-avatar-ph" style="background:${color}1a;border-color:${color}55">${emoji}</div>`;
    return `<div class="rb-mc ${assigned ? 'rb-mc-assigned' : ''}"
      draggable="${!assigned}"
      ondragstart="rbDragStart(event,'${safeN}',null,null)"
      ondragend="rbDragEnd(event)">
      ${avatarHtml}
      <span class="rb-mc-name" style="color:var(--text)">${name}</span>
      <span class="rb-mc-cls" style="color:${color}">${cls}</span>
      <span class="rb-mc-spec">${spec}</span>
      <span class="rb-role-badge ${roleCls}">${role}</span>
      <span class="rb-mc-gs">GS ${gs}</span>
      <span class="rb-mc-bis" onmouseenter="stShowItemPopup('${safeN}',event)" onmousemove="stMoveItemPopup(event)" onmouseleave="stHideItemPopup()">BIS</span>
    </div>`;
  } else {
    const soopImg2 = window._soopMap?.[name]?.profile_img || '';
    const avatarSrc2 = soopImg2 || gm.avatar_img || '';
    const emoji2 = CHAR_DB?.[name]?.emoji || '⚔';
    const slotAvatarHtml = avatarSrc2
      ? `<img class="st-rank-avatar rb-slot-avatar" src="${avatarSrc2}" alt="${name}" style="border-color:${color}" onerror="this.style.display='none'">`
      : `<div class="st-rank-avatar-empty rb-slot-avatar" style="border-color:${color}">${emoji2}</div>`;
    return `${slotAvatarHtml}
      <div class="rb-mc-info" style="flex:1;min-width:0;overflow:hidden">
        <div class="st-rank-name">${name}</div>
        <div class="st-rank-meta" style="color:${color}">${cls}${spec ? ' · ' + spec : ''}</div>
      </div>
      <span class="rb-role-badge ${roleCls}">${role}</span>
      <span style="font-size:11px;color:var(--text3);flex-shrink:0">GS ${gs}</span>`;
  }
}

function rbGroupHTML(gi) {
  const group = _rbGroups[gi];
  const filled = group.filter(Boolean).length;

  const slots = group.map((name, si) => {
    if (name) {
      const safeName = name.replace(/'/g, "\\'");
      return `<div class="rb-slot rb-slot-filled"
        draggable="true"
        ondragstart="rbDragStart(event,'${safeName}',${gi},${si})"
        ondragend="rbDragEnd(event)"
        ondragover="rbDragOver(event)"
        ondragleave="rbDragLeave(event)"
        ondrop="rbDrop(event,${gi},${si})">
        ${rbMemberCardHTML(name, false)}
        <button class="rb-slot-rm" onclick="rbRemoveFromSlot(${gi},${si})" title="제거">×</button>
      </div>`;
    }
    return `<div class="rb-slot rb-slot-empty"
      ondragover="rbDragOver(event)"
      ondragleave="rbDragLeave(event)"
      ondrop="rbDrop(event,${gi},${si})">
      <span class="rb-slot-hint">슬롯 ${si + 1}</span>
    </div>`;
  }).join('');

  const synHtml = rbGroupSynergyHTML(gi);
  const comboHtml = rbGroupComboHTML(gi);

  return `<div class="rb-group">
    <div class="rb-group-left">
      <div class="rb-group-hd">
        공대 ${gi + 1}
        <span class="rb-group-cnt">${filled}/5</span>
      </div>
      <div class="rb-group-slots">${slots}</div>
      ${comboHtml}
    </div>
    <div class="rb-group-right">
      ${synHtml}
    </div>
  </div>`;
}

// ── 시너지 카테고리 정의 ─────────────────────────────────────
const RB_CATS = [
  {
    id:'melee', label:'물리 전투',
    tip:'근접·원거리 딜러 공격력·치명타 강화',
    keys:['바람힘 토템', 30811, '전투의 외침', '대지의 힘 토템', '허공의 은총 토템',
          17007, 34460, 19506],
  },
  {
    id:'spell', label:'마법 전투',
    tip:'주문 딜러 주문력·치명타 강화',
    keys:[24858, '파멸의 바람 토템', 30706, 34914, 20218],
  },
  {
    id:'sustain', label:'회복 / 마나',
    tip:'힐 효율 향상, 마나 회복, 시전 방해 차단',
    keys:['마나 샘 토템', 16190, 10060, '활력'],
  },
  {
    id:'haste', label:'공속 / 가속',
    tip:'공격속도·주문속도 증가 버프',
    keys:['피의 흥분', '응보의 오라'],
  },
  {
    id:'survival', label:'생존 / 방어',
    tip:'체력·방어도·저항 증가, 전투 부활, 위협 감소',
    keys:['야생의 표식', '성기사 축복', 25895, '소생', '강령석', '빠른 귀환'],
  },
];

// ── 적 디버프 카테고리 ───────────────────────────────────────
const RB_DEBUFF_CATS = [
  {
    id:'phys_debuff', label:'물리 디버프',
    tip:'적 방어도·공격력·적중 감소, 물리 피해 증폭',
    keys:['방어구 약화', '갑옷 노출', '요정의 불꽃', 33602, '사냥꾼의 낙인',
          '사기 저하의 외침', '천둥 강타', 34503, 29859, 3043, 20337],
  },
  {
    id:'magic_debuff', label:'마법 디버프',
    tip:'적 마법 저항 감소, 주문 피해 증폭',
    keys:['원소의 저주', '무모함의 저주', 30909, 32484, 28595, 15334, 33195],
  },
];

const _RB_CLASS_ORDER = ['전사','성기사','사냥꾼','도적','사제','주술사','마법사','흑마법사','드루이드'];

function rbGroupSynergyHTML(gi) {
  const names = _rbGroups[gi].filter(Boolean)
    .slice().sort((a, b) => {
      const ai = _RB_CLASS_ORDER.indexOf(GUILD_DB[a]?.class_name);
      const bi = _RB_CLASS_ORDER.indexOf(GUILD_DB[b]?.class_name);
      return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
    });
  if (!names.length) return '<div class="rb-syn-empty">멤버 배치 후 표시</div>';

  const warns = [];
  const shamanCount = names.filter(n => GUILD_DB[n]?.class_name === '주술사').length;
  if (shamanCount >= 2) warns.push(`⚠ 주술사 ${shamanCount}명`);
  const warnHtml = warns.map(w => `<div class="rb-cat-warn">${w}</div>`).join('');

  const seen = new Set();
  const chips = [];
  for (const n of names) {
    for (const k of (rbGetSpecInfo(n)?.provides || [])) {
      if (seen.has(k) || RB_SYNERGY_DEFS[k]?.scope !== 'party') continue;
      seen.add(k);
      chips.push(rbBuffChipHTML(k));
    }
  }

  const body = chips.length
    ? chips.join('')
    : '<span class="rb-cat-none">파티 버프 없음</span>';

  const groupProvides = rbCollectProvides(names);

  const renderRaidCats = (cats) => {
    let out = '';
    for (const cat of cats) {
      const items = cat.keys.filter(k => groupProvides.has(k) && RB_SYNERGY_DEFS[k]?.scope !== 'party');
      if (!items.length) continue;
      const chips = items.map(k => rbBuffChipHTML(k)).join('');
      out += `<div class="rb-sum-cat-row">
        <span class="rb-cat-label" title="${cat.tip}">${cat.label}</span>
        <div class="rb-buff-chips">${chips}</div>
      </div>`;
    }
    return out;
  };

  const raidBuffHtml = renderRaidCats(RB_CATS)
    || '<span class="rb-cat-none">없음</span>';
  const debuffHtml = renderRaidCats(RB_DEBUFF_CATS)
    || '<span class="rb-cat-none">없음</span>';

  return `${warnHtml}` +
    `<div class="rb-party-lbl">파티 버프</div><div class="rb-buff-chips">${body}</div>` +
    `<div class="rb-sum-section-lbl">공대 전체 버프</div>${raidBuffHtml}` +
    `<div class="rb-sum-section-lbl rb-sum-section-debuff">적 디버프</div>${debuffHtml}`;
}

function rbGroupComboHTML(gi) {
  const names = _rbGroups[gi].filter(Boolean);
  if (!names.length) return '';
  return rbClassSynergyHTML(names);
}

function rbRaidCheckHTML() {
  const allNames = _rbGroups.flat().filter(Boolean);
  const total = allNames.length;
  const roleCount = {};
  allNames.forEach(n => { const r = rbGetRole(n); roleCount[r] = (roleCount[r]||0)+1; });

  return `<div class="rb-raid-counts">
    <span class="rb-total-cnt">${total}<span class="rb-total-of">/25</span></span>
    <span class="rb-role-cnt" style="color:#d4918e">딜 ${roleCount['딜러']||0}</span>
    <span class="rb-role-cnt" style="color:#7bb899">힐 ${roleCount['힐러']||0}</span>
    <span class="rb-role-cnt" style="color:#7a9fd4">탱 ${roleCount['탱커']||0}</span>
  </div>`;
}

// ── 렌더 ──────────────────────────────────────────────────────

function rbRender() {
  rbRenderPool();
  rbRenderGroups();
  rbRenderRaidCheck();
}

function rbInitCombosPanel() {
  const el = document.getElementById('rbRaidCombos');
  if (!el) return;
  el.innerHTML = RB_CLASS_COMBOS.map((c, i) =>
    `<div class="rb-combo-row"
      onmouseenter="rbShowComboTT(${i},event)"
      onmousemove="moveTT(event)"
      onmouseleave="hideTT()">
      <span class="rb-combo-dot" style="background:${c.color}"></span>
      <span class="rb-combo-label" style="color:${c.color}">${c.title}</span>
    </div>`
  ).join('');
}

function rbPoolRowHTML(name, idx) {
  const gm = GUILD_DB[name] || {};
  const clsId = gm.class_id || 0;
  const color = CLASS_COLOR[clsId] || '#888';
  const cls = gm.class_name || '';
  const spec = rbGetSpec(name) || '';
  const secSpec = rbGetSecondarySpec(name) || '';
  const role = rbGetRole(name);
  const gs = Math.round(STATS_DB_V2[name]?.gear_score || 0);
  const assigned = rbIsAssigned(name);
  const safeN = name.replace(/'/g, "\\'");
  const roleCls = `rb-role-${role}`;
  const numCls = idx === 1 ? 'r1' : idx === 2 ? 'r2' : idx === 3 ? 'r3' : '';

  const soopImg = window._soopMap?.[name]?.profile_img || '';
  const avatarSrc = soopImg || gm.avatar_img || '';
  const emoji = CHAR_DB?.[name]?.emoji || '⚔';
  const avatarHtml = avatarSrc
    ? `<img class="st-rank-avatar" src="${avatarSrc}" alt="${name}" style="border-color:${color}" onerror="this.style.display='none'">`
    : `<div class="st-rank-avatar-empty" style="border-color:${color}">${emoji}</div>`;

  return `<tr class="rb-pool-row${assigned ? ' rb-pool-row-assigned' : ''}"
    draggable="${!assigned}"
    ondragstart="rbDragStart(event,'${safeN}',null,null)"
    ondragend="rbDragEnd(event)">
    <td class="num ${numCls}">${idx}</td>
    <td class="img-col">${avatarHtml}</td>
    <td class="nick-col">
      <div class="st-rank-name">${name}</div>
      <div class="st-rank-meta" style="color:${color}">${cls}</div>
    </td>
    <td class="rb-spec-col" style="font-size:12px;color:var(--text2)">${spec}</td>
    <td class="rb-spec-col" style="font-size:12px;color:var(--text3)">${secSpec}</td>
    <td style="text-align:center"><span class="rb-role-badge ${roleCls}">${role}</span></td>
    <td style="text-align:center;font-size:13px;color:var(--text2)">${gs.toLocaleString()}</td>
    <td style="text-align:center"><span class="rb-mc-bis" onmouseenter="stShowItemPopup('${safeN}',event)" onmousemove="stMoveItemPopup(event)" onmouseleave="stHideItemPopup()">BIS</span></td>
  </tr>`;
}

function rbRenderPool() {
  const el = document.getElementById('rbPoolList');
  if (!el) return;

  const { ranks, role, cls } = _rbPoolFilter;
  let names = Object.keys(GUILD_DB).filter(n => {
    const gm = GUILD_DB[n];
    if (ranks.size > 0 && !ranks.has(gm.rank_name)) {
      if (!(gm.rank_name === '길드마스터' && ranks.has('버튜버'))) return false;
    }
    if (role !== 'all' && rbGetRole(n) !== role) return false;
    if (cls !== 'all' && gm.class_name !== cls) return false;
    return true;
  });

  names.sort((a, b) => {
    const aA = rbIsAssigned(a), bA = rbIsAssigned(b);
    if (aA !== bA) return aA ? 1 : -1;
    return (STATS_DB_V2[b]?.gear_score || 0) - (STATS_DB_V2[a]?.gear_score || 0);
  });

  if (!names.length) {
    el.innerHTML = '<div style="font-size:11px;color:var(--text3);text-align:center;padding:20px">해당 조건의 멤버 없음</div>';
    return;
  }

  const rows = names.map((n, i) => rbPoolRowHTML(n, i + 1)).join('');
  el.innerHTML = `<div class="st-rank-table-wrap">
    <table class="st-rank-table title_rnk_tbl rb-pool-table">
      <thead><tr>
        <th class="num">#</th>
        <th class="img-col"></th>
        <th class="nick-col">닉네임</th>
        <th class="rb-spec-col" style="white-space:nowrap">활성특성</th>
        <th class="rb-spec-col" style="white-space:nowrap">부특성</th>
        <th style="text-align:center;white-space:nowrap">역할</th>
        <th style="text-align:center;white-space:nowrap">GS</th>
        <th style="text-align:center">BIS</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

function rbRenderGroups() {
  const grid = document.getElementById('rbGroupsGrid');
  if (!grid) return;
  grid.innerHTML = _rbGroups.map((_, gi) => rbGroupHTML(gi)).join('');
}

function rbRenderRaidCheck() {
  const el = document.getElementById('rbRaidCheck');
  if (el) el.innerHTML = rbRaidCheckHTML();
}

// ── 필터 ──────────────────────────────────────────────────────

function rbSetPoolFilter(type, val) {
  if (type === 'rank') {
    if (val === 'all') {
      _rbPoolFilter.ranks = new Set();
    } else {
      if (_rbPoolFilter.ranks.has(val)) _rbPoolFilter.ranks.delete(val);
      else _rbPoolFilter.ranks.add(val);
    }
    document.querySelectorAll(`.rb-filter-btn[data-ftype="rank"]`).forEach(b => {
      const bv = b.dataset.fval;
      b.classList.toggle('active', bv === 'all' ? _rbPoolFilter.ranks.size === 0 : _rbPoolFilter.ranks.has(bv));
    });
  } else {
    _rbPoolFilter[type] = val;
    document.querySelectorAll(`.rb-filter-btn[data-ftype="${type}"]`).forEach(b => {
      b.classList.toggle('active', b.dataset.fval === val);
    });
  }
  rbRenderPool();
}

// ── 등급 필터 버튼 빌드 ──────────────────────────────────────

function rbBuildRankFilters() {
  const el = document.getElementById('rbRankFilters');
  if (!el) return;
  const SHOW_RANKS = new Set(['버튜버','고정멤버']);
  const allRanks = [...new Set(Object.values(GUILD_DB).map(g => g.rank_name).filter(Boolean))];
  const order = ['버튜버', '고정멤버'];
  const ranks = allRanks.filter(r => SHOW_RANKS.has(r)).sort((a, b) => {
    const ai = order.indexOf(a), bi = order.indexOf(b);
    return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
  });
  el.innerHTML = ranks.map(r =>
    `<button class="rb-filter-btn${_rbPoolFilter.ranks.has(r) ? ' active' : ''}" data-ftype="rank" data-fval="${r}"
      onclick="rbSetPoolFilter('rank','${r}')">${r}</button>`
  ).join('');
}

// ── 직업 필터 버튼 빌드 ──────────────────────────────────────

function rbBuildClassFilters() {
  const el = document.getElementById('rbClassFilters');
  if (!el) return;
  const classMap = {};
  Object.values(GUILD_DB).forEach(gm => {
    if (gm.class_name && gm.class_id) classMap[gm.class_name] = gm.class_id;
  });
  const ORDER = ['전사','성기사','사냥꾼','도적','사제','주술사','마법사','흑마법사','드루이드'];
  const classes = Object.keys(classMap).sort((a, b) => {
    const ai = ORDER.indexOf(a), bi = ORDER.indexOf(b);
    return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
  });
  el.innerHTML =
    `<button class="rb-filter-btn${_rbPoolFilter.cls === 'all' ? ' active' : ''}" data-ftype="cls" data-fval="all" onclick="rbSetPoolFilter('cls','all')">전체</button>` +
    classes.map(c => {
      const color = CLASS_COLOR[classMap[c]] || '#888';
      return `<button class="rb-filter-btn${_rbPoolFilter.cls === c ? ' active' : ''}" data-ftype="cls" data-fval="${c}" onclick="rbSetPoolFilter('cls','${c}')" style="--cls-color:${color}">${c}</button>`;
    }).join('');
}

// ── 초기화 ────────────────────────────────────────────────────

function initRaidBuilder() {
  if (!_rbInitialized) {
    rbBuildRankFilters();
    rbBuildClassFilters();
    // 풀 영역: 드래그해서 빼기 (풀로 돌아가기)
    const pool = document.getElementById('rbPoolList');
    if (pool) {
      pool.addEventListener('dragover', e => { e.preventDefault(); pool.classList.add('drag-over'); });
      pool.addEventListener('dragleave', () => pool.classList.remove('drag-over'));
      pool.addEventListener('drop', rbDropToPool);
    }
    rbInitCombosPanel();
    _rbInitialized = true;
  }
  rbRender();
}
