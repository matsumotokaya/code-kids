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
        {id === 'mizu-no-michi' && <MizuNoMichiArt uid={uid} />}
        {id === 'shiwake-koujou' && <ShiwakeKoujouArt uid={uid} />}
        {id === 'okashi-wake' && <OkashiWakeArt uid={uid} />}
        {id === 'shikitsume-garden' && <ShikitsumeGardenArt uid={uid} />}
        {id === 'rhythm-machine' && <RhythmMachineArt uid={uid} />}
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

const PIPE = 'M 4 30 H 34 V 66 H 72 V 84';

/** A tap on the left, a bent pipe carrying water, and a flower waiting at the end. */
function MizuNoMichiArt({ uid }: { uid: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9fdcff" />
          <stop offset="1" stopColor="#e6f7ff" />
        </linearGradient>
      </defs>
      <rect width={100} height={100} fill={`url(#${uid}-bg)`} />
      <rect y={84} width={100} height={16} fill="#6fbf52" />
      <path d={PIPE} fill="none" stroke="#5f7d8f" strokeWidth={17} strokeLinejoin="round" />
      <path d={PIPE} fill="none" stroke="#9fb6c4" strokeWidth={13} strokeLinejoin="round" />
      <path d={PIPE} fill="none" stroke="#2f9bff" strokeWidth={6} strokeLinejoin="round" strokeDasharray="9 5" />
      {[
        [34, 30],
        [34, 66],
        [72, 66],
      ].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x - 10} y={y - 10} width={20} height={20} rx={4} fill="none" stroke="#5f7d8f" strokeWidth={3} />
      ))}
      <g transform="translate(72 74)">
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} cx={0} cy={-8} rx={5} ry={8} fill="#ff8fb3" transform={`rotate(${a})`} />
        ))}
        <circle r={4.5} fill="#ffd84d" />
      </g>
      <path d="M 50 12 Q 56 21 50 25 Q 44 21 50 12 Z" fill="#2f9bff" />
    </>
  );
}

/** A conveyor belt splitting a red apple and a blue ball into their own boxes. */
function ShiwakeKoujouArt({ uid }: { uid: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd98a" />
          <stop offset="1" stopColor="#fff3d6" />
        </linearGradient>
      </defs>
      <rect width={100} height={100} fill={`url(#${uid}-bg)`} />
      <rect x={6} y={40} width={58} height={16} rx={8} fill="#4a4a5a" />
      {[14, 26, 38, 50].map((x) => (
        <path key={x} d={`M ${x} 44 L ${x + 6} 48 L ${x} 52`} fill="none" stroke="#c9c9d6" strokeWidth={2.5} strokeLinecap="round" />
      ))}
      <path d="M 64 48 L 80 30 M 64 48 L 80 66" stroke="#4a4a5a" strokeWidth={10} strokeLinecap="round" />
      <rect x={74} y={14} width={22} height={20} rx={4} fill="#ff6b6b" stroke="#c94f4f" strokeWidth={2.5} />
      <rect x={74} y={62} width={22} height={20} rx={4} fill="#5aa9ff" stroke="#2f73c9" strokeWidth={2.5} />
      <circle cx={22} cy={34} r={9} fill="#ff5a5a" stroke="#c43d3d" strokeWidth={2} />
      <path d="M 22 25 Q 24 20 28 19" stroke="#4e9a3a" strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <circle cx={44} cy={34} r={8} fill="#4aa3ef" stroke="#2b6aa3" strokeWidth={2} />
      <path d="M 38 31 Q 44 26 50 31" stroke="#dff1ff" strokeWidth={2} fill="none" />
      <rect x={0} y={84} width={100} height={16} fill="#c9a26b" />
    </>
  );
}

/** Six candies shared out onto three plates. */
function OkashiWakeArt({ uid }: { uid: string }) {
  const plates = [20, 50, 80];
  return (
    <>
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffb8d2" />
          <stop offset="1" stopColor="#fff0f6" />
        </linearGradient>
      </defs>
      <rect width={100} height={100} fill={`url(#${uid}-bg)`} />
      <rect x={30} y={8} width={40} height={24} rx={8} fill="#8a7cf0" stroke="#5b4ec4" strokeWidth={2.5} />
      <circle cx={42} cy={20} r={3.5} fill="#ffffff" />
      <circle cx={58} cy={20} r={3.5} fill="#ffffff" />
      <path d="M 50 32 L 50 44" stroke="#5b4ec4" strokeWidth={4} strokeLinecap="round" />
      {plates.map((x) => (
        <g key={x}>
          <ellipse cx={x} cy={78} rx={15} ry={6} fill="#ffffff" stroke="#d9c7d0" strokeWidth={2} />
          {[-5, 5].map((dx) => (
            <g key={dx}>
              <circle cx={x + dx} cy={71} r={5} fill={x === 50 ? '#ffd84d' : x === 20 ? '#ff7aa8' : '#7ad1ff'} stroke="#ffffff" strokeWidth={1.5} />
            </g>
          ))}
        </g>
      ))}
      <circle cx={50} cy={52} r={6} fill="#ffd84d" stroke="#d9a92a" strokeWidth={1.5} />
    </>
  );
}

/** A 3 × 4 bed of flowers, so the icon itself is a multiplication. */
function ShikitsumeGardenArt({ uid }: { uid: string }) {
  const colors = ['#ff7aa8', '#ffd84d', '#7ad1ff'];
  return (
    <>
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b8ec8f" />
          <stop offset="1" stopColor="#e9fbd9" />
        </linearGradient>
      </defs>
      <rect width={100} height={100} fill={`url(#${uid}-bg)`} />
      <rect x={12} y={22} width={76} height={60} rx={8} fill="#a8723f" />
      <rect x={15} y={25} width={70} height={54} rx={6} fill="#8c5e2a" />
      {[0, 1, 2].map((r) =>
        [0, 1, 2, 3].map((c) => {
          const cx = 25 + c * 17;
          const cy = 35 + r * 17;
          return (
            <g key={`${r}-${c}`}>
              {[0, 72, 144, 216, 288].map((a) => (
                <ellipse key={a} cx={cx} cy={cy - 4} rx={2.6} ry={4} fill={colors[r]} transform={`rotate(${a} ${cx} ${cy})`} />
              ))}
              <circle cx={cx} cy={cy} r={2.4} fill="#fff4bf" />
            </g>
          );
        }),
      )}
    </>
  );
}

/** A glowing 4 × 8 step grid with a playhead. */
function RhythmMachineArt({ uid }: { uid: string }) {
  const on = new Set(['0-0', '0-4', '1-2', '1-6', '2-0', '2-2', '2-4', '2-6', '3-3', '3-7']);
  const rowColors = ['#ff7a7a', '#ffd84d', '#7ad1ff', '#b98cff'];
  return (
    <>
      <defs>
        <radialGradient id={`${uid}-bg`} cx="50%" cy="20%" r="90%">
          <stop offset="0" stopColor="#7b4fd6" />
          <stop offset="1" stopColor="#24184f" />
        </radialGradient>
      </defs>
      <rect width={100} height={100} fill={`url(#${uid}-bg)`} />
      <rect x={42} y={18} width={11} height={66} rx={4} fill="#ffffff" opacity={0.18} />
      {rowColors.map((color, r) =>
        Array.from({ length: 8 }, (_, c) => (
          <rect
            key={`${r}-${c}`}
            x={9 + c * 10.5}
            y={22 + r * 15}
            width={8}
            height={11}
            rx={2.5}
            fill={on.has(`${r}-${c}`) ? color : '#ffffff'}
            opacity={on.has(`${r}-${c}`) ? 1 : 0.16}
          />
        )),
      )}
    </>
  );
}
