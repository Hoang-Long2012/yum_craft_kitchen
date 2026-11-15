import { STATIONS } from '../data/index.js';
import { state } from '../core/state.js';
import { announceNVDA } from '../accessibility/nvda-announcer.js';
import { attachRovingKeyNavigation } from '../accessibility/roving-navigation.js';
import { playSoundEffect } from '../audio/sound-engine.js';
import { describeItemStateShort } from '../cooking/food-item.js';
import { performStationAction } from '../cooking/station-actions.js';
import { moveStationToStagingState, moveStagingToStationState } from '../cooking/plating.js';
import { escapeHtml } from './dom-helpers.js';
import { renderAll } from './render-coordinator.js';

/**
 * Move the first ingredient from the active station to the staging tray.
 */
export function moveStationToStaging() {
  const res = moveStationToStagingState();
  if (!res.ok) {
    announceNVDA(res.announcement, 'polite');
    return;
  }
  playSoundEffect('pick');
  announceNVDA(res.announcement, 'polite');
  renderAll();
}

/**
 * Move the first ingredient from the staging tray back to the active station.
 */
export function moveStagingToStation() {
  const res = moveStagingToStationState();
  if (!res.ok) {
    announceNVDA(res.announcement, 'polite');
    return;
  }
  playSoundEffect('pick');
  announceNVDA(res.announcement, 'polite');
  renderAll();
}

/**
 * Render the 18 cooking stations, dynamic wrapper/vessel selector, action buttons, and station item list.
 */
export function renderWorkbench() {
  const stationGrid = document.getElementById('station-selector-grid');
  const activeSt = STATIONS.find(s => s.id === state.activeStationId) || STATIONS[0];

  if (stationGrid) {
    const wasInStationGrid = document.activeElement && stationGrid.contains(document.activeElement);
    stationGrid.innerHTML = '';
    attachRovingKeyNavigation(stationGrid, 'button', (targetBtn) => {
      targetBtn.click();
    });
    STATIONS.forEach(st => {
      const isAct = st.id === state.activeStationId;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.stationId = st.id;
      btn.setAttribute('aria-pressed', isAct ? 'true' : 'false');
      btn.setAttribute('tabindex', isAct ? '0' : '-1');
      btn.setAttribute('aria-label', `${st.shortName} - ${st.name}`);
      btn.title = st.desc;
      btn.className = `p-2 rounded-2xl border text-left transition flex items-center gap-1.5 ${
        isAct ? 'station-btn-active font-bold' : 'bg-stone-50 hover:bg-amber-50 border-stone-200 text-stone-800'
      }`;
      btn.innerHTML = `
        <span class="text-xl shrink-0" aria-hidden="true">${escapeHtml(st.emoji)}</span>
        <span class="text-xs font-extrabold leading-tight truncate font-game">${escapeHtml(st.shortName)}</span>
      `;
      btn.addEventListener('click', () => {
        const keepFocus = stationGrid.contains(document.activeElement);
        state.activeStationId = st.id;
        playSoundEffect('pick');
        announceNVDA(`Đã chuyển sang: ${st.name}. ${st.desc}`, 'polite');
        renderAll();
        if (keepFocus) {
          const target = stationGrid.querySelector(`[data-station-id="${st.id}"]`);
          if (target) target.focus();
        }
      });
      stationGrid.appendChild(btn);
    });
    if (wasInStationGrid) {
      const activeBtn = stationGrid.querySelector(`[data-station-id="${state.activeStationId}"]`);
      if (activeBtn) activeBtn.focus();
    }
  }

  document.getElementById('active-station-badge').textContent = `${activeSt.emoji} ${activeSt.name}`;
  document.getElementById('canvas-overlay-station-name').textContent = `${activeSt.emoji} ${activeSt.name}`;
  document.getElementById('canvas-overlay-temp').textContent = `Nhiệt độ: ${activeSt.temp}`;
  document.getElementById('station-desc-sub').textContent = activeSt.desc;
  document.getElementById('station-items-count-label').textContent = `${state.stationItems.length} nguyên liệu trên bếp`;
  const headingActions = document.getElementById('heading-station-actions');
  if (headingActions) {
    headingActions.innerHTML = '<span aria-hidden="true">' + escapeHtml(activeSt.emoji) + '</span><span>2. Thao Tác Với ' + escapeHtml(activeSt.name) + '</span>';
  }
  const headingItems = document.getElementById('heading-station-items');
  if (headingItems) {
    headingItems.innerHTML = '<span aria-hidden="true">🥘</span><span>3. Nguyên Liệu Đang Có Trong ' + escapeHtml(activeSt.name) + ' (' + state.stationItems.length + ')</span>';
  }

  // Dynamic sub-panel for picking Wrapper (in rolling mat) or Vessel (in stuffing station)
  const wrapperVesselPanel = document.getElementById('station-wrapper-vessel-selector');
  const wvTitle = document.getElementById('wrap-vessel-selector-title');
  const wvSelectedLabel = document.getElementById('wrap-vessel-selected-label');
  const wvHint = document.getElementById('wrap-vessel-selector-hint');
  const wvOptionsList = document.getElementById('wrap-vessel-options-container');

  if ((activeSt.isRollingStation || activeSt.isStuffingStation) && state.stationItems.length > 0) {
    const keepWvFocus = wvOptionsList.contains(document.activeElement);
    wrapperVesselPanel.classList.remove('hidden');
    wvOptionsList.innerHTML = '';
    attachRovingKeyNavigation(wvOptionsList, '[role="radio"]', (targetBtn) => {
      targetBtn.click();
      targetBtn.focus();
    });

    if (activeSt.isRollingStation) {
      wvTitle.textContent = '🌯 Chọn 1 Nguyên Liệu Làm Lớp Vỏ Cuốn Ngoài:';
      wvHint.textContent = 'Bấm chọn nguyên liệu làm vỏ ngoài (ví dụ: Bánh tráng, Lá rong biển, hoặc Lát thịt bò...). Các nguyên liệu còn lại sẽ được cuộn vào trong ruột!';

      if (!state.selectedWrapperUid || !state.stationItems.some(i => i.uid === state.selectedWrapperUid)) {
        state.selectedWrapperUid = state.stationItems[0].uid;
      }

      state.stationItems.forEach(it => {
        const isSel = it.uid === state.selectedWrapperUid;
        if (isSel) wvSelectedLabel.textContent = `Vỏ: ${it.name}`;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.dataset.uid = String(it.uid);
        btn.title = it.name;
        btn.setAttribute('role', 'radio');
        btn.setAttribute('aria-checked', isSel ? 'true' : 'false');
        btn.setAttribute('tabindex', isSel ? '0' : '-1');
        btn.className = `p-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
          isSel ? 'bg-orange-600 text-white border-orange-700' : 'bg-white text-stone-800 border-amber-200 hover:bg-orange-50'
        }`;
        btn.innerHTML = `<span class="shrink-0" aria-hidden="true">${escapeHtml(it.emoji)}</span><span class="break-words text-left leading-snug">${escapeHtml(it.name)}</span>`;
        btn.addEventListener('click', () => {
          const hadFocus = wvOptionsList.contains(document.activeElement);
          state.selectedWrapperUid = it.uid;
          playSoundEffect('pick');
          announceNVDA(`Đã chọn "${it.name}" làm lớp vỏ cuốn ngoài cùng.`, 'polite');
          renderWorkbench();
          if (hadFocus) {
            const target = wvOptionsList.querySelector(`[data-uid="${it.uid}"]`);
            if (target) target.focus();
          }
        });
        wvOptionsList.appendChild(btn);
      });
      if (keepWvFocus) {
        const target = wvOptionsList.querySelector(`[data-uid="${state.selectedWrapperUid}"]`);
        if (target) target.focus();
      }
    } else {
      wvTitle.textContent = '🥖 Chọn 1 Nguyên Liệu Làm Vỏ Nhồi / Bánh Kẹp:';
      wvHint.textContent = 'Bấm chọn nguyên liệu làm vỏ nhồi (ví dụ: Ổ Bánh Mì, Xúc Xích, Ớt Chuông, Quả cà chua, hoặc Bánh Oreo...). Các nguyên liệu còn lại sẽ được nhồi vào ruột!';

      if (!state.selectedVesselUid || !state.stationItems.some(i => i.uid === state.selectedVesselUid)) {
        state.selectedVesselUid = state.stationItems[0].uid;
      }

      state.stationItems.forEach(it => {
        const isSel = it.uid === state.selectedVesselUid;
        if (isSel) wvSelectedLabel.textContent = `Vỏ: ${it.name}`;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.dataset.uid = String(it.uid);
        btn.title = it.name;
        btn.setAttribute('role', 'radio');
        btn.setAttribute('aria-checked', isSel ? 'true' : 'false');
        btn.setAttribute('tabindex', isSel ? '0' : '-1');
        btn.className = `p-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
          isSel ? 'bg-orange-600 text-white border-orange-700' : 'bg-white text-stone-800 border-amber-200 hover:bg-orange-50'
        }`;
        btn.innerHTML = `<span class="shrink-0" aria-hidden="true">${escapeHtml(it.emoji)}</span><span class="break-words text-left leading-snug">${escapeHtml(it.name)}</span>`;
        btn.addEventListener('click', () => {
          const hadFocus = wvOptionsList.contains(document.activeElement);
          state.selectedVesselUid = it.uid;
          playSoundEffect('pick');
          announceNVDA(`Đã chọn "${it.name}" làm vỏ nhồi.`, 'polite');
          renderWorkbench();
          if (hadFocus) {
            const target = wvOptionsList.querySelector(`[data-uid="${it.uid}"]`);
            if (target) target.focus();
          }
        });
        wvOptionsList.appendChild(btn);
      });
      if (keepWvFocus) {
        const target = wvOptionsList.querySelector(`[data-uid="${state.selectedVesselUid}"]`);
        if (target) target.focus();
      }
    }
  } else {
    wrapperVesselPanel.classList.add('hidden');
  }

  // Action Buttons (Cập nhật in-place để KHÔNG làm rớt focus khi đang xử lý audio Play Wait)
  const actionsEl = document.getElementById('station-action-buttons');
  if (actionsEl) {
    actionsEl.setAttribute('aria-busy', state.isCookingBusy ? 'true' : 'false');
    const needsRebuild = actionsEl.dataset.renderedStationId !== activeSt.id ||
      actionsEl.children.length !== activeSt.actions.length;

    if (needsRebuild) {
      actionsEl.innerHTML = '';
      actionsEl.dataset.renderedStationId = activeSt.id;
      activeSt.actions.forEach(act => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.dataset.actionId = act.id;
        btn.addEventListener('click', () => performStationAction(act.id));
        actionsEl.appendChild(btn);
      });
    }

    activeSt.actions.forEach((act, idx) => {
      const btn = actionsEl.children[idx];
      if (!btn) return;
      btn.disabled = false;
      if (state.isCookingBusy) {
        btn.setAttribute('aria-disabled', 'true');
        btn.setAttribute('aria-label', `Đang chế biến: ${act.label}`);
        btn.title = act.desc;
        btn.className = 'game-btn btn-3d-orange py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-extrabold font-game flex items-center justify-center gap-1.5 col-span-full sm:col-span-1 shadow-md opacity-60 cursor-not-allowed';
        btn.textContent = '⏳ Đang chế biến...';
      } else {
        btn.removeAttribute('aria-disabled');
        btn.setAttribute('aria-label', act.label);
        btn.title = act.desc;
        btn.className = 'game-btn btn-3d-orange py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-extrabold font-game flex items-center justify-center gap-1.5 col-span-full sm:col-span-1 shadow-md';
        btn.textContent = act.label;
      }
    });
  }

  // Station Items List
  const listEl = document.getElementById('station-items-list');
  if (listEl) {
    listEl.innerHTML = '';
    if (state.stationItems.length === 0) {
      listEl.innerHTML = `<div role="listitem" class="p-3 rounded-2xl bg-stone-50 border border-dashed border-stone-300 text-xs text-stone-500 text-center">Bếp đang trống. Hãy lấy nguyên liệu từ Tủ Lạnh (Alt+1) bỏ vào đây!</div>`;
    } else {
      state.stationItems.forEach((it, idx) => {
        const desc = describeItemStateShort(it);
        const row = document.createElement('div');
        row.setAttribute('role', 'listitem');
        row.className = 'p-2 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-center justify-between gap-2 text-xs';
        row.innerHTML = `
          <div class="flex items-start gap-2 min-w-0">
            <span class="text-xl shrink-0" aria-hidden="true">${escapeHtml(it.emoji)}</span>
            <div class="min-w-0">
              <div class="font-bold text-stone-900 break-words leading-snug" title="${escapeHtml(it.name)}">${idx + 1}. ${escapeHtml(it.name)}</div>
              <div class="text-[10px] text-stone-600 break-words leading-snug" title="${escapeHtml(desc)}">${escapeHtml(desc)}</div>
            </div>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <button type="button" data-to-staging="${idx}" class="px-2 py-1 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold text-[10px]" aria-label="Ra khay: Cất ${escapeHtml(it.name)} ra Khay Tạm">
              Ra khay
            </button>
            <button type="button" data-del-st="${idx}" class="px-2 py-1 rounded-lg bg-stone-200 hover:bg-red-200 text-stone-700 hover:text-red-900 font-bold text-[10px]" aria-label="Xóa ${escapeHtml(it.name)} khỏi bếp">
              Xóa
            </button>
          </div>
        `;
        row.querySelector(`[data-to-staging="${idx}"]`).addEventListener('click', () => {
          const keepFocus = listEl.contains(document.activeElement);
          const [moved] = state.stationItems.splice(idx, 1);
          state.stagingItems.push(moved);
          playSoundEffect('pick');
          announceNVDA(`Đã cất ${moved.name} ra Khay Tạm.`, 'polite');
          renderAll();
          if (keepFocus) {
            if (state.stationItems.length > 0) {
              const nextIdx = Math.min(idx, state.stationItems.length - 1);
              const nextBtn = listEl.querySelector(`[data-to-staging="${nextIdx}"]`);
              if (nextBtn) nextBtn.focus();
            } else {
              const fallback = document.getElementById('panel-workbench');
              if (fallback) fallback.focus();
            }
          }
        });
        row.querySelector(`[data-del-st="${idx}"]`).addEventListener('click', () => {
          const keepFocus = listEl.contains(document.activeElement);
          const [del] = state.stationItems.splice(idx, 1);
          announceNVDA(`Đã bỏ ${del.name} khỏi bếp.`, 'polite');
          renderAll();
          if (keepFocus) {
            if (state.stationItems.length > 0) {
              const nextIdx = Math.min(idx, state.stationItems.length - 1);
              const nextBtn = listEl.querySelector(`[data-del-st="${nextIdx}"]`);
              if (nextBtn) nextBtn.focus();
            } else {
              const fallback = document.getElementById('panel-workbench');
              if (fallback) fallback.focus();
            }
          }
        });
        listEl.appendChild(row);
      });
    }
  }
}
