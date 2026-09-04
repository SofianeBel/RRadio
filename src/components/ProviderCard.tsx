import React from 'react';
import { OnDemandProvider, OnDemandPlaylist, OnDemandTrack } from '../types/ondemand';
import { STATIONS } from '../data/stations';
import { StationLogo } from './StationLogo';
import { Language } from '../types/settings';
import { useTranslation } from '../i18n/useTranslation';
import { Lock, Music2, Folder, Disc, Check, Radio } from 'lucide-react';

interface ProviderCardProps {
  provider?: OnDemandProvider;
  playlist?: OnDemandPlaylist;
  track?: OnDemandTrack;
  isPlayed?: boolean;
  size?: number;
  className?: string;
  language?: Language;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({
  provider,
  playlist,
  track,
  isPlayed = false,
  size = 100,
  className = '',
  language = 'fr'
}) => {
  const { t } = useTranslation(language);
  // 1. Service Provider Card (Level 1)
  if (provider) {
    switch (provider.id) {
      case 'vice_city_radio':
        return (
          <div
            className={`relative overflow-hidden flex flex-col items-center justify-center select-none w-full h-full text-white ${className}`}
            style={{
              background: 'linear-gradient(135deg, #FF2A85 0%, #7C4DFF 50%, #00E5FF 100%)'
            }}
          >
            {/* Vice City Neon Radio Icon */}
            <div className="flex items-center justify-center w-11 h-11 rounded-full bg-black/40 border border-white/40 mb-0.5 shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
              <Radio className="w-6 h-6 text-[#FFD600]" />
            </div>
            <span className="font-gta6 font-black text-[13px] tracking-wide text-white uppercase drop-shadow leading-tight text-center">
              {t.providers.stationsGta}
            </span>
            <span className="text-[9px] font-mono text-[#00E5FF] font-bold tracking-widest uppercase mt-0.5">
              {t.providers.viceCity}
            </span>
          </div>
        );

      case 'spotify':
        return (
          <div
            className={`relative overflow-hidden flex flex-col items-center justify-center select-none w-full h-full bg-[#1DB954] text-black ${className}`}
            style={{
              background: 'linear-gradient(135deg, #1DB954 0%, #0F3820 100%)'
            }}
          >
            {/* Spotify Audio Waves SVG */}
            <svg viewBox="0 0 100 100" className="w-12 h-12 text-white">
              <path
                d="M50 15 C30 15 15 30 15 50 C15 70 30 85 50 85 C70 85 85 70 85 50 C85 30 70 15 50 15 Z"
                fill="#121212"
              />
              <path d="M30 42 C44 38 60 40 70 46" fill="none" stroke="#1DB954" strokeWidth="5" strokeLinecap="round" />
              <path d="M33 52 C45 49 57 51 66 56" fill="none" stroke="#1DB954" strokeWidth="4" strokeLinecap="round" />
              <path d="M36 62 C45 59 55 61 63 65" fill="none" stroke="#1DB954" strokeWidth="3.5" strokeLinecap="round" />
            </svg>
            <span className="font-gta6 font-black text-[15px] tracking-wider text-white uppercase mt-1 drop-shadow">
              SPOTIFY
            </span>
          </div>
        );

      case 'youtube_music':
        return (
          <div
            className={`relative overflow-hidden flex flex-col items-center justify-center select-none w-full h-full text-white ${className}`}
            style={{
              background: 'linear-gradient(135deg, #FF0000 0%, #3B0000 100%)'
            }}
          >
            {/* YouTube Music Play Circle */}
            <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center bg-red-600/40">
              <div className="w-0 h-0 border-y-[7px] border-y-transparent border-l-[12px] border-l-white ml-0.5" />
            </div>
            <span className="font-gta6 font-black text-[13px] tracking-wide text-white uppercase mt-1 drop-shadow text-center leading-tight">
              YT MUSIC
            </span>
          </div>
        );

      case 'deezer':
        return (
          <div
            className={`relative overflow-hidden flex flex-col items-center justify-center select-none w-full h-full text-white ${className}`}
            style={{
              background: 'linear-gradient(135deg, #A238FF 0%, #FF5436 100%)'
            }}
          >
            {/* Equalizer bars icon */}
            <div className="flex items-end gap-1 h-8 mb-1">
              <div className="w-2 h-4 bg-white rounded-t-sm" />
              <div className="w-2 h-7 bg-white rounded-t-sm" />
              <div className="w-2 h-5 bg-white rounded-t-sm" />
              <div className="w-2 h-8 bg-white rounded-t-sm" />
            </div>
            <span className="font-gta6 font-black text-[14px] tracking-wider text-white uppercase drop-shadow">
              DEEZER
            </span>
          </div>
        );

      case 'apple_music':
        return (
          <div
            className={`relative overflow-hidden flex flex-col items-center justify-center select-none w-full h-full text-white filter grayscale-[40%] ${className}`}
            style={{
              background: 'linear-gradient(135deg, #3A202A 0%, #1A0D14 100%)'
            }}
          >
            {/* Locked Coming Soon Overlay */}
            <div className="flex flex-col items-center opacity-60">
              <Lock className="w-7 h-7 text-red-400 mb-1" />
              <span className="font-gta6 font-black text-[13px] tracking-wide text-zinc-300 uppercase leading-none">
                APPLE MUSIC
              </span>
            </div>

            {/* Diagonal COMING SOON Banner */}
            <div className="absolute inset-x-0 bottom-2 bg-red-600/90 text-white font-mono font-bold text-[9px] py-0.5 text-center tracking-widest uppercase">
              COMING SOON
            </div>
          </div>
        );

      case 'local':
      default:
        return (
          <div
            className={`relative overflow-hidden flex flex-col items-center justify-center select-none w-full h-full text-white ${className}`}
            style={{
              background: 'linear-gradient(135deg, #455A64 0%, #263238 100%)'
            }}
          >
            <Folder className="w-10 h-10 text-cyan-400 mb-1" />
            <span className="font-gta6 font-black text-[13px] tracking-wider text-white uppercase">
              {t.providers.pcFiles}
            </span>
          </div>
        );
    }
  }

  // 2. Playlist Card (Level 2)
  if (playlist) {
    // If playlist is a Vice City Station, render its authentic StationLogo!
    if (playlist.stationId) {
      const station = STATIONS.find(s => s.id === playlist.stationId);
      if (station) {
        return <StationLogo station={station} size={size} className={className} />;
      }
    }

    return (
      <div
        className={`relative overflow-hidden flex flex-col items-center justify-between p-2 select-none w-full h-full text-white ${className}`}
        style={{
          background: playlist.coverColor,
          backgroundImage: playlist.coverUrl ? `url(${playlist.coverUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {playlist.coverUrl && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30 pointer-events-none" />
        )}
        <div className="relative z-10 flex items-center justify-between w-full">
          <span className="px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-mono font-bold text-white/90 border border-white/10">
            {playlist.badgeText || 'PLAYLIST'}
          </span>
          <Disc className="w-4 h-4 text-white/70 animate-spin-slow" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center leading-none my-auto">
          <span className="font-gta6 font-black text-[14px] tracking-wide text-white uppercase drop-shadow line-clamp-2">
            {playlist.title}
          </span>
        </div>

        <div className="relative z-10 w-full text-right">
          <span className="text-[10px] font-mono text-white/80 bg-black/50 px-1.5 py-0.5 rounded">
            {playlist.tracks && playlist.tracks.length > 0
              ? `${playlist.tracks.length} ${t.providers.tracksCount}`
              : t.providers.syncing}
          </span>
        </div>
      </div>
    );
  }

  // 3. Track Card in Queue Ribbon (Level 3)
  if (track) {
    return (
      <div
        className={`relative overflow-hidden flex flex-col items-center justify-between p-2 select-none w-full h-full text-white ${className}`}
        style={{
          backgroundColor: track.coverColor,
          backgroundImage: track.coverUrl
            ? `url(${track.coverUrl})`
            : `linear-gradient(145deg, ${track.coverColor} 0%, #111111 100%)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {track.coverUrl && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30 pointer-events-none" />
        )}
        {/* Played History indicator badge */}
        <div className="relative z-10 flex items-center justify-between w-full">
          {isPlayed ? (
            <div className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-black/70 text-emerald-400 text-[9px] font-mono font-bold border border-emerald-500/30">
              <Check className="w-3 h-3 stroke-[3]" />
              <span>{t.providers.played}</span>
            </div>
          ) : (
            <div className="p-1 rounded-full bg-black/50">
              <Music2 className="w-3 h-3 text-white/80" />
            </div>
          )}
        </div>

        <div className="relative z-10 flex flex-col items-center text-center leading-tight my-auto px-1">
          <span className="font-gta6 font-black text-[14px] tracking-wide text-white uppercase drop-shadow line-clamp-2">
            {track.title}
          </span>
          <span className="font-gta6 font-medium text-[10px] text-zinc-300 uppercase tracking-wider mt-0.5 line-clamp-1">
            {track.artist}
          </span>
        </div>

        <div className="relative z-10 w-full text-right font-mono text-[10px] text-white/80">
          <span className="bg-black/50 px-1.5 py-0.5 rounded">
            {Math.floor(track.duration / 60)}:{String(track.duration % 60).padStart(2, '0')}
          </span>
        </div>
      </div>
    );
  }

  return null;
};
