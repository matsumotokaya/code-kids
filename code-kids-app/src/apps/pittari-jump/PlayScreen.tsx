import { ArrowRight, Home, Lightbulb, Play, RotateCcw, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { sfx } from '../../audio/sfx';
import type { Mood } from '../../components/Character';
import { CardButton } from '../../components/CommandCard';
import { ProgramStrip } from '../../components/ProgramStrip';
import { BigButton, IconButton } from '../../components/ui/BigButton';
import { AccountBadge } from '../../components/ui/AccountBadge';
import { SoundToggle } from '../../components/ui/SoundToggle';
import { WinDialog } from '../../components/WinDialog';
import { rateStars } from '../../game/engine';
import { newCoins } from '../../store/coins';
import type { UserId } from '../../store/session';
import { useCoinBalance } from '../wallet';
import { JUMP_CARD_META, JumpCardFace, jumpLook } from './cards';
import { simulate } from './engine';
import { FrogIcon, type Facing } from './Frog';
import { getJumpLevel } from './levels';
import { hopDuration, Pond, type Hop, type TrailHop } from './Pond';
import { useJumpProgress } from './progress';
import type { JumpCardKind, JumpCommand, JumpLevel } from './types';

type Phase = 'edit' | 'running' | 'won' | 'failed';

/** One executed card for the equation bar. `to` is null when the card could not be applied. */
interface Step {
  kind: JumpCardKind;
  to: number | null;
  bad: boolean;
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

let idCounter = 0;
const nextId = () => `j${++idCounter}`;

const CARD_COLS: Record<number, string> = {
  1: 'grid-cols-2',
  2: 'grid-cols-2',
  3: 'grid-cols-3 landscape:grid-cols-2',
  4: 'grid-cols-2 min-[560px]:portrait:grid-cols-4',
};

interface Props {
  user: UserId;
  level: JumpLevel;
  onExit: () => void;
  onNext: (levelId: number) => void;
}

export function JumpPlayScreen({ user, level, onExit, onNext }: Props) {
  const recordResult = useJumpProgress((s) => s.recordResult);
  const coinTotal = useCoinBalance(user);

  const [program, setProgram] = useState<JumpCommand[]>([]);
  const [phase, setPhase] = useState<Phase>('edit');
  const [value, setValue] = useState(level.start);
  const [hop, setHop] = useState<Hop | null>(null);
  const [trail, setTrail] = useState<TrailHop[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [mood, setMood] = useState<Mood>('happy');
  const [facing, setFacing] = useState<Facing>('right');
  const [sunk, setSunk] = useState(false);
  const [snap, setSnap] = useState(0);
  const [shake, setShake] = useState(0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [failText, setFailText] = useState<string | null>(null);
  const [earned, setEarned] = useState<1 | 2 | 3>(1);
  const [coinsGained, setCoinsGained] = useState(0);
  /** Set when this clear was the first clear of the last stage, i.e. the whole game is done. */
  const [finale, setFinale] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const runId = useRef(0);
  const hopSeq = useRef(0);

  const resetBoard = useCallback(() => {
    runId.current += 1;
    setPhase('edit');
    setValue(level.start);
    setHop(null);
    setTrail([]);
    setSteps([]);
    setMood('happy');
    setFacing('right');
    setSunk(false);
    setActiveIndex(null);
    setFailText(null);
  }, [level]);

  useEffect(
    () => () => {
      runId.current += 1;
    },
    [],
  );

  const editing = phase === 'edit' || phase === 'failed';
  const nextLevel = getJumpLevel(level.id + 1);

  const addCard = (kind: JumpCardKind) => {
    if (!editing) return;
    if (phase === 'failed') resetBoard();
    if (program.length >= level.slots) {
      sfx.nope();
      return;
    }
    setProgram((p) => [...p, { id: nextId(), kind }]);
    sfx.tap();
  };

  const removeCard = (id: string) => {
    if (!editing) return;
    if (phase === 'failed') resetBoard();
    setProgram((p) => p.filter((c) => c.id !== id));
    sfx.tap();
  };

  const clearAll = () => {
    if (!editing || program.length === 0) return;
    resetBoard();
    setProgram([]);
    sfx.tap();
  };

  const run = async () => {
    if (!editing || program.length === 0) return;
    resetBoard();
    const id = runId.current + 1;
    runId.current = id;
    const alive = () => runId.current === id;

    setPhase('running');
    setShowHint(false);
    const trace = simulate(level, program);
    let hops = 0;

    const jump = async (cmdIndex: number, from: number, to: number, bad: boolean) => {
      const kind = program[cmdIndex].kind;
      setActiveIndex(cmdIndex);
      setFacing(to >= from ? 'right' : 'left');
      hopSeq.current += 1;
      setHop({ from, to, seq: hopSeq.current });
      setValue(to);
      sfx.hop(hops++);
      await wait(hopDuration(from, to) * 1000 + 120);
      if (!alive()) return;
      setTrail((t) => [...t, { from, to, kind }]);
      setSteps((s) => [...s, { kind, to, bad }]);
    };

    for (const ev of trace.events) {
      if (!alive()) return;
      switch (ev.kind) {
        case 'jump':
          await jump(ev.cmdIndex, ev.from, ev.to, false);
          break;
        case 'croc':
          setSteps((s) => s.map((st, i) => (i === s.length - 1 ? { ...st, bad: true } : st)));
          setSnap((n) => n + 1);
          setShake((n) => n + 1);
          setMood('ouch');
          setFailText(`${ev.at} には わにが いたよ！`);
          sfx.bump();
          await wait(800);
          break;
        case 'splash':
          await jump(ev.cmdIndex, ev.from, ev.to, true);
          setSunk(true);
          setMood('wet');
          setFailText(ev.to < 0 ? '0より ちいさく なって いけに おちちゃった！' : `${level.max}より おおきく なって いけに おちちゃった！`);
          sfx.splash();
          await wait(950);
          break;
        case 'split':
          setActiveIndex(ev.cmdIndex);
          setSteps((s) => [...s, { kind: program[ev.cmdIndex].kind, to: null, bad: true }]);
          setShake((n) => n + 1);
          setMood('hmm');
          setFailText(`${ev.at} は はんぶんに できないよ`);
          sfx.nope();
          await wait(800);
          break;
        case 'win':
          setMood('yay');
          sfx.win();
          await wait(650);
          break;
        case 'end':
          setMood('hmm');
          setFailText(`ぴったり とまれなかったよ。いまは ${ev.at}`);
          sfx.nope();
          await wait(450);
          break;
      }
    }

    if (!alive()) return;
    setActiveIndex(null);
    if (trace.outcome === 'win') {
      const stars = rateStars(level.par, program.length);
      setEarned(stars);
      const prevStars = useJumpProgress.getState().users[user]?.[level.id]?.stars ?? 0;
      setCoinsGained(newCoins(prevStars, stars));
      setFinale(!nextLevel && prevStars === 0);
      recordResult(user, level.id, stars, program.length);
      setPhase('won');
    } else {
      setPhase('failed');
    }
  };

  return (
    <div className="flex h-full flex-col gap-3 p-3" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
      <header className="flex items-center gap-2 sm:gap-3">
        <IconButton
          label="マップに もどる"
          onClick={() => {
            sfx.tap();
            onExit();
          }}
        >
          <Home className="size-7" />
        </IconButton>
        <div className="min-w-0 flex-1 rounded-2xl bg-white/80 px-4 py-2 shadow-md">
          <div className="text-xs leading-none text-ink/60">ステージ {level.id}</div>
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
        <AccountBadge user={user} />
      </header>

      <main className="flex min-h-0 flex-1 flex-col gap-3">
        <section className="relative flex min-h-0 flex-1 items-center justify-center">
          <Pond
            level={level}
            value={value}
            hop={hop}
            trail={trail}
            mood={mood}
            facing={facing}
            sunk={sunk}
            snap={snap}
            shake={shake}
            won={phase === 'won'}
          />

          <AnimatePresence>
            {showHint && (
              <motion.button
                type="button"
                onClick={() => setShowHint(false)}
                initial={{ opacity: 0, y: -16, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.9 }}
                className="absolute left-3 right-3 top-2 flex items-center gap-3 rounded-3xl border-4 border-sun bg-cream px-4 py-3 text-left text-base leading-snug shadow-chunky"
              >
                <FrogIcon className="size-14 shrink-0" />
                <span>{level.hint}</span>
              </motion.button>
            )}
          </AnimatePresence>
        </section>

        <EquationBar start={level.start} goal={level.goal} steps={steps} />

        <AnimatePresence>
          {phase === 'failed' && failText && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className="flex items-center gap-3 rounded-2xl border-4 border-[#ffb35c] bg-white px-4 py-2 shadow-md"
            >
              <FrogIcon mood={sunk ? 'wet' : mood} className="size-12 shrink-0" />
              <span className="text-lg leading-snug">{failText}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <aside className="flex flex-col gap-3 rounded-3xl bg-white/70 p-3 shadow-chunky backdrop-blur landscape:grid landscape:grid-cols-2 landscape:gap-x-4">
          <div className="landscape:col-start-1 landscape:row-start-1">
            <ProgramStrip program={program} slots={level.slots} activeIndex={activeIndex} disabled={!editing} onRemove={removeCard} look={jumpLook} />
          </div>
          <div className={`grid gap-3 landscape:col-start-2 landscape:row-span-2 landscape:row-start-1 landscape:self-center ${CARD_COLS[level.cards.length] ?? 'grid-cols-2'}`}>
            {level.cards.map((kind) => {
              const meta = JUMP_CARD_META[kind];
              return (
                <CardButton
                  key={kind}
                  label={meta.label}
                  bg={meta.bg}
                  border={meta.border}
                  text="#ffffff"
                  face={<JumpCardFace kind={kind} className="text-4xl" />}
                  disabled={!editing}
                  onClick={() => addCard(kind)}
                />
              );
            })}
          </div>
          <div className="flex items-center gap-3 landscape:col-start-1 landscape:row-start-2 landscape:self-end">
            <IconButton label="ぜんぶ けす" onClick={clearAll} disabled={!editing || program.length === 0}>
              <Trash2 className="size-6" />
            </IconButton>
            <IconButton
              label="さいしょの ばしょに もどす"
              tone={phase === 'failed' ? 'yellow' : 'white'}
              onClick={() => {
                resetBoard();
                sfx.tap();
              }}
              disabled={phase === 'edit'}
            >
              <RotateCcw className="size-6" />
            </IconButton>
            <BigButton className="flex-1 text-2xl" onClick={run} disabled={!editing || program.length === 0}>
              <Play className="size-8 fill-current" />
              とべ！
            </BigButton>
          </div>
        </aside>
      </main>

      <AnimatePresence>
        {phase === 'won' && (
          <WinDialog
            key="win"
            hero={<FrogIcon mood="yay" className="mx-auto size-32" />}
            earned={earned}
            used={program.length}
            par={level.par}
            coins={{ gained: coinsGained, total: coinTotal }}
            finale={finale}
            hasNext={!!nextLevel}
            onNext={() => nextLevel && onNext(nextLevel.id)}
            onRetry={resetBoard}
            onMap={onExit}
          >
            <div className="mt-3 flex justify-center">
              <Equation start={level.start} steps={steps} />
            </div>
          </WinDialog>
        )}
      </AnimatePresence>
    </div>
  );
}

function NumberChip({ n, tone = 'plain' }: { n: number | null; tone?: 'plain' | 'goal' | 'bad' }) {
  const tones = {
    plain: 'border-[#2b7bb9] bg-white text-[#23415a]',
    goal: 'border-sun-dark bg-sun text-ink',
    bad: 'border-[#d0675a] bg-[#ffe1dc] text-[#7a2e25]',
  };
  return (
    <span className={`inline-flex size-10 shrink-0 items-center justify-center rounded-full border-[3px] text-xl font-black ${tones[tone]}`}>
      {n ?? '?'}
    </span>
  );
}

/** "2 → +3 → 5 → ×2 → 10": each card as an operation and the number it lands on. */
function Equation({ start, steps }: { start: number; steps: Step[] }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5">
      <NumberChip n={start} />
      {steps.map((s, i) => {
        const meta = JUMP_CARD_META[s.kind];
        return (
          <span key={i} className="flex items-center gap-1.5">
            <ArrowRight className="size-4 text-ink/40" />
            <span className="rounded-full px-2.5 py-1 text-lg font-black text-white" style={{ backgroundColor: meta.bg }}>
              {meta.face}
            </span>
            <ArrowRight className="size-4 text-ink/40" />
            <NumberChip n={s.to} tone={s.bad ? 'bad' : 'plain'} />
          </span>
        );
      })}
    </div>
  );
}

function EquationBar({ start, goal, steps }: { start: number; goal: number; steps: Step[] }) {
  return (
    <div className="flex min-h-14 items-center justify-center rounded-2xl bg-white/80 px-4 py-2 shadow-md">
      {steps.length === 0 ? (
        <div className="flex flex-wrap items-center justify-center gap-2 text-lg">
          <NumberChip n={start} />
          から
          <NumberChip n={goal} tone="goal" />
          に ぴったり とまろう！
        </div>
      ) : (
        <Equation start={start} steps={steps} />
      )}
    </div>
  );
}
