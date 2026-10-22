import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { Sky } from '../../components/Sky';
import type { AppProps } from '../AppRunner';
import { getSortLevel } from './levels';
import { ShiwakeMapScreen } from './MapScreen';
import { ShiwakePlayScreen } from './PlayScreen';

export function ShiwakeKoujouApp({ user, onQuit }: AppProps) {
  const [levelId, setLevelId] = useState<number | null>(null);
  const level = levelId === null ? undefined : getSortLevel(levelId);

  return (
    <>
      <Sky />
      <AnimatePresence mode="wait">
        <motion.div
          key={level ? `play-${level.id}` : 'map'}
          className="h-full"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -18 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          {level ? (
            <ShiwakePlayScreen user={user} level={level} onExit={() => setLevelId(null)} onNext={setLevelId} />
          ) : (
            <ShiwakeMapScreen user={user} onPlay={setLevelId} onQuit={onQuit} />
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
