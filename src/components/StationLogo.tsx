import React from 'react';
import { RadioStation, OnDemandAlbum } from '../types/radio';
import { STATION_LOGOS } from '../data/stations';

interface StationLogoProps {
  station?: RadioStation;
  album?: OnDemandAlbum;
  className?: string;
  size?: number;
}

export const StationLogo: React.FC<StationLogoProps> = ({
  station,
  album,
  className = '',
  size = 96
}) => {
  // If album cover is provided for ON DEMAND mode
  if (album) {
    switch (album.coverType) {
      case 'mixtape':
        return (
          <div
            className={`relative overflow-hidden flex flex-col items-center justify-center select-none w-full h-full ${className}`}
            style={{
              background: 'linear-gradient(135deg, #FF2A85 0%, #7C4DFF 60%, #00E5FF 100%)'
            }}
          >
            {/* Cassette Tape icon */}
            <div className="w-16 h-10 rounded-[4px] bg-[#111] border border-white/40 flex items-center justify-around px-2 shadow-md">
              <div className="w-4 h-4 rounded-full border border-white/60 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>
              <div className="w-6 h-3 bg-white/20 rounded-[2px]" />
              <div className="w-4 h-4 rounded-full border border-white/60 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>
            </div>
            <span className="text-white font-gta6 font-black text-[12px] tracking-wider mt-1.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
              MIXTAPE '86
            </span>
          </div>
        );

      case 'pop':
        return (
          <div
            className={`relative overflow-hidden flex flex-col items-center justify-center select-none w-full h-full bg-[#E91E63] ${className}`}
            style={{
              background: 'linear-gradient(145deg, #FF4081 0%, #C2185B 100%)'
            }}
          >
            <span className="text-white font-gta6 font-black text-[18px] tracking-tight drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)]">
              POP
            </span>
            <span className="text-[#FFEB3B] font-gta6 font-bold text-[10px] tracking-widest mt-0.5">
              SELECTION
            </span>
          </div>
        );

      case 'rock':
        return (
          <div
            className={`relative overflow-hidden flex flex-col items-center justify-center select-none w-full h-full bg-[#B71C1C] ${className}`}
            style={{
              background: 'linear-gradient(145deg, #D32F2F 0%, #7F0000 100%)'
            }}
          >
            <span className="text-white font-gta6 font-black text-[19px] tracking-tight drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)]">
              METAL
            </span>
            <span className="text-[#FFC107] font-gta6 font-bold text-[10px] tracking-widest mt-0.5">
              VAULT
            </span>
          </div>
        );

      case 'synth':
        return (
          <div
            className={`relative overflow-hidden flex flex-col items-center justify-center select-none w-full h-full bg-[#0D47A1] ${className}`}
            style={{
              background: 'linear-gradient(145deg, #00B0FF 0%, #002171 100%)'
            }}
          >
            <span className="text-[#00E5FF] font-gta6 font-black text-[18px] tracking-widest drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)]">
              SYNTH
            </span>
            <span className="text-white font-gta6 font-bold text-[10px] tracking-widest mt-0.5">
              TAPES
            </span>
          </div>
        );

      case 'ballads':
        return (
          <div
            className={`relative overflow-hidden flex flex-col items-center justify-center select-none w-full h-full bg-[#6A1B9A] ${className}`}
            style={{
              background: 'linear-gradient(145deg, #AB47BC 0%, #4A148C 100%)'
            }}
          >
            <span className="text-white font-gta6 font-black text-[17px] tracking-wide drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)]">
              BALLADS
            </span>
            <span className="text-[#FF80AB] font-gta6 font-bold text-[10px] tracking-widest mt-0.5">
              84-86
            </span>
          </div>
        );

      case 'disco':
        return (
          <div
            className={`relative overflow-hidden flex flex-col items-center justify-center select-none w-full h-full bg-[#E65100] ${className}`}
            style={{
              background: 'linear-gradient(145deg, #FF9800 0%, #BF360C 100%)'
            }}
          >
            <span className="text-white font-gta6 font-black text-[18px] tracking-widest drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)]">
              DISCO
            </span>
            <span className="text-[#FFE082] font-gta6 font-bold text-[10px] tracking-widest mt-0.5">
              GROOVES
            </span>
          </div>
        );

      case 'custom':
      default:
        return (
          <div
            className={`relative overflow-hidden flex flex-col items-center justify-center select-none w-full h-full bg-[#263238] border border-white/20 ${className}`}
          >
            <span className="text-white font-gta6 font-black text-[16px] tracking-wider">
              CUSTOM
            </span>
            <span className="text-zinc-400 font-gta6 font-bold text-[10px] tracking-widest mt-0.5">
              USER MP3
            </span>
          </div>
        );
    }
  }

  // Live Radio Station Logos
  if (!station) return null;
  const officialArt = STATION_LOGOS[station.id];
  if (officialArt) {
    return (
      <div
        className={`relative overflow-hidden flex items-center justify-center select-none w-full h-full p-2.5 ${className}`}
        style={{
          background: station.badgeBg || 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.5) 100%)'
        }}
      >
        <img
          src={officialArt}
          alt={station.name}
          className="w-full h-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)]"
        loading="eager"
        decoding="async"
        />
      </div>
    );
  }


  switch (station.logoType) {
    case 'flash':
      return (
        <div
          className={`relative overflow-hidden flex flex-col items-center justify-center select-none w-full h-full ${className}`}
          style={{
            backgroundColor: '#D81B60',
            backgroundImage: 'linear-gradient(145deg, #E91E63 0%, #C2185B 100%)'
          }}
        >
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-30">
            <polygon points="58,8 24,54 48,54 42,92 76,46 52,46" fill="#FFEB3B" />
          </svg>
          <div className="relative z-10 flex flex-col items-center leading-none text-center">
            <span className="text-white font-black italic tracking-tighter text-[18px] drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)]">
              FLASH
            </span>
            <div className="flex items-center gap-1 mt-1 bg-black/40 px-1.5 py-0.5 rounded-[2px]">
              <span className="text-[#FFEB3B] font-black text-[11px] tracking-widest">
                102.9 FM
              </span>
            </div>
          </div>
        </div>
      );

    case 'wave':
      return (
        <div
          className={`relative overflow-hidden flex flex-col items-center justify-center select-none w-full h-full ${className}`}
          style={{
            backgroundColor: '#0F2027',
            backgroundImage: 'linear-gradient(145deg, #203A43 0%, #0F2027 100%)'
          }}
        >
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-40">
            <path d="M10 50 Q30 20 50 50 T90 50" fill="none" stroke="#00E5FF" strokeWidth="10" />
            <path d="M10 65 Q30 35 50 65 T90 65" fill="none" stroke="#7C4DFF" strokeWidth="6" />
          </svg>
          <div className="relative z-10 flex flex-col items-center leading-none text-center">
            <span className="text-[#00E5FF] font-black tracking-widest text-[16px] drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]">
              WAVE
            </span>
            <span className="text-white font-bold text-[12px] tracking-widest mt-1">
              103
            </span>
          </div>
        </div>
      );

    case 'vrock':
      return (
        <div
          className={`relative overflow-hidden flex flex-col items-center justify-center select-none w-full h-full ${className}`}
          style={{
            backgroundColor: '#7A1C1C',
            backgroundImage: 'linear-gradient(145deg, #8B2525 0%, #5E1313 100%)'
          }}
        >
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-40">
            <polygon points="50,12 88,86 12,86" fill="none" stroke="#FFA000" strokeWidth="4" />
            <circle cx="50" cy="46" r="14" fill="#FFA000" />
          </svg>
          <div className="relative z-10 flex flex-col items-center leading-none text-center">
            <span className="text-zinc-300 font-extrabold text-[9px] tracking-widest">
              99.5
            </span>
            <span className="text-white font-black text-[20px] tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] mt-0.5">
              ROCK
            </span>
          </div>
        </div>
      );

    case 'emotion':
      return (
        <div
          className={`relative overflow-hidden flex flex-col items-center justify-center select-none w-full h-full ${className}`}
          style={{
            backgroundColor: '#5C1D5E',
            backgroundImage: 'linear-gradient(145deg, #7B1FA2 0%, #4A148C 100%)'
          }}
        >
          <div className="relative z-10 flex flex-col items-center leading-none text-center px-1">
            <span className="text-white font-black tracking-wider text-[13px] drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]">
              EMOTION
            </span>
            <span className="text-[#FF80AB] font-bold text-[11px] tracking-widest mt-1">
              98.3
            </span>
          </div>
        </div>
      );

    case 'fever':
      return (
        <div
          className={`relative overflow-hidden flex flex-col items-center justify-center select-none w-full h-full ${className}`}
          style={{
            backgroundColor: '#C86D00',
            backgroundImage: 'linear-gradient(145deg, #E65100 0%, #BF360C 100%)'
          }}
        >
          <div className="relative z-10 flex flex-col items-center leading-none text-center">
            <span className="text-white font-black tracking-widest text-[16px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
              FEVER
            </span>
            <span className="text-[#FFE082] font-black text-[12px] tracking-wider mt-1">
              105
            </span>
          </div>
        </div>
      );

    case 'wildstyle':
      return (
        <div
          className={`relative overflow-hidden flex flex-col items-center justify-center select-none w-full h-full ${className}`}
          style={{
            backgroundColor: '#1B4D3E',
            backgroundImage: 'linear-gradient(145deg, #00695C 0%, #004D40 100%)'
          }}
        >
          <div className="relative z-10 flex flex-col items-center leading-none text-center px-1">
            <span className="text-[#64FFDA] font-black tracking-tight text-[12px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
              WILDSTYLE
            </span>
            <span className="text-white font-bold text-[9px] tracking-widest mt-0.5">
              PIRATE RADIO
            </span>
          </div>
        </div>
      );

    case 'espantoso':
      return (
        <div
          className={`relative overflow-hidden flex flex-col items-center justify-center select-none w-full h-full ${className}`}
          style={{
            backgroundColor: '#8D3A1B',
            backgroundImage: 'linear-gradient(145deg, #BF360C 0%, #5D1A06 100%)'
          }}
        >
          <div className="relative z-10 flex flex-col items-center leading-none text-center px-1">
            <span className="text-zinc-300 font-bold text-[8px] tracking-widest">RADIO</span>
            <span className="text-[#FFE082] font-black tracking-tight text-[11px] drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)] mt-0.5">
              ESPANTOSO
            </span>
          </div>
        </div>
      );

    case 'kchat':
      return (
        <div
          className={`relative overflow-hidden flex flex-col items-center justify-center select-none w-full h-full ${className}`}
          style={{
            backgroundColor: '#283593',
            backgroundImage: 'linear-gradient(145deg, #303F9F 0%, #1A237E 100%)'
          }}
        >
          <div className="relative z-10 flex flex-col items-center leading-none text-center">
            <span className="text-[#80D8FF] font-black tracking-widest text-[14px] drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)]">
              K-CHAT
            </span>
            <span className="text-white font-bold text-[10px] tracking-wider mt-1">
              107.7
            </span>
          </div>
        </div>
      );

    case 'off':
    default:
      return (
        <div
          className={`relative overflow-hidden flex flex-col items-center justify-center select-none bg-[#1C1F26] w-full h-full ${className}`}
        >
          <span className="text-zinc-400 font-black text-[16px] tracking-widest">
            OFF
          </span>
        </div>
      );
  }
};
