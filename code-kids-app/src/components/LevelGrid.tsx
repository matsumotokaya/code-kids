import { Lock } from 'lucide-react';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { sfx } from '../audio/sfx';
import { isUnlocked, type Profile } from '../store/progress';
import { StarRating } from './StarRating';

interface Props {
  levels: { id: number; title: string }[];
  results: Profile;
  /** Floats above the next level to play, e.g. the player's character. */
  marker: ReactNode;
  onPlay: (levelId: number) => void;
  /** Overrides the default "previous id is cleared" rule (Hoshiatsume World 2 starts at 101). */
  unlocked?: (levelId: number) => boolean;
  /** Number printed on the stage button; defaults to the id. */
  label?: (levelId: number) => number;
}

/** Stage-select grid shared by every game: cleared levels turn gold and the next one is unlocked. */
export function LevelGrid({ levels, results, marker, onPlay, unlocked: unlockRule, label = (id) => id }: Props) {
  const canPlay = (id: number) => (unlockRule ? unlockRule(id) : isUnlocked(results, id));
  const currentId = levels.find((l) => canPlay(l.id) && !results[l.id])?.id;

  return (
    // Gaps leave room for the floating marker so it never covers the label of the row above.
    <div className="flex min-h-full items-center">
      <div className="mx-auto grid w-full max-w-5xl grid-cols-3 gap-x-4 gap-y-16 px-4 pb-6 pt-14 sm:grid-cols-4 roomy:gap-y-20 roomy:pt-20 landscape:grid-cols-6">
        {levels.map((level, i) => {
          const result = results[level.id];
          const unlocked = canPlay(level.id);
          const isCurrent = level.id === currentId;
          return (
            <motion.div
              key={level.id}
              className="relative flex flex-col items-center gap-2"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.04, type: 'spring', stiffness: 300, damping: 18 }}
            >
              {isCurrent && <div className="anim-float pointer-events-none absolute -top-12 z-10 roomy:-top-16">{marker}</div>}
              <button
                type="button"
                disabled={!unlocked}
                onClick={() => {
                  sfx.select();
                  onPlay(level.id);
                }}
                aria-label={`ステージ ${label(level.id)} ${level.title}${unlocked ? '' : '（まだ あそべない）'}`}
                className={`relative flex size-20 items-center justify-center rounded-full border-b-[6px] text-3xl font-black roomy:size-28 roomy:text-4xl shadow-chunky transition-transform duration-100 active:translate-y-1.5 active:border-b-[2px] disabled:pointer-events-none ${
                  !unlocked
                    ? 'border-[#a39c90] bg-[#cfc8bc] text-white/80'
                    : result
                      ? 'border-sun-dark bg-sun text-ink'
                      : 'border-[#d8cbb4] bg-white text-ink'
                }`}
              >
                {isCurrent && <span className="anim-pulse-ring absolute inset-0 rounded-full border-4 border-white" />}
                {unlocked ? label(level.id) : <Lock className="size-8 roomy:size-10" />}
              </button>
              <StarRating stars={result?.stars ?? 0} size={22} className="roomy:size-7" />
              <div className="text-center text-xs leading-tight text-ink/70 roomy:text-base">{level.title}</div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
