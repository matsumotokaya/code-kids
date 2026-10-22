/**
 * Lookahead step sequencer (the "two clocks" pattern): a coarse JS timer wakes every 25 ms and
 * schedules every step due in the next 120 ms on the AudioContext clock, so notes stay on time
 * even when React or a busy tablet delays the timer. The screen is told about each step from
 * requestAnimationFrame when the audio clock actually reaches it, so the playhead matches the sound.
 */
import { closeBus, createBus, playVoice, rhythmContext, soundAllowed } from './synth';
import { notesAt } from './engine';
import type { Pattern } from './types';

const TIMER_MS = 25;
const AHEAD_S = 0.12;
const START_DELAY_S = 0.06;

export interface SequenceOptions {
  steps: number;
  /** Read when each step is scheduled, so edits made while it loops are heard on the next lap. */
  pattern: () => Pattern;
  /** Read per step, so changing the tempo takes effect at once. */
  stepSec: () => number;
  /** Stop after this many laps. Loops forever when left out. */
  laps?: number;
  onStep: (step: number, lap: number) => void;
  /** Called when `laps` have finished (not when `stop()` is called). */
  onEnd?: () => void;
}

export interface Sequencer {
  play: (options: SequenceOptions) => void;
  stop: () => void;
  isPlaying: () => boolean;
}

interface Due {
  step: number;
  lap: number;
  time: number;
}

export function createSequencer(): Sequencer {
  let timer: ReturnType<typeof setInterval> | null = null;
  let frame = 0;
  let queue: Due[] = [];
  let bus: GainNode | null = null;
  let ac: AudioContext | null = null;
  let playing = false;

  const stop = () => {
    playing = false;
    if (timer !== null) clearInterval(timer);
    timer = null;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    queue = [];
    if (ac && bus) closeBus(ac, bus);
    bus = null;
  };

  const play = (o: SequenceOptions) => {
    stop();
    ac = rhythmContext();
    // A context that is still waking up (iOS) has a frozen clock, so fall back to the page clock
    // and map times onto the audio clock as each note is scheduled.
    const audioClock = ac?.state === 'running';
    const now = () => (audioClock && ac ? ac.currentTime : performance.now() / 1000);
    bus = ac ? createBus(ac) : null;
    playing = true;

    let step = 0;
    let lap = 0;
    let next = now() + START_DELAY_S;
    let endAt: number | null = null;

    const schedule = () => {
      const t = now();
      // After the tab slept, skip ahead instead of firing a pile of late notes at once.
      if (next < t - 0.05) next = t + 0.02;
      while (endAt === null && next < t + AHEAD_S) {
        if (o.laps !== undefined && lap >= o.laps) {
          endAt = next;
          break;
        }
        // Skipped while the context is still waking, so no backlog of notes bursts out when it does.
        if (ac && bus && ac.state === 'running' && soundAllowed()) {
          const at = audioClock ? next : ac.currentTime + Math.max(0, next - t);
          for (const inst of notesAt(o.pattern(), step)) playVoice(ac, bus, inst, step, at);
        }
        queue.push({ step, lap, time: next });
        next += o.stepSec();
        step += 1;
        if (step >= o.steps) {
          step = 0;
          lap += 1;
        }
      }
    };

    const draw = () => {
      if (!playing) return;
      const t = now();
      let latest: Due | undefined;
      while (queue.length > 0 && queue[0].time <= t) latest = queue.shift();
      if (latest) o.onStep(latest.step, latest.lap);
      if (endAt !== null && queue.length === 0 && t >= endAt) {
        stop();
        o.onEnd?.();
        return;
      }
      frame = requestAnimationFrame(draw);
    };

    schedule();
    timer = setInterval(schedule, TIMER_MS);
    frame = requestAnimationFrame(draw);
  };

  return { play, stop, isPlaying: () => playing };
}
