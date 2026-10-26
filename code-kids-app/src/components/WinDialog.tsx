import { ChevronRight } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useState, type ReactNode } from 'react';
import { sfx } from '../audio/sfx';
import { CoinIcon } from './Coin';
import { Confetti } from './Confetti';
import { GrandFinale } from './GrandFinale';
import { StarRating } from './StarRating';
import { BigButton } from './ui/BigButton';

interface Props {
  /** Large celebrating character art. */
  hero: ReactNode;
  earned: 1 | 2 | 3;
  used: number;
  par: number;
  hasNext: boolean;
  onNext: () => void;
  onRetry: () => void;
  onMap: () => void;
  /** Replaces the "used N cards" line for games that do not count cards. */
  note?: ReactNode;
  /** Coins paid out for this clear and the wallet afterwards. Nothing is shown when nothing new was earned. */
  coins?: { gained: number; total: number };
  /** Extra content between the rating and the buttons, e.g. the finished equation. */
  children?: ReactNode;
  /** True when this clear finished the whole game for the first time: the fireworks play before the dialog. */
  finale?: boolean;
}

/** The coin pops in after the last star has landed. */
const COIN_DELAY_S = 1.45;
/** A short beat between the coin popping in and the number starting to roll. */
const COUNT_LEAD_S = 0.35;
/** Tick sounds are spaced out so a fast roll still sounds like clicks, not a buzz. */
const TICK_GAP_MS = 45;
const BURST_COINS = 8;
const BURST_DISTANCE = 64;

/** Bigger payouts roll a little longer, but never so long that a child taps past it. */
function rollMs(gained: number): number {
  return Math.min(1600, Math.max(800, 600 + gained * 15));
}

/** Level-clear celebration shared by every game. Render inside AnimatePresence. */
export function WinDialog({ hero, earned, used, par, hasNext, onNext, onRetry, onMap, note, coins, children, finale = false }: Props) {
  const gained = coins?.gained ?? 0;
  const [showFinale, setShowFinale] = useState(finale);

  // The dialog mounts only after the fireworks, so its stars and coin roll are not wasted behind them.
  if (showFinale) return <GrandFinale hero={hero} onDone={() => setShowFinale(false)} />;

  return (
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
          <div className="anim-float">{hero}</div>
          <h2 className="text-4xl">できた！</h2>
          <div className="mt-2">
            <StarRating stars={earned} size={60} animate />
          </div>
          <p className="mt-2 text-base text-ink/70">
            {note ?? <>カード {used}まいで クリア！{earned < 3 && ` ${par}まいで できると ほし3つ`}</>}
          </p>
          {coins && gained > 0 && <CoinPayout gained={gained} total={coins.total} />}
          {children}
          <div className="mt-5 flex flex-col gap-3">
            {hasNext ? (
              <BigButton
                className="text-2xl"
                onClick={() => {
                  sfx.select();
                  onNext();
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
                  sfx.tap();
                  onRetry();
                }}
              >
                もういっかい
              </BigButton>
              <BigButton
                tone="yellow"
                className="flex-1 text-lg"
                onClick={() => {
                  sfx.tap();
                  onMap();
                }}
              >
                マップ
              </BigButton>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}

type PayoutPhase = 'wait' | 'roll' | 'done';

/**
 * The wallet rolls up from the old total like a slot counter, then lands with a "ching" and a burst of coins.
 * The numbers are fixed on mount so a store update while the dialog is open cannot restart the roll.
 */
function CoinPayout({ gained, total }: { gained: number; total: number }) {
  const reduceMotion = useReducedMotion();
  const [{ from, to }] = useState(() => ({ from: Math.max(0, total - gained), to: total }));
  const [shown, setShown] = useState(reduceMotion ? to : from);
  const [phase, setPhase] = useState<PayoutPhase>(reduceMotion ? 'done' : 'wait');

  useEffect(() => {
    if (reduceMotion) {
      const timer = setTimeout(() => sfx.coin(), COIN_DELAY_S * 1000);
      return () => clearTimeout(timer);
    }
    let frame = 0;
    let lastTick = -Infinity;
    const duration = rollMs(to - from);
    const timer = setTimeout(() => {
      setPhase('roll');
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        // Ease out: races at first, then slows into the final number.
        setShown(Math.round(from + (to - from) * (1 - (1 - t) ** 3)));
        if (t >= 1) {
          setPhase('done');
          sfx.jackpot();
          return;
        }
        if (now - lastTick >= TICK_GAP_MS) {
          lastTick = now;
          sfx.coinTick(t);
        }
        frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    }, (COIN_DELAY_S + COUNT_LEAD_S) * 1000);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [from, to, reduceMotion]);

  const landed = phase === 'done';

  return (
    <motion.div
      className="mt-3 flex flex-col items-center"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 420, damping: 14, delay: COIN_DELAY_S }}
    >
      <div className="relative flex items-center gap-2 rounded-full bg-sun/60 py-1.5 pl-2 pr-6" aria-label={`コイン ${to}こ`}>
        <span className="relative">
          <motion.span
            className="block"
            animate={phase === 'roll' ? { rotateY: [0, 360] } : { rotateY: 0 }}
            transition={phase === 'roll' ? { repeat: Infinity, duration: 0.35, ease: 'linear' } : { duration: 0 }}
          >
            <CoinIcon size={44} />
          </motion.span>
          {landed && !reduceMotion && <CoinBurst />}
        </span>
        <motion.span
          className={`text-left text-4xl tabular-nums transition-colors ${landed ? 'text-[#e07b00]' : ''}`}
          // Reserve the final width up front so the pill does not grow when the count gains a digit.
          style={{ minWidth: `${String(to).length}ch` }}
          animate={landed && !reduceMotion ? { scale: [1, 1.4, 1] } : { scale: 1 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          aria-hidden
        >
          {shown}
        </motion.span>
        <span className="absolute -right-3 -top-3 rounded-full bg-[#ff9500] px-2.5 py-0.5 text-lg text-white shadow-md">+{to - from}</span>
      </div>
      <motion.p className="mt-1.5 text-base text-ink/70" initial={false} animate={{ opacity: landed ? 1 : 0 }}>
        コインが {to}こに なったよ！
      </motion.p>
    </motion.div>
  );
}

/** Small coins spraying out of the big one when the counter lands. */
function CoinBurst() {
  return (
    <span className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
      {Array.from({ length: BURST_COINS }, (_, i) => {
        const angle = (i / BURST_COINS) * Math.PI * 2 - Math.PI / 2;
        return (
          <motion.span
            key={i}
            className="absolute"
            initial={{ x: 0, y: 0, scale: 0.4, opacity: 1 }}
            animate={{ x: Math.cos(angle) * BURST_DISTANCE, y: Math.sin(angle) * BURST_DISTANCE, scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <CoinIcon size={22} />
          </motion.span>
        );
      })}
    </span>
  );
}
