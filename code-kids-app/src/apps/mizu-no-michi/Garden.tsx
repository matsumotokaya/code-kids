import { AnimatePresence, motion } from 'motion/react';
import { GrassTile, RockTile, SvgDefs } from '../../components/tiles';
import { DELTA, keyOf, openings } from './engine';
import { EDGE, FlowerArt, PipeShape, TapArt, type PipeTone } from './art';
import type { FlowTrace, Piece, PipeLevel, Point, Side } from './types';

/** Milliseconds for water to cross one cell. */
export const STEP_MS = 280;

interface Props {
  level: PipeLevel;
  turns: Map<string, number>;
  placed: Map<string, Piece>;
  trace: FlowTrace | null;
  /** How many steps the water has advanced; -1 before pouring. */
  clock: number;
  /** Outline the grass where the selected pipe can go. */
  showSpots: boolean;
  /** Cell to wiggle (a bolted pipe that was tapped), with a counter to replay it. */
  wiggle: { key: string; n: number } | null;
  onTap: (p: Point) => void;
}

const MARGIN = 26;
const SIDE = 16;

const WATER = '#2f9bff';
const HALF_S = STEP_MS / 2000;

function cellsOf(level: PipeLevel): Point[] {
  const cells: Point[] = [];
  for (let y = 0; y < level.h; y++) for (let x = 0; x < level.w; x++) cells.push({ x, y });
  return cells;
}

/** Water running along one arm of a cell: from the edge to the middle when it comes in, the other way when it goes out. */
function WaterArm({ cell, side, inward, delay }: { cell: Point; side: Side; inward: boolean; delay: number }) {
  const e = EDGE[side];
  const [a, b] = inward ? [e, { x: 50, y: 50 }] : [{ x: 50, y: 50 }, e];
  return (
    <motion.path
      d={`M ${cell.x * 100 + a.x} ${cell.y * 100 + a.y} L ${cell.x * 100 + b.x} ${cell.y * 100 + b.y}`}
      stroke={WATER}
      strokeWidth={17}
      strokeLinecap="round"
      fill="none"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: HALF_S, delay, ease: 'linear' }}
    />
  );
}

export function Garden({ level, turns, placed, trace, clock, showSpots, wiggle, onTap }: Props) {
  const W = level.w * 100;
  const H = level.h * 100;
  const viewBox = `${-MARGIN} ${-MARGIN} ${W + MARGIN * 2} ${H + MARGIN * 2 + SIDE}`;
  const cells = cellsOf(level);
  const occupied = new Set([keyOf(level.source), ...level.goals.map(keyOf), ...level.rocks.map(keyOf), ...level.fixed.map(keyOf), ...level.turnable.map(keyOf)]);

  const pieces: { key: string; at: Point; piece: Piece; tone: PipeTone; badge: boolean }[] = [
    ...level.fixed.map((f) => ({ key: keyOf(f), at: f, piece: f.piece, tone: 'bolted' as const, badge: false })),
    ...level.turnable.map((t) => ({ key: keyOf(t), at: t, piece: { kind: t.piece.kind, rot: turns.get(keyOf(t)) ?? t.piece.rot }, tone: 'plain' as const, badge: true })),
    ...[...placed].map(([k, piece]) => {
      const [x, y] = k.split(',').map(Number);
      return { key: k, at: { x, y }, piece, tone: 'plain' as const, badge: false };
    }),
  ];

  const fills = trace ? trace.fills.filter((f) => f.depth <= clock) : [];
  const leaks = trace ? trace.leaks.filter((l) => l.depth + 1 <= clock) : [];
  const bloomed = new Set(trace ? trace.goals.filter((g) => g.depth <= clock).map(keyOf) : []);

  return (
    <svg viewBox={viewBox} className="h-full w-full touch-manipulation select-none" preserveAspectRatio="xMidYMid meet" role="img" aria-label="にわの ばん">
      <SvgDefs />
      <rect x={-MARGIN + 2} y={-MARGIN + 2 + SIDE} width={W + MARGIN * 2 - 4} height={H + MARGIN * 2 - 4} rx={36} fill="#8c5e2a" />
      <rect x={-MARGIN + 2} y={-MARGIN + 2} width={W + MARGIN * 2 - 4} height={H + MARGIN * 2 - 4} rx={36} fill="#b7833e" />
      <rect x={-10} y={-10} width={W + 20} height={H + 20} rx={26} fill="#6fbf52" />

      {cells.map((c) => (
        <GrassTile key={keyOf(c)} x={c.x} y={c.y} />
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
              fillOpacity={0.18}
              stroke="#ffffff"
              strokeWidth={3}
              strokeDasharray="10 8"
              opacity={0.75}
            />
          ))}
      {level.rocks.map((r) => (
        <RockTile key={keyOf(r)} x={r.x} y={r.y} />
      ))}

      {pieces.map(({ key, at, piece, tone, badge }) => (
        <g key={key} transform={`translate(${at.x * 100} ${at.y * 100})`}>
          <motion.g
            key={wiggle?.key === key ? `w${wiggle.n}` : 'still'}
            animate={wiggle?.key === key ? { x: [0, 7, -6, 4, 0] } : undefined}
            transition={{ duration: 0.35 }}
          >
            <motion.g
              initial={false}
              animate={{ rotate: piece.rot * 90 }}
              transition={{ type: 'spring', stiffness: 420, damping: 24 }}
              style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }}
            >
              <rect width={100} height={100} fill="transparent" />
              <PipeShape piece={{ kind: piece.kind, rot: 0 }} tone={tone} />
            </motion.g>
          </motion.g>
          {badge && (
            <g transform="translate(80 20)">
              <circle r={15} fill="#ffffff" stroke="#2f9bff" strokeWidth={3} />
              <path d="M -7 2 A 7 7 0 1 0 -2 -6.5" fill="none" stroke="#2f9bff" strokeWidth={3.5} strokeLinecap="round" />
              <path d="M -5 -12 L -1 -6 L -8 -4 Z" fill="#2f9bff" />
            </g>
          )}
        </g>
      ))}

      {trace && clock >= 0 && <WaterArm cell={level.source} side={level.source.out} inward={false} delay={0} />}
      {fills.map((f) => {
        const piece = pieces.find((p) => p.key === keyOf(f))?.piece;
        const outs = piece ? openings(piece).filter((s) => s !== f.from) : [];
        return (
          <g key={`water-${keyOf(f)}`}>
            <WaterArm cell={f} side={f.from} inward delay={0} />
            {outs.map((s) => (
              <WaterArm key={s} cell={f} side={s} inward={false} delay={HALF_S} />
            ))}
          </g>
        );
      })}

      <g transform={`translate(${level.source.x * 100} ${level.source.y * 100})`}>
        <TapArt out={level.source.out} running={!!trace && clock >= 0} />
      </g>
      {level.goals.map((g) => (
        <g key={keyOf(g)} transform={`translate(${g.x * 100} ${g.y * 100})`}>
          <FlowerArt bloomed={bloomed.has(keyOf(g))} />
        </g>
      ))}

      <AnimatePresence>
        {leaks.map((l) => {
          const e = EDGE[l.side];
          const cx = l.x * 100 + e.x + DELTA[l.side].x * 8;
          const cy = l.y * 100 + e.y + DELTA[l.side].y * 8;
          return (
            <motion.g key={`leak-${keyOf(l)}-${l.side}`} transform={`translate(${cx} ${cy})`}>
              <motion.ellipse
                rx={30}
                ry={18}
                fill="#7cc8ff"
                fillOpacity={0.75}
                stroke="#2f9bff"
                strokeWidth={3}
                initial={{ scale: 0.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
              {[-1, 0, 1].map((i) => (
                <motion.circle
                  key={i}
                  r={5}
                  fill="#2f9bff"
                  initial={{ x: 0, y: 0, opacity: 1 }}
                  animate={{ x: i * 22, y: [-4, -26, -8], opacity: [1, 1, 0] }}
                  transition={{ duration: 0.7, repeat: Infinity, repeatDelay: 0.3, delay: (i + 1) * 0.12 }}
                />
              ))}
            </motion.g>
          );
        })}
      </AnimatePresence>

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
