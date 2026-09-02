/**
 * Web Audio Engine for GTA 6 / Vice City Radio
 * Handles tuning static, mechanical switch sounds, radio timeline simulation, and audio synthesis.
 */

interface ActiveStationSound {
  oscillators: OscillatorNode[];
  gain: GainNode;
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioNode | null = null;
  private noiseGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private musicOscillators: Record<string, ActiveStationSound> = {};
  private stationStartTimes: Record<string, number> = {};
  private isInitialized = false;
  public init() {
    if (this.isInitialized) return;
    try {
      const AudioContextClass = window.AudioContext;
      if (!AudioContextClass) {
        throw new Error('AudioContext is not supported');
      }
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.8;
      this.masterGain.connect(this.ctx.destination);
      this.isInitialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported or user gesture needed:', e);
    }
  }

  public setVolume(volume: number) {
    if (!this.masterGain || !this.ctx) return;
    this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime, 0.05);
  }

  /**
   * Plays authentic FM radio tuning static noise
   */
  public playTuningNoise(durationMs: number = 220) {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    try {
      // 1. Generate White Noise Buffer
      const bufferSize = this.ctx.sampleRate * (durationMs / 1000);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = buffer;

      // 2. Bandpass filter for radio crackle
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(3200, this.ctx.currentTime + durationMs / 1000 * 0.5);
      filter.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + durationMs / 1000);
      filter.Q.setValueAtTime(3.0, this.ctx.currentTime);

      // 3. Gain Envelope
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.35, this.ctx.currentTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + durationMs / 1000);

      // Connect nodes
      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noiseSource.start();
      noiseSource.stop(this.ctx.currentTime + durationMs / 1000);

      // Play subtle mechanical switch click
      this.playMechanicalClick();
    } catch (e) {
      console.error('Error playing static noise:', e);
    }
  }

  /**
   * Mechanical rotary switch click sound
   */
  public playMechanicalClick() {
    if (!this.ctx || !this.masterGain) return;

    try {
      const osc = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(420, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.03);

      clickGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      clickGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);

      osc.connect(clickGain);
      clickGain.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.03);
    } catch (e) {
      // ignore
    }
  }

  /**
   * Ambient 80s Synth chord synthesizer for current station
   */
  public playStationSynth(stationId: string, genre: string) {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    // Stop previous station sound
    this.stopStationSynth();

    if (stationId === 'radio_off') return;

    try {
      const frequencies = this.getGenreFrequencies(genre);
      const oscillators: OscillatorNode[] = [];
      const stationGain = this.ctx.createGain();
      stationGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      stationGain.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 0.5);

      frequencies.forEach(freq => {
        const osc = this.ctx!.createOscillator();
        osc.type = genre.includes('ROCK') ? 'sawtooth' : 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime);
        osc.connect(stationGain);
        osc.start();
        oscillators.push(osc);
      });

      stationGain.connect(this.masterGain);
      this.musicOscillators[stationId] = { oscillators, gain: stationGain };
    } catch (e) {
      console.warn('Error starting station synth:', e);
    }
  }

  public stopStationSynth() {
    Object.keys(this.musicOscillators).forEach(id => {
      const item = this.musicOscillators[id];
      if (item && item.gain && this.ctx) {
        item.gain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.1);
        setTimeout(() => {
          item.oscillators?.forEach((osc: OscillatorNode) => {
            try { osc.stop(); } catch (e) {}
          });
        }, 120);
      }
    });
    this.musicOscillators = {};
  }

  private getGenreFrequencies(genre: string): number[] {
    if (genre.includes('POP')) return [261.63, 329.63, 392.00, 523.25]; // C major 7
    if (genre.includes('ROCK')) return [164.81, 220.00, 329.63]; // E minor power chord
    if (genre.includes('SYNTH')) return [220.00, 277.18, 329.63, 440.00]; // A major synth
    if (genre.includes('DISCO')) return [293.66, 369.99, 440.00, 587.33]; // D major 7
    if (genre.includes('LATIN')) return [246.94, 311.13, 369.99]; // B major salsa
    if (genre.includes('HIP-HOP')) return [110.00, 220.00, 330.00]; // Bass heavy
    return [220, 277, 330];
  }
}

export const soundEngine = new SoundEngine();
