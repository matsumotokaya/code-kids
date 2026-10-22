import { Hand, Home, Play, Sparkles, Square, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { sfx } from '../../audio/sfx';
import { BigButton, IconButton } from '../../components/ui/BigButton';
import { SoundToggle } from '../../components/ui/SoundToggle';
import type { UserId } from '../../store/session';
import { LoopLabel, TempoPicker } from './controls';
import { emptyPattern, FREE_STEPS, fitPattern, INSTRUMENTS, noteCount, randomGroove, TEMPO_SEC, toggleCell } from './engine';
import { useRhythmProgress, type FreeSong } from './progress';
import { StepGrid } from './StepGrid';
import { previewVoice, unlockRhythmAudio } from './synth';
import type { Instrument, Pattern, Tempo } from './types';
import { useSequencer } from './useSequencer';

interface Props {
  user: UserId;
  onExit: () => void;
}

/** じゆうに つくる: all four instruments, one 8-step loop, no stars. The song is saved per person. */
export function RhythmFreeScreen({ user, onExit }: Props) {
  const saved = useRhythmProgress((s) => s.free[user]);
  const pattern = useMemo(() => fitPattern(saved?.pattern, FREE_STEPS), [saved]);
  const tempo: Tempo = saved?.tempo ?? 'normal';

  const [playing, setPlaying] = useState(false);
  const [playStep, setPlayStep] = useState(-1);
  const [tick, setTick] = useState(0);
  const [lap, setLap] = useState(0);

  const patternRef = useRef(pattern);
  const tempoRef = useRef(tempo);
  useEffect(() => {
    patternRef.current = pattern;
    tempoRef.current = tempo;
  });

  const halt = useCallback(() => {
    setPlaying(false);
    setPlayStep(-1);
  }, []);
  const seq = useSequencer(halt);

  /** Reads the store directly so quick taps never build on a stale song. */
  const save = (change: (song: FreeSong) => Partial<FreeSong>) => {
    const current = useRhythmProgress.getState().free[user];
    const song: FreeSong = { pattern: fitPattern(current?.pattern, FREE_STEPS), tempo: current?.tempo ?? 'normal' };
    useRhythmProgress.getState().saveFree(user, { ...song, ...change(song) });
  };

  const start = () => {
    setPlaying(true);
    seq.play({
      steps: FREE_STEPS,
      pattern: () => patternRef.current,
      stepSec: () => TEMPO_SEC[tempoRef.current],
      onStep: (step, l) => {
        setPlayStep(step);
        setLap(l);
        setTick((t) => t + 1);
      },
    });
  };

  const togglePlay = () => {
    if (playing) {
      seq.stop();
      halt();
    } else start();
  };

  const toggle = (inst: Instrument, step: number) => {
    const turningOn = !pattern[inst][step];
    save((song) => ({ pattern: toggleCell(song.pattern, inst, step) }));
    if (!playing) {
      if (turningOn) previewVoice(inst, step);
      else sfx.tap();
    }
  };

  const surprise = () => {
    const next: Pattern = randomGroove();
    save(() => ({ pattern: next }));
    patternRef.current = next;
    sfx.select();
    if (!playing) start();
  };

  const clearAll = () => {
    save(() => ({ pattern: emptyPattern(FREE_STEPS) }));
    sfx.sweep();
  };

  const exit = () => {
    seq.stop();
    sfx.tap();
    onExit();
  };

  const empty = noteCount(pattern) === 0;

  return (
    <div className="flex h-full flex-col gap-3 p-3" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }} onPointerDownCapture={unlockRhythmAudio}>
      <header className="flex items-center gap-3">
        <IconButton label="マップに もどる" onClick={exit}>
          <Home className="size-7" />
        </IconButton>
        <div className="min-w-0 flex-1 rounded-2xl bg-white/80 px-4 py-2 shadow-md">
          <div className="truncate text-lg leading-tight">じゆうに つくる</div>
          <div className="text-xs text-ink/60">タップで おとを おいて「ならす！」</div>
        </div>
        <SoundToggle />
      </header>

      <main className="flex min-h-0 flex-1 flex-col gap-3 landscape:flex-row">
        <section className="relative flex min-h-0 flex-1 flex-col overflow-y-auto rounded-3xl bg-white/60 p-3 shadow-chunky backdrop-blur roomy:p-5">
          <StepGrid
            rows={INSTRUMENTS}
            steps={FREE_STEPS}
            pattern={pattern}
            sounding={playing ? pattern : null}
            playStep={playStep}
            tick={tick}
            lap={lap}
            loopLabel={<LoopLabel steps={FREE_STEPS} lap={lap} playing={playing} />}
            onToggle={toggle}
          />
          <AnimatePresence>
            {empty && (
              <motion.div
                className="pointer-events-none absolute inset-x-0 bottom-3 flex items-center justify-center gap-2 text-lg text-ink/70"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Hand className="anim-float size-8" />
                ますを タップして おとを おいてみよう！
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <aside className="flex flex-col gap-3 rounded-3xl bg-white/70 p-3 shadow-chunky backdrop-blur landscape:w-[min(340px,36%)] landscape:shrink-0 landscape:justify-center landscape:overflow-y-auto">
          <BigButton tone="green" className="text-2xl" onClick={togglePlay} disabled={!playing && empty}>
            {playing ? <Square className="size-7" /> : <Play className="size-8" />}
            {playing ? 'とめる' : 'ならす！'}
          </BigButton>
          <TempoPicker tempo={tempo} onChange={(t) => save(() => ({ tempo: t }))} />
          <div className="flex items-center gap-3">
            <IconButton label="ぜんぶ けす" onClick={clearAll} disabled={empty}>
              <Trash2 className="size-6" />
            </IconButton>
            <BigButton tone="blue" className="flex-1 text-2xl" onClick={surprise}>
              <Sparkles className="size-7" />
              おまかせ
            </BigButton>
          </div>
        </aside>
      </main>
    </div>
  );
}
