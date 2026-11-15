import { INGREDIENTS } from '../data/ingredients.js';
import { STATIONS } from '../data/stations.js';
import { SPICES } from '../data/spices.js';
import { GARNISH_OPTIONS } from '../data/garnishes.js';
import { state } from '../core/state.js';
import { createFoodItem } from './food-item.js';
import { getSpiceDistributionShare, analyzeCulinaryChemistry } from './chemistry.js';

/**
 * Add an ingredient from the fridge into either the active station or staging tray.
 */
export function addIngredientToState(ingId) {
  const ing = INGREDIENTS.find((i) => i.id === ingId);
  if (!ing) return null;

  const newItem = createFoodItem(ing);
  if (state.fridgeDestination === 'staging') {
    state.stagingItems.push(newItem);
    return {
      item: newItem,
      destination: 'staging',
      announcement: `Đã lấy ${ing.name} bỏ vào Khay Tạm Chờ Sơ Chế.`
    };
  }

  state.stationItems.push(newItem);
  const st = STATIONS.find((s) => s.id === state.activeStationId);
  return {
    item: newItem,
    destination: 'station',
    announcement: `Đã bỏ ${ing.name} vào ${st ? st.name : 'Bàn Chế Biến'}. Hiện có ${state.stationItems.length} nguyên liệu trong dụng cụ.`
  };
}

/**
 * Apply a spice onto all items currently in the active spice target (station or staging).
 */
export function applySpiceToState(spiceId) {
  const spice = SPICES.find((s) => s.id === spiceId);
  if (!spice) return { ok: false, reason: 'not_found' };

  const isStaging = state.spiceTarget === 'staging';
  const targetArray = isStaging ? state.stagingItems : state.stationItems;
  const targetName = isStaging ? 'Khay Tạm Chờ Sơ Chế' : 'Bàn Chế Biến';

  if (targetArray.length === 0) {
    return {
      ok: false,
      reason: 'empty',
      announcement: `Chưa có thức ăn nào trong ${targetName} để nêm ${spice.name}! Hãy lấy đồ ăn vào trước.`
    };
  }

  const spiceBatchId = 'spbatch_' + (state.nextBatchId++);
  const share = getSpiceDistributionShare(targetArray.length);

  targetArray.forEach((it) => {
    const spiceRecord = { id: spice.id, name: spice.name, cookedIn: false, batchId: spiceBatchId };
    it.spicesApplied.push(spiceRecord);

    if (it.kind === 'rolled' || it.kind === 'stuffed') {
      if (!it.outerSpices) it.outerSpices = [];
      it.outerSpices.push({ ...spiceRecord });
      if (it.outerItem) {
        if (!it.outerItem.spicesApplied) it.outerItem.spicesApplied = [];
        it.outerItem.spicesApplied.push({ ...spiceRecord });
      }
    }

    Object.keys(spice.add).forEach((k) => {
      it.flavors[k] = Math.max(0, (it.flavors[k] || 0) + spice.add[k] * share);
    });
  });

  state.stationActionFlash = 16;
  state.stationActionType = 'spice';

  const isSingleLayered = targetArray.length === 1 && (targetArray[0].kind === 'rolled' || targetArray[0].kind === 'stuffed');
  const announcement = isSingleLayered
    ? `Đã nêm ${spice.name} (${spice.desc}) lên lớp vỏ ngoài của món "${targetArray[0].name}".`
    : `Đã nêm ${spice.name} (${spice.desc}) vào ${targetName}.`;

  return { ok: true, spice, announcement };
}

/**
 * Move all items from the current station to the staging tray.
 */
export function moveStationToStagingState() {
  if (state.stationItems.length === 0) {
    return { ok: false, announcement: 'Không có thức ăn nào trên bếp để cất vào Khay Tạm!' };
  }
  const count = state.stationItems.length;
  const names = state.stationItems.map((i) => i.name).join(', ');
  state.stagingItems.push(...state.stationItems);
  state.stationItems = [];
  return {
    ok: true,
    count,
    announcement: `Đã cất ${count} món (${names}) ra Khay Tạm Chờ Sơ Chế. Bạn có thể lấy nguyên liệu khác nấu tiếp!`
  };
}

/**
 * Move all items from the staging tray back into the current station.
 */
export function moveStagingToStationState() {
  if (state.stagingItems.length === 0) {
    return { ok: false, announcement: 'Khay tạm đang trống, không có món nào để lấy vào bếp!' };
  }
  const st = STATIONS.find((s) => s.id === state.activeStationId);
  const count = state.stagingItems.length;
  const names = state.stagingItems.map((i) => i.name).join(', ');
  state.stagingItems.forEach((it) => { it.returnedFromStaging = true; });
  state.stationItems.push(...state.stagingItems);
  state.stagingItems = [];
  return {
    ok: true,
    count,
    announcement: `Đã lấy ${count} món (${names}) từ Khay Tạm vào ${st ? st.name : 'Bàn Chế Biến'} để chế biến tiếp!`
  };
}

/**
 * Plate all current station + staging items into a finished dish on the serving plate.
 */
export function plateCurrentKitchenItems(customNameInput = '') {
  const finishingItems = [...state.stagingItems, ...state.stationItems];
  if (finishingItems.length === 0) return null;

  const analysis = analyzeCulinaryChemistry(finishingItems);
  const customName = String(customNameInput || '').trim() || analysis.autoTitle || 'Món Ăn Sáng Tạo Đặc Biệt';
  const garnish = GARNISH_OPTIONS.find((g) => g.id === state.selectedGarnishId) || GARNISH_OPTIONS[0];

  const dishId = `dish_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  finishingItems.forEach((it) => {
    it.dishId = dishId;
    it.dishName = customName;
  });

  const newDish = {
    id: dishId,
    name: customName,
    garnish,
    items: [...finishingItems],
    analysis
  };

  if (!state.servedDishes) state.servedDishes = [];
  state.servedDishes.push(newDish);

  state.plateItems.push(...finishingItems);
  state.stationItems = [];
  state.stagingItems = [];

  state.customDishName = state.servedDishes.length === 1
    ? newDish.name
    : state.servedDishes.map((d) => d.name).join(' kèm ');

  return { newDish, finishingItems, garnish };
}
