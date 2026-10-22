export interface Point {
  x: number;
  y: number;
}

/** A flower-bed shape: `rows` is たて (how many rows), `cols` is よこ (flowers in each row). */
export interface Stamp {
  rows: number;
  cols: number;
}

/** A bed on the board. (x, y) is its top-left cell. `card` is the card it came from on a set level. */
export interface Bed extends Point, Stamp {
  card?: number;
}

/** A stamp card on a set level. A turnable card can be turned a quarter so たて and よこ swap. */
export interface Card extends Stamp {
  turnable: boolean;
}

/** The child chooses たて from `rows` and よこ from `cols`, and may put down at most `beds` beds. */
export interface PickOffer {
  mode: 'pick';
  rows: number[];
  cols: number[];
  beds: number;
}

/** Only these cards, each usable once. Not every card has to be used. */
export interface SetOffer {
  mode: 'set';
  cards: Card[];
}

interface LevelBase {
  id: number;
  title: string;
  hint: string;
  w: number;
  h: number;
  /** Shown in the win dialog under the equation, e.g. the point of the commutativity stage. */
  lesson?: string;
}

/** Fill every soil cell with flowers; stones must stay empty. */
export interface FillLevel extends LevelBase {
  kind: 'fill';
  stones: Point[];
  offer: PickOffer | SetOffer;
}

/** Beds are already drawn; the child predicts how many flowers they hold, then the robot plants to check. */
export interface CountLevel extends LevelBase {
  kind: 'count';
  beds: Bed[];
  /** Answers offered on the pad. Exactly one is right. */
  choices: number[];
}

export type GardenLevel = FillLevel | CountLevel;

/** One flower planted. `n` counts within its bed (1, 2, 3 …), `total` across the whole run. */
export interface PlantStep extends Point {
  bed: number;
  row: number;
  col: number;
  n: number;
  total: number;
}

/**
 * What the robot did. It plants bed after bed, row by row, and stops at the first cell it cannot plant:
 * a stone (or off the board) or a cell that already has a flower. `problem` is that cell.
 * `gap` means every bed was planted but some soil is still empty (`gaps`).
 */
export interface PlantRun {
  steps: PlantStep[];
  outcome: 'win' | 'stone' | 'overlap' | 'gap';
  problem: (Point & { bed: number }) | null;
  gaps: Point[];
}
