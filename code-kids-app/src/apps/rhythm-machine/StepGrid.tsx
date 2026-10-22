import { motion } from 'motion/react';
import type { CSSProperties, ReactNode } from 'react';
import { INSTRUMENT_INFO, InstrumentIcon } from './art';
import { INSTRUMENTS } from './engine';
import { BELL_LEVEL } from './synth';
import type { CellDiff, Instrument, Pattern } from './types';

interface Props {
  rows: Instrument[];
  steps: number;
  /** The child's notes, including the copies made by the ×N button. */
  pattern: Pattern;
  /** Drawn faintly behind empty cells: the answer on the first stages. */
  ghost?: Pattern | null;
  /** What the machine is playing now; its notes in the playhead column bounce and flash. */
  sounding?: Pattern | null;
  /** Column under the playhead, -1 when stopped. */
  playStep: number;
  /** Grows by one every step, to restart the bounce even when the same cell sounds again. */
  tick: number;
  lap: number;
  diffs?: CellDiff[];
  /** Columns from here on are the ×N copies: they cannot be tapped. */
  editableUpTo?: number;
  /** Words under the loop arrow. */
  loopLabel: ReactNode;
  disabled?: boolean;
  onToggle: (inst: Instrument, step: number) => void;
}

const HEAD = 'w-16 shrink-0 roomy:w-24';

/**
 * The sequencer grid: instruments are rows, steps are columns, a ball rides along the top as the
 * playhead, and the arrow underneath shows that the end leads back to the start.
 */
export function StepGrid({ rows, steps, pattern, ghost, sounding, playStep, tick, lap, diffs = [], editableUpTo = steps, loopLabel, disabled, onToggle }: Props) {
  const ordered = INSTRUMENTS.filter((i) => rows.includes(i));
  const wide = steps > 8;
  const gap = wide ? 'gap-0.5 roomy:gap-1' : 'gap-1.5 roomy:gap-2';
  const groupGap = (step: number) => (step > 0 && step % 4 === 0 ? (wide ? 'ml-1.5 roomy:ml-2.5' : 'ml-2.5 roomy:ml-4') : '');
  const columns = Array.from({ length: steps }, (_, i) => i);
  const diffAt = (inst: Instrument, step: number) => diffs.find((d) => d.inst === inst && d.step === step);

  return (
    <div className="m-auto flex w-full max-w-4xl flex-col gap-1.5 roomy:gap-2.5">
      <div className="flex items-end">
        <div className={HEAD} />
        <div className={`flex flex-1 ${gap}`}>
          {columns.map((step) => {
            const here = step === playStep;
            const copy = step >= editableUpTo;
            return (
              <div key={step} className={`relative flex h-9 min-w-0 flex-1 items-end justify-center roomy:h-11 ${groupGap(step)}`}>
                {here && (
                  <motion.div
                    layoutId="rhythm-playhead"
                    className="absolute -top-1 size-5 rounded-full border-[3px] border-white bg-[#ff5a5a] shadow-md roomy:size-6"
                    transition={{ type: 'spring', stiffness: 900, damping: 45 }}
                  />
                )}
                <span className={`text-xs leading-none roomy:text-sm ${here ? 'text-[#ff5a5a]' : copy ? 'text-ink/30' : 'text-ink/50'}`}>{step + 1}</span>
              </div>
            );
          })}
        </div>
      </div>

      {ordered.map((inst) => {
        const info = INSTRUMENT_INFO[inst];
        const rowHit = playStep >= 0 && !!sounding?.[inst][playStep];
        return (
          <div key={inst} className="flex items-center">
            <div className={`${HEAD} flex flex-col items-center pr-1`}>
              <motion.div
                key={rowHit ? `hit-${tick}` : 'still'}
                initial={rowHit ? { y: -10, scale: 1.15, rotate: inst === 'tan' ? -6 : 0 } : false}
                animate={{ y: 0, scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 14 }}
              >
                <InstrumentIcon inst={inst} className="size-12 roomy:size-16" />
              </motion.div>
              <span className="text-sm leading-none roomy:text-base" style={{ color: info.dark }}>
                {info.sound}
              </span>
            </div>
            <div className={`flex flex-1 ${gap}`}>
              {columns.map((step) => (
                <Cell
                  key={step}
                  inst={inst}
                  step={step}
                  on={pattern[inst][step]}
                  ghost={!!ghost?.[inst][step]}
                  hit={step === playStep && !!sounding?.[inst][step]}
                  current={step === playStep}
                  tick={tick}
                  copy={step >= editableUpTo}
                  diff={diffAt(inst, step)?.kind}
                  wide={wide}
                  disabled={disabled}
                  className={groupGap(step)}
                  onToggle={onToggle}
                />
              ))}
            </div>
          </div>
        );
      })}

      <div className="flex">
        <div className={HEAD} />
        <div className="flex-1">
          <motion.div
            key={lap}
            className="relative h-6 roomy:h-7"
            initial={lap > 0 ? { scaleY: 1.6 } : false}
            animate={{ scaleY: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 12 }}
            style={{ transformOrigin: '50% 0%' }}
          >
            <div className="absolute inset-x-[3%] top-0 h-full rounded-b-2xl border-4 border-t-0 border-dashed border-[#9b8bd6]" />
            <svg viewBox="0 0 20 16" className="absolute -top-2.5 left-[3%] w-5 -translate-x-1/2 roomy:w-6" aria-hidden>
              <path d="M 10 1 L 19 15 L 1 15 Z" fill="#9b8bd6" />
            </svg>
          </motion.div>
          <div className="mt-1 text-center text-sm leading-snug text-ink/70 roomy:text-base">{loopLabel}</div>
        </div>
      </div>
    </div>
  );
}

interface CellProps {
  inst: Instrument;
  step: number;
  on: boolean;
  ghost: boolean;
  hit: boolean;
  current: boolean;
  tick: number;
  copy: boolean;
  diff?: CellDiff['kind'];
  wide: boolean;
  disabled?: boolean;
  className: string;
  onToggle: (inst: Instrument, step: number) => void;
}

function Cell({ inst, step, on, ghost, hit, current, tick, copy, diff, wide, disabled, className, onToggle }: CellProps) {
  const info = INSTRUMENT_INFO[inst];
  // The bell's dot sits higher for higher notes, so the tune can be seen as well as heard.
  const dotY = inst === 'pon' ? 50 - (BELL_LEVEL[step % BELL_LEVEL.length] - 2) * 8 : 50;
  const radius = wide ? 'rounded-lg roomy:rounded-xl' : 'rounded-xl roomy:rounded-2xl';

  let face: string;
  let style: CSSProperties = {};
  if (on) {
    // Copies made by the ×N button are paler and flat, so the child can tell them from the notes they tapped.
    face = copy ? '' : 'border-b-4';
    style = { background: info.color, borderColor: copy ? undefined : info.dark, opacity: copy ? 0.5 : 1 };
  } else if (copy) {
    face = 'bg-[#ebe4d6]';
  } else {
    face = `border-b-4 border-[#e0d6c4] ${current ? 'bg-[#fff4b8]' : 'bg-white'}`;
  }

  return (
    <button
      type="button"
      disabled={disabled || copy}
      onClick={() => onToggle(inst, step)}
      aria-label={`${info.sound} ${step + 1}ばんめ ${on ? 'オン' : 'オフ'}`}
      aria-pressed={on}
      className={`relative aspect-square min-w-0 flex-1 touch-manipulation disabled:cursor-default ${className}`}
    >
      <motion.span
        key={hit ? `hit-${tick}` : 'still'}
        className={`absolute inset-0 ${radius} ${face} ${current && !on ? 'ring-2 ring-[#ffd84d]' : ''}`}
        style={style}
        initial={hit && on ? { scale: 1.22 } : false}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 600, damping: 15 }}
      >
        {!on && ghost && (
          <span className={`absolute inset-[10%] ${radius} border-[3px] border-dashed`} style={{ borderColor: info.color, background: `${info.color}22` }} />
        )}
        <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden>
          {on ? (
            <>
              <circle cx={50} cy={dotY} r={20} fill="#fff" opacity={0.95} />
              <circle cx={44} cy={dotY - 6} r={6} fill={info.soft} />
            </>
          ) : ghost || diff === 'missing' ? (
            <circle cx={50} cy={dotY} r={16} fill={info.color} opacity={0.35} />
          ) : copy ? null : (
            <circle cx={50} cy={50} r={7} fill="#d8cbb4" />
          )}
        </svg>
      </motion.span>

      {hit && (
        <motion.span
          key={`burst-${tick}`}
          className={`pointer-events-none absolute inset-0 ${radius} border-4`}
          style={{ borderColor: info.color, background: on ? 'transparent' : `${info.color}66` }}
          initial={{ scale: 0.9, opacity: 1 }}
          animate={{ scale: 1.35, opacity: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        />
      )}

      {diff && (
        <motion.span
          className={`pointer-events-none absolute -inset-1 ${radius} border-4 ${diff === 'missing' ? 'border-dashed' : ''} border-[#ff9f1c]`}
          initial={{ opacity: 0, scale: 1.3 }}
          animate={diff === 'extra' ? { opacity: 1, scale: 1, rotate: [0, -6, 6, -3, 0] } : { opacity: [1, 0.45, 1], scale: 1 }}
          transition={diff === 'extra' ? { duration: 0.5 } : { duration: 1.2, repeat: Infinity }}
        />
      )}
    </button>
  );
}
