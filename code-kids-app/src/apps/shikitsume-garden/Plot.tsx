import { AnimatePresence, motion } from 'motion/react';
import { GrassTile } from '../../components/tiles';
import { bedColor, FlowerArt, JoroArt, SoilTile, StoneTile, type JoroMood } from './art';
import { keyOf, soilCells } from './engine';
import type { Bed, GardenLevel, PlantRun, Point } from './types';

interface Props {
  level: GardenLevel;
  beds: Bed[];
  run: PlantRun | null;
  /** Flowers planted so far. */
  done: number;
  /** The robot has walked to the cell it could not plant. */
  showProblem: boolean;
  /** Outline the soil the run left empty. */
  showGaps: boolean;
  stepMs: number;
  mood: JoroMood;
  /** Bed whose tag wiggles, with a counter to replay it. */
  wiggle: { bed: number; n: number } | null;
  onTap?: (p: Point) => void;
}

const MARGIN = 30;
const SIDE = 16;

function Pill({ x, y, text, color }: { x: number; y: number; text: string; color: number }) {
  const c = bedColor(color);
  const w = 26 + text.length * 15;
  return (
    <g transform={`translate(${x} ${y})`} pointerEvents="none">
      <rect x={-w / 2} y={-17} width={w} height={34} rx={17} fill="#fff" stroke={c.edge} strokeWidth={4} />
      <text textAnchor="middle" dominantBaseline="central" fontSize={23} fontWeight={900} fill="#3b2f2f">
        {text}
      </text>
    </g>
  );
}

export function Plot({ level, beds, run, done, showProblem, showGaps, stepMs, mood, wiggle, onTap }: Props) {
  const W = level.w * 100;
  const H = level.h * 100;
  const cells: Point[] = [];
  for (let y = 0; y < level.h; y++) for (let x = 0; x < level.w; x++) cells.push({ x, y });
  const soil = new Set(soilCells(level).map(keyOf));
  const stones = new Set(level.kind === 'fill' ? level.stones.map(keyOf) : []);
  const planted = run ? run.steps.slice(0, done) : [];
  const counting = level.kind === 'count';

  // The robot stands on the last flower it planted, or on the cell where it had to stop.
  const last = planted[planted.length - 1];
  const robotAt = showProblem && run?.problem ? run.problem : (last ?? run?.steps[0] ?? null);
  const stepS = Math.min(0.3, (stepMs / 1000) * 0.7);

  return (
    <svg
      viewBox={`${-MARGIN} ${-MARGIN - 40} ${W + MARGIN * 2} ${H + MARGIN * 2 + SIDE + 40}`}
      className="h-full w-full touch-manipulation select-none"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="はなばたけ"
    >
      <rect x={-MARGIN + 2} y={-MARGIN + 2 + SIDE} width={W + MARGIN * 2 - 4} height={H + MARGIN * 2 - 4} rx={36} fill="#8c5e2a" />
      <rect x={-MARGIN + 2} y={-MARGIN + 2} width={W + MARGIN * 2 - 4} height={H + MARGIN * 2 - 4} rx={36} fill="#b7833e" />
      <rect x={-12} y={-12} width={W + 24} height={H + 24} rx={26} fill="#6fbf52" />

      {cells.map((c) => {
        const k = keyOf(c);
        if (stones.has(k)) return <StoneTile key={k} x={c.x} y={c.y} />;
        if (soil.has(k)) return <SoilTile key={k} x={c.x} y={c.y} />;
        return <GrassTile key={k} x={c.x} y={c.y} />;
      })}

      {beds.map((b, i) => {
        const c = bedColor(i);
        return (
          <motion.rect
            key={`bed-${i}-${keyOf(b)}-${b.rows}x${b.cols}`}
            x={b.x * 100 + 5}
            y={b.y * 100 + 5}
            width={b.cols * 100 - 10}
            height={b.rows * 100 - 10}
            rx={18}
            fill={c.tint}
            fillOpacity={0.45}
            stroke={c.edge}
            strokeWidth={7}
            strokeDasharray={counting ? undefined : '18 10'}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 22 }}
            style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }}
            pointerEvents="none"
          />
        );
      })}

      {showGaps &&
        run?.gaps.map((g) => (
          <motion.rect
            key={`gap-${keyOf(g)}`}
            x={g.x * 100 + 12}
            y={g.y * 100 + 12}
            width={76}
            height={76}
            rx={16}
            fill="#fff"
            fillOpacity={0.25}
            stroke="#fff"
            strokeWidth={5}
            strokeDasharray="12 8"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            pointerEvents="none"
          />
        ))}

      {planted.map((s) => {
        const rowEnd = s.col === beds[s.bed].cols - 1;
        return (
          <g key={`flower-${keyOf(s)}`} transform={`translate(${s.x * 100} ${s.y * 100})`} pointerEvents="none">
            <motion.g
              initial={{ scale: 0, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 520, damping: 18 }}
              style={{ transformBox: 'fill-box', transformOrigin: '50% 100%' }}
            >
              <FlowerArt color={s.bed} n={s.n} rowEnd={rowEnd} />
            </motion.g>
          </g>
        );
      })}

      {/* Fill tags step aside once flowers grow; the equation strip under the board takes over. */}
      {(counting || planted.length === 0) &&
        beds.map((b, i) => {
          const shaking = wiggle?.bed === i;
          return (
            <motion.g
              key={`tag-${i}-${shaking ? wiggle.n : 0}`}
              animate={shaking ? { x: [0, 8, -7, 5, 0] } : undefined}
              transition={{ duration: 0.35 }}
              pointerEvents="none"
            >
              {counting ? (
                <>
                  <Pill x={b.x * 100 + (b.cols * 100) / 2} y={b.y * 100} text={`よこ ${b.cols}`} color={i} />
                  <Pill x={b.x * 100 + 46} y={b.y * 100 + (b.rows * 100) / 2} text={`たて ${b.rows}`} color={i} />
                </>
              ) : (
                <Pill x={b.x * 100 + (b.cols * 100) / 2} y={b.y * 100 + 4} text={`${b.rows} × ${b.cols}`} color={i} />
              )}
            </motion.g>
          );
        })}

      <AnimatePresence>
        {showProblem && run?.problem && (
          <g key="problem" transform={`translate(${run.problem.x * 100 + 50} ${run.problem.y * 100 + 50})`} pointerEvents="none">
            <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
              <circle r={40} fill="#ff7a7a" fillOpacity={0.25} stroke="#e04848" strokeWidth={6} />
              <path d="M -16 -16 L 16 16 M 16 -16 L -16 16" stroke="#e04848" strokeWidth={9} strokeLinecap="round" />
            </motion.g>
          </g>
        )}
      </AnimatePresence>

      {robotAt && (
        <motion.g
          initial={false}
          animate={{ x: robotAt.x * 100 + 34, y: robotAt.y * 100 - 62 }}
          transition={{ duration: stepS, ease: 'easeOut' }}
          pointerEvents="none"
        >
          <g transform="scale(0.78)">
            <JoroArt mood={mood} />
          </g>
        </motion.g>
      )}

      {onTap &&
        cells.map((c) => (
          <rect
            key={`hit-${keyOf(c)}`}
            x={c.x * 100}
            y={c.y * 100}
            width={100}
            height={100}
            fill="transparent"
            className="cursor-pointer"
            onClick={() => onTap(c)}
            aria-label={`${c.x + 1}れつめ ${c.y + 1}ぎょうめ`}
          />
        ))}
    </svg>
  );
}
