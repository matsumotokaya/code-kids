import { LayoutGrid } from 'lucide-react';
import { sfx } from '../../audio/sfx';
import { LevelGrid } from '../../components/LevelGrid';
import { StarTotal } from '../../components/StarRating';
import { IconButton } from '../../components/ui/BigButton';
import { AccountBadge } from '../../components/ui/AccountBadge';
import { SoundToggle } from '../../components/ui/SoundToggle';
import { totalStars } from '../../store/progress';
import type { UserId } from '../../store/session';
import { HakoIcon } from './art';
import { SORT_LEVELS } from './levels';
import { useShiwakeProgress } from './progress';

interface Props {
  user: UserId;
  onPlay: (levelId: number) => void;
  onQuit: () => void;
}

export function ShiwakeMapScreen({ user, onPlay, onQuit }: Props) {
  const profile = useShiwakeProgress((s) => s.users[user]) ?? {};

  return (
    <div className="flex h-full flex-col gap-3 p-3" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
      <header className="flex items-center gap-2 sm:gap-3">
        <IconButton
          label="ストアに もどる"
          onClick={() => {
            sfx.tap();
            onQuit();
          }}
        >
          <LayoutGrid className="size-7" />
        </IconButton>
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl bg-white/80 px-3 py-2 shadow-md sm:gap-3 sm:px-4">
          <HakoIcon className="size-12 shrink-0 max-sm:hidden" />
          <div className="min-w-0">
            <div className="truncate text-lg leading-tight">しわけこうじょう</div>
            <div className="text-xs text-ink/60">ステージを えらぼう</div>
          </div>
          <StarTotal earned={totalStars(profile)} total={SORT_LEVELS.length * 3} />
        </div>
        <SoundToggle />
        <AccountBadge user={user} />
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <LevelGrid levels={SORT_LEVELS} results={profile} marker={<HakoIcon className="size-16 drop-shadow-lg roomy:size-20" />} onPlay={onPlay} />
      </main>
    </div>
  );
}
