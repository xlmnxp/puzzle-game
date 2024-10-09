import React, { useState, useEffect, useRef } from 'react';
import { Grid, Crown } from 'lucide-react';
import GameBoard from './components/GameBoard';
import BlockSelector from './components/BlockSelector';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { generateBlocks, checkGameOver, canPlaceBlock } from './utils/gameLogic';
import { playPlaceSound, playRemoveSound, playEncouragementSound, playHighScoreSound } from './utils/sounds';
import { Block } from './types';

function App() {
  const [board, setBoard] = useState<number[][]>(Array(10).fill(null).map(() => Array(10).fill(0)));
  const [score, setScore] = useState<number>(0);
  const [highestScore, setHighestScore] = useState<number>(0);
  const [availableBlocks, setAvailableBlocks] = useState<Block[]>([]);
  const [draggedBlock, setDraggedBlock] = useState<Block | null>(null);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const highScorePlayedRef = useRef<boolean>(false);

  useEffect(() => {
    setAvailableBlocks(generateBlocks());
    const storedHighestScore = localStorage.getItem('highestScore');
    if (storedHighestScore) {
      setHighestScore(parseInt(storedHighestScore, 10));
    }
  }, []);

  useEffect(() => {
    if (score > highestScore) {
      setHighestScore(score);
      localStorage.setItem('highestScore', score.toString());
      if (!highScorePlayedRef.current) {
        playHighScoreSound();
        highScorePlayedRef.current = true;
      }
    }
  }, [score, highestScore]);

  const placeBlock = (block: Block, rowIndex: number, colIndex: number) => {
    if (gameOver) return;

    const newBoard = board.map(row => [...row]);
    let canPlace = canPlaceBlock(newBoard, block, rowIndex, colIndex);

    if (canPlace) {
      playPlaceSound();

      for (let i = 0; i < block.shape.length; i++) {
        for (let j = 0; j < block.shape[i].length; j++) {
          if (block.shape[i][j]) {
            newBoard[rowIndex + i][colIndex + j] = block.color;
          }
        }
      }

      setBoard(newBoard);
      setScore(prevScore => prevScore + block.shape.flat().filter(Boolean).length);
      setAvailableBlocks(prevBlocks => {
        const updatedBlocks = prevBlocks.filter(b => b.id !== block.id);
        return updatedBlocks.concat(generateBlocks(1));
      });
      setDraggedBlock(null);

      // Check for completed rows and columns
      const completedRows = newBoard.filter(row => row.every(cell => cell !== 0));
      const completedCols = Array(10).fill(null).map((_, colIndex) => 
        newBoard.every(row => row[colIndex] !== 0)
      ).filter(Boolean);

      if (completedRows.length > 0 || completedCols.length > 0) {
        playRemoveSound();
        playEncouragementSound();

        const updatedBoard = newBoard.map(row => row.map(cell => 
          completedRows.includes(row) || completedCols.some((_, i) => completedCols[i] && row[i] !== 0) ? 0 : cell
        ));
        setBoard(updatedBoard);
        const clearedCells = (completedRows.length * 10) + (completedCols.length * 10) - (completedRows.length * completedCols.length);
        setScore(prevScore => prevScore + clearedCells);
      }

      if (checkGameOver(newBoard, availableBlocks)) {
        setGameOver(true);
      }
    }
  };

  const resetGame = () => {
    setBoard(Array(10).fill(null).map(() => Array(10).fill(0)));
    setScore(0);
    setAvailableBlocks(generateBlocks());
    setDraggedBlock(null);
    setGameOver(false);
    highScorePlayedRef.current = false;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-4 text-blue-600">Block Puzzle</h1>
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col items-start">
            <div className="flex items-center">
              <Grid className="w-6 h-6 mr-2 text-blue-500" />
              <span className="text-xl font-semibold">Score: {score}</span>
            </div>
            <div className="flex items-center mt-1">
              <Crown className="w-5 h-5 mr-2 text-yellow-500" />
              <span className="text-lg font-semibold">Best: {highestScore}</span>
            </div>
          </div>
          <button
            onClick={resetGame}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            New Game
          </button>
        </div>
        <GameBoard board={board} placeBlock={placeBlock} draggedBlock={draggedBlock} />
        <BlockSelector blocks={availableBlocks} setDraggedBlock={setDraggedBlock} />
        {gameOver && (
          <div className="mt-4 text-center">
            <p className="text-xl font-bold text-red-600">Game Over!</p>
            <p className="text-lg">Final Score: {score}</p>
          </div>
        )}
      </div>
      <PWAInstallPrompt />
    </div>
  );
}

export default App;