import React, { useState, useRef, useLayoutEffect } from 'react';
import { getRuneImageUrl } from '../runeAssets';
import { motion, AnimatePresence } from 'framer-motion';
import { Rune, RuneLevel, RuneType } from '../types';
import { TYPE_CONFIG } from '../constants';

const fragmentDirections = Array.from({ length: 8 }, (_, index) => ({
  x: Math.cos((index * Math.PI) / 4) * 38,
  y: Math.sin((index * Math.PI) / 4) * 38,
}));

export const getRuneVisualSize = (level: RuneLevel) => {
  switch (level) {
    case RuneLevel.Drop: // Lv1: 基礎元素
      return { width: '84%', height: '84%' };
    case RuneLevel.Gem: // Lv2: 成長結晶
      return { width: '92%', height: '92%' };
    case RuneLevel.Crystal: // Lv3: 魔法典籍
      return { width: '94%', height: '94%' };
    case RuneLevel.Tome: // Lv4: 元素神劍
      return { width: '98%', height: '98%' };
    case RuneLevel.Blade: // Lv5: 終極神龍形態
      return { width: '100%', height: '100%' };
    default:
      return { width: '88%', height: '88%' };
  }
};

/**
 * 符文圖片渲染元件：
 * 嚴格使用 25 張正式 PNG 素材。
 * 不得以舊 SVG 靜默取代。失敗時呈現明確缺損指示，並記錄錯誤。
 */
export const RuneImage: React.FC<{
  type: RuneType;
  level: RuneLevel;
  className?: string;
  glow?: boolean;
}> = ({ type, level, className = '', glow = true }) => {
  const url = getRuneImageUrl(type, level);
  const [loadError, setLoadError] = useState(false);
  const typeConfig = TYPE_CONFIG[type];

  // 色調與光暈
  const isEarth = type === RuneType.Earth;
  const isLv5 = level === RuneLevel.Blade;
  const earthHue = isEarth ? 'hue-rotate(14deg) saturate(1.15) ' : '';
  const brightnessVal = isLv5 ? 1.15 : level === RuneLevel.Gem ? 1.12 : 1.0;
  const dropShadow = glow
    ? `drop-shadow(0 0 ${isLv5 ? '16px' : '10px'} ${typeConfig.solidColor}${isLv5 ? 'ee' : 'aa'})`
    : '';

  if (loadError) {
    // 嚴格呈現正式缺失狀態，禁止偷偷換成舊 SVG
    return (
      <div
        className={`w-full h-full flex flex-col items-center justify-center rounded-xl border border-dashed border-red-500/80 bg-red-950/40 p-1 text-center ${className}`}
        title={`PNG 素材遺失或載入失敗: ${type} Lv.${level}`}
      >
        <span className="text-[9px] font-mono font-bold text-red-400">MISSING</span>
        <span className="text-[8px] text-red-400/80 font-mono">
          {type[0]}Lv{level}
        </span>
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={`${type} Lv.${level}`}
      loading="eager"
      decoding="async"
      draggable={false}
      onError={() => {
        console.error(`[RuneImage] 圖片載入失敗: ${url}`);
        setLoadError(true);
      }}
      className={`w-full h-full object-contain pointer-events-none select-none transition-transform duration-200 ${className}`}
      style={{
        filter: `${earthHue}brightness(${brightnessVal}) ${dropShadow}`,
      }}
    />
  );
};

interface RunePieceProps {
  rune: Rune | null;
  isSelected?: boolean;
  isMatchHighlighted?: boolean;
  isDeleted?: boolean;
  isClearing?: boolean;
  isAboutToDelete?: boolean;
  isDragging?: boolean;
  isSwapPreview?: boolean;
  cellId: number;
  isPointerDown?: boolean;
  cellHeight?: number;
}

export const RunePiece: React.FC<RunePieceProps> = ({
  rune,
  isSelected,
  isMatchHighlighted,
  isDeleted,
  isClearing,
  isAboutToDelete,
  isDragging: dragging,
  isSwapPreview,
  cellId,
  cellHeight = 64,
}) => {
  const element = useRef<HTMLDivElement>(null);
  const previous = useRef<Rune | null>(null);

  useLayoutEffect(() => {
    const old = previous.current;
    previous.current = rune;
    if (!rune || old?.id === rune.id || !rune.fallRows) return;
    const animation = element.current?.animate(
      [
        {
          transform: `translateY(${-cellHeight * rune.fallRows}px) scale(${rune.isNew ? 0.5 : 1})`,
          opacity: rune.isNew ? 0 : 1,
        },
        { transform: 'translateY(0) scale(1)', opacity: 1 },
      ],
      { duration: 220, easing: 'cubic-bezier(.2,.8,.2,1)' }
    );
    return () => animation?.cancel();
  }, [rune?.id, cellHeight]);

  if (!rune) return null;
  const isDragging = dragging && !isSwapPreview;
  const typeData = TYPE_CONFIG[rune.type];

  // 選中條件
  const strictSelected = isSelected && !isDragging && !isAboutToDelete;
  const strictMatch = isMatchHighlighted && !isDragging;
  const shouldHighlight = strictSelected || strictMatch;

  let wrapperZIndex = 'z-10';
  if (strictSelected) wrapperZIndex = 'z-[100]';
  if (isAboutToDelete) wrapperZIndex = 'z-50';

  let visibilityClass = 'opacity-100';
  if (isDragging) {
    visibilityClass = isAboutToDelete ? 'opacity-100' : 'opacity-0';
  }

  // 選中指示標籤（乾淨精緻，不遮擋棋盤）
  const selectionOverlay = strictSelected ? (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      className="absolute -top-9 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-[101]"
    >
      <div className="bg-slate-900/95 text-emerald-300 text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border border-emerald-500/50 shadow-lg whitespace-nowrap">
        Lv.{rune.level}
      </div>
      <div className="w-2 h-2 bg-slate-900/95 border-b border-r border-emerald-500/50 rotate-45 -mt-1" />
    </motion.div>
  ) : null;

  const deletedOverlay = isDeleted ? (
    <motion.div
      initial={{ scale: 0, opacity: 1 }}
      animate={{ scale: 1.4, opacity: 0 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 border-2 border-red-500 rounded-full pointer-events-none z-50"
    />
  ) : null;

  // 合成動畫（R-06：不同等級的視覺強度）
  const isMerged = !!rune.justMerged;
  const isUltimate = rune.level === RuneLevel.Blade;

  const getAnimationState = () => {
    if (isClearing) {
      return {
        scale: [1, 1.15, 0.1],
        rotate: [0, -6, 16],
        opacity: [1, 1, 0],
        filter: ['brightness(1)', 'brightness(2.2)', 'brightness(1.5)'],
        transition: { duration: 0.22, ease: 'easeIn' as const },
      };
    }
    if (isAboutToDelete) {
      return {
        opacity: 0.85,
        x: [-2, 2, -2, 2, 0],
        rotate: [-3, 3, -3, 3, 0],
        scale: [1, 0.95, 0.98, 1],
        filter: 'brightness(1.3) sepia(0.6) hue-rotate(-50deg)',
        transition: { duration: 0.25, repeat: Infinity, ease: 'easeInOut' as const },
      };
    }
    if (isMerged) {
      // 合成進化動畫
      if (isUltimate) {
        // Lv5 終極形態爆發
        return {
          scale: [0.85, 1.35, 1],
          rotate: [0, -10, 10, 0],
          filter: ['brightness(1.8)', 'brightness(2.5)', 'brightness(1)'],
          transition: { duration: 0.45, ease: 'easeOut' as const },
        };
      }
      return {
        scale: [0.9, 1.22, 1],
        filter: ['brightness(1.5)', 'brightness(1.8)', 'brightness(1)'],
        transition: { duration: 0.3, ease: 'easeOut' as const },
      };
    }
    return { y: 0, opacity: 1, scale: 1, x: 0, rotate: 0, filter: 'brightness(1)' };
  };

  const renderShape = () => (
    <div
      style={getRuneVisualSize(rune.level)}
      className={`relative flex items-center justify-center w-full h-full ${
        shouldHighlight ? 'scale-105 drop-shadow-[0_0_12px_rgba(255,255,255,0.7)]' : ''
      }`}
    >
      <RuneImage type={rune.type} level={rune.level} />
    </div>
  );

  return (
    <div ref={element} className="rune-position w-full h-full relative">
      <motion.div
        key={cellId}
        animate={getAnimationState()}
        className={`w-full h-full flex items-center justify-center select-none ${wrapperZIndex} ${visibilityClass} relative`}
      >
        {renderShape()}
        <AnimatePresence>{selectionOverlay}</AnimatePresence>
        <AnimatePresence>{deletedOverlay}</AnimatePresence>
      </motion.div>

      {/* 合成進化時的環形擴散光效（R-06） */}
      {isMerged && (
        <motion.div
          initial={{ scale: 0.4, opacity: 1 }}
          animate={{ scale: isUltimate ? 2.2 : 1.6, opacity: 0 }}
          transition={{ duration: isUltimate ? 0.5 : 0.35, ease: 'easeOut' }}
          className="absolute inset-0 rounded-full pointer-events-none z-30"
          style={{
            boxShadow: `0 0 ${isUltimate ? '28px 12px' : '16px 6px'} ${typeData.solidColor}`,
            border: `2px solid ${typeData.solidColor}`,
          }}
        />
      )}

      {/* 消除碎片光芒 */}
      {isClearing && (
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none z-50">
          {fragmentDirections.map((direction, index) => (
            <motion.span
              key={index}
              className="absolute left-1/2 top-1/2 w-1.5 h-1.5 rounded-sm"
              style={{
                backgroundColor: typeData.solidColor,
                boxShadow: `0 0 6px ${typeData.solidColor}`,
              }}
              initial={{ x: 0, y: 0, rotate: index * 45, scale: 1, opacity: 1 }}
              animate={{
                x: direction.x,
                y: direction.y,
                rotate: index * 45 + 100,
                scale: 0,
                opacity: 0,
              }}
              transition={{ type: 'tween', duration: 0.24, ease: 'easeOut' }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
