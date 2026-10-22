import type { FlowTrace, Piece, PieceKind, PipeLevel, Point, Side } from './types';

export const SIDES: Side[] = ['up', 'right', 'down', 'left'];
export const PIECE_KINDS: PieceKind[] = ['straight', 'corner', 'tee'];

export const DELTA: Record<Side, Point> = {
  up: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
};

/** Openings before turning: straight │, corner └, tee ┴. */
const BASE: Record<PieceKind, Side[]> = {
  straight: ['up', 'down'],
  corner: ['up', 'right'],
  tee: ['left', 'up', 'right'],
};

export const keyOf = (p: Point) => `${p.x},${p.y}`;

export function opposite(side: Side): Side {
  return SIDES[(SIDES.indexOf(side) + 2) % 4];
}

/** Turns a side clockwise by `quarterTurns`. Negative values turn it back. */
export function turn(side: Side, quarterTurns: number): Side {
  return SIDES[(((SIDES.indexOf(side) + quarterTurns) % 4) + 4) % 4];
}

export function openings(piece: Piece): Side[] {
  return BASE[piece.kind].map((s) => turn(s, piece.rot));
}

/** Rotations that give different shapes: a straight pipe only has two. */
export function distinctRotations(kind: PieceKind): number[] {
  return kind === 'straight' ? [0, 1] : [0, 1, 2, 3];
}

/** Every pipe on the board: bolted ones, the child's turned ones, and the ones the child placed. */
export type Layout = Map<string, Piece>;

export function initialTurns(level: PipeLevel): Map<string, number> {
  return new Map(level.turnable.map((t) => [keyOf(t), t.piece.rot]));
}

export function buildLayout(level: PipeLevel, turns: Map<string, number>, placed: Map<string, Piece>): Layout {
  const layout: Layout = new Map();
  for (const f of level.fixed) layout.set(keyOf(f), f.piece);
  for (const t of level.turnable) layout.set(keyOf(t), { kind: t.piece.kind, rot: turns.get(keyOf(t)) ?? t.piece.rot });
  for (const [k, p] of placed) layout.set(k, p);
  return layout;
}

function inside(level: PipeLevel, p: Point): boolean {
  return p.x >= 0 && p.y >= 0 && p.x < level.w && p.y < level.h;
}

/** Grass where the child may put a pipe: not the tap, a flower, a rock, or a pre-placed pipe. */
export function isOpenGround(level: PipeLevel, p: Point): boolean {
  if (!inside(level, p)) return false;
  const k = keyOf(p);
  if (keyOf(level.source) === k) return false;
  if (level.goals.some((g) => keyOf(g) === k)) return false;
  if (level.rocks.some((r) => keyOf(r) === k)) return false;
  if (level.fixed.some((f) => keyOf(f) === k)) return false;
  return !level.turnable.some((t) => keyOf(t) === k);
}

/**
 * Pours water from the tap and follows every opening breadth-first, so branches advance together.
 * Any opening that does not lead into a matching pipe or a flower leaks.
 */
export function flow(level: PipeLevel, layout: Layout): FlowTrace {
  const goalKeys = new Set(level.goals.map(keyOf));
  const sourceKey = keyOf(level.source);
  const trace: FlowTrace = { fills: [], goals: [], leaks: [], outcome: 'win', lastDepth: 1 };
  const filled = new Set<string>();
  const reached = new Set<string>();
  // Water leaving `from` through `side`, arriving at depth `depth`.
  const queue: { from: Point; side: Side; depth: number }[] = [{ from: level.source, side: level.source.out, depth: 1 }];

  while (queue.length > 0) {
    const { from, side, depth } = queue.shift()!;
    const to = { x: from.x + DELTA[side].x, y: from.y + DELTA[side].y };
    const k = keyOf(to);
    const entry = opposite(side);
    trace.lastDepth = Math.max(trace.lastDepth, depth);

    if (goalKeys.has(k)) {
      if (!reached.has(k)) {
        reached.add(k);
        trace.goals.push({ ...to, depth });
      }
      continue;
    }
    const piece = inside(level, to) && k !== sourceKey ? layout.get(k) : undefined;
    if (!piece || !openings(piece).includes(entry)) {
      trace.leaks.push({ x: from.x, y: from.y, side, depth: depth - 1 });
      continue;
    }
    if (filled.has(k)) continue;
    filled.add(k);
    trace.fills.push({ ...to, depth, from: entry });
    trace.lastDepth = Math.max(trace.lastDepth, depth + 1);
    for (const out of openings(piece)) {
      if (out !== entry) queue.push({ from: to, side: out, depth: depth + 1 });
    }
  }

  if (trace.leaks.length > 0) trace.outcome = 'leak';
  else if (reached.size < goalKeys.size) trace.outcome = 'dry';
  return trace;
}

/** ★3 on the first pour, ★2 on the second, ★1 after that: think it through before pressing the button. */
export function rateTries(tries: number): 1 | 2 | 3 {
  return tries <= 1 ? 3 : tries === 2 ? 2 : 1;
}

/**
 * Picks the rotation for a freshly placed pipe that joins the most neighbours,
 * so a six-year-old usually gets a sensible pipe without having to turn it.
 */
export function bestRotation(level: PipeLevel, layout: Layout, at: Point, kind: PieceKind): number {
  const goalKeys = new Set(level.goals.map(keyOf));
  const rockKeys = new Set(level.rocks.map(keyOf));
  let best = 0;
  let bestScore = -Infinity;
  for (const rot of distinctRotations(kind)) {
    let score = 0;
    for (const side of openings({ kind, rot })) {
      const n = { x: at.x + DELTA[side].x, y: at.y + DELTA[side].y };
      const k = keyOf(n);
      const back = opposite(side);
      if (!inside(level, n) || rockKeys.has(k)) score -= 1;
      else if (k === keyOf(level.source)) score += level.source.out === back ? 2 : -1;
      else if (goalKeys.has(k)) score += 1;
      else {
        const p = layout.get(k);
        if (p) score += openings(p).includes(back) ? 2 : -1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = rot;
    }
  }
  return best;
}

export interface Solution {
  turns: Map<string, number>;
  placed: Map<string, Piece>;
}

/**
 * Depth-first search that follows the water: every open end must be closed by a pipe from the hand,
 * a turned pipe, a bolted pipe, or a flower. Used by the tests to prove each stage can be solved.
 */
export function solve(level: PipeLevel): Solution | null {
  const fixed = new Map(level.fixed.map((f) => [keyOf(f), f.piece]));
  const turnable = new Map(level.turnable.map((t) => [keyOf(t), t.piece.kind]));
  const goalKeys = new Set(level.goals.map(keyOf));
  const sourceKey = keyOf(level.source);

  type End = { at: Point; entry: Side };
  const step = (from: Point, side: Side): End => ({ at: { x: from.x + DELTA[side].x, y: from.y + DELTA[side].y }, entry: opposite(side) });

  const search = (
    pending: End[],
    assigned: Map<string, Piece>,
    hand: Partial<Record<PieceKind, number>>,
    reached: Set<string>,
    flowing: Set<string>,
  ): Solution | null => {
    if (pending.length === 0) {
      if (reached.size < goalKeys.size) return null;
      const turns = new Map<string, number>();
      const placed = new Map<string, Piece>();
      for (const [k, p] of assigned) (turnable.has(k) ? turns.set(k, p.rot) : placed.set(k, p));
      return { turns, placed };
    }
    const [{ at, entry }, ...rest] = pending;
    const k = keyOf(at);
    if (goalKeys.has(k)) return search(rest, assigned, hand, new Set([...reached, k]), flowing);
    if (!inside(level, at) || k === sourceKey) return null;

    const existing = fixed.get(k) ?? assigned.get(k);
    if (existing) {
      if (!openings(existing).includes(entry)) return null;
      if (flowing.has(k)) return search(rest, assigned, hand, reached, flowing);
      // A bolted pipe reached for the first time carries the water on.
      const ends = openings(existing).filter((s) => s !== entry).map((s) => step(at, s));
      return search([...rest, ...ends], assigned, hand, reached, new Set([...flowing, k]));
    }

    const options: { piece: Piece; hand: typeof hand }[] = [];
    const turnKind = turnable.get(k);
    if (turnKind) {
      for (const rot of distinctRotations(turnKind)) options.push({ piece: { kind: turnKind, rot }, hand });
    } else if (isOpenGround(level, at)) {
      for (const kind of PIECE_KINDS) {
        if ((hand[kind] ?? 0) <= 0) continue;
        for (const rot of distinctRotations(kind)) options.push({ piece: { kind, rot }, hand: { ...hand, [kind]: (hand[kind] ?? 0) - 1 } });
      }
    }
    for (const option of options) {
      const outs = openings(option.piece);
      if (!outs.includes(entry)) continue;
      const next = new Map(assigned).set(k, option.piece);
      const ends = outs.filter((s) => s !== entry).map((s) => step(at, s));
      const found = search([...rest, ...ends], next, option.hand, reached, new Set([...flowing, k]));
      if (found) return found;
    }
    return null;
  };

  return search([step(level.source, level.source.out)], new Map(), { ...level.hand }, new Set(), new Set());
}
