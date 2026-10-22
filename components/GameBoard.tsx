import React, { useState, useEffect, useRef } from 'react';
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
} from '@dnd-kit/core';
import { GridState, Rune, SwapSignal } from '../types';
import { RunePiece, RuneImage, getRuneVisualSize } from './RunePiece';
import { GRID_SIZE } from '../constants';
import { X } from 'lucide-react';
import { DraggableRune, DroppableCell } from './DndComponents';

interface GameBoardProps {
  grid: GridState;
  isProcessing: boolean;
  onInteraction: (fromId: number, toId: number) => void;
  onDiscard: (fromId: number) => void;
  isFullscreen: boolean;
  swapSignal?: SwapSignal | null;
  swappingPair?: { cellA: number; cellB: number } | null;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  grid,
  isProcessing,
  onInteraction,
  onDiscard,
  isFullscreen,
  swapSignal,
  swappingPair,
}) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState({ width: 64, height: 64 });
  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const observer = new ResizeObserver(() => {
      const rect = board.querySelector('[data-cell-id="0"]')?.getBoundingClientRect();
      if (rect) setCellSize({ width: rect.width, height: rect.height });
    });
    observer.observe(board);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!swapSignal) return;

    if (!swapSignal.valid) {
      // 無效交換：左右晃動與紅色邊框警示
      [swapSignal.cellA, swapSignal.cellB].forEach(id => {
        const cell = boardRef.current?.querySelector<HTMLElement>(`[data-cell-id="${id}"]`);
        if (!cell) return;
        cell.animate([
          { transform: 'translateX(0)', boxShadow: '0 0 0 2px #ef4444' },
          { transform: 'translateX(-5px)' },
          { transform: 'translateX(5px)' },
          { transform: 'translateX(0)', boxShadow: 'none' }
        ], { duration: 250, easing: 'ease-out' });
      });
      return;
    }

    // 有效交換：兩顆符文相對平滑滑動對調 (200ms，以百分比位移無縫對調)
    const cellA = swapSignal.cellA;
    const cellB = swapSignal.cellB;
    const fromX = cellA % GRID_SIZE;
    const fromY = Math.floor(cellA / GRID_SIZE);
    const toX = cellB % GRID_SIZE;
    const toY = Math.floor(cellB / GRID_SIZE);
    const dx = (toX - fromX) * 100;
    const dy = (toY - fromY) * 100;

    const elA = boardRef.current?.querySelector<HTMLElement>(`[data-cell-id="${cellA}"] .rune-swap-wrapper`);
    const elB = boardRef.current?.querySelector<HTMLElement>(`[data-cell-id="${cellB}"] .rune-swap-wrapper`);

    if (elA) {
      elA.animate([
        { transform: `translate(${dx}%, ${dy}%)` },
        { transform: 'translate(0, 0)' }
      ], { duration: 200, easing: 'cubic-bezier(0.25, 1, 0.5, 1)', fill: 'backwards' });
    }

    if (elB) {
      elB.animate([
        { transform: `translate(${-dx}%, ${-dy}%)` },
        { transform: 'translate(0, 0)' }
      ], { duration: 200, easing: 'cubic-bezier(0.25, 1, 0.5, 1)', fill: 'backwards' });
    }
  }, [swapSignal]);
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
      } else if (selectedId !== null && isAdjacent(selectedId, id)) {
          onInteraction(selectedId, id);
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
    // Only an outward drag beyond half a cell can enter the discard zone.
    // A cancelled drag or a click near an edge must never discard a rune.
    const outward = [
      dX === 0 && delta.x < -cellSize.width / 2 ? { id: `left-${dY}`, distance: -delta.x } : null,
      dX === GRID_SIZE - 1 && delta.x > cellSize.width / 2 ? { id: `right-${dY}`, distance: delta.x } : null,
      dY === 0 && delta.y < -cellSize.height / 2 ? { id: `top-${dX + 1}`, distance: -delta.y } : null,
      dY === GRID_SIZE - 1 && delta.y > cellSize.height / 2 ? { id: `bottom-${dX + 1}`, distance: delta.y } : null,
    ].filter((zone): zone is { id: string; distance: number } => zone !== null);
    return outward.sort((a, b) => b.distance - a.distance)[0]?.id ?? null;
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
      if ('vibrate' in navigator) navigator.vibrate(8);
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
        onDragCancel={() => { setActiveId(null); setOverId(null); setActiveRune(null); setActiveVoidId(null); }}
    >
        <div className={`relative flex items-center justify-center ${isFullscreen ? 'h-full w-full' : ''}`}>
        
        <div ref={boardRef}
            className="grid rounded-2xl bg-slate-900 shadow-2xl transition-colors duration-300 touch-none p-2 gap-1 md:p-4 md:gap-1.5"
            style={{
                // 調整網格比例：兩側 0.5fr，中間符文 1fr
                gridTemplateColumns: `minmax(15px, 15px) repeat(${GRID_SIZE}, 1fr) minmax(15px, 15px)`, //左右
                gridTemplateRows: `minmax(30px, 30px) repeat(${GRID_SIZE}, 1fr) minmax(30px, 30px)`,
                
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

                        const isAboutToDelete = isActiveSource && activeVoidId !== null;
                        const isSelected = selectedId === cell.id;
                        
                        const realRune = cell.rune;
                        const isMatch = selectedRune && realRune
                            && realRune.type === selectedRune.type
                            && realRune.level === selectedRune.level;

                        // 互換平滑滑動計算 (以百分比相對位移，確保極致流暢且無殘留)
                        const isSwappingA = swappingPair?.cellA === cell.id;
                        const isSwappingB = swappingPair?.cellB === cell.id;
                        let swapStyle: React.CSSProperties = {};
                        let swapZIndex = '';

                        if (isSwappingA && swappingPair) {
                            const toX = swappingPair.cellB % GRID_SIZE;
                            const toY = Math.floor(swappingPair.cellB / GRID_SIZE);
                            const fromX = swappingPair.cellA % GRID_SIZE;
                            const fromY = Math.floor(swappingPair.cellA / GRID_SIZE);
                            swapStyle = {
                                transform: `translate(${(toX - fromX) * 100}%, ${(toY - fromY) * 100}%)`,
                                transition: 'transform 200ms cubic-bezier(0.25, 1, 0.5, 1)',
                            };
                            swapZIndex = 'z-50';
                        } else if (isSwappingB && swappingPair) {
                            const toX = swappingPair.cellB % GRID_SIZE;
                            const toY = Math.floor(swappingPair.cellB / GRID_SIZE);
                            const fromX = swappingPair.cellA % GRID_SIZE;
                            const fromY = Math.floor(swappingPair.cellA / GRID_SIZE);
                            swapStyle = {
                                transform: `translate(${(fromX - toX) * 100}%, ${(fromY - toY) * 100}%)`,
                                transition: 'transform 200ms cubic-bezier(0.25, 1, 0.5, 1)',
                            };
                            swapZIndex = 'z-50';
                        }

                        return (
                            <DroppableCell 
                                key={cell.id} 
                                id={cell.id.toString()}
                                className={`
                                    relative w-full h-full rounded-xl
                                    transition-all duration-200
                                    flex items-center justify-center
                                    bg-slate-800/50 border border-slate-700/30
                                    ${isOverTarget ? 'bg-slate-700/80 ring-2 ring-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)] z-20' : ''}
                                    ${isSelected ? 'z-40 ring-2 ring-white' : ''}
                                    ${isProcessing ? 'cursor-wait' : 'cursor-grab active:cursor-grabbing'}
                                `}
                            >
                                {displayRune && (
                                    <div
                                        style={swapStyle}
                                        className={`w-full h-full flex items-center justify-center ${swapZIndex} ${isActiveSource ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                                    >
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
                                                cellHeight={cellSize.height}
                                                isAboutToDelete={isAboutToDelete}
                                                isSelected={isSelected}
                                                isMatchHighlighted={!!isMatch}
                                                isDeleted={cell.isDeleted}
                                                isClearing={cell.clearFx}
                                             />
                                        </DraggableRune>
                                    </div>
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

        <DragOverlay dropAnimation={null}>
            {activeRune ? (
                <div className="w-full h-full flex items-center justify-center">
                    <div style={{ width: cellSize.width, height: cellSize.height }}>
                        <RunePiece 
                        rune={activeRune} 
                        cellId={-1}
                        isSelected={false}
                        isMatchHighlighted={false}
                        isAboutToDelete={activeVoidId !== null}
                        isDragging={false}
                        />
                    </div>
                </div>
            ) : null}
        </DragOverlay>

        </div>
    </DndContext>
  );
};
