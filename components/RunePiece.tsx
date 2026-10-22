import React, { useState, useRef, useLayoutEffect } from 'react';
import { getRuneImageUrl } from '../runeAssets';
import { motion } from 'framer-motion';
import { Rune, RuneLevel, RuneType } from '../types';
import { TYPE_CONFIG, LEVEL_CONFIG } from '../constants';

const fragmentDirections = Array.from({ length: 8 }, (_, index) => ({
  x: Math.cos(index * Math.PI / 4) * 38,
  y: Math.sin(index * Math.PI / 4) * 38,
}));

export const RuneImage: React.FC<{ type: RuneType; level: RuneLevel; className?: string }> = ({ type, level, className = '' }) => {
  const url = getRuneImageUrl(type, level);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const Icon = level === RuneLevel.Blade ? LEVEL_CONFIG[level].icon : TYPE_CONFIG[type].icon;
  return failedUrl === url
    ? <Icon aria-label={`${type} Lv.${level}`} className={`w-full h-full ${TYPE_CONFIG[type].color} ${className}`} />
    : <img src={url} alt={`${type} Lv.${level}`} loading="eager" decoding="async" draggable={false}
        onError={() => setFailedUrl(url)} className={`w-full h-full object-contain ${className}`}
        style={{ filter: `drop-shadow(0 0 12px ${TYPE_CONFIG[type].solidColor}cc)` }} />;
};

interface RunePieceProps {
  rune: Rune | null;
  isSelected?: boolean;
  isMatchHighlighted?: boolean;
  isDeleted?: boolean;
  isClearing?: boolean;
  isAboutToDelete?: boolean;
  isDragging?: boolean;
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
  isDragging, 
  cellId,
  isPointerDown,
  cellHeight = 64,
}) => {
  const element = useRef<HTMLDivElement>(null);
  const previous = useRef<Rune | null>(null);
  useLayoutEffect(() => {
    const old = previous.current;
    previous.current = rune;
    if (!rune || old?.id === rune.id || !rune.fallRows) return;
    const animation = element.current?.animate([
      { transform: `translateY(${-cellHeight * rune.fallRows}px) scale(${rune.isNew ? .5 : 1})`, opacity: rune.isNew ? 0 : 1 },
      { transform: 'translateY(0) scale(1)', opacity: 1 },
    ], { duration: 220, easing: 'cubic-bezier(.2,.8,.2,1)' });
    return () => animation?.cancel();
  }, [rune?.id, cellHeight]);
  if (!rune) return null;

  const typeData = TYPE_CONFIG[rune.type];
  const isLv1 = rune.level === RuneLevel.Drop;
  const isLv2 = rune.level === RuneLevel.Gem;
  const isLv3 = rune.level === RuneLevel.Crystal;
  const isLv4 = rune.level === RuneLevel.Tome;

  // 嚴格選中條件
  const strictSelected =
    isSelected &&
    !isDragging &&
    !isAboutToDelete;

  const strictMatch =
    isMatchHighlighted &&
    !isDragging;

  const shouldHighlight = strictSelected || strictMatch;

  // 層級管理
  let wrapperZIndex = 'z-10';
  if (strictSelected) wrapperZIndex = 'z-[100]';
  if (isAboutToDelete) wrapperZIndex = 'z-50';

  // 透明度
  let visibilityClass = 'opacity-100';
  if (isDragging) {
      visibilityClass = isAboutToDelete ? 'opacity-100' : 'opacity-0';
  }

  // 基本視覺
  const baseClass = "relative flex items-center justify-center";

  const shapeEffect = shouldHighlight && !isAboutToDelete
  ? `ring-3 ring-white ring-offset-2 ring-offset-slate-900 brightness-125 contrast-110 drop-shadow-[0_0_15px_rgba(255,255,255,0.9)] scale-110`
  : shouldHighlight && isAboutToDelete
    ? `ring-3 ring-white ring-offset-2 ring-offset-slate-900 brightness-125 contrast-110 drop-shadow-[0_0_15px_rgba(255,68,68,0.9)]`
    : '';

  const shapeEffectLv1 = shouldHighlight && !isAboutToDelete
    ? `ring-2 ring-white ring-offset-1 ring-offset-slate-900 brightness-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.6)] scale-105`
    : shouldHighlight && isAboutToDelete
      ? `ring-2 ring-white ring-offset-1 ring-offset-slate-900 brightness-110 drop-shadow-[0_0_8px_rgba(255,68,68,0.6)]`
      : '';


  // 選中標籤
  const selectionOverlay = strictSelected ? (
    <motion.div 
        initial={{ opacity: 0, y: 10, scale: 0.8 }} 
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="absolute -top-14 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center pointer-events-none z-[101]"
    >
        <div className="bg-slate-800 text-white text-[14px] font-black px-3 py-1 rounded-lg border-2 border-white shadow-[0_4px_15px_rgba(0,0,0,0.8)] whitespace-nowrap">
            Lv.{rune.level}
        </div>
        <div className="w-3 h-3 bg-slate-800 border-b-2 border-r-2 border-white rotate-45 -mt-1.5"></div>
    </motion.div>
  ) : null;

  const deletedOverlay = isDeleted ? (
    <motion.div
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: 1.5, opacity: 0 }}
        exit={{ opacity: 0, scale: 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 border-4 border-red-500 rounded-full pointer-events-none z-50"
    />
  ) : null;

  // --- 抖動動畫 ---
  const isShaking = isAboutToDelete;

  const dropInitial = false;

  const getAnimationState = () => {
    if (isClearing) {
      return { scale: [1, 1.18, .15], rotate: [0, -8, 20], opacity: [1, 1, 0],
        filter: ['brightness(1)', 'brightness(3)', 'brightness(1.5)'],
        transition: { duration: .28, ease: 'easeIn' as const } };
    }
    if (isShaking) {
      return {
        opacity: 1,
        x: [-3, 3, -3, 3, 0],
        rotate: [-5, 5, -5, 5, 0],
        scale: [1, 0.9, 0.95, 0.9, 1],
        y: 0,
        filter: "brightness(1.5) sepia(0.5) hue-rotate(-50deg)",
        transition: { 
            duration: 0.25,
            repeat: Infinity,
            ease: "easeInOut" as const
        }
      };
    }

    if (rune.justMerged)
      return { x: 0, y: 0, opacity: 1, scale: [1, 1.3, 1], rotate: [0, 10, -10, 0], filter: "brightness(1.5)" };

    return { y: 0, opacity: 1, scale: 1, x: 0, rotate: 0, filter: "brightness(1)" };
  };

  const Icon = typeData.icon;

  const motionProps = {
    initial: dropInitial,
    animate: getAnimationState(),
    transition: isShaking || isClearing || rune.justMerged
      ? { type: 'tween' as const, duration: isClearing ? .28 : .25 }
      : { type: "spring" as const, stiffness: 500, damping: 28 },
    className: `w-full h-full flex items-center justify-center select-none ${wrapperZIndex} ${visibilityClass} relative`
  };

  const renderShape = () => (
    <div className={`${baseClass} ${isLv1 || isLv2 ? 'w-[80%] h-[80%]' : isLv3 ? 'w-[72%] h-[72%]' : isLv4 ? 'w-[70%] h-[85%]' : 'w-[95%] h-[95%]'} ${isLv1 ? shapeEffectLv1 : shapeEffect}`}>
      <RuneImage type={rune.type} level={rune.level} />
    </div>
  );

  return (
    <div ref={element} className="rune-position w-full h-full"><motion.div key={cellId} {...motionProps}>
      {renderShape()}
      {selectionOverlay}
      {deletedOverlay}
    </motion.div>
      {isClearing && <div aria-hidden="true" className="absolute inset-0 pointer-events-none z-50">
        {fragmentDirections.map((direction, index) => <motion.span key={index}
          className="absolute left-1/2 top-1/2 w-2 h-2"
          style={{ backgroundColor: typeData.solidColor, clipPath: 'polygon(50% 0, 100% 35%, 65% 100%, 0 70%)', boxShadow: `0 0 6px ${typeData.solidColor}` }}
          initial={{ x: 0, y: 0, rotate: index * 45, scale: 1, opacity: 1 }}
          animate={{ x: direction.x, y: direction.y, rotate: index * 45 + 100, scale: 0, opacity: 0 }}
          transition={{ type: 'tween', duration: .32, ease: 'easeOut' }} />)}
      </div>}
    </div>
  );
};
