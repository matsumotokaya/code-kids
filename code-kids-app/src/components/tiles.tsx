export const CELL = 100;

export function starPath(cx: number, cy: number, outer: number, inner: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return `M ${pts.join(' L ')} Z`;
}

export const STAR_PATH = starPath(50, 50, 30, 13);

export function GrassTile({ x, y }: { x: number; y: number }) {
  const dark = (x + y) % 2 === 1;
  const tuft = (x * 7 + y * 13) % 5 === 0;
  return (
    <g transform={`translate(${x * CELL} ${y * CELL})`}>
      <rect x={3} y={3} width={94} height={94} rx={16} fill={dark ? '#7ccb5c' : '#8fd66a'} />
      {tuft && (
        <g stroke="#5fae45" strokeWidth={3} strokeLinecap="round" opacity={0.7}>
          <line x1={28} y1={70} x2={26} y2={60} />
          <line x1={34} y1={71} x2={35} y2={61} />
          <line x1={40} y1={70} x2={43} y2={62} />
        </g>
      )}
    </g>
  );
}

export function WaterTile({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x * CELL} ${y * CELL})`}>
      <rect x={3} y={3} width={94} height={94} rx={16} fill="#5dc2f5" />
      <rect x={3} y={3} width={94} height={94} rx={16} fill="url(#water-shine)" />
      <g className="anim-wave" fill="none" stroke="#d9f4ff" strokeWidth={4.5} strokeLinecap="round" opacity={0.9}>
        <path d="M 18 40 q 9 -9 18 0 t 18 0" />
        <path d="M 32 66 q 9 -9 18 0 t 18 0" />
      </g>
    </g>
  );
}

export function RockTile({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x * CELL} ${y * CELL})`}>
      <ellipse cx={50} cy={80} rx={34} ry={9} fill="#000" opacity={0.18} />
      <path
        d="M 22 74 C 12 58, 18 34, 36 26 C 50 18, 74 22, 82 40 C 90 58, 82 76, 66 80 C 52 84, 32 84, 22 74 Z"
        fill="#aaa39b"
        stroke="#6f675f"
        strokeWidth={3.5}
        strokeLinejoin="round"
      />
      <path d="M 34 36 C 42 28, 58 28, 66 36" fill="none" stroke="#e5e0d8" strokeWidth={5} strokeLinecap="round" opacity={0.85} />
      <circle cx={62} cy={58} r={5} fill="#8d867e" />
      <circle cx={38} cy={62} r={3.5} fill="#8d867e" />
    </g>
  );
}

export function StartPad({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x * CELL} ${y * CELL})`}>
      <rect x={13} y={13} width={74} height={74} rx={18} fill="#ffffff" opacity={0.28} />
      <rect x={13} y={13} width={74} height={74} rx={18} fill="none" stroke="#ffffff" strokeWidth={3} strokeDasharray="10 8" opacity={0.7} />
    </g>
  );
}

export function StarPiece() {
  return (
    <g className="anim-float">
      <circle cx={50} cy={52} r={34} fill="#fff4b8" opacity={0.55} />
      <path d={STAR_PATH} fill="#ffd84d" stroke="#d9a92a" strokeWidth={3.5} strokeLinejoin="round" />
      <path d={starPath(50, 50, 16, 7)} fill="#fff1a8" opacity={0.7} />
    </g>
  );
}

export function TrailDot({ x, y }: { x: number; y: number }) {
  return <circle cx={x * CELL + 50} cy={y * CELL + 52} r={8} fill="#ffffff" opacity={0.55} />;
}

export function SvgDefs() {
  return (
    <defs>
      <linearGradient id="water-shine" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffffff" stopOpacity={0.35} />
        <stop offset="0.6" stopColor="#ffffff" stopOpacity={0} />
      </linearGradient>
    </defs>
  );
}
