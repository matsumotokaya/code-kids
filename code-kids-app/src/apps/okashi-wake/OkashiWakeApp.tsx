import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { Sky } from '../../components/Sky';
import type { AppProps } from '../AppRunner';
import { getOkashiLevel } from './levels';
import { OkashiMapScreen } from './MapScreen';
import { OkashiPlayScreen } from './PlayScreen';

export function OkashiWakeApp({ user, onQuit }: AppProps) {
  const [levelId, setLevelId] = useState<number | null>(null);
  const level = levelId === null ? undefined : getOkashiLevel(levelId);

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
            <OkashiPlayScreen user={user} level={level} onExit={() => setLevelId(null)} onNext={setLevelId} />
          ) : (
            <OkashiMapScreen user={user} onPlay={setLevelId} onQuit={onQuit} />
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
