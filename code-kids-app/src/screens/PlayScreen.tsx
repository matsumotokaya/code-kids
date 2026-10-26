import { Bug, Home, Lightbulb, Play, RotateCcw, Trash2, Undo2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { sfx } from '../audio/sfx';
import { Board } from '../components/Board';
import { CharacterIcon, type Mood } from '../components/Character';
import { arrowLook, CommandCard } from '../components/CommandCard';
import { LoopProgramStrip, type LoopRun } from '../components/LoopProgramStrip';
import { ProgramStrip } from '../components/ProgramStrip';
import { BigButton, IconButton } from '../components/ui/BigButton';
import { AccountBadge } from '../components/ui/AccountBadge';
import { SoundToggle } from '../components/ui/SoundToggle';
import { WinDialog } from '../components/WinDialog';
import { isLoop, isMove, keyOf, makeCard, parseProgram, programIssue, rateStars, simulate, strayEnds, type ProgramIssue } from '../game/engine';
import { getLevel, LEVELS, stageNumber, WORLD2_FIRST_ID, WORLD2_VISIBLE } from '../game/levels';
import type { Card, CardKind, Command, Dir, Level, Point, Times } from '../game/types';
import { useCoinBalance } from '../apps/wallet';
import { newCoins } from '../store/coins';
import { useProgress, type CharacterId } from '../store/progress';
import type { UserId } from '../store/session';

type Phase = 'edit' | 'running' | 'won' | 'failed';

const HOP_MS = 380;
/** Pause on the くりかえし card at the start of each pass, so the child sees the loop go round. */
const LOOP_MS = 420;

const ISSUE_TEXT: Record<ProgramIssue, string> = {
  open: '「おわり」が たりないよ。どこまで くりかえす？',
  stray: '「おわり」の まえに「くりかえし」が ないよ',
  nested: 'くりかえしの なかに くりかえしは いれられないよ',
};

/** The program a stage starts with: empty, or the buggy one on なおして stages. */
const startProgram = (level: Level): Card[] => (level.buggy ? parseProgram(level.buggy, `b${level.id}-`) : []);
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

let idCounter = 0;
const nextId = () => `c${++idCounter}`;

interface Props {
  user: UserId;
  level: Level;
  character: CharacterId;
  onExit: () => void;
  onNext: (levelId: number) => void;
}

export function PlayScreen({ user, level, character, onExit, onNext }: Props) {
  const recordResult = useProgress((s) => s.recordResult);
  const coinTotal = useCoinBalance(user);
  /** World 2 edits in place (tap a card to open a gap there) and knows くりかえし; World 1 is unchanged. */
  const w2 = level.world === 2;

  const [program, setProgram] = useState<Card[]>(() => startProgram(level));
  /** World 2: the gap left by a removed card, filled by the next tray card. null = add at the end. */
  const [cursor, setCursor] = useState<number | null>(null);
  /** World 2: the card 2かい / 3かい attaches to (the one just placed), as "the last card" does in World 1. */
  const [lastPlaced, setLastPlaced] = useState<string | null>(null);
  const [loopRun, setLoopRun] = useState<LoopRun | null>(null);
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
  const [coinsGained, setCoinsGained] = useState(0);
  /** Set when this clear was the first clear of the last stage, i.e. the whole game is done. */
  const [finale, setFinale] = useState(false);
  // New ideas need words: World 2 opens the hint until the stage is cleared once.
  const [showHint, setShowHint] = useState<boolean>(
    () => w2 && !useProgress.getState().users[user]?.profiles[character]?.[level.id],
  );
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
    setLoopRun(null);
    setSunk(false);
    setRipple(null);
    setFailText(null);
  }, [level]);

  useEffect(() => {
    setProgram(startProgram(level));
    setCursor(null);
    setLastPlaced(null);
    resetBoard();
  }, [level, resetBoard]);

  useEffect(
    () => () => {
      runId.current += 1;
    },
    [],
  );

  const editing = phase === 'edit' || phase === 'failed';
  // In dev the last World 1 stage leads on to World 2; in production World 1 ends there as before.
  const nextLevel = getLevel(WORLD2_VISIBLE && level.id === LEVELS[LEVELS.length - 1].id ? WORLD2_FIRST_ID : level.id + 1);

  /**
   * World 2 placement: a card fills the gap if there is one (then the gap closes), otherwise goes at the end.
   * 2かい / 3かい attach to the card just placed. Returns the new program, or null when the card cannot go:
   * the strip is full, 2かい / 3かい has no arrow to attach to, a くりかえし would end up inside another one,
   * an おわり would close an empty loop, or an おわり would be left with no くりかえし.
   */
  const placeW2 = (kind: CardKind, newId = 'probe'): Card[] | null => {
    const at = cursor ?? program.length;
    if (kind === 'x2' || kind === 'x3') {
      const times: Times = kind === 'x2' ? 2 : 3;
      const ti = lastPlaced ? program.findIndex((c) => c.id === lastPlaced) : at - 1;
      const target = program[ti];
      if (!target || !isMove(target) || target.times === times) return null;
      return program.map((c, i) => (i === ti ? { ...target, times } : c));
    }
    if (program.length >= level.slots) return null;
    const next = [...program.slice(0, at), makeCard(kind, newId), ...program.slice(at)];
    if (programIssue(next) === 'nested' || strayEnds(next) > strayEnds(program)) return null;
    if (kind === 'end' && at > 0 && isLoop(program[at - 1])) return null;
    return next;
  };

  const addCard = (kind: CardKind) => {
    if (!editing) return;
    if (phase === 'failed') resetBoard();
    if (w2) {
      const placed = placeW2(kind, nextId());
      if (!placed) {
        sfx.nope();
        return;
      }
      setProgram(placed);
      if (kind === 'x2' || kind === 'x3') {
        sfx.power();
      } else {
        setCursor(null);
        setLastPlaced(placed.find((c) => !program.includes(c))?.id ?? null);
        sfx.tap();
      }
      return;
    }
    if (kind === 'x2' || kind === 'x3') {
      const times: Times = kind === 'x2' ? 2 : 3;
      const last = program.at(-1) as Command | undefined;
      if (!last || last.times === times) {
        sfx.nope();
        return;
      }
      setProgram((p) => p.map((c, i) => (i === p.length - 1 ? { ...(c as Command), times } : c)));
      sfx.power();
      return;
    }
    if (program.length >= level.slots) {
      sfx.nope();
      return;
    }
    setProgram((p) => [...p, makeCard(kind, nextId())]);
    sfx.tap();
  };

  const removeCard = (id: string) => {
    if (!editing) return;
    if (phase === 'failed') resetBoard();
    if (w2) {
      // The gap stays where the card was, so the next tray card replaces it.
      const index = program.findIndex((c) => c.id === id);
      const next = program.filter((c) => c.id !== id);
      setProgram(next);
      setCursor(index >= 0 && index < next.length ? index : null);
      setLastPlaced(null);
      sfx.tap();
      return;
    }
    setProgram((p) => p.filter((c) => c.id !== id));
    sfx.tap();
  };

  /** Empties the strip; on なおして stages it brings back the original buggy program instead. */
  const clearAll = () => {
    if (!editing || (program.length === 0 && !level.buggy)) return;
    resetBoard();
    setProgram(startProgram(level));
    setCursor(null);
    setLastPlaced(null);
    sfx.tap();
  };

  const run = async () => {
    if (!editing || program.length === 0) return;
    resetBoard();
    const issue = w2 ? programIssue(program) : null;
    if (issue) {
      setMood('hmm');
      setFailText(ISSUE_TEXT[issue]);
      setPhase('failed');
      sfx.nope();
      return;
    }
    setCursor(null);
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
        case 'loop':
          setActiveIndex(ev.cmdIndex);
          setLoopRun({ index: ev.cmdIndex, pass: ev.pass, count: ev.count });
          sfx.chime(ev.pass - 1);
          await wait(LOOP_MS);
          break;
        case 'loopEnd':
          setActiveIndex(ev.cmdIndex);
          setLoopRun(null);
          await wait(220);
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
    setLoopRun(null);
    if (trace.outcome === 'win') {
      const stars = rateStars(level.par, program.length);
      setEarned(stars);
      const prevStars = useProgress.getState().users[user]?.profiles[character]?.[level.id]?.stars ?? 0;
      setCoinsGained(newCoins(prevStars, stars));
      setFinale(!nextLevel && prevStars === 0);
      recordResult(user, character, level.id, stars, program.length);
      setPhase('won');
    } else {
      setPhase('failed');
    }
  };

  const cardCols =
    level.cards.length <= 2
      ? 'grid-cols-2'
      : level.cards.length <= 4
        ? 'grid-cols-2 min-[560px]:portrait:grid-cols-4'
        : 'grid-cols-3 min-[560px]:portrait:grid-cols-6';

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
        {w2 ? (
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl bg-white/80 px-4 py-2 shadow-md">
            <div className="min-w-0 flex-1">
              <div className="text-xs leading-none text-ink/60">ワールド2 ・ ステージ {stageNumber(level)}</div>
              <div className="truncate text-lg leading-tight">{level.title}</div>
            </div>
            {level.buggy && (
              <span className="flex shrink-0 items-center gap-1 rounded-full border-b-[3px] border-[#c94f4f] bg-[#ff7a7a] px-3 py-1 text-sm font-black text-white shadow">
                <Bug className="size-4" aria-hidden />
                なおして！
              </span>
            )}
          </div>
        ) : (
          <div className="min-w-0 flex-1 rounded-2xl bg-white/80 px-4 py-2 shadow-md">
            <div className="text-xs leading-none text-ink/60">ステージ {level.id}</div>
            <div className="truncate text-lg leading-tight">{level.title}</div>
          </div>
        )}
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
          {level.buggy && (
            <div className="flex items-center gap-2 rounded-2xl border-[3px] border-dashed border-[#ff7a7a] bg-[#fff1f1] px-3 py-2 text-sm leading-snug">
              <Bug className="size-6 shrink-0 text-[#e05555]" aria-hidden />
              <span>
                まちがいが {level.bugs ?? 1}こ あるよ。うごかして みて、なおそう！
              </span>
            </div>
          )}
          {w2 ? (
            <LoopProgramStrip
              program={program}
              slots={level.slots}
              activeIndex={activeIndex}
              loopRun={loopRun}
              cursor={cursor}
              disabled={!editing}
              onRemove={removeCard}
              onCursorEnd={() => {
                if (!editing) return;
                setCursor(null);
                setLastPlaced(null);
                sfx.tap();
              }}
            />
          ) : (
            <ProgramStrip program={program as Command[]} slots={level.slots} activeIndex={activeIndex} disabled={!editing} onRemove={removeCard} look={arrowLook} />
          )}
          <div className={`grid gap-3 ${cardCols}`}>
            {level.cards.map((kind) => (
              // World 2 greys out cards that cannot go into the gap right now (e.g. おわり with no open loop).
              <CommandCard key={kind} kind={kind} disabled={!editing || (w2 && phase === 'edit' && !placeW2(kind))} onClick={() => addCard(kind)} />
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
            {level.buggy ? (
              <IconButton label="さいしょの プログラムに もどす" onClick={clearAll} disabled={!editing}>
                <Undo2 className="size-6" />
              </IconButton>
            ) : (
              <IconButton label="ぜんぶ けす" onClick={clearAll} disabled={!editing || program.length === 0}>
                <Trash2 className="size-6" />
              </IconButton>
            )}
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
          <WinDialog
            key="win"
            hero={<CharacterIcon id={character} mood="yay" className="mx-auto size-32" />}
            earned={earned}
            used={program.length}
            par={level.par}
            coins={{ gained: coinsGained, total: coinTotal }}
            finale={finale}
            hasNext={!!nextLevel}
            onNext={() => nextLevel && onNext(nextLevel.id)}
            onRetry={resetBoard}
            onMap={onExit}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
