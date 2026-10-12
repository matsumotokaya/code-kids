import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { sfx } from '../../audio/sfx';
import { clampToCircle, images, noteStep, randomCurve, toPatternFrame, type ColorMode, type Stroke } from './pattern';

/** Line widths in pattern units (the circle's radius is 1). */
const CORE_WIDTH = 0.014;
const GLOW_WIDTH = 0.05;
/** The drawing circle fills this share of the canvas, leaving room for the glow. */
const RADIUS_RATIO = 0.96;
const SPIN_RAD_PER_SEC = 0.5;
const BLOOM_MS = 520;
/** Points closer than this are skipped so slow drags do not pile up thousands of points. */
const MIN_STEP = 0.006;
const HUE_PER_UNIT = 200;
const NOTE_GAP_MS = 90;
const NOTE_REPEAT_MS = 240;
const AUTO_POINTS_PER_FRAME = 2;
const MAX_PARTICLES = 40;
const CHUNK = 6;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  h: number;
}

interface Props {
  copies: number;
  color: ColorMode;
  strokes: Stroke[];
  spinning: boolean;
  /** Increment to have the pen draw a random curve by itself. */
  autoDraw: number;
  onStroke: (stroke: Stroke) => void;
  onTouch: () => void;
}

let strokeCounter = 0;
const newId = () => `s${Date.now().toString(36)}${(strokeCounter++).toString(36)}`;

function hueFor(color: ColorMode, cursor: number): number {
  return color === 'rainbow' ? cursor % 360 : color + Math.sin(cursor / 40) * 10;
}

/** One transform per symmetric copy: rotation, and rotation of the left-right mirror. */
function copyMatrices(copies: number, size: number, dpr: number): DOMMatrix[] {
  const radius = (size / 2) * RADIUS_RATIO;
  const base = new DOMMatrix().scale(dpr, dpr).translate(size / 2, size / 2).scale(radius, radius);
  const mats: DOMMatrix[] = [];
  for (let k = 0; k < copies; k++) {
    const turned = base.rotate((360 * k) / copies);
    mats.push(turned, turned.scale(-1, 1));
  }
  return mats;
}

/** Glow pass, then a bright core, in every copy. */
function strokePath(ctx: CanvasRenderingContext2D, path: Path2D, hue: number, mats: DOMMatrix[]): void {
  ctx.strokeStyle = `hsla(${hue}, 100%, 60%, 0.16)`;
  ctx.lineWidth = GLOW_WIDTH;
  for (const m of mats) {
    ctx.setTransform(m);
    ctx.stroke(path);
  }
  ctx.strokeStyle = `hsla(${hue}, 100%, 70%, 0.95)`;
  ctx.lineWidth = CORE_WIDTH;
  for (const m of mats) {
    ctx.setTransform(m);
    ctx.stroke(path);
  }
}

function dotPath(x: number, y: number): Path2D {
  const path = new Path2D();
  path.moveTo(x, y);
  path.lineTo(x + 0.0001, y);
  return path;
}

/** Draws a whole stroke in chunks so the rainbow changes along it without one call per segment. */
function renderStroke(ctx: CanvasRenderingContext2D, stroke: Stroke, mats: DOMMatrix[]): void {
  const pts = stroke.pts;
  if (pts.length === 0) return;
  if (pts.length === 1) {
    strokePath(ctx, dotPath(pts[0].x, pts[0].y), pts[0].h, mats);
    return;
  }
  for (let i = 1; i < pts.length; i += CHUNK) {
    const end = Math.min(pts.length - 1, i + CHUNK - 1);
    const path = new Path2D();
    path.moveTo(pts[i - 1].x, pts[i - 1].y);
    for (let j = i; j <= end; j++) path.lineTo(pts[j].x, pts[j].y);
    strokePath(ctx, path, pts[Math.floor((i + end) / 2)].h, mats);
  }
}

function prepare(ctx: CanvasRenderingContext2D): void {
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

export function ArtCanvas({ copies, color, strokes, spinning, autoDraw, onStroke, onTouch }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Everything the per-frame loop needs lives in refs; React only re-renders for layout.
  const live = useRef({ copies, color, strokes, spinning, onStroke, onTouch });
  live.current = { copies, color, strokes, spinning, onStroke, onTouch };
  const st = useRef({
    size: 0,
    dpr: 1,
    layer: null as HTMLCanvasElement | null,
    mats: [] as DOMMatrix[],
    angle: 0,
    /** Ids of every stroke currently painted into the layer. */
    drawn: new Set<string>(),
    active: new Map<number, Stroke>(),
    /** Last screen position of each finger: a finger held still on a spinning pattern still draws. */
    fingers: new Map<number, { clientX: number; clientY: number }>(),
    auto: null as null | { stroke: Stroke; path: { x: number; y: number }[]; i: number },
    particles: [] as Particle[],
    bloomAt: -Infinity,
    hue: Math.random() * 360,
    note: { step: -1, at: 0 },
  });

  const layerCtx = () => {
    const ctx = st.current.layer?.getContext('2d') ?? null;
    if (ctx) prepare(ctx);
    return ctx;
  };

  /** Repaints the layer from scratch: needed when the copy count, size or stroke list changes. */
  const repaint = () => {
    const s = st.current;
    const ctx = layerCtx();
    if (!ctx || !s.layer) return;
    s.mats = copyMatrices(live.current.copies, s.size, s.dpr);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, s.layer.width, s.layer.height);
    s.drawn = new Set();
    const all = [...live.current.strokes, ...s.active.values(), ...(s.auto ? [s.auto.stroke] : [])];
    for (const stroke of all) {
      renderStroke(ctx, stroke, s.mats);
      s.drawn.add(stroke.id);
    }
  };

  const playNote = (x: number, y: number) => {
    const step = noteStep(x, y);
    const now = performance.now();
    const { note } = st.current;
    if ((step !== note.step && now - note.at > NOTE_GAP_MS) || now - note.at > NOTE_REPEAT_MS) {
      sfx.chime(step);
      st.current.note = { step, at: now };
    }
  };

  const sparkle = (x: number, y: number, h: number, count: number) => {
    const ps = st.current.particles;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 0.05 + Math.random() * 0.15;
      ps.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, h });
    }
    if (ps.length > MAX_PARTICLES) ps.splice(0, ps.length - MAX_PARTICLES);
  };

  const startStroke = (x: number, y: number): Stroke => {
    const s = st.current;
    s.hue += 40;
    const h = hueFor(live.current.color, s.hue);
    const stroke: Stroke = { id: newId(), pts: [{ x, y, h }] };
    s.drawn.add(stroke.id);
    const ctx = layerCtx();
    if (ctx) strokePath(ctx, dotPath(x, y), h, s.mats);
    sparkle(x, y, h, 6);
    playNote(x, y);
    return stroke;
  };

  const extendStroke = (stroke: Stroke, x: number, y: number) => {
    const s = st.current;
    const last = stroke.pts[stroke.pts.length - 1];
    const dist = Math.hypot(x - last.x, y - last.y);
    if (dist < MIN_STEP) return;
    s.hue += dist * HUE_PER_UNIT;
    const h = hueFor(live.current.color, s.hue);
    stroke.pts.push({ x, y, h });
    const ctx = layerCtx();
    if (ctx) {
      const path = new Path2D();
      path.moveTo(last.x, last.y);
      path.lineTo(x, y);
      strokePath(ctx, path, h, s.mats);
    }
    if (Math.random() < 0.5) sparkle(x, y, h, 1);
    playNote(x, y);
  };

  const finishAuto = () => {
    const auto = st.current.auto;
    if (!auto) return;
    while (auto.i < auto.path.length) {
      const p = auto.path[auto.i++];
      extendStroke(auto.stroke, p.x, p.y);
    }
    st.current.auto = null;
    live.current.onStroke(auto.stroke);
  };

  const toPattern = (e: { clientX: number; clientY: number }) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const radius = (rect.width / 2) * RADIUS_RATIO;
    const x = (e.clientX - rect.left - rect.width / 2) / radius;
    const y = (e.clientY - rect.top - rect.height / 2) / radius;
    const p = toPatternFrame(x, y, st.current.angle);
    return clampToCircle(p.x, p.y);
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = toPattern(e);
    st.current.active.set(e.pointerId, startStroke(p.x, p.y));
    st.current.fingers.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });
    live.current.onTouch();
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const stroke = st.current.active.get(e.pointerId);
    if (!stroke) return;
    const events = e.nativeEvent.getCoalescedEvents?.() ?? [];
    for (const ev of events.length > 0 ? events : [e.nativeEvent]) {
      const p = toPattern(ev);
      extendStroke(stroke, p.x, p.y);
    }
    st.current.fingers.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });
  };

  const onPointerEnd = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const stroke = st.current.active.get(e.pointerId);
    if (!stroke) return;
    st.current.active.delete(e.pointerId);
    st.current.fingers.delete(e.pointerId);
    live.current.onStroke(stroke);
  };

  // Size the canvas to the largest square that fits, at device resolution.
  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const fit = () => {
      const size = Math.floor(Math.min(wrap.clientWidth, wrap.clientHeight));
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const s = st.current;
      if (size <= 0 || (size === s.size && dpr === s.dpr)) return;
      s.size = size;
      s.dpr = dpr;
      canvas.width = canvas.height = Math.round(size * dpr);
      canvas.style.width = canvas.style.height = `${size}px`;
      const layer = s.layer ?? document.createElement('canvas');
      layer.width = layer.height = canvas.width;
      s.layer = layer;
      repaint();
    };
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    fit();
    return () => ro.disconnect();
  }, []);

  // A new copy count re-forms the whole pattern with a bloom and one note per copy.
  const firstCopies = useRef(true);
  useEffect(() => {
    repaint();
    if (firstCopies.current) {
      firstCopies.current = false;
      return;
    }
    st.current.bloomAt = performance.now();
    sfx.bloom(copies);
  }, [copies]);

  // Strokes committed by this canvas are already painted; anything else (undo, clear, load) needs a repaint.
  useEffect(() => {
    const s = st.current;
    const inFlight = new Set([...[...s.active.values()].map((x) => x.id), ...(s.auto ? [s.auto.stroke.id] : [])]);
    const wanted = new Set(strokes.map((x) => x.id));
    const stale = [...s.drawn].some((id) => !wanted.has(id) && !inFlight.has(id));
    const missing = strokes.some((x) => !s.drawn.has(x.id));
    if (stale || missing) repaint();
  }, [strokes]);

  useEffect(() => {
    if (autoDraw === 0) return;
    finishAuto();
    const s = st.current;
    s.hue += 60;
    const path = randomCurve();
    const first = path[0];
    s.auto = { stroke: startStroke(first.x, first.y), path, i: 1 };
  }, [autoDraw]);

  // Per-frame: spin, advance the automatic pen, move sparkles, compose the picture.
  useEffect(() => {
    let raf = 0;
    let prev = performance.now();
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      const s = st.current;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx || !s.layer) return;

      if (live.current.spinning) {
        s.angle += SPIN_RAD_PER_SEC * dt;
        // Browsers send no move events for a still finger, so trace it here like a potter's wheel.
        for (const [id, finger] of s.fingers) {
          const stroke = s.active.get(id);
          if (!stroke) continue;
          const p = toPattern(finger);
          extendStroke(stroke, p.x, p.y);
        }
      }

      if (s.auto) {
        for (let k = 0; k < AUTO_POINTS_PER_FRAME && s.auto.i < s.auto.path.length; k++) {
          const p = s.auto.path[s.auto.i++];
          extendStroke(s.auto.stroke, p.x, p.y);
        }
        if (s.auto.i >= s.auto.path.length) finishAuto();
      }

      for (const p of s.particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt * 1.6;
      }
      s.particles = s.particles.filter((p) => p.life > 0);

      const w = canvas.width;
      const radius = (w / 2) * RADIUS_RATIO;
      const t = Math.min(1, (now - s.bloomAt) / BLOOM_MS);
      const ease = 1 - (1 - t) ** 3;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, w, w);
      ctx.translate(w / 2, w / 2);
      ctx.rotate(s.angle + (1 - ease) * 0.6);
      const scale = 0.82 + 0.18 * ease;
      ctx.scale(scale, scale);

      // Mirror lines, flashing briefly when the copy count changes.
      const n = live.current.copies;
      ctx.strokeStyle = `rgba(255,255,255,${0.06 + 0.3 * (1 - ease)})`;
      ctx.lineWidth = 1.5 * s.dpr;
      ctx.beginPath();
      for (let k = 0; k < 2 * n; k++) {
        const a = Math.PI / 2 + (Math.PI * k) / n;
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
      }
      ctx.stroke();

      ctx.globalAlpha = 0.25 + 0.75 * ease;
      ctx.drawImage(s.layer, -w / 2, -w / 2);
      ctx.globalAlpha = 1;

      if (s.particles.length > 0) {
        ctx.globalCompositeOperation = 'lighter';
        for (const p of s.particles) {
          ctx.fillStyle = `hsla(${p.h}, 100%, 80%, ${p.life})`;
          const r = (0.006 + 0.012 * p.life) * radius;
          for (const q of images(p, n)) {
            ctx.beginPath();
            ctx.arc(q.x * radius, q.y * radius, r, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={wrapRef} className="absolute inset-0 flex items-center justify-center">
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        className="touch-none rounded-full shadow-[0_0_60px_rgba(140,120,255,0.35)]"
        style={{ background: 'radial-gradient(circle at 50% 45%, #2b2d6e 0%, #15174a 55%, #0a0b24 100%)' }}
        aria-label="ゆびで なぞって もようを かく キャンバス"
      />
    </div>
  );
}
