import { describe, expect, it } from 'vitest';
import {
  diffPatterns,
  emptyPattern,
  expandLoop,
  fitPattern,
  INSTRUMENTS,
  isEditableStep,
  isPeriodic,
  judge,
  levelProblems,
  levelTarget,
  listenLaps,
  noteCount,
  notesAt,
  parsePattern,
  patternToSpec,
  playedPattern,
  randomGroove,
  rateTries,
  samePattern,
  toggleCell,
} from './engine';
import { RHYTHM_LEVELS } from './levels';
import type { RhythmLevel } from './types';

const basic: RhythmLevel = { id: 0, title: '', hint: '', steps: 8, rows: ['tan', 'don'], target: { don: 'x...x...', tan: '..x...x.' }, ghost: false };
const looped: RhythmLevel = { ...basic, steps: 16, target: { don: 'x...x...x...x...', tan: '..x...x...x...x.' }, loop: 4 };

describe('patterns', () => {
  it('parses and prints the x/. notation', () => {
    const p = parsePattern({ don: 'x..x', chi: 'xx' }, 4);
    expect(p.don).toEqual([true, false, false, true]);
    expect(p.chi).toEqual([true, true, false, false]);
    expect(p.pon).toEqual([false, false, false, false]);
    expect(patternToSpec(p)).toEqual({ pon: '....', chi: 'xx..', tan: '....', don: 'x..x' });
  });

  it('toggles one cell without touching the original', () => {
    const p = emptyPattern(8);
    const q = toggleCell(p, 'tan', 3);
    expect(p.tan[3]).toBe(false);
    expect(q.tan[3]).toBe(true);
    expect(toggleCell(q, 'tan', 3).tan[3]).toBe(false);
    expect(noteCount(q)).toBe(1);
    expect(notesAt(q, 3)).toEqual(['tan']);
  });

  it('fits saved data of any shape to the grid', () => {
    expect(fitPattern(undefined, 8)).toEqual(emptyPattern(8));
    const fitted = fitPattern({ don: [true, false, true] }, 4);
    expect(fitted.don).toEqual([true, false, true, false]);
    expect(fitted.pon).toHaveLength(4);
  });
});

describe('compare and diff', () => {
  it('matches only identical patterns', () => {
    const t = levelTarget(basic);
    expect(samePattern(t, parsePattern(basic.target, 8))).toBe(true);
    expect(samePattern(t, toggleCell(t, 'chi', 0))).toBe(false);
    expect(samePattern(emptyPattern(8), emptyPattern(16))).toBe(false);
  });

  it('lists missing and extra notes from left to right, top row first', () => {
    const child = parsePattern({ don: 'x.x.x...', tan: '......x.' }, 8);
    expect(diffPatterns(child, levelTarget(basic))).toEqual([
      { inst: 'tan', step: 2, kind: 'missing' },
      { inst: 'don', step: 2, kind: 'extra' },
    ]);
  });
});

describe('loops', () => {
  it('repeats the first unit', () => {
    const unit = parsePattern({ don: 'x..x' }, 4);
    expect(patternToSpec(expandLoop(unit, 4, 3)).don).toBe('x..xx..xx..x');
    expect(patternToSpec(expandLoop(parsePattern({ don: 'x.xxxx' }, 6), 2, 4)).don).toBe('x.x.x.x.');
  });

  it('knows whether a pattern repeats', () => {
    expect(isPeriodic(parsePattern({ don: 'x.x.x.x.' }, 8), 2)).toBe(true);
    expect(isPeriodic(parsePattern({ don: 'x.x.x.x.' }, 8), 4)).toBe(true);
    expect(isPeriodic(parsePattern({ don: 'x..xx...' }, 8), 4)).toBe(false);
    expect(isPeriodic(parsePattern({ don: 'x.x.x.x.' }, 8), 3)).toBe(false);
  });

  it('plays only the child part until the ×N button is on', () => {
    const edited = parsePattern({ don: 'x...', tan: '..x.' }, 16);
    expect(patternToSpec(playedPattern(looped, edited, false)).don).toBe('x...............');
    expect(patternToSpec(playedPattern(looped, edited, true)).don).toBe('x...x...x...x...');
    expect(isEditableStep(looped, 3)).toBe(true);
    expect(isEditableStep(looped, 4)).toBe(false);
    expect(isEditableStep(basic, 7)).toBe(true);
  });
});

describe('judge', () => {
  it('accepts the exact target and marks differences otherwise', () => {
    expect(judge(basic, levelTarget(basic), false)).toEqual({ ok: true, diffs: [], needLoop: false });
    const wrong = judge(basic, parsePattern({ don: 'x...x...' }, 8), false);
    expect(wrong.ok).toBe(false);
    expect(wrong.diffs.map((d) => `${d.inst}${d.step}${d.kind}`)).toEqual(['tan2missing', 'tan6missing']);
  });

  it('on a くりかえし stage, checks the child part first and then asks for the loop button', () => {
    const right = parsePattern({ don: 'x...', tan: '..x.' }, 16);
    expect(judge(looped, right, true).ok).toBe(true);
    expect(judge(looped, right, false)).toEqual({ ok: false, diffs: [], needLoop: true });
    const wrong = judge(looped, parsePattern({ don: 'x.x.', tan: '..x.' }, 16), true);
    expect(wrong.ok).toBe(false);
    expect(wrong.needLoop).toBe(false);
    expect(wrong.diffs).toEqual([{ inst: 'don', step: 2, kind: 'extra' }]);
  });
});

describe('stars', () => {
  it('rates by which くらべる matched', () => {
    expect(rateTries(1)).toBe(3);
    expect(rateTries(2)).toBe(2);
    expect(rateTries(3)).toBe(1);
    expect(rateTries(9)).toBe(1);
  });

  it('listens to about 16 steps', () => {
    expect(listenLaps(8)).toBe(2);
    expect(listenLaps(16)).toBe(1);
  });
});

describe('おまかせ', () => {
  it('always makes a full 8-step beat with every instrument', () => {
    for (const r of [0, 0.3, 0.6, 0.9999]) {
      const p = randomGroove(() => r);
      expect(p.don).toHaveLength(8);
      for (const inst of INSTRUMENTS) expect(p[inst].some(Boolean)).toBe(true);
    }
  });
});

describe('levels', () => {
  it('are numbered 1, 2, 3 … with no gaps', () => {
    expect(RHYTHM_LEVELS.map((l) => l.id)).toEqual(RHYTHM_LEVELS.map((_, i) => i + 1));
  });

  it.each(RHYTHM_LEVELS.map((l) => [l.id, l] as const))('stage %i is well formed and solvable', (_, level) => {
    expect(levelProblems(level)).toEqual([]);
    const target = levelTarget(level);
    // Not already solved by an empty grid.
    expect(judge(level, emptyPattern(level.steps), true).ok).toBe(false);
    // The intended answer wins: on くりかえし stages only the first part is tapped and the loop is on.
    const answer = level.loop ? playedPattern(level, target, false) : target;
    expect(judge(level, answer, !!level.loop).ok).toBe(true);
  });

  it('start trivially easy: one instrument, few notes, the answer drawn faintly', () => {
    for (const level of RHYTHM_LEVELS.slice(0, 2)) {
      expect(level.rows).toHaveLength(1);
      expect(level.ghost).toBe(true);
      expect(noteCount(levelTarget(level))).toBeLessThanOrEqual(4);
    }
  });

  it('ramp up: rows never shrink before the repetition stages, and all four rows appear', () => {
    const early = RHYTHM_LEVELS.filter((l) => !l.repeat && !l.loop);
    for (let i = 1; i < early.length; i++) expect(early[i].rows.length).toBeGreaterThanOrEqual(early[i - 1].rows.length);
    expect(early.some((l) => l.rows.length === 4)).toBe(true);
    expect(RHYTHM_LEVELS.some((l) => l.repeat === 2)).toBe(true);
    expect(RHYTHM_LEVELS.some((l) => l.repeat === 4)).toBe(true);
    expect(RHYTHM_LEVELS.some((l) => l.loop && l.steps === 16)).toBe(true);
  });

  it('the faint answer is only a training wheel at the start', () => {
    const firstPlain = RHYTHM_LEVELS.findIndex((l) => !l.ghost);
    expect(firstPlain).toBeGreaterThan(0);
    expect(RHYTHM_LEVELS.slice(firstPlain).every((l) => !l.ghost)).toBe(true);
  });

  it('flags a broken level', () => {
    expect(levelProblems({ ...basic, target: { don: 'x..' } })).not.toEqual([]);
    expect(levelProblems({ ...basic, rows: ['don'] })).not.toEqual([]);
    expect(levelProblems({ ...looped, target: { don: 'x...x...x...x.x.', tan: '..x...x...x...x.' } })).not.toEqual([]);
    expect(levelProblems({ ...basic, repeat: 2 })).not.toEqual([]);
  });
});
