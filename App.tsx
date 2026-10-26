import React, { useState, useEffect } from 'react';
import { preloadRuneImages } from './runeAssets';
import { RuneImage } from './components/RunePiece';
import { RuneType } from './types';
import { useSound } from './hooks/useSound';
import { useGameLogic } from './hooks/useGameLogic';
import { GameBoard } from './components/GameBoard';
import { RuneStatsModal } from './components/RuneStatsModal';
import { CollectionModal } from './components/CollectionModal';
import { HelpCircle, Move, RotateCcw, Shuffle, Maximize2, Minimize2, Trash2, BarChart3, Menu, X, BookOpen, Volume2, VolumeX } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const App: React.FC = () => {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try { return localStorage.getItem('runic.soundEnabled') !== 'false'; } catch { return true; }
  });
  const { playSound, initAudio } = useSound(soundEnabled);
  const [assetProgress, setAssetProgress] = useState({ loaded: 0, failed: 0, total: 25 });
  const assetsReady = assetProgress.loaded + assetProgress.failed === assetProgress.total;
  useEffect(() => preloadRuneImages((loaded, total, failed) => setAssetProgress({ loaded, total, failed })), []);
  useEffect(() => {
    try { localStorage.setItem('runic.soundEnabled', String(soundEnabled)); } catch {}
  }, [soundEnabled]);
  useEffect(() => {
    window.addEventListener('pointerdown', initAudio);
    window.addEventListener('touchstart', initAudio);
    window.addEventListener('keydown', initAudio);
    return () => {
      window.removeEventListener('pointerdown', initAudio);
      window.removeEventListener('touchstart', initAudio);
      window.removeEventListener('keydown', initAudio);
    };
  }, [initAudio]);
  const { grid, swapSignal, swappingPair, score, moves, isProcessing, runeStats, collection, handleInteraction, handleDiscard, reshuffleBoard, resetGame } = useGameLogic(playSound);
  const [showHelp, setShowHelp] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showCollection, setShowCollection] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleEnterFullscreen = async () => {
    setIsFullscreen(true);
    setIsMenuOpen(false);
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch {}
  };

  const handleExitFullscreen = async () => {
    setIsFullscreen(false);
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch {}
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const ActionButtons = ({ isMobile = false }) => (
    <>
        <button 
            onClick={() => { setShowCollection(true); setIsMenuOpen(false); }}
            className="p-2.5 md:p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition flex items-center justify-center gap-2 active:scale-95"
            title="符文圖鑑"
        >
            <BookOpen className="w-5 h-5" />
            {isMobile && <span className="text-sm font-bold">符文圖鑑</span>}
        </button>

        <button 
            onClick={() => { setShowStats(true); setIsMenuOpen(false); }}
            className="p-2.5 md:p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition flex items-center justify-center gap-2 active:scale-95"
            title="煉金手札"
        >
            <BarChart3 className="w-5 h-5" />
            {isMobile && <span className="text-sm font-bold">煉金手札</span>}
        </button>

        <button 
            onClick={() => { reshuffleBoard(); setIsMenuOpen(false); }}
            className="p-2.5 md:p-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 transition flex items-center justify-center gap-2 active:scale-95"
            title="重洗版面"
        >
            <Shuffle className="w-5 h-5" />
            {isMobile && <span className="text-sm font-bold">戰術重洗</span>}
        </button>
        
        <button 
            onClick={() => { resetGame(); setIsMenuOpen(false); }}
            className="p-2.5 md:p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition flex items-center justify-center gap-2 active:scale-95"
            title="重新開始"
        >
            <RotateCcw className="w-5 h-5" />
            {isMobile && <span className="text-sm font-bold">重新開始</span>}
        </button>
        
        <button 
            onClick={() => { setShowHelp(true); setIsMenuOpen(false); }}
            className="p-2.5 md:p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700 flex items-center justify-center gap-2 active:scale-95" 
            title="操作說明"
        >
            <HelpCircle className="w-5 h-5" />
            {isMobile && <span className="text-sm font-bold">操作說明</span>}
        </button>
        
        <button 
            onClick={handleEnterFullscreen}
            className="p-2.5 md:p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700 flex items-center justify-center gap-2 active:scale-95" 
            title="全螢幕"
        >
            <Maximize2 className="w-5 h-5" />
            {isMobile && <span className="text-sm font-bold">全螢幕</span>}
        </button>
        <button 
            title={soundEnabled ? '關閉音效' : '開啟音效'} 
            aria-pressed={soundEnabled}
            onClick={() => setSoundEnabled(value => !value)}
            className="p-2.5 md:p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700 flex items-center justify-center gap-2 active:scale-95"
        >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            {isMobile && <span className="text-sm font-bold">音效</span>}
        </button>
    </>
  );

  return (
    <div 
      className="h-[100dvh] max-h-[100dvh] w-full bg-slate-950 text-slate-200 flex flex-col items-center justify-center font-sans overflow-hidden select-none"
      style={{
        paddingTop: isFullscreen 
          ? 'max(env(safe-area-inset-top, 0px), 8px)' 
          : 'calc(max(env(safe-area-inset-top, 0px), 24px) + 6px)',
        paddingBottom: isFullscreen
          ? 'max(env(safe-area-inset-bottom, 0px), 8px)'
          : 'calc(max(env(safe-area-inset-bottom, 0px), 12px) + 6px)',
        paddingLeft: isFullscreen ? 'max(4px, env(safe-area-inset-left, 4px))' : 'max(8px, env(safe-area-inset-left, 8px))',
        paddingRight: isFullscreen ? 'max(4px, env(safe-area-inset-right, 4px))' : 'max(8px, env(safe-area-inset-right, 8px))',
      }}
    >
      {/* 頂部等比留白：與底部彈性格嚴格對稱，確保整體絕對垂直置中 */}
      <div className="w-full flex-1 min-h-[6px]" />

      {/* 核心內容舞台（垂直置中核心區塊） */}
      <div className={`w-full ${isFullscreen ? 'max-w-[560px]' : 'max-w-[480px]'} flex flex-col items-center gap-2 md:gap-3 shrink-0`}>
        
        {/* 頂部區域（Header + 分數） */}
        {!isFullscreen ? (
          <div className="w-full flex flex-col gap-2 shrink-0">
            {/* LOGO 與選單按鈕 */}
            <div className="w-full flex justify-between items-center relative z-50">
              {/* 左側 LOGO */}
              <div className="flex items-center gap-2.5">
                  <img 
                      src={`${import.meta.env.BASE_URL}icons/icon-192.png`} 
                      alt="Logo" 
                      width={40} 
                      height={40}
                      className="w-8 h-8 md:w-10 md:h-10 rounded-xl shadow-lg shadow-blue-500/20" 
                  />
                  <div>
                      <h1 className="font-extrabold text-base md:text-xl leading-tight tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                          RUNIC
                      </h1>
                      <span className="text-[9px] md:text-[11px] text-slate-500 uppercase tracking-[0.25em] font-bold block -mt-0.5">
                          Synthesis
                      </span>
                  </div>
              </div>
              
              {/* 右側桌機控制區 */}
              <div className="hidden md:flex gap-1.5" onClickCapture={() => playSound('click')}>
                  <ActionButtons />
              </div>

              {/* 手機漢堡選單按鈕 */}
              <div className="md:hidden relative">
                  <button 
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                      className={`p-2 rounded-xl transition border active:scale-95 ${
                          isMenuOpen 
                          ? 'bg-slate-700 text-white border-slate-500' 
                          : 'bg-slate-900/90 text-slate-300 border-slate-700/80 hover:bg-slate-800'
                      }`}
                      title="選單"
                  >
                      {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </button>

                  {/* 手機選單彈窗（提高 z-index 至 200，徹底防止被棋盤或選中標籤穿透遮擋） */}
                  <AnimatePresence>
                      {isMenuOpen && (
                          <>
                              <div 
                                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[190]" 
                                  onClick={() => setIsMenuOpen(false)}
                              />
                              <motion.div 
                                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                  transition={{ duration: 0.15 }}
                                  className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2.5 flex flex-col gap-1.5 z-[200] backdrop-blur-md origin-top-right"
                                  onClickCapture={() => playSound('click')}
                              >
                                  <ActionButtons isMobile={true} />
                              </motion.div>
                          </>
                      )}
                  </AnimatePresence>
              </div>
            </div>

            {/* 分數板 */}
            <div className="w-full flex gap-2 relative z-0">
                <div className="flex-1 bg-slate-900/80 rounded-xl py-1.5 md:py-2.5 px-3 md:px-4 border border-slate-800 flex items-center justify-between shadow-lg backdrop-blur-sm">
                    <span className="text-[10px] md:text-xs text-slate-400 uppercase font-bold tracking-wider">分數</span>
                    <span className="text-lg md:text-2xl font-mono font-bold text-emerald-400 drop-shadow-sm">{score.toLocaleString()}</span>
                </div>
                <div className="flex-1 bg-slate-900/80 rounded-xl py-1.5 md:py-2.5 px-3 md:px-4 border border-slate-800 flex items-center justify-between shadow-lg backdrop-blur-sm">
                    <span className="text-[10px] md:text-xs text-slate-400 uppercase font-bold tracking-wider">步數</span>
                    <span className="text-lg md:text-2xl font-mono font-bold text-blue-400 drop-shadow-sm">{moves}</span>
                </div>
            </div>
          </div>
        ) : (
          /* 全螢幕模式頂部 HUD */
          <div className="w-full flex items-center justify-between px-1 shrink-0 relative z-50">
              <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-800 shadow-lg text-xs">
                  <span className="text-slate-400 font-bold">分數 <span className="font-mono text-emerald-400 font-bold text-sm ml-1">{score.toLocaleString()}</span></span>
                  <span className="w-px h-3 bg-slate-700" />
                  <span className="text-slate-400 font-bold">步數 <span className="font-mono text-blue-400 font-bold text-sm ml-1">{moves}</span></span>
              </div>

              <button 
                  onClick={handleExitFullscreen}
                  className="p-1.5 px-3 rounded-xl bg-slate-900/90 text-slate-200 hover:bg-slate-800 active:scale-95 backdrop-blur-md shadow-xl border border-slate-700 transition flex items-center gap-1.5 text-xs font-bold"
                  title="退出全螢幕"
              >
                  <Minimize2 className="w-4 h-4 text-blue-400" />
                  <span className="hidden sm:inline">退出</span>
              </button>
          </div>
        )}

        {/* 中央主棋盤區域 */}
        {/* isolate + z-0：棋盤內所有 z-index（如 Lv 標籤）都被限制在這層，不會蓋過選單 */}
        <div className="w-full flex items-center justify-center relative z-0 isolate">
          {assetsReady ? (
            <GameBoard
              grid={grid} 
              swapSignal={swapSignal}
              swappingPair={swappingPair}
              isProcessing={isProcessing}
              onInteraction={handleInteraction}
              onDiscard={handleDiscard}
              isFullscreen={isFullscreen}
              onSound={playSound}
            />
          ) : (
            <div role="status" aria-live="polite" className="flex flex-col items-center gap-4 p-8">
              <div className="w-20 h-20 animate-pulse"><RuneImage type={RuneType.Lightning} level={5} /></div>
              <p className="text-sm text-slate-400">載入符文 {assetProgress.loaded + assetProgress.failed}/25</p>
              <progress aria-label="符文載入進度" max={25} value={assetProgress.loaded + assetProgress.failed} className="w-48" />
            </div>
          )}
        </div>

        {/* 底部說明文字 */}
        <div className="w-full text-center text-[10px] md:text-xs text-slate-400/80 leading-relaxed shrink-0">
          <p>連線 3 個相同符文進行合成。<br className="sm:hidden" />拖曳至外圍插槽可銷毀符文。</p>
        </div>

      </div>

      {/* 下方等比留白：與頂部彈性格嚴格對稱，確保整體絕對垂直置中 */}
      <div className="w-full flex-1 min-h-[6px]" />

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
                    className="bg-slate-900 border border-slate-700 p-6 md:p-8 rounded-3xl max-w-md w-full shadow-2xl overflow-y-auto max-h-[85vh]"
                    onClick={e => e.stopPropagation()}
                >
                    <h2 className="text-xl md:text-2xl font-bold mb-6 flex items-center gap-3 text-white">
                        <HelpCircle className="text-blue-500 w-7 h-7" /> 符文操作手冊
                    </h2>
                    <ul className="space-y-5 text-slate-300">
                        <li className="flex gap-4 items-start">
                            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400 shrink-0">
                                <Move className="w-5 h-5" />
                            </div>
                            <div>
                                <strong className="text-emerald-200 block text-xs uppercase tracking-wide mb-1">連線與計分</strong>
                                <p className="text-xs">水平或垂直連線 3 個以上相同符文即可消除並合成。</p>
                                <ul className="list-disc list-inside mt-1.5 text-[11px] text-slate-400 space-y-1">
                                    <li>Lv1 ~ Lv4 消除：獲得 <span className="text-emerald-300">等級 x 數量</span> 分。</li>
                                    <li><span className="text-amber-400">Lv5 (神器)</span> 特殊效果：觸發整行/整列消除！</li>
                                    <li>Lv5 額外獎勵：消除或丟棄皆可獲得 <span className="text-amber-400">+10 分</span>。</li>
                                </ul>
                            </div>
                        </li>
                        <li className="flex gap-4 items-start">
                            <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400 shrink-0">
                                <Shuffle className="w-5 h-5" />
                            </div>
                            <div className="text-xs">
                                <strong className="text-indigo-200 block text-xs uppercase tracking-wide mb-1">戰術重洗</strong>
                                卡關了嗎？使用重洗功能打亂版面，尋找新的契機。
                            </div>
                        </li>
                        <li className="flex gap-4 items-start">
                            <div className="p-2.5 bg-red-500/10 rounded-xl text-red-400 shrink-0">
                                <Trash2 className="w-5 h-5" />
                            </div>
                            <div className="text-xs">
                                <strong className="text-red-200 block text-xs uppercase tracking-wide mb-1">邊界斷捨離</strong>
                                將符文拖曳至格子外圍的虛空插槽即可銷毀。
                            </div>
                        </li>
                    </ul>
                    <button 
                        onClick={() => setShowHelp(false)}
                        className="mt-8 w-full py-3.5 bg-slate-800 hover:bg-slate-700 rounded-2xl font-bold text-sm transition-colors text-white"
                    >
                        了解，開始遊玩！
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
