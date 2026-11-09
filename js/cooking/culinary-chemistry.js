// Pure culinary descriptions, scoring, and dish-title generation.

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
        stirred: 'khuấy ly',
        shaken: 'lắc shaker',
        brewed: 'hãm nóng',
        steamed: 'hấp cách thủy',
        air_fried: 'chiên giòn bằng khí nóng',
        rice_cooked: 'nấu chín bằng nồi cơm điện',
        microwaved: 'làm nóng bằng vi sóng'
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

    function analyzeCulinaryChemistry(items) {
      const totals = { umami: 0, salty: 0, sweet: 0, sour: 0, spicy: 0, fatty: 0, bitter: 0, aroma: 0 };
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
        else allStructures.add('loose');

        if (it.isFreshBalancer && it.cookLevel <= 1) hasFreshBalancer = true;
        if (it.cookMethod === 'boiled' && it.cookLevel >= 1) hasBoiledSoup = true;
        if (it.cookLevel >= 3) hasBurnt = true;
        if (it.needsCooking && it.cookLevel === 0) hasRawMeat = true;

        if (it.category === 'sweets' || it.id === 'chocolate' || it.id === 'milk' || it.id === 'oreo') hasSweets = true;
        if (it.category === 'meat' || it.category === 'seafood' || it.id === 'egg' || it.id === 'pate') hasMeatOrSavory = true;
        if (it.id === 'cheese_stick' || it.id === 'cheese_slice' || it.id === 'mozzarella' || it.id === 'parmesan_cheese' || it.id === 'cheese_foam' || it.id === 'cream_cheese' || it.baseId === 'cheese_slice' || it.baseId === 'mozzarella' || it.baseId === 'parmesan_cheese' || it.baseId === 'cheese_foam' || it.baseId === 'cream_cheese') hasCheese = true;
        if (it.baseId === 'white_sugar' || it.baseId === 'brown_sugar' || it.baseId === 'palm_sugar' || it.baseId === 'rock_sugar' || it.baseId === 'malt_syrup' || it.baseId === 'condensed_milk' || it.id === 'condensed_milk') {
          if (it.cookLevel >= 1 && (it.cookMethod === 'fried' || it.cookMethod === 'deep_fried' || it.cookMethod === 'baked' || it.cookMethod === 'grilled' || (it.actionHistory && it.actionHistory.some(a => ['fried', 'deep_fried', 'baked', 'grilled'].includes(a))))) {
            hasCaramelizedSugar = true;
          }
        }
        if (it.baseId === 'fried_shallots' || it.baseId === 'scallion_oil' || it.id === 'fried_shallots' || it.id === 'scallion_oil') hasShallotOrScallionOil = true;
        if (it.category === 'beans_seeds' || it.baseId === 'mung_bean' || it.baseId === 'black_bean' || it.baseId === 'white_bean' || it.baseId === 'red_bean' || it.baseId === 'lotus_seed' || it.baseId === 'lotus_root') {
          if (it.cookLevel >= 1 || it.cookMethod === 'boiled') hasBeansOrLotus = true;
        }
        if (it.baseId === 'onion' && it.cookLevel >= 1) hasCaramelizedOnion = true;
        if (it.category === 'starch' || it.category === 'noodles_flour' || it.baseId === 'rice_paper' || it.baseId === 'sweet_corn') hasStarchOrGrains = true;
        if (alcoholIds.includes(it.baseId) || alcoholIds.includes(it.id)) {
          if (it.cookLevel >= 1 || ['fried', 'deep_fried', 'baked', 'grilled', 'boiled', 'brewed', 'steamed'].includes(it.cookMethod) || (it.actionHistory && it.actionHistory.some(a => ['fried', 'deep_fried', 'baked', 'grilled', 'boiled', 'brewed'].includes(a)))) {
            hasHeatedAlcohol = true;
          }
        }
        if (gelatinStarchIds.includes(it.baseId) || gelatinStarchIds.includes(it.id)) {
          if (it.cookLevel >= 1 || ['boiled', 'fried', 'baked', 'deep_fried', 'grilled', 'steamed'].includes(it.cookMethod)) {
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
              if (sub.cookLevel >= 1 || it.cookLevel >= 1 || it.cookMethod === 'boiled') hasBeansOrLotus = true;
            }
            if (sub.baseId === 'onion' && (sub.cookLevel >= 1 || it.cookLevel >= 1)) hasCaramelizedOnion = true;
            if (sub.category === 'starch' || sub.category === 'noodles_flour' || sub.baseId === 'rice_paper' || sub.baseId === 'sweet_corn') hasStarchOrGrains = true;
            if (alcoholIds.includes(sub.baseId) || alcoholIds.includes(sub.id)) {
              if (sub.cookLevel >= 1 || it.cookLevel >= 1 || ['fried', 'deep_fried', 'baked', 'grilled', 'boiled', 'brewed'].includes(it.cookMethod)) {
                hasHeatedAlcohol = true;
              }
            }
            if (gelatinStarchIds.includes(sub.baseId) || gelatinStarchIds.includes(sub.id)) {
              if (sub.cookLevel >= 1 || it.cookLevel >= 1) {
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

      const countFactor = Math.max(1, Math.sqrt(items.length) * 0.88);
      const blended = {};
      Object.keys(totals).forEach(k => {
        blended[k] = Math.max(0, totals[k] / countFactor);
      });

      const synergies = [];
      const warnings = [];

      // 1. Sweet + Sour harmony
      if (blended.sour >= 1.4 && blended.sweet >= 1.4) {
        blended.sour *= 0.82;
        blended.sweet *= 0.88;
        blended.aroma += 1.2;
        synergies.push('🍋🍬 Hòa Vị Chua Ngọt (Dịu độ gắt, cân bằng tự nhiên)');
      }
      // 2. Salt unlocks Umami (Pure sensory, no meat/sauce assumption)
      if (blended.salty >= 1.0 && blended.salty <= 4.8 && blended.umami >= 1.5) {
        blended.umami *= 1.22;
        blended.sweet += 0.4;
        synergies.push('🧂✨ Muối Hài Hòa Tôn Vị Umami (Kích hoạt chiều sâu đượm đà)');
      }
      // 3. Acid/Pickles cut Fat (Pure sensory)
      if (blended.fatty >= 2.5 && (blended.sour >= 1.2 || hasFreshBalancer)) {
        blended.fatty *= 0.68;
        blended.aroma += 1.0;
        synergies.push('✨ Cân Bằng Độ Béo (Vị chua hoặc vị thanh giúp giảm độ ngấy béo)');
      } else if (blended.fatty >= 4.5 && blended.sour < 0.8 && !hasFreshBalancer) {
        warnings.push('⚠️ Món ăn có độ béo khá cao (Gợi ý: điều chỉnh giảm độ béo hoặc bổ sung vị thanh để cân bằng)');
      }
      // 4. Fat tames Spice
      if (blended.spicy >= 3.2 && blended.fatty >= 2.0) {
        blended.spicy *= 0.78;
        synergies.push('🧈🌶️ Vị Béo Làm Dịu Độ Cay Gắt');
      }
      // 5. Rich Sweet + Fat Harmony (Pure sensory)
      if (blended.sweet >= 2.6 && blended.fatty >= 2.0 && blended.aroma >= 1.8) {
        synergies.push('✨ Hòa Vị Béo Ngọt (Cân bằng độ béo ngậy và vị ngọt êm dịu)');
      }
      // 5b. Fat tames Bitterness (Pure Sensory Chemistry - Hóa học cảm quan tự do, không công thức cứng)
      if (blended.fatty >= 1.8 && blended.bitter >= 2.0) {
        blended.bitter *= 0.82;
        blended.aroma += 1.2;
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
        blended.sweet *= 0.95;
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
        warnings.push('炭 Có nguyên liệu bị nấu quá lửa cháy khét đen!');
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
      if (normalized.sour > 5.2) score -= (normalized.sour - 5.2) * 8;
      if (normalized.bitter > 2.0) score -= (normalized.bitter - 2.0) * 11;
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

    function generateSmartDishTitle(items, norm) {
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

      const names = items.slice(0, 3).map(i => i.name).join(' & ');
      const extra = items.length > 3 ? ` (+${items.length - 3} món)` : '';
      return `${names}${extra}${suffix}`;
    }

    /*************************************************************************
     * 6. ĐIỀU HƯỚNG TAB & CƠ CHẾ NẤU, KHAY TẠM, HOÀN THÀNH MÓN ĂN
     *************************************************************************/

    // BỘ ĐIỀU KHIỂN CHUYỂN TAB 5 KHU VỰC NHÀ BẾP (ACCESSIBLE 5-TAB CONTROLLER)
