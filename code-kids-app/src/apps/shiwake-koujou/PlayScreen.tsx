import { Eraser, Home, Lightbulb, Play, RotateCw, Trash2 } from 'lucide-react';
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
import { HakoIcon, ITEM_NAMES, ItemIcon, PART_NAMES, PartIcon } from './art';
import { bestRotation, buildLayout, initialTurns, isOpenFloor, keyOf, PART_KINDS, rateTries, run, sorterColor } from './engine';
import { Factory, STEP_MS } from './Factory';
import { getSortLevel } from './levels';
import { useShiwakeProgress } from './progress';
import type { Part, PartKind, Point, RunTrace, SortLevel } from './types';

type Phase = 'edit' | 'running' | 'won' | 'failed';
type Tool = PartKind | 'erase';

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const FAIL_TEXT: Record<Exclude<RunTrace['outcome'], 'win'>, string> = {
  fell: 'ゆかに おちちゃった！ ベルトを なおそう',
  wrong: 'ちがう はこに はいっちゃった！ わけきを みなおそう',
  bump: 'かべに ぶつかって とまっちゃった',
  loop: 'ぐるぐる まわって でられないよ',
};

interface Props {
  user: UserId;
  level: SortLevel;
  onExit: () => void;
  onNext: (levelId: number) => void;
}

export function ShiwakePlayScreen({ user, level, onExit, onNext }: Props) {
  const recordResult = useShiwakeProgress((s) => s.recordResult);
  const firstVisit = useShiwakeProgress((s) => !s.users[user]?.[level.id]);
  const coinTotal = useCoinBalance(user);
  const kinds = PART_KINDS.filter((k) => (level.hand[k] ?? 0) > 0);

  const [turns, setTurns] = useState(() => initialTurns(level));
  const [placed, setPlaced] = useState<Map<string, Part>>(() => new Map());
  const [tool, setTool] = useState<Tool | null>(kinds[0] ?? null);
  const [phase, setPhase] = useState<Phase>('edit');
  const [trace, setTrace] = useState<RunTrace | null>(null);
  const [clock, setClock] = useState(-1);
  const [tries, setTries] = useState(0);
  const [failText, setFailText] = useState<string | null>(null);
  const [earned, setEarned] = useState<1 | 2 | 3>(1);
  const [coinsGained, setCoinsGained] = useState(0);
  /** Set when this clear was the first clear of the last stage, i.e. the whole game is done. */
  const [finale, setFinale] = useState(false);
  const [showHint, setShowHint] = useState(firstVisit);
  const [wiggle, setWiggle] = useState<{ key: string; n: number } | null>(null);
  const [emptyKind, setEmptyKind] = useState<{ kind: PartKind; n: number } | null>(null);
  const runId = useRef(0);

  const nextLevel = getSortLevel(level.id + 1);
  const remaining = (kind: PartKind) => (level.hand[kind] ?? 0) - [...placed.values()].filter((p) => p.kind === kind).length;

  useEffect(() => () => void (runId.current += 1), []);

  /** Clears the items so the child can keep editing; the parts stay, just like cards stay in the other games. */
  const stop = () => {
    runId.current += 1;
    setPhase('edit');
    setTrace(null);
    setClock(-1);
    setFailText(null);
  };

  const resetBoard = useCallback(() => {
    runId.current += 1;
    setTurns(initialTurns(level));
    setPlaced(new Map());
    setTool(PART_KINDS.find((k) => (level.hand[k] ?? 0) > 0) ?? null);
    setPhase('edit');
    setTrace(null);
    setClock(-1);
    setTries(0);
    setFailText(null);
  }, [level]);

  const tapCell = (p: Point) => {
    if (phase === 'running' || phase === 'won') return;
    if (phase === 'failed') stop();
    const k = keyOf(p);

    if (turns.has(k)) {
      setTurns((t) => new Map(t).set(k, (t.get(k) ?? 0) + 1));
      sfx.tap();
      return;
    }
    if (level.fixed.some((f) => keyOf(f) === k)) {
      setWiggle((w) => ({ key: k, n: (w?.n ?? 0) + 1 }));
      sfx.nope();
      return;
    }
    const mine = placed.get(k);
    if (mine) {
      if (tool === 'erase') {
        setPlaced((m) => {
          const next = new Map(m);
          next.delete(k);
          return next;
        });
      } else {
        setPlaced((m) => new Map(m).set(k, { ...mine, rot: mine.rot + 1 }));
      }
      sfx.tap();
      return;
    }
    if (!isOpenFloor(level, p) || !tool || tool === 'erase') return;
    if (remaining(tool) <= 0) {
      setEmptyKind((e) => ({ kind: tool, n: (e?.n ?? 0) + 1 }));
      sfx.nope();
      return;
    }
    const rot = bestRotation(level, buildLayout(level, turns, placed), p, tool);
    setPlaced((m) => new Map(m).set(k, { kind: tool, rot }));
    sfx.select();
  };

  const clearAll = () => {
    if (phase === 'failed') stop();
    setPlaced(new Map());
    sfx.tap();
  };

  const start = async () => {
    if (phase === 'running' || phase === 'won') return;
    const id = ++runId.current;
    const alive = () => runId.current === id;
    const attempt = tries + 1;
    setTries(attempt);
    setFailText(null);
    setShowHint(false);
    const result = run(level, buildLayout(level, turns, placed));
    setTrace(result);
    setPhase('running');
    sfx.power();

    for (let t = 0; t <= result.lastTick; t++) {
      if (!alive()) return;
      setClock(t);
      const failing = result.failItem !== null && t === result.lastTick ? result.items[result.failItem] : null;
      if (failing) {
        if (failing.end === 'fell') sfx.splash();
        else if (failing.end === 'bump') sfx.bump();
        else sfx.nope();
      } else if (result.items.some((it) => it.endTick === t && it.end === 'boxed')) sfx.star();
      else {
        const spawned = result.items.findIndex((it) => it.start === t);
        if (spawned >= 0) sfx.hop(spawned);
      }
      await wait(STEP_MS);
    }
    await wait(450);
    if (!alive()) return;

    if (result.outcome === 'win') {
      const stars = rateTries(attempt);
      const prevStars = useShiwakeProgress.getState().users[user]?.[level.id]?.stars ?? 0;
      setEarned(stars);
      setCoinsGained(newCoins(prevStars, stars));
      setFinale(!nextLevel && prevStars === 0);
      recordResult(user, level.id, stars, attempt);
      sfx.win();
      setPhase('won');
    } else {
      setFailText(FAIL_TEXT[result.outcome]);
      setPhase('failed');
    }
  };

  const editing = phase === 'edit' || phase === 'failed';
  const canClear = editing && placed.size > 0;
  const toolColor = tool && tool !== 'erase' ? sorterColor(tool) : null;

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
        <section className="relative flex min-h-0 flex-1 items-center justify-center">
          <Factory
            level={level}
            turns={turns}
            placed={placed}
            trace={trace}
            clock={clock}
            running={phase === 'running'}
            showSpots={editing && !!tool && tool !== 'erase' && remaining(tool) > 0}
            wiggle={wiggle}
            onTap={tapCell}
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
                <HakoIcon className="size-14 shrink-0" />
                <span>{level.hint}</span>
              </motion.button>
            )}
          </AnimatePresence>
        </section>

        <aside className="flex flex-col gap-3 rounded-3xl bg-white/70 p-3 shadow-chunky backdrop-blur landscape:w-[min(380px,40%)] landscape:shrink-0 landscape:overflow-y-auto">
          <div className="rounded-2xl bg-white px-3 py-2 shadow-md">
            <div className="text-xs text-ink/60">でてくる じゅんばん</div>
            <div className="mt-1 flex flex-wrap items-center gap-1" aria-label={level.items.map((c) => ITEM_NAMES[c]).join(' ')}>
              {level.items.map((color, i) => {
                const out = trace !== null && clock >= (trace.items[i]?.start ?? 0);
                return <ItemIcon key={i} color={color} className={`size-9 transition-opacity roomy:size-11 ${out ? 'opacity-25' : ''}`} />;
              })}
            </div>
          </div>

          {kinds.length > 0 ? (
            <div className="grid grid-cols-4 gap-2 landscape:grid-cols-2">
              {kinds.map((kind) => {
                const left = remaining(kind);
                const selected = tool === kind;
                return (
                  <motion.button
                    key={emptyKind?.kind === kind ? `${kind}-${emptyKind.n}` : kind}
                    type="button"
                    disabled={!editing}
                    onClick={() => {
                      setTool(kind);
                      sfx.tap();
                    }}
                    animate={emptyKind?.kind === kind ? { x: [0, 8, -6, 4, 0] } : undefined}
                    transition={{ duration: 0.35 }}
                    aria-label={`${PART_NAMES[kind]} のこり ${left}`}
                    aria-pressed={selected}
                    className={`relative flex flex-col items-center rounded-2xl border-b-[5px] px-1 pb-1.5 pt-2 shadow-chunky transition-transform duration-100 active:translate-y-1 disabled:opacity-40 ${
                      selected ? 'border-[#1f7ad6] bg-[#dff0ff] ring-4 ring-[#2f9bff]' : 'border-[#d8cbb4] bg-white'
                    }`}
                  >
                    <PartIcon kind={kind} className={`size-14 roomy:size-16 ${left <= 0 ? 'opacity-30' : ''}`} />
                    <span className="text-sm leading-tight">{kind === 'belt' ? 'ベルト' : 'わけき'}</span>
                    <span
                      className={`absolute -right-1.5 -top-1.5 flex size-8 items-center justify-center rounded-full text-lg font-black text-white shadow ${left > 0 ? 'bg-[#ff8a3d]' : 'bg-[#b8b0a3]'}`}
                    >
                      {left}
                    </span>
                  </motion.button>
                );
              })}
              <button
                type="button"
                disabled={!editing}
                onClick={() => {
                  setTool('erase');
                  sfx.tap();
                }}
                aria-label="けしゴム"
                aria-pressed={tool === 'erase'}
                className={`flex flex-col items-center justify-center rounded-2xl border-b-[5px] px-1 pb-1.5 pt-2 shadow-chunky transition-transform duration-100 active:translate-y-1 disabled:opacity-40 ${
                  tool === 'erase' ? 'border-[#c94f4f] bg-[#ffe3e3] ring-4 ring-[#ff7a7a]' : 'border-[#d8cbb4] bg-white'
                }`}
              >
                <Eraser className="size-12 text-[#c94f4f] roomy:size-14" />
                <span className="text-sm leading-tight">けす</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-md">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full border-[3px] border-[#2f9bff] text-[#2f9bff]">
                <RotateCw className="size-7" />
              </span>
              <span className="text-lg leading-snug">ベルトを タップすると まわるよ</span>
            </div>
          )}

          {kinds.length > 0 && (
            <p className="text-center text-sm text-ink/60">
              {tool === 'erase'
                ? 'けしたい ぶひんを タップしてね'
                : toolColor
                  ? `${ITEM_NAMES[toolColor]}だけ やじるしの ほうへ。ほかは まっすぐ すすむよ`
                  : 'ゆかを タップすると おけるよ。おいた ぶひんは タップで まわる'}
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
                <HakoIcon mood="oops" className="size-12 shrink-0" />
                <span className="text-lg leading-snug">{failText}</span>
              </motion.div>
            )}
          </AnimatePresence>
          <div className={`flex items-center gap-3 pt-1 ${phase === 'failed' ? '' : 'mt-auto'}`}>
            {kinds.length > 0 && (
              <IconButton label="ぜんぶ けす" onClick={clearAll} disabled={!canClear}>
                <Trash2 className="size-6" />
              </IconButton>
            )}
            <BigButton className="flex-1 text-2xl" onClick={start} disabled={phase === 'running' || phase === 'won'}>
              <Play className="size-8 fill-current" />
              うごかす！
            </BigButton>
          </div>
        </aside>
      </main>

      <AnimatePresence>
        {phase === 'won' && (
          <WinDialog
            key="win"
            hero={<HakoIcon mood="yay" className="mx-auto size-32" />}
            earned={earned}
            used={tries}
            par={1}
            note={earned === 3 ? '1かいめで ぜんぶ わけられた！ よく かんがえたね' : `${tries}かいめで せいこう！ 1かいめで できると ほし3つ`}
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
