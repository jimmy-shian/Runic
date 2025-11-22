import React, { useState } from 'react';
import { useGameLogic } from './hooks/useGameLogic';
import { GameBoard } from './components/GameBoard';
import { RuneStatsModal } from './components/RuneStatsModal'; // 1. 引入 Modal
import { Sword, HelpCircle, Move, RotateCcw, Shuffle, Maximize2, Minimize2, Trash2, BarChart3 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const App: React.FC = () => {
  // 2. 取出 runeStats
  const { grid, score, moves, isProcessing, runeStats, handleInteraction, handleDiscard, reshuffleBoard, resetGame } = useGameLogic();
  const [showHelp, setShowHelp] = useState(false);
  const [showStats, setShowStats] = useState(false); // 3. 新增 Stats Modal 狀態
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center font-sans overflow-hidden ${isFullscreen ? 'p-0 justify-center' : 'p-4'}`}>
      
      {!isFullscreen && (
        <>
          <div className="w-full max-w-[800px] flex justify-between items-center mb-4 mt-2">
            <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
                    <Sword className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="font-bold text-xl leading-none tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">RUNIC</h1>
                    <span className="text-xs text-slate-500 uppercase tracking-[0.3em] font-bold">Synthesis</span>
                </div>
            </div>
            
            <div className="flex gap-2">
                 {/* 4. 新增「煉金手札」統計按鈕 */}
                 <button 
                    onClick={() => setShowStats(true)}
                    className="p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition"
                    title="煉金手札 (合成統計)"
                >
                    <BarChart3 className="w-5 h-5" />
                </button>

                 <button 
                    onClick={reshuffleBoard}
                    className="p-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 transition"
                    title="重洗版面"
                >
                    <Shuffle className="w-5 h-5" />
                </button>
                <button 
                    onClick={resetGame}
                    className="p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition"
                    title="重新開始"
                >
                    <RotateCcw className="w-5 h-5" />
                </button>
                <button onClick={() => setShowHelp(true)} className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition border border-slate-700" title="操作說明">
                    <HelpCircle className="w-5 h-5" />
                </button>
                 <button onClick={() => setIsFullscreen(true)} className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition border border-slate-700" title="全螢幕">
                    <Maximize2 className="w-5 h-5" />
                </button>
            </div>
          </div>

          <div className="w-full max-w-[800px] flex gap-4 mb-8">
              <div className="flex-1 bg-slate-900/80 rounded-2xl p-4 border border-slate-800 flex items-center justify-between px-6 shadow-xl backdrop-blur-sm">
                  <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">分數</span>
                  <span className="text-3xl font-mono font-bold text-emerald-400 drop-shadow-sm">{score.toLocaleString()}</span>
              </div>
              <div className="flex-1 bg-slate-900/80 rounded-2xl p-4 border border-slate-800 flex items-center justify-between px-6 shadow-xl backdrop-blur-sm">
                  <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">步數</span>
                  <span className="text-3xl font-mono font-bold text-blue-400 drop-shadow-sm">{moves}</span>
              </div>
          </div>
        </>
      )}

      {isFullscreen && (
        <button 
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 z-50 p-4 rounded-full bg-slate-800/80 text-white hover:bg-slate-700 backdrop-blur-md shadow-xl border border-slate-600"
        >
            <Minimize2 className="w-6 h-6" />
        </button>
      )}

      <GameBoard 
          grid={grid} 
          isProcessing={isProcessing}
          onInteraction={handleInteraction}
          onDiscard={handleDiscard}
          isFullscreen={isFullscreen}
      />

      {!isFullscreen && (
        <div className="mt-8 text-center opacity-40 text-xs max-w-sm text-slate-300 leading-relaxed">
            <p>集齊 3 個符文進行融合進化。<br/>拖曳至外部插槽可丟棄不需要的符文。</p>
        </div>
      )}

    {/* Help Modal */}
    <AnimatePresence>
        {showHelp && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                onClick={() => setShowHelp(false)}
            >
                <motion.div 
                    initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                    className="bg-slate-900 border border-slate-700 p-8 rounded-3xl max-w-md w-full shadow-2xl"
                    onClick={e => e.stopPropagation()}
                >
                    <h2 className="text-2xl font-bold mb-8 flex items-center gap-3 text-white">
                        <HelpCircle className="text-blue-500 w-8 h-8" /> 符文操作手冊
                    </h2>
                    <ul className="space-y-6 text-slate-300">
                        <li className="flex gap-5 items-start">
                            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 shrink-0">
                                <Move className="w-6 h-6" />
                            </div>
                            <div>
                                <strong className="text-emerald-200 block text-sm uppercase tracking-wide mb-1">連線與進化</strong>
                                集齊 3 個同等級的符文，它們就會「合體」進化成更強的符文！目標是煉出最高級的神器。
                            </div>
                        </li>
                        <li className="flex gap-5 items-start">
                             <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 shrink-0">
                                <Shuffle className="w-6 h-6" />
                            </div>
                            <div>
                                <strong className="text-indigo-200 block text-sm uppercase tracking-wide mb-1">戰術重洗</strong>
                                卡關了嗎？別硬撐！使用重洗功能打亂版面，也許下一步的契機就藏在混亂之中。
                            </div>
                        </li>
                        <li className="flex gap-5 items-start">
                             <div className="p-3 bg-red-500/10 rounded-xl text-red-400 shrink-0">
                                <Trash2 className="w-6 h-6" />
                            </div>
                            <div>
                                <strong className="text-red-200 block text-sm uppercase tracking-wide mb-1">邊界斷捨離</strong>
                                遇到擋路的符文？直接把它拖到格子外圍的虛空處，跟它說掰掰（銷毀）！
                            </div>
                        </li>
                    </ul>
                    <button 
                        onClick={() => setShowHelp(false)}
                        className="mt-10 w-full py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-bold text-base transition-colors text-white"
                    >
                        沒問題，開玩！
                    </button>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* 5. 加入新的統計 Modal */}
      <AnimatePresence>
        <RuneStatsModal 
            isOpen={showStats} 
            onClose={() => setShowStats(false)} 
            stats={runeStats} 
        />
      </AnimatePresence>
    </div>
  );
};

export default App;