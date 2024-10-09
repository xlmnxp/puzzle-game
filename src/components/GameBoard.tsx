import React, { useState } from 'react';
import { Block } from '../types';
import { canPlaceBlock } from '../utils/gameLogic';

interface GameBoardProps {
  board: number[][];
  placeBlock: (block: Block, rowIndex: number, colIndex: number) => void;
  draggedBlock: Block | null;
}

const GameBoard: React.FC<GameBoardProps> = ({ board, placeBlock, draggedBlock }) => {
  const [hoverPosition, setHoverPosition] = useState<{ row: number; col: number } | null>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, rowIndex: number, colIndex: number) => {
    e.preventDefault();
    const blockData = e.dataTransfer.getData('application/json');
    const block: Block = JSON.parse(blockData);
    placeBlock(block, rowIndex, colIndex);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>, rowIndex: number, colIndex: number) => {
    if (draggedBlock) {
      e.preventDefault();
      placeBlock(draggedBlock, rowIndex, colIndex);
    }
  };

  const handleMouseEnter = (rowIndex: number, colIndex: number) => {
    setHoverPosition({ row: rowIndex, col: colIndex });
  };

  const handleMouseLeave = () => {
    setHoverPosition(null);
  };

  const getCellColor = (cellValue: number) => {
    switch (cellValue) {
      case 1: return 'bg-red-500';
      case 2: return 'bg-blue-500';
      case 3: return 'bg-green-500';
      case 4: return 'bg-yellow-500';
      case 5: return 'bg-purple-500';
      default: return 'bg-gray-200';
    }
  };

  const isHighlighted = (rowIndex: number, colIndex: number) => {
    if (!draggedBlock || !hoverPosition) return false;

    const blockRow = rowIndex - hoverPosition.row;
    const blockCol = colIndex - hoverPosition.col;

    if (blockRow >= 0 && blockRow < draggedBlock.shape.length &&
        blockCol >= 0 && blockCol < draggedBlock.shape[0].length) {
      return draggedBlock.shape[blockRow][blockCol] === 1;
    }

    return false;
  };

  const canPlaceBlockHere = () => {
    if (!draggedBlock || !hoverPosition) return false;
    return canPlaceBlock(board, draggedBlock, hoverPosition.row, hoverPosition.col);
  };

  return (
    <div className="grid grid-cols-10 gap-0.5 mb-4">
      {board.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            className={`aspect-square border ${getCellColor(cell)} ${
              draggedBlock && isHighlighted(rowIndex, colIndex)
                ? canPlaceBlockHere()
                  ? 'border-2 border-green-300'
                  : 'border-2 border-red-300'
                : ''
            }`}
            onDrop={(e) => handleDrop(e, rowIndex, colIndex)}
            onDragOver={handleDragOver}
            onTouchStart={(e) => handleTouchStart(e, rowIndex, colIndex)}
            onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
            onMouseLeave={handleMouseLeave}
          />
        ))
      )}
    </div>
  );
};

export default GameBoard;