import { STATIONS } from '../data/stations.js';
import { state } from '../core/state.js';
import { itemContainsIce } from './food-item.js';
import { combineFlavorProfiles } from './chemistry.js';

const defaultHooks = {
  announce: () => {},
  playExternalAudio: () => Promise.resolve(),
  playSoundEffect: () => {},
  renderWorkbench: () => {},
  renderAll: () => {}
};

/**
 * Register runtime UI/audio hooks so cooking actions remain decoupled from DOM.
 */
export function registerStationActionHooks(hooks = {}) {
  Object.assign(defaultHooks, hooks);
}

const HEAT_METHODS = {
  fry_step: { method: 'fried', soundFile: 'frying_pan.ogg', verb: 'Áp chảo / Xào' },
  boil_step: { method: 'boiled', soundFile: 'pot_of_boiling_water.ogg', verb: 'Luộc / Hầm' },
  deep_fry_step: { method: 'deep_fried', soundFile: 'deep_frying_pan.ogg', verb: 'Chiên ngập dầu' },
  bake_step: { method: 'baked', soundFile: 'oven.ogg', verb: 'Nướng lò' },
  grill_step: { method: 'grilled', soundFile: 'grill rack.ogg', verb: 'Nướng vỉ than hoa' },
  steam_step: { method: 'steamed', soundFile: 'pot_of_boiling_water.ogg', verb: 'Hấp cách thủy' },
  wok_fry_step: { method: 'wok_fried', soundFile: 'frying_pan.ogg', verb: 'Đảo Wok lửa lớn' },
  grill_pan_step: { method: 'pan_grilled', soundFile: 'grill rack.ogg', verb: 'Nướng chảo gang' },
  pressure_cook_step: { method: 'pressure_cooked', soundFile: 'pot_of_boiling_water.ogg', verb: 'Ninh áp suất' },
  air_fry_step: { method: 'air_fried', soundEffect: 'deep_fry', verb: 'Chiên bằng khí nóng' },
  rice_cook_step: { method: 'rice_cooked', soundEffect: 'boil', verb: 'Nấu bằng nồi cơm điện' },
  microwave_step: { method: 'microwaved', soundEffect: 'microwave', verb: 'Làm nóng bằng vi sóng' }
};

const NON_HEAT_METHODS = [
  'none', 'stirred', 'shaken', 'brewed', 'blended',
  'rolled', 'stuffed', 'mixed', 'kneaded', 'whisked'
];

const MIX_SHORT_LABELS = {
  mixed: 'trộn đều',
  kneaded: 'nhào dẻo',
  whisked: 'đánh mịn',
  sliced: 'thái lát',
  diced: 'thái hạt lựu',
  minced: 'băm nhuyễn',
  fried: 'áp chảo',
  deep_fried: 'chiên giòn',
  baked: 'nướng lò',
  grilled: 'nướng than',
  boiled: 'luộc/hầm',
  steamed: 'hấp',
  air_fried: 'chiên khí nóng',
  rice_cooked: 'nấu nồi cơm',
  microwaved: 'quay vi sóng',
  wok_fried: 'đảo Wok',
  pan_grilled: 'nướng chảo gang',
  pressure_cooked: 'ninh áp suất'
};

const BEV_SHORT_LABELS = {
  stirred: 'khuấy ly',
  shaken: 'lắc shaker',
  brewed: 'hãm nóng',
  blended: 'xay sinh tố',
  air_fried: 'chiên khí nóng',
  rice_cooked: 'nấu bằng nồi cơm điện',
  microwaved: 'làm nóng bằng vi sóng',
  boiled: 'luộc/hầm',
  fried: 'áp chảo',
  deep_fried: 'chiên ngập dầu',
  baked: 'nướng lò',
  grilled: 'nướng than'
};

/**
 * Flatten subItems when performing sequential blend/mix/beverage operations.
 */
function collectFlattenedSubItems(items, kindsToFlatten) {
  const flattened = [];
  items.forEach((item) => {
    if (kindsToFlatten.includes(item.kind) && item.subItems && item.subItems.length > 0) {
      item.subItems.forEach((sub) => flattened.push(sub));
    } else {
      flattened.push(item);
    }
  });
  return flattened;
}

/**
 * Merge outer and inner spices while preserving distinct outer/inner attribution.
 */
function mergeLayeredSpices(outerItem, innerItems) {
  const combinedSpices = [...(outerItem.spicesApplied || [])];
  const innerSpices = [];
  const innerBatchIds = new Set();

  innerItems.forEach((inner) => {
    (inner.spicesApplied || []).forEach((sp) => {
      combinedSpices.push({ ...sp });
      innerSpices.push({ ...sp });
      if (sp.batchId) innerBatchIds.add(sp.batchId);
    });
  });

  const outerSpices = outerItem.spicesApplied
    ? outerItem.spicesApplied
      .filter((sp) => !sp.batchId || !innerBatchIds.has(sp.batchId))
      .map((sp) => ({ ...sp }))
    : [];

  return { combinedSpices, outerSpices, innerSpices };
}

/**
 * Append an action step to an item's actionHistory without consecutive duplicates.
 */
function appendActionStep(target, method) {
  if (!target.actionHistory) target.actionHistory = [];
  if (target.actionHistory.length === 0 || target.actionHistory[target.actionHistory.length - 1] !== method) {
    target.actionHistory.push(method);
  }
}

/**
 * Build a deduplicated sequential action history from source items.
 */
function buildInheritedActionHistory(items, newMethod, { ignoreIce = false, prevMixedKind = null } = {}) {
  const inherited = [];
  const relevant = ignoreIce
    ? items.filter((i) => i.id !== 'ice_cubes' && i.baseId !== 'ice_cubes')
    : items;

  const allShareSame = relevant.length > 0 && relevant.every(
    (i) => JSON.stringify(i.actionHistory || []) === JSON.stringify(relevant[0].actionHistory || [])
  );

  if (items.length === 1 || allShareSame) {
    const refItem = relevant[0] || items[0];
    (refItem?.actionHistory || []).forEach((act) => {
      if (inherited.length === 0 || inherited[inherited.length - 1] !== act) {
        inherited.push(act);
      }
    });
  } else if (prevMixedKind) {
    const prevMixed = items.filter((i) => i.kind === prevMixedKind && i.actionHistory && i.actionHistory.length > 0);
    const othersWithHistory = items.filter((i) => i.kind !== prevMixedKind && i.actionHistory && i.actionHistory.length > 0);
    if (prevMixed.length === 1 && othersWithHistory.length === 0) {
      prevMixed[0].actionHistory.forEach((act) => {
        if (inherited.length === 0 || inherited[inherited.length - 1] !== act) {
          inherited.push(act);
        }
      });
    }
  }

  if (inherited.length === 0 || inherited[inherited.length - 1] !== newMethod) {
    inherited.push(newMethod);
  }
  return inherited;
}

function handleCutAction(actionId, hooks) {
  const currentBatchId = state.nextBatchId++;
  hooks.playExternalAudio('food_cut.ogg', false);
  const cutMap = { slice: 'sliced', dice: 'diced', mince: 'minced' };
  const labelMap = { slice: 'thái lát mỏng', dice: 'thái hạt lựu', mince: 'băm nhuyễn' };

  state.stationItems.forEach((item) => {
    item.cutState = cutMap[actionId];
    item.lastStationId = state.activeStationId;
    item.batchId = currentBatchId;
    if (!item.actionHistory) item.actionHistory = [];
    if (!item.actionHistory.includes(cutMap[actionId])) {
      item.actionHistory.push(cutMap[actionId]);
    }
    item.flavors.aroma += 0.5;
    item.flavors.umami += 0.2;
  });

  const names = state.stationItems.map((i) => i.name).join(', ');
  hooks.announce(`Đã ${labelMap[actionId]} ${names} trên thớt gỗ. Thức ăn dậy mùi và sẵn sàng cuốn/nhồi hoặc nấu!`, 'polite');
  hooks.renderAll();
}

function handleRollAction(_actionId, hooks) {
  if (state.stationItems.length < 2) {
    hooks.announce('Để cuốn, bạn cần ít nhất 2 nguyên liệu: 1 nguyên liệu làm lớp vỏ ngoài (như bánh tráng, rong biển, lá lốt hoặc lát thịt bò) và các nguyên liệu làm nhân bên trong!', 'polite');
    return;
  }

  let wrapperIdx = state.stationItems.findIndex((i) => i.uid === state.selectedWrapperUid);
  if (wrapperIdx === -1) {
    const preferred = state.stationItems.findIndex((i) =>
      i.canBeWrapper || i.baseId === 'rice_paper' || i.baseId === 'nori_seaweed' ||
      i.baseId === 'betel_leaf' || i.baseId === 'pho_sheet' || i.baseId === 'tortilla_wrap' ||
      i.baseId === 'beef' || i.baseId === 'pork_belly' || i.baseId === 'scallion'
    );
    wrapperIdx = preferred !== -1 ? preferred : 0;
  }

  const [outerWrapper] = state.stationItems.splice(wrapperIdx, 1);
  const innerFillings = [...state.stationItems];
  hooks.playSoundEffect('roll');

  const combinedFlavors = combineFlavorProfiles([outerWrapper, ...innerFillings]);
  const { combinedSpices, outerSpices, innerSpices } = mergeLayeredSpices(outerWrapper, innerFillings);

  let anyNeedsCooking = outerWrapper.needsCooking && outerWrapper.cookLevel === 0;
  let maxCookLevel = outerWrapper.cookLevel;
  innerFillings.forEach((f) => {
    if (f.needsCooking && f.cookLevel === 0) anyNeedsCooking = true;
    if (f.cookLevel > maxCookLevel) maxCookLevel = f.cookLevel;
  });

  combinedFlavors.aroma += 1.5;
  combinedFlavors.umami += 0.8;

  const fillingNames = innerFillings.map((i) => i.name).join(' & ');
  const rolledName = `${outerWrapper.name} cuộn [${fillingNames}]`;
  const outerTexture = outerWrapper.texture === 'crispy' ? 'crispy' : 'soft';

  const inheritedRollActions = [...(outerWrapper.actionHistory || [])];
  if (inheritedRollActions.length === 0 || inheritedRollActions[inheritedRollActions.length - 1] !== 'rolled') {
    inheritedRollActions.push('rolled');
  }

  const rolledItem = {
    uid: state.nextItemUid++,
    kind: 'rolled',
    baseId: `roll_${outerWrapper.baseId}`,
    name: rolledName,
    emoji: '🌯',
    category: 'wrappers',
    color: outerWrapper.color,
    cookedColor: '#d97706',
    needsCooking: anyNeedsCooking,
    isFreshBalancer: outerWrapper.isFreshBalancer || innerFillings.some((i) => i.isFreshBalancer),
    cutState: 'whole',
    cookLevel: anyNeedsCooking ? 0 : Math.max(1, maxCookLevel),
    cookMethod: outerWrapper.cookMethod !== 'none' ? outerWrapper.cookMethod : 'none',
    actionHistory: inheritedRollActions,
    lastStationId: state.activeStationId,
    batchId: state.nextBatchId++,
    returnedFromStaging: false,
    texture: outerTexture,
    outerTexture,
    hasIce: outerWrapper.hasIce || innerFillings.some((i) => i.hasIce),
    spicesApplied: combinedSpices,
    outerSpices,
    innerSpices,
    subItems: [outerWrapper, ...innerFillings],
    innerItems: [...innerFillings],
    outerItem: outerWrapper,
    flavors: combinedFlavors
  };

  state.stationItems = [rolledItem];
  state.selectedWrapperUid = null;
  hooks.announce(`Đã cuộn tròn một lượt thành món "${rolledItem.name}"! Bạn có thể cất ra Khay Tạm (T) hoặc chuyển sang Chảo Chiên / Vỉ Than Nướng để làm chín vàng giòn rụm!`, 'polite');
  hooks.renderAll();
}

function handleStuffAction(_actionId, hooks) {
  if (state.stationItems.length < 2) {
    hooks.announce('Để nhồi, bạn cần ít nhất 2 nguyên liệu: 1 nguyên liệu làm vỏ nhồi (như ổ bánh mì, cây xúc xích, quả ớt chuông, mực, hoặc bánh oreo) và các nguyên liệu làm nhân nhồi vào ruột!', 'polite');
    return;
  }

  let vesselIdx = state.stationItems.findIndex((i) => i.uid === state.selectedVesselUid);
  if (vesselIdx === -1) {
    const primaryVessel = state.stationItems.findIndex((i) =>
      i.baseId === 'banh_mi_vn' || i.baseId === 'burger_bun' || i.baseId === 'taco_shell' || i.baseId === 'croissant'
    );
    if (primaryVessel !== -1) {
      vesselIdx = primaryVessel;
    } else {
      const preferred = state.stationItems.findIndex((i) =>
        i.canBeVessel || i.baseId === 'bell_pepper' || i.baseId === 'squid' ||
        i.baseId === 'lotus_root' || i.baseId === 'onion' || i.baseId === 'oreo' || i.baseId === 'sausage'
      );
      vesselIdx = preferred !== -1 ? preferred : 0;
    }
  }

  const [outerVessel] = state.stationItems.splice(vesselIdx, 1);
  const innerStuffings = [...state.stationItems];
  hooks.playSoundEffect('stuff');

  const combinedFlavors = combineFlavorProfiles([outerVessel, ...innerStuffings]);
  const { combinedSpices, outerSpices, innerSpices } = mergeLayeredSpices(outerVessel, innerStuffings);

  let anyNeedsCooking = outerVessel.needsCooking && outerVessel.cookLevel === 0;
  innerStuffings.forEach((s) => {
    if (s.needsCooking && s.cookLevel === 0) anyNeedsCooking = true;
  });

  combinedFlavors.aroma += 1.6;
  combinedFlavors.crunch += outerVessel.flavors.crunch ? outerVessel.flavors.crunch * 0.5 : 0;

  const stuffingNames = innerStuffings.map((i) => i.name).join(' & ');
  const stuffedName = `${outerVessel.name} nhồi [${stuffingNames}]`;
  const outerTexture = outerVessel.texture === 'crispy' ? 'crispy' : 'soft';

  const inheritedStuffActions = [...(outerVessel.actionHistory || [])];
  if (inheritedStuffActions.length === 0 || inheritedStuffActions[inheritedStuffActions.length - 1] !== 'stuffed') {
    inheritedStuffActions.push('stuffed');
  }

  const stuffedItem = {
    uid: state.nextItemUid++,
    kind: 'stuffed',
    baseId: `stuffed_${outerVessel.baseId}`,
    name: stuffedName,
    emoji: outerVessel.emoji,
    category: 'wrappers',
    color: outerVessel.color,
    cookedColor: '#b45309',
    needsCooking: anyNeedsCooking,
    isFreshBalancer: outerVessel.isFreshBalancer || innerStuffings.some((i) => i.isFreshBalancer),
    cutState: 'whole',
    cookLevel: anyNeedsCooking ? 0 : 1,
    cookMethod: outerVessel.cookMethod !== 'none' ? outerVessel.cookMethod : 'none',
    actionHistory: inheritedStuffActions,
    lastStationId: state.activeStationId,
    batchId: state.nextBatchId++,
    returnedFromStaging: false,
    texture: outerTexture,
    outerTexture,
    hasIce: outerVessel.hasIce || innerStuffings.some((i) => i.hasIce),
    spicesApplied: combinedSpices,
    outerSpices,
    innerSpices,
    subItems: [outerVessel, ...innerStuffings],
    innerItems: [...innerStuffings],
    outerItem: outerVessel,
    flavors: combinedFlavors
  };

  state.stationItems = [stuffedItem];
  state.selectedVesselUid = null;
  hooks.announce(`Đã xẻ ruột và nhồi chặt thành món "${stuffedItem.name}"! Bạn có thể cất ra Khay Tạm (T) hoặc cho vào Lò Nướng / Vỉ Than nướng nóng giòn!`, 'polite');
  hooks.renderAll();
}

async function handleBlendAction(_actionId, hooks) {
  state.isCookingBusy = true;
  state.stationActionFlash = 45;
  state.stationActionType = 'blend_smooth';
  hooks.renderWorkbench();
  hooks.announce('Đang xay nhuyễn nguyên liệu trong Máy Xay Sinh Tố...', 'polite');

  await hooks.playExternalAudio('blender.ogg', true);

  const blendSourceItems = collectFlattenedSubItems(state.stationItems, ['blended', 'mixed']);
  const names = blendSourceItems.map((i) => i.name);
  const combinedFlavors = combineFlavorProfiles(state.stationItems);
  combinedFlavors.aroma += 1.0;
  combinedFlavors.crunch = 0.0;

  const combinedSpices = [];
  let anyRaw = false;
  state.stationItems.forEach((item) => {
    if (item.needsCooking && item.cookLevel === 0) anyRaw = true;
    item.spicesApplied.forEach((sp) => combinedSpices.push({ ...sp }));
  });

  const isSweetDrink = blendSourceItems.every((i) =>
    i.category === 'sweets' || i.category === 'veg' || i.baseId === 'milk' || i.baseId === 'chocolate' || i.baseId === 'oreo'
  );
  const defaultBlendName = `${names.join(' & ')} (xay nhuyễn)`;
  const hasIceInBlender = state.stationItems.some((i) => itemContainsIce(i));
  const inheritedBlendActions = buildInheritedActionHistory(state.stationItems, 'blended', { ignoreIce: true });

  const blendedItem = {
    uid: state.nextItemUid++,
    kind: 'blended',
    baseId: 'blended_mix',
    name: defaultBlendName,
    emoji: isSweetDrink ? '🥤' : '🥣',
    category: 'sweets',
    color: state.stationItems[0].color,
    cookedColor: state.stationItems[0].cookedColor,
    needsCooking: anyRaw,
    isFreshBalancer: blendSourceItems.some((i) => i.isFreshBalancer),
    cutState: 'minced',
    cookLevel: anyRaw ? 0 : 1,
    cookMethod: 'blended',
    actionHistory: inheritedBlendActions,
    lastStationId: state.activeStationId,
    batchId: state.nextBatchId++,
    returnedFromStaging: false,
    texture: 'drink',
    hasIce: hasIceInBlender,
    outerTexture: null,
    spicesApplied: combinedSpices,
    subItems: [...blendSourceItems],
    outerItem: null,
    flavors: combinedFlavors
  };

  state.stationItems = [blendedItem];
  state.isCookingBusy = false;
  const coldBlendedPhrase = hasIceInBlender ? 'mát lạnh' : 'thơm ngon';
  hooks.announce(`Máy xay đã xay nhuyễn tất cả thành món "${blendedItem.name}" sánh mịn ${coldBlendedPhrase}!`, 'polite');
  hooks.renderAll();
}

async function handleBeverageAction(actionId, hooks) {
  state.isCookingBusy = true;
  state.stationActionFlash = 45;
  state.stationActionType = actionId;
  hooks.renderWorkbench();

  const hadIce = state.stationItems.some((i) => itemContainsIce(i));
  const isBrewing = actionId === 'brew_infuse';
  const iceMelted = isBrewing && hadIce;
  const hasIce = hadIce && !isBrewing;

  const bevConfig = {
    stir_pour: {
      soundFile: hasIce ? 'stir_ice.ogg' : 'stir_liquid.ogg',
      actionVerb: 'khuấy đều trong ly thủy tinh',
      method: 'stirred'
    },
    shake_shaker: {
      soundFile: hasIce ? 'shake_ice.ogg' : 'shake_liquid.ogg',
      actionVerb: 'lắc bình shaker sủi bọt',
      method: 'shaken'
    },
    brew_infuse: {
      soundFile: 'brew_drink.ogg',
      actionVerb: 'hãm nước sôi nóng hổi',
      method: 'brewed'
    }
  };
  const cfg = bevConfig[actionId];

  hooks.announce(`Đang ${cfg.actionVerb} tại Trạm Pha Chế...`, 'polite');
  await hooks.playExternalAudio(cfg.soundFile, true);

  const isContinuousBeverage = state.stationItems.length === 1 && state.stationItems[0].kind === 'beverage';
  const sourceItems = isContinuousBeverage && state.stationItems[0].subItems && state.stationItems[0].subItems.length > 0
    ? state.stationItems[0].subItems
    : state.stationItems;

  const names = sourceItems.map((i) => i.name);
  const combinedFlavors = combineFlavorProfiles(state.stationItems);
  combinedFlavors.aroma += 1.0;
  combinedFlavors.crunch = 0.0;

  const combinedSpices = [];
  let anyRaw = false;
  state.stationItems.forEach((item) => {
    if (item.needsCooking && item.cookLevel === 0 && actionId !== 'brew_infuse') anyRaw = true;
    (item.spicesApplied || []).forEach((sp) => combinedSpices.push({ ...sp, cookedIn: true }));
  });

  if (hasIce) combinedFlavors.aroma += 0.5;
  else if (iceMelted) combinedFlavors.aroma += 1.2;

  if (actionId === 'brew_infuse') {
    combinedFlavors.aroma += 1.8;
    combinedFlavors.bitter += 0.3;
  }
  if (actionId === 'shake_shaker') {
    combinedFlavors.aroma += 1.2;
    combinedFlavors.fatty *= 1.08;
  }

  const inheritedBevActions = buildInheritedActionHistory(state.stationItems, cfg.method, { ignoreIce: true });
  const methodLabel = inheritedBevActions.map((a) => BEV_SHORT_LABELS[a] || a).join(' & ');
  const defaultBeverageName = `${names.join(' & ')} (${methodLabel})`;

  let beverageEmoji = '🍹';
  if (hasIce) beverageEmoji = '🧋';
  else if (actionId === 'brew_infuse') beverageEmoji = '☕';
  else if (state.stationItems.some((i) => i.baseId === 'milk' || i.baseId === 'condensed_milk')) beverageEmoji = '🥛';
  else if (state.stationItems.some((i) => i.baseId === 'green_tea_leaves' || i.baseId === 'matcha_powder')) beverageEmoji = '🍵';
  else if (state.stationItems.some((i) => i.baseId === 'red_wine')) beverageEmoji = '🍷';
  else if (state.stationItems.some((i) => i.baseId === 'white_wine')) beverageEmoji = '🥂';
  else if (state.stationItems.some((i) => i.baseId === 'craft_beer')) beverageEmoji = '🍺';
  else if (state.stationItems.some((i) => i.baseId === 'dark_rum')) beverageEmoji = '🥃';
  else if (state.stationItems.some((i) => i.baseId === 'rice_wine_de' || i.baseId === 'purple_rice_wine')) beverageEmoji = '🍶';

  const beverageItem = {
    uid: state.nextItemUid++,
    kind: 'beverage',
    baseId: 'beverage_mix',
    name: defaultBeverageName,
    emoji: beverageEmoji,
    category: 'sweets',
    color: state.stationItems[0].color,
    cookedColor: state.stationItems[0].cookedColor,
    needsCooking: anyRaw,
    isFreshBalancer: state.stationItems.some((i) => i.isFreshBalancer),
    cutState: 'whole',
    cookLevel: anyRaw ? 0 : 1,
    cookMethod: cfg.method,
    actionHistory: [...inheritedBevActions],
    lastStationId: state.activeStationId,
    batchId: state.nextBatchId++,
    returnedFromStaging: false,
    texture: 'drink',
    hasIce,
    iceMelted,
    outerTexture: null,
    spicesApplied: combinedSpices,
    subItems: [...sourceItems],
    outerItem: null,
    flavors: combinedFlavors
  };

  state.stationItems = [beverageItem];
  state.isCookingBusy = false;

  let tempPhrase = 'thanh mát';
  if (iceMelted) tempPhrase = 'ấm dịu vừa miệng (do nước sôi đã làm tan chảy toàn bộ đá viên)';
  else if (hasIce) tempPhrase = 'mát lạnh sảng khoái';
  else if (isBrewing) tempPhrase = 'nóng hổi bốc khói';

  if (iceMelted) {
    hooks.announce(`Nước sôi nóng hổi đã làm tan chảy toàn bộ đá viên! Hòa quyện thành thức uống "${beverageItem.name}" ấm dịu thanh mát.`, 'polite');
  } else {
    hooks.announce(`Đã ${cfg.actionVerb} thành thức uống "${beverageItem.name}" ${tempPhrase}!`, 'polite');
  }
  hooks.renderAll();
}

async function handleMixAction(actionId, hooks) {
  state.isCookingBusy = true;
  state.stationActionFlash = 42;
  state.stationActionType = actionId;
  hooks.renderWorkbench();

  const mixConfig = {
    mix_toss: { soundFile: 'mix_bowl.ogg', fallbackSfx: 'mix_bowl', method: 'mixed', actionVerb: 'trộn đều hỗn hợp' },
    knead_dough: { soundFile: 'knead_dough.ogg', fallbackSfx: 'knead_dough', method: 'kneaded', actionVerb: 'nhào nặn dẻo quánh' },
    whisk_batter: { soundFile: 'whisk_batter.ogg', fallbackSfx: 'whisk_batter', method: 'whisked', actionVerb: 'đánh bông sánh mịn' }
  };
  const cfg = mixConfig[actionId];

  hooks.announce(`Đang ${cfg.actionVerb} trên Bàn Trộn Đa Năng...`, 'polite');
  await hooks.playExternalAudio(cfg.soundFile, true, cfg.fallbackSfx);

  const sourceItems = collectFlattenedSubItems(state.stationItems, ['mixed', 'blended']);
  const names = sourceItems.map((i) => i.name);
  const combinedFlavors = combineFlavorProfiles(state.stationItems);
  combinedFlavors.aroma += 0.6;

  const combinedSpices = [];
  let anyRaw = false;
  let maxCookLevel = 0;
  state.stationItems.forEach((item) => {
    if (item.needsCooking && item.cookLevel === 0) anyRaw = true;
    if ((item.cookLevel || 0) > maxCookLevel) maxCookLevel = item.cookLevel || 0;
    (item.spicesApplied || []).forEach((sp) => combinedSpices.push({ ...sp }));
  });

  let mixedTexture = 'soft';
  let canBeWrapper = false;
  let mixEmoji = '🥣';

  if (actionId === 'mix_toss') {
    const liquidCount = state.stationItems.filter((i) => i.texture === 'drink' || i.texture === 'liquid').length;
    const solidCount = state.stationItems.length - liquidCount;
    mixedTexture = (liquidCount <= solidCount && (combinedFlavors.crunch || 0) >= 2.0) ? 'crispy' : 'soft';
    if (liquidCount > solidCount) {
      combinedFlavors.crunch *= 0.65;
    }
  } else if (actionId === 'knead_dough') {
    mixedTexture = 'soft';
    combinedFlavors.crunch *= 0.25;
    combinedFlavors.umami += 0.3;
    canBeWrapper = true;
    mixEmoji = '🫓';
  } else if (actionId === 'whisk_batter') {
    mixedTexture = 'soft';
    combinedFlavors.crunch *= 0.15;
    combinedFlavors.aroma += 0.4;
    combinedFlavors.fatty *= 1.06;
    mixEmoji = '🥢';
  }

  const inheritedMixActions = buildInheritedActionHistory(state.stationItems, cfg.method, { prevMixedKind: 'mixed' });
  const methodLabel = inheritedMixActions.map((a) => MIX_SHORT_LABELS[a] || a).join(' ➔ ');
  const defaultMixedName = `${names.join(' & ')} (${methodLabel})`;

  const mixedItem = {
    uid: state.nextItemUid++,
    kind: 'mixed',
    baseId: 'mixed_dish',
    name: defaultMixedName,
    emoji: mixEmoji,
    category: sourceItems[0] ? sourceItems[0].category : 'veg',
    color: state.stationItems[0].color,
    cookedColor: state.stationItems[0].cookedColor,
    needsCooking: anyRaw,
    canBeWrapper,
    canBeVessel: false,
    isFreshBalancer: sourceItems.some((i) => i.isFreshBalancer),
    cutState: actionId === 'knead_dough' ? 'whole' : (state.stationItems[0].cutState || 'whole'),
    cookLevel: anyRaw ? 0 : maxCookLevel,
    cookMethod: cfg.method,
    actionHistory: [...inheritedMixActions],
    lastStationId: state.activeStationId,
    batchId: state.nextBatchId++,
    returnedFromStaging: false,
    texture: mixedTexture,
    hasIce: sourceItems.some((i) => itemContainsIce(i)),
    outerTexture: null,
    spicesApplied: combinedSpices,
    subItems: [...sourceItems],
    outerItem: null,
    flavors: combinedFlavors
  };

  state.stationItems = [mixedItem];
  state.isCookingBusy = false;

  const nextHint = anyRaw
    ? ' Hỗn hợp còn thành phần cần làm chín, bạn có thể mang đi chiên, nướng, hấp hoặc luộc!'
    : (canBeWrapper ? ' Khối nhào dẻo mịn này có thể đem nướng chín hoặc làm vỏ ở Bàn Cuộn!' : '');
  hooks.announce(`Đã ${cfg.actionVerb} thành "${mixedItem.name}".${nextHint}`, 'polite');
  hooks.renderAll();
}

function updateNestedCookedState(item, method) {
  item.spicesApplied.forEach((sp) => { sp.cookedIn = true; });
  if (item.outerSpices) item.outerSpices.forEach((sp) => { sp.cookedIn = true; });
  if (item.innerSpices) item.innerSpices.forEach((sp) => { sp.cookedIn = true; });

  if (item.subItems && item.subItems.length > 0) {
    item.subItems.forEach((sub) => {
      sub.cookLevel = Math.max(sub.cookLevel, item.cookLevel);
      sub.cookMethod = method;
      appendActionStep(sub, method);
      sub.spicesApplied.forEach((sp) => { sp.cookedIn = true; });
      if (item.cookLevel >= 1) sub.needsCooking = false;
    });
  }

  if (item.outerItem) {
    item.outerItem.cookLevel = Math.max(item.outerItem.cookLevel || 0, item.cookLevel);
    item.outerItem.cookMethod = method;
    appendActionStep(item.outerItem, method);
    if (item.cookLevel >= 1) item.outerItem.needsCooking = false;
  }

  if (item.innerItems && item.innerItems.length > 0) {
    item.innerItems.forEach((sub) => {
      sub.cookLevel = Math.max(sub.cookLevel || 0, item.cookLevel);
      if (!sub.cookMethod || sub.cookMethod === 'none') sub.cookMethod = method;
      appendActionStep(sub, method);
      sub.spicesApplied.forEach((sp) => { sp.cookedIn = true; });
      if (item.cookLevel >= 1) sub.needsCooking = false;
    });
  }
}

function applyHeatTexture(item, method) {
  const isLayered = item.kind === 'rolled' || item.kind === 'stuffed';
  if (method === 'deep_fried' || method === 'air_fried') {
    item.texture = 'crispy';
    if (isLayered) item.outerTexture = 'crispy';
  } else if (method === 'boiled' || method === 'pressure_cooked') {
    item.texture = 'liquid';
    if (isLayered) item.outerTexture = 'soft';
  } else if (method === 'steamed') {
    item.texture = item.texture === 'crispy' ? 'crispy' : 'soft';
    if (isLayered) item.outerTexture = 'soft';
  } else if (method === 'rice_cooked' || method === 'microwaved') {
    item.texture = 'soft';
    if (isLayered) item.outerTexture = 'soft';
  } else if (method === 'fried' || method === 'wok_fried') {
    item.texture = item.cookLevel >= 2 ? 'crispy' : 'soft';
  } else if (method === 'baked' || method === 'grilled' || method === 'pan_grilled') {
    if (item.cookLevel >= 2) {
      item.texture = 'crispy';
      if (isLayered) item.outerTexture = 'crispy';
    } else {
      item.texture = 'soft';
    }
  }
}

async function handleHeatAction(actionId, hooks) {
  const heat = HEAT_METHODS[actionId];
  if (!heat) return;

  const currentBatchId = state.nextBatchId++;
  state.isCookingBusy = true;
  state.stationActionFlash = 50;
  state.stationActionType = actionId;
  hooks.renderWorkbench();
  hooks.announce(`Đang ${heat.verb.toLowerCase()}...`, 'polite');

  if (heat.soundFile) {
    await hooks.playExternalAudio(heat.soundFile, true);
  } else {
    hooks.playSoundEffect(heat.soundEffect);
    await new Promise((resolve) => setTimeout(resolve, 350));
  }

  const descriptions = [];
  const firstCookDescriptions = {
    steamed: 'hấp chín mọng nước ngọt thanh',
    air_fried: 'chiên khí nóng vàng giòn mà không ngập dầu',
    rice_cooked: 'nấu chín dẻo bằng hơi nước trong nồi cơm điện',
    microwaved: 'làm nóng nhanh bằng vi sóng',
    wok_fried: 'đảo Wok lửa lớn thơm lừng mùi khói chảo',
    pan_grilled: 'nướng xém vân chảo gang thơm phức',
    pressure_cooked: 'ninh mềm ngọt nước bằng áp suất cao'
  };
  const secondCookDescriptions = {
    air_fried: 'đã vàng giòn hơn nhờ luồng khí nóng',
    rice_cooked: 'đã nấu mềm dẻo kỹ trong nồi cơm điện',
    microwaved: 'đã nóng hổi kỹ càng bằng vi sóng',
    wok_fried: 'đã xém cạnh thơm phức giòn rụm trên chảo Wok',
    pan_grilled: 'đã đậm đà ngập tràn vân nướng chảo gang',
    pressure_cooked: 'đã ninh nhừ rục xương ngọt đậm đà'
  };

  state.stationItems.forEach((item) => {
    if (NON_HEAT_METHODS.includes(item.cookMethod) || item.cookLevel === 0) {
      item.stationCookSteps = 1;
      item.cookLevel = 1;
    } else if (item.cookMethod !== heat.method) {
      item.stationCookSteps = 1;
      item.cookLevel = Math.min(2, item.cookLevel + 1);
    } else {
      item.stationCookSteps = (item.stationCookSteps || item.cookLevel || 1) + 1;
      item.cookLevel = item.stationCookSteps >= 3 ? 3 : 2;
    }

    item.cookMethod = heat.method;
    item.lastStationId = state.activeStationId;
    item.batchId = currentBatchId;
    appendActionStep(item, heat.method);
    updateNestedCookedState(item, heat.method);

    // High heat melts ice cubes
    item.hasIce = false;
    applyHeatTexture(item, heat.method);

    if (item.cookLevel === 1) {
      item.needsCooking = false;
      item.flavors.umami += 0.9;
      item.flavors.aroma += 1.4;
      item.flavors.sweet += heat.method === 'steamed' ? 0.6 : 0.4;
      if (heat.method === 'steamed') item.flavors.umami += 0.4;
      if (heat.method === 'deep_fried') item.flavors.crunch += 2.0;
      if (heat.method === 'air_fried') item.flavors.crunch += 1.5;
      if (heat.method === 'rice_cooked') {
        item.flavors.sweet += 0.6;
        item.flavors.umami += 0.3;
      }
      if (heat.method === 'microwaved') item.flavors.aroma += 0.3;
      if (heat.method === 'wok_fried') {
        item.flavors.aroma += 1.8;
        item.flavors.crunch += 1.0;
      }
      if (heat.method === 'pan_grilled') {
        item.flavors.aroma += 1.6;
        item.flavors.crunch += 0.8;
      }
      if (heat.method === 'pressure_cooked') {
        item.flavors.umami += 1.2;
        item.flavors.sweet += 0.5;
      }
      descriptions.push(`${item.name} đã ${firstCookDescriptions[heat.method] || 'chín tới thơm lừng'}`);
    } else if (item.cookLevel === 2) {
      item.needsCooking = false;
      item.flavors.aroma += 1.5;
      if (['fried', 'deep_fried', 'air_fried', 'baked', 'grilled', 'wok_fried', 'pan_grilled'].includes(heat.method)) {
        item.flavors.crunch += heat.method === 'air_fried' ? 1.2 : 1.8;
      }
      descriptions.push(`${item.name} ${secondCookDescriptions[heat.method] || 'đã chín vàng giòn rụm'}`);
    } else {
      item.flavors.bitter += 3.6;
      descriptions.push(`CẢNH BÁO: ${item.name} đã bị CHÁY KHÉT ĐEN!`);
    }
  });

  state.isCookingBusy = false;
  hooks.announce(`${heat.verb}: ${descriptions.join('; ')}.`, 'polite');
  hooks.renderAll();
}

const ACTION_HANDLERS = {
  slice: handleCutAction,
  dice: handleCutAction,
  mince: handleCutAction,
  roll_tight: handleRollAction,
  stuff_pack: handleStuffAction,
  blend_smooth: handleBlendAction,
  stir_pour: handleBeverageAction,
  shake_shaker: handleBeverageAction,
  brew_infuse: handleBeverageAction,
  mix_toss: handleMixAction,
  knead_dough: handleMixAction,
  whisk_batter: handleMixAction
};

/**
 * Execute a cooking, preparation, mixing, or beverage action on the active workbench station.
 */
export async function performStationAction(actionId, customHooks = null) {
  const hooks = customHooks ? { ...defaultHooks, ...customHooks } : defaultHooks;

  if (state.isCookingBusy) {
    hooks.announce('Bếp đang bận chế biến, vui lòng chờ trong giây lát.', 'polite');
    return;
  }

  const station = STATIONS.find((s) => s.id === state.activeStationId);
  if (!station) return;

  if (state.stationItems.length === 0) {
    hooks.announce(`${station.name} đang trống! Hãy chọn nguyên liệu từ Tủ Lạnh (Alt+1) bỏ vào đây trước.`, 'polite');
    return;
  }

  state.stationActionFlash = 24;
  state.stationActionType = actionId;

  const handler = ACTION_HANDLERS[actionId];
  if (handler) {
    await handler(actionId, hooks);
    return;
  }

  if (HEAT_METHODS[actionId]) {
    await handleHeatAction(actionId, hooks);
  }
}
