import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Home,
  LayoutGrid,
  Phone,
  PhoneOff,
  Play,
  Radio,
  Settings,
  Volume2,
  VolumeX,
  X
} from 'lucide-react';
import './PhoneOverlay.css';
import { Language, VisualTheme } from '../types/settings';
import { PlaybackMode, RadioStation } from '../types/radio';
import { useTranslation } from '../i18n/useTranslation';

export interface PhoneOverlayProps {
  theme: VisualTheme;
  language: Language;
  stations: RadioStation[];
  activeStationId: string;
  track: { title: string; artist: string; duration: number } | null;
  progress: number;
  mode: PlaybackMode;
  isMuted: boolean;
  volume: number;
  onSelectStation: (id: string) => void;
  onToggleMute: () => void;
  onVolumeChange: (volume: number) => void;
  onOpenOnDemand: () => void;
  onOpenSettings: () => void;
  onClose: () => void;
}

type PhonePage = 'home' | 'radio' | 'nowPlaying' | 'volume';

interface HomeApp {
  key: string;
  target?: PhonePage;
  action?: () => void;
}

const clampVolume = (value: number): number => {
  if (Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
};

const formatTime = (totalSeconds: number): string => {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '0:00';
  const whole = Math.floor(totalSeconds);
  const minutes = Math.floor(whole / 60);
  const seconds = whole % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const PhoneOverlay: React.FC<PhoneOverlayProps> = ({
  theme,
  language,
  stations,
  activeStationId,
  track,
  progress,
  mode,
  isMuted,
  volume,
  onSelectStation,
  onToggleMute,
  onVolumeChange,
  onOpenOnDemand,
  onOpenSettings,
  onClose
}) => {
  const { t } = useTranslation(language);
  const [page, setPage] = useState<PhonePage>('home');
  const [focusIndex, setFocusIndex] = useState(0);
  const [clock, setClock] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const isGta4 = theme === 'gta4';
  const city = isGta4 ? t.phone.libertyCity : t.phone.viceCity;
  const safeVolume = clampVolume(volume);
  const activeStation = stations.find(station => station.id === activeStationId) ?? stations[0] ?? null;
  const safeProgress = Number.isFinite(progress) && progress > 0 ? progress : 0;
  const duration = track && Number.isFinite(track.duration) && track.duration > 0 ? track.duration : 0;
  const progressPct = duration > 0 ? Math.min(100, Math.max(0, (safeProgress / duration) * 100)) : 0;

  const apps: HomeApp[] = useMemo(
    () => [
      { key: 'radio', target: 'radio' },
      { key: 'nowPlaying', target: 'nowPlaying' },
      { key: 'volume', target: 'volume' },
      { key: 'onDemand', action: onOpenOnDemand },
      { key: 'settings', action: onOpenSettings },
      { key: 'mute', action: onToggleMute }
    ],
    [onOpenOnDemand, onOpenSettings, onToggleMute]
  );

  const goHome = useCallback(() => {
    setPage('home');
    setFocusIndex(0);
  }, []);

  const goBack = useCallback(() => {
    if (page === 'home') {
      onClose();
      return;
    }
    setPage('home');
    setFocusIndex(0);
  }, [page, onClose]);

  const openPage = useCallback((next: PhonePage) => {
    setPage(next);
    setFocusIndex(0);
  }, []);

  const activateApp = useCallback(
    (app: HomeApp) => {
      if (app.target) {
        openPage(app.target);
        return;
      }
      app.action?.();
    },
    [openPage]
  );

  const selectStation = useCallback(
    (id: string) => {
      onSelectStation(id);
      setPage('nowPlaying');
      setFocusIndex(0);
    },
    [onSelectStation]
  );

  const stepStation = useCallback(
    (delta: number) => {
      if (stations.length === 0) return;
      const current = stations.findIndex(station => station.id === activeStationId);
      const base = current < 0 ? 0 : current;
      const next = stations[(base + delta + stations.length) % stations.length];
      if (next) onSelectStation(next.id);
    },
    [stations, activeStationId, onSelectStation]
  );
  const moveFocus = useCallback((delta: number, length: number) => {
    if (length <= 0) return;
    setFocusIndex(index => ((index + delta) % length + length) % length);
  }, []);

  const changeVolume = useCallback((delta: number) => {
    onVolumeChange(clampVolume(volume + delta));
  }, [volume, onVolumeChange]);


  const activateFocused = useCallback(() => {
    if (page === 'home') {
      const app = apps[focusIndex];
      if (app) activateApp(app);
      return;
    }
    if (page === 'radio') {
      const station = stations[focusIndex];
      if (station) selectStation(station.id);
      return;
    }
    onToggleMute();
  }, [page, apps, focusIndex, activateApp, stations, selectStation, onToggleMute]);

  // Local keyboard control. Capture + stopPropagation keeps App hotkeys quiet.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
        case 'Enter':
        case ' ':
        case 'Escape':
        case 'Backspace':
          break;
        default:
          return;
      }
      event.stopPropagation();
      if (event.key !== 'Escape' && event.key !== 'Enter' && event.key !== 'Backspace') {
        event.preventDefault();
      } else {
        event.preventDefault();
      }

      if (event.key === 'Escape' || event.key === 'Backspace') {
        goBack();
        return;
      }
      if (event.key === 'Enter' || event.key === ' ') {
        if (page === 'nowPlaying') {
          onToggleMute();
          return;
        }
        activateFocused();
        return;
      }
      const forward = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : -1;
      if (page === 'home') {
        moveFocus(forward, apps.length);
        return;
      }
      if (page === 'radio') {
        if (event.key === 'ArrowLeft') {
          goBack();
          return;
        }
        if (event.key === 'ArrowRight') {
          const station = stations[focusIndex];
          if (station) selectStation(station.id);
          return;
        }
        moveFocus(forward, stations.length);
        return;
      }
      if (page === 'nowPlaying') {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          changeVolume(event.key === 'ArrowRight' ? 5 : -5);
          return;
        }
        stepStation(forward);
        return;
      }
      // Volume page: every arrow adjusts volume.
      changeVolume(event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -5 : 5);
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [
    page,
    apps.length,
    stations,
    focusIndex,
    activateFocused,
    goBack,
    moveFocus,
    selectStation,
    stepStation,
    changeVolume,
    onToggleMute
  ]);

  // Keep keypad focus inside valid bounds when lists change.
  useEffect(() => {
    if (page === 'home' && focusIndex >= apps.length) setFocusIndex(0);
    if (page === 'radio' && focusIndex >= stations.length) setFocusIndex(0);
  }, [page, focusIndex, apps.length, stations.length]);

  const appMeta = (key: string): { label: string; hint: string } => {
    switch (key) {
      case 'radio':
        return { label: t.phone.radio, hint: t.phone.radioHint };
      case 'nowPlaying':
        return { label: t.phone.nowPlaying, hint: activeStation?.name ?? t.phone.noStations };
      case 'volume':
        return { label: t.phone.volume, hint: isMuted ? t.phone.muted : `${safeVolume}%` };
      case 'onDemand':
        return { label: t.phone.onDemand, hint: mode === 'ondemand' ? t.phone.live : t.phone.listening };
      case 'mute':
        return { label: isMuted ? t.phone.unmute : t.phone.mute, hint: t.phone.volumeHint };
      default:
        return { label: t.phone.settings, hint: t.phone.settings };
    }
  };

  const appIcon = (key: string) => {
    const className = 'phone-app-icon';
    switch (key) {
      case 'radio':
        return <Radio className={className} aria-hidden="true" />;
      case 'nowPlaying':
        return <Play className={className} aria-hidden="true" />;
      case 'mute':
        return isMuted ? <VolumeX className={className} aria-hidden="true" /> : <Volume2 className={className} aria-hidden="true" />;
      case 'volume':
        return isMuted ? (
          <VolumeX className={className} aria-hidden="true" />
        ) : (
          <Volume2 className={className} aria-hidden="true" />
        );
      case 'onDemand':
        return <LayoutGrid className={className} aria-hidden="true" />;
      default:
        return <Settings className={className} aria-hidden="true" />;
    }
  };

  const renderHome = () => (
    <div data-phone="apps" role="listbox" aria-label={t.phone.shortcuts} className="phone-apps">
      {apps.map((app, index) => {
        const meta = appMeta(app.key);
        const focused = index === focusIndex;
        return (
          <button
            key={app.key}
            type="button"
            role="option"
            aria-selected={focused}
            aria-label={`${meta.label} — ${meta.hint}`}
            data-phone-app={app.key}
            data-phone-focused={focused ? 'true' : 'false'}
            onClick={() => {
              setFocusIndex(index);
              activateApp(app);
            }}
            onMouseEnter={() => setFocusIndex(index)}
            className={`phone-app${focused ? ' is-focused' : ''}`}
          >
            <span className="phone-app-glyph">{appIcon(app.key)}</span>
            <span className="phone-app-text">
              <span className="phone-app-label">{meta.label}</span>
              <span className="phone-app-hint">{meta.hint}</span>
            </span>
            {isGta4 && <span className="phone-app-index">{index + 1}</span>}
          </button>
        );
      })}
    </div>
  );

  const renderRadio = () => {
    if (stations.length === 0) {
      return <p data-phone="stations-empty" className="phone-empty">{t.phone.noStations}</p>;
    }
    return (
      <div data-phone="station-list" role="listbox" aria-label={t.phone.chooseStation} className="phone-stations">
        {stations.map((station, index) => {
          const isActive = station.id === activeStationId;
          const focused = index === focusIndex;
          return (
            <button
              key={station.id}
              type="button"
              role="option"
              aria-selected={isActive}
              aria-label={`${station.name}, ${station.frequency} — ${isActive ? t.phone.currentStation : t.phone.chooseStation}`}
              data-phone-station={station.id}
              data-phone-focused={focused ? 'true' : 'false'}
              onClick={() => selectStation(station.id)}
              onMouseEnter={() => setFocusIndex(index)}
              className={`phone-station${isActive ? ' is-active' : ''}${focused ? ' is-focused' : ''}`}
            >
              <span className="phone-station-main">
                <span className="phone-station-name">{station.name}</span>
                <span className="phone-station-sub">
                  {station.frequency} · {station.genre}
                </span>
              </span>
              {isActive && <Check className="phone-station-check" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    );
  };

  const renderNowPlaying = () => (
    <div data-phone="now-playing" className="phone-now">
      <p className="phone-eyebrow">
        <span className="phone-live-dot" aria-hidden="true" />
        {mode === 'radio' ? t.phone.live : t.phone.onDemand}
      </p>
      <p className="phone-now-station">{activeStation?.name ?? t.phone.noStations}</p>
      {activeStation && (
        <p className="phone-now-freq">
          {activeStation.frequency} · {activeStation.genre}
        </p>
      )}
      {track ? (
        <>
          <p data-phone="track-title" className="phone-track-title">{track.title}</p>
          <p data-phone="track-artist" className="phone-track-artist">{track.artist}</p>
        </>
      ) : (
        <p data-phone="track-empty" className="phone-empty">{t.phone.noTrack}</p>
      )}
      <div
        data-phone="progress"
        role="progressbar"
        aria-label={t.phone.progress}
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuenow={Math.round(Math.min(safeProgress, duration))}
        className="phone-progress"
      >
        <span className="phone-progress-fill" style={{ width: `${progressPct}%` }} aria-hidden="true" />
      </div>
      <p className="phone-times">
        <span>{formatTime(Math.min(safeProgress, duration))}</span>
        <span>{duration > 0 ? formatTime(duration) : t.phone.durationUnknown}</span>
      </p>
      <div className="phone-row-actions">
        <button
          type="button"
          data-phone="mute"
          aria-label={isMuted ? t.phone.unmute : t.phone.mute}
          aria-pressed={isMuted}
          onClick={onToggleMute}
          className="phone-chip"
        >
          {isMuted ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
          <span>{isMuted ? t.phone.unmute : t.phone.mute}</span>
        </button>
        <button
          type="button"
          data-phone="goto-radio"
          aria-label={t.phone.chooseStation}
          onClick={() => openPage('radio')}
          className="phone-chip"
        >
          <Radio aria-hidden="true" />
          <span>{t.phone.radio}</span>
        </button>
      </div>
    </div>
  );

  const renderVolume = () => (
    <div data-phone="volume" className="phone-volume">
      <p className="phone-volume-value" aria-live="polite">
        {isMuted ? t.phone.muted : `${safeVolume}%`}
      </p>
      <div className="phone-volume-controls">
        <button
          type="button"
          data-phone="volume-down"
          aria-label={t.phone.lowerVolume}
          onClick={() => changeVolume(-5)}
          className="phone-stepper"
        >
          −
        </button>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={safeVolume}
          data-phone="volume-slider"
          aria-label={t.phone.volume}
          aria-valuetext={isMuted ? t.phone.muted : `${safeVolume}%`}
          onChange={event => onVolumeChange(clampVolume(Number(event.target.value)))}
          className="phone-slider"
        />
        <button
          type="button"
          data-phone="volume-up"
          aria-label={t.phone.raiseVolume}
          onClick={() => changeVolume(5)}
          className="phone-stepper"
        >
          +
        </button>
      </div>
      <button
        type="button"
        data-phone="mute"
        aria-label={isMuted ? t.phone.unmute : t.phone.mute}
        aria-pressed={isMuted}
        onClick={onToggleMute}
        className="phone-chip"
      >
        {isMuted ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
        <span>{isMuted ? t.phone.unmute : t.phone.mute}</span>
      </button>
      <p className="phone-hint">{t.phone.volumeHint}</p>
    </div>
  );

  const screenTitle =
    page === 'home'
      ? t.phone.menu
      : page === 'radio'
        ? t.phone.radio
        : page === 'nowPlaying'
          ? t.phone.nowPlaying
          : t.phone.volume;

  return (
    <div
      data-phone="root"
      data-phone-theme={theme}
      data-phone-page={page}
      data-native-hit-region="rect"
      data-native-hit-padding="8"
      role="dialog"
      aria-modal="true"
      aria-label={`${t.phone.title} — ${city}`}
      className={`phone-overlay${isGta4 ? ' phone-gta4' : ' phone-gta6'}`}
    >
      <div className="phone-shell">
        <div data-phone="header" className="phone-hardware-top">
          <span className="phone-earpiece" aria-hidden="true" />
          <span className="phone-maker" aria-hidden="true">{isGta4 ? 'badger' : 'RRadio'}</span>
          <button type="button" data-phone="close" aria-label={t.phone.end} title={t.phone.end} onClick={onClose} className="phone-close">
            <X aria-hidden="true" />
          </button>
        </div>
        <div className={isGta4 ? 'phone-lcd' : 'phone-screen'} data-phone="screen">
          <div className="phone-status">
            <span className="phone-signal" aria-hidden="true"><i /><i /><i /><i /></span>
            <time dateTime={clock.toISOString()}>
              {isGta4 && `${clock.toLocaleDateString(language, { weekday: 'short' }).toUpperCase()} `}
              {clock.toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit', hour12: false })}
            </time>
            <span className="phone-sound-status" title={isMuted ? t.phone.muted : t.phone.volume}>
              {isMuted ? <VolumeX aria-label={t.phone.muted} /> : <Volume2 aria-label={t.phone.volume} />}
            </span>
          </div>
          <div className="phone-screen-head">{screenTitle}</div>
          <div className="phone-screen-body">
            {!isGta4 && page === 'home' && (
              <svg className="phone-wallpaper" viewBox="0 0 240 340" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
                <circle cx="169" cy="170" r="58" fill="#ffe4a3" opacity=".75" />
                <path d="M0 255 42 215 63 240 94 204 122 239 151 218 199 264 240 236V340H0Z" fill="#815c72" />
                <path d="M0 284H22V245H46V283H69V255H82V222H96V284H128V254H149V273H185V236H208V274H240V340H0Z" fill="#353d4b" />
                <g fill="#202d32">
                  <path d="M179 340Q174 246 194 161L199 162Q185 240 193 340Z" />
                  <path d="M196 164Q171 123 140 151Q172 145 192 166Q151 148 131 184Q166 164 191 169Q163 178 163 211Q177 183 195 170Q211 192 233 188Q217 171 199 167Q228 147 239 165Q226 125 198 161Q212 122 183 114Q200 135 196 164Z" />
                </g>
              </svg>
            )}
            {page === 'home' && renderHome()}
            {page === 'radio' && renderRadio()}
            {page === 'nowPlaying' && renderNowPlaying()}
            {page === 'volume' && renderVolume()}
          </div>
          {isGta4 && (
            <div className="phone-softkeys">
              <button onClick={activateFocused}>{t.phone.select}</button>
              <button data-phone-key="back" onClick={goBack}>{t.phone.back}</button>
            </div>
          )}
        </div>
        {isGta4 ? (
          <div data-phone="keypad" aria-label={t.phone.keypad} className="phone-keypad">
            <div className="phone-navigation">
              <button data-phone-key="green" aria-label={t.phone.select} onClick={activateFocused} className="phone-call green"><Phone aria-hidden="true" /></button>
              <div className="phone-dpad">
                <button data-phone-key="up" aria-label={t.phone.up} className="phone-key up" onClick={() => page === 'volume' ? changeVolume(5) : page === 'nowPlaying' ? stepStation(-1) : moveFocus(-1, page === 'home' ? apps.length : stations.length)}><ChevronUp /></button>
                <button data-phone-key="left" aria-label={t.phone.left} className="phone-key left" onClick={() => page === 'volume' || page === 'nowPlaying' ? changeVolume(-5) : goBack()}><ChevronLeft /></button>
                <button data-phone-key="select" aria-label={t.phone.select} className="phone-key ok" onClick={activateFocused}><Check /></button>
                <button data-phone-key="right" aria-label={t.phone.right} className="phone-key right" onClick={() => page === 'volume' || page === 'nowPlaying' ? changeVolume(5) : activateFocused()}><ChevronRight /></button>
                <button data-phone-key="down" aria-label={t.phone.down} className="phone-key down" onClick={() => page === 'volume' ? changeVolume(-5) : page === 'nowPlaying' ? stepStation(1) : moveFocus(1, page === 'home' ? apps.length : stations.length)}><ChevronDown /></button>
              </div>
              <button data-phone-key="red" aria-label={t.phone.end} onClick={onClose} className="phone-call red"><PhoneOff aria-hidden="true" /></button>
            </div>
            <div className="phone-number-pad" aria-label={t.phone.shortcuts}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((key, index) => {
                const label = index < apps.length ? appMeta(apps[index].key).label : key === '*' ? t.phone.back : key === '0' ? t.phone.home : key === '#' ? (isMuted ? t.phone.unmute : t.phone.mute) : key === '7' ? t.phone.lowerVolume : key === '9' ? t.phone.raiseVolume : t.phone.volume;
                return (
                  <button key={key} data-phone-number={key} aria-label={`${key} — ${label}`}
                    onClick={() => {
                      if (index < 6) activateApp(apps[index]);
                      else if (key === '*') goBack();
                      else if (key === '0') goHome();
                      else if (key === '#') onToggleMute();
                      else if (key === '7') changeVolume(-5);
                      else if (key === '9') changeVolume(5);
                      else openPage('volume');
                    }}>
                    <span>{key}</span><small>{['', 'ABC', 'DEF', 'GHI', 'JKL', 'MNO', 'PQRS', 'TUV', 'WXYZ', '', '+', ''][index]}</small>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div data-phone="nav" className="phone-nav">
            <button data-phone="back" aria-label={t.phone.back} onClick={goBack} className="phone-nav-btn"><ArrowLeft /></button>
            <button data-phone="home" aria-label={t.phone.home} onClick={goHome} className="phone-nav-btn phone-home-key"><Home /></button>
            <button data-phone="nav-mute" aria-label={isMuted ? t.phone.unmute : t.phone.mute} aria-pressed={isMuted} onClick={onToggleMute} className="phone-nav-btn">{isMuted ? <VolumeX /> : <Volume2 />}</button>
          </div>
        )}

        <p className="phone-kbd" data-native-hit-region="rect">{t.phone.keyboardHint}</p>
      </div>
    </div>
  );
};
