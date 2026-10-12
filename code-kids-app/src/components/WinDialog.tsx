import { ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { sfx } from '../audio/sfx';
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
  /** Extra content between the rating and the buttons, e.g. the finished equation. */
  children?: ReactNode;
}

/** Level-clear celebration shared by every game. Render inside AnimatePresence. */
export function WinDialog({ hero, earned, used, par, hasNext, onNext, onRetry, onMap, children }: Props) {
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
            カード {used}まいで クリア！{earned < 3 && ` ${par}まいで できると ほし3つ`}
          </p>
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
