import { Block } from '../types';

const blockShapes = [
  [[1]],
  [[1, 1]],
  [[1, 1, 1]],
  [[1], [1]],
  [[1], [1], [1]],
  [[1, 1], [1, 1]],
  [[1, 1], [1, 0]],
  [[1, 1, 1], [1, 0, 0]],
  [[1, 1, 1], [0, 1, 0]],
  [[1, 1, 1], [1, 1, 1]],
  [[1, 1], [0, 1], [0, 1]],
  [[1, 1], [1, 0], [1, 0]],
  [[1, 1, 1], [1, 1, 1], [1, 1, 1]],
  [[1, 1, 1], [1, 0, 0], [1, 0, 0]],
];

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
    for (let i = 0; i <= board.length - block.shape.length; i++) {
      for (let j = 0; j <= board[0].length - block.shape[0].length; j++) {
        if (canPlaceBlock(board, block, i, j)) {
          return false;
        }
      }
    }
  }
  return true;
};