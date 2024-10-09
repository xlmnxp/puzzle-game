import React from 'react';
import { Block } from '../types';

interface BlockSelectorProps {
  blocks: Block[];
  setDraggedBlock: (block: Block | null) => void;
}

const BlockSelector: React.FC<BlockSelectorProps> = ({ blocks, setDraggedBlock }) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, block: Block) => {
    e.dataTransfer.setData('application/json', JSON.stringify(block));
    setDraggedBlock(block);

    // Create a custom drag image
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    dragImage.style.opacity = '0.7';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);

    // Remove the drag image after the drag operation
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>, block: Block) => {
    setDraggedBlock(block);
  };

  const handleTouchEnd = () => {
    setDraggedBlock(null);
  };

  const handleDragEnd = () => {
    setDraggedBlock(null);
  };

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
    <div className="flex justify-center space-x-4 bg-transparent">
      {blocks.map((block) => (
        <div
          key={block.id}
          className="cursor-move touch-manipulation"
          draggable
          onDragStart={(e) => handleDragStart(e, block)}
          onDragEnd={handleDragEnd}
          onTouchStart={(e) => handleTouchStart(e, block)}
          onTouchEnd={handleTouchEnd}
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
      ))}
    </div>
  );
};

export default BlockSelector;