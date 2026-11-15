import { CHARACTERS } from '../data/index.js';
import { state } from '../core/state.js';
import { announceNVDA } from '../accessibility/nvda-announcer.js';
import { playSoundEffect } from '../audio/sound-engine.js';
import { escapeHtml } from './dom-helpers.js';

/**
 * Update the "Start Kitchen" button label with the active character's name.
 */
export function updateStartBtnLabel() {
  const char = CHARACTERS.find(c => c.id === state.activeCharacterId) || CHARACTERS[0];
  const lbl = document.getElementById('start-btn-label');
  if (lbl) lbl.textContent = `VÀO BẾP NẤU CHO ${char.name.toUpperCase()}!`;
}

/**
 * Render the character selection radio group with WAI-ARIA keyboard navigation.
 * @param {boolean} [autoFocusSelected=false]
 */
export function renderStartScreenCharacters(autoFocusSelected = false) {
  const container = document.getElementById('char-cards-list');
  if (!container) return;
  container.innerHTML = '';

  CHARACTERS.forEach((c, idx) => {
    const isSel = c.id === state.activeCharacterId;
    const card = document.createElement('div');
    card.id = `char-card-${c.id}`;
    card.setAttribute('role', 'radio');
    card.setAttribute('aria-checked', isSel ? 'true' : 'false');
    card.setAttribute('tabindex', isSel ? '0' : '-1');
    card.setAttribute('aria-label', `${c.name}, ${c.title}. ${c.desc}. Món khoái khẩu: ${c.cravings[0]}. ${isSel ? 'Đang được chọn.' : 'Nhấn phím Cách, Enter hoặc mũi tên để chọn.'}`);
    card.className = `p-4 sm:p-5 rounded-3xl border-3 transition cursor-pointer flex flex-col justify-between gap-3 text-left focus:outline-hidden focus:ring-4 focus:ring-orange-400 ${
      isSel
        ? 'bg-amber-50 border-orange-500 shadow-xl ring-4 ring-orange-200'
        : 'bg-white border-stone-200 hover:border-amber-400 hover:shadow-md'
    }`;
    card.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="text-4xl" aria-hidden="true">${escapeHtml(c.emoji)}</span>
        <span class="text-xs font-extrabold px-2.5 py-1 rounded-full ${isSel ? 'bg-orange-600 text-white' : 'bg-stone-100 text-stone-600'}">
          ${isSel ? 'Đang Chọn' : 'Bấm Chọn'}
        </span>
      </div>
      <div>
        <h3 class="text-base sm:text-lg font-extrabold text-stone-900 font-game">${escapeHtml(c.name)}</h3>
        <p class="text-xs text-orange-700 font-bold mb-1">${escapeHtml(c.title)}</p>
        <p class="text-xs text-stone-600 leading-relaxed">${escapeHtml(c.desc)}</p>
      </div>
      <div class="bg-white/80 p-2.5 rounded-2xl border border-stone-200/80 text-[11px] text-stone-700">
        <strong class="text-amber-900 font-game block mb-0.5">Món khoái khẩu:</strong>
        ${escapeHtml(c.cravings[0])}
      </div>
    `;

    const selectThisChar = (focusAfter = false) => {
      state.activeCharacterId = c.id;
      playSoundEffect('pick');
      announceNVDA(`Đã chọn thực khách: ${c.name}. ${c.desc}`, 'polite');
      renderStartScreenCharacters(focusAfter);
      updateStartBtnLabel();
    };

    card.addEventListener('click', () => {
      selectThisChar(false);
    });

    card.addEventListener('keydown', (e) => {
      let targetIndex = -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        targetIndex = (idx + 1) % CHARACTERS.length;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        targetIndex = (idx - 1 + CHARACTERS.length) % CHARACTERS.length;
      } else if (e.key === 'Home') {
        e.preventDefault();
        targetIndex = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        targetIndex = CHARACTERS.length - 1;
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        selectThisChar(true);
        return;
      }

      if (targetIndex !== -1) {
        const nextChar = CHARACTERS[targetIndex];
        state.activeCharacterId = nextChar.id;
        playSoundEffect('pick');
        announceNVDA(`Đã chọn thực khách: ${nextChar.name}. ${nextChar.desc}`, 'polite');
        renderStartScreenCharacters(true);
        updateStartBtnLabel();
      }
    });

    container.appendChild(card);
  });

  updateStartBtnLabel();

  if (autoFocusSelected) {
    const activeCard = document.getElementById(`char-card-${state.activeCharacterId}`);
    if (activeCard) {
      activeCard.focus();
    }
  }
}
