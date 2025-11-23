import React, { useState } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';

interface DraggableProps {
  id: string;
  data?: any;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const DraggableRune: React.FC<DraggableProps> = ({
  id,
  data,
  disabled,
  children,
  className,
  onClick,
}) => {
  const [isPointerDown, setPointerDown] = useState(false);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data,
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      onPointerDown={(e) => {
        listeners.onPointerDown?.(e); // 保留 dnd-kit 的拖曳啟動
        setPointerDown(true);
      }}
      onPointerUp={() => setPointerDown(false)}
      onPointerLeave={() => setPointerDown(false)}
      className={`${className} touch-none`} // tailwind: touch-none => touch-action: none
      style={{ touchAction: 'none' }}      // 確保瀏覽器原生手勢被禁止
    >
      {React.cloneElement(children as any, {
        isDragging,
        isPointerDown,
      })}
    </div>
  );
};

// DroppableCell 不用動
export const DroppableCell: React.FC<any> = ({ id, data, children, className }) => {
  const { setNodeRef } = useDroppable({ id, data });
  return (
    <div ref={setNodeRef} className={className}>
      {children}
    </div>
  );
};
