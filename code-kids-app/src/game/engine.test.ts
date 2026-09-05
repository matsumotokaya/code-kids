import { describe, expect, it } from 'vitest';
import { rateStars, simulate } from './engine';
import { LEVELS } from './levels';
import { minCommands } from './solver';
import type { Command, Dir, Level, Times } from './types';

const cmd = (dir: Dir, times: Times = 1): Command => ({ id: `${dir}-${times}-${Math.random()}`, dir, times });

const base: Level = {
  id: 0,
  title: 't',
  hint: '',
  size: 5,
  start: { x: 0, y: 2 },
  facing: 'right',
  stars: [{ x: 2, y: 2 }],
  rocks: [],
  water: [],
  cards: ['right', 'up', 'down', 'left', 'x2', 'x3'],
  slots: 8,
  par: 1,
};

describe('simulate', () => {
  it('wins when the last star is collected and ignores remaining cards', () => {
    const trace = simulate(base, [cmd('right'), cmd('right'), cmd('right')]);
    expect(trace.outcome).toBe('win');
    expect(trace.events.filter((e) => e.kind === 'move')).toHaveLength(2);
    expect(trace.events.at(-1)).toMatchObject({ kind: 'win', cmdIndex: 1 });
  });

  it('bumps into rocks without moving', () => {
    const level: Level = { ...base, rocks: [{ x: 1, y: 2 }] };
    const trace = simulate(level, [cmd('right')]);
    expect(trace.outcome).toBe('bump');
    expect(trace.events[0]).toMatchObject({ kind: 'bump', into: 'rock', at: { x: 0, y: 2 } });
  });

  it('bumps at the edge of the board', () => {
    const trace = simulate(base, [cmd('left')]);
    expect(trace.events[0]).toMatchObject({ kind: 'bump', into: 'edge' });
  });

  it('splashes when stepping into water, even mid multi-step', () => {
    const level: Level = { ...base, water: [{ x: 1, y: 2 }] };
    const trace = simulate(level, [cmd('right', 3)]);
    expect(trace.outcome).toBe('splash');
    expect(trace.events.map((e) => e.kind)).toEqual(['move', 'splash']);
  });

  it('multiplied cards move one cell at a time', () => {
    const level: Level = { ...base, stars: [{ x: 3, y: 2 }] };
    const trace = simulate(level, [cmd('right', 3)]);
    expect(trace.outcome).toBe('win');
    expect(trace.events.filter((e) => e.kind === 'move')).toHaveLength(3);
  });

  it('reports incomplete when stars remain', () => {
    const trace = simulate(base, [cmd('right')]);
    expect(trace.outcome).toBe('incomplete');
  });
});

describe('rateStars', () => {
  it('rates by distance from par', () => {
    expect(rateStars(4, 4)).toBe(3);
    expect(rateStars(4, 3)).toBe(3);
    expect(rateStars(4, 6)).toBe(2);
    expect(rateStars(4, 7)).toBe(1);
  });
});

describe('levels', () => {
  it('have unique ids in order', () => {
    expect(LEVELS.map((l) => l.id)).toEqual(LEVELS.map((_, i) => i + 1));
  });

  it('never place stars, rocks or water on the start cell or on each other', () => {
    for (const level of LEVELS) {
      const all = [...level.stars, ...level.rocks, ...level.water];
      const keys = all.map((p) => `${p.x},${p.y}`);
      expect(new Set(keys).size, `level ${level.id} overlaps`).toBe(keys.length);
      expect(keys, `level ${level.id} start occupied`).not.toContain(`${level.start.x},${level.start.y}`);
      for (const p of all) {
        expect(p.x >= 0 && p.x < level.size && p.y >= 0 && p.y < level.size, `level ${level.id} out of bounds`).toBe(true);
      }
    }
  });

  it.each(LEVELS.map((l) => [l.id, l] as const))('level %i is solvable and par matches the optimum', (_id, level) => {
    const optimum = minCommands(level);
    expect(optimum, `level ${level.id} unsolvable`).not.toBeNull();
    expect(optimum, `level ${level.id} par`).toBe(level.par);
    expect(level.par <= level.slots, `level ${level.id} par exceeds slots`).toBe(true);
  });
});
