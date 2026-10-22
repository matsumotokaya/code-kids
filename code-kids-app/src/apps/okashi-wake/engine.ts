import type { DealStep, MachineResult, OkashiLevel, Prediction } from './types';

/** The answer pad offers 1..ANSWER_MAX. */
export const ANSWER_MAX = 10;
/** The leftover pad offers 0..REMAINDER_MAX; it is also what the leftover basket can show. */
export const REMAINDER_MAX = 5;
/** Plates that fit side by side on the board. */
export const MAX_PLATES = 6;
/** Candies that fit on one plate (a 3 × 4 grid). */
export const MAX_PER_PLATE = 12;
/** Candies that fit in the jar (a 5 × 5 grid). */
export const MAX_CANDIES = 25;

export function divide(dividend: number, divisor: number): { quotient: number; remainder: number } {
  return { quotient: Math.floor(dividend / divisor), remainder: dividend % divisor };
}

/**
 * Round-robin, the way children share: one candy to each plate in turn.
 * A round starts only when there is a candy for every plate; what is left goes to the basket.
 */
export function dealShare(candies: number, plates: number): DealStep[] {
  const { quotient, remainder } = divide(candies, plates);
  const steps: DealStep[] = [];
  for (let round = 0; round < quotient; round++) for (let p = 0; p < plates; p++) steps.push({ plate: p, slot: round });
  for (let i = 0; i < remainder; i++) steps.push({ plate: null, slot: i });
  return steps;
}

/** Fills one friend's plate with `size` candies, then the next friend's, until a whole plate can no longer be filled. */
export function dealGroups(candies: number, size: number): DealStep[] {
  const { quotient, remainder } = divide(candies, size);
  const steps: DealStep[] = [];
  for (let p = 0; p < quotient; p++) for (let s = 0; s < size; s++) steps.push({ plate: p, slot: s });
  for (let i = 0; i < remainder; i++) steps.push({ plate: null, slot: i });
  return steps;
}

/** Plates a share level puts on the board; for a choose level this is the child's pick. */
export function platesFor(level: OkashiLevel, chosen: number | null): number {
  if (level.kind === 'share') return level.plates;
  if (level.kind === 'choose') return chosen ?? 0;
  return divide(level.candies, level.size).quotient;
}

/** What the machine does. A choose level needs the child's plate count. */
export function runMachine(level: OkashiLevel, chosen: number | null = null): MachineResult {
  const divisor = level.kind === 'group' ? level.size : platesFor(level, chosen);
  if (divisor < 1) throw new Error('choose a plate count first');
  const { quotient, remainder } = divide(level.candies, divisor);
  const steps = level.kind === 'group' ? dealGroups(level.candies, divisor) : dealShare(level.candies, divisor);
  const plates = level.kind === 'group' ? quotient : divisor;
  return { kind: level.kind, dividend: level.candies, divisor, quotient, remainder, plates, steps };
}

export function asksRemainder(level: OkashiLevel): boolean {
  return level.kind !== 'choose' && level.askRemainder;
}

/** The run button wakes up once every question on screen has an answer. */
export function isReady(level: OkashiLevel, prediction: Prediction): boolean {
  return prediction.answer !== null && (!asksRemainder(level) || prediction.remainder !== null);
}

/** A choose level is right when nothing is left over; the others must match the machine exactly. */
export function isCorrect(level: OkashiLevel, prediction: Prediction, result: MachineResult): boolean {
  if (level.kind === 'choose') return result.remainder === 0;
  if (prediction.answer !== result.quotient) return false;
  return !asksRemainder(level) || prediction.remainder === result.remainder;
}

/**
 * Stars depend on how many predictions it took, like みずのみち:
 * ★3 when the first prediction is right, ★2 on the second, ★1 after that.
 * The point is to think before letting the machine run.
 */
export function rateTries(tries: number): 1 | 2 | 3 {
  return tries <= 1 ? 3 : tries === 2 ? 2 : 1;
}

/** "13 ÷ 3 = 4 あまり 1". */
export function divisionText(r: MachineResult): string {
  return `${r.dividend} ÷ ${r.divisor} = ${r.quotient}${r.remainder > 0 ? ` あまり ${r.remainder}` : ''}`;
}

/**
 * The multiplication behind the division, written the way Japanese schools do: (one group) × (how many groups).
 * Sharing 12 onto 3 plates gives 4 per plate, so "4 × 3 = 12"; giving 3 each to 4 friends is "3 × 4 = 12".
 * A remainder is added on: "4 × 3 + 1 = 13".
 */
export function multiplicationText(r: MachineResult): string {
  const [each, groups] = r.kind === 'group' ? [r.divisor, r.quotient] : [r.quotient, r.divisor];
  return `${each} × ${groups}${r.remainder > 0 ? ` + ${r.remainder}` : ''} = ${r.dividend}`;
}

/** The same multiplication read aloud in hiragana: "4こずつ 3さらぶん". */
export function multiplicationWords(r: MachineResult): string {
  return r.kind === 'group' ? `${r.divisor}こずつ ${r.quotient}にんぶん` : `${r.quotient}こずつ ${r.divisor}さらぶん`;
}
