import { state } from '../core/state.js';
import { announceNVDA } from '../accessibility/nvda-announcer.js';
import { playSoundEffect } from '../audio/sound-engine.js';
import { describeItemStateShort } from '../cooking/food-item.js';
import { escapeHtml } from './dom-helpers.js';
import { renderAll } from './render-coordinator.js';

/**
 * Render the staging tray list and manage focus when returning or deleting items.
 */
export function renderStagingTray() {
  const badge = document.getElementById('staging-count-badge');
  if (badge) badge.textContent = `${state.stagingItems.length} món ở khay`;

  const listEl = document.getElementById('staging-items-list');
  if (!listEl) return;
  listEl.innerHTML = '';

  if (state.stagingItems.length === 0) {
    listEl.innerHTML = `<div role="listitem" class="p-2.5 rounded-2xl bg-white/70 border border-dashed border-amber-300 text-xs text-amber-800 text-center">Khay tạm đang trống. Hãy cất các món đã cuốn hoặc nấu dở ra đây để làm tiếp món khác!</div>`;
    return;
  }

  state.stagingItems.forEach((it, idx) => {
    const desc = describeItemStateShort(it);
    const row = document.createElement('div');
    row.setAttribute('role', 'listitem');
    row.className = 'p-2 rounded-2xl bg-white border border-amber-300 flex items-center justify-between gap-2 text-xs shadow-sm';
    row.innerHTML = `
      <div class="flex items-start gap-2 min-w-0">
        <span class="text-xl shrink-0" aria-hidden="true">${escapeHtml(it.emoji)}</span>
        <div class="min-w-0">
          <div class="font-bold text-stone-900 break-words leading-snug" title="${escapeHtml(it.name)}">${idx + 1}. ${escapeHtml(it.name)}</div>
          <div class="text-[10px] text-stone-600 break-words leading-snug" title="${escapeHtml(desc)}">${escapeHtml(desc)}</div>
        </div>
      </div>
      <div class="flex items-center gap-1 shrink-0">
        <button type="button" data-to-st="${idx}" class="px-2 py-1 rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-950 font-bold text-[10px]" aria-label="Đưa ${escapeHtml(it.name)} vào bếp hiện tại">
          Vào bếp
        </button>
        <button type="button" data-del-stag="${idx}" class="px-2 py-1 rounded-lg bg-stone-100 hover:bg-red-100 text-stone-600 hover:text-red-800 font-bold text-[10px]" aria-label="Xóa ${escapeHtml(it.name)} khỏi khay">
          Xóa
        </button>
      </div>
    `;
    row.querySelector(`[data-to-st="${idx}"]`).addEventListener('click', () => {
      const keepFocus = listEl.contains(document.activeElement);
      const [moved] = state.stagingItems.splice(idx, 1);
      moved.returnedFromStaging = true;
      state.stationItems.push(moved);
      playSoundEffect('pick');
      announceNVDA(`Đã đưa ${moved.name} từ Khay Tạm vào Bếp.`, 'polite');
      renderAll();
      if (keepFocus) {
        if (state.stagingItems.length > 0) {
          const nextIdx = Math.min(idx, state.stagingItems.length - 1);
          const nextBtn = listEl.querySelector(`[data-to-st="${nextIdx}"]`);
          if (nextBtn) nextBtn.focus();
        } else {
          const fallback = document.getElementById('panel-staging');
          if (fallback) fallback.focus();
        }
      }
    });
    row.querySelector(`[data-del-stag="${idx}"]`).addEventListener('click', () => {
      const keepFocus = listEl.contains(document.activeElement);
      const [del] = state.stagingItems.splice(idx, 1);
      announceNVDA(`Đã bỏ ${del.name} khỏi Khay Tạm.`, 'polite');
      renderAll();
      if (keepFocus) {
        if (state.stagingItems.length > 0) {
          const nextIdx = Math.min(idx, state.stagingItems.length - 1);
          const nextBtn = listEl.querySelector(`[data-del-stag="${nextIdx}"]`);
          if (nextBtn) nextBtn.focus();
        } else {
          const fallback = document.getElementById('panel-staging');
          if (fallback) fallback.focus();
        }
      }
    });
    listEl.appendChild(row);
  });
}
