import type { Treat } from './types';

export const TREAT_NAMES: Record<Treat, string> = {
  cookie: 'クッキー',
  candy: 'あめ',
  choco: 'チョコ',
};

/** One treat centred on (0, 0), about 24 units across at scale 1. */
export function TreatArt({ treat, scale = 1 }: { treat: Treat; scale?: number }) {
  return (
    <g transform={scale === 1 ? undefined : `scale(${scale})`}>
      <ellipse cx={0} cy={11} rx={10} ry={2.5} fill="#000" opacity={0.12} />
      {treat === 'cookie' ? (
        <g>
          <circle r={11.5} fill="#e2a65a" stroke="#a8692c" strokeWidth={2} />
          <path d="M -7 -5 A 8 8 0 0 1 -1 -9" fill="none" stroke="#f3c98a" strokeWidth={2.5} strokeLinecap="round" />
          <circle cx={-4} cy={2} r={2.2} fill="#5a3418" />
          <circle cx={4} cy={-3} r={2.2} fill="#5a3418" />
          <circle cx={3} cy={5} r={1.8} fill="#5a3418" />
          <circle cx={-1} cy={-5} r={1.5} fill="#5a3418" />
        </g>
      ) : treat === 'candy' ? (
        <g>
          <path d="M -7 0 L -13 -6.5 L -13 6.5 Z" fill="#ff8fb3" stroke="#d9577f" strokeWidth={1.8} strokeLinejoin="round" />
          <path d="M 7 0 L 13 -6.5 L 13 6.5 Z" fill="#ff8fb3" stroke="#d9577f" strokeWidth={1.8} strokeLinejoin="round" />
          <circle r={8.5} fill="#ff6f9c" stroke="#d9577f" strokeWidth={1.8} />
          <path d="M -5 -5 Q 1 0 -5 5 M 0 -8 Q 6 0 0 8" fill="none" stroke="#fff" strokeWidth={2} opacity={0.85} />
        </g>
      ) : (
        <g>
          <rect x={-10.5} y={-10.5} width={21} height={21} rx={4} fill="#7b4a2b" stroke="#4e2c17" strokeWidth={2} />
          <path d="M 0 -9 V 9 M -9 0 H 9" stroke="#5e3720" strokeWidth={1.8} />
          <path d="M -7 -7 L -3 -7" stroke="#b07a52" strokeWidth={2} strokeLinecap="round" />
        </g>
      )}
    </g>
  );
}

export type FaceMood = 'happy' | 'yay';

const ANIMALS = [
  { fur: '#c98d5a', inner: '#f1cfa8', ears: 'round' },
  { fur: '#f6f1ea', inner: '#ffc3d3', ears: 'long' },
  { fur: '#f2a15a', inner: '#ffe0bf', ears: 'pointy' },
  { fur: '#9fd07a', inner: '#dff3c8', ears: 'none' },
  { fur: '#ffb3c4', inner: '#ffe1e8', ears: 'pointy' },
  { fur: '#b7b0e8', inner: '#e6e2ff', ears: 'round' },
] as const;

/** A friend waiting for treats, centred on (0, 0), about 50 units across. */
export function AnimalFace({ index, mood = 'happy' }: { index: number; mood?: FaceMood }) {
  const a = ANIMALS[index % ANIMALS.length];
  const ink = '#3b2f2f';
  return (
    <g>
      {a.ears === 'round' && (
        <>
          <circle cx={-17} cy={-17} r={9} fill={a.fur} stroke={ink} strokeWidth={2} />
          <circle cx={17} cy={-17} r={9} fill={a.fur} stroke={ink} strokeWidth={2} />
          <circle cx={-17} cy={-17} r={4.5} fill={a.inner} />
          <circle cx={17} cy={-17} r={4.5} fill={a.inner} />
        </>
      )}
      {a.ears === 'long' && (
        <>
          <ellipse cx={-9} cy={-30} rx={6.5} ry={16} fill={a.fur} stroke={ink} strokeWidth={2} />
          <ellipse cx={9} cy={-30} rx={6.5} ry={16} fill={a.fur} stroke={ink} strokeWidth={2} />
          <ellipse cx={-9} cy={-30} rx={3} ry={11} fill={a.inner} />
          <ellipse cx={9} cy={-30} rx={3} ry={11} fill={a.inner} />
        </>
      )}
      {a.ears === 'pointy' && (
        <>
          <path d="M -21 -8 L -18 -28 L -5 -19 Z" fill={a.fur} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
          <path d="M 21 -8 L 18 -28 L 5 -19 Z" fill={a.fur} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
        </>
      )}
      {a.ears === 'none' && (
        <>
          <circle cx={-11} cy={-18} r={8} fill={a.fur} stroke={ink} strokeWidth={2} />
          <circle cx={11} cy={-18} r={8} fill={a.fur} stroke={ink} strokeWidth={2} />
        </>
      )}
      <circle r={23} fill={a.fur} stroke={ink} strokeWidth={2.5} />
      <ellipse cx={0} cy={8} rx={11} ry={8} fill={a.inner} />
      <circle cx={-14} cy={6} r={4} fill="#ff8fa8" opacity={0.6} />
      <circle cx={14} cy={6} r={4} fill="#ff8fa8" opacity={0.6} />
      {a.ears === 'none' ? (
        <>
          <circle cx={-11} cy={-18} r={3.5} fill={ink} />
          <circle cx={11} cy={-18} r={3.5} fill={ink} />
        </>
      ) : mood === 'yay' ? (
        <>
          <path d="M -12 -3 Q -8 -9 -4 -3" fill="none" stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
          <path d="M 4 -3 Q 8 -9 12 -3" fill="none" stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx={-8} cy={-4} r={3} fill={ink} />
          <circle cx={8} cy={-4} r={3} fill={ink} />
        </>
      )}
      {mood === 'yay' ? (
        <path d="M -6 7 Q 0 16 6 7 Z" fill="#c43d5c" stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      ) : (
        <path d="M -5 8 Q 0 12 5 8" fill="none" stroke={ink} strokeWidth={2.2} strokeLinecap="round" />
      )}
    </g>
  );
}

/** A plate shaped like a lunch tray, centred on x = 0 with its top edge at y = 0. */
export function TrayArt({ width, height }: { width: number; height: number }) {
  return (
    <g>
      <rect x={-width / 2} y={4} width={width} height={height} rx={18} fill="#d8cbb4" />
      <rect x={-width / 2} y={0} width={width} height={height} rx={18} fill="#ffffff" stroke="#d8cbb4" strokeWidth={3} />
      <rect x={-width / 2 + 7} y={7} width={width - 14} height={height - 14} rx={13} fill="#fff4e0" />
    </g>
  );
}

/** The glass jar the machine takes treats from; (0, 0) is the middle of its bottom edge. */
export function JarArt({ width, height }: { width: number; height: number }) {
  const w = width / 2;
  return (
    <g>
      <rect x={-w} y={-height} width={width} height={height} rx={20} fill="#e9f7ff" fillOpacity={0.75} stroke="#7fb8d8" strokeWidth={3.5} />
      <rect x={-w + 12} y={-height - 14} width={width - 24} height={16} rx={6} fill="#ff8a3d" stroke="#c96422" strokeWidth={3} />
      <path d={`M ${-w + 10} ${-height + 24} L ${-w + 10} ${-30}`} stroke="#fff" strokeWidth={6} strokeLinecap="round" opacity={0.8} />
    </g>
  );
}

/** The basket for leftovers; (0, 0) is the middle of its bottom edge. */
export function BasketArt({ width, height }: { width: number; height: number }) {
  const w = width / 2;
  return (
    <g>
      <path
        d={`M ${-w} ${-height} L ${w} ${-height} L ${w - 12} 0 L ${-w + 12} 0 Z`}
        fill="#e7b46a"
        stroke="#a8742f"
        strokeWidth={3.5}
        strokeLinejoin="round"
      />
      {[0.3, 0.55, 0.8].map((t) => (
        <line key={t} x1={-w + 12 * (1 - t)} y1={-height * (1 - t)} x2={w - 12 * (1 - t)} y2={-height * (1 - t)} stroke="#c48a3f" strokeWidth={2.5} />
      ))}
      <rect x={-w - 4} y={-height - 6} width={width + 8} height={12} rx={6} fill="#d29a4c" stroke="#a8742f" strokeWidth={3} />
    </g>
  );
}

export type RobotMood = 'happy' | 'yay' | 'oops';

/** くばるくん, the robot that runs the machine. Drawn in a 100 × 100 box. */
export function RobotArt({ mood = 'happy' }: { mood?: RobotMood }) {
  const ink = '#1d3557';
  return (
    <g>
      <ellipse cx={50} cy={95} rx={26} ry={4} fill="#000" opacity={0.12} />
      <line x1={50} y1={22} x2={50} y2={10} stroke="#6b7c93" strokeWidth={4} strokeLinecap="round" />
      <g transform="translate(50 8) scale(0.55)">
        <TreatArt treat="candy" />
      </g>
      <rect x={10} y={46} width={10} height={22} rx={5} fill="#8fa3bf" stroke="#4f6b8a" strokeWidth={3} />
      <rect x={80} y={46} width={10} height={22} rx={5} fill="#8fa3bf" stroke="#4f6b8a" strokeWidth={3} />
      <rect x={17} y={22} width={66} height={68} rx={20} fill="#9fd3f5" stroke="#3b7fb8" strokeWidth={3.5} />
      <rect x={26} y={34} width={48} height={34} rx={12} fill="#f4fbff" stroke="#3b7fb8" strokeWidth={2.5} />
      <circle cx={30} cy={78} r={5} fill="#ff9cc0" opacity={0.7} />
      <circle cx={70} cy={78} r={5} fill="#ff9cc0" opacity={0.7} />
      {mood === 'yay' ? (
        <>
          <path d="M 34 52 Q 39 44 44 52" fill="none" stroke={ink} strokeWidth={4} strokeLinecap="round" />
          <path d="M 56 52 Q 61 44 66 52" fill="none" stroke={ink} strokeWidth={4} strokeLinecap="round" />
          <path d="M 42 74 Q 50 86 58 74 Z" fill="#c43d5c" stroke={ink} strokeWidth={2.5} strokeLinejoin="round" />
        </>
      ) : mood === 'oops' ? (
        <>
          <circle cx={39} cy={51} r={4.5} fill={ink} />
          <circle cx={61} cy={51} r={4.5} fill={ink} />
          <ellipse cx={50} cy={79} rx={5} ry={3.5} fill={ink} />
          <path d="M 88 26 C 85 31 85 34 88 36 C 91 34 91 31 88 26 Z" fill="#bfe6ff" stroke="#3b7fb8" strokeWidth={2} />
        </>
      ) : (
        <>
          <circle cx={39} cy={51} r={4.5} fill={ink} />
          <circle cx={61} cy={51} r={4.5} fill={ink} />
          <path d="M 42 76 Q 50 82 58 76" fill="none" stroke={ink} strokeWidth={3.5} strokeLinecap="round" />
        </>
      )}
    </g>
  );
}

/** Small くばるくん for the map marker, the hint bubble and the win dialog. */
export function RobotIcon({ mood, className = '' }: { mood?: RobotMood; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <RobotArt mood={mood} />
    </svg>
  );
}
