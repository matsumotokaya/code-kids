import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { Sky } from '../../components/Sky';
import type { AppProps } from '../AppRunner';
import { getPipeLevel } from './levels';
import { MizuMapScreen } from './MapScreen';
import { MizuPlayScreen } from './PlayScreen';

export function MizuNoMichiApp({ user, onQuit }: AppProps) {
  const [levelId, setLevelId] = useState<number | null>(null);
  const level = levelId === null ? undefined : getPipeLevel(levelId);

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
            <MizuPlayScreen user={user} level={level} onExit={() => setLevelId(null)} onNext={setLevelId} />
          ) : (
            <MizuMapScreen user={user} onPlay={setLevelId} onQuit={onQuit} />
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
