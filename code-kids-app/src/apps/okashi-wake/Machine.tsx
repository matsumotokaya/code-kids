import { motion } from 'motion/react';
import { AnimalFace, BasketArt, JarArt, TrayArt, TreatArt, type FaceMood } from './art';
import type { DealStep, Treat } from './types';

/**
 * The candy machine: a jar on the left, a claw on a rail across the top, the friends' trays along the bottom
 * and a leftover basket on the right. It only draws "how many steps have landed"; PlayScreen advances time.
 */
interface Props {
  treat: Treat;
  candies: number;
  /** Positions laid out along the bottom. Fixed per level so plates never reveal the answer by where they sit. */
  slots: number;
  /** Friends drawn (from the left). */
  friends: number;
  /** Trays drawn in front of the friends (from the left). */
  trays: number;
  steps: DealStep[];
  /** Steps that have landed. */
  dealt: number;
  /** Step currently carried by the claw. */
  flying: number | null;
  stepMs: number;
  showBasket: boolean;
  /** Label each tray and the basket with its count. */
  showCounts: boolean;
  mood: FaceMood;
  /** Big text in the tray area when there is nothing to draw yet, e.g. before choosing plates. */
  emptyText?: string;
  /** Short sign in the middle of the machine, e.g. "3こずつ". */
  sign: string;
}

const W = 620;
const H = 450;
const RAIL_Y = 26;
const CARRY_Y = 76;
const JAR = { x: 86, y: 196, w: 132, h: 128 };
const BASKET = { x: 534, y: 200, w: 122, h: 92 };
const ROW = { left: 20, right: 600, faceY: 250, trayY: 282, trayH: 118 };
const HOME_X = W / 2;
const CELL = 26;

const jarPos = (i: number) => ({ x: JAR.x + ((i % 5) - 2) * 23, y: JAR.y - 16 - Math.floor(i / 5) * 23 });
const basketPos = (i: number) => ({ x: BASKET.x + ((i % 3) - 1) * 28, y: BASKET.y - 22 - Math.floor(i / 3) * 26 });

function slotX(slots: number, i: number): number {
  const width = Math.min(130, (ROW.right - ROW.left) / Math.max(1, slots));
  return W / 2 + (i - (slots - 1) / 2) * width;
}

function trayCandyPos(slots: number, plate: number, slot: number) {
  return { x: slotX(slots, plate) + ((slot % 3) - 1) * CELL, y: ROW.trayY + ROW.trayH - 20 - Math.floor(slot / 3) * CELL };
}

export function Machine({ treat, candies, slots, friends, trays, steps, dealt, flying, stepMs, showBasket, showCounts, mood, emptyText, sign }: Props) {
  const trayW = Math.min(110, (ROW.right - ROW.left) / Math.max(1, slots) - 8);
  const target = (s: DealStep) => (s.plate === null ? basketPos(s.slot) : trayCandyPos(slots, s.plate, s.slot));
  const inJar = candies - dealt - (flying === null ? 0 : 1);
  const landed = steps.slice(0, dealt);
  const counts = Array.from({ length: Math.max(trays, 0) }, (_, p) => landed.filter((s) => s.plate === p).length);
  const leftovers = landed.filter((s) => s.plate === null).length;

  const flyStep = flying === null ? null : steps[flying];
  const from = jarPos(Math.max(0, candies - (flying ?? 0) - 1));
  const to = flyStep ? target(flyStep) : null;
  const prevStep = flying !== null && flying > 0 ? steps[flying - 1] : null;
  const clawFrom = prevStep ? target(prevStep).x : HOME_X;
  const flightS = (stepMs * 0.9) / 1000;
  const times = [0, 0.3, 0.75, 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full select-none" preserveAspectRatio="xMidYMid meet" role="img" aria-label="おかしわけマシン">
      {/* machine frame */}
      <rect x={6} y={8} width={W - 12} height={H - 14} rx={34} fill="#fff" opacity={0.55} />
      <rect x={24} y={RAIL_Y - 7} width={W - 48} height={14} rx={7} fill="#8fa3bf" stroke="#4f6b8a" strokeWidth={3} />
      {[44, W - 44].map((x) => (
        <circle key={x} cx={x} cy={RAIL_Y} r={9} fill="#ffd84d" stroke="#d9a92a" strokeWidth={3} />
      ))}

      {/* sign */}
      <g transform={`translate(${W / 2} 130)`}>
        <rect x={-88} y={-24} width={176} height={48} rx={24} fill="#fff8e7" stroke="#ffb35c" strokeWidth={3} />
        <text textAnchor="middle" dominantBaseline="central" fontSize={20} fontWeight={900} fill="#3b2f2f">
          {sign}
        </text>
      </g>

      {/* jar */}
      <g transform={`translate(${JAR.x} ${JAR.y})`}>
        <JarArt width={JAR.w} height={JAR.h} />
      </g>
      {Array.from({ length: Math.max(0, inJar) }, (_, i) => {
        const p = jarPos(i);
        return (
          <g key={`jar-${i}`} transform={`translate(${p.x} ${p.y})`}>
            <TreatArt treat={treat} scale={0.8} />
          </g>
        );
      })}
      <g transform={`translate(${JAR.x + 100} ${JAR.y - 14})`}>
        <rect x={-34} y={-14} width={68} height={28} rx={14} fill="#ff8a3d" />
        <text textAnchor="middle" dominantBaseline="central" fontSize={19} fontWeight={900} fill="#fff">
          {Math.max(0, inJar)}こ
        </text>
      </g>

      {/* leftover basket */}
      {showBasket && (
        <g>
          <text x={BASKET.x} y={BASKET.y - BASKET.h - 16} textAnchor="middle" fontSize={20} fontWeight={900} fill="#a8742f">
            {showCounts ? `あまり ${leftovers}こ` : 'あまり'}
          </text>
          <g transform={`translate(${BASKET.x} ${BASKET.y})`}>
            <BasketArt width={BASKET.w} height={BASKET.h} />
          </g>
          {landed.map((s, i) =>
            s.plate === null ? (
              <g key={`rest-${i}`} transform={`translate(${basketPos(s.slot).x} ${basketPos(s.slot).y})`}>
                <motion.g initial={{ y: -8 }} animate={{ y: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 14 }}>
                  <TreatArt treat={treat} />
                </motion.g>
              </g>
            ) : null,
          )}
        </g>
      )}

      {/* friends and their trays */}
      {Array.from({ length: friends }, (_, i) => (
        <motion.g
          key={`friend-${slots}-${i}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <g transform={`translate(${slotX(slots, i)} ${ROW.faceY})`}>
            <AnimalFace index={i} mood={mood} />
          </g>
        </motion.g>
      ))}
      {Array.from({ length: trays }, (_, i) => (
        <motion.g
          key={`tray-${slots}-${i}`}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 18 }}
          style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }}
        >
          <g transform={`translate(${slotX(slots, i)} ${ROW.trayY})`}>
            <TrayArt width={trayW} height={ROW.trayH} />
          </g>
        </motion.g>
      ))}
      {landed.map((s, i) => {
        if (s.plate === null) return null;
        const p = trayCandyPos(slots, s.plate, s.slot);
        return (
          <g key={`tray-candy-${i}`} transform={`translate(${p.x} ${p.y})`}>
            <motion.g initial={{ y: -10 }} animate={{ y: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 14 }}>
              <TreatArt treat={treat} />
            </motion.g>
          </g>
        );
      })}
      {showCounts &&
        counts.map((n, i) => (
          <motion.text
            key={`count-${i}`}
            x={slotX(slots, i)}
            y={ROW.trayY + ROW.trayH + 30}
            textAnchor="middle"
            fontSize={22}
            fontWeight={900}
            fill="#3b2f2f"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            {n}こ
          </motion.text>
        ))}
      {emptyText && (
        <text x={W / 2} y={ROW.trayY + 40} textAnchor="middle" fontSize={24} fontWeight={900} fill="#3b2f2f" opacity={0.55}>
          {emptyText}
        </text>
      )}

      {/* the candy in the claw */}
      {flyStep && to && (
        <motion.g
          key={`fly-${flying}`}
          initial={{ x: from.x, y: from.y }}
          animate={{ x: [from.x, from.x, to.x, to.x], y: [from.y, CARRY_Y, CARRY_Y, to.y] }}
          transition={{ duration: flightS, times, ease: 'easeInOut' }}
        >
          <TreatArt treat={treat} />
        </motion.g>
      )}

      {/* claw carriage */}
      <motion.g
        key={flying === null ? 'claw-home' : `claw-${flying}`}
        initial={{ x: flying === null ? (steps.length > 0 && dealt > 0 ? target(steps[dealt - 1]).x : HOME_X) : clawFrom }}
        animate={flyStep && to ? { x: [clawFrom, from.x, to.x, to.x] } : { x: HOME_X }}
        transition={flyStep ? { duration: flightS, times, ease: 'easeInOut' } : { duration: 0.5, ease: 'easeInOut' }}
      >
        <Claw open={!flyStep} />
      </motion.g>
    </svg>
  );
}

/** The claw hangs from a little robot carriage on the rail; drawn around x = 0. */
function Claw({ open }: { open: boolean }) {
  const spread = open ? 12 : 7;
  return (
    <g>
      <line x1={0} y1={RAIL_Y + 14} x2={0} y2={CARRY_Y - 18} stroke="#4f6b8a" strokeWidth={4} />
      <path d={`M 0 ${CARRY_Y - 18} L ${-spread} ${CARRY_Y - 6} L ${-spread + 4} ${CARRY_Y}`} fill="none" stroke="#4f6b8a" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M 0 ${CARRY_Y - 18} L ${spread} ${CARRY_Y - 6} L ${spread - 4} ${CARRY_Y}`} fill="none" stroke="#4f6b8a" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      <rect x={-26} y={RAIL_Y - 16} width={52} height={32} rx={11} fill="#9fd3f5" stroke="#3b7fb8" strokeWidth={3} />
      <circle cx={-9} cy={RAIL_Y - 1} r={3.5} fill="#1d3557" />
      <circle cx={9} cy={RAIL_Y - 1} r={3.5} fill="#1d3557" />
      <path d={`M -5 ${RAIL_Y + 7} Q 0 ${RAIL_Y + 10} 5 ${RAIL_Y + 7}`} fill="none" stroke="#1d3557" strokeWidth={2.5} strokeLinecap="round" />
    </g>
  );
}

export const MACHINE_SIZE = { W, H };
