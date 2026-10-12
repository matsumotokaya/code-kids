import { ArrowLeft } from 'lucide-react';
import { sfx } from '../audio/sfx';
import { CharacterIcon, characterMeta } from '../components/Character';
import { LevelGrid } from '../components/LevelGrid';
import { StarTotal } from '../components/StarRating';
import { IconButton } from '../components/ui/BigButton';
import { SoundToggle } from '../components/ui/SoundToggle';
import { LEVELS, TOTAL_STARS } from '../game/levels';
import { totalStars, useProgress, type CharacterId } from '../store/progress';
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
          <StarTotal earned={totalStars(profile)} total={TOTAL_STARS} />
        </div>
        <SoundToggle />
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <LevelGrid
          levels={LEVELS}
          results={profile}
          marker={<CharacterIcon id={character} className="size-16 drop-shadow-lg roomy:size-20" />}
          onPlay={onPlay}
        />
      </main>
    </div>
  );
}
