import { Home, Lightbulb, RotateCw, Sprout, Trash2 } from 'lucide-react';
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
import { bedColor, JoroIcon, StampMini } from './art';
import { area, bedAt, bedsLeft, cardStamp, countAnswer, fitBed, plant, productText, rateTries, soilCells, sumText, usedCards } from './engine';
import { getGardenLevel } from './levels';
import { Plot } from './Plot';
import { useShikitsumeProgress } from './progress';
import type { Bed, Card, GardenLevel, PlantRun, Point, Stamp } from './types';

type Phase = 'edit' | 'running' | 'won' | 'failed';

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** A short bed is planted slowly enough to count along; a big garden speeds up so a run stays around 5 seconds. */
const stepMsFor = (steps: number) => Math.max(170, Math.min(450, 5000 / Math.max(1, steps)));

const only = (values: number[]) => (values.length === 1 ? values[0] : null);

/** Kind words for what went wrong; the board already marks where. */
function failMessage(level: GardenLevel, run: PlantRun): string {
  if (level.kind === 'count') return `ほんとうは ${countAnswer(level)}こ だったね。もういちど よそうして みよう！`;
  if (run.outcome === 'stone') return 'いしの ところには うえられないよ。はなだんを タップで けして、おきなおそう';
  if (run.outcome === 'overlap') return 'はなだんが かさなっちゃった！ ずらして みよう';
  return `まだ つちが ${run.gaps.length}こ のこってるよ。ぴったりに しよう`;
}

interface Props {
  user: UserId;
  level: GardenLevel;
  onExit: () => void;
  onNext: (levelId: number) => void;
}

export function ShikitsumePlayScreen({ user, level, onExit, onNext }: Props) {
  const recordResult = useShikitsumeProgress((s) => s.recordResult);
  const firstVisit = useShikitsumeProgress((s) => !s.users[user]?.[level.id]);
  const coinTotal = useCoinBalance(user);
  const pick = level.kind === 'fill' && level.offer.mode === 'pick' ? level.offer : null;
  const cards = level.kind === 'fill' && level.offer.mode === 'set' ? level.offer.cards : null;

  const [placed, setPlaced] = useState<Bed[]>([]);
  const [rows, setRows] = useState<number | null>(pick ? only(pick.rows) : null);
  const [cols, setCols] = useState<number | null>(pick ? only(pick.cols) : null);
  const [card, setCard] = useState<number | null>(cards ? 0 : null);
  const [turnedCards, setTurnedCards] = useState<Set<number>>(() => new Set());
  const [prediction, setPrediction] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>('edit');
  const [run, setRun] = useState<PlantRun | null>(null);
  const [done, setDone] = useState(0);
  const [stepMs, setStepMs] = useState(400);
  const [finished, setFinished] = useState(false);
  const [tries, setTries] = useState(0);
  const [failText, setFailText] = useState<string | null>(null);
  const [nudge, setNudge] = useState<string | null>(null);
  const [wiggle, setWiggle] = useState<{ bed: number; n: number } | null>(null);
  const [earned, setEarned] = useState<1 | 2 | 3>(1);
  const [coinsGained, setCoinsGained] = useState(0);
  /** Set when this clear was the first clear of the last stage, i.e. the whole game is done. */
  const [finale, setFinale] = useState(false);
  const [showHint, setShowHint] = useState(firstVisit);
  const runId = useRef(0);

  const nextLevel = getGardenLevel(level.id + 1);
  const beds = level.kind === 'count' ? level.beds : placed;
  const editing = phase === 'edit' || phase === 'failed';
  const ready = level.kind === 'count' ? prediction !== null : placed.length > 0;
  const used = usedCards(placed);

  useEffect(() => () => void (runId.current += 1), []);

  /** Pulls the flowers up so the child can keep editing; the beds stay where they were put. */
  const clearRun = () => {
    runId.current += 1;
    setPhase('edit');
    setRun(null);
    setDone(0);
    setFinished(false);
    setFailText(null);
  };

  const resetBoard = useCallback(() => {
    runId.current += 1;
    const p = level.kind === 'fill' && level.offer.mode === 'pick' ? level.offer : null;
    setPlaced([]);
    setRows(p ? only(p.rows) : null);
    setCols(p ? only(p.cols) : null);
    setCard(level.kind === 'fill' && level.offer.mode === 'set' ? 0 : null);
    setTurnedCards(new Set());
    setPrediction(null);
    setPhase('edit');
    setRun(null);
    setDone(0);
    setFinished(false);
    setTries(0);
    setFailText(null);
    setNudge(null);
  }, [level]);

  /** The stamp the next tap puts down, or null with the reason. */
  const currentStamp = (): Stamp | string => {
    if (pick) return rows !== null && cols !== null ? { rows, cols } : 'たてと よこの かずを えらんでね';
    if (cards) return card !== null && !used.has(card) ? cardStamp(cards[card], turnedCards.has(card)) : 'はなだんの カードを えらんでね';
    return '';
  };

  const tapCell = (p: Point) => {
    if (level.kind !== 'fill' || phase === 'running' || phase === 'won') return;
    if (phase === 'failed') clearRun();
    setShowHint(false);

    const hit = bedAt(placed, p);
    if (hit >= 0) {
      const removed = placed[hit];
      setPlaced((b) => b.filter((_, i) => i !== hit));
      if (removed.card !== undefined) setCard(removed.card);
      setNudge(null);
      sfx.tap();
      return;
    }
    const stamp = currentStamp();
    if (typeof stamp === 'string') {
      setNudge(stamp);
      sfx.nope();
      return;
    }
    if (bedsLeft(level, placed) <= 0) {
      setNudge('はなだんは もう つくれないよ。おいた はなだんを タップすると けせるよ');
      setWiggle((w) => ({ bed: placed.length - 1, n: (w?.n ?? 0) + 1 }));
      sfx.nope();
      return;
    }
    const bed: Bed = {
      ...fitBed(level, p, stamp),
      ...(card !== null && cards ? { card } : {}),
    };
    const next = [...placed, bed];
    setPlaced(next);
    setNudge(null);
    if (cards) {
      const nowUsed = usedCards(next);
      const free = cards.findIndex((_, i) => !nowUsed.has(i));
      setCard(free >= 0 ? free : null);
    }
    sfx.select();
  };

  const choose = (set: (n: number) => void, n: number) => {
    set(n);
    setNudge(null);
    sfx.select();
  };

  const clearAll = () => {
    if (phase === 'failed') clearRun();
    setPlaced([]);
    if (cards) setCard(0);
    setNudge(null);
    sfx.tap();
  };

  const go = async () => {
    if (!editing || !ready) return;
    const id = ++runId.current;
    const alive = () => runId.current === id;
    const attempt = tries + 1;
    setTries(attempt);
    setShowHint(false);
    setFailText(null);
    setNudge(null);

    const r = plant(level, beds);
    const ms = stepMsFor(r.steps.length);
    setRun(r);
    setDone(0);
    setFinished(false);
    setStepMs(ms);
    setPhase('running');
    sfx.power();
    await wait(450);

    for (let i = 0; i < r.steps.length; i++) {
      if (!alive()) return;
      setDone(i + 1);
      const s = r.steps[i];
      if (s.col === beds[s.bed].cols - 1) sfx.hop(s.row);
      else sfx.chime(s.col);
      await wait(ms);
    }
    if (!alive()) return;
    setFinished(true);
    if (r.problem) sfx.bump();
    await wait(700);
    if (!alive()) return;

    const won = level.kind === 'count' ? prediction === countAnswer(level) : r.outcome === 'win';
    if (won) {
      const stars = rateTries(attempt);
      const prevStars = useShikitsumeProgress.getState().users[user]?.[level.id]?.stars ?? 0;
      setEarned(stars);
      setCoinsGained(newCoins(prevStars, stars));
      setFinale(!nextLevel && prevStars === 0);
      recordResult(user, level.id, stars, attempt);
      sfx.win();
      setPhase('won');
    } else {
      setFailText(failMessage(level, r));
      if (level.kind === 'count') setPrediction(null);
      sfx.nope();
      setPhase('failed');
    }
  };

  const soil = soilCells(level).length;
  const live = run && !finished ? run.steps[done - 1] : undefined;

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
            <Plot
              level={level}
              beds={beds}
              run={run}
              done={done}
              showProblem={finished && !!run?.problem}
              showGaps={finished && run?.outcome === 'gap'}
              stepMs={stepMs}
              mood={phase === 'won' ? 'yay' : phase === 'failed' ? 'oops' : 'happy'}
              wiggle={wiggle}
              onTap={level.kind === 'fill' ? tapCell : undefined}
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
                  <JoroIcon className="size-14 shrink-0" />
                  <span>{level.hint}</span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <div className="flex min-h-16 items-center justify-center rounded-2xl bg-white/80 px-4 py-2 text-center shadow-md">
            {live ? (
              <LiveCount stamp={beds[live.bed]} color={live.bed} n={live.n} />
            ) : finished && run && (run.outcome === 'win' || run.outcome === 'gap') ? (
              <Equation beds={beds} />
            ) : (
              <span className="text-lg leading-snug">
                {level.kind === 'count' ? 'はなは ぜんぶで なんこ さくかな？' : 'つちを ぜんぶ はなで うめよう。いしの ところは あけてね'}
              </span>
            )}
          </div>
        </section>

        <aside className="flex flex-col gap-3 rounded-3xl bg-white/70 p-3 shadow-chunky backdrop-blur landscape:w-[min(400px,42%)] landscape:shrink-0 landscape:overflow-y-auto">
          {level.kind === 'count' ? (
            <NumberRow
              label="はなは なんこ？"
              unit="こ"
              values={level.choices}
              selected={prediction}
              disabled={!editing}
              onPick={(n) => {
                setPrediction(n);
                sfx.select();
              }}
            />
          ) : pick ? (
            <>
              <NumberRow label="たて" unit="れつ" values={pick.rows} selected={rows} disabled={!editing} onPick={(n) => choose(setRows, n)} />
              <NumberRow label="よこ" unit="こ" values={pick.cols} selected={cols} disabled={!editing} onPick={(n) => choose(setCols, n)} />
              <StampPreview stamp={rows !== null && cols !== null ? { rows, cols } : null} color={placed.length} left={bedsLeft(level, placed)} />
            </>
          ) : (
            cards && (
              <CardTray
                cards={cards}
                selected={card}
                used={used}
                turned={turnedCards}
                disabled={!editing}
                onSelect={(i) => {
                  setCard(i);
                  setNudge(null);
                  sfx.tap();
                }}
                onTurn={(i) => {
                  setTurnedCards((t) => {
                    const next = new Set(t);
                    if (next.has(i)) next.delete(i);
                    else next.add(i);
                    return next;
                  });
                  setCard(i);
                  setNudge(null);
                  sfx.select();
                }}
              />
            )
          )}

          {level.kind === 'fill' && <Plan beds={placed} soil={soil} />}

          {level.kind === 'fill' && (
            <p className={`text-center text-sm ${nudge ? 'font-black text-[#c94f4f]' : 'text-ink/60'}`}>
              {nudge ?? 'つちを タップすると はなだんが おけるよ。はなだんを タップすると けせる'}
            </p>
          )}

          <AnimatePresence>
            {phase === 'failed' && failText && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                className="mt-auto flex items-center gap-3 rounded-2xl border-4 border-[#ffb35c] bg-white px-4 py-3 shadow-md"
              >
                <JoroIcon mood="oops" className="size-12 shrink-0" />
                <span className="text-lg leading-snug">{failText}</span>
              </motion.div>
            )}
          </AnimatePresence>
          <div className={`flex flex-col gap-1 pt-1 ${phase === 'failed' ? '' : 'mt-auto'}`}>
            {editing && !ready && (
              <p className="text-center text-sm text-ink/60">
                {level.kind === 'count' ? 'かずを えらんでから「うえる！」を おそう' : 'はなだんを おいてから「うえる！」を おそう'}
              </p>
            )}
            <div className="flex items-center gap-3">
              {level.kind === 'fill' && (
                <IconButton label="ぜんぶ けす" onClick={clearAll} disabled={!editing || placed.length === 0}>
                  <Trash2 className="size-6" />
                </IconButton>
              )}
              <BigButton className="flex-1 text-2xl" onClick={go} disabled={!editing || !ready}>
                <Sprout className="size-8" />
                うえる！
              </BigButton>
            </div>
          </div>
        </aside>
      </main>

      <AnimatePresence>
        {phase === 'won' && (
          <WinDialog
            key="win"
            hero={<JoroIcon mood="yay" className="mx-auto size-32" />}
            earned={earned}
            used={tries}
            par={1}
            note={earned === 3 ? '1かいめで ぴったり！ よく かんがえたね' : `${tries}かいめで できた！ 1かいめで できると ほし3つ`}
            coins={{ gained: coinsGained, total: coinTotal }}
            finale={finale}
            hasNext={!!nextLevel}
            onNext={() => nextLevel && onNext(nextLevel.id)}
            onRetry={resetBoard}
            onMap={onExit}
          >
            <div className="mt-3 rounded-2xl bg-white/80 px-4 py-2">
              <Equation beds={beds} />
              {level.lesson && <p className="mt-1 text-base leading-snug">{level.lesson}</p>}
            </div>
          </WinDialog>
        )}
      </AnimatePresence>
    </div>
  );
}

/** While planting: "2 × 3 = ?" with the flowers counted so far beside it. */
function LiveCount({ stamp, color, n }: { stamp: Stamp; color: number; n: number }) {
  return (
    <div className="flex items-center gap-3 text-3xl font-black tracking-wide">
      <span>
        {stamp.rows} × {stamp.cols} =
      </span>
      <motion.span
        key={n}
        initial={{ scale: 1.5 }}
        animate={{ scale: 1 }}
        className="inline-flex h-12 min-w-14 items-center justify-center rounded-xl border-[3px] px-2"
        style={{
          borderColor: bedColor(color).edge,
          background: bedColor(color).tint,
        }}
      >
        {n}
      </motion.span>
    </div>
  );
}

/** Every bed's multiplication, and the sum when there is more than one bed. */
function Equation({ beds }: { beds: Stamp[] }) {
  return (
    <motion.div className="flex flex-col items-center" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
      <div className="flex flex-wrap justify-center gap-x-4 text-3xl font-black tracking-wide">
        {beds.map((b, i) => (
          <span key={i} style={{ color: beds.length > 1 ? bedColor(i).edge : undefined }}>
            {productText(b)}
          </span>
        ))}
      </div>
      {beds.length > 1 && <div className="text-xl text-ink/70">ぜんぶで {sumText(beds)}</div>}
    </motion.div>
  );
}

interface RowProps {
  label: string;
  unit: string;
  values: number[];
  selected: number | null;
  disabled: boolean;
  onPick: (n: number) => void;
}

function NumberRow({ label, unit, values, selected, disabled, onPick }: RowProps) {
  const fixed = values.length === 1;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-xl">
        <span className="flex-1">{label}</span>
        <span
          className={`inline-flex h-12 min-w-12 items-center justify-center rounded-xl border-[3px] px-2 text-2xl font-black ${
            selected === null ? 'border-dashed border-[#d8cbb4] bg-white text-ink/40' : 'border-sun-dark bg-sun text-ink'
          }`}
        >
          {selected ?? '?'}
        </span>
        <span>{unit}</span>
        {fixed && <span className="text-sm text-ink/60">（きまり）</span>}
      </div>
      {!fixed && (
        <div className="grid grid-cols-6 gap-2">
          {values.map((n) => {
            const on = selected === n;
            return (
              <button
                key={n}
                type="button"
                disabled={disabled}
                onClick={() => onPick(n)}
                aria-label={`${label} ${n}`}
                aria-pressed={on}
                className={`flex h-14 items-center justify-center rounded-2xl border-b-[5px] text-2xl font-black shadow-chunky transition-transform duration-100 active:translate-y-1 disabled:opacity-40 roomy:h-16 ${
                  on ? 'border-sun-dark bg-sun ring-4 ring-[#ffb35c]' : 'border-[#d8cbb4] bg-white'
                }`}
              >
                {n}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StampPreview({ stamp, color, left }: { stamp: Stamp | null; color: number; left: number }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2 shadow-md">
      <div className="flex size-16 shrink-0 items-center justify-center">
        {stamp ? (
          <StampMini stamp={stamp} color={color} cell={Math.min(14, 60 / Math.max(stamp.rows, stamp.cols))} />
        ) : (
          <span className="text-3xl text-ink/30">?</span>
        )}
      </div>
      <div className="flex-1 text-2xl font-black">{stamp ? productText(stamp) : '? × ? = ?'}</div>
      <div className="text-center text-sm leading-tight text-ink/70">
        はなだん
        <br />
        あと <span className="text-xl font-black text-ink">{Math.max(0, left)}</span>
      </div>
    </div>
  );
}

interface TrayProps {
  cards: Card[];
  selected: number | null;
  used: Set<number>;
  turned: Set<number>;
  disabled: boolean;
  onSelect: (i: number) => void;
  onTurn: (i: number) => void;
}

function CardTray({ cards, selected, used, turned, disabled, onSelect, onTurn }: TrayProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((c, i) => {
        const stamp = cardStamp(c, turned.has(i));
        const isUsed = used.has(i);
        const on = selected === i && !isUsed;
        return (
          <div key={i} className="flex flex-col gap-1.5">
            <button
              type="button"
              disabled={disabled || isUsed}
              onClick={() => onSelect(i)}
              aria-label={`${stamp.rows} かける ${stamp.cols} の はなだん${isUsed ? '（つかった）' : ''}`}
              aria-pressed={on}
              className={`flex flex-col items-center gap-1 rounded-2xl border-b-[5px] px-2 pb-1.5 pt-2 shadow-chunky transition-transform duration-100 active:translate-y-1 disabled:opacity-40 ${
                on ? 'border-sun-dark bg-[#fff6d0] ring-4 ring-[#ffb35c]' : 'border-[#d8cbb4] bg-white'
              }`}
            >
              <motion.div className="flex h-20 items-center justify-center" animate={{ rotate: 0 }} key={`${i}-${turned.has(i)}`} initial={{ rotate: -90 }}>
                <StampMini stamp={stamp} color={i} cell={Math.min(16, 76 / Math.max(stamp.rows, stamp.cols))} />
              </motion.div>
              <span className="text-xl font-black">{productText(stamp)}</span>
              {isUsed && <span className="text-xs text-ink/60">つかった</span>}
            </button>
            {c.turnable && !isUsed && (
              <button
                type="button"
                disabled={disabled}
                onClick={() => onTurn(i)}
                className="flex h-12 items-center justify-center gap-1 rounded-xl border-b-4 border-[#3b6ea8] bg-[#6cb8ea] text-lg font-black text-white shadow-chunky transition-transform duration-100 active:translate-y-1 disabled:opacity-40"
              >
                <RotateCw className="size-6" />
                くるっ
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** The plan before running: each bed's multiplication, added up, next to how much soil there is. */
function Plan({ beds, soil }: { beds: Bed[]; soil: number }) {
  const total = beds.reduce((s, b) => s + area(b), 0);
  const match = total === soil;
  return (
    <div className="rounded-2xl bg-white px-3 py-2 shadow-md">
      <div className="text-sm text-ink/60">よそう</div>
      {beds.length === 0 ? (
        <div className="text-lg text-ink/50">まだ はなだんが ないよ</div>
      ) : (
        <div className="flex flex-wrap gap-x-3 text-xl font-black">
          {beds.map((b, i) => (
            <span key={i} style={{ color: bedColor(i).edge }}>
              {productText(b)}
            </span>
          ))}
        </div>
      )}
      <div className="mt-1 flex items-center gap-2">
        <div className="flex-1 text-lg leading-snug">
          <div>
            はな <b className="text-2xl">{beds.length > 1 ? sumText(beds) : total}</b>こ
          </div>
          <div>
            つち <b className="text-2xl">{soil}</b>こ
          </div>
        </div>
        {beds.length > 0 && (
          <span className={`shrink-0 rounded-full px-3 py-1 text-base font-black ${match ? 'bg-play text-white' : 'bg-[#ffe3e3] text-[#c94f4f]'}`}>
            {match ? 'おなじ' : 'ちがう'}
          </span>
        )}
      </div>
    </div>
  );
}
