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

  // 用於自動吸附判斷（當拖出格子外，沒有 hover 到特定 void slot 時）
  const getAutoDiscardZone = (dragId: number, delta: { x: number, y: number }): string | null => {
    const dX = dragId % GRID_SIZE;
    const dY = Math.floor(dragId / GRID_SIZE);
    
    // Top-Left Corner
    if (dX === 0 && dY === 0) {
        return (Math.abs(delta.x) > Math.abs(delta.y) && delta.x < 0) ? `left-${dY}` : `top-${dX + 1}`;
    }
    // Top-Right Corner
    if (dX === GRID_SIZE - 1 && dY === 0) {
        return (Math.abs(delta.x) > Math.abs(delta.y) && delta.x > 0) ? `right-${dY}` : `top-${dX + 1}`;
    }
    // Bottom-Left Corner
    if (dX === 0 && dY === GRID_SIZE - 1) {
        return (Math.abs(delta.x) > Math.abs(delta.y) && delta.x < 0) ? `left-${dY}` : `bottom-${dX + 1}`;
    }
    // Bottom-Right Corner
    if (dX === GRID_SIZE - 1 && dY === GRID_SIZE - 1) {
        return (Math.abs(delta.x) > Math.abs(delta.y) && delta.x > 0) ? `right-${dY}` : `bottom-${dX + 1}`;
    }

    // Normal Edges
    if (dY === 0) return `top-${dX + 1}`;
    if (dY === GRID_SIZE - 1) return `bottom-${dX + 1}`;
    if (dX === 0) return `left-${dY}`;
    if (dX === GRID_SIZE - 1) return `right-${dY}`;
    return null;
  };

  // 檢查某個 void zone 是否為該 cell 的合法鄰居
  const isValidDiscardZone = (dragId: number, zoneId: string): boolean => {
      const x = dragId % GRID_SIZE;
      const y = Math.floor(dragId / GRID_SIZE);
      
      if (y === 0 && zoneId === `top-${x + 1}`) return true;
      if (y === GRID_SIZE - 1 && zoneId === `bottom-${x + 1}`) return true;
      if (x === 0 && zoneId === `left-${y}`) return true;
      if (x === GRID_SIZE - 1 && zoneId === `right-${y}`) return true;
      
      return false;
  };

  // --- Event Handlers ---

  const handleDragStart = (event: DragStartEvent) => {
      if (isProcessing) return;
      const { active } = event;
      const runeData = active.data.current as Rune;
      setActiveId(active.id as string);
      setActiveRune(runeData);
      setSelectedId(null);
  };

  const handleDragOver = (event: DragOverEvent) => {
      const { active, over } = event;
      
      if (!over) {
        const dragIdNum = parseInt(active.id as string);
        const targetZone = getAutoDiscardZone(dragIdNum, event.delta);
        if (targetZone) {
            if (activeVoidId !== targetZone) setActiveVoidId(targetZone);
        } else {
            if (activeVoidId !== null) setActiveVoidId(null);
        }
        setOverId(null);
        return;
      }

      const overIdString = over.id as string;
      
      if (overIdString.startsWith('void-')) {
          const zoneId = overIdString.replace('void-', '');
          const dragIdNum = parseInt(active.id as string);
          
          if (isValidDiscardZone(dragIdNum, zoneId)) {
               setActiveVoidId(zoneId);
          } else {
               if (activeVoidId !== null) setActiveVoidId(null);
          }
          setOverId(null);
          return;
      }

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
        if (isCorner) return <div className="invisible w-full h-full" />;

        const isActive = activeVoidId === id;
        const droppableId = `void-${id}`;

        return (
            <DroppableCell 
                id={droppableId} 
                className={`
                    flex items-center justify-center rounded-xl w-full h-full
                    border-2 border-dashed
                    transition-colors duration-200
                    ${isActive 
                        ? 'border-red-500 bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.4)] z-10' 
                        : 'border-slate-700/30 bg-slate-900/30'
                    }
                `}
            >
                {isActive && (
                    <X 
                        className="text-red-500 animate-bounce" 
                    />
                )}
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
            className="grid rounded-2xl bg-slate-900 shadow-2xl transition-colors duration-300 touch-none p-2 gap-1 md:p-4 md:gap-1.5"
            style={{
                // 調整網格比例：兩側 0.5fr，中間符文 1fr
                gridTemplateColumns: `0.3fr repeat(${GRID_SIZE}, 1fr) 0.3fr`, //直
                gridTemplateRows: `0.65fr repeat(${GRID_SIZE}, 1fr) 0.65fr`,
                
                // Mobile: maximize width usage (98vw). Desktop: reasonable limit. Fullscreen: full viewport.
                width: isFullscreen ? 'min(100vh, 100vw)' : 'min(98vh, 98vw)',
                maxWidth: isFullscreen ? 'none' : 'min(95vh, 1800px)',
                
                // 強制保持 1:1 正方形比例，確保符文格為正方形，而 VoidSlot 根據 fr 自動變形為扁長條
                aspectRatio: '1/1',
                
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

                        if (activeId && overId && !overId.startsWith('void-')) {
                            const activeIdx = parseInt(activeId);
                            const overIdx = parseInt(overId);
                            if (cell.id === activeIdx) displayRune = grid[overIdx]?.rune;
                            else if (cell.id === overIdx) displayRune = grid[activeIdx]?.rune;
                        }
                        
                        const isAboutToDelete = isActiveSource && activeVoidId !== null;
                        const isSelected = selectedId === cell.id;
                        
                        const isMatch = selectedRune && displayRune 
                            && displayRune.type === selectedRune.type 
                            && displayRune.level === selectedRune.level;

                        return (
                            <DroppableCell 
                                key={cell.id} 
                                id={cell.id.toString()}
                                className={`
                                    relative w-full h-full rounded-xl
                                    transition-all duration-200
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
                                        onClick={() => handleClick(cell.id)}
                                    >
                                         <RunePiece 
                                            rune={displayRune} 
                                            cellId={cell.id}
                                            isAboutToDelete={isAboutToDelete}
                                            isSelected={isSelected}
                                            isMatchHighlighted={!!isMatch}
                                            isDeleted={cell.isDeleted}
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
                    <div className="w-[80px] h-[80px]">
                        <RunePiece 
                        rune={activeRune} 
                        cellId={-1}
                        isSelected={false}
                        isMatchHighlighted={false}
                        isAboutToDelete={activeVoidId !== null}
                        isDragging={true} 
                        />
                    </div>
                </div>
            ) : null}
        </DragOverlay>

        </div>
    </DndContext>
  );
};