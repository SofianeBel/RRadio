let newsContext: AudioContext | null = null;

const getContext = (): AudioContext | null => {
  if (typeof window === 'undefined' || !window.AudioContext) return null;
  newsContext ??= new window.AudioContext();
  return newsContext;
};

const tone = (context: AudioContext, start: number, duration: number, from: number, to: number, volume: number, type: OscillatorType) => {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(from, start);
  oscillator.frequency.exponentialRampToValueAtTime(to, start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.onended = () => {
    oscillator.disconnect();
    gain.disconnect();
  };
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
};

/** Plays a short local notification sound; no media file or network request is used. */
export const playNewsSound = async (theme: 'gta4' | 'gta6', volume: number): Promise<void> => {
  const context = getContext();
  if (!context) throw new Error('Web Audio is unavailable');
  if (context.state === 'suspended') await context.resume();

  const level = (Number.isFinite(volume) ? Math.max(0, Math.min(1, volume)) : 0) * 0.18;
  if (level === 0) return;
  const now = context.currentTime + 0.01;

  if (theme === 'gta4') {
    [0, 0.12, 0.24].forEach((offset, index) => tone(context, now + offset, 0.075, 760 + index * 45, 820 + index * 45, level, 'square'));
  } else {
    tone(context, now, 0.22, 510, 760, level, 'sine');
    tone(context, now + 0.13, 0.27, 680, 1040, level * 0.82, 'sine');
  }
};
