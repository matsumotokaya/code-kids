import { ArrowLeft, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { sfx } from '../audio/sfx';
import { CharacterIcon, characterMeta } from '../components/Character';
import { StarRating } from '../components/StarRating';
import { STAR_PATH } from '../components/tiles';
import { IconButton } from '../components/ui/BigButton';
import { SoundToggle } from '../components/ui/SoundToggle';
import { LEVELS, TOTAL_STARS } from '../game/levels';
import { isUnlocked, totalStars, useProgress, type CharacterId } from '../store/progress';
import type { UserId } from '../store/session';

interface Props {
  user: UserId;
  character: CharacterId;
  onPlay: (levelId: number) => void;
  onBack: () => void;
}

export function MapScreen({ user, character, onPlay, onBack }: Props) {
  const profile = useProgress((s) => s.users[user]?.profiles[character]) ?? {};
  const meta = characterMeta(character);
  const currentId = LEVELS.find((l) => isUnlocked(profile, l.id) && !profile[l.id])?.id;

  return (
    <div className="flex h-full flex-col gap-3 p-3" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
      <header className="flex items-center gap-3">
        <IconButton
          label="キャラクターを かえる"
          onClick={() => {
            sfx.tap();
            onBack();
          }}
        >
          <ArrowLeft className="size-7" />
        </IconButton>
        <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl bg-white/80 px-4 py-2 shadow-md">
          <CharacterIcon id={character} className="size-12 shrink-0" />
          <div className="min-w-0">
            <div className="truncate text-lg leading-tight">{meta.name}の ぼうけん</div>
            <div className="text-xs text-ink/60">ステージを えらぼう</div>
          </div>
          <div className="ml-auto flex items-center gap-1 text-xl">
            <svg viewBox="0 0 100 100" className="size-7" aria-hidden>
              <path d={STAR_PATH} fill="#ffd84d" stroke="#d9a92a" strokeWidth={6} strokeLinejoin="round" />
            </svg>
            <span>
              {totalStars(profile)}
              <span className="text-sm text-ink/60"> / {TOTAL_STARS}</span>
            </span>
          </div>
        </div>
        <SoundToggle />
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        {/* Gaps leave room for the floating character so it never covers the label of the row above. */}
        <div className="flex min-h-full items-center">
          <div className="mx-auto grid w-full max-w-5xl grid-cols-3 gap-x-4 gap-y-16 px-4 pb-6 pt-14 sm:grid-cols-4 roomy:gap-y-20 roomy:pt-20 landscape:grid-cols-6">
            {LEVELS.map((level, i) => {
              const result = profile[level.id];
              const unlocked = isUnlocked(profile, level.id);
              const isCurrent = level.id === currentId;
              return (
                <motion.div
                  key={level.id}
                  className="relative flex flex-col items-center gap-2"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.04, type: 'spring', stiffness: 300, damping: 18 }}
                >
                  {isCurrent && (
                    <div className="anim-float pointer-events-none absolute -top-12 z-10 roomy:-top-16">
                      <CharacterIcon id={character} className="size-16 drop-shadow-lg roomy:size-20" />
                    </div>
                  )}
                  <button
                    type="button"
                    disabled={!unlocked}
                    onClick={() => {
                      sfx.select();
                      onPlay(level.id);
                    }}
                    aria-label={`ステージ ${level.id} ${level.title}${unlocked ? '' : '（まだ あそべない）'}`}
                    className={`relative flex size-20 items-center justify-center rounded-full border-b-[6px] text-3xl font-black roomy:size-28 roomy:text-4xl shadow-chunky transition-transform duration-100 active:translate-y-1.5 active:border-b-[2px] disabled:pointer-events-none ${
                      !unlocked
                        ? 'border-[#a39c90] bg-[#cfc8bc] text-white/80'
                        : result
                          ? 'border-sun-dark bg-sun text-ink'
                          : 'border-[#d8cbb4] bg-white text-ink'
                    }`}
                  >
                    {isCurrent && <span className="anim-pulse-ring absolute inset-0 rounded-full border-4 border-white" />}
                    {unlocked ? level.id : <Lock className="size-8 roomy:size-10" />}
                  </button>
                  <StarRating stars={result?.stars ?? 0} size={22} className="roomy:size-7" />
                  <div className="text-center text-xs leading-tight text-ink/70 roomy:text-base">{level.title}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
