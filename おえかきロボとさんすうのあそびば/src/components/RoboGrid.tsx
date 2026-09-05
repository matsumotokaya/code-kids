import React, { useState, useEffect } from 'react';
import { ROBO_LEVELS } from '../data/gameData';
import { CommandType, CommandBlock, GridCell } from '../types';
import { playSound } from '../utils/audio';
import { Play, RotateCcw, Trash2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Zap, Star, ShieldAlert, CheckCircle, ChevronRight, HelpCircle, CornerDownRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function RoboGrid() {
  const [currentLevelIdx, setCurrentLevelIdx] = useState<number>(0);
  const activeLevel = ROBO_LEVELS[currentLevelIdx];

  const [queue, setQueue] = useState<CommandBlock[]>([]);
  const [currentRoboPos, setCurrentRoboPos] = useState<{ x: number; y: number }>({ x: activeLevel.startX, y: activeLevel.startY });
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [activeStepIdx, setActiveStepIdx] = useState<number | null>(null);
  const [robotDirection, setRobotDirection] = useState<'RIGHT' | 'LEFT' | 'UP' | 'DOWN'>('RIGHT');
  const [executionHistory, setExecutionHistory] = useState<{ x: number; y: number }[]>([]);
  const [gameState, setGameState] = useState<'idle' | 'executing' | 'success' | 'failed'>('idle');
  const [failReason, setFailReason] = useState<string>('');

  // Reset work space and position when level changes
  useEffect(() => {
    resetRobo();
  }, [currentLevelIdx]);

  const resetRobo = () => {
    setIsExecuting(false);
    setActiveStepIdx(null);
    setCurrentRoboPos({ x: activeLevel.startX, y: activeLevel.startY });
    setExecutionHistory([{ x: activeLevel.startX, y: activeLevel.startY }]);
    setRobotDirection('RIGHT');
    setGameState('idle');
    setFailReason('');
  };

  const handleClearQueue = () => {
    if (isExecuting) return;
    setQueue([]);
    resetRobo();
    playSound.click();
  };

  const handleAddCommand = (type: CommandType) => {
    if (isExecuting) return;
    if (queue.length >= activeLevel.maxCommands) {
      playSound.fail();
      return;
    }
    const newBlock: CommandBlock = {
      id: Math.random().toString(36).substring(2, 9),
      type
    };
    setQueue([...queue, newBlock]);
    playSound.click();
  };

  const handleRemoveCommand = (id: string) => {
    if (isExecuting) return;
    setQueue(queue.filter((item) => item.id !== id));
    playSound.click();
  };

  const getCellAt = (x: number, y: number): GridCell | undefined => {
    // Coordinate limits
    if (x < 0 || x >= activeLevel.gridSize || y < 0 || y >= activeLevel.gridSize) {
      return undefined;
    }
    const levelCell = activeLevel.cells.find((c) => c.x === x && c.y === y);
    if (levelCell) return levelCell;
    
    // Default empty cell
    return { x, y, type: 'empty' };
  };

  // Robot Animation Step Executor
  const startSimulation = async () => {
    if (isExecuting || queue.length === 0) return;
    
    setIsExecuting(true);
    setGameState('executing');
    setExecutionHistory([{ x: activeLevel.startX, y: activeLevel.startY }]);
    
    let currentX = activeLevel.startX;
    let currentY = activeLevel.startY;
    let failed = false;

    // Sequential simulation step by step
    for (let index = 0; index < queue.length; index++) {
      setActiveStepIdx(index);
      const command = queue[index];

      // Delay between steps to make it highly visual
      await new Promise((resolve) => setTimeout(resolve, 800));

      let stepSizeX = 0;
      let stepSizeY = 0;

      // Handle custom block logic mathematically
      switch (command.type) {
        case 'RIGHT':
          stepSizeX = 1;
          setRobotDirection('RIGHT');
          playSound.click();
          break;
        case 'LEFT':
          stepSizeX = -1;
          setRobotDirection('LEFT');
          playSound.click();
          break;
        case 'UP':
          stepSizeY = -1; // grid index goes down
          setRobotDirection('UP');
          playSound.click();
          break;
        case 'DOWN':
          stepSizeY = 1; // grid index goes up
          setRobotDirection('DOWN');
          playSound.click();
          break;
        case 'DOUBLE':
          // +2 Jump! Rightward
          stepSizeX = 2;
          setRobotDirection('RIGHT');
          playSound.laser();
          break;
        case 'TRIPLE':
          // Boost 3 steps!
          stepSizeX = 3;
          setRobotDirection('RIGHT');
          playSound.laser();
          break;
      }

      currentX += stepSizeX;
      currentY += stepSizeY;

      // Update robot path trackers
      setCurrentRoboPos({ x: currentX, y: currentY });
      setExecutionHistory((prev) => [...prev, { x: currentX, y: currentY }]);

      // Boundary crash check
      if (currentX < 0 || currentX >= activeLevel.gridSize || currentY < 0 || currentY >= activeLevel.gridSize) {
        failed = true;
        setFailReason('マップの そとに でちゃったよ！コースアウトです💦');
        setGameState('failed');
        playSound.fail();
        break;
      }

      // Cell obstacle / puddle check
      const cell = getCellAt(currentX, currentY);
      if (cell && (cell.type === 'obstacle' || cell.type === 'puddle')) {
        failed = true;
        const emoji = cell.type === 'puddle' ? 'みずたまり 💧' : 'カベ 🧱';
        setFailReason(`あっ！【${emoji}】にてきとうに ぶつかっちゃった！`);
        setGameState('failed');
        playSound.fail();
        break;
      }
    }

    if (!failed) {
      // Check if robot successfully landed on the star target
      if (currentX === activeLevel.targetX && currentY === activeLevel.targetY) {
        setGameState('success');
        playSound.winLevel();
      } else {
        setGameState('failed');
        setFailReason('しれい がおわったけど、おほしさまに とどかなかったよ。');
        playSound.fail();
      }
    }
    
    setIsExecuting(false);
    setActiveStepIdx(null);
  };

  const handleNextLevel = () => {
    if (currentLevelIdx < ROBO_LEVELS.length - 1) {
      setCurrentLevelIdx(currentLevelIdx + 1);
    } else {
      setCurrentLevelIdx(0); // wrap round
    }
  };

  // Render Command Icon helpers
  const getCommandEmojiAndStyle = (type: CommandType) => {
    switch (type) {
      case 'RIGHT':
        return { emoji: '→ +1', desc: 'みぎに 1マス', color: 'bg-indigo-500 border-indigo-700 text-white' };
      case 'LEFT':
        return { emoji: '← -1', desc: 'ひだりに 1マス', color: 'bg-sky-500 border-sky-700 text-white' };
      case 'UP':
        return { emoji: '↑ +1', desc: 'うえに 1マス', color: 'bg-violet-500 border-violet-700 text-white' };
      case 'DOWN':
        return { emoji: '↓ -1', desc: 'したに 1マス', color: 'bg-fuchsia-500 border-fuchsia-700 text-white' };
      case 'DOUBLE':
        return { emoji: '→ +2', desc: 'みぎに ＋2！', color: 'bg-emerald-500 border-emerald-700 text-slate-950 font-bold' };
      case 'TRIPLE':
        return { emoji: '🚀 ×3', desc: 'みぎに 1×3！', color: 'bg-amber-500 border-amber-700 text-slate-950 font-black' };
    }
  };

  return (
    <div id="robo-grid-manager" className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#0d1525] border-2 border-cyan-500/30 p-6 rounded-3xl shadow-[0_4px_30px_rgba(0,0,0,0.5)] text-blue-100">
      
      {/* Header Info */}
      <div className="lg:col-span-12 flex flex-wrap items-center justify-between border-b border-blue-900/30 pb-3 gap-2">
        <div>
          <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-3 py-1 font-mono font-bold text-[10px] tracking-widest rounded-full inline-block mb-1">
            🤖 COMMAND_MODULE :: ROBO_GRID
          </span>
          <h2 className="text-lg font-black text-white">
            {activeLevel.title}
          </h2>
        </div>
        <div className="flex gap-2 text-xs">
          <button
            id="robo-restart-board-btn"
            onClick={resetRobo}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#16213e] hover:bg-[#1f2e54] font-bold rounded-xl border border-blue-500/20 text-blue-300 active:scale-95 cursor-pointer text-xs"
          >
            <RotateCcw className="w-4 h-4" />
            <span>しきりなおす</span>
          </button>
        </div>
      </div>

      {/* Level Mission Hint Banner */}
      <div className="lg:col-span-12 bg-[#0a0f18]/90 border border-cyan-500/20 rounded-2xl p-4 text-xs font-bold leading-relaxed flex gap-3 text-cyan-200 shadow-inner">
        <HelpCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 animate-bounce" />
        <p>{activeLevel.hint}</p>
      </div>

      {/* LEFT COLUMN: Programming Queue Creator */}
      <div className="lg:col-span-15 bg-[#0d1525]/40 p-1 rounded-2xl lg:col-span-5 flex flex-col justify-between gap-5">
        
        {/* Commands Card Deck */}
        <div className="bg-[#16213e]/30 border border-blue-900/30 p-4 rounded-2xl">
          <h3 className="text-xs font-bold text-blue-400 mb-2.5 flex items-center gap-1">
            <span>しれいカード（えらんで タップしてね）:</span>
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {activeLevel.availableCommands.map((type) => {
              const meta = getCommandEmojiAndStyle(type);
              return (
                <button
                  key={type}
                  id={`cmdcard-${type}`}
                  disabled={isExecuting}
                  onClick={() => handleAddCommand(type)}
                  className={`flex flex-col items-center justify-center p-2.5 border-b-4 rounded-xl cursor-pointer hover:scale-105 active:scale-95 transition-all
                    ${meta.color} ${isExecuting ? 'opacity-40 cursor-not-allowed' : ''}
                  `}
                >
                  <span className="text-xl font-bold">{meta.emoji}</span>
                  <span className="text-[10px] opacity-95 mt-0.5 leading-none">{meta.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Command Queue Box */}
        <div className="bg-[#0a0f18] p-4 rounded-xl border border-blue-900/40 min-h-[140px] flex flex-col justify-between shadow-inner">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-cyan-400 font-mono block font-bold tracking-wider">● [QUEUE] しれいばこ 📬</span>
            <span className="text-[10px] text-blue-500 font-mono">
              {queue.length} / {activeLevel.maxCommands} COUNTER
            </span>
          </div>

          <div className="flex flex-wrap gap-2 items-center my-3">
            {queue.length === 0 ? (
              <div className="text-[11px] text-blue-400/60 font-bold py-6 text-center w-full">
                カードをならべて、ロボのプログラムをつくろう！
              </div>
            ) : (
              queue.map((block, idx) => {
                const meta = getCommandEmojiAndStyle(block.type);
                const isActive = idx === activeStepIdx;
                return (
                  <div
                    key={block.id}
                    className={`relative flex items-center justify-between px-3 py-1.5 rounded-lg border-b-3 text-xs font-bold gap-2 animate-fade-in
                      ${meta.color} ${isActive ? 'ring-4 ring-amber-400 animate-pulse' : ''}
                    `}
                  >
                    <span className="text-[9px] bg-slate-900/30 w-4 h-4 rounded-full flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span>{meta.emoji.split(' ')[0]}</span>
                    
                    {!isExecuting && (
                      <button
                        id={`delete-cmd-btn-${block.id}`}
                        onClick={() => handleRemoveCommand(block.id)}
                        className="text-slate-900/60 hover:text-red-500 ml-1 font-black cursor-pointer bg-white/20 hover:bg-white p-0.5 rounded"
                      >
                        か
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Action Row */}
          <div className="flex gap-2">
            <button
              id="clear-cmd-queue-btn"
              disabled={isExecuting || queue.length === 0}
              onClick={handleClearQueue}
              className="flex-1 py-2 rounded-xl bg-[#16213e] border border-blue-500/20 font-bold text-xs hover:bg-slate-850 text-blue-300 transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5 text-blue-400" />
              <span>ぜんぶ けす</span>
            </button>
            
            <button
              id="run-robo-btn"
              disabled={isExecuting || queue.length === 0 || gameState === 'success'}
              onClick={startSimulation}
              className="flex-1 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer hover:scale-103 transition-all border-b-3 border-cyan-800 disabled:opacity-45"
            >
              <Play className="w-4 h-4" />
              <span>ロボうごかす！</span>
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Interactive Grid */}
      <div className="lg:col-span-7 flex flex-col items-center justify-center bg-[#0a0f18] p-4 rounded-2xl border border-blue-900/40 relative select-none shadow-inner">
        <div className="absolute inset-x-0 top-0 h-full opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#22d3ee 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }}></div>
        
        {/* Game Map Map Grid */}
        <div
          className="grid gap-1 bg-[#05070a] p-2.5 border border-blue-900/60 rounded-2xl shadow-2xl max-w-full relative z-10"
          style={{
            gridTemplateColumns: `repeat(${activeLevel.gridSize}, minmax(0, 1fr))`,
            width: '320px',
            height: '320px'
          }}
        >
          {Array.from({ length: activeLevel.gridSize }).map((_, row) => (
            Array.from({ length: activeLevel.gridSize }).map((_, col) => {
              const cell = getCellAt(col, row);
              const isRobotHere = currentRoboPos.x === col && currentRoboPos.y === row;
              
              // Find if this tile lies in the rainbow trailing execution history
              const isTrail = executionHistory.some((hist) => hist.x === col && hist.y === row);
              
              return (
                <div
                  key={`${col}-${row}`}
                  className={`relative flex items-center justify-center rounded-lg border text-sm transition-all duration-300
                    ${isRobotHere 
                      ? 'bg-[#16213e] border-cyan-400 z-10 shadow-[0_0_15px_rgba(34,211,238,0.4)]' 
                      : isTrail
                        ? 'bg-gradient-to-br from-indigo-950/80 to-blue-950/80 border-cyan-500/30 text-cyan-300 shadow-inner'
                        : 'bg-[#0a0f18]/80 border-blue-950 text-blue-900'
                    }`}
                >
                  
                  {/* Subtle small dot indicators */}
                  <div className="absolute right-1 top-1 text-[8px] font-mono text-blue-700/60 leading-none">
                    {col},{row}
                  </div>

                  {/* Draw rainbow path tail block */}
                  {isTrail && !isRobotHere && (
                    <div className="absolute bottom-1 w-2.5 h-1.5 bg-gradient-to-r from-cyan-400 to-indigo-400 rounded-full animate-pulse shadow-[0_0_8px_#22d3ee]" />
                  )}

                  {/* Render content: Robot or Level Asset */}
                  {isRobotHere && (
                    <motion.div
                      className="text-4xl select-none"
                      animate={{
                        scale: [1, 1.15, 1],
                        rotate: robotDirection === 'RIGHT' ? 0 : robotDirection === 'LEFT' ? 185 : robotDirection === 'UP' ? -90 : 90
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      🤖
                    </motion.div>
                  )}

                  {!isRobotHere && cell?.type === 'star' && (
                    <div className="text-3xl animate-bounce drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]">✨</div>
                  )}

                  {!isRobotHere && cell?.type === 'puddle' && (
                    <div className="text-2xl">💧</div>
                  )}

                  {!isRobotHere && cell?.type === 'obstacle' && (
                    <div className="text-2xl">🧱</div>
                  )}
                </div>
              );
            })
          ))}
        </div>

        {/* Dynamic status feedback box directly under map */}
        <div className="w-full mt-4 min-h-[50px] flex justify-center items-center relative z-10">
          
          {gameState === 'idle' && (
            <p className="text-[11px] text-blue-400 font-mono uppercase tracking-wider">
              READY :: しれいをならべて、「ロボうごかす！」ボタンをおそう！
            </p>
          )}

          {gameState === 'executing' && (
            <div className="flex items-center gap-2 text-cyan-400 text-xs">
              <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping shadow-[0_0_8px_rgba(34,211,238,1)]" />
              <span className="font-mono tracking-widest font-black uppercase text-[10px]">EXECUTION_ACTIVE... ぴ ぴ ぴ...</span>
            </div>
          )}

          {gameState === 'success' && (
            <motion.div
              id="robo-success-banner"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-cyan-950/60 border border-cyan-500 rounded-xl p-3 text-center text-cyan-200 text-xs w-full max-w-sm shadow-[0_0_15px_rgba(34,211,238,0.2)]"
            >
              <div className="flex justify-center items-center gap-1.5 font-bold mb-1">
                <CheckCircle className="w-4 h-4 text-cyan-300" />
                <span>おめでとー！ゴールできたよ！ 👑</span>
              </div>
              <button
                id="robo-next-level-btn"
                onClick={handleNextLevel}
                className="mt-1.5 px-4 py-1.5 w-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs rounded transition-all cursor-pointer flex justify-center items-center gap-1 border-b-2 border-cyan-700"
              >
                <span>つぎのステージへ！</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}

          {gameState === 'failed' && (
            <div className="bg-rose-950/60 border border-rose-500/40 rounded-xl p-3 text-center text-rose-200 text-xs w-full max-w-sm">
              <div className="flex justify-center items-center gap-1 font-bold mb-1">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>失敗しちゃった：{failReason}</span>
              </div>
              <p className="text-[10px] text-rose-300">しれいを かきなおそう！</p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
