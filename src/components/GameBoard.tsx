import React from 'react';
import { useDrop } from 'react-dnd';
import { Block } from '../types';
import { canPlaceBlock } from '../utils/gameLogic';

interface GameBoardProps {
  board: number[][];
  placeBlock: (block: Block, rowIndex: number, colIndex: number) => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ board, placeBlock }) => {
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

  return (
    <div className="grid grid-cols-10 gap-0.5 mb-4">
      {board.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <Cell
            key={`${rowIndex}-${colIndex}`}
            cellValue={cell}
            rowIndex={rowIndex}
            colIndex={colIndex}
            board={board}
            placeBlock={placeBlock}
            getCellColor={getCellColor}
          />
        ))
      )}
    </div>
  );
};

interface CellProps {
  cellValue: number;
  rowIndex: number;
  colIndex: number;
  board: number[][];
  placeBlock: (block: Block, rowIndex: number, colIndex: number) => void;
  getCellColor: (cellValue: number) => string;
}

const Cell: React.FC<CellProps> = ({ cellValue, rowIndex, colIndex, board, placeBlock, getCellColor }) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'block',
    drop: (item: Block) => {
      placeBlock(item, rowIndex, colIndex);
    },
    canDrop: (item: Block) => canPlaceBlock(board, item, rowIndex, colIndex),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  });

  let backgroundColor = getCellColor(cellValue);
  if (isOver) {
    backgroundColor = canDrop ? 'bg-green-300' : 'bg-red-300';
  }

  return (
    <div
      ref={drop}
      className={`aspect-square border ${backgroundColor} ${isOver ? 'border-2' : ''}`}
    />
  );
};

export default GameBoard;