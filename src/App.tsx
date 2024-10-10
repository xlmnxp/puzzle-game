import React, { useState, useEffect, useRef } from 'react';
import { Grid, Crown } from 'lucide-react';
import { DndProvider } from 'react-dnd';
import { TouchBackend } from 'react-dnd-touch-backend';
import { HTML5Backend } from 'react-dnd-html5-backend';
import GameBoard from './components/GameBoard';
import BlockSelector from './components/BlockSelector';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import AdSense from './components/AdSense';
import { generateBlocks, checkGameOver, canPlaceBlock } from './utils/gameLogic';
import { playPlaceSound, playRemoveSound, playEncouragementSound, playHighScoreSound } from './utils/sounds';
import { Block } from './types';

function App() {
  const [board, setBoard] = useState<number[][]>(Array(10).fill(null).map(() => Array(10).fill(0)));
  const [score, setScore] = useState<number>(0);
  const [highestScore, setHighestScore] = useState<number>(0);
  const [availableBlocks, setAvailableBlocks] = useState<Block[]>([]);
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

      // Check for completed rows and columns
      const completedRows = newBoard.reduce((acc, row, index) => row.every(cell => cell !== 0) ? [...acc, index] : acc, []);
      const completedCols = Array(10).fill(null).reduce((acc, _, colIndex) => 
        newBoard.every(row => row[colIndex] !== 0) ? [...acc, colIndex] : acc, []);

      if (completedRows.length > 0 || completedCols.length > 0) {
        playRemoveSound();
        playEncouragementSound();

        const updatedBoard = newBoard.map((row, rowIndex) => 
          completedRows.includes(rowIndex) 
            ? Array(10).fill(0) 
            : row.map((cell, colIndex) => completedCols.includes(colIndex) ? 0 : cell)
        );

        setBoard(updatedBoard);
        const clearedCells = (completedRows.length * 10) + (completedCols.length * 10) - (completedRows.length * completedCols.length);
        setScore(prevScore => prevScore + clearedCells);
      }

      if (checkGameOver(board, availableBlocks)) {
        setGameOver(true);
      }
    }
  };

  const resetGame = () => {
    setBoard(Array(10).fill(null).map(() => Array(10).fill(0)));
    setScore(0);
    setAvailableBlocks(generateBlocks());
    setGameOver(false);
    highScorePlayedRef.current = false;
  };

  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  return (
    <DndProvider backend={isTouchDevice ? TouchBackend : HTML5Backend}>
      <div className="min-h-screen bg-gray-100 flex flex-col items-center">
        <div className="w-full text-center">
          <AdSense />
        </div>
        <div className="p-4 w-full max-w-3xl flex-grow">
          <h1 className="text-4xl font-bold mb-4 text-blue-600 text-center">لعبة المكعبات</h1>
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-4">
              <div className="flex flex-col items-center sm:items-start mb-2 sm:mb-0">
                <div className="flex items-center">
                  <Grid className="w-6 h-6 ml-2 text-blue-500" />
                  <span className="text-xl font-semibold">النقاط: {score}</span>
                </div>
                <div className="flex items-center mt-1">
                  <Crown className="w-5 h-5 ml-2 text-yellow-500" />
                  <span className="text-lg font-semibold">الأفضل: {highestScore}</span>
                </div>
              </div>
              <button
                onClick={resetGame}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
              >
                بدء لعبة جديدة
              </button>
            </div>
            <GameBoard board={board} placeBlock={placeBlock} />
            <BlockSelector blocks={availableBlocks} />
            {gameOver && (
              <div className="mt-4 text-center">
                <p className="text-xl font-bold text-red-600">انتهت اللعبة!</p>
                <p className="text-lg">افضل نتيجة لك: {score}</p>
              </div>
            )}
          </div>
        </div>
        <PWAInstallPrompt />
      </div>
    </DndProvider>
  );
}

export default App;