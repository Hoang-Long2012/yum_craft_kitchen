import { SPICES } from '../data/index.js';
import { announceNVDA } from '../accessibility/nvda-announcer.js';
import { playSoundEffect } from '../audio/sound-engine.js';
import { applySpiceToState } from '../cooking/plating.js';
import { escapeHtml } from './dom-helpers.js';
import { renderAll } from './render-coordinator.js';

/**
 * Apply a spice to the selected target (station or staging tray).
 * @param {string} spiceId
 */
export function applySpice(spiceId) {
  const res = applySpiceToState(spiceId);
  if (!res || res.reason === 'not_found') return;
  if (!res.ok) {
    announceNVDA(res.announcement, 'polite');
    return;
  }
  playSoundEffect('spice');
  announceNVDA(res.announcement, 'polite');
  renderAll();
}

/**
 * Render the 29 spices grid.
 */
export function renderSpices() {
  const grid = document.getElementById('spices-grid');
  if (!grid) return;
  grid.innerHTML = '';

  SPICES.forEach(sp => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('aria-label', `Nêm ${sp.name}. ${sp.desc}`);
    btn.className = 'p-1.5 sm:p-2 rounded-2xl border border-stone-200 hover:border-amber-500 bg-amber-50/50 hover:bg-amber-100 text-center transition flex flex-col items-center gap-0.5 group';
    btn.innerHTML = `
      <span class="text-xl group-hover:scale-110 transition-transform" aria-hidden="true">${escapeHtml(sp.emoji)}</span>
      <span class="text-[10px] font-bold text-stone-800 truncate w-full">${escapeHtml(sp.name)}</span>
    `;
    btn.addEventListener('click', () => applySpice(sp.id));
    grid.appendChild(btn);
  });
}
