import radioManifest from '../data/radioManifest.json';
import { GTA4_MANIFEST } from '../data/gta4Stations';
import { youtubePlayer } from './youtubePlayer';

export interface RadioTrack {
  filename: string;
  title: string;
  artist: string;
  duration: number;
  url: string;
}

export type TrackChangeCallback = (stationId: string, track: RadioTrack, progressSeconds: number) => void;
export type TrackEndedCallback = () => void;

class RadioPlayer {
  private audio: HTMLAudioElement | null = null;
  private currentMode: 'radio' | 'ondemand' = 'radio';
  private currentStationId: string | null = null;
  private onDemandTrack: RadioTrack | null = null;
  private currentRadioTrack: RadioTrack | null = null;
  private isYouTube = false;
  private volume: number = 0.8;
  private isMuted: boolean = false;
  private isPlaying: boolean = true;
  private baseEpoch: number = Date.now();
  private hasFiredEnded: boolean = false;
  private onTrackChangeCallbacks: TrackChangeCallback[] = [];
  private onTrackEndedCallbacks: TrackEndedCallback[] = [];
  private progressInterval: number | null = null;
  private audioCtx: AudioContext | null = null;

  constructor() {
    // Generate an epoch offset so stations start mid-broadcast realistically
    this.baseEpoch = Date.now() - 3600 * 1000 * 4;
  }

  public init() {
    if (this.audio) return;
    try {
      this.audio = new Audio();
      this.audio.preload = 'auto';
      this.audio.volume = this.isMuted ? 0 : this.volume;

      // Handle track end
      this.audio.addEventListener('ended', () => {
        if (this.currentMode === 'radio' && this.currentStationId) {
          this.advanceStationTrack(this.currentStationId);
        } else if (this.currentMode === 'ondemand' && !this.isYouTube) {
          if (!this.hasFiredEnded) {
            this.hasFiredEnded = true;
            for (const cb of this.onTrackEndedCallbacks) {
              cb();
            }
          }
        }
      });

      // HTML5 timeupdate event for immediate low-latency UI progress
      this.audio.addEventListener('timeupdate', () => {
        if (this.currentMode === 'ondemand' && !this.isYouTube && this.onDemandTrack && this.audio) {
          const progress = Math.floor(this.audio.currentTime);
          this.notifyTrackChange('ondemand', this.onDemandTrack, progress);

          if (
            this.audio.duration > 0 &&
            this.audio.currentTime >= this.audio.duration - 0.4 &&
            !this.hasFiredEnded
          ) {
            this.hasFiredEnded = true;
            for (const cb of this.onTrackEndedCallbacks) {
              cb();
            }
          }
        }
      });

      this.audio.addEventListener('error', (e) => {
        console.warn('Audio stream playback error:', e);
        if (this.currentMode === 'ondemand' && !this.isYouTube && !this.hasFiredEnded) {
          this.hasFiredEnded = true;
          for (const cb of this.onTrackEndedCallbacks) {
            try { cb(); } catch {}
          }
        }
      });

      // Initialize YouTube Background Player and wire events
      youtubePlayer.init();
      youtubePlayer.subscribeEnded(() => {
        if (this.currentMode === 'ondemand' && this.isYouTube) {
          for (const cb of this.onTrackEndedCallbacks) {
            cb();
          }
        }
      });
      youtubePlayer.subscribeError((code) => {
        if (this.currentMode !== 'ondemand' || !this.isYouTube) return;
        console.warn('On-Demand YouTube error, skipping track (code ' + code + ')');
        if (this.hasFiredEnded) return;
        this.hasFiredEnded = true;
        for (const cb of this.onTrackEndedCallbacks) {
          try { cb(); } catch {}
        }
      });

      youtubePlayer.subscribeTimeUpdate((secs) => {
        if (this.currentMode === 'ondemand' && this.isYouTube && this.onDemandTrack) {
          this.notifyTrackChange('ondemand', this.onDemandTrack, secs);
        }
      });

      // Periodic progress ticker (updates every 500ms)
      this.progressInterval = window.setInterval(() => {
        this.tickProgress();
      }, 500);
    } catch (e) {
      console.error('RadioPlayer initialization error:', e);
    }
  }

  public subscribeTrackChange(callback: TrackChangeCallback): () => void {
    this.onTrackChangeCallbacks.push(callback);
    return () => {
      this.onTrackChangeCallbacks = this.onTrackChangeCallbacks.filter(c => c !== callback);
    };
  }

  public subscribeTrackEnded(callback: TrackEndedCallback): () => void {
    this.onTrackEndedCallbacks.push(callback);
    return () => {
      this.onTrackEndedCallbacks = this.onTrackEndedCallbacks.filter(c => c !== callback);
    };
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.audio && !this.isMuted) {
      this.audio.volume = this.volume;
    }
    youtubePlayer.setVolume(this.volume * 100);
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.audio) {
      this.audio.volume = muted ? 0 : this.volume;
    }
    youtubePlayer.setMute(muted);
    if (this.currentMode === 'ondemand') {
      if (muted) {
        this.isPlaying = false;
        if (this.isYouTube) {
          youtubePlayer.pause();
        } else if (this.audio) {
          this.audio.pause();
        }
      } else if (this.onDemandTrack) {
        this.isPlaying = true;
        if (this.isYouTube) {
          youtubePlayer.play();
        } else if (this.audio && this.audio.src) {
          this.audio.play().catch(() => {});
        }
      }
    }
  }

  public play() {
    this.isPlaying = true;
    if (this.isYouTube) {
      youtubePlayer.play();
    } else if (this.audio && this.audio.src && !this.isMuted) {
      this.audio.play().catch(() => {});
    }
  }

  public pause() {
    this.isPlaying = false;
    if (this.isYouTube) {
      youtubePlayer.pause();
    } else if (this.audio) {
      this.audio.pause();
    }
  }

  public seek(seconds: number) {
    if (this.isYouTube) {
      youtubePlayer.seek(seconds);
    } else if (this.audio && Number.isFinite(seconds)) {
      this.audio.currentTime = Math.max(0, seconds);
    }
  }

  public getCurrentProgress(): number {
    if (this.currentMode === 'ondemand') {
      if (this.isYouTube) {
        return Math.floor(youtubePlayer.getCurrentTime());
      }
      return Math.floor(this.audio?.currentTime || 0);
    }
    if (this.audio && Number.isFinite(this.audio.currentTime)) {
      return Math.floor(this.audio.currentTime);
    }
    if (this.currentStationId) {
      const liveState = this.calculateLiveStationPosition(this.currentStationId);
      return liveState ? Math.floor(liveState.offsetSeconds) : 0;
    }
    return 0;
  }

  /**
   * Switch to a specific Radio Station (Simulated Live FM Broadcast)
   */
  public tuneToStation(stationId: string, playStaticSFX: boolean = true) {
    this.init();
    if (!this.audio) return;

    if (playStaticSFX) {
      this.playTuningStatic();
    }

    this.currentMode = 'radio';
    this.currentStationId = stationId;
    this.onDemandTrack = null;
    this.isYouTube = false;
    youtubePlayer.pause();

    // The audio element is the single source of truth for what is on air
    const currentLiveState = this.calculateLiveStationPosition(stationId);
    if (!currentLiveState) return;

    const { track, offsetSeconds } = currentLiveState;
    this.currentRadioTrack = track;

    try {
      this.audio.src = track.url;

      // Seeking before metadata is loaded silently resets to 0; seek once metadata arrives
      this.audio.addEventListener('loadedmetadata', () => {
        if (Number.isFinite(offsetSeconds) && offsetSeconds > 0) {
          try {
            this.audio!.currentTime = offsetSeconds;
          } catch {
            // Stream not seekable yet; play from the start rather than desync
          }
        }
        if (this.isPlaying && !this.isMuted) {
          this.audio!.play().catch(e => {
            console.warn('Playback gesture required or stream loading:', e);
          });
        }
      }, { once: true });

      this.notifyTrackChange(stationId, track, offsetSeconds);
    } catch (e) {
      console.warn('Error loading station track stream:', e);
    }
  }

  /**
   * Play specific On-Demand track (supports both direct MP3 and YouTube Music)
   */
  public playTrack(trackUrl: string, trackMeta: RadioTrack) {
    this.init();

    this.currentMode = 'ondemand';
    this.currentStationId = 'ondemand';
    this.onDemandTrack = trackMeta;
    this.hasFiredEnded = false;

    const targetUrl = trackUrl || trackMeta.url;

    if (targetUrl && targetUrl.startsWith('youtube:')) {
      // 1. Play through YouTube Background Player
      this.isYouTube = true;
      if (this.audio) {
        this.audio.pause();
      }

      const videoId = targetUrl.replace('youtube:', '');
      youtubePlayer.loadAndPlay(videoId);
      youtubePlayer.setVolume(this.volume * 100);
      youtubePlayer.setMute(this.isMuted);
      if (this.isMuted) {
        youtubePlayer.pause();
        this.isPlaying = false;
      } else {
        this.isPlaying = true;
      }

      this.notifyTrackChange('ondemand', trackMeta, 0);
    } else if (this.audio) {
      // 2. Play through HTML5 Audio Player (MP3 Stream)
      this.isYouTube = false;
      youtubePlayer.pause();

      try {
        if (targetUrl) {
          this.audio.src = targetUrl;
          this.audio.currentTime = 0;

          if (this.isPlaying && !this.isMuted) {
            this.audio.play().catch(e => {
              console.warn('OnDemand playback error:', e);
            });
          }
        }

        this.notifyTrackChange('ondemand', trackMeta, 0);
      } catch (e) {
        console.warn('Error playing ondemand track:', e);
      }
    }
  }

  /**
   * Advances to next track on the station in live radio mode
   */
  private advanceStationTrack(stationId: string) {
    const manifestObj = radioManifest as Record<string, RadioTrack[]>;
    const gta4Obj = GTA4_MANIFEST as Record<string, RadioTrack[]>;
    const tracks = manifestObj[stationId] ?? gta4Obj[stationId] ?? [];
    if (tracks.length === 0 || !this.audio) return;

    // Advance sequentially from the track that actually just finished
    const currentIndex = this.currentRadioTrack
      ? tracks.findIndex(t => t.filename === this.currentRadioTrack!.filename)
      : -1;
    const nextTrack = tracks[(currentIndex + 1 + tracks.length) % tracks.length];

    this.currentRadioTrack = nextTrack;
    try {
      this.audio.src = nextTrack.url;
      if (this.isPlaying && !this.isMuted) {
        this.audio.play().catch(e => {
          console.warn('Radio track advance playback error:', e);
        });
      }
      this.notifyTrackChange(stationId, nextTrack, 0);
    } catch (e) {
      console.warn('Error advancing station track stream:', e);
    }
  }

  /**
   * Computes the live radio position based on elapsed time
   * so stations progress continuously in real-time
   */
  public calculateLiveStationPosition(stationId: string): { track: RadioTrack; offsetSeconds: number; trackIndex: number } | null {
    const manifestObj = radioManifest as Record<string, RadioTrack[]>;
    const gta4Obj = GTA4_MANIFEST as Record<string, RadioTrack[]>;
    const tracks: RadioTrack[] = manifestObj[stationId] ?? gta4Obj[stationId] ?? [];

    const totalCycleSeconds = tracks.reduce((acc, t) => acc + (t.duration || 240), 0);
    if (totalCycleSeconds === 0) return null;

    const elapsedTotalSeconds = Math.floor((Date.now() - this.baseEpoch) / 1000);
    const cyclePositionSeconds = elapsedTotalSeconds % totalCycleSeconds;

    let accumulated = 0;
    for (let i = 0; i < tracks.length; i++) {
      const t = tracks[i];
      const dur = t.duration || 240;
      if (accumulated + dur > cyclePositionSeconds) {
        const offsetSeconds = Math.max(0, cyclePositionSeconds - accumulated);
        return {
          track: t,
          offsetSeconds,
          trackIndex: i
        };
      }
      accumulated += dur;
    }

    return {
      track: tracks[0],
      offsetSeconds: 0,
      trackIndex: 0
    };
  }

  private tickProgress() {
    // 1. In ON DEMAND Mode:
    if (this.currentMode === 'ondemand') {
      if (this.isYouTube) {
        const curSecs = youtubePlayer.getCurrentTime();
        if (this.onDemandTrack) {
          this.notifyTrackChange('ondemand', this.onDemandTrack, curSecs);
        }
      } else if (this.audio && this.onDemandTrack) {
        const currentSecs = Math.floor(this.audio.currentTime || 0);
        this.notifyTrackChange('ondemand', this.onDemandTrack, currentSecs);
      }
      return;
    }

    // 2. In RADIO Mode: report the track the audio element is actually playing
    if (!this.audio || !this.currentStationId) return;
    if (this.currentRadioTrack) {
      this.notifyTrackChange(this.currentStationId, this.currentRadioTrack, Math.floor(this.audio.currentTime || 0));
    } else {
      const liveState = this.calculateLiveStationPosition(this.currentStationId);
      if (liveState) {
        this.notifyTrackChange(this.currentStationId, liveState.track, Math.floor(liveState.offsetSeconds));
      }
    }
  }

  private notifyTrackChange(stationId: string, track: RadioTrack, progress: number) {
    for (const cb of this.onTrackChangeCallbacks) {
      cb(stationId, track, progress);
    }
  }

  /**
   * FM Tuning Static audio synthesizer
   */
  public playTuningStatic(durationMs: number = 200) {
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext;
        if (!AudioContextClass) return;
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const bufferSize = this.audioCtx.sampleRate * (durationMs / 1000);
      const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noiseSource = this.audioCtx.createBufferSource();
      noiseSource.buffer = buffer;

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, this.audioCtx.currentTime);
      filter.Q.setValueAtTime(3.0, this.audioCtx.currentTime);

      const gain = this.audioCtx.createGain();
      gain.gain.setValueAtTime(0.01, this.audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.25, this.audioCtx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + durationMs / 1000);

      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioCtx.destination);

      noiseSource.start();
      noiseSource.stop(this.audioCtx.currentTime + durationMs / 1000);
    } catch (e) {
      // ignore
    }
  }
}

export const radioPlayer = new RadioPlayer();
