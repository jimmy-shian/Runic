import React from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';

// 可拖曳的組件 (用來包 RunePiece)
interface DraggableProps {
  id: string;
  data?: any;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const DraggableRune: React.FC<DraggableProps> = ({ id, data, disabled, children, className }) => {
  const { attributes, listeners, setNodeRef, isDragging, transform } = useDraggable({
    id: id,
    data: data,
    disabled: disabled,
  });

  // 即使在拖曳中，我們也希望原位置保留一個半透明的影子，
  // 所以這裡不使用 transform 來移動它 (我們會用 DragOverlay 來顯示跟隨手指的那一個)
  
  return (
    <div 
      ref={setNodeRef} 
      {...listeners} 
      {...attributes} 
      className={`${className} ${isDragging ? 'opacity-20 scale-90' : ''} touch-none`}
    >
      {children}
    </div>
  );
};

// 可放置的組件 (用來包 Cell 和 VoidSlot)
interface DroppableProps {
  id: string;
  data?: any;
  children: React.ReactNode;
  className?: string;
}

export const DroppableCell: React.FC<DroppableProps> = ({ id, data, children, className }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
    data: data,
  });

  return (
    <div ref={setNodeRef} className={className}>
      {children}
    </div>
  );
};