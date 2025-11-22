import React, { useState, useEffect } from 'react';
import { 
    DndContext, 
    DragOverlay, 
    useSensor, 
    useSensors, 
    PointerSensor,
    TouchSensor,
    DragStartEvent,
    DragEndEvent,
    DragOverEvent,
    defaultDropAnimationSideEffects,
    DropAnimation
} from '@dnd-kit/core';
import { GridState, Rune } from '../types';
import { RunePiece } from './RunePiece';
import { GRID_SIZE } from '../constants';
import { X } from 'lucide-react';
import { DraggableRune, DroppableCell } from './DndComponents';

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
  // --- State ---
  const [activeId, setActiveId] = useState<string | null>(null); // 拖曳中的 ID
  const [overId, setOverId] = useState<string | null>(null);     // 懸停的 ID
  const [activeRune, setActiveRune] = useState<Rune | null>(null); // 拖曳中的資料
  const [activeVoidId, setActiveVoidId] = useState<string | null>(null); // 刪除區高亮

  // [回歸] 點選高亮的 State
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // --- Sensors ---
  const sensors = useSensors(
    useSensor(PointerSensor, {
        activationConstraint: {
            distance: 5, // 移動超過 5px 才算拖曳，小於 5px 算點擊
        },
    }),
    useSensor(TouchSensor, {
        activationConstraint: {
            delay: 50,
            tolerance: 5,
        },
    })
  );

  // --- Logic: Click Selection ---
  
  // [回歸] 點擊處理
  const handleClick = (id: number) => {
      if (isProcessing) return;
      // 如果點擊已選取的 -> 取消；否則 -> 選取
      if (selectedId === id) {
          setSelectedId(null);
      } else {
          setSelectedId(id);
      }
  };

  // [回歸] 監聽 grid，如果選中的符文消失了(被消除)，自動取消選取
  useEffect(() => {
    if (selectedId !== null && !grid[selectedId]?.rune) {
        setSelectedId(null);
    }
  }, [grid, selectedId]);

  // 取得當前選中的符文資料 (用於計算連線提示)
  const selectedRune = selectedId !== null ? grid[selectedId]?.rune : null;

  // --- Logic: Drag & Drop Helpers ---

  const isAdjacent = (id1: number, id2: number) => {
      const x1 = id1 % GRID_SIZE; const y1 = Math.floor(id1 / GRID_SIZE);
      const x2 = id2 % GRID_SIZE; const y2 = Math.floor(id2 / GRID_SIZE);
      return Math.abs(x1 - x2) + Math.abs(y1 - y2) === 1;
  };

  const getAutoDiscardZone = (dragId: number): string | null => {
    const dX = dragId % GRID_SIZE;
    const dY = Math.floor(dragId / GRID_SIZE);
    if (dY === 0) return `top-${dX + 1}`;
    if (dY === GRID_SIZE - 1) return `bottom-${dX + 1}`;
    if (dX === 0) return `left-${dY}`;
    if (dX === GRID_SIZE - 1) return `right-${dY}`;
    return null;
  };

  // --- Event Handlers ---

  const handleDragStart = (event: DragStartEvent) => {
      if (isProcessing) return;
      const { active } = event;
      const runeData = active.data.current as Rune;
      setActiveId(active.id as string);
      setActiveRune(runeData);
      // 開始拖曳時，通常建議清除「點選」狀態，避免混淆
      setSelectedId(null);
  };

  const handleDragOver = (event: DragOverEvent) => {
      const { active, over } = event;
      
      if (!over) {
        const dragIdNum = parseInt(active.id as string);
        const targetZone = getAutoDiscardZone(dragIdNum);
        if (targetZone) {
            if (activeVoidId !== targetZone) setActiveVoidId(targetZone);
        } else {
            if (activeVoidId !== null) setActiveVoidId(null);
        }
        setOverId(null);
        return;
      }

      const overIdString = over.id as string;
      
      // Void Slots Logic
      if (overIdString.startsWith('void-')) {
          const zoneId = overIdString.replace('void-', '');
          const dragIdNum = parseInt(active.id as string);
          const correctZone = getAutoDiscardZone(dragIdNum);
          
          if (correctZone === zoneId) {
               setActiveVoidId(zoneId);
          }
          setOverId(null);
          return;
      }

      // Grid Cells Logic
      if (activeVoidId !== null) setActiveVoidId(null);

      const dragIdNum = parseInt(active.id as string);
      const overIdNum = parseInt(overIdString);
      
      if (isAdjacent(dragIdNum, overIdNum)) {
          setOverId(overIdString);
      } else {
          setOverId(null);
      }
  };

  const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      const dragIdNum = parseInt(active.id as string);

      if (activeVoidId) {
          onDiscard(dragIdNum);
      } else if (over && !over.id.toString().startsWith('void-')) {
          const overIdNum = parseInt(over.id as string);
          if (isAdjacent(dragIdNum, overIdNum)) {
              onInteraction(dragIdNum, overIdNum);
          }
      }

      setActiveId(null);
      setOverId(null);
      setActiveRune(null);
      setActiveVoidId(null);
  };

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: { opacity: '0.4' },
      },
    }),
  };

  // --- Render ---

  const VoidSlot = ({ id, isCorner = false }: { id: string, isCorner?: boolean }) => {
      if (isCorner) return <div className="invisible aspect-square" />;
      const isActive = activeVoidId === id;
      const droppableId = `void-${id}`;

      return (
          <DroppableCell 
            id={droppableId} 
            className={`
                flex items-center justify-center rounded-xl
                border-2 border-dashed transition-all duration-200 aspect-square
                ${isActive 
                    ? 'border-red-500 bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.4)] scale-105 z-10' 
                    : 'border-slate-700/30 bg-slate-900/30'
                }
            `}
          >
              {isActive && <X className="w-6 h-6 text-red-500 animate-bounce" />}
          </DroppableCell>
      );
  };

  return (
    <DndContext 
        sensors={sensors} 
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
    >
        <div className={`relative flex items-center justify-center ${isFullscreen ? 'h-full w-full' : ''}`}>
        
        <div 
            className="grid gap-1 p-2 rounded-2xl bg-slate-900 shadow-2xl transition-colors duration-300 touch-none"
            style={{
                gridTemplateColumns: `repeat(${GRID_SIZE + 2}, minmax(0, 1fr))`,
                width: isFullscreen ? 'min(100vh, 100vw)' : 'min(95vh, 98vw)',
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
                    <VoidSlot id={`left-${rowIdx}`} />

                    {Array.from({ length: GRID_SIZE }).map((_, colIdx) => {
                        const cellIndex = rowIdx * GRID_SIZE + colIdx;
                        const cell = grid[cellIndex];
                        
                        let displayRune = cell.rune;
                        const isActiveSource = activeId === cell.id.toString();
                        const isOverTarget = overId === cell.id.toString();

                        // 交換預覽邏輯
                        if (activeId && overId && !overId.startsWith('void-')) {
                            const activeIdx = parseInt(activeId);
                            const overIdx = parseInt(overId);
                            if (cell.id === activeIdx) displayRune = grid[overIdx]?.rune;
                            else if (cell.id === overIdx) displayRune = grid[activeIdx]?.rune;
                        }
                        
                        const isAboutToDelete = isActiveSource && activeVoidId !== null;

                        // [回歸] 計算點選高亮
                        const isSelected = selectedId === cell.id;
                        
                        // [回歸] 計算連線提示高亮
                        const isMatch = selectedRune && displayRune 
                            && displayRune.type === selectedRune.type 
                            && displayRune.level === selectedRune.level
                            && cell.id !== selectedId;

                        return (
                            <DroppableCell 
                                key={cell.id} 
                                id={cell.id.toString()}
                                className={`
                                    relative w-full h-full rounded-xl
                                    transition-all duration-200 aspect-square
                                    flex items-center justify-center
                                    bg-slate-800/50 border border-slate-700/30
                                    ${isOverTarget ? 'bg-slate-700 ring-1 ring-white/20' : ''}
                                    ${isProcessing ? 'cursor-wait' : 'cursor-grab active:cursor-grabbing'}
                                `}
                            >
                                {displayRune && (
                                    <DraggableRune 
                                        id={cell.id.toString()} 
                                        data={displayRune}
                                        disabled={isProcessing}
                                        className="w-full h-full"
                                        // [回歸] 傳遞點擊事件
                                        onClick={() => handleClick(cell.id)}
                                    >
                                         <RunePiece 
                                            rune={displayRune} 
                                            cellId={cell.id}
                                            isAboutToDelete={isAboutToDelete}
                                            // [回歸] 傳遞高亮狀態
                                            isSelected={isSelected}
                                            isMatchHighlighted={!!isMatch}
                                         />
                                    </DraggableRune>
                                )}
                            </DroppableCell>
                        );
                    })}

                    <VoidSlot id={`right-${rowIdx}`} />
                </React.Fragment>
            ))}

            {/* Bottom Row */}
            {Array.from({ length: GRID_SIZE + 2 }).map((_, i) => (
                <VoidSlot key={`void-bottom-${i}`} id={`bottom-${i}`} isCorner={i === 0 || i === GRID_SIZE + 1} />
            ))}
        </div>

        <DragOverlay dropAnimation={dropAnimation}>
            {activeRune ? (
                <div className="w-full h-full flex items-center justify-center">
                    <div className="w-full h-full scale-110">
                        <RunePiece 
                            rune={activeRune} 
                            cellId={-1} 
                            isSelected={true} // 拖曳時顯示詳細等級
                        />
                    </div>
                </div>
            ) : null}
        </DragOverlay>

        </div>
    </DndContext>
  );
};