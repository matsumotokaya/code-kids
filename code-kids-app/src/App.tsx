import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { AppRunner } from './apps/AppRunner';
import type { AppId } from './apps/catalog';
import { sfx } from './audio/sfx';
import { LoginScreen } from './screens/LoginScreen';
import { StoreScreen } from './screens/StoreScreen';
import { useProgress } from './store/progress';
import { useSession } from './store/session';

type View = { name: 'store' } | { name: 'app'; app: AppId };

/** Login → store → an app, mimicking a tablet the children are not otherwise allowed to download apps on. */
export default function App() {
  const user = useSession((s) => s.user);
  const soundOn = useProgress((s) => s.soundOn);
  const [view, setView] = useState<View>({ name: 'store' });

  useEffect(() => {
    sfx.setEnabled(soundOn);
  }, [soundOn]);

  useEffect(() => {
    if (!user) setView({ name: 'store' });
  }, [user]);

  const backToStore = useCallback(() => setView({ name: 'store' }), []);

  const key = !user ? 'login' : view.name === 'app' ? `app-${view.app}` : 'store';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={key}
        className="h-full"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.02 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
      >
        {!user && <LoginScreen />}
        {user && view.name === 'store' && <StoreScreen user={user} onOpen={(app) => setView({ name: 'app', app })} />}
        {user && view.name === 'app' && <AppRunner app={view.app} user={user} onQuit={backToStore} />}
      </motion.div>
    </AnimatePresence>
  );
}
