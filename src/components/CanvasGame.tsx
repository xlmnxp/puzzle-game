import React, { useEffect, useRef, useState } from 'react';
import { Block } from '../types';
import { canPlaceBlock } from '../utils/gameLogic';

interface CanvasGameProps {
  board: number[][];
  availableBlocks: Block[];
  placeBlock: (block: Block, rowIndex: number, colIndex: number) => void;
}

type Point = { x: number; y: number };

type PaletteItemLayout = {
  block: Block;
  x: number;
  y: number;
  cellSize: number;
  width: number;
  height: number;
};

const getColor = (value: number): string => {
  switch (value) {
    case 1:
      return '#ef4444'; // red-500
    case 2:
      return '#3b82f6'; // blue-500
    case 3:
      return '#22c55e'; // green-500
    case 4:
      return '#eab308'; // yellow-500
    case 5:
      return '#a855f7'; // purple-500
    default:
      return '#e5e7eb'; // gray-200
  }
};

const CanvasGame: React.FC<CanvasGameProps> = ({ board, availableBlocks, placeBlock }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cssSize, setCssSize] = useState<{ width: number; height: number }>({ width: 300, height: 500 });

  // Local cache for layout; we compute on draw on-demand
  const [, setPaletteLayout] = useState<PaletteItemLayout[]>([]);

  const dragStateRef = useRef<{
    active: boolean;
    block: Block | null;
    source: 'palette' | null;
    pointer: Point;
    offset: Point; // pointer offset from block top-left
    hoverTopLeftCell: { row: number; col: number } | null;
  }>({ active: false, block: null, source: null, pointer: { x: 0, y: 0 }, offset: { x: 0, y: 0 }, hoverTopLeftCell: null });

  // Resize observer to fit container width
  useEffect(() => {
    const handleResize = () => {
      const width = containerRef.current?.clientWidth || 300;
      // Reserve ~40% of width for palette area height
      const height = Math.round(width + Math.max(140, width * 0.4));
      setCssSize({ width, height });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Canvas pixel ratio setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.round(cssSize.width * dpr);
    canvas.height = Math.round(cssSize.height * dpr);
    canvas.style.width = `${cssSize.width}px`;
    canvas.style.height = `${cssSize.height}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cssSize.width, cssSize.height]);

  // Redraw on state changes
  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, availableBlocks]);

  // Layout constants derived from current size
  const getLayout = () => {
    const padding = 12;
    const boardSize = Math.min(cssSize.width - padding * 2, cssSize.width - padding * 2);
    const cellSize = Math.floor(boardSize / 8);
    const actualBoardSize = cellSize * 8;
    const boardX = Math.floor((cssSize.width - actualBoardSize) / 2);
    const boardY = padding;
    const paletteTop = boardY + actualBoardSize + 16;
    const paletteCell = Math.max(14, Math.floor(cellSize * 0.65));
    const paletteGap = Math.floor(padding * 1.5);
    const paletteTotalWidth = availableBlocks.length * (paletteCell * 3) + (availableBlocks.length - 1) * paletteGap;
    const paletteX = Math.max(padding, Math.floor((cssSize.width - paletteTotalWidth) / 2));

    return { padding, cellSize, boardX, boardY, actualBoardSize, paletteTop, paletteCell, paletteGap, paletteX };
  };

  const computePaletteLayout = (): PaletteItemLayout[] => {
    const { paletteTop, paletteCell, paletteGap, paletteX } = getLayout();
    const items: PaletteItemLayout[] = [];
    let x = paletteX;
    for (const block of availableBlocks) {
      const width = paletteCell * 3;
      const height = paletteCell * 3;
      items.push({ block, x, y: paletteTop, cellSize: paletteCell, width, height });
      x += width + paletteGap;
    }
    return items;
  };

  // Draw the entire scene
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { cellSize, boardX, boardY, actualBoardSize } = getLayout();

    // Clear
    ctx.clearRect(0, 0, cssSize.width, cssSize.height);

    // Draw board background
    ctx.fillStyle = '#f3f4f6'; // gray-100
    ctx.fillRect(boardX, boardY, actualBoardSize, actualBoardSize);

    // Grid lines
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 8; i++) {
      // vertical
      ctx.beginPath();
      ctx.moveTo(boardX + i * cellSize + 0.5, boardY + 0.5);
      ctx.lineTo(boardX + i * cellSize + 0.5, boardY + actualBoardSize + 0.5);
      ctx.stroke();
      // horizontal
      ctx.beginPath();
      ctx.moveTo(boardX + 0.5, boardY + i * cellSize + 0.5);
      ctx.lineTo(boardX + actualBoardSize + 0.5, boardY + i * cellSize + 0.5);
      ctx.stroke();
    }

    // Draw existing cells
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const value = board[r][c];
        if (value !== 0) {
          ctx.fillStyle = getColor(value);
          ctx.fillRect(boardX + c * cellSize + 1, boardY + r * cellSize + 1, cellSize - 2, cellSize - 2);
        }
      }
    }

    // Draw palette
    const palette = computePaletteLayout();
    setPaletteLayout(palette);
    for (const item of palette) {
      drawBlock(ctx, item.block, item.x, item.y, item.cellSize, 4, 0.8);
    }

    // Draw dragging block and highlight
    const drag = dragStateRef.current;
    if (drag.active && drag.block) {
      const dragX = drag.pointer.x - drag.offset.x;
      const dragY = drag.pointer.y - drag.offset.y;

      // Highlight placement if over board
      const topLeftCell = getTopLeftCellFromPoint(dragX, dragY);
      drag.hoverTopLeftCell = topLeftCell;
      if (topLeftCell) {
        const canPlace = canPlaceBlock(board, drag.block, topLeftCell.row, topLeftCell.col);
        drawPlacementHighlight(ctx, drag.block, topLeftCell.row, topLeftCell.col, canPlace);
      }

      // Draw block following pointer
      drawBlock(ctx, drag.block, dragX, dragY, cellSize, 6, 0.95);
    }
  };

  const drawBlock = (
    ctx: CanvasRenderingContext2D,
    block: Block,
    x: number,
    y: number,
    cell: number,
    gap: number,
    opacity = 1
  ) => {
    ctx.save();
    ctx.globalAlpha = opacity;
    for (let i = 0; i < block.shape.length; i++) {
      for (let j = 0; j < block.shape[i].length; j++) {
        if (block.shape[i][j]) {
          ctx.fillStyle = getColor(block.color);
          ctx.fillRect(x + j * cell + gap, y + i * cell + gap, cell - gap * 2, cell - gap * 2);
        }
      }
    }
    ctx.restore();
  };

  const drawPlacementHighlight = (
    ctx: CanvasRenderingContext2D,
    block: Block,
    row: number,
    col: number,
    canPlace: boolean
  ) => {
    const { cellSize, boardX, boardY } = getLayout();
    ctx.save();
    ctx.globalAlpha = canPlace ? 0.25 : 0.25;
    ctx.fillStyle = canPlace ? '#6b7280' : '#ef4444';
    for (let i = 0; i < block.shape.length; i++) {
      for (let j = 0; j < block.shape[i].length; j++) {
        if (block.shape[i][j]) {
          const r = row + i;
          const c = col + j;
          ctx.fillRect(boardX + c * cellSize + 1, boardY + r * cellSize + 1, cellSize - 2, cellSize - 2);
        }
      }
    }
    ctx.restore();
  };

  const getTopLeftCellFromPoint = (x: number, y: number): { row: number; col: number } | null => {
    const { cellSize, boardX, boardY, actualBoardSize } = getLayout();
    if (x < boardX || y < boardY || x > boardX + actualBoardSize || y > boardY + actualBoardSize) return null;
    const col = Math.floor((x - boardX) / cellSize);
    const row = Math.floor((y - boardY) / cellSize);
    return { row, col };
  };

  // Pointer events
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const toLocal = (evt: PointerEvent): Point => {
      const rect = canvas.getBoundingClientRect();
      return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
    };

    const onPointerDown = (evt: PointerEvent) => {
      const p = toLocal(evt);
      const palette = computePaletteLayout();
      // Find first palette block under pointer and check if inside any filled cell
      for (const item of palette) {
        if (p.x >= item.x && p.x <= item.x + item.width && p.y >= item.y && p.y <= item.y + item.height) {
          // Determine which cell inside the 3x3 grid was clicked to compute offset relative to block top-left
          const localX = p.x - item.x;
          const localY = p.y - item.y;
          // Compute top-left of active block shape relative to 3x3 grid
          const firstActive = findFirstActiveCell(item.block);
          const blockTopLeftX = item.x + firstActive.col * item.cellSize;
          const blockTopLeftY = item.y + firstActive.row * item.cellSize;

          // Ensure the pointer is on an active cell region to start drag
          const gridCol = Math.floor(localX / item.cellSize);
          const gridRow = Math.floor(localY / item.cellSize);
          if (item.block.shape[gridRow] && item.block.shape[gridRow][gridCol] === 1) {
            dragStateRef.current.active = true;
            dragStateRef.current.block = item.block;
            dragStateRef.current.source = 'palette';
            dragStateRef.current.pointer = p;
            dragStateRef.current.offset = { x: p.x - blockTopLeftX, y: p.y - blockTopLeftY };
            dragStateRef.current.hoverTopLeftCell = null;
            draw();
            canvas.setPointerCapture(evt.pointerId);
            break;
          }
        }
      }
    };

    const onPointerMove = (evt: PointerEvent) => {
      if (!dragStateRef.current.active) return;
      dragStateRef.current.pointer = toLocal(evt);
      draw();
    };

    const onPointerUp = () => {
      const drag = dragStateRef.current;
      if (drag.active && drag.block) {
        const dragX = drag.pointer.x - drag.offset.x;
        const dragY = drag.pointer.y - drag.offset.y;
        const cell = getTopLeftCellFromPoint(dragX, dragY);
        if (cell && canPlaceBlock(board, drag.block, cell.row, cell.col)) {
          placeBlock(drag.block, cell.row, cell.col);
        }
      }
      dragStateRef.current = { active: false, block: null, source: null, pointer: { x: 0, y: 0 }, offset: { x: 0, y: 0 }, hoverTopLeftCell: null };
      draw();
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, availableBlocks, cssSize]);

  const findFirstActiveCell = (block: Block): { row: number; col: number } => {
    for (let r = 0; r < block.shape.length; r++) {
      for (let c = 0; c < block.shape[r].length; c++) {
        if (block.shape[r][c] === 1) return { row: r, col: c };
      }
    }
    return { row: 0, col: 0 };
  };

  return (
    <div ref={containerRef} className="w-full">
      <canvas ref={canvasRef} style={{ display: 'block', touchAction: 'none' }} />
    </div>
  );
};

export default CanvasGame;


