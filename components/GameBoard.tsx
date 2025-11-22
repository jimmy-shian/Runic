import React, { useState, useEffect } from 'react';
import { 
    DndContext, 
    DragOverlay, 
    useSensor, 
    useSensors, 
    PointerSensor, // 專門處理滑鼠 + 觸控
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
  // State
  const [activeId, setActiveId] = useState<string | null>(null); // 正在拖曳的 ID
  const [overId, setOverId] = useState<string | null>(null);     // 目前懸停在誰上面
  const [activeRune, setActiveRune] = useState<Rune | null>(null); // 正在拖曳的符文資料 (給 Overlay 用)
  
  // 外部刪除區高亮
  const [activeVoidId, setActiveVoidId] = useState<string | null>(null);

  // 設定感應器：PointerSensor 可以同時處理滑鼠和觸控，是目前推薦的做法
  // activationConstraint: { distance: 5 } 代表手指移動 5px 才算拖曳，避免誤觸點擊
  const sensors = useSensors(
    useSensor(PointerSensor, {
        activationConstraint: {
            distance: 5, 
        },
    }),
    useSensor(TouchSensor, {
        activationConstraint: {
            delay: 50, // 稍微延遲一點點，手感比較穩
            tolerance: 5,
        },
    })
  );

  // ---------------- Helper: Auto-Detect Edge ----------------
  // 檢查是否為鄰近的格子 (互動判定)
  const isAdjacent = (id1: number, id2: number) => {
      const x1 = id1 % GRID_SIZE; const y1 = Math.floor(id1 / GRID_SIZE);
      const x2 = id2 % GRID_SIZE; const y2 = Math.floor(id2 / GRID_SIZE);
      return Math.abs(x1 - x2) + Math.abs(y1 - y2) === 1;
  };

  // 檢查是否可丟棄 (邊緣判定)
  const getAutoDiscardZone = (dragId: number): string | null => {
    const dX = dragId % GRID_SIZE;
    const dY = Math.floor(dragId / GRID_SIZE);
    if (dY === 0) return `top-${dX + 1}`;
    if (dY === GRID_SIZE - 1) return `bottom-${dX + 1}`;
    if (dX === 0) return `left-${dY}`;
    if (dX === GRID_SIZE - 1) return `right-${dY}`;
    return null;
  };

  // ---------------- Event Handlers ----------------

  const handleDragStart = (event: DragStartEvent) => {
      if (isProcessing) return;
      
      const { active } = event;
      const runeData = active.data.current as Rune; // 我們會在 DraggableRune 傳入 rune
      
      setActiveId(active.id as string);
      setActiveRune(runeData);
  };

  const handleDragOver = (event: DragOverEvent) => {
      const { active, over } = event;
      
      if (!over) {
        // 如果拖到外面去了，檢查是否符合全域丟棄條件 (Global Discard)
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
      
      // 1. 如果懸停在外部插槽 (VoidSlot)
      if (overIdString.startsWith('void-')) {
          const zoneId = overIdString.replace('void-', '');
          // 檢查是否符合該插槽的規則 (例如 top-1 只能接收第一排)
          // 這裡我們簡化邏輯：只要 getAutoDiscardZone 算出來是對的，就亮燈
          const dragIdNum = parseInt(active.id as string);
          const correctZone = getAutoDiscardZone(dragIdNum);
          
          if (correctZone === zoneId) {
               setActiveVoidId(zoneId);
          }
          setOverId(null); // 避免格子亮起
          return;
      }

      // 2. 如果懸停在一般格子 (Cell)
      // 先清除外部高亮
      if (activeVoidId !== null) setActiveVoidId(null);

      // 只有鄰近格子才視為有效懸停
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

      // 1. 處理丟棄 (有亮紅燈)
      if (activeVoidId) {
          onDiscard(dragIdNum);
      } 
      // 2. 處理交換 (有懸停在有效格子上)
      else if (over && !over.id.toString().startsWith('void-')) {
          const overIdNum = parseInt(over.id as string);
          if (isAdjacent(dragIdNum, overIdNum)) {
              onInteraction(dragIdNum, overIdNum);
          }
      }

      // 重置狀態
      setActiveId(null);
      setOverId(null);
      setActiveRune(null);
      setActiveVoidId(null);
  };

  // Drop 動畫設定 (讓它放手時不要閃爍)
  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.4',
        },
      },
    }),
  };

  // ---------------- Render Helpers ----------------

  // 渲染外部插槽
  const VoidSlot = ({ id, isCorner = false }: { id: string, isCorner?: boolean }) => {
      if (isCorner) return <div className="invisible aspect-square" />;

      const isActive = activeVoidId === id;
      const droppableId = `void-${id}`; // 給 dnd-kit 用的 ID

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
        // autoScroll={false} // 視情況開啟或關閉自動捲動
    >
        <div className={`relative flex items-center justify-center ${isFullscreen ? 'h-full w-full' : ''}`}>
        
        <div 
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
                    <VoidSlot id={`left-${rowIdx}`} />

                    {/* Main Grid Cells */}
                    {Array.from({ length: GRID_SIZE }).map((_, colIdx) => {
                        const cellIndex = rowIdx * GRID_SIZE + colIdx;
                        const cell = grid[cellIndex];
                        
                        // 顯示邏輯：處理交換預覽
                        // 如果我是被拖曳的(dragged)，且懸停在別人(over)上面 -> 我顯示別人的符文
                        // 如果我是別人(over)，且被拖曳的(dragged)懸停在我上面 -> 我顯示被拖曳的符文
                        
                        let displayRune = cell.rune;
                        const isActiveSource = activeId === cell.id.toString();
                        const isOverTarget = overId === cell.id.toString();

                        if (activeId && overId && !overId.startsWith('void-')) {
                            const activeIdx = parseInt(activeId);
                            const overIdx = parseInt(overId);
                            
                            if (cell.id === activeIdx) {
                                displayRune = grid[overIdx]?.rune; // 我現在顯示對方的
                            } else if (cell.id === overIdx) {
                                displayRune = grid[activeIdx]?.rune; // 對方顯示我的
                            }
                        }
                        
                        const isAboutToDelete = isActiveSource && activeVoidId !== null;

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
                                        data={displayRune} // 把符文資料傳給 Draggable，方便 DragOverlay 抓取
                                        disabled={isProcessing}
                                        className="w-full h-full"
                                    >
                                         <RunePiece 
                                            rune={displayRune} 
                                            cellId={cell.id}
                                            isAboutToDelete={isAboutToDelete}
                                            // isSelected 在這裡不需要傳了，由 DraggableRune 控制透明度
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

        {/* Drag Overlay: 這是 dnd-kit 的精髓 
            它是一個獨立的層，會跟隨手指移動，效能極佳且不受 CSS layout 影響
        */}
        <DragOverlay dropAnimation={dropAnimation}>
            {activeRune ? (
                <div className="w-full h-full flex items-center justify-center">
                    <div className="w-[80px] h-[80px]"> {/* 固定大小，避免因容器縮放變形 */}
                        <RunePiece 
                            rune={activeRune} 
                            cellId={-1} 
                            isSelected={true} // 讓它顯示 Lv 標籤
                        />
                    </div>
                </div>
            ) : null}
        </DragOverlay>

        </div>
    </DndContext>
  );
};