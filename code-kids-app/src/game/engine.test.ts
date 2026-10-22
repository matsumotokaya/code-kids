import { describe, expect, it } from 'vitest';
import { loopRoles, parseProgram, programIssue, rateStars, simulate } from './engine';
import { isLevelUnlocked, LEVELS, WORLD2_FIRST_ID, WORLD2_LEVELS } from './levels';
import { minCommands } from './solver';
import type { CardKind, Command, Dir, Level, Times } from './types';

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

describe('くりかえし', () => {
  const loopBase: Level = { ...base, cards: ['right', 'up', 'down', 'left', 'loop2', 'loop3', 'end'] };

  it('repeats the cards between くりかえし and おわり, then runs the cards after it', () => {
    const level: Level = { ...loopBase, size: 6, start: { x: 0, y: 5 }, stars: [{ x: 4, y: 2 }] };
    const trace = simulate(level, parseProgram('loop3 right up end right'));
    expect(trace.outcome).toBe('win');
    const moves = trace.events.filter((e) => e.kind === 'move').map((e) => e.cmdIndex);
    expect(moves).toEqual([1, 2, 1, 2, 1, 2, 4]);
    const loops = trace.events.filter((e) => e.kind === 'loop');
    expect(loops.map((e) => e.kind === 'loop' && e.pass)).toEqual([1, 2, 3]);
    expect(trace.events.some((e) => e.kind === 'loopEnd' && e.cmdIndex === 3)).toBe(true);
  });

  it('stops in the middle of a pass when it bumps or wins', () => {
    const bump = simulate({ ...loopBase, stars: [{ x: 4, y: 4 }] }, parseProgram('loop3 up up end'));
    expect(bump.outcome).toBe('bump');
    const win = simulate({ ...loopBase, stars: [{ x: 1, y: 1 }] }, parseProgram('loop3 right up end'));
    expect(win.outcome).toBe('win');
    expect(win.events.filter((e) => e.kind === 'loop')).toHaveLength(1);
  });

  it('combines with 2かい inside the loop', () => {
    const trace = simulate({ ...loopBase, size: 7, start: { x: 0, y: 3 }, stars: [{ x: 6, y: 3 }] }, parseProgram('loop3 right*2 end'));
    expect(trace.outcome).toBe('win');
    expect(trace.events.filter((e) => e.kind === 'move')).toHaveLength(6);
  });

  it('reports what keeps a program from running', () => {
    expect(programIssue(parseProgram('loop2 right up end'))).toBeNull();
    expect(programIssue(parseProgram('loop2 right up'))).toBe('open');
    expect(programIssue(parseProgram('right up end'))).toBe('stray');
    expect(programIssue(parseProgram('loop2 right loop3 up end end'))).toBe('nested');
  });

  it('marks the loop bracket', () => {
    expect(loopRoles(parseProgram('up loop2 right up end down'))).toEqual([null, 'start', 'body', 'body', 'end', null]);
    expect(loopRoles(parseProgram('loop2 right'))).toEqual(['start', 'open-body']);
    expect(loopRoles(parseProgram('right end'))).toEqual([null, 'stray']);
  });

  it('solver counts くりかえし and おわり as one card each', () => {
    // 3 steps of the staircase: 6 arrows, or くりかえし + みぎ + うえ + おわり = 4 cards.
    const stairs: Level = {
      ...loopBase,
      start: { x: 0, y: 4 },
      stars: [
        { x: 1, y: 3 },
        { x: 2, y: 2 },
        { x: 3, y: 1 },
      ],
      cards: ['right', 'up', 'loop3', 'end'],
      slots: 8,
    };
    expect(minCommands(stairs)).toBe(4);
    expect(minCommands({ ...stairs, cards: ['right', 'up'] })).toBe(6);
    // Two steps: a loop would also cost 4, so it is never better than 4 arrows.
    expect(minCommands({ ...stairs, stars: stairs.stars.slice(0, 2), cards: ['right', 'up', 'loop2', 'end'] })).toBe(4);
  });
});

describe('world 2 levels', () => {
  const isLoopCard = (c: CardKind) => c === 'loop2' || c === 'loop3' || c === 'end';

  it('have ids from 101 in order, all marked world 2', () => {
    expect(WORLD2_LEVELS.map((l) => l.id)).toEqual(WORLD2_LEVELS.map((_, i) => WORLD2_FIRST_ID + i));
    for (const level of WORLD2_LEVELS) expect(level.world).toBe(2);
  });

  it('never place stars, rocks or water on the start cell or on each other', () => {
    for (const level of WORLD2_LEVELS) {
      const keys = [...level.stars, ...level.rocks, ...level.water].map((p) => `${p.x},${p.y}`);
      expect(new Set(keys).size, `level ${level.id} overlaps`).toBe(keys.length);
      expect(keys, `level ${level.id} start occupied`).not.toContain(`${level.start.x},${level.start.y}`);
    }
  });

  it.each(WORLD2_LEVELS.map((l) => [l.id, l] as const))('level %i is solvable and par matches the optimum', (_id, level) => {
    expect(minCommands(level), `level ${level.id} par`).toBe(level.par);
    expect(level.par <= level.slots).toBe(true);
  });

  it.each(WORLD2_LEVELS.filter((l) => l.cards.includes('end') && !l.buggy).map((l) => [l.id, l] as const))(
    'level %i needs くりかえし: arrows alone do not fit in the strip',
    (_id, level) => {
      const arrowsOnly = minCommands({ ...level, cards: level.cards.filter((c) => !isLoopCard(c)) });
      expect(arrowsOnly === null || arrowsOnly > level.slots, `level ${level.id} solvable without loops in ${arrowsOnly}`).toBe(true);
    },
  );

  it.each(WORLD2_LEVELS.filter((l) => l.buggy).map((l) => [l.id, l] as const))('なおして level %i: the bug fails and the fix gets 3 stars', (_id, level) => {
    const buggy = parseProgram(level.buggy!);
    const fixed = parseProgram(level.fixed!);
    expect(programIssue(buggy), 'buggy program must still run').toBeNull();
    expect(buggy.length <= level.slots).toBe(true);
    expect(simulate(level, buggy).outcome).not.toBe('win');
    expect(simulate(level, fixed).outcome).toBe('win');
    expect(fixed.length).toBe(level.par);
    // Every card the fix needs is in the tray.
    for (const token of level.fixed!.split(' ')) {
      const name = token.split('*')[0] as CardKind;
      expect(level.cards, `level ${level.id} tray`).toContain(name);
    }
    // Number of wrong cards: tokens that differ, counting a moved おわり as one.
    const a = level.buggy!.split(' ');
    const b = level.fixed!.split(' ');
    const differing = a.length === b.length ? a.filter((t, i) => t !== b[i]).length : Infinity;
    const moved = [...a].sort().join() === [...b].sort().join();
    expect(moved ? 1 : differing, `level ${level.id} bug count`).toBe(level.bugs);
  });

  it('unlock after the last world 1 stage, then one by one', () => {
    const cleared = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    const has = (id: number) => cleared.has(id);
    expect(isLevelUnlocked(has, WORLD2_FIRST_ID)).toBe(false);
    cleared.add(LEVELS.at(-1)!.id);
    expect(isLevelUnlocked(has, WORLD2_FIRST_ID)).toBe(true);
    expect(isLevelUnlocked(has, WORLD2_FIRST_ID + 1)).toBe(false);
    expect(isLevelUnlocked(has, 1)).toBe(true);
    expect(isLevelUnlocked(has, 12)).toBe(true);
  });
});
