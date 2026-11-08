import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RuneLevel, RuneType } from '../types';
import {
  ORDERED_ELEMENTS,
  ELEMENT_NAMES,
  LEVEL_TITLES,
  getRuneImageUrl,
  isRuneAssetLoaded,
} from '../runeAssets';
import { TYPE_CONFIG } from '../constants';
import { RotateCcw } from 'lucide-react';

interface RuneEvolutionLoaderProps {
  loadedCount: number;
  totalCount: number;
  failedCount: number;
  onRetry: () => void;
  onReadyToEnter?: () => void;
  canEnter?: boolean;
}

/**
 * 五元素進化動態載入系統（R-04, R-05）
 * 展現五元素凝聚 → 符文成長 → 終極形態
 */
export const RuneEvolutionLoader: React.FC<RuneEvolutionLoaderProps> = ({
  loadedCount,
  totalCount,
  failedCount,
  onRetry,
}) => {
  const [elementIndex, setElementIndex] = useState(0);
  const [currentLevel, setCurrentLevel] = useState<RuneLevel>(RuneLevel.Drop);

  const currentType = ORDERED_ELEMENTS[elementIndex];
  const typeConfig = TYPE_CONFIG[currentType];
  const elementName = ELEMENT_NAMES[currentType];
  const levelTitle = LEVEL_TITLES[currentLevel];
  const isUltimate = currentLevel === RuneLevel.Blade;

  // 動態推進進化階段：Lv1 -> Lv2 -> Lv3 -> Lv4 -> Lv5 -> 下一個元素
  useEffect(() => {
    const isLv5 = currentLevel === RuneLevel.Blade;
    const intervalTime = isLv5 ? 1300 : 850; // Lv5 終極形態稍作停留展示

    const timer = setTimeout(() => {
      if (currentLevel < RuneLevel.Blade) {
        setCurrentLevel((prev) => (prev + 1) as RuneLevel);
      } else {
        // 切換下一個元素並重置至 Lv1
        setCurrentLevel(RuneLevel.Drop);
        setElementIndex((prev) => (prev + 1) % ORDERED_ELEMENTS.length);
      }
    }, intervalTime);

    return () => clearTimeout(timer);
  }, [currentLevel, elementIndex]);

  const imageUrl = getRuneImageUrl(currentType, currentLevel);
  const isLoaded = isRuneAssetLoaded(currentType, currentLevel);
  const percent = Math.round((loadedCount / totalCount) * 100);

  return (
    <div className="w-full flex flex-col items-center justify-between py-6 px-4 select-none min-h-[380px] text-slate-100">
      {/* 頂部：品牌與當前元素凝聚 */}
      <div className="flex flex-col items-center gap-1">
        <h2 className="text-xl md:text-2xl font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-emerald-300 to-amber-300">
          RUNIC SYNTHESIS
        </h2>
        <div className="flex items-center gap-2 mt-1">
          <span
            className="w-2.5 h-2.5 rounded-full animate-pulse"
            style={{ backgroundColor: typeConfig.solidColor }}
          />
          <span className="text-xs font-medium text-slate-300 tracking-widest uppercase">
            正在凝聚{elementName}
          </span>
        </div>
      </div>

      {/* 中央：五元素符文進化主舞台 */}
      <div className="relative flex items-center justify-center my-6 w-56 h-56">
        {/* 背景柔和元素能量光暈 */}
        <motion.div
          animate={{
            scale: isUltimate ? [1, 1.25, 1.1] : [0.9, 1.1, 0.95],
            opacity: isUltimate ? [0.6, 0.9, 0.7] : [0.35, 0.6, 0.4],
          }}
          transition={{ duration: isUltimate ? 1.2 : 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-full blur-2xl pointer-events-none"
          style={{ backgroundColor: typeConfig.solidColor }}
        />

        {/* 終極形態環形擴散波（Lv5） */}
        {isUltimate && (
          <motion.div
            initial={{ scale: 0.6, opacity: 0.9 }}
            animate={{ scale: 1.6, opacity: 0 }}
            transition={{ duration: 1.1, repeat: Infinity, ease: 'easeOut' }}
            className="absolute inset-0 rounded-full pointer-events-none border-2"
            style={{ borderColor: typeConfig.solidColor }}
          />
        )}

        {/* 進化切換動畫核心（縮放與淡入淡出） */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentType}-${currentLevel}`}
            initial={{ opacity: 0, scale: 0.75, rotate: -6 }}
            animate={{ opacity: 1, scale: isUltimate ? 1.08 : 0.96, rotate: 0 }}
            exit={{ opacity: 0, scale: 1.15, filter: 'brightness(2)' }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            className="relative w-44 h-44 flex items-center justify-center z-10"
          >
            <img
              src={imageUrl}
              alt={`${elementName} Lv.${currentLevel}`}
              draggable={false}
              className="w-full h-full object-contain pointer-events-none filter drop-shadow-[0_8px_20px_rgba(0,0,0,0.8)]"
              style={{
                filter: `drop-shadow(0 0 ${isUltimate ? '20px' : '12px'} ${typeConfig.solidColor})`,
              }}
            />
          </motion.div>
        </AnimatePresence>

        {/* 底部浮動階級標籤 */}
        <div className="absolute -bottom-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 shadow-lg backdrop-blur-md z-20">
          <span
            className="font-mono text-xs font-bold"
            style={{ color: typeConfig.solidColor }}
          >
            Lv.{currentLevel}
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-600" />
          <span className="text-[11px] text-slate-300 font-medium">
            {levelTitle}
          </span>
        </div>
      </div>

      {/* 底部：真實載入進度與狀態 */}
      <div className="w-full max-w-xs flex flex-col items-center gap-2">
        <div className="w-full flex justify-between items-center text-xs text-slate-400 font-mono">
          <span>符文載入進度</span>
          <span className="text-emerald-400 font-bold">{loadedCount} / {totalCount} ({percent}%)</span>
        </div>

        {/* 進度條 */}
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden p-0.5 border border-slate-700/60">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 via-emerald-400 to-amber-400"
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* 失敗重試提示 */}
        {failedCount > 0 && (
          <div className="flex items-center gap-2 mt-1 text-xs text-amber-400 bg-amber-950/40 border border-amber-800/60 rounded-xl px-3 py-1.5">
            <span>{failedCount} 個素材載入受阻</span>
            <button
              onClick={onRetry}
              className="flex items-center gap-1 underline font-bold hover:text-amber-300 active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              重試
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
