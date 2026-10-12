import type { JumpCardKind, JumpCommand, JumpEvent, JumpLevel, JumpTrace } from './types';

type Op = 'add' | 'sub' | 'mul' | 'div';

export const CARD_OPS: Record<JumpCardKind, { op: Op; n: number }> = {
  add1: { op: 'add', n: 1 },
  add2: { op: 'add', n: 2 },
  add3: { op: 'add', n: 3 },
  sub1: { op: 'sub', n: 1 },
  sub2: { op: 'sub', n: 2 },
  mul2: { op: 'mul', n: 2 },
  mul3: { op: 'mul', n: 3 },
  div2: { op: 'div', n: 2 },
};

export type StepResult =
  | { kind: 'land'; to: number }
  | { kind: 'croc'; to: number }
  | { kind: 'splash'; to: number }
  | { kind: 'split' };

/** One card applied to the current number. Shared by the simulator and the solver so they never disagree. */
export function step(level: JumpLevel, value: number, card: JumpCardKind): StepResult {
  const { op, n } = CARD_OPS[card];
  if (op === 'div' && value % n !== 0) return { kind: 'split' };
  const to = op === 'add' ? value + n : op === 'sub' ? value - n : op === 'mul' ? value * n : value / n;
  if (to < 0 || to > level.max) return { kind: 'splash', to };
  if (level.crocs.includes(to)) return { kind: 'croc', to };
  return { kind: 'land', to };
}

/**
 * Runs the program and returns everything that happens, in order.
 * Landing on the goal wins immediately and the remaining cards are ignored.
 */
export function simulate(level: JumpLevel, program: JumpCommand[]): JumpTrace {
  const events: JumpEvent[] = [];
  let value = level.start;
  for (let i = 0; i < program.length; i++) {
    const r = step(level, value, program[i].kind);
    switch (r.kind) {
      case 'split':
        events.push({ kind: 'split', cmdIndex: i, at: value });
        return { events, outcome: 'fail' };
      case 'splash':
        events.push({ kind: 'splash', cmdIndex: i, from: value, to: r.to });
        return { events, outcome: 'fail' };
      case 'croc':
        events.push({ kind: 'jump', cmdIndex: i, from: value, to: r.to });
        events.push({ kind: 'croc', cmdIndex: i, at: r.to });
        return { events, outcome: 'fail' };
      case 'land':
        events.push({ kind: 'jump', cmdIndex: i, from: value, to: r.to });
        value = r.to;
        if (value === level.goal) {
          events.push({ kind: 'win', cmdIndex: i, at: value });
          return { events, outcome: 'win' };
        }
    }
  }
  events.push({ kind: 'end', at: value });
  return { events, outcome: 'fail' };
}

/** Breadth-first search over numbers: the fewest cards that land on the goal, or null if unreachable. */
export function minJumps(level: JumpLevel): number | null {
  const depth = new Map<number, number>([[level.start, 0]]);
  const queue = [level.start];
  while (queue.length > 0) {
    const value = queue.shift()!;
    const d = depth.get(value)!;
    if (value === level.goal) return d;
    for (const card of level.cards) {
      const r = step(level, value, card);
      if (r.kind !== 'land' || depth.has(r.to)) continue;
      depth.set(r.to, d + 1);
      queue.push(r.to);
    }
  }
  return null;
}
