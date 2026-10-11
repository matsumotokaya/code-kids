import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { sfx } from '../../audio/sfx';
import { Sky } from '../../components/Sky';
import { getLevel } from '../../game/levels';
import { MapScreen } from '../../screens/MapScreen';
import { PlayScreen } from '../../screens/PlayScreen';
import { TitleScreen } from '../../screens/TitleScreen';
import { useProgress } from '../../store/progress';
import type { UserId } from '../../store/session';

type Screen = { name: 'title' } | { name: 'map' } | { name: 'play'; levelId: number };

interface Props {
  user: UserId;
  onQuit: () => void;
}

export function HoshiatsumeApp({ user, onQuit }: Props) {
  const [screen, setScreen] = useState<Screen>({ name: 'title' });
  const character = useProgress((s) => s.users[user]?.character ?? null);
  const setCharacter = useProgress((s) => s.setCharacter);

  const level = screen.name === 'play' ? getLevel(screen.levelId) : undefined;
  const showTitle = screen.name === 'title' || !character || (screen.name === 'play' && !level);
  const key = showTitle ? 'title' : screen.name === 'play' ? `play-${screen.levelId}` : 'map';

  return (
    <>
      <Sky />
      <AnimatePresence mode="wait">
        <motion.div
          key={key}
          className="h-full"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -18 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          {showTitle && (
            <TitleScreen
              user={user}
              onHome={onQuit}
              onSelect={(id) => {
                setCharacter(user, id);
                sfx.select();
                setScreen({ name: 'map' });
              }}
            />
          )}
          {!showTitle && screen.name === 'map' && character && (
            <MapScreen
              user={user}
              character={character}
              onBack={() => setScreen({ name: 'title' })}
              onPlay={(levelId) => setScreen({ name: 'play', levelId })}
            />
          )}
          {!showTitle && screen.name === 'play' && character && level && (
            <PlayScreen
              user={user}
              level={level}
              character={character}
              onExit={() => setScreen({ name: 'map' })}
              onNext={(levelId) => setScreen({ name: 'play', levelId })}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
