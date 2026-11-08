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
  isLandscape?: boolean;
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
  isLandscape = false,
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
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [activeRune, setActiveRune] = useState<Rune | null>(null);
  const [activeVoidId, setActiveVoidId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const skipSwapFlipRef = useRef(false);
  const committedPreviewRef = useRef(false);

  // 滑動互換動畫
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

  useLayoutEffect(() => {
    if (!swapSignal?.valid) return;
    if (skipSwapFlipRef.current) {
      skipSwapFlipRef.current = false;
      return;
    }
    slidePairFromPartner(swapSignal.cellA, swapSignal.cellB, 220);
  }, [swapSignal]);

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

  const handleClick = (id: number) => {
    if (isProcessing) return;
    onSound?.('click');
    setSelectedId(prev => (prev === id ? null : id));
  };

  useEffect(() => {
    if (selectedId !== null && !grid[selectedId]?.rune) setSelectedId(null);
  }, [grid, selectedId]);

  const selectedRune = selectedId !== null ? grid[selectedId]?.rune : null;

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
        skipSwapFlipRef.current = true;
        committedPreviewRef.current = true;
        onInteraction(dragId, parseInt(overId));
      }
    }
    resetDrag();
  };

  const VoidSlot = ({ id, isCorner = false }: { id: string, isCorner?: boolean }) => {
    if (isCorner) return <div className="invisible w-full h-full" />;
    const isActive = activeVoidId === id;
    return (
      <DroppableCell 
        id={`void-${id}`} 
        className={`
          flex items-center justify-center rounded-xl w-full h-full
          border border-dashed transition-all duration-200
          ${isActive 
            ? 'border-red-500 bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.4)] z-10' 
            : 'border-slate-800/40 bg-slate-950/30'
          }
        `}
      >
        {isActive && <X className="text-red-400 animate-bounce w-4 h-4" />}
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
      <div 
        className="relative flex items-center justify-center w-full h-full" 
        style={{
          width: isLandscape
            ? 'min(100%, calc(100dvh - 20px))'
            : (isFullscreen
                ? 'min(calc(100vw - 8px), calc(100dvh - 100px), 580px)'
                : 'min(calc(100vw - 16px), calc(100dvh - 180px), 480px)'),
          height: isLandscape ? 'min(100%, calc(100dvh - 20px))' : undefined,
          maxWidth: '100%',
          maxHeight: isLandscape ? 'calc(100dvh - 20px)' : undefined,
          aspectRatio: '1 / 1',
          flexShrink: 0,
        }}
      >
        <div 
          ref={boardRef}
          className={`grid rounded-2xl bg-slate-900/90 shadow-2xl transition-colors duration-300 touch-none border border-slate-800/80 ${
            isLandscape ? 'p-2 gap-1.5' : (isFullscreen ? 'p-1 gap-1' : 'p-1.5 gap-1 md:p-2.5 md:gap-1.5')
          }`}
          style={{
            gridTemplateColumns: isLandscape
              ? `clamp(10px, 2vmin, 16px) repeat(${GRID_SIZE}, minmax(0, 1fr)) clamp(10px, 2vmin, 16px)`
              : (isFullscreen
                  ? `8px repeat(${GRID_SIZE}, minmax(0, 1fr)) 8px`
                  : `12px repeat(${GRID_SIZE}, minmax(0, 1fr)) 12px`),
            gridTemplateRows: isLandscape
              ? `clamp(12px, 2.5vmin, 20px) repeat(${GRID_SIZE}, minmax(0, 1fr)) clamp(12px, 2.5vmin, 20px)`
              : (isFullscreen
                  ? `14px repeat(${GRID_SIZE}, minmax(0, 1fr)) 14px`
                  : `18px repeat(${GRID_SIZE}, minmax(0, 1fr)) 18px`),
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            aspectRatio: '1/1',
            backgroundColor: activeVoidId ? 'rgba(50, 15, 15, 0.95)' : undefined 
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

                const isSourceHighlight = isActiveSource && !isAboutToDelete;
                const isTargetHighlight = isOverTarget && hasPreview;

                // 視覺重整：降低格子飽和度，凸顯符文本身（R-02）
                let cellHighlightStyle = 'bg-slate-950/60 border border-slate-800/40';
                if (isTargetHighlight) {
                  cellHighlightStyle = 'bg-sky-950/60 border-sky-400 ring-2 ring-sky-400/80 shadow-[0_0_16px_rgba(56,189,248,0.6)] z-30 animate-pulse';
                } else if (isSourceHighlight) {
                  cellHighlightStyle = 'bg-indigo-950/80 border-indigo-500/80 ring-2 ring-indigo-500/60 z-20';
                } else if (isSelected) {
                  cellHighlightStyle = 'bg-slate-900/90 border-emerald-400/80 ring-2 ring-emerald-400/80 shadow-[0_0_12px_rgba(52,211,153,0.5)] z-40';
                } else if (isMatch) {
                  cellHighlightStyle = 'bg-slate-900/70 border-amber-400/60 ring-1 ring-amber-400/50 z-30';
                }

                return (
                  <DroppableCell 
                    key={cell.id} 
                    id={cell.id.toString()}
                    className={`
                      relative w-full h-full rounded-xl
                      transition-all duration-150
                      flex items-center justify-center
                      ${cellHighlightStyle}
                      ${isProcessing ? 'cursor-wait' : 'cursor-grab active:cursor-grabbing'}
                    `}
                  >
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

        {/* 拖曳中的半透明跟手鏡像 */}
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
