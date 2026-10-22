import { ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, type ReactNode } from 'react';
import { sfx } from '../audio/sfx';
import { CoinIcon } from './Coin';
import { Confetti } from './Confetti';
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
}

/** The coin pops in after the last star has landed. */
const COIN_DELAY_S = 1.45;

/** Level-clear celebration shared by every game. Render inside AnimatePresence. */
export function WinDialog({ hero, earned, used, par, hasNext, onNext, onRetry, onMap, note, coins, children }: Props) {
  const gained = coins?.gained ?? 0;

  useEffect(() => {
    if (gained <= 0) return;
    const timer = setTimeout(() => sfx.coin(), COIN_DELAY_S * 1000);
    return () => clearTimeout(timer);
  }, [gained]);

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
          {coins && gained > 0 && (
            <motion.div
              className="mt-3 flex items-center justify-center gap-3"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 420, damping: 14, delay: COIN_DELAY_S }}
            >
              <span className="flex items-center gap-1.5 rounded-full bg-sun/60 py-1 pl-1.5 pr-4 text-2xl">
                <CoinIcon size={36} />+{gained}
              </span>
              <span className="text-base text-ink/70">コインが {coins.total}こに なったよ</span>
            </motion.div>
          )}
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
