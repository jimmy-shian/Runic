import { SplashAd } from './components/SplashAd';
import { EdgeAdBanner } from './components/EdgeAdBanner';
import React, { useState, useEffect, useCallback } from 'react';
import { preloadRuneImages, retryPreloadRuneImages } from './runeAssets';
import { useSound } from './hooks/useSound';
import { useGameLogic } from './hooks/useGameLogic';
import { GameBoard } from './components/GameBoard';
import { RuneStatsModal } from './components/RuneStatsModal';
import { CollectionModal } from './components/CollectionModal';
import { RuneEvolutionLoader } from './components/RuneEvolutionLoader';
import {
  HelpCircle,
  Move,
  RotateCcw,
  Shuffle,
  Maximize2,
  Minimize2,
  Trash2,
  BarChart3,
  Menu,
  X,
  BookOpen,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      return localStorage.getItem('runic.soundEnabled') !== 'false';
    } catch {
      return true;
    }
  });
  const { playSound, initAudio } = useSound(soundEnabled);

  // 資源載入狀態（R-01：嚴格區分 loaded 與 failed，全數 25 張 loaded 才是 assetsReady）
  const [assetProgress, setAssetProgress] = useState({
    loaded: 0,
    failed: 0,
    total: 25,
    failedUrls: [] as string[],
  });

  const assetsReady = assetProgress.loaded === assetProgress.total && assetProgress.total === 25;

  const handlePreloadProgress = useCallback(
    (loaded: number, total: number, failed: number, failedUrls: string[]) => {
      setAssetProgress({ loaded, total, failed, failedUrls });
    },
    []
  );

  useEffect(() => {
    const cancel = preloadRuneImages(handlePreloadProgress);
    return () => cancel();
  }, [handlePreloadProgress]);

  const handleRetryAssets = useCallback(() => {
    retryPreloadRuneImages(handlePreloadProgress);
  }, [handlePreloadProgress]);

  useEffect(() => {
    try {
      localStorage.setItem('runic.soundEnabled', String(soundEnabled));
    } catch {}
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

  const {
    grid,
    swapSignal,
    swappingPair,
    score,
    moves,
    isProcessing,
    runeStats,
    collection,
    handleInteraction,
    handleDiscard,
    reshuffleBoard,
    resetGame,
  } = useGameLogic(playSound);

  const [showHelp, setShowHelp] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showCollection, setShowCollection] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 偵測橫向螢幕 (Landscape)
  const [isLandscape, setIsLandscape] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth > window.innerHeight;
  });

  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

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
        onClick={() => {
          setShowCollection(true);
          setIsMenuOpen(false);
        }}
        className="p-2 md:p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition flex items-center justify-center gap-2 active:scale-95"
        title="符文圖鑑"
      >
        <BookOpen className="w-4 h-4 md:w-5 md:h-5" />
        {isMobile && <span className="text-sm font-bold">符文圖鑑</span>}
      </button>

      <button
        onClick={() => {
          setShowStats(true);
          setIsMenuOpen(false);
        }}
        className="p-2 md:p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition flex items-center justify-center gap-2 active:scale-95"
        title="煉金手札"
      >
        <BarChart3 className="w-4 h-4 md:w-5 md:h-5" />
        {isMobile && <span className="text-sm font-bold">煉金手札</span>}
      </button>

      <button
        onClick={() => {
          reshuffleBoard();
          setIsMenuOpen(false);
        }}
        className="p-2 md:p-2.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 transition flex items-center justify-center gap-2 active:scale-95"
        title="戰術重洗"
      >
        <Shuffle className="w-4 h-4 md:w-5 md:h-5" />
        {isMobile && <span className="text-sm font-bold">戰術重洗</span>}
      </button>

      <button
        onClick={() => {
          resetGame();
          setIsMenuOpen(false);
        }}
        className="p-2 md:p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition flex items-center justify-center gap-2 active:scale-95"
        title="重新開始"
      >
        <RotateCcw className="w-4 h-4 md:w-5 md:h-5" />
        {isMobile && <span className="text-sm font-bold">重新開始</span>}
      </button>

      <button
        onClick={() => {
          setShowHelp(true);
          setIsMenuOpen(false);
        }}
        className="p-2 md:p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700 flex items-center justify-center gap-2 active:scale-95"
        title="操作說明"
      >
        <HelpCircle className="w-4 h-4 md:w-5 md:h-5" />
        {isMobile && <span className="text-sm font-bold">操作說明</span>}
      </button>

      <button
        onClick={handleEnterFullscreen}
        className="p-2 md:p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700 flex items-center justify-center gap-2 active:scale-95"
        title="全螢幕"
      >
        <Maximize2 className="w-4 h-4 md:w-5 md:h-5" />
        {isMobile && <span className="text-sm font-bold">全螢幕</span>}
      </button>

      <button
        title={soundEnabled ? '關閉音效' : '開啟音效'}
        aria-pressed={soundEnabled}
        onClick={() => setSoundEnabled((value) => !value)}
        className="p-2 md:p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700 flex items-center justify-center gap-2 active:scale-95"
      >
        {soundEnabled ? (
          <Volume2 className="w-4 h-4 md:w-5 md:h-5" />
        ) : (
          <VolumeX className="w-4 h-4 md:w-5 md:h-5 text-slate-500" />
        )}
        {isMobile && <span className="text-sm font-bold">音效</span>}
      </button>
    </>
  );

  return (
    <div
      className="h-[100dvh] max-h-[100dvh] w-full bg-slate-950 text-slate-200 flex flex-col items-center justify-center font-sans overflow-hidden select-none"
      style={{
        paddingTop: isFullscreen
          ? 'max(env(safe-area-inset-top, 0px), 6px)'
          : 'max(env(safe-area-inset-top, 0px), 16px)',
        paddingBottom: isFullscreen
          ? 'max(env(safe-area-inset-bottom, 0px), 6px)'
          : 'max(env(safe-area-inset-bottom, 0px), 12px)',
        paddingLeft: 'max(env(safe-area-inset-left, 0px), 8px)',
        paddingRight: 'max(env(safe-area-inset-right, 0px), 8px)',
      }}
    >
      {/* 開場載入與廣告展示分離管理（R-AD01, R-04, R-05） */}
      {showSplash && (
        <SplashAd
          onFinish={() => setShowSplash(false)}
          loadedCount={assetProgress.loaded}
          totalCount={assetProgress.total}
          failedCount={assetProgress.failed}
          onRetryAssets={handleRetryAssets}
        />
      )}

      {isLandscape ? (
        /* ========== 橫向模式 (Landscape)：左資訊 / 中棋盤 / 右按鈕 ========== */
        <div className="h-full w-full flex flex-row items-center justify-between gap-3 px-3 py-1 overflow-hidden">
          {/* 左側：Title + 分數 + 步數 */}
          <div className="h-full w-44 sm:w-48 shrink-0 flex flex-col justify-between py-1 z-10 select-none">
            <EdgeAdBanner position="left" />
            <div className="flex items-center gap-2.5">
              <img
                src={`${import.meta.env.BASE_URL}icons/icon-192.png`}
                alt="Logo"
                width={36}
                height={36}
                className="w-8 h-8 rounded-xl shadow-md shrink-0"
              />
              <div>
                <h1 className="font-extrabold text-base leading-tight tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                  RUNIC
                </h1>
                <span className="text-[9px] text-slate-500 uppercase tracking-[0.2em] font-bold block -mt-0.5">
                  Synthesis
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 my-auto w-full">
              <div className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800 shadow-md flex flex-col gap-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">分數</span>
                <span className="text-2xl font-mono font-bold text-emerald-400 drop-shadow-sm">
                  {score.toLocaleString()}
                </span>
              </div>
              <div className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800 shadow-md flex flex-col gap-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">步數</span>
                <span className="text-2xl font-mono font-bold text-blue-400 drop-shadow-sm">
                  {moves}
                </span>
              </div>
            </div>

            <div className="text-[10px] text-slate-400/80 leading-relaxed bg-slate-900/40 p-2 rounded-xl border border-slate-800/40">
              <p>連線 3 個相同符文進行合成。</p>
              <p className="mt-0.5 text-slate-500">拖至外圍插槽可銷毀符文。</p>
            </div>
          </div>

          {/* 中間主棋盤區域 */}
          <div className="flex-1 h-full min-w-0 flex items-center justify-center relative z-0 isolate">
            {assetsReady ? (
              <GameBoard
                grid={grid}
                swapSignal={swapSignal}
                swappingPair={swappingPair}
                isProcessing={isProcessing}
                onInteraction={handleInteraction}
                onDiscard={handleDiscard}
                isFullscreen={isFullscreen}
                isLandscape={true}
                onSound={playSound}
              />
            ) : (
              <RuneEvolutionLoader
                loadedCount={assetProgress.loaded}
                totalCount={assetProgress.total}
                failedCount={assetProgress.failed}
                onRetry={handleRetryAssets}
              />
            )}
          </div>

          {/* 右側按鈕操作區 */}
          <div
            className="h-full w-40 sm:w-44 shrink-0 flex flex-col justify-center gap-2 py-1 z-10 overflow-y-auto"
            onClickCapture={() => playSound('click')}
          >
            <EdgeAdBanner position="right" />
            <ActionButtons isMobile={true} />
          </div>
        </div>
      ) : (
        /* ========== 直向模式 (Portrait)（R-03 空間重分配） ========== */
        <div className="w-full h-full max-w-[500px] flex flex-col items-center justify-between overflow-hidden">
          {/* 第一區：頂部資訊（標誌、選單按鈕、緊湊分數與步數） */}
          <div className="w-full shrink-0 flex flex-col gap-2 pt-1 z-30">
            <EdgeAdBanner position="top" />

            {!isFullscreen ? (
              <>
                <div className="w-full flex justify-between items-center px-1">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={`${import.meta.env.BASE_URL}icons/icon-192.png`}
                      alt="Logo"
                      width={32}
                      height={32}
                      className="w-7 h-7 rounded-lg shadow-sm"
                    />
                    <div>
                      <h1 className="font-extrabold text-sm md:text-base leading-tight tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                        RUNIC
                      </h1>
                      <span className="text-[8px] md:text-[9px] text-slate-500 uppercase tracking-[0.2em] font-bold block -mt-0.5">
                        Synthesis
                      </span>
                    </div>
                  </div>

                  <div className="hidden md:flex gap-1.5" onClickCapture={() => playSound('click')}>
                    <ActionButtons />
                  </div>

                  <div className="md:hidden relative">
                    <button
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                      className="p-1.5 rounded-lg bg-slate-900/90 text-slate-300 border border-slate-700/80 hover:bg-slate-800 active:scale-95 transition"
                      title="選單"
                    >
                      {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                    </button>

                    <AnimatePresence>
                      {isMenuOpen && (
                        <>
                          <div
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[190]"
                            onClick={() => setIsMenuOpen(false)}
                          />
                          <motion.div
                            initial={{ opacity: 0, y: -8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 top-full mt-2 w-44 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 flex flex-col gap-1.5 z-[200]"
                            onClickCapture={() => playSound('click')}
                          >
                            <ActionButtons isMobile={true} />
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* 緊湊計分列 */}
                <div className="w-full flex gap-2 px-1">
                  <div className="flex-1 bg-slate-900/80 rounded-xl py-1 px-3 border border-slate-800 flex items-center justify-between shadow-sm">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">分數</span>
                    <span className="text-base font-mono font-bold text-emerald-400">
                      {score.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex-1 bg-slate-900/80 rounded-xl py-1 px-3 border border-slate-800 flex items-center justify-between shadow-sm">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">步數</span>
                    <span className="text-base font-mono font-bold text-blue-400">
                      {moves}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              /* 全螢幕模式簡化 HUD */
              <div className="w-full flex items-center justify-between px-2 py-1">
                <div className="flex items-center gap-3 bg-slate-900/90 px-3 py-1 rounded-lg border border-slate-800 text-xs font-mono">
                  <span className="text-slate-400">分 <span className="text-emerald-400 font-bold ml-1">{score}</span></span>
                  <span className="text-slate-400">步 <span className="text-blue-400 font-bold ml-1">{moves}</span></span>
                </div>
                <button
                  onClick={handleExitFullscreen}
                  className="p-1 px-2.5 rounded-lg bg-slate-900/90 text-slate-200 border border-slate-700 flex items-center gap-1 text-xs"
                >
                  <Minimize2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>退出</span>
                </button>
              </div>
            )}
          </div>

          {/* 第二區：主要遊戲棋盤（合理最大化） */}
          <div className="w-full flex-1 flex items-center justify-center relative z-10 py-1 min-h-0">
            {assetsReady ? (
              <GameBoard
                grid={grid}
                swapSignal={swapSignal}
                swappingPair={swappingPair}
                isProcessing={isProcessing}
                onInteraction={handleInteraction}
                onDiscard={handleDiscard}
                isFullscreen={isFullscreen}
                isLandscape={false}
                onSound={playSound}
              />
            ) : (
              <RuneEvolutionLoader
                loadedCount={assetProgress.loaded}
                totalCount={assetProgress.total}
                failedCount={assetProgress.failed}
                onRetry={handleRetryAssets}
              />
            )}
          </div>

          {/* 第三與第四區：輔助資訊與廣告區域 */}
          <div className="w-full shrink-0 flex flex-col items-center gap-1 pb-1 z-20">
            <div className="text-center text-[10px] text-slate-500 font-medium">
              連線 3 個相同符文進行合成 · 拖至邊界插槽可銷毀
            </div>
            <EdgeAdBanner position="bottom" />
          </div>
        </div>
      )}

      {/* 說明彈窗 */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-slate-900 border border-slate-700 p-6 rounded-2xl max-w-md w-full shadow-2xl overflow-y-auto max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-5 flex items-center gap-2.5 text-white">
                <HelpCircle className="text-blue-500 w-6 h-6" /> 符文操作手冊
              </h2>
              <ul className="space-y-4 text-slate-300 text-xs">
                <li className="flex gap-3 items-start">
                  <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 shrink-0">
                    <Move className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-emerald-200 block uppercase tracking-wide mb-0.5">連線與計分</strong>
                    <p>水平或垂直連線 3 個以上相同符文即可消除並合成更高階符文。</p>
                    <ul className="list-disc list-inside mt-1 text-[11px] text-slate-400 space-y-0.5">
                      <li>Lv1 ~ Lv4 消除：獲得 <span className="text-emerald-300">等級 x 數量</span> 分。</li>
                      <li><span className="text-amber-400">Lv5 (終極神龍)</span>：觸發全行列消除光芒！</li>
                      <li>Lv5 額外獎勵：消除或銷毀皆獲 <span className="text-amber-400">+10 分</span>。</li>
                    </ul>
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 shrink-0">
                    <Shuffle className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-indigo-200 block uppercase tracking-wide mb-0.5">戰術重洗</strong>
                    卡關時可打亂棋盤符文，尋找新的連線機會。
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <div className="p-2 bg-red-500/10 rounded-lg text-red-400 shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-red-200 block uppercase tracking-wide mb-0.5">虛空銷毀</strong>
                    將暫時不需要的符文拖曳至棋盤外圍虛空插槽即可銷毀。
                  </div>
                </li>
              </ul>
              <button
                onClick={() => setShowHelp(false)}
                className="mt-6 w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-sm transition-colors text-white"
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
