import { CHARACTERS, GARNISH_OPTIONS, FLAVOR_DIMENSIONS } from '../data/index.js';
import { state, resetKitchenItemsState } from '../core/state.js';
import { announceNVDA } from '../accessibility/nvda-announcer.js';
import { playExternalAudio, playSoundEffect } from '../audio/sound-engine.js';
import { analyzeCulinaryChemistry } from '../cooking/chemistry.js';
import {
  describePureFlavorDescriptor,
  generateSensoryTastingReview,
  generateMultiDishTastingReview,
  buildEatingAudioPlaylist
} from '../cooking/tasting-review.js';
import { escapeHtml } from './dom-helpers.js';
import { renderAll } from './render-coordinator.js';
import { renderStartScreenCharacters } from './start-screen.js';

/**
 * Feed all dishes on the serving plate to the selected dining character.
 */
export async function feedCharacter() {
  if (state.isFeedingBusy) return;

  const char = CHARACTERS.find(c => c.id === state.activeCharacterId) || CHARACTERS[0];
  if (state.plateItems.length === 0) {
    announceNVDA(`Dĩa thức ăn đang trống! Hãy chế biến đồ ăn trong bếp (Alt+2), bấm nút Hoàn Thành Món (Phím P) để bày ra dĩa rồi mới đút cho ${char.name} ăn nhé.`, 'polite');
    return;
  }

  state.isFeedingBusy = true;

  const feedBtn = document.getElementById('btn-master-feed');
  const feedLbl = document.getElementById('master-feed-label');
  if (feedBtn) {
    feedBtn.disabled = true;
    feedBtn.setAttribute('aria-busy', 'true');
    feedBtn.classList.add('opacity-70', 'cursor-not-allowed');
  }

  state.charAnimState = 'eating';
  state.charAnimTimer = 240;

  const playlist = buildEatingAudioPlaylist(state.plateItems);

  const isPlateOnlyDrinks = state.plateItems.length > 0 && state.plateItems.every(it => it.kind === 'beverage' || it.kind === 'blended' || it.texture === 'drink');
  announceNVDA(isPlateOnlyDrinks ? `Đang mời ${char.name} thưởng thức đồ uống...` : `Đang đút cho ${char.name} thưởng thức món ăn...`, 'polite');
  for (let i = 0; i < playlist.length; i++) {
    const soundFile = playlist[i];
    if (feedLbl) {
      feedLbl.textContent = isPlateOnlyDrinks ? 'ĐANG THƯỞNG THỨC ĐỒ UỐNG... 🍹' : 'ĐANG THƯỞNG THỨC MÓN ĂN... 😋';
    }
    await playExternalAudio(soundFile, true);
    if (i < playlist.length - 1) {
      await new Promise(r => setTimeout(r, 150));
    }
  }

  const dishes = (state.servedDishes && state.servedDishes.length > 0)
    ? state.servedDishes
    : [{
        id: 'legacy',
        name: state.customDishName || 'Món Ăn Tự Chế',
        items: state.plateItems,
        analysis: analyzeCulinaryChemistry(state.plateItems)
      }];

  const review = (dishes.length > 1)
    ? generateMultiDishTastingReview(dishes, char)
    : generateSensoryTastingReview(dishes[0].items, dishes[0].analysis, char, dishes[0].name);

  const isSingleDrinkDish = dishes.length === 1 && dishes[0].items && dishes[0].items.every(it => it.kind === 'beverage' || it.kind === 'blended' || it.texture === 'drink');
  const finalDishTitle = (dishes.length > 1)
    ? `thực đơn ${dishes.length} món (${dishes.map(d => d.name).join(', ')})`
    : `${isSingleDrinkDish ? 'thức uống' : 'món'} "${dishes[0].name}"`;

  if (review.reactionType === 'love') {
    playSoundEffect('react_love');
  } else if (review.score >= 50) {
    playSoundEffect('react_good');
  } else {
    playSoundEffect('react_bad');
  }

  state.charAnimState = review.reactionType;
  state.charAnimTimer = 120;

  const moodEl = document.getElementById('dining-mood-tag');
  const speechEl = document.getElementById('dining-speech-bubble');
  const scoreEl = document.getElementById('dining-last-score');

  if (moodEl) moodEl.textContent = review.moodTag;
  if (speechEl) speechEl.textContent = review.speech;
  if (scoreEl) scoreEl.textContent = `${review.score} / 100 điểm (${review.moodTag})`;

  const tastedMealPayload = {
    dishes: dishes.map(d => ({
      name: d.name || 'Món Ăn Tự Chế',
      garnish: d.garnish || { name: 'Mộc', emoji: '🍽️' },
      items: (d.items || []).map(it => ({ name: it.name, emoji: it.emoji })),
      analysis: {
        structureSummary: (d.analysis && d.analysis.structureSummary) ? d.analysis.structureSummary : '',
        harmonyScore: (d.analysis && typeof d.analysis.harmonyScore === 'number') ? d.analysis.harmonyScore : review.score
      }
    })),
    fallbackTitle: state.customDishName || 'Món Ăn Tự Chế',
    customerName: char.name,
    customerEmoji: char.emoji,
    customerSpeech: review.speech,
    customerMoodTag: review.moodTag,
    satisfactionScore: review.score
  };
  state.lastTastedMeal = tastedMealPayload;
  if (typeof window !== 'undefined') {
    window.lastTastedMeal = tastedMealPayload;
  }

  const shareContainer = document.getElementById('share-community-container');
  if (shareContainer) {
    shareContainer.classList.remove('hidden');
  }

  state.plateItems = [];
  state.servedDishes = [];
  state.customDishName = '';
  state.isFeedingBusy = false;

  if (feedBtn) {
    feedBtn.disabled = false;
    feedBtn.removeAttribute('aria-busy');
    feedBtn.classList.remove('opacity-70', 'cursor-not-allowed');
  }
  if (feedLbl) {
    feedLbl.textContent = 'ĐÚT CHO THỰC KHÁCH ĂN! (F)';
  }

  announceNVDA(`${char.name} vừa thưởng thức ${finalDishTitle}. Nhận xét: ${review.speech}`, 'polite');
  renderAll();
}

/**
 * Announce a detailed flavor/chemistry summary for items on the plate, station, or staging tray.
 */
export function readDishSummary() {
  if (state.servedDishes && state.servedDishes.length > 1 && state.plateItems.length > 0) {
    const char = CHARACTERS.find(c => c.id === state.activeCharacterId) || CHARACTERS[0];
    const multiReview = generateMultiDishTastingReview(state.servedDishes, char);
    let msg = `Báo cáo thực đơn trên Đĩa Ăn: Gồm ${state.servedDishes.length} món hoàn chỉnh. `;
    state.servedDishes.forEach((d, idx) => {
      const rev = generateSensoryTastingReview(d.items, d.analysis, char, d.name);
      const f = d.analysis.normalized;
      msg += `Món ${idx + 1}: "${d.name}" - ${rev.sensorySentence}. Điểm hài hòa: ${d.analysis.harmonyScore}/100 (Umami ${f.umami}, Mặn ${f.salty}, Ngọt ${f.sweet}, Chua ${f.sour}, Cay ${f.spicy}, Béo ${f.fatty}, Đắng ${f.bitter}, Thơm ${f.aroma}). `;
    });
    msg += `Tổng thể thực đơn: Điểm trung bình ${multiReview.score}/100 (${multiReview.moodTag}).`;
    announceNVDA(msg, 'polite');
    return;
  }

  const allItems = state.plateItems.length > 0 ? state.plateItems : (state.stationItems.length > 0 ? state.stationItems : state.stagingItems);
  const place = state.plateItems.length > 0 ? 'trên Đĩa Ăn' : (state.stationItems.length > 0 ? 'trong Bếp' : 'trên Khay Tạm');

  if (allItems.length === 0) {
    announceNVDA('Hiện tại không có thức ăn nào trên đĩa, bếp hay khay tạm. Hãy lấy nguyên liệu từ Tủ Lạnh (Alt+1)!', 'polite');
    return;
  }

  const analysis = analyzeCulinaryChemistry(allItems);
  const f = analysis.normalized;
  const name = (state.servedDishes && state.servedDishes.length === 1 && state.plateItems.length > 0)
    ? state.servedDishes[0].name
    : (state.customDishName || analysis.autoTitle);
  const char = CHARACTERS.find(c => c.id === state.activeCharacterId) || CHARACTERS[0];
  const review = generateSensoryTastingReview(allItems, analysis, char, name);

  const warnStr = analysis.warnings.length > 0 ? ` Cảnh báo: ${analysis.warnings.join('; ')}.` : '';
  const synStr = analysis.synergies.length > 0 ? ` Phản ứng hòa vị: ${analysis.synergies.join('; ')}.` : '';

  const msg = `Báo cáo món ăn ${place}: Tên món "${name}". Cảm quan món ăn: ${review.sensorySentence}. Điểm hài hòa: ${analysis.harmonyScore}/100. Chi tiết 8 vị: Đậm đà Umami ${f.umami}, Mặn ${f.salty}, Ngọt ${f.sweet}, Béo ${f.fatty}, Thơm ${f.aroma}, Cay ${f.spicy}, Chua ${f.sour}, Đắng ${f.bitter}.${warnStr}${synStr}`;
  announceNVDA(msg, 'polite');
}

/**
 * Reset kitchen state and navigate back to the character select screen.
 */
export function resetKitchenAndGoBack() {
  resetKitchenItemsState();
  state.currentScreen = 'character_select';
  state.lastTastedMeal = null;
  if (typeof window !== 'undefined') {
    window.lastTastedMeal = null;
  }
  const shareContainer = document.getElementById('share-community-container');
  if (shareContainer) shareContainer.classList.add('hidden');

  const screenSelect = document.getElementById('screen-character-select');
  const screenKitchen = document.getElementById('screen-kitchen');
  screenKitchen.hidden = true;
  screenKitchen.classList.add('hidden');
  screenKitchen.classList.remove('flex');
  screenSelect.hidden = false;
  screenSelect.classList.remove('hidden');
  screenSelect.classList.add('flex');

  const modalConfirmBack = document.getElementById('modal-confirm-back');
  if (modalConfirmBack && typeof modalConfirmBack.close === 'function') {
    modalConfirmBack.close();
  }
  playSoundEffect('door');
  announceNVDA('Đã dọn dẹp sạch sẽ nhà bếp và quay lại màn hình chọn thực khách.', 'polite');
  renderStartScreenCharacters();
  const startBtn = document.getElementById('btn-start-kitchen');
  if (startBtn) startBtn.focus();
}

/**
 * Render the serving plate, flavor radar progressbars, synergy tags, and dish list.
 */
export function renderServingPlate() {
  const isMultiDish = state.servedDishes && state.servedDishes.length > 1;
  const badge = document.getElementById('plate-items-count-badge');
  if (badge) {
    if (state.servedDishes && state.servedDishes.length === 1) {
      const singleDish = state.servedDishes[0];
      badge.textContent = `1 món "${singleDish.name}" (${singleDish.items.length} nguyên liệu) trên dĩa`;
    } else if (isMultiDish) {
      badge.textContent = `${state.servedDishes.length} món (${state.plateItems.length} nguyên liệu) trên dĩa`;
    } else if (state.plateItems.length > 0) {
      badge.textContent = `${state.plateItems.length} nguyên liệu trên dĩa`;
    } else {
      badge.textContent = '0 món trên dĩa';
    }
  }

  const allPlateItems = state.plateItems;
  const analysis = analyzeCulinaryChemistry(allPlateItems);

  const dishTitleEl = document.getElementById('plate-dish-title');
  const compSummaryEl = document.getElementById('plate-components-summary');
  const scoreEl = document.getElementById('plate-harmony-score');
  const garnishBadgeEl = document.getElementById('plate-garnish-badge');

  if (isMultiDish) {
    const dishNames = state.servedDishes.map(d => d.name).join(' kèm ');
    if (dishTitleEl) dishTitleEl.textContent = `Thực Đơn ${state.servedDishes.length} Món: ${dishNames}`;
    if (compSummaryEl) compSummaryEl.textContent = state.servedDishes.map((d, i) => `[Món ${i + 1}: ${d.name} (${d.analysis.structureSummary})]`).join(' • ');
    const garnishes = Array.from(new Set(state.servedDishes.map(d => `${d.garnish.emoji} ${d.garnish.name}`)));
    if (garnishBadgeEl) garnishBadgeEl.textContent = garnishes.join(' | ');

    let totalScore = 0;
    state.servedDishes.forEach(d => totalScore += d.analysis.harmonyScore);
    const avgScore = Math.round(totalScore / state.servedDishes.length);
    if (scoreEl) scoreEl.textContent = `Độ hài hòa trung bình: ${avgScore}/100`;
  } else {
    const currentGarnish = (state.servedDishes && state.servedDishes[0])
      ? state.servedDishes[0].garnish
      : (GARNISH_OPTIONS.find(g => g.id === state.selectedGarnishId) || GARNISH_OPTIONS[0]);
    if (garnishBadgeEl) garnishBadgeEl.textContent = `${currentGarnish.emoji} ${currentGarnish.name}`;

    if (dishTitleEl) {
      dishTitleEl.textContent = (state.servedDishes && state.servedDishes[0])
        ? state.servedDishes[0].name
        : (state.customDishName || (allPlateItems.length > 0 ? analysis.autoTitle : 'Dĩa đang trống'));
    }
    if (compSummaryEl) {
      compSummaryEl.textContent = analysis.structureSummary || 'Chưa có thức ăn trên dĩa.';
    }
    if (scoreEl) {
      scoreEl.textContent = allPlateItems.length > 0 ? `Độ hài hòa: ${analysis.harmonyScore}/100` : 'Độ hài hòa: --';
    }
  }

  const barsContainer = document.getElementById('flavor-bars-list');
  if (barsContainer) {
    barsContainer.innerHTML = '';
    FLAVOR_DIMENSIONS.forEach((dim, idx) => {
      const val = analysis.normalized[dim.key] || 0;
      const pct = Math.min(100, Math.round(val * 10));
      const sensoryDesc = describePureFlavorDescriptor(dim.key, val, idx) || 'chưa có';
      const valueText = `${val.toFixed(1)} trên 10 (${sensoryDesc})`;
      const row = document.createElement('div');
      row.className = 'text-[11px]';
      row.innerHTML = `
        <div class="flex items-center justify-between mb-0.5">
          <span class="font-semibold text-stone-700">${escapeHtml(dim.label)}</span>
          <span class="font-bold text-stone-900">${val.toFixed(1)}/10</span>
        </div>
        <div class="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden" role="progressbar" aria-label="${escapeHtml(dim.label)}" aria-valuenow="${val}" aria-valuemin="0" aria-valuemax="10" aria-valuetext="${escapeHtml(valueText)}">
          <div class="h-full ${escapeHtml(dim.bg)} flavor-bar-fill rounded-full" style="width: ${pct}%"></div>
        </div>
      `;
      barsContainer.appendChild(row);
    });
  }

  const synContainer = document.getElementById('synergy-tags-container');
  if (synContainer) {
    synContainer.innerHTML = '';
    if (analysis.synergies.length === 0 && analysis.warnings.length === 0) {
      synContainer.innerHTML = `<span class="text-[11px] text-stone-400 italic">Chưa có phản ứng hương vị</span>`;
    } else {
      analysis.synergies.forEach(s => {
        const sp = document.createElement('span');
        sp.className = 'px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 font-semibold text-[10px] leading-tight';
        sp.textContent = s;
        synContainer.appendChild(sp);
      });
      analysis.warnings.forEach(w => {
        const sp = document.createElement('span');
        sp.className = 'px-2 py-0.5 rounded-lg bg-red-100 text-red-900 font-semibold text-[10px] leading-tight';
        sp.textContent = w;
        synContainer.appendChild(sp);
      });
    }
  }

  const listEl = document.getElementById('plate-items-list');
  if (listEl) {
    listEl.innerHTML = '';
    if (state.plateItems.length === 0) {
      listEl.innerHTML = `<div role="listitem" class="p-2 rounded-xl bg-stone-50 border border-dashed border-stone-300 text-xs text-stone-500 text-center">Bấm nút ⭐ HOÀN THÀNH MÓN bên dưới để bày đồ ăn lên dĩa!</div>`;
    } else if (state.servedDishes && state.servedDishes.length > 0) {
      state.servedDishes.forEach((dish, idx) => {
        const row = document.createElement('div');
        row.setAttribute('role', 'listitem');
        row.className = 'p-1.5 rounded-xl bg-orange-50/70 border border-orange-200 flex items-center justify-between gap-1 text-xs';
        const iconEmoji = dish.garnish ? dish.garnish.emoji : (dish.items[0] ? dish.items[0].emoji : '🍽️');
        const summaryText = dish.items && dish.items.length > 1
          ? ` (${dish.items.map(i => i.name).join(', ')})`
          : (dish.items[0] && dish.items[0].name !== dish.name ? ` (${dish.items[0].name})` : '');
        row.innerHTML = `
          <div class="flex items-start gap-1.5 min-w-0">
            <span class="text-lg shrink-0" aria-hidden="true">${escapeHtml(iconEmoji)}</span>
            <div class="min-w-0">
              <div class="font-bold text-stone-900 break-words leading-snug" title="${escapeHtml(dish.name + summaryText)}">${idx + 1}. ${escapeHtml(dish.name)}</div>
              ${summaryText ? `<div class="text-[10px] text-stone-600 break-words leading-snug">${escapeHtml(summaryText.trim())}</div>` : ''}
            </div>
          </div>
          <button type="button" data-del-dish="${escapeHtml(dish.id)}" data-del-dish-idx="${idx}" class="px-2 py-0.5 rounded bg-stone-200 hover:bg-red-200 text-stone-700 hover:text-red-900 font-bold text-[10px] shrink-0" aria-label="Xóa món ${escapeHtml(dish.name)} khỏi dĩa">
            Xóa
          </button>
        `;
        row.querySelector(`[data-del-dish="${dish.id}"]`).addEventListener('click', () => {
          const keepFocus = listEl.contains(document.activeElement);
          const dishName = dish.name;
          const itemUids = new Set(dish.items.map(i => i.uid));
          state.plateItems = state.plateItems.filter(i => !itemUids.has(i.uid));
          state.servedDishes = state.servedDishes.filter(d => d.id !== dish.id);
          if (state.servedDishes.length === 0) {
            state.customDishName = '';
          } else if (state.servedDishes.length === 1) {
            state.customDishName = state.servedDishes[0].name;
          } else {
            state.customDishName = state.servedDishes.map(d => d.name).join(' kèm ');
          }
          announceNVDA(`Đã bỏ món "${dishName}" khỏi dĩa ăn.`, 'polite');
          renderAll();
          if (keepFocus) {
            if (state.servedDishes.length > 0) {
              const nextIdx = Math.min(idx, state.servedDishes.length - 1);
              const nextBtn = listEl.querySelector(`[data-del-dish-idx="${nextIdx}"]`);
              if (nextBtn) nextBtn.focus();
            } else {
              const fallback = document.getElementById('panel-dining');
              if (fallback) fallback.focus();
            }
          }
        });
        listEl.appendChild(row);
      });
    } else {
      state.plateItems.forEach((it, idx) => {
        const row = document.createElement('div');
        row.setAttribute('role', 'listitem');
        row.className = 'p-1.5 rounded-xl bg-orange-50/70 border border-orange-200 flex items-center justify-between gap-1 text-xs';
        const displayName = it.dishName || it.name;
        row.innerHTML = `
          <div class="flex items-center gap-1.5 min-w-0">
            <span class="text-lg shrink-0" aria-hidden="true">${escapeHtml(it.emoji)}</span>
            <span class="font-bold text-stone-900 break-words leading-snug" title="${escapeHtml(displayName)}">${idx + 1}. ${escapeHtml(displayName)}</span>
          </div>
          <button type="button" data-del-plate="${idx}" class="px-2 py-0.5 rounded bg-stone-200 hover:bg-red-200 text-stone-700 hover:text-red-900 font-bold text-[10px] shrink-0" aria-label="Xóa món ${escapeHtml(displayName)} khỏi dĩa">
            Xóa
          </button>
        `;
        row.querySelector(`[data-del-plate="${idx}"]`).addEventListener('click', () => {
          const keepFocus = listEl.contains(document.activeElement);
          state.plateItems.splice(idx, 1);
          announceNVDA(`Đã bỏ món "${displayName}" khỏi dĩa ăn.`, 'polite');
          renderAll();
          if (keepFocus) {
            if (state.plateItems.length > 0) {
              const nextIdx = Math.min(idx, state.plateItems.length - 1);
              const nextBtn = listEl.querySelector(`[data-del-plate="${nextIdx}"]`);
              if (nextBtn) nextBtn.focus();
            } else {
              const fallback = document.getElementById('panel-dining');
              if (fallback) fallback.focus();
            }
          }
        });
        listEl.appendChild(row);
      });
    }
  }

  const char = CHARACTERS.find(c => c.id === state.activeCharacterId) || CHARACTERS[0];
  const feedLbl = document.getElementById('master-feed-label');
  if (feedLbl) feedLbl.textContent = `ĐÚT CHO ${char.name.toUpperCase()} ĂN! (F)`;
}
