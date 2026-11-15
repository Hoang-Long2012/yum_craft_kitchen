import { SPICES } from '../data/spices.js';
import { describeItemStateShort, formatNaturalList } from './food-item.js';

export function getSpiceDistributionShare(count) {
  const n = Math.max(1, count);
  let harmonicRootSum = 0;
  for (let i = 1; i <= n; i++) {
    harmonicRootSum += 1 / Math.sqrt(i);
  }
  return 1 / harmonicRootSum;
}

export function combineFlavorProfiles(itemsList, keys = ['umami', 'salty', 'sweet', 'sour', 'spicy', 'fatty', 'bitter', 'aroma', 'crunch']) {
  const result = {};
  keys.forEach(k => { result[k] = 0; });
  if (!itemsList || itemsList.length === 0) return result;

  keys.forEach(k => {
    const vals = itemsList
      .map(it => (it && it.flavors && typeof it.flavors[k] === 'number') ? Math.max(0, it.flavors[k]) : 0)
      .filter(v => v > 0)
      .sort((a, b) => b - a);

    let sum = 0;
    for (let i = 0; i < vals.length; i++) {
      sum += vals[i] / Math.sqrt(i + 1);
    }
    result[k] = sum;
  });
  return result;
}

export function analyzeCulinaryChemistry(items) {
  const totals = { umami: 0, salty: 0, sweet: 0, sour: 0, spicy: 0, fatty: 0, bitter: 0, aroma: 0, crunch: 0 };
  if (!items || items.length === 0) {
    return {
      totals,
      normalized: { ...totals },
      synergies: [],
      warnings: [],
      autoTitle: 'Đĩa đang trống',
      structureSummary: 'Chưa có thành phần nào.',
      harmonyScore: 0,
      hasRawMeat: false,
      hasBurnt: false,
      allStructures: []
    };
  }

  let hasRawMeat = false;
  let hasBurnt = false;
  let hasFreshBalancer = false;
  let marinationCount = 0;
  let hasBoiledSoup = false;
  let hasSweets = false;
  let hasMeatOrSavory = false;
  let hasCheese = false;
  let hasHoneyOrButter = false;
  let hasCaramelizedSugar = false;
  let hasShallotOrScallionOil = false;
  let hasBeansOrLotus = false;
  let hasCaramelizedOnion = false;
  let hasStarchOrGrains = false;
  let hasHeatedAlcohol = false;
  let hasGelatinizedStarch = false;
  const alcoholIds = ['red_wine', 'white_wine', 'rice_wine_de', 'purple_rice_wine', 'cooking_wine_mirin', 'dark_rum', 'craft_beer'];
  const gelatinStarchIds = ['tapioca_starch', 'corn_starch', 'glutinous_rice_flour', 'agar_powder'];
  const allStructures = new Set();

  function walkItem(it, weight = 1.0) {
    if (it.kind === 'rolled') allStructures.add('rolled');
    else if (it.kind === 'stuffed') allStructures.add('stuffed');
    else if (it.kind === 'blended') allStructures.add('blended');
    else if (it.kind === 'beverage') allStructures.add('beverage');
    else if (it.kind === 'mixed') allStructures.add('mixed');
    else allStructures.add('loose');

    if (it.isFreshBalancer && it.cookLevel <= 1) hasFreshBalancer = true;
    if ((it.cookMethod === 'boiled' || it.cookMethod === 'pressure_cooked') && it.cookLevel >= 1) hasBoiledSoup = true;
    if (it.cookLevel >= 3) hasBurnt = true;
    if (it.needsCooking && it.cookLevel === 0) hasRawMeat = true;

    const highHeatMethods = ['fried', 'deep_fried', 'baked', 'grilled', 'air_fried', 'wok_fried', 'pan_grilled'];
    const allHeatMethods = ['fried', 'deep_fried', 'baked', 'grilled', 'boiled', 'brewed', 'steamed', 'air_fried', 'rice_cooked', 'microwaved', 'wok_fried', 'pan_grilled', 'pressure_cooked'];
    const starchCookingMethods = ['boiled', 'fried', 'baked', 'deep_fried', 'grilled', 'steamed', 'rice_cooked', 'air_fried', 'microwaved', 'wok_fried', 'pan_grilled', 'pressure_cooked'];

    if (it.category === 'sweets' || it.id === 'chocolate' || it.id === 'milk' || it.id === 'oreo') hasSweets = true;
    if (it.category === 'meat' || it.category === 'seafood' || it.id === 'egg' || it.id === 'pate') hasMeatOrSavory = true;
    if (it.id === 'cheese_stick' || it.id === 'cheese_slice' || it.id === 'mozzarella' || it.id === 'parmesan_cheese' || it.id === 'cheese_foam' || it.id === 'cream_cheese' || it.baseId === 'cheese_slice' || it.baseId === 'mozzarella' || it.baseId === 'parmesan_cheese' || it.baseId === 'cheese_foam' || it.baseId === 'cream_cheese') hasCheese = true;
    if (it.baseId === 'white_sugar' || it.baseId === 'brown_sugar' || it.baseId === 'palm_sugar' || it.baseId === 'rock_sugar' || it.baseId === 'malt_syrup' || it.baseId === 'condensed_milk' || it.id === 'condensed_milk') {
      if (it.cookLevel >= 1 && (highHeatMethods.includes(it.cookMethod) || (it.actionHistory && it.actionHistory.some(a => highHeatMethods.includes(a))))) {
        hasCaramelizedSugar = true;
      }
    }
    if (it.baseId === 'fried_shallots' || it.baseId === 'scallion_oil' || it.id === 'fried_shallots' || it.id === 'scallion_oil') hasShallotOrScallionOil = true;
    if (it.category === 'beans_seeds' || it.baseId === 'mung_bean' || it.baseId === 'black_bean' || it.baseId === 'white_bean' || it.baseId === 'red_bean' || it.baseId === 'lotus_seed' || it.baseId === 'lotus_root') {
      if (it.cookLevel >= 1 || ['boiled', 'pressure_cooked', 'steamed', 'rice_cooked'].includes(it.cookMethod)) hasBeansOrLotus = true;
    }
    if (it.baseId === 'onion' && it.cookLevel >= 1) hasCaramelizedOnion = true;
    if (it.category === 'starch' || it.category === 'noodles_flour' || it.baseId === 'rice_paper' || it.baseId === 'sweet_corn') hasStarchOrGrains = true;
    if (alcoholIds.includes(it.baseId) || alcoholIds.includes(it.id)) {
      if (it.cookLevel >= 1 || allHeatMethods.includes(it.cookMethod) || (it.actionHistory && it.actionHistory.some(a => allHeatMethods.includes(a)))) {
        hasHeatedAlcohol = true;
      }
    }
    if (gelatinStarchIds.includes(it.baseId) || gelatinStarchIds.includes(it.id)) {
      if (it.cookLevel >= 1 || starchCookingMethods.includes(it.cookMethod) || (it.actionHistory && it.actionHistory.some(a => starchCookingMethods.includes(a)))) {
        hasGelatinizedStarch = true;
      }
    }

    Object.keys(totals).forEach(k => {
      totals[k] += (it.flavors[k] || 0) * weight;
    });

    it.spicesApplied.forEach(sp => {
      if (sp.cookedIn) marinationCount++;
      if (sp.id === 'cheese_powder') hasCheese = true;
      if (sp.id === 'honey' || sp.id === 'butter') hasHoneyOrButter = true;
    });

    if (it.subItems && it.subItems.length > 0) {
      it.subItems.forEach(sub => {
        if (sub.needsCooking && sub.cookLevel === 0 && it.cookLevel === 0) hasRawMeat = true;
        if (sub.isFreshBalancer) hasFreshBalancer = true;
        if (sub.category === 'sweets' || sub.id === 'chocolate' || sub.id === 'milk' || sub.id === 'oreo') hasSweets = true;
        if (sub.category === 'meat' || sub.category === 'seafood' || sub.id === 'egg' || sub.id === 'pate') hasMeatOrSavory = true;
        if (sub.id === 'cheese_stick' || sub.id === 'cheese_slice' || sub.id === 'mozzarella' || sub.id === 'parmesan_cheese' || sub.id === 'cheese_foam' || sub.baseId === 'cheese_slice' || sub.baseId === 'mozzarella' || sub.baseId === 'parmesan_cheese' || sub.baseId === 'cheese_foam') hasCheese = true;
        if (sub.baseId === 'white_sugar' || sub.baseId === 'brown_sugar' || sub.baseId === 'palm_sugar' || sub.baseId === 'rock_sugar' || sub.baseId === 'malt_syrup' || sub.baseId === 'condensed_milk' || sub.id === 'condensed_milk') {
          if (sub.cookLevel >= 1 || it.cookLevel >= 1) hasCaramelizedSugar = true;
        }
        if (sub.baseId === 'fried_shallots' || sub.baseId === 'scallion_oil' || sub.id === 'fried_shallots' || sub.id === 'scallion_oil') hasShallotOrScallionOil = true;
        if (sub.category === 'beans_seeds' || sub.baseId === 'mung_bean' || sub.baseId === 'black_bean' || sub.baseId === 'white_bean' || sub.baseId === 'red_bean' || sub.baseId === 'lotus_seed' || sub.baseId === 'lotus_root') {
          if (sub.cookLevel >= 1 || it.cookLevel >= 1 || ['boiled', 'pressure_cooked', 'steamed', 'rice_cooked'].includes(it.cookMethod)) hasBeansOrLotus = true;
        }
        if (sub.baseId === 'onion' && (sub.cookLevel >= 1 || it.cookLevel >= 1)) hasCaramelizedOnion = true;
        if (sub.category === 'starch' || sub.category === 'noodles_flour' || sub.baseId === 'rice_paper' || sub.baseId === 'sweet_corn') hasStarchOrGrains = true;
        if (alcoholIds.includes(sub.baseId) || alcoholIds.includes(sub.id)) {
          if (sub.cookLevel >= 1 || it.cookLevel >= 1 || allHeatMethods.includes(it.cookMethod) || (sub.actionHistory && sub.actionHistory.some(a => allHeatMethods.includes(a)))) {
            hasHeatedAlcohol = true;
          }
        }
        if (gelatinStarchIds.includes(sub.baseId) || gelatinStarchIds.includes(sub.id)) {
          if (sub.cookLevel >= 1 || it.cookLevel >= 1 || starchCookingMethods.includes(it.cookMethod) || (sub.actionHistory && sub.actionHistory.some(a => starchCookingMethods.includes(a)))) {
            hasGelatinizedStarch = true;
          }
        }
        if (sub.spicesApplied) {
          sub.spicesApplied.forEach(sp => {
            if (sp.id === 'cheese_powder') hasCheese = true;
            if (sp.id === 'honey' || sp.id === 'butter') hasHoneyOrButter = true;
          });
        }
      });
    }
  }

  items.forEach(it => walkItem(it, 1.0));

  // Tổng hợp hương vị theo cơ chế Đỉnh Vị + Cộng Hưởng (Peak + Synergy Blending)
  // Bảo toàn trọn vẹn 100% vị tự nhiên của từng nguyên liệu (đắng, chua, cay, ngọt, mặn, béo, umami) và toàn bộ gia vị đã nêm
  const blended = combineFlavorProfiles(items, Object.keys(totals));

  const synergies = [];
  const warnings = [];

  // 1. Sweet + Sour harmony (Bảo toàn trung thực điểm Chua & Ngọt, không tự ý trừ giảm)
  if (blended.sour >= 1.4 && blended.sweet >= 1.4) {
    blended.aroma += 1.0;
    synergies.push('🍋🍬 Hòa Vị Chua Ngọt (Dịu độ gắt, cân bằng tự nhiên)');
  }
  // 2. Salt unlocks Umami (Pure sensory, no meat/sauce assumption)
  if (blended.salty >= 1.0 && blended.salty <= 4.8 && blended.umami >= 1.5) {
    blended.umami *= 1.18;
    blended.sweet += 0.3;
    synergies.push('🧂✨ Muối Hài Hòa Tôn Vị Umami (Kích hoạt chiều sâu đượm đà)');
  }
  // 3. Acid/Pickles cut Fat (Bảo toàn cảm nhận độ béo và vị chua thanh)
  if (blended.fatty >= 2.5 && (blended.sour >= 1.2 || hasFreshBalancer)) {
    blended.aroma += 1.0;
    synergies.push('✨ Cân Bằng Độ Béo (Vị chua hoặc vị thanh giúp giảm độ ngấy béo)');
  } else if (blended.fatty >= 4.5 && blended.sour < 0.8 && !hasFreshBalancer) {
    warnings.push('⚠️ Món ăn có độ béo khá cao (Gợi ý: điều chỉnh giảm độ béo hoặc bổ sung vị thanh để cân bằng)');
  }
  // 4. Fat tames Spice (Bảo toàn trung thực cấp độ cay trên bản đồ và trong đánh giá)
  if (blended.spicy >= 3.2 && blended.fatty >= 2.0) {
    synergies.push('🧈🌶️ Vị Béo Hòa Quyện Cùng Độ Cay Nồng');
  }
  // 5. Rich Sweet + Fat Harmony (Pure sensory)
  if (blended.sweet >= 2.6 && blended.fatty >= 2.0 && blended.aroma >= 1.8) {
    synergies.push('✨ Hòa Vị Béo Ngọt (Cân bằng độ béo ngậy và vị ngọt êm dịu)');
  }
  // 5b. Fat tames Bitterness (Bảo toàn trung thực vị đắng tự nhiên của nguyên liệu)
  if (blended.fatty >= 1.8 && blended.bitter >= 1.5) {
    blended.aroma += 1.0;
    synergies.push('✨ Lớp Béo Ngậy Làm Dịu Vị Đắng (Tạo chiều sâu êm mượt và cân bằng hậu vị)');
  }
  // 5c. Sugar Heat Transformation (Caramelization physics - Biến đổi vật lý/hóa học thực phẩm)
  if (hasCaramelizedSugar) {
    blended.aroma += 1.6;
    blended.fatty += 0.4;
    synergies.push('🔥 Tinh Thể Đường Chuyển Hóa Khi Gặp Nhiệt (Dậy hương thơm ngọt đượm và tạo kết cấu bóng bẩy)');
  }
  // 6. Cheese & Umami richness
  if (hasCheese && (hasMeatOrSavory || blended.umami >= 2.0)) {
    synergies.push('🧀✨ Phô Mai Béo Ngậy Quyện Cùng Vị Umami');
  }
  // 7. Marination aroma
  if (marinationCount > 0) {
    blended.aroma += Math.min(2.0, marinationCount * 0.5);
    synergies.push('🔥🧄 Gia Vị Ướp Thấm Sâu Khi Nấu');
  }
  // 8. Structural synergies
  if (allStructures.has('rolled')) {
    synergies.push('🌯 Kết Cấu Món Cuốn Đa Tầng (Lớp vỏ ôm trọn nhân)');
  }
  if (allStructures.has('stuffed')) {
    synergies.push('🥖 Kết Cấu Bánh Kẹp Nhồi Nhân Đậm Đà');
  }
  // 9. Tinh dầu thơm từ hành kết hợp độ béo
  if (hasShallotOrScallionOil && (hasStarchOrGrains || hasMeatOrSavory || blended.aroma >= 2.0)) {
    blended.aroma += 1.4;
    synergies.push('🧅✨ Tinh Dầu Hành & Độ Béo Dậy Hương (Hương thơm bốc tỏa ngào ngạt kích thích gai vị giác)');
  }
  // 10. Đậu hạt bùi bở hòa quyện cùng vị ngọt thanh
  if (hasBeansOrLotus && (hasSweets || hasHoneyOrButter || blended.sweet >= 2.0)) {
    blended.aroma += 1.2;
    synergies.push('🫘✨ Hòa Vị Bùi Ngọt Thanh Khiết (Vị bùi bở của đậu hạt quyện vị ngọt thanh tạo chiều sâu êm dịu)');
  }
  // 11. Đường thực vật trong củ hành chuyển hóa qua nhiệt
  if (hasCaramelizedOnion) {
    blended.sweet += 0.4;
    blended.aroma += 1.0;
    synergies.push('🔥🧅 Vị Ngọt Thực Vật Chuyển Hóa Qua Nhiệt (Vị hăng cay chuyển hóa thành ngọt thanh đượm đà)');
  }
  // 12. Hương men rượu/bia chuyển hóa qua nhiệt (Flambé / De-glaze Physics - Zero Recipe Assumption)
  if (hasHeatedAlcohol) {
    blended.aroma += 1.5;
    blended.umami += 0.6;
    synergies.push('🍷🔥 Hương Men Chuyển Hóa Qua Nhiệt (Cồn bay hơi làm dậy tầng hương thơm nồng đượm và chiều sâu vị giác)');
  }
  // 13. Tinh bột hồ hóa qua nhiệt (Starch Gelatinization Physics - Zero Recipe Assumption)
  if (hasGelatinizedStarch) {
    blended.aroma += 0.8;
    blended.umami += 0.5;
    synergies.push('🌾✨ Tinh Bột Hồ Hóa Qua Nhiệt (Tạo kết cấu sánh mịn dẻo quyện ôm trọn hương vị)');
  }

  if (hasRawMeat) {
    warnings.push('🤢 Có thịt/hải sản/trứng sống chưa nấu chín!');
  }
  if (hasBurnt) {
    blended.bitter += 4.5;
    warnings.push('🔥 Có nguyên liệu bị nấu quá lửa cháy khét đen!');
  }
  if (blended.salty > 5.5) warnings.push('🧂 Món ăn đang bị MẶN CHÁT!');
  if (blended.spicy > 6.0) warnings.push('🌶️ Món ăn CỰC KỲ CAY xè lưỡi!');

  const normalized = {};
  Object.keys(blended).forEach(k => {
    normalized[k] = Math.min(10, Math.max(0, Number(blended[k].toFixed(1))));
  });

  let score = 60;
  score += Math.min(20, normalized.umami * 2.5);
  score += Math.min(15, normalized.aroma * 2.2);
  score += synergies.length * 6;
  if (normalized.salty > 5.5) score -= (normalized.salty - 5.5) * 10;
  const sourPenaltyThreshold = normalized.sweet >= 1.5 ? 6.5 : 5.2;
  if (normalized.sour > sourPenaltyThreshold) score -= (normalized.sour - sourPenaltyThreshold) * 8;
  const bitterPenaltyThreshold = (!hasBurnt && (normalized.fatty >= 1.5 || normalized.sweet >= 1.8 || normalized.umami >= 2.0)) ? 4.2 : 2.5;
  if (normalized.bitter > bitterPenaltyThreshold) score -= (normalized.bitter - bitterPenaltyThreshold) * 11;
  if (hasRawMeat) score -= 40;
  if (hasBurnt) score -= 35;
  score = Math.max(5, Math.min(100, Math.round(score)));

  const autoTitle = generateSmartDishTitle(items, normalized);
  const structureSummary = items.map(it => `${it.name} (${describeItemStateShort(it)})`).join(' + ');

  return {
    totals,
    normalized,
    synergies,
    warnings,
    autoTitle,
    structureSummary,
    harmonyScore: score,
    hasRawMeat,
    hasBurnt,
    allStructures: Array.from(allStructures)
  };
}

export function generateSmartDishTitle(items, norm) {
  if (!items || items.length === 0) return 'Đĩa đang trống';

  let suffix = '';
  if (norm.sour >= 1.5 && norm.sweet >= 1.5 && norm.spicy >= 1.2) suffix = ' Chua Cay Mặn Ngọt';
  else if (norm.sour >= 1.5 && norm.sweet >= 1.5) suffix = ' Chua Ngọt Hài Hòa';
  else if (norm.spicy >= 2.0) suffix = ' Cay Nồng Đậm Đà';
  else if (norm.sweet >= 3.5 && norm.fatty >= 2.0) suffix = ' Béo Ngọt Đậm Đà';
  else if (norm.umami >= 2.5) suffix = ' Đậm Vị Umami';

  const single = items[0];
  if (items.length === 1) {
    return `${single.name}${suffix}`;
  }

  if (items.length <= 3) {
    return `${formatNaturalList(items.map(i => i.name), 'và')}${suffix}`;
  }

  const headNames = items.slice(0, 3).map(i => i.name).join(', ');
  return `${headNames} và ${items.length - 3} món khác${suffix}`;
}

