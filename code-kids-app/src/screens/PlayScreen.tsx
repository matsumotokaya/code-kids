import { ChevronRight, Home, Lightbulb, Play, RotateCcw, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { sfx } from '../audio/sfx';
import { Board } from '../components/Board';
import { CharacterIcon, type Mood } from '../components/Character';
import { CommandCard } from '../components/CommandCard';
import { Confetti } from '../components/Confetti';
import { ProgramStrip } from '../components/ProgramStrip';
import { StarRating } from '../components/StarRating';
import { BigButton, IconButton } from '../components/ui/BigButton';
import { SoundToggle } from '../components/ui/SoundToggle';
import { keyOf, rateStars, simulate } from '../game/engine';
import { getLevel } from '../game/levels';
import type { CardKind, Command, Dir, Level, Point, Times } from '../game/types';
import { useProgress, type CharacterId } from '../store/progress';

type Phase = 'edit' | 'running' | 'won' | 'failed';

const HOP_MS = 380;
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

let idCounter = 0;
const nextId = () => `c${++idCounter}`;

interface Props {
  level: Level;
  character: CharacterId;
  onExit: () => void;
  onNext: (levelId: number) => void;
}

export function PlayScreen({ level, character, onExit, onNext }: Props) {
  const recordResult = useProgress((s) => s.recordResult);

  const [program, setProgram] = useState<Command[]>([]);
  const [phase, setPhase] = useState<Phase>('edit');
  const [pos, setPos] = useState<Point>(level.start);
  const [facing, setFacing] = useState<Dir>(level.facing);
  const [mood, setMood] = useState<Mood>('happy');
  const [collected, setCollected] = useState<Set<string>>(() => new Set());
  const [trail, setTrail] = useState<Point[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [sunk, setSunk] = useState(false);
  const [shake, setShake] = useState(0);
  const [shakeDir, setShakeDir] = useState<Dir | null>(null);
  const [ripple, setRipple] = useState<Point | null>(null);
  const [failText, setFailText] = useState<string | null>(null);
  const [earned, setEarned] = useState<1 | 2 | 3>(1);
  const [showHint, setShowHint] = useState(false);
  const runId = useRef(0);

  const resetBoard = useCallback(() => {
    runId.current += 1;
    setPhase('edit');
    setPos(level.start);
    setFacing(level.facing);
    setMood('happy');
    setCollected(new Set());
    setTrail([]);
    setActiveIndex(null);
    setSunk(false);
    setRipple(null);
    setFailText(null);
  }, [level]);

  useEffect(() => {
    setProgram([]);
    resetBoard();
  }, [level.id, resetBoard]);

  useEffect(
    () => () => {
      runId.current += 1;
    },
    [],
  );

  const editing = phase === 'edit' || phase === 'failed';
  const nextLevel = getLevel(level.id + 1);

  const addCard = (kind: CardKind) => {
    if (!editing) return;
    if (phase === 'failed') resetBoard();
    if (kind === 'x2' || kind === 'x3') {
      const times: Times = kind === 'x2' ? 2 : 3;
      const last = program.at(-1);
      if (!last || last.times === times) {
        sfx.nope();
        return;
      }
      setProgram((p) => p.map((c, i) => (i === p.length - 1 ? { ...c, times } : c)));
      sfx.power();
      return;
    }
    if (program.length >= level.slots) {
      sfx.nope();
      return;
    }
    setProgram((p) => [...p, { id: nextId(), dir: kind, times: 1 }]);
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

    for (const ev of trace.events) {
      if (!alive()) return;
      switch (ev.kind) {
        case 'move':
          setActiveIndex(ev.cmdIndex);
          setFacing(ev.dir);
          setTrail((t) => [...t, ev.from]);
          setPos(ev.to);
          sfx.hop(hops++);
          await wait(HOP_MS);
          break;
        case 'star':
          setCollected((s) => new Set(s).add(keyOf(ev.at)));
          setMood('yay');
          sfx.star();
          await wait(280);
          if (alive() && ev.remaining > 0) setMood('happy');
          break;
        case 'bump':
          setActiveIndex(ev.cmdIndex);
          setFacing(ev.dir);
          setShakeDir(ev.dir);
          setShake((n) => n + 1);
          setMood('ouch');
          setFailText(ev.into === 'rock' ? 'いわに ぶつかった！' : 'そとには いけないよ！');
          sfx.bump();
          await wait(750);
          break;
        case 'splash':
          setMood('wet');
          setSunk(true);
          setRipple(ev.at);
          setFailText('みずに おちちゃった！');
          sfx.splash();
          await wait(950);
          break;
        case 'win':
          setMood('yay');
          sfx.win();
          await wait(550);
          break;
        case 'end':
          setMood('hmm');
          setFailText('おほしさまが のこってるよ');
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
      recordResult(character, level.id, stars, program.length);
      setPhase('won');
    } else {
      setPhase('failed');
    }
  };

  const cardCols =
    level.cards.length <= 2 ? 'grid-cols-2' : level.cards.length <= 4 ? 'grid-cols-2 sm:portrait:grid-cols-4' : 'grid-cols-3 sm:portrait:grid-cols-6';

  return (
    <div className="flex h-full flex-col gap-3 p-3" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
      <header className="flex items-center gap-3">
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
      </header>

      <main className="flex min-h-0 flex-1 flex-col gap-3 landscape:flex-row">
        <section className="relative flex min-h-0 flex-1 items-center justify-center">
          <Board
            level={level}
            character={character}
            pos={pos}
            facing={facing}
            mood={mood}
            collected={collected}
            trail={trail}
            sunk={sunk}
            shake={shake}
            shakeDir={shakeDir}
            ripple={ripple}
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
                <CharacterIcon id={character} className="size-14 shrink-0" />
                <span>{level.hint}</span>
              </motion.button>
            )}
          </AnimatePresence>

        </section>

        <aside className="flex flex-col gap-3 rounded-3xl bg-white/70 p-3 shadow-chunky backdrop-blur landscape:w-[min(380px,40%)] landscape:shrink-0 landscape:overflow-y-auto">
          <ProgramStrip program={program} slots={level.slots} activeIndex={activeIndex} disabled={!editing} onRemove={removeCard} />
          <div className={`grid gap-3 ${cardCols}`}>
            {level.cards.map((kind) => (
              <CommandCard key={kind} kind={kind} disabled={!editing} onClick={() => addCard(kind)} />
            ))}
          </div>
          <AnimatePresence>
            {phase === 'failed' && failText && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                className="mt-auto flex items-center gap-3 rounded-2xl border-4 border-[#ffb35c] bg-white px-4 py-3 shadow-md"
              >
                <CharacterIcon id={character} mood={sunk ? 'wet' : 'ouch'} className="size-12 shrink-0" />
                <span className="text-lg leading-snug">{failText}</span>
              </motion.div>
            )}
          </AnimatePresence>
          <div className={`flex items-center gap-3 pt-1 ${phase === 'failed' ? '' : 'mt-auto'}`}>
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
              うごけ！
            </BigButton>
          </div>
        </aside>
      </main>

      <AnimatePresence>
        {phase === 'won' && (
          <>
            <Confetti />
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="w-full max-w-md rounded-[2rem] bg-cream p-6 text-center shadow-chunky"
                initial={{ scale: 0.6, y: 60 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 280, damping: 20 }}
              >
                <div className="anim-float">
                  <CharacterIcon id={character} mood="yay" className="mx-auto size-32" />
                </div>
                <h2 className="text-4xl">できた！</h2>
                <div className="mt-2">
                  <StarRating stars={earned} size={60} animate />
                </div>
                <p className="mt-2 text-base text-ink/70">
                  カード {program.length}まいで クリア！{earned < 3 && ` ${level.par}まいで できると ほし3つ`}
                </p>
                <div className="mt-5 flex flex-col gap-3">
                  {nextLevel ? (
                    <BigButton
                      className="text-2xl"
                      onClick={() => {
                        sfx.select();
                        onNext(nextLevel.id);
                      }}
                    >
                      つぎの ステージへ
                      <ChevronRight className="size-7" />
                    </BigButton>
                  ) : (
                    <p className="rounded-2xl bg-sun/40 px-4 py-3 text-xl">ぜんぶ クリア！ すごい！</p>
                  )}
                  <div className="flex gap-3">
                    <BigButton
                      tone="white"
                      className="flex-1 text-lg"
                      onClick={() => {
                        resetBoard();
                        sfx.tap();
                      }}
                    >
                      もういっかい
                    </BigButton>
                    <BigButton
                      tone="yellow"
                      className="flex-1 text-lg"
                      onClick={() => {
                        sfx.tap();
                        onExit();
                      }}
                    >
                      マップ
                    </BigButton>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
