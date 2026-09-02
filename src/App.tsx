import React, { useState, useEffect, useCallback, useRef } from 'react';
import { STATIONS, STATION_LOGOS, STATION_COVERS, GTAVC_COVER_ART } from './data/stations';
import trackCovers from './data/trackCovers.json';
import { PROVIDERS, PLAYLISTS } from './data/ondemandProviders';
import { youtubeMusicService, YTM_CURATED_MIXES } from './services/youtubeMusic';
import { PlaybackMode } from './types/radio';
import { OnDemandViewLevel, OnDemandTrack, OnDemandPlaylist } from './types/ondemand';
import { AppSettings, YouTubeMusicConfig } from './types/settings';
import { loadSettings, saveSettings } from './utils/settingsStore';
import { RadioWheel } from './components/RadioWheel';
import { SettingsDialog } from './components/SettingsDialog';
import { radioPlayer, RadioTrack } from './audio/radioPlayer';
import { soundEngine } from './audio/soundEngine';
import {
  setNativeClickThrough,
  setNativeSettingsMode,
  setNativeWindowVisibility,
  listenToGlobalOverlayEvents,
  updateDiscordPresence,
  clearDiscordPresence,
  DiscordActivityPayload
} from './utils/tauriBridge';

export const App: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Mode state: 'radio' or 'ondemand'
  const [mode, setMode] = useState<PlaybackMode>('radio');
  const modeRef = useRef<PlaybackMode>(mode);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const [virtualRadioIndex, setVirtualRadioIndex] = useState(2); // V-ROCK by default
  const [trackProgress, setTrackProgress] = useState(0);
  const trackProgressRef = useRef(trackProgress);
  useEffect(() => {
    trackProgressRef.current = trackProgress;
  }, [trackProgress]);
  const lastDiscordSignatureRef = useRef<string>('');
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(() => settings.audio.muteOnStartup);
  const [isTuning, setIsTuning] = useState(false);

  // On Demand 3-Level State with Continuous Virtual Indices (No jumping / No popping)
  const [onDemandLevel, setOnDemandLevel] = useState<OnDemandViewLevel>('providers');
  const [onDemandDirection, setOnDemandDirection] = useState<number>(1); // 1 = elevator up, -1 = elevator down
  const [virtualProviderIndex, setVirtualProviderIndex] = useState(0);
  const [virtualPlaylistIndex, setVirtualPlaylistIndex] = useState(0);
  const [virtualQueueIndex, setVirtualQueueIndex] = useState(0);

  const [activeLiveTrack, setActiveLiveTrack] = useState<RadioTrack | null>(null);
  const [ytmPlaylists, setYtmPlaylists] = useState<OnDemandPlaylist[]>(YTM_CURATED_MIXES);

  // Refresh the YouTube access token when expired so user playlists keep loading
  const ensureFreshYtmConfig = useCallback(async (): Promise<YouTubeMusicConfig> => {
    const ytm = settings.services.youtubeMusic;
    if (youtubeMusicService.hasValidToken(ytm) || !ytm.refreshToken) return ytm;
    const fresh = await youtubeMusicService.refreshAccessToken(ytm);
    if (fresh !== ytm) {
      const next: AppSettings = { ...settings, services: { ...settings.services, youtubeMusic: fresh } };
      setSettings(next);
      saveSettings(next);
    }
    return fresh;
  }, [settings]);

  // Fetch YouTube Music playlists whenever account/settings update
  useEffect(() => {
    ensureFreshYtmConfig().then(cfg => {
      youtubeMusicService.fetchUserPlaylists(cfg).then(lists => {
        if (lists && lists.length > 0) {
          setYtmPlaylists(lists);
          // Pre-fetch tracks of the first 3 playlists so they are instantly accessible
          lists.slice(0, 3).forEach(pl => {
            if (!pl.tracks || pl.tracks.length === 0) {
              youtubeMusicService.fetchPlaylistItems(pl.id, cfg).then(tracks => {
                if (tracks && tracks.length > 0) {
                  setYtmPlaylists(prev => prev.map(p => p.id === pl.id ? { ...p, tracks } : p));
                }
              });
            }
          });
        }
      });
    });
  }, [settings.services.youtubeMusic]);

  const tuningTimeoutRef = useRef<number | null>(null);

  const isRadio = mode === 'radio';
  const activeStationIndex = ((virtualRadioIndex % STATIONS.length) + STATIONS.length) % STATIONS.length;
  const activeStation = STATIONS[activeStationIndex];

  // Dynamic active items based on continuous virtual indices
  const pLen = PROVIDERS.length;
  const activeProviderIndex = ((virtualProviderIndex % pLen) + pLen) % pLen;
  const activeProvider = PROVIDERS[activeProviderIndex] || PROVIDERS[0];

  const currentPlaylists = activeProvider.id === 'youtube_music'
    ? ytmPlaylists
    : (PLAYLISTS[activeProvider.id] || []);
  const plLen = currentPlaylists.length || 1;
  const activePlaylistIndex = ((virtualPlaylistIndex % plLen) + plLen) % plLen;
  const activePlaylist = currentPlaylists[activePlaylistIndex] || currentPlaylists[0];

  const currentQueue: OnDemandTrack[] = activePlaylist?.tracks || [];
  const qLen = currentQueue.length || 1;
  const activeQueueIndex = ((virtualQueueIndex % qLen) + qLen) % qLen;
  const activeQueueTrack = currentQueue[activeQueueIndex] || activePlaylist?.tracks[0];
  // Auto-fetch tracks for active YouTube Music playlist if empty
  useEffect(() => {
    if (activeProvider.id !== 'youtube_music') return;
    if (!activePlaylist) return;
    if (activePlaylist.tracks && activePlaylist.tracks.length > 0) return;

    let isMounted = true;
    ensureFreshYtmConfig().then(cfg => {
      youtubeMusicService.fetchPlaylistItems(activePlaylist.id, cfg).then(tracks => {
        if (!isMounted || !tracks || tracks.length === 0) return;
        setYtmPlaylists(prev => prev.map(pl => {
          if (pl.id === activePlaylist.id) {
            return { ...pl, tracks };
          }
          return pl;
        }));
      });
    });

    return () => {
      isMounted = false;
    };
  }, [activeProvider.id, activePlaylist?.id, settings.services.youtubeMusic]);
  // Auto-advance helper for On Demand queue
  const advanceOnDemandTrack = useCallback(() => {
    setVirtualQueueIndex(v => {
      const nextV = v + 1;
      const targetIdx = ((nextV % qLen) + qLen) % qLen;
      const tr = currentQueue[targetIdx];
      if (tr) {
        setTrackProgress(0);
        radioPlayer.playTrack(tr.audioUrl || '', {
          filename: `${tr.title}.mp3`,
          title: tr.title,
          artist: tr.artist,
          duration: tr.duration,
          url: tr.audioUrl || ''
        });
      }
      return nextV;
    });
  }, [qLen, currentQueue]);

  const advanceRef = useRef(advanceOnDemandTrack);
  useEffect(() => {
    advanceRef.current = advanceOnDemandTrack;
  }, [advanceOnDemandTrack]);

  // Initialize Radio Audio Player & Listeners
  useEffect(() => {
    radioPlayer.init();
    radioPlayer.setVolume(isMuted ? 0 : settings.audio.masterVolume / 100);
    radioPlayer.setMute(isMuted);

    // Track progress listener: strictly filters by active mode!
    const unsubscribeTrack = radioPlayer.subscribeTrackChange((stationId, track, progressSeconds) => {
      // In On Demand mode, reject radio broadcast tickers!
      if (modeRef.current === 'ondemand' && stationId !== 'ondemand') return;
      // In Radio mode, reject ondemand tickers!
      if (modeRef.current === 'radio' && stationId === 'ondemand') return;

      trackProgressRef.current = progressSeconds;
      setActiveLiveTrack(track);
      setTrackProgress(progressSeconds);
    });
    // Auto-advance On Demand queue when a song finishes
    const unsubscribeEnded = radioPlayer.subscribeTrackEnded(() => {
      if (modeRef.current === 'ondemand') {
        advanceRef.current();
      }
    });

    radioPlayer.tuneToStation(activeStation.id, false);

    return () => {
      unsubscribeTrack();
      unsubscribeEnded();
    };
  }, []);

  // Update Settings handler with persistence
  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);

    if (!isMuted) {
      radioPlayer.setVolume(newSettings.audio.masterVolume / 100);
    }
  };

  // Sync window visibility and mode
  useEffect(() => {
    const isAnyOpen = isOpen || isSettingsOpen;
    setNativeWindowVisibility(isAnyOpen);
    setNativeSettingsMode(isSettingsOpen, isOpen);
    setNativeClickThrough(!isAnyOpen);
  }, [isSettingsOpen, isOpen]);

  // Real-time Discord Rich Presence synchronization
  useEffect(() => {
    if (!settings.discord?.enabled) {
      if (lastDiscordSignatureRef.current !== 'disabled') {
        lastDiscordSignatureRef.current = 'disabled';
        clearDiscordPresence();
      }
      return;
    }
    let details: string | undefined;
    let state: string | undefined;
    let large_image: string | undefined = 'rradio_logo';
    let large_text: string | undefined = 'RRadio GTA 6';
    let small_image: string | undefined = 'vice_city';
    let small_text: string | undefined = 'Vice City';
    let start_timestamp: number | undefined;
    let end_timestamp: number | undefined;

    const nowSec = Math.floor(Date.now() / 1000);

    if (mode === 'radio') {
      const station = activeStation;
      const track = activeLiveTrack;
      const trackKey = track ? `${track.title} - ${track.artist}` : '';
      const songCover = (trackCovers as Record<string, string>)[trackKey];

      // Real album cover of the song currently playing
      large_image = songCover || STATION_COVERS[station.id] || GTAVC_COVER_ART;
      large_text = track ? `${track.title} • ${track.artist}` : `${station.name} (${station.frequency})`;
      small_image = STATION_COVERS[station.id] || GTAVC_COVER_ART;
      small_text = `${station.name} (${station.frequency})`;

      if (settings.discord.showTrack) {
        if (track && track.title) {
          details = track.artist ? `${track.title} - ${track.artist}` : track.title;
        } else {
          details = 'En direct des ondes';
        }
      }

      if (settings.discord.showStation) {
        state = `📻 ${station.name} (${station.genre})`;
      }

      if (settings.discord.showTimeRemaining && track && track.duration) {
        let progress = Math.max(0, Math.floor(trackProgressRef.current));
        // If progress is >= track.duration - 2, it's a residual/stale value from the previous song!
        if (progress >= track.duration - 2) {
          progress = Math.max(0, Math.floor(radioPlayer.getCurrentProgress()));
          if (progress >= track.duration - 2) {
            progress = 0;
          }
        }
        const duration = Math.max(1, Math.floor(track.duration));
        start_timestamp = nowSec - progress;
        end_timestamp = start_timestamp + duration;
      }
    } else {
      // On Demand mode
      const track = activeQueueTrack;
      large_image = track?.coverUrl || activePlaylist?.coverUrl || 'ondemand_logo';
      large_text = `${activeProvider.name} • ${activePlaylist?.title || 'Lecture à la demande'}`;
      small_image = activeProvider.id;
      small_text = activeProvider.name;

      if (settings.discord.showTrack) {
        if (track && track.title) {
          details = track.artist ? `${track.title} - ${track.artist}` : track.title;
        } else {
          details = 'Morceau à la demande';
        }
      }

      if (settings.discord.showStation) {
        state = `🎧 ${activeProvider.name} • ${activePlaylist?.title || 'Playlist'}`;
      }

      if (settings.discord.showTimeRemaining && track && track.duration) {
        let progress = Math.max(0, Math.floor(trackProgressRef.current));
        if (progress >= track.duration - 2) {
          progress = Math.max(0, Math.floor(radioPlayer.getCurrentProgress()));
          if (progress >= track.duration - 2) {
            progress = 0;
          }
        }
        const duration = Math.max(1, Math.floor(track.duration));
        start_timestamp = nowSec - progress;
        end_timestamp = start_timestamp + duration;
      }
    }
    if (isMuted) {
      if (details) {
        details = `[En sourdine] ${details}`;
      } else {
        details = '[En sourdine]';
      }
    }

    const payload: DiscordActivityPayload = {
      enabled: true,
      application_id: settings.discord.applicationId?.trim() || '1346077556094009384',
      details,
      state,
      activity_type: settings.discord.activityType || 'listening',
      large_image,
      large_text,
      small_image,
      small_text,
      start_timestamp,
      end_timestamp,
      button_label: settings.discord.showGitHubButton ? 'Voir sur GitHub' : undefined,
      button_url: settings.discord.showGitHubButton
        ? (settings.discord.githubUrl?.trim() || 'https://github.com/sifly/RRadio')
        : undefined
    };
    const signature = JSON.stringify({
      enabled: settings.discord?.enabled,
      mode,
      details,
      state,
      activityType: settings.discord.activityType,
      large_image,
      isMuted,
      appId: settings.discord?.applicationId,
      track: mode === 'radio' ? activeLiveTrack?.title : activeQueueTrack?.title,
      startBucket: start_timestamp ? Math.round(start_timestamp / 10) : 0
    });

    if (lastDiscordSignatureRef.current === signature) {
      return;
    }
    lastDiscordSignatureRef.current = signature;

    updateDiscordPresence(payload);
  }, [
    mode,
    activeStation.id,
    activeStation.name,
    activeStation.frequency,
    activeStation.genre,
    activeLiveTrack?.title,
    activeLiveTrack?.artist,
    activeLiveTrack?.duration,
    activeProvider.id,
    activeProvider.name,
    activePlaylist?.id,
    activePlaylist?.title,
    activeQueueTrack?.title,
    activeQueueTrack?.artist,
    activeQueueTrack?.duration,
    activeQueueTrack?.coverUrl,
    isMuted,
    settings.discord
  ]);

  // Clear Discord Presence on App unmount
  useEffect(() => {
    return () => {
      clearDiscordPresence();
    };
  }, []);

  // Toggle Mode (RADIO <-> ON DEMAND)
  const handleToggleMode = useCallback(() => {
    soundEngine.playMechanicalClick();
    setMode(prev => {
      const nextMode = prev === 'radio' ? 'ondemand' : 'radio';
      setTrackProgress(0);

      if (nextMode === 'radio') {
        radioPlayer.tuneToStation(activeStation.id, settings.audio.playTuningSound);
      } else {
        // Switch to On Demand: resume queue track or start first
        const track = currentQueue[activeQueueIndex];
        if (track) {
          radioPlayer.playTrack(track.audioUrl || '', {
            filename: `${track.title}.mp3`,
            title: track.title,
            artist: track.artist,
            duration: track.duration,
            url: track.audioUrl || ''
          });
        }
      }
      return nextMode;
    });
  }, [activeStation, currentQueue, activeQueueIndex, settings.audio.playTuningSound]);

  // Tune to station when virtualRadioIndex changes
  const switchStation = useCallback((newVirtualIndex: number) => {
    const nextStation = STATIONS[((newVirtualIndex % STATIONS.length) + STATIONS.length) % STATIONS.length];
    
    setIsTuning(true);
    if (tuningTimeoutRef.current) window.clearTimeout(tuningTimeoutRef.current);
    tuningTimeoutRef.current = window.setTimeout(() => setIsTuning(false), 200);

    setVirtualRadioIndex(newVirtualIndex);
    radioPlayer.tuneToStation(nextStation.id, settings.audio.playTuningSound);
  }, [settings.audio.playTuningSound]);

  // On Demand Offset Handlers (Continuous tape sliding on click)
  const handleSelectProviderOffset = useCallback((offset: number) => {
    if (offset === 0) return;
    soundEngine.playMechanicalClick();
    setVirtualProviderIndex(v => v + offset);
  }, []);

  const handleSelectPlaylistOffset = useCallback((offset: number) => {
    if (offset === 0) return;
    soundEngine.playMechanicalClick();
    setVirtualPlaylistIndex(v => v + offset);
  }, []);

  const handleSelectQueueOffset = useCallback((offset: number) => {
    if (offset === 0) return;
    soundEngine.playMechanicalClick();
    setVirtualQueueIndex(v => {
      const nextV = v + offset;
      const targetIdx = ((nextV % qLen) + qLen) % qLen;
      const tr = currentQueue[targetIdx];
      if (tr) {
        setTrackProgress(0);
        radioPlayer.playTrack(tr.audioUrl || '', {
          filename: `${tr.title}.mp3`,
          title: tr.title,
          artist: tr.artist,
          duration: tr.duration,
          url: tr.audioUrl || ''
        });
      }
      return nextV;
    });
  }, [qLen, currentQueue]);

  // Drill-Down Confirm Handler (Pressing Enter or clicking active center card)
  const handleConfirm = useCallback(() => {
    if (isRadio) return;

    if (onDemandLevel === 'providers') {
      const targetProvider = PROVIDERS[activeProviderIndex];
      if (targetProvider.isComingSoon) {
        soundEngine.playTuningNoise(120);
        return;
      }
      soundEngine.playMechanicalClick();
      setOnDemandDirection(1); // Elevator moves UP
      setVirtualPlaylistIndex(0);
      setOnDemandLevel('playlists');
    } else if (onDemandLevel === 'playlists') {
      soundEngine.playMechanicalClick();
      setOnDemandDirection(1); // Elevator moves UP
      setVirtualQueueIndex(0);
      setTrackProgress(0);
      setOnDemandLevel('queue');
      if (isMuted) {
        setIsMuted(false);
        radioPlayer.setMute(false);
        radioPlayer.setVolume(settings.audio.masterVolume / 100);
      }
      // Start playing first track of selected playlist with real MP3 stream!
      // Start playing first track of selected playlist!
      const pl = currentPlaylists[activePlaylistIndex];
      if (pl && pl.tracks && pl.tracks[0]) {
        const tr = pl.tracks[0];
        radioPlayer.playTrack(tr.audioUrl || '', {
          filename: `${tr.title}.mp3`,
          title: tr.title,
          artist: tr.artist,
          duration: tr.duration,
          url: tr.audioUrl || ''
        });
      } else if (pl && activeProvider.id === 'youtube_music') {
        // If tracks are still loading, fetch them immediately and start playing track 0
        youtubeMusicService.fetchPlaylistItems(pl.id, settings.services.youtubeMusic).then(tracks => {
          if (tracks && tracks.length > 0) {
            setYtmPlaylists(prev => prev.map(p => p.id === pl.id ? { ...p, tracks } : p));
            const tr = tracks[0];
            radioPlayer.playTrack(tr.audioUrl || '', {
              filename: `${tr.title}.mp3`,
              title: tr.title,
              artist: tr.artist,
              duration: tr.duration,
              url: tr.audioUrl || ''
            });
          }
        });
      }
    } else if (onDemandLevel === 'queue') {
      // Play currently active center song
      soundEngine.playMechanicalClick();
      setTrackProgress(0);
      if (isMuted) {
        setIsMuted(false);
        radioPlayer.setMute(false);
        radioPlayer.setVolume(settings.audio.masterVolume / 100);
      }
      const tr = currentQueue[activeQueueIndex];
      if (tr) {
        radioPlayer.playTrack(tr.audioUrl || '', {
          filename: `${tr.title}.mp3`,
          title: tr.title,
          artist: tr.artist,
          duration: tr.duration,
          url: tr.audioUrl || ''
        });
      }
    }
  }, [isRadio, onDemandLevel, activeProviderIndex, currentPlaylists, activePlaylistIndex, currentQueue, activeQueueIndex]);

  // Navigate Back (Elevator moves DOWN)
  const handleNavigateBack = useCallback(() => {
    soundEngine.playMechanicalClick();
    if (onDemandLevel === 'queue') {
      setOnDemandDirection(-1); // Elevator moves DOWN
      setOnDemandLevel('playlists');
    } else if (onDemandLevel === 'playlists') {
      setOnDemandDirection(-1); // Elevator moves DOWN
      setOnDemandLevel('providers');
    } else if (onDemandLevel === 'providers') {
      setMode('radio');
      radioPlayer.tuneToStation(activeStation.id, false);
    }
  }, [onDemandLevel, activeStation]);

  // Continuous Horizontal Navigation: Next / Prev
  const handleNext = useCallback(() => {
    if (isRadio) {
      switchStation(virtualRadioIndex + 1);
    } else if (onDemandLevel === 'providers') {
      soundEngine.playMechanicalClick();
      setVirtualProviderIndex(v => v + 1);
    } else if (onDemandLevel === 'playlists') {
      soundEngine.playMechanicalClick();
      setVirtualPlaylistIndex(v => v + 1);
    } else if (onDemandLevel === 'queue') {
      soundEngine.playMechanicalClick();
      advanceOnDemandTrack();
    }
  }, [isRadio, virtualRadioIndex, switchStation, onDemandLevel, qLen, currentQueue]);

  const handlePrev = useCallback(() => {
    if (isRadio) {
      switchStation(virtualRadioIndex - 1);
    } else if (onDemandLevel === 'providers') {
      soundEngine.playMechanicalClick();
      setVirtualProviderIndex(v => v - 1);
    } else if (onDemandLevel === 'playlists') {
      soundEngine.playMechanicalClick();
      setVirtualPlaylistIndex(v => v - 1);
    } else if (onDemandLevel === 'queue') {
      soundEngine.playMechanicalClick();
      setVirtualQueueIndex(v => {
        const prevV = v - 1;
        const targetIdx = ((prevV % qLen) + qLen) % qLen;
        const tr = currentQueue[targetIdx];
        if (tr) {
          setTrackProgress(0);
          radioPlayer.playTrack(tr.audioUrl || '', {
            filename: `${tr.title}.mp3`,
            title: tr.title,
            artist: tr.artist,
            duration: tr.duration,
            url: tr.audioUrl || ''
          });
        }
        return prevV;
      });
    }
  }, [isRadio, virtualRadioIndex, switchStation, onDemandLevel, qLen, currentQueue]);

  const handleSelectRadioOffset = useCallback((offset: number) => {
    if (offset === 0) return;
    switchStation(virtualRadioIndex + offset);
  }, [virtualRadioIndex, switchStation]);

  const handleToggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      radioPlayer.setMute(next);
      if (!next) {
        radioPlayer.setVolume(settings.audio.masterVolume / 100);
        if (isRadio) {
          radioPlayer.tuneToStation(activeStation.id, settings.audio.playTuningSound);
        }
      }
      return next;
    });
  }, [settings.audio.masterVolume, settings.audio.playTuningSound, isRadio, activeStation]);

  const handleToggleSettings = useCallback(() => {
    setIsSettingsOpen(prev => !prev);
  }, []);

  // Stable handlers ref
  const handlersRef = useRef({
    onShow: () => { if (!isSettingsOpen) setIsOpen(true); },
    onHide: () => { if (!isSettingsOpen) setIsOpen(false); },
    onToggle: () => { if (!isSettingsOpen) setIsOpen(prev => !prev); },
    onToggleMute: handleToggleMute,
    onOpenSettings: handleToggleSettings,
    onNext: handleNext,
    onPrev: handlePrev,
    onToggleMode: handleToggleMode,
    onNavigateBack: handleNavigateBack,
    onConfirm: handleConfirm,
    onSeekEnd: () => {
      if (modeRef.current === 'ondemand' && currentQueue[activeQueueIndex]) {
        radioPlayer.seek(currentQueue[activeQueueIndex].duration - 2.5);
      }
    }
  });

  useEffect(() => {
    handlersRef.current = {
      onShow: () => { if (!isSettingsOpen) setIsOpen(true); },
      onHide: () => { if (!isSettingsOpen) setIsOpen(false); },
      onToggle: () => { if (!isSettingsOpen) setIsOpen(prev => !prev); },
      onToggleMute: handleToggleMute,
      onOpenSettings: handleToggleSettings,
      onNext: handleNext,
      onPrev: handlePrev,
      onToggleMode: handleToggleMode,
      onNavigateBack: handleNavigateBack,
      onConfirm: handleConfirm,
      onSeekEnd: () => {
        if (modeRef.current === 'ondemand' && currentQueue[activeQueueIndex]) {
          radioPlayer.seek(currentQueue[activeQueueIndex].duration - 2.5);
        }
      }
    };
  }, [isSettingsOpen, handleToggleMute, handleToggleSettings, handleNext, handlePrev, handleToggleMode, handleNavigateBack, handleConfirm]);

  // Global System-Wide Shortcuts listener
  useEffect(() => {
    let unlisten: (() => void) | null = null;
    let isCancelled = false;

    listenToGlobalOverlayEvents({
      onShow: () => { if (!isCancelled) handlersRef.current.onShow(); },
      onHide: () => { if (!isCancelled) handlersRef.current.onHide(); },
      onToggle: () => { if (!isCancelled) handlersRef.current.onToggle(); },
      onToggleMute: () => { if (!isCancelled) handlersRef.current.onToggleMute(); },
      onOpenSettings: () => { if (!isCancelled) handlersRef.current.onOpenSettings(); },
      onToggleMode: () => { if (!isCancelled) handlersRef.current.onToggleMode(); },
      onNext: () => { if (!isCancelled) handlersRef.current.onNext(); },
      onPrev: () => { if (!isCancelled) handlersRef.current.onPrev(); },
      onConfirm: () => { if (!isCancelled) handlersRef.current.onConfirm(); },
      onBack: () => { if (!isCancelled) handlersRef.current.onNavigateBack(); },
      onSeekEnd: () => { if (!isCancelled) handlersRef.current.onSeekEnd(); }
    }).then(fn => {
      if (isCancelled) {
        fn();
      } else {
        unlisten = fn;
      }
    });

    return () => {
      isCancelled = true;
      if (unlisten) unlisten();
    };
  }, []);

  // In-App Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Escape') {
        e.preventDefault();
        if (isSettingsOpen) {
          setIsSettingsOpen(false);
          return;
        }
        if (!isRadio && onDemandLevel !== 'providers') {
          handlersRef.current.onNavigateBack();
          return;
        }
        setIsOpen(false);
      } else if (e.code === 'Enter' || e.code === 'NumpadEnter') {
        e.preventDefault();
        handlersRef.current.onConfirm();
      } else if (e.code === 'F10' || (e.altKey && e.code === 'KeyS')) {
        e.preventDefault();
        handleToggleSettings();
      } else if ((e.altKey && (e.code === 'KeyQ' || e.code === 'KeyA' || e.code === 'KeyV')) || e.code === 'F8') {
        e.preventDefault();
        if (!isSettingsOpen) setIsOpen(prev => !prev);
      } else if (e.code === 'KeyO' || e.code === 'F7' || (e.altKey && e.code === 'KeyO')) {
        e.preventDefault();
        handleToggleMode();
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        e.preventDefault();
        handlePrev();
      } else if ((e.altKey && e.code === 'KeyM') || e.code === 'KeyM' || e.code === 'F9') {
        e.preventDefault();
        handleToggleMute();
      } else if (e.code === 'F6') {
        e.preventDefault();
        handlersRef.current.onSeekEnd();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSettingsOpen, isRadio, onDemandLevel, handleToggleSettings, handleNext, handlePrev, handleToggleMode, handleToggleMute]);

  // Mouse Wheel navigation
  useEffect(() => {
    let lastWheelTime = 0;
    const handleWheel = (e: WheelEvent) => {
      if (!isOpen || isSettingsOpen) return;
      const now = Date.now();
      if (now - lastWheelTime < 180) return;

      if (e.deltaY > 0 || e.deltaX > 0) {
        handleNext();
        lastWheelTime = now;
      } else if (e.deltaY < 0 || e.deltaX < 0) {
        handlePrev();
        lastWheelTime = now;
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [isOpen, isSettingsOpen, handleNext, handlePrev]);

  // Gamepad Loop: A (Select/Drill in), B (Back/Drill out), LB (Hold), D-Pad/Stick (Browse)
  useEffect(() => {
    let animationFrameId: number;
    let prevLbPressed = false;
    let prevRbPressed = false;
    let prevXPressed = false;
    let prevR3Pressed = false;
    let prevYPressed = false;
    let prevAPressed = false;
    let prevBPressed = false;
    let lastStepTime = 0;
    let gamepadOpenedOverlay = false;

    const cadence = settings.controls.gamepadCadenceMs || 250;

    const checkGamepad = () => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];

      for (let i = 0; i < gamepads.length; i++) {
        const gp = gamepads[i];
        if (!gp) continue;

        const now = Date.now();

        // 1. LB Bumper: Hold to Open / Release to Close
        const lbPressed = !!gp.buttons[4]?.pressed;
        if (lbPressed && !prevLbPressed) {
          gamepadOpenedOverlay = true;
          if (!isSettingsOpen) setIsOpen(true);
        } else if (!lbPressed && prevLbPressed) {
          if (gamepadOpenedOverlay) {
            if (!isSettingsOpen) setIsOpen(false);
            gamepadOpenedOverlay = false;
          }
        }
        prevLbPressed = lbPressed;

        // 2. A Button (Select / Drill Down)
        const aPressed = !!gp.buttons[0]?.pressed;
        if (aPressed && !prevAPressed) {
          handlersRef.current.onConfirm();
        }
        prevAPressed = aPressed;

        // 3. B Button (Back / Drill Up)
        const bPressed = !!gp.buttons[1]?.pressed;
        if (bPressed && !prevBPressed) {
          handlersRef.current.onNavigateBack();
        }
        prevBPressed = bPressed;

        // 4. Mute Toggle: RB, X, or R3
        const rbPressed = !!gp.buttons[5]?.pressed;
        const xPressed = !!gp.buttons[2]?.pressed;
        const r3Pressed = !!gp.buttons[11]?.pressed;

        if ((rbPressed && !prevRbPressed) || (xPressed && !prevXPressed) || (r3Pressed && !prevR3Pressed)) {
          handlersRef.current.onToggleMute();
        }
        prevRbPressed = rbPressed;
        prevXPressed = xPressed;
        prevR3Pressed = r3Pressed;

        // 5. Y Button: Toggle Radio / On Demand
        const yPressed = !!gp.buttons[3]?.pressed;
        if (yPressed && !prevYPressed) {
          handlersRef.current.onToggleMode();
        }
        prevYPressed = yPressed;

        // 6. Navigation (D-Pad & Left Stick)
        const dpadLeft = !!gp.buttons[14]?.pressed;
        const dpadRight = !!gp.buttons[15]?.pressed;
        const axisX = gp.axes[0] || 0;

        if (!isSettingsOpen && (now - lastStepTime >= cadence)) {
          if (dpadRight || axisX > 0.55) {
            handlersRef.current.onNext();
            lastStepTime = now;
          } else if (dpadLeft || axisX < -0.55) {
            handlersRef.current.onPrev();
            lastStepTime = now;
          }
        }

        break;
      }

      animationFrameId = requestAnimationFrame(checkGamepad);
    };

    animationFrameId = requestAnimationFrame(checkGamepad);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isSettingsOpen, settings.controls.gamepadCadenceMs]);

  return (
    <main
      className={`relative w-screen overflow-hidden bg-transparent text-white font-sans select-none ${
        isSettingsOpen ? 'h-screen pointer-events-auto' : 'h-[340px] pointer-events-none'
      }`}
    >
      {/* GTA 6 Top-Center Radio & On Demand Selector HUD */}
      <RadioWheel
        isOpen={isOpen && !isSettingsOpen}
        mode={mode}
        onToggleMode={handleToggleMode}
        stations={STATIONS}
        virtualRadioIndex={virtualRadioIndex}
        onSelectOffset={handleSelectRadioOffset}
        isPlaying={isPlaying}
        liveTrack={activeLiveTrack}
        trackProgress={trackProgress}
        isTuning={isTuning}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenSettings={handleToggleSettings}
        onDemandLevel={onDemandLevel}
        onDemandDirection={onDemandDirection}
        providers={PROVIDERS}
        virtualProviderIndex={virtualProviderIndex}
        virtualPlaylistIndex={virtualPlaylistIndex}
        virtualQueueIndex={virtualQueueIndex}
        currentPlaylists={currentPlaylists}
        currentQueue={currentQueue}
        onSelectProviderOffset={handleSelectProviderOffset}
        onSelectPlaylistOffset={handleSelectPlaylistOffset}
        onSelectQueueOffset={handleSelectQueueOffset}
        onNavigateBack={handleNavigateBack}
      />

      {/* GTA 6 Settings Dialog Modal */}
      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />
    </main>
  );
};
export default App;
