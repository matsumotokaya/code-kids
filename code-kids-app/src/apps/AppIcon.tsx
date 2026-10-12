import { useId } from 'react';
import { CharacterArt } from '../components/Character';
import { STAR_PATH } from '../components/tiles';
import { FrogArt } from './pittari-jump/Frog';
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
      <g transform="translate(8 42) scale(0.4)">
        <FrogArt />
      </g>
    </>
  );
}

const PETAL = 'M 50 50 C 59 41 61 27 50 15 C 39 27 41 41 50 50';
const LEAF = 'M 50 50 Q 63 46 70 33 Q 57 36 50 50';

/** A small kaleidoscope: glowing petals repeated around the centre, like the game draws. */
function MahouArtArt({ uid }: { uid: string }) {
  const copies = 6;
  return (
    <>
      <defs>
        <radialGradient id={`${uid}-bg`} cx="50%" cy="45%" r="70%">
          <stop offset="0" stopColor="#3a3590" />
          <stop offset="0.6" stopColor="#17184d" />
          <stop offset="1" stopColor="#0a0b24" />
        </radialGradient>
      </defs>
      <rect width={100} height={100} fill={`url(#${uid}-bg)`} />
      {Array.from({ length: copies }, (_, k) => {
        const hue = (k * 360) / copies;
        return (
          <g key={k} transform={`rotate(${(360 * k) / copies} 50 50)`} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d={PETAL} stroke={`hsl(${hue}, 100%, 62%)`} strokeWidth={6} strokeOpacity={0.25} />
            <path d={PETAL} stroke={`hsl(${hue}, 100%, 72%)`} strokeWidth={2} />
            <path d={LEAF} stroke={`hsl(${hue + 40}, 100%, 72%)`} strokeWidth={1.6} />
            <path d={LEAF} stroke={`hsl(${hue + 40}, 100%, 72%)`} strokeWidth={1.6} transform="translate(100 0) scale(-1 1)" />
            <circle cx={50} cy={10} r={1.8} fill="#ffffff" />
          </g>
        );
      })}
      <circle cx={50} cy={50} r={3} fill="#ffffff" />
    </>
  );
}
