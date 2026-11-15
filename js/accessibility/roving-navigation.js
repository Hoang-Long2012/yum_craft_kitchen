/**
 * Shared roving tabindex keyboard navigation helper (WAI-ARIA toolbar / tablist / radiogroup).
 */
export function attachRovingKeyNavigation(container, itemSelector, onSelectItem) {
  if (!container || container.dataset.rovingBound === 'true') return;
  container.dataset.rovingBound = 'true';
  container.addEventListener('keydown', (e) => {
    const items = Array.from(container.querySelectorAll(itemSelector));
    if (items.length === 0) return;
    const currentIdx = items.indexOf(document.activeElement);
    if (currentIdx === -1) return;

    let targetIdx = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      targetIdx = (currentIdx + 1) % items.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      targetIdx = (currentIdx - 1 + items.length) % items.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      targetIdx = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      targetIdx = items.length - 1;
    }

    if (targetIdx !== null && items[targetIdx]) {
      items.forEach((el, i) => el.setAttribute('tabindex', i === targetIdx ? '0' : '-1'));
      if (onSelectItem) {
        onSelectItem(items[targetIdx], targetIdx);
      } else {
        items[targetIdx].focus();
      }
    }
  });
}
