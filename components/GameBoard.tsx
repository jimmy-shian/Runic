import React, { useState, useEffect, useRef } from 'react';
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
  const [activeVoidId, setActiveVoidId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  
  // 用來防止在移動交換時誤判為丟棄
  const isHoveringGridRef = useRef(false);

  useEffect(() => {
    if (selectedId !== null && !grid[selectedId]?.rune) {
        setSelectedId(null);
    }
  }, [grid, selectedId]);

  const selectedRune = selectedId !== null ? grid[selectedId]?.rune : null;

  // ---------------- Helper: Auto-Detect Edge ----------------
  // 自動判斷：如果這個 ID 被拖到界外，它應該對應哪一個刪除區？
  const getAutoDiscardZone = (dragId: number): string | null => {
    const dX = dragId % GRID_SIZE;
    const dY = Math.floor(dragId / GRID_SIZE);

    // 判斷是否在邊緣 (Corner 會有兩個選擇，我們給定優先級：上下優先)
    if (dY === 0) return `top-${dX + 1}`;          // Top Row
    if (dY === GRID_SIZE - 1) return `bottom-${dX + 1}`; // Bottom Row
    if (dX === 0) return `left-${dY}`;             // Left Col
    if (dX === GRID_SIZE - 1) return `right-${dY}`; // Right Col
    
    return null; // 中間的符文不能丟
  };

  // ---------------- Drag & Drop Handlers ----------------

  const handleDragStart = (e: React.DragEvent, id: number) => {
    if (isProcessing) {
      e.preventDefault();
      return;
    }
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    // 設置 drag image 為透明，使用我們自定義的移動效果
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
    setActiveVoidId(null);
    isHoveringGridRef.current = false;
  };

  // 1. 格子內的 DragOver
  const handleDragOverCell = (e: React.DragEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation(); // 阻止事件冒泡到 Container，這很重要
    isHoveringGridRef.current = true;

    if (isProcessing || draggedId === null) return;
    
    // 如果回到格子內，馬上熄滅外部紅燈
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
    e.stopPropagation();
    if (draggedId !== null && draggedId !== id) {
      onInteraction(draggedId, id);
    }
    handleDragEnd();
    setSelectedId(null); 
  };

  // 2. 外部容器的 DragOver (寬鬆判定邏輯)
  const handleContainerDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    
    // 如果現在滑鼠正懸停在某個具體的格子上，不要觸發容器邏輯
    if (isHoveringGridRef.current) return;
    if (draggedId === null) return;

    // 計算這個符文是否是邊緣符文，如果是，應該亮哪個燈
    const targetZone = getAutoDiscardZone(draggedId);

    if (targetZone) {
        // 允許丟棄
        e.dataTransfer.dropEffect = 'move';
        // 亮起對應的紅燈
        if (activeVoidId !== targetZone) {
            setActiveVoidId(targetZone);
            setDragOverId(null); // 清除內部交換預覽
        }
    } else {
        // 不是邊緣符文，不能丟
        if (activeVoidId !== null) setActiveVoidId(null);
    }
  };

  // 3. 外部容器的 Drop (寬鬆丟棄執行)
  const handleContainerDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    // 只要當前有紅燈亮起 (代表符合丟棄資格)，且滑鼠在容器範圍內放開 -> 執行丟棄
    if (activeVoidId && draggedId !== null) {
        onDiscard(draggedId);
    }
    
    handleDragEnd();
    setSelectedId(null);
  };
  
  // 當離開格子進入容器時的處理
  const handleDragLeaveCell = () => {
    isHoveringGridRef.current = false;
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

  const VoidSlot = ({ id, isCorner = false }: { id: string, isCorner?: boolean }) => {
      if (isCorner) {
          // 角落保持不可見，但為了佈局還是要渲染
          return <div className="invisible aspect-square" />;
      }

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
            // 這些事件保留，為了兼容滑鼠真的滑過邊框的情況
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }} 
            onDrop={(e) => { e.preventDefault(); e.stopPropagation(); if(isActive && draggedId) onDiscard(draggedId); }}
        >
            {isActive && <X className="w-6 h-6 text-red-500 animate-bounce" />}
        </div>
      );
  };

  return (
    <div className={`relative flex items-center justify-center ${isFullscreen ? 'h-full w-full' : ''}`}>
      
      <div 
        // [關鍵修改] 整個容器區域都監聽拖曳
        onDragOver={handleContainerDragOver}
        onDrop={handleContainerDrop}
        className="grid gap-1.5 p-4 rounded-2xl bg-slate-900 shadow-2xl transition-colors duration-300"
        style={{
            gridTemplateColumns: `repeat(${GRID_SIZE + 2}, minmax(0, 1fr))`,
            width: isFullscreen ? 'min(95vh, 95vw)' : 'min(65vh, 65vw)',
            maxWidth: isFullscreen ? 'none' : 'min(90vh, 1800px)',
            // 當處於丟棄狀態時，給背景一點點紅色氛圍
            backgroundColor: activeVoidId ? 'rgba(60, 20, 20, 0.95)' : undefined 
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

                    const isAboutToDelete = isDraggingSource && activeVoidId !== null;

                    return (
                        <div
                            key={cell.id}
                            className={`
                                relative w-full h-full rounded-xl
                                transition-all duration-200 aspect-square
                                flex items-center justify-center
                                bg-slate-800/50 border border-slate-700/30
                                ${dragOverId === cell.id ? 'bg-slate-700 ring-1 ring-white/20' : ''}
                                ${isSelected ? 'bg-slate-700 ring-1 ring-yellow-500/50' : ''}
                                ${isProcessing ? 'cursor-wait' : 'cursor-grab active:cursor-grabbing'}
                            `}
                            draggable={!isProcessing}
                            onDragStart={(e) => handleDragStart(e, cell.id)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => handleDragOverCell(e, cell.id)}
                            onDragLeave={handleDragLeaveCell} // 離開格子，允許 Container 接手
                            onDrop={(e) => handleDropCell(e, cell.id)}
                            onClick={() => handleClick(cell.id)}
                        >
                            {displayRune && (
                                <div className={`w-full h-full ${
                                    isDraggingSource && !isPhantom && !isAboutToDelete ? 'opacity-20 scale-90' : 'opacity-100'
                                }`}>
                                     <RunePiece 
                                        rune={displayRune} 
                                        cellId={cell.id}
                                        isSelected={isSelected} 
                                        isMatchHighlighted={!!isMatch}
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
    </div>
  );
};