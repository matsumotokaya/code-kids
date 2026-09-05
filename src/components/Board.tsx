import { AnimatePresence, motion } from 'motion/react';
import type { Dir, Level, Point } from '../game/types';
import { DIR_DELTA, keyOf } from '../game/engine';
import type { CharacterId } from '../store/progress';
import { CharacterArt, type Mood } from './Character';
import { CELL, GrassTile, RockTile, StarPiece, StartPad, SvgDefs, TrailDot, WaterTile } from './tiles';

export interface BoardProps {
  level: Level;
  character: CharacterId;
  pos: Point;
  facing: Dir;
  mood: Mood;
  collected: ReadonlySet<string>;
  trail: Point[];
  sunk: boolean;
  /** Incrementing counter; each change triggers a bump shake toward `shakeDir`. */
  shake: number;
  shakeDir: Dir | null;
  ripple: Point | null;
}

const MARGIN = 26;
const SIDE = 16;

export function Board({ level, character, pos, facing, mood, collected, trail, sunk, shake, shakeDir, ripple }: BoardProps) {
  const n = level.size;
  const W = n * CELL;
  const viewBox = `${-MARGIN} ${-MARGIN} ${W + MARGIN * 2} ${W + MARGIN * 2 + SIDE}`;
  const cells: Point[] = [];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) cells.push({ x, y });
  const water = new Set(level.water.map(keyOf));
  const d = shakeDir ? DIR_DELTA[shakeDir] : { x: 0, y: 0 };
  const tilt = facing === 'right' ? 6 : facing === 'left' ? -6 : 0;

  return (
    <svg viewBox={viewBox} className="h-full w-full" preserveAspectRatio="xMidYMid meet" role="img" aria-label="ゲームのばん">
      <SvgDefs />
      {/* Floating island: dirt side, dirt top, grass rim */}
      <rect x={-MARGIN + 2} y={-MARGIN + 2 + SIDE} width={W + MARGIN * 2 - 4} height={W + MARGIN * 2 - 4} rx={36} fill="#8c5e2a" />
      <rect x={-MARGIN + 2} y={-MARGIN + 2} width={W + MARGIN * 2 - 4} height={W + MARGIN * 2 - 4} rx={36} fill="#b7833e" />
      <rect x={-10} y={-10} width={W + 20} height={W + 20} rx={26} fill="#6fbf52" />

      {cells.map((c) => (water.has(keyOf(c)) ? <WaterTile key={keyOf(c)} x={c.x} y={c.y} /> : <GrassTile key={keyOf(c)} x={c.x} y={c.y} />))}
      <StartPad x={level.start.x} y={level.start.y} />
      {level.rocks.map((r) => (
        <RockTile key={keyOf(r)} x={r.x} y={r.y} />
      ))}
      {trail.map((t, i) => (
        <TrailDot key={`${keyOf(t)}-${i}`} x={t.x} y={t.y} />
      ))}

      <AnimatePresence>
        {level.stars
          .filter((s) => !collected.has(keyOf(s)))
          .map((s) => (
            <motion.g
              key={keyOf(s)}
              initial={false}
              exit={{ scale: 2, opacity: 0, rotate: 40 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }}
              transform={`translate(${s.x * CELL} ${s.y * CELL})`}
            >
              <StarPiece />
            </motion.g>
          ))}
      </AnimatePresence>

      <AnimatePresence>
        {ripple && (
          <motion.g
            key={`ripple-${keyOf(ripple)}`}
            initial={{ scale: 0.2, opacity: 0.9 }}
            animate={{ scale: 1.3, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }}
            transform={`translate(${ripple.x * CELL} ${ripple.y * CELL})`}
          >
            <circle cx={50} cy={55} r={42} fill="none" stroke="#ffffff" strokeWidth={6} />
            <circle cx={50} cy={55} r={26} fill="none" stroke="#ffffff" strokeWidth={4} />
          </motion.g>
        )}
      </AnimatePresence>

      <motion.g
        initial={false}
        animate={{ x: pos.x * CELL, y: pos.y * CELL }}
        transition={{ type: 'spring', stiffness: 380, damping: 26, mass: 0.9 }}
      >
        <motion.g
          key={shake}
          initial={{ x: 0, y: 0 }}
          animate={shake > 0 ? { x: [0, 14 * d.x, -8 * d.x, 4 * d.x, 0], y: [0, 14 * d.y, -8 * d.y, 4 * d.y, 0] } : { x: 0, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <motion.g
            animate={sunk ? { scale: 0.55, opacity: 0.35, y: 22, rotate: 0 } : { scale: 1, opacity: 1, y: 0, rotate: tilt }}
            transition={{ duration: 0.35 }}
            style={{ transformBox: 'fill-box', transformOrigin: '50% 70%' }}
          >
            <g className={sunk ? undefined : 'anim-float'}>
              <g transform="translate(8 2) scale(0.84)">
                <CharacterArt id={character} facing={facing} mood={mood} />
              </g>
            </g>
          </motion.g>
        </motion.g>
      </motion.g>
    </svg>
  );
}
