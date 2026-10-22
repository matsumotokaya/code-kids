import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { isEnd, isLoop, isMove, loopRoles, type LoopRole } from '../game/engine';
import type { Card } from '../game/types';
import { arrowLook, CARD_META, EndIcon, LoopIcon, LOOP_BAND } from './CommandCard';

export interface LoopRun {
  /** Index of the くりかえし card whose pass is running. */
  index: number;
  pass: number;
  count: number;
}

interface Props {
  program: Card[];
  slots: number;
  activeIndex: number | null;
  loopRun: LoopRun | null;
  /** The gap left by a removed card, which the next tray card fills; null means the next card goes at the end. */
  cursor: number | null;
  disabled: boolean;
  onRemove: (id: string) => void;
  /** Tapping an empty slot moves the insertion point back to the end. */
  onCursorEnd: () => void;
}

type Item = { type: 'card'; card: Card; index: number; role: LoopRole | null } | { type: 'gap'; inLoop: boolean; open: boolean };

const CELL = 'size-14 sm:size-16';

/**
 * World 2 program strip. Differences from the World 1 `ProgramStrip`:
 * - a teal band behind a くりかえし, its cards and its おわり shows exactly what is repeated
 *   (a loop without おわり trails off with a dashed edge; an おわり without くりかえし is dashed red)
 * - tapping a card removes it and leaves a glowing gap there; the next tray card fills the gap and it closes.
 *   That is how なおして stages are fixed without rebuilding the whole program.
 *   Without a gap, the first empty slot glows instead: that is where the next card goes.
 */
export function LoopProgramStrip({ program, slots, activeIndex, loopRun, cursor, disabled, onRemove, onCursorEnd }: Props) {
  const roles = loopRoles(program);
  const at = cursor ?? program.length;
  const full = program.length >= slots;
  const insideAt = (i: number) => {
    const before = roles[i - 1];
    return before === 'start' || before === 'body' || before === 'open-body';
  };

  const items: Item[] = program.map((card, index) => ({ type: 'card', card, index, role: roles[index] }));
  if (!full) {
    const inLoop = insideAt(at);
    const open = inLoop && (at === program.length || roles[at] === 'open-body');
    items.splice(at, 0, { type: 'gap', inLoop, open });
  }
  const empties = Math.max(0, slots - items.length);
  const activeLoopEnd = loopRun ? findEnd(roles, loopRun.index) : -1;

  return (
    <div className="flex flex-wrap items-center gap-y-2 py-2" role="list" aria-label="ならべた カード">
      {items.map((item, pos) => {
        if (item.type === 'gap') {
          return (
            <Band key="gap" role={item.inLoop ? (item.open ? 'open-tail' : 'body') : null} active={false}>
              <div
                role="listitem"
                aria-label="つぎの カードは ここに はいるよ"
                className={`${CELL} flex shrink-0 items-center justify-center rounded-2xl border-[3px] border-dashed border-sun-dark bg-sun/35 text-lg font-black text-ink/50 ${disabled ? '' : 'animate-pulse'}`}
              >
                {pos + 1}
              </div>
            </Band>
          );
        }
        const { card, index, role } = item;
        const inActiveLoop = loopRun !== null && index >= loopRun.index && index <= activeLoopEnd;
        const isActive = activeIndex === index;
        const bandRole = role === 'open-body' && index === program.length - 1 && (full || at !== program.length) ? 'open-tail' : role;
        return (
          <Band key={card.id} role={bandRole === 'stray' ? null : bandRole} active={inActiveLoop}>
            <PlacedCard
              card={card}
              position={pos + 1}
              active={isActive}
              stray={role === 'stray'}
              pass={loopRun && loopRun.index === index ? loopRun : null}
              disabled={disabled}
              onRemove={onRemove}
            />
          </Band>
        );
      })}
      {Array.from({ length: empties }).map((_, i) => (
        <div key={`empty-${i}`} className="px-1 py-1">
          <button
            type="button"
            disabled={disabled}
            onClick={onCursorEnd}
            aria-label="さいごに ならべる"
            className={`${CELL} flex shrink-0 items-center justify-center rounded-2xl border-[3px] border-dashed border-ink/20 bg-white/40 text-lg font-black text-ink/35`}
          >
            {items.length + i + 1}
          </button>
        </div>
      ))}
    </div>
  );
}

function findEnd(roles: (LoopRole | null)[], start: number): number {
  for (let i = start + 1; i < roles.length; i++) {
    if (roles[i] === 'end') return i;
    if (roles[i] !== 'body' && roles[i] !== 'open-body') return i - 1;
  }
  return roles.length - 1;
}

type BandRole = LoopRole | 'open-tail' | null;

/** One cell of the strip. Cells next to each other in a loop share a continuous teal background. */
function Band({ role, active, children }: { role: BandRole; active: boolean; children: ReactNode }) {
  if (!role) return <div className="px-1 py-1">{children}</div>;
  const rounded =
    role === 'start' ? 'rounded-l-[1.25rem] pl-1.5' : role === 'end' ? 'rounded-r-[1.25rem] pr-1.5' : '';
  const dashed = role === 'open-tail' || role === 'open-body' ? 'border-y-[3px] border-dashed' : 'border-y-[3px] border-solid';
  const edges =
    role === 'start'
      ? 'border-l-[3px] border-solid'
      : role === 'end'
        ? 'border-r-[3px] border-solid'
        : role === 'open-tail'
          ? 'border-r-[3px] border-dashed rounded-r-[1.25rem]'
          : '';
  return (
    <div
      className={`px-1 py-[1px] transition-colors duration-200 ${rounded} ${dashed} ${edges}`}
      style={{ backgroundColor: active ? LOOP_BAND.active : LOOP_BAND.fill, borderColor: LOOP_BAND.edge }}
    >
      {children}
    </div>
  );
}

interface PlacedProps {
  card: Card;
  position: number;
  active: boolean;
  stray: boolean;
  pass: { pass: number; count: number } | null;
  disabled: boolean;
  onRemove: (id: string) => void;
}

function PlacedCard({ card, position, active, stray, pass, disabled, onRemove }: PlacedProps) {
  let bg: string;
  let border: string;
  let face: ReactNode;
  let label: string;
  let times = 1;
  if (isMove(card)) {
    const look = arrowLook(card);
    ({ bg, border, face, label } = look);
    times = card.times;
  } else if (isLoop(card)) {
    const meta = CARD_META[card.loop === 2 ? 'loop2' : 'loop3'];
    ({ bg, border } = meta);
    label = `くりかえし ${card.loop}かい`;
    face = <LoopIcon count={card.loop} className="size-11" />;
  } else {
    ({ bg, border } = CARD_META.end);
    label = stray ? 'おわり（くりかえしが ないよ）' : 'くりかえしの おわり';
    face = <EndIcon className="size-10" />;
  }

  return (
    <motion.button
      type="button"
      role="listitem"
      layout
      initial={{ scale: 0.4, opacity: 0 }}
      animate={{ scale: active ? 1.12 : 1, opacity: stray ? 0.55 : 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 26 }}
      disabled={disabled}
      onClick={() => onRemove(card.id)}
      aria-label={`${position}ばんめ ${label}${times > 1 ? ` ${times}かい` : ''}。タップで けす`}
      className={`relative flex ${CELL} shrink-0 items-center justify-center rounded-2xl border-b-[5px] shadow-md ${active ? 'ring-4 ring-white' : ''} ${
        stray ? 'outline-[3px] outline-dashed outline-[#e05555]' : ''
      }`}
      style={{ backgroundColor: bg, borderColor: border }}
    >
      {face}
      {times > 1 && (
        <span
          className="absolute -right-1.5 -top-1.5 flex size-7 items-center justify-center rounded-full border-2 border-white text-sm font-black shadow"
          style={{
            backgroundColor: times === 2 ? CARD_META.x2.bg : CARD_META.x3.bg,
            color: times === 2 ? CARD_META.x2.text : CARD_META.x3.text,
          }}
        >
          ×{times}
        </span>
      )}
      {pass && (
        <motion.span
          key={pass.pass}
          initial={{ scale: 0.3, y: 6 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 600, damping: 18 }}
          className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border-2 border-white bg-[#11806f] px-2 py-0.5 text-xs font-black text-white shadow"
        >
          {pass.pass}かいめ
        </motion.span>
      )}
      {isEnd(card) && stray && (
        <span className="absolute -bottom-2 -right-2 flex size-6 items-center justify-center rounded-full border-2 border-white bg-[#e05555] text-sm font-black text-white shadow">
          ?
        </span>
      )}
    </motion.button>
  );
}
