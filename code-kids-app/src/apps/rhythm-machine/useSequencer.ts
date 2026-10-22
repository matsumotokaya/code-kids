import { useEffect, useRef, useState } from 'react';
import { createSequencer, type Sequencer } from './sequencer';

/**
 * One sequencer per screen. It stops when the screen unmounts and when the tablet hides the page
 * (then `onInterrupt` lets the screen reset its buttons), so no sound or timer outlives the screen.
 */
export function useSequencer(onInterrupt: () => void): Sequencer {
  const [seq] = useState(createSequencer);
  const interrupt = useRef(onInterrupt);

  useEffect(() => {
    interrupt.current = onInterrupt;
  });

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && seq.isPlaying()) {
        seq.stop();
        interrupt.current();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      seq.stop();
    };
  }, [seq]);

  return seq;
}
