export type Dir = 'up' | 'down' | 'left' | 'right';
export type CardKind = Dir | 'x2' | 'x3';
export type Times = 1 | 2 | 3;

export interface Point {
  x: number;
  y: number;
}

export interface Command {
  id: string;
  dir: Dir;
  times: Times;
}

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
}
