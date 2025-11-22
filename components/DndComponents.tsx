import React from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';

// 修改介面，加入 onClick
interface DraggableProps {
  id: string;
  data?: any;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void; // [新增] 接收點擊事件
}

export const DraggableRune: React.FC<DraggableProps> = ({ id, data, disabled, children, className, onClick }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: id,
    data: data,
    disabled: disabled,
  });

  return (
    <div 
      ref={setNodeRef} 
      {...listeners} 
      {...attributes} 
      // [新增] 這裡綁定 onClick
      // 由於我们在 Sensor 設定了 activationConstraint (移動 5px 才算拖曳)
      // 所以如果是單純點擊，這裡的 onClick 會被正常觸發
      onClick={onClick}
      className={`${className} ${isDragging ? 'opacity-20 scale-90' : ''} touch-none`}
    >
      {children}
    </div>
  );
};

// DroppableCell 不需要改，因為點擊通常是發生在符文(Draggable)上
interface DroppableProps {
  id: string;
  data?: any;
  children: React.ReactNode;
  className?: string;
}

export const DroppableCell: React.FC<DroppableProps> = ({ id, data, children, className }) => {
  const { setNodeRef } = useDroppable({
    id: id,
    data: data,
  });

  return (
    <div ref={setNodeRef} className={className}>
      {children}
    </div>
  );
};