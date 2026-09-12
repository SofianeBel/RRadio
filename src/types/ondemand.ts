export type ProviderId = 'vice_city_radio' | 'liberty_city_radio' | 'spotify' | 'youtube_music' | 'deezer' | 'apple_music' | 'local';

export interface OnDemandProvider {
  id: ProviderId;
  name: string;
  badge: string;
  tagline: string;
  primaryColor: string;
  accentColor: string;
  isComingSoon?: boolean;
  comingSoonNote?: string;
  playlistsCount: number;
}

export interface OnDemandTrack {
  id: string;
  title: string;
  artist: string;
  duration: number; // in seconds
  coverColor: string;
  coverUrl?: string;
  audioUrl?: string;
}

export interface OnDemandPlaylist {
  id: string;
  providerId: ProviderId;
  title: string;
  curator: string;
  genre: string;
  coverColor: string;
  coverUrl?: string;
  badgeText?: string;
  stationId?: string; // Links to authentic Vice City station for genuine logo & audio!
  tracks: OnDemandTrack[];
}

export type OnDemandViewLevel = 'providers' | 'playlists' | 'queue';
