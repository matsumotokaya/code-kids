import { useId } from 'react';
import { CharacterArt } from '../components/Character';
import { STAR_PATH } from '../components/tiles';
import type { AppId } from './catalog';

interface Props {
  id: AppId;
  className?: string;
}

/** Rounded-square app icon in the style of a tablet home screen. Corner radius follows the usual 22.5%. */
export function AppIcon({ id, className = '' }: Props) {
  // useId contains characters that are awkward inside url(#…), so keep only safe ones.
  const uid = `icon${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return (
    <div className={`relative shrink-0 overflow-hidden rounded-[22.5%] shadow-[0_1px_2px_rgba(0,0,0,0.08),0_8px_20px_rgba(0,0,0,0.14)] ring-1 ring-black/5 ${className}`}>
      <svg viewBox="0 0 100 100" className="block size-full" aria-hidden>
        {id === 'hoshiatsume' && <HoshiatsumeArt uid={uid} />}
        {id === 'pittari-jump' && <PittariJumpArt uid={uid} />}
        {id === 'mahou-art' && <MahouArtArt uid={uid} />}
      </svg>
    </div>
  );
}

function HoshiatsumeArt({ uid }: { uid: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7cc8ff" />
          <stop offset="1" stopColor="#d4f3ff" />
        </linearGradient>
      </defs>
      <rect width={100} height={100} fill={`url(#${uid}-bg)`} />
      <rect x={8} y={66} width={84} height={30} rx={10} fill="#8c5e2a" />
      <rect x={8} y={60} width={84} height={28} rx={10} fill="#6fbf52" />
      <g transform="translate(58 -3) scale(0.56)">
        <path d={STAR_PATH} fill="#ffd84d" stroke="#d9a92a" strokeWidth={6} strokeLinejoin="round" />
      </g>
      <g transform="translate(12 22) scale(0.62)">
        <CharacterArt id="robo" />
      </g>
    </>
  );
}

function PittariJumpArt({ uid }: { uid: string }) {
  const ticks = [12, 31, 50, 69, 88];
  return (
    <>
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8ef0a6" />
          <stop offset="1" stopColor="#2fb36a" />
        </linearGradient>
      </defs>
      <rect width={100} height={100} fill={`url(#${uid}-bg)`} />
      <line x1={10} y1={80} x2={90} y2={80} stroke="#ffffff" strokeWidth={4} strokeLinecap="round" />
      {ticks.map((x) => (
        <line key={x} x1={x} y1={74} x2={x} y2={86} stroke="#ffffff" strokeWidth={3} strokeLinecap="round" />
      ))}
      <path d="M 28 62 Q 50 10 72 62" fill="none" stroke="#ffffff" strokeWidth={3.5} strokeLinecap="round" strokeDasharray="5 6" />
      <g transform="translate(55 44) scale(0.36)">
        <path d={STAR_PATH} fill="#ffd84d" stroke="#d9a92a" strokeWidth={8} strokeLinejoin="round" />
      </g>
      {/* Frog */}
      <ellipse cx={28} cy={69} rx={13} ry={10} fill="#c4f27a" stroke="#2a7a40" strokeWidth={3} />
      {[21, 35].map((x) => (
        <g key={x}>
          <circle cx={x} cy={58} r={5.5} fill="#ffffff" stroke="#2a7a40" strokeWidth={2.5} />
          <circle cx={x + 0.8} cy={58.5} r={2.3} fill="#1f2a2a" />
        </g>
      ))}
      <path d="M 22 70 Q 28 75 34 70" fill="none" stroke="#2a7a40" strokeWidth={2.5} strokeLinecap="round" />
    </>
  );
}

const ART_COLORS = ['#ffe66d', '#7cf5ff', '#ffffff', '#ffb3e8'];

/** The times-table circle the game draws: point i joins point (i × k) mod n. */
function MahouArtArt({ uid }: { uid: string }) {
  const n = 40;
  const k = 2;
  const r = 34;
  const pt = (i: number) => {
    const t = (i * 2 * Math.PI) / n - Math.PI / 2;
    return { x: 50 + r * Math.cos(t), y: 50 + r * Math.sin(t) };
  };
  return (
    <>
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6d4bd8" />
          <stop offset="1" stopColor="#e14fad" />
        </linearGradient>
      </defs>
      <rect width={100} height={100} fill={`url(#${uid}-bg)`} />
      <circle cx={50} cy={50} r={r} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} />
      {Array.from({ length: n }, (_, i) => {
        const a = pt(i);
        const b = pt((i * k) % n);
        return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={ART_COLORS[i % ART_COLORS.length]} strokeWidth={1.3} strokeOpacity={0.9} />;
      })}
    </>
  );
}
