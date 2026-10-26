import { ArrowLeft, Lock } from 'lucide-react';
import { sfx } from '../audio/sfx';
import { CharacterIcon, characterMeta } from '../components/Character';
import { LevelGrid } from '../components/LevelGrid';
import { StarTotal } from '../components/StarRating';
import { IconButton } from '../components/ui/BigButton';
import { AccountBadge } from '../components/ui/AccountBadge';
import { SoundToggle } from '../components/ui/SoundToggle';
import { isLevelUnlocked, LEVELS, stageNumber, TOTAL_STARS, WORLD2_FIRST_ID, WORLD2_LEVELS, WORLD2_VISIBLE } from '../game/levels';
import { totalStars, useProgress, type CharacterId, type Profile } from '../store/progress';
import type { UserId } from '../store/session';

export type World = 1 | 2;

interface Props {
  user: UserId;
  character: CharacterId;
  /** Which world's stages to show. Ignored (always 1) while World 2 is not visible. */
  world: World;
  onWorldChange: (world: World) => void;
  onPlay: (levelId: number) => void;
  onBack: () => void;
}

const starsIn = (profile: Profile, ids: number[]) => ids.reduce((sum, id) => sum + (profile[id]?.stars ?? 0), 0);

export function MapScreen({ user, character, world: requested, onWorldChange, onPlay, onBack }: Props) {
  const profile = useProgress((s) => s.users[user]?.profiles[character]) ?? {};
  const meta = characterMeta(character);
  const world: World = WORLD2_VISIBLE ? requested : 1;
  const cleared = (id: number) => (profile[id]?.stars ?? 0) > 0;
  const world2Open = isLevelUnlocked(cleared, WORLD2_FIRST_ID);

  return (
    <div className="flex h-full flex-col gap-3 p-3" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
      <header className="flex items-center gap-2 sm:gap-3">
        <IconButton
          label="キャラクターを かえる"
          onClick={() => {
            sfx.tap();
            onBack();
          }}
        >
          <ArrowLeft className="size-7" />
        </IconButton>
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl bg-white/80 px-3 py-2 shadow-md sm:gap-3 sm:px-4">
          <CharacterIcon id={character} className="size-12 shrink-0 max-sm:hidden" />
          <div className="min-w-0">
            <div className="truncate text-lg leading-tight">{meta.name}の ぼうけん</div>
            <div className="text-xs text-ink/60">ステージを えらぼう</div>
          </div>
          {world === 1 ? (
            <StarTotal earned={WORLD2_VISIBLE ? starsIn(profile, LEVELS.map((l) => l.id)) : totalStars(profile)} total={TOTAL_STARS} />
          ) : (
            <StarTotal earned={starsIn(profile, WORLD2_LEVELS.map((l) => l.id))} total={WORLD2_LEVELS.length * 3} />
          )}
        </div>
        <SoundToggle />
        <AccountBadge user={user} />
      </header>

      {WORLD2_VISIBLE && (
        <nav className="flex justify-center gap-3" aria-label="ワールド">
          {([1, 2] as const).map((w) => (
            <button
              key={w}
              type="button"
              aria-pressed={world === w}
              onClick={() => {
                sfx.tap();
                onWorldChange(w);
              }}
              className={`flex min-h-12 items-center gap-2 rounded-full border-b-[5px] px-6 text-lg font-black shadow-md transition-transform duration-100 active:translate-y-1 active:border-b-[1px] ${
                world === w ? 'border-sun-dark bg-sun text-ink' : 'border-[#d8cbb4] bg-white/85 text-ink/70'
              }`}
            >
              {w === 2 && !world2Open && <Lock className="size-5" aria-hidden />}
              ワールド{w}
            </button>
          ))}
        </nav>
      )}

      <main className="min-h-0 flex-1 overflow-y-auto">
        {world === 1 ? (
          <LevelGrid
            levels={LEVELS}
            results={profile}
            marker={<CharacterIcon id={character} className="size-16 drop-shadow-lg roomy:size-20" />}
            onPlay={onPlay}
          />
        ) : (
          <LevelGrid
            key="world2"
            levels={WORLD2_LEVELS}
            results={profile}
            marker={<CharacterIcon id={character} className="size-16 drop-shadow-lg roomy:size-20" />}
            onPlay={onPlay}
            unlocked={(id) => isLevelUnlocked(cleared, id)}
            label={(id) => stageNumber({ id })}
          />
        )}
      </main>
    </div>
  );
}
