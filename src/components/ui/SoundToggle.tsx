import { Volume2, VolumeX } from 'lucide-react';
import { useProgress } from '../../store/progress';
import { sfx } from '../../audio/sfx';
import { IconButton } from './BigButton';

export function SoundToggle() {
  const soundOn = useProgress((s) => s.soundOn);
  const toggleSound = useProgress((s) => s.toggleSound);
  return (
    <IconButton
      label={soundOn ? 'おとを けす' : 'おとを だす'}
      onClick={() => {
        toggleSound();
        if (!soundOn) {
          sfx.setEnabled(true);
          sfx.tap();
        }
      }}
    >
      {soundOn ? <Volume2 className="size-7" /> : <VolumeX className="size-7 opacity-50" />}
    </IconButton>
  );
}
