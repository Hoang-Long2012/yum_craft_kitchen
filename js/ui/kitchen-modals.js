import { CHARACTERS, GARNISH_OPTIONS } from '../data/index.js';
import { state } from '../core/state.js';
import { announceNVDA } from '../accessibility/nvda-announcer.js';
import { bindDialogFocusRestore } from '../accessibility/dialog-manager.js';
import { attachRovingKeyNavigation } from '../accessibility/roving-navigation.js';
import { playSoundEffect } from '../audio/sound-engine.js';
import { analyzeCulinaryChemistry } from '../cooking/chemistry.js';
import { plateCurrentKitchenItems } from '../cooking/plating.js';
import { escapeHtml } from './dom-helpers.js';
import { switchKitchenTab } from './kitchen-tabs.js';
import { renderAll } from './render-coordinator.js';

/**
 * Open the Help modal and focus its close button.
 */
export function openHelpModal() {
  const modalHelp = document.getElementById('modal-help');
  if (!modalHelp) return;
  modalHelp._returnFocusEl = document.activeElement;
  modalHelp.showModal();
  const closeBtn = document.getElementById('btn-close-help');
  if (closeBtn) closeBtn.focus();
}

/**
 * Render garnish radio options inside the Finish Dish modal.
 */
export function renderFinishModalGarnishes() {
  const container = document.getElementById('finish-garnish-list');
  if (!container) return;
  const keepFocus = container.contains(document.activeElement);
  container.innerHTML = '';
  attachRovingKeyNavigation(container, '[role="radio"]', (targetBtn) => {
    targetBtn.click();
    targetBtn.focus();
  });

  GARNISH_OPTIONS.forEach(g => {
    const isSel = g.id === state.selectedGarnishId;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.garnishId = g.id;
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', isSel ? 'true' : 'false');
    btn.setAttribute('tabindex', isSel ? '0' : '-1');
    btn.className = `p-2 rounded-xl border text-left text-xs transition flex items-center gap-2 ${
      isSel ? 'bg-amber-600 text-white font-bold border-amber-700 shadow-sm' : 'bg-stone-50 hover:bg-amber-100 text-stone-800 border-stone-200'
    }`;
    btn.innerHTML = `<span class="text-lg" aria-hidden="true">${escapeHtml(g.emoji)}</span><span class="truncate">${escapeHtml(g.name)}</span>`;
    btn.addEventListener('click', () => {
      const hadFocus = container.contains(document.activeElement);
      state.selectedGarnishId = g.id;
      playSoundEffect('pick');
      announceNVDA(`Đã chọn kiểu trang trí: ${g.name}.`, 'polite');
      renderFinishModalGarnishes();
      if (hadFocus) {
        const restored = container.querySelector(`[data-garnish-id="${g.id}"]`);
        if (restored) restored.focus();
      }
    });
    container.appendChild(btn);
  });
  if (keepFocus) {
    const restored = container.querySelector(`[data-garnish-id="${state.selectedGarnishId}"]`);
    if (restored) restored.focus();
  }
}

/**
 * Open the Finish Dish modal to name and garnish the prepared items.
 */
export function openFinishDishModal() {
  const finishingItems = [...state.stagingItems, ...state.stationItems];
  if (finishingItems.length === 0) {
    announceNVDA('Chưa có bất kỳ thức ăn nào trong bếp hay khay tạm để hoàn thành! Hãy chọn nguyên liệu từ Tủ Lạnh (Alt+1) trước.', 'polite');
    return;
  }

  const analysis = analyzeCulinaryChemistry(finishingItems);

  const modal = document.getElementById('modal-finish-dish');
  const ingredientsSummaryEl = document.getElementById('finish-modal-ingredients-summary');
  const nameInput = document.getElementById('input-custom-dish-name');

  modal._returnFocusEl = document.activeElement;
  modal._skipRestoreFocus = false;
  ingredientsSummaryEl.textContent = analysis.structureSummary || 'Các món đã chế biến trong bếp';
  nameInput.value = analysis.autoTitle || 'Món Ăn Thượng Hạng Của Bếp';

  renderFinishModalGarnishes();

  playSoundEffect('pick');
  modal.showModal();
  nameInput.focus();
  nameInput.select();
  announceNVDA('Đã mở bảng Hoàn thành món ăn. Bạn có thể tự do gõ tên món theo ý thích, chọn đồ trang trí rồi bấm Enter để bày dĩa!', 'polite');
}

/**
 * Plate the finished dish and switch focus to the Dining tab.
 */
export function confirmPlatingDish() {
  const nameInput = document.getElementById('input-custom-dish-name');
  const res = plateCurrentKitchenItems(nameInput ? nameInput.value : '');
  if (!res) return;

  const { newDish, finishingItems, garnish } = res;
  const modal = document.getElementById('modal-finish-dish');
  modal._skipRestoreFocus = true;
  modal.close();

  const char = CHARACTERS.find(c => c.id === state.activeCharacterId) || CHARACTERS[0];
  playSoundEffect('react_good');

  switchKitchenTab('dining', false);
  renderAll();

  const totalDishes = state.servedDishes.length;
  const countMsg = totalDishes > 1
    ? ` Bàn tiệc hiện có ${totalDishes} món hoàn chỉnh, tổng cộng ${state.plateItems.length} nguyên liệu trên dĩa.`
    : ` (Món ăn kết hợp từ ${finishingItems.length} nguyên liệu).`;
  announceNVDA(`Món "${newDish.name}" đã được hoàn thành và bày biện đẹp mắt lên dĩa với phong cách ${garnish.name}!${countMsg} Đã tự động chuyển sang tab Bàn Tiệc & Thưởng Thức. Giờ đây bạn có thể bấm Phím F để đút cho ${char.name} thưởng thức!`, 'polite');

  const feedBtn = document.getElementById('btn-master-feed');
  if (feedBtn) feedBtn.focus();
}

/**
 * Register focus restoration for kitchen and settings/help dialogs.
 */
export function bindKitchenModals() {
  const finishModal = document.getElementById('modal-finish-dish');
  bindDialogFocusRestore(finishModal);
  const modalSettings = document.getElementById('modal-settings');
  bindDialogFocusRestore(modalSettings);
  const modalHelp = document.getElementById('modal-help');
  bindDialogFocusRestore(modalHelp);
  const modalConfirmBack = document.getElementById('modal-confirm-back');
  bindDialogFocusRestore(modalConfirmBack);
  const modalConfirmBackToMenu = document.getElementById('modal-confirm-back-to-menu');
  bindDialogFocusRestore(modalConfirmBackToMenu);

  return { finishModal, modalSettings, modalHelp, modalConfirmBack, modalConfirmBackToMenu };
}
