import { GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET } from '../config/googleOAuth';

export interface YouTubeMusicConfig {
  connected: boolean;
  userEmail?: string;
  userName?: string;
  userAvatar?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: number;
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  autoSyncMixes: boolean;
  audioQuality: 'auto' | 'high' | 'medium';
}
export interface DiscordRpcConfig {
  enabled: boolean;
  activityType: 'listening' | 'playing';
  showStation: boolean;
  showTrack: boolean;
  showTimeRemaining: boolean;
  showGitHubButton: boolean;
  githubUrl: string;
  applicationId: string;
}

export type Language = 'fr' | 'en';
export type VisualTheme = 'gta6' | 'gta4';

export interface UpdatesConfig {
  checkEnabled: boolean;
  releasesUrl: string;
}

export interface AppSettings {
  language: Language;
  hasCompletedOnboarding: boolean;
  audio: {
    masterVolume: number; // 0 - 100
    sfxVolume: number; // 0 - 100
    muteOnStartup: boolean;
    playTuningSound: boolean;
  };
  overlay: {
    theme: VisualTheme;
    hudScale: number; // 80 - 120 (%)
    uiStyle: 'gta6_ribbon' | 'gta_arc';
    showEqualizer: boolean;
    dimBackground: boolean;
  };
  controls: {
    toggleHotkey: string; // 'F8' or 'Alt + V'
    muteHotkey: string; // 'F9' or 'Alt + M'
    holdHotkey: string; // 'Alt + Q'
    gamepadCadenceMs: number; // 150 - 400 ms
    gamepadMuteButton: string; // 'RB / X'
  };
  library: {
    customMusicPath: string;
    scanSubfolders: boolean;
  };
  services: {
    youtubeMusic: YouTubeMusicConfig;
  };
  discord: DiscordRpcConfig;
  updates: UpdatesConfig;
  news: { enabled: boolean; soundEnabled: boolean };
}

export const DEFAULT_SETTINGS: AppSettings = {
  news: { enabled: true, soundEnabled: true },
  language: 'fr',
  hasCompletedOnboarding: false,
  audio: {
    masterVolume: 80,
    sfxVolume: 65,
    muteOnStartup: true,
    playTuningSound: true
  },
  overlay: {
    theme: 'gta6',
    hudScale: 100,
    uiStyle: 'gta6_ribbon',
    showEqualizer: true,
    dimBackground: true
  },
  controls: {
    toggleHotkey: 'F8 / Alt + V',
    muteHotkey: 'F9 / Alt + M',
    holdHotkey: 'Alt + Q (ou Alt + A)',
    gamepadCadenceMs: 250,
    gamepadMuteButton: 'RB / X / R3'
  },
  library: {
    customMusicPath: '',
    scanSubfolders: true
  },
  services: {
    youtubeMusic: {
      connected: false,
      autoSyncMixes: true,
      audioQuality: 'high',
      clientId: GOOGLE_OAUTH_CLIENT_ID,
      clientSecret: GOOGLE_OAUTH_CLIENT_SECRET,
      apiKey: ''
    }
  },
  discord: {
    enabled: true,
    activityType: 'listening',
    showStation: true,
    showTrack: true,
    showTimeRemaining: true,
    showGitHubButton: true,
    githubUrl: 'https://github.com/SofianeBel/RRadio',
    applicationId: '1346077556094009384'
  },
  updates: {
    checkEnabled: true,
    releasesUrl: 'https://github.com/SofianeBel/RRadio/releases'
  }
};
