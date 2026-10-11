import { AnimatePresence, motion } from 'motion/react';
import type { Command } from '../game/types';
import { ArrowIcon, CARD_META } from './CommandCard';

interface Props {
  program: Command[];
  slots: number;
  activeIndex: number | null;
  disabled: boolean;
  onRemove: (id: string) => void;
}

export function ProgramStrip({ program, slots, activeIndex, disabled, onRemove }: Props) {
  return (
    // Wraps instead of scrolling: a hidden horizontal scrollbar made the later
    // slots invisible, so children read the visible count as the card limit.
    <div className="flex flex-wrap items-center gap-2 py-2" role="list" aria-label="ならべた カード">
      {Array.from({ length: slots }).map((_, i) => {
        const cmd = program[i];
        if (!cmd) {
          return (
            <div
              key={`empty-${i}`}
              className="flex size-14 shrink-0 items-center justify-center rounded-2xl border-[3px] sm:size-16 border-dashed border-ink/20 bg-white/40 text-lg font-black text-ink/35"
            >
              {i + 1}
            </div>
          );
        }
        const meta = CARD_META[cmd.dir];
        const isActive = activeIndex === i;
        return (
          <AnimatePresence key={cmd.id} initial={false}>
            <motion.button
              type="button"
              role="listitem"
              layout
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: isActive ? 1.12 : 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 26 }}
              disabled={disabled}
              onClick={() => onRemove(cmd.id)}
              aria-label={`${i + 1}ばんめ ${meta.label}${cmd.times > 1 ? ` ${cmd.times}かい` : ''}。タップで けす`}
              className={`relative flex size-14 shrink-0 items-center justify-center rounded-2xl border-b-[5px] sm:size-16 shadow-md ${isActive ? 'ring-4 ring-white' : ''}`}
              style={{ backgroundColor: meta.bg, borderColor: meta.border }}
            >
              <ArrowIcon dir={cmd.dir} className="size-9" />
              {cmd.times > 1 && (
                <span
                  className="absolute -right-1.5 -top-1.5 flex size-7 items-center justify-center rounded-full border-2 border-white text-sm font-black shadow"
                  style={{
                    backgroundColor: cmd.times === 2 ? CARD_META.x2.bg : CARD_META.x3.bg,
                    color: cmd.times === 2 ? CARD_META.x2.text : CARD_META.x3.text,
                  }}
                >
                  ×{cmd.times}
                </span>
              )}
            </motion.button>
          </AnimatePresence>
        );
      })}
    </div>
  );
}
