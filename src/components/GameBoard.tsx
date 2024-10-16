import React, { useState } from 'react';
import { useDrop } from 'react-dnd';
import { Block } from '../types';
import { canPlaceBlock } from '../utils/gameLogic';

interface GameBoardProps {
  board: number[][];
  placeBlock: (block: Block, rowIndex: number, colIndex: number) => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ board, placeBlock }) => {
  const [highlightedCells, setHighlightedCells] = useState<{ [key: string]: boolean }>({});

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

  const updateHighlightedCells = (block: Block, rowIndex: number, colIndex: number) => {
    const newHighlightedCells: { [key: string]: boolean } = {};
    const adjustedRowIndex = rowIndex - block.centerRow;
    const adjustedColIndex = colIndex - block.centerCol;
    const canPlace = canPlaceBlock(board, block, adjustedRowIndex, adjustedColIndex);
    for (let i = 0; i < block.shape.length; i++) {
      for (let j = 0; j < block.shape[i].length; j++) {
        if (block.shape[i][j]) {
          const cellKey = `${adjustedRowIndex + i}-${adjustedColIndex + j}`;
          newHighlightedCells[cellKey] = canPlace;
        }
      }
    }
    setHighlightedCells(newHighlightedCells);
  };

  const clearHighlightedCells = () => {
    setHighlightedCells({});
  };

  return (
    <div className="grid grid-cols-8 gap-0.5 mb-4">
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
            isHighlighted={highlightedCells[`${rowIndex}-${colIndex}`]}
            updateHighlightedCells={updateHighlightedCells}
            clearHighlightedCells={clearHighlightedCells}
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
  isHighlighted: boolean;
  updateHighlightedCells: (block: Block, rowIndex: number, colIndex: number) => void;
  clearHighlightedCells: () => void;
}

const Cell: React.FC<CellProps> = ({ cellValue, rowIndex, colIndex, board, placeBlock, getCellColor, isHighlighted, updateHighlightedCells, clearHighlightedCells }) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'block',
    drop: (item: Block & { centerRow: number; centerCol: number }) => {
      const adjustedRowIndex = rowIndex - item.centerRow;
      const adjustedColIndex = colIndex - item.centerCol;
      placeBlock(item, adjustedRowIndex, adjustedColIndex);
      clearHighlightedCells();
    },
    canDrop: (item: Block & { centerRow: number; centerCol: number }) => {
      const adjustedRowIndex = rowIndex - item.centerRow;
      const adjustedColIndex = colIndex - item.centerCol;
      return canPlaceBlock(board, item, adjustedRowIndex, adjustedColIndex);
    },
    hover: (item: Block & { centerRow: number; centerCol: number }) => {
      updateHighlightedCells(item, rowIndex, colIndex);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  });

  let backgroundColor = getCellColor(cellValue);
  if (isHighlighted) {
    backgroundColor = 'bg-gray-400';
  }

  return (
    <div
      ref={drop}
      className={`aspect-square border ${backgroundColor}`}
    />
  );
};

export default GameBoard;