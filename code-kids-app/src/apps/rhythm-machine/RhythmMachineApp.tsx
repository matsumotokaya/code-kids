import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { Sky } from '../../components/Sky';
import type { AppProps } from '../AppRunner';
import { RhythmFreeScreen } from './FreeScreen';
import { getRhythmLevel } from './levels';
import { RhythmMapScreen } from './MapScreen';
import { RhythmPlayScreen } from './PlayScreen';

type Screen = { kind: 'map' } | { kind: 'stage'; id: number } | { kind: 'free' };

/** リズムマシン: まねっこ stages (copy a rhythm by ear) and じゆうに つくる (free play). */
export function RhythmMachineApp({ user, onQuit }: AppProps) {
  const [screen, setScreen] = useState<Screen>({ kind: 'map' });
  const level = screen.kind === 'stage' ? getRhythmLevel(screen.id) : undefined;
  const toMap = () => setScreen({ kind: 'map' });
  const key = level ? `stage-${level.id}` : screen.kind;

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
          {level ? (
            <RhythmPlayScreen user={user} level={level} onExit={toMap} onNext={(id) => setScreen({ kind: 'stage', id })} />
          ) : screen.kind === 'free' ? (
            <RhythmFreeScreen user={user} onExit={toMap} />
          ) : (
            <RhythmMapScreen user={user} onPlay={(id) => setScreen({ kind: 'stage', id })} onFree={() => setScreen({ kind: 'free' })} onQuit={onQuit} />
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
