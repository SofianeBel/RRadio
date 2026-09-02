export interface Track {
  title: string;
  artist: string;
  duration: number; // in seconds
}

export interface RadioStation {
  id: string;
  name: string;
  frequency: string;
  genre: string;
  dj: string;
  description: string;
  primaryColor: string;
  accentColor: string;
  badgeBg: string;
  logoType: 'flash' | 'wave' | 'vrock' | 'emotion' | 'fever' | 'wildstyle' | 'espantoso' | 'kchat' | 'vcpr' | 'off';
  tracks: Track[];
  logoUrl?: string;
  audioUrl?: string;
}

export interface OnDemandAlbum {
  id: string;
  title: string;
  artistOrCurator: string;
  genre: string;
  coverType: 'mixtape' | 'pop' | 'rock' | 'synth' | 'ballads' | 'disco' | 'electro' | 'custom';
  primaryColor: string;
  tracks: Track[];
}

export type PlaybackMode = 'radio' | 'ondemand';

export interface RadioState {
  isOpen: boolean;
  mode: PlaybackMode;
  activeStationIndex: number;
  activeOnDemandIndex: number;
  hoveredIndex: number | null;
  volume: number;
  isMuted: boolean;
  isPlaying: boolean;
  trackProgress: number; // in seconds
  isTuning: boolean;
}
