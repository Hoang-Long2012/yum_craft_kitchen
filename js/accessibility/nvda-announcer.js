import { state } from '../core/state.js';

/**
 * Unified NVDA / Screen Reader live-region announcer with dual-buffer alternation
 * and optional Web Speech API synthesis.
 */
export function announceNVDA(message, priority = 'polite') {
  if (!message) return;

  const channel = priority === 'assertive' ? 'assertive' : 'polite';
  state.liveToggleBuffer = !state.liveToggleBuffer;
  const suffix = state.liveToggleBuffer ? 'a' : 'b';
  const otherSuffix = state.liveToggleBuffer ? 'b' : 'a';

  const targetId = `nvda-live-${channel}-${suffix}`;
  const clearId = `nvda-live-${channel}-${otherSuffix}`;

  const targetEl = typeof document !== 'undefined' ? document.getElementById(targetId) : null;
  const clearEl = typeof document !== 'undefined' ? document.getElementById(clearId) : null;

  if (!state.liveRegionTimers) {
    state.liveRegionTimers = { polite: null, assertive: null };
  }

  if (state.liveRegionTimers[channel]) {
    clearTimeout(state.liveRegionTimers[channel]);
    state.liveRegionTimers[channel] = null;
  }

  if (clearEl) clearEl.textContent = '';
  if (targetEl) {
    targetEl.textContent = '';
    let timerId = null;
    timerId = setTimeout(() => {
      targetEl.textContent = message;
      state.liveRegionTimers[channel] = null;
      if (state.liveRegionTimer === timerId) {
        state.liveRegionTimer = null;
      }
    }, 60);
    state.liveRegionTimers[channel] = timerId;
    state.liveRegionTimer = timerId;
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
