import { OnDemandProvider, OnDemandPlaylist, OnDemandTrack } from '../types/ondemand';
import { STATIONS } from './stations';
import radioManifest from './radioManifest.json';
import { YTM_CURATED_MIXES } from '../services/youtubeMusic';
import { Language } from '../types/settings';
import { translations } from '../i18n/translations';

const MANIFEST_STATION_KEY_MAP: Record<string, string> = {
  flash_fm: 'flash_fm',
  wave_103: 'wave_103',
  v_rock: 'v_rock',
  emotion_983: 'emotion_983',
  fever_105: 'fever_105',
  wildstyle: 'wildstyle',
  radio_espantoso: 'espantoso'
};

const typedManifest = radioManifest as Record<string, Array<{
  filename: string;
  title: string;
  artist: string;
  duration: number;
  url: string;
}>>;

export const getLocalizedProviders = (lang: Language = 'fr'): OnDemandProvider[] => {
  const t = translations[lang] || translations.fr;
  return [
    {
      id: 'vice_city_radio',
      name: t.providerData.viceCityRadio.name,
      badge: t.providerData.viceCityRadio.badge,
      tagline: t.providerData.viceCityRadio.tagline,
      primaryColor: '#FF2A85',
      accentColor: '#00E5FF',
      playlistsCount: STATIONS.length
    },
    {
      id: 'spotify',
      name: t.providerData.spotify.name,
      badge: t.providerData.spotify.badge,
      tagline: t.providerData.spotify.tagline,
      primaryColor: '#1DB954',
      accentColor: '#1ED760',
      isComingSoon: true,
      comingSoonNote: t.providerData.spotify.comingSoonNote,
      playlistsCount: 0
    },
    {
      id: 'youtube_music',
      name: t.providerData.youtubeMusic.name,
      badge: t.providerData.youtubeMusic.badge,
      tagline: t.providerData.youtubeMusic.tagline,
      primaryColor: '#FF0000',
      accentColor: '#FF3333',
      playlistsCount: YTM_CURATED_MIXES.length
    },
    {
      id: 'deezer',
      name: t.providerData.deezer.name,
      badge: t.providerData.deezer.badge,
      tagline: t.providerData.deezer.tagline,
      primaryColor: '#A238FF',
      accentColor: '#FF5436',
      isComingSoon: true,
      comingSoonNote: t.providerData.deezer.comingSoonNote,
      playlistsCount: 0
    },
    {
      id: 'apple_music',
      name: t.providerData.appleMusic.name,
      badge: t.providerData.appleMusic.badge,
      tagline: t.providerData.appleMusic.tagline,
      primaryColor: '#FA243C',
      accentColor: '#FB5C74',
      isComingSoon: true,
      comingSoonNote: t.providerData.appleMusic.comingSoonNote,
      playlistsCount: 0
    },
    {
      id: 'local',
      name: t.providerData.local.name,
      badge: t.providerData.local.badge,
      tagline: t.providerData.local.tagline,
      primaryColor: '#455A64',
      accentColor: '#78909C',
      isComingSoon: true,
      comingSoonNote: t.providerData.local.comingSoonNote,
      playlistsCount: 0
    }
  ];
};

export const PROVIDERS: OnDemandProvider[] = getLocalizedProviders('fr');

// Helper to find a real streaming URL from the Vice City manifest by title keyword
function findRealTrackUrl(titleKeyword: string, fallbackUrl?: string): { url: string; duration: number } | null {
  const normKey = titleKeyword.toLowerCase();
  for (const stationKey in typedManifest) {
    const list = typedManifest[stationKey];
    for (const t of list) {
      if (t.title.toLowerCase().includes(normKey) || normKey.includes(t.title.toLowerCase())) {
        return { url: t.url, duration: t.duration };
      }
    }
  }
  return fallbackUrl ? { url: fallbackUrl, duration: 240 } : null;
}

export const PLAYLISTS: Record<string, OnDemandPlaylist[]> = {
  // 1. STATIONS VICE CITY: Authentic tracklists directly from official Vice City radio manifest!
  vice_city_radio: STATIONS.map(station => {
    const mKey = MANIFEST_STATION_KEY_MAP[station.id] || station.id;
    const manifestTracks = typedManifest[mKey] || [];

    const tracks: OnDemandTrack[] = manifestTracks.length > 0
      ? manifestTracks.map((mTrack, i) => ({
          id: `${station.id}_tr_${i}`,
          title: mTrack.title,
          artist: mTrack.artist,
          duration: mTrack.duration,
          coverColor: station.primaryColor,
          audioUrl: mTrack.url
        }))
      : station.tracks.map((track, i) => ({
          id: `${station.id}_fallback_${i}`,
          title: track.title,
          artist: track.artist,
          duration: track.duration,
          coverColor: station.primaryColor,
          audioUrl: ''
        }));

    return {
      id: `vc_${station.id}`,
      providerId: 'vice_city_radio',
      title: station.name,
      curator: station.dj ? `DJ ${station.dj}` : 'Vice City Radio',
      genre: station.genre,
      coverColor: station.primaryColor,
      badgeText: station.frequency,
      stationId: station.id,
      tracks
    };
  }),

  // 2. SPOTIFY Playlists (mapped with authentic streaming MP3s)
  spotify: [
    {
      id: 'sp_vc80s',
      providerId: 'spotify',
      title: 'Vice City 80s Rewind',
      curator: 'Spotify Editorial',
      genre: '80s Pop & Synthpop',
      coverColor: '#E91E63',
      badgeText: 'SPOTIFY',
      tracks: [
        {
          id: 'sp_tr1',
          title: 'Out of Touch',
          artist: 'Daryl Hall & John Oates',
          duration: 248,
          coverColor: '#FF2A85',
          audioUrl: findRealTrackUrl('Out of Touch')?.url || ''
        },
        {
          id: 'sp_tr2',
          title: 'Self Control',
          artist: 'Laura Branigan',
          duration: 247,
          coverColor: '#9C27B0',
          audioUrl: findRealTrackUrl('Self Control')?.url || ''
        },
        {
          id: 'sp_tr3',
          title: 'Billie Jean',
          artist: 'Michael Jackson',
          duration: 294,
          coverColor: '#00E5FF',
          audioUrl: findRealTrackUrl('Billie Jean')?.url || ''
        },
        {
          id: 'sp_tr4',
          title: 'Atomic',
          artist: 'Blondie',
          duration: 280,
          coverColor: '#E040FB',
          audioUrl: findRealTrackUrl('Atomic')?.url || ''
        },
        {
          id: 'sp_tr5',
          title: 'Blue Monday',
          artist: 'New Order',
          duration: 449,
          coverColor: '#3D5AFE',
          audioUrl: findRealTrackUrl('Blue Monday')?.url || ''
        },
        {
          id: 'sp_tr6',
          title: 'Cars',
          artist: 'Gary Numan',
          duration: 236,
          coverColor: '#00E676',
          audioUrl: findRealTrackUrl('Cars')?.url || ''
        }
      ]
    },
    {
      id: 'sp_liked',
      providerId: 'spotify',
      title: 'Titres Likés',
      curator: 'Votre Bibliothèque',
      genre: 'Favoris personnels',
      coverColor: '#1DB954',
      badgeText: 'LIKED',
      tracks: [
        {
          id: 'sp_lk1',
          title: "Crockett's Theme",
          artist: 'Jan Hammer',
          duration: 212,
          coverColor: '#00E5FF',
          audioUrl: findRealTrackUrl("Crockett's Theme")?.url || ''
        },
        {
          id: 'sp_lk2',
          title: "You've Got Another Thing Comin'",
          artist: 'Judas Priest',
          duration: 304,
          coverColor: '#FF3B30',
          audioUrl: findRealTrackUrl("Another Thing Comin'")?.url || ''
        },
        {
          id: 'sp_lk3',
          title: 'Africa',
          artist: 'Toto',
          duration: 295,
          coverColor: '#FF9500',
          audioUrl: findRealTrackUrl('Africa')?.url || ''
        },
        {
          id: 'sp_lk4',
          title: 'The Message',
          artist: 'Grandmaster Flash',
          duration: 431,
          coverColor: '#FF2D55',
          audioUrl: findRealTrackUrl('The Message')?.url || ''
        },
        {
          id: 'sp_lk5',
          title: 'Two Tribes',
          artist: 'Frankie Goes to Hollywood',
          duration: 236,
          coverColor: '#5856D6',
          audioUrl: findRealTrackUrl('Two Tribes')?.url || ''
        }
      ]
    },
    {
      id: 'sp_synth',
      providerId: 'spotify',
      title: 'Synthwave & Retrowave',
      curator: 'Spotify Mix',
      genre: 'Neon Electronic',
      coverColor: '#9C27B0',
      badgeText: 'NEON',
      tracks: [
        {
          id: 'sp_sy1',
          title: 'Blue Monday (Synth Cut)',
          artist: 'New Order',
          duration: 449,
          coverColor: '#D500F9',
          audioUrl: findRealTrackUrl('Blue Monday')?.url || ''
        },
        {
          id: 'sp_sy2',
          title: 'Atomic (Night Version)',
          artist: 'Blondie',
          duration: 280,
          coverColor: '#651FFF',
          audioUrl: findRealTrackUrl('Atomic')?.url || ''
        },
        {
          id: 'sp_sy3',
          title: 'Cars',
          artist: 'Gary Numan',
          duration: 236,
          coverColor: '#00B0FF',
          audioUrl: findRealTrackUrl('Cars')?.url || ''
        }
      ]
    },
    {
      id: 'sp_metal',
      providerId: 'spotify',
      title: 'Hard Rock Classics',
      curator: 'Spotify Editorial',
      genre: 'Heavy Metal & Hard Rock',
      coverColor: '#D32F2F',
      badgeText: 'ROCK',
      tracks: [
        {
          id: 'sp_mt1',
          title: 'Peace Sells',
          artist: 'Megadeth',
          duration: 241,
          coverColor: '#B71C1C',
          audioUrl: findRealTrackUrl('Peace Sells')?.url || ''
        },
        {
          id: 'sp_mt2',
          title: 'Bark at the Moon',
          artist: 'Ozzy Osbourne',
          duration: 255,
          coverColor: '#C2185B',
          audioUrl: findRealTrackUrl('Bark at the Moon')?.url || ''
        },
        {
          id: 'sp_mt3',
          title: 'I Wanna Rock',
          artist: 'Twisted Sister',
          duration: 182,
          coverColor: '#880E4F',
          audioUrl: findRealTrackUrl('I Wanna Rock')?.url || ''
        }
      ]
    }
  ],

  // 3. YOUTUBE MUSIC Playlists (Supermixes & Thematic Mixes)
  youtube_music: YTM_CURATED_MIXES,

  // 4. DEEZER Playlists
  deezer: [
    {
      id: 'dz_flow',
      providerId: 'deezer',
      title: 'Flow Personnel',
      curator: 'Deezer Flow AI',
      genre: 'Mix infini personnalisé',
      coverColor: '#A238FF',
      badgeText: 'FLOW',
      tracks: [
        {
          id: 'dz_fl1',
          title: 'Gold',
          artist: 'Spandau Ballet',
          duration: 231,
          coverColor: '#7C4DFF',
          audioUrl: findRealTrackUrl('Gold')?.url || ''
        },
        {
          id: 'dz_fl2',
          title: 'Never Say Never',
          artist: 'Romeo Void',
          duration: 354,
          coverColor: '#6200EA',
          audioUrl: findRealTrackUrl('Never Say Never')?.url || ''
        }
      ]
    },
    {
      id: 'dz_80s',
      providerId: 'deezer',
      title: 'Top 80s Deezer Classics',
      curator: 'Deezer Charts',
      genre: 'Pop / Rock / New Wave',
      coverColor: '#FF5436',
      badgeText: 'TOP 50',
      tracks: [
        {
          id: 'dz_cl1',
          title: 'Billie Jean',
          artist: 'Michael Jackson',
          duration: 294,
          coverColor: '#FF3D00',
          audioUrl: findRealTrackUrl('Billie Jean')?.url || ''
        },
        {
          id: 'dz_cl2',
          title: 'Two Tribes',
          artist: 'Frankie Goes to Hollywood',
          duration: 236,
          coverColor: '#BF360C',
          audioUrl: findRealTrackUrl('Two Tribes')?.url || ''
        }
      ]
    },
    {
      id: 'dz_electro',
      providerId: 'deezer',
      title: 'Old School Electro Hip-Hop',
      curator: 'Deezer Curators',
      genre: 'Electro Breakbeat 1983',
      coverColor: '#00E5FF',
      badgeText: 'ELECTRO',
      tracks: [
        {
          id: 'dz_eh1',
          title: 'Rockit',
          artist: 'Herbie Hancock',
          duration: 325,
          coverColor: '#00B0FF',
          audioUrl: findRealTrackUrl('Rockit')?.url || ''
        },
        {
          id: 'dz_eh2',
          title: 'The Message',
          artist: 'Grandmaster Flash',
          duration: 431,
          coverColor: '#01579B',
          audioUrl: findRealTrackUrl('The Message')?.url || ''
        }
      ]
    }
  ],

  // 5. LOCAL FILES Playlists
  local: [
    {
      id: 'loc_custom',
      providerId: 'local',
      title: 'Dossier Musique PC',
      curator: 'Dossier choisi dans les reglages',
      genre: 'Fichiers locaux MP3',
      coverColor: '#37474F',
      badgeText: 'PC',
      tracks: [
        {
          id: 'loc_tr1',
          title: "Crockett's Theme",
          artist: 'Jan Hammer',
          duration: 212,
          coverColor: '#E91E63',
          audioUrl: findRealTrackUrl("Crockett's Theme")?.url || ''
        },
        {
          id: 'loc_tr2',
          title: 'Billie Jean',
          artist: 'Michael Jackson',
          duration: 294,
          coverColor: '#00BCD4',
          audioUrl: findRealTrackUrl('Billie Jean')?.url || ''
        }
      ]
    },
    {
      id: 'loc_tape',
      providerId: 'local',
      title: 'Cassette Personnalisée',
      curator: 'User Cassette #1',
      genre: 'Compilation Personnelle',
      coverColor: '#263238',
      badgeText: 'TAPE',
      tracks: [
        {
          id: 'loc_c1',
          title: "You've Got Another Thing Comin'",
          artist: 'Judas Priest',
          duration: 304,
          coverColor: '#9C27B0',
          audioUrl: findRealTrackUrl("Another Thing Comin'")?.url || ''
        }
      ]
    }
  ]
};
