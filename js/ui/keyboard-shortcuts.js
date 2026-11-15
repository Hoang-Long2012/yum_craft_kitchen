import { CHARACTERS, STATIONS } from '../data/index.js';
import { state, resetKitchenItemsState } from '../core/state.js';
import { announceNVDA } from '../accessibility/nvda-announcer.js';
import { playSoundEffect } from '../audio/sound-engine.js';
import { analyzeCulinaryChemistry } from '../cooking/chemistry.js';
import { performStationAction } from '../cooking/station-actions.js';
import { switchKitchenTab } from './kitchen-tabs.js';
import { moveStationToStaging, moveStagingToStation } from './workbench-view.js';
import { applySpice } from './spices-view.js';
import { feedCharacter, readDishSummary, resetKitchenAndGoBack } from './dining-view.js';
import { openHelpModal, openFinishDishModal, confirmPlatingDish, bindKitchenModals } from './kitchen-modals.js';
import { renderAll } from './render-coordinator.js';

/**
 * Bind all kitchen UI controls and global screen-reader-friendly keyboard shortcuts.
 */
export function bindEvents() {
  const { finishModal, modalSettings, modalHelp, modalConfirmBack, modalConfirmBackToMenu } = bindKitchenModals();

  // SCREEN 1: START SCREEN ACTIONS
  const btnStart = document.getElementById('btn-start-kitchen');
  btnStart.addEventListener('click', () => {
    state.currentScreen = 'kitchen';
    const screenSelect = document.getElementById('screen-character-select');
    const screenKitchen = document.getElementById('screen-kitchen');
    screenSelect.hidden = true;
    screenSelect.classList.add('hidden');
    screenSelect.classList.remove('flex');
    screenKitchen.hidden = false;
    screenKitchen.classList.remove('hidden');
    screenKitchen.classList.add('flex');

    const char = CHARACTERS.find(c => c.id === state.activeCharacterId) || CHARACTERS[0];
    document.getElementById('kitchen-char-avatar').textContent = char.emoji;
    document.getElementById('kitchen-char-title').textContent = `Đang Nấu Cho: ${char.name}`;
    document.getElementById('kitchen-char-craving-snippet').textContent = char.cravings[0];

    playSoundEffect('door');
    announceNVDA(`Chào mừng bạn vào bếp nấu cho ${char.name}! Hãy lấy nguyên liệu từ Tủ Lạnh (Alt+1) để bắt đầu.`, 'polite');
    renderAll();
    const firstTab = document.getElementById('tab-fridge');
    if (firstTab) firstTab.focus();
  });

  function syncSoundControls() {
    const sfxBtn = document.getElementById('kitchen-btn-sfx');
    const ttsBtn = document.getElementById('kitchen-btn-tts');
    const sIcon = document.getElementById('k-icon-sfx');
    const sLbl = document.getElementById('k-label-sfx');
    const tIcon = document.getElementById('k-icon-tts');
    const tLbl = document.getElementById('k-label-tts');

    sfxBtn.setAttribute('aria-pressed', state.sfxEnabled ? 'true' : 'false');
    ttsBtn.setAttribute('aria-pressed', state.ttsEnabled ? 'true' : 'false');
    sIcon.textContent = state.sfxEnabled ? '🔊' : '🔇';
    sLbl.textContent = `Âm thanh: ${state.sfxEnabled ? 'BẬT' : 'TẮT'}`;
    tIcon.textContent = state.ttsEnabled ? '🗣️' : '🔇';
    tLbl.textContent = state.ttsEnabled ? 'Giọng đọc: BẬT' : 'Giọng đọc: TẮT';

    if (state.sfxEnabled) playSoundEffect('pick');
    announceNVDA(`Âm thanh: ${state.sfxEnabled ? 'Bật' : 'Tắt'}. Giọng đọc: ${state.ttsEnabled ? 'Bật' : 'Tắt'}.`, 'polite');
  }

  // Sound & TTS Toggles on Start Screen
  document.getElementById('start-btn-toggle-sfx').addEventListener('click', (e) => {
    state.sfxEnabled = !state.sfxEnabled;
    e.currentTarget.setAttribute('aria-pressed', state.sfxEnabled ? 'true' : 'false');
    e.currentTarget.textContent = `🔊 Âm thanh Bếp: ${state.sfxEnabled ? 'BẬT' : 'TẮT'}`;
    syncSoundControls();
  });

  document.getElementById('start-btn-toggle-tts').addEventListener('click', (e) => {
    state.ttsEnabled = !state.ttsEnabled;
    e.currentTarget.setAttribute('aria-pressed', state.ttsEnabled ? 'true' : 'false');
    e.currentTarget.textContent = state.ttsEnabled ? '🗣️ Giọng đọc Web: BẬT' : '🗣️ Giọng đọc Web: TẮT (Dùng NVDA)';
    syncSoundControls();
  });

  // Help Modal Toggles
  const closeHelp = () => { if (modalHelp) modalHelp.close(); };
  const startBtnHelp = document.getElementById('start-btn-help');
  if (startBtnHelp) startBtnHelp.addEventListener('click', openHelpModal);
  const footerBtnHelp = document.getElementById('footer-btn-help');
  if (footerBtnHelp) footerBtnHelp.addEventListener('click', openHelpModal);
  const btnCloseHelp = document.getElementById('btn-close-help');
  if (btnCloseHelp) btnCloseHelp.addEventListener('click', closeHelp);

  // Kitchen Header Controls
  document.getElementById('kitchen-btn-sfx').addEventListener('click', () => {
    state.sfxEnabled = !state.sfxEnabled;
    syncSoundControls();
  });
  document.getElementById('kitchen-btn-tts').addEventListener('click', () => {
    state.ttsEnabled = !state.ttsEnabled;
    syncSoundControls();
  });

  // Back to Main Menu from Kitchen
  document.getElementById('btn-kitchen-back-to-mainmenu').addEventListener('click', () => {
    modalConfirmBackToMenu._returnFocusEl = document.activeElement;
    modalConfirmBackToMenu.showModal();
    document.getElementById('btn-cancel-back-to-menu').focus();
  });
  document.getElementById('btn-cancel-back-to-menu').addEventListener('click', () => modalConfirmBackToMenu.close());
  document.getElementById('btn-do-back-to-mainmenu').addEventListener('click', () => {
    resetKitchenItemsState();
    state.lastTastedMeal = null;
    if (typeof window !== 'undefined') {
      window.lastTastedMeal = null;
    }
    const shareContainer = document.getElementById('share-community-container');
    if (shareContainer) shareContainer.classList.add('hidden');
    modalConfirmBackToMenu._skipRestoreFocus = true;
    modalConfirmBackToMenu.close();
    if (typeof window.showScreen === 'function') {
      window.showScreen('main-menu');
    }
    announceNVDA('Đã dọn dẹp sạch sẽ nhà bếp và quay lại Menu Chính.', 'polite');
  });

  // Back to Character Select (Reset Kitchen) Modal
  document.getElementById('btn-back-to-select').addEventListener('click', () => {
    modalConfirmBack._returnFocusEl = document.activeElement;
    modalConfirmBack.showModal();
    document.getElementById('btn-cancel-back').focus();
  });
  document.getElementById('btn-cancel-back').addEventListener('click', () => modalConfirmBack.close());
  document.getElementById('btn-do-reset-and-back').addEventListener('click', () => {
    modalConfirmBack._skipRestoreFocus = true;
    resetKitchenAndGoBack();
  });

  // Character craving inspiration hint button
  document.getElementById('btn-char-hint').addEventListener('click', () => {
    const char = CHARACTERS.find(c => c.id === state.activeCharacterId) || CHARACTERS[0];
    const hint = char.cravings[state.cravingIndex % char.cravings.length];
    state.cravingIndex++;
    playSoundEffect('pick');
    document.getElementById('dining-speech-bubble').textContent = `"${hint}"`;
    announceNVDA(`Gợi ý sở thích của ${char.name}: ${hint}`, 'polite');
  });

  // 5-Tab Navigation (WCAG Tablist pattern with Arrow keys and click)
  const tabKeys = ['fridge', 'workbench', 'staging', 'spices', 'dining'];
  tabKeys.forEach((key, idx) => {
    const btn = document.getElementById('tab-' + key);
    if (btn) {
      btn.addEventListener('click', () => {
        playSoundEffect('pick');
        switchKitchenTab(key, false);
      });
      btn.addEventListener('keydown', (e) => {
        let targetIdx = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          targetIdx = (idx + 1) % tabKeys.length;
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          targetIdx = (idx - 1 + tabKeys.length) % tabKeys.length;
        } else if (e.key === 'Home') {
          e.preventDefault();
          targetIdx = 0;
        } else if (e.key === 'End') {
          e.preventDefault();
          targetIdx = tabKeys.length - 1;
        }
        if (targetIdx !== null) {
          const targetKey = tabKeys[targetIdx];
          playSoundEffect('pick');
          switchKitchenTab(targetKey, false);
          const targetBtn = document.getElementById('tab-' + targetKey);
          if (targetBtn) targetBtn.focus();
        }
      });
    }
  });

  // Fridge Destination Selector (Chỉ vào Bếp hoặc Khay Tạm)
  const btnDestStation = document.getElementById('dest-btn-station');
  const btnDestStaging = document.getElementById('dest-btn-staging');

  if (btnDestStation) {
    btnDestStation.addEventListener('click', () => {
      state.fridgeDestination = 'station';
      btnDestStation.setAttribute('aria-pressed', 'true');
      btnDestStation.className = 'flex-1 py-1.5 px-2 rounded-xl font-bold bg-orange-600 text-white shadow-sm transition text-center text-xs';
      if (btnDestStaging) {
        btnDestStaging.setAttribute('aria-pressed', 'false');
        btnDestStaging.className = 'flex-1 py-1.5 px-2 rounded-xl font-bold bg-transparent text-slate-700 hover:bg-white/60 transition text-center text-xs';
      }
      announceNVDA('Đã chọn: Lấy nguyên liệu từ tủ bỏ vào Bếp Đang Chọn.', 'polite');
    });
  }

  if (btnDestStaging) {
    btnDestStaging.addEventListener('click', () => {
      state.fridgeDestination = 'staging';
      btnDestStaging.setAttribute('aria-pressed', 'true');
      btnDestStaging.className = 'flex-1 py-1.5 px-2 rounded-xl font-bold bg-amber-600 text-white shadow-sm transition text-center text-xs';
      if (btnDestStation) {
        btnDestStation.setAttribute('aria-pressed', 'false');
        btnDestStation.className = 'flex-1 py-1.5 px-2 rounded-xl font-bold bg-transparent text-slate-700 hover:bg-white/60 transition text-center text-xs';
      }
      announceNVDA('Đã chọn: Lấy nguyên liệu từ tủ bỏ vào Khay Tạm Chờ Sơ Chế.', 'polite');
    });
  }

  // Fridge search input
  document.getElementById('fridge-search-input').addEventListener('input', (e) => {
    state.searchQuery = e.target.value || '';
    renderAll();
  });

  // Clear station items
  document.getElementById('btn-clear-station-items').addEventListener('click', () => {
    state.stationItems = [];
    announceNVDA('Đã dọn sạch nguyên liệu trên bếp.', 'polite');
    renderAll();
  });

  // Clear plate items
  document.getElementById('btn-clear-plate-items').addEventListener('click', () => {
    state.plateItems = [];
    state.servedDishes = [];
    state.customDishName = '';
    announceNVDA('Đã đổ sạch dĩa thức ăn để làm lại.', 'polite');
    renderAll();
  });

  // Staging Tray Buttons
  const bStToStag = document.getElementById('btn-station-to-staging');
  if (bStToStag) bStToStag.addEventListener('click', moveStationToStaging);
  const bStagToSt = document.getElementById('btn-staging-to-station');
  if (bStagToSt) bStagToSt.addEventListener('click', moveStagingToStation);

  // Spices Target Buttons (Chỉ Bếp hoặc Khay Tạm)
  const spStation = document.getElementById('spice-target-station');
  const spStaging = document.getElementById('spice-target-staging');

  if (spStation) {
    spStation.addEventListener('click', () => {
      state.spiceTarget = 'station';
      spStation.setAttribute('aria-pressed', 'true');
      spStation.className = 'px-3 py-1.5 rounded-xl font-bold bg-amber-600 text-white shadow-sm transition';
      if (spStaging) {
        spStaging.setAttribute('aria-pressed', 'false');
        spStaging.className = 'px-3 py-1.5 rounded-xl font-bold text-stone-700 hover:bg-white transition';
      }
      announceNVDA('Đã chọn nêm gia vị vào Bếp Đang Chọn.', 'polite');
    });
  }

  if (spStaging) {
    spStaging.addEventListener('click', () => {
      state.spiceTarget = 'staging';
      spStaging.setAttribute('aria-pressed', 'true');
      spStaging.className = 'px-3 py-1.5 rounded-xl font-bold bg-amber-600 text-white shadow-sm transition';
      if (spStation) {
        spStation.setAttribute('aria-pressed', 'false');
        spStation.className = 'px-3 py-1.5 rounded-xl font-bold text-stone-700 hover:bg-white transition';
      }
      announceNVDA('Đã chọn nêm gia vị vào Khay Tạm Chờ Sơ Chế.', 'polite');
    });
  }

  // Give water to character
  document.getElementById('btn-give-water').addEventListener('click', () => {
    const char = CHARACTERS.find(c => c.id === state.activeCharacterId) || CHARACTERS[0];
    playSoundEffect('drink');
    state.charAnimState = 'good';
    state.charAnimTimer = 45;
    const msg = `${char.name} vừa uống ly nước lọc mát lạnh: "Ực ực... Khà! Đã khát quá, hết cay và mặn rồi!"`;
    document.getElementById('dining-mood-tag').textContent = 'Sảng khoái 🥤😋';
    document.getElementById('dining-speech-bubble').textContent = msg;
    announceNVDA(msg, 'polite');
  });

  // Master Action Dock Buttons
  document.getElementById('btn-master-finish-dish').addEventListener('click', openFinishDishModal);
  document.getElementById('btn-master-feed').addEventListener('click', feedCharacter);
  document.getElementById('dock-btn-read-dish').addEventListener('click', readDishSummary);

  // Finish Dish Modal Actions
  document.getElementById('btn-close-finish-modal').addEventListener('click', () => finishModal.close());
  document.getElementById('btn-cancel-finish').addEventListener('click', () => finishModal.close());
  document.getElementById('btn-confirm-plate-dish').addEventListener('click', confirmPlatingDish);

  document.getElementById('btn-suggest-dish-name').addEventListener('click', () => {
    const finishingItems = [...state.stagingItems, ...state.stationItems];
    const analysis = analyzeCulinaryChemistry(finishingItems);
    const nameInput = document.getElementById('input-custom-dish-name');
    nameInput.value = analysis.autoTitle;
    playSoundEffect('pick');
    announceNVDA(`Đã gợi ý tên món: ${analysis.autoTitle}`, 'polite');
  });

  // Global Keyboard Navigation (Screen Reader Friendly)
  window.addEventListener('keydown', (e) => {
    const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
    const isTyping = tag === 'input' || tag === 'textarea';

    if (e.key === 'Escape') {
      if (finishModal && finishModal.open) { finishModal.close(); return; }
      if (modalConfirmBack && modalConfirmBack.open) { modalConfirmBack.close(); return; }
      if (modalConfirmBackToMenu && modalConfirmBackToMenu.open) { modalConfirmBackToMenu.close(); return; }
      if (modalHelp && modalHelp.open) { modalHelp.close(); return; }
      if (modalSettings && modalSettings.open) { modalSettings.close(); return; }
    }

    // Enter on Start Screen to start
    if (e.key === 'Enter' && state.currentScreen === 'character_select' && !isTyping) {
      e.preventDefault();
      document.getElementById('btn-start-kitchen').click();
      return;
    }

    // Enter on Finish Dish Modal to confirm
    if (e.key === 'Enter' && finishModal.open) {
      e.preventDefault();
      confirmPlatingDish();
      return;
    }

    // Alt+1..5 Quick Tab Switch
    if (e.altKey && !e.ctrlKey && !e.shiftKey && state.currentScreen === 'kitchen') {
      const tabMap = {
        '1': 'fridge',
        '2': 'workbench',
        '3': 'staging',
        '4': 'spices',
        '5': 'dining'
      };
      if (tabMap[e.key]) {
        e.preventDefault();
        const targetKey = tabMap[e.key];
        switchKitchenTab(targetKey, false);
        const targetBtn = document.getElementById('tab-' + targetKey);
        if (targetBtn) targetBtn.focus();
        return;
      }
    }

    if (isTyping) return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (state.singleKeyShortcutsEnabled === false) return;

    const k = e.key.toLowerCase();
    if (state.currentScreen === 'kitchen') {
      if (k === 'c') {
        e.preventDefault();
        const st = STATIONS.find(s => s.id === state.activeStationId);
        if (st && st.actions.length > 0) performStationAction(st.actions[0].id);
      } else if (k === 'k') {
        e.preventDefault();
        const st = STATIONS.find(s => s.id === state.activeStationId);
        if (st && st.isMixingStation) performStationAction('knead_dough');
        else announceNVDA('Phím K dùng để Nhào nặn dẻo quánh tại Bàn Trộn Đa Năng (Dụng cụ số 18)!', 'polite');
      } else if (k === 'w') {
        e.preventDefault();
        const st = STATIONS.find(s => s.id === state.activeStationId);
        if (st && st.isMixingStation) performStationAction('whisk_batter');
        else announceNVDA('Phím W dùng để Đánh bông / Đánh tan sánh mịn tại Bàn Trộn Đa Năng (Dụng cụ số 18)!', 'polite');
      } else if (k === 'r') {
        e.preventDefault();
        const st = STATIONS.find(s => s.id === state.activeStationId);
        if (st && st.isRollingStation) performStationAction('roll_tight');
        else if (st && st.isStuffingStation) performStationAction('stuff_pack');
        else announceNVDA('Phím R dùng tại Bàn Cuộn hoặc Trạm Nhồi! Hãy chọn dụng cụ số 2 hoặc số 3.', 'polite');
      } else if (k === 's') {
        e.preventDefault();
        const st = STATIONS.find(s => s.id === state.activeStationId);
        if (st && st.isBeverageStation) performStationAction('shake_shaker');
        else announceNVDA('Phím S dùng để Lắc bình Shaker tại Trạm Pha Chế Đồ Uống (Dụng cụ số 10)!', 'polite');
      } else if (k === 'b') {
        e.preventDefault();
        const st = STATIONS.find(s => s.id === state.activeStationId);
        if (st && st.isBeverageStation) performStationAction('brew_infuse');
        else announceNVDA('Phím B dùng để Hãm trà & cà phê nước nóng tại Trạm Pha Chế Đồ Uống (Dụng cụ số 10)!', 'polite');
      } else if (k === 't') {
        e.preventDefault();
        moveStationToStaging();
      } else if (k === 'p') {
        e.preventDefault();
        const hasIngredients = (state.stationItems.length + state.stagingItems.length) > 0;
        if (hasIngredients) {
          openFinishDishModal();
        } else {
          announceNVDA('Bếp và Khay Tạm đang trống, chưa có nguyên liệu nào để hoàn thành món! Hãy lấy nguyên liệu từ Tủ Lạnh (Alt+1) trước.', 'polite');
        }
      } else if (k === 'f') {
        e.preventDefault();
        feedCharacter();
      } else if (k === 'i') {
        e.preventDefault();
        readDishSummary();
      } else if (k === 'h') {
        e.preventDefault();
        openHelpModal();
      }
    }
  });
}

export { applySpice };
