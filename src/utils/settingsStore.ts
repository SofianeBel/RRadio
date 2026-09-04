import { AppSettings, DEFAULT_SETTINGS } from '../types/settings';
import { GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET } from '../config/googleOAuth';

const STORAGE_KEY = 'rradio_gta6_settings_v1';

export const loadSettings = (): AppSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    const storedYoutubeMusic = { ...(parsed.services?.youtubeMusic || {}) } as Record<string, unknown>;
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
          ...storedYoutubeMusic,
          clientId: GOOGLE_OAUTH_CLIENT_ID,
          clientSecret: GOOGLE_OAUTH_CLIENT_SECRET
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
