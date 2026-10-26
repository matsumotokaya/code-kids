import { motion } from 'motion/react';
import { keyOf } from './engine';
import { BeltShape, BoxArt, ChuteArt, FactoryDefs, ItemArt, SorterShape, WallArt, type PartTone } from './art';
import type { ItemRun, Part, Point, RunTrace, SortLevel } from './types';

/** Milliseconds for an item to cross one cell. */
export const STEP_MS = 360;
const STEP_S = STEP_MS / 1000;

interface Props {
  level: SortLevel;
  turns: Map<string, number>;
  placed: Map<string, Part>;
  trace: RunTrace | null;
  /** How many ticks the machine has run; -1 before pressing the button. */
  clock: number;
  /** The belts scroll while the machine runs. */
  running: boolean;
  /** Outline the floor where the selected part can go. */
  showSpots: boolean;
  /** Cell to wiggle (a bolted part that was tapped), with a counter to replay it. */
  wiggle: { key: string; n: number } | null;
  onTap: (p: Point) => void;
}

const MARGIN = 30;
const SIDE = 16;

function cellsOf(level: SortLevel): Point[] {
  const cells: Point[] = [];
  for (let y = 0; y < level.h; y++) for (let x = 0; x < level.w; x++) cells.push({ x, y });
  return cells;
}

function FloorTile({ x, y }: Point) {
  const dark = (x + y) % 2 === 1;
  return (
    <g transform={`translate(${x * 100} ${y * 100})`}>
      <rect x={3} y={3} width={94} height={94} rx={12} fill={dark ? '#c5cdd6' : '#d3dae2'} />
      {[
        [14, 14],
        [86, 14],
        [14, 86],
        [86, 86],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={3} fill="#a9b3be" />
      ))}
    </g>
  );
}

/** Where an item is at `clock`, and whether its trip is over. Null before it leaves the chute. */
function itemAt(item: ItemRun, clock: number): { at: Point; ended: boolean } | null {
  const k = clock - item.start;
  if (k < 0) return null;
  return { at: item.path[Math.min(k, item.path.length - 1)], ended: k >= item.path.length - 1 };
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function Factory({ level, turns, placed, trace, clock, running, showSpots, wiggle, onTap }: Props) {
  const W = level.w * 100;
  const H = level.h * 100;
  const viewBox = `${-MARGIN} ${-MARGIN} ${W + MARGIN * 2} ${H + MARGIN * 2 + SIDE}`;
  const cells = cellsOf(level);
  const occupied = new Set([
    keyOf(level.chute),
    ...level.boxes.map(keyOf),
    ...level.walls.map(keyOf),
    ...level.fixed.map(keyOf),
    ...level.turnable.map(keyOf),
  ]);

  const parts: { key: string; at: Point; part: Part; tone: PartTone; badge: boolean }[] = [
    ...level.fixed.map((f) => ({ key: keyOf(f), at: f, part: f.part, tone: 'bolted' as const, badge: false })),
    ...level.turnable.map((t) => ({ key: keyOf(t), at: t, part: { kind: t.part.kind, rot: turns.get(keyOf(t)) ?? t.part.rot }, tone: 'plain' as const, badge: true })),
    ...[...placed].map(([k, part]) => {
      const [x, y] = k.split(',').map(Number);
      return { key: k, at: { x, y }, part, tone: 'plain' as const, badge: false };
    }),
  ];

  const states = trace ? trace.items.map((item) => ({ item, state: itemAt(item, clock) })) : [];
  const landed = (b: Point, end: ItemRun['end']) =>
    states.filter(({ item, state }) => state?.ended && item.end === end && keyOf(item.path[item.path.length - 1]) === keyOf(b)).length;
  const failed = trace?.failItem != null && clock >= trace.lastTick ? trace.items[trace.failItem] : null;
  const failAt = failed ? failed.path[failed.path.length - 1] : null;

  return (
    <svg viewBox={viewBox} className="h-full w-full touch-manipulation select-none" preserveAspectRatio="xMidYMid meet" role="img" aria-label="こうじょうの ゆか">
      <FactoryDefs />
      <rect x={-MARGIN + 2} y={-MARGIN + 2 + SIDE} width={W + MARGIN * 2 - 4} height={H + MARGIN * 2 - 4} rx={36} fill="#45525f" />
      <rect x={-MARGIN + 2} y={-MARGIN + 2} width={W + MARGIN * 2 - 4} height={H + MARGIN * 2 - 4} rx={36} fill="#6b7c8c" />
      <rect x={-10} y={-10} width={W + 20} height={H + 20} rx={26} fill="#9aa7b4" />

      {cells.map((c) => (
        <FloorTile key={keyOf(c)} x={c.x} y={c.y} />
      ))}
      {showSpots &&
        cells
          .filter((c) => !occupied.has(keyOf(c)) && !placed.has(keyOf(c)))
          .map((c) => (
            <rect
              key={`spot-${keyOf(c)}`}
              x={c.x * 100 + 14}
              y={c.y * 100 + 14}
              width={72}
              height={72}
              rx={18}
              fill="#ffffff"
              fillOpacity={0.3}
              stroke="#ffffff"
              strokeWidth={3}
              strokeDasharray="10 8"
            />
          ))}
      {level.walls.map((w) => (
        <g key={keyOf(w)} transform={`translate(${w.x * 100} ${w.y * 100})`}>
          <WallArt />
        </g>
      ))}

      {parts.map(({ key, at, part, tone, badge }) => (
        <g key={key} transform={`translate(${at.x * 100} ${at.y * 100})`}>
          <motion.g
            key={wiggle?.key === key ? `w${wiggle.n}` : 'still'}
            animate={wiggle?.key === key ? { x: [0, 7, -6, 4, 0] } : undefined}
            transition={{ duration: 0.35 }}
          >
            {part.kind === 'belt' ? (
              <motion.g
                initial={false}
                animate={{ rotate: part.rot * 90 }}
                transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }}
              >
                <rect width={100} height={100} fill="transparent" />
                {/*
                  fill-box measures the scrolling chevrons too, clipped part included, so the turning centre
                  would drift every frame and the whole belt would shake. This box, centred on the cell and
                  larger than the chevrons ever reach, keeps the centre at (50, 50).
                */}
                <rect x={-60} y={-60} width={220} height={220} fill="none" pointerEvents="none" />
                <BeltShape tone={tone} running={running} />
              </motion.g>
            ) : (
              <SorterShape kind={part.kind} rot={part.rot} tone={tone} />
            )}
          </motion.g>
          {badge && (
            <g transform="translate(82 18)">
              <circle r={15} fill="#ffffff" stroke="#2f9bff" strokeWidth={3} />
              <path d="M -7 2 A 7 7 0 1 0 -2 -6.5" fill="none" stroke="#2f9bff" strokeWidth={3.5} strokeLinecap="round" />
              <path d="M -5 -12 L -1 -6 L -8 -4 Z" fill="#2f9bff" />
            </g>
          )}
        </g>
      ))}

      {level.boxes.map((b) => {
        const count = landed(b, 'boxed');
        const sad = landed(b, 'wrong') > 0;
        return (
          <g key={keyOf(b)} transform={`translate(${b.x * 100} ${b.y * 100})`}>
            <motion.g
              key={`${count}-${sad}`}
              initial={count > 0 || sad ? { scaleY: 0.85 } : false}
              animate={{ scaleY: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 12 }}
              style={{ transformBox: 'fill-box', transformOrigin: '50% 100%' }}
            >
              <BoxArt color={b.color} count={count} sad={sad} />
            </motion.g>
          </g>
        );
      })}

      {failAt && (
        <motion.circle
          cx={clamp(failAt.x * 100 + 50, 0, W)}
          cy={clamp(failAt.y * 100 + 50, 0, H)}
          r={46}
          fill="none"
          stroke="#ff8a3d"
          strokeWidth={6}
          strokeDasharray="14 10"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }}
        />
      )}

      {states.map(({ item, state }, i) => {
        if (!state) return null;
        const { at, ended } = state;
        const offBoard = at.x < 0 || at.y < 0 || at.x >= level.w || at.y >= level.h;
        const x = clamp(at.x * 100 + 50, -14, W + 14);
        const y = clamp(at.y * 100 + 50, -14, H + 14);
        const end = ended ? item.end : null;
        const effect =
          end === 'boxed'
            ? { scale: 0.3, opacity: 0, y: 14, rotate: 0, x: 0 }
            : end === 'wrong'
              ? { scale: 0.75, opacity: 1, y: -34, rotate: [0, -12, 12, -8, 0], x: 0 }
              : end === 'fell'
                ? { scale: offBoard ? 0.55 : 0.75, opacity: offBoard ? 0.6 : 0.9, y: offBoard ? 24 : 12, rotate: 35, x: 0 }
                : end === 'bump'
                  ? { scale: 1, opacity: 1, y: 0, rotate: 0, x: [0, 10, -8, 6, 0] }
                  : end === 'loop'
                    ? { scale: 1, opacity: 1, y: 0, rotate: 360, x: 0 }
                    : { scale: 1, opacity: 1, y: 0, rotate: 0, x: 0 };
        return (
          <motion.g
            key={`item-${i}`}
            initial={{ x, y }}
            animate={{ x, y }}
            transition={{ duration: STEP_S, ease: 'linear' }}
          >
            <motion.g
              initial={{ scale: 0.4, opacity: 0, y: 0, rotate: 0, x: 0 }}
              animate={effect}
              transition={{ duration: end === 'loop' ? 0.9 : ended ? 0.45 : 0.2, delay: ended && end !== 'bump' ? STEP_S * 0.6 : 0 }}
            >
              <g transform="scale(0.7) translate(-50 -52)">
                <ItemArt color={item.color} />
              </g>
            </motion.g>
          </motion.g>
        );
      })}

      <g transform={`translate(${level.chute.x * 100} ${level.chute.y * 100})`}>
        <ChuteArt out={level.chute.out} running={running} />
      </g>

      {cells.map((c) => (
        <rect
          key={`hit-${keyOf(c)}`}
          x={c.x * 100}
          y={c.y * 100}
          width={100}
          height={100}
          fill="transparent"
          className="cursor-pointer"
          onClick={() => onTap(c)}
          aria-label={`${c.x + 1}れつめ ${c.y + 1}ぎょうめ`}
        />
      ))}
    </svg>
  );
}
