export type Treat = 'cookie' | 'candy' | 'choco';

interface LevelBase {
  id: number;
  title: string;
  hint: string;
  /** How many treats start in the jar. */
  candies: number;
  treat: Treat;
}

/** Partitive division: share the candies equally between `plates` plates. Asks "1さらに なんこ？". */
export interface ShareLevel extends LevelBase {
  kind: 'share';
  plates: number;
  /** Also ask "あまりは なんこ？". Set exactly when the candies do not split evenly. */
  askRemainder: boolean;
}

/** Quotative division: give `size` candies to each friend. Asks "なんにんに くばれる？". */
export interface GroupLevel extends LevelBase {
  kind: 'group';
  size: number;
  askRemainder: boolean;
}

/** The child picks how many plates to use so that nothing is left over. */
export interface ChooseLevel extends LevelBase {
  kind: 'choose';
  /** Plate counts offered on the number pad. At least one splits the candies evenly. */
  choices: number[];
}

export type OkashiLevel = ShareLevel | GroupLevel | ChooseLevel;

/** What the child predicted before pressing "くばる！". For a choose level, `answer` is the number of plates. */
export interface Prediction {
  answer: number | null;
  remainder: number | null;
}

/** One candy leaving the jar: onto `plate` (as its `slot`-th candy), or into the leftover basket when `plate` is null. */
export interface DealStep {
  plate: number | null;
  slot: number;
}

export interface MachineResult {
  kind: OkashiLevel['kind'];
  dividend: number;
  /** Plates for share/choose, candies per friend for group. */
  divisor: number;
  /** Candies per plate for share/choose, friends served for group. */
  quotient: number;
  remainder: number;
  /** Plates that end up with candies. */
  plates: number;
  steps: DealStep[];
}
