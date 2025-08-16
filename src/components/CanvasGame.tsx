import React, { useEffect, useRef, useState } from 'react';
import { Block } from '../types';
import { canPlaceBlock } from '../utils/gameLogic';
import { BOARD_ROWS, BOARD_COLS } from '../utils/constants';

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

// On touch devices, keep the dragged block above the finger by this many cells
const DRAG_VERTICAL_OFFSET_CELLS = 2;

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
  const burstsRef = useRef<Array<{ id: number; x: number; y: number; amount: number; start: number; duration: number }>>([]);
  const rafRef = useRef<number | null>(null);
  const drawRef = useRef<() => void>(() => {});

  const dragStateRef = useRef<{
    active: boolean;
    block: Block | null;
    source: 'palette' | null;
    pointer: Point;
    offset: Point; // pointer offset from block top-left
    hoverTopLeftCell: { row: number; col: number } | null;
    pointerType: string | null;
  }>({ active: false, block: null, source: null, pointer: { x: 0, y: 0 }, offset: { x: 0, y: 0 }, hoverTopLeftCell: null, pointerType: null });

  // Smoothed display position for dragged block (top-left in pixels)
  const dragDisplayRef = useRef<Point>({ x: 0, y: 0 });

  // Placement animation state
  const placementAnimRef = useRef<
    | {
        block: Block;
        from: Point; // pixel top-left
        to: { row: number; col: number };
        toPixel: Point; // pixel top-left of target cell
        start: number;
        duration: number;
      }
    | null
  >(null);

  // Resize observer to fit container width
  useEffect(() => {
    const handleResize = () => {
      const width = containerRef.current?.clientWidth || 300;
      // Base height: square board plus palette area (~40% of width) with a minimum
      const baseHeight = Math.round(width + Math.max(140, width * 0.4));
      // Constrain by viewport height for better mobile fit
      const viewportMax = Math.max(360, (typeof window !== 'undefined' ? window.innerHeight : baseHeight) - 24);
      const height = Math.min(baseHeight, viewportMax);
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
    const cellSize = Math.floor(boardSize / Math.max(BOARD_ROWS, BOARD_COLS));
    const actualBoardWidth = cellSize * BOARD_COLS;
    const actualBoardHeight = cellSize * BOARD_ROWS;
    const boardX = Math.floor((cssSize.width - actualBoardWidth) / 2);
    const boardY = padding;
    const paletteTop = boardY + actualBoardHeight + 16;
    const paletteCell = Math.max(14, Math.floor(cellSize * 0.65));
    // Ensure visual margin between per-block backgrounds: gap >= 2*pad + margin
    const tilePad = Math.max(4, Math.round(paletteCell * 0.2));
    const tileMargin = Math.max(6, Math.round(paletteCell * 0.2));
    const paletteGap = 2 * tilePad + tileMargin;
    const paletteTotalWidth = availableBlocks.length * (paletteCell * 3) + (availableBlocks.length - 1) * paletteGap;
    const paletteX = Math.max(padding, Math.floor((cssSize.width - paletteTotalWidth) / 2));

    return { padding, cellSize, boardX, boardY, actualBoardWidth, actualBoardHeight, paletteTop, paletteCell, paletteGap, paletteX };
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

    const { cellSize, boardX, boardY, actualBoardWidth, actualBoardHeight } = getLayout();

    // Clear
    ctx.clearRect(0, 0, cssSize.width, cssSize.height);

    // Draw board background
    ctx.fillStyle = '#2c2c2c1f';
    ctx.fillRect(boardX, boardY, actualBoardWidth, actualBoardHeight);

    // Grid lines
    ctx.strokeStyle = '#e5e7ebc2';
    ctx.lineWidth = 1;
    for (let i = 0; i <= BOARD_COLS; i++) {
      // vertical
      ctx.beginPath();
      ctx.moveTo(boardX + i * cellSize + 0.5, boardY + 0.5);
      ctx.lineTo(boardX + i * cellSize + 0.5, boardY + actualBoardHeight + 0.5);
      ctx.stroke();
    }
    for (let i = 0; i <= BOARD_ROWS; i++) {
      // horizontal
      ctx.beginPath();
      ctx.moveTo(boardX + 0.5, boardY + i * cellSize + 0.5);
      ctx.lineTo(boardX + actualBoardWidth + 0.5, boardY + i * cellSize + 0.5);
      ctx.stroke();
    }

    // Draw existing cells
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const value = board[r][c];
        if (value !== 0) {
          ctx.fillStyle = getColor(value);
          ctx.fillRect(boardX + c * cellSize + 1, boardY + r * cellSize + 1, cellSize - 2, cellSize - 2);
        }
      }
    }

    // Draw palette per-block backgrounds
    const palette = computePaletteLayout();
    const drag = dragStateRef.current;
    const placing = placementAnimRef.current;
    for (const item of palette) {
      const pad = Math.max(4, Math.round(item.cellSize * 0.2));
      drawRoundedRect(
        ctx,
        item.x - pad,
        item.y - pad,
        item.width + pad * 2,
        item.height + pad * 2,
        8
      );
      // Hide the block from the palette while it is being dragged or animating placement
      const isDraggingThisBlock = drag.active && drag.block && drag.block.id === item.block.id;
      const isAnimatingThisBlock = !!(placing && placing.block.id === item.block.id);
      if (!isDraggingThisBlock && !isAnimatingThisBlock) {
        drawBlock(ctx, item.block, item.x, item.y, item.cellSize, 1, 0.8);
      }
    }

    // Placement animation rendering
    if (placing) {
      const t = Math.min(1, (performance.now() - placing.start) / placing.duration);
      const eased = easeOutCubic(t);
      const currX = placing.from.x + (placing.toPixel.x - placing.from.x) * eased;
      const currY = placing.from.y + (placing.toPixel.y - placing.from.y) * eased;
      const scale = 1.06 - 0.06 * eased;
      drawBlockWithScale(ctx, placing.block, currX, currY, cellSize, 1, 1, scale);

      // Finish animation -> actually place the block and spawn burst
      if (t >= 1) {
        placeBlock(placing.block, placing.to.row, placing.to.col);
        spawnBurstForPlacement(placing.block, placing.to.row, placing.to.col);
        placementAnimRef.current = null;
      }
    }

    // Draw dragging block and highlight using smoothed position (when not placing)
    if (!placing && drag.active && drag.block) {
      const dragShiftY = drag.pointerType === 'touch' ? DRAG_VERTICAL_OFFSET_CELLS * cellSize : 0;
      const desiredX = drag.pointer.x - drag.offset.x;
      const desiredY = drag.pointer.y - drag.offset.y - dragShiftY;

      // Smooth interpolation towards desired with touch acceleration
      const curr = dragDisplayRef.current;
      let smooth = 0.35; // base smoothing factor
      if (drag.pointerType === 'touch') {
        const dx = desiredX - curr.x;
        const dy = desiredY - curr.y;
        const distance = Math.hypot(dx, dy);
        const near = cellSize * 0.5;
        const far = Math.hypot(cssSize.width, cssSize.height) * 0.25;
        const t = Math.max(0, Math.min(1, (distance - near) / Math.max(1, far - near)));
        const accel = 0.35 + (0.92 - 0.35) * (1 - Math.pow(1 - t, 2)); // easeOut
        smooth = Math.max(0.2, Math.min(0.92, accel));
      }
      curr.x = curr.x + (desiredX - curr.x) * smooth;
      curr.y = curr.y + (desiredY - curr.y) * smooth;
      if (Math.abs(desiredX - curr.x) < 0.1 && Math.abs(desiredY - curr.y) < 0.1) {
        curr.x = desiredX;
        curr.y = desiredY;
      }

      // Highlight placement if over board
      const topLeftCell = getTopLeftCellFromPoint(curr.x, curr.y);
      drag.hoverTopLeftCell = topLeftCell;
      if (topLeftCell) {
        const canPlace = canPlaceBlock(board, drag.block, topLeftCell.row, topLeftCell.col);
        drawPlacementHighlight(ctx, drag.block, topLeftCell.row, topLeftCell.col, canPlace);
      }

      // Draw block following (smoothed) pointer with slight scale
      drawBlockWithScale(ctx, drag.block, curr.x, curr.y, cellSize, 1, 0.97, 1.04);
    }
  };

  // Always keep latest draw in a ref for RAF to avoid stale closures
  useEffect(() => {
    drawRef.current = draw;
  });

  const drawBursts = (nowMs: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const active: typeof burstsRef.current = [];
    for (const b of burstsRef.current) {
      const t = Math.min(1, (nowMs - b.start) / b.duration);
      const eased = 1 - Math.pow(1 - t, 2);
      const y = b.y - 24 * eased;
      const opacity = 1 - t;
      if (t < 1) active.push(b);
      ctx.save();
      ctx.globalAlpha = Math.max(0, opacity);
      ctx.fillStyle = '#16a34a'; // green-600
      ctx.font = 'bold 22px system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.shadowColor = 'rgba(255,255,255,0.9)';
      ctx.shadowBlur = 2;
      ctx.fillText(`+${b.amount}`, b.x, y);
      ctx.restore();
    }
    burstsRef.current = active;
  };

  const ensureAnimation = () => {
    if (rafRef.current != null) return;
    const tick = () => {
      rafRef.current = null;
      // Use latest draw function to reflect freshest board/props
      drawRef.current();
      drawBursts(performance.now());
      if (burstsRef.current.length > 0 || dragStateRef.current.active || placementAnimRef.current) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const spawnBurstForPlacement = (block: Block, row: number, col: number) => {
    const { cellSize, boardX, boardY } = getLayout();
    let sumX = 0;
    let sumY = 0;
    let count = 0;
    for (let i = 0; i < block.shape.length; i++) {
      for (let j = 0; j < block.shape[i].length; j++) {
        if (block.shape[i][j]) {
          const cx = boardX + (col + j + 0.5) * cellSize;
          const cy = boardY + (row + i + 0.5) * cellSize;
          sumX += cx;
          sumY += cy;
          count++;
        }
      }
    }
    if (count === 0) return;
    const x = sumX / count;
    const y = sumY / count;
    const amount = block.shape.flat().filter(Boolean).length;
    const id = Date.now() + Math.floor(Math.random() * 1000);
    burstsRef.current = [...burstsRef.current, { id, x, y, amount, start: performance.now(), duration: 900 }];
    ensureAnimation();
  };

  const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) => {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
    ctx.fillStyle = '#f8fafc80'; // slate-50
    ctx.fill();
    ctx.strokeStyle = '#e5e7eb1f'; // gray-200
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
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
        if (block.shape?.[i]?.[j]) {
          ctx.fillStyle = getColor(block.color);
          ctx.fillRect(x + j * cell + gap, y + i * cell + gap, cell - gap * 2, cell - gap * 2);
        }
      }
    }
    ctx.restore();
  };

  const drawBlockWithScale = (
    ctx: CanvasRenderingContext2D,
    block: Block,
    x: number,
    y: number,
    cell: number,
    gap: number,
    opacity = 1,
    scale = 1
  ) => {
    ctx.save();
    ctx.globalAlpha = opacity;
    // Determine block bounds (3x3 max)
    const width = block.shape[0].length * cell;
    const height = block.shape.length * cell;
    const cx = x + width / 2;
    const cy = y + height / 2;
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.translate(-cx, -cy);
    drawBlock(ctx, block, x, y, cell, gap, 1);
    ctx.restore();
  };

  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

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
    const { cellSize, boardX, boardY, actualBoardWidth, actualBoardHeight } = getLayout();
    if (x < boardX || y < boardY || x > boardX + actualBoardWidth || y > boardY + actualBoardHeight) return null;
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
          // Start drag anywhere within the 3x3 palette area
          const firstActive = findFirstActiveCell(item.block);
          const blockTopLeftX = item.x + firstActive.col * item.cellSize;
          const blockTopLeftY = item.y + firstActive.row * item.cellSize;

          dragStateRef.current.active = true;
          dragStateRef.current.block = item.block;
          dragStateRef.current.source = 'palette';
          dragStateRef.current.pointer = p;
          dragStateRef.current.offset = { x: p.x - blockTopLeftX, y: p.y - blockTopLeftY };
          dragStateRef.current.hoverTopLeftCell = null;
          dragStateRef.current.pointerType = evt.pointerType || null;
          // Initialize smoothed display position to current
          dragDisplayRef.current = { x: blockTopLeftX, y: blockTopLeftY };
          draw();
          canvas.setPointerCapture(evt.pointerId);
          ensureAnimation();
          break;
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
        const { cellSize, boardX, boardY } = getLayout();
        const curr = dragDisplayRef.current;
        const cell = getTopLeftCellFromPoint(curr.x, curr.y);
        if (cell && canPlaceBlock(board, drag.block, cell.row, cell.col)) {
          const toPixel = { x: boardX + cell.col * cellSize, y: boardY + cell.row * cellSize };
          placementAnimRef.current = {
            block: drag.block,
            from: { x: curr.x, y: curr.y },
            to: { row: cell.row, col: cell.col },
            toPixel,
            start: performance.now(),
            duration: 180,
          };
          ensureAnimation();
        }
      }
      dragStateRef.current = { active: false, block: null, source: null, pointer: { x: 0, y: 0 }, offset: { x: 0, y: 0 }, hoverTopLeftCell: null, pointerType: null };
      ensureAnimation();
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


