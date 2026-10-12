import { motion } from 'motion/react';
import { STAR_PATH } from './tiles';

interface Props {
  stars: number;
  size?: number;
  animate?: boolean;
  /** Applied to each star, e.g. to enlarge them at a breakpoint. */
  className?: string;
}

export function StarRating({ stars, size = 28, animate = false, className }: Props) {
  return (
    <div className="flex items-center justify-center gap-1" aria-label={`ほし ${stars}こ`}>
      {[0, 1, 2].map((i) => {
        const earned = i < stars;
        return (
          <motion.svg
            key={i}
            viewBox="0 0 100 100"
            width={size}
            height={size}
            className={className}
            initial={animate && earned ? { scale: 0, rotate: -60 } : false}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 14, delay: animate ? 0.35 + i * 0.3 : 0 }}
          >
            <path d={STAR_PATH} fill={earned ? '#ffd84d' : '#d9d3c7'} stroke={earned ? '#d9a92a' : '#b8b0a3'} strokeWidth={5} strokeLinejoin="round" />
          </motion.svg>
        );
      })}
    </div>
  );
}

/** "★ 12 / 36" counter shown in each game's map header. */
export function StarTotal({ earned, total }: { earned: number; total: number }) {
  return (
    <div className="ml-auto flex items-center gap-1 text-xl">
      <svg viewBox="0 0 100 100" className="size-7" aria-hidden>
        <path d={STAR_PATH} fill="#ffd84d" stroke="#d9a92a" strokeWidth={6} strokeLinejoin="round" />
      </svg>
      <span>
        {earned}
        <span className="text-sm text-ink/60"> / {total}</span>
      </span>
    </div>
  );
}
