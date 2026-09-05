import type { Command, Dir, Level, Point, Times } from './types';

export const DIRS: Dir[] = ['up', 'right', 'down', 'left'];

export const DIR_DELTA: Record<Dir, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export const keyOf = (p: Point): string => `${p.x},${p.y}`;

export function stepFrom(p: Point, dir: Dir): Point {
  const d = DIR_DELTA[dir];
  return { x: p.x + d.x, y: p.y + d.y };
}

export function inBounds(p: Point, size: number): boolean {
  return p.x >= 0 && p.y >= 0 && p.x < size && p.y < size;
}

export type StepEvent =
  | { kind: 'move'; cmdIndex: number; dir: Dir; from: Point; to: Point }
  | { kind: 'star'; cmdIndex: number; at: Point; remaining: number }
  | { kind: 'bump'; cmdIndex: number; dir: Dir; at: Point; into: 'rock' | 'edge' }
  | { kind: 'splash'; cmdIndex: number; at: Point }
  | { kind: 'win'; cmdIndex: number }
  | { kind: 'end' };

export type Outcome = 'win' | 'bump' | 'splash' | 'incomplete';

export interface Trace {
  events: StepEvent[];
  outcome: Outcome;
}

/**
 * Runs a program against a level and returns every visible event in order.
 * Pure function: the UI replays the events with timing and animation.
 */
export function simulate(level: Level, program: Command[]): Trace {
  const events: StepEvent[] = [];
  const rocks = new Set(level.rocks.map(keyOf));
  const water = new Set(level.water.map(keyOf));
  const remaining = new Set(level.stars.map(keyOf));
  let pos: Point = { ...level.start };

  for (let i = 0; i < program.length; i++) {
    const cmd = program[i];
    for (let t = 0; t < cmd.times; t++) {
      const next = stepFrom(pos, cmd.dir);
      if (!inBounds(next, level.size)) {
        events.push({ kind: 'bump', cmdIndex: i, dir: cmd.dir, at: pos, into: 'edge' });
        return { events, outcome: 'bump' };
      }
      if (rocks.has(keyOf(next))) {
        events.push({ kind: 'bump', cmdIndex: i, dir: cmd.dir, at: pos, into: 'rock' });
        return { events, outcome: 'bump' };
      }
      events.push({ kind: 'move', cmdIndex: i, dir: cmd.dir, from: pos, to: next });
      pos = next;
      if (water.has(keyOf(pos))) {
        events.push({ kind: 'splash', cmdIndex: i, at: pos });
        return { events, outcome: 'splash' };
      }
      if (remaining.delete(keyOf(pos))) {
        events.push({ kind: 'star', cmdIndex: i, at: pos, remaining: remaining.size });
        if (remaining.size === 0) {
          events.push({ kind: 'win', cmdIndex: i });
          return { events, outcome: 'win' };
        }
      }
    }
  }

  events.push({ kind: 'end' });
  return { events, outcome: 'incomplete' };
}

export function allowedTimes(level: Level): Times[] {
  const times: Times[] = [1];
  if (level.cards.includes('x2')) times.push(2);
  if (level.cards.includes('x3')) times.push(3);
  return times;
}

/** 3 stars at par, 2 stars within two extra cards, otherwise 1. */
export function rateStars(par: number, used: number): 1 | 2 | 3 {
  if (used <= par) return 3;
  if (used <= par + 2) return 2;
  return 1;
}
