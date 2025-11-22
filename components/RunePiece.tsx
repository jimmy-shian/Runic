import React from 'react';
import { motion, Variants } from 'framer-motion';
import { Rune, RuneLevel } from '../types';
import { TYPE_CONFIG, LEVEL_CONFIG } from '../constants';

interface RunePieceProps {
  rune: Rune | null;
  isSelected?: boolean;         // 是否被選中/拖曳中
  isMatchHighlighted?: boolean; // 是否為消除連線的高亮
  isDeleted?: boolean;          // 標記已被刪除 (消失動畫用)
  isAboutToDelete?: boolean;    // [New] 標記是否在刪除區上方 (發抖預覽用)
  cellId: number;
}

export const RunePiece: React.FC<RunePieceProps> = ({
  rune,
  isSelected,
  isMatchHighlighted,
  isDeleted,
  isAboutToDelete, // 新增屬性接收
  cellId,
}) => {
  if (!rune) return null;

  const typeData = TYPE_CONFIG[rune.type];

  const isLv1 = rune.level === RuneLevel.Drop;
  const isLv2 = rune.level === RuneLevel.Gem;
  const isLv3 = rune.level === RuneLevel.Crystal;
  const isLv4 = rune.level === RuneLevel.Tome;

  // 1. 解決顏色殘留：
  // 如果沒有任何特殊狀態，強制回歸正常顯示。
  // 這裡我們根據狀態決定 class，而不依賴之前的狀態殘留
  const baseClass = `relative flex items-center justify-center ${isSelected ? 'z-[100]' : ''}`;
  const highlightClass = isMatchHighlighted 
    ? `ring-4 ring-white scale-110 z-20 brightness-150 contrast-125 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]` 
    : '';
  
  // 當在拖曳中(isSelected)通常會變半透明，但如果取消拖曳，這裡會重繪，
  // 下面的 framer-motion animate 會負責把 opacity 拉回 1
  
  const selectionOverlay = isSelected ? (
    <motion.div 
        initial={{ opacity: 0, y: 5 }} 
        animate={{ opacity: 1, y: 0 }}
        className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white text-[11px] font-black px-3 py-1 rounded-full border border-white/30 whitespace-nowrap z-50 pointer-events-none shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
    >
        Lv.{rune.level}
    </motion.div>
  ) : null;

  const deletedOverlay = isDeleted ? (
    <motion.div
      initial={{ scale: 0, opacity: 1 }}
      animate={{ scale: 1.2, opacity: 0 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 border-4 border-red-500 rounded-full pointer-events-none"
    />
  ) : null;

  // 2. 解決掉落感 (Gravity)：
  // 將 y: -20 改為 y: -200 (或更大)，讓它從畫面上方更遠處掉下來
  const dropInitial = rune.isNew ? { y: -150, opacity: 0, scale: 0.5 } : false;

  // 3. 解決移除區發抖 (Shake)：
  // 定義通用的動畫狀態
  const getAnimationState = () => {
    if (rune.justMerged) return { scale: [1, 1.2, 1], rotate: 0, y: 0, opacity: 1 };
    
    // 如果正在刪除區上方懸停 -> 發抖
    if (isAboutToDelete) {
      return {
        x: [0, -3, 3, -3, 3, 0], // 左右晃動
        rotate: [0, -5, 5, -5, 5, 0], // 輕微旋轉
        scale: 0.9, // 稍微縮小表示"危險"
        transition: { duration: 0.4, repeat: Infinity }
      };
    }

    // 正常狀態 (確保 opacity 回到 1，解決殘留變淡問題)
    return { y: 0, opacity: 1, scale: 1, x: 0, rotate: 0 };
  };

  const Icon = typeData.icon;

  // 共用的 Motion Div Props
  const motionProps = {
    key: rune.id || cellId,
    layoutId: rune.id, // 這是 Framer Motion 處理位置交換的核心
    initial: dropInitial,
    animate: getAnimationState(),
    // 當 layoutId 變化(交換)時的過渡設定
    transition: { 
      type: "spring", 
      stiffness: 400, 
      damping: 25,
      opacity: { duration: 0.2 } // 確保透明度變化迅速
    },
    className: "w-full h-full flex items-center justify-center pointer-events-none select-none"
  };

  // ------------------- Lv1 -------------------
  if (isLv1) {
    return (
      <motion.div {...motionProps}>
        <div className={`${baseClass} w-[90%] h-[90%] ${highlightClass}`}>
            <div className={`absolute inset-0 ${typeData.color.replace('text-', 'bg-')}/20 blur-md rounded-full transform scale-75`} />
            <Icon className={`w-full h-full ${typeData.color} drop-shadow-md filter saturate-150`} strokeWidth={2.5} fill="currentColor" fillOpacity={0.15} />
            {selectionOverlay}
            {deletedOverlay}
        </div>
      </motion.div>
    );
  }

  // ------------------- Lv2 -------------------
  if (isLv2) {
    return (
      <motion.div {...motionProps}>
        <div className={`${baseClass} w-[90%] h-[90%] rounded-full bg-gradient-to-br ${typeData.gradient} border-2 border-white/30 shadow-lg ${highlightClass}`}>
            <div className="absolute inset-0 rounded-full bg-white/10" />
            <Icon className="text-white w-1/2 h-1/2 drop-shadow-md" strokeWidth={2.5} />
            {selectionOverlay}
            {deletedOverlay}
        </div>
      </motion.div>
    );
  }

  // ------------------- Lv3 -------------------
  if (isLv3) {
    return (
      <motion.div {...motionProps}>
        <div className={`${baseClass} w-[90%] h-[90%] rotate-45 bg-gradient-to-b ${typeData.gradient} border border-white/50 shadow-xl ${typeData.glow} ${highlightClass}`}>
            <div className="-rotate-45 flex items-center justify-center w-full h-full">
                 <Icon className="text-white w-3/5 h-3/5 drop-shadow-md" strokeWidth={2.5} />
            </div>
            {selectionOverlay}
            {deletedOverlay}
        </div>
      </motion.div>
    );
  }

  // ------------------- Lv4 -------------------
  if (isLv4) {
    return (
      <motion.div {...motionProps}>
        <div className={`${baseClass} w-[90%] h-[90%] rounded-sm bg-gradient-to-tr from-slate-900 via-${typeData.bg.split('-')[1]}-700 to-${typeData.bg.split('-')[1]}-500 border-2 ${typeData.border} shadow-2xl ${highlightClass}`}>
            <div className="absolute left-1 top-1 bottom-1 w-[2px] bg-white/20" />
            <Icon className={`${typeData.color} w-3/5 h-3/5 drop-shadow-lg`} strokeWidth={2} />
            {selectionOverlay}
            {deletedOverlay}
        </div>
      </motion.div>
    );
  }

  // ------------------- Lv5 -------------------
  const BladeIcon = LEVEL_CONFIG[RuneLevel.Blade].icon;
  return (
    <motion.div {...motionProps} className={`${motionProps.className} z-10`}>
       <div className={`${baseClass} w-[95%] h-[95%] ${highlightClass}`}>
            <div className={`absolute inset-0 bg-${typeData.bg.split('-')[1]}-500/30 blur-xl rounded-full animate-pulse`} />
            <BladeIcon className={`${typeData.bg.replace('bg-', 'text-')} w-full h-full drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]`} strokeWidth={2.5} />
            {selectionOverlay}
            {deletedOverlay}
       </div>
    </motion.div>
  );
};