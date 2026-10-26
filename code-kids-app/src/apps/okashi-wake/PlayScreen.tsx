import { Home, Lightbulb, Play } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { sfx } from '../../audio/sfx';
import { BigButton, IconButton } from '../../components/ui/BigButton';
import { AccountBadge } from '../../components/ui/AccountBadge';
import { SoundToggle } from '../../components/ui/SoundToggle';
import { WinDialog } from '../../components/WinDialog';
import { newCoins } from '../../store/coins';
import type { UserId } from '../../store/session';
import { useCoinBalance } from '../wallet';
import { RobotIcon, TREAT_NAMES } from './art';
import {
  ANSWER_MAX,
  asksRemainder,
  divisionText,
  isCorrect,
  isReady,
  MAX_PLATES,
  multiplicationText,
  multiplicationWords,
  rateTries,
  REMAINDER_MAX,
  runMachine,
} from './engine';
import { getOkashiLevel } from './levels';
import { Machine } from './Machine';
import { useOkashiProgress } from './progress';
import type { MachineResult, OkashiLevel, Prediction } from './types';

type Phase = 'edit' | 'running' | 'won' | 'failed';

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const EMPTY: Prediction = { answer: null, remainder: null };
const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

/** Small piles are dealt slowly enough to count along; big piles speed up so a run stays around 4 seconds. */
const stepMsFor = (steps: number) => Math.max(230, Math.min(560, 4200 / Math.max(1, steps)));

const QUESTION: Record<OkashiLevel['kind'], { text: string; unit: string }> = {
  share: { text: '1さらに なんこ？', unit: 'こ' },
  group: { text: 'なんにんに くばれる？', unit: 'にん' },
  choose: { text: 'おさらは なんまい？', unit: 'まい' },
};

function problemText(level: OkashiLevel): string {
  const what = `${level.candies}この ${TREAT_NAMES[level.treat]}を`;
  if (level.kind === 'share') return `${what} ${level.plates}まいの おさらに おなじ かずずつ わけるよ`;
  if (level.kind === 'group') return `${what} 1にん ${level.size}こずつ くばるよ`;
  return `${what} あまりが でないように わけよう`;
}

function signText(level: OkashiLevel): string {
  if (level.kind === 'share') return 'おなじ かずずつ';
  if (level.kind === 'group') return `1にん ${level.size}こずつ`;
  return 'ぴったり わけよう';
}

/** Tells the real answer kindly; the board already shows it, so this only puts it into words. */
function failMessage(level: OkashiLevel, r: MachineResult): string {
  if (level.kind === 'choose') return `${r.divisor}まい だと ${r.remainder}こ あまっちゃった。ほかの かずで ためして みよう`;
  const truth =
    level.kind === 'share'
      ? `1さらに ${r.quotient}こ${asksRemainder(level) ? `、あまりは ${r.remainder}こ` : ''}`
      : `${r.quotient}にんに くばれて${asksRemainder(level) ? `、あまりは ${r.remainder}こ` : ''}`;
  return `ほんとうは ${truth} だったね。もういちど よそうして みよう！`;
}

interface Props {
  user: UserId;
  level: OkashiLevel;
  onExit: () => void;
  onNext: (levelId: number) => void;
}

export function OkashiPlayScreen({ user, level, onExit, onNext }: Props) {
  const recordResult = useOkashiProgress((s) => s.recordResult);
  const firstVisit = useOkashiProgress((s) => !s.users[user]?.[level.id]);
  const coinTotal = useCoinBalance(user);

  const [prediction, setPrediction] = useState<Prediction>(EMPTY);
  const [phase, setPhase] = useState<Phase>('edit');
  const [result, setResult] = useState<MachineResult | null>(null);
  const [dealt, setDealt] = useState(0);
  const [flying, setFlying] = useState<number | null>(null);
  const [stepMs, setStepMs] = useState(400);
  const [tries, setTries] = useState(0);
  const [failText, setFailText] = useState<string | null>(null);
  const [earned, setEarned] = useState<1 | 2 | 3>(1);
  const [coinsGained, setCoinsGained] = useState(0);
  /** Set when this clear was the first clear of the last stage, i.e. the whole game is done. */
  const [finale, setFinale] = useState(false);
  const [showHint, setShowHint] = useState(firstVisit);
  const runId = useRef(0);

  const nextLevel = getOkashiLevel(level.id + 1);
  const editing = phase === 'edit' || phase === 'failed';
  const ready = isReady(level, prediction);
  const question = QUESTION[level.kind];

  useEffect(() => () => void (runId.current += 1), []);

  /** Puts every candy back in the jar. */
  const clearRun = () => {
    runId.current += 1;
    setResult(null);
    setDealt(0);
    setFlying(null);
  };

  const resetBoard = useCallback(() => {
    runId.current += 1;
    setPrediction(EMPTY);
    setPhase('edit');
    setResult(null);
    setDealt(0);
    setFlying(null);
    setTries(0);
    setFailText(null);
  }, []);

  const pick = (field: keyof Prediction, n: number) => {
    if (!editing) return;
    // Changing the plates on a choose level changes the board, so the old run is put away.
    if (level.kind === 'choose' && field === 'answer' && result) clearRun();
    setPrediction((p) => ({ ...p, [field]: n }));
    sfx.select();
  };

  const run = async () => {
    if (!editing || !ready) return;
    const id = ++runId.current;
    const alive = () => runId.current === id;
    const attempt = tries + 1;
    setTries(attempt);
    setShowHint(false);
    setFailText(null);

    const r = runMachine(level, level.kind === 'choose' ? prediction.answer : null);
    const ms = stepMsFor(r.steps.length);
    setResult(r);
    setDealt(0);
    setFlying(null);
    setStepMs(ms);
    setPhase('running');
    sfx.power();
    await wait(450);

    for (let i = 0; i < r.steps.length; i++) {
      if (!alive()) return;
      setFlying(i);
      await wait(ms);
      if (!alive()) return;
      setDealt(i + 1);
      const step = r.steps[i];
      if (step.plate === null) sfx.tap();
      else sfx.chime(level.kind === 'group' ? step.slot : step.plate);
    }
    setFlying(null);
    await wait(650);
    if (!alive()) return;

    if (isCorrect(level, prediction, r)) {
      const stars = rateTries(attempt);
      const prevStars = useOkashiProgress.getState().users[user]?.[level.id]?.stars ?? 0;
      setEarned(stars);
      setCoinsGained(newCoins(prevStars, stars));
      setFinale(!nextLevel && prevStars === 0);
      recordResult(user, level.id, stars, attempt);
      sfx.win();
      setPhase('won');
    } else {
      setFailText(failMessage(level, r));
      setPrediction(EMPTY);
      sfx.nope();
      setPhase('failed');
    }
  };

  // What the board shows. A group level lines up six friends, and a tray appears for each friend the machine reaches.
  const chosen = level.kind === 'choose' ? (result?.divisor ?? prediction.answer ?? 0) : 0;
  const lineUp = level.kind === 'share' ? level.plates : level.kind === 'choose' ? chosen : MAX_PLATES;
  const reached = result ? result.steps.slice(0, dealt + (flying === null ? 0 : 1)).reduce((m, s) => (s.plate === null ? m : Math.max(m, s.plate + 1)), 0) : 0;
  const trays = level.kind === 'group' ? reached : lineUp;
  const finished = !!result && phase !== 'running';

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

      <main className="flex min-h-0 flex-1 flex-col gap-3 landscape:flex-row">
        <section className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="relative flex min-h-0 flex-1 items-center justify-center">
            <Machine
              treat={level.treat}
              candies={level.candies}
              slots={lineUp}
              friends={lineUp}
              trays={trays}
              steps={result?.steps ?? []}
              dealt={dealt}
              flying={flying}
              stepMs={stepMs}
              showBasket={level.kind === 'choose' || asksRemainder(level)}
              showCounts={finished}
              mood={phase === 'won' ? 'yay' : 'happy'}
              emptyText={lineUp === 0 ? 'おさらの かずを えらんでね' : undefined}
              sign={signText(level)}
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
                  <RobotIcon className="size-14 shrink-0" />
                  <span>{level.hint}</span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <div className="flex min-h-16 items-center justify-center rounded-2xl bg-white/80 px-4 py-2 text-center shadow-md">
            {finished && result ? <Equation result={result} /> : <span className="text-lg leading-snug">{problemText(level)}</span>}
          </div>
        </section>

        <aside className="flex flex-col gap-3 rounded-3xl bg-white/70 p-3 shadow-chunky backdrop-blur landscape:w-[min(400px,42%)] landscape:shrink-0 landscape:overflow-y-auto">
          <NumberPad
            question={question.text}
            unit={question.unit}
            values={level.kind === 'choose' ? level.choices : range(1, ANSWER_MAX)}
            selected={prediction.answer}
            disabled={!editing}
            onPick={(n) => pick('answer', n)}
            cols={level.kind === 'choose' ? 'grid-cols-4' : 'grid-cols-5 min-[560px]:portrait:grid-cols-10'}
          />
          {asksRemainder(level) && (
            <NumberPad
              question="あまりは なんこ？"
              unit="こ"
              values={range(0, REMAINDER_MAX)}
              selected={prediction.remainder}
              disabled={!editing}
              onPick={(n) => pick('remainder', n)}
              cols="grid-cols-6"
            />
          )}

          <AnimatePresence>
            {phase === 'failed' && failText && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                className="mt-auto flex items-center gap-3 rounded-2xl border-4 border-[#ffb35c] bg-white px-4 py-3 shadow-md"
              >
                <RobotIcon mood="oops" className="size-12 shrink-0" />
                <span className="text-lg leading-snug">{failText}</span>
              </motion.div>
            )}
          </AnimatePresence>
          <div className={`flex flex-col gap-1 pt-1 ${phase === 'failed' ? '' : 'mt-auto'}`}>
            {editing && !ready && <p className="text-center text-sm text-ink/60">かずを えらんでから「くばる！」を おそう</p>}
            <BigButton className="w-full text-2xl" onClick={run} disabled={!editing || !ready}>
              <Play className="size-8 fill-current" />
              くばる！
            </BigButton>
          </div>
        </aside>
      </main>

      <AnimatePresence>
        {phase === 'won' && result && (
          <WinDialog
            key="win"
            hero={<RobotIcon mood="yay" className="mx-auto size-32" />}
            earned={earned}
            used={tries}
            par={1}
            note={earned === 3 ? '1かいめの よそうで ぴったり！ よく かんがえたね' : `${tries}かいめで せいかい！ 1かいめで あたると ほし3つ`}
            coins={{ gained: coinsGained, total: coinTotal }}
            finale={finale}
            hasNext={!!nextLevel}
            onNext={() => nextLevel && onNext(nextLevel.id)}
            onRetry={resetBoard}
            onMap={onExit}
          >
            <div className="mt-3 rounded-2xl bg-white/80 px-4 py-2">
              <Equation result={result} />
            </div>
          </WinDialog>
        )}
      </AnimatePresence>
    </div>
  );
}

/** "13 ÷ 3 = 4 あまり 1" with the multiplication behind it underneath. */
function Equation({ result }: { result: MachineResult }) {
  return (
    <motion.div className="flex flex-col items-center" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
      <div className="text-3xl font-black tracking-wide">{divisionText(result)}</div>
      <div className="text-lg text-ink/70">
        {multiplicationText(result)}
        <span className="ml-2 text-sm">（{multiplicationWords(result)}）</span>
      </div>
    </motion.div>
  );
}

interface PadProps {
  question: string;
  unit: string;
  values: number[];
  selected: number | null;
  disabled: boolean;
  onPick: (n: number) => void;
  cols: string;
}

function NumberPad({ question, unit, values, selected, disabled, onPick, cols }: PadProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-xl">
        <span className="flex-1">{question}</span>
        <span
          className={`inline-flex h-12 min-w-12 items-center justify-center rounded-xl border-[3px] px-2 text-2xl font-black ${
            selected === null ? 'border-dashed border-[#d8cbb4] bg-white text-ink/40' : 'border-sun-dark bg-sun text-ink'
          }`}
        >
          {selected ?? '?'}
        </span>
        <span>{unit}</span>
      </div>
      <div className={`grid gap-2 ${cols}`}>
        {values.map((n) => {
          const on = selected === n;
          return (
            <button
              key={n}
              type="button"
              disabled={disabled}
              onClick={() => onPick(n)}
              aria-label={`${n}${unit}`}
              aria-pressed={on}
              className={`flex h-14 items-center justify-center rounded-2xl border-b-[5px] text-2xl font-black shadow-chunky transition-transform duration-100 active:translate-y-1 disabled:opacity-40 roomy:h-16 ${
                on ? 'border-sun-dark bg-sun ring-4 ring-[#ffb35c]' : 'border-[#d8cbb4] bg-white'
              }`}
            >
              {n}
              {unit === 'まい' && <span className="ml-0.5 text-base">まい</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
