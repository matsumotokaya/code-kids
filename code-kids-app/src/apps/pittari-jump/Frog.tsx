import type { Mood } from '../../components/Character';

export type Facing = 'left' | 'right';

const SKIN = '#8fdc6a';
const LINE = '#2f7d3f';
const EYES = [33, 67];

/** The frog drawn in a 100×100 box, feet at the bottom. */
export function FrogArt({ mood = 'happy', facing = 'right' }: { mood?: Mood; facing?: Facing }) {
  const dx = facing === 'right' ? 2.5 : -2.5;
  return (
    <g>
      <ellipse cx={50} cy={93} rx={30} ry={5} fill="rgba(0,0,0,0.12)" />
      <ellipse cx={22} cy={84} rx={13} ry={7} fill="#6cc24a" stroke={LINE} strokeWidth={3.5} />
      <ellipse cx={78} cy={84} rx={13} ry={7} fill="#6cc24a" stroke={LINE} strokeWidth={3.5} />
      {EYES.map((x) => (
        <circle key={x} cx={x} cy={38} r={14} fill={SKIN} stroke={LINE} strokeWidth={4} />
      ))}
      <ellipse cx={50} cy={64} rx={33} ry={25} fill={SKIN} stroke={LINE} strokeWidth={4} />
      {/* Re-fill the eye bumps so the body outline does not cut through them. */}
      {EYES.map((x) => (
        <circle key={`fill-${x}`} cx={x} cy={39} r={11.5} fill={SKIN} />
      ))}
      <ellipse cx={50} cy={73} rx={19} ry={12} fill="#eaf8c9" />
      <circle cx={26} cy={60} r={5} fill="#ff9fb3" opacity={0.65} />
      <circle cx={74} cy={60} r={5} fill="#ff9fb3" opacity={0.65} />
      <FrogEyes mood={mood} dx={dx} />
      <FrogMouth mood={mood} />
      <ellipse cx={38} cy={88} rx={8} ry={4.5} fill="#6cc24a" stroke={LINE} strokeWidth={3} />
      <ellipse cx={62} cy={88} rx={8} ry={4.5} fill="#6cc24a" stroke={LINE} strokeWidth={3} />
    </g>
  );
}

function FrogEyes({ mood, dx }: { mood: Mood; dx: number }) {
  if (mood === 'yay') {
    return (
      <g fill="none" stroke="#2b2b2b" strokeWidth={3.5} strokeLinecap="round">
        {EYES.map((x) => (
          <path key={x} d={`M ${x - 6} 41 Q ${x} 32 ${x + 6} 41`} />
        ))}
      </g>
    );
  }
  if (mood === 'ouch') {
    return (
      <g stroke="#2b2b2b" strokeWidth={3.5} strokeLinecap="round">
        {EYES.map((x) => (
          <g key={x}>
            <line x1={x - 5} y1={33} x2={x + 5} y2={43} />
            <line x1={x + 5} y1={33} x2={x - 5} y2={43} />
          </g>
        ))}
      </g>
    );
  }
  const dy = mood === 'wet' ? 3 : 0;
  return (
    <g>
      {EYES.map((x) => (
        <g key={x}>
          <circle cx={x} cy={38} r={9} fill="#ffffff" />
          <circle cx={x + dx} cy={39 + dy} r={4.8} fill="#2b2b2b" />
          <circle cx={x + dx + 1.6} cy={37 + dy} r={1.6} fill="#ffffff" />
          {mood === 'wet' && <path d={`M ${x - 9} 34 L ${x + 9} 34`} stroke={LINE} strokeWidth={3} strokeLinecap="round" />}
        </g>
      ))}
    </g>
  );
}

function FrogMouth({ mood }: { mood: Mood }) {
  switch (mood) {
    case 'yay':
      return <path d="M 39 56 Q 50 71 61 56 Z" fill="#d9485f" stroke={LINE} strokeWidth={3} strokeLinejoin="round" />;
    case 'ouch':
      return <path d="M 38 61 Q 44 55 50 61 Q 56 67 62 61" fill="none" stroke={LINE} strokeWidth={3.5} strokeLinecap="round" />;
    case 'wet':
      return <ellipse cx={50} cy={60} rx={4.5} ry={3.5} fill={LINE} />;
    case 'hmm':
      return <path d="M 42 59 L 58 59" stroke={LINE} strokeWidth={3.5} strokeLinecap="round" />;
    default:
      return <path d="M 38 56 Q 50 65 62 56" fill="none" stroke={LINE} strokeWidth={3.5} strokeLinecap="round" />;
  }
}

export function FrogIcon({ mood = 'happy', className = '' }: { mood?: Mood; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <FrogArt mood={mood} />
    </svg>
  );
}
