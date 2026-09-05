import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Tone = 'green' | 'yellow' | 'white' | 'red' | 'blue';

const TONES: Record<Tone, string> = {
  green: 'bg-play border-play-dark text-white',
  yellow: 'bg-sun border-sun-dark text-ink',
  white: 'bg-white border-[#d8cbb4] text-ink',
  red: 'bg-[#ff7a7a] border-[#c94f4f] text-white',
  blue: 'bg-[#6cb8ea] border-[#3b6ea8] text-white',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: Tone;
  children: ReactNode;
}

export function BigButton({ tone = 'green', className = '', children, ...rest }: Props) {
  return (
    <button
      {...rest}
      className={`inline-flex min-h-16 min-w-16 items-center justify-center gap-2 rounded-2xl border-b-[6px] px-6 py-3 text-xl font-black shadow-chunky transition-transform duration-100 active:translate-y-1.5 active:border-b-[2px] disabled:pointer-events-none disabled:opacity-40 ${TONES[tone]} ${className}`}
    >
      {children}
    </button>
  );
}

interface IconProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: Tone;
  label: string;
  children: ReactNode;
}

export function IconButton({ tone = 'white', label, className = '', children, ...rest }: IconProps) {
  return (
    <button
      {...rest}
      aria-label={label}
      title={label}
      className={`inline-flex size-14 items-center justify-center rounded-full border-b-[5px] shadow-chunky transition-transform duration-100 active:translate-y-1 active:border-b-[1px] disabled:pointer-events-none disabled:opacity-40 ${TONES[tone]} ${className}`}
    >
      {children}
    </button>
  );
}
