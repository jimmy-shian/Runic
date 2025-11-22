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

  // 1. 新增一個 Ref 來記錄上次更新時間
  const lastUpdateRef = useRef(0);

  // ---------------- Helper: Auto-Detect Edge ----------------
  const getAutoDiscardZone = (dragId: number): string | null => {
    const dX = dragId % GRID_SIZE;
    const dY = Math.floor(dragId / GRID_SIZE);

    if (dY === 0) return `top-${dX + 1}`;          // Top Row
    if (dY === GRID_SIZE - 1) return `bottom-${dX + 1}`; // Bottom Row
    if (dX === 0) return `left-${dY}`;             // Left Col
    if (dX === GRID_SIZE - 1) return `right-${dY}`; // Right Col
    
    return null;
  };

  // ---------------- Drag & Drop Handlers ----------------

  const handleDragStart = (e: React.DragEvent, id: number) => {
    if (isProcessing) {
      e.preventDefault();
      return;
    }
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
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

  const handleDragOverCell = (e: React.DragEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    isHoveringGridRef.current = true;

    if (isProcessing || draggedId === null) return;

    const now = Date.now();
    // 如果距離上次更新不到 50 毫秒，就跳過這次計算，直接 return
    if (now - lastUpdateRef.current < 50) {
        return; 
    }
    lastUpdateRef.current = now;

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

  const handleContainerDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    
    const now = Date.now();
    if (now - lastUpdateRef.current < 50) {
        return; 
    }
    lastUpdateRef.current = now;
    
    if (isHoveringGridRef.current) return;
    if (draggedId === null) return;

    const targetZone = getAutoDiscardZone(draggedId);

    if (targetZone) {
        e.dataTransfer.dropEffect = 'move';
        if (activeVoidId !== targetZone) {
            setActiveVoidId(targetZone);
            setDragOverId(null);
        }
    } else {
        if (activeVoidId !== null) setActiveVoidId(null);
    }
  };

  const handleContainerDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (activeVoidId && draggedId !== null) {
        onDiscard(draggedId);
    }
    handleDragEnd();
    setSelectedId(null);
  };
  
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
                touch-none  /* [新增] 禁止手機滑動捲動頁面 */
            `}
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
        onDragOver={handleContainerDragOver}
        onDrop={handleContainerDrop}
        className="grid gap-1.5 p-4 rounded-2xl bg-slate-900 shadow-2xl transition-colors duration-300 touch-none" 
        style={{
            gridTemplateColumns: `repeat(${GRID_SIZE + 2}, minmax(0, 1fr))`,
            width: isFullscreen ? 'min(100vh, 100vw)' : 'min(95vh, 95vw)',
            maxWidth: isFullscreen ? 'none' : 'min(90vh, 1800px)',
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
                                touch-none  /* [新增] 禁止手機滑動捲動頁面 */
                            `}
                            draggable={!isProcessing}
                            onDragStart={(e) => handleDragStart(e, cell.id)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => handleDragOverCell(e, cell.id)}
                            onDragLeave={handleDragLeaveCell}
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