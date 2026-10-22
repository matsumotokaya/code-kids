import { Footprints, Rabbit, Turtle } from 'lucide-react';
import { sfx } from '../../audio/sfx';
import type { Tempo } from './types';

const TEMPO_CHOICES: { tempo: Tempo; label: string; Icon: typeof Turtle }[] = [
  { tempo: 'slow', label: 'ゆっくり', Icon: Turtle },
  { tempo: 'normal', label: 'ふつう', Icon: Footprints },
  { tempo: 'fast', label: 'はやい', Icon: Rabbit },
];

/** ゆっくり / ふつう / はやい. A change is heard at once, even while the loop is playing. */
export function TempoPicker({ tempo, onChange }: { tempo: Tempo; onChange: (tempo: Tempo) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2" role="group" aria-label="はやさ">
      {TEMPO_CHOICES.map(({ tempo: t, label, Icon }) => {
        const selected = t === tempo;
        return (
          <button
            key={t}
            type="button"
            aria-pressed={selected}
            onClick={() => {
              if (!selected) onChange(t);
              sfx.tap();
            }}
            className={`flex h-14 items-center justify-center gap-1 rounded-2xl border-b-4 text-base transition-transform duration-100 active:translate-y-1 active:border-b-0 ${
              selected ? 'border-sun-dark bg-sun text-ink' : 'border-[#d8cbb4] bg-white text-ink/80'
            }`}
          >
            <Icon className="size-6 shrink-0" />
            <span className="whitespace-nowrap">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** "8つで 1しゅう…" under the loop arrow, with which lap is playing. */
export function LoopLabel({ steps, lap, playing, unit }: { steps: number; lap: number; playing: boolean; unit?: number }) {
  const text = unit ? `${unit}つを ×${steps / unit} くりかえすと ${steps}こ` : `${steps}つで 1しゅう、おわったら また はじめから くりかえす`;
  return (
    <>
      {text}
      {playing && (
        <span className="ml-2 inline-block rounded-full bg-[#9b8bd6] px-2.5 py-0.5 text-white">
          {lap + 1}しゅうめ
        </span>
      )}
    </>
  );
}
