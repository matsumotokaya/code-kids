const CLOUDS = [
  { top: '6%', scale: 1.1, duration: 95, delay: -10 },
  { top: '16%', scale: 0.7, duration: 120, delay: -60 },
  { top: '28%', scale: 0.9, duration: 105, delay: -35 },
  { top: '40%', scale: 0.6, duration: 140, delay: -90 },
];

export function Sky() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-16 right-8 size-64 rounded-full bg-[#fff3b0] opacity-70 blur-3xl" />
      <div className="absolute top-6 right-14 size-24 rounded-full bg-sun shadow-[0_0_60px_18px_rgba(255,216,77,0.45)]" />
      {CLOUDS.map((c, i) => (
        <div
          key={i}
          className="anim-drift absolute left-0"
          style={{
            top: c.top,
            animationDuration: `${c.duration}s`,
            animationDelay: `${c.delay}s`,
            transform: `scale(${c.scale})`,
          }}
        >
          <div className="relative h-14 w-44" style={{ transform: `scale(${c.scale})` }}>
            <div className="absolute bottom-0 left-0 h-12 w-44 rounded-full bg-white/90" />
            <div className="absolute bottom-4 left-8 size-20 rounded-full bg-white/90" />
            <div className="absolute bottom-3 left-24 size-14 rounded-full bg-white/90" />
          </div>
        </div>
      ))}
      <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 220" preserveAspectRatio="none">
        <path d="M0 140 C 240 60, 420 200, 720 120 S 1200 40, 1440 130 L1440 220 L0 220 Z" fill="#a8e08a" />
        <path d="M0 190 C 300 120, 540 230, 860 170 S 1250 120, 1440 190 L1440 220 L0 220 Z" fill="#8fd66a" />
      </svg>
    </div>
  );
}
