import { OnDemandPlaylist, OnDemandTrack } from '../types/ondemand';
import { YouTubeMusicConfig } from '../types/settings';

// Boundary cast: YouTube Data API JSON, shapes per API docs (raw external input)
interface YtListResponse<T> {
  items?: T[];
}

interface YtThumbnails {
  maxres?: { url?: string };
  high?: { url?: string };
  medium?: { url?: string };
  default?: { url?: string };
}
interface YtPlaylistItem {
  id?: string;
  snippet?: {
    title?: string;
    thumbnails?: YtThumbnails;
    videoOwnerChannelTitle?: string;
    channelTitle?: string;
    resourceId?: { videoId?: string };
  };
  contentDetails?: { videoId?: string };
}
interface YtVideoItem {
  id?: string;
  contentDetails?: { duration?: string };
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

// Curated authentic YouTube Music Mixes with real video IDs
export const YTM_CURATED_MIXES: OnDemandPlaylist[] = [
  {
    id: 'ytm_supermix_80s',
    providerId: 'youtube_music',
    title: 'Mon Supermix Années 80',
    curator: 'YouTube Music Mix',
    genre: 'Synthpop, Pop & New Wave',
    coverColor: '#FF0000',
    badgeText: 'YTM MIX',
    tracks: [
      {
        id: 'ytm_tr_out_of_touch',
        title: 'Out of Touch',
        artist: 'Daryl Hall & John Oates',
        duration: 248,
        coverColor: '#FF2A85',
        audioUrl: 'youtube:D00M2KZH1J0'
      },
      {
        id: 'ytm_tr_self_control',
        title: 'Self Control',
        artist: 'Laura Branigan',
        duration: 247,
        coverColor: '#9C27B0',
        audioUrl: 'youtube:RP0_8J7uxhs'
      },
      {
        id: 'ytm_tr_billie_jean',
        title: 'Billie Jean',
        artist: 'Michael Jackson',
        duration: 294,
        coverColor: '#00E5FF',
        audioUrl: 'youtube:Zi_XLOBDo_Y'
      },
      {
        id: 'ytm_tr_blue_monday',
        title: 'Blue Monday',
        artist: 'New Order',
        duration: 449,
        coverColor: '#3D5AFE',
        audioUrl: 'youtube:FYH8DsU2WCk'
      }
    ]
  },
  {
    id: 'ytm_retro_synthwave',
    providerId: 'youtube_music',
    title: 'Mix Synthwave & Retrowave',
    curator: 'YouTube Music',
    genre: 'Neon Cyberpunk / 80s Darksynth',
    coverColor: '#B71C1C',
    badgeText: 'RETRO',
    tracks: [
      {
        id: 'ytm_sy_nightcall',
        title: 'Nightcall',
        artist: 'Kavinsky',
        duration: 259,
        coverColor: '#D500F9',
        audioUrl: 'youtube:MV_3Dpw-BRY'
      },
      {
        id: 'ytm_sy_resonance',
        title: 'Resonance',
        artist: 'HOME',
        duration: 212,
        coverColor: '#00B0FF',
        audioUrl: 'youtube:8GW6sLrK40k'
      },
      {
        id: 'ytm_sy_tech_noir',
        title: 'Tech Noir',
        artist: 'Gunship',
        duration: 297,
        coverColor: '#651FFF',
        audioUrl: 'youtube:cO_etqijSVY'
      }
    ]
  },
  {
    id: 'ytm_rock_classics',
    providerId: 'youtube_music',
    title: 'Mix Hard Rock & Heavy Metal',
    curator: 'YouTube Music',
    genre: 'Classic Rock / 80s Arena',
    coverColor: '#D32F2F',
    badgeText: 'HEAVY',
    tracks: [
      {
        id: 'ytm_rk_peace_sells',
        title: 'Peace Sells',
        artist: 'Megadeth',
        duration: 241,
        coverColor: '#B71C1C',
        audioUrl: 'youtube:LVhJy-CR64Q'
      },
      {
        id: 'ytm_rk_i_wanna_rock',
        title: 'I Wanna Rock',
        artist: 'Twisted Sister',
        duration: 182,
        coverColor: '#880E4F',
        audioUrl: 'youtube:SRwrg0db_zY'
      },
      {
        id: 'ytm_rk_another_thing',
        title: "You've Got Another Thing Comin'",
        artist: 'Judas Priest',
        duration: 304,
        coverColor: '#FF3B30',
        audioUrl: 'youtube:Wcz_kDCBTBk'
      }
    ]
  },
  {
    id: 'ytm_night_drive',
    providerId: 'youtube_music',
    title: 'Ocean Beach Night Drive',
    curator: 'YouTube Music',
    genre: 'Chill Out / Atmospheric Wave',
    coverColor: '#4A148C',
    badgeText: 'CHILL',
    tracks: [
      {
        id: 'ytm_nd_crockett',
        title: "Crockett's Theme",
        artist: 'Jan Hammer',
        duration: 212,
        coverColor: '#00E5FF',
        audioUrl: 'youtube:Lfgf9HatIHI'
      },
      {
        id: 'ytm_nd_waiting',
        title: 'Waiting for a Girl Like You',
        artist: 'Foreigner',
        duration: 289,
        coverColor: '#7C4DFF',
        audioUrl: 'youtube:2dWmKSj5HjI'
      }
    ]
  }
];

// Derive official YouTube thumbnails so covers exist in the wheel HUD and Discord RPC
for (const mix of YTM_CURATED_MIXES) {
  for (const track of mix.tracks) {
    const videoId = track.audioUrl?.replace('youtube:', '');
    if (videoId && !track.coverUrl) {
      track.coverUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    }
  }
}

class YouTubeMusicService {
  /**
   * Generates official Google OAuth2 authorization URL
   */
  public getGoogleAuthUrl(clientId: string, redirectUri: string = 'http://127.0.0.1:45678'): string {
    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const options = {
      redirect_uri: redirectUri,
      client_id: clientId,
      access_type: 'offline',
      response_type: 'code',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/youtube.readonly',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ].join(' ')
    };

    const qs = new URLSearchParams(options);
    return `${rootUrl}?${qs.toString()}`;
  }

  /**
   * True when the stored access token is still usable (expiresAt is Unix seconds from Rust)
   */
  public hasValidToken(config: YouTubeMusicConfig): boolean {
    if (!config.accessToken) return false;
    if (!config.tokenExpiresAt) return true;
    const expiryMs = config.tokenExpiresAt < 1e12 ? config.tokenExpiresAt * 1000 : config.tokenExpiresAt;
    return Date.now() < expiryMs - 60_000;
  }

  /**
   * Exchanges the stored refresh token for a fresh access token; returns the same config on failure
   */
  public async refreshAccessToken(config: YouTubeMusicConfig): Promise<YouTubeMusicConfig> {
    if (!config.refreshToken || !config.clientId) return config;
    try {
      const bodyParams: Record<string, string> = {
        client_id: config.clientId,
        refresh_token: config.refreshToken,
        grant_type: 'refresh_token'
      };
      if (config.clientSecret) {
        bodyParams.client_secret = config.clientSecret;
      }
      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(bodyParams)
      });
      if (!res.ok) {
        console.warn('YouTube token refresh failed (HTTP ' + res.status + ')');
        return config;
      }
      const data = await res.json();
      if (!data.access_token) return config;
      return {
        ...config,
        accessToken: data.access_token,
        tokenExpiresAt: Math.floor(Date.now() / 1000) + (data.expires_in || 3600)
      };
    } catch (e) {
      console.warn('Error refreshing YouTube token:', e);
      return config;
    }
  }

  /**
   * Fetches user's playlists from YouTube Data API v3
   */
  public async fetchUserPlaylists(config: YouTubeMusicConfig): Promise<OnDemandPlaylist[]> {
    if (!config.connected && !config.apiKey) {
      return YTM_CURATED_MIXES;
    }

    try {
      const headers: Record<string, string> = {};
      let url = 'https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&maxResults=25';

      if (config.accessToken) {
        headers['Authorization'] = `Bearer ${config.accessToken}`;
        url += '&mine=true';
      } else if (config.apiKey) {
        url += `&key=${config.apiKey}`;
      }

      const res = await fetch(url, { headers });
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        console.warn('YouTube API request failed (HTTP ' + res.status + '):', errText);
        return YTM_CURATED_MIXES;
      }

      const items = (await res.json() as YtListResponse<YtPlaylistItem>).items || [];

      // Include official Liked Music playlist (LL) at the head of user library
      const likedMusicPlaylist: OnDemandPlaylist = {
        id: 'ytm_LL',
        providerId: 'youtube_music',
        title: 'Titres Likés',
        curator: config.userName || 'Mon Compte Google',
        genre: 'Favoris YouTube Music',
        coverColor: '#E50914',
        badgeText: 'FAVORIS',
        tracks: []
      };

      const userPlaylists: OnDemandPlaylist[] = items.map((item) => {
        const thumbnails = item.snippet?.thumbnails;
        const coverUrl = thumbnails?.maxres?.url || thumbnails?.high?.url || thumbnails?.medium?.url || thumbnails?.default?.url;
        return {
          id: `ytm_${item.id}`,
          providerId: 'youtube_music',
          title: item.snippet?.title || 'Playlist sans titre',
          curator: item.snippet?.channelTitle || 'YouTube Music',
          genre: 'YouTube Playlist',
          coverColor: '#E50914',
          coverUrl,
          badgeText: 'PLAYLIST',
          tracks: []
        };
      });

      const combinedUserLists = [likedMusicPlaylist, ...userPlaylists];

      // Combine user playlists with curated mixes if requested
      if (config.autoSyncMixes) {
        return [...combinedUserLists, ...YTM_CURATED_MIXES];
      }

      return combinedUserLists.length > 0 ? combinedUserLists : YTM_CURATED_MIXES;
    } catch (e) {
      console.warn('Error fetching YouTube playlists:', e);
      return YTM_CURATED_MIXES;
    }
  }

  /**
   * Fetches playlist items (videos / songs) for a given playlist
   */
  public async fetchPlaylistItems(playlistId: string, config: YouTubeMusicConfig): Promise<OnDemandTrack[]> {
    // 1. If it's one of the curated mixes, return its tracks directly!
    const foundCurated = YTM_CURATED_MIXES.find(m => m.id === playlistId);
    if (foundCurated && foundCurated.tracks.length > 0) {
      return foundCurated.tracks;
    }

    if (!config.accessToken && !config.apiKey) {
      return [];
    }

    try {
      const cleanId = playlistId.replace(/^ytm_/, '');
      const headers: Record<string, string> = {};
      let url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${cleanId}`;

      if (config.accessToken) {
        headers['Authorization'] = `Bearer ${config.accessToken}`;
      } else if (config.apiKey) {
        url += `&key=${config.apiKey}`;
      }

      const res = await fetch(url, { headers });
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        console.warn(`YouTube playlistItems failed for ${cleanId} (HTTP ${res.status}):`, errText);
        return [];
      }

      const items = (await res.json() as YtListResponse<YtPlaylistItem>).items || [];

      const tracks: OnDemandTrack[] = items
        .filter((item) => {
          const title = item.snippet?.title;
          return title && title !== 'Deleted video' && title !== 'Private video';
        })
        .map((item, idx) => {
          const videoId = item.contentDetails?.videoId || item.snippet?.resourceId?.videoId;
          const thumbnails = item.snippet?.thumbnails;
          const coverUrl = thumbnails?.maxres?.url || thumbnails?.high?.url || thumbnails?.medium?.url || thumbnails?.default?.url;
          return {
            id: `yt_${videoId || idx}`,
            title: item.snippet?.title || 'Titre inconnu',
            artist: (item.snippet?.videoOwnerChannelTitle || item.snippet?.channelTitle || 'YouTube Music').replace(/ - Topic$/, ''),
            duration: 210,
            coverColor: '#E50914',
            coverUrl,
            audioUrl: `youtube:${videoId}`
          };
        });

      // Real durations from videos.list so Discord timestamps and the queue scrubber are exact
      try {
        const ids = tracks.map(t => t.audioUrl?.replace('youtube:', '')).filter(Boolean) as string[];
        for (let i = 0; i < ids.length; i += 50) {
          const chunk = ids.slice(i, i + 50);
          let vUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${chunk.join(',')}`;
          const vHeaders: Record<string, string> = {};
          if (config.accessToken) {
            vHeaders['Authorization'] = `Bearer ${config.accessToken}`;
          } else if (config.apiKey) {
            vUrl += `&key=${config.apiKey}`;
          }
          const vRes = await fetch(vUrl, { headers: vHeaders });
          if (!vRes.ok) continue;
          const byId = new Map<string, number>();
          for (const v of (await vRes.json() as YtListResponse<YtVideoItem>).items || []) {
            const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(v.contentDetails?.duration || '');
            if (m && v.id) {
              byId.set(v.id, (+(m[1] || 0)) * 3600 + (+(m[2] || 0)) * 60 + (+(m[3] || 0)));
            }
          }
          for (const t of tracks) {
            const id = t.audioUrl?.replace('youtube:', '');
            if (id && byId.has(id)) t.duration = byId.get(id)!;
          }
        }
      } catch (e) {
        console.warn('YouTube durations fetch failed, keeping placeholder durations:', e);
      }

      return tracks;
    } catch (e) {
      console.warn('Error fetching playlist items:', e);
      return [];
    }
  }
}

export const youtubeMusicService = new YouTubeMusicService();
