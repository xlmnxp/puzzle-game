import React, { useState, useRef } from 'react';
import { useDrop } from 'react-dnd';
import { Block } from '../types';
import { canPlaceBlock } from '../utils/gameLogic';

interface GameBoardProps {
  board: number[][];
  placeBlock: (block: Block, rowIndex: number, colIndex: number) => void;
}

const PLACEMENT_CORRECTION_THRESHOLD = 0.5;

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
  const ref = useRef<HTMLDivElement>(null);

  const getClampedPosition = (block: Block, targetRow: number, targetCol: number) => {
    // Calculate shape bounds (relative to 0,0 of shape)
    let minRow = block.shape.length;
    let maxRow = -1;
    let minCol = block.shape[0].length;
    let maxCol = -1;

    for (let i = 0; i < block.shape.length; i++) {
      for (let j = 0; j < block.shape[i].length; j++) {
        if (block.shape[i][j]) {
          minRow = Math.min(minRow, i);
          maxRow = Math.max(maxRow, i);
          minCol = Math.min(minCol, j);
          maxCol = Math.max(maxCol, j);
        }
      }
    }

    // Default if empty block (shouldn't happen)
    if (maxRow === -1) return { row: targetRow, col: targetCol };

    // Valid range for top-left of the shape (targetRow, targetCol)
    // targetRow + minRow >= 0  => targetRow >= -minRow
    // targetRow + maxRow < boardRows => targetRow < boardRows - maxRow
    const minValidRow = -minRow;
    const maxValidRow = board.length - 1 - maxRow;

    // targetCol + minCol >= 0 => targetCol >= -minCol
    // targetCol + maxCol < boardCols => targetCol < boardCols - maxCol
    const minValidCol = -minCol;
    const maxValidCol = board[0].length - 1 - maxCol;

    return {
      row: Math.max(minValidRow, Math.min(targetRow, maxValidRow)),
      col: Math.max(minValidCol, Math.min(targetCol, maxValidCol))
    };
  };

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'block',
    drop: (item: Block & { centerRow: number; centerCol: number }, monitor) => {
      const clientOffset = monitor.getClientOffset();
      const hoverBoundingRect = ref.current?.getBoundingClientRect();

      let adjustedRowIndex = rowIndex - item.centerRow;
      const adjustedColIndex = colIndex - item.centerCol;

      if (clientOffset && hoverBoundingRect) {
        const hoverClientY = clientOffset.y - hoverBoundingRect.top;
        const hoverHeight = hoverBoundingRect.bottom - hoverBoundingRect.top;
        // Logic to determine if we should drop in the next row
        if (hoverClientY > hoverHeight * PLACEMENT_CORRECTION_THRESHOLD) {
          adjustedRowIndex += 1;
        }
      }

      const clamped = getClampedPosition(item, adjustedRowIndex, adjustedColIndex);
      placeBlock(item, clamped.row, clamped.col);
      clearHighlightedCells();
    },
    canDrop: (item: Block & { centerRow: number; centerCol: number }, monitor) => {
      const clientOffset = monitor.getClientOffset();
      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      let targetRowIndex = rowIndex;

      if (clientOffset && hoverBoundingRect) {
        const hoverClientY = clientOffset.y - hoverBoundingRect.top;
        const hoverHeight = hoverBoundingRect.bottom - hoverBoundingRect.top;
        if (hoverClientY > hoverHeight * (1 - PLACEMENT_CORRECTION_THRESHOLD)) {
          targetRowIndex += 1;
        }
      }

      const adjustedRowIndex = targetRowIndex - item.centerRow;
      const adjustedColIndex = colIndex - item.centerCol;
      const clamped = getClampedPosition(item, adjustedRowIndex, adjustedColIndex);
      return canPlaceBlock(board, item, clamped.row, clamped.col);
    },
    hover: (item: Block & { centerRow: number; centerCol: number }, monitor) => {
      const clientOffset = monitor.getClientOffset();
      const hoverBoundingRect = ref.current?.getBoundingClientRect();

      let targetRowIndex = rowIndex;

      if (clientOffset && hoverBoundingRect) {
        const hoverClientY = clientOffset.y - hoverBoundingRect.top;
        const hoverHeight = hoverBoundingRect.bottom - hoverBoundingRect.top;
        const thresholdY = hoverHeight * (1 - PLACEMENT_CORRECTION_THRESHOLD);
        if (hoverClientY > thresholdY) {
          targetRowIndex += 1;
        }
      }

      const adjustedRowIndex = targetRowIndex - item.centerRow;
      const adjustedColIndex = colIndex - item.centerCol;
      const clamped = getClampedPosition(item, adjustedRowIndex, adjustedColIndex);
      updateHighlightedCells(item, clamped.row, clamped.col);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  });

  drop(ref);

  let backgroundColor = getCellColor(cellValue);
  if (isHighlighted) {
    backgroundColor = 'bg-gray-400';
  }

  return (
    <div
      ref={ref}
      className={`aspect-square border ${backgroundColor} ${cellValue !== 0 || isHighlighted ? 'brick-cell' : ''}`}
    />
  );
};

export default GameBoard;