import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState, type ComponentType } from 'react';
import type { UserId } from '../store/session';
import { AppIcon } from './AppIcon';
import { appInfo, type AppId } from './catalog';
import { HoshiatsumeApp } from './hoshiatsume/HoshiatsumeApp';
import { MahouArtApp } from './mahou-art/MahouArtApp';
import { MizuNoMichiApp } from './mizu-no-michi/MizuNoMichiApp';
import { PittariJumpApp } from './pittari-jump/PittariJumpApp';

export interface AppProps {
  user: UserId;
  onQuit: () => void;
}

/** Playable apps. A catalog entry without a component here can only be listed as "soon". */
const COMPONENTS: Partial<Record<AppId, ComponentType<AppProps>>> = {
  hoshiatsume: HoshiatsumeApp,
  'pittari-jump': PittariJumpApp,
  'mahou-art': MahouArtApp,
  'mizu-no-michi': MizuNoMichiApp,
};

const SPLASH_MS = 900;

interface Props extends AppProps {
  app: AppId;
}

/** Shows a short launch splash, like a real app starting, then the app itself. */
export function AppRunner({ app, user, onQuit }: Props) {
  const [booting, setBooting] = useState(true);
  const Component = COMPONENTS[app];
  const info = appInfo(app);

  useEffect(() => {
    const timer = setTimeout(() => setBooting(false), SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!Component) onQuit();
  }, [Component, onQuit]);

  if (!Component) return null;

  return (
    <AnimatePresence mode="wait">
      {booting ? (
        <motion.div
          key="splash"
          className="flex h-full items-center justify-center"
          style={{ background: info.splash }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }}>
            <AppIcon id={app} className="size-36" />
          </motion.div>
        </motion.div>
      ) : (
        <motion.div key="app" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
          <Component user={user} onQuit={onQuit} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
