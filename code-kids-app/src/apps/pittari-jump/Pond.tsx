import { AnimatePresence, motion } from 'motion/react';
import type { Mood } from '../../components/Character';
import { STAR_PATH } from '../../components/tiles';
import { JUMP_CARD_META } from './cards';
import { FrogArt, type Facing } from './Frog';
import type { JumpCardKind, JumpLevel } from './types';

/** Distance between neighbouring pads in SVG units. */
const P = 100;
const PAD_Y = 250;
const HEIGHT = 380;
/** Room past each end for a frog that jumps off the line. */
const SIDE = 50;
// Pads, numbers and the frog nearly fill their 100-unit slot: the line is long and
// portrait tablets are narrow, so anything smaller becomes unreadable at 0–16.
const NUMBER_Y = PAD_Y + 72;

export interface Hop {
  from: number;
  to: number;
  /** Increments for every hop so the frog animation restarts even for a repeated jump. */
  seq: number;
}

export interface TrailHop {
  from: number;
  to: number;
  kind: JumpCardKind;
}

interface Props {
  level: JumpLevel;
  /** Pad the frog is on (or heading to). Highlighted on the number line. */
  value: number;
  hop: Hop | null;
  trail: TrailHop[];
  mood: Mood;
  facing: Facing;
  sunk: boolean;
  /** Incrementing counters that replay the crocodile bite and the frog's shake. */
  snap: number;
  shake: number;
  won: boolean;
}

const padX = (n: number) => n * P + P / 2;

export function hopDuration(from: number, to: number): number {
  return Math.min(0.85, 0.42 + Math.abs(to - from) * 0.04);
}

function arcHeight(from: number, to: number): number {
  return Math.min(165, 55 + Math.abs(to - from) * 20);
}

export function Pond({ level, value, hop, trail, mood, facing, sunk, snap, shake, won }: Props) {
  const width = (level.max + 1) * P;
  const pads = Array.from({ length: level.max + 1 }, (_, i) => i);
  const crocs = new Set(level.crocs);
  // A frog that leaves the line is drawn just past the end it left from.
  const frogX = (n: number) => padX(Math.max(-0.9, Math.min(level.max + 0.9, n)));

  return (
    <svg
      viewBox={`${-SIDE} 0 ${width + SIDE * 2} ${HEIGHT}`}
      className="h-full w-full overflow-visible"
      preserveAspectRatio="xMidYMax meet"
      role="img"
      aria-label={`${level.start} から ${level.goal} まで ジャンプする かずの せん`}
    >
      <defs>
        <linearGradient id="pond-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9be3ff" />
          <stop offset="1" stopColor="#5fb8ea" />
        </linearGradient>
      </defs>

      <rect x={-SIDE} y={PAD_Y - 34} width={width + SIDE * 2} height={HEIGHT - PAD_Y + 34} rx={34} fill="url(#pond-water)" />
      {pads.map((i) =>
        i % 3 === 1 ? (
          <path
            key={`wave-${i}`}
            className="anim-wave"
            d={`M ${padX(i) - 22} ${PAD_Y + 30} q 11 -7 22 0 t 22 0`}
            fill="none"
            stroke="rgba(255,255,255,0.55)"
            strokeWidth={4}
            strokeLinecap="round"
          />
        ) : null,
      )}

      {pads.map((i) => (
        <g key={`pad-${i}`} transform={`translate(${padX(i)} ${PAD_Y})`}>
          {crocs.has(i) ? <Croc snap={i === value ? snap : 0} /> : <LilyPad goal={i === level.goal} />}
        </g>
      ))}

      {pads.map((i) => (
        <NumberBadge key={`num-${i}`} n={i} x={padX(i)} tone={i === value ? 'here' : i === level.goal ? 'goal' : crocs.has(i) ? 'croc' : 'plain'} />
      ))}

      {trail.map((t, i) => (
        <TrailArc key={i} from={t.from} to={t.to} kind={t.kind} x={frogX} />
      ))}

      <AnimatePresence>
        {!won && (
          <motion.g
            key="goal-star"
            exit={{ scale: 2, opacity: 0, rotate: 40 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }}
          >
            <g className="anim-float">
              <g transform={`translate(${padX(level.goal) - 48} ${PAD_Y - 200}) scale(0.96)`}>
                <path d={STAR_PATH} fill="#ffd84d" stroke="#d9a92a" strokeWidth={6} strokeLinejoin="round" />
              </g>
            </g>
          </motion.g>
        )}
      </AnimatePresence>

      <motion.g
        key={hop ? `hop-${hop.seq}` : 'rest'}
        initial={hop ? { x: frogX(hop.from), y: 0 } : false}
        animate={{ x: frogX(hop ? hop.to : value), y: hop ? [0, -arcHeight(hop.from, hop.to), 0] : 0 }}
        transition={
          hop
            ? {
                x: { duration: hopDuration(hop.from, hop.to), ease: 'linear' },
                y: { duration: hopDuration(hop.from, hop.to), times: [0, 0.5, 1], ease: ['easeOut', 'easeIn'] },
              }
            : { duration: 0 }
        }
      >
        <motion.g
          key={shake}
          animate={shake > 0 ? { x: [0, -12, 12, -7, 7, 0] } : { x: 0 }}
          transition={{ duration: 0.45 }}
        >
          <motion.g
            animate={sunk ? { scale: 0.5, opacity: 0.3, y: 34 } : { scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            style={{ transformBox: 'fill-box', transformOrigin: '50% 80%' }}
          >
            <g transform={`translate(-55 ${PAD_Y - 108}) scale(1.1)`}>
              <FrogArt mood={mood} facing={facing} />
            </g>
          </motion.g>
          {sunk && (
            <motion.g initial={{ scale: 0.3, opacity: 0.9 }} animate={{ scale: 1.4, opacity: 0 }} transition={{ duration: 0.9 }} style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }}>
              <ellipse cx={0} cy={PAD_Y} rx={50} ry={18} fill="none" stroke="#ffffff" strokeWidth={5} />
            </motion.g>
          )}
        </motion.g>
      </motion.g>
    </svg>
  );
}

function LilyPad({ goal }: { goal: boolean }) {
  return (
    <g>
      <ellipse cy={8} rx={49} ry={19} fill="#2e7d3a" opacity={0.3} />
      {goal && <ellipse rx={57} ry={26} fill="none" stroke="#ffd84d" strokeWidth={7} className="anim-float" />}
      <path d="M 0 0 L 33.9 -14.1 A 48 20 0 1 0 44.5 -7.5 Z" fill={goal ? '#a6e36f' : '#7ccf5a'} stroke="#3f9a3a" strokeWidth={3.5} strokeLinejoin="round" />
      <path d="M 0 0 L -28 -9 M 0 0 L -11 13 M 0 0 L 24 11" stroke="#5fb546" strokeWidth={3} strokeLinecap="round" />
    </g>
  );
}

function Croc({ snap }: { snap: number }) {
  return (
    <motion.g
      key={snap}
      animate={snap > 0 ? { rotate: [0, -14, 0, -10, 0], y: [0, -6, 0, -4, 0] } : { rotate: 0 }}
      transition={{ duration: 0.6 }}
      style={{ transformBox: 'fill-box', transformOrigin: '20% 80%' }}
    >
      <ellipse cy={9} rx={52} ry={16} fill="#1f5e2a" opacity={0.35} />
      <path d="M -50 8 C -52 -22 -32 -34 -8 -32 L 34 -26 C 50 -24 56 -6 50 8 Z" fill="#4e9a4f" stroke="#245c2a" strokeWidth={4} strokeLinejoin="round" />
      <path d="M -40 0 L 46 0" stroke="#245c2a" strokeWidth={3} strokeLinecap="round" />
      {[-28, -15, -2, 11, 24, 37].map((x) => (
        <path key={x} d={`M ${x} 0 l 5 8 l 5 -8 Z`} fill="#ffffff" stroke="#245c2a" strokeWidth={1.5} strokeLinejoin="round" />
      ))}
      <circle cx={34} cy={-19} r={3} fill="#245c2a" />
      <circle cx={43} cy={-16} r={3} fill="#245c2a" />
      {[-34, -11].map((x) => (
        <g key={x}>
          <circle cx={x} cy={-38} r={14} fill="#4e9a4f" stroke="#245c2a" strokeWidth={4} />
          <circle cx={x} cy={-39} r={9} fill="#ffe66d" />
          <ellipse cx={x + 1} cy={-39} rx={3} ry={7} fill="#1f1f1f" />
        </g>
      ))}
    </motion.g>
  );
}

const BADGE_TONES = {
  plain: { fill: '#ffffff', stroke: '#2b7bb9', text: '#23415a' },
  here: { fill: '#c4f27a', stroke: '#2a7a40', text: '#1f4d23' },
  goal: { fill: '#ffd84d', stroke: '#d9a92a', text: '#3b2f2f' },
  croc: { fill: '#ffe1dc', stroke: '#d0675a', text: '#7a2e25' },
};

function NumberBadge({ n, x, tone }: { n: number; x: number; tone: keyof typeof BADGE_TONES }) {
  const t = BADGE_TONES[tone];
  return (
    <g>
      <circle cx={x} cy={NUMBER_Y} r={40} fill={t.fill} stroke={t.stroke} strokeWidth={5} />
      <text x={x} y={NUMBER_Y + 17} textAnchor="middle" fontSize={48} fontWeight={900} fill={t.text}>
        {n}
      </text>
    </g>
  );
}

function TrailArc({ from, to, kind, x }: TrailHop & { x: (n: number) => number }) {
  const x1 = x(from);
  const x2 = x(to);
  const base = PAD_Y - 24;
  const h = arcHeight(from, to) * 0.9;
  const mid = (x1 + x2) / 2;
  const meta = JUMP_CARD_META[kind];
  return (
    <g>
      <path d={`M ${x1} ${base} Q ${mid} ${base - 2 * h} ${x2} ${base}`} fill="none" stroke="#ffffff" strokeWidth={5} strokeDasharray="10 10" strokeLinecap="round" opacity={0.9} />
      <g transform={`translate(${mid} ${base - h})`}>
        <rect x={-42} y={-26} width={84} height={50} rx={25} fill={meta.bg} stroke="#ffffff" strokeWidth={4} />
        <text y={12} textAnchor="middle" fontSize={34} fontWeight={900} fill="#ffffff">
          {meta.face}
        </text>
      </g>
    </g>
  );
}
