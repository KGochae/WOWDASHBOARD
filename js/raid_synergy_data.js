/* ===== raid_synergy_data.js =====
 * TBC 불타는 성전 기념서버 25인 레이드 시너지 데이터
 * scope: 'raid'=전체 | 'party'=파티 | 'target'=대상
 * type:  'buff'=아군강화 | 'debuff'=적약화 | 'utility'=유틸
 * key 규칙: 탤런트는 tbc_talents.json maxRank spellId, 기본기는 한국어명
 */

const RB_SYNERGY_DEFS = {

  // ── 탤런트 기반 버프 ─────────────────────────────────────────
  // tbc_talents.json maxRank 기준 (key = spellId)

  19506: {
    name: '정조준 오라',
    desc: '파티원 전투력 증가 (파티, 활성 지속)',
    talentDesc: '45미터 반경 내에 있는 파티원의 전투력이 50만큼 증가합니다. 활성화되어 있는 동안 지속됩니다.',
    type: 'buff', scope: 'party',
    color: '#aad372', priority: 2,
  },
  20218: {
    name: '고결의 오라',
    desc: '신성 공격력 +10% (파티)',
    talentDesc: '30미터 반경 내에 있는 파티원의 신성 공격력을 10%만큼 증가시킵니다. 오라는 성기사마다 동시에 하나만 유지할 수 있습니다.',
    type: 'buff', scope: 'party',
    color: '#ffe898', priority: 1,
  },
  30706: {
    name: '격노의 토템',
    desc: '주문 적중·극대화 +3% (파티)',
    talentDesc: '시전자의 위치에 격노의 토템을 소환하여 주위 20미터 반경 내에 있는 모든 파티원의 주문 적중률과 주문이 극대화 효과를 발휘할 확률을 3%만큼 증가시킵니다. 2분 동안 지속됩니다.',
    type: 'buff', scope: 'party',
    color: '#ff8844', priority: 3,
  },
  16190: {
    name: '마나 해일 토템',
    desc: '파티 마나 6%/3초, 12초간 (파티)',
    talentDesc: '시전자의 위치에 마나 해일 토템을 소환하여 주위 20미터 반경 내의 파티원의 마나를 매 3초마다 전체 마나의 6%만큼 회복시킵니다. 12초 동안 지속됩니다.',
    type: 'utility', scope: 'party',
    color: '#66aaee', priority: 2,
  },
  28595: {
    name: '혹한의 추위',
    desc: '냉기 극대화 +2%/중첩, 최대 5중첩 +10% (대상)',
    talentDesc: '냉기 공격 주문 사용 시 100%의 확률로 혹한의 추위 효과를 얻게 됩니다. 혹한의 추위 효과는 15초 동안 냉기 주문이 극대화 효과를 발휘할 확률을 2%만큼 증가시킵니다. 효과는 5번까지 중복될 수 있습니다.',
    type: 'debuff', scope: 'target',
    color: '#69ccf0', priority: 2,
  },
  34460: {
    name: '야성의 감응',
    desc: '야수 치명타 시 공격력 +3%, 10초 (파티)',
    talentDesc: '야수의 공격이 치명타로 적중하면 10초 동안 모든 파티원의 공격력이 3%만큼 증가합니다.',
    type: 'buff', scope: 'party',
    color: '#aad372', priority: 2,
  },
  17007: {
    name: '무리의 우두머리',
    desc: '근접·원거리 치명타 +5% (파티)',
    talentDesc: '표범이나 곰, 광포한 곰 변신 상태에서 주위 45미터 반경 내에 있는 모든 파티원의 원거리 및 근접 치명타 적중률이 5%만큼 증가합니다.',
    type: 'buff', scope: 'party',
    color: '#ff7c0a', priority: 2,
  },
  30811: {
    name: '해방된 분노',
    desc: '근접 치명타 시 전투력 +10%, 10초 (파티)',
    talentDesc: '근접 치명타 적중 시 20미터 반경 내의 모든 파티원의 근접 전투력을 10%만큼 증가시킵니다. 10초 동안 지속됩니다.',
    type: 'buff', scope: 'party',
    color: '#0070de', priority: 3,
  },
  34914: {
    name: '흡혈의 손길',
    desc: '암흑 피해 5% → 파티 마나 회복 (파티)',
    talentDesc: '대상을 암흑의 기운으로 감싸 대상에게 15초에 걸쳐 450의 암흑 피해를 입히고 자신이 입히는 암흑 주문 피해의 5%만큼 모든 파티원의 마나를 회복시킵니다.',
    type: 'buff', scope: 'party',
    color: '#8866aa', priority: 3,
  },
  15286: {
    name: '흡혈의 선물',
    desc: '암흑 피해 15% → 파티 체력 회복 (파티)',
    talentDesc: '대상을 암흑의 기운으로 감싸 자신이 입히는 암흑 주문 피해의 15%만큼 모든 파티원의 생명력을 회복시킵니다. 1분 동안 지속됩니다.',
    type: 'buff', scope: 'party',
    color: '#8866aa', priority: 1,
  },
  33891: {
    name: '생명의 나무',
    desc: '파티 치유 효과 +정신력 25% (파티)',
    talentDesc: '생명의 나무로 변신합니다. 이 동안은 45미터 반경 내에 있는 파티원이 받는 치유 효과가 자신의 총 정신력의 25%만큼 증가하고 자신의 이동 속도는 20%만큼 감소합니다.',
    type: 'buff', scope: 'party',
    color: '#ff7c0a', priority: 2,
  },
  10060: {
    name: '마력 주입',
    desc: '주문 시전속도 +20%, 마나 -20%, 15초',
    talentDesc: '대상에게 마력을 주입하여 주문 시전 속도를 20%만큼 증가시키고 주문 시전에 필요한 마나를 20%만큼 감소시킵니다. 15초 동안 지속됩니다.',
    type: 'utility', scope: 'raid',
    color: '#c2d6e8', priority: 2,
  },
  15334: {
    name: '어둠의 매듭',
    desc: '암흑 피해 취약 +2%/중첩, 최대 5중첩 +10% (대상)',
    talentDesc: '암흑 계열 공격 주문 사용 시 100%의 확률로 대상이 받는 암흑 피해를 15초 동안 2%만큼 증가시킵니다. 최대 5번까지 중복됩니다.',
    type: 'debuff', scope: 'target',
    color: '#8866aa', priority: 2,
  },
  33195: {
    name: '불행',
    desc: '모든 주문 피해 +5% (대상)',
    talentDesc: '어둠의 권능: 고통, 정신의 채찍, 흡혈의 손길 사용 시 추가로 대상이 받는 모든 주문 피해가 5%만큼 증가하도록 만듭니다.',
    type: 'debuff', scope: 'target',
    color: '#8866aa', priority: 3,
  },
  34503: {
    name: '결점 노출',
    desc: '치명타 시 사냥꾼 민첩 25% → 전투력, 7초 (대상)',
    talentDesc: '원거리 공격이 치명타로 적중했을 때 100%의 확률로 적이 7초 동안 결점 노출에 걸리게 됩니다. 결점 노출이 걸린 적을 공격하는 이는 전투력이 사냥꾼의 민첩성의 25%만큼 증가합니다.',
    type: 'debuff', scope: 'target',
    color: '#aad372', priority: 2,
  },
  24858: {
    name: '달빛야수 변신',
    desc: '파티 주문 극대화 +5% (파티)',
    talentDesc: '달빛야수의 모습으로 변신합니다. 30미터 반경의 모든 파티원의 주문 극대화 확률이 5%만큼 증가합니다.',
    type: 'buff', scope: 'party',
    color: '#ff7c0a', priority: 3,
  },
  33182: {
    name: '천상의 정신 연마',
    desc: '정신력 + 주문력/치유량 (대상 정신력 10%)',
    talentDesc: '신성한 정신, 신의 권능: 인내, 신성 보호의 기원, 정신력의 기원, 암흑 보호의 기원의 효과로 부여되는 정신력이 25%만큼 증가하며 시전자가 정신력의 기원 또는 신성한 정신을 시전했을 때 대상의 주문 공격력 및 치유 효과가 시전자 정신력의 10%만큼 추가로 증가합니다.',
    type: 'buff', scope: 'party',
    color: '#c2d6e8', priority: 2,
  },

  // ── 기본기 버프 (전체) ────────────────────────────────────────
  // tbc_talents.json 미수록 기본 주문/능력 (key = 한국어명)

  '신비한 광휘': {
    name: '신비한 광휘',
    desc: '지능 +31, 주문 치명타 +3% (파티)',
    wowName: '신비한 총명함',
    talentDesc: '대상 파티원에게 총명한 기운을 불어넣어 1시간 동안 지능을 40만큼 증가시킵니다.',
    type: 'buff', scope: 'party',
    color: '#69ccf0', priority: 2,
  },
  '강인함': {
    name: '강인함',
    desc: '체력 +79 (파티)',
    wowName: '신의 권능: 인내',
    talentDesc: '대상에 신성한 힘을 불어넣어 30분 동안 체력을 79만큼 증가시킵니다.',
    type: 'buff', scope: 'party',
    color: '#c2d6e8', priority: 2,
  },
  '야생의 표식': {
    name: '야생의 표식',
    desc: '전 능력치 +14, 방어도 +285, 저항 +18 (전체)',
    wowName: '야생의 징표',
    talentDesc: '30분 동안 대상의 방어도를 340만큼, 모든 능력치를 14만큼, 모든 저항력을 25만큼 증가시킵니다.',
    type: 'buff', scope: 'raid',
    color: '#ff7c0a', priority: 2,
  },
  '명령의 외침': {
    name: '명령의 외침',
    desc: '최대 생명력 +1080 (파티)',
    wowName: '지휘의 외침',
    talentDesc: '주위 20미터 반경에 있는 파티원의 최대 생명력을 1080만큼 증가시킵니다. 2분 동안 지속됩니다.',
    type: 'buff', scope: 'party',
    color: '#c69b3a', priority: 1,
  },
  '어둠의 저항': {
    name: '어둠의 저항',
    desc: '어둠 저항 +70 (파티)',
    wowName: '암흑 보호의 기원',
    talentDesc: '대상의 모든 파티원에게 성스러운 기운을 불어넣어 20분 동안 암흑 저항력을 60만큼 증가시킵니다.',
    type: 'buff', scope: 'party',
    color: '#c2d6e8', priority: 1,
  },
  '신성한 정신': {
    name: '신성한 정신',
    desc: '정신 +50 (파티)',
    wowName: '정신력의 기원',
    talentDesc: '대상의 모든 파티원에게 성스러운 기운을 불어넣어 1시간 동안 정신력을 50만큼 증가시킵니다.',
    type: 'buff', scope: 'party',
    color: '#c2d6e8', priority: 1,
  },
  '소생': {
    name: '소생',
    desc: '전투 중 부활 (전투당 1회)',
    wowName: '환생',
    talentDesc: '죽은자의 영혼을 육체로 불러들여 3200의 생명력과 3200의 마나를 지닌채 살아나게 합니다.',
    type: 'utility', scope: 'raid',
    color: '#ff7c0a', priority: 3,
  },
  '강령석': {
    name: '강령석',
    desc: '전투 부활 대기 (전투당 1회)',
    wowName: '영혼석 부활',
    talentDesc: '대상의 영혼을 보관합니다. 만약 영혼이 보관된 상태에서 대상이 죽게 되면 2900의 생명력과 3300의 마나를 지닌 채로 살아날 수 있습니다.',
    type: 'utility', scope: 'raid',
    color: '#9482c9', priority: 2,
  },

  // ── 성기사 축복 / 심판 ────────────────────────────────────────

  '성기사 축복': {
    name: '성기사 축복',
    desc: '왕의 축복 전능력치 +10% / 힘의 축복 +220AP / 지혜의 축복 마나15/5s (전체)',
    wowName: '상급 성기사 축복',
    talentDesc: '[상급 왕의 축복] 공격대나 파티 중 대상과 같은 직업을 가진 대원에게 왕의 축복을 걸어 30분 동안 모든 능력치를 10%만큼 증가시킵니다. 성기사마다 하나의 대상에게 하나의 축복만 효력을 발휘합니다.\n[상급 힘의 축복] 공격대나 파티 중 대상과 같은 직업을 가진 대원에게 힘의 축복을 걸어 30분 동안 전투력을 155만큼 증가시킵니다. 성기사마다 하나의 대상에게 하나의 축복만 효력을 발휘합니다.\n[상급 지혜의 축복] 공격대나 파티 중 대상과 같은 직업을 가진 대원에게 지혜의 축복을 걸어 30분 동안 매 5초마다 30의 마나를 회복시킵니다. 성기사마다 하나의 대상에게 하나의 축복만 효력을 발휘합니다.',
    type: 'buff', scope: 'raid',
    color: '#f48cba', priority: 3,
  },
  25895: {
    name: '상급 구원의 축복',
    desc: '어그로 30% 감소 (공대 내 타겟 직업)',
    talentDesc: '공격대나 파티 중 대상과 같은 직업을 가진 대원에게 구원의 축복을 걸어 30분 동안 위협 수준을 30%만큼 감소시킵니다. 성기사마다 하나의 대상에게 하나의 축복만 효력을 발휘합니다.',
    type: 'utility', scope: 'raid',
    color: '#f48cba', priority: 2,
  },
  '지혜의 심판': {
    name: '지혜의 심판',
    desc: '근접 공격 시 마나 회복',
    wowName: '지혜의 심판',
    talentDesc: '(효과 발동 확률: 50%)',
    type: 'buff', scope: 'target',
    color: '#f4d060', priority: 2,
  },
  '빛의 심판': {
    name: '빛의 심판',
    desc: '근접 공격 시 체력 회복',
    type: 'buff', scope: 'target',
    color: '#f48cba', priority: 1,
  },

  // ── 성기사 오라 ───────────────────────────────────────────────

  '집중의 오라': {
    name: '집중의 오라',
    desc: '시전 방해 확률 70% 감소 (파티)',
    wowName: '집중의 오라',
    talentDesc: '30미터 반경 내의 파티원이 주문을 시전할 때 35%의 확률로 피해로 인한 방해를 받지 않도록 합니다. 성기사마다 하나의 대상에게 하나의 오라만 효력을 발휘합니다.',
    type: 'buff', scope: 'party',
    color: '#f4d0f0', priority: 2,
  },
  '헌신의 오라': {
    name: '헌신의 오라',
    desc: '방어도 +1750 (파티)',
    wowName: '기원의 오라',
    talentDesc: '주위 30미터 반경에 있는 파티원의 방어도가 861만큼 상승합니다. 오라는 성기사마다 동시에 하나만 유지할 수 있습니다.',
    type: 'buff', scope: 'party',
    color: '#f48cba', priority: 1,
  },
  '응보의 오라': {
    name: '응보의 오라',
    desc: '피격 시 신성 피해 반사, 파티 피해량 +2% (파티)',
    wowName: '응보의 오라',
    talentDesc: '주위 30 미터 반경에 있는 파티원을 공격하는 모든 생물에게 26의 신성 피해를 입힙니다. 오라는 성기사마다 동시에 하나만 유지할 수 있습니다.',
    type: 'buff', scope: 'party',
    color: '#ffe898', priority: 1,
  },

  // ── 주술사 토템 ───────────────────────────────────────────────

  '바람힘 토템': {
    name: '바람힘 토템',
    desc: '근접 공격 16% 확률 추가 2회 +445AP (파티)',
    wowName: '질풍의 토템',
    talentDesc: '시전자의 위치에 5의 생명력을 지닌 질풍의 토템을 소환하여 주위 20미터 반경 내에 있는 모든 파티원의 주무기에 바람의 기운을 불어 넣게 합니다. 질풍의 무기는 20%의 확률로 445의 추가 전투력으로 적에게 1회의 추가 공격을 합니다. 2분 동안 지속됩니다.',
    type: 'buff', scope: 'party',
    color: '#0070de', priority: 3,
  },
  '파멸의 바람 토템': {
    name: '파멸의 바람 토템',
    desc: '주문력·치유 +101 (파티)',
    wowName: '천벌의 토템',
    talentDesc: '시전자의 위치에 5의 생명력을 지닌 천벌의 토템을 소환하여 주위 20미터 반경 내에 있는 파티원의 모든 주문 및 효과의 공격력 및 치유량을 최대 101만큼 증가시킵니다. 2분 동안 지속됩니다.',
    type: 'buff', scope: 'party',
    color: '#88bbff', priority: 2,
  },
  '마나 샘 토템': {
    name: '마나 샘 토템',
    desc: '마나 50/5초 재생 (파티)',
    wowName: '마나샘 토템',
    talentDesc: '시전자의 위치에 5의 생명력을 지닌 마나샘 토템을 소환하여 주위 20미터 반경 내에 있는 파티원의 마나를 매 2초마다 20만큼 회복시키게 합니다. 2분 동안 지속됩니다.',
    type: 'buff', scope: 'party',
    color: '#66aaee', priority: 2,
  },
  '대지의 힘 토템': {
    name: '대지의 힘 토템',
    desc: '힘·민첩 +86 (파티)',
    wowName: '대지력 토템',
    talentDesc: '시전자의 위치에 5의 생명력을 지닌 대지력 토템을 소환하여 주위 20미터 반경 내의 파티원의 힘을 77만큼 증가시킵니다. 2분 동안 지속됩니다.',
    type: 'buff', scope: 'party',
    color: '#aa8844', priority: 2,
  },
  '허공의 은총 토템': {
    name: '허공의 은총 토템',
    desc: '민첩 +77 (파티)',
    wowName: '은총의 토템',
    talentDesc: '시전자의 위치에 5의 생명력을 지닌 은총의 토템을 소환하여 주위 20미터 반경 내에 있는 파티원의 민첩성을 77만큼 증가시킵니다. 2분 동안 지속됩니다.',
    type: 'buff', scope: 'party',
    color: '#88ccdd', priority: 1,
  },
  '피의 흥분': {
    name: '피의 흥분',
    desc: '공격·주문 가속 +30%, 40초 (공대 전체, 전투당 1회)',
    wowName: '피의 욕망',
    talentDesc: '모든 파티원의 근접 및 원거리 공격 속도를 30%만큼 증가시키고 주문 시전 시간을 30%만큼 단축시킵니다. 40초 동안 지속됩니다.',
    type: 'buff', scope: 'raid',
    color: '#ff4444', priority: 3,
  },

  // ── 적 디버프 ─────────────────────────────────────────────────

  29859: {
    name: '피의 광란',
    desc: '물리 피해 취약 +4% (공대)',
    talentDesc: '피의 광란: 전사의 출혈 효과(찢기 등)가 적용된 대상이 받는 물리 피해가 4%만큼 증가합니다.',
    type: 'debuff', scope: 'target',
    color: '#c69b3a', priority: 2,
  },
  3043: {
    name: '전갈 쐐기',
    desc: '근접/원거리 적중 -5% (대상)',
    talentDesc: '대상에 전갈의 독을 주입하여 30초 동안 근접 및 원거리 명중률을 5%만큼 감소시킵니다.',
    type: 'debuff', scope: 'target',
    color: '#aad372', priority: 2,
  },
  33602: {
    name: '요정의 불꽃 연마',
    desc: '받는 물리 적중 +3% (대상)',
    talentDesc: '요정의 불꽃을 시전한 대상이 받는 물리 적중률이 3%만큼 증가합니다.',
    type: 'debuff', scope: 'target',
    color: '#ff7c0a', priority: 2,
  },
  20337: {
    name: '성전사의 문장 연마',
    desc: '받는 물리/주문 치명타 +3% (대상)',
    talentDesc: '성전사의 문장 효과를 발휘하여 대상이 받는 모든 물리 및 주문 치명타 확률이 3%만큼 증가합니다.',
    type: 'debuff', scope: 'target',
    color: '#f48cba', priority: 2,
  },
  30909: {
    name: '무력화의 저주',
    desc: '근접 전투력 -350 (연마시 -420)',
    talentDesc: '대상에 무력화의 저주를 걸어 2분 동안 근접 전투력을 350만큼 감소시킵니다. 흑마법사마다 한 대상에 하나의 저주만 걸 수 있습니다.',
    type: 'debuff', scope: 'target',
    color: '#9482c9', priority: 2,
  },
  32484: {
    name: '재앙의 저주',
    desc: '원소의 저주 효과 +3% (대상)',
    talentDesc: '재앙의 저주가 적용된 대상은 원소의 저주의 효과가 추가로 3%만큼 증가합니다.',
    type: 'debuff', scope: 'target',
    color: '#9482c9', priority: 2,
  },

  '원소의 저주': {
    name: '원소의 저주',
    desc: '화염·냉기·비전·자연·신성 피해 취약 +13%',
    wowName: '원소의 저주',
    talentDesc: '저주를 걸어 5분 동안 대상의 비전, 화염, 냉기, 암흑 마법에 대한 저항력을 88만큼 감소시키고 받는 비전, 화염, 냉기, 암흑 피해를 10%만큼 증가시킵니다. 흑마법사마다 한 대상에 동시에 하나의 저주만 걸 수 있습니다.',
    type: 'debuff', scope: 'target',
    color: '#9482c9', priority: 3,
  },
  '무모함의 저주': {
    name: '무모함의 저주',
    desc: '방어도 -800, 공격력 +135',
    wowName: '무모함의 저주',
    talentDesc: '무모함의 저주를 걸어 2분 동안 근접 전투력을 135만큼 증가시키고 방어도를 800만큼 감소시킵니다. 이 마법이 지속되는 한 대상은 도망치거나 겁 먹지 않습니다. 흑마법사마다 한 대상에 하나의 저주만 걸 수 있습니다.',
    type: 'debuff', scope: 'target',
    color: '#9482c9', priority: 1,
  },
  '방어구 약화': {
    name: '방어구 약화',
    desc: '방어도 -520/중첩, 최대 5중첩 -2600',
    wowName: '방어구 가르기',
    talentDesc: '적의 방어구를 손상시켜 매 가르기마다 방어도를 520만큼 감소시킵니다. 위협 수준이 크게 증가합니다. 최대 5번까지 중복될 수 있습니다. 30초 동안 지속됩니다.',
    type: 'debuff', scope: 'target',
    color: '#c69b3a', priority: 3,
  },
  '요정의 불꽃': {
    name: '요정의 불꽃',
    desc: '방어도 -610 (방약과 중첩)',
    wowName: '요정의 불꽃',
    talentDesc: '40초 동안 대상의 방어도를 610만큼 감소시킵니다. 효과가 지속되는 동안은 은신이나 투명화가 불가능합니다.',
    type: 'debuff', scope: 'target',
    color: '#ff7c0a', priority: 2,
  },
  '사냥꾼의 낙인': {
    name: '사냥꾼의 낙인',
    desc: '원거리·근접 공격력 +110',
    wowName: '사냥꾼의 징표',
    talentDesc: '사냥꾼의 징표를 대상에게 겁니다. 징표가 걸린 대상을 공격하면 대상에 대한 원거리 전투력이 110만큼 증가하고 대상이 원거리 공격에 가격당할 때마다 최대 440에 이르기까지 대상에 대한 원거리 전투력이 추가로 11만큼 증가합니다. 이 능력에 걸린 대상은 은신이나 투명 상태에도 사냥꾼의 시야에 보이게 되며 미니맵에 표시됩니다. 2분 동안 지속됩니다.',
    type: 'debuff', scope: 'target',
    color: '#aad372', priority: 2,
  },
  '갑옷 노출': {
    name: '갑옷 노출',
    desc: '방어도 -2050 (5중첩)',
    wowName: '약점 노출',
    talentDesc: '마무리 일격으로 30초 동안 대상의 빈틈을 드러내 연계 점수 당 방어도를 아래와 같이 감소시킵니다: 연계 점수 1점: 방어도 410 연계 점수 2점: 방어도 820 연계 점수 3점: 방어도 1230 연계 점수 4점: 방어도 1640 연계 점수 5점: 방어도 2050',
    type: 'debuff', scope: 'target',
    color: '#fff468', priority: 1,
  },
  '사기 저하의 외침': {
    name: '사기 저하의 외침',
    desc: '근접 공격력 -300',
    wowName: '사기의 외침',
    talentDesc: '30초 동안 10미터 내의 모든 적의 근접 전투력을 300만큼 감소시킵니다.',
    type: 'debuff', scope: 'target',
    color: '#c69b3a', priority: 2,
  },
  '천둥 강타': {
    name: '천둥 강타',
    desc: '근접 공격 속도 -10% (방어 전사 특성 시 -20%)',
    wowName: '천둥벼락',
    talentDesc: '주위 적을 강타하여 123의 피해를 입히고 30초 동안 공격 속도를 10%만큼 감소시킵니다. 추가 위협 수준을 생성하며 최대 4개의 대상에게 영향을 미칩니다.',
    type: 'debuff', scope: 'target',
    color: '#c69b3a', priority: 2,
  },

  // ── 유틸리티 ─────────────────────────────────────────────────

  '전투의 외침': {
    name: '전투의 외침',
    desc: '공격력 +305 (파티)',
    wowName: '전투의 외침',
    talentDesc: '전사의 외침으로 주위 20미터 반경에 있는 모든 파티원의 근접 전투력이 240만큼 증가됩니다. 2분 동안 지속됩니다.',
    type: 'buff', scope: 'party',
    color: '#c69b3a', priority: 2,
  },
  '활력': {
    name: '활력',
    desc: '마나 급속 재생 20초 (단일, 전투당 1회)',
    wowName: '정신 자극',
    talentDesc: '대상의 정신력을 기반으로 마나 재생 속도를 400%만큼 증가시키고 시전 중에도 전체 마나를 회복하도록 합니다. 20초 동안 지속됩니다.',
    type: 'utility', scope: 'raid',
    color: '#ff7c0a', priority: 3,
  },
  '빠른 귀환': {
    name: '빠른 귀환',
    desc: '다음 3회 공격 위협 → 탱커 전가 (단일)',
    wowName: '눈속임',
    talentDesc: '다음 3회의 공격으로 발생되는 위협 수준을 대상 공격대원이 가한 것으로 속입니다. 시전자와 대상은 동시에 하나의 눈속임 효과만 받을 수 있습니다. 30초 동안 지속됩니다.',
    type: 'utility', scope: 'raid',
    color: '#aad372', priority: 2,
  },
  '피의 협약': {
    name: '피의 협약',
    desc: '임프 정령 — 체력 증가 (파티)',
    wowName: '피의 서약',
    talentDesc: '파티원의 체력을 70만큼 증가시킵니다.',
    type: 'buff', scope: 'party',
    color: '#9482c9', priority: 1,
  },
};

// ── 클래스·특성별 정보 ──────────────────────────────────────────
const RB_SPEC_INFO = {
  '전사': {
    '방어': {
      role: '탱커',
      keyStatField: 'defense_effective',
      keyStatLabel: '방어숙련',
      provides: ['명령의 외침', '전투의 외침', '방어구 약화', '사기 저하의 외침', '천둥 강타'],
    },
    '무기': {
      role: '딜러',
      keyStatField: 'attack_power',
      keyStatLabel: '공격력',
      provides: ['명령의 외침', '전투의 외침', '방어구 약화', '사기 저하의 외침', 29859],
    },
    '분노': {
      role: '딜러',
      keyStatField: 'attack_power',
      keyStatLabel: '공격력',
      provides: ['명령의 외침', '전투의 외침', '방어구 약화', '사기 저하의 외침'],
    },
    '*': {
      role: '딜러',
      keyStatField: 'attack_power',
      keyStatLabel: '공격력',
      provides: ['명령의 외침', '전투의 외침', '사기 저하의 외침'],
    },
  },
  '성기사': {
    '신성': {
      role: '힐러',
      keyStatField: 'healing_power',
      keyStatLabel: '치유증가량',
      provides: ['성기사 축복', 25895, '집중의 오라', '지혜의 심판', '빛의 심판'],
    },
    '보호': {
      role: '탱커',
      keyStatField: 'defense_effective',
      keyStatLabel: '방어숙련',
      provides: ['성기사 축복', 25895, '헌신의 오라', '지혜의 심판', '빛의 심판'],
    },
    '징벌': {
      role: '딜러',
      keyStatField: 'attack_power',
      keyStatLabel: '공격력',
      provides: ['성기사 축복', 25895, '응보의 오라', 20218, 20337, '지혜의 심판', '빛의 심판'],
    },
    '*': {
      role: '딜러',
      keyStatField: 'attack_power',
      keyStatLabel: '공격력',
      provides: ['성기사 축복', 25895, '지혜의 심판'],
    },
  },
  '사냥꾼': {
    '야수': {
      role: '딜러',
      keyStatField: 'attack_power',
      keyStatLabel: '공격력',
      provides: ['사냥꾼의 낙인', 3043, 34460, '빠른 귀환'],
    },
    '사격': {
      role: '딜러',
      keyStatField: 'attack_power',
      keyStatLabel: '공격력',
      provides: ['사냥꾼의 낙인', 3043, 19506, '빠른 귀환'],
    },
    '생존': {
      role: '딜러',
      keyStatField: 'attack_power',
      keyStatLabel: '공격력',
      provides: ['사냥꾼의 낙인', 3043, 34503, '빠른 귀환'],
    },
    '*': {
      role: '딜러',
      keyStatField: 'attack_power',
      keyStatLabel: '공격력',
      provides: ['사냥꾼의 낙인', 3043, '빠른 귀환'],
    },
  },
  '도적': {
    '암살': { role: '딜러', keyStatField: 'attack_power', keyStatLabel: '공격력', provides: ['갑옷 노출'] },
    '전투': { role: '딜러', keyStatField: 'attack_power', keyStatLabel: '공격력', provides: ['갑옷 노출'] },
    '잠행': { role: '딜러', keyStatField: 'attack_power', keyStatLabel: '공격력', provides: ['갑옷 노출'] },
    '*':    { role: '딜러', keyStatField: 'attack_power', keyStatLabel: '공격력', provides: ['갑옷 노출'] },
  },
  '사제': {
    '수양': {
      role: '힐러',
      keyStatField: 'healing_power',
      keyStatLabel: '치유증가량',
      provides: ['강인함', '신성한 정신', '어둠의 저항', 10060, 33182],
    },
    '신성': {
      role: '힐러',
      keyStatField: 'healing_power',
      keyStatLabel: '치유증가량',
      provides: ['강인함', '신성한 정신', '어둠의 저항'],
    },
    '암흑': {
      role: '딜러',
      keyStatField: 'spell_dmg',
      keyStatLabel: '공격증가량',
      provides: ['강인함', 34914, 15286, 15334, 33195],
    },
    '*': {
      role: '딜러',
      keyStatField: 'spell_dmg',
      keyStatLabel: '공격증가량',
      provides: ['강인함'],
    },
  },
  '주술사': {
    '정기': {
      role: '딜러',
      keyStatField: 'spell_dmg',
      keyStatLabel: '공격증가량',
      provides: ['파멸의 바람 토템', 30706, '마나 샘 토템', '대지의 힘 토템', '피의 흥분'],
    },
    '고양': {
      role: '딜러',
      keyStatField: 'attack_power',
      keyStatLabel: '공격력',
      provides: ['바람힘 토템', 30811, '대지의 힘 토템', '허공의 은총 토템', '마나 샘 토템', '피의 흥분'],
    },
    '복원': {
      role: '힐러',
      keyStatField: 'healing_power',
      keyStatLabel: '치유증가량',
      provides: ['파멸의 바람 토템', '마나 샘 토템', 16190, '대지의 힘 토템', '피의 흥분'],
    },
    '*': {
      role: '딜러',
      keyStatField: 'spell_dmg',
      keyStatLabel: '공격증가량',
      provides: ['마나 샘 토템', '피의 흥분'],
    },
  },
  '마법사': {
    '냉기': {
      role: '딜러',
      keyStatField: 'spell_dmg',
      keyStatLabel: '공격증가량',
      provides: ['신비한 광휘', 28595],
    },
    '화염': {
      role: '딜러',
      keyStatField: 'spell_dmg',
      keyStatLabel: '공격증가량',
      provides: ['신비한 광휘'],
    },
    '비전': {
      role: '딜러',
      keyStatField: 'spell_dmg',
      keyStatLabel: '공격증가량',
      provides: ['신비한 광휘'],
    },
    '*': {
      role: '딜러',
      keyStatField: 'spell_dmg',
      keyStatLabel: '공격증가량',
      provides: ['신비한 광휘'],
    },
  },
  '흑마법사': {
    '고통': {
      role: '딜러',
      keyStatField: 'spell_dmg',
      keyStatLabel: '공격증가량',
      provides: ['원소의 저주', '무모함의 저주', 30909, 32484, '피의 협약', '강령석'],
    },
    '악마술사': {
      role: '딜러',
      keyStatField: 'spell_dmg',
      keyStatLabel: '공격증가량',
      provides: ['원소의 저주', '무모함의 저주', 30909, '피의 협약', '강령석'],
    },
    '파괴': {
      role: '딜러',
      keyStatField: 'spell_dmg',
      keyStatLabel: '공격증가량',
      provides: ['원소의 저주', '무모함의 저주', 30909, '피의 협약', '강령석'],
    },
    '*': {
      role: '딜러',
      keyStatField: 'spell_dmg',
      keyStatLabel: '공격증가량',
      provides: ['원소의 저주', '무모함의 저주', 30909, '피의 협약', '강령석'],
    },
  },
  '드루이드': {
    '조화': {
      role: '딜러',
      keyStatField: 'spell_dmg',
      keyStatLabel: '공격증가량',
      provides: ['야생의 표식', 24858, '요정의 불꽃', 33602, '활력', '소생'],
    },
    '야성': {
      role: '탱커',
      keyStatField: 'armor_effective',
      keyStatLabel: '방어도',
      provides: ['야생의 표식', 17007, '요정의 불꽃', '활력', '소생'],
    },
    '회복': {
      role: '힐러',
      keyStatField: 'healing_power',
      keyStatLabel: '치유증가량',
      provides: ['야생의 표식', 33891, '활력', '소생'],
    },
    '*': {
      role: '딜러',
      keyStatField: 'spell_dmg',
      keyStatLabel: '공격증가량',
      provides: ['야생의 표식', '활력', '소생'],
    },
  },
};
