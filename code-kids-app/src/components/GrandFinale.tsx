import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { sfx } from '../audio/sfx';
import { BigButton } from './ui/BigButton';

const COLORS = ['#ffd84d', '#ff5c7a', '#4fc3ff', '#5ef08a', '#b77bff', '#ff9a3c', '#ff7ae0'];

/** Opening volley (seconds, rockets at once), then a steady show until the child moves on. */
const OPENING: [number, number][] = [
  [0.6, 1],
  [1.0, 2],
  [1.5, 3],
  [2.2, 2],
];
const SHOW_START_S = 2.8;
const TITLE_DELAY_S = 1.4;
/** The button waits so the first tap of excitement does not skip the show. */
const BUTTON_DELAY_S = 3;
const MAX_PARTICLES = 2400;
/** Sounds closer together than this merge into one, so a volley does not get loud. */
const SOUND_GAP_MS = 90;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Frames left; rockets burst when their climb runs out instead. */
  life: number;
  maxLife: number;
  color: string;
  size: number;
  rocket: boolean;
  twinkle: boolean;
}

const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];

/**
 * Plays once when the last stage of a game is cleared for the first time:
 * the screen falls to night, fireworks go up and 「ゲームクリア！」 lands with a fanfare.
 * Render it in place of the clear dialog and show the dialog from `onDone`.
 */
export function GrandFinale({ hero, onDone }: { hero: ReactNode; onDone: () => void }) {
  const reduceMotion = useReducedMotion();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timers = [setTimeout(() => sfx.fanfare(), TITLE_DELAY_S * 1000), setTimeout(() => setReady(true), BUTTON_DELAY_S * 1000)];
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext('2d');
    if (reduceMotion || !el || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      el.width = Math.round(window.innerWidth * dpr);
      el.height = Math.round(window.innerHeight * dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const particles: Particle[] = [];
    let lastLaunchSound = 0;
    let lastBoomSound = 0;

    const launch = () => {
      const w = el.width;
      const h = el.height;
      // Climb so the rocket runs out of speed somewhere in the upper half of the screen.
      const climb = h * rand(0.45, 0.75);
      const gravity = 0.06 * dpr;
      particles.push({
        x: w * rand(0.15, 0.85),
        y: h,
        vx: rand(-0.6, 0.6) * dpr,
        vy: -Math.sqrt(2 * gravity * climb),
        life: 1,
        maxLife: 1,
        color: '#fff3c4',
        size: 2.6 * dpr,
        rocket: true,
        twinkle: false,
      });
      const now = performance.now();
      if (now - lastLaunchSound > SOUND_GAP_MS) {
        lastLaunchSound = now;
        sfx.launch();
      }
    };

    const burst = (x: number, y: number) => {
      const colors = Math.random() < 0.4 ? [pick(COLORS), pick(COLORS)] : [pick(COLORS)];
      const ring = Math.random() < 0.3;
      const count = ring ? 60 : Math.round(rand(80, 110));
      // Scaled to the screen so a burst fills about a third of it on a phone and on a tablet alike.
      const speed = Math.min(el.width, el.height) * rand(0.007, 0.01);
      const twinkle = Math.random() < 0.35;
      for (let i = 0; i < count && particles.length < MAX_PARTICLES; i++) {
        const angle = (i / count) * Math.PI * 2 + rand(-0.05, 0.05);
        const v = ring ? speed : speed * Math.sqrt(Math.random());
        const life = Math.round(rand(65, 95));
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * v,
          vy: Math.sin(angle) * v,
          life,
          maxLife: life,
          color: colors[i % colors.length],
          size: rand(2.2, 3.2) * dpr,
          rocket: false,
          twinkle,
        });
      }
      const now = performance.now();
      if (now - lastBoomSound > SOUND_GAP_MS) {
        lastBoomSound = now;
        sfx.boom();
      }
    };

    const timers = OPENING.map(([at, n]) => setTimeout(() => Array.from({ length: n }, launch), at * 1000));
    const show = () => {
      Array.from({ length: Math.random() < 0.3 ? 2 : 1 }, launch);
      timers.push(setTimeout(show, rand(450, 900)));
    };
    timers.push(setTimeout(show, SHOW_START_S * 1000));

    let frame = 0;
    let last = performance.now();
    const step = (now: number) => {
      // Frames are counted at 60 fps; a hidden tab must not fire a huge catch-up step.
      const dt = Math.min(3, (now - last) / (1000 / 60));
      last = now;

      // Fade what was drawn before instead of clearing, which leaves soft trails.
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(1, 0.2 * dt)})`;
      ctx.fillRect(0, 0, el.width, el.height);
      ctx.globalCompositeOperation = 'lighter';

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        if (p.rocket) {
          p.vy += 0.06 * dpr * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          if (p.vy >= -0.5 * dpr) {
            particles.splice(i, 1);
            burst(p.x, p.y);
            continue;
          }
        } else {
          const drag = 0.985 ** dt;
          p.vx *= drag;
          p.vy = p.vy * drag + 0.045 * dpr * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.life -= dt;
          if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
          }
        }
        const fade = p.rocket ? 1 : p.life / p.maxLife;
        const alpha = p.twinkle && fade < 0.6 ? fade * (Math.random() < 0.5 ? 1 : 0.2) : fade;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(frame);
      timers.forEach(clearTimeout);
      window.removeEventListener('resize', resize);
    };
  }, [reduceMotion]);

  return (
    <motion.div
      className="fixed inset-0 z-50 overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 115%, #24357d 0%, #0d1438 50%, #04060f 100%)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <canvas ref={canvas} className="pointer-events-none absolute inset-0 size-full" aria-hidden />
      <div className="relative flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <motion.div
          initial={{ scale: 0, y: 40 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 14, delay: TITLE_DELAY_S - 0.2 }}
        >
          <div className="anim-float">{hero}</div>
        </motion.div>
        <motion.h2
          className="text-6xl font-black tracking-wide sm:text-8xl"
          style={{
            backgroundImage: 'linear-gradient(180deg, #fff8c9 0%, #ffd84d 45%, #ff9f1a 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            filter: 'drop-shadow(0 4px 0 #8a4b00) drop-shadow(0 0 24px rgba(255, 200, 80, 0.55))',
          }}
          initial={{ scale: 3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 15, delay: TITLE_DELAY_S }}
        >
          ゲームクリア！
        </motion.h2>
        <motion.p
          className="text-xl text-white/90 sm:text-2xl"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: TITLE_DELAY_S + 0.6 }}
        >
          ぜんぶの ステージを クリアしたよ！ おめでとう！
        </motion.p>
        <motion.div
          className="mt-4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={ready ? { opacity: 1, scale: 1 } : undefined}
          transition={{ type: 'spring', stiffness: 320, damping: 18 }}
        >
          <BigButton
            tone="yellow"
            className="px-10 text-2xl"
            disabled={!ready}
            onClick={() => {
              sfx.select();
              onDone();
            }}
          >
            やったね！
          </BigButton>
        </motion.div>
      </div>
    </motion.div>
  );
}
