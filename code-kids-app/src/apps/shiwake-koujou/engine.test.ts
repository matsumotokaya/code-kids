import { describe, expect, it } from 'vitest';
import { bestRotation, buildLayout, dirOf, initialTurns, isOpenFloor, keyOf, nextDir, rateTries, run, solve, SPACING } from './engine';
import { SORT_LEVELS } from './levels';
import type { Part, SortLevel } from './types';

const line: SortLevel = {
  id: 0,
  title: '',
  hint: '',
  w: 4,
  h: 3,
  chute: { x: 0, y: 1, out: 'right' },
  items: ['red', 'blue'],
  boxes: [{ x: 3, y: 1, color: 'red' }],
  walls: [],
  fixed: [],
  turnable: [],
  hand: { belt: 2 },
};
const parts = (...entries: [number, number, Part][]) => new Map(entries.map(([x, y, part]) => [keyOf({ x, y }), part]));
const right: Part = { kind: 'belt', rot: 1 };
const up: Part = { kind: 'belt', rot: 0 };
const down: Part = { kind: 'belt', rot: 2 };
const left: Part = { kind: 'belt', rot: 3 };

describe('parts', () => {
  it('point the way they were turned, even after many taps', () => {
    expect([0, 1, 2, 3, 9, -1].map((rot) => dirOf({ kind: 'belt', rot }))).toEqual(['up', 'right', 'down', 'left', 'right', 'left']);
  });

  it('a sorter turns only its own colour and lets the rest go straight', () => {
    const sorter: Part = { kind: 'sort-red', rot: 0 };
    expect(nextDir(sorter, 'red', 'right')).toBe('up');
    expect(nextDir(sorter, 'blue', 'right')).toBe('right');
    expect(nextDir(right, 'yellow', 'down')).toBe('right');
  });
});

describe('run', () => {
  const redOnly: SortLevel = { ...line, items: ['red', 'red'] };

  it('carries every item along the belts into its box, one after another', () => {
    const trace = run(redOnly, parts([1, 1, right], [2, 1, right]));
    expect(trace.outcome).toBe('win');
    expect(trace.items[0].path).toEqual([{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }]);
    expect(trace.items[1].start).toBe(SPACING);
    expect(trace.lastTick).toBe(SPACING + 3);
  });

  it('drops an item onto the floor where the belts end', () => {
    const trace = run(redOnly, parts([1, 1, right]));
    expect(trace.outcome).toBe('fell');
    expect(trace.items[0].path.at(-1)).toEqual({ x: 2, y: 1 });
    expect(trace.failItem).toBe(0);
    expect(trace.lastTick).toBe(2);
  });

  it('drops an item off the edge of the board', () => {
    const trace = run(redOnly, parts([1, 1, up], [1, 0, up]));
    expect(trace.outcome).toBe('fell');
    expect(trace.items[0].path.at(-1)).toEqual({ x: 1, y: -1 });
  });

  it('stops at the first mishap: a blue item in the red box', () => {
    const trace = run(line, parts([1, 1, right], [2, 1, right]));
    expect(trace.outcome).toBe('wrong');
    expect(trace.failItem).toBe(1);
    expect(trace.items[0].end).toBe('boxed');
  });

  it('gets stuck against a wall', () => {
    const walled: SortLevel = { ...redOnly, walls: [{ x: 2, y: 1 }] };
    const trace = run(walled, parts([1, 1, right]));
    expect(trace.outcome).toBe('bump');
    expect(trace.items[0].path.slice(-2)).toEqual([{ x: 1, y: 1 }, { x: 1, y: 1 }]);
  });

  it('notices an item going round in circles', () => {
    const trace = run(redOnly, parts([1, 1, up], [1, 0, right], [2, 0, down], [2, 1, left]));
    expect(trace.outcome).toBe('loop');
  });

  it('sorts two colours into two boxes', () => {
    const level: SortLevel = { ...line, boxes: [{ x: 3, y: 1, color: 'blue' }, { x: 2, y: 0, color: 'red' }] };
    const trace = run(level, parts([1, 1, right], [2, 1, { kind: 'sort-red', rot: 0 }]));
    expect(trace.outcome).toBe('win');
    expect(trace.items[0].path.at(-1)).toEqual({ x: 2, y: 0 });
    expect(trace.items[1].path.at(-1)).toEqual({ x: 3, y: 1 });
  });
});

describe('bestRotation', () => {
  it('turns a new belt to carry on from the chute', () => {
    expect(dirOf({ kind: 'belt', rot: bestRotation(line, new Map(), { x: 1, y: 1 }, 'belt') })).toBe('right');
  });

  it('points a new sorter at the box of its colour', () => {
    const level: SortLevel = { ...line, boxes: [{ x: 3, y: 1, color: 'blue' }, { x: 2, y: 0, color: 'red' }] };
    const rot = bestRotation(level, parts([1, 1, right]), { x: 2, y: 1 }, 'sort-red');
    expect(dirOf({ kind: 'sort-red', rot })).toBe('up');
  });
});

describe('rateTries', () => {
  it('gives ★3 for the first run', () => {
    expect([1, 2, 3, 7].map(rateTries)).toEqual([3, 2, 1, 1]);
  });
});

describe('levels', () => {
  it('have unique ids in order', () => {
    expect(SORT_LEVELS.map((l) => l.id)).toEqual(SORT_LEVELS.map((_, i) => i + 1));
  });

  for (const level of SORT_LEVELS) {
    describe(`stage ${level.id} ${level.title}`, () => {
      it('keeps everything on the board and in separate cells', () => {
        const cells = [level.chute, ...level.boxes, ...level.walls, ...level.fixed, ...level.turnable];
        const keys = cells.map(keyOf);
        expect(new Set(keys).size).toBe(keys.length);
        for (const c of cells) {
          expect(c.x).toBeGreaterThanOrEqual(0);
          expect(c.y).toBeGreaterThanOrEqual(0);
          expect(c.x).toBeLessThan(level.w);
          expect(c.y).toBeLessThan(level.h);
        }
      });

      it('has a box for every colour that comes out', () => {
        for (const color of level.items) expect(level.boxes.some((b) => b.color === color)).toBe(true);
      });

      it('can be solved with the parts it gives', () => {
        const solution = solve(level);
        expect(solution).not.toBeNull();
        const turns = new Map([...initialTurns(level), ...solution!.turns]);
        expect(run(level, buildLayout(level, turns, solution!.placed)).outcome).toBe('win');
        for (const [k, part] of solution!.placed) {
          const [x, y] = k.split(',').map(Number);
          expect(isOpenFloor(level, { x, y })).toBe(true);
          expect(level.hand[part.kind] ?? 0).toBeGreaterThan(0);
        }
      });

      it('is not already solved before the child does anything', () => {
        expect(run(level, buildLayout(level, initialTurns(level), new Map())).outcome).not.toBe('win');
      });
    });
  }
});
