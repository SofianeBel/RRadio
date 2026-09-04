import React from 'react';
import { Volume2, VolumeX, SkipForward, SkipBack, Play, Pause, Gamepad2, Radio, LayoutGrid, CircleDot } from 'lucide-react';
import { Language } from '../types/settings';
import { useTranslation } from '../i18n/useTranslation';

interface OverlayControlsProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  bgMode: 'gameplay' | 'neon' | 'transparent';
  onBgModeChange: (mode: 'gameplay' | 'neon' | 'transparent') => void;
  uiStyle: 'gta6_ribbon' | 'gta_arc';
  onUiStyleChange: (style: 'gta6_ribbon' | 'gta_arc') => void;
  gamepadConnected: boolean;
  language?: Language;
}

export const OverlayControls: React.FC<OverlayControlsProps> = ({
  isOpen,
  onToggleOpen,
  volume,
  onVolumeChange,
  isMuted,
  onToggleMute,
  isPlaying,
  onTogglePlay,
  onNextTrack,
  onPrevTrack,
  bgMode,
  onBgModeChange,
  uiStyle,
  onUiStyleChange,
  gamepadConnected,
  language = 'fr'
}) => {
  const { t } = useTranslation(language);
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-3 w-[920px] max-w-[95vw]">
      
      {/* Main Control Pill */}
      <div className="flex items-center justify-between w-full px-5 py-2.5 rounded-2xl backdrop-blur-xl bg-black/85 border border-white/15 shadow-2xl text-xs font-mono">
        
        {/* Left: Radio Toggle & Playback */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleOpen}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold uppercase tracking-wider transition-all active:scale-95 ${
              isOpen
                ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                : 'bg-white/10 hover:bg-white/20 text-zinc-200'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>{isOpen ? t.controlsBar.close : t.controlsBar.open}</span>
          </button>

          <button
            onClick={onTogglePlay}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
            title={t.controlsBar.playPauseTooltip}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={onPrevTrack}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-zinc-300 transition-all"
              title={t.controlsBar.prevTooltip}
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onNextTrack}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-zinc-300 transition-all"
              title={t.controlsBar.nextTooltip}
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Center: Style Switcher (GTA 6 Ribbon vs Arc Wheel) */}
        <div className="flex items-center bg-white/10 p-1 rounded-xl">
          <button
            onClick={() => onUiStyleChange('gta6_ribbon')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
              uiStyle === 'gta6_ribbon' ? 'bg-white text-black shadow' : 'text-zinc-400 hover:text-white'
            }`}
            title={t.controlsBar.gta6HudTooltip}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>{t.controlsBar.gta6Hud}</span>
          </button>
          <button
            onClick={() => onUiStyleChange('gta_arc')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
              uiStyle === 'gta_arc' ? 'bg-white text-black shadow' : 'text-zinc-400 hover:text-white'
            }`}
            title={t.controlsBar.arcWheelTooltip}
          >
            <CircleDot className="w-3.5 h-3.5" />
            <span>{t.controlsBar.arcWheel}</span>
          </button>
        </div>

        {/* Volume Slider */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
          <button
            onClick={onToggleMute}
            className="text-zinc-300 hover:text-white transition-colors"
            title={t.controlsBar.muteTooltip}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-white" />
            )}
          </button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-20 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-white"
          />
        </div>

        {/* Right: Background & Gamepad */}
        <div className="flex items-center gap-2">
          {/* Background Switcher */}
          <div className="flex items-center bg-white/10 p-0.5 rounded-xl">
            <button
              onClick={() => onBgModeChange('gameplay')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                bgMode === 'gameplay' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {t.controlsBar.game}
            </button>
            <button
              onClick={() => onBgModeChange('neon')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                bgMode === 'neon' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {t.controlsBar.vc80s}
            </button>
            <button
              onClick={() => onBgModeChange('transparent')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                bgMode === 'transparent' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {t.controlsBar.overlay}
            </button>
          </div>

          {/* Gamepad */}
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-xl border ${
              gamepadConnected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-white/5 border-white/10 text-zinc-500'
            }`}
            title={gamepadConnected ? t.controlsBar.gamepadActive : t.controlsBar.keyboardActive}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
          </div>
        </div>

      </div>

    </div>
  );
};
