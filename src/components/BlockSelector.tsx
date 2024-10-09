import React from 'react';
import { useDrag } from 'react-dnd';
import { Block } from '../types';

interface BlockSelectorProps {
  blocks: Block[];
}

const BlockSelector: React.FC<BlockSelectorProps> = ({ blocks }) => {
  return (
    <div className="flex justify-center space-x-4 bg-transparent">
      {blocks.map((block) => (
        <DraggableBlock key={block.id} block={block} />
      ))}
    </div>
  );
};

interface DraggableBlockProps {
  block: Block;
}

const DraggableBlock: React.FC<DraggableBlockProps> = ({ block }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'block',
    item: block,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const getBlockColor = (color: number) => {
    switch (color) {
      case 1: return 'bg-red-500';
      case 2: return 'bg-blue-500';
      case 3: return 'bg-green-500';
      case 4: return 'bg-yellow-500';
      case 5: return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div
      ref={drag}
      className={`cursor-move touch-manipulation ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="grid grid-cols-3 grid-rows-3 gap-0.5 w-24 h-24">
        {Array(9).fill(null).map((_, cellIndex) => {
          const row = Math.floor(cellIndex / 3);
          const col = cellIndex % 3;
          const isActive = block.shape[row] && block.shape[row][col] === 1;
          return (
            <div
              key={cellIndex}
              className={`w-full h-full ${isActive ? getBlockColor(block.color) : 'bg-transparent'}`}
            />
          );
        })}
      </div>
    </div>
  );
};

export default BlockSelector;