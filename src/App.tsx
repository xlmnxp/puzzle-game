import React, { useState, useEffect, useRef } from 'react';
import { Grid, Crown, RotateCcw, Info } from 'lucide-react';
import { DndProvider } from 'react-dnd';
import { TouchBackend } from 'react-dnd-touch-backend';
import { HTML5Backend } from 'react-dnd-html5-backend';
import GameBoard from './components/GameBoard';
import BlockSelector from './components/BlockSelector';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { generateBlocks, checkGameOver, canPlaceBlock } from './utils/gameLogic';
import { playPlaceSound, playRemoveSound, playEncouragementSound, playHighScoreSound } from './utils/sounds';
import { Block } from './types';
import Instructions from './components/Instructions';

function App() {
  const [board, setBoard] = useState<number[][]>(Array(10).fill(null).map(() => Array(10).fill(0)));
  const [score, setScore] = useState<number>(0);
  const [highestScore, setHighestScore] = useState<number>(0);
  const [availableBlocks, setAvailableBlocks] = useState<Block[]>([]);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
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
      const completedCols = Array(10).fill(null).reduce((acc, _, colIndex) => 
        newBoard.every(row => row[colIndex] !== 0) ? [...acc, colIndex] : acc, []);

      if (completedRows.length > 0 || completedCols.length > 0) {
        playRemoveSound();
        playEncouragementSound();

        newBoard = newBoard.map((row, rowIndex) => 
          completedRows.includes(rowIndex) 
            ? Array(10).fill(0) 
            : row.map((cell, colIndex) => completedCols.includes(colIndex) ? 0 : cell)
        );

        setBoard(newBoard);
        const clearedCells = (completedRows.length * 10) + (completedCols.length * 10) - (completedRows.length * completedCols.length);
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
    setBoard(Array(10).fill(null).map(() => Array(10).fill(0)));
    setScore(0);
    setAvailableBlocks(generateBlocks());
    setGameOver(false);
    highScorePlayedRef.current = false;
  };

  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  return (
    <DndProvider backend={isTouchDevice ? TouchBackend : HTML5Backend}>
      <div className="flex flex-col items-center min-h-screen">
        <div className="p-4 w-full max-w-3xl flex-grow">
          <h1 className="text-4xl font-bold mb-4 text-blue-600 text-center">لعبة المكعبات</h1>
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center ml-2">
                  <Grid className="w-6 h-6 ml-1 text-blue-500" />
                  <span className="text-xl font-semibold">النقاط: {score}</span>
                </div>
                <div className="flex items-center">
                  <Crown className="w-5 h-5 ml-1 text-yellow-500" />
                  <span className="text-lg font-semibold">الأفضل: {highestScore}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowInstructions(!showInstructions)}
                  className="bg-blue-100 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-200 transition-colors flex items-center ml-1"
                >
                  <Info className="w-5 h-5 ml-1" />
                  كيف العب؟
                </button>
                <button
                  onClick={resetGame}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors flex items-center"
                >
                  <RotateCcw className="w-5 h-5 ml-1" />
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
      </div>
      {gameOver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-md">
          <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <h2 className="text-3xl font-bold text-red-600 mb-4">انتهت اللعبة!</h2>
            <p className="text-2xl mb-6">النتيجة النهائية: {score}</p>
            <button
              onClick={resetGame}
              className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center mx-auto text-xl"
            >
              <RotateCcw className="w-6 h-6 ml-2" />
              لعب مرة أخرى
            </button>
          </div>
        </div>
      )}
    </DndProvider>
  );
}

export default App;