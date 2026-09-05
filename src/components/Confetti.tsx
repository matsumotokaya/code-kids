import { motion } from 'motion/react';
import { useMemo } from 'react';

const COLORS = ['#ffd84d', '#ff8fb1', '#7ac8ff', '#6ee39a', '#b58cff', '#ffb35c'];

export function Confetti({ count = 40 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 900,
        delay: Math.random() * 0.4,
        duration: 1.6 + Math.random() * 1.2,
        rotate: (Math.random() - 0.5) * 900,
        color: COLORS[i % COLORS.length],
        w: 10 + Math.random() * 10,
        h: 12 + Math.random() * 14,
        round: Math.random() > 0.5,
      })),
    [count],
  );
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          className="absolute left-1/2 top-[-5%]"
          style={{ width: p.w, height: p.h, backgroundColor: p.color, borderRadius: p.round ? '50%' : 4 }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: p.x, y: '120vh', opacity: [1, 1, 0.8, 0], rotate: p.rotate }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}
