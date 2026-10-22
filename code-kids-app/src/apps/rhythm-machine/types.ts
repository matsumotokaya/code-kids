/** Rows of the machine. ポン (bell) is on top and ドン (big drum) at the bottom, so high sounds sit high. */
export type Instrument = 'pon' | 'chi' | 'tan' | 'don';

/** One on/off flag per step for every instrument. Every row always has the same length. */
export type Pattern = Record<Instrument, boolean[]>;

/** Readable pattern for level files: 'x' is a note, '.' is a rest, e.g. `{ don: 'x...x...' }`. */
export type PatternSpec = Partial<Record<Instrument, string>>;

export type Tempo = 'slow' | 'normal' | 'fast';

export interface RhythmLevel {
  id: number;
  title: string;
  hint: string;
  /** Columns: 8 (one loop) or 16. */
  steps: number;
  /** Instruments shown, in any order; the screen draws them in `INSTRUMENTS` order. */
  rows: Instrument[];
  target: PatternSpec;
  /** Early stages draw the target faintly so a six-year-old can copy it while listening. */
  ghost: boolean;
  /** The target is a short shape of this many steps played again and again. Tests check it really is. */
  repeat?: number;
  /**
   * くりかえし stage: the child fills only the first `loop` steps and the ×N button
   * copies them over the rest of the grid. `steps` must be a multiple of it.
   */
  loop?: number;
}

/** A cell where the child's pattern and the target disagree. */
export interface CellDiff {
  inst: Instrument;
  step: number;
  /** `missing`: the target has a note the child does not. `extra`: the child has a note the target does not. */
  kind: 'missing' | 'extra';
}

export interface Judgement {
  ok: boolean;
  /** Cells to highlight. For a くりかえし stage only the part the child edits is compared here. */
  diffs: CellDiff[];
  /** The child's part is right but the ×N button is off, so the rest of the grid is silent. */
  needLoop: boolean;
}
