const fs = require('fs');
const raw  = JSON.parse(fs.readFileSync('./data/items_raw_new.json', 'utf8'));
const era  = JSON.parse(fs.readFileSync('./data/itemsEra.json', 'utf8'));

// 던전/레이드 CSV 로드 → instance_id 기준 맵
const csvLines = fs.readFileSync('C:/Users/고채석/Downloads/tbc_dungon_sources.csv', 'utf8')
  .split('\n').slice(1).filter(Boolean);
const instanceMap = {};
for (const line of csvLines) {
  const [instance_id, , , , category, image_url] = line.split(',');
  if (instance_id) instanceMap[instance_id.trim()] = {
    category:  category.trim(),
    image_url: image_url.trim(),
  };
}

const result = [];

for (const item of raw) {
  const p = item.preview_item;

  // 방어도 — display_string
  const armor = p.armor ? p.armor.display.display_string : '';

  // 스탯 분리: is_equip_bonus 여부로 구분
  const stats  = [];  // 일반 스탯
  const spells = [];  // 착용 효과 (is_equip_bonus)

  for (const s of (p.stats || [])) {
    if (s.is_equip_bonus) {
      // display_string에 value가 포함되지 않은 경우 (특화 등) 직접 추가
      const rawDisplay = s.display.display_string;
      const display = rawDisplay.includes(String(s.value))
        ? rawDisplay
        : rawDisplay + ' +' + s.value;
      spells.push(display);
    } else {
      stats.push({
        name:    s.type.name,
        value:   s.value,
        display: s.display.display_string,
      });
    }
  }

  // 발동 효과 (preview_item.spells) 추가
  for (const s of (p.spells || [])) {
    if (s.description) spells.push(s.description);
  }

  // 무기
  let weapon = null;
  if (p.weapon) {
    weapon = {
      damage: p.weapon.damage.display_string,
      speed:  p.weapon.attack_speed.display_string,
      dps:    p.weapon.dps.display_string,
    };
  }

  // 세트
  let set_name = '', set_items = [], set_effects = [];
  if (p.set) {
    set_name    = p.set.item_set.name;
    set_items   = (p.set.items || []).map(function(si) { return { id: si.item.id, name: si.item.name }; });
    set_effects = (p.set.effects || []).map(function(e) { return e.display_string; });
  }

  // 아이콘
  const eraEntry = era[item.id];
  const icon = eraEntry ? eraEntry.icon : null;

  result.push({
    item_id:           item.id,
    name:              item.name,
    quality:           item.quality.name,
    item_level:        item.level,
    required_level:    item.required_level,
    inventory_type:    item.inventory_type.name,
    inventory_type_id: item.inventory_type.type,
    item_class:        item.item_class.name,
    item_subclass:     item.item_subclass.name,
    binding:           p.binding ? p.binding.name : '',
    armor:             armor,
    stats:             stats,
    spells:            spells,
    set_name:          set_name,
    set_items:         set_items,
    set_effects:       set_effects,
    weapon:            weapon,
    description:       p.description || '',
    sell_price:        item.sell_price,
    is_equippable:     item.is_equippable,
    sources:           (item.sources || []).map(function(s) {
      const info = instanceMap[String(s.instance_id)] || {};
      return Object.assign({}, s, {
        category:  info.category  || null,
        image_url: info.image_url || null,
      });
    }),
    icon:              icon,
  });
}

fs.writeFileSync('./data/items_parsed.json', JSON.stringify(result, null, 2));
console.log('파싱 완료:', result.length, '개');

// 검증
const specItem = result.find(function(i) { return i.spells.some(function(s) { return s.includes('특화'); }); });
console.log('\n[특화 착용효과]', specItem && specItem.name);
console.log('spells:', specItem && specItem.spells);
console.log('stats:', specItem && specItem.stats);

const dodgeItem = result.find(function(i) { return i.spells.some(function(s) { return s.includes('회피'); }); });
console.log('\n[회피 착용효과]', dodgeItem && dodgeItem.name);
console.log('spells:', dodgeItem && dodgeItem.spells);

const procItem = result.find(function(i) { return i.spells.some(function(s) { return s.includes('발동 효과'); }); });
console.log('\n[발동효과]', procItem && procItem.name);
console.log('spells:', procItem && procItem.spells);
