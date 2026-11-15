import { state } from '../core/state.js';

export function determineDefaultTexture(ing) {
  if (ing.texture) return ing.texture === 'crisp' ? 'crispy' : ing.texture;
  if (ing.id === 'milk' || ing.id === 'ice_cubes' || ing.id === 'pure_water' || ing.id === 'brewed_coffee' || ing.id === 'espresso') return 'drink';
  const crispyIds = ['instant_ramen', 'roasted_peanuts', 'taco_shell', 'banh_mi_vn', 'croissant', 'oreo', 'cucumber', 'guava', 'june_plum', 'fried_shallots', 'lotus_root', 'panko_breadcrumbs', 'scorched_rice', 'crispy_bacon', 'cashew_nuts', 'fresh_octopus', 'fish_paste', 'beef_meatballs', 'carrot', 'cabbage', 'broccoli', 'asparagus', 'king_oyster_mushroom', 'bitter_melon', 'pineapple', 'watermelon', 'crispy_apple', 'water_spinach', 'parmesan_cheese', 'abalone', 'salami', 'fresh_bamboo_shoot', 'daikon_radish', 'bok_choy', 'wood_ear_mushroom', 'kimchi', 'pickled_eggplant', 'peach_slices', 'kiwi_fruit', 'grapes', 'pork_trotter', 'snow_fungus', 'blueberries', 'pomelo', 'sea_grapes', 'lotus_stem_pickled', 'rice_cake_puff'];
  if (crispyIds.includes(ing.id) || (ing.flavors && ing.flavors.crunch >= 2.5)) {
    return 'crispy';
  }
  return 'soft';
}

export function itemContainsIce(item) {
  if (!item) return false;
  if (item.hasIce) return true;
  if (item.id === 'ice_cubes' || item.baseId === 'ice_cubes') return true;
  if (item.subItems && item.subItems.some(sub => itemContainsIce(sub))) return true;
  if (item.innerItems && item.innerItems.some(inner => itemContainsIce(inner))) return true;
  return false;
}

export function createFoodItem(ing) {
  const defTex = determineDefaultTexture(ing);
  return {
    uid: state.nextItemUid++,
    kind: 'single', // 'single' | 'rolled' | 'stuffed' | 'blended'
    baseId: ing.id,
    name: ing.name,
    emoji: ing.emoji,
    category: ing.category,
    color: ing.color,
    cookedColor: ing.cookedColor,
    needsCooking: ing.needsCooking,
    isFreshBalancer: !!ing.isFreshBalancer,
    cutState: 'whole', // 'whole' | 'sliced' | 'diced' | 'minced'
    cookLevel: 0, // 0 = raw/fresh, 1 = cooked, 2 = crispy brown, >=3 = burnt
    cookMethod: 'none',
    actionHistory: [], // Lưu tuần tự chuỗi phương pháp chế biến vật lý tự do (Toca Kitchen Sandbox)
    lastStationId: null, // Dụng cụ chế biến gần nhất
    batchId: null, // Mã lượt chế biến (nhận diện các nguyên liệu nấu chung một công cụ)
    returnedFromStaging: false,
    texture: defTex, // 'soft' | 'crispy' | 'liquid' | 'drink'
    hasIce: ing.id === 'ice_cubes',
    outerTexture: null, // used for rolled and stuffed items
    spicesApplied: [],
    subItems: [],
    outerItem: null,
    flavors: { ...ing.flavors }
  };
}

export function describeItemStateShort(item) {
  const parts = [];
  const hasMultiStepHistory = item.actionHistory && item.actionHistory.length > 1;
  const historyHasCut = hasMultiStepHistory && item.actionHistory.some(a => a === 'sliced' || a === 'diced' || a === 'minced');
  if (item.kind === 'rolled' && item.outerItem) {
    parts.push(`Cuộn trong ${item.outerItem.name}`);
  } else if (item.kind === 'stuffed' && item.outerItem) {
    parts.push(`Nhồi trong ${item.outerItem.name}`);
  } else if (!historyHasCut) {
    if (item.cutState === 'sliced') parts.push('thái lát');
    else if (item.cutState === 'diced') parts.push('thái hạt lựu');
    else if (item.cutState === 'minced') parts.push('băm nhuyễn');
  }

  const methodMap = {
    sliced: 'thái lát',
    diced: 'thái hạt lựu',
    minced: 'băm nhuyễn',
    rolled: 'cuộn chặt',
    stuffed: 'nhồi nhân',
    fried: 'áp chảo/xào',
    boiled: 'luộc/hầm',
    deep_fried: 'chiên ngập dầu',
    baked: 'đút lò nướng',
    grilled: 'nướng than hoa',
    blended: 'xay sinh tố',
    mixed: 'trộn đều hỗn hợp',
    kneaded: 'nhào nặn dẻo quánh',
    whisked: 'đánh bông sánh mịn',
    stirred: 'khuấy ly',
    shaken: 'lắc shaker',
    brewed: 'hãm nóng',
    steamed: 'hấp cách thủy',
    air_fried: 'chiên giòn bằng khí nóng',
    rice_cooked: 'nấu chín bằng nồi cơm điện',
    microwaved: 'làm nóng bằng vi sóng',
    wok_fried: 'đảo Wok lửa lớn',
    pan_grilled: 'nướng chảo gang',
    pressure_cooked: 'ninh áp suất'
  };

  if (item.actionHistory && item.actionHistory.length > 1) {
    const cleanActs = [];
    item.actionHistory.forEach(a => {
      if (cleanActs.length === 0 || cleanActs[cleanActs.length - 1] !== a) cleanActs.push(a);
    });
    const chainStr = cleanActs.map(a => methodMap[a] || a).join(' ➔ ');
    parts.push(chainStr);
    if (item.cookLevel === 1) parts.push('chín tới');
    else if (item.cookLevel === 2) parts.push('chín vàng giòn');
    else if (item.cookLevel >= 3) parts.push('cháy khét đen');
  } else if (item.cookMethod === 'blended') {
    parts.push('xay sánh mịn');
  } else if (item.cookMethod === 'mixed' || item.cookMethod === 'kneaded' || item.cookMethod === 'whisked') {
    parts.push(`${methodMap[item.cookMethod]} (${item.needsCooking ? 'còn sống' : 'sẵn sàng'})`);
  } else if (item.cookMethod === 'stirred') {
    parts.push('khuấy đều');
  } else if (item.cookMethod === 'shaken') {
    parts.push('lắc sủi bọt');
  } else if (item.cookMethod === 'brewed') {
    parts.push('hãm nóng bốc khói');
  } else if (item.cookLevel === 0) {
    parts.push(item.needsCooking ? 'còn sống' : 'tươi ngon');
  } else if (item.cookLevel === 1) {
    parts.push(`chín tới (${methodMap[item.cookMethod] || 'đã nấu'})`);
  } else if (item.cookLevel === 2) {
    parts.push(`chín vàng giòn (${methodMap[item.cookMethod] || 'đã nấu'})`);
  } else if (item.cookLevel >= 3) {
    parts.push('cháy khét đen');
  }

  // Format gia vị phân tầng cho món cuốn / nhồi hoặc món đơn
  const isLayered = (item.kind === 'rolled' || item.kind === 'stuffed');
  const outerList = item.outerSpices || (item.outerItem && item.outerItem.spicesApplied) || [];
  const innerList = item.innerSpices || (item.innerItems && item.innerItems.flatMap(i => i.spicesApplied || [])) || [];

  if (isLayered && (outerList.length > 0 || innerList.length > 0)) {
    const formatCounts = (arr) => {
      const counts = {};
      arr.forEach(s => { counts[s.name] = (counts[s.name] || 0) + 1; });
      return Object.entries(counts).map(([n, c]) => (c > 1 ? `${n} x${c}` : n)).join(', ');
    };
    const outerStr = formatCounts(outerList);
    const innerStr = formatCounts(innerList);
    if (outerStr && innerStr) {
      parts.push(`vỏ nêm: ${outerStr}; nhân nêm: ${innerStr}`);
    } else if (outerStr) {
      parts.push(`vỏ nêm: ${outerStr}`);
    } else if (innerStr) {
      parts.push(`nhân nêm: ${innerStr}`);
    }
  } else if (item.spicesApplied && item.spicesApplied.length > 0) {
    const counts = {};
    item.spicesApplied.forEach(s => { counts[s.name] = (counts[s.name] || 0) + 1; });
    const sStr = Object.entries(counts).map(([n, c]) => (c > 1 ? `${n} x${c}` : n)).join(', ');
    parts.push(`nêm: ${sStr}`);
  }
  return parts.join(', ');
}

// HỆ SỐ PHÂN BỔ GIA VỊ & TỔNG HỢP HƯƠNG VỊ CẢM QUAN (PEAK + SYNERGY BLENDING - BẢO TOÀN 100% VỊ NGUYÊN LIỆU & GIA VỊ)
