import { motion } from 'motion/react';
import { openings } from './engine';
import type { Piece, PieceKind, Side } from './types';

export const EDGE: Record<Side, { x: number; y: number }> = {
  up: { x: 50, y: 0 },
  right: { x: 100, y: 50 },
  down: { x: 50, y: 100 },
  left: { x: 0, y: 50 },
};
const ANGLE: Record<Side, number> = { up: 0, right: 90, down: 180, left: 270 };

export type PipeTone = 'plain' | 'bolted';

const TONES: Record<PipeTone, { outer: string; inner: string; shine: string }> = {
  plain: { outer: '#4f6b7c', inner: '#a9c2d0', shine: '#d7e6ee' },
  bolted: { outer: '#6b5a4a', inner: '#c4a888', shine: '#e8d6bf' },
};

/** One pipe in a 100×100 cell, drawn arm by arm so every shape shares the same joints. */
export function PipeShape({ piece, tone = 'plain' }: { piece: Piece; tone?: PipeTone }) {
  const c = TONES[tone];
  const sides = openings({ kind: piece.kind, rot: 0 });
  return (
    <g>
      {sides.map((s) => (
        <g key={`o-${s}`} transform={`rotate(${ANGLE[s]} 50 50)`}>
          <rect x={30} y={0} width={40} height={50} fill={c.outer} />
          <rect x={24} y={0} width={52} height={11} rx={3} fill={c.outer} />
        </g>
      ))}
      <circle cx={50} cy={50} r={20} fill={c.outer} />
      {sides.map((s) => (
        <g key={`i-${s}`} transform={`rotate(${ANGLE[s]} 50 50)`}>
          <rect x={35} y={0} width={30} height={50} fill={c.inner} />
          <rect x={39} y={2} width={6} height={44} rx={3} fill={c.shine} opacity={0.8} />
        </g>
      ))}
      <circle cx={50} cy={50} r={15} fill={c.inner} />
      {tone === 'bolted' &&
        [
          [36, 36],
          [64, 36],
          [36, 64],
          [64, 64],
        ].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={4.5} fill="#4a3d31" stroke="#e8d6bf" strokeWidth={1.5} />)}
    </g>
  );
}

/** Small picture of a pipe for the palette buttons. */
export function PieceIcon({ kind, className = '' }: { kind: PieceKind; className?: string }) {
  const rot = kind === 'straight' ? 1 : kind === 'corner' ? 1 : 2;
  return (
    <svg viewBox="-6 -6 112 112" className={className} aria-hidden>
      <g transform={`rotate(${rot * 90} 50 50)`}>
        <PipeShape piece={{ kind, rot: 0 }} />
      </g>
    </svg>
  );
}

export const PIECE_NAMES: Record<PieceKind, string> = {
  straight: 'まっすぐ',
  corner: 'まがる',
  tee: 'わかれる',
};

/** The water tank with a valve wheel. Its spout points to `out`. */
export function TapArt({ out, running }: { out: Side; running: boolean }) {
  return (
    <g>
      <g transform={`rotate(${ANGLE[out]} 50 50)`}>
        <rect x={30} y={0} width={40} height={50} fill="#4f6b7c" />
        <rect x={24} y={0} width={52} height={11} rx={3} fill="#4f6b7c" />
        <rect x={35} y={0} width={30} height={50} fill="#a9c2d0" />
      </g>
      <circle cx={50} cy={54} r={33} fill="#2b6aa3" />
      <circle cx={50} cy={50} r={33} fill="#4aa3ef" />
      <path d="M 24 54 Q 37 44 50 54 T 76 54 A 27 27 0 0 1 24 54 Z" fill="#7cc4ff" opacity={0.9} />
      <path d="M 30 36 A 24 24 0 0 1 48 26" fill="none" stroke="#dff1ff" strokeWidth={5} strokeLinecap="round" />
      <motion.g
        animate={{ rotate: running ? 360 : 0 }}
        transition={running ? { duration: 0.8, ease: 'easeInOut' } : { duration: 0 }}
        style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }}
      >
        <circle cx={50} cy={50} r={14} fill="none" stroke="#ff5a5a" strokeWidth={5} />
        <line x1={36} y1={50} x2={64} y2={50} stroke="#ff5a5a" strokeWidth={5} strokeLinecap="round" />
        <line x1={50} y1={36} x2={50} y2={64} stroke="#ff5a5a" strokeWidth={5} strokeLinecap="round" />
        <circle cx={50} cy={50} r={5} fill="#c93c3c" />
      </motion.g>
    </g>
  );
}

const PETALS = [0, 72, 144, 216, 288];

/** A potted flower that is a closed bud until water arrives. */
export function FlowerArt({ bloomed, delay = 0 }: { bloomed: boolean; delay?: number }) {
  return (
    <g>
      <ellipse cx={50} cy={88} rx={26} ry={6} fill="#000" opacity={0.15} />
      <path d="M 30 62 L 70 62 L 64 88 L 36 88 Z" fill="#d9774a" stroke="#a9532d" strokeWidth={3} strokeLinejoin="round" />
      <rect x={27} y={58} width={46} height={9} rx={4} fill="#e88c5c" stroke="#a9532d" strokeWidth={3} />
      <path d="M 50 60 L 50 38" stroke="#4e9a3a" strokeWidth={5} strokeLinecap="round" />
      <path d="M 50 52 Q 38 50 34 42 Q 46 42 50 50" fill="#6fbf52" />
      <path d="M 50 50 Q 62 46 66 38 Q 54 38 50 48" fill="#6fbf52" />
      {bloomed ? (
        <motion.g
          initial={{ scale: 0.2, rotate: -40 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 12, delay }}
          style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }}
        >
          <circle cx={50} cy={30} r={28} fill="#fff" opacity={0} />
          {PETALS.map((a) => (
            <ellipse key={a} cx={50} cy={17} rx={9} ry={13} fill="#ff8fb3" stroke="#e0628c" strokeWidth={2} transform={`rotate(${a} 50 30)`} />
          ))}
          <circle cx={50} cy={30} r={8} fill="#ffd84d" stroke="#d9a92a" strokeWidth={2} />
        </motion.g>
      ) : (
        <g>
          <path d="M 50 18 C 60 24 60 36 50 40 C 40 36 40 24 50 18 Z" fill="#ffb3cb" stroke="#e0628c" strokeWidth={2.5} />
          <path d="M 44 36 Q 50 30 56 36 L 50 41 Z" fill="#6fbf52" />
        </g>
      )}
    </g>
  );
}

export type DropMood = 'happy' | 'yay' | 'oops';

/** しずくちゃん, the water drop who guides the game. */
export function DropArt({ mood = 'happy' }: { mood?: DropMood }) {
  return (
    <g>
      <ellipse cx={50} cy={95} rx={24} ry={4} fill="#000" opacity={0.12} />
      <path d="M 50 6 C 36 30 18 46 18 64 A 32 30 0 0 0 82 64 C 82 46 64 30 50 6 Z" fill="#4fb3ff" stroke="#2b7fd0" strokeWidth={3.5} strokeLinejoin="round" />
      <path d="M 34 52 C 32 44 38 34 44 28" fill="none" stroke="#e4f4ff" strokeWidth={6} strokeLinecap="round" />
      <circle cx={33} cy={72} r={6} fill="#ff9cc0" opacity={0.7} />
      <circle cx={67} cy={72} r={6} fill="#ff9cc0" opacity={0.7} />
      {mood === 'yay' ? (
        <>
          <path d="M 34 62 Q 39 55 44 62" fill="none" stroke="#1d3557" strokeWidth={4} strokeLinecap="round" />
          <path d="M 56 62 Q 61 55 66 62" fill="none" stroke="#1d3557" strokeWidth={4} strokeLinecap="round" />
          <path d="M 40 72 Q 50 86 60 72 Z" fill="#c43d5c" stroke="#1d3557" strokeWidth={3} strokeLinejoin="round" />
        </>
      ) : mood === 'oops' ? (
        <>
          <circle cx={40} cy={62} r={4.5} fill="#1d3557" />
          <circle cx={60} cy={62} r={4.5} fill="#1d3557" />
          <ellipse cx={50} cy={77} rx={5} ry={4} fill="#1d3557" />
          <path d="M 74 40 C 70 46 70 50 74 52 C 78 50 78 46 74 40 Z" fill="#bfe6ff" stroke="#2b7fd0" strokeWidth={2} />
        </>
      ) : (
        <>
          <circle cx={40} cy={62} r={4.5} fill="#1d3557" />
          <circle cx={60} cy={62} r={4.5} fill="#1d3557" />
          <path d="M 42 73 Q 50 80 58 73" fill="none" stroke="#1d3557" strokeWidth={4} strokeLinecap="round" />
        </>
      )}
    </g>
  );
}

export function DropIcon({ mood, className = '' }: { mood?: DropMood; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <DropArt mood={mood} />
    </svg>
  );
}
