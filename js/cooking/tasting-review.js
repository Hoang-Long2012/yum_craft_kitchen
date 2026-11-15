import { CHARACTERS } from '../data/characters.js';
import { SPICES } from '../data/spices.js';
import { itemContainsIce, formatNaturalList } from './food-item.js';

export { formatNaturalList };

export function describePureFlavorDescriptor(tasteKey, score, seed = 0) {
  if (!score || score <= 0) return null;
  const pick = (arr) => arr[Math.abs(seed) % arr.length];

  switch (tasteKey) {
    case 'sweet':
      if (score >= 8.6) return pick(['vị ngọt lịm sắc sảo', 'vị ngọt sắc đậm lịm', 'vị ngọt gắt khé cổ']);
      if (score >= 7.1) return pick(['vị ngọt đậm đà', 'vị ngọt đượm sâu lắng', 'vị ngọt lịm rõ nét']);
      if (score >= 4.6) return pick(['vị ngọt đằm', 'vị ngọt ngào êm dịu', 'vị ngọt đượm dịu dàng']);
      if (score >= 2.1) return pick(['vị ngọt thanh', 'vị ngọt dịu dàng', 'vị ngọt thanh thoát']);
      if (score >= 0.8) return pick(['vị ngọt dịu nhẹ', 'chút vị ngọt thoang thoảng']);
      return null;

    case 'umami':
      if (score >= 7.1) return pick(['vị Umami cực kỳ đậm đà và sâu lắng', 'chiều sâu vị giác tròn đầy mạnh mẽ']);
      if (score >= 4.6) return pick(['vị đượm đà sâu lắng', 'chiều sâu tròn vị đậm nét']);
      if (score >= 2.6) return pick(['chiều sâu đượm đà thanh tao', 'vị đượm êm dịu']);
      if (score >= 1.2) return pick(['vị đượm nhẹ nhàng', 'chút vị đượm thoang thoảng']);
      return null;

    case 'fatty':
      if (score >= 7.1) return pick(['độ béo ngậy cực kỳ nồng đậm', 'lớp béo ngậy đậm đặc (khá ngấy)']);
      if (score >= 4.6) return pick(['lớp béo ngậy đậm đà', 'độ béo ngậy rõ nét']);
      if (score >= 2.6) return pick(['vị béo bùi vừa vặn', 'độ ngậy mượt mà']);
      if (score >= 1.2) return pick(['chút béo bùi thoang thoảng', 'độ béo êm dịu']);
      return null;

    case 'salty':
      if (score >= 5.6) return pick(['vị mặn chát gắt', 'vị mặn khé lưỡi']);
      if (score >= 3.9) return pick(['vị mặn đậm đà', 'vị mặn mòi rõ rệt']);
      if (score >= 2.1) return pick(['vị mặn mà vừa vặn', 'vị mặn mòi hài hòa']);
      if (score >= 0.8) return pick(['chút vị mặn nhẹ điểm xuyết', 'vị mặn dịu']);
      return null;

    case 'sour':
      if (score >= 6.6) return pick(['vị chua gắt xộc đầu lưỡi', 'vị chua lòe nhăn mặt']);
      if (score >= 4.1) return pick(['vị chua đậm nét rõ rệt', 'vị chua sắc sảo']);
      if (score >= 2.1) return pick(['vị chua thanh dịu', 'vị chua dịu vừa miệng']);
      if (score >= 0.8) return pick(['chút vị chua rôn rốt', 'chút vị chua dịu nhẹ']);
      return null;

    case 'spicy':
      if (score >= 6.1) return pick(['vị cay xé lưỡi bùng nổ', 'vị cay xộc cực mạnh']);
      if (score >= 3.6) return pick(['vị cay nồng đậm đà', 'vị cay bốc mạnh mẽ']);
      if (score >= 1.9) return pick(['vị cay tê kích thích vừa độ', 'vị cay đượm']);
      if (score >= 0.6) return pick(['chút the cay nhẹ', 'vị cay cay lăn tăn']);
      return null;

    case 'bitter':
      if (score >= 4.6) return pick(['vị đắng ngắt rõ rệt', 'vị đắng đậm sắc nét']);
      if (score >= 2.6) return pick(['vị đắng thanh sâu lắng', 'chút đắng đót tinh tế']);
      if (score >= 1.0) return pick(['chút vị đắng dịu nhẹ', 'vị đắng nhẹ thoang thoảng']);
      return null;

    case 'aroma':
      if (score >= 6.6) return pick(['hương thơm lừng cực kỳ quyến rũ', 'hương thơm nức mũi ngào ngạt']);
      if (score >= 3.6) return pick(['hương thơm nức ngào ngạt', 'hương thơm quyến rũ rõ nét']);
      if (score >= 1.5) return pick(['hương thơm thoang thoảng dịu nhẹ', 'chút hương thơm nhẹ nhàng']);
      return null;

    case 'crunch':
      if (score >= 3.5) return pick(['kết cấu giòn rụm rôm rốp đã tai', 'độ giòn tan sần sật cuốn hút']);
      if (score >= 1.5) return pick(['độ giòn sần sật vui miệng', 'kết cấu giòn giòn thú vị']);
      if (score >= 0.8) return pick(['chút độ giòn nhẹ xen lẫn']);
      return null;

    default:
      return null;
  }
}

// HÀM ĐỊNH LƯỢNG GIA VỊ CẢM QUAN: Gom nhóm và đếm chính xác số phần gia vị đã ướp/nêm (x1, 2 phần, đẫm N phần)
export function formatSpiceListWithQuantities(spiceRecords) {
  if (!spiceRecords || spiceRecords.length === 0) return [];
  const seenBatchIds = new Set();
  const countMap = new Map();
  spiceRecords.forEach(sp => {
    if (sp && sp.name) {
      if (sp.batchId) {
        if (seenBatchIds.has(sp.batchId)) return;
        seenBatchIds.add(sp.batchId);
      }
      countMap.set(sp.name, (countMap.get(sp.name) || 0) + 1);
    }
  });
  const formatted = [];
  countMap.forEach((count, name) => {
    if (count === 1) {
      formatted.push(name);
    } else if (count === 2) {
      formatted.push(`2 phần ${name}`);
    } else {
      formatted.push(`đẫm ${count} phần ${name}`);
    }
  });
  return formatted;
}

// FORMAT CHUỖI PHƯƠNG PHÁP CHẾ BIẾN TỰ NHIÊN (TOCA KITCHEN SANDBOX: 1 ĐẾN 7+ BƯỚC)
export function formatActionHistoryChain(actions, cookLevel = 1, hasIce = false, iceMelted = false, needsCooking = false) {
  if (!actions || actions.length === 0) {
    if (cookLevel >= 3) return 'bị quá lửa cháy khét đen';
    if (cookLevel === 0) return needsCooking ? 'còn tươi sống chưa qua chế biến nhiệt' : 'còn tươi nguyên bản';
    return 'được chế biến chín tới thơm ngon';
  }

  // Lọc bỏ các thao tác trùng lặp liền kề
  const cleanActions = [];
  actions.forEach(act => {
    if (cleanActions.length === 0 || cleanActions[cleanActions.length - 1] !== act) {
      cleanActions.push(act);
    }
  });

  const interMap = {
    sliced: 'thái lát',
    diced: 'thái hạt lựu',
    minced: 'băm nhuyễn',
    stirred: 'khuấy đều',
    shaken: 'lắc sủi bọt',
    brewed: 'hãm nóng',
    blended: 'xay nhuyễn sánh mịn',
    mixed: 'trộn đều',
    kneaded: 'nhào nặn dẻo quánh',
    whisked: 'đánh bông sánh mịn',
    rolled: 'cuộn chặt',
    stuffed: 'nhồi nhân',
    boiled: 'luộc chín mềm',
    fried: 'áp chảo',
    deep_fried: 'chiên ngập dầu',
    baked: 'đút lò nướng',
    grilled: 'nướng than hoa',
    steamed: 'hấp cách thủy',
    wok_fried: 'đảo Wok lửa lớn',
    pan_grilled: 'nướng chảo gang',
    pressure_cooked: 'ninh áp suất',
    air_fried: 'chiên bằng khí nóng',
    rice_cooked: 'nấu bằng nồi cơm điện',
    microwaved: 'làm nóng bằng vi sóng'
  };

  const getFinalActionText = (act) => {
    if (act === 'deep_fried') {
      if (cookLevel >= 3) return 'đem chiên ngập dầu cháy khét';
      if (cookLevel >= 2) return 'đem chiên ngập dầu vàng ươm giòn rụm';
      return 'đem chiên ngập dầu giòn tan';
    }
    if (act === 'grilled') {
      if (cookLevel >= 3) return 'đem nướng than hoa cháy đen';
      if (cookLevel >= 2) return 'đem nướng than hoa xém cạnh thơm phức';
      return 'đem nướng than hoa chín tới thơm lừng';
    }
    if (act === 'fried') {
      if (cookLevel >= 3) return 'đem áp chảo cháy khét';
      if (cookLevel >= 2) return 'đem áp chảo xém cạnh giòn thơm';
      return 'đem áp chảo chín tới vàng ươm';
    }
    if (act === 'baked') {
      if (cookLevel >= 3) return 'đem đút lò nướng cháy đen';
      if (cookLevel >= 2) return 'đem đút lò nướng vàng ươm giòn rụm';
      return 'đem đút lò nướng chín thơm phức';
    }
    if (act === 'boiled') {
      if (cookLevel >= 2) return 'đem ninh hầm nhừ mềm ngọt nước';
      return 'đem luộc chín mềm ngọt nước';
    }
    if (act === 'steamed') {
      if (cookLevel >= 3) return 'đem hấp quá lửa làm nhũn nhừ';
      if (cookLevel >= 2) return 'đem hấp cách thủy chín mềm mọng nước';
      return 'đem hấp cách thủy giữ trọn vị ngọt thanh';
    }
    if (act === 'wok_fried') {
      if (cookLevel >= 3) return 'đem đảo Wok quá lửa cháy xém';
      if (cookLevel >= 2) return 'đem đảo Wok lửa lớn xém cạnh giòn thơm bốc khói';
      return 'đem đảo Wok lửa lớn chín tới thơm lừng mùi khói chảo';
    }
    if (act === 'pan_grilled') {
      if (cookLevel >= 3) return 'đem nướng chảo gang cháy khét đen';
      if (cookLevel >= 2) return 'đem nướng chảo gang xém cạnh thơm phức';
      return 'đem nướng xém vân chảo gang thơm lừng đậm đà';
    }
    if (act === 'pressure_cooked') {
      if (cookLevel >= 3) return 'ninh áp suất quá lâu đến nát nhừ';
      if (cookLevel >= 2) return 'đem ninh nhừ đậm đà bằng nồi áp suất cao';
      return 'đem ninh mềm ngọt nước bằng nồi áp suất';
    }
    if (act === 'air_fried') {
      if (cookLevel >= 3) return 'đem chiên khí nóng cháy khét';
      return cookLevel >= 2 ? 'đem chiên khí nóng vàng giòn' : 'đem chiên khí nóng chín tới';
    }
    if (act === 'rice_cooked') {
      if (cookLevel >= 3) return 'nấu nồi cơm điện quá lâu đến khô khét';
      if (cookLevel >= 2) return 'nấu chín mềm dẻo kỹ trong nồi cơm điện';
      return 'nấu chín dẻo bằng nồi cơm điện';
    }
    if (act === 'microwaved') {
      if (cookLevel >= 3) return 'quay vi sóng quá lâu đến khô khét';
      if (cookLevel >= 2) return 'quay vi sóng nóng hổi kỹ càng';
      return 'làm nóng nhanh bằng vi sóng';
    }
    if (act === 'blended') {
      return hasIce ? 'xay nhuyễn sánh mịn mát lạnh' : 'xay nhuyễn sánh mịn';
    }
    if (act === 'mixed') return 'trộn đều hòa quyện';
    if (act === 'kneaded') return 'nhào nặn thành khối dẻo mịn';
    if (act === 'whisked') return 'đánh bông sánh mịn hòa quyện';
    if (act === 'shaken') {
      return hasIce ? 'lắc bình shaker sủi bọt mát lạnh' : 'lắc bình shaker sủi bọt';
    }
    if (act === 'stirred') {
      return hasIce ? 'pha chế khuấy đều mát lạnh' : 'pha chế khuấy đều';
    }
    if (act === 'brewed') {
      if (iceMelted) return 'hãm nước sôi làm tan chảy hoàn toàn đá viên, tạo nên thức uống ấm dịu thanh mát';
      return 'hãm nóng bốc khói thơm nồng';
    }
    if (act === 'rolled') return 'cuộn trọn chặt tay';
    if (act === 'stuffed') return 'nhồi đầy đặn vào ruột';
    if (act === 'minced') return 'băm nhuyễn';
    if (act === 'diced') return 'thái hạt lựu';
    if (act === 'sliced') return 'thái lát';
    return interMap[act] || act;
  };

  if (cleanActions.length === 1) {
    const act = cleanActions[0];
    return `được ${getFinalActionText(act)}`;
  }

  const lastAct = cleanActions[cleanActions.length - 1];
  const prevActs = cleanActions.slice(0, -1);
  const prevPhrases = prevActs.map(a => interMap[a] || a);
  const finalDesc = getFinalActionText(lastAct);

  if (prevPhrases.length === 1) {
    return `được ${prevPhrases[0]} rồi ${finalDesc}`;
  } else {
    return `được ${prevPhrases.join(', ')} rồi ${finalDesc}`;
  }
}

// GOM NHÓM NGUYÊN LIỆU THEO LỊCH SỬ CHẾ BIẾN THỰC TẾ CỦA TỪNG MẺ NẤU (INGREDIENT-AWARE BATCH GROUPING)
export function groupItemsByCookingHistory(items) {
  if (!items || items.length === 0) return [];
  const nonIceItems = items.filter(i => i.id !== 'ice_cubes' && i.baseId !== 'ice_cubes');
  const targetItems = nonIceItems.length > 0 ? nonIceItems : items;
  const anySiblingHasIce = items.some(i => itemContainsIce(i));

  const groups = [];
  const groupMap = new Map();

  targetItems.forEach(it => {
    const cleanActs = [];
    if (it.actionHistory && it.actionHistory.length > 0) {
      it.actionHistory.forEach(a => {
        if (cleanActs.length === 0 || cleanActs[cleanActs.length - 1] !== a) cleanActs.push(a);
      });
    } else if (it.cookMethod && it.cookMethod !== 'none') {
      cleanActs.push(it.cookMethod);
    } else if (it.cutState && it.cutState !== 'whole') {
      cleanActs.push(it.cutState);
    }

    const isDrinkOrBlended = it.kind === 'beverage' || it.kind === 'blended' || ['stirred', 'shaken', 'brewed', 'blended'].includes(it.cookMethod);
    const hasIce = itemContainsIce(it) || (isDrinkOrBlended && anySiblingHasIce);
    const iceMelted = !!it.iceMelted;
    const needsCooking = !!it.needsCooking;
    const cookLevel = it.cookLevel || 0;

    const actionDesc = formatActionHistoryChain(cleanActs, cookLevel, hasIce, iceMelted, needsCooking);
    const groupKey = `${cleanActs.join('>')}||${actionDesc}`;

    let itemNames = [];
    if (it.subItems && it.subItems.length > 0) {
      const subFiltered = it.subItems.filter(s => s.id !== 'ice_cubes' && s.baseId !== 'ice_cubes');
      const subTarget = subFiltered.length > 0 ? subFiltered : it.subItems;
      itemNames = subTarget.map(sub => {
        const subPre = [];
        if (sub.actionHistory && sub.actionHistory.length > 0) {
          sub.actionHistory.forEach(a => {
            if (!cleanActs.includes(a) && (subPre.length === 0 || subPre[subPre.length - 1] !== a)) {
              subPre.push(a);
            }
          });
        } else if (sub.cookMethod && sub.cookMethod !== 'none' && !cleanActs.includes(sub.cookMethod)) {
          subPre.push(sub.cookMethod);
        }
        if (subPre.length > 0) {
          const subPreDesc = formatActionHistoryChain(subPre, sub.cookLevel || 1, false, false, false);
          return `${sub.name} (${subPreDesc})`;
        }
        return sub.name;
      });
    } else {
      itemNames = [it.name];
    }

    if (!groupMap.has(groupKey)) {
      const newGroup = {
        key: groupKey,
        actions: cleanActs,
        actionDesc,
        names: []
      };
      groupMap.set(groupKey, newGroup);
      groups.push(newGroup);
    }
    const g = groupMap.get(groupKey);
    itemNames.forEach(nm => {
      if (!g.names.includes(nm)) g.names.push(nm);
    });
  });

  return groups;
}

// DYNAMIC SENSORY TASTING REVIEW (TOCA KITCHEN STYLE - NO HARDCODED RECIPES)
export function generateSensoryTastingReview(items, analysis, character, dishNameOverride = null) {
  if (!items || items.length === 0) {
    return {
      speech: "Ơ kìa? Dĩa thức ăn đang trống trơn, chưa có gì để ăn cả!",
      moodTag: "Dĩa đang trống! 🍽️",
      reactionType: "neutral",
      score: 0,
      sensorySentence: "Chưa có thức ăn trên dĩa."
    };
  }

  const f = analysis.normalized;
  const finalDishName = dishNameOverride || state.customDishName || analysis.autoTitle || 'Món Ăn Tự Chế';
  let score = analysis.harmonyScore;
  character.likes.forEach(k => { if (f[k] >= 2.0) score += 5; });
  score = Math.max(0, Math.min(100, score));

  // 1. Extreme & Gag Reactions (Toca Kitchen Humor)
  if (analysis.hasRawMeat) {
    let gagSpeech = '';
    if (character.id === 'chef_bear') {
      gagSpeech = `"Ối dồi ôi! Món '${finalDishName}' còn thịt sống tanh lòm chưa nấu chín kìa! Đầu bếp bận gì mà quên áp chảo hay nướng chín cho tôi thế này?!"`;
    } else if (character.id === 'cat_miu') {
      gagSpeech = `"Meo meo... Thịt còn sống tanh lòm thế này Miu không dám cắn đâu, sợ đau bụng lắm!"`;
    } else if (character.id === 'dragon_long') {
      gagSpeech = `"Gừừừ! Thịt còn sống nhăn răng! Đưa đây ta khè một búng lửa nướng chín lại ngay bây giờ!"`;
    } else if (character.id === 'fox_gourmet') {
      gagSpeech = `"Trời đất! Món '${finalDishName}' còn thịt sống tanh lòm chưa qua lửa kìa! Một người sành ăn như tôi tuyệt đối không nuốt nổi miếng thịt sống ẩu tả thế này đâu!"`;
    } else if (character.id === 'rabbit_gardener') {
      gagSpeech = `"Ôi trời đất ơi! Món '${finalDishName}' còn thịt sống tanh lòm làm tôi hoảng hồn quá! Tôi chỉ thích ăn rau củ thanh mát thôi, đầu bếp mau mang đi nấu chín lại đi nhé!"`;
    } else {
      gagSpeech = `"Kỳ cục quá! Thịt chưa qua xử lý nhiệt chín tới, còn mùi tanh sống thế này thì vi khuẩn sinh sôi, không thể ăn được!"`;
    }
    playSoundEffect('react_bad');
    return {
      speech: gagSpeech,
      moodTag: 'Thịt còn sống tanh! 🤢',
      reactionType: 'bad',
      score: Math.min(score, 20),
      sensorySentence: `Món '${finalDishName}' còn thịt sống tanh chưa qua chế biến nhiệt.`
    };
  }

  if (analysis.hasBurnt) {
    let burntSpeech = '';
    if (character.id === 'chef_bear') {
      burntSpeech = `"Khụ khụ... Món '${finalDishName}' bị nấu quá lửa cháy đen thui rồi đầu bếp ơi! Cắn vào đắng nghét cả họng thế này thì nuốt sao nổi!"`;
    } else if (character.id === 'cat_miu') {
      burntSpeech = `"Khụ... Đắng quá đi mất! Món bị cháy khét đắng ngắt cả lưỡi rồi Miu không thích đâu!"`;
    } else if (character.id === 'dragon_long') {
      burntSpeech = `"Ha ha! Khét lẹt như cục than vậy! Dù ta là rồng lửa nhưng ăn món cháy đen này cũng thấy nghẹn họng!"`;
    } else if (character.id === 'fox_gourmet') {
      burntSpeech = `"Khụ khụ... Đắng ngắt cả họng! Món '${finalDishName}' bị quá lửa cháy đen thui làm bốc hơi sạch vị ngọt tự nhiên tinh túy rồi, thật đáng tiếc!"`;
    } else if (character.id === 'rabbit_gardener') {
      burntSpeech = `"Khói khét quá đi mất! Món '${finalDishName}' bị cháy đen đắng nghét thế này thì hỏng hết vị ngọt lành của nguyên liệu rồi đầu bếp ơi!"`;
    } else {
      burntSpeech = `"Đắng ngắt! Quá trình nhiệt phân quá đà làm cháy thành than carbon rồi, mất sạch dinh dưỡng và vị ngon!"`;
    }
    playSoundEffect('react_bad');
    return {
      speech: burntSpeech,
      moodTag: 'Cháy khét đắng nghét! 炭',
      reactionType: 'bad',
      score: Math.min(score, 22),
      sensorySentence: `Món '${finalDishName}' bị quá lửa cháy khét đen đắng nghét.`
    };
  }

  // 2. Build Rich Sensory Tasting Critique (User's Intuitive Style - 100% Complete Sensory & Spice Description)
  // A. Structure Description
  let structureDesc = '';
  const rolledItem = items.find(it => it.kind === 'rolled');
  const stuffedItem = items.find(it => it.kind === 'stuffed');
  const blendedItem = items.find(it => it.kind === 'blended' || it.cookMethod === 'blended');
  const beverageItem = items.find(it => it.kind === 'beverage' || it.cookMethod === 'stirred' || it.cookMethod === 'shaken' || it.cookMethod === 'brewed');
  const isDrinkOrSmoothie = !!(blendedItem || beverageItem || items.every(it => it.texture === 'drink'));

  const methodToText = (m, level, needsCooking = false) => {
    if (!level || level === 0 || m === 'none') {
      return needsCooking ? 'còn tươi sống chưa qua nhiệt' : 'tươi nguyên bản';
    }
    if (m === 'deep_fried') {
      return level >= 2 ? 'chiên ngập dầu vàng ươm giòn rụm' : 'chiên ngập dầu giòn tan';
    }
    if (m === 'grilled') {
      return level >= 2 ? 'nướng than hoa xém cạnh thơm phức' : 'nướng than hoa thơm lừng';
    }
    if (m === 'fried') {
      return level >= 2 ? 'áp chảo xém cạnh giòn thơm' : 'áp chảo chín tới vàng ươm';
    }
    if (m === 'baked') {
      return level >= 2 ? 'đút lò nướng vàng ươm giòn rụm' : 'đút lò nướng chín thơm phức';
    }
    if (m === 'boiled') {
      return level >= 2 ? 'ninh hầm nhừ mềm ngọt nước' : 'luộc chín mềm ngọt nước';
    }
    if (m === 'steamed') {
      return level >= 2 ? 'hấp cách thủy chín mềm mọng nước' : 'hấp cách thủy giữ trọn vị ngọt thanh';
    }
    if (m === 'wok_fried') {
      return level >= 2 ? 'đảo Wok lửa lớn xém cạnh thơm phức' : 'đảo Wok lửa lớn chín tới thơm lừng';
    }
    if (m === 'pan_grilled') {
      return level >= 2 ? 'nướng xém vân chảo gang thơm phức' : 'nướng trên chảo gang chín tới';
    }
    if (m === 'pressure_cooked') {
      return level >= 2 ? 'ninh nhừ bằng hơi nóng áp suất cao' : 'ninh mềm bằng nồi áp suất';
    }
    if (m === 'air_fried') {
      return level >= 2 ? 'chiên khí nóng vàng giòn' : 'chiên khí nóng chín tới';
    }
    if (m === 'rice_cooked') {
      return level >= 2 ? 'nấu chín mềm dẻo kỹ trong nồi cơm điện' : 'nấu chín dẻo bằng nồi cơm điện';
    }
    if (m === 'microwaved') {
      return level >= 2 ? 'quay vi sóng nóng hổi kỹ càng' : 'làm nóng nhanh bằng vi sóng';
    }
    if (m === 'mixed') return 'trộn đều hòa quyện';
    if (m === 'kneaded') return 'nhào nặn dẻo mịn';
    if (m === 'whisked') return 'đánh bông sánh mịn';
    return level >= 2 ? 'chế biến chín kỹ thơm lừng' : 'chế biến chín tới thơm ngon';
  };

  const subject = finalDishName
    ? (isDrinkOrSmoothie ? `Thức uống '${finalDishName}'` : `Món '${finalDishName}'`)
    : (isDrinkOrSmoothie ? 'Thức uống' : 'Món ăn');

  if (rolledItem) {
    const outer = rolledItem.outerItem ? rolledItem.outerItem.name : rolledItem.name;
    const outerCook = methodToText(rolledItem.cookMethod, rolledItem.cookLevel, rolledItem.outerItem?.needsCooking);
    const rollVerb = (outerCook.startsWith('còn ') || outerCook.startsWith('tươi ')) ? outerCook : `được ${outerCook}`;
    const innerList = (rolledItem.innerItems && rolledItem.innerItems.length > 0)
      ? rolledItem.innerItems
      : (rolledItem.subItems || []).filter(s => s !== rolledItem.outerItem && s.uid !== rolledItem.outerItem?.uid);
    const innerGroups = groupItemsByCookingHistory(innerList);
    const cookedInnerGroups = innerGroups.filter(g => g.actions.length > 0);
    let inners = 'nhân béo bùi';
    if (innerList.length > 0) {
      if (cookedInnerGroups.length >= 2) {
        inners = innerGroups.map(g => g.actions.length > 0 ? `${formatNaturalList(g.names, 'và')} (${g.actionDesc})` : formatNaturalList(g.names, 'và')).join(' kết hợp cùng ');
      } else {
        inners = formatNaturalList(innerList.map(s => s.name), 'và');
      }
    }

    const outerSpicesList = formatSpiceListWithQuantities(rolledItem.outerSpices || (rolledItem.outerItem && rolledItem.outerItem.spicesApplied));
    const innerSpicesList = formatSpiceListWithQuantities(rolledItem.innerSpices || (rolledItem.innerItems && rolledItem.innerItems.flatMap(i => i.spicesApplied || [])));

    const outerSpiceText = outerSpicesList.length > 0 ? `, được nêm ${formatNaturalList(outerSpicesList, 'và')} bên ngoài` : '';
    const innerSpiceText = innerSpicesList.length > 0 ? `. Được nêm với ${formatNaturalList(innerSpicesList, 'và')} bên trong` : '';

    if (outerSpiceText && innerSpiceText) {
      structureDesc = `${subject} với lớp vỏ ${outer} ${rollVerb}${outerSpiceText}, cuộn trọn phần nhân ${inners}${innerSpiceText}`;
    } else if (outerSpiceText) {
      structureDesc = `${subject} với lớp vỏ ${outer} ${rollVerb}${outerSpiceText}, cuộn trọn phần nhân thanh đạm ${inners} bên trong`;
    } else if (innerSpiceText) {
      structureDesc = `${subject} với lớp vỏ ${outer} ${rollVerb} bên ngoài, cuộn trọn phần nhân ${inners}${innerSpiceText}`;
    } else {
      structureDesc = `${subject} với ${outer} ${rollVerb}, cuộn trọn lớp ${inners} ở bên trong`;
    }

    const extraSideItems = items.filter(it => it !== rolledItem);
    if (extraSideItems.length > 0) {
      const sideGroups = groupItemsByCookingHistory(extraSideItems);
      const sidePhrases = sideGroups.map(g => `${formatNaturalList(g.names, 'và')} ${g.actionDesc}`);
      structureDesc += `, ăn kèm ${formatNaturalList(sidePhrases, 'và')}`;
    }
  } else if (stuffedItem) {
    const vessel = stuffedItem.outerItem ? stuffedItem.outerItem.name : stuffedItem.name;
    const vesselCook = methodToText(stuffedItem.cookMethod, stuffedItem.cookLevel, stuffedItem.outerItem?.needsCooking);
    const cookVerb = (vesselCook.startsWith('còn ') || vesselCook.startsWith('tươi ')) ? vesselCook : `được ${vesselCook}`;
    const innerList = (stuffedItem.innerItems && stuffedItem.innerItems.length > 0)
      ? stuffedItem.innerItems
      : (stuffedItem.subItems || []).filter(s => s !== stuffedItem.outerItem && s.uid !== stuffedItem.outerItem?.uid);
    const innerGroups = groupItemsByCookingHistory(innerList);
    const cookedInnerGroups = innerGroups.filter(g => g.actions.length > 0);
    let inners = 'nhân đậm đà';
    if (innerList.length > 0) {
      if (cookedInnerGroups.length >= 2) {
        inners = innerGroups.map(g => g.actions.length > 0 ? `${formatNaturalList(g.names, 'và')} (${g.actionDesc})` : formatNaturalList(g.names, 'và')).join(' kết hợp cùng ');
      } else {
        inners = formatNaturalList(innerList.map(s => s.name), 'và');
      }
    }

    const outerSpicesList = formatSpiceListWithQuantities(stuffedItem.outerSpices || (stuffedItem.outerItem && stuffedItem.outerItem.spicesApplied));
    const innerSpicesList = formatSpiceListWithQuantities(stuffedItem.innerSpices || (stuffedItem.innerItems && stuffedItem.innerItems.flatMap(i => i.spicesApplied || [])));

    const outerSpiceText = outerSpicesList.length > 0 ? `, được nêm ${formatNaturalList(outerSpicesList, 'và')} bên ngoài` : '';
    const innerSpiceText = innerSpicesList.length > 0 ? `. Được nêm đậm đà với ${formatNaturalList(innerSpicesList, 'và')} bên trong` : '';

    if (outerSpiceText && innerSpiceText) {
      structureDesc = `${subject} với lớp vỏ ${vessel} ${cookVerb}${outerSpiceText}, nhồi đẫm phần nhân ${inners}${innerSpiceText}`;
    } else if (outerSpiceText) {
      structureDesc = `${subject} với lớp vỏ ${vessel} ${cookVerb}${outerSpiceText}, nhồi phần nhân thanh đạm ${inners} bên trong`;
    } else if (innerSpiceText) {
      structureDesc = `${subject} với lớp vỏ ${vessel} ${cookVerb} bên ngoài, nhồi đẫm phần nhân ${inners}${innerSpiceText}`;
    } else {
      structureDesc = `${subject} với lớp vỏ ${vessel} ${cookVerb} bên ngoài, được nhồi đầy đặn nhân ${inners} bên trong`;
    }

    const extraSideItems = items.filter(it => it !== stuffedItem);
    if (extraSideItems.length > 0) {
      const sideGroups = groupItemsByCookingHistory(extraSideItems);
      const sidePhrases = sideGroups.map(g => `${formatNaturalList(g.names, 'và')} ${g.actionDesc}`);
      structureDesc += `, ăn kèm ${formatNaturalList(sidePhrases, 'và')}`;
    }
  } else {
    // TẤT CẢ CÁC MÓN ĂN & ĐỒ UỐNG TỰ DO (TOCA KITCHEN SANDBOX: GOM NHÓM NGUYÊN LIỆU THEO MẺ NẤU & LỊCH SỬ THAO TÁC 1 ĐẾN 7+ BƯỚC)
    const groups = groupItemsByCookingHistory(items);

    if (groups.length <= 1) {
      const g = groups[0] || { names: [], actions: [], actionDesc: 'tươi nguyên bản' };
      const ingNames = formatNaturalList(g.names, 'và');
      if (g.actions.length === 0) {
        structureDesc = finalDishName ? `${subject} (${ingNames}) ${g.actionDesc}` : `${ingNames} ${g.actionDesc}`;
      } else {
        structureDesc = `${subject} ${g.actionDesc} từ ${ingNames || 'các nguyên liệu'}`;
      }
    } else {
      const groupPhrases = groups.map(g => {
        const gIngs = formatNaturalList(g.names, 'và');
        return `${gIngs} ${g.actionDesc}`;
      });
      if (groupPhrases.length === 2) {
        structureDesc = `${subject} kết hợp ${groupPhrases[0]}, cùng với ${groupPhrases[1]}`;
      } else {
        structureDesc = `${subject} kết hợp ${groupPhrases.slice(0, -1).join('; ')}, cùng với ${groupPhrases[groupPhrases.length - 1]}`;
      }
    }
  }

  // B. Taste Sensations (Dynamic Pure Sensory Lexicon - TẢ ĐẦY ĐỦ 100% MỌI HƯƠNG VỊ HIỆN DIỆN, TUYỆT ĐỐI KHÔNG CẮT CỤT BẰNG SLICE)
  const palateCandidates = [];
  const seed = items.length;
  const palateKeys = ['sweet', 'sour', 'salty', 'spicy', 'bitter', 'umami', 'fatty'];
  palateKeys.forEach((k, idx) => {
    const val = f[k] || 0;
    const desc = describePureFlavorDescriptor(k, val, seed + idx);
    if (desc) {
      palateCandidates.push({ key: k, score: val, desc });
    }
  });

  // Sắp xếp từ vị chủ đạo (đậm nhất) xuống đến hậu vị/chấm phá nhưng giữ nguyên 100% tất cả các vị
  palateCandidates.sort((a, b) => b.score - a.score);

  const allPalateTastes = palateCandidates.map(c => c.desc);
  const crunchDesc = describePureFlavorDescriptor('crunch', f.crunch || 0, seed + 10);
  const aromaDesc = describePureFlavorDescriptor('aroma', f.aroma || 0, seed + 20);

  const sensoryParts = [];
  if (allPalateTastes.length > 0) {
    sensoryParts.push(`có ${formatNaturalList(allPalateTastes, 'và')}`);
  } else {
    sensoryParts.push('hương vị thanh đạm mộc mạc');
  }
  if (crunchDesc) {
    sensoryParts.push(crunchDesc);
  }
  if (aromaDesc) {
    sensoryParts.push(`lan tỏa ${aromaDesc}`);
  }
  const tasteStr = sensoryParts.join(', ');

  // C. Spices Applied for Loose / Blended / Beverage / Side Items (Định lượng số phần gia vị & ngữ cảnh chế biến)
  let spiceStr = '';
  const looseSpiceRecords = [];
  items.forEach(it => {
    if (it.kind !== 'rolled' && it.kind !== 'stuffed') {
      if (it.spicesApplied && it.spicesApplied.length > 0) {
        it.spicesApplied.forEach(sp => looseSpiceRecords.push(sp));
      } else if (it.subItems && it.subItems.length > 0) {
        it.subItems.forEach(sub => {
          if (sub.spicesApplied) sub.spicesApplied.forEach(sp => looseSpiceRecords.push(sp));
        });
      }
    }
  });
  if (looseSpiceRecords.length > 0) {
    const formattedSpices = formatSpiceListWithQuantities(looseSpiceRecords);
    const allSpicesFormatted = formatNaturalList(formattedSpices, 'và');
    const allCookedIn = looseSpiceRecords.every(sp => sp.cookedIn);
    const anyCookedIn = looseSpiceRecords.some(sp => sp.cookedIn);

    if (isDrinkOrSmoothie) {
      spiceStr = `, hòa quyện cùng ${allSpicesFormatted}`;
    } else if (allCookedIn) {
      spiceStr = `, thấm đẫm gia vị ướp từ ${allSpicesFormatted}`;
    } else if (anyCookedIn) {
      const cookedList = formatSpiceListWithQuantities(looseSpiceRecords.filter(sp => sp.cookedIn));
      const freshList = formatSpiceListWithQuantities(looseSpiceRecords.filter(sp => !sp.cookedIn));
      spiceStr = `, thấm gia vị ướp ${formatNaturalList(cookedList, 'và')} và nêm thêm ${formatNaturalList(freshList, 'và')}`;
    } else {
      spiceStr = `, nêm thêm ${allSpicesFormatted}`;
    }
  }

  // D. Combine Complete Narrative
  const sensorySentence = `${structureDesc}${spiceStr}, ${tasteStr}`;

  // E. Extreme Salt / Spice Gag Reactions (Vẫn giữ trọn vẹn mô tả cảm quan tất cả các vị trong món)
  if (f.salty > 7.0) {
    let saltySpeech = '';
    if (character.id === 'chef_bear') {
      saltySpeech = `"Úi chà chà! Tay ai nêm mà món '${finalDishName}' mặn chát cả lưỡi thế này (${sensorySentence})! Cho tôi xin một xô nước lọc gấp kẻo quéo thận mất!"`;
    } else if (character.id === 'cat_miu') {
      saltySpeech = `"Eo ôi mặn quá! ${sensorySentence}, làm lưỡi Miu tê rần rần rồi, mau cho Miu uống nước lọc với!"`;
    } else if (character.id === 'dragon_long') {
      saltySpeech = `"Mặn như nước biển sâu vậy! ${sensorySentence}, đầu bếp tính ướp muối ta thành xác ướp luôn à?!"`;
    } else if (character.id === 'fox_gourmet') {
      saltySpeech = `"Chát chúa quá! ${sensorySentence}, lượng muối vượt ngưỡng làm tê liệt hết gai vị giác tinh tế của tôi rồi, cho tôi một ly nước thanh mát gấp!"`;
    } else if (character.id === 'rabbit_gardener') {
      saltySpeech = `"Eo ôi mặn quá! Tôi ăn thanh đạm quen rồi, nếm phải ${sensorySentence} mặn chát này làm lưỡi tê rần rần luôn, cho tôi xin nước với!"`;
    } else {
      saltySpeech = `"Nồng độ muối natri vượt ngưỡng báo động! ${sensorySentence}, vị mặn quá gắt làm mất đi tính cân bằng!"`;
    }
    playSoundEffect('react_bad');
    return {
      speech: saltySpeech,
      moodTag: 'Mặn chát khát nước! 🧂💦',
      reactionType: 'bad',
      score: Math.min(score, 35),
      sensorySentence: `${sensorySentence} (bị nêm quá tay mặn chát khát nước).`
    };
  }

  if (f.spicy > character.maxSpiceTolerance) {
    let spicySpeech = '';
    if (character.id === 'cat_miu') {
      spicySpeech = `"Hàààà! Cay xé họng luôn rồi! ${sensorySentence}, Miu bốc khói hai tai rồi nè, cay cấp độ ${f.spicy}/10 Miu không chịu nổi đâu hu hu!"`;
    } else if (character.id === 'dragon_long') {
      spicySpeech = `"Oa oa! Lửa bốc tận đỉnh đầu rồi! ${sensorySentence}, cay cấp độ ${f.spicy}/10 vượt cả sức chịu đựng của rồng ta, đầu bếp cho ta một thùng nước dập lửa mau!"`;
    } else if (character.id === 'fox_gourmet') {
      spicySpeech = `"Nóng rát cả họng! ${sensorySentence}, độ cay cấp độ ${f.spicy}/10 quá mạnh làm tôi không chịu nổi độ cay này đâu!"`;
    } else if (character.id === 'rabbit_gardener') {
      spicySpeech = `"Hàààà! Cay xè lưỡi luôn rồi! ${sensorySentence}, cay cấp độ ${f.spicy}/10 làm tôi chảy cả nước mắt, tôi chỉ quen ăn rau củ thanh ngọt thôi hu hu!"`;
    } else if (character.id === 'chef_bear') {
      spicySpeech = `"Hàààà! Cay bốc hỏa hai mang tai rồi! ${sensorySentence}, cay cấp độ ${f.spicy}/10 xé lưỡi bốc khói, cho tôi xô nước đá gấp!"`;
    } else {
      spicySpeech = `"Hắt xì... ${sensorySentence}, nồng độ capsaicin cay cấp độ ${f.spicy}/10 vượt xa ngưỡng chịu đựng của tôi rồi, cay cháy cả họng!"`;
    }
    playSoundEffect('react_bad');
    return {
      speech: spicySpeech,
      moodTag: 'Cay xè bốc khói! 🔥🌶️',
      reactionType: 'bad',
      score: Math.min(score, 45),
      sensorySentence: `${sensorySentence} (cay bùng nổ cấp độ ${f.spicy}/10 vượt quá sức chịu đựng).`
    };
  }

  // F. Character Tone & Verdict
  let speech = '';
  let moodTag = '';
  let reactionType = 'good';

  if (score >= 82) {
    reactionType = 'love';
    moodTag = isDrinkOrSmoothie ? 'Thức uống 5 Sao! 🤩🍹' : 'Tuyệt phẩm 5 Sao! 🤩🌟';
    if (isDrinkOrSmoothie) {
      if (character.id === 'chef_bear') {
        speech = `"Ực ực... Khà! ÔI TUYỆT HẢO! ${sensorySentence}, tạo nên một hương vị thức uống cực kỳ tuyệt vời! Đúng là tay nghề pha chế thượng hạng, uống vào sảng khoái đã cơn khát vô cùng!"`;
      } else if (character.id === 'cat_miu') {
        speech = `"Ực ực... ÔI THÍCH QUÁ! ${sensorySentence}, vị ngon ngọt mát tan ngay nơi đầu lưỡi làm Miu mê tít luôn!"`;
      } else if (character.id === 'dragon_long') {
        speech = `"Khà khà... ĐÃ CƠN KHÁT THẬT! ${sensorySentence}, hương vị thức uống đậm đà bùng nổ đúng gu của ta rồi!"`;
      } else if (character.id === 'fox_gourmet') {
        speech = `"Nhấp một ngụm... QUÁ ĐỖI TINH TẾ! ${sensorySentence}, một tuyệt tác pha chế thanh nhã làm say đắm lòng người, xứng tầm nhà hàng cao cấp!"`;
      } else if (character.id === 'rabbit_gardener') {
        speech = `"Ực ực... ÔI THANH MÁT NGON LÀNH QUÁ! ${sensorySentence}, từng ngụm tươi lành ngọt dịu như mang cả khu vườn vào ly nước vậy!"`;
      } else {
        speech = `"Nhấp một ngụm... XUẤT SẮC! ${sensorySentence}, sự phối hợp pha chế này đạt độ hài hòa cân bằng đỉnh cao!"`;
      }
    } else {
      if (character.id === 'chef_bear') {
        speech = `"Nhoàm nhoàm... ÔI TUYỆT HẢO! ${sensorySentence}, tạo nên một hương vị cực kỳ tuyệt vời! Đúng là tay nghề của một bếp trưởng thực thụ, ăn vào đã cái bụng vô cùng!"`;
      } else if (character.id === 'cat_miu') {
        speech = `"Măm măm... ÔI THÍCH QUÁ! ${sensorySentence}, vị ngon hòa quyện tan ngay trong miệng làm Miu mê tít luôn!"`;
      } else if (character.id === 'dragon_long') {
        speech = `"Khà khà... ĐÃ MIỆNG THẬT! ${sensorySentence}, hương vị đậm đà bùng nổ đúng gu của ta rồi!"`;
      } else if (character.id === 'fox_gourmet') {
        speech = `"Chẹp chẹp... QUÁ ĐỖI TINH TẾ! ${sensorySentence}, một tuyệt tác vị giác thanh nhã làm say đắm lòng người, xứng tầm nhà hàng cao cấp!"`;
      } else if (character.id === 'rabbit_gardener') {
        speech = `"Chóp chép... ÔI NGON LÀNH QUÁ! ${sensorySentence}, từng tầng hương vị ngọt mát tươi lành như mang cả khu vườn vào món ăn vậy!"`;
      } else {
        speech = `"Chà... XUẤT SẮC! ${sensorySentence}, sự phối hợp ẩm thực này đạt độ hài hòa cân bằng đỉnh cao!"`;
      }
    }
  } else if (score >= 50) {
    reactionType = 'good';
    moodTag = isDrinkOrSmoothie ? 'Thơm ngon vừa vị! 🍹👍' : 'Ngon miệng vừa vị! 😋👍';
    speech = isDrinkOrSmoothie
      ? `"Ực ực... Khà! ${sensorySentence}, uống rất thơm ngon và vừa vị (Hài hòa: ${score}/100 điểm)!"`
      : `"Măm măm! ${sensorySentence}, ăn rất ngon miệng và vừa vị (Hài hòa: ${score}/100 điểm)!"`;
  } else {
    reactionType = 'good';
    moodTag = 'Vị lạ độc đáo! 🤔';
    speech = isDrinkOrSmoothie
      ? `"Hừm... ${sensorySentence}. Thức uống có hương vị khá độc lạ và mới mẻ, lần sau đầu bếp hãy thử pha chế cân bằng hơn xem sao nhé!"`
      : `"Hừm... ${sensorySentence}. Món ăn có hương vị khá độc lạ và mới mẻ, lần sau đầu bếp hãy thử nêm nếm thêm xem sao nhé!"`;
  }

  return { speech, moodTag, reactionType, score, sensorySentence };
}

// MULTI-DISH SENSORY TASTING CRITIQUE (COMBO & BANQUET SYSTEM FOR 2, 3, 4, 5, 6+ DISHES)
export function generateMultiDishTastingReview(dishes, character) {
  if (!dishes || dishes.length === 0) {
    return {
      speech: "Ơ kìa? Dĩa thức ăn đang trống trơn, chưa có gì để ăn cả!",
      moodTag: "Dĩa đang trống! 🍽️",
      reactionType: "neutral",
      score: 0,
      sensorySentence: "Chưa có thức ăn trên dĩa.",
      dishReviews: []
    };
  }

  if (dishes.length === 1) {
    const d = dishes[0];
    const singleRev = generateSensoryTastingReview(d.items, d.analysis, character, d.name);
    return {
      ...singleRev,
      dishReviews: [{ dish: d, review: singleRev }]
    };
  }

  // 1. Phân tích chi tiết từng món với đầy đủ 4 tầng cảm quan độc lập
  const dishReviews = dishes.map(d => {
    const rev = generateSensoryTastingReview(d.items, d.analysis, character, d.name);
    return {
      dish: d,
      review: rev
    };
  });

  // 2. Kiểm tra phản ứng hài hước & cảnh báo nghiêm trọng (Toca Kitchen Gag)
  const rawDishes = dishReviews.filter(dr => dr.dish.analysis.hasRawMeat);
  const burntDishes = dishReviews.filter(dr => dr.dish.analysis.hasBurnt);
  const superSaltyDishes = dishReviews.filter(dr => dr.dish.analysis.normalized.salty > 7.0);
  const superSpicyDishes = dishReviews.filter(dr => dr.dish.analysis.normalized.spicy > character.maxSpiceTolerance);

  // Có món còn thịt sống tanh
  if (rawDishes.length > 0) {
    const badNames = rawDishes.map(dr => `'${dr.dish.name}'`).join(', ');
    const goodNames = dishReviews.filter(dr => !dr.dish.analysis.hasRawMeat).map(dr => `'${dr.dish.name}'`).join(', ');
    let gagSpeech = '';
    if (character.id === 'chef_bear') {
      gagSpeech = `"Ối dồi ôi! Món ${badNames} còn thịt sống tanh lòm chưa nấu chín kìa! ${goodNames ? `Mấy món như ${goodNames} trông thì rất ngon lành nhưng ` : ''}tôi không dám cắn miếng thịt này đâu, đau bụng chết mất!"`;
    } else if (character.id === 'cat_miu') {
      gagSpeech = `"Meo meo... Món ${badNames} thịt còn sống tanh lòm Miu sợ lắm! ${goodNames ? `Cho Miu ăn ${goodNames} thôi được không?` : ''}"`;
    } else if (character.id === 'dragon_long') {
      gagSpeech = `"Gừừừ! Món ${badNames} thịt sống nhăn răng! Đưa đây ta khè một búng lửa nướng chín lại ngay!"`;
    } else if (character.id === 'fox_gourmet') {
      gagSpeech = `"Trời đất! Món ${badNames} còn thịt sống tanh lòm chưa nấu chín kìa! ${goodNames ? `Dù ${goodNames} có hấp dẫn đến mấy thì ` : ''}một người sành ăn như tôi cũng không thể nuốt nổi miếng thịt sống ẩu tả này!"`;
    } else if (character.id === 'rabbit_gardener') {
      gagSpeech = `"Ôi trời ơi! Món ${badNames} thịt sống tanh quá! ${goodNames ? `Để tôi thưởng thức ${goodNames} thôi nhé, ` : ''}tôi sợ thịt sống lắm, mau đem nấu chín đi đầu bếp ơi!"`;
    } else {
      gagSpeech = `"Báo động an toàn thực phẩm! Món ${badNames} chưa qua xử lý nhiệt chín tới, vi khuẩn sinh sôi không thể ăn được!"`;
    }
    playSoundEffect('react_bad');
    return {
      speech: gagSpeech,
      moodTag: 'Có món sống tanh! 🤢',
      reactionType: 'bad',
      score: 20,
      sensorySentence: `Bàn tiệc có món (${badNames}) còn thịt sống tanh chưa qua chế biến nhiệt.`,
      dishReviews
    };
  }

  // Có món bị nấu cháy khét
  if (burntDishes.length > 0) {
    const badNames = burntDishes.map(dr => `'${dr.dish.name}'`).join(', ');
    let burntSpeech = '';
    if (character.id === 'chef_bear') {
      burntSpeech = `"Khụ khụ... Món ${badNames} bị quá lửa cháy đen thui rồi đầu bếp ơi! Cắn vào đắng nghét cả họng thì sao thưởng thức được các món khác nữa!"`;
    } else if (character.id === 'cat_miu') {
      burntSpeech = `"Khụ... Đắng ngắt! Món ${badNames} cháy khét lẹt rồi Miu không thích đâu!"`;
    } else if (character.id === 'dragon_long') {
      burntSpeech = `"Ha ha! Khét như cục than vậy! Món ${badNames} cháy đen rồi, dù là rồng ta ăn cũng nghẹn họng!"`;
    } else if (character.id === 'fox_gourmet') {
      burntSpeech = `"Khụ khụ... Món ${badNames} bị quá lửa cháy đen thui rồi! Cắn vào đắng ngắt cuống họng làm mất hết cảm hứng thưởng thức bàn ăn tinh tế này!"`;
    } else if (character.id === 'rabbit_gardener') {
      burntSpeech = `"Khói khét quá đi! Món ${badNames} bị cháy đen đắng nghét rồi, làm bay mất hết hương thơm thanh mát của cả bàn ăn rồi đầu bếp ơi!"`;
    } else {
      burntSpeech = `"Món ${badNames} đã bị than hóa nghiêm trọng, nồng độ hợp chất đắng quá cao làm hỏng cả bàn ăn!"`;
    }
    playSoundEffect('react_bad');
    return {
      speech: burntSpeech,
      moodTag: 'Có món cháy khét! 炭',
      reactionType: 'bad',
      score: 22,
      sensorySentence: `Bàn tiệc có món (${badNames}) bị nấu quá lửa cháy đen đắng nghét.`,
      dishReviews
    };
  }

  // Có món bị nêm mặn chát
  if (superSaltyDishes.length > 0) {
    const badNames = superSaltyDishes.map(dr => `'${dr.dish.name}'`).join(', ');
    let saltySpeech = '';
    if (character.id === 'chef_bear') {
      saltySpeech = `"Úi chà chà! Món ${badNames} nêm mặn chát cả lưỡi rồi! Mau cho tôi xin xô nước lọc gấp kẻo quéo thận mất!"`;
    } else if (character.id === 'cat_miu') {
      saltySpeech = `"Eo ôi mặn quá! Món ${badNames} làm lưỡi Miu tê rần rần rồi, mau cho Miu uống nước lọc với!"`;
    } else if (character.id === 'dragon_long') {
      saltySpeech = `"Mặn như nước biển sâu! Món ${badNames} mặn thế này thì rồng ta cũng phải đầu hàng, cần một hồ nước ngọt ngay!"`;
    } else if (character.id === 'fox_gourmet') {
      saltySpeech = `"Chát chúa quá! Món ${badNames} mặn chát làm tê liệt hết gai vị giác của tôi rồi, cho tôi ly nước thanh mát gấp!"`;
    } else if (character.id === 'rabbit_gardener') {
      saltySpeech = `"Eo ôi mặn quá! Tôi ăn thanh đạm quen rồi, món ${badNames} mặn thế này làm hỏng cả bữa ăn của tôi rồi hu hu!"`;
    } else {
      saltySpeech = `"Nồng độ muối natri trong món ${badNames} vượt ngưỡng an toàn! Vị mặn phá vỡ hoàn toàn sự cân bằng của cả thực đơn!"`;
    }
    playSoundEffect('react_bad');
    return {
      speech: saltySpeech,
      moodTag: 'Có món mặn chát! 🧂💦',
      reactionType: 'bad',
      score: 35,
      sensorySentence: `Bàn tiệc có món (${badNames}) bị nêm quá tay mặn chát khát nước.`,
      dishReviews
    };
  }

  // Có món cay xè vượt quá sức chịu đựng
  if (superSpicyDishes.length > 0) {
    const badNames = superSpicyDishes.map(dr => `'${dr.dish.name}'`).join(', ');
    let spicySpeech = '';
    if (character.id === 'cat_miu') {
      spicySpeech = `"Hàààà! Món ${badNames} cay xé họng luôn rồi! Miu bốc khói hai tai rồi nè, cay quá Miu không chịu nổi đâu hu hu!"`;
    } else if (character.id === 'dragon_long') {
      spicySpeech = `"Oa oa! Lửa bốc tận trời rồi! Món ${badNames} cay bùng nổ vượt cả giới hạn rồng lửa ta, đầu bếp cho ta xô nước dập lửa mau!"`;
    } else if (character.id === 'fox_gourmet') {
      spicySpeech = `"Nóng rát cả họng! Món ${badNames} cay xè này thiêu rụi hết vị giác tinh tế rồi, tôi cần nước đá ngay!"`;
    } else if (character.id === 'rabbit_gardener') {
      spicySpeech = `"Hàààà! Cay xè lưỡi luôn rồi! Món ${badNames} cay quá làm tôi chảy cả nước mắt, tôi chỉ quen ăn rau củ thanh ngọt thôi!"`;
    } else if (character.id === 'chef_bear') {
      spicySpeech = `"Hàààà! Món ${badNames} cay bốc hỏa hai mang tai rồi! Xé lưỡi bốc khói, cho tôi xô nước đá gấp đầu bếp ơi!"`;
    } else {
      spicySpeech = `"Capsaicin trong món ${badNames} đạt nồng độ cực đại! Vị cay nồng thiêu đốt làm tê liệt toàn bộ khả năng cảm vị!"`;
    }
    playSoundEffect('react_bad');
    return {
      speech: spicySpeech,
      moodTag: 'Có món cay xè! 🔥🌶️',
      reactionType: 'bad',
      score: 42,
      sensorySentence: `Bàn tiệc có món (${badNames}) cay xé lưỡi vượt quá sức chịu đựng.`,
      dishReviews
    };
  }

  // 3. Tính điểm trung bình và cộng điểm thưởng phối hợp Thực Đơn Combo
  let totalScore = 0;
  dishReviews.forEach(dr => totalScore += dr.review.score);
  let avgScore = Math.round(totalScore / dishes.length);

  // Thưởng điểm hòa vị khi thực đơn có cả món ăn mặn/chính và đồ uống/tráng miệng ngọt mát
  const hasSavory = dishes.some(d => d.items.some(i => i.category === 'meat' || i.category === 'seafood' || i.category === 'vegetables' || i.category === 'noodles_flour'));
  const hasDrinkOrSweet = dishes.some(d => d.items.some(i => i.texture === 'drink' || i.category === 'sweets' || i.category === 'fruits' || i.id === 'oreo' || i.id === 'milk'));
  if (hasSavory && hasDrinkOrSweet) {
    avgScore = Math.min(100, avgScore + 5);
  }
  if (dishes.length >= 3) {
    avgScore = Math.min(100, avgScore + 3);
  }

  // 4. Trích xuất mô tả cảm quan từng món để tổng hòa thành lời thoại tự nhiên
  const dishDetails = dishReviews.map(dr => {
    let sent = dr.review.sensorySentence;
    sent = sent.replace(/^(?:Món|Thức uống)\s+'[^']+'\s+(?:\([^)]+\)\s+)?/, '');
    return {
      name: dr.dish.name,
      desc: sent,
      score: dr.review.score
    };
  });

  let sensorySentence = '';
  let speech = '';
  let moodTag = '';
  let reactionType = avgScore >= 80 ? 'love' : 'good';

  if (dishes.length === 2) {
    const d1 = dishDetails[0];
    const d2 = dishDetails[1];
    sensorySentence = `Món '${d1.name}' (${d1.desc}), dùng kèm món '${d2.name}' (${d2.desc})`;
    moodTag = avgScore >= 80 ? 'Combo 2 Món Đỉnh Cao! 🤩🍽️' : 'Combo 2 Món Vừa Vị! 😋👍';

    if (avgScore >= 80) {
      if (character.id === 'chef_bear') {
        speech = `"Nhoàm nhoàm... ÔI BỮA ĂN THỊNH SOẠN TUYỆT HẢO! Về món '${d1.name}': ${d1.desc}. Kèm thêm món '${d2.name}': ${d2.desc}! Hai món kết hợp với nhau tạo nên một bữa ăn vừa đậm đà vừa đã miệng, đúng là tay nghề bếp trưởng cự phách, ăn vào đã cái bụng vô cùng!"`;
      } else if (character.id === 'cat_miu') {
        speech = `"Măm măm... ÔI THÍCH QUÁ ĐI! Món '${d1.name}' thì ${d1.desc}, lại có thêm '${d2.name}' ${d2.desc}! Vị ngon hòa quyện tan ngay trong miệng làm Miu mê tít luôn!"`;
      } else if (character.id === 'dragon_long') {
        speech = `"Khà khà... ĐÃ MIỆNG VÀ ĐÃ KHÁT THẬT! Món '${d1.name}' ${d1.desc}, rồi lại được nhấp '${d2.name}' ${d2.desc}! Hương vị bùng nổ đúng gu của ta rồi!"`;
      } else if (character.id === 'fox_gourmet') {
        speech = `"Chẹp chẹp... THỰC ĐƠN PHỐI HỢP CỰC KỲ TINH TẾ! Món '${d1.name}' (${d1.desc}) đi cùng '${d2.name}' (${d2.desc}) tạo nên một bản hòa tấu vị giác thanh nhã tuyệt đỉnh, xứng tầm ẩm thực cao cấp!"`;
      } else if (character.id === 'rabbit_gardener') {
        speech = `"Chóp chép... ÔI BỮA ĂN THANH LÀNH NGON MIỆNG QUÁ! Sự kết hợp giữa '${d1.name}' (${d1.desc}) và '${d2.name}' (${d2.desc}) ngọt mát tươi lành như cả khu vườn trù phú vậy!"`;
      } else {
        speech = `"Chà... XUẤT SẮC! Sự phối hợp giữa món '${d1.name}' (${d1.desc}) và món '${d2.name}' (${d2.desc}) đạt độ cân bằng ẩm thực đỉnh cao!"`;
      }
    } else if (avgScore >= 50) {
      speech = `"Măm măm! Bữa ăn kết hợp giữa món '${d1.name}' (${d1.desc}) và món '${d2.name}' (${d2.desc}) ăn rất ngon miệng và vừa vị (Hài hòa: ${avgScore}/100 điểm)!"`;
    } else {
      speech = `"Hừm... Sự kết hợp giữa '${d1.name}' (${d1.desc}) và '${d2.name}' (${d2.desc}) có hương vị khá độc lạ và mới mẻ. Lần sau đầu bếp thử nêm nếm thêm xem sao nhé!"`;
    }
  } else {
    // Thực đơn đại tiệc từ 3 đến 6+ món
    const itemsSummary = dishDetails.map((d, i) => `Món ${i + 1} '${d.name}': ${d.desc}`).join('; ');
    sensorySentence = `Thực đơn ${dishes.length} món gồm: ${itemsSummary}`;

    if (dishes.length <= 4) {
      moodTag = avgScore >= 80 ? `Đại Tiệc ${dishes.length} Món Thịnh Soạn! 👑🎉` : `Tiệc ${dishes.length} Món Vừa Vị! 😋👍`;
    } else {
      moodTag = avgScore >= 80 ? `Mâm Cỗ Hoàng Gia ${dishes.length} Món! 🏆✨` : `Mâm Cỗ ${dishes.length} Món Đa Sắc! 🍲🌟`;
    }

    const dishListWithSensory = formatNaturalList(dishDetails.map(d => `'${d.name}' (${d.desc})`), 'và');

    if (avgScore >= 80) {
      if (character.id === 'chef_bear') {
        speech = `"Nhoàm nhoàm... TRỜI ƠI MỘT MÂM CỖ ĐẠI TIỆC HOÀNG GIA! Tận ${dishes.length} món được chuẩn bị công phu: ${dishListWithSensory}! Ăn một bữa thịnh soạn no nê ngập tràn hương vị thế này thì sướng nhất trần đời, điểm tuyệt đối cho đầu bếp!"`;
      } else if (character.id === 'cat_miu') {
        speech = `"Măm măm... ÔI MÂM CỖ NHIỀU MÓN QUÁ! Có tận ${dishes.length} món thơm lừng bày đầy trên bàn: ${dishListWithSensory}! Món nào cũng ngon tuyệt làm Miu no căng bụng luôn nè!"`;
      } else if (character.id === 'dragon_long') {
        speech = `"Khà khà... ĐẠI TIỆC VUA CHÚA! ${dishes.length} món phong phú từ ${dishListWithSensory}, ăn uống ngập tràn thế này mới xứng tầm rồng lửa ta chứ!"`;
      } else if (character.id === 'fox_gourmet') {
        speech = `"Trầm trồ thực sự! Một đại tiệc ${dishes.length} món đỉnh cao: ${dishListWithSensory}! Sự am hiểu và phối vị tài tình của đầu bếp khiến một người sành ăn như tôi vô cùng thán phục!"`;
      } else if (character.id === 'rabbit_gardener') {
        speech = `"Chóp chép... ÔI ĐẠI TIỆC VƯỜN HOA RỰC RỠ! Tận ${dishes.length} món thơm lành bày ngập tràn trên bàn: ${dishListWithSensory}! Bữa ăn tươi mát ngon lành này làm tôi vui sướng vô cùng!"`;
      } else {
        speech = `"Kinh ngạc thực sự! Một thực đơn ${dishes.length} món được xây dựng công phu và đa dạng: ${dishListWithSensory}! Sự phối hợp ẩm thực này đạt cấp độ đỉnh cao!"`;
      }
    } else if (avgScore >= 50) {
      speech = `"Măm măm! Bàn tiệc ${dishes.length} món gồm ${dishListWithSensory} ăn rất phong phú và ngon miệng (Hài hòa tổng thể: ${avgScore}/100 điểm)!"`;
    } else {
      speech = `"Hừm... Mâm cỗ ${dishes.length} món này có nhiều hương vị kết hợp khá độc lạ (${dishListWithSensory}). Lần sau đầu bếp chú ý cân bằng hơn nhé!"`;
    }
  }

  return {
    speech,
    moodTag,
    reactionType,
    score: avgScore,
    sensorySentence,
    dishReviews
  };
}

// 6. BỘ XÁC ĐỊNH ÂM THANH ĂN UỐNG & PLAYLIST THƯỞNG THỨC ĐA MÓN (SENSORY EATING PLAYLIST)
export function getEatingSoundForItem(item) {
  if (item.texture === 'drink') {
    return item.hasIce ? 'drink_with_ice.ogg' : 'drink.ogg';
  }
  if (item.texture === 'liquid') {
    return 'eat_liquid_food.ogg';
  }
  if (item.texture === 'crispy') {
    return 'eat_crispy_food.ogg';
  }
  return 'eat_soft_food.ogg';
}

export function buildEatingAudioPlaylist(items) {
  if (!items || items.length === 0) return ['eat_soft_food.ogg'];

  // Thu thập toàn bộ âm thanh theo đúng thứ tự trên dĩa (không lọc trùng, không đảo thứ tự)
  return items.map(item => getEatingSoundForItem(item));
}

// FEED CHARACTER (ASYNC WITH SEQUENTIAL PLAY WAIT AUDIO & ARIA BUSY)
