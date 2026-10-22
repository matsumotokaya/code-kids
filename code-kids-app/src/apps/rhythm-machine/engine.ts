import type { CellDiff, Instrument, Judgement, Pattern, PatternSpec, RhythmLevel, Tempo } from './types';

/** Display order, top to bottom. */
export const INSTRUMENTS: Instrument[] = ['pon', 'chi', 'tan', 'don'];

/** じゆうに つくる uses one 8-step loop. */
export const FREE_STEPS = 8;

/** Seconds per step. Steps are eighth notes, so ふつう is about 83 BPM. */
export const TEMPO_SEC: Record<Tempo, number> = { slow: 0.5, normal: 0.36, fast: 0.26 };
export const TEMPOS: Tempo[] = ['slow', 'normal', 'fast'];

export function emptyPattern(steps: number): Pattern {
  return { pon: Array(steps).fill(false), chi: Array(steps).fill(false), tan: Array(steps).fill(false), don: Array(steps).fill(false) };
}

export function patternSteps(p: Pattern): number {
  return p.don.length;
}

/** 'x' is a note and anything else a rest. Short strings are padded with rests and long ones cut. */
export function parsePattern(spec: PatternSpec, steps: number): Pattern {
  const p = emptyPattern(steps);
  for (const inst of INSTRUMENTS) {
    const row = spec[inst] ?? '';
    for (let i = 0; i < steps; i++) p[inst][i] = row[i] === 'x';
  }
  return p;
}

export function patternToSpec(p: Pattern): Record<Instrument, string> {
  const out = {} as Record<Instrument, string>;
  for (const inst of INSTRUMENTS) out[inst] = p[inst].map((on) => (on ? 'x' : '.')).join('');
  return out;
}

/** Makes a pattern exactly `steps` long, e.g. a saved song loaded after the grid size changed. */
export function fitPattern(p: Partial<Pattern> | undefined, steps: number): Pattern {
  const out = emptyPattern(steps);
  for (const inst of INSTRUMENTS) {
    const row = p?.[inst];
    if (Array.isArray(row)) for (let i = 0; i < steps; i++) out[inst][i] = row[i] === true;
  }
  return out;
}

export function toggleCell(p: Pattern, inst: Instrument, step: number): Pattern {
  const row = [...p[inst]];
  row[step] = !row[step];
  return { ...p, [inst]: row };
}

export function noteCount(p: Pattern): number {
  return INSTRUMENTS.reduce((sum, inst) => sum + p[inst].filter(Boolean).length, 0);
}

/** Instruments that sound on `step`. */
export function notesAt(p: Pattern, step: number): Instrument[] {
  return INSTRUMENTS.filter((inst) => p[inst][step]);
}

export function samePattern(a: Pattern, b: Pattern): boolean {
  return patternSteps(a) === patternSteps(b) && INSTRUMENTS.every((inst) => a[inst].every((on, i) => on === b[inst][i]));
}

/** Cells that differ, column by column from the left so the first highlight is where the ear notices first. */
export function diffPatterns(child: Pattern, target: Pattern, upTo = patternSteps(target)): CellDiff[] {
  const diffs: CellDiff[] = [];
  for (let step = 0; step < upTo; step++) {
    for (const inst of INSTRUMENTS) {
      const mine = child[inst][step] ?? false;
      const want = target[inst][step] ?? false;
      if (mine !== want) diffs.push({ inst, step, kind: want ? 'missing' : 'extra' });
    }
  }
  return diffs;
}

/** Plays the first `unit` steps `times` times in a row: the loop the ×N button makes. */
export function expandLoop(p: Pattern, unit: number, times: number): Pattern {
  const steps = unit * times;
  const out = emptyPattern(steps);
  for (const inst of INSTRUMENTS) for (let i = 0; i < steps; i++) out[inst][i] = p[inst][i % unit] ?? false;
  return out;
}

/** True when every `unit` steps the pattern starts over exactly. */
export function isPeriodic(p: Pattern, unit: number): boolean {
  const steps = patternSteps(p);
  if (unit <= 0 || steps % unit !== 0) return false;
  return samePattern(p, expandLoop(p, unit, steps / unit));
}

/** How many times the ×N button repeats the child's part. 1 on stages without it. */
export function loopTimes(level: RhythmLevel): number {
  return level.loop ? level.steps / level.loop : 1;
}

/** The child may only tap the first `loop` columns on a くりかえし stage; the rest are copies. */
export function isEditableStep(level: RhythmLevel, step: number): boolean {
  return step >= 0 && step < (level.loop ?? level.steps);
}

/**
 * What the machine actually plays from the child's grid. On a くりかえし stage the columns
 * after the child's part are empty until the ×N button is on, and then they copy it.
 */
export function playedPattern(level: RhythmLevel, edited: Pattern, loopOn: boolean): Pattern {
  if (!level.loop) return fitPattern(edited, level.steps);
  if (loopOn) return expandLoop(edited, level.loop, loopTimes(level));
  const out = emptyPattern(level.steps);
  for (const inst of INSTRUMENTS) for (let i = 0; i < level.loop; i++) out[inst][i] = edited[inst][i] ?? false;
  return out;
}

export function levelTarget(level: RhythmLevel): Pattern {
  return parsePattern(level.target, level.steps);
}

export function judge(level: RhythmLevel, edited: Pattern, loopOn: boolean): Judgement {
  const target = levelTarget(level);
  if (!level.loop) {
    const diffs = diffPatterns(fitPattern(edited, level.steps), target);
    return { ok: diffs.length === 0, diffs, needLoop: false };
  }
  // Only the child's own part is marked: pointing at copies would ask them to fix cells they cannot tap.
  const diffs = diffPatterns(edited, target, level.loop);
  if (diffs.length > 0) return { ok: false, diffs, needLoop: false };
  return { ok: loopOn, diffs: [], needLoop: !loopOn };
}

/**
 * Stars by attempt, like みずのみち: the 1st 「くらべる！」 that matches gives ★3, the 2nd ★2, later ones ★1.
 * Listening again and pressing 「ならす！」 are free, so careful listening is what earns ★3.
 */
export function rateTries(tries: number): 1 | 2 | 3 {
  return tries <= 1 ? 3 : tries === 2 ? 2 : 1;
}

/** Laps the おてほん plays when the child listens: about 16 steps, so an 8-step loop is heard twice. */
export function listenLaps(steps: number): number {
  return Math.max(1, Math.round(16 / steps));
}

/** Reasons a level is broken; empty when it is fine. The tests run this on every stage. */
export function levelProblems(level: RhythmLevel): string[] {
  const problems: string[] = [];
  if (level.steps !== 8 && level.steps !== 16) problems.push(`steps must be 8 or 16, got ${level.steps}`);
  if (level.rows.length === 0) problems.push('no rows');
  if (new Set(level.rows).size !== level.rows.length) problems.push('a row is listed twice');
  for (const inst of INSTRUMENTS) {
    const row = level.target[inst];
    if (row === undefined) continue;
    if (!level.rows.includes(inst)) problems.push(`${inst} has notes but is not shown`);
    if (row.length !== level.steps) problems.push(`${inst} is ${row.length} long, not ${level.steps}`);
    if (!/^[x.]*$/.test(row)) problems.push(`${inst} has characters other than x and .`);
  }
  const target = levelTarget(level);
  for (const inst of level.rows) if (!target[inst].some(Boolean)) problems.push(`${inst} is shown but has no notes`);
  if (level.repeat !== undefined && !isPeriodic(target, level.repeat)) problems.push(`target does not repeat every ${level.repeat}`);
  if (level.loop !== undefined) {
    if (level.steps % level.loop !== 0 || level.loop >= level.steps) problems.push(`loop ${level.loop} does not divide ${level.steps}`);
    else if (!isPeriodic(target, level.loop)) problems.push(`target is not the first ${level.loop} steps repeated`);
  }
  return problems;
}

const GROOVES: Record<Instrument, string[]> = {
  don: ['x...x...', 'x..x..x.', 'x...x.x.', 'x.x...x.', 'x..xx...'],
  tan: ['..x...x.', '....x...', '..x..xx.', '..x...xx'],
  chi: ['x.x.x.x.', 'xxxxxxxx', '.x.x.x.x', 'x.xxx.xx'],
  pon: ['x...x...', 'x.x...x.', '..x.x..x', 'x..x..x.', '.x...xx.'],
};

/** おまかせ: a random but always groovy 8-step beat built from known-good rows. `rand` returns [0, 1). */
export function randomGroove(rand: () => number = Math.random): Pattern {
  const pick = (rows: string[]) => rows[Math.min(rows.length - 1, Math.floor(rand() * rows.length))];
  return parsePattern({ don: pick(GROOVES.don), tan: pick(GROOVES.tan), chi: pick(GROOVES.chi), pon: pick(GROOVES.pon) }, FREE_STEPS);
}
