import type { CardKind, Dir } from '../game/types';

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

interface Props {
  kind: CardKind;
  disabled?: boolean;
  onClick: () => void;
}

export function CommandCard({ kind, disabled, onClick }: Props) {
  const meta = CARD_META[kind];
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={meta.label}
      className="flex min-h-[84px] flex-col items-center justify-center gap-1 rounded-3xl border-b-[7px] px-2 py-2 shadow-chunky transition-transform duration-100 active:translate-y-1.5 active:border-b-[2px] disabled:opacity-40"
      style={{ backgroundColor: meta.bg, borderColor: meta.border, color: meta.text }}
    >
      <CardFace kind={kind} className="size-11 text-4xl" />
      <span className="text-sm font-black tracking-wide" style={{ color: meta.text }}>
        {meta.label}
      </span>
    </button>
  );
}
