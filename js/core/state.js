// Shared mutable gameplay state.

export const state = {
      currentScreen: 'character_select', // 'character_select' | 'kitchen'
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
      servedDishes: [], // Danh sách các món ăn hoàn chỉnh đã bày lên dĩa [{ id, name, garnish, items, analysis }]
      lastTastedMeal: null,
      customDishName: '',
      selectedGarnishId: 'rustic',

      // Spices Target
      spiceTarget: 'station', // 'station' | 'staging'

      // Audio & Accessibility Settings
      sfxEnabled: true,
      ttsEnabled: false,
      liveToggleBuffer: false,
      cravingIndex: 0,

      // External Audio & Action Busy Locks
      isCookingBusy: false,
      isFeedingBusy: false,
      eatingStatusText: '',

      // Animations & Render Loops
      animTick: 0,
      stationActionFlash: 0,
      stationActionType: '',
      charAnimState: 'idle',
      charAnimTimer: 0,
      nextItemUid: 1,
      nextBatchId: 1
    };
