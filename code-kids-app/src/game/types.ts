export type Dir = 'up' | 'down' | 'left' | 'right';
export type LoopCount = 2 | 3;
/**
 * Cards in the tray. `x2` / `x3` modify the arrow placed just before them (one arrow moves 2 / 3 cells).
 * `loop2` / `loop3` and `end` are World 2's くりかえし: they wrap a SEQUENCE of arrows and repeat it.
 */
export type CardKind = Dir | 'x2' | 'x3' | 'loop2' | 'loop3' | 'end';
export type Times = 1 | 2 | 3;

export interface Point {
  x: number;
  y: number;
}

/** An arrow card placed in the program strip. `times` comes from a 2かい / 3かい modifier. */
export interface Command {
  id: string;
  dir: Dir;
  times: Times;
}

/** 「くりかえし」: repeats every card after it up to the matching 「おわり」 `count` times. */
export interface LoopCard {
  id: string;
  loop: LoopCount;
}

/** 「おわり」: closes the loop opened by the nearest くりかえし before it. */
export interface EndCard {
  id: string;
  end: true;
}

/**
 * Anything that can sit in the program strip.
 *
 * Card counting (stars, slots and par all use it): every card in the strip counts as one, so
 * 「くりかえし」 is 1 card and 「おわり」 is 1 card. 2かい / 3かい do not count; they are stuck onto an arrow.
 * Example: くりかえし×3 [みぎ うえ] おわり = 4 cards, versus 6 arrows written out.
 */
export type Card = Command | LoopCard | EndCard;

export interface Level {
  id: number;
  title: string;
  hint: string;
  /** Square grid size (cells per side). */
  size: number;
  start: Point;
  facing: Dir;
  stars: Point[];
  rocks: Point[];
  water: Point[];
  /** Cards available in this level. */
  cards: CardKind[];
  /** Maximum number of command cards the player can place. */
  slots: number;
  /** Minimum number of cards needed; used for the 3-star rating. */
  par: number;
  /** World 2 stages use the editable strip (tap a card to open a gap there) and may use loops. Defaults to 1. */
  world?: 1 | 2;
  /**
   * 「なおして！」 stages: the strip starts filled with this buggy program (notation of `parseProgram`).
   * Tests check that it does not win as given.
   */
  buggy?: string;
  /** 「なおして！」 stages: the intended fix, which tests check wins with exactly `par` cards. */
  fixed?: string;
  /** How many cards of `buggy` are wrong (shown to the child as 「まちがいは 1こ」). */
  bugs?: 1 | 2;
}
