import React, { useState } from 'react';
import { useGameLogic } from './hooks/useGameLogic';
import { GameBoard } from './components/GameBoard';
import { RuneStatsModal } from './components/RuneStatsModal';
import { CollectionModal } from './components/CollectionModal';
import { Sword, HelpCircle, Move, RotateCcw, Shuffle, Maximize2, Minimize2, Trash2, BarChart3, Menu, X, BookOpen } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const App: React.FC = () => {
  const { grid, score, moves, isProcessing, runeStats, collection, handleInteraction, handleDiscard, reshuffleBoard, resetGame } = useGameLogic();
  const [showHelp, setShowHelp] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showCollection, setShowCollection] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const ActionButtons = ({ isMobile = false }) => (
    <>
        <button 
            onClick={() => { setShowCollection(true); setIsMenuOpen(false); }}
            className="p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition flex items-center justify-center gap-2"
            title="符文圖鑑"
        >
            <BookOpen className="w-5 h-5" />
            {isMobile && <span className="text-sm font-bold">符文圖鑑</span>}
        </button>

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
    <div className={`min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center font-sans overflow-hidden ${isFullscreen ? 'p-0 justify-center' : 'p-2 md:p-4'}`}>
      
      {!isFullscreen && (
        <>
          <div className="w-full max-w-[800px] flex justify-between items-center mb-2 mt-20 sm:mt-1 relative z-40">
            {/* 左側 LOGO */}
            <div className="flex items-center gap-3">
                <div className="p-2 md:p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
                    <Sword className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div>
                    <h1 className="font-bold text-lg md:text-xl leading-none tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">RUNIC</h1>
                    <span className="text-[10px] md:text-xs text-slate-500 uppercase tracking-[0.3em] font-bold">Synthesis</span>
                </div>
            </div>
            
            {/* 右側控制區 */}
            <div className="hidden md:flex gap-2">
                <ActionButtons />
            </div>

            <div className="md:hidden">
                <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className={`p-2.5 rounded-xl transition border ${
                        isMenuOpen 
                        ? 'bg-slate-700 text-white border-slate-500' 
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                    }`}
                >
                    {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>

                <AnimatePresence>
                    {isMenuOpen && (
                        <>
                            <div 
                                className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40" 
                                onClick={() => setIsMenuOpen(false)}
                            />
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
          <div className="w-full max-w-[800px] flex gap-3 md:gap-4 mb-8 md:mb-12 relative z-0">
              <div className="flex-1 bg-slate-900/80 rounded-2xl p-3 md:p-4 border border-slate-800 flex items-center justify-between px-4 md:px-6 shadow-xl backdrop-blur-sm">
                  <span className="text-[10px] md:text-xs text-slate-400 uppercase font-bold tracking-wider">分數</span>
                  <span className="text-2xl md:text-3xl font-mono font-bold text-emerald-400 drop-shadow-sm">{score.toLocaleString()}</span>
              </div>
              <div className="flex-1 bg-slate-900/80 rounded-2xl p-3 md:p-4 border border-slate-800 flex items-center justify-between px-4 md:px-6 shadow-xl backdrop-blur-sm">
                  <span className="text-[10px] md:text-xs text-slate-400 uppercase font-bold tracking-wider">步數</span>
                  <span className="text-2xl md:text-3xl font-mono font-bold text-blue-400 drop-shadow-sm">{moves}</span>
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
        <div className="mt-4 md:mt-8 text-center opacity-40 text-[10px] md:text-xs max-w-sm text-slate-300 leading-relaxed">
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
                    className="bg-slate-900 border border-slate-700 p-8 rounded-3xl max-w-md w-full shadow-2xl overflow-y-auto max-h-[80vh]"
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
                                <strong className="text-emerald-200 block text-sm uppercase tracking-wide mb-1">連線與計分</strong>
                                <p>水平或垂直連線 3 個以上相同符文即可消除並合成。</p>
                                <ul className="list-disc list-inside mt-2 text-xs text-slate-400 space-y-1">
                                    <li>Lv1 ~ Lv4 消除：獲得 <span className="text-emerald-300">Level x 數量</span> 分。</li>
                                    <li><span className="text-amber-400">Lv5 (神器)</span> 特殊效果：觸發整行/整列消除！</li>
                                    <li>Lv5 額外獎勵：消除或丟棄皆可獲得 <span className="text-amber-400">+10 分</span>。</li>
                                </ul>
                            </div>
                        </li>
                        <li className="flex gap-5 items-start">
                            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 shrink-0">
                                <Shuffle className="w-6 h-6" />
                            </div>
                            <div>
                                <strong className="text-indigo-200 block text-sm uppercase tracking-wide mb-1">戰術重洗</strong>
                                卡關了嗎？使用重洗功能打亂版面，尋找新的契機。
                            </div>
                        </li>
                        <li className="flex gap-5 items-start">
                            <div className="p-3 bg-red-500/10 rounded-xl text-red-400 shrink-0">
                                <Trash2 className="w-6 h-6" />
                            </div>
                            <div>
                                <strong className="text-red-200 block text-sm uppercase tracking-wide mb-1">邊界斷捨離</strong>
                                將符文拖曳至格子外圍的虛空處即可銷毀。
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

      <AnimatePresence>
        <RuneStatsModal 
            isOpen={showStats} 
            onClose={() => setShowStats(false)} 
            stats={runeStats} 
        />
      </AnimatePresence>

      <AnimatePresence>
        <CollectionModal 
            isOpen={showCollection} 
            onClose={() => setShowCollection(false)} 
            collection={collection} 
        />
      </AnimatePresence>
    </div>
  );
};

export default App;