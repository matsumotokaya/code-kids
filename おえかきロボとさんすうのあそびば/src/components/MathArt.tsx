import React, { useState, useEffect, useRef } from 'react';
import { playSound } from '../utils/audio';
import { Sparkles, Play, Pause, RefreshCw, Layers, Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface MathArtPreset {
  name: string;
  emoji: string;
  points: number;
  multiplier: number;
  colorTheme: string;
  description: string;
}

const PRESETS: MathArtPreset[] = [
  {
    name: 'きらきら星',
    emoji: '⭐',
    points: 5,
    multiplier: 2,
    colorTheme: 'rainbow',
    description: 'ごかくけい の おほしさま！'
  },
  {
    name: 'まほうの花',
    emoji: '🌸',
    points: 8,
    multiplier: 3,
    colorTheme: 'cyan',
    description: 'はなびら の ような もよう！'
  },
  {
    name: 'にじの太陽',
    emoji: '☀️',
    points: 16,
    multiplier: 7,
    colorTheme: 'orange',
    description: 'ぐるぐる まわる たいよう！'
  },
  {
    name: 'うちゅうワープ',
    emoji: '🌀',
    points: 24,
    multiplier: 11,
    colorTheme: 'pink',
    description: 'うちゅう の ブラックホール！'
  }
];

const COLOR_PALETTES: { [key: string]: string[] } = {
  rainbow: ['#FF1493', '#00FFFF', '#FFD700', '#32CD32', '#9370DB', '#FF4500'],
  cyan: ['#E0FFFF', '#00FFFF', '#7FFFD4', '#40E0D0', '#20B2AA', '#008B8B'],
  orange: ['#FF4500', '#FF8C00', '#FFA500', '#FFD700', '#FFFF00', '#FF6347'],
  pink: ['#FF00FF', '#FF1493', '#FF69B4', '#EE82EE', '#DA70D6', '#BA55D3']
};

export default function MathArt() {
  const [points, setPoints] = useState<number>(5);
  const [multiplier, setMultiplier] = useState<number>(2);
  const [speed, setSpeed] = useState<number>(2); // 0 (stop) to 5
  const [lineWidth, setLineWidth] = useState<number>(3);
  const [theme, setTheme] = useState<string>('rainbow');
  const [isRotating, setIsRotating] = useState<boolean>(true);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [angle, setAngle] = useState<number>(0);
  const requestRef = useRef<number | null>(null);

  // Apply a preset configuration
  const applyPreset = (preset: MathArtPreset) => {
    playSound.success();
    setPoints(preset.points);
    setMultiplier(preset.multiplier);
    setTheme(preset.colorTheme);
  };

  // Adjust parameters with sound feedback
  const changePoints = (amount: number) => {
    const next = Math.max(3, Math.min(60, points + amount));
    if (next !== points) {
      setPoints(next);
      playSound.click();
    }
  };

  const changeMultiplier = (amount: number) => {
    const next = Math.max(1, Math.min(30, multiplier + amount));
    if (next !== multiplier) {
      setMultiplier(next);
      playSound.laser();
    }
  };

  const changeLineWidth = (amount: number) => {
    const next = Math.max(1, Math.min(10, lineWidth + amount));
    if (next !== lineWidth) {
      setLineWidth(next);
      playSound.click();
    }
  };

  // Canvas Drawing Loop
  useEffect(() => {
    let lastTime = 0;
    
    const draw = (timestamp: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Handle ResizeObserver or fixed internal coordinate size
      const width = canvas.width;
      const height = canvas.height;
      
      // Clear canvas
      ctx.fillStyle = '#0f172a'; // Deep cosmic indigo dark slate
      ctx.fillRect(0, 0, width, height);
      
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(centerX, centerY) * 0.82;
      
      // Calculate current rotation angle
      let currentAngle = angle;
      if (isRotating && speed > 0) {
        const delta = timestamp - (lastTime || timestamp);
        // Rotation speed based on speed setting
        currentAngle += (0.0005 * speed * delta) % (Math.PI * 2);
        setAngle(currentAngle);
      }
      lastTime = timestamp;

      // Compute visual node points on the circle circumference
      const nodes: { x: number; y: number }[] = [];
      for (let i = 0; i < points; i++) {
        const theta = (i * 2 * Math.PI) / points + currentAngle;
        nodes.push({
          x: centerX + radius * Math.cos(theta),
          y: centerY + radius * Math.sin(theta)
        });
      }

      // Draw subtle background dots/connectors for nodes
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      nodes.forEach((node) => {
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw mathematical connection lines
      // Point i connects to (i * multiplier) % points
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      
      const colors = COLOR_PALETTES[theme] || COLOR_PALETTES.rainbow;
      
      for (let i = 0; i < points; i++) {
        const targetIdx = Math.floor((i * multiplier) % points);
        const startNode = nodes[i];
        const endNode = nodes[targetIdx];
        
        if (startNode && endNode) {
          // Gradient or colorful stroke change per line to look rich/beautiful!
          ctx.strokeStyle = colors[i % colors.length];
          // Glow effect slightly
          ctx.shadowBlur = 4;
          ctx.shadowColor = colors[i % colors.length];
          
          ctx.beginPath();
          ctx.moveTo(startNode.x, startNode.y);
          ctx.lineTo(endNode.x, endNode.y);
          ctx.stroke();
        }
      }
      // Reset shadow for performance
      ctx.shadowBlur = 0;

      // Draw center circle or cute core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
      ctx.fill();

      requestRef.current = requestAnimationFrame(draw);
    };

    requestRef.current = requestAnimationFrame(draw);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [points, multiplier, isRotating, speed, lineWidth, theme, angle]);

  return (
    <div id="math-art-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-900 border-4 border-amber-400 p-6 rounded-3xl shadow-xl text-white">
      
      {/* Visual Canvas Box */}
      <div className="lg:col-span-7 flex flex-col items-center justify-between bg-slate-950 p-4 rounded-2xl border-2 border-slate-700 relative overflow-hidden">
        
        {/* Floating details tag */}
        <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-full border border-slate-700 flex items-center gap-1.5 text-xs text-amber-300">
          <Sparkles className="w-4.5 h-4.5 animate-spin" />
          <span className="font-mono text-xs">{points} かど × {multiplier} ばい</span>
        </div>

        {/* The Live Interactive Canvas */}
        <div className="w-full flex justify-center items-center my-2">
          <canvas
            id="math-art-canvas"
            ref={canvasRef}
            width={480}
            height={480}
            className="w-full max-w-[420px] aspect-square rounded-full border-4 border-indigo-500/40 bg-slate-950 shadow-2xl transition-transform"
          />
        </div>

        {/* Explain sentence for kids */}
        <div className="w-full text-center bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs text-sky-200 mt-2">
          💡 <span className="font-bold text-amber-300">{points}</span> つの点を、
          <span className="font-bold text-emerald-400">{multiplier}</span>
          ばいのばしょに「つなぐ」と、この『まほうの かたち』が できるよ！
        </div>
      </div>

      {/* Control Box Dashboard */}
      <div className="lg:col-span-5 flex flex-col justify-between gap-5 bg-slate-900 p-2 rounded-2xl">
        
        {/* Presets Cards */}
        <div>
          <h3 className="text-sm font-semibold text-amber-300 mb-2 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-300" />
            <span>どれであそぶ？ココをタップ！</span>
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                id={`preset-${p.name}`}
                onClick={() => applyPreset(p)}
                className="flex flex-col items-center justify-center p-2.5 bg-slate-800 hover:bg-slate-700 border-2 border-transparent active:border-indigo-400 rounded-xl transition-all cursor-pointer text-center group"
              >
                <span className="text-2xl mb-1 group-hover:scale-125 transition-transform">{p.emoji}</span>
                <span className="font-bold text-xs block mb-0.5">{p.name}</span>
                <span className="text-[10px] text-slate-400 leading-none">{p.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Slider control 1: Points (かどの数) */}
        <div className="bg-slate-800/80 p-3.5 rounded-xl border-2 border-indigo-500/30">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-indigo-300 font-bold">● てんの かず (角の数) 🔵</span>
            <span className="bg-indigo-600 text-white font-mono text-xs px-2.5 py-0.5 rounded-full font-bold">
              {points}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              id="points-minus-btn"
              onClick={() => changePoints(-1)}
              className="w-10 h-10 bg-indigo-600 active:bg-indigo-700 hover:scale-105 active:scale-90 text-xl font-black rounded-lg flex items-center justify-center select-none"
            >
              −
            </button>
            <input
              type="range"
              min={3}
              max={40}
              step={1}
              value={points}
              onChange={(e) => {
                setPoints((parseInt(e.target.value)) || 5);
                playSound.click();
              }}
              className="flex-1 accent-indigo-400"
            />
            <button
              id="points-plus-btn"
              onClick={() => changePoints(1)}
              className="w-10 h-10 bg-indigo-600 active:bg-indigo-700 hover:scale-105 active:scale-90 text-xl font-black rounded-lg flex items-center justify-center select-none"
            >
              ＋
            </button>
          </div>
        </div>

        {/* Slider control 2: Multiplier (かけ算) */}
        <div className="bg-slate-800/80 p-3.5 rounded-xl border-2 border-emerald-500/30">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-emerald-300 font-bold">● かけざんの まほう (倍率) 🟢</span>
            <span className="bg-emerald-600 text-white font-mono text-xs px-2.5 py-0.5 rounded-full font-bold">
              {multiplier} ばい
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="mul-minus-btn"
              onClick={() => changeMultiplier(-1)}
              className="w-10 h-10 bg-emerald-600 active:bg-emerald-700 hover:scale-105 active:scale-90 text-xl font-black rounded-lg flex items-center justify-center select-none"
            >
              −
            </button>
            <input
              type="range"
              min={1}
              max={15}
              step={1}
              value={multiplier}
              onChange={(e) => {
                setMultiplier((parseInt(e.target.value)) || 2);
                playSound.laser();
              }}
              className="flex-1 accent-emerald-400"
            />
            <button
              id="mul-plus-btn"
              onClick={() => changeMultiplier(1)}
              className="w-10 h-10 bg-emerald-600 active:bg-emerald-700 hover:scale-105 active:scale-90 text-xl font-black rounded-lg flex items-center justify-center select-none"
            >
              ＋
            </button>
          </div>
        </div>

        {/* Secondary controls Row */}
        <div className="grid grid-cols-2 gap-3 bg-slate-800/40 p-2.5 rounded-xl border border-slate-700">
          
          {/* Tone Selector */}
          <div>
            <label className="text-[10px] text-slate-400 font-bold block mb-1">■ いろ・テーマ 🎨</label>
            <select
              id="color-theme-select"
              value={theme}
              onChange={(e) => {
                setTheme(e.target.value);
                playSound.click();
              }}
              className="w-full text-xs font-bold bg-slate-750 border border-slate-600 rounded px-2 py-1.5 focus:outline-none"
            >
              <option value="rainbow">にじいろ 🌈</option>
              <option value="cyan">びびっどブルー 💎</option>
              <option value="orange">あか・おれんじ ☀️</option>
              <option value="pink">まほうのピンク 🔮</option>
            </select>
          </div>

          {/* Speed Indicator / Switch */}
          <div>
            <label className="text-[10px] text-slate-400 font-bold block mb-1">■ スピード（うごき） 🚀</label>
            <div className="flex bg-slate-700/60 p-0.5 rounded border border-slate-600">
              <button
                id="art-play-pause-btn"
                onClick={() => {
                  setIsRotating(!isRotating);
                  playSound.click();
                }}
                className={`flex-1 flex justify-center items-center py-1 text-xs font-bold rounded ${isRotating ? 'bg-amber-500 text-slate-900' : 'bg-slate-800 text-slate-300'}`}
              >
                {isRotating ? <Pause className="w-3.5 h-3.5 mr-0.5" /> : <Play className="w-3.5 h-3.5 mr-0.5" />}
                {isRotating ? 'うごく' : 'とまる'}
              </button>
            </div>
          </div>
        </div>

        {/* Manual Reset Angle */}
        <div className="flex justify-between items-center text-[11px] text-slate-400">
          <span>くるくるまわして、かずのハーモニーをたのしもう！</span>
          <button
            id="art-reset-angle-btn"
            onClick={() => {
              setAngle(0);
              playSound.click();
            }}
            className="text-amber-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>むきを リセット</span>
          </button>
        </div>

      </div>
    </div>
  );
}
