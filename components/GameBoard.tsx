import React, { useState, useEffect } from 'react';
import { GridState } from '../types';
import { RunePiece } from './RunePiece';
import { GRID_SIZE } from '../constants';
import { X } from 'lucide-react';

interface GameBoardProps {
  grid: GridState;
  isProcessing: boolean;
  onInteraction: (fromId: number, toId: number) => void;
  onDiscard: (fromId: number) => void;
  isFullscreen: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  grid,
  isProcessing,
  onInteraction,
  onDiscard,
  isFullscreen
}) => {
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  
  // 修改 1: 改用具體的 ID 來追蹤是哪一個外部格子被 hover，而不是全域 boolean
  const [activeVoidId, setActiveVoidId] = useState<string | null>(null);
  
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    if (selectedId !== null && !grid[selectedId]?.rune) {
        setSelectedId(null);
    }
  }, [grid, selectedId]);

  const selectedRune = selectedId !== null ? grid[selectedId]?.rune : null;

  // ---------------- Drag & Drop Handlers ----------------

  const handleDragStart = (e: React.DragEvent, id: number) => {
    if (isProcessing) {
      e.preventDefault();
      return;
    }
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id.toString());
    
    // 隱藏預設的拖曳半透明圖層，因為我們用 Grid 內的元素交換來做視覺效果
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  // 修改 3: 新增 DragEnd 處理，確保無論在哪裡放開，狀態都會被重置
  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
    setActiveVoidId(null);
    // 注意：這裡不清除 selectedId，讓使用者可以繼續操作
  };

  const handleDragOverCell = (e: React.DragEvent, id: number) => {
    e.preventDefault();
    if (isProcessing || draggedId === null) return;
    
    // 如果滑回格子內，要清除外部格子的紅色高亮
    if (activeVoidId !== null) setActiveVoidId(null);

    const fX = draggedId % GRID_SIZE;
    const fY = Math.floor(draggedId / GRID_SIZE);
    const tX = id % GRID_SIZE;
    const tY = Math.floor(id / GRID_SIZE);
    const isAdjacent = Math.abs(fX - tX) + Math.abs(fY - tY) === 1;

    if (isAdjacent) {
        e.dataTransfer.dropEffect = 'move';
        setDragOverId(id);
    } else {
        e.dataTransfer.dropEffect = 'none';
        setDragOverId(null);
    }
  };

  const handleDropCell = (e: React.DragEvent, id: number) => {
    e.preventDefault();
    if (draggedId !== null && draggedId !== id) {
      onInteraction(draggedId, id);
    }
    // 狀態重置由 handleDragEnd 統一處理，這裡也可以呼叫，雙保險
    handleDragEnd();
    setSelectedId(null); 
  };

  // 修改 1 & 2: 針對特定 VoidSlot 的 DragOver
  const handleVoidDragOver = (e: React.DragEvent, voidId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // 只有當 ID 不同時才更新 state，避免頻繁渲染
    if (activeVoidId !== voidId) {
        setActiveVoidId(voidId);
        setDragOverId(null); // 確保不會同時選中格子
    }
  };

  const handleVoidDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedId !== null) {
        onDiscard(draggedId);
    }
    handleDragEnd();
    setSelectedId(null);
  };

  const handleClick = (id: number) => {
      if (isProcessing) return;
      if (selectedId === id) {
          setSelectedId(null);
      } else {
          setSelectedId(id);
      }
  };

  // ---------------- Sub-components ----------------

  // 修改: VoidSlot 接收 id 和 active 狀態
  const VoidSlot = ({ id, isCorner = false }: { id: string, isCorner?: boolean }) => {
      if (isCorner) {
          return <div className="invisible aspect-square" />;
      }

      // 判斷自己是否為當前被 hover 的那個格子
      const isActive = activeVoidId === id;

      return (
        <div 
            className={`
                flex items-center justify-center rounded-xl
                border-2 border-dashed transition-all duration-200 aspect-square
                ${isActive 
                    ? 'border-red-500 bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.4)] scale-105 z-10' 
                    : 'border-slate-700/30 bg-slate-900/30'
                }
            `}
            onDragOver={(e) => handleVoidDragOver(e, id)}
            onDrop={handleVoidDrop}
        >
            {isActive && <X className="w-6 h-6 text-red-500 animate-bounce" />}
        </div>
      );
  };

  return (
    <div className={`relative flex items-center justify-center ${isFullscreen ? 'h-full w-full' : ''}`}>
      
      <div 
        className="grid gap-2 p-4 rounded-2xl bg-slate-900 shadow-2xl"
        style={{
            gridTemplateColumns: `repeat(${GRID_SIZE + 2}, minmax(0, 1fr))`,
            width: isFullscreen ? 'min(95vh, 95vw)' : '100%',
            maxWidth: isFullscreen ? 'none' : '650px',
        }}
      >
        {/* Top Row */}
        {Array.from({ length: GRID_SIZE + 2 }).map((_, i) => (
            <VoidSlot key={`void-top-${i}`} id={`top-${i}`} isCorner={i === 0 || i === GRID_SIZE + 1} />
        ))}

        {/* Middle Grid */}
        {Array.from({ length: GRID_SIZE }).map((_, rowIdx) => (
            <React.Fragment key={`row-${rowIdx}`}>
                {/* Left Void Slot */}
                <VoidSlot id={`left-${rowIdx}`} />

                {/* Main Grid Cells */}
                {Array.from({ length: GRID_SIZE }).map((_, colIdx) => {
                    const cellIndex = rowIdx * GRID_SIZE + colIdx;
                    const cell = grid[cellIndex];
                    
                    let displayRune = cell.rune;
                    let isPhantom = false;

                    // 處理交換預覽邏輯
                    if (draggedId !== null && dragOverId !== null) {
                        if (cell.id === draggedId) {
                            displayRune = grid[dragOverId].rune;
                            isPhantom = true;
                        } else if (cell.id === dragOverId) {
                            displayRune = grid[draggedId].rune;
                        }
                    }

                    const isDraggingSource = draggedId === cell.id;
                    const isSelected = selectedId === cell.id;
                    
                    const isMatch = selectedRune && displayRune 
                        && displayRune.type === selectedRune.type 
                        && displayRune.level === selectedRune.level
                        && cell.id !== selectedId;

                    // 修改 2: 判斷是否需要發抖
                    // 條件：這是被拖曳的來源格子 且 外部刪除區被激活
                    const isAboutToDelete = isDraggingSource && activeVoidId !== null;

                    return (
                        <div
                            key={cell.id}
                            className={`
                                relative w-full h-full rounded-xl
                                transition-all duration-200 aspect-square
                                flex items-center justify-center
                                bg-slate-800/50 border border-slate-700/30
                                ${dragOverId === cell.id ? 'bg-slate-700 ring-2 ring-white/20' : ''}
                                ${isSelected ? 'bg-slate-700 ring-2 ring-yellow-500/50' : ''}
                                ${isProcessing ? 'cursor-wait' : 'cursor-grab active:cursor-grabbing'}
                            `}
                            draggable={!isProcessing}
                            onDragStart={(e) => handleDragStart(e, cell.id)}
                            onDragEnd={handleDragEnd} // 重要：確保取消拖曳時重置狀態
                            onDragOver={(e) => handleDragOverCell(e, cell.id)}
                            onDrop={(e) => handleDropCell(e, cell.id)}
                            onClick={() => handleClick(cell.id)}
                        >
                            {displayRune && (
                                <div className={`w-full h-full ${
                                    // 如果正在拖曳，且不是交換目標(phantom)，也不是準備刪除(isAboutToDelete)
                                    // 則變淡。如果準備刪除(isAboutToDelete)，RunePiece 內部會處理透明度，這裡保持 100 以便顯示動畫
                                    isDraggingSource && !isPhantom && !isAboutToDelete ? 'opacity-20 scale-90' : 'opacity-100'
                                }`}>
                                     <RunePiece 
                                        rune={displayRune} 
                                        cellId={cell.id} // 補上 cellId prop
                                        isSelected={isSelected} 
                                        isMatchHighlighted={!!isMatch}
                                        // 傳入發抖狀態
                                        isAboutToDelete={isAboutToDelete}
                                     />
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Right Void Slot */}
                <VoidSlot id={`right-${rowIdx}`} />
            </React.Fragment>
        ))}

        {/* Bottom Row */}
        {Array.from({ length: GRID_SIZE + 2 }).map((_, i) => (
             <VoidSlot key={`void-bottom-${i}`} id={`bottom-${i}`} isCorner={i === 0 || i === GRID_SIZE + 1} />
        ))}
      </div>
      
      {/* 移除舊的全域提示，因為現在每個格子自己會亮 */}
    </div>
  );
};