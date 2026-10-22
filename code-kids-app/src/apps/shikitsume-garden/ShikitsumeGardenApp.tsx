import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { Sky } from '../../components/Sky';
import type { AppProps } from '../AppRunner';
import { getGardenLevel } from './levels';
import { ShikitsumeMapScreen } from './MapScreen';
import { ShikitsumePlayScreen } from './PlayScreen';

export function ShikitsumeGardenApp({ user, onQuit }: AppProps) {
  const [levelId, setLevelId] = useState<number | null>(null);
  const level = levelId === null ? undefined : getGardenLevel(levelId);

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
            <ShikitsumePlayScreen user={user} level={level} onExit={() => setLevelId(null)} onNext={setLevelId} />
          ) : (
            <ShikitsumeMapScreen user={user} onPlay={setLevelId} onQuit={onQuit} />
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
