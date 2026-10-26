import { LayoutGrid } from 'lucide-react';
import { motion } from 'motion/react';
import { sfx } from '../audio/sfx';
import { CHARACTERS, CharacterIcon } from '../components/Character';
import { STAR_PATH } from '../components/tiles';
import { AccountBadge } from '../components/ui/AccountBadge';
import { IconButton } from '../components/ui/BigButton';
import { totalStars, useProgress, type CharacterId } from '../store/progress';
import type { UserId } from '../store/session';

interface Props {
  user: UserId;
  onSelect: (id: CharacterId) => void;
  onHome: () => void;
}

export function TitleScreen({ user, onSelect, onHome }: Props) {
  const profiles = useProgress((s) => s.users[user]?.profiles);
  return (
    <div className="relative flex h-full flex-col items-center justify-center gap-7 overflow-y-auto p-6">
      <div className="absolute left-3" style={{ top: 'max(0.75rem, env(safe-area-inset-top))' }}>
        <IconButton
          label="ストアに もどる"
          onClick={() => {
            sfx.tap();
            onHome();
          }}
        >
          <LayoutGrid className="size-7" />
        </IconButton>
      </div>
      <div className="absolute right-3" style={{ top: 'max(0.75rem, env(safe-area-inset-top))' }}>
        <AccountBadge user={user} />
      </div>
      <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 18 }} className="text-center">
        <h1 className="text-outline text-6xl font-black tracking-wide text-white sm:text-7xl">ほしあつめ</h1>
        <p className="mt-4 inline-block rounded-full bg-white/80 px-5 py-1.5 text-base text-ink/80 shadow sm:text-lg">
          カードを ならべて、おほしさまを あつめよう！
        </p>
      </motion.div>

      <h2 className="text-2xl text-ink/90">だれで あそぶ？</h2>

      <div className="flex flex-wrap justify-center gap-4 sm:gap-5">
        {CHARACTERS.map((c, i) => (
          <motion.button
            key={c.id}
            type="button"
            initial={{ scale: 0, rotate: -12 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.15 + i * 0.12, type: 'spring', stiffness: 260, damping: 16 }}
            onClick={() => onSelect(c.id)}
            className="w-40 rounded-[2rem] sm:w-44 border-b-8 bg-white p-4 shadow-chunky transition-transform duration-100 active:translate-y-2 active:border-b-2"
            style={{ borderColor: c.dark }}
            aria-label={`${c.name}で あそぶ`}
          >
            <div className="anim-float" style={{ animationDelay: `${i * 0.3}s` }}>
              <CharacterIcon id={c.id} className="mx-auto size-32" />
            </div>
            <div className="mt-1 text-2xl">{c.name}</div>
            <div className="mt-1 flex items-center justify-center gap-1 text-base text-ink/70">
              <svg viewBox="0 0 100 100" className="size-6" aria-hidden>
                <path d={STAR_PATH} fill="#ffd84d" stroke="#d9a92a" strokeWidth={6} strokeLinejoin="round" />
              </svg>
              {totalStars(profiles?.[c.id] ?? {})}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
