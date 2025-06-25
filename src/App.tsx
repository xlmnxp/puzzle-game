import React, { useState, useEffect, useRef } from 'react';
import { Grid, Crown, RotateCcw, Info, X } from 'lucide-react';
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
import Instructions from './components/Instructions';

function App() {
  const [board, setBoard] = useState<number[][]>(Array(8).fill(null).map(() => Array(8).fill(0)));
  const [score, setScore] = useState<number>(0);
  const [highestScore, setHighestScore] = useState<number>(0);
  const [availableBlocks, setAvailableBlocks] = useState<Block[]>([]);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  const [showResetConfirmation, setShowResetConfirmation] = useState<boolean>(false);
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

    let newBoard = board.map(row => [...row]);
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
      const completedCols = Array(8).fill(null).reduce((acc, _, colIndex) => 
        newBoard.every(row => row[colIndex] !== 0) ? [...acc, colIndex] : acc, []);

      if (completedRows.length > 0 || completedCols.length > 0) {
        playRemoveSound();
        playEncouragementSound();

        newBoard = newBoard.map((row, rowIndex) => 
          completedRows.includes(rowIndex) 
            ? Array(8).fill(0) 
            : row.map((cell, colIndex) => completedCols.includes(colIndex) ? 0 : cell)
        );

        setBoard(newBoard);
        const clearedCells = (completedRows.length * 8) + (completedCols.length * 8) - (completedRows.length * completedCols.length);
        setScore(prevScore => prevScore + clearedCells);
      }

      let updatedAvailableBlocks = availableBlocks.filter(b => b.id !== block.id);

      if (!updatedAvailableBlocks.length) {
        updatedAvailableBlocks = generateBlocks(3)
      }

      setAvailableBlocks(updatedAvailableBlocks);

      if (checkGameOver(newBoard, updatedAvailableBlocks)) {
        setGameOver(true);
      }
    }
  };

  const resetGame = () => {
    setBoard(Array(8).fill(null).map(() => Array(8).fill(0)));
    setScore(0);
    setAvailableBlocks(generateBlocks());
    setGameOver(false);
    highScorePlayedRef.current = false;
    setShowResetConfirmation(false);
  };

  const handleResetClick = () => {
    setShowResetConfirmation(true);
  };

  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  return (
    <DndProvider backend={isTouchDevice ? TouchBackend : HTML5Backend}>
      <div className="flex flex-col items-center min-h-screen">
        <div className="p-2 w-full max-w-3xl flex-grow">
          <h1 className="text-3xl font-bold mb-2 text-blue-600 dark:text-blue-400 text-center">لعبة المكعبات</h1>
          <div className="p-2 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="flex items-center ml-1">
                  <Grid className="w-4 h-4 ml-1 text-blue-500 dark:text-blue-400" />
                  <span className="text-sm font-semibold dark:text-gray-300">النقاط: {score}</span>
                </div>
                <div className="flex items-center">
                  <Crown className="w-4 h-4 ml-1 text-yellow-500 dark:text-yellow-400" />
                  <span className="text-sm font-semibold dark:text-gray-300">الأفضل: {highestScore}</span>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setShowInstructions(!showInstructions)}
                  className="bg-blue-100 text-blue-600 px-2 py-1 rounded-lg hover:bg-blue-200 dark:bg-gray-700 dark:text-blue-400 dark:hover:bg-gray-600 transition-colors flex items-center text-xs ml-1"
                >
                  <Info className="w-4 h-4 ml-1" />
                  كيف العب؟
                </button>
                <button
                  onClick={handleResetClick}
                  className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors flex items-center text-xs"
                >
                  <RotateCcw className="w-4 h-4 ml-1" />
                  لعبة جديدة
                </button>
              </div>
            </div>
            {showInstructions && <Instructions />}
            {!showInstructions && <GameBoard board={board} placeBlock={placeBlock} />}
            {!showInstructions && <BlockSelector blocks={availableBlocks} />}
          </div>
        </div>
        <PWAInstallPrompt />
        <AdSense />
      </div>
      {gameOver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-md">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center">
            <h2 className="text-2xl font-bold text-red-600 dark:text-red-500 mb-3">انتهت اللعبة!</h2>
            <p className="text-xl mb-4 dark:text-gray-300">النتيجة النهائية: {score}</p>
            <button
              onClick={resetGame}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors flex items-center justify-center mx-auto text-lg"
            >
              <RotateCcw className="w-5 h-5 ml-2" />
              لعب مرة أخرى
            </button>
          </div>
        </div>
      )}
      {showResetConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-md">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center">
            <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-3">هل أنت متأكد؟</h2>
            <p className="text-sm mb-4 dark:text-gray-300">هل تريد حقًا بدء لعبة جديدة؟ ستفقد تقدمك الحالي.</p>
            <div className="flex justify-center space-x-2">
              <button
                onClick={resetGame}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors text-sm ml-2"
              >
                نعم، ابدأ لعبة جديدة
              </button>
              <button
                onClick={() => setShowResetConfirmation(false)}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500 transition-colors text-sm"
              >
                لا، استمر في اللعبة الحالية
              </button>
            </div>
          </div>
        </div>
      )}
    </DndProvider>
  );
}

export default App;