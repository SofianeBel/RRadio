import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';

export const isTauri = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

let nativeCommandQueue: Promise<void> = Promise.resolve();

const enqueueNativeCommand = (command: () => Promise<void>): Promise<void> => {
  const next = nativeCommandQueue.then(command, command);
  nativeCommandQueue = next.then(() => undefined, () => undefined);
  return next;
};

export const setNativeClickThrough = async (enable: boolean) => {
  if (!isTauri()) return;
  return enqueueNativeCommand(async () => {
    try {
      await invoke('set_click_through', { enable });
    } catch (e) {
      console.warn('Could not set native click-through:', e);
    }
  });
};

export type NativeHitRegionShape = 'rect' | 'ellipse';

export interface NativeHitRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  shape?: NativeHitRegionShape;
}

/** Coordinates are physical client pixels relative to the overlay window. */
export const setNativeHitRegions = async (regions: NativeHitRegion[]): Promise<boolean> => {
  if (!isTauri()) return true;
  let applied = false;
  await enqueueNativeCommand(async () => {
    try {
      await invoke('set_window_hit_regions', { regions });
      applied = true;
    } catch (e) {
      console.warn('Could not set native hit regions:', e);
    }
  });
  return applied;
};

export const setNativeWindowVisibility = async (visible: boolean) => {
  if (!isTauri()) return;
  return enqueueNativeCommand(async () => {
    try {
      await invoke('set_window_visibility', { visible });
    } catch (e) {
      console.warn('Could not set native window visibility:', e);
    }
  });
};

export const setNativeSettingsMode = async (isSettingsOpen: boolean, isRadioOpen: boolean, isCircular: boolean) => {
  if (!isTauri()) return;
  return enqueueNativeCommand(async () => {
    try {
      await invoke('set_settings_window_mode', {
        isSettingsOpen,
        isRadioOpen,
        isCircular
      });
    } catch (e) {
      console.warn('Could not set settings window mode:', e);
    }
  });
};

export const restoreWindowFocus = async () => {
  if (!isTauri()) return;
  try {
    await invoke('restore_window_focus');
  } catch (e) {
    console.warn('Could not restore window focus:', e);
  }
};

export interface GlobalEventCallbacks {
  onShow: () => void;
  onHide: () => void;
  onToggle: () => void;
  onToggleMute: () => void;
  onOpenSettings: () => void;
  onToggleMode: () => void;
  onTogglePhone: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  onConfirm?: () => void;
  onBack?: () => void;
  onSeekEnd?: () => void;
}

export const listenToGlobalOverlayEvents = async (
  callbacks: GlobalEventCallbacks
): Promise<UnlistenFn> => {
  if (!isTauri()) return () => {};

  try {
    const unlistenShow = await listen('global_overlay_show', () => {
      callbacks.onShow();
    });
    const unlistenHide = await listen('global_overlay_hide', () => {
      callbacks.onHide();
    });
    const unlistenToggle = await listen('global_overlay_toggle', () => {
      callbacks.onToggle();
    });
    const unlistenMute = await listen('global_mute_toggle', () => {
      callbacks.onToggleMute();
    });
    const unlistenSettings = await listen('global_open_settings', () => {
      callbacks.onOpenSettings();
    });
    const unlistenMode = await listen('global_mode_toggle', () => {
      callbacks.onToggleMode();
    });
    const unlistenPhone = await listen('global_phone_toggle', () => {
      callbacks.onTogglePhone();
    });
    const unlistenNext = await listen('global_nav_next', () => {
      if (callbacks.onNext) callbacks.onNext();
    });
    const unlistenPrev = await listen('global_nav_prev', () => {
      if (callbacks.onPrev) callbacks.onPrev();
    });
    const unlistenConfirm = await listen('global_nav_confirm', () => {
      if (callbacks.onConfirm) callbacks.onConfirm();
    });
    const unlistenBack = await listen('global_nav_back', () => {
      if (callbacks.onBack) callbacks.onBack();
    });
    const unlistenSeek = await listen('global_seek_end', () => {
      if (callbacks.onSeekEnd) callbacks.onSeekEnd();
    });

    return () => {
      unlistenShow();
      unlistenHide();
      unlistenToggle();
      unlistenMute();
      unlistenSettings();
      unlistenMode();
      unlistenPhone();
      unlistenNext();
      unlistenPrev();
      unlistenConfirm();
      unlistenBack();
      unlistenSeek();
    };
  } catch (e) {
    console.warn('Could not attach global overlay listeners:', e);
    return () => {};
  }
};

export const startNativeGoogleOAuth = async (clientId: string, clientSecret?: string) => {
  if (!isTauri()) return;
  try {
    await invoke('start_google_oauth', { clientId, clientSecret: clientSecret || null });
  } catch (e) {
    console.warn('Could not start Google OAuth flow:', e);
    throw e;
  }
};

export const cancelNativeGoogleOAuth = async () => {
  if (!isTauri()) return;
  try {
    await invoke('cancel_google_oauth');
  } catch (e) {
    console.warn('Could not cancel Google OAuth flow:', e);
  }
};

export interface OAuthSuccessData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
}

export const listenToOAuthEvents = async (
  onSuccess: (data: OAuthSuccessData) => void,
  onError: (err: string) => void,
  onCancelled?: () => void
): Promise<UnlistenFn> => {
  if (!isTauri()) return () => {};
  const unlisten1 = await listen<OAuthSuccessData>('google_oauth_success', (event) => {
    onSuccess(event.payload);
  });
  const unlisten2 = await listen<string>('google_oauth_error', (event) => {
    onError(event.payload);
  });
  const unlisten3 = await listen<string>('google_oauth_cancelled', () => {
    if (onCancelled) onCancelled();
  });
  return () => {
    unlisten1();
    unlisten2();
    unlisten3();
  };
};

export interface DiscordActivityPayload {
  enabled: boolean;
  application_id?: string;
  details?: string;
  state?: string;
  activity_type?: 'listening' | 'playing';
  large_image?: string;
  large_text?: string;
  small_image?: string;
  small_text?: string;
  start_timestamp?: number;
  end_timestamp?: number;
  button_label?: string;
  button_url?: string;
}

export const updateDiscordPresence = (payload: DiscordActivityPayload) => {
  if (!isTauri()) return;
  invoke('update_discord_activity', { payload }).catch((e) => {
    console.warn('Could not update Discord activity:', e);
  });
};

export const clearDiscordPresence = () => {
  if (!isTauri()) return;
  invoke('clear_discord_activity').catch((e) => {
    console.warn('Could not clear Discord activity:', e);
  });
};

export const setNativeLanguage = async (language: 'fr' | 'en') => {
  if (!isTauri()) return;
  try {
    await invoke('set_language', { language });
  } catch (e) {
    console.warn('Could not set native language:', e);
  }
};

