import type { ReactNode } from 'react';
import type { CardKind, Command, Dir } from '../game/types';

export interface CardMeta {
  label: string;
  bg: string;
  border: string;
  text: string;
}

export const CARD_META: Record<CardKind, CardMeta> = {
  up: { label: 'うえ', bg: '#7ac8ff', border: '#3e8fd1', text: '#ffffff' },
  down: { label: 'した', bg: '#ffb35c', border: '#d1812a', text: '#ffffff' },
  left: { label: 'ひだり', bg: '#b58cff', border: '#7f52d6', text: '#ffffff' },
  right: { label: 'みぎ', bg: '#6ee39a', border: '#2fa862', text: '#ffffff' },
  x2: { label: '2かい', bg: '#ff8fb1', border: '#d3567f', text: '#ffffff' },
  x3: { label: '3かい', bg: '#ffd84d', border: '#d9a92a', text: '#3b2f2f' },
};

/** What a card looks like, independent of which game it belongs to. */
export interface CardLook {
  label: string;
  bg: string;
  border: string;
  face: ReactNode;
}

/** Look of a placed arrow card in the program strip. */
export function arrowLook(cmd: Command): CardLook {
  const meta = CARD_META[cmd.dir];
  return { label: meta.label, bg: meta.bg, border: meta.border, face: <ArrowIcon dir={cmd.dir} className="size-9" /> };
}

const ROTATION: Record<Dir, number> = { up: 0, right: 90, down: 180, left: 270 };

export function ArrowIcon({ dir, className = '' }: { dir: Dir; className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <g transform={`rotate(${ROTATION[dir]} 20 20)`}>
        <path
          d="M20 5 L35 21 L27 21 L27 35 L13 35 L13 21 L5 21 Z"
          fill="#ffffff"
          stroke="rgba(0,0,0,0.25)"
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

export function CardFace({ kind, className = '' }: { kind: CardKind; className?: string }) {
  if (kind === 'x2' || kind === 'x3') {
    return (
      <span className={`font-black leading-none ${className}`} style={{ color: CARD_META[kind].text }}>
        ×{kind === 'x2' ? 2 : 3}
      </span>
    );
  }
  return <ArrowIcon dir={kind} className={className} />;
}

interface CardButtonProps {
  label: string;
  bg: string;
  border: string;
  text: string;
  face: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}

/** Big tappable card in the card tray, shared by every game. */
export function CardButton({ label, bg, border, text, face, disabled, onClick }: CardButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      className="flex min-h-[84px] flex-col items-center justify-center gap-1 rounded-3xl border-b-[7px] px-2 py-2 shadow-chunky transition-transform duration-100 active:translate-y-1.5 active:border-b-[2px] disabled:opacity-40"
      style={{ backgroundColor: bg, borderColor: border, color: text }}
    >
      {face}
      <span className="text-sm font-black tracking-wide" style={{ color: text }}>
        {label}
      </span>
    </button>
  );
}

interface Props {
  kind: CardKind;
  disabled?: boolean;
  onClick: () => void;
}

export function CommandCard({ kind, disabled, onClick }: Props) {
  const meta = CARD_META[kind];
  return (
    <CardButton
      label={meta.label}
      bg={meta.bg}
      border={meta.border}
      text={meta.text}
      face={<CardFace kind={kind} className="size-11 text-4xl" />}
      disabled={disabled}
      onClick={onClick}
    />
  );
}
