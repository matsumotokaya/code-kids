import type { CardLook } from '../../components/CommandCard';
import type { JumpCardKind, JumpCommand } from './types';

interface JumpCardMeta {
  /** What the card does, read aloud-able for a 6-year-old. */
  label: string;
  /** Short math notation shown on the card and in the equation. */
  face: string;
  bg: string;
  border: string;
}

const ADD = { bg: '#6ee39a', border: '#2fa862' };
const SUB = { bg: '#ffb35c', border: '#d1812a' };
const MUL = { bg: '#ff8fb1', border: '#d3567f' };
const DIV = { bg: '#b58cff', border: '#7f52d6' };

export const JUMP_CARD_META: Record<JumpCardKind, JumpCardMeta> = {
  add1: { label: 'たす 1', face: '+1', ...ADD },
  add2: { label: 'たす 2', face: '+2', ...ADD },
  add3: { label: 'たす 3', face: '+3', ...ADD },
  sub1: { label: 'ひく 1', face: '−1', ...SUB },
  sub2: { label: 'ひく 2', face: '−2', ...SUB },
  mul2: { label: '2ばい', face: '×2', ...MUL },
  mul3: { label: '3ばい', face: '×3', ...MUL },
  div2: { label: 'はんぶん', face: '÷2', ...DIV },
};

export function JumpCardFace({ kind, className = '' }: { kind: JumpCardKind; className?: string }) {
  return <span className={`font-black leading-none text-white [text-shadow:0_2px_0_rgba(0,0,0,0.18)] ${className}`}>{JUMP_CARD_META[kind].face}</span>;
}

export function jumpLook(cmd: JumpCommand): CardLook {
  const meta = JUMP_CARD_META[cmd.kind];
  return { label: meta.label, bg: meta.bg, border: meta.border, face: <JumpCardFace kind={cmd.kind} className="text-2xl" /> };
}
