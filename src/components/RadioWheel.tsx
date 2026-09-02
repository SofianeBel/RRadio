import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { RadioStation, PlaybackMode } from '../types/radio';
import { OnDemandProvider, OnDemandPlaylist, OnDemandTrack, OnDemandViewLevel } from '../types/ondemand';
import { StationLogo } from './StationLogo';
import { ProviderCard } from './ProviderCard';
import { Settings, ArrowLeft } from 'lucide-react';

interface RadioWheelProps {
  isOpen: boolean;
  mode: PlaybackMode;
  onToggleMode: () => void;
  stations: RadioStation[];
  virtualRadioIndex: number;
  onSelectOffset: (offset: number) => void;
  isPlaying: boolean;
  currentTrackIndex: number;
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
  mode,
  onToggleMode,
  stations,
  virtualRadioIndex,
  onSelectOffset,
  isPlaying,
  currentTrackIndex,
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
  const isRadio = mode === 'radio';

  // Radio active item
  const activeStationIndex = ((virtualRadioIndex % stations.length) + stations.length) % stations.length;
  const currentStation = stations[activeStationIndex];
  const currentTrackList = currentStation.tracks;
  const currentTrack = currentTrackList[currentTrackIndex % currentTrackList.length];

  // On Demand active items (calculated via continuous virtual indices)
  const pLen = providers.length;
  const activeProviderIndex = ((virtualProviderIndex % pLen) + pLen) % pLen;
  const activeProvider = providers[activeProviderIndex] || providers[0];

  const plLen = currentPlaylists.length || 1;
  const activePlaylistIndex = ((virtualPlaylistIndex % plLen) + plLen) % plLen;
  const activePlaylist = currentPlaylists[activePlaylistIndex] || currentPlaylists[0];

  const qLen = currentQueue.length || 1;
  const activeQueueIndex = ((virtualQueueIndex % qLen) + qLen) % qLen;
  const activeQueueTrack = currentQueue[activeQueueIndex] || (activePlaylist?.tracks[0]);

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
          className="fixed top-0 left-0 right-0 z-50 flex flex-col items-center select-none pointer-events-auto font-gta6"
        >
          {/* ========================================================================= */}
          {/* TOP BAR ROW: Center Ribbon Window is rigidly anchored at screen 50%       */}
          {/* ========================================================================= */}
          <div className="relative flex items-center justify-center h-[116px] w-full mt-0">
            
            {/* Center Anchor: Holds Left Widget, Ribbon Track, and Right Widget */}
            <div className="relative flex items-center justify-center">
              
              {/* Center: Conveyor Belt Infinite Ribbon Track (overflow-hidden) */}
              <div
                className="relative flex items-center justify-center h-[116px] overflow-hidden"
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
                                <ProviderCard provider={providerItem} size={cardSize} />
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
                                <ProviderCard playlist={playlistItem} size={cardSize} />
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
                          <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-black/70 border border-red-500/40 shadow-lg backdrop-blur-md">
                            <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                            <span className="font-gta6 font-bold text-sm uppercase tracking-wider text-zinc-200">
                              SYNCHRONISATION DES TITRES YOUTUBE MUSIC...
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
                                  <ProviderCard track={trackItem} isPlayed={isPlayed} size={cardSize} />
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
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[110px] h-[110px] border-[2.5px] border-[#F1F3F5] pointer-events-none z-30 shadow-[0_0_10px_rgba(241,243,245,0.35)]" />

              {/* Left Widget: RADIO / ON DEMAND Switch */}
              <div
                onClick={onToggleMode}
                className="absolute right-[calc(100%+24px)] top-1/2 -translate-y-1/2 flex items-center gap-3 cursor-pointer group hover:opacity-95 transition-opacity whitespace-nowrap z-40 pointer-events-auto"
                title="Cliquer pour basculer entre Radio et On Demand (Touche O)"
              >
                <div className="flex flex-col items-end text-right leading-none">
                  <span
                    className={`gta-hud-title text-[21px] tracking-wide uppercase transition-opacity ${
                      isRadio ? 'opacity-100' : 'opacity-40 group-hover:opacity-75'
                    }`}
                  >
                    RADIO
                  </span>
                  <span
                    className={`gta-hud-title text-[17px] tracking-wide uppercase mt-1.5 transition-opacity ${
                      !isRadio ? 'opacity-100' : 'opacity-40 group-hover:opacity-75'
                    }`}
                  >
                    ON DEMAND
                  </span>
                </div>

                {/* Vertical Switch with Animated Active Dot */}
                <div className="relative flex flex-col items-center justify-between h-11 w-4 py-0.5">
                  <div className="absolute top-1 bottom-1 w-[2.5px] bg-[#9CA3AF] border-x border-black/80" />

                  <motion.div
                    animate={{
                      backgroundColor: isRadio ? '#F1F3F5' : '#1C2024',
                      scale: isRadio ? 1.1 : 0.95
                    }}
                    className="relative z-10 w-4 h-4 rounded-full border-[1.5px] border-black shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
                  />

                  <motion.div
                    animate={{
                      backgroundColor: !isRadio ? '#F1F3F5' : '#1C2024',
                      scale: !isRadio ? 1.1 : 0.95
                    }}
                    className="relative z-10 w-4 h-4 rounded-full border-[1.5px] border-black shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
                  />
                </div>
              </div>

              {/* Right Widget: UNMUTE / MUTE Indicator */}
              <div className="absolute left-[calc(100%+24px)] top-1/2 -translate-y-1/2 flex items-center gap-3 whitespace-nowrap z-40 pointer-events-auto">
                <div
                  onClick={onToggleMute}
                  className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
                  title="Cliquer pour Couper / Activer le son (Mute = Éteindre la radio)"
                >
                  <div
                    className={`w-[22px] h-[22px] rounded-full border-[1.5px] border-black shadow-[0_1px_3px_rgba(0,0,0,0.9)] ${
                      isMuted ? 'bg-zinc-600' : 'bg-[#F1F3F5]'
                    }`}
                  />
                  <span className="gta-hud-title text-[21px] tracking-wide uppercase">
                    {isMuted ? 'MUTE' : 'UNMUTE'}
                  </span>
                </div>

                <button
                  onClick={onOpenSettings}
                  className="p-2 rounded-full bg-black/50 border border-white/20 text-zinc-300 hover:text-white hover:bg-white/20 transition-all active:scale-95 ml-1"
                  title="Paramètres GTA 6 (Touche F10)"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>

            </div>

          </div>

          {/* ========================================================================= */}
          {/* METADATA STACK (Directly Below Selected Card)                              */}
          {/* ========================================================================= */}
          <div className="flex flex-col items-center text-center mt-2 pointer-events-none">
            
            {/* Horizontal Underline Separator Bar */}
            <div className="w-[110px] h-[2.5px] bg-[#F1F3F5] shadow-[0_1px_2px_rgba(0,0,0,0.9)] mb-1" />

            {/* Title Display */}
            {isRadio && (
              <h1 className="gta-hud-title text-[24px] uppercase tracking-wide leading-none">
                {currentStation.name}
              </h1>
            )}

            {!isRadio && onDemandLevel === 'providers' && (
              <div className="flex flex-col items-center leading-none">
                <h1 className="gta-hud-title text-[24px] uppercase tracking-wide leading-none">
                  {activeProvider.name}
                </h1>
                <span className="gta-hud-subtext text-[12px] uppercase tracking-wider mt-1 text-[#FFD2A4]">
                  {activeProvider.isComingSoon ? activeProvider.comingSoonNote : `${activeProvider.playlistsCount} SÉLECTIONS DISPONIBLES • APPUYER SUR ENTRÉE`}
                </span>
              </div>
            )}

            {!isRadio && onDemandLevel === 'playlists' && (
              <div className="flex flex-col items-center leading-none">
                <h1 className="gta-hud-title text-[24px] uppercase tracking-wide leading-none">
                  {activePlaylist.title}
                </h1>
                <span className="gta-hud-subtext text-[12px] uppercase tracking-wider mt-1 text-[#FFD2A4]">
                  {activePlaylist.genre} • {activePlaylist.tracks.length} MORCEAUX • SÉLECTIONNER POUR LANCER
                </span>
              </div>
            )}

            {!isRadio && onDemandLevel === 'queue' && (
              <div className="flex flex-col items-center leading-none">
                <h1 className="gta-hud-title text-[24px] uppercase tracking-wide leading-none">
                  {activeQueueTrack?.title || 'TITRE'}
                </h1>
                <span className="gta-hud-subtext text-[12px] uppercase tracking-wider mt-1">
                  {activeQueueTrack?.artist || 'ARTISTE'} • {activePlaylist.title}
                </span>
              </div>
            )}

            {/* Sub-info / Live Track Info */}
            {isRadio && !isMuted && (
              <div className="flex flex-col items-center leading-none mt-1">
                <span className="gta-hud-text text-[15px] uppercase tracking-normal mt-0.5">
                  {currentTrack.title}
                </span>
                <span className="gta-hud-subtext text-[12px] uppercase tracking-wider mt-1">
                  {currentTrack.artist}
                </span>
              </div>
            )}

            {isRadio && isMuted && (
              <span className="gta-hud-text text-[15px] uppercase tracking-wider text-zinc-400 mt-1">
                [ MUTED / OFF AIR ]
              </span>
            )}

            {/* Time Scrubber (Level 3: Queue) */}
            {!isRadio && onDemandLevel === 'queue' && activeQueueTrack && (
              <div className="flex items-center gap-2 mt-2 w-56 pointer-events-auto">
                <span className="text-[10px] text-zinc-300 font-mono">
                  {formatTime(trackProgress)}
                </span>
                <div className="relative flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
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
                className="flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-black/60 border border-white/20 text-[11px] font-mono text-zinc-300 hover:text-white cursor-pointer pointer-events-auto transition-all active:scale-95"
                title="Revenir au niveau précédent (Échap / Touche B)"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>
                  RETOUR : {onDemandLevel === 'queue' ? 'SÉLECTIONS' : 'SERVICES'} [ ÉCHAP / B ]
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
