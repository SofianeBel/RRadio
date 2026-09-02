import React from 'react';
import { Volume2, VolumeX, SkipForward, SkipBack, Play, Pause, Gamepad2, Radio, LayoutGrid, CircleDot } from 'lucide-react';

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
  gamepadConnected
}) => {
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
            <span>{isOpen ? 'FERMER [Q]' : 'OUVRIR RADIO [Q]'}</span>
          </button>

          <button
            onClick={onTogglePlay}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
            title="Lecture / Pause (Espace)"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={onPrevTrack}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-zinc-300 transition-all"
              title="Morceau précédent"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onNextTrack}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-zinc-300 transition-all"
              title="Morceau suivant"
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
            title="Rendu GTA 6 Officiel (Bandeau Cartes Carrées en Haut)"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>GTA 6 HUD</span>
          </button>
          <button
            onClick={() => onUiStyleChange('gta_arc')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
              uiStyle === 'gta_arc' ? 'bg-white text-black shadow' : 'text-zinc-400 hover:text-white'
            }`}
            title="Rendu Roue / Arc Flottant"
          >
            <CircleDot className="w-3.5 h-3.5" />
            <span>ROUE ARC</span>
          </button>
        </div>

        {/* Volume Slider */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
          <button
            onClick={onToggleMute}
            className="text-zinc-300 hover:text-white transition-colors"
            title="Mettre en sourdine (M)"
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
              JEU
            </button>
            <button
              onClick={() => onBgModeChange('neon')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                bgMode === 'neon' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              VC 80s
            </button>
            <button
              onClick={() => onBgModeChange('transparent')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                bgMode === 'transparent' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              OVERLAY
            </button>
          </div>

          {/* Gamepad */}
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-xl border ${
              gamepadConnected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-white/5 border-white/10 text-zinc-500'
            }`}
            title={gamepadConnected ? 'Manette active' : 'Clavier actif'}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
          </div>
        </div>

      </div>

    </div>
  );
};
