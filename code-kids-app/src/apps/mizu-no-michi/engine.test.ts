import { describe, expect, it } from 'vitest';
import { bestRotation, buildLayout, flow, initialTurns, isOpenGround, keyOf, openings, rateTries, solve } from './engine';
import { PIPE_LEVELS } from './levels';
import type { Piece, PipeLevel } from './types';

const line: PipeLevel = {
  id: 0,
  title: '',
  hint: '',
  w: 4,
  h: 1,
  source: { x: 0, y: 0, out: 'right' },
  goals: [{ x: 3, y: 0 }],
  rocks: [],
  fixed: [],
  turnable: [],
  hand: { straight: 2 },
};
const pipes = (...entries: [number, number, Piece][]) => new Map(entries.map(([x, y, piece]) => [keyOf({ x, y }), piece]));
const across: Piece = { kind: 'straight', rot: 1 };

describe('openings', () => {
  it('turns the base shapes clockwise, and keeps working after many taps', () => {
    expect(openings({ kind: 'straight', rot: 0 }).sort()).toEqual(['down', 'up']);
    expect(openings({ kind: 'corner', rot: 1 }).sort()).toEqual(['down', 'right']);
    expect(openings({ kind: 'tee', rot: 2 }).sort()).toEqual(['down', 'left', 'right']);
    expect(openings({ kind: 'corner', rot: 9 }).sort()).toEqual(openings({ kind: 'corner', rot: 1 }).sort());
  });
});

describe('flow', () => {
  it('reaches the flower through a complete pipe', () => {
    const trace = flow(line, pipes([1, 0, across], [2, 0, across]));
    expect(trace.outcome).toBe('win');
    expect(trace.fills.map((f) => f.depth)).toEqual([1, 2]);
    expect(trace.goals).toEqual([{ x: 3, y: 0, depth: 3 }]);
  });

  it('leaks where a pipe ends on grass', () => {
    const trace = flow(line, pipes([1, 0, across]));
    expect(trace.outcome).toBe('leak');
    expect(trace.leaks).toEqual([{ x: 1, y: 0, side: 'right', depth: 1 }]);
  });

  it('leaks into a pipe that faces the wrong way', () => {
    const trace = flow(line, pipes([1, 0, { kind: 'straight', rot: 0 }]));
    expect(trace.leaks).toEqual([{ x: 0, y: 0, side: 'right', depth: 0 }]);
  });

  it('is dry, not leaking, when every end is closed but a flower is cut off', () => {
    const level: PipeLevel = { ...line, w: 5, goals: [{ x: 2, y: 0 }, { x: 4, y: 0 }] };
    const trace = flow(level, pipes([1, 0, across]));
    expect(trace.outcome).toBe('dry');
  });
});

describe('bestRotation', () => {
  it('turns a new pipe to join the tap', () => {
    expect(bestRotation(line, new Map(), { x: 1, y: 0 }, 'straight')).toBe(1);
  });
});

describe('rateTries', () => {
  it('gives ★3 for the first pour', () => {
    expect([1, 2, 3, 7].map(rateTries)).toEqual([3, 2, 1, 1]);
  });
});

describe('levels', () => {
  it('have unique ids in order', () => {
    expect(PIPE_LEVELS.map((l) => l.id)).toEqual(PIPE_LEVELS.map((_, i) => i + 1));
  });

  for (const level of PIPE_LEVELS) {
    describe(`stage ${level.id} ${level.title}`, () => {
      it('keeps everything on the board and in separate cells', () => {
        const cells = [level.source, ...level.goals, ...level.rocks, ...level.fixed, ...level.turnable];
        const keys = cells.map(keyOf);
        expect(new Set(keys).size).toBe(keys.length);
        for (const c of cells) {
          expect(c.x).toBeGreaterThanOrEqual(0);
          expect(c.y).toBeGreaterThanOrEqual(0);
          expect(c.x).toBeLessThan(level.w);
          expect(c.y).toBeLessThan(level.h);
        }
      });

      it('can be solved with the pipes it gives', () => {
        const solution = solve(level);
        expect(solution).not.toBeNull();
        const turns = new Map([...initialTurns(level), ...solution!.turns]);
        expect(flow(level, buildLayout(level, turns, solution!.placed)).outcome).toBe('win');
        for (const k of solution!.placed.keys()) {
          const [x, y] = k.split(',').map(Number);
          expect(isOpenGround(level, { x, y })).toBe(true);
        }
      });

      it('is not already solved before the child does anything', () => {
        expect(flow(level, buildLayout(level, initialTurns(level), new Map())).outcome).not.toBe('win');
      });
    });
  }
});
