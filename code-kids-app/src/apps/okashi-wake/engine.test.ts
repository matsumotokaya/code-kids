import { describe, expect, it } from 'vitest';
import {
  ANSWER_MAX,
  dealGroups,
  dealShare,
  divide,
  divisionText,
  isCorrect,
  isReady,
  MAX_CANDIES,
  MAX_PER_PLATE,
  MAX_PLATES,
  multiplicationText,
  multiplicationWords,
  rateTries,
  REMAINDER_MAX,
  runMachine,
} from './engine';
import { OKASHI_LEVELS } from './levels';
import type { DealStep, OkashiLevel } from './types';

const share = (candies: number, plates: number, askRemainder = false): OkashiLevel => ({
  id: 0,
  title: '',
  hint: '',
  kind: 'share',
  candies,
  plates,
  askRemainder,
  treat: 'cookie',
});
const group = (candies: number, size: number, askRemainder = false): OkashiLevel => ({ ...share(candies, 1), kind: 'group', size, askRemainder });
const choose = (candies: number, choices: number[]): OkashiLevel => ({ id: 0, title: '', hint: '', kind: 'choose', candies, choices, treat: 'candy' });

function tally(steps: DealStep[]) {
  const plates = new Map<number, number>();
  let rest = 0;
  for (const s of steps) {
    if (s.plate === null) rest++;
    else plates.set(s.plate, (plates.get(s.plate) ?? 0) + 1);
  }
  return { plates, rest };
}

describe('divide', () => {
  it('gives the quotient and the remainder', () => {
    expect(divide(12, 3)).toEqual({ quotient: 4, remainder: 0 });
    expect(divide(13, 3)).toEqual({ quotient: 4, remainder: 1 });
    expect(divide(2, 5)).toEqual({ quotient: 0, remainder: 2 });
  });
});

describe('dealShare', () => {
  it('deals round-robin, one candy per plate in turn, and drops the incomplete round into the basket', () => {
    expect(dealShare(7, 3).map((s) => s.plate)).toEqual([0, 1, 2, 0, 1, 2, null]);
    expect(dealShare(7, 3).map((s) => s.slot)).toEqual([0, 0, 0, 1, 1, 1, 0]);
  });

  it('never deals a candy twice or loses one', () => {
    const { plates, rest } = tally(dealShare(17, 5));
    expect([...plates.values()]).toEqual([3, 3, 3, 3, 3]);
    expect(rest).toBe(2);
  });
});

describe('dealGroups', () => {
  it('fills one friend at a time', () => {
    expect(dealGroups(7, 3).map((s) => s.plate)).toEqual([0, 0, 0, 1, 1, 1, null]);
    expect(dealGroups(7, 3).map((s) => s.slot)).toEqual([0, 1, 2, 0, 1, 2, 0]);
  });
});

describe('runMachine', () => {
  it('shares onto the given plates', () => {
    const r = runMachine(share(13, 3, true));
    expect([r.divisor, r.quotient, r.remainder, r.plates]).toEqual([3, 4, 1, 3]);
  });

  it('counts the friends for a group level', () => {
    const r = runMachine(group(14, 4, true));
    expect([r.divisor, r.quotient, r.remainder, r.plates]).toEqual([4, 3, 2, 3]);
  });

  it('uses the chosen plates for a choose level', () => {
    const r = runMachine(choose(9, [2, 3]), 2);
    expect([r.divisor, r.quotient, r.remainder]).toEqual([2, 4, 1]);
    expect(() => runMachine(choose(9, [2, 3]))).toThrow();
  });
});

describe('predictions', () => {
  it('waits until every question has an answer', () => {
    expect(isReady(share(7, 2, true), { answer: 3, remainder: null })).toBe(false);
    expect(isReady(share(7, 2, true), { answer: 3, remainder: 1 })).toBe(true);
    expect(isReady(share(6, 2), { answer: 3, remainder: null })).toBe(true);
  });

  it('checks the share, the remainder only when asked, and evenness for choose', () => {
    const level = share(7, 2, true);
    const r = runMachine(level);
    expect(isCorrect(level, { answer: 3, remainder: 1 }, r)).toBe(true);
    expect(isCorrect(level, { answer: 3, remainder: 0 }, r)).toBe(false);
    expect(isCorrect(level, { answer: 4, remainder: 1 }, r)).toBe(false);
    const c = choose(9, [2, 3]);
    expect(isCorrect(c, { answer: 3, remainder: null }, runMachine(c, 3))).toBe(true);
    expect(isCorrect(c, { answer: 2, remainder: null }, runMachine(c, 2))).toBe(false);
  });
});

describe('equations', () => {
  it('writes the division and the multiplication behind it', () => {
    expect(divisionText(runMachine(share(12, 3)))).toBe('12 ÷ 3 = 4');
    expect(divisionText(runMachine(share(13, 3, true)))).toBe('13 ÷ 3 = 4 あまり 1');
    expect(multiplicationText(runMachine(share(12, 3)))).toBe('4 × 3 = 12');
    expect(multiplicationText(runMachine(share(13, 3, true)))).toBe('4 × 3 + 1 = 13');
    expect(multiplicationText(runMachine(group(12, 3)))).toBe('3 × 4 = 12');
    expect(multiplicationWords(runMachine(share(12, 3)))).toBe('4こずつ 3さらぶん');
    expect(multiplicationWords(runMachine(group(12, 3)))).toBe('3こずつ 4にんぶん');
  });
});

describe('rateTries', () => {
  it('gives ★3 for the first prediction', () => {
    expect([1, 2, 3, 7].map(rateTries)).toEqual([3, 2, 1, 1]);
  });
});

describe('levels', () => {
  it('have unique ids in order', () => {
    expect(OKASHI_LEVELS.map((l) => l.id)).toEqual(OKASHI_LEVELS.map((_, i) => i + 1));
  });

  it('start trivially small for a six-year-old', () => {
    const first = OKASHI_LEVELS[0];
    expect(first.kind).toBe('share');
    expect(first.candies).toBeLessThanOrEqual(4);
  });

  for (const level of OKASHI_LEVELS) {
    describe(`stage ${level.id} ${level.title}`, () => {
      it('fits in the jar', () => {
        expect(level.candies).toBeGreaterThan(0);
        expect(level.candies).toBeLessThanOrEqual(MAX_CANDIES);
      });

      if (level.kind === 'choose') {
        it('offers plate counts that fit, with one even split and one that leaves some over', () => {
          expect(new Set(level.choices).size).toBe(level.choices.length);
          const results = level.choices.map((c) => runMachine(level, c));
          for (const [i, r] of results.entries()) {
            expect(level.choices[i]).toBeGreaterThanOrEqual(2);
            expect(level.choices[i]).toBeLessThanOrEqual(MAX_PLATES);
            expect(r.quotient).toBeGreaterThanOrEqual(1);
            expect(r.quotient).toBeLessThanOrEqual(MAX_PER_PLATE);
            expect(r.remainder).toBeLessThanOrEqual(REMAINDER_MAX);
          }
          expect(results.some((r) => r.remainder === 0)).toBe(true);
          expect(results.some((r) => r.remainder > 0)).toBe(true);
        });
      } else {
        it('has answers that are on the number pad and fit on the board', () => {
          const r = runMachine(level);
          expect(r.quotient).toBeGreaterThanOrEqual(1);
          expect(r.quotient).toBeLessThanOrEqual(ANSWER_MAX);
          expect(r.plates).toBeLessThanOrEqual(MAX_PLATES);
          expect(r.divisor).toBeGreaterThanOrEqual(2);
          expect(level.kind === 'group' ? level.size : r.quotient).toBeLessThanOrEqual(MAX_PER_PLATE);
          expect(r.remainder).toBeLessThanOrEqual(REMAINDER_MAX);
        });

        it('asks about the remainder exactly when there is one', () => {
          expect(level.askRemainder).toBe(runMachine(level).remainder > 0);
        });

        it('accepts the true answer', () => {
          const r = runMachine(level);
          expect(isCorrect(level, { answer: r.quotient, remainder: r.remainder }, r)).toBe(true);
        });
      }

      it('deals every candy exactly once', () => {
        const r = level.kind === 'choose' ? runMachine(level, level.choices[0]) : runMachine(level);
        const { plates, rest } = tally(r.steps);
        expect(r.steps.length).toBe(level.candies);
        expect(rest).toBe(r.remainder);
        expect(plates.size).toBe(r.plates);
        for (const n of plates.values()) expect(n).toBe(level.kind === 'group' ? r.divisor : r.quotient);
      });
    });
  }
});
