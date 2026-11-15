import { bindDialogFocusRestore } from '../accessibility/dialog-manager.js';
import { announceNVDA } from '../accessibility/nvda-announcer.js';

let activeDialogResolver = null;

function ensureConfirmDialogElements() {
  let dlg = document.getElementById('modal-app-confirm');
  if (!dlg) {
    dlg = document.createElement('dialog');
    dlg.id = 'modal-app-confirm';
    dlg.className = 'backdrop:bg-black/65 backdrop:backdrop-blur-sm bg-transparent p-4 z-50 max-w-md w-full m-auto';
    dlg.setAttribute('aria-labelledby', 'app-confirm-title');
    dlg.setAttribute('aria-describedby', 'app-confirm-message');
    dlg.innerHTML = `
      <form method="dialog" id="app-confirm-form" class="bg-white rounded-3xl shadow-2xl border-2 border-amber-300 p-6 flex flex-col gap-4">
        <h2 id="app-confirm-title" class="text-lg sm:text-xl font-extrabold font-game text-stone-900">Xác nhận</h2>
        <p id="app-confirm-message" class="text-sm text-stone-700 leading-relaxed whitespace-pre-line"></p>
        <div id="app-confirm-input-wrap" class="hidden flex flex-col gap-1">
          <label for="app-confirm-input" id="app-confirm-input-label" class="text-xs font-bold text-stone-700">Nội dung:</label>
          <input id="app-confirm-input" type="text" class="w-full px-3.5 py-2.5 rounded-xl border-2 border-stone-300 focus:border-orange-500 focus:outline-none text-sm text-stone-900" />
        </div>
        <div class="flex items-center justify-end gap-2 pt-2">
          <button type="button" id="btn-app-confirm-cancel" class="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-sm transition cursor-pointer">Hủy</button>
          <button type="submit" id="btn-app-confirm-ok" class="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-game font-bold text-sm shadow transition cursor-pointer">Xác nhận</button>
        </div>
      </form>
    `;
    document.body.appendChild(dlg);
  }

  if (!dlg._boundConfirmHandlers) {
    dlg._boundConfirmHandlers = true;
    bindDialogFocusRestore(dlg);

    const form = document.getElementById('app-confirm-form');
    const cancelBtn = document.getElementById('btn-app-confirm-cancel');

    const settle = (value) => {
      if (activeDialogResolver) {
        const resolve = activeDialogResolver;
        activeDialogResolver = null;
        resolve(value);
      }
    };

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        dlg._pendingResult = dlg._mode === 'prompt' ? null : false;
        if (dlg.open) dlg.close();
      });
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (dlg._mode === 'prompt') {
          const inputEl = document.getElementById('app-confirm-input');
          dlg._pendingResult = inputEl ? inputEl.value : '';
        } else if (dlg._mode === 'notice') {
          dlg._pendingResult = undefined;
        } else {
          dlg._pendingResult = true;
        }
        if (dlg.open) dlg.close();
      });
    }

    dlg.addEventListener('cancel', () => {
      dlg._pendingResult = dlg._mode === 'prompt' ? null : (dlg._mode === 'notice' ? undefined : false);
    });

    dlg.addEventListener('close', () => {
      const val = dlg._pendingResult !== undefined
        ? dlg._pendingResult
        : (dlg._mode === 'prompt' ? null : (dlg._mode === 'notice' ? undefined : false));
      dlg._pendingResult = undefined;
      settle(val);
    });
  }

  return dlg;
}

function openAccessibleModal({
  mode,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  defaultValue = '',
  danger = false
}) {
  if (typeof document === 'undefined' || !document.body) {
    return Promise.resolve(mode === 'prompt' ? defaultValue : (mode === 'notice' ? undefined : false));
  }

  const dlg = ensureConfirmDialogElements();
  const titleEl = document.getElementById('app-confirm-title');
  const msgEl = document.getElementById('app-confirm-message');
  const inputWrap = document.getElementById('app-confirm-input-wrap');
  const inputEl = document.getElementById('app-confirm-input');
  const cancelBtn = document.getElementById('btn-app-confirm-cancel');
  const okBtn = document.getElementById('btn-app-confirm-ok');

  // Settle any previous unresolved prompt cleanly before opening a new one.
  if (activeDialogResolver) {
    const prev = activeDialogResolver;
    activeDialogResolver = null;
    prev(mode === 'prompt' ? null : false);
  }

  dlg._mode = mode;
  dlg._pendingResult = undefined;
  dlg._returnFocusEl = document.activeElement;
  dlg._skipRestoreFocus = false;

  if (titleEl) titleEl.textContent = title || 'Thông báo';
  if (msgEl) msgEl.textContent = message || '';

  if (mode === 'prompt') {
    if (inputWrap) inputWrap.classList.remove('hidden');
    if (inputEl) inputEl.value = defaultValue || '';
  } else {
    if (inputWrap) inputWrap.classList.add('hidden');
  }

  if (cancelBtn) {
    if (mode === 'notice') {
      cancelBtn.classList.add('hidden');
    } else {
      cancelBtn.classList.remove('hidden');
      cancelBtn.textContent = cancelLabel;
    }
  }

  if (okBtn) {
    okBtn.textContent = confirmLabel;
    okBtn.className = danger
      ? 'px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-game font-bold text-sm shadow transition cursor-pointer'
      : 'px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-game font-bold text-sm shadow transition cursor-pointer';
  }

  return new Promise((resolve) => {
    activeDialogResolver = resolve;
    if (typeof dlg.showModal === 'function') {
      dlg.showModal();
    } else {
      dlg.open = true;
    }
    if (mode === 'prompt' && inputEl) {
      inputEl.focus();
      inputEl.select();
    } else if (okBtn) {
      okBtn.focus();
    }
    announceNVDA(`${title || 'Thông báo'}. ${message || ''}`, 'polite');
  });
}

/**
 * Show an accessible confirmation dialog replacing native window.confirm.
 * @param {object} opts
 * @returns {Promise<boolean>}
 */
export function showConfirmDialog(opts) {
  const config = typeof opts === 'string' ? { message: opts } : (opts || {});
  return openAccessibleModal({
    mode: 'confirm',
    title: config.title || 'Xác nhận thao tác',
    message: config.message || '',
    confirmLabel: config.confirmLabel || 'Xác nhận',
    cancelLabel: config.cancelLabel || 'Hủy',
    danger: Boolean(config.danger)
  });
}

/**
 * Show an accessible prompt dialog replacing native window.prompt.
 * @param {object} opts
 * @returns {Promise<string|null>}
 */
export function showPromptDialog(opts) {
  const config = typeof opts === 'string' ? { message: opts } : (opts || {});
  return openAccessibleModal({
    mode: 'prompt',
    title: config.title || 'Nhập thông tin',
    message: config.message || '',
    defaultValue: config.defaultValue || '',
    confirmLabel: config.confirmLabel || 'Lưu',
    cancelLabel: config.cancelLabel || 'Hủy'
  });
}

/**
 * Show an accessible notice dialog replacing native window.alert.
 * @param {object} opts
 * @returns {Promise<void>}
 */
export function showNoticeDialog(opts) {
  const config = typeof opts === 'string' ? { message: opts } : (opts || {});
  return openAccessibleModal({
    mode: 'notice',
    title: config.title || 'Thông báo',
    message: config.message || '',
    confirmLabel: config.okLabel || 'Đã hiểu'
  });
}
