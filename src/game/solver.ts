import { DIRS, allowedTimes, inBounds, keyOf, stepFrom } from './engine';
import type { Level, Point } from './types';

interface State {
  pos: Point;
  mask: number;
  depth: number;
}

/**
 * Breadth-first search over (position, collected-stars) states.
 * Returns the minimum number of cards needed to collect every star,
 * or null when the level cannot be solved with its available cards.
 */
export function minCommands(level: Level): number | null {
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
