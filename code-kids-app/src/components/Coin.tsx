import { STAR_PATH } from './tiles';

interface Props {
  size?: number;
  className?: string;
}

/** A gold coin stamped with the same star the stages award, so "stars become coins" reads at a glance. */
export function CoinIcon({ size = 28, className }: Props) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden>
      <circle cx={50} cy={52} r={44} fill="#c98a0a" />
      <circle cx={50} cy={48} r={44} fill="#f7bf2a" />
      <circle cx={50} cy={48} r={33} fill="#ffd84d" stroke="#e3a514" strokeWidth={4} />
      <g transform="translate(15 13) scale(0.7)">
        <path d={STAR_PATH} fill="#fff4bf" stroke="#e3a514" strokeWidth={6} strokeLinejoin="round" />
      </g>
      <path d="M 24 30 A 30 30 0 0 1 44 18" fill="none" stroke="#fffbe6" strokeWidth={5} strokeLinecap="round" opacity={0.8} />
    </svg>
  );
}
