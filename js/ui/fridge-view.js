import { FRIDGE_CATEGORIES, INGREDIENTS } from '../data/index.js';
import { state } from '../core/state.js';
import { announceNVDA } from '../accessibility/nvda-announcer.js';
import { attachRovingKeyNavigation } from '../accessibility/roving-navigation.js';
import { playSoundEffect } from '../audio/sound-engine.js';
import { addIngredientToState } from '../cooking/plating.js';
import { escapeHtml } from './dom-helpers.js';
import { renderAll } from './render-coordinator.js';

/**
 * Pick an ingredient from the fridge into the selected destination (station or staging).
 * @param {string} ingId
 */
export function addIngredientFromFridge(ingId) {
  const res = addIngredientToState(ingId);
  if (!res) return;
  playSoundEffect('pick');
  announceNVDA(res.announcement, 'polite');
  renderAll();
}

/**
 * Render the fridge category tabs and filtered ingredient grid.
 */
export function renderFridge() {
  const badgeEl = document.getElementById('fridge-total-count-badge');
  if (badgeEl) badgeEl.textContent = `${INGREDIENTS.length} món`;

  const tabsEl = document.getElementById('fridge-category-tabs');
  if (tabsEl) {
    const focusedCatId = document.activeElement && tabsEl.contains(document.activeElement)
      ? document.activeElement.dataset.catId
      : null;
    tabsEl.innerHTML = '';
    attachRovingKeyNavigation(tabsEl, '[role="tab"]', (targetBtn) => {
      targetBtn.click();
      targetBtn.focus();
    });
    FRIDGE_CATEGORIES.forEach(cat => {
      const isAct = cat.id === state.activeCategoryId;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.catId = cat.id;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', isAct ? 'true' : 'false');
      btn.setAttribute('tabindex', isAct ? '0' : '-1');
      btn.className = `px-2.5 py-1 rounded-xl text-xs font-bold transition ${
        isAct ? 'bg-orange-600 text-white shadow-sm' : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-300'
      }`;
      const catDisplayName = cat.id === 'all' ? `Tất cả (${INGREDIENTS.length})` : cat.name;
      btn.textContent = catDisplayName;
      btn.addEventListener('click', () => {
        const keepFocus = tabsEl.contains(document.activeElement);
        state.activeCategoryId = cat.id;
        playSoundEffect('pick');
        const catAnnounceName = cat.id === 'all' ? `Tất cả ${INGREDIENTS.length} món` : cat.name;
        announceNVDA(`Đã mở ngăn tủ: ${catAnnounceName}`, 'polite');
        renderFridge();
        if (keepFocus) {
          const nextFocus = tabsEl.querySelector(`[data-cat-id="${cat.id}"]`);
          if (nextFocus) nextFocus.focus();
        }
      });
      tabsEl.appendChild(btn);
    });
    if (focusedCatId) {
      const restoreBtn = tabsEl.querySelector(`[data-cat-id="${state.activeCategoryId}"]`);
      if (restoreBtn) restoreBtn.focus();
    }
  }

  const grid = document.getElementById('fridge-items-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const q = state.searchQuery.trim().toLowerCase();
  const filtered = INGREDIENTS.filter(ing => {
    const matchCat = state.activeCategoryId === 'all' || ing.category === state.activeCategoryId;
    const matchQ = !q || ing.name.toLowerCase().includes(q) || ing.flavorDesc.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="col-span-full text-xs text-slate-500 italic p-4 text-center">Không tìm thấy nguyên liệu nào trong ngăn này.</div>`;
    return;
  }

  filtered.forEach(ing => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('aria-label', `Lấy ${ing.name}. ${ing.flavorDesc}`);
    btn.className = 'game-btn btn-3d-slate p-2 rounded-2xl border border-slate-300 hover:border-orange-400 text-left transition flex flex-col justify-between gap-1 group';
    btn.innerHTML = `
      <div class="flex items-center justify-between w-full">
        <span class="text-2xl group-hover:scale-110 transition-transform" aria-hidden="true">${escapeHtml(ing.emoji)}</span>
        <span class="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
          ing.needsCooking ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
        }">${ing.needsCooking ? 'Cần nấu' : 'Tươi/Nấu'}</span>
      </div>
      <div class="font-bold text-xs text-slate-900 leading-tight">${escapeHtml(ing.name)}</div>
      <div class="text-[10px] text-slate-500 line-clamp-1">${escapeHtml(ing.flavorDesc)}</div>
    `;
    btn.addEventListener('click', () => addIngredientFromFridge(ing.id));
    grid.appendChild(btn);
  });
}
