import React, { useState } from 'react';
import { useGameLogic } from './hooks/useGameLogic';
import { GameBoard } from './components/GameBoard';
import { RuneStatsModal } from './components/RuneStatsModal';
// 1. 新增 Menu 和 X 圖示
import { Sword, HelpCircle, Move, RotateCcw, Shuffle, Maximize2, Minimize2, Trash2, BarChart3, Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const App: React.FC = () => {
  const { grid, score, moves, isProcessing, runeStats, handleInteraction, handleDiscard, reshuffleBoard, resetGame } = useGameLogic();
  const [showHelp, setShowHelp] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // 2. 新增選單開關狀態
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 3. 抽離出按鈕群組，這樣我們可以重複使用在電腦版和手機版
  const ActionButtons = ({ isMobile = false }) => (
    <>
        <button 
            onClick={() => { setShowStats(true); setIsMenuOpen(false); }}
            className="p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition flex items-center justify-center gap-2"
            title="煉金手札"
        >
            <BarChart3 className="w-5 h-5" />
            {isMobile && <span className="text-sm font-bold">煉金手札</span>}
        </button>

        <button 
            onClick={() => { reshuffleBoard(); setIsMenuOpen(false); }}
            className="p-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 transition flex items-center justify-center gap-2"
            title="重洗版面"
        >
            <Shuffle className="w-5 h-5" />
            {isMobile && <span className="text-sm font-bold">戰術重洗</span>}
        </button>
        
        <button 
            onClick={() => { resetGame(); setIsMenuOpen(false); }}
            className="p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition flex items-center justify-center gap-2"
            title="重新開始"
        >
            <RotateCcw className="w-5 h-5" />
            {isMobile && <span className="text-sm font-bold">重新開始</span>}
        </button>
        
        <button 
            onClick={() => { setShowHelp(true); setIsMenuOpen(false); }}
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition border border-slate-700 flex items-center justify-center gap-2" 
            title="操作說明"
        >
            <HelpCircle className="w-5 h-5" />
            {isMobile && <span className="text-sm font-bold">操作說明</span>}
        </button>
        
        <button 
            onClick={() => { setIsFullscreen(true); setIsMenuOpen(false); }}
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition border border-slate-700 flex items-center justify-center gap-2" 
            title="全螢幕"
        >
            <Maximize2 className="w-5 h-5" />
            {isMobile && <span className="text-sm font-bold">全螢幕</span>}
        </button>
    </>
  );

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center font-sans overflow-hidden ${isFullscreen ? 'p-0 justify-center' : 'p-4'}`}>
      
      {!isFullscreen && (
        <>
          <div className="w-full max-w-[800px] flex justify-between items-center mb-4 mt-2 relative z-40">
            {/* 左側 LOGO */}
            <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
                    <Sword className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="font-bold text-xl leading-none tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">RUNIC</h1>
                    <span className="text-xs text-slate-500 uppercase tracking-[0.3em] font-bold">Synthesis</span>
                </div>
            </div>
            
            {/* 右側控制區 */}
            
            {/* 1. 電腦版 (md 以上顯示): 直接顯示整排按鈕 */}
            <div className="hidden md:flex gap-2">
                <ActionButtons />
            </div>

            {/* 2. 手機版 (md 以下顯示): 顯示漢堡選單按鈕 */}
            <div className="md:hidden">
                <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className={`p-3 rounded-xl transition border ${
                        isMenuOpen 
                        ? 'bg-slate-700 text-white border-slate-500' 
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                    }`}
                >
                    {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>

                {/* 手機版下拉選單 */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <>
                            {/* 點擊背景關閉 */}
                            <div 
                                className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40" 
                                onClick={() => setIsMenuOpen(false)}
                            />
                            
                            {/* 選單本體 */}
                            <motion.div 
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                className="absolute right-0 top-full mt-2 w-48 bg-slate-900/95 border border-slate-700 rounded-2xl shadow-2xl p-3 flex flex-col gap-2 z-50 backdrop-blur-md origin-top-right"
                            >
                                <ActionButtons isMobile={true} />
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
          </div>

          {/* 分數板 */}
          <div className="w-full max-w-[800px] flex gap-4 mb-8 relative z-0">
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

      {/* Stats Modal */}
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