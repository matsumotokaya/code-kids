export type Dir = 'up' | 'right' | 'down' | 'left';

/** Every colour also has its own shape (りんご / つみき / ほし), so it reads without colour vision too. */
export type ItemColor = 'red' | 'blue' | 'yellow';

/** A belt, or a sorter for one colour. */
export type PartKind = 'belt' | 'sort-red' | 'sort-blue' | 'sort-yellow';

export interface Point {
  x: number;
  y: number;
}

/**
 * `rot` counts clockwise quarter turns from "up". It keeps growing as the child taps so the turn animation never spins backwards.
 * A belt sends everything that way. A sorter sends its own colour that way and lets every other item go straight on.
 */
export interface Part {
  kind: PartKind;
  rot: number;
}

export interface PlacedPart extends Point {
  part: Part;
}

export interface SortLevel {
  id: number;
  title: string;
  hint: string;
  w: number;
  h: number;
  /** Where the items come out. Each item leaves it through `out`. */
  chute: Point & { out: Dir };
  /** The items in the order they come out of the chute. */
  items: ItemColor[];
  /** Each box takes one colour. Items may drop in from any side. */
  boxes: (Point & { color: ItemColor })[];
  walls: Point[];
  /** Bolted parts: they work but cannot be turned or removed. */
  fixed: PlacedPart[];
  /** Parts already in place that the child can turn; `rot` is the scrambled start. */
  turnable: PlacedPart[];
  /** Parts the child can put on empty floor. */
  hand: Partial<Record<PartKind, number>>;
}

/**
 * How an item's trip ended: in its own box, in another colour's box, off a belt onto the floor (or off the board),
 * against a wall or the chute, or going round in circles.
 */
export type ItemEnd = 'boxed' | 'wrong' | 'fell' | 'bump' | 'loop';

/**
 * One item's trip. It is at `path[t - start]` at tick `t`; `path[0]` is the chute.
 * The last cell is where it ended: the box, the floor cell it dropped onto (possibly just off the board),
 * the cell it was stuck on (repeated for a bump), or the cell where its loop closed.
 */
export interface ItemRun {
  color: ItemColor;
  start: number;
  path: Point[];
  end: ItemEnd;
  endTick: number;
}

export interface RunTrace {
  items: ItemRun[];
  outcome: 'win' | Exclude<ItemEnd, 'boxed'>;
  /** The machine stops here: the first mishap, or the last item landing in its box. */
  lastTick: number;
  /** Index of the item whose mishap stopped the machine. */
  failItem: number | null;
}
