import { Hand, LayoutGrid, RotateCw, Sparkles, Trash2, Undo2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState, type ReactNode } from 'react';
import { sfx } from '../../audio/sfx';
import { BigButton, IconButton } from '../../components/ui/BigButton';
import { AccountBadge } from '../../components/ui/AccountBadge';
import { SoundToggle } from '../../components/ui/SoundToggle';
import type { AppProps } from '../AppRunner';
import { ArtCanvas } from './ArtCanvas';
import { MAX_COPIES, MIN_COPIES, type ColorMode } from './pattern';
import { DEFAULT_ART, useMahouArt } from './store';

const COPY_CHOICES = Array.from({ length: MAX_COPIES - MIN_COPIES + 1 }, (_, i) => MIN_COPIES + i);

const COLORS: { mode: ColorMode; label: string; swatch: string }[] = [
  { mode: 'rainbow', label: 'にじいろ', swatch: 'conic-gradient(#ff5f6d, #ffc371, #f9f871, #6ee39a, #4fc3f7, #b58cff, #ff5f6d)' },
  { mode: 330, label: 'ピンク', swatch: 'hsl(330, 100%, 68%)' },
  { mode: 48, label: 'きいろ', swatch: 'hsl(48, 100%, 60%)' },
  { mode: 140, label: 'みどり', swatch: 'hsl(140, 80%, 55%)' },
  { mode: 195, label: 'みずいろ', swatch: 'hsl(195, 100%, 62%)' },
  { mode: 270, label: 'むらさき', swatch: 'hsl(270, 100%, 72%)' },
];

export function MahouArtApp({ user, onQuit }: AppProps) {
  const art = useMahouArt((s) => s.users[user]) ?? DEFAULT_ART;
  const { setCopies, setColor, addStroke, undo, clear } = useMahouArt.getState();
  const [spinning, setSpinning] = useState(false);
  const [autoDraw, setAutoDraw] = useState(0);
  const [touched, setTouched] = useState(art.strokes.length > 0);

  return (
    <div
      className="flex h-full flex-col gap-3 p-3 text-white"
      style={{
        paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
        background: 'radial-gradient(ellipse at 50% 0%, #3a2f86 0%, #1b1a4d 45%, #0b0b26 100%)',
      }}
    >
      <header className="flex items-center gap-2 sm:gap-3">
        <IconButton
          label="ストアに もどる"
          onClick={() => {
            sfx.tap();
            onQuit();
          }}
        >
          <LayoutGrid className="size-7" />
        </IconButton>
        <div className="min-w-0 flex-1 rounded-2xl bg-white/10 px-4 py-2 shadow-md">
          <div className="truncate text-lg leading-tight">まほうのアート</div>
          <div className="text-xs text-white/70">ゆびで なぞると もようが ふえるよ</div>
        </div>
        <SoundToggle />
        <AccountBadge user={user} />
      </header>

      <main className="flex min-h-0 flex-1 flex-col gap-3 landscape:flex-row">
        <section className="relative min-h-0 flex-1">
          <ArtCanvas
            copies={art.copies}
            color={art.color}
            strokes={art.strokes}
            spinning={spinning}
            autoDraw={autoDraw}
            onStroke={(stroke) => addStroke(user, stroke)}
            onTouch={() => setTouched(true)}
          />
          <AnimatePresence>
            {!touched && (
              <motion.div
                className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Hand className="anim-float size-14 text-white/90" />
                <div className="text-2xl text-white/90">ゆびで なぞってみよう！</div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <aside className="flex flex-col gap-3 rounded-3xl bg-white/10 p-3 backdrop-blur landscape:w-[min(400px,40%)] landscape:shrink-0 landscape:justify-center landscape:overflow-y-auto">
          <Group label="いくつに ふえる？">
            <div className="grid grid-cols-6 gap-2 sm:portrait:grid-cols-12 landscape:grid-cols-4">
              {COPY_CHOICES.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    if (n !== art.copies) setCopies(user, n);
                  }}
                  aria-label={`${n}つに ふやす`}
                  aria-pressed={n === art.copies}
                  className={`h-12 rounded-2xl border-b-4 text-2xl font-black transition-transform duration-100 active:translate-y-1 active:border-b-0 ${
                    n === art.copies ? 'border-sun-dark bg-sun text-ink' : 'border-white/20 bg-white/15 text-white'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </Group>

          <Group label="いろ">
            <div className="flex flex-wrap gap-3">
              {COLORS.map((c) => {
                const selected = c.mode === art.color;
                return (
                  <button
                    key={String(c.mode)}
                    type="button"
                    onClick={() => {
                      setColor(user, c.mode);
                      sfx.tap();
                    }}
                    aria-label={c.label}
                    aria-pressed={selected}
                    className={`size-11 rounded-full transition-transform duration-100 active:scale-90 ${selected ? 'scale-110 ring-4 ring-white' : 'ring-2 ring-white/30'}`}
                    style={{ background: c.swatch }}
                  />
                );
              })}
            </div>
          </Group>

          <div className="flex items-center gap-3">
            <IconButton
              label={spinning ? 'とめる' : 'くるくる まわす'}
              tone={spinning ? 'yellow' : 'white'}
              onClick={() => {
                setSpinning((v) => !v);
                sfx.tap();
              }}
            >
              <RotateCw className={`size-6 ${spinning ? 'animate-spin' : ''}`} />
            </IconButton>
            <IconButton
              label="ひとつ もどす"
              disabled={art.strokes.length === 0}
              onClick={() => {
                undo(user);
                sfx.tap();
              }}
            >
              <Undo2 className="size-6" />
            </IconButton>
            <IconButton
              label="ぜんぶ けす"
              disabled={art.strokes.length === 0}
              onClick={() => {
                clear(user);
                sfx.sweep();
              }}
            >
              <Trash2 className="size-6" />
            </IconButton>
            <BigButton
              tone="blue"
              className="min-w-0 flex-1 whitespace-nowrap px-4 text-2xl landscape:text-xl"
              onClick={() => {
                setTouched(true);
                setAutoDraw((n) => n + 1);
              }}
            >
              <Sparkles className="size-7" />
              おまかせ
            </BigButton>
          </div>
        </aside>
      </main>
    </div>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-base text-white/80">{label}</div>
      {children}
    </div>
  );
}
