import { useState, useEffect, useRef } from 'react';
import { Grid, Crown, RotateCcw, Info } from 'lucide-react';
import CanvasGame from './components/CanvasGame';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import AdSense from './components/AdSense';
import { generateBlocks, checkGameOver, canPlaceBlock } from './utils/gameLogic';
import { playPlaceSound, playRemoveSound, playEncouragementSound, playHighScoreSound } from './utils/sounds';
import { Block } from './types';
import Instructions from './components/Instructions';
import { BOARD_ROWS, BOARD_COLS } from './utils/constants';

function App() {
  const [board, setBoard] = useState<number[][]>(Array(BOARD_ROWS).fill(null).map(() => Array(BOARD_COLS).fill(0)));
  const [score, setScore] = useState<number>(0);
  const [highestScore, setHighestScore] = useState<number>(0);
  const [availableBlocks, setAvailableBlocks] = useState<Block[]>([]);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  const [showResetConfirmation, setShowResetConfirmation] = useState<boolean>(false);
  const [scoreBursts, setScoreBursts] = useState<Array<{ id: number; amount: number }>>([]);
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

  const addScore = (delta: number) => {
    if (!delta) return;
    setScore(prev => prev + delta);
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setScoreBursts(prev => [...prev, { id, amount: delta }]);
    window.setTimeout(() => {
      setScoreBursts(prev => prev.filter(b => b.id !== id));
    }, 900);
  };

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
      const placedCells = block.shape.flat().filter(Boolean).length;
      addScore(placedCells);
      setAvailableBlocks(prevBlocks => {
        const updatedBlocks = prevBlocks.filter(b => b.id !== block.id);
        return updatedBlocks.concat(generateBlocks(1));
      });

      // Check for completed rows and columns
      const completedRows = newBoard.reduce((acc, row, index) => row.every(cell => cell !== 0) ? [...acc, index] : acc, []);
      const completedCols = Array(BOARD_COLS).fill(null).reduce((acc, _, colIndex) =>
        newBoard.every(row => row[colIndex] !== 0) ? [...acc, colIndex] : acc, []);

      if (completedRows.length > 0 || completedCols.length > 0) {
        playRemoveSound();
        playEncouragementSound();

        newBoard = newBoard.map((row, rowIndex) =>
          completedRows.includes(rowIndex)
            ? Array(BOARD_COLS).fill(0)
            : row.map((cell, colIndex) => completedCols.includes(colIndex) ? 0 : cell)
        );

        setBoard(newBoard);
        const clearedCells = (completedRows.length * BOARD_COLS) + (completedCols.length * BOARD_ROWS) - (completedRows.length * completedCols.length);
        addScore(clearedCells);
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
    setBoard(Array(BOARD_ROWS).fill(null).map(() => Array(BOARD_COLS).fill(0)));
    setScore(0);
    setAvailableBlocks(generateBlocks());
    setGameOver(false);
    highScorePlayedRef.current = false;
    setShowResetConfirmation(false);
  };

  const handleResetClick = () => {
    setShowResetConfirmation(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center">
      {/* Title stays at the top */}
      <div className="p-2 w-full max-w-3xl">
        <h1 className="text-4xl font-extrabold mb-2 text-yellow-400 text-center tracking-wider drop-shadow-md">لعبة المكعبات</h1>
      </div>
      {/* Rest of the content centered vertically */}
      <div className="p-2 w-full max-w-3xl flex-1 flex flex-col justify-center">
        <div className="p-2 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="game-panel relative flex items-center ml-1 px-3 py-1">
                <Grid className="w-4 h-4 ml-1 text-blue-600" />
                <span className="text-sm font-bold text-blue-900">النقاط: {score}</span>
                {scoreBursts.map((b, idx) => (
                  <span
                    key={b.id}
                    className="absolute right-0 -top-6 text-base sm:text-lg font-extrabold text-green-400 animate-points-burst select-none"
                    style={{
                      transformOrigin: 'bottom right',
                      marginTop: `${idx * 2}px`,
                    }}
                  >
                    +{b.amount}
                  </span>
                ))}
              </div>
              <div className="game-panel flex items-center px-3 py-1">
                <Crown className="w-4 h-4 ml-1 text-yellow-600" />
                <span className="text-sm font-bold text-yellow-900">الأفضل: {highestScore}</span>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="bg-blue-100 text-blue-600 px-2 py-1 rounded-lg hover:bg-blue-200 transition-colors flex items-center text-xs ml-1 brick-button"
              >
                <Info className="w-4 h-4 ml-1" />
                كيف العب؟
              </button>
              <button
                onClick={handleResetClick}
                className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors flex items-center text-xs brick-button"
              >
                <RotateCcw className="w-4 h-4 ml-1" />
                لعبة جديدة
              </button>
            </div>
          </div>
          {showInstructions && <Instructions />}
          {!showInstructions && (
            <div className="w-full flex justify-center">
              <CanvasGame board={board} availableBlocks={availableBlocks} placeBlock={placeBlock} />
            </div>
          )}
        </div>
      </div>
      <PWAInstallPrompt />
      <AdSense />
      {gameOver && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="game-panel w-full max-w-sm text-center">
            <h2 className="text-3xl font-black text-red-500 mb-3 drop-shadow-sm">انتهت اللعبة!</h2>
            <p className="text-xl mb-4">النتيجة النهائية: {score}</p>
            <button
              onClick={resetGame}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center mx-auto text-lg brick-button"
            >
              <RotateCcw className="w-5 h-5 ml-2" />
              لعب مرة أخرى
            </button>
          </div>
        </div>
      )}
      {showResetConfirmation && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="game-panel w-full max-w-sm text-center">
            <h2 className="text-xl font-bold text-yellow-600 mb-3">هل أنت متأكد؟</h2>
            <p className="text-sm mb-4 text-slate-600">هل تريد حقًا بدء لعبة جديدة؟ ستفقد تقدمك الحالي.</p>
            <div className="flex justify-center space-x-2">
              <button
                onClick={resetGame}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm ml-2 brick-button"
              >
                نعم، ابدأ لعبة جديدة
              </button>
              <button
                onClick={() => setShowResetConfirmation(false)}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors text-sm brick-button"
              >
                لا، استمر في اللعبة الحالية
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;