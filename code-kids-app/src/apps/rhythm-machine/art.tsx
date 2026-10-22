import type { ComponentType } from 'react';
import type { Instrument } from './types';

export interface InstrumentInfo {
  /** The sound as a child would say it. */
  sound: string;
  /** Who plays it. */
  player: string;
  color: string;
  dark: string;
  soft: string;
}

export const INSTRUMENT_INFO: Record<Instrument, InstrumentInfo> = {
  pon: { sound: 'ポン', player: 'ねこ', color: '#4aa3ef', dark: '#2b6fb3', soft: '#dceeff' },
  chi: { sound: 'チッ', player: 'ひよこ', color: '#f2b705', dark: '#b58500', soft: '#fff3c4' },
  tan: { sound: 'タン', player: 'うさぎ', color: '#f2709c', dark: '#c0436f', soft: '#ffe1eb' },
  don: { sound: 'ドン', player: 'くま', color: '#e2603f', dark: '#a63a22', soft: '#ffe2d8' },
};

const INK = '#3b2f2f';

function Eyes({ y = 42, gap = 10, cx = 50 }: { y?: number; gap?: number; cx?: number }) {
  return (
    <>
      <circle cx={cx - gap} cy={y} r={3.6} fill={INK} />
      <circle cx={cx + gap} cy={y} r={3.6} fill={INK} />
      <circle cx={cx - gap + 1.2} cy={y - 1.2} r={1.2} fill="#fff" />
      <circle cx={cx + gap + 1.2} cy={y - 1.2} r={1.2} fill="#fff" />
    </>
  );
}

/** くま with a big drum: ドン. */
function BearArt() {
  return (
    <g>
      <circle cx={28} cy={22} r={11} fill="#8a5a3b" />
      <circle cx={72} cy={22} r={11} fill="#8a5a3b" />
      <circle cx={28} cy={22} r={6} fill="#d9a07a" />
      <circle cx={72} cy={22} r={6} fill="#d9a07a" />
      <circle cx={50} cy={40} r={27} fill="#a46b45" stroke="#6e4429" strokeWidth={3} />
      <ellipse cx={50} cy={50} rx={13} ry={10} fill="#ecc9a4" />
      <ellipse cx={50} cy={45} rx={5} ry={3.6} fill={INK} />
      <path d="M 45 52 Q 50 57 55 52" fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />
      <Eyes y={36} gap={11} />
      <circle cx={32} cy={47} r={4.5} fill="#ff9c8a" opacity={0.6} />
      <circle cx={68} cy={47} r={4.5} fill="#ff9c8a" opacity={0.6} />
      <rect x={22} y={66} width={56} height={26} rx={6} fill="#e2603f" stroke="#a63a22" strokeWidth={3} />
      <path d="M 24 72 L 34 88 L 44 72 L 56 88 L 66 72 L 76 88" fill="none" stroke="#ffd84d" strokeWidth={3} strokeLinejoin="round" />
      <ellipse cx={50} cy={66} rx={28} ry={7} fill="#fff3e0" stroke="#a63a22" strokeWidth={3} />
    </g>
  );
}

/** うさぎ clapping: タン. */
function RabbitArt() {
  return (
    <g>
      <ellipse cx={37} cy={20} rx={8} ry={19} fill="#fff" stroke="#e0a3b8" strokeWidth={3} transform="rotate(-10 37 20)" />
      <ellipse cx={63} cy={20} rx={8} ry={19} fill="#fff" stroke="#e0a3b8" strokeWidth={3} transform="rotate(10 63 20)" />
      <ellipse cx={37} cy={22} rx={3.5} ry={12} fill="#ffc2d6" transform="rotate(-10 37 22)" />
      <ellipse cx={63} cy={22} rx={3.5} ry={12} fill="#ffc2d6" transform="rotate(10 63 22)" />
      <circle cx={50} cy={52} r={25} fill="#fff" stroke="#e0a3b8" strokeWidth={3} />
      <Eyes y={48} gap={9} />
      <path d="M 47 56 L 53 56 L 50 59 Z" fill="#f2709c" />
      <path d="M 50 59 Q 46 64 43 61 M 50 59 Q 54 64 57 61" fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
      <circle cx={35} cy={58} r={4.5} fill="#ff9cc0" opacity={0.7} />
      <circle cx={65} cy={58} r={4.5} fill="#ff9cc0" opacity={0.7} />
      <ellipse cx={42} cy={84} rx={9} ry={8} fill="#fff" stroke="#e0a3b8" strokeWidth={3} transform="rotate(20 42 84)" />
      <ellipse cx={58} cy={84} rx={9} ry={8} fill="#fff" stroke="#e0a3b8" strokeWidth={3} transform="rotate(-20 58 84)" />
      <path d="M 50 74 L 50 70 M 42 76 L 39 72 M 58 76 L 61 72" stroke="#f2709c" strokeWidth={2.5} strokeLinecap="round" />
    </g>
  );
}

/** ひよこ with a little cymbal: チッ. */
function ChickArt() {
  return (
    <g>
      <line x1={80} y1={30} x2={80} y2={92} stroke="#8a7a62" strokeWidth={3} />
      <line x1={72} y1={92} x2={88} y2={92} stroke="#8a7a62" strokeWidth={3} strokeLinecap="round" />
      <ellipse cx={80} cy={32} rx={16} ry={4.5} fill="#f6cf5a" stroke="#b58500" strokeWidth={2.5} />
      <ellipse cx={80} cy={38} rx={16} ry={4.5} fill="#f6cf5a" stroke="#b58500" strokeWidth={2.5} />
      <path d="M 40 26 Q 42 16 48 22 Q 50 14 54 24" fill="none" stroke="#e8a800" strokeWidth={3} strokeLinecap="round" />
      <circle cx={44} cy={56} r={28} fill="#ffd84d" stroke="#d9a92a" strokeWidth={3} />
      <Eyes cx={44} y={50} gap={9} />
      <path d="M 39 58 L 49 58 L 44 65 Z" fill="#ff9a3c" stroke="#d26b14" strokeWidth={1.8} strokeLinejoin="round" />
      <circle cx={30} cy={60} r={4.5} fill="#ff9c8a" opacity={0.55} />
      <circle cx={58} cy={60} r={4.5} fill="#ff9c8a" opacity={0.55} />
      <path d="M 66 56 Q 76 46 74 38" fill="none" stroke="#e8a800" strokeWidth={5} strokeLinecap="round" />
      <path d="M 38 84 L 36 92 M 50 84 L 52 92" stroke="#ff9a3c" strokeWidth={3} strokeLinecap="round" />
    </g>
  );
}

/** ねこ with a bell on its collar: ポン. */
function CatArt() {
  return (
    <g>
      <path d="M 26 34 L 28 10 L 46 24 Z" fill="#b9c8d8" stroke="#6f8399" strokeWidth={3} strokeLinejoin="round" />
      <path d="M 74 34 L 72 10 L 54 24 Z" fill="#b9c8d8" stroke="#6f8399" strokeWidth={3} strokeLinejoin="round" />
      <path d="M 30 28 L 31 17 L 40 24 Z" fill="#ffc2d6" />
      <path d="M 70 28 L 69 17 L 60 24 Z" fill="#ffc2d6" />
      <ellipse cx={50} cy={46} rx={29} ry={25} fill="#d3dee9" stroke="#6f8399" strokeWidth={3} />
      <path d="M 50 22 L 50 30 M 42 23 L 44 30 M 58 23 L 56 30" stroke="#9fb1c4" strokeWidth={2.5} strokeLinecap="round" />
      <Eyes y={44} gap={11} />
      <path d="M 47 51 L 53 51 L 50 54 Z" fill="#f2709c" />
      <path d="M 50 54 Q 46 59 43 56 M 50 54 Q 54 59 57 56" fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
      <path d="M 22 48 L 34 50 M 22 55 L 34 54 M 78 48 L 66 50 M 78 55 L 66 54" stroke="#6f8399" strokeWidth={1.8} strokeLinecap="round" />
      <path d="M 28 70 Q 50 78 72 70" fill="none" stroke="#2b6fb3" strokeWidth={6} strokeLinecap="round" />
      <circle cx={50} cy={82} r={10} fill="#ffd84d" stroke="#b58500" strokeWidth={3} />
      <path d="M 41 82 L 59 82" stroke="#b58500" strokeWidth={2.2} />
      <circle cx={50} cy={86} r={2.2} fill="#8a6200" />
      <circle cx={46} cy={78} r={2} fill="#fff" opacity={0.85} />
    </g>
  );
}

const ARTS: Record<Instrument, ComponentType> = { don: BearArt, tan: RabbitArt, chi: ChickArt, pon: CatArt };

export function InstrumentIcon({ inst, className = '' }: { inst: Instrument; className?: string }) {
  const Art = ARTS[inst];
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <Art />
    </svg>
  );
}

export type TaikoMood = 'happy' | 'yay' | 'oops';

/** たいこちゃん, the little taiko drum who guides the game. */
export function TaikoArt({ mood = 'happy' }: { mood?: TaikoMood }) {
  return (
    <g>
      <ellipse cx={50} cy={95} rx={26} ry={4} fill="#000" opacity={0.12} />
      <g stroke="#7a4a22" strokeWidth={5} strokeLinecap="round">
        <line x1={22} y1={6} x2={42} y2={26} />
        <line x1={78} y1={6} x2={58} y2={26} />
      </g>
      <circle cx={21} cy={5} r={5} fill="#ff5a5a" stroke="#c93c3c" strokeWidth={2} />
      <circle cx={79} cy={5} r={5} fill="#ff5a5a" stroke="#c93c3c" strokeWidth={2} />
      <path d="M 40 86 L 36 94 M 60 86 L 64 94" stroke="#7a4a22" strokeWidth={5} strokeLinecap="round" />
      <path d="M 18 32 Q 12 58 18 84 L 82 84 Q 88 58 82 32 Z" fill="#e2603f" stroke="#a63a22" strokeWidth={3.5} strokeLinejoin="round" />
      <path d="M 22 40 Q 18 58 22 76" fill="none" stroke="#ff9a7d" strokeWidth={5} strokeLinecap="round" opacity={0.8} />
      {[38, 50, 62, 74].map((y) => (
        <g key={y}>
          <circle cx={17} cy={y} r={2.6} fill="#ffd84d" stroke="#a63a22" strokeWidth={1.2} />
          <circle cx={83} cy={y} r={2.6} fill="#ffd84d" stroke="#a63a22" strokeWidth={1.2} />
        </g>
      ))}
      <ellipse cx={50} cy={32} rx={32} ry={9} fill="#fff3e0" stroke="#a63a22" strokeWidth={3.5} />
      <ellipse cx={50} cy={32} rx={14} ry={3.5} fill="#ffd84d" opacity={0.6} />
      <ellipse cx={50} cy={84} rx={32} ry={6} fill="#c74a2c" stroke="#a63a22" strokeWidth={3} />
      <circle cx={34} cy={66} r={5.5} fill="#ff9cc0" opacity={0.75} />
      <circle cx={66} cy={66} r={5.5} fill="#ff9cc0" opacity={0.75} />
      {mood === 'yay' ? (
        <>
          <path d="M 35 57 Q 40 50 45 57" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
          <path d="M 55 57 Q 60 50 65 57" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
          <path d="M 41 66 Q 50 80 59 66 Z" fill="#c43d5c" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
        </>
      ) : mood === 'oops' ? (
        <>
          <circle cx={40} cy={56} r={4.5} fill={INK} />
          <circle cx={60} cy={56} r={4.5} fill={INK} />
          <ellipse cx={50} cy={71} rx={5} ry={4} fill={INK} />
          <path d="M 76 44 C 72 50 72 54 76 56 C 80 54 80 50 76 44 Z" fill="#bfe6ff" stroke="#2b7fd0" strokeWidth={2} />
        </>
      ) : (
        <>
          <circle cx={40} cy={56} r={4.5} fill={INK} />
          <circle cx={60} cy={56} r={4.5} fill={INK} />
          <circle cx={41.5} cy={54.5} r={1.5} fill="#fff" />
          <circle cx={61.5} cy={54.5} r={1.5} fill="#fff" />
          <path d="M 42 67 Q 50 74 58 67" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
        </>
      )}
    </g>
  );
}

/** The guide as an icon, for the map marker, hint bubble and the win dialog. */
export function TaikoIcon({ mood, className = '' }: { mood?: TaikoMood; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <TaikoArt mood={mood} />
    </svg>
  );
}

/** Small round "loop" arrow used on the くりかえし button and the loop strip. */
export function LoopGlyph({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M 38 18 A 15 15 0 1 0 39 30" />
      <path d="M 40 8 L 38 18 L 28 16" />
    </svg>
  );
}
