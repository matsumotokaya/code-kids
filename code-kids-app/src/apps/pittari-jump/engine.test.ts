import { describe, expect, it } from 'vitest';
import { minJumps, simulate, step } from './engine';
import { JUMP_LEVELS } from './levels';
import type { JumpCardKind, JumpLevel } from './types';

let n = 0;
const prog = (...kinds: JumpCardKind[]) => kinds.map((kind) => ({ id: `c${++n}`, kind }));

const base: JumpLevel = {
  id: 0,
  title: 't',
  hint: '',
  max: 10,
  start: 2,
  goal: 10,
  crocs: [4],
  cards: ['add1', 'add2', 'add3', 'sub1', 'sub2', 'mul2', 'mul3', 'div2'],
  slots: 6,
  par: 2,
};

describe('step', () => {
  it('applies each operation', () => {
    expect(step(base, 2, 'add3')).toEqual({ kind: 'land', to: 5 });
    expect(step(base, 5, 'sub2')).toEqual({ kind: 'land', to: 3 });
    expect(step(base, 3, 'mul3')).toEqual({ kind: 'land', to: 9 });
    expect(step(base, 6, 'div2')).toEqual({ kind: 'land', to: 3 });
    expect(step(base, 8, 'div2')).toEqual({ kind: 'croc', to: 4 });
  });

  it('refuses to halve an odd number', () => {
    expect(step(base, 7, 'div2')).toEqual({ kind: 'split' });
  });

  it('falls in the pond past either end', () => {
    expect(step(base, 6, 'mul2')).toEqual({ kind: 'splash', to: 12 });
    expect(step(base, 1, 'sub2')).toEqual({ kind: 'splash', to: -1 });
  });
});

describe('simulate', () => {
  it('wins on landing on the goal and ignores the remaining cards', () => {
    const trace = simulate(base, prog('add3', 'mul2', 'add1'));
    expect(trace.outcome).toBe('win');
    expect(trace.events.filter((e) => e.kind === 'jump')).toHaveLength(2);
    expect(trace.events.at(-1)).toEqual({ kind: 'win', cmdIndex: 1, at: 10 });
  });

  it('jumps onto a crocodile, then fails', () => {
    const trace = simulate(base, prog('mul2', 'add3'));
    expect(trace.outcome).toBe('fail');
    expect(trace.events).toEqual([
      { kind: 'jump', cmdIndex: 0, from: 2, to: 4 },
      { kind: 'croc', cmdIndex: 0, at: 4 },
    ]);
  });

  it('jumping over a crocodile is fine', () => {
    expect(simulate(base, prog('add3', 'mul2')).outcome).toBe('win');
  });

  it('fails when the cards run out before the goal', () => {
    const trace = simulate(base, prog('add1'));
    expect(trace.outcome).toBe('fail');
    expect(trace.events.at(-1)).toEqual({ kind: 'end', at: 3 });
  });
});

describe('levels', () => {
  it('have unique sequential ids', () => {
    expect(JUMP_LEVELS.map((l) => l.id)).toEqual(JUMP_LEVELS.map((_, i) => i + 1));
  });

  for (const level of JUMP_LEVELS) {
    describe(`level ${level.id} ${level.title}`, () => {
      it('places start, goal and crocodiles on distinct pads within the line', () => {
        const pads = [level.start, level.goal, ...level.crocs];
        expect(new Set(pads).size).toBe(pads.length);
        for (const p of pads) {
          expect(p).toBeGreaterThanOrEqual(0);
          expect(p).toBeLessThanOrEqual(level.max);
        }
      });

      it('is solvable within its slots and par is the true minimum', () => {
        const best = minJumps(level);
        expect(best).not.toBeNull();
        expect(best).toBe(level.par);
        expect(level.par).toBeLessThanOrEqual(level.slots);
      });
    });
  }
});
