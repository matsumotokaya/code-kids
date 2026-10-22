import type { Card, CardKind, Command, Dir, EndCard, Level, LoopCard, Point, Times } from './types';

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
  /** A pass of a くりかえし starts. `pass` counts from 1; `endIndex` is its おわり (or the program length if unclosed). */
  | { kind: 'loop'; cmdIndex: number; endIndex: number; pass: number; count: number }
  /** Every pass of the loop is done; `cmdIndex` is the おわり card. */
  | { kind: 'loopEnd'; cmdIndex: number; loopIndex: number }
  | { kind: 'end' };

export type Outcome = 'win' | 'bump' | 'splash' | 'incomplete';

export interface Trace {
  events: StepEvent[];
  outcome: Outcome;
}

export const isMove = (c: Card): c is Command => 'dir' in c;
export const isLoop = (c: Card): c is LoopCard => 'loop' in c;
export const isEnd = (c: Card): c is EndCard => 'end' in c;

/**
 * Pairs every くりかえし with its おわり (stack based, so nesting would work in the engine even though
 * the editor never allows it). An unclosed loop runs to the end of the program; a stray おわり does nothing.
 */
export function matchLoops(program: Card[]): Map<number, number> {
  const pairs = new Map<number, number>();
  const open: number[] = [];
  program.forEach((c, i) => {
    if (isLoop(c)) open.push(i);
    else if (isEnd(c) && open.length > 0) pairs.set(open.pop()!, i);
  });
  for (const i of open) pairs.set(i, program.length);
  return pairs;
}

/**
 * Runs a program against a level and returns every visible event in order.
 * Pure function: the UI replays the events with timing and animation.
 */
export function simulate(level: Level, program: Card[]): Trace {
  const events: StepEvent[] = [];
  const rocks = new Set(level.rocks.map(keyOf));
  const water = new Set(level.water.map(keyOf));
  const remaining = new Set(level.stars.map(keyOf));
  const pairs = matchLoops(program);
  let pos: Point = { ...level.start };

  /** Runs cards [from, to). Returns an outcome when the run is over, or null to keep going. */
  const runRange = (from: number, to: number): Outcome | null => {
    let i = from;
    while (i < to) {
      const card = program[i];
      if (isLoop(card)) {
        const endIndex = pairs.get(i) ?? program.length;
        for (let pass = 1; pass <= card.loop; pass++) {
          events.push({ kind: 'loop', cmdIndex: i, endIndex, pass, count: card.loop });
          const outcome = runRange(i + 1, endIndex);
          if (outcome) return outcome;
        }
        if (endIndex < program.length) events.push({ kind: 'loopEnd', cmdIndex: endIndex, loopIndex: i });
        i = endIndex + 1;
        continue;
      }
      if (isEnd(card)) {
        i++;
        continue;
      }
      for (let t = 0; t < card.times; t++) {
        const next = stepFrom(pos, card.dir);
        if (!inBounds(next, level.size)) {
          events.push({ kind: 'bump', cmdIndex: i, dir: card.dir, at: pos, into: 'edge' });
          return 'bump';
        }
        if (rocks.has(keyOf(next))) {
          events.push({ kind: 'bump', cmdIndex: i, dir: card.dir, at: pos, into: 'rock' });
          return 'bump';
        }
        events.push({ kind: 'move', cmdIndex: i, dir: card.dir, from: pos, to: next });
        pos = next;
        if (water.has(keyOf(pos))) {
          events.push({ kind: 'splash', cmdIndex: i, at: pos });
          return 'splash';
        }
        if (remaining.delete(keyOf(pos))) {
          events.push({ kind: 'star', cmdIndex: i, at: pos, remaining: remaining.size });
          if (remaining.size === 0) {
            events.push({ kind: 'win', cmdIndex: i });
            return 'win';
          }
        }
      }
      i++;
    }
    return null;
  };

  const outcome = runRange(0, program.length);
  if (outcome) return { events, outcome };
  events.push({ kind: 'end' });
  return { events, outcome: 'incomplete' };
}

/* ---------- World 2 editor rules (UI independent so they can be tested) ---------- */

export type ProgramIssue = 'open' | 'stray' | 'nested';

/**
 * Why a program cannot run yet, or null when it can.
 * - 'open': a くりかえし has no おわり
 * - 'stray': an おわり has no くりかえし (e.g. the child just removed the くりかえし to swap it)
 * - 'nested': a くりかえし inside another; the game keeps loops flat, so the solver never needs nesting
 * While editing, open and stray states are fine (they are steps of a fix); only nesting is refused.
 */
export function programIssue(program: Card[]): ProgramIssue | null {
  let open = false;
  let stray = false;
  for (const c of program) {
    if (isLoop(c)) {
      if (open) return 'nested';
      open = true;
    } else if (isEnd(c)) {
      if (open) open = false;
      else stray = true;
    }
  }
  if (open) return 'open';
  return stray ? 'stray' : null;
}

/** Number of おわり cards with no くりかえし before them. */
export function strayEnds(program: Card[]): number {
  let open = false;
  let stray = 0;
  for (const c of program) {
    if (isLoop(c)) open = true;
    else if (isEnd(c)) {
      if (open) open = false;
      else stray++;
    }
  }
  return stray;
}

/** True when some くりかえし has no おわり yet. */
export function hasOpenLoop(program: Card[]): boolean {
  return programIssue(program) === 'open';
}

export type LoopRole = 'start' | 'body' | 'end' | 'open-body' | 'stray';

/**
 * How each strip card relates to a loop, for drawing the loop bracket.
 * 'open-body' marks cards inside a loop that has no おわり yet; 'stray' an おわり with no くりかえし.
 */
export function loopRoles(program: Card[]): (LoopRole | null)[] {
  const roles: (LoopRole | null)[] = program.map((c) => (isEnd(c) ? 'stray' : null));
  const pairs = matchLoops(program);
  for (const [start, end] of pairs) {
    roles[start] = 'start';
    const closed = end < program.length;
    for (let i = start + 1; i < end; i++) roles[i] = closed ? 'body' : 'open-body';
    if (closed) roles[end] = 'end';
  }
  return roles;
}

/** Card kinds that go into the strip as their own card (everything but the 2かい / 3かい modifiers). */
export function makeCard(kind: Exclude<CardKind, 'x2' | 'x3'>, id: string): Card {
  if (kind === 'loop2') return { id, loop: 2 };
  if (kind === 'loop3') return { id, loop: 3 };
  if (kind === 'end') return { id, end: true };
  return { id, dir: kind, times: 1 };
}

/**
 * Reads the compact notation used for なおして stages and tests:
 * `right`, `up*2` (arrow with a 2かい modifier), `loop3`, `end`, separated by spaces.
 */
export function parseProgram(text: string, idPrefix = 'p'): Card[] {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((token, i) => {
      const [name, mult] = token.split('*');
      const id = `${idPrefix}${i}`;
      if (name === 'loop2' || name === 'loop3' || name === 'end') return makeCard(name, id);
      if (name === 'up' || name === 'down' || name === 'left' || name === 'right') {
        const times = Number(mult ?? 1);
        if (times !== 1 && times !== 2 && times !== 3) throw new Error(`bad multiplier in "${token}"`);
        return { id, dir: name, times: times as Times };
      }
      throw new Error(`unknown card "${token}"`);
    });
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
