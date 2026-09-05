/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import RoboGrid from './components/RoboGrid';
import MathJump from './components/MathJump';
import MathArt from './components/MathArt';
import SoundToggle from './components/SoundToggle';
import { playSound } from './utils/audio';
import { Gamepad2, Sparkles, Bot, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type TabType = 'ROBO' | 'JUMP' | 'ART';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('ROBO');

  const switchTab = (tab: TabType) => {
    setActiveTab(tab);
    playSound.click();
  };

  return (
    <div className="min-h-screen bg-[#05070a] font-sans text-blue-100 flex flex-col p-4 sm:p-6 md:p-8 relative selection:bg-cyan-500 overflow-x-hidden cyber-dots-bg">
      
      {/* Immersive Cyan & Purple Ambient backdrop glows */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Console Container */}
      <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col justify-between relative z-10">
        
        {/* Header Console Row (Robo Lab theme wrapper) */}
        <header className="flex flex-col sm:flex-row justify-between items-center bg-[#0a0f18] border-2 border-blue-900/40 px-6 py-4 rounded-3xl gap-4 shadow-[0_4px_25px_rgba(0,0,0,0.6)] mb-6">
          <div className="flex items-center gap-4">
            <span className="text-4xl animate-bounce drop-shadow-[0_0_12px_rgba(34,211,238,0.4)]">🤖</span>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]"></div>
                <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 uppercase">Robo-Coder Lab v1.02</span>
              </div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
                おえかきロボ と さんすうのあそびば
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[9px] text-blue-500 uppercase font-black tracking-widest">SIGNAL_LINK</span>
              <span className="text-[11px] font-mono text-cyan-300">STABLE_ACTIVE</span>
            </div>
            <SoundToggle />
          </div>
        </header>

        {/* Tab Controls: Large immersive neon tab buttons */}
        <nav className="grid grid-cols-3 gap-3 mb-6">
          <button
            id="tab-robo-btn"
            onClick={() => switchTab('ROBO')}
            className={`cursor-pointer text-center py-4 rounded-2xl font-black border-2 transition-all flex flex-col items-center justify-center gap-1 active:scale-95 shadow-md
              ${activeTab === 'ROBO'
                ? 'bg-indigo-950/75 border-cyan-400 text-white shadow-[0_0_15px_rgba(34,211,238,0.25)]'
                : 'bg-[#0d1525]/60 border-blue-900/30 text-blue-400/85 hover:border-blue-900/80 hover:text-blue-300'
              }`}
          >
            <span className="text-2xl drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]">🤖</span>
            <span className="text-xs font-black block tracking-tight">おえかきロボット</span>
            <span className="text-[9px] font-mono uppercase tracking-widest block text-cyan-400">しれい programming</span>
          </button>

          <button
            id="tab-jump-btn"
            onClick={() => switchTab('JUMP')}
            className={`cursor-pointer text-center py-4 rounded-2xl font-black border-2 transition-all flex flex-col items-center justify-center gap-1 active:scale-95 shadow-md
              ${activeTab === 'JUMP'
                ? 'bg-emerald-950/75 border-emerald-400 text-white shadow-[0_0_15px_rgba(52,211,153,0.25)]'
                : 'bg-[#0d1525]/60 border-blue-900/30 text-blue-400/85 hover:border-blue-900/80 hover:text-blue-300'
              }`}
          >
            <span className="text-2xl drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]">🐸</span>
            <span className="text-xs font-black block tracking-tight">ピッタリジャンプ</span>
            <span className="text-[9px] font-mono uppercase tracking-widest block text-emerald-400">MATH_ADD_SUB</span>
          </button>

          <button
            id="tab-art-btn"
            onClick={() => switchTab('ART')}
            className={`cursor-pointer text-center py-4 rounded-2xl font-black border-2 transition-all flex flex-col items-center justify-center gap-1 active:scale-95 shadow-md
              ${activeTab === 'ART'
                ? 'bg-pink-950/75 border-pink-400 text-white shadow-[0_0_15px_rgba(236,72,153,0.25)]'
                : 'bg-[#0d1525]/60 border-blue-900/30 text-blue-400/85 hover:border-blue-900/80 hover:text-blue-300'
              }`}
          >
            <span className="text-2xl drop-shadow-[0_0_8px_rgba(236,72,153,0.4)]">🌸</span>
            <span className="text-xs font-black block tracking-tight">まほうのアート</span>
            <span className="text-[9px] font-mono uppercase tracking-widest block text-pink-400">geometry_art</span>
          </button>
        </nav>

        {/* Selected Dashboard Screen Component */}
        <main className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {activeTab === 'ROBO' && <RoboGrid />}
              {activeTab === 'JUMP' && <MathJump />}
              {activeTab === 'ART' && <MathArt />}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Lab System bar footer state logs */}
        <div className="mt-6 bg-[#0a0f18] border border-blue-900/30 py-2.5 px-6 flex flex-col sm:flex-row items-center justify-between text-[9px] font-mono tracking-widest text-blue-500 rounded-2xl gap-2 shadow-lg">
          <span>CPU_LOAD: 12% | RAM: 512MB/1024MB | CACHE_READY</span>
          <span className="text-cyan-400">USER_LEVEL: JUNIOR_ENGR | SESSION_005 | STABLE</span>
        </div>

        {/* Friendly Kid footer hint guidance block */}
        <footer className="mt-4 text-center text-[11px] text-blue-400/80 leading-normal bg-[#0d1525]/60 p-4 rounded-2xl border border-blue-900/20 max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2">
          <span className="text-lg">🍀</span>
          <span>
            <strong>保護者の方へ：</strong>キーボード不要・画面タッチやクリックだけで算数とプログラミングの基本を学ぶ知育アプリです。
            8bitのレトロなピコピコ音がなり、楽しくトライ＆エラーを繰り返せます。
          </span>
        </footer>

      </div>
    </div>
  );
}
