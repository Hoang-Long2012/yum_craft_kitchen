/**
 * Global mutable game state for YumCraft Kitchen.
 */
export const state = {
  currentScreen: 'character_select', // 'auth' | 'main-menu' | 'character_select' | 'kitchen'
  activeKitchenTab: 'fridge', // 'fridge' | 'workbench' | 'staging' | 'spices' | 'dining'
  activeCharacterId: 'chef_bear',

  // Fridge filters
  activeCategoryId: 'all',
  searchQuery: '',
  fridgeDestination: 'station', // 'station' | 'staging'

  // Cooking Workbench
  activeStationId: 'cutting_board',
  stationItems: [],
  selectedWrapperUid: null, // UID of the chosen wrapper item in rolling mat
  selectedVesselUid: null,  // UID of the chosen vessel item in stuffing station

  // Staging Prep Tray
  stagingItems: [],

  // Serving Plate & Custom Dish Name
  plateItems: [],
  servedDishes: [], // [{ id, name, garnish, items, analysis }]
  customDishName: '',
  selectedGarnishId: 'rustic',

  // Spices Target
  spiceTarget: 'station', // 'station' | 'staging'

  // Audio & Accessibility Settings
  sfxEnabled: true,
  sfxVolume: 0.9,
  ttsEnabled: false,
  singleKeyShortcutsEnabled: true,
  liveToggleBuffer: false,
  liveRegionTimer: null,
  cravingIndex: 0,

  // External Audio & Action Busy Locks
  isCookingBusy: false,
  isFeedingBusy: false,
  eatingStatusText: '',

  // Last meal tasted (shared with Community Hub)
  lastTastedMeal: null,

  // Animations & Render Loops
  animTick: 0,
  stationActionFlash: 0,
  stationActionType: '',
  charAnimState: 'idle',
  charAnimTimer: 0,
  nextItemUid: 1,
  nextBatchId: 1
};

if (typeof window !== 'undefined') {
  window.state = state;
}

/**
 * Reset kitchen items and meal state cleanly when exiting or switching customer.
 */
export function resetKitchenItemsState() {
  state.stationItems = [];
  state.stagingItems = [];
  state.plateItems = [];
  state.servedDishes = [];
  state.customDishName = '';
  state.selectedWrapperUid = null;
  state.selectedVesselUid = null;
  state.lastTastedMeal = null;
  if (typeof window !== 'undefined') {
    window.lastTastedMeal = null;
  }
}
