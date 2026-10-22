import { motion } from 'motion/react';
import { starPath } from '../../components/tiles';
import { sorterColor } from './engine';
import type { Dir, ItemColor, PartKind } from './types';

export const ANGLE: Record<Dir, number> = { up: 0, right: 90, down: 180, left: 270 };

export const ITEM_NAMES: Record<ItemColor, string> = { red: 'りんご', blue: 'つみき', yellow: 'ほし' };

export const PART_NAMES: Record<PartKind, string> = {
  belt: 'ベルト',
  'sort-red': 'りんご わけき',
  'sort-blue': 'つみき わけき',
  'sort-yellow': 'ほし わけき',
};

export const ITEM_TONES: Record<ItemColor, { fill: string; dark: string; light: string }> = {
  red: { fill: '#ff5a5a', dark: '#c43b3b', light: '#ffb3b3' },
  blue: { fill: '#3d8bff', dark: '#2459b3', light: '#a9cbff' },
  yellow: { fill: '#ffd23f', dark: '#cf9a12', light: '#fff1a8' },
};

const STAR = starPath(50, 52, 27, 12);

/** An item centred in a 100×100 box: a red apple, a blue block, or a yellow star. Shapes differ as well as colours. */
export function ItemArt({ color }: { color: ItemColor }) {
  const t = ITEM_TONES[color];
  if (color === 'red') {
    return (
      <g>
        <path d="M 50 34 C 40 26 24 30 24 50 C 24 66 36 78 44 78 C 47 78 48 76 50 76 C 52 76 53 78 56 78 C 64 78 76 66 76 50 C 76 30 60 26 50 34 Z" fill={t.fill} stroke={t.dark} strokeWidth={3.5} strokeLinejoin="round" />
        <path d="M 50 34 L 52 22" stroke="#7a4a24" strokeWidth={4} strokeLinecap="round" />
        <path d="M 53 27 C 58 18 68 18 70 22 C 66 28 58 30 53 27 Z" fill="#5fb84a" stroke="#3f8a30" strokeWidth={2} />
        <path d="M 34 46 C 34 40 38 37 42 36" fill="none" stroke={t.light} strokeWidth={5} strokeLinecap="round" />
      </g>
    );
  }
  if (color === 'blue') {
    return (
      <g>
        <path d="M 26 38 L 50 26 L 74 38 L 50 50 Z" fill={t.light} stroke={t.dark} strokeWidth={3.5} strokeLinejoin="round" />
        <path d="M 26 38 L 50 50 L 50 78 L 26 66 Z" fill={t.fill} stroke={t.dark} strokeWidth={3.5} strokeLinejoin="round" />
        <path d="M 74 38 L 50 50 L 50 78 L 74 66 Z" fill={t.dark} stroke={t.dark} strokeWidth={3.5} strokeLinejoin="round" />
      </g>
    );
  }
  return (
    <g>
      <path d={STAR} fill={t.fill} stroke={t.dark} strokeWidth={3.5} strokeLinejoin="round" />
      <circle cx={43} cy={52} r={3} fill="#5a4310" />
      <circle cx={57} cy={52} r={3} fill="#5a4310" />
    </g>
  );
}

export function ItemIcon({ color, className = '' }: { color: ItemColor; className?: string }) {
  return (
    <svg viewBox="16 16 68 68" className={className} aria-hidden>
      <ItemArt color={color} />
    </svg>
  );
}

export type PartTone = 'plain' | 'bolted';

const BELT_TONES: Record<PartTone, { rail: string; band: string; chevron: string }> = {
  plain: { rail: '#3d4752', band: '#5f6a76', chevron: '#ffd84d' },
  bolted: { rail: '#6b4f33', band: '#8a6a49', chevron: '#ffe6a3' },
};

function Bolts() {
  return (
    <>
      {[
        [14, 14],
        [86, 14],
        [14, 86],
        [86, 86],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={5} fill="#4a3d31" stroke="#e8d6bf" strokeWidth={1.5} />
      ))}
    </>
  );
}

/**
 * A conveyor belt in a 100×100 cell pointing up; the caller turns it.
 * While the machine runs the chevrons scroll forward.
 */
export function BeltShape({ tone = 'plain', running = false }: { tone?: PartTone; running?: boolean }) {
  const c = BELT_TONES[tone];
  return (
    <g>
      <rect x={14} y={4} width={72} height={92} rx={12} fill={c.rail} />
      <rect x={22} y={6} width={56} height={88} rx={6} fill={c.band} />
      <g clipPath="url(#sk-belt-clip)">
        <motion.g
          initial={false}
          animate={running ? { y: [0, -34] } : { y: 0 }}
          transition={running ? { duration: 0.45, ease: 'linear', repeat: Infinity } : { duration: 0 }}
        >
          {[-24, 10, 44, 78, 112].map((y) => (
            <path key={y} d={`M 34 ${y + 12} L 50 ${y} L 66 ${y + 12}`} fill="none" stroke={c.chevron} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
          ))}
        </motion.g>
      </g>
      {tone === 'bolted' && <Bolts />}
    </g>
  );
}

/** Shared clip path for the belt chevrons. Render once inside the board's <svg>. */
export function FactoryDefs() {
  return (
    <defs>
      <clipPath id="sk-belt-clip">
        <rect x={22} y={6} width={56} height={88} rx={6} />
      </clipPath>
    </defs>
  );
}

/**
 * A sorter: a machine with its item in a window and a big arrow in that item's colour.
 * Only the arrow turns, so the item in the window always stays upright.
 */
export function SorterShape({ kind, rot, tone = 'plain', animateTurn = true }: { kind: PartKind; rot: number; tone?: PartTone; animateTurn?: boolean }) {
  const color = sorterColor(kind) ?? 'red';
  const t = ITEM_TONES[color];
  return (
    <g>
      <rect x={8} y={10} width={84} height={84} rx={20} fill={tone === 'bolted' ? '#5c4a7a' : '#5a4fb0'} />
      <rect x={8} y={6} width={84} height={84} rx={20} fill={tone === 'bolted' ? '#8a74ad' : '#7d6bd6'} />
      <motion.g
        initial={false}
        animate={{ rotate: rot * 90 }}
        transition={animateTurn ? { type: 'spring', stiffness: 420, damping: 24 } : { duration: 0 }}
        style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }}
      >
        {/* Centres the bounding box on the window so the arrow swings around it. */}
        <rect x={0} y={-2} width={100} height={100} fill="transparent" />
        <path d="M 50 -2 L 74 24 L 60 24 L 60 34 L 40 34 L 40 24 L 26 24 Z" fill={t.fill} stroke={t.dark} strokeWidth={3.5} strokeLinejoin="round" />
      </motion.g>
      <circle cx={50} cy={48} r={22} fill="#ffffff" stroke="#3f357e" strokeWidth={3} />
      <g transform="translate(50 48) scale(0.36) translate(-50 -52)">
        <ItemArt color={color} />
      </g>
      {tone === 'bolted' && <Bolts />}
    </g>
  );
}

/** Small picture of a part for the palette buttons. */
export function PartIcon({ kind, className = '' }: { kind: PartKind; className?: string }) {
  return (
    <svg viewBox="-6 -6 112 112" className={className} aria-hidden>
      {kind === 'belt' ? (
        <>
          <FactoryDefs />
          <g transform="rotate(90 50 50)">
            <BeltShape />
          </g>
        </>
      ) : (
        <SorterShape kind={kind} rot={0} animateTurn={false} />
      )}
    </svg>
  );
}

/** The machine the items come out of. Its spout points to `out`. */
export function ChuteArt({ out, running }: { out: Dir; running: boolean }) {
  return (
    <g>
      <g transform={`rotate(${ANGLE[out]} 50 50)`}>
        <rect x={26} y={0} width={48} height={40} rx={6} fill="#c96a1c" />
        <rect x={32} y={0} width={36} height={36} rx={4} fill="#3b2f2f" />
      </g>
      <rect x={14} y={18} width={72} height={70} rx={18} fill="#d9772a" />
      <rect x={14} y={14} width={72} height={70} rx={18} fill="#ff9f43" />
      <path d="M 26 24 L 74 24 L 62 44 L 38 44 Z" fill="#3b2f2f" />
      <motion.g
        animate={running ? { rotate: [0, 360] } : { rotate: 0 }}
        transition={running ? { duration: 1.2, ease: 'linear', repeat: Infinity } : { duration: 0 }}
        style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }}
      >
        <circle cx={50} cy={64} r={12} fill="#ffd84d" stroke="#c96a1c" strokeWidth={4} />
        <path d="M 50 54 L 50 74 M 40 64 L 60 64" stroke="#c96a1c" strokeWidth={4} strokeLinecap="round" />
      </motion.g>
    </g>
  );
}

/** A cardboard box that takes one kind of item, labelled with that item. */
export function BoxArt({ color, count, sad }: { color: ItemColor; count: number; sad: boolean }) {
  const t = ITEM_TONES[color];
  return (
    <g>
      <ellipse cx={50} cy={90} rx={36} ry={6} fill="#000" opacity={0.15} />
      <path d="M 14 36 L 4 22 L 34 22 L 40 36 Z" fill="#c98a4f" stroke="#8f5a2b" strokeWidth={3} strokeLinejoin="round" />
      <path d="M 86 36 L 96 22 L 66 22 L 60 36 Z" fill="#c98a4f" stroke="#8f5a2b" strokeWidth={3} strokeLinejoin="round" />
      <rect x={14} y={34} width={72} height={54} rx={6} fill="#e0a868" stroke="#8f5a2b" strokeWidth={3} />
      <rect x={14} y={40} width={72} height={10} fill={t.fill} opacity={0.9} />
      <circle cx={50} cy={66} r={17} fill="#fff8e7" stroke={sad ? '#ff8a3d' : t.dark} strokeWidth={3} />
      <g transform="translate(50 66) scale(0.3) translate(-50 -52)">
        <ItemArt color={color} />
      </g>
      {count > 0 && (
        <g transform="translate(84 30)">
          <circle r={14} fill="#3ecf6a" stroke="#ffffff" strokeWidth={3} />
          <text y={6} textAnchor="middle" fontSize={18} fontWeight={900} fill="#ffffff">
            {count}
          </text>
        </g>
      )}
    </g>
  );
}

/** A brick wall block. */
export function WallArt() {
  return (
    <g>
      <rect x={6} y={12} width={88} height={84} rx={10} fill="#8a4a35" />
      <rect x={6} y={6} width={88} height={84} rx={10} fill="#c8694a" />
      <g stroke="#f2c2ad" strokeWidth={3} opacity={0.8}>
        <line x1={6} y1={34} x2={94} y2={34} />
        <line x1={6} y1={62} x2={94} y2={62} />
        <line x1={50} y1={6} x2={50} y2={34} />
        <line x1={28} y1={34} x2={28} y2={62} />
        <line x1={72} y1={34} x2={72} y2={62} />
        <line x1={50} y1={62} x2={50} y2={90} />
      </g>
    </g>
  );
}

export type HakoMood = 'happy' | 'yay' | 'oops';

/** はこちゃん, the cardboard box who runs the factory. */
export function HakoArt({ mood = 'happy' }: { mood?: HakoMood }) {
  return (
    <g>
      <ellipse cx={50} cy={94} rx={30} ry={4} fill="#000" opacity={0.12} />
      <path d="M 18 34 L 8 18 L 40 22 L 44 34 Z" fill="#c98a4f" stroke="#8f5a2b" strokeWidth={3} strokeLinejoin="round" />
      <path d="M 82 34 L 92 18 L 60 22 L 56 34 Z" fill="#c98a4f" stroke="#8f5a2b" strokeWidth={3} strokeLinejoin="round" />
      <rect x={16} y={32} width={68} height={58} rx={8} fill="#e8b273" stroke="#8f5a2b" strokeWidth={3.5} />
      <rect x={44} y={32} width={12} height={16} fill="#f5d39f" opacity={0.8} />
      <circle cx={28} cy={70} r={6} fill="#ff9cc0" opacity={0.7} />
      <circle cx={72} cy={70} r={6} fill="#ff9cc0" opacity={0.7} />
      {mood === 'yay' ? (
        <>
          <path d="M 30 60 Q 36 52 42 60" fill="none" stroke="#3b2f2f" strokeWidth={4} strokeLinecap="round" />
          <path d="M 58 60 Q 64 52 70 60" fill="none" stroke="#3b2f2f" strokeWidth={4} strokeLinecap="round" />
          <path d="M 40 70 Q 50 84 60 70 Z" fill="#c43d5c" stroke="#3b2f2f" strokeWidth={3} strokeLinejoin="round" />
        </>
      ) : mood === 'oops' ? (
        <>
          <circle cx={36} cy={60} r={4.5} fill="#3b2f2f" />
          <circle cx={64} cy={60} r={4.5} fill="#3b2f2f" />
          <ellipse cx={50} cy={75} rx={5} ry={4} fill="#3b2f2f" />
          <path d="M 80 40 C 76 46 76 50 80 52 C 84 50 84 46 80 40 Z" fill="#bfe6ff" stroke="#2b7fd0" strokeWidth={2} />
        </>
      ) : (
        <>
          <circle cx={36} cy={60} r={4.5} fill="#3b2f2f" />
          <circle cx={64} cy={60} r={4.5} fill="#3b2f2f" />
          <path d="M 42 71 Q 50 78 58 71" fill="none" stroke="#3b2f2f" strokeWidth={4} strokeLinecap="round" />
        </>
      )}
    </g>
  );
}

/** はこちゃん as an icon, for the map marker, hints and the clear dialog. */
export function HakoIcon({ mood, className = '' }: { mood?: HakoMood; className?: string }) {
  return (
    <svg viewBox="0 6 100 94" className={className} aria-hidden>
      <HakoArt mood={mood} />
    </svg>
  );
}
