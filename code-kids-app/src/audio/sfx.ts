/**
 * Tiny Web Audio synthesizer for soft, toy-like sound effects.
 * No audio files are needed, so the app stays small and works offline.
 */

let ctx: AudioContext | null = null;
let enabled = true;

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** iOS requires the AudioContext to be created inside a user gesture. */
export function unlockAudio(): void {
  getContext();
}

if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', unlockAudio, { once: true, passive: true });
}

interface ToneOptions {
  freq: number;
  to?: number;
  dur: number;
  type?: OscillatorType;
  vol?: number;
  at?: number;
}

function tone({ freq, to = freq, dur, type = 'triangle', vol = 0.1, at = 0 }: ToneOptions): void {
  if (!enabled) return;
  const ac = getContext();
  if (!ac) return;
  try {
    const start = ac.currentTime + at;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(to, 1), start + dur);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(vol, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(gain).connect(ac.destination);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  } catch {
    // Audio is best-effort; never break gameplay.
  }
}

function noise(dur: number, vol: number, fromHz: number, toHz: number): void {
  if (!enabled) return;
  const ac = getContext();
  if (!ac) return;
  try {
    const length = Math.floor(ac.sampleRate * dur);
    const buffer = ac.createBuffer(1, length, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource();
    src.buffer = buffer;
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    const now = ac.currentTime;
    filter.frequency.setValueAtTime(fromHz, now);
    filter.frequency.exponentialRampToValueAtTime(toHz, now + dur);
    const gain = ac.createGain();
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(filter).connect(gain).connect(ac.destination);
    src.start(now);
    src.stop(now + dur);
  } catch {
    // ignore
  }
}

/** G major pentatonic over two octaves: no two notes clash, so free drawing always sounds musical. */
const CHIME_SCALE = [392, 440, 523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51];

function chimeFreq(step: number): number {
  const i = Math.max(0, Math.floor(step));
  return CHIME_SCALE[i % CHIME_SCALE.length] * 2 ** Math.floor(i / CHIME_SCALE.length);
}

export const sfx = {
  setEnabled(value: boolean): void {
    enabled = value;
  },
  tap(): void {
    tone({ freq: 520, to: 780, dur: 0.07, vol: 0.07 });
  },
  select(): void {
    tone({ freq: 660, to: 990, dur: 0.12, vol: 0.08 });
  },
  hop(index = 0): void {
    const base = 360 + (index % 6) * 40;
    tone({ freq: base, to: base + 260, dur: 0.14, vol: 0.09 });
  },
  power(): void {
    tone({ freq: 300, to: 900, dur: 0.22, type: 'sawtooth', vol: 0.04 });
    tone({ freq: 600, to: 1200, dur: 0.22, type: 'triangle', vol: 0.05, at: 0.05 });
  },
  star(): void {
    [880, 1108, 1318, 1760].forEach((f, i) => tone({ freq: f, dur: 0.22, type: 'sine', vol: 0.08, at: i * 0.055 }));
  },
  bump(): void {
    tone({ freq: 150, to: 60, dur: 0.22, type: 'square', vol: 0.06 });
    noise(0.12, 0.07, 900, 200);
  },
  splash(): void {
    noise(0.5, 0.1, 2000, 200);
    tone({ freq: 520, to: 110, dur: 0.45, type: 'sine', vol: 0.05 });
  },
  nope(): void {
    tone({ freq: 260, to: 190, dur: 0.18, vol: 0.06 });
  },
  win(): void {
    const melody = [523, 659, 784, 1046, 784, 1046, 1318];
    melody.forEach((f, i) => tone({ freq: f, dur: 0.26, type: 'triangle', vol: 0.09, at: i * 0.09 }));
  },
  unlock(): void {
    [392, 523, 659].forEach((f, i) => tone({ freq: f, dur: 0.2, type: 'sine', vol: 0.07, at: i * 0.08 }));
  },
  /** A soft glassy note from the pentatonic scale; step 0 is the lowest. */
  chime(step: number): void {
    const f = chimeFreq(step);
    tone({ freq: f, dur: 0.55, type: 'sine', vol: 0.05 });
    tone({ freq: f * 2, dur: 0.25, type: 'sine', vol: 0.012 });
  },
  /** One rising note per copy, so the chosen number can be heard as well as seen. */
  bloom(count: number): void {
    for (let i = 0; i < count; i++) tone({ freq: chimeFreq(i), dur: 0.32, type: 'sine', vol: 0.05, at: i * 0.05 });
  },
  sweep(): void {
    noise(0.45, 0.06, 3200, 250);
  },
};
