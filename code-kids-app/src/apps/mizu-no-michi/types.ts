export type Side = 'up' | 'right' | 'down' | 'left';
export type PieceKind = 'straight' | 'corner' | 'tee';

export interface Point {
  x: number;
  y: number;
}

/** `rot` counts clockwise quarter turns. It keeps growing as the child taps so the turn animation never spins backwards. */
export interface Piece {
  kind: PieceKind;
  rot: number;
}

export interface PlacedPiece extends Point {
  piece: Piece;
}

export interface PipeLevel {
  id: number;
  title: string;
  hint: string;
  w: number;
  h: number;
  /** The tap. Water leaves it through `out`. */
  source: Point & { out: Side };
  /** Flowers. Water may arrive from any side. */
  goals: Point[];
  rocks: Point[];
  /** Bolted pipes: they carry water but cannot be turned or removed. */
  fixed: PlacedPiece[];
  /** Pipes already in place that the child can turn; `rot` is the scrambled start. */
  turnable: PlacedPiece[];
  /** Pipes the child can place on empty grass. */
  hand: Partial<Record<PieceKind, number>>;
}

/** A pipe cell that filled. `depth` is how many steps from the tap; `from` is where the water came in. */
export interface FillEvent extends Point {
  depth: number;
  from: Side;
}

/** Water left cell (x, y) through `side` into nothing (grass, rock, the edge, or a pipe with no opening there). */
export interface LeakEvent extends Point {
  depth: number;
  side: Side;
}

export interface FlowTrace {
  fills: FillEvent[];
  goals: (Point & { depth: number })[];
  leaks: LeakEvent[];
  outcome: 'win' | 'leak' | 'dry';
  /** Steps until the last water movement; used to time the animation. */
  lastDepth: number;
}
