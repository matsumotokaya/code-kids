import React, { useState, useEffect } from 'react';
import { JUMP_LEVELS } from '../data/gameData';
import { playSound } from '../utils/audio';
import { Trophy, HelpCircle, Star, ArrowRight, RotateCcw, Award, CheckCircle2, ChevronRight, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function MathJump() {
  const [currentLevelIdx, setCurrentLevelIdx] = useState<number>(0);
  const activeLevel = JUMP_LEVELS[currentLevelIdx];
  
  const [currentValue, setCurrentValue] = useState<number>(activeLevel.startValue);
  const [moveHistory, setMoveHistory] = useState<{ prev: number; action: string; next: number }[]>([]);
  const [gameState, setGameState] = useState<'playing' | 'win' | 'fail'>('playing');

  // Reset when level changes
  useEffect(() => {
    resetLevel();
  }, [currentLevelIdx]);

  const resetLevel = () => {
    setCurrentValue(activeLevel.startValue);
    setMoveHistory([]);
    setGameState('playing');
    playSound.click();
  };

  const handleAction = (action: typeof activeLevel.allowedActions[number]) => {
    if (gameState !== 'playing') return;

    let nextValue = currentValue;
    const { operation, value, label } = action;

    if (operation === 'add') {
      nextValue = currentValue + value;
    } else if (operation === 'sub') {
      nextValue = currentValue - value;
    } else if (operation === 'mul') {
      nextValue = currentValue * value;
    } else if (operation === 'div') {
      // 5-year-old child should see exact divisions or rounded if they click.
      // We designed levels to match exact integers, but guard against decimals
      nextValue = Math.floor(currentValue / value);
    }

    // Add to history
    const historyItem = {
      prev: currentValue,
      action: label,
      next: nextValue
    };

    setMoveHistory([...moveHistory, historyItem]);
    setCurrentValue(nextValue);

    // Play springy jump sound
    playSound.jump();

    // Check result
    if (nextValue === activeLevel.targetValue) {
      setGameState('win');
      playSound.winLevel();
    } else if (moveHistory.length + 1 >= activeLevel.maxMoves || nextValue < 0 || nextValue > 20) {
      setGameState('fail');
      playSound.fail();
    }
  };

  const handleNextLevel = () => {
    if (currentLevelIdx < JUMP_LEVELS.length - 1) {
      setCurrentLevelIdx(currentLevelIdx + 1);
    } else {
      // Loop back to level 1 for endless playing!
      setCurrentLevelIdx(0);
    }
  };

  // Build the number line array (0 to 16)
  const lineNumbers = Array.from({ length: 17 }, (_, i) => i);

  return (
    <div id="math-jump-container" className="flex flex-col gap-6 bg-[#0d1525] border-2 border-emerald-500/30 p-6 rounded-3xl shadow-[0_4px_30px_rgba(0,0,0,0.5)] text-blue-100">
      
      {/* Header Level Metadata */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-blue-900/30 pb-4">
        <div>
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold px-3 py-1 text-[10px] tracking-widest rounded-full inline-block mb-1">
            🎯 LEVEL :: MATH_PI_JUMP
          </span>
          <h2 className="text-lg font-black text-white">
            れべる {activeLevel.id} / 5 : {activeLevel.startValue} から {activeLevel.targetValue} をめざそう！
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="jump-reset-btn"
            onClick={resetLevel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#16213e] hover:bg-[#1f2e54] text-blue-300 font-bold rounded-xl border border-blue-500/20 text-xs active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>やりなおす</span>
          </button>
        </div>
      </div>

      {/* Guide/Hint Box */}
      <div className="bg-[#0a0f18]/90 border border-emerald-500/20 rounded-2xl p-4 text-emerald-200 text-xs flex gap-3 items-start shadow-inner">
        <HelpCircle className="w-5 h-5 flex-shrink-0 text-emerald-400 animate-bounce" />
        <div>
          <p className="font-bold leading-relaxed">{activeLevel.hint}</p>
          <p className="text-[10px] text-emerald-500 mt-1">
            ※ボタンをおすと、その かずぶん ぴょーんとジャンプするよ！{activeLevel.maxMoves}かい いないに ぴったりのせよう！
          </p>
        </div>
      </div>

      {/* Math Visual Area (Timeline Container) */}
      <div className="bg-[#0a0f18] p-6 rounded-2xl border border-blue-900/40 relative overflow-x-auto select-none min-h-[160px] flex flex-col justify-center shadow-inner">
        
        {/* The Number Line Line */}
        <div className="relative w-full h-2.5 bg-emerald-800/20 rounded-full my-8">
          
          {/* Active target flag highlight */}
          <div
            className="absolute -top-12 h-12 flex flex-col items-center justify-center pointer-events-none transition-all duration-300"
            style={{ left: `${(activeLevel.targetValue / 16) * 100}%`, transform: 'translateX(-50%)' }}
          >
            <div className="bg-amber-400 text-slate-950 font-black rounded-full p-1.5 shadow-[0_0_12px_rgba(251,191,36,0.6)] animate-bounce">
              <Star className="w-5 h-5 fill-amber-300 stroke-slate-900" />
            </div>
            <div className="w-0.5 h-3 bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
          </div>

          {/* Player avatar jumping representation */}
          <motion.div
            className="absolute -top-8 w-10 h-10 flex items-center justify-center z-10"
            animate={{
              left: `${(currentValue / 16) * 100}%`,
              transform: 'translateX(-50%)'
            }}
            transition={{ type: 'spring', stiffness: 100, damping: 10 }}
          >
            <div className="relative">
              {/* Dynamic bounce cartoon effect jumping */}
              <motion.span
                className="text-4xl block cursor-default"
                animate={{ y: [0, -18, 0] }}
                transition={{
                  duration: 0.4,
                  repeat: 0,
                  ease: "easeInOut"
                }}
                key={currentValue}
              >
                🐸
              </motion.span>
              <div className="absolute -bottom-1 left-2.5 w-5 h-1 bg-black/50 blur-[1px] rounded-full animate-ping" />
            </div>
          </motion.div>

          {/* Render individual node circle notches */}
          {lineNumbers.map((num) => {
            const isTarget = num === activeLevel.targetValue;
            const isCurrent = num === currentValue;
            const hasPassed = moveHistory.some(h => h.next === num || h.prev === num);

            return (
              <div
                key={num}
                className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center"
                style={{ left: `${(num / 16) * 100}%` }}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] font-bold border transition-all duration-200
                    ${isCurrent 
                      ? 'bg-emerald-400 border-white text-slate-950 scale-125 z-10 ring-4 ring-emerald-400/35 shadow-[0_0_10px_rgba(52,211,153,0.5)]' 
                      : isTarget
                        ? 'bg-amber-400 border-amber-600 text-slate-950 font-black animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                        : hasPassed
                          ? 'bg-[#16213e] border-emerald-600/40 text-emerald-300'
                          : 'bg-[#05070a] border-blue-900/40 text-blue-400/80'
                    }`}
                >
                  {num}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Middle: Math Formula and History Log */}
      <div className="bg-[#0a0f18] border border-blue-900/40 p-4 rounded-xl flex items-center justify-between shadow-inner">
        <div>
          <span className="text-[10px] text-blue-500 font-mono uppercase tracking-wider block mb-1">しき (数式) の れきし:</span>
          {moveHistory.length === 0 ? (
            <span className="text-xs text-blue-400/60 font-bold">まだジャンプしてないよ。したのボタンをおそう！</span>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5 mt-1 text-sm font-black text-white">
              {moveHistory.map((item, index) => (
                <span key={index} className="flex items-center gap-1 bg-[#16213e]/60 px-2.5 py-1 rounded border border-blue-500/20 text-xs">
                  <span className="text-blue-300 font-normal font-mono">{item.prev}</span>
                  <span className="text-emerald-400 font-extrabold">{item.action}</span>
                  <span className="text-blue-500 font-mono">＝</span>
                  <span className="text-amber-300 font-mono font-bold">{item.next}</span>
                  {index < moveHistory.length - 1 && <ArrowRight className="w-3 h-3 text-emerald-400 mx-0.5" />}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="text-right">
          <span className="text-[10px] text-blue-500 font-mono uppercase tracking-wider block">JUMP_LIMIT</span>
          <span className="font-mono text-sm font-bold text-emerald-400">
            {activeLevel.maxMoves - moveHistory.length} / {activeLevel.maxMoves} REMAIN
          </span>
        </div>
      </div>

      {/* Underneath: Action Operations Box & Game States */}
      <div className="min-h-[100px] flex flex-col justify-center items-center">
        
        {/* GAME PLAYING STATE: Display Buttons to press */}
        {gameState === 'playing' && (
          <div className="w-full">
            <p className="text-[11px] text-center text-blue-400 mb-3 block">
              どの まほう を つかう？（タップすると ぴょーん！とうごくよ）:
            </p>
            <div className="flex justify-center gap-4">
              {activeLevel.allowedActions.map((act) => (
                <button
                  key={act.label}
                  id={`jump-act-${act.label}`}
                  onClick={() => handleAction(act)}
                  className="px-6 py-4 bg-gradient-to-b from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 text-slate-950 text-base font-black rounded-2xl shadow-lg transition-all active:scale-95 flex flex-col items-center gap-0.5 cursor-pointer leading-[1.1]"
                >
                  <span className="text-[9px] uppercase font-bold text-emerald-900 tracking-wider">
                    {act.operation === 'add' ? 'ぷらす' : act.operation === 'sub' ? 'まいなす' : act.operation === 'mul' ? 'かける' : 'わる'}
                  </span>
                  <span>{act.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* WIN MODAL STATE */}
        {gameState === 'win' && (
          <motion.div
            id="jump-win-banner"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full text-center max-w-md bg-emerald-950/80 border-2 border-amber-300 rounded-2xl p-5 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-2 right-2 flex gap-0.5">
              <Award className="w-8 h-8 text-amber-300 animate-spin" />
            </div>
            
            <h3 className="text-xl font-black text-amber-300 mb-1 flex items-center justify-center gap-1.5">
              🎉 ぴったり おほしさま！ 🎉
            </h3>
            <p className="text-xs text-emerald-200 font-bold leading-relaxed">
              すごい！ぴったり {activeLevel.targetValue} に とうちゃくできたよ！たしざん、ひきざんのまほう だいせいこう！
            </p>

            {/* Display final equation */}
            <div className="my-3 py-1.5 px-3 bg-[#05070a] border border-emerald-500/30 rounded-lg inline-block text-xs text-amber-200 font-mono">
              できたしき: {activeLevel.startValue} {'↳'} ... {'↳'} <span className="font-bold text-amber-300 text-sm">{currentValue}</span> 💖
            </div>

            <button
              id="jump-next-level-btn"
              onClick={handleNextLevel}
              className="w-full mt-2 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl border-b-4 border-amber-600 active:border-b-0 active:translate-y-0.5 transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>つぎのレベルへすすむ！</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* LOSE/FAIL STATE */}
        {gameState === 'fail' && (
          <motion.div
            id="jump-fail-banner"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full text-center max-w-sm bg-rose-950/70 border border-rose-500/40 rounded-2xl p-5"
          >
            <h3 className="text-base font-black text-rose-300 mb-1">
              あれれ？おほしさまに あわなかったよ 💦
            </h3>
            <p className="text-xs text-rose-200 mb-3 font-bold leading-relaxed">
              いくさきが 「{currentValue}」 になっちゃった！もういちど しきをかんがえて チャレンジしよう！
            </p>
            <button
              id="jump-retry-btn"
              onClick={resetLevel}
              className="w-full py-2.5 bg-rose-500 hover:bg-rose-400 text-white font-black text-xs rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>もういっかい チャレンジ！</span>
            </button>
          </motion.div>
        )}

      </div>
    </div>
  );
}
