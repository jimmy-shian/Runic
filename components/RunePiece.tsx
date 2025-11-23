import React from 'react';
import { motion } from 'framer-motion';
import { Rune, RuneLevel } from '../types';
import { TYPE_CONFIG, LEVEL_CONFIG } from '../constants';

interface RunePieceProps {
  rune: Rune | null;
  isSelected?: boolean;
  isMatchHighlighted?: boolean;
  isDeleted?: boolean;
  isAboutToDelete?: boolean;
  isDragging?: boolean;
  cellId: number;
  isPointerDown?: boolean;
}

export const RunePiece: React.FC<RunePieceProps> = ({
  rune,
  isSelected,
  isMatchHighlighted,
  isDeleted,
  isAboutToDelete,
  isDragging, 
  cellId,
  isPointerDown,
}) => {
  if (!rune) return null;

  const typeData = TYPE_CONFIG[rune.type];
  const isLv1 = rune.level === RuneLevel.Drop;
  const isLv2 = rune.level === RuneLevel.Gem;
  const isLv3 = rune.level === RuneLevel.Crystal;
  const isLv4 = rune.level === RuneLevel.Tome;

  // 嚴格選中條件
  const strictSelected =
    isSelected &&
    !isPointerDown &&
    !isDragging &&
    !isAboutToDelete;

  const strictMatch =
    isMatchHighlighted &&
    !isDragging &&
    !isPointerDown;

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

  const dropInitial = rune.isNew ? { y: -200, opacity: 0, scale: 0.5 } : false;

  const getAnimationState = () => {
    if (isShaking) {
      return {
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
      return { scale: [1, 1.3, 1], rotate: [0, 10, -10, 0], filter: "brightness(1.5)" };

    return { y: 0, opacity: 1, scale: 1, x: 0, rotate: 0, filter: "brightness(1)" };
  };

  const Icon = typeData.icon;

  const motionProps = {
    key: rune.id || cellId,
    layoutId: isShaking ? undefined : rune.id,
    initial: dropInitial,
    animate: getAnimationState(),
    transition: isShaking
      ? { duration: 0.25 }
      : { type: "spring" as const, stiffness: 400, damping: 25 },
    className: `w-full h-full flex items-center justify-center select-none ${wrapperZIndex} ${visibilityClass} relative`
  };

  const renderShape = () => {
    if (isLv1) {
      return (
        <div className={`${baseClass} w-[80%] h-[80%] ${shapeEffectLv1}`}>
            <div className={`absolute inset-0 ${typeData.color.replace('text-', 'bg-')}/10 blur-xl rounded-full scale-50`} />
            <Icon 
              className={`w-[70%] h-[70%] ${typeData.color} drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] filter saturate-150`} 
              strokeWidth={2.5} 
              fill={typeData.solidColor} 
              fillOpacity={0.2} 
            />
        </div>
      );
    }
    if (isLv2) {
      return (
        <div className={`${baseClass} w-[80%] h-[80%] rounded-full bg-gradient-to-br ${typeData.gradient} border-2 border-white/40 shadow-lg ${shapeEffect}`}>
            <div className="absolute inset-0 rounded-full bg-black/10" />
            <div className="absolute top-1 right-2 w-2 h-2 bg-white/60 rounded-full blur-[1px]" />
            <Icon className="text-white w-1/2 h-1/2 drop-shadow-md relative z-10" strokeWidth={2.5} />
        </div>
      );
    }
    if (isLv3) {
      return (
        <div className={`${baseClass} w-[72%] h-[72%] rotate-45 bg-gradient-to-b ${typeData.gradient} border border-white/60 shadow-xl ${typeData.glow} ${shapeEffect}`}>
             <div className="absolute inset-0 bg-white/10" />
            <div className="-rotate-45 flex items-center justify-center w-full h-full relative z-10">
                 <Icon className="text-white w-3/5 h-3/5 drop-shadow-md" strokeWidth={2.5} />
            </div>
        </div>
      );
    }
    if (isLv4) {
      return (
        <div className={`${baseClass} w-[70%] h-[85%] rounded bg-gradient-to-tr from-slate-900 via-${typeData.bg.split('-')[1]}-700 to-${typeData.bg.split('-')[1]}-500 border-2 ${typeData.border} shadow-2xl ${shapeEffect}`}>
            <div className="absolute left-1.5 top-1 bottom-1 w-[2px] bg-white/30" />
            <div className="absolute right-1 top-1 bottom-1 w-[4px] bg-black/20 rounded-r" />
            <Icon className={`${typeData.color} w-3/5 h-3/5 drop-shadow-lg relative z-10`} strokeWidth={2} />
        </div>
      );
    }
    const BladeIcon = LEVEL_CONFIG[RuneLevel.Blade].icon;
    return (
       <div className={`${baseClass} w-[95%] h-[95%] ${shapeEffect}`}>
           <div className={`absolute inset-0 border-2 border-dashed ${typeData.border} rounded-full animate-[spin_6s_linear_infinite] opacity-60`} />
           <div className={`absolute inset-1 border border-dotted ${typeData.color.replace('text-', 'border-')} rounded-full animate-[spin_4s_linear_infinite_reverse] opacity-40`} />
           <div className={`absolute inset-2 bg-${typeData.bg.split('-')[1]}-500/20 blur-md rounded-full animate-pulse`} />
           <BladeIcon className={`${typeData.bg.replace('bg-', 'text-')} w-full h-full drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] filter brightness-110 relative z-10`} strokeWidth={2.5} />
           <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-tr from-transparent via-white/30 to-transparent opacity-0 animate-pulse rounded-full" />
       </div>
    );
  };

  return (
    <motion.div {...motionProps}>
      {renderShape()}
      {selectionOverlay}
      {deletedOverlay}
    </motion.div>
  );
};