import { describe, expect, it } from 'vitest';
import { clampToCircle, compactStroke, images, noteStep, randomCurve, toPatternFrame, trimStrokes, type Stroke } from './pattern';

const close = (a: number, b: number) => expect(a).toBeCloseTo(b, 6);

describe('images', () => {
  it('makes n rotations, each with a left-right mirror', () => {
    expect(images({ x: 0.5, y: 0.2 }, 6)).toHaveLength(12);
  });

  it('with one copy is plain left-right symmetry', () => {
    const [a, b] = images({ x: 0.5, y: 0.2 }, 1);
    close(a.x, 0.5);
    close(a.y, 0.2);
    close(b.x, -0.5);
    close(b.y, 0.2);
  });

  it('keeps every image at the same distance from the centre', () => {
    for (const p of images({ x: 0.3, y: -0.4 }, 7)) close(Math.hypot(p.x, p.y), 0.5);
  });
});

describe('toPatternFrame', () => {
  it('undoes the spin so a held finger draws a circle on a spinning pattern', () => {
    const p = toPatternFrame(1, 0, Math.PI / 2);
    close(p.x, 0);
    close(p.y, -1);
  });
});

describe('clampToCircle', () => {
  it('pulls points outside the circle back to its edge', () => {
    const p = clampToCircle(3, 4);
    close(Math.hypot(p.x, p.y), 1);
    expect(clampToCircle(0.1, 0.2)).toEqual({ x: 0.1, y: 0.2 });
  });
});

describe('noteStep', () => {
  it('is highest at the centre and lowest at the edge', () => {
    expect(noteStep(0, 0)).toBe(9);
    expect(noteStep(1, 0)).toBe(0);
    expect(noteStep(5, 5)).toBe(0);
  });
});

describe('randomCurve', () => {
  it('stays inside the circle', () => {
    let seed = 1;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 50; i++) {
      const pts = randomCurve(rand);
      expect(pts.length).toBeGreaterThan(40);
      for (const p of pts) expect(Math.hypot(p.x, p.y)).toBeLessThanOrEqual(1 + 1e-9);
    }
  });
});

describe('trimStrokes', () => {
  const s = (id: string, n: number): Stroke => ({ id, pts: Array.from({ length: n }, () => ({ x: 0, y: 0, h: 0 })) });

  it('drops the oldest strokes beyond the point budget but keeps the newest', () => {
    expect(trimStrokes([s('a', 5), s('b', 5), s('c', 5)], 10).map((x) => x.id)).toEqual(['b', 'c']);
    expect(trimStrokes([s('a', 50)], 10).map((x) => x.id)).toEqual(['a']);
  });

  it('returns the same array when within budget', () => {
    const strokes = [s('a', 3)];
    expect(trimStrokes(strokes, 10)).toBe(strokes);
  });
});

describe('compactStroke', () => {
  it('rounds for storage without changing identity', () => {
    const c = compactStroke({ id: 'x', pts: [{ x: 0.123456, y: -0.98765, h: 12.7 }] });
    expect(c).toEqual({ id: 'x', pts: [{ x: 0.123, y: -0.988, h: 13 }] });
  });
});
