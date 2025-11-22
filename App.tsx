import React, { useState } from 'react';
import { useGameLogic } from './hooks/useGameLogic';
import { GameBoard } from './components/GameBoard';
import { Sword, HelpCircle, Move, RotateCcw, Shuffle, Maximize2, Minimize2, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const App: React.FC = () => {
  const { grid, score, moves, isProcessing, handleInteraction, handleDiscard, reshuffleBoard, resetGame } = useGameLogic();
  const [showHelp, setShowHelp] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center font-sans overflow-hidden ${isFullscreen ? 'p-0 justify-center' : 'p-4'}`}>
      
      {/* Controls / Header - Hidden in Fullscreen */}
      {!isFullscreen && (
        <>
          <div className="w-full max-w-[650px] flex justify-between items-center mb-4 mt-2">
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
                 <button 
                    onClick={reshuffleBoard}
                    className="p-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 transition"
                    title="Reshuffle Board (Keep Score)"
                >
                    <Shuffle className="w-5 h-5" />
                </button>
                <button 
                    onClick={resetGame}
                    className="p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition"
                    title="Full Reset"
                >
                    <RotateCcw className="w-5 h-5" />
                </button>
                <button onClick={() => setShowHelp(true)} className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition border border-slate-700">
                    <HelpCircle className="w-5 h-5" />
                </button>
                 <button onClick={() => setIsFullscreen(true)} className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition border border-slate-700">
                    <Maximize2 className="w-5 h-5" />
                </button>
            </div>
          </div>

          <div className="w-full max-w-[650px] flex gap-4 mb-8">
              <div className="flex-1 bg-slate-900/80 rounded-2xl p-4 border border-slate-800 flex items-center justify-between px-6 shadow-xl backdrop-blur-sm">
                  <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Score</span>
                  <span className="text-3xl font-mono font-bold text-emerald-400 drop-shadow-sm">{score.toLocaleString()}</span>
              </div>
              <div className="flex-1 bg-slate-900/80 rounded-2xl p-4 border border-slate-800 flex items-center justify-between px-6 shadow-xl backdrop-blur-sm">
                  <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Moves</span>
                  <span className="text-3xl font-mono font-bold text-blue-400 drop-shadow-sm">{moves}</span>
              </div>
          </div>
        </>
      )}

      {/* Fullscreen Exit Button */}
      {isFullscreen && (
        <button 
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 z-50 p-4 rounded-full bg-slate-800/80 text-white hover:bg-slate-700 backdrop-blur-md shadow-xl border border-slate-600"
        >
            <Minimize2 className="w-6 h-6" />
        </button>
      )}

      {/* Game Board Area */}
      <GameBoard 
          grid={grid} 
          isProcessing={isProcessing}
          onInteraction={handleInteraction}
          onDiscard={handleDiscard}
          isFullscreen={isFullscreen}
      />

      {/* Footer - Hidden in Fullscreen */}
      {!isFullscreen && (
        <div className="mt-8 text-center opacity-40 text-xs max-w-sm text-slate-300 leading-relaxed">
            <p>Match 3+ runes to merge into stronger forms. <br/>Drag to the outer slots to discard unwanted runes.</p>
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
                        <HelpCircle className="text-blue-500 w-8 h-8" /> How to Play
                    </h2>
                    <ul className="space-y-6 text-slate-300">
                        <li className="flex gap-5 items-start">
                            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 shrink-0">
                                <Move className="w-6 h-6" />
                            </div>
                            <div>
                                <strong className="text-emerald-200 block text-sm uppercase tracking-wide mb-1">Swap & Match</strong>
                                Match 3+ runes of the same type and level to merge them into a higher tier rune.
                            </div>
                        </li>
                         <li className="flex gap-5 items-start">
                             <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 shrink-0">
                                <Shuffle className="w-6 h-6" />
                            </div>
                            <div>
                                <strong className="text-indigo-200 block text-sm uppercase tracking-wide mb-1">Reshuffle</strong>
                                Stuck? Use reshuffle to scramble the current board without losing your progress.
                            </div>
                        </li>
                        <li className="flex gap-5 items-start">
                             <div className="p-3 bg-red-500/10 rounded-xl text-red-400 shrink-0">
                                <Trash2 className="w-6 h-6" />
                            </div>
                            <div>
                                <strong className="text-red-200 block text-sm uppercase tracking-wide mb-1">Discard Zone</strong>
                                Drag any unwanted rune to the empty slots surrounding the grid to destroy it.
                            </div>
                        </li>
                    </ul>
                    <button 
                        onClick={() => setShowHelp(false)}
                        className="mt-10 w-full py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-bold text-base transition-colors text-white"
                    >
                        Got it
                    </button>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;