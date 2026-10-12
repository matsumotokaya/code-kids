export type JumpCardKind = 'add1' | 'add2' | 'add3' | 'sub1' | 'sub2' | 'mul2' | 'mul3' | 'div2';

export interface JumpCommand {
  id: string;
  kind: JumpCardKind;
}

export interface JumpLevel {
  id: number;
  title: string;
  hint: string;
  /** Largest number on the line; lily pads run from 0 to max. */
  max: number;
  start: number;
  goal: number;
  /** Numbers guarded by a crocodile. Landing there fails; jumping over is fine. */
  crocs: number[];
  /** Cards available in this level. */
  cards: JumpCardKind[];
  /** Maximum number of cards the player can place. */
  slots: number;
  /** Minimum number of cards needed; used for the 3-star rating. */
  par: number;
}

export type JumpEvent =
  | { kind: 'jump'; cmdIndex: number; from: number; to: number }
  | { kind: 'croc'; cmdIndex: number; at: number }
  /** Jumped past either end of the line into the pond. */
  | { kind: 'splash'; cmdIndex: number; from: number; to: number }
  /** Tried to halve an odd number. */
  | { kind: 'split'; cmdIndex: number; at: number }
  | { kind: 'win'; cmdIndex: number; at: number }
  /** Ran out of cards without stopping on the goal. */
  | { kind: 'end'; at: number };

export interface JumpTrace {
  events: JumpEvent[];
  outcome: 'win' | 'fail';
}
