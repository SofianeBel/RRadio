/**
 * YouTube IFrame Player Background Audio Wrapper
 * Allows streaming authentic YouTube Music audio in background with full control:
 * play, pause, volume, mute, seek, and auto-advance on track end.
 */

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: any;
  }
}

export type YTPlaybackEndedCallback = () => void;
export type YTTimeUpdateCallback = (currentTimeSeconds: number) => void;
export type YTPlaybackErrorCallback = (code: number) => void;

class YouTubePlayer {
  private player: any = null;
  private isApiReady = false;
  private containerId = 'yt-background-player-container';
  private currentVideoId: string | null = null;
  private isMuted = false;
  private volume = 80;
  private isPlaying = false;
  private endedCallbacks: YTPlaybackEndedCallback[] = [];
  private timeUpdateCallbacks: YTTimeUpdateCallback[] = [];
  private errorCallbacks: YTPlaybackErrorCallback[] = [];
  private tickerInterval: number | null = null;
  private pendingVideoId: string | null = null;

  constructor() {
    // We defer loading script to init()
  }

  public init() {
    if (this.isApiReady || typeof window === 'undefined') return;

    // 1. Create hidden off-screen container if not exists
    let container = document.getElementById(this.containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = this.containerId;
      container.style.position = 'fixed';
      container.style.top = '-9999px';
      container.style.left = '-9999px';
      container.style.width = '1px';
      container.style.height = '1px';
      container.style.opacity = '0';
      container.style.pointerEvents = 'none';
      container.style.zIndex = '-1';
      document.body.appendChild(container);
    }

    // 2. Load YouTube IFrame API script
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }

      window.onYouTubeIframeAPIReady = () => {
        this.onApiReady();
      };
    } else if (window.YT && window.YT.Player) {
      this.onApiReady();
    }
  }

  private onApiReady() {
    this.isApiReady = true;
    try {
      this.player = new window.YT.Player(this.containerId, {
        height: '1',
        width: '1',
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1
        },
        events: {
          onReady: () => {
            this.setVolume(this.volume);
            this.setMute(this.isMuted);
            if (this.pendingVideoId) {
              this.loadAndPlay(this.pendingVideoId);
              this.pendingVideoId = null;
            }
          },
          onStateChange: (event: any) => {
            this.handleStateChange(event.data);
          },
          onError: (e: any) => {
            const code = e?.data ?? -1;
            console.warn('YouTube IFrame Player error:', code, e);
            this.isPlaying = false;
            for (const cb of this.errorCallbacks) {
              try { cb(code); } catch {}
            }
          }
        }
      });
    } catch (e) {
      console.warn('Failed to initialize YouTube IFrame Player:', e);
    }

    // Start progress ticker (every 500ms)
    if (!this.tickerInterval) {
      this.tickerInterval = window.setInterval(() => {
        this.tick();
      }, 500);
    }
  }

  private handleStateChange(state: number) {
    if (!window.YT) return;

    if (state === window.YT.PlayerState.PLAYING) {
      this.isPlaying = true;
    } else if (state === window.YT.PlayerState.PAUSED) {
      this.isPlaying = false;
    } else if (state === window.YT.PlayerState.ENDED) {
      this.isPlaying = false;
      // Auto-advance
      for (const cb of this.endedCallbacks) {
        cb();
      }
    }
  }

  private tick() {
    if (!this.player || !this.isPlaying) return;
    try {
      if (typeof this.player.getCurrentTime === 'function') {
        const curTime = Math.floor(this.player.getCurrentTime() || 0);
        for (const cb of this.timeUpdateCallbacks) {
          cb(curTime);
        }
      }
    } catch (e) {
      // ignore
    }
  }

  public loadAndPlay(videoId: string) {
    this.init();
    this.currentVideoId = videoId;

    if (!this.isApiReady || !this.player || typeof this.player.loadVideoById !== 'function') {
      this.pendingVideoId = videoId;
      return;
    }

    try {
      this.player.loadVideoById({
        videoId,
        startSeconds: 0
      });
      this.player.playVideo();
      this.isPlaying = true;
    } catch (e) {
      console.warn('Error calling loadVideoById:', e);
    }
  }

  public play() {
    this.isPlaying = true;
    if (this.player && typeof this.player.playVideo === 'function') {
      try {
        this.player.playVideo();
      } catch (e) {}
    }
  }

  public pause() {
    this.isPlaying = false;
    if (this.player && typeof this.player.pauseVideo === 'function') {
      try {
        this.player.pauseVideo();
      } catch (e) {}
    }
  }

  public seek(seconds: number) {
    if (this.player && typeof this.player.seekTo === 'function') {
      try {
        this.player.seekTo(Math.max(0, seconds), true);
      } catch (e) {}
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(100, vol));
    if (this.player && typeof this.player.setVolume === 'function') {
      try {
        this.player.setVolume(this.volume);
      } catch (e) {}
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.player) {
      try {
        if (muted && typeof this.player.mute === 'function') {
          this.player.mute();
        } else if (!muted && typeof this.player.unMute === 'function') {
          this.player.unMute();
        }
      } catch (e) {}
    }
  }

  public getCurrentTime(): number {
    if (this.player && typeof this.player.getCurrentTime === 'function') {
      try {
        return Math.floor(this.player.getCurrentTime() || 0);
      } catch (e) {
        return 0;
      }
    }
    return 0;
  }

  public subscribeEnded(callback: YTPlaybackEndedCallback): () => void {
    this.endedCallbacks.push(callback);
    return () => {
      this.endedCallbacks = this.endedCallbacks.filter(c => c !== callback);
    };
  }

  public subscribeError(callback: YTPlaybackErrorCallback): () => void {
    this.errorCallbacks.push(callback);
    return () => {
      this.errorCallbacks = this.errorCallbacks.filter(c => c !== callback);
    };
  }


  public subscribeTimeUpdate(callback: YTTimeUpdateCallback): () => void {
    this.timeUpdateCallbacks.push(callback);
    return () => {
      this.timeUpdateCallbacks = this.timeUpdateCallbacks.filter(c => c !== callback);
    };
  }
}

export const youtubePlayer = new YouTubePlayer();
