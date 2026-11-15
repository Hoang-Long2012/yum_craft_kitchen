import { state } from '../core/state.js';

const registeredRenderers = {
  renderStartScreenCharacters: null,
  renderFridge: null,
  renderWorkbench: null,
  renderStagingTray: null,
  renderSpices: null,
  renderServingPlate: null
};

/**
 * Register screen and panel render callbacks without introducing circular module imports.
 * @param {Partial<typeof registeredRenderers>} renderers
 */
export function registerRenderers(renderers) {
  Object.assign(registeredRenderers, renderers);
}

/**
 * Re-render the currently active screen (Character Select or Kitchen).
 */
export function renderAll() {
  if (state.currentScreen === 'character_select') {
    if (registeredRenderers.renderStartScreenCharacters) {
      registeredRenderers.renderStartScreenCharacters();
    }
    return;
  }

  if (registeredRenderers.renderFridge) registeredRenderers.renderFridge();
  if (registeredRenderers.renderWorkbench) registeredRenderers.renderWorkbench();
  if (registeredRenderers.renderStagingTray) registeredRenderers.renderStagingTray();
  if (registeredRenderers.renderSpices) registeredRenderers.renderSpices();
  if (registeredRenderers.renderServingPlate) registeredRenderers.renderServingPlate();

  // Nút HOÀN THÀNH MÓN chỉ hiện khi trong bếp hoặc khay tạm có nguyên liệu
  const finishBtn = document.getElementById('btn-master-finish-dish');
  if (finishBtn) {
    const hasIngredientsToFinish = (state.stationItems.length + state.stagingItems.length) > 0;
    if (hasIngredientsToFinish) {
      finishBtn.classList.remove('hidden');
    } else {
      finishBtn.classList.add('hidden');
    }
  }
}
