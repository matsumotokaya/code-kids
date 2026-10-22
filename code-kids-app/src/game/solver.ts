import { DIRS, allowedTimes, inBounds, keyOf, stepFrom } from './engine';
import type { Dir, Level, LoopCount, Point, Times } from './types';

interface State {
  pos: Point;
  mask: number;
  depth: number;
}

/**
 * Minimum number of cards needed to collect every star, or null when the level cannot be solved.
 *
 * Levels without くりかえし use a plain breadth-first search. Levels with くりかえし use `minCardsWithLoops`,
 * which counts cards the same way the game does: each arrow is 1, くりかえし is 1, おわり is 1,
 * and 2かい / 3かい cost nothing (they are stuck onto an arrow).
 */
export function minCommands(level: Level): number | null {
  if (loopCounts(level).length > 0) return minCardsWithLoops(level);
  return minArrowCards(level);
}

function loopCounts(level: Level): LoopCount[] {
  const counts: LoopCount[] = [];
  if (level.cards.includes('loop2')) counts.push(2);
  if (level.cards.includes('loop3')) counts.push(3);
  return counts.length > 0 && level.cards.includes('end') ? counts : [];
}

/** Breadth-first search over (position, collected-stars) states; one arrow card per edge. */
function minArrowCards(level: Level): number | null {
  const rocks = new Set(level.rocks.map(keyOf));
  const water = new Set(level.water.map(keyOf));
  const starBit = new Map(level.stars.map((s, i) => [keyOf(s), 1 << i]));
  const full = (1 << level.stars.length) - 1;
  const times = allowedTimes(level);

  const startKey = `${keyOf(level.start)}|0`;
  const seen = new Set<string>([startKey]);
  const queue: State[] = [{ pos: level.start, mask: 0, depth: 0 }];

  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (cur.mask === full) return cur.depth;

    for (const dir of DIRS) {
      for (const n of times) {
        let pos = cur.pos;
        let mask = cur.mask;
        let ok = true;
        for (let t = 0; t < n; t++) {
          const next = stepFrom(pos, dir);
          if (!inBounds(next, level.size) || rocks.has(keyOf(next))) {
            ok = false;
            break;
          }
          pos = next;
          if (water.has(keyOf(pos))) {
            ok = false;
            break;
          }
          mask |= starBit.get(keyOf(pos)) ?? 0;
          if (mask === full) break;
        }
        if (!ok) continue;
        const k = `${keyOf(pos)}|${mask}`;
        if (seen.has(k)) continue;
        seen.add(k);
        queue.push({ pos, mask, depth: cur.depth + 1 });
      }
    }
  }
  return null;
}

const FAIL = -1;

/**
 * Exact minimum for levels with くりかえし, searching only programs the editor allows:
 * a sequence of top-level pieces, each either one arrow (cost 1) or a flat loop
 * くりかえし×k [body of arrows] おわり (cost 2 + body length). Loops cannot be nested.
 *
 * Every piece moves the game from one (position, collected stars) state to another, so a
 * Dijkstra search over those states with pieces as edges finds the cheapest program.
 * Loop bodies are enumerated depth-first, cutting a branch as soon as its first pass fails.
 * The search is bounded by `level.slots`: a program that does not fit in the strip cannot be played.
 */
export function minCardsWithLoops(level: Level): number | null {
  const n = level.size;
  const cells = n * n;
  const rocks = new Set(level.rocks.map(keyOf));
  const water = new Set(level.water.map(keyOf));
  const starBit = new Map(level.stars.map((s, i) => [keyOf(s), 1 << i]));
  const full = (1 << level.stars.length) - 1;
  const counts = loopCounts(level);
  const limit = level.slots;

  // next[cell * 4 + d]: the cell one step away, or FAIL for edge / rock / water.
  const next = new Int32Array(cells * 4);
  const bit = new Int32Array(cells);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const c = y * n + x;
      bit[c] = starBit.get(keyOf({ x, y })) ?? 0;
      DIRS.forEach((dir, d) => {
        const p = stepFrom({ x, y }, dir);
        const k = keyOf(p);
        next[c * 4 + d] = !inBounds(p, n) || rocks.has(k) || water.has(k) ? FAIL : p.y * n + p.x;
      });
    }
  }

  const moves: { d: number; times: Times }[] = [];
  DIRS.forEach((_dir: Dir, d) => {
    for (const times of allowedTimes(level)) moves.push({ d, times });
  });

  /** Applies one arrow. Returns the packed state cell * 2^stars + mask, or FAIL. Stops early on the last star. */
  const shift = level.stars.length;
  const apply = (cell: number, mask: number, d: number, times: number): number => {
    for (let t = 0; t < times; t++) {
      cell = next[cell * 4 + d];
      if (cell === FAIL) return FAIL;
      mask |= bit[cell];
      if (mask === full) break;
    }
    return (cell << shift) | mask;
  };

  const best = new Map<number, number>();
  const buckets: number[][] = Array.from({ length: limit + 1 }, () => []);
  const push = (state: number, cost: number) => {
    if (cost > limit) return;
    const prev = best.get(state);
    if (prev !== undefined && prev <= cost) return;
    best.set(state, cost);
    buckets[cost].push(state);
  };
  push(((level.start.y * n + level.start.x) << shift) | 0, 0);

  const body: number[] = [];
  for (let cost = 0; cost <= limit; cost++) {
    for (const state of buckets[cost]) {
      if (best.get(state) !== cost) continue;
      const mask0 = state & full;
      if (mask0 === full) return cost;
      const cell0 = state >> shift;

      for (const m of moves) {
        const r = apply(cell0, mask0, m.d, m.times);
        if (r !== FAIL) push(r, cost + 1);
      }

      const maxBody = limit - cost - 2;
      if (maxBody < 1) continue;

      // Extends the loop body one arrow at a time. `afterFirst` is the state after one pass of the body so far.
      const extend = (afterFirst: number) => {
        const len = body.length;
        if (len >= 1) {
          for (const k of counts) {
            let s = afterFirst;
            for (let pass = 2; pass <= k && s !== FAIL && (s & full) !== full; pass++) {
              let cell = s >> shift;
              let mask = s & full;
              for (const mi of body) {
                const r = apply(cell, mask, moves[mi].d, moves[mi].times);
                if (r === FAIL) {
                  s = FAIL;
                  break;
                }
                cell = r >> shift;
                mask = r & full;
                s = r;
                if (mask === full) break;
              }
            }
            if (s !== FAIL) push(s, cost + 2 + len);
          }
          // Winning during the first pass makes longer bodies pointless.
          if ((afterFirst & full) === full) return;
        }
        if (len >= maxBody) return;
        const cell = afterFirst >> shift;
        const mask = afterFirst & full;
        for (let mi = 0; mi < moves.length; mi++) {
          const r = apply(cell, mask, moves[mi].d, moves[mi].times);
          if (r === FAIL) continue;
          body.push(mi);
          extend(r);
          body.pop();
        }
      };
      extend(state);
    }
  }
  return null;
}
