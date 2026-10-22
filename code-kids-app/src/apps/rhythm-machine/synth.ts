/**
 * The machine's four instruments, synthesized with Web Audio (no audio files).
 * It keeps its own AudioContext because src/audio/sfx.ts does not export its one,
 * and it obeys the same global sound switch (useProgress().soundOn) that App.tsx feeds to sfx.
 */
import { useProgress } from '../../store/progress';
import type { Instrument } from './types';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

/** Creates the context on first use and wakes it up. Call it from a tap so iOS lets it play. */
export function rhythmContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
      // A soft limiter so four instruments on one step never clip on tablet speakers.
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -10;
      limiter.ratio.value = 6;
      master = ctx.createGain();
      master.gain.value = 0.8;
      master.connect(limiter).connect(ctx.destination);
      const length = Math.floor(ctx.sampleRate * 0.5);
      noiseBuffer = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** Bound to pointerdown on the game screens so the first tap already unlocks audio on iOS. */
export function unlockRhythmAudio(): void {
  rhythmContext();
}

export function soundAllowed(): boolean {
  return useProgress.getState().soundOn;
}

/** A fresh bus for one playback run, so stopping can silence notes already scheduled ahead. */
export function createBus(ac: AudioContext): GainNode | null {
  if (!master) return null;
  const bus = ac.createGain();
  bus.connect(master);
  return bus;
}

/** Fades a bus out and detaches it. Notes scheduled on it after this never sound. */
export function closeBus(ac: AudioContext, bus: GainNode): void {
  try {
    bus.gain.cancelScheduledValues(ac.currentTime);
    bus.gain.setTargetAtTime(0, ac.currentTime, 0.015);
    setTimeout(() => bus.disconnect(), 250);
  } catch {
    // ignore
  }
}

/**
 * ポン's pitch depends on the column: a C-major pentatonic arch (up, then down) across 8 steps,
 * so any set of bells sounds like a tune. A 16-step grid repeats it.
 */
export const BELL_NOTES = [523.25, 659.25, 783.99, 880, 1046.5, 880, 783.99, 659.25];
/** 0 (lowest) … 4 (highest), for drawing the bell dot higher when the note is higher. */
export const BELL_LEVEL = [0, 1, 2, 3, 4, 3, 2, 1];

export function bellFreq(step: number): number {
  return BELL_NOTES[((step % BELL_NOTES.length) + BELL_NOTES.length) % BELL_NOTES.length];
}

function env(gain: GainNode, at: number, peak: number, decay: number): void {
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(peak, at + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + decay);
}

function noiseBurst(ac: AudioContext, out: AudioNode, at: number, filterType: BiquadFilterType, hz: number, q: number): GainNode | null {
  if (!noiseBuffer) return null;
  const src = ac.createBufferSource();
  src.buffer = noiseBuffer;
  const filter = ac.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = hz;
  filter.Q.value = q;
  const gain = ac.createGain();
  src.connect(filter).connect(gain).connect(out);
  src.start(at, Math.random() * 0.2);
  src.stop(at + 0.3);
  return gain;
}

function osc(ac: AudioContext, out: AudioNode, type: OscillatorType, at: number, dur: number): { osc: OscillatorNode; gain: GainNode } {
  const o = ac.createOscillator();
  o.type = type;
  const gain = ac.createGain();
  o.connect(gain).connect(out);
  o.start(at);
  o.stop(at + dur + 0.05);
  return { osc: o, gain };
}

/** Schedules one hit at audio time `at` on `out`. */
export function playVoice(ac: AudioContext, out: AudioNode, inst: Instrument, step: number, at: number): void {
  try {
    switch (inst) {
      case 'don': {
        // Big drum: a sine that drops fast in pitch.
        const { osc: o, gain } = osc(ac, out, 'sine', at, 0.45);
        o.frequency.setValueAtTime(170, at);
        o.frequency.exponentialRampToValueAtTime(45, at + 0.3);
        env(gain, at, 0.9, 0.45);
        break;
      }
      case 'tan': {
        // Clap: three quick noise bursts and a short tail, over a small wooden body tone.
        const noise = noiseBurst(ac, out, at, 'bandpass', 1500, 0.9);
        if (noise) {
          noise.gain.setValueAtTime(0.0001, at);
          for (const t of [0, 0.011, 0.022]) {
            noise.gain.setValueAtTime(0.55, at + t);
            noise.gain.exponentialRampToValueAtTime(0.08, at + t + 0.009);
          }
          noise.gain.setValueAtTime(0.4, at + 0.033);
          noise.gain.exponentialRampToValueAtTime(0.0001, at + 0.2);
        }
        const { osc: o, gain } = osc(ac, out, 'triangle', at, 0.1);
        o.frequency.setValueAtTime(230, at);
        o.frequency.exponentialRampToValueAtTime(160, at + 0.1);
        env(gain, at, 0.18, 0.1);
        break;
      }
      case 'chi': {
        // Hi-hat: a very short burst of bright noise.
        const noise = noiseBurst(ac, out, at, 'highpass', 7000, 0.7);
        if (noise) env(noise, at, 0.35, 0.06);
        break;
      }
      case 'pon': {
        // Bell: a sine plus a quiet inharmonic partial that dies sooner, like a small glass bell.
        const f = bellFreq(step);
        const body = osc(ac, out, 'sine', at, 0.8);
        body.osc.frequency.setValueAtTime(f, at);
        env(body.gain, at, 0.28, 0.8);
        const ring = osc(ac, out, 'sine', at, 0.3);
        ring.osc.frequency.setValueAtTime(f * 2.76, at);
        env(ring.gain, at, 0.06, 0.3);
        break;
      }
    }
  } catch {
    // Audio is best-effort; never break the game.
  }
}

/** One hit right now, e.g. when the child turns a cell on. */
export function previewVoice(inst: Instrument, step: number): void {
  if (!soundAllowed()) return;
  const ac = rhythmContext();
  if (!ac || !master) return;
  playVoice(ac, master, inst, step, ac.currentTime + 0.005);
}
