import { state } from '../core/state.js';

/**
 * Unified NVDA / Screen Reader live-region announcer with dual-buffer alternation
 * and optional Web Speech API synthesis.
 */
export function announceNVDA(message, priority = 'polite') {
  if (!message) return;

  state.liveToggleBuffer = !state.liveToggleBuffer;
  const suffix = state.liveToggleBuffer ? 'a' : 'b';
  const otherSuffix = state.liveToggleBuffer ? 'b' : 'a';

  const targetId = priority === 'assertive' ? `nvda-live-assertive-${suffix}` : `nvda-live-polite-${suffix}`;
  const clearId = priority === 'assertive' ? `nvda-live-assertive-${otherSuffix}` : `nvda-live-polite-${otherSuffix}`;

  const targetEl = typeof document !== 'undefined' ? document.getElementById(targetId) : null;
  const clearEl = typeof document !== 'undefined' ? document.getElementById(clearId) : null;

  if (state.liveRegionTimer) {
    clearTimeout(state.liveRegionTimer);
    state.liveRegionTimer = null;
  }

  if (clearEl) clearEl.textContent = '';
  if (targetEl) {
    targetEl.textContent = '';
    state.liveRegionTimer = setTimeout(() => {
      targetEl.textContent = message;
      state.liveRegionTimer = null;
    }, 60);
  }

  if (state.ttsEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(message);
      utter.lang = 'vi-VN';
      utter.rate = 1.08;
      window.speechSynthesis.speak(utter);
    } catch {
      // Ignore speechSynthesis runtime errors
    }
  }
}
