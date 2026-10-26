import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { 
    DndContext, 
    DragOverlay, 
    useSensor, 
    useSensors, 
    PointerSensor, 
    TouchSensor, 
    DragStartEvent, 
    DragMoveEvent, 
    pointerWithin,
} from '@dnd-kit/core';
import { GridState, Rune, SoundType, SwapSignal } from '../types';
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
  onSound?: (type: SoundType) => void;
  swapSignal?: SwapSignal | null;
  swappingPair?: { cellA: number; cellB: number } | null;
}

const SWAP_EASING = 'cubic-bezier(0.25, 1, 0.5, 1)';

export const GameBoard: React.FC<GameBoardProps> = ({
  grid,
  isProcessing,
  onInteraction,
  onDiscard,
  isFullscreen,
  swapSignal,
  onSound,
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

  // --- State ---
  const [activeId, setActiveId] = useState<string | null>(null);   // 拖曳來源格
  const [overId, setOverId] = useState<string | null>(null);       // 依拖曳方向判定的互換目標格
  const [activeRune, setActiveRune] = useState<Rune | null>(null);
  const [activeVoidId, setActiveVoidId] = useState<string | null>(null); // 刪除區高亮
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // 拖曳放開時，畫面已經是互換後的預覽狀態，略過下一次 FLIP 與預覽回彈動畫
  const skipSwapFlipRef = useRef(false);
  const committedPreviewRef = useRef(false);

  // 讓兩格的符文從「對方格子」連續滑回自己格子（FLIP 的 Invert + Play）
  const slidePairFromPartner = (a: number, b: number, duration: number) => {
    const board = boardRef.current;
    if (!board) return;
    const cellA = board.querySelector<HTMLElement>(`[data-cell-id="${a}"]`);
    const cellB = board.querySelector<HTMLElement>(`[data-cell-id="${b}"]`);
    if (!cellA || !cellB) return;
    const rectA = cellA.getBoundingClientRect();
    const rectB = cellB.getBoundingClientRect();
    const dx = rectB.left - rectA.left;
    const dy = rectB.top - rectA.top;
    const pairs: [HTMLElement, number, number][] = [[cellA, dx, dy], [cellB, -dx, -dy]];
    pairs.forEach(([cell, offsetX, offsetY]) => {
      const wrapper = cell.querySelector<HTMLElement>('.rune-swap-wrapper');
      if (!wrapper) return;
      cell.style.zIndex = '50';
      const animation = wrapper.animate([
        { transform: `translate3d(${offsetX}px, ${offsetY}px, 0)` },
        { transform: 'translate3d(0, 0, 0)' },
      ], { duration, easing: SWAP_EASING });
      animation.onfinish = animation.oncancel = () => { cell.style.zIndex = ''; };
    });
  };

  // 點擊互換：資料已交換，在瀏覽器繪製前把兩顆符文放回原位，再同步滑向新位置
  useLayoutEffect(() => {
    if (!swapSignal?.valid) return;
    if (skipSwapFlipRef.current) {
      skipSwapFlipRef.current = false;
      return;
    }
    slidePairFromPartner(swapSignal.cellA, swapSignal.cellB, 220);
  }, [swapSignal]);

  // 拖曳預覽互換：目標格變動時，兩顆符文同步滑到對方位置；取消時再滑回來
  const previewKey = activeId !== null && overId !== null ? `${activeId}-${overId}` : '';
  const previousPreviewRef = useRef('');
  useLayoutEffect(() => {
    const previous = previousPreviewRef.current;
    previousPreviewRef.current = previewKey;
    if (previous === previewKey) return;
    if (previous && !committedPreviewRef.current) {
      const [a, b] = previous.split('-').map(Number);
      slidePairFromPartner(a, b, 180);
    }
    committedPreviewRef.current = false;
    if (previewKey) {
      const [a, b] = previewKey.split('-').map(Number);
      slidePairFromPartner(a, b, 180);
    }
  }, [previewKey]);

  // 無效移動震動警示
  useEffect(() => {
    if (!swapSignal || swapSignal.valid) return;
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
  }, [swapSignal]);

  // --- Sensors ---
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 40, tolerance: 5 } })
  );

  const isAdjacent = (id1: number, id2: number) => {
      const x1 = id1 % GRID_SIZE; const y1 = Math.floor(id1 / GRID_SIZE);
      const x2 = id2 % GRID_SIZE; const y2 = Math.floor(id2 / GRID_SIZE);
      return Math.abs(x1 - x2) + Math.abs(y1 - y2) === 1;
  };

  // --- Click Selection (換位置只能拖曳，點擊僅切換選取) ---
  const handleClick = (id: number) => {
      if (isProcessing) return;
      onSound?.('click');
      if (selectedId === id) {
          setSelectedId(null);
      } else {
          setSelectedId(id);
      }
  };

  useEffect(() => {
    if (selectedId !== null && !grid[selectedId]?.rune) setSelectedId(null);
  }, [grid, selectedId]);

  const selectedRune = selectedId !== null ? grid[selectedId]?.rune : null;

  /**
   * 依拖曳方向決定目標：取位移較大的軸，超過 0.3 格就鎖定該方向的相鄰格。
   * 手指拖多遠都沿用同一個方向，不需要剛好停在格子上。
   * 位於邊界且往外拖超過半格時，改為丟棄區。
   */
  const resolveDragTarget = (dragId: number, delta: { x: number; y: number }) => {
    const x = dragId % GRID_SIZE;
    const y = Math.floor(dragId / GRID_SIZE);
    const horizontal = Math.abs(delta.x) >= Math.abs(delta.y);
    const distance = horizontal ? Math.abs(delta.x) : Math.abs(delta.y);
    const size = horizontal ? cellSize.width : cellSize.height;
    if (distance < size * 0.3) return { target: null, voidZone: null };

    const step = horizontal ? Math.sign(delta.x) : Math.sign(delta.y);
    const nx = horizontal ? x + step : x;
    const ny = horizontal ? y : y + step;
    if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
      return { target: ny * GRID_SIZE + nx, voidZone: null };
    }
    if (distance < size * 0.5) return { target: null, voidZone: null };
    const voidZone = horizontal
      ? (step < 0 ? `left-${y}` : `right-${y}`)
      : (step < 0 ? `top-${x + 1}` : `bottom-${x + 1}`);
    return { target: null, voidZone };
  };

  const resetDrag = () => {
      setActiveId(null);
      setOverId(null);
      setActiveRune(null);
      setActiveVoidId(null);
  };

  // --- Event Handlers ---
  const handleDragStart = (event: DragStartEvent) => {
      if (isProcessing) return;
      if ('vibrate' in navigator) navigator.vibrate(8);
      setActiveId(event.active.id as string);
      setActiveRune(event.active.data.current as Rune);
      onSound?.('click');
      setSelectedId(null);
  };

  const handleDragMove = (event: DragMoveEvent) => {
      const dragId = parseInt(event.active.id as string);
      const { target, voidZone } = resolveDragTarget(dragId, event.delta);
      const nextOver = target !== null && grid[target]?.rune ? String(target) : null;
      if (nextOver !== overId) {
        setOverId(nextOver);
        if (nextOver !== null && 'vibrate' in navigator) navigator.vibrate(5);
      }
      if (voidZone !== activeVoidId) setActiveVoidId(voidZone);
  };

  const handleDragEnd = () => {
      const dragId = activeId !== null ? parseInt(activeId) : null;
      if (dragId !== null) {
        if (activeVoidId) {
          onDiscard(dragId);
        } else if (overId !== null) {
          // 畫面已顯示互換結果，資料對齊即可，不再重播互換動畫
          skipSwapFlipRef.current = true;
          committedPreviewRef.current = true;
          onInteraction(dragId, parseInt(overId));
        }
      }
      resetDrag();
  };

  // --- Render ---
  const VoidSlot = ({ id, isCorner = false }: { id: string, isCorner?: boolean }) => {
      if (isCorner) return <div className="invisible w-full h-full" />;
      const isActive = activeVoidId === id;
      return (
          <DroppableCell 
              id={`void-${id}`} 
              className={`
                  flex items-center justify-center rounded-xl w-full h-full
                  border-2 border-dashed transition-colors duration-200
                  ${isActive 
                      ? 'border-red-500 bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.4)] z-10' 
                      : 'border-slate-700/30 bg-slate-900/30'
                  }
              `}
          >
              {isActive && <X className="text-red-500 animate-bounce" />}
          </DroppableCell>
      );
  };

  const previewTargetRune = overId !== null ? grid[Number(overId)]?.rune ?? null : null;
  const hasPreview = !!activeRune && !!previewTargetRune;

  return (
    <DndContext 
        sensors={sensors} 
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onDragCancel={resetDrag}
    >
        <div className="relative flex items-center justify-center w-full" style={{
            // Size the frame independently of its images; the grid fills this fixed square.
            width: isFullscreen
              ? 'min(calc(100vw - 8px), calc(100dvh - 110px), 580px)'
              : 'min(calc(100vw - 16px), calc(100dvh - 200px), 480px)',
            maxWidth: '100%',
            aspectRatio: '1 / 1',
            flexShrink: 0,
        }}>
        
        <div ref={boardRef}
            className={`grid rounded-2xl bg-slate-900 shadow-2xl transition-colors duration-300 touch-none ${
                isFullscreen ? 'p-1 gap-1' : 'p-1.5 gap-1 md:p-3 md:gap-1.5'
            }`}
            style={{
                gridTemplateColumns: isFullscreen
                  ? `10px repeat(${GRID_SIZE}, minmax(0, 1fr)) 10px`
                  : `14px repeat(${GRID_SIZE}, minmax(0, 1fr)) 14px`,
                gridTemplateRows: isFullscreen
                  ? `18px repeat(${GRID_SIZE}, minmax(0, 1fr)) 18px`
                  : `22px repeat(${GRID_SIZE}, minmax(0, 1fr)) 22px`,
                // 依螢幕寬度與高度自適應，全螢幕時極致放大貼邊
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                maxWidth: '100%',
                aspectRatio: '1/1',
                backgroundColor: activeVoidId ? 'rgba(60, 20, 20, 0.95)' : undefined 
            }}
        >
            {Array.from({ length: GRID_SIZE + 2 }).map((_, i) => (
                <VoidSlot key={`void-top-${i}`} id={`top-${i}`} isCorner={i === 0 || i === GRID_SIZE + 1} />
            ))}

            {Array.from({ length: GRID_SIZE }).map((_, rowIdx) => (
                <React.Fragment key={`row-${rowIdx}`}>
                    <VoidSlot id={`left-${rowIdx}`} />

                    {Array.from({ length: GRID_SIZE }).map((_, colIdx) => {
                        const cell = grid[rowIdx * GRID_SIZE + colIdx];
                        const isActiveSource = activeId === cell.id.toString();
                        const isOverTarget = overId === cell.id.toString();

                        // 預覽互換：來源格顯示目標符文，目標格顯示拖曳中的符文
                        let displayRune = cell.rune;
                        if (hasPreview && isActiveSource) displayRune = previewTargetRune;
                        if (hasPreview && isOverTarget) displayRune = activeRune;
                        const isPreviewCell = hasPreview && (isActiveSource || isOverTarget);

                        const isAboutToDelete = isActiveSource && activeVoidId !== null;
                        const isSelected = selectedId === cell.id;
                        const realRune = cell.rune;
                        const isMatch = selectedRune && realRune
                            && realRune.type === selectedRune.type
                            && realRune.level === selectedRune.level && !isSelected;

                        // 交換位置高光區別：起手位置用深色漸層，終點位置用淺色漸層
                        const isSourceHighlight = isActiveSource && !isAboutToDelete;
                        const isTargetHighlight = isOverTarget && hasPreview;

                        let cellHighlightStyle = 'bg-slate-800/50 border border-slate-700/30';
                        if (isTargetHighlight) {
                            // 終點：淺色透光漸層、淺天藍高光輝芒
                            cellHighlightStyle = 'bg-gradient-to-br from-cyan-300/35 via-sky-200/25 to-white/20 border-cyan-300/90 ring-2 ring-cyan-200 shadow-[0_0_24px_rgba(56,189,248,0.9),inset_0_0_14px_rgba(255,255,255,0.4)] z-30 animate-pulse';
                        } else if (isSourceHighlight) {
                            // 起手：深色漸層、沉穩深藍紫光環與內斂陰影
                            cellHighlightStyle = 'bg-gradient-to-br from-indigo-950/90 via-blue-950/85 to-slate-950/95 border-indigo-500/70 ring-2 ring-indigo-500/80 shadow-[inset_0_2px_8px_rgba(0,0,0,0.85),0_0_16px_rgba(30,58,138,0.7)] z-20';
                        } else if (isSelected || isMatch) {
                            cellHighlightStyle = 'bg-slate-800/50 border border-slate-700/30 z-40 ring-2 ring-white';
                        }

                        return (
                            <DroppableCell 
                                key={cell.id} 
                                id={cell.id.toString()}
                                className={`
                                    relative w-full h-full rounded-xl
                                    transition-[background-color,box-shadow] duration-150
                                    flex items-center justify-center
                                    ${cellHighlightStyle}
                                    ${isProcessing ? 'cursor-wait' : 'cursor-grab active:cursor-grabbing'}
                                `}
                            >
                                {/* 終點位置淺色微光指示 */}
                                {isTargetHighlight && (
                                    <div className="absolute inset-0 rounded-xl pointer-events-none bg-gradient-to-br from-cyan-300/30 via-sky-200/20 to-transparent ring-2 ring-cyan-200 shadow-[0_0_20px_rgba(56,189,248,0.8)] z-0" />
                                )}
                                {/* 起手位置深色漸層指示 */}
                                {isSourceHighlight && (
                                    <div className="absolute inset-0 rounded-xl pointer-events-none bg-gradient-to-br from-indigo-950/70 via-blue-950/60 to-slate-950/80 ring-2 ring-indigo-500/70 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)] z-0" />
                                )}
                                {displayRune && (
                                    <div className="rune-swap-wrapper w-full h-full flex items-center justify-center z-10">
                                        <DraggableRune 
                                            id={cell.id.toString()} 
                                            data={cell.rune}
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
                                                isSwapPreview={isPreviewCell}
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

            {Array.from({ length: GRID_SIZE + 2 }).map((_, i) => (
                <VoidSlot key={`void-bottom-${i}`} id={`bottom-${i}`} isCorner={i === 0 || i === GRID_SIZE + 1} />
            ))}
        </div>

        {/* 已鎖定互換目標時隱藏跟手圖示，改由兩格的互換預覽呈現 */}
        <DragOverlay dropAnimation={null}>
            {activeRune && !hasPreview ? (
                <div className="w-full h-full flex items-center justify-center pointer-events-none scale-105 drop-shadow-[0_12px_24px_rgba(0,0,0,0.7)]">
                    <div style={{ width: cellSize.width, height: cellSize.height }}>
                        <RunePiece 
                            rune={activeRune} 
                            cellId={-1}
                            isSelected={false}
                            isMatchHighlighted={false}
                            isAboutToDelete={activeVoidId !== null}
                        />
                    </div>
                </div>
            ) : null}
        </DragOverlay>

        </div>
    </DndContext>
  );
};
