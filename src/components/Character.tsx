import type { Dir } from '../game/types';
import type { CharacterId } from '../store/progress';

export type Mood = 'happy' | 'ouch' | 'wet' | 'yay' | 'hmm';

export interface CharacterMeta {
  id: CharacterId;
  name: string;
  color: string;
  dark: string;
}

export const CHARACTERS: CharacterMeta[] = [
  { id: 'robo', name: 'ロボ', color: '#8fd3ff', dark: '#3b6ea8' },
  { id: 'neko', name: 'ネコ', color: '#f7b267', dark: '#a05a2c' },
  { id: 'usagi', name: 'ウサギ', color: '#ffffff', dark: '#b08aa0' },
];

export function characterMeta(id: CharacterId): CharacterMeta {
  return CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];
}

interface EyesProps {
  lx: number;
  rx: number;
  cy: number;
  r: number;
  facing: Dir;
  mood: Mood;
  iris: string;
  white?: string;
}

function Eyes({ lx, rx, cy, r, facing, mood, iris, white = '#ffffff' }: EyesProps) {
  const dx = facing === 'left' ? -r * 0.45 : facing === 'right' ? r * 0.45 : 0;
  const dy = facing === 'up' ? -r * 0.45 : facing === 'down' ? r * 0.45 : 0;
  if (mood === 'ouch') {
    return (
      <g stroke="#3b2f2f" strokeWidth={3} strokeLinecap="round">
        {[lx, rx].map((x) => (
          <g key={x}>
            <line x1={x - 4} y1={cy - 4} x2={x + 4} y2={cy + 4} />
            <line x1={x + 4} y1={cy - 4} x2={x - 4} y2={cy + 4} />
          </g>
        ))}
      </g>
    );
  }
  if (mood === 'yay') {
    return (
      <g fill="none" stroke="#3b2f2f" strokeWidth={3.5} strokeLinecap="round">
        {[lx, rx].map((x) => (
          <path key={x} d={`M ${x - 5} ${cy + 2} Q ${x} ${cy - 7} ${x + 5} ${cy + 2}`} />
        ))}
      </g>
    );
  }
  return (
    <g>
      {[lx, rx].map((x) => (
        <g key={x}>
          <circle cx={x} cy={cy} r={r} fill={white} />
          <circle cx={x + dx} cy={cy + dy} r={r * 0.58} fill={iris} />
          <circle cx={x + dx + r * 0.22} cy={cy + dy - r * 0.22} r={r * 0.2} fill="#ffffff" />
        </g>
      ))}
    </g>
  );
}

function Mouth({ cx, cy, mood, color = '#3b2f2f' }: { cx: number; cy: number; mood: Mood; color?: string }) {
  switch (mood) {
    case 'yay':
      return <path d={`M ${cx - 8} ${cy - 2} Q ${cx} ${cy + 10} ${cx + 8} ${cy - 2} Z`} fill="#ff7a7a" stroke={color} strokeWidth={2.5} strokeLinejoin="round" />;
    case 'ouch':
      return <path d={`M ${cx - 7} ${cy} q 3.5 -4 7 0 t 7 0`} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" />;
    case 'wet':
      return <circle cx={cx} cy={cy + 1} r={3.5} fill={color} />;
    case 'hmm':
      return <line x1={cx - 6} y1={cy} x2={cx + 6} y2={cy} stroke={color} strokeWidth={3} strokeLinecap="round" />;
    default:
      return <path d={`M ${cx - 6} ${cy - 1} Q ${cx} ${cy + 5} ${cx + 6} ${cy - 1}`} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" />;
  }
}

function Drops() {
  return (
    <g fill="#5dc2f5" stroke="#2f8fc9" strokeWidth={1.5}>
      <path d="M 18 30 q 5 8 0 12 q -5 -4 0 -12 z" />
      <path d="M 84 40 q 5 8 0 12 q -5 -4 0 -12 z" />
      <path d="M 50 4 q 4 6 0 9 q -4 -3 0 -9 z" />
    </g>
  );
}

interface ArtProps {
  facing: Dir;
  mood: Mood;
}

function Robo({ facing, mood }: ArtProps) {
  const dark = '#3b6ea8';
  return (
    <g>
      <ellipse cx={50} cy={91} rx={27} ry={6} fill="#000" opacity={0.15} />
      <rect x={24} y={78} width={52} height={12} rx={6} fill="#4a5568" />
      <circle cx={33} cy={84} r={3.5} fill="#94a3b8" />
      <circle cx={50} cy={84} r={3.5} fill="#94a3b8" />
      <circle cx={67} cy={84} r={3.5} fill="#94a3b8" />
      <rect x={10} y={50} width={12} height={22} rx={6} fill="#6cb8ea" stroke={dark} strokeWidth={3} />
      <rect x={78} y={50} width={12} height={22} rx={6} fill="#6cb8ea" stroke={dark} strokeWidth={3} />
      <rect x={22} y={44} width={56} height={38} rx={12} fill="#8fd3ff" stroke={dark} strokeWidth={3} />
      <circle cx={50} cy={63} r={8} fill="#ffd84d" stroke={dark} strokeWidth={3} />
      <line x1={50} y1={18} x2={50} y2={9} stroke={dark} strokeWidth={3} />
      <circle cx={50} cy={7} r={4.5} fill="#ff6b6b" stroke={dark} strokeWidth={2} />
      <rect x={26} y={17} width={48} height={31} rx={10} fill="#bfe6ff" stroke={dark} strokeWidth={3} />
      <rect x={32} y={22} width={36} height={21} rx={6} fill="#1f2a44" />
      <Eyes lx={42} rx={58} cy={32} r={4.5} facing={facing} mood={mood} iris="#1f2a44" white="#7cffb2" />
      <Mouth cx={50} cy={40} mood={mood} color="#7cffb2" />
      {mood === 'wet' && <Drops />}
    </g>
  );
}

function Neko({ facing, mood }: ArtProps) {
  const dark = '#a05a2c';
  const fur = '#f7b267';
  return (
    <g>
      <ellipse cx={50} cy={91} rx={27} ry={6} fill="#000" opacity={0.15} />
      <path d="M 72 78 q 20 -4 16 -22" fill="none" stroke={fur} strokeWidth={7} strokeLinecap="round" />
      <path d="M 72 78 q 20 -4 16 -22" fill="none" stroke={dark} strokeWidth={2} strokeLinecap="round" opacity={0.5} />
      <ellipse cx={50} cy={70} rx={25} ry={19} fill={fur} stroke={dark} strokeWidth={3} />
      <ellipse cx={50} cy={76} rx={13} ry={9} fill="#fde8c8" />
      <path d="M 28 34 L 32 8 L 48 26 Z" fill={fur} stroke={dark} strokeWidth={3} strokeLinejoin="round" />
      <path d="M 72 34 L 68 8 L 52 26 Z" fill={fur} stroke={dark} strokeWidth={3} strokeLinejoin="round" />
      <path d="M 33 30 L 35 15 L 44 26 Z" fill="#ffb3c1" />
      <path d="M 67 30 L 65 15 L 56 26 Z" fill="#ffb3c1" />
      <circle cx={50} cy={42} r={25} fill={fur} stroke={dark} strokeWidth={3} />
      <path d="M 44 20 l 2 8 M 50 18 l 0 9 M 56 20 l -2 8" stroke={dark} strokeWidth={2.5} strokeLinecap="round" />
      <ellipse cx={50} cy={50} rx={12} ry={8} fill="#fde8c8" />
      <Eyes lx={41} rx={59} cy={40} r={5} facing={facing} mood={mood} iris="#2f6b3a" />
      <path d="M 47 48 L 53 48 L 50 52 Z" fill="#ff8fb1" stroke={dark} strokeWidth={1.5} strokeLinejoin="round" />
      <Mouth cx={50} cy={55} mood={mood} color={dark} />
      <g stroke={dark} strokeWidth={2} strokeLinecap="round">
        <line x1={20} y1={46} x2={34} y2={48} />
        <line x1={20} y1={54} x2={34} y2={52} />
        <line x1={80} y1={46} x2={66} y2={48} />
        <line x1={80} y1={54} x2={66} y2={52} />
      </g>
      {mood === 'wet' && <Drops />}
    </g>
  );
}

function Usagi({ facing, mood }: ArtProps) {
  const dark = '#b08aa0';
  return (
    <g>
      <ellipse cx={50} cy={91} rx={27} ry={6} fill="#000" opacity={0.15} />
      <ellipse cx={39} cy={20} rx={8} ry={19} fill="#ffffff" stroke={dark} strokeWidth={3} transform="rotate(-8 39 20)" />
      <ellipse cx={61} cy={20} rx={8} ry={19} fill="#ffffff" stroke={dark} strokeWidth={3} transform="rotate(8 61 20)" />
      <ellipse cx={39} cy={21} rx={4} ry={13} fill="#ffb3c1" transform="rotate(-8 39 21)" />
      <ellipse cx={61} cy={21} rx={4} ry={13} fill="#ffb3c1" transform="rotate(8 61 21)" />
      <ellipse cx={50} cy={72} rx={24} ry={18} fill="#ffffff" stroke={dark} strokeWidth={3} />
      <ellipse cx={30} cy={84} rx={9} ry={5} fill="#ffffff" stroke={dark} strokeWidth={2.5} />
      <ellipse cx={70} cy={84} rx={9} ry={5} fill="#ffffff" stroke={dark} strokeWidth={2.5} />
      <circle cx={50} cy={46} r={24} fill="#ffffff" stroke={dark} strokeWidth={3} />
      <circle cx={34} cy={52} r={5} fill="#ffc9d6" />
      <circle cx={66} cy={52} r={5} fill="#ffc9d6" />
      <Eyes lx={41} rx={59} cy={44} r={5} facing={facing} mood={mood} iris="#4b3a55" />
      <ellipse cx={50} cy={52} rx={3.5} ry={2.5} fill="#ff8fb1" />
      <Mouth cx={50} cy={58} mood={mood} color={dark} />
      {mood !== 'ouch' && <rect x={46.5} y={58} width={7} height={5} rx={1.5} fill="#ffffff" stroke={dark} strokeWidth={1.5} />}
      {mood === 'wet' && <Drops />}
    </g>
  );
}

export interface CharacterArtProps {
  id: CharacterId;
  facing?: Dir;
  mood?: Mood;
}

/** Character drawn inside a 100x100 box, for use inside a parent SVG. */
export function CharacterArt({ id, facing = 'down', mood = 'happy' }: CharacterArtProps) {
  switch (id) {
    case 'neko':
      return <Neko facing={facing} mood={mood} />;
    case 'usagi':
      return <Usagi facing={facing} mood={mood} />;
    default:
      return <Robo facing={facing} mood={mood} />;
  }
}

/** Standalone icon version with its own SVG element. */
export function CharacterIcon({ id, facing = 'down', mood = 'happy', className = '' }: CharacterArtProps & { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <CharacterArt id={id} facing={facing} mood={mood} />
    </svg>
  );
}
