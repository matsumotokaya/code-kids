/**
 * Pure geometry for the kaleidoscope. Points live in a "pattern frame": the unit
 * circle centred on the origin, independent of screen size and of the spin angle.
 */

export interface Pt {
  x: number;
  y: number;
  /** Hue in degrees. */
  h: number;
}

export interface Stroke {
  id: string;
  pts: Pt[];
}

/** 'rainbow' cycles hue along the stroke; a number is a fixed hue. */
export type ColorMode = 'rainbow' | number;

export const MIN_COPIES = 1;
export const MAX_COPIES = 12;

/** Notes in the chime scale (see sfx.chime); pentatonic, so any sequence sounds pleasant. */
export const NOTE_STEPS = 10;

/**
 * Every image of a point under the pattern's symmetry: `n` rotations, each also
 * mirrored left-right. With n = 1 that is plain left-right symmetry, like a butterfly.
 */
export function images(p: { x: number; y: number }, n: number): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  for (let k = 0; k < n; k++) {
    const a = (2 * Math.PI * k) / n;
    const c = Math.cos(a);
    const s = Math.sin(a);
    out.push({ x: p.x * c - p.y * s, y: p.x * s + p.y * c });
    out.push({ x: -p.x * c - p.y * s, y: -p.x * s + p.y * c });
  }
  return out;
}

/** Keeps a point inside the drawing circle. */
export function clampToCircle(x: number, y: number): { x: number; y: number } {
  const r = Math.hypot(x, y);
  return r <= 1 ? { x, y } : { x: x / r, y: y / r };
}

/** Rotates a screen-frame point into the pattern frame when the pattern is spun by `angle`. */
export function toPatternFrame(x: number, y: number, angle: number): { x: number; y: number } {
  const c = Math.cos(-angle);
  const s = Math.sin(-angle);
  return { x: x * c - y * s, y: x * s + y * c };
}

/** Near the centre sounds high, near the edge sounds low. */
export function noteStep(x: number, y: number): number {
  const r = Math.min(1, Math.hypot(x, y));
  return Math.min(NOTE_STEPS - 1, Math.floor((1 - r) * NOTE_STEPS));
}

/** Smooth curve through the control points (Catmull-Rom), `perSegment` samples between each pair. */
export function smoothCurve(ctrl: { x: number; y: number }[], perSegment: number): { x: number; y: number }[] {
  if (ctrl.length < 2) return ctrl.slice();
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < ctrl.length - 1; i++) {
    const p0 = ctrl[Math.max(0, i - 1)];
    const p1 = ctrl[i];
    const p2 = ctrl[i + 1];
    const p3 = ctrl[Math.min(ctrl.length - 1, i + 2)];
    for (let j = 0; j < perSegment; j++) {
      const t = j / perSegment;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push({ x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y) });
    }
  }
  out.push(ctrl[ctrl.length - 1]);
  return out;
}

/**
 * A random flowing curve for the "おまかせ" button: a few control points that sweep
 * around the centre at varying distances, smoothed and kept inside the circle.
 */
export function randomCurve(rand: () => number = Math.random): { x: number; y: number }[] {
  const count = 4 + Math.floor(rand() * 3);
  let angle = rand() * Math.PI * 2;
  const step = (0.35 + rand() * 0.5) * (rand() < 0.5 ? -1 : 1);
  const ctrl: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    const r = 0.18 + rand() * 0.74;
    ctrl.push({ x: r * Math.cos(angle), y: r * Math.sin(angle) });
    angle += step;
  }
  return smoothCurve(ctrl, 18).map((p) => clampToCircle(p.x, p.y));
}

/** Drops the oldest strokes so the saved drawing stays small enough for localStorage. */
export function trimStrokes(strokes: Stroke[], maxPoints: number): Stroke[] {
  let total = strokes.reduce((sum, s) => sum + s.pts.length, 0);
  let start = 0;
  while (total > maxPoints && start < strokes.length - 1) {
    total -= strokes[start].pts.length;
    start++;
  }
  return start === 0 ? strokes : strokes.slice(start);
}

/** Rounds coordinates for storage; the difference is far below one pixel. */
export function compactStroke(stroke: Stroke): Stroke {
  return {
    id: stroke.id,
    pts: stroke.pts.map((p) => ({ x: Math.round(p.x * 1000) / 1000, y: Math.round(p.y * 1000) / 1000, h: Math.round(p.h) })),
  };
}
