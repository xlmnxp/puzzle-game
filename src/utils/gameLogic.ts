import { Block } from '../types';
import { BOARD_ROWS, BOARD_COLS } from './constants';

const blockShapes = [
  [[1]],
  [[1, 1]],
  [[1, 1, 1]],
  [[1], [1]],
  [[1], [1], [1]],
  [[1, 1], [1, 1]],
  [[1, 1], [1, 0]],
  [[1, 0], [1, 1]],
  [[1, 1], [0, 1]],
  [[0, 1], [1, 1]],
  [[1, 1, 1], [1, 0, 0]],
  [[1, 0, 0], [1, 1, 1]],
  [[0, 0, 1], [1, 1, 1]],
  [[1, 1, 1], [0, 0, 1]],
  [[1, 1, 1], [0, 1, 0]],
  [[0, 1, 0], [1, 1, 1]],
  [[1, 0], [1, 1], [1, 0]],
  [[0, 1], [1, 1], [0, 1]],
  [[1, 1, 1], [1, 1, 1]],
  [[1, 1], [1, 1], [1, 1]],
  [[1, 1], [0, 1], [0, 1]],
  [[1, 1], [1, 0], [1, 0]],
  [[1, 0], [1, 0], [1, 1]],
  [[0, 1], [0, 1], [1, 1]],
  [[1, 1, 1], [1, 1, 1], [1, 1, 1]],
  [[1, 1, 1], [1, 0, 0], [1, 0, 0]],
  [[1, 1, 1], [0, 0, 1], [0, 0, 1]],
  [[0, 0, 1], [0, 0, 1], [1, 1, 1]],
  [[1, 0, 0], [1, 0, 0], [1, 1, 1]],
];

// draw all blocks in console
blockShapes.forEach(shape => {
  // use sequare to draw the shape or space to draw the space
  const square = '■ ';
  const space = '  ';
  const line = shape.map(row => row.map(cell => cell ? square : space).join('')).join('\n');
  console.log(line);
  console.log('--------------------------------');
});

// Fisher-Yates shuffle algorithm
const shuffleArray = <T>(array: T[]): T[] => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// Simple unique ID generator
const generateUniqueId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const generateBlocks = (count: number = 3): Block[] => {
  const shuffledShapes = shuffleArray([...blockShapes]);
  return shuffledShapes.slice(0, count).map(shape => ({
    id: generateUniqueId(),
    shape,
    color: Math.floor(Math.random() * 5) + 1, // Random color from 1 to 5
  }));
};

export const canPlaceBlock = (board: number[][], block: Block, rowIndex: number, colIndex: number): boolean => {
  for (let i = 0; i < block.shape.length; i++) {
    for (let j = 0; j < block.shape[i].length; j++) {
      if (block.shape[i][j]) {
        const boardRow = rowIndex + i;
        const boardCol = colIndex + j;
        
        // Check if the block is within the board boundaries
        if (boardRow < 0 || boardRow >= board.length || boardCol < 0 || boardCol >= board[0].length) {
          return false;
        }
        
        // Check if the cell is already occupied
        if (board[boardRow][boardCol] !== 0) {
          return false;
        }
      }
    }
  }
  return true;
};

export const checkGameOver = (board: number[][], availableBlocks: Block[]): boolean => {
  for (let block of availableBlocks) {
    for (let i = 0; i <= BOARD_ROWS - block.shape.length; i++) {
      for (let j = 0; j <= BOARD_COLS - block.shape[0].length; j++) {
        if (canPlaceBlock(board, block, i, j)) {
          return false;
        }
      }
    }
  }
  return true;
};