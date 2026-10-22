import { describe, expect, it } from 'vitest';
import {
  area,
  bedAt,
  bedCells,
  bedsLeft,
  cardStamp,
  countAnswer,
  fitBed,
  keyOf,
  MAX_FACTOR,
  MAX_SIDE,
  plant,
  productText,
  rateTries,
  rowTotals,
  soilCells,
  solve,
  sumText,
} from './engine';
import { GARDEN_LEVELS } from './levels';
import type { FillLevel } from './types';

const plot = (w: number, h: number, stones: { x: number; y: number }[] = [], beds = 3): FillLevel => ({
  id: 0,
  title: '',
  hint: '',
  kind: 'fill',
  w,
  h,
  stones,
  offer: { mode: 'pick', rows: [1, 2, 3], cols: [1, 2, 3], beds },
});

describe('bedCells', () => {
  it('walks row by row, left to right', () => {
    expect(bedCells({ x: 1, y: 2, rows: 2, cols: 3 }).map(keyOf)).toEqual(['1,2', '2,2', '3,2', '1,3', '2,3', '3,3']);
  });
});

describe('fitBed', () => {
  it('anchors the top-left corner on the tapped cell and slides back onto the board', () => {
    const level = plot(4, 3);
    expect(fitBed(level, { x: 1, y: 0 }, { rows: 2, cols: 2 })).toEqual({
      x: 1,
      y: 0,
      rows: 2,
      cols: 2,
    });
    expect(fitBed(level, { x: 3, y: 2 }, { rows: 2, cols: 3 })).toEqual({
      x: 1,
      y: 1,
      rows: 2,
      cols: 3,
    });
  });
});

describe('bedAt', () => {
  it('finds the bed drawn on top', () => {
    const beds = [
      { x: 0, y: 0, rows: 2, cols: 2 },
      { x: 1, y: 1, rows: 2, cols: 2 },
    ];
    expect(bedAt(beds, { x: 0, y: 0 })).toBe(0);
    expect(bedAt(beds, { x: 1, y: 1 })).toBe(1);
    expect(bedAt(beds, { x: 3, y: 3 })).toBe(-1);
  });
});

describe('plant', () => {
  it('fills the plot exactly and counts within each bed', () => {
    const level = plot(3, 2);
    const run = plant(level, [
      { x: 0, y: 0, rows: 2, cols: 2 },
      { x: 2, y: 0, rows: 2, cols: 1 },
    ]);
    expect(run.outcome).toBe('win');
    expect(run.steps.map((s) => s.n)).toEqual([1, 2, 3, 4, 1, 2]);
    expect(run.steps.map((s) => s.total)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(run.steps.map((s) => s.bed)).toEqual([0, 0, 0, 0, 1, 1]);
  });

  it('stops at a stone', () => {
    const run = plant(plot(3, 1, [{ x: 2, y: 0 }]), [{ x: 0, y: 0, rows: 1, cols: 3 }]);
    expect(run.outcome).toBe('stone');
    expect(run.problem).toEqual({ x: 2, y: 0, bed: 0 });
    expect(run.steps).toHaveLength(2);
  });

  it('stops off the board too', () => {
    expect(plant(plot(2, 1), [{ x: 1, y: 0, rows: 1, cols: 2 }]).outcome).toBe('stone');
  });

  it('stops where two beds overlap', () => {
    const run = plant(plot(3, 1), [
      { x: 0, y: 0, rows: 1, cols: 2 },
      { x: 1, y: 0, rows: 1, cols: 2 },
    ]);
    expect(run.outcome).toBe('overlap');
    expect(run.problem).toEqual({ x: 1, y: 0, bed: 1 });
  });

  it('reports the soil left empty', () => {
    const run = plant(plot(3, 1), [{ x: 0, y: 0, rows: 1, cols: 2 }]);
    expect(run.outcome).toBe('gap');
    expect(run.gaps).toEqual([{ x: 2, y: 0 }]);
  });
});

describe('solve', () => {
  it('fills an L with two beds but not one', () => {
    const stones = [{ x: 2, y: 0 }];
    expect(solve(plot(3, 2, stones, 2))).not.toBeNull();
    expect(solve(plot(3, 2, stones, 1))).toBeNull();
  });
});

describe('text', () => {
  it('writes たて × よこ and the sum', () => {
    expect(productText({ rows: 2, cols: 3 })).toBe('2 × 3 = 6');
    expect(sumText([{ rows: 2, cols: 3 }])).toBe('6');
    expect(
      sumText([
        { rows: 2, cols: 3 },
        { rows: 2, cols: 2 },
      ]),
    ).toBe('6 + 4 = 10');
    expect(rowTotals({ rows: 3, cols: 4 })).toEqual([4, 8, 12]);
  });
});

describe('rateTries', () => {
  it('gives ★3 for the first run', () => {
    expect([1, 2, 3, 7].map(rateTries)).toEqual([3, 2, 1, 1]);
  });
});

describe('levels', () => {
  it('have unique ids in order', () => {
    expect(GARDEN_LEVELS.map((l) => l.id)).toEqual(GARDEN_LEVELS.map((_, i) => i + 1));
  });

  it('start trivially easy for a six-year-old: one row', () => {
    const [first, second] = GARDEN_LEVELS;
    expect(first.h).toBe(1);
    expect(second.h).toBe(1);
  });

  for (const level of GARDEN_LEVELS) {
    describe(`stage ${level.id} ${level.title}`, () => {
      it('keeps the board small enough for big cells', () => {
        expect(level.w).toBeGreaterThanOrEqual(1);
        expect(level.h).toBeGreaterThanOrEqual(1);
        expect(level.w).toBeLessThanOrEqual(MAX_SIDE);
        expect(level.h).toBeLessThanOrEqual(MAX_SIDE);
      });

      if (level.kind === 'count') {
        it('draws beds that sit on the board without overlapping, inside the 9 × 9 table', () => {
          expect(plant(level, level.beds).outcome).toBe('win');
          for (const b of level.beds) {
            expect(b.rows).toBeLessThanOrEqual(MAX_FACTOR);
            expect(b.cols).toBeLessThanOrEqual(MAX_FACTOR);
          }
        });

        it('offers the right answer exactly once among different choices', () => {
          expect(new Set(level.choices).size).toBe(level.choices.length);
          expect(level.choices.filter((c) => c === countAnswer(level))).toHaveLength(1);
          expect(countAnswer(level)).toBe(level.beds.reduce((s, b) => s + area(b), 0));
        });
      } else {
        it('keeps the stones on the board and leaves soil to fill', () => {
          const keys = level.stones.map(keyOf);
          expect(new Set(keys).size).toBe(keys.length);
          for (const s of level.stones) {
            expect(s.x).toBeLessThan(level.w);
            expect(s.y).toBeLessThan(level.h);
          }
          expect(soilCells(level).length).toBeGreaterThan(0);
        });

        it('offers stamps inside the 9 × 9 table that fit on the board', () => {
          const offer = level.offer;
          const stamps =
            offer.mode === 'pick' ? offer.rows.flatMap((rows) => offer.cols.map((cols) => ({ rows, cols }))) : offer.cards.map((c) => cardStamp(c, false));
          for (const s of stamps) {
            expect(s.rows).toBeGreaterThanOrEqual(1);
            expect(s.cols).toBeGreaterThanOrEqual(1);
            expect(s.rows).toBeLessThanOrEqual(MAX_FACTOR);
            expect(s.cols).toBeLessThanOrEqual(MAX_FACTOR);
            expect(Math.min(s.rows, s.cols)).toBeLessThanOrEqual(Math.min(level.w, level.h));
          }
          if (level.offer.mode === 'pick') {
            expect(new Set(level.offer.rows).size).toBe(level.offer.rows.length);
            expect(new Set(level.offer.cols).size).toBe(level.offer.cols.length);
          }
        });

        it('can be solved with what it offers', () => {
          const beds = solve(level);
          expect(beds).not.toBeNull();
          expect(plant(level, beds!).outcome).toBe('win');
          expect(bedsLeft(level, beds!)).toBeGreaterThanOrEqual(0);
          if (level.offer.mode === 'set') {
            const cards = beds!.map((b) => b.card);
            expect(new Set(cards).size).toBe(cards.length);
          }
        });

        it('is not already solved before the child does anything', () => {
          expect(plant(level, []).outcome).toBe('gap');
        });
      }
    });
  }

  it('needs the card turned on the commutativity stage', () => {
    const level = GARDEN_LEVELS.find((l) => l.kind === 'fill' && l.offer.mode === 'set' && l.offer.cards.some((c) => c.turnable)) as FillLevel;
    expect(level).toBeDefined();
    const stuck: FillLevel = {
      ...level,
      offer: {
        mode: 'set',
        cards: level.offer.mode === 'set' ? level.offer.cards.map((c) => ({ ...c, turnable: false })) : [],
      },
    };
    expect(solve(stuck)).toBeNull();
  });

  it('needs more than one bed on the L-shaped stage', () => {
    const level = GARDEN_LEVELS.find((l) => l.title === 'L の かたち') as FillLevel;
    expect(
      solve({
        ...level,
        offer: { ...level.offer, beds: 1 } as FillLevel['offer'],
      }),
    ).toBeNull();
  });
});
