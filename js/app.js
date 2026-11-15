import {
  CHARACTERS,
  FRIDGE_CATEGORIES,
  INGREDIENTS,
  STATIONS,
  SPICES,
  GARNISH_OPTIONS,
  FLAVOR_DIMENSIONS
} from './data/index.js';
import { state } from './core/state.js';
import { getSavedSettings, applySettingsToState } from './core/settings.js';
import { announceNVDA } from './accessibility/nvda-announcer.js';
import { playExternalAudio, playSoundEffect } from './audio/sound-engine.js';
import { createFoodItem, describeItemStateShort } from './cooking/food-item.js';
import { analyzeCulinaryChemistry } from './cooking/chemistry.js';
import {
  formatActionHistoryChain,
  groupItemsByCookingHistory,
  generateSensoryTastingReview,
  getEatingSoundForItem
} from './cooking/tasting-review.js';
import { registerStationActionHooks, performStationAction } from './cooking/station-actions.js';
import { registerRenderers, renderAll } from './ui/render-coordinator.js';
import { renderStartScreenCharacters } from './ui/start-screen.js';
import { renderFridge, addIngredientFromFridge } from './ui/fridge-view.js';
import { renderWorkbench } from './ui/workbench-view.js';
import { renderStagingTray } from './ui/staging-view.js';
import { renderSpices, applySpice } from './ui/spices-view.js';
import { renderServingPlate, feedCharacter } from './ui/dining-view.js';
import { renderFinishModalGarnishes } from './ui/kitchen-modals.js';
import { startAnimationLoop } from './ui/canvas-renderer.js';
import { bindEvents } from './ui/keyboard-shortcuts.js';

registerRenderers({
  renderStartScreenCharacters,
  renderFridge,
  renderWorkbench,
  renderStagingTray,
  renderSpices,
  renderServingPlate
});

registerStationActionHooks({
  announce: announceNVDA,
  playExternalAudio,
  playSoundEffect,
  renderWorkbench,
  renderAll
});

let hasInitializedApp = false;

/**
 * Initialize settings, UI bindings, initial render, and animation loop.
 */
export function initApp() {
  if (hasInitializedApp) return;
  hasInitializedApp = true;
  applySettingsToState(getSavedSettings(), state);
  bindEvents();
  renderAll();
  startAnimationLoop();
}

if (typeof window !== 'undefined') {
  if (typeof document !== 'undefined' && document.readyState === 'complete') {
    initApp();
  } else {
    window.addEventListener('load', initApp);
  }
}

export const __TEST_API__ = {
  STATIONS, INGREDIENTS, SPICES, CHARACTERS, FRIDGE_CATEGORIES, GARNISH_OPTIONS, FLAVOR_DIMENSIONS,
  state, createFoodItem, performStationAction, applySpice, addIngredientFromFridge,
  describeItemStateShort, formatActionHistoryChain, groupItemsByCookingHistory,
  analyzeCulinaryChemistry, generateSensoryTastingReview, getEatingSoundForItem,
  renderFridge, renderWorkbench, renderStagingTray, renderSpices, renderServingPlate,
  renderFinishModalGarnishes, bindEvents, announceNVDA, feedCharacter, initApp
};
