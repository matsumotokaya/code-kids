import type { Dir, ItemColor, ItemRun, Part, PartKind, Point, RunTrace, SortLevel } from './types';

export const DIRS: Dir[] = ['up', 'right', 'down', 'left'];
export const PART_KINDS: PartKind[] = ['belt', 'sort-red', 'sort-blue', 'sort-yellow'];
export const ITEM_COLORS: ItemColor[] = ['red', 'blue', 'yellow'];

/** Ticks between two items leaving the chute, so a gap stays between them on the belts. */
export const SPACING = 2;

export const DELTA: Record<Dir, Point> = {
  up: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
};

export const keyOf = (p: Point) => `${p.x},${p.y}`;

export function opposite(dir: Dir): Dir {
  return DIRS[(DIRS.indexOf(dir) + 2) % 4];
}

/** The way a part points; `rot` may be any integer. */
export function dirOf(part: Part): Dir {
  return DIRS[((part.rot % 4) + 4) % 4];
}

export function sorterColor(kind: PartKind): ItemColor | null {
  return kind === 'belt' ? null : (kind.slice(5) as ItemColor);
}

const step = (p: Point, dir: Dir): Point => ({ x: p.x + DELTA[dir].x, y: p.y + DELTA[dir].y });

/** Where an item leaves a part, given the way it was moving when it arrived. */
export function nextDir(part: Part, color: ItemColor, heading: Dir): Dir {
  const sorts = sorterColor(part.kind);
  return sorts === null || sorts === color ? dirOf(part) : heading;
}

/** Every part on the board: bolted ones, the child's turned ones, and the ones the child placed. */
export type Layout = Map<string, Part>;

export function initialTurns(level: SortLevel): Map<string, number> {
  return new Map(level.turnable.map((t) => [keyOf(t), t.part.rot]));
}

export function buildLayout(level: SortLevel, turns: Map<string, number>, placed: Map<string, Part>): Layout {
  const layout: Layout = new Map();
  for (const f of level.fixed) layout.set(keyOf(f), f.part);
  for (const t of level.turnable) layout.set(keyOf(t), { kind: t.part.kind, rot: turns.get(keyOf(t)) ?? t.part.rot });
  for (const [k, p] of placed) layout.set(k, p);
  return layout;
}

export function inside(level: SortLevel, p: Point): boolean {
  return p.x >= 0 && p.y >= 0 && p.x < level.w && p.y < level.h;
}

/** Floor where the child may put a part: not the chute, a box, a wall, or a pre-placed part. */
export function isOpenFloor(level: SortLevel, p: Point): boolean {
  if (!inside(level, p)) return false;
  const k = keyOf(p);
  if (keyOf(level.chute) === k) return false;
  if (level.boxes.some((b) => keyOf(b) === k)) return false;
  if (level.walls.some((w) => keyOf(w) === k)) return false;
  if (level.fixed.some((f) => keyOf(f) === k)) return false;
  return !level.turnable.some((t) => keyOf(t) === k);
}

/** Follows one item from the chute until it lands in a box or something goes wrong. */
function travel(level: SortLevel, layout: Layout, color: ItemColor, start: number): ItemRun {
  const chuteKey = keyOf(level.chute);
  const walls = new Set(level.walls.map(keyOf));
  const path: Point[] = [{ x: level.chute.x, y: level.chute.y }];
  const seen = new Set<string>();
  let at: Point = level.chute;
  let heading = level.chute.out;
  let end: ItemRun['end'];

  for (;;) {
    const n = step(at, heading);
    const k = keyOf(n);
    const box = level.boxes.find((b) => keyOf(b) === k);
    if (box) {
      path.push(n);
      end = box.color === color ? 'boxed' : 'wrong';
      break;
    }
    if (!inside(level, n)) {
      path.push(n);
      end = 'fell';
      break;
    }
    if (walls.has(k) || k === chuteKey) {
      path.push(at);
      end = 'bump';
      break;
    }
    const part = layout.get(k);
    path.push(n);
    if (!part) {
      end = 'fell';
      break;
    }
    const state = `${k}|${heading}`;
    if (seen.has(state)) {
      end = 'loop';
      break;
    }
    seen.add(state);
    at = n;
    heading = nextDir(part, color, heading);
  }
  return { color, start, path, end, endTick: start + path.length - 1 };
}

/**
 * Runs the machine. Parts never change while it runs, so items cannot affect each other
 * and each one is followed on its own, leaving the chute `SPACING` ticks after the one before.
 * The machine stops at the first mishap, so the child sees exactly what went wrong.
 */
export function run(level: SortLevel, layout: Layout): RunTrace {
  const items = level.items.map((color, i) => travel(level, layout, color, i * SPACING));
  let failItem: number | null = null;
  items.forEach((item, i) => {
    if (item.end !== 'boxed' && (failItem === null || item.endTick < items[failItem].endTick)) failItem = i;
  });
  if (failItem === null) {
    return { items, outcome: 'win', lastTick: Math.max(0, ...items.map((i) => i.endTick)), failItem: null };
  }
  const failed = items[failItem] as ItemRun;
  return { items, outcome: failed.end as Exclude<ItemRun['end'], 'boxed'>, lastTick: failed.endTick, failItem };
}

/**
 * Stars come from which press of 「うごかす！」 succeeded, as in みずのみち: ★3 on the first run, ★2 on the second, ★1 after that.
 * Counting parts against a par would punish the spare belts some stages hand out on purpose;
 * counting tries rewards following the items in your head before pressing the button, which is the point of the game.
 */
export function rateTries(tries: number): 1 | 2 | 3 {
  return tries <= 1 ? 3 : tries === 2 ? 2 : 1;
}

/** Does something at `from` push items in direction `dir` (towards the cell next to it)? */
function feeds(level: SortLevel, layout: Layout, from: Point, dir: Dir): boolean {
  if (keyOf(from) === keyOf(level.chute)) return level.chute.out === dir;
  const p = layout.get(keyOf(from));
  return !!p && dirOf(p) === dir;
}

/**
 * Picks the direction for a freshly placed part so a six-year-old rarely has to turn it:
 * a belt carries on from whatever feeds it towards a box or another part,
 * and a sorter points its colour at a matching box rather than straight on.
 */
export function bestRotation(level: SortLevel, layout: Layout, at: Point, kind: PartKind): number {
  const sorts = sorterColor(kind);
  const walls = new Set(level.walls.map(keyOf));
  let best = 0;
  let bestScore = -Infinity;
  DIRS.forEach((dir, rot) => {
    const n = step(at, dir);
    const k = keyOf(n);
    let score = 0;
    const box = level.boxes.find((b) => keyOf(b) === k);
    if (box) score += sorts === null ? 3 : box.color === sorts ? 4 : -1;
    else if (!inside(level, n) || walls.has(k) || k === keyOf(level.chute)) score -= 2;
    else {
      const p = layout.get(k);
      if (p) score += dirOf(p) === opposite(dir) ? -2 : 2;
    }
    // Something behind pushes items in this direction: a belt should carry on, a sorter should turn them.
    if (feeds(level, layout, step(at, opposite(dir)), dir)) score += sorts === null ? 1 : -2;
    if (score > bestScore) {
      bestScore = score;
      best = rot;
    }
  });
  return best;
}

export interface Solution {
  turns: Map<string, number>;
  placed: Map<string, Part>;
}

/**
 * Depth-first search that follows the items one by one: whenever an item reaches empty floor or a turnable part
 * that has not been decided yet, it tries every part from the hand (or every turn) there.
 * Used by the tests to prove each stage can be solved with the parts it gives.
 */
export function solve(level: SortLevel): Solution | null {
  const fixed = new Map(level.fixed.map((f) => [keyOf(f), f.part]));
  const turnable = new Map(level.turnable.map((t) => [keyOf(t), t.part.kind]));
  const walls = new Set(level.walls.map(keyOf));
  const chuteKey = keyOf(level.chute);
  type Hand = Partial<Record<PartKind, number>>;

  const finish = (assigned: Map<string, Part>): Solution => {
    const turns = new Map<string, number>();
    const placed = new Map<string, Part>();
    for (const [k, p] of assigned) (turnable.has(k) ? turns.set(k, p.rot) : placed.set(k, p));
    return { turns, placed };
  };

  const startItem = (i: number, assigned: Map<string, Part>, hand: Hand): Solution | null =>
    i === level.items.length ? finish(assigned) : follow(i, level.chute, level.chute.out, new Set(), assigned, hand);

  const follow = (i: number, at: Point, heading: Dir, seen: Set<string>, assigned: Map<string, Part>, hand: Hand): Solution | null => {
    const color = level.items[i];
    const n = step(at, heading);
    const k = keyOf(n);
    const box = level.boxes.find((b) => keyOf(b) === k);
    if (box) return box.color === color ? startItem(i + 1, assigned, hand) : null;
    if (!inside(level, n) || walls.has(k) || k === chuteKey) return null;
    const state = `${k}|${heading}`;
    if (seen.has(state)) return null;
    const nextSeen = new Set(seen).add(state);

    const existing = fixed.get(k) ?? assigned.get(k);
    if (existing) return follow(i, n, nextDir(existing, color, heading), nextSeen, assigned, hand);

    const options: { part: Part; hand: Hand }[] = [];
    const turnKind = turnable.get(k);
    if (turnKind) {
      for (let rot = 0; rot < 4; rot++) options.push({ part: { kind: turnKind, rot }, hand });
    } else {
      for (const kind of PART_KINDS) {
        if ((hand[kind] ?? 0) <= 0) continue;
        for (let rot = 0; rot < 4; rot++) options.push({ part: { kind, rot }, hand: { ...hand, [kind]: (hand[kind] ?? 0) - 1 } });
      }
    }
    for (const option of options) {
      const out = nextDir(option.part, color, heading);
      // Sending an item straight back the way it came only retraces its trip into the chute or round in a loop.
      if (out === opposite(heading)) continue;
      const found = follow(i, n, out, nextSeen, new Map(assigned).set(k, option.part), option.hand);
      if (found) return found;
    }
    return null;
  };

  return startItem(0, new Map(), { ...level.hand });
}
