import { AppSettings, DEFAULT_SETTINGS } from '../types/settings';

const STORAGE_KEY = 'rradio_gta6_settings_v1';

export const loadSettings = (): AppSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      audio: { ...DEFAULT_SETTINGS.audio, ...(parsed.audio || {}) },
      overlay: { ...DEFAULT_SETTINGS.overlay, ...(parsed.overlay || {}) },
      controls: { ...DEFAULT_SETTINGS.controls, ...(parsed.controls || {}) },
      library: { ...DEFAULT_SETTINGS.library, ...(parsed.library || {}) },
      services: {
        ...DEFAULT_SETTINGS.services,
        ...(parsed.services || {}),
        youtubeMusic: {
          ...DEFAULT_SETTINGS.services.youtubeMusic,
          ...((parsed.services && parsed.services.youtubeMusic) || {})
        }
      },
      discord: {
        ...DEFAULT_SETTINGS.discord,
        ...(parsed.discord || {})
      },
    };
  } catch (e) {
    console.warn('Could not read settings from localStorage, using defaults:', e);
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings: AppSettings) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Could not save settings to localStorage:', e);
  }
};
