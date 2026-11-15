/**
 * Shared persistent settings management for YumCraft Kitchen.
 */
export const SETTINGS_STORAGE_KEY = 'yumcraft_game_settings';

export const DEFAULT_SETTINGS = {
  sfxEnabled: true,
  sfxVolume: 80,
  voiceAnnouncements: true,
  singleKeyShortcutsEnabled: true
};

/**
 * Load saved settings from localStorage with defaults.
 */
export function getSavedSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      sfxEnabled: typeof parsed.sfxEnabled === 'boolean' ? parsed.sfxEnabled : DEFAULT_SETTINGS.sfxEnabled,
      sfxVolume: typeof parsed.sfxVolume === 'number' ? parsed.sfxVolume : DEFAULT_SETTINGS.sfxVolume,
      voiceAnnouncements: typeof parsed.voiceAnnouncements === 'boolean' ? parsed.voiceAnnouncements : DEFAULT_SETTINGS.voiceAnnouncements,
      singleKeyShortcutsEnabled: typeof parsed.singleKeyShortcutsEnabled === 'boolean'
        ? parsed.singleKeyShortcutsEnabled
        : DEFAULT_SETTINGS.singleKeyShortcutsEnabled
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Persist settings to localStorage.
 */
export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Lỗi khi lưu cài đặt:', e);
  }
}

/**
 * Sync persisted settings object onto runtime game state.
 */
export function applySettingsToState(settings, targetState) {
  if (!settings || !targetState) return;
  targetState.sfxEnabled = settings.sfxEnabled;
  targetState.sfxVolume = (typeof settings.sfxVolume === 'number' ? settings.sfxVolume : DEFAULT_SETTINGS.sfxVolume) / 100;
  targetState.singleKeyShortcutsEnabled = settings.singleKeyShortcutsEnabled !== false;
}
