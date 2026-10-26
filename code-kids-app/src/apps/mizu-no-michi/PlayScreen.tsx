import { Droplets, Eraser, Home, Lightbulb, RotateCw, Trash2 } from 'lucide-react';
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
import { DropIcon, PIECE_NAMES, PieceIcon } from './art';
import { bestRotation, buildLayout, flow, initialTurns, isOpenGround, keyOf, PIECE_KINDS, rateTries } from './engine';
import { Garden, STEP_MS } from './Garden';
import { getPipeLevel } from './levels';
import { useMizuProgress } from './progress';
import type { FlowTrace, Piece, PieceKind, PipeLevel, Point } from './types';

type Phase = 'edit' | 'running' | 'won' | 'failed';
type Tool = PieceKind | 'erase';

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

interface Props {
  user: UserId;
  level: PipeLevel;
  onExit: () => void;
  onNext: (levelId: number) => void;
}

export function MizuPlayScreen({ user, level, onExit, onNext }: Props) {
  const recordResult = useMizuProgress((s) => s.recordResult);
  const firstVisit = useMizuProgress((s) => !s.users[user]?.[level.id]);
  const coinTotal = useCoinBalance(user);
  const kinds = PIECE_KINDS.filter((k) => (level.hand[k] ?? 0) > 0);

  const [turns, setTurns] = useState(() => initialTurns(level));
  const [placed, setPlaced] = useState<Map<string, Piece>>(() => new Map());
  const [tool, setTool] = useState<Tool | null>(kinds[0] ?? null);
  const [phase, setPhase] = useState<Phase>('edit');
  const [trace, setTrace] = useState<FlowTrace | null>(null);
  const [clock, setClock] = useState(-1);
  const [tries, setTries] = useState(0);
  const [failText, setFailText] = useState<string | null>(null);
  const [earned, setEarned] = useState<1 | 2 | 3>(1);
  const [coinsGained, setCoinsGained] = useState(0);
  /** Set when this clear was the first clear of the last stage, i.e. the whole game is done. */
  const [finale, setFinale] = useState(false);
  const [showHint, setShowHint] = useState(firstVisit);
  const [wiggle, setWiggle] = useState<{ key: string; n: number } | null>(null);
  const [emptyKind, setEmptyKind] = useState<{ kind: PieceKind; n: number } | null>(null);
  const runId = useRef(0);

  const nextLevel = getPipeLevel(level.id + 1);
  const remaining = (kind: PieceKind) => (level.hand[kind] ?? 0) - [...placed.values()].filter((p) => p.kind === kind).length;

  useEffect(() => () => void (runId.current += 1), []);

  /** Clears the water so the child can keep editing; the pipes stay, just like cards stay in the other games. */
  const drain = () => {
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
    setTool(PIECE_KINDS.find((k) => (level.hand[k] ?? 0) > 0) ?? null);
    setPhase('edit');
    setTrace(null);
    setClock(-1);
    setTries(0);
    setFailText(null);
  }, [level]);

  const tapCell = (p: Point) => {
    if (phase === 'running' || phase === 'won') return;
    if (phase === 'failed') drain();
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
        sfx.tap();
      } else {
        setPlaced((m) => new Map(m).set(k, { ...mine, rot: mine.rot + 1 }));
        sfx.tap();
      }
      return;
    }
    if (!isOpenGround(level, p) || !tool || tool === 'erase') return;
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
    if (phase === 'failed') drain();
    setPlaced(new Map());
    sfx.tap();
  };

  const pour = async () => {
    if (phase === 'running' || phase === 'won') return;
    const id = ++runId.current;
    const alive = () => runId.current === id;
    const attempt = tries + 1;
    setTries(attempt);
    setFailText(null);
    setShowHint(false);
    const result = flow(level, buildLayout(level, turns, placed));
    setTrace(result);
    setPhase('running');
    sfx.power();

    for (let d = 0; d <= result.lastDepth; d++) {
      if (!alive()) return;
      setClock(d);
      if (result.goals.some((g) => g.depth === d)) sfx.star();
      else if (result.leaks.some((l) => l.depth + 1 === d)) sfx.splash();
      else if (result.fills.some((f) => f.depth === d)) sfx.hop(d);
      await wait(STEP_MS);
    }
    await wait(350);
    if (!alive()) return;

    if (result.outcome === 'win') {
      const stars = rateTries(attempt);
      const prevStars = useMizuProgress.getState().users[user]?.[level.id]?.stars ?? 0;
      setEarned(stars);
      setCoinsGained(newCoins(prevStars, stars));
      setFinale(!nextLevel && prevStars === 0);
      recordResult(user, level.id, stars, attempt);
      sfx.win();
      setPhase('won');
    } else {
      setFailText(result.outcome === 'leak' ? 'みずが もれちゃった！ くだを なおそう' : 'おはなに みずが とどいてないよ');
      setPhase('failed');
    }
  };

  const editing = phase === 'edit' || phase === 'failed';
  const canClear = editing && placed.size > 0;

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
          <Garden
            level={level}
            turns={turns}
            placed={placed}
            trace={trace}
            clock={clock}
            showSpots={editing && !!tool && tool !== 'erase' && remaining(tool) > 0}
            wiggle={wiggle}
            onTap={tapCell}
          />
        </section>

        <aside className="flex flex-col gap-3 rounded-3xl bg-white/70 p-3 shadow-chunky backdrop-blur landscape:w-[min(380px,40%)] landscape:shrink-0 landscape:overflow-y-auto">
          {/* The hint lives in the panel, not over the garden, so it never hides the pipes it talks about. */}
          <AnimatePresence initial={false}>
            {showHint && (
              <motion.button
                type="button"
                onClick={() => setShowHint(false)}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="shrink-0 overflow-hidden rounded-2xl border-4 border-sun bg-cream text-left text-base leading-snug"
              >
                <span className="flex items-center gap-3 px-3 py-2">
                  <DropIcon className="size-12 shrink-0" />
                  <span>{level.hint}</span>
                </span>
              </motion.button>
            )}
          </AnimatePresence>

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
                    aria-label={`${PIECE_NAMES[kind]} のこり ${left}`}
                    aria-pressed={selected}
                    className={`relative flex flex-col items-center rounded-2xl border-b-[5px] px-1 pb-1.5 pt-2 shadow-chunky transition-transform duration-100 active:translate-y-1 disabled:opacity-40 ${
                      selected ? 'border-[#1f7ad6] bg-[#dff0ff] ring-4 ring-[#2f9bff]' : 'border-[#d8cbb4] bg-white'
                    }`}
                  >
                    <PieceIcon kind={kind} className={`size-14 roomy:size-16 ${left <= 0 ? 'opacity-30' : ''}`} />
                    <span className="text-sm leading-tight">{PIECE_NAMES[kind]}</span>
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
              <span className="text-lg leading-snug">くだを タップすると まわるよ</span>
            </div>
          )}

          {kinds.length > 0 && (
            <p className="text-center text-sm text-ink/60">
              {tool === 'erase' ? 'けしたい くだを タップしてね' : 'くさを タップすると おけるよ。おいた くだは タップで まわる'}
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
                <DropIcon mood="oops" className="size-12 shrink-0" />
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
            <BigButton tone="blue" className="flex-1 text-2xl" onClick={pour} disabled={phase === 'running' || phase === 'won'}>
              <Droplets className="size-8" />
              ながす！
            </BigButton>
          </div>
        </aside>
      </main>

      <AnimatePresence>
        {phase === 'won' && (
          <WinDialog
            key="win"
            hero={<DropIcon mood="yay" className="mx-auto size-32" />}
            earned={earned}
            used={tries}
            par={1}
            note={earned === 3 ? '1かいめで ながせた！ よく かんがえたね' : `${tries}かいめで せいこう！ 1かいめで できると ほし3つ`}
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
