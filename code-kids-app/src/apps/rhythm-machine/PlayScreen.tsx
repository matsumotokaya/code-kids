import { Check, Ear, Home, Lightbulb, Play, Square, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { sfx } from '../../audio/sfx';
import { BigButton, IconButton } from '../../components/ui/BigButton';
import { SoundToggle } from '../../components/ui/SoundToggle';
import { WinDialog } from '../../components/WinDialog';
import { newCoins } from '../../store/coins';
import type { UserId } from '../../store/session';
import { useCoinBalance } from '../wallet';
import { LoopGlyph, TaikoIcon } from './art';
import { LoopLabel, TempoPicker } from './controls';
import {
  emptyPattern,
  isEditableStep,
  judge,
  levelTarget,
  listenLaps,
  loopTimes,
  noteCount,
  playedPattern,
  rateTries,
  TEMPO_SEC,
  toggleCell,
} from './engine';
import { getRhythmLevel } from './levels';
import { useRhythmProgress } from './progress';
import { StepGrid } from './StepGrid';
import { previewVoice, unlockRhythmAudio } from './synth';
import type { Instrument, Judgement, RhythmLevel, Tempo } from './types';
import { useSequencer } from './useSequencer';

/** `listen`: the おてほん is playing. `play`: the child's own grid is looping. */
type Phase = 'idle' | 'listen' | 'play' | 'won';

interface Props {
  user: UserId;
  level: RhythmLevel;
  onExit: () => void;
  onNext: (levelId: number) => void;
}

export function RhythmPlayScreen({ user, level, onExit, onNext }: Props) {
  const recordResult = useRhythmProgress((s) => s.recordResult);
  const firstVisit = useRhythmProgress((s) => !s.users[user]?.[level.id]);
  const coinTotal = useCoinBalance(user);
  const target = useMemo(() => levelTarget(level), [level]);
  const times = loopTimes(level);
  const nextLevel = getRhythmLevel(level.id + 1);

  const [edited, setEdited] = useState(() => emptyPattern(level.steps));
  const [loopOn, setLoopOn] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [playStep, setPlayStep] = useState(-1);
  const [tick, setTick] = useState(0);
  const [lap, setLap] = useState(0);
  const [tempo, setTempo] = useState<Tempo>('normal');
  const [tries, setTries] = useState(0);
  const [judgement, setJudgement] = useState<Judgement | null>(null);
  const [heard, setHeard] = useState(false);
  const [showHint, setShowHint] = useState(firstVisit);
  const [earned, setEarned] = useState<1 | 2 | 3>(1);
  const [coinsGained, setCoinsGained] = useState(0);

  const played = playedPattern(level, edited, loopOn);
  // The sequencer reads these on every step, so edits and tempo changes are heard while it loops.
  const playedRef = useRef(played);
  const tempoRef = useRef(tempo);
  useEffect(() => {
    playedRef.current = played;
    tempoRef.current = tempo;
  });

  const halt = useCallback(() => {
    setPhase((p) => (p === 'won' ? p : 'idle'));
    setPlayStep(-1);
  }, []);
  const seq = useSequencer(halt);

  const onStep = (step: number, l: number) => {
    setPlayStep(step);
    setLap(l);
    setTick((t) => t + 1);
  };

  const stopAll = () => {
    seq.stop();
    halt();
  };

  const listen = () => {
    if (phase === 'listen') return stopAll();
    setHeard(true);
    setShowHint(false);
    setPhase('listen');
    seq.play({
      steps: level.steps,
      pattern: () => target,
      stepSec: () => TEMPO_SEC[tempoRef.current],
      laps: listenLaps(level.steps),
      onStep,
      onEnd: halt,
    });
  };

  const playMine = () => {
    if (phase === 'play') return stopAll();
    setShowHint(false);
    setPhase('play');
    seq.play({ steps: level.steps, pattern: () => playedRef.current, stepSec: () => TEMPO_SEC[tempoRef.current], onStep });
  };

  const toggle = (inst: Instrument, step: number) => {
    if (phase === 'won' || !isEditableStep(level, step)) return;
    const turningOn = !edited[inst][step];
    setEdited((p) => toggleCell(p, inst, step));
    // The child's own notes stay; the orange mark on a cell goes away once they touch it.
    setJudgement((j) => (j ? { ...j, diffs: j.diffs.filter((d) => d.inst !== inst || d.step !== step) } : j));
    // While the own loop plays the note is heard on the next lap; otherwise play it now, so tapping along to the おてほん works.
    if (phase !== 'play') {
      if (turningOn) previewVoice(inst, step);
      else sfx.tap();
    }
  };

  const toggleLoop = () => {
    if (phase === 'won') return;
    const next = !loopOn;
    setLoopOn(next);
    setJudgement((j) => (j?.needLoop ? null : j));
    if (next) sfx.bloom(times);
    else sfx.tap();
  };

  const clearAll = () => {
    setEdited(emptyPattern(level.steps));
    setJudgement(null);
    sfx.sweep();
  };

  const compare = () => {
    if (phase === 'won') return;
    seq.stop();
    setPlayStep(-1);
    const attempt = tries + 1;
    setTries(attempt);
    setShowHint(false);
    const result = judge(level, edited, loopOn);
    setJudgement(result);
    if (result.ok) {
      const stars = rateTries(attempt);
      const prevStars = useRhythmProgress.getState().users[user]?.[level.id]?.stars ?? 0;
      setEarned(stars);
      setCoinsGained(newCoins(prevStars, stars));
      recordResult(user, level.id, stars, attempt);
      sfx.win();
      setPhase('won');
    } else {
      sfx.nope();
      setPhase('idle');
    }
  };

  const reset = () => {
    seq.stop();
    setEdited(emptyPattern(level.steps));
    setLoopOn(false);
    setPhase('idle');
    setPlayStep(-1);
    setTries(0);
    setJudgement(null);
  };

  const exit = () => {
    seq.stop();
    sfx.tap();
    onExit();
  };

  const missing = judgement?.diffs.filter((d) => d.kind === 'missing').length ?? 0;
  const extra = judgement?.diffs.filter((d) => d.kind === 'extra').length ?? 0;
  const failText = !judgement || judgement.ok
    ? null
    : judgement.needLoop
      ? `つくった ところは ぴったり！ でも のこりが しずか だよ。「×${times} くりかえす」を おしてみよう`
      : missing + extra === 0
        ? 'なおせたかな？ もういちど「くらべる！」を おしてみよう'
        : `おしい！ ${[missing > 0 && `たりない おとが ${missing}つ`, extra > 0 && `おおい おとが ${extra}つ`].filter(Boolean).join('、')}。オレンジの ところを みてね`;

  const sounding = phase === 'listen' ? target : phase === 'play' ? played : null;
  const playing = phase === 'listen' || phase === 'play';

  return (
    <div className="flex h-full flex-col gap-3 p-3" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }} onPointerDownCapture={unlockRhythmAudio}>
      <header className="flex items-center gap-3">
        <IconButton label="マップに もどる" onClick={exit}>
          <Home className="size-7" />
        </IconButton>
        <div className="min-w-0 flex-1 rounded-2xl bg-white/80 px-4 py-2 shadow-md">
          <div className="text-xs leading-none text-ink/60">まねっこ {level.id}</div>
          <div className="truncate text-lg leading-tight">{level.title}</div>
        </div>
        <IconButton
          label="ヒント"
          tone="yellow"
          onClick={() => {
            setShowHint((v) => !v);
            sfx.tap();
          }}
        >
          <Lightbulb className="size-7" />
        </IconButton>
        <SoundToggle />
      </header>

      <main className="flex min-h-0 flex-1 flex-col gap-3 landscape:flex-row">
        <section className="relative flex min-h-0 flex-1 flex-col overflow-y-auto rounded-3xl bg-white/60 p-3 shadow-chunky backdrop-blur roomy:p-5">
          <StepGrid
            rows={level.rows}
            steps={level.steps}
            pattern={played}
            ghost={level.ghost ? target : null}
            sounding={sounding}
            playStep={playStep}
            tick={tick}
            lap={lap}
            diffs={judgement?.diffs}
            editableUpTo={level.loop}
            disabled={phase === 'won'}
            loopLabel={<LoopLabel steps={level.steps} lap={lap} playing={playing} unit={level.loop} />}
            onToggle={toggle}
          />

          <AnimatePresence>
            {showHint && (
              <motion.button
                type="button"
                onClick={() => setShowHint(false)}
                initial={{ opacity: 0, y: -16, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.9 }}
                className="absolute left-3 right-3 top-2 z-10 flex items-center gap-3 rounded-3xl border-4 border-sun bg-cream px-4 py-3 text-left text-base leading-snug shadow-chunky"
              >
                <TaikoIcon className="size-14 shrink-0" />
                <span>{level.hint}</span>
              </motion.button>
            )}
          </AnimatePresence>
        </section>

        <aside className="flex flex-col gap-3 rounded-3xl bg-white/70 p-3 shadow-chunky backdrop-blur landscape:w-[min(340px,36%)] landscape:shrink-0 landscape:overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <BigButton tone="yellow" className="relative px-3 text-xl" onClick={listen} disabled={phase === 'won'}>
              {!heard && <span className="anim-pulse-ring pointer-events-none absolute inset-0 rounded-2xl border-4 border-sun-dark" />}
              {phase === 'listen' ? <Square className="size-6" /> : <Ear className="size-7" />}
              {phase === 'listen' ? 'とめる' : 'きく'}
            </BigButton>
            <BigButton tone="green" className="px-3 text-xl" onClick={playMine} disabled={phase === 'won' || (phase !== 'play' && noteCount(played) === 0)}>
              {phase === 'play' ? <Square className="size-6" /> : <Play className="size-7" />}
              {phase === 'play' ? 'とめる' : 'ならす！'}
            </BigButton>
          </div>
          <p className="text-center text-sm leading-snug text-ink/60">
            {phase === 'listen' ? 'おてほんを きいてるよ。ひかった ところを みてね' : '「きく」で おてほん、「ならす！」で じぶんの おと'}
          </p>

          {level.loop && (
            <motion.button
              type="button"
              onClick={toggleLoop}
              disabled={phase === 'won'}
              aria-pressed={loopOn}
              animate={judgement?.needLoop ? { scale: [1, 1.08, 1] } : { scale: 1 }}
              transition={judgement?.needLoop ? { duration: 0.8, repeat: Infinity } : { duration: 0.2 }}
              className={`flex min-h-16 items-center justify-center gap-2 rounded-2xl border-b-[6px] px-4 text-2xl font-black shadow-chunky transition-colors active:translate-y-1.5 active:border-b-[2px] ${
                loopOn ? 'border-[#6a5bb5] bg-[#9b8bd6] text-white' : 'border-[#d8cbb4] bg-white text-[#6a5bb5]'
              }`}
            >
              <LoopGlyph className={`size-8 ${loopOn ? 'animate-spin [animation-duration:2.5s]' : ''}`} />×{times} くりかえす
            </motion.button>
          )}

          <TempoPicker tempo={tempo} onChange={setTempo} />

          <AnimatePresence>
            {failText && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                className="mt-auto flex items-center gap-3 rounded-2xl border-4 border-[#ffb35c] bg-white px-4 py-3 shadow-md"
              >
                <TaikoIcon mood="oops" className="size-12 shrink-0" />
                <span className="text-base leading-snug">{failText}</span>
              </motion.div>
            )}
          </AnimatePresence>
          <div className={`flex items-center gap-3 pt-1 ${failText ? '' : 'mt-auto'}`}>
            <IconButton label="ぜんぶ けす" onClick={clearAll} disabled={phase === 'won' || noteCount(edited) === 0}>
              <Trash2 className="size-6" />
            </IconButton>
            <BigButton tone="blue" className="flex-1 text-2xl" onClick={compare} disabled={phase === 'won' || noteCount(edited) === 0}>
              <Check className="size-8" />
              くらべる！
            </BigButton>
          </div>
        </aside>
      </main>

      <AnimatePresence>
        {phase === 'won' && (
          <WinDialog
            key="win"
            hero={<TaikoIcon mood="yay" className="mx-auto size-32" />}
            earned={earned}
            used={tries}
            par={1}
            note={earned === 3 ? '1かいめで ぴったり！ よく きいたね' : `${tries}かいめで ぴったり！ 1かいめで できると ほし3つ`}
            coins={{ gained: coinsGained, total: coinTotal }}
            hasNext={!!nextLevel}
            onNext={() => nextLevel && onNext(nextLevel.id)}
            onRetry={reset}
            onMap={onExit}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
