/**
 * Bind deterministic focus restoration when closing a native <dialog>.
 */
export function bindDialogFocusRestore(dlg) {
  if (!dlg || dlg.dataset.restoreBound === 'true') return;
  dlg.dataset.restoreBound = 'true';
  dlg.addEventListener('close', () => {
    if (dlg._skipRestoreFocus) {
      dlg._skipRestoreFocus = false;
      return;
    }
    const prev = dlg._returnFocusEl;
    dlg._returnFocusEl = null;
    if (prev && typeof prev.focus === 'function' && prev.isConnected && prev.offsetParent !== null) {
      prev.focus();
    }
  });
}

/**
 * Open a modal <dialog> while recording the element to restore focus to on close.
 */
export function openModalDialog(dlg, focusTarget = null, returnFocusEl = null) {
  if (!dlg) return;
  bindDialogFocusRestore(dlg);
  dlg._returnFocusEl = returnFocusEl || (typeof document !== 'undefined' ? document.activeElement : null);
  dlg.showModal();
  if (focusTarget && typeof focusTarget.focus === 'function') {
    focusTarget.focus();
  }
}
