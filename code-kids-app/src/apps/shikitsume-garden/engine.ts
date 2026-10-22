import type { Bed, Card, FillLevel, GardenLevel, PlantRun, PlantStep, Point, Stamp } from './types';

/** Boards stay at most 6 × 6 so every cell is big enough for a small finger on a tablet. */
export const MAX_SIDE = 6;
/** Products stay inside the 9 × 9 times table. */
export const MAX_FACTOR = 9;

export const keyOf = (p: Point) => `${p.x},${p.y}`;

export function area(s: Stamp): number {
  return s.rows * s.cols;
}

/** たて and よこ swapped: the same flowers seen after a quarter turn. */
export function turned(s: Stamp): Stamp {
  return { rows: s.cols, cols: s.rows };
}

/** The card as it currently lies, given whether the child has turned it. */
export function cardStamp(card: Card, isTurned: boolean): Stamp {
  return card.turnable && isTurned ? turned(card) : { rows: card.rows, cols: card.cols };
}

/** The cells of a bed in planting order: the top row left to right, then the next row. */
export function bedCells(bed: Bed): (Point & { row: number; col: number })[] {
  const cells: (Point & { row: number; col: number })[] = [];
  for (let row = 0; row < bed.rows; row++) for (let col = 0; col < bed.cols; col++) cells.push({ x: bed.x + col, y: bed.y + row, row, col });
  return cells;
}

export function inBed(bed: Bed, p: Point): boolean {
  return p.x >= bed.x && p.x < bed.x + bed.cols && p.y >= bed.y && p.y < bed.y + bed.rows;
}

/** The last placed bed under a cell, so tapping it picks up the one drawn on top. */
export function bedAt(beds: Bed[], p: Point): number {
  for (let i = beds.length - 1; i >= 0; i--) if (inBed(beds[i], p)) return i;
  return -1;
}

export function onBoard(level: GardenLevel, p: Point): boolean {
  return p.x >= 0 && p.y >= 0 && p.x < level.w && p.y < level.h;
}

/** Cells that should end up with a flower. On a count level that is the drawn beds; elsewhere every cell that is not a stone. */
export function soilCells(level: GardenLevel): Point[] {
  if (level.kind === 'count') return level.beds.flatMap(bedCells).map(({ x, y }) => ({ x, y }));
  const stones = new Set(level.stones.map(keyOf));
  const cells: Point[] = [];
  for (let y = 0; y < level.h; y++) for (let x = 0; x < level.w; x++) if (!stones.has(keyOf({ x, y }))) cells.push({ x, y });
  return cells;
}

/**
 * Puts a stamp down with its top-left corner on the tapped cell, slid back onto the board if it would hang over the edge.
 * Sliding instead of refusing means a tap never does nothing, which matters more to a six-year-old than precision.
 */
export function fitBed(level: GardenLevel, at: Point, stamp: Stamp): Bed {
  const x = Math.max(0, Math.min(at.x, level.w - stamp.cols));
  const y = Math.max(0, Math.min(at.y, level.h - stamp.rows));
  return { x, y, rows: stamp.rows, cols: stamp.cols };
}

/** What the planting robot does with the beds the child laid out, in the order they were put down. */
export function plant(level: GardenLevel, beds: Bed[]): PlantRun {
  const soil = new Set(soilCells(level).map(keyOf));
  const planted = new Set<string>();
  const steps: PlantStep[] = [];

  for (const [b, bed] of beds.entries()) {
    for (const [i, c] of bedCells(bed).entries()) {
      const k = keyOf(c);
      if (!onBoard(level, c) || !soil.has(k))
        return {
          steps,
          outcome: 'stone',
          problem: { x: c.x, y: c.y, bed: b },
          gaps: [],
        };
      if (planted.has(k))
        return {
          steps,
          outcome: 'overlap',
          problem: { x: c.x, y: c.y, bed: b },
          gaps: [],
        };
      planted.add(k);
      steps.push({
        x: c.x,
        y: c.y,
        bed: b,
        row: c.row,
        col: c.col,
        n: i + 1,
        total: steps.length + 1,
      });
    }
  }
  const gaps = soilCells(level).filter((c) => !planted.has(keyOf(c)));
  return {
    steps,
    outcome: gaps.length === 0 ? 'win' : 'gap',
    problem: null,
    gaps,
  };
}

/** How many beds the child may still put down. */
export function bedsLeft(level: FillLevel, beds: Bed[]): number {
  return level.offer.mode === 'pick' ? level.offer.beds - beds.length : level.offer.cards.length - beds.length;
}

/** Card indices already on the board. */
export function usedCards(beds: Bed[]): Set<number> {
  return new Set(beds.flatMap((b) => (b.card === undefined ? [] : [b.card])));
}

/**
 * Finds a way to fill the plot exactly with what the level offers, or null.
 * The first empty soil cell in reading order must be the top-left corner of the bed that covers it,
 * so trying every allowed stamp there and recursing visits every exact tiling.
 */
export function solve(level: FillLevel): Bed[] | null {
  const soil = new Set(soilCells(level).map(keyOf));
  const filled = new Set<string>();
  const order = soilCells(level);
  const beds: Bed[] = [];

  const shapes = (): { stamp: Stamp; card?: number }[] => {
    const offer = level.offer;
    if (offer.mode === 'pick') return offer.rows.flatMap((rows) => offer.cols.map((cols) => ({ stamp: { rows, cols } })));
    const used = usedCards(beds);
    return offer.cards.flatMap((card, i) => {
      if (used.has(i)) return [];
      const flat = { stamp: { rows: card.rows, cols: card.cols }, card: i };
      return card.turnable && card.rows !== card.cols ? [flat, { stamp: turned(card), card: i }] : [flat];
    });
  };

  const fits = (bed: Bed) => bedCells(bed).every((c) => soil.has(keyOf(c)) && !filled.has(keyOf(c)));

  const search = (): boolean => {
    const next = order.find((c) => !filled.has(keyOf(c)));
    if (!next) return true;
    if (bedsLeft(level, beds) <= 0) return false;
    for (const { stamp, card } of shapes()) {
      const bed: Bed = {
        ...next,
        ...stamp,
        ...(card === undefined ? {} : { card }),
      };
      if (!fits(bed)) continue;
      beds.push(bed);
      bedCells(bed).forEach((c) => filled.add(keyOf(c)));
      if (search()) return true;
      beds.pop();
      bedCells(bed).forEach((c) => filled.delete(keyOf(c)));
    }
    return false;
  };

  return search() ? beds : null;
}

/** The flowers a count level holds: the answer the child has to predict. */
export function countAnswer(level: GardenLevel): number {
  return level.kind === 'count' ? level.beds.reduce((sum, b) => sum + area(b), 0) : soilCells(level).length;
}

/**
 * Stars depend on which run worked, like みずのみち and おかしわけマシン:
 * ★3 when the first press of 「うえる！」 fills the garden (or the first prediction is right), ★2 on the second, ★1 after that.
 * Placed beds stay after a failed run, so a second try is about fixing, not starting over.
 */
export function rateTries(tries: number): 1 | 2 | 3 {
  return tries <= 1 ? 3 : tries === 2 ? 2 : 1;
}

/** "2 × 3 = 6", たて × よこ, the way the area of a rectangle is taught. */
export function productText(s: Stamp): string {
  return `${s.rows} × ${s.cols} = ${area(s)}`;
}

/** "6 + 4 = 10" for several beds, just "6" for one. */
export function sumText(beds: Stamp[]): string {
  const parts = beds.map(area);
  const total = parts.reduce((a, b) => a + b, 0);
  return parts.length > 1 ? `${parts.join(' + ')} = ${total}` : `${total}`;
}

/**
 * The running total at the end of each row of a bed: 3, 6, 9 for a bed three wide.
 * This is the skip counting that the times table compresses.
 */
export function rowTotals(s: Stamp): number[] {
  return Array.from({ length: s.rows }, (_, r) => (r + 1) * s.cols);
}
