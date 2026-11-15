import { state } from '../core/state.js';
import { announceNVDA } from '../accessibility/nvda-announcer.js';
import { drawWorkbenchCanvas, drawDiningCharacterCanvas } from './canvas-renderer.js';

export const KITCHEN_TABS = [
  { id: 'fridge', name: '1. Tủ Lạnh & Kho Đồ' },
  { id: 'workbench', name: '2. Bàn Chế Biến' },
  { id: 'staging', name: '3. Khay Tạm' },
  { id: 'spices', name: '4. Gia Vị' },
  { id: 'dining', name: '5. Bàn Tiệc & Thưởng Thức' }
];

/**
 * Switch the active kitchen tab and synchronize WAI-ARIA tablist attributes.
 * @param {string} tabName
 * @param {boolean} [announce=false]
 */
export function switchKitchenTab(tabName, announce = false) {
  state.activeKitchenTab = tabName;

  KITCHEN_TABS.forEach(t => {
    const btn = document.getElementById('tab-' + t.id);
    const panel = document.getElementById('panel-' + t.id);
    const isCurrent = t.id === tabName;

    if (btn) {
      btn.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
      btn.setAttribute('tabindex', isCurrent ? '0' : '-1');
      if (isCurrent) {
        btn.classList.add('tab-btn-active');
        btn.classList.remove('tab-btn-inactive');
      } else {
        btn.classList.remove('tab-btn-active');
        btn.classList.add('tab-btn-inactive');
      }
    }

    if (panel) {
      if (isCurrent) {
        panel.classList.remove('hidden');
      } else {
        panel.classList.add('hidden');
      }
    }
  });

  if (tabName === 'workbench') {
    drawWorkbenchCanvas();
  } else if (tabName === 'dining') {
    drawDiningCharacterCanvas();
  }

  if (announce) {
    const currentTab = KITCHEN_TABS.find(t => t.id === tabName);
    if (currentTab) {
      announceNVDA(`Đã mở tab: ${currentTab.name}`, 'polite');
    }
  }
}
