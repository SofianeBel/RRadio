import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { RadioStation, PlaybackMode } from '../types/radio';
import { OnDemandProvider, OnDemandPlaylist, OnDemandTrack, OnDemandViewLevel } from '../types/ondemand';
import { RadioTrack } from '../audio/radioPlayer';
import { StationLogo } from './StationLogo';
import { ProviderCard } from './ProviderCard';
import { AppSettings, Language } from '../types/settings';
import { useTranslation } from '../i18n/useTranslation';
import { Settings, ArrowLeft } from 'lucide-react';
import './RadioWheel.css';

interface RadioWheelProps {
  isOpen: boolean;
  uiStyle: AppSettings['overlay']['uiStyle'];
  language?: Language;
  mode: PlaybackMode;
  onToggleMode: () => void;
  stations: RadioStation[];
  virtualRadioIndex: number;
  onSelectOffset: (offset: number) => void;
  isPlaying: boolean;
  liveTrack: RadioTrack | null;
  trackProgress: number;
  isTuning: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenSettings: () => void;

  // On Demand 3-Level Drill-Down props (with continuous virtual indices)
  onDemandLevel: OnDemandViewLevel;
  onDemandDirection: number; // 1 = down/forward, -1 = up/back
  providers: OnDemandProvider[];
  virtualProviderIndex: number;
  virtualPlaylistIndex: number;
  virtualQueueIndex: number;
  currentPlaylists: OnDemandPlaylist[];
  currentQueue: OnDemandTrack[];
  onSelectProviderOffset: (offset: number) => void;
  onSelectPlaylistOffset: (offset: number) => void;
  onSelectQueueOffset: (offset: number) => void;
  onNavigateBack: () => void;
}

export const RadioWheel: React.FC<RadioWheelProps> = ({
  isOpen,
  uiStyle,
  language = 'fr',
  mode,
  onToggleMode,
  stations,
  virtualRadioIndex,
  onSelectOffset,
  isPlaying,
  liveTrack,
  trackProgress,
  isTuning,
  isMuted,
  onToggleMute,
  onOpenSettings,
  onDemandLevel,
  onDemandDirection,
  providers,
  virtualProviderIndex,
  virtualPlaylistIndex,
  virtualQueueIndex,
  currentPlaylists,
  currentQueue,
  onSelectProviderOffset,
  onSelectPlaylistOffset,
  onSelectQueueOffset,
  onNavigateBack
}) => {
  const { t } = useTranslation(language);
  const isRadio = mode === 'radio';
  const isCircular = uiStyle === 'gta_arc';

  // Radio active item
  const stationCount = stations.length || 1;
  const activeStationIndex = ((virtualRadioIndex % stationCount) + stationCount) % stationCount;
  const currentStation = stations[activeStationIndex];

  // On Demand active items (calculated via continuous virtual indices)
  const pLen = providers.length || 1;
  const activeProviderIndex = ((virtualProviderIndex % pLen) + pLen) % pLen;
  const activeProvider = providers[activeProviderIndex] || providers[0];

  const plLen = currentPlaylists.length || 1;
  const activePlaylistIndex = ((virtualPlaylistIndex % plLen) + plLen) % plLen;
  const activePlaylist = currentPlaylists[activePlaylistIndex] || currentPlaylists[0];

  const qLen = currentQueue.length || 1;
  const activeQueueIndex = ((virtualQueueIndex % qLen) + qLen) % qLen;
  const activeQueueTrack = currentQueue[activeQueueIndex] || (activePlaylist?.tracks[0]);

  const circleCount = isRadio ? stations.length : onDemandLevel === 'providers'
    ? providers.length : onDemandLevel === 'playlists' ? currentPlaylists.length : currentQueue.length;
  const circleActiveIndex = circleCount === 0 ? 0 : isRadio ? activeStationIndex : onDemandLevel === 'providers'
    ? activeProviderIndex : onDemandLevel === 'playlists' ? activePlaylistIndex : activeQueueIndex;
  const selectCircleOffset = isRadio ? onSelectOffset : onDemandLevel === 'providers'
    ? onSelectProviderOffset : onDemandLevel === 'playlists' ? onSelectPlaylistOffset : onSelectQueueOffset;
  const circlePage = Math.floor(circleActiveIndex / 8);
  const circlePageCount = Math.ceil(circleCount / 8);
  const circlePageStart = circlePage * 8;
  const circleIndices = isCircular && circleCount > 0
    ? Array.from({ length: Math.min(8, circleCount - circlePageStart) }, (_, slot) => circlePageStart + slot)
    : [];
  const circleCenterTitle = isRadio ? currentStation?.name ?? '' : onDemandLevel === 'providers'
    ? activeProvider?.name ?? '' : onDemandLevel === 'playlists' ? activePlaylist?.title ?? '' : activeQueueTrack?.title ?? '';
  const circleCenterSubtitle = isRadio
    ? (!isMuted ? liveTrack?.title ?? liveTrack?.artist ?? '' : '')
    : onDemandLevel === 'queue' ? activeQueueTrack?.artist ?? '' : '';

  const cardSize = 100;
  const stride = 110;
  const windowWidth = 540;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Elevator animation variants for 3-level vertical transition
  const elevatorVariants: Variants = {
    enter: (direction: number) => ({
      y: direction > 0 ? 110 : -110,
      opacity: 0,
      scale: 0.95
    }),
    center: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        y: { type: 'spring' as const, stiffness: 440, damping: 36, mass: 0.8 },
        opacity: { duration: 0.18 }
      }
    },
    exit: (direction: number) => ({
      y: direction > 0 ? -110 : 110,
      opacity: 0,
      scale: 0.95,
      transition: {
        y: { type: 'spring' as const, stiffness: 440, damping: 36, mass: 0.8 },
        opacity: { duration: 0.15 }
      }
    })
  };

  // Slots for Radio infinite sliding tape
  const radioSlotIndices: number[] = [];
  for (let i = virtualRadioIndex - 5; i <= virtualRadioIndex + 5; i++) {
    radioSlotIndices.push(i);
  }

  // Slots for On Demand infinite sliding tapes
  const providerSlotIndices: number[] = [];
  for (let i = virtualProviderIndex - 5; i <= virtualProviderIndex + 5; i++) {
    providerSlotIndices.push(i);
  }

  const playlistSlotIndices: number[] = [];
  for (let i = virtualPlaylistIndex - 5; i <= virtualPlaylistIndex + 5; i++) {
    playlistSlotIndices.push(i);
  }

  const queueSlotIndices: number[] = [];
  for (let i = virtualQueueIndex - 5; i <= virtualQueueIndex + 5; i++) {
    queueSlotIndices.push(i);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className={`radio-hud ${isCircular ? 'radio-hud-circle' : 'radio-hud-horizontal'} fixed top-0 left-0 right-0 z-50 flex flex-col items-center select-none pointer-events-auto font-gta6`}
          data-ui-style={uiStyle}
        >
          {/* ========================================================================= */}
          {/* TOP BAR ROW: Center Ribbon Window is rigidly anchored at screen 50%       */}
          {/* ========================================================================= */}
          <div className="radio-hud-stage relative flex items-center justify-center h-[116px] w-full mt-0">
            
            {/* Center Anchor: Holds Left Widget, Ribbon Track, and Right Widget */}
            <div className="radio-hud-anchor relative flex items-center justify-center">
              
              {isCircular ? (
                <div className="radio-circle-selector" role="group" aria-label={isRadio ? t.hud.radio : t.hud.onDemand} data-level={isRadio ? 'radio' : onDemandLevel}>
                  <div className="radio-circle-ring" data-native-hit-region="ellipse" data-native-hit-shape="ellipse">
                    {circleIndices.map((itemIndex, slot) => {
                      const station = isRadio ? stations[itemIndex] : undefined;
                      const provider = !isRadio && onDemandLevel === 'providers' ? providers[itemIndex] : undefined;
                      const playlist = !isRadio && onDemandLevel === 'playlists' ? currentPlaylists[itemIndex] : undefined;
                      const track = !isRadio && onDemandLevel === 'queue' ? currentQueue[itemIndex] : undefined;
                      const label = station?.name ?? provider?.name ?? playlist?.title ?? track?.title ?? '';
                      const isActive = itemIndex === circleActiveIndex;
                      const isPlayed = !isRadio && onDemandLevel === 'queue' && itemIndex < circleActiveIndex;
                      const angle = (slot * Math.PI) / 4 - Math.PI / 2;
                      const points: string[] = [];
                      for (const radius of [49, 27]) {
                        for (let step = 0; step <= 12; step++) {
                          const fraction = radius === 49 ? step / 12 : 1 - step / 12;
                          const edge = angle + (fraction - 0.5) * (Math.PI / 4 - 0.025);
                          points.push(`${50 + Math.cos(edge) * radius}% ${50 + Math.sin(edge) * radius}%`);
                        }
                      }
                      return (
                        <button
                          key={itemIndex}
                          type="button"
                          className={`radio-circle-item${isActive ? ' is-active' : ''}`}
                          data-index={itemIndex}
                          data-slot={slot}
                          aria-label={label}
                          aria-pressed={isActive}
                          title={label}
                          onClick={() => selectCircleOffset(itemIndex - circleActiveIndex)}
                          style={{ clipPath: `polygon(${points.join(',')})` }}
                        >
                          <span className="radio-circle-art" aria-hidden="true" style={{
                            left: `${50 + Math.cos(angle) * 38}%`,
                            top: `${50 + Math.sin(angle) * 38}%`
                          }}>
                            {station ? <StationLogo station={station} size={64} /> : (
                              <ProviderCard provider={provider} playlist={playlist} track={track} isPlayed={isPlayed} size={64} language={language} />
                            )}
                          </span>
                        </button>
                      );
                    })}
                    <div className="radio-circle-center" aria-hidden="true">
                      {(!isRadio && onDemandLevel === 'queue' && currentQueue.length === 0) ? (
                        <span className="radio-circle-center-title">{t.hud.syncingYtm}</span>
                      ) : (
                        <>
                          <span className="radio-circle-center-title">{circleCenterTitle}</span>
                          {circleCenterSubtitle && <span className="radio-circle-center-subtitle">{circleCenterSubtitle}</span>}
                        </>
                      )}
                    </div>
                  </div>
                  {circlePageCount > 1 && (
                    <nav className="radio-circle-pages" data-native-hit-region="rect" aria-label={language === 'en' ? 'Selector pages' : 'Pages du sélecteur'}>
                      <button type="button" className="radio-circle-previous" disabled={circlePage === 0}
                        aria-label={language === 'en' ? 'Previous page' : 'Page précédente'}
                        onClick={() => selectCircleOffset(circlePageStart - 8 - circleActiveIndex)}>
                        <ArrowLeft size={16} />
                      </button>
                      <span className="radio-circle-page-indicator" aria-live="polite">
                        {circlePage + 1} / {circlePageCount}
                      </span>
                      <button type="button" className="radio-circle-next" disabled={circlePage + 1 === circlePageCount}
                        aria-label={language === 'en' ? 'Next page' : 'Page suivante'}
                        onClick={() => selectCircleOffset(circlePageStart + 8 - circleActiveIndex)}>
                        <ArrowLeft size={16} className="rotate-180" />
                      </button>
                    </nav>
                  )}
                </div>
              ) : (
                <>
              {/* Center: Conveyor Belt Infinite Ribbon Track (overflow-hidden) */}
              <div
                className="radio-hud-ribbon relative flex items-center justify-center h-[116px] overflow-hidden"
                data-native-hit-region="rect"
                style={{ width: `${windowWidth}px` }}
              >
                {/* ================= MODE 1: LIVE RADIO STREAM ================= */}
                {isRadio && (
                  <motion.div
                    key="radio_stream_view"
                    className="absolute top-0 h-[116px] flex items-center"
                    animate={{ x: -(virtualRadioIndex * stride) }}
                    transition={{ type: 'spring', stiffness: 450, damping: 38, mass: 0.75 }}
                    style={{
                      left: '50%',
                      marginLeft: `-${cardSize / 2}px`,
                      willChange: 'transform'
                    }}
                  >
                    {radioSlotIndices.map((slotIndex) => {
                      const itemIndex = ((slotIndex % stations.length) + stations.length) % stations.length;
                      const isCenter = slotIndex === virtualRadioIndex;
                      const leftPos = slotIndex * stride;
                      const stationItem = stations[itemIndex];

                      return (
                        <div
                          key={`radio_slot_${slotIndex}`}
                          onClick={() => onSelectOffset(slotIndex - virtualRadioIndex)}
                          className={`absolute cursor-pointer transition-[opacity,filter] duration-150 ease-out ${
                            isCenter
                              ? 'z-20 opacity-100 scale-[1.09]'
                              : 'opacity-70 hover:opacity-95 z-10 filter brightness-90 scale-[0.95]'
                          }`}
                          style={{
                            left: `${leftPos}px`,
                            width: `${cardSize}px`,
                            height: `${cardSize}px`
                          }}
                        >
                          <StationLogo station={stationItem} size={cardSize} />
                        </div>
                      );
                    })}
                  </motion.div>
                )}

                {/* ================= MODE 2: ON DEMAND (3-LEVEL ELEVATOR + CONTINUOUS TAPE) ================= */}
                {!isRadio && (
                  <AnimatePresence custom={onDemandDirection} mode="wait">
                    {/* LEVEL 1: PROVIDERS CAROUSEL */}
                    {onDemandLevel === 'providers' && (
                      <motion.div
                        key="level_providers"
                        custom={onDemandDirection}
                        variants={elevatorVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="absolute top-0 h-[116px] flex items-center justify-center w-full"
                      >
                        <motion.div
                          className="absolute top-0 h-[116px] flex items-center"
                          animate={{ x: -(virtualProviderIndex * stride) }}
                          transition={{ type: 'spring', stiffness: 450, damping: 38, mass: 0.75 }}
                          style={{
                            left: '50%',
                            marginLeft: `-${cardSize / 2}px`,
                            willChange: 'transform'
                          }}
                        >
                          {providerSlotIndices.map((slotIndex) => {
                            const itemIndex = ((slotIndex % pLen) + pLen) % pLen;
                            const isCenter = slotIndex === virtualProviderIndex;
                            const leftPos = slotIndex * stride;
                            const providerItem = providers[itemIndex];

                            return (
                              <div
                                key={`p_slot_${slotIndex}`}
                                onClick={() => onSelectProviderOffset(slotIndex - virtualProviderIndex)}
                                className={`absolute cursor-pointer transition-[opacity,filter] duration-150 ease-out ${
                                  isCenter
                                    ? 'z-20 opacity-100 scale-[1.09]'
                                    : 'opacity-70 hover:opacity-95 z-10 filter brightness-90 scale-[0.95]'
                                }`}
                                style={{
                                  left: `${leftPos}px`,
                                  width: `${cardSize}px`,
                                  height: `${cardSize}px`
                                }}
                              >
                                <ProviderCard provider={providerItem} size={cardSize} language={language} />
                              </div>
                            );
                          })}
                        </motion.div>
                      </motion.div>
                    )}

                    {/* LEVEL 2: PLAYLISTS CAROUSEL */}
                    {onDemandLevel === 'playlists' && (
                      <motion.div
                        key="level_playlists"
                        custom={onDemandDirection}
                        variants={elevatorVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="absolute top-0 h-[116px] flex items-center justify-center w-full"
                      >
                        <motion.div
                          className="absolute top-0 h-[116px] flex items-center"
                          animate={{ x: -(virtualPlaylistIndex * stride) }}
                          transition={{ type: 'spring', stiffness: 450, damping: 38, mass: 0.75 }}
                          style={{
                            left: '50%',
                            marginLeft: `-${cardSize / 2}px`,
                            willChange: 'transform'
                          }}
                        >
                          {playlistSlotIndices.map((slotIndex) => {
                            const itemIndex = ((slotIndex % plLen) + plLen) % plLen;
                            const isCenter = slotIndex === virtualPlaylistIndex;
                            const leftPos = slotIndex * stride;
                            const playlistItem = currentPlaylists[itemIndex];

                            if (!playlistItem) return null;

                            return (
                              <div
                                key={`pl_slot_${slotIndex}`}
                                onClick={() => onSelectPlaylistOffset(slotIndex - virtualPlaylistIndex)}
                                className={`absolute cursor-pointer transition-[opacity,filter] duration-150 ease-out ${
                                  isCenter
                                    ? 'z-20 opacity-100 scale-[1.09]'
                                    : 'opacity-70 hover:opacity-95 z-10 filter brightness-90 scale-[0.95]'
                                }`}
                                style={{
                                  left: `${leftPos}px`,
                                  width: `${cardSize}px`,
                                  height: `${cardSize}px`
                                }}
                              >
                                <ProviderCard playlist={playlistItem} size={cardSize} language={language} />
                              </div>
                            );
                          })}
                        </motion.div>
                      </motion.div>
                    )}

                    {/* LEVEL 3: QUEUE RIBBON (Played Left / Center Active / Upcoming Right) */}
                    {onDemandLevel === 'queue' && (
                      <motion.div
                        key="level_queue"
                        custom={onDemandDirection}
                        variants={elevatorVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="absolute top-0 h-[116px] flex items-center justify-center w-full"
                      >
                        {currentQueue.length === 0 ? (
                          <div className="radio-hud-sync flex items-center gap-3 px-6 py-3 rounded-2xl bg-black/70 border border-red-500/40 shadow-lg backdrop-blur-md">
                            <div className="radio-hud-spinner w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                            <span className="radio-hud-sync-label font-gta6 font-bold text-sm uppercase tracking-wider text-zinc-200">
                              {t.hud.syncingYtm}
                            </span>
                          </div>
                        ) : (
                          <motion.div
                            className="absolute top-0 h-[116px] flex items-center"
                            animate={{ x: -(virtualQueueIndex * stride) }}
                            transition={{ type: 'spring', stiffness: 450, damping: 38, mass: 0.75 }}
                            style={{
                              left: '50%',
                              marginLeft: `-${cardSize / 2}px`,
                              willChange: 'transform'
                            }}
                          >
                            {queueSlotIndices.map((slotIndex) => {
                              const itemIndex = ((slotIndex % qLen) + qLen) % qLen;
                              const isCenter = slotIndex === virtualQueueIndex;
                              const isPlayed = slotIndex < virtualQueueIndex;
                              const leftPos = slotIndex * stride;
                              const trackItem = currentQueue[itemIndex];

                              if (!trackItem) return null;

                              return (
                                <div
                                  key={`q_slot_${slotIndex}`}
                                  onClick={() => onSelectQueueOffset(slotIndex - virtualQueueIndex)}
                                  className={`absolute cursor-pointer transition-[opacity,filter] duration-150 ease-out ${
                                    isCenter
                                      ? 'z-20 opacity-100 scale-[1.09]'
                                      : 'opacity-70 hover:opacity-95 z-10 filter brightness-90 scale-[0.95]'
                                  }`}
                                  style={{
                                    left: `${leftPos}px`,
                                    width: `${cardSize}px`,
                                    height: `${cardSize}px`
                                  }}
                                >
                                  <ProviderCard track={trackItem} isPlayed={isPlayed} size={cardSize} language={language} />
                                </div>
                              );
                            })}
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}

              </div>

              {/* Static Center Active Frame (Strictly centered on the active card) */}
              <div className="radio-hud-active-frame absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[110px] h-[110px] border-[2.5px] border-[#F1F3F5] pointer-events-none z-30 shadow-[0_0_10px_rgba(241,243,245,0.35)]" />
                </>
              )}

              {/* Left Widget: RADIO / ON DEMAND Switch */}
              <div
                onClick={onToggleMode}
                className="radio-hud-mode absolute right-[calc(100%+24px)] top-1/2 -translate-y-1/2 flex items-center gap-3 cursor-pointer group hover:opacity-95 transition-opacity whitespace-nowrap z-40 pointer-events-auto"
                data-native-hit-region="rect"
                title={t.hud.toggleModeTooltip}
              >
                <div className="flex flex-col items-end text-right leading-none">
                  <span
                    className={`gta-hud-title text-[21px] tracking-wide uppercase transition-opacity ${
                      isRadio ? 'opacity-100' : 'opacity-40 group-hover:opacity-75'
                    }`}
                  >
                    {t.hud.radio}
                  </span>
                  <span
                    className={`gta-hud-title text-[17px] tracking-wide uppercase mt-1.5 transition-opacity ${
                      !isRadio ? 'opacity-100' : 'opacity-40 group-hover:opacity-75'
                    }`}
                  >
                    {t.hud.onDemand}
                  </span>
                </div>

                {/* Vertical Switch with Animated Active Dot */}
                <div className="radio-hud-switch relative flex flex-col items-center justify-between h-11 w-4 py-0.5">
                  <div className="absolute top-1 bottom-1 w-[2.5px] bg-[#9CA3AF] border-x border-black/80" />

                  <motion.div
                    animate={{
                      backgroundColor: isRadio ? '#F1F3F5' : '#1C2024',
                      scale: isRadio ? 1.1 : 0.95
                    }}
                    className="radio-hud-switch-dot relative z-10 w-4 h-4 rounded-full border-[1.5px] border-black shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
                  />

                  <motion.div
                    animate={{
                      backgroundColor: !isRadio ? '#F1F3F5' : '#1C2024',
                      scale: !isRadio ? 1.1 : 0.95
                    }}
                    className="radio-hud-switch-dot relative z-10 w-4 h-4 rounded-full border-[1.5px] border-black shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
                  />
                </div>
              </div>

              {/* Right Widget: UNMUTE / MUTE Indicator */}
              <div className="radio-hud-controls absolute left-[calc(100%+24px)] top-1/2 -translate-y-1/2 flex items-center gap-3 whitespace-nowrap z-40 pointer-events-auto" data-native-hit-region="rect">
                <div
                  onClick={onToggleMute}
                  className="radio-hud-mute flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
                  title={t.hud.toggleMuteTooltip}
                >
                  <div
                    className={`radio-hud-mute-dot w-[22px] h-[22px] rounded-full border-[1.5px] border-black shadow-[0_1px_3px_rgba(0,0,0,0.9)] ${
                      isMuted ? 'bg-zinc-600' : 'bg-[#F1F3F5]'
                    }`}
                  />
                  <span className="gta-hud-title text-[21px] tracking-wide uppercase">
                    {isMuted ? t.hud.mute : t.hud.unmute}
                  </span>
                </div>

                <button
                  onClick={onOpenSettings}
                  className="radio-hud-settings p-2 rounded-full bg-black/50 border border-white/20 text-zinc-300 hover:text-white hover:bg-white/20 transition-all active:scale-95 ml-1"
                  title={t.hud.settingsTooltip}
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>

            </div>

          </div>

          {/* ========================================================================= */}
          {/* METADATA STACK (Directly Below Selected Card)                              */}
          {/* ========================================================================= */}
          <div className="radio-hud-metadata flex flex-col items-center text-center mt-2 pointer-events-none">
            
            {/* Horizontal Underline Separator Bar */}
            <div className="radio-hud-separator w-[110px] h-[2.5px] bg-[#F1F3F5] shadow-[0_1px_2px_rgba(0,0,0,0.9)] mb-1" />

            {isCircular && circleCount === 0 && (
              <div className="radio-hud-sync flex flex-col items-center gap-2" role="status">
                {onDemandLevel === 'queue' && !isRadio ? (
                  <>
                    <div className="radio-hud-spinner w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="radio-hud-sync-label">{t.hud.syncingYtm}</span>
                  </>
                ) : (
                  <span>{language === 'en' ? 'No items available' : 'Aucun élément disponible'}</span>
                )}
              </div>
            )}

            {/* Title Display */}
            {isRadio && currentStation && (
              <h1 className="gta-hud-title text-[24px] uppercase tracking-wide leading-none">
                {currentStation.name}
              </h1>
            )}

            {!isRadio && onDemandLevel === 'providers' && activeProvider && (
              <div className="flex flex-col items-center leading-none">
                <h1 className="gta-hud-title text-[24px] uppercase tracking-wide leading-none">
                  {activeProvider.name}
                </h1>
                <span className="gta-hud-subtext text-[12px] uppercase tracking-wider mt-1 text-[#FFD2A4]">
                  {activeProvider.isComingSoon ? activeProvider.comingSoonNote : `${activeProvider.playlistsCount} ${t.hud.selectionsAvailable}`}
                </span>
              </div>
            )}

            {!isRadio && onDemandLevel === 'playlists' && activePlaylist && (
              <div className="flex flex-col items-center leading-none">
                <h1 className="gta-hud-title text-[24px] uppercase tracking-wide leading-none">
                  {activePlaylist.title}
                </h1>
                <span className="gta-hud-subtext text-[12px] uppercase tracking-wider mt-1 text-[#FFD2A4]">
                  {activePlaylist.genre} • {activePlaylist.tracks.length} {t.hud.tracksAvailable}
                </span>
              </div>
            )}

            {!isRadio && onDemandLevel === 'queue' && (
              <div className="flex flex-col items-center leading-none">
                <h1 className="gta-hud-title text-[24px] uppercase tracking-wide leading-none">
                  {activeQueueTrack?.title || t.hud.trackTitlePlaceholder}
                </h1>
                <span className="gta-hud-subtext text-[12px] uppercase tracking-wider mt-1">
                  {activeQueueTrack?.artist || t.hud.trackArtistPlaceholder} • {activePlaylist?.title}
                </span>
              </div>
            )}

            {/* Sub-info / Live Track Info */}
            {isRadio && !isMuted && liveTrack && (
              <div className="flex flex-col items-center leading-none mt-1">
                <span className="gta-hud-text text-[15px] uppercase tracking-normal mt-0.5">
                  {liveTrack.title}
                </span>
                <span className="gta-hud-subtext text-[12px] uppercase tracking-wider mt-1">
                  {liveTrack.artist}
                </span>
              </div>
            )}

            {isRadio && isMuted && (
              <span className="gta-hud-text text-[15px] uppercase tracking-wider text-zinc-400 mt-1">
                {t.hud.offAir}
              </span>
            )}

            {/* Time Scrubber (Level 3: Queue) */}
            {!isRadio && onDemandLevel === 'queue' && activeQueueTrack && (
              <div className="flex items-center gap-2 mt-2 w-56 pointer-events-auto" data-native-hit-region="rect">
                <span className="text-[10px] text-zinc-300 font-mono">
                  {formatTime(trackProgress)}
                </span>
                <div className="radio-hud-progress relative flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#F1F3F5] transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (trackProgress / activeQueueTrack.duration) * 100)}%`
                    }}
                  />
                </div>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {formatTime(activeQueueTrack.duration)}
                </span>
              </div>
            )}

            {/* Drill-down Breadcrumb / Back Navigation Hint */}
            {!isRadio && onDemandLevel !== 'providers' && (
              <div
                onClick={onNavigateBack}
                className="radio-hud-back flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-black/60 border border-white/20 text-[11px] font-mono text-zinc-300 hover:text-white cursor-pointer pointer-events-auto transition-all active:scale-95"
                data-native-hit-region="rect"
                title={t.hud.backTooltip}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>
                  {language === 'en' ? 'BACK' : 'RETOUR'} : {onDemandLevel === 'queue' ? t.hud.backSelections : t.hud.backServices} [ {language === 'en' ? 'ESC / B' : 'ÉCHAP / B'} ]
                </span>
              </div>
            )}

          </div>

          {/* Tuning Static Glitch Feedback (Only in Radio Mode) */}
          {isTuning && isRadio && (
            <motion.div
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="absolute inset-0 bg-white/5 pointer-events-none"
            />
          )}

        </motion.div>
      )}
    </AnimatePresence>
  );
};
