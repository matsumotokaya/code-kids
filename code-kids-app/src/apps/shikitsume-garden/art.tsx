import type { Stamp } from './types';

/** Each bed gets its own colour so neighbouring beds stay easy to tell apart. */
export const BED_COLORS = [
  { petal: '#ff8fb3', edge: '#d9577f', tint: '#ffe1ec' },
  { petal: '#ffd84d', edge: '#c9971f', tint: '#fff4c2' },
  { petal: '#b7a0f0', edge: '#7d63c9', tint: '#ece5ff' },
  { petal: '#ffa45c', edge: '#d0702c', tint: '#ffe6d1' },
  { petal: '#7cc8ff', edge: '#2f80c9', tint: '#dff1ff' },
] as const;

export const bedColor = (i: number) => BED_COLORS[((i % BED_COLORS.length) + BED_COLORS.length) % BED_COLORS.length];

/** Tilled soil for one 100 × 100 cell. */
export function SoilTile({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x * 100} ${y * 100})`}>
      <rect x={3} y={3} width={94} height={94} rx={14} fill="#a8703f" />
      <rect x={3} y={3} width={94} height={88} rx={14} fill="#b97f4a" />
      <g stroke="#946032" strokeWidth={4} strokeLinecap="round" opacity={0.7}>
        <line x1={20} y1={30} x2={42} y2={30} />
        <line x1={56} y1={52} x2={80} y2={52} />
        <line x1={24} y1={72} x2={46} y2={72} />
      </g>
    </g>
  );
}

/** A flat stepping stone: soil that must stay empty. */
export function StoneTile({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x * 100} ${y * 100})`}>
      <rect x={3} y={3} width={94} height={94} rx={14} fill="#8fd66a" />
      <ellipse cx={50} cy={56} rx={38} ry={32} fill="#7d766e" />
      <ellipse cx={50} cy={50} rx={38} ry={32} fill="#b9b2a8" stroke="#7d766e" strokeWidth={3} />
      <path d="M 26 40 Q 40 28 58 30" fill="none" stroke="#e8e3dc" strokeWidth={5} strokeLinecap="round" />
      <circle cx={64} cy={58} r={4} fill="#9a9389" />
      <circle cx={38} cy={62} r={3} fill="#9a9389" />
    </g>
  );
}

/** One flower centred in a 100 × 100 cell, with its count in the middle. `rowEnd` turns the middle gold: 3, 6, 9 … */
export function FlowerArt({ color, n, rowEnd = false }: { color: number; n?: number; rowEnd?: boolean }) {
  const c = bedColor(color);
  return (
    <g>
      <path d="M 50 62 Q 48 80 50 92" stroke="#3f9b3a" strokeWidth={5} fill="none" strokeLinecap="round" />
      <path d="M 50 82 Q 36 74 30 80 Q 40 90 50 84" fill="#5fbf4a" />
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx={50} cy={24} rx={13} ry={17} fill={c.petal} stroke={c.edge} strokeWidth={2.5} transform={`rotate(${a} 50 44)`} />
      ))}
      <circle
        cx={50}
        cy={44}
        r={rowEnd ? 18 : 16}
        fill={rowEnd ? '#ffd84d' : '#fff8e7'}
        stroke={rowEnd ? '#b8860b' : c.edge}
        strokeWidth={rowEnd ? 3.5 : 2.5}
      />
      {n !== undefined && (
        <text x={50} y={45} textAnchor="middle" dominantBaseline="central" fontSize={n >= 10 ? 19 : 23} fontWeight={900} fill="#3b2f2f">
          {n}
        </text>
      )}
    </g>
  );
}

/** A small picture of a stamp: a grid of dots, たて rows by よこ columns, `cell` CSS pixels per flower. */
export function StampMini({ stamp, color, cell = 14, className = '' }: { stamp: Stamp; color: number; cell?: number; className?: string }) {
  const c = bedColor(color);
  const size = 14;
  const w = stamp.cols * size + 6;
  const h = stamp.rows * size + 6;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={(w * cell) / size} height={(h * cell) / size} className={`shrink-0 ${className}`} aria-hidden>
      <rect x={1} y={1} width={w - 2} height={h - 2} rx={5} fill={c.tint} stroke={c.edge} strokeWidth={2} />
      {Array.from({ length: stamp.rows * stamp.cols }, (_, i) => (
        <circle
          key={i}
          cx={3 + (i % stamp.cols) * size + size / 2}
          cy={3 + Math.floor(i / stamp.cols) * size + size / 2}
          r={4.5}
          fill={c.petal}
          stroke={c.edge}
          strokeWidth={1.2}
        />
      ))}
    </svg>
  );
}

export type JoroMood = 'happy' | 'yay' | 'oops';

/** じょうろくん, the watering-can robot that plants the flowers. Drawn in a 100 × 100 box. */
export function JoroArt({ mood = 'happy' }: { mood?: JoroMood }) {
  const ink = '#1d3557';
  return (
    <g>
      <ellipse cx={46} cy={95} rx={30} ry={4} fill="#000" opacity={0.12} />
      <path d="M 70 52 L 88 26" stroke="#3f9b5a" strokeWidth={9} strokeLinecap="round" />
      <rect x={80} y={14} width={16} height={14} rx={4} fill="#5cc27a" stroke="#2f7d48" strokeWidth={3} transform="rotate(-35 88 21)" />
      <path d="M 26 36 Q 46 6 66 36" fill="none" stroke="#2f7d48" strokeWidth={6} strokeLinecap="round" />
      <rect x={14} y={34} width={64} height={56} rx={18} fill="#7fd99a" stroke="#2f7d48" strokeWidth={3.5} />
      <rect x={14} y={34} width={64} height={12} rx={6} fill="#5cc27a" stroke="#2f7d48" strokeWidth={3} />
      <circle cx={28} cy={76} r={5} fill="#ff9cc0" opacity={0.7} />
      <circle cx={64} cy={76} r={5} fill="#ff9cc0" opacity={0.7} />
      {mood === 'yay' ? (
        <>
          <path d="M 29 63 Q 34 55 39 63" fill="none" stroke={ink} strokeWidth={4} strokeLinecap="round" />
          <path d="M 53 63 Q 58 55 63 63" fill="none" stroke={ink} strokeWidth={4} strokeLinecap="round" />
          <path d="M 38 72 Q 46 84 54 72 Z" fill="#c43d5c" stroke={ink} strokeWidth={2.5} strokeLinejoin="round" />
        </>
      ) : mood === 'oops' ? (
        <>
          <circle cx={34} cy={61} r={4.5} fill={ink} />
          <circle cx={58} cy={61} r={4.5} fill={ink} />
          <ellipse cx={46} cy={77} rx={5} ry={3.5} fill={ink} />
          <path d="M 8 30 C 5 35 5 38 8 40 C 11 38 11 35 8 30 Z" fill="#bfe6ff" stroke="#3b7fb8" strokeWidth={2} />
        </>
      ) : (
        <>
          <circle cx={34} cy={61} r={4.5} fill={ink} />
          <circle cx={58} cy={61} r={4.5} fill={ink} />
          <path d="M 38 73 Q 46 79 54 73" fill="none" stroke={ink} strokeWidth={3.5} strokeLinecap="round" />
        </>
      )}
    </g>
  );
}

/** Small じょうろくん for the map marker, the hint bubble and the win dialog. */
export function JoroIcon({ mood, className = '' }: { mood?: JoroMood; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <JoroArt mood={mood} />
    </svg>
  );
}
