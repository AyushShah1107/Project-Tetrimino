import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCw,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  HelpCircle,
  Tv,
  Coins,
  ChevronDown
} from 'lucide-react';
import { audioService } from '../../services/audio';

// Tetromino definitions
export type PieceType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

interface TetrominoDef {
  shape: number[][];
  color: string;
  glowColor: string;
}

const TETROMINOES: Record<PieceType, TetrominoDef> = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    color: '#06b6d4', // Cyan
    glowColor: 'rgba(6, 182, 212, 0.45)'
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#3b82f6', // Cobalt Blue
    glowColor: 'rgba(59, 130, 246, 0.45)'
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#f97316', // Orange
    glowColor: 'rgba(249, 115, 22, 0.45)'
  },
  O: {
    shape: [
      [1, 1],
      [1, 1]
    ],
    color: '#eab308', // Amber Yellow
    glowColor: 'rgba(234, 179, 8, 0.45)'
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0]
    ],
    color: '#10b981', // Emerald Green
    glowColor: 'rgba(16, 185, 129, 0.45)'
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#a855f7', // Purple
    glowColor: 'rgba(168, 85, 247, 0.45)'
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0]
    ],
    color: '#ef4444', // Red
    glowColor: 'rgba(239, 68, 68, 0.45)'
  }
};

const COLS = 10;
const ROWS = 20;

// Particle effect on line clear
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
}

interface TetrisGameProps {
  onTriggerChallenge: () => void;
  onOpenBriefing: () => void;
}

export const TetrisGame: React.FC<TetrisGameProps> = ({ onTriggerChallenge, onOpenBriefing }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const nextCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const holdCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Layout & Display States
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [cabinetMode, setCabinetMode] = useState<boolean>(true); // Cabinet vs Clean
  const [scanlinesEnabled, setScanlinesEnabled] = useState<boolean>(true);
  const [blockSize, setBlockSize] = useState<number>(28);

  // Game Engine States
  const [grid, setGrid] = useState<string[][]>(() =>
    Array.from({ length: ROWS }, () => Array(COLS).fill(''))
  );
  const [currentPiece, setCurrentPiece] = useState<{
    type: PieceType;
    shape: number[][];
    x: number;
    y: number;
    color: string;
  } | null>(null);

  // 7-Bag Randomizer System
  const bagRef = useRef<PieceType[]>([]);
  const getNextFromBag = useCallback((): PieceType => {
    if (bagRef.current.length === 0) {
      const pieces: PieceType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
      // Fisher-Yates shuffle
      for (let i = pieces.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
      }
      bagRef.current = pieces;
    }
    return bagRef.current.pop()!;
  }, []);

  const [nextPieceType, setNextPieceType] = useState<PieceType>(() => {
    const pieces: PieceType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
    return pieces[Math.floor(Math.random() * pieces.length)];
  });
  const [holdPieceType, setHoldPieceType] = useState<PieceType | null>(null);
  const [canHold, setCanHold] = useState<boolean>(true);

  // Stats & Progress
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    const saved = localStorage.getItem('tetrimino_arcade_high_score');
    return saved ? parseInt(saved, 10) : 52400;
  });
  const [linesCleared, setLinesCleared] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [credits, setCredits] = useState<number>(4);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [soundOn, setSoundOn] = useState<boolean>(true);
  const [lastActionText, setLastActionText] = useState<{ text: string; time: number } | null>(null);

  // Particles ref for line clear fireworks
  const particlesRef = useRef<Particle[]>([]);

  // Calculate dynamic block size based on window/fullscreen height
  const updateBlockSize = useCallback(() => {
    const vh = window.innerHeight;
    const vw = window.innerWidth;

    if (document.fullscreenElement) {
      // In fullscreen, expand block size to fill height without scrolling
      const targetSize = Math.min(36, Math.floor((vh - 180) / ROWS));
      setBlockSize(Math.max(24, targetSize));
    } else {
      // In windowed mode
      if (vh > 900 && vw > 1024) {
        setBlockSize(28);
      } else if (vh > 750) {
        setBlockSize(26);
      } else {
        setBlockSize(22);
      }
    }
  }, []);

  useEffect(() => {
    updateBlockSize();
    window.addEventListener('resize', updateBlockSize);
    return () => window.removeEventListener('resize', updateBlockSize);
  }, [updateBlockSize]);

  // Fullscreen event listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = !!document.fullscreenElement;
      setIsFullscreen(active);
      updateBlockSize();
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [updateBlockSize]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {
        document.documentElement.requestFullscreen().catch(() => {});
      });
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Spawn Piece
  const spawnPiece = useCallback((typeToSpawn?: PieceType) => {
    const type = typeToSpawn || nextPieceType;
    const shape = TETROMINOES[type].shape;
    const color = TETROMINOES[type].color;
    const x = Math.floor((COLS - shape[0].length) / 2);
    const y = 0;

    // Check collision at spawn (Game Over check)
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] && grid[y + r]?.[x + c]) {
          setGameOver(true);
          setIsPlaying(false);
          return;
        }
      }
    }

    setCurrentPiece({ type, shape, x, y, color });
    setNextPieceType(getNextFromBag());
    setCanHold(true);
  }, [grid, nextPieceType, getNextFromBag]);

  // Check collision helper
  const checkCollision = useCallback(
    (shape: number[][], offsetX: number, offsetY: number, currentGrid: string[][]): boolean => {
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c]) {
            const newX = offsetX + c;
            const newY = offsetY + r;
            if (newX < 0 || newX >= COLS || newY >= ROWS) {
              return true;
            }
            if (newY >= 0 && currentGrid[newY][newX]) {
              return true;
            }
          }
        }
      }
      return false;
    },
    []
  );

  // Rotate matrix
  const rotateMatrix = (matrix: number[][]): number[][] => {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const result = Array.from({ length: cols }, () => Array(rows).fill(0));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        result[c][rows - 1 - r] = matrix[r][c];
      }
    }
    return result;
  };

  // Move actions
  const moveLeft = useCallback(() => {
    if (!currentPiece || !isPlaying || gameOver) return;
    if (!checkCollision(currentPiece.shape, currentPiece.x - 1, currentPiece.y, grid)) {
      setCurrentPiece(prev => prev ? { ...prev, x: prev.x - 1 } : null);
      audioService.playMove();
    }
  }, [currentPiece, isPlaying, gameOver, grid, checkCollision]);

  const moveRight = useCallback(() => {
    if (!currentPiece || !isPlaying || gameOver) return;
    if (!checkCollision(currentPiece.shape, currentPiece.x + 1, currentPiece.y, grid)) {
      setCurrentPiece(prev => prev ? { ...prev, x: prev.x + 1 } : null);
      audioService.playMove();
    }
  }, [currentPiece, isPlaying, gameOver, grid, checkCollision]);

  const rotatePiece = useCallback(() => {
    if (!currentPiece || !isPlaying || gameOver) return;
    const rotated = rotateMatrix(currentPiece.shape);

    // Wall kick attempts
    let newX = currentPiece.x;
    if (!checkCollision(rotated, newX, currentPiece.y, grid)) {
      setCurrentPiece(prev => prev ? { ...prev, shape: rotated, x: newX } : null);
      audioService.playRotate();
      return;
    }

    // Try offset 1 left
    if (!checkCollision(rotated, newX - 1, currentPiece.y, grid)) {
      setCurrentPiece(prev => prev ? { ...prev, shape: rotated, x: newX - 1 } : null);
      audioService.playRotate();
      return;
    }

    // Try offset 1 right
    if (!checkCollision(rotated, newX + 1, currentPiece.y, grid)) {
      setCurrentPiece(prev => prev ? { ...prev, shape: rotated, x: newX + 1 } : null);
      audioService.playRotate();
      return;
    }

    // Try offset 2 left/right for I-piece
    if (currentPiece.type === 'I') {
      if (!checkCollision(rotated, newX - 2, currentPiece.y, grid)) {
        setCurrentPiece(prev => prev ? { ...prev, shape: rotated, x: newX - 2 } : null);
        audioService.playRotate();
        return;
      }
      if (!checkCollision(rotated, newX + 2, currentPiece.y, grid)) {
        setCurrentPiece(prev => prev ? { ...prev, shape: rotated, x: newX + 2 } : null);
        audioService.playRotate();
        return;
      }
    }
  }, [currentPiece, isPlaying, gameOver, grid, checkCollision]);

  // Lock piece & line clear check
  const lockPiece = useCallback((pieceToLock: NonNullable<typeof currentPiece>) => {
    const newGrid = grid.map(row => [...row]);
    const clearedRowsIndices: number[] = [];

    pieceToLock.shape.forEach((row, r) => {
      row.forEach((val, c) => {
        if (val) {
          const gridY = pieceToLock.y + r;
          const gridX = pieceToLock.x + c;
          if (gridY >= 0 && gridY < ROWS && gridX >= 0 && gridX < COLS) {
            newGrid[gridY][gridX] = pieceToLock.color;
          }
        }
      });
    });

    // Check full rows
    newGrid.forEach((row, idx) => {
      if (row.every(cell => cell !== '')) {
        clearedRowsIndices.push(idx);
      }
    });

    const cleared = clearedRowsIndices.length;

    // Spawn sparks / particles
    if (cleared > 0) {
      clearedRowsIndices.forEach(rowIdx => {
        for (let i = 0; i < 20; i++) {
          particlesRef.current.push({
            x: (Math.random() * COLS) * blockSize,
            y: rowIdx * blockSize + blockSize / 2,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            color: ['#06b6d4', '#3b82f6', '#10b981', '#f59e0b', '#ffffff'][Math.floor(Math.random() * 5)],
            size: Math.random() * 4 + 2,
            alpha: 1,
            life: 30
          });
        }
      });
    }

    const filteredGrid = newGrid.filter(row => !row.every(cell => cell !== ''));
    while (filteredGrid.length < ROWS) {
      filteredGrid.unshift(Array(COLS).fill(''));
    }

    setGrid(filteredGrid);
    audioService.playDrop();

    if (cleared > 0) {
      audioService.playLineClear();
      const actionLabels = ['', 'SINGLE', 'DOUBLE', 'TRIPLE', 'TETRIS!'];
      setLastActionText({
        text: actionLabels[Math.min(cleared, 4)],
        time: Date.now()
      });

      setLinesCleared(prev => {
        const total = prev + cleared;

        // STEGANOGRAPHIC TRIGGER:
        // Section 1 Architecture Specification:
        // "A line-clear hook triggers the password challenge modal disguised as a stage progression lock."
        setTimeout(() => {
          audioService.playTriggerAlert();
          onTriggerChallenge();
        }, 320);

        return total;
      });

      const linePoints = [0, 100, 300, 500, 800];
      const addedPoints = (linePoints[cleared] || cleared * 100) * level;
      setScore(prev => {
        const newScore = prev + addedPoints;
        if (newScore > highScore) {
          setHighScore(newScore);
          localStorage.setItem('tetrimino_arcade_high_score', newScore.toString());
        }
        return newScore;
      });

      setLevel(Math.floor((linesCleared + cleared) / 5) + 1);
    } else {
      setScore(prev => {
        const newScore = prev + 10;
        if (newScore > highScore) {
          setHighScore(newScore);
          localStorage.setItem('tetrimino_arcade_high_score', newScore.toString());
        }
        return newScore;
      });
    }

    // Spawn next piece
    spawnPiece();
  }, [grid, level, linesCleared, highScore, onTriggerChallenge, spawnPiece, blockSize]);

  const dropPiece = useCallback(() => {
    if (!currentPiece || !isPlaying || gameOver) return;
    if (!checkCollision(currentPiece.shape, currentPiece.x, currentPiece.y + 1, grid)) {
      setCurrentPiece(prev => prev ? { ...prev, y: prev.y + 1 } : null);
    } else {
      lockPiece(currentPiece);
    }
  }, [currentPiece, isPlaying, gameOver, grid, checkCollision, lockPiece]);

  const hardDrop = useCallback(() => {
    if (!currentPiece || !isPlaying || gameOver) return;
    let newY = currentPiece.y;
    while (!checkCollision(currentPiece.shape, currentPiece.x, newY + 1, grid)) {
      newY++;
    }
    const droppedPiece = { ...currentPiece, y: newY };
    setCurrentPiece(droppedPiece);
    lockPiece(droppedPiece);
  }, [currentPiece, isPlaying, gameOver, grid, checkCollision, lockPiece]);

  const holdPiece = useCallback(() => {
    if (!currentPiece || !canHold || !isPlaying || gameOver) return;
    const currentType = currentPiece.type;
    if (holdPieceType === null) {
      setHoldPieceType(currentType);
      spawnPiece();
    } else {
      const nextType = holdPieceType;
      setHoldPieceType(currentType);
      spawnPiece(nextType);
    }
    setCanHold(false);
    audioService.playRotate();
  }, [currentPiece, canHold, isPlaying, gameOver, holdPieceType, spawnPiece]);

  // Initial piece spawn
  useEffect(() => {
    if (!currentPiece && !gameOver) {
      spawnPiece();
    }
  }, [currentPiece, gameOver, spawnPiece]);

  // Main game tick loop
  useEffect(() => {
    if (!isPlaying || gameOver) return;
    const speed = Math.max(100, 750 - (level - 1) * 65);
    const interval = setInterval(() => {
      dropPiece();
    }, speed);
    return () => clearInterval(interval);
  }, [isPlaying, gameOver, level, dropPiece]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      switch (e.key) {
        case 'ArrowLeft':
          moveLeft();
          break;
        case 'ArrowRight':
          moveRight();
          break;
        case 'ArrowDown':
          dropPiece();
          break;
        case 'ArrowUp':
        case 'x':
        case 'X':
          rotatePiece();
          break;
        case ' ':
          hardDrop();
          break;
        case 'c':
        case 'C':
        case 'Shift':
          holdPiece();
          break;
        case 'p':
        case 'P':
          setIsPlaying(prev => !prev);
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        // Covert bypass hotkey (backtick ` or tilde ~)
        case '`':
        case '~':
          audioService.playTriggerAlert();
          onTriggerChallenge();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveLeft, moveRight, dropPiece, rotatePiece, hardDrop, holdPiece, onTriggerChallenge]);

  // Main Canvas Rendering with DevicePixelRatio & Particle Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = COLS * blockSize;
    const height = ROWS * blockSize;

    // Clear background
    ctx.fillStyle = '#05070e';
    ctx.fillRect(0, 0, width, height);

    // Subtle grid lines with arcade CRT dots
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * blockSize, 0);
      ctx.lineTo(c * blockSize, height);
      ctx.stroke();
    }
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * blockSize);
      ctx.lineTo(width, r * blockSize);
      ctx.stroke();
    }

    // Draw locked blocks
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (grid[r][c]) {
          drawBlock(ctx, c * blockSize, r * blockSize, grid[r][c], blockSize);
        }
      }
    }

    // Draw ghost piece
    if (currentPiece && isPlaying && !gameOver) {
      let ghostY = currentPiece.y;
      while (!checkCollision(currentPiece.shape, currentPiece.x, ghostY + 1, grid)) {
        ghostY++;
      }
      currentPiece.shape.forEach((row, r) => {
        row.forEach((val, c) => {
          if (val) {
            const gx = (currentPiece.x + c) * blockSize;
            const gy = (ghostY + r) * blockSize;
            // Ghost neon outline
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.fillRect(gx + 2, gy + 2, blockSize - 4, blockSize - 4);
            ctx.strokeStyle = currentPiece.color;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(gx + 2, gy + 2, blockSize - 4, blockSize - 4);
          }
        });
      });
    }

    // Draw active falling piece
    if (currentPiece) {
      currentPiece.shape.forEach((row, r) => {
        row.forEach((val, c) => {
          if (val) {
            const px = (currentPiece.x + c) * blockSize;
            const py = (currentPiece.y + r) * blockSize;
            drawBlock(ctx, px, py, currentPiece.color, blockSize, true);
          }
        });
      });
    }

    // Render & update particles
    particlesRef.current = particlesRef.current.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.035;
      p.life -= 1;

      if (p.life > 0 && p.alpha > 0) {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        return true;
      }
      return false;
    });

    // Render Floating Action text (e.g. TETRIS!, DOUBLE)
    if (lastActionText && Date.now() - lastActionText.time < 1200) {
      const elapsed = Date.now() - lastActionText.time;
      const progress = elapsed / 1200;
      ctx.save();
      ctx.font = 'bold 22px "Courier New", monospace';
      ctx.fillStyle = `rgba(6, 182, 212, ${1 - progress})`;
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 10;
      ctx.textAlign = 'center';
      ctx.fillText(lastActionText.text, width / 2, height / 2 - progress * 40);
      ctx.restore();
    }
  }, [grid, currentPiece, isPlaying, gameOver, checkCollision, blockSize, lastActionText]);

  // Next Piece Canvas
  useEffect(() => {
    const canvas = nextCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#060911';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const piece = TETROMINOES[nextPieceType];
    const shape = piece.shape;
    const size = 18;
    const offsetX = (canvas.width - shape[0].length * size) / 2;
    const offsetY = (canvas.height - shape.length * size) / 2;

    shape.forEach((row, r) => {
      row.forEach((val, c) => {
        if (val) {
          drawBlock(ctx, offsetX + c * size, offsetY + r * size, piece.color, size);
        }
      });
    });
  }, [nextPieceType]);

  // Hold Piece Canvas
  useEffect(() => {
    const canvas = holdCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#060911';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (holdPieceType) {
      const piece = TETROMINOES[holdPieceType];
      const shape = piece.shape;
      const size = 18;
      const offsetX = (canvas.width - shape[0].length * size) / 2;
      const offsetY = (canvas.height - shape.length * size) / 2;

      shape.forEach((row, r) => {
        row.forEach((val, c) => {
          if (val) {
            drawBlock(ctx, offsetX + c * size, offsetY + r * size, piece.color, size);
          }
        });
      });
    }
  }, [holdPieceType]);

  // Draw Block Helper with Bevel and Highlights
  const drawBlock = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    size: number,
    isCurrent = false
  ) => {
    ctx.fillStyle = color;
    ctx.fillRect(x + 1, y + 1, size - 2, size - 2);

    // Bevel highlights
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(x + 1, y + 1, size - 2, 2);
    ctx.fillRect(x + 1, y + 1, 2, size - 2);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(x + 1, y + size - 3, size - 2, 2);
    ctx.fillRect(x + size - 3, y + 1, 2, size - 2);

    if (isCurrent) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(x + 4, y + 4, size - 8, size - 8);
    }
  };

  const restartGame = () => {
    setGrid(Array.from({ length: ROWS }, () => Array(COLS).fill('')));
    setScore(0);
    setLinesCleared(0);
    setLevel(1);
    setGameOver(false);
    setIsPlaying(true);
    setHoldPieceType(null);
    bagRef.current = [];
    spawnPiece();
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    audioService.setSoundEnabled(next);
    if (!next) {
      audioService.stopAllAudio();
    }
  };

  const insertCoin = () => {
    setCredits(prev => prev + 1);
    audioService.playLineClear();
  };

  return (
    <div
      ref={containerRef}
      className={`w-full min-h-screen bg-[#02050b] text-slate-100 flex flex-col justify-between relative select-none ${
        isFullscreen ? 'p-2 md:p-4' : 'p-3 md:p-6'
      }`}
    >
      {/* Top Arcade Navigation & Status Bar */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between py-2 px-3 bg-slate-900/80 border border-slate-800 rounded-xl backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-sm font-black tracking-widest font-mono text-cyan-400">
              TETRIMINO DX '89
            </span>
          </div>
          <span className="hidden sm:inline text-xs text-slate-500 font-mono">|</span>
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-amber-400">
            <Coins className="w-3.5 h-3.5" />
            <span>CREDITS: {credits.toString().padStart(2, '0')}</span>
          </div>
        </div>

        {/* Arcade Utility Toolbar */}
        <div className="flex items-center gap-2">
          {/* Insert Coin (Discreet trigger test & retro flair) */}
          <button
            onClick={insertCoin}
            className="px-2.5 py-1 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-800/60 rounded-lg text-xs font-mono text-amber-300 flex items-center gap-1 transition-colors"
            title="Insert Coin (+1 Credit)"
          >
            <Coins className="w-3.5 h-3.5" />
            <span className="hidden md:inline">25¢ Coin</span>
          </button>

          {/* Cabinet vs Clean Mode Toggle */}
          <button
            onClick={() => setCabinetMode(prev => !prev)}
            className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg text-xs font-mono text-slate-300 transition-colors hidden md:flex items-center gap-1"
            title="Toggle Cabinet Frame vs Clean View"
          >
            <Tv className="w-3.5 h-3.5 text-slate-400" />
            <span>{cabinetMode ? 'Bezel: On' : 'Clean'}</span>
          </button>

          {/* CRT Scanlines Toggle */}
          <button
            onClick={() => setScanlinesEnabled(prev => !prev)}
            className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg text-xs font-mono text-slate-300 transition-colors"
            title="Toggle CRT Scanline Simulation"
          >
            <span className="text-[11px]">{scanlinesEnabled ? 'CRT: ON' : 'CRT: OFF'}</span>
          </button>

          {/* Audio Mute Button */}
          <button
            onClick={toggleSound}
            className="p-1.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg text-slate-300 transition-colors"
            title={soundOn ? 'Mute 8-bit Audio' : 'Unmute Audio'}
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg text-slate-300 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Immersive Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-cyan-400" /> : <Maximize2 className="w-4 h-4 text-slate-300" />}
          </button>

          {/* System Specs & Help */}
          <button
            onClick={onOpenBriefing}
            className="p-1.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg text-slate-400 hover:text-cyan-300 transition-colors"
            title="System Specifications & Secret Operator Guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Arcade Cabinet Centerpiece */}
      <div className="flex-1 flex flex-col items-center justify-center py-2 md:py-4">
        <div
          className={`transition-all duration-300 flex flex-col items-center justify-center ${
            cabinetMode
              ? 'p-3 md:p-6 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.9)] max-w-4xl w-full'
              : 'w-full max-w-3xl'
          }`}
        >
          {/* Cabinet Illuminated Marquee (Shown in Cabinet Mode) */}
          {cabinetMode && (
            <div className="w-full max-w-xl mb-4 rounded-xl overflow-hidden border border-slate-800 relative shadow-lg bg-slate-950">
              <div className="h-16 md:h-20 w-full relative overflow-hidden">
                <img
                  src="/src/assets/images/tetris_arcade_marquee_1790515758408.jpg"
                  alt="Arcade Marquee"
                  className="w-full h-full object-cover opacity-75"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-transparent to-slate-950" />
                <div className="absolute inset-0 flex items-center justify-between px-6">
                  <div>
                    <h2 className="text-lg md:text-xl font-black italic tracking-wider text-white drop-shadow-[0_2px_8px_rgba(6,182,212,0.8)]">
                      TETRIMINO ARCADE
                    </h2>
                    <span className="text-[10px] tracking-widest text-cyan-300 font-mono">
                      LICENSED BY SOVIET ELECTRONICA 1989
                    </span>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-[10px] text-slate-400 uppercase block">HIGH SCORE</span>
                    <span className="text-sm md:text-base font-bold text-amber-400 tabular-nums">
                      {highScore.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Game Playing Surface: Hold + Main Matrix + Next & Stats */}
          <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-4 md:gap-8">
            {/* Left Wing: HOLD PIECE */}
            <div className="flex flex-row md:flex-col gap-3 order-2 md:order-1 items-center">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-xl flex flex-col items-center min-w-[100px]">
                <span className="text-xs font-bold font-mono text-cyan-400 uppercase tracking-widest mb-2">
                  HOLD
                </span>
                <canvas
                  ref={holdCanvasRef}
                  width={90}
                  height={70}
                  className="rounded-lg bg-slate-950 border border-slate-800/80"
                />
                <span className="text-[10px] text-slate-500 mt-2 font-mono">[C / SHIFT]</span>
              </div>

              {/* Discreet Steganographic Trigger / Passkey Bypass */}
              <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-3 shadow-xl flex flex-col items-center min-w-[100px] text-center">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-1">
                  STAGE
                </span>
                <span className="text-xs font-bold font-mono text-emerald-400">
                  ROUND {level.toString().padStart(2, '0')}
                </span>
                {/* Discreet Operator Trigger */}
                <button
                  onClick={() => {
                    audioService.playTriggerAlert();
                    onTriggerChallenge();
                  }}
                  className="mt-2 py-1 px-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-800/60 rounded-md text-[10px] font-mono text-slate-400 hover:text-cyan-300 transition-colors"
                  title="Operator Unlock Shortcut (or press `)"
                >
                  Calibration
                </button>
              </div>
            </div>

            {/* Center: The Tetris Matrix CRT Board */}
            <div className="relative order-1 md:order-2 bg-slate-950 p-2 md:p-3 rounded-2xl border-2 border-slate-800 shadow-[0_0_40px_rgba(0,0,0,0.8)]">
              <canvas
                ref={canvasRef}
                width={COLS * blockSize}
                height={ROWS * blockSize}
                className="rounded-xl bg-[#05070e] shadow-inner block"
              />

              {/* CRT Scanline Overlay */}
              {scanlinesEnabled && (
                <div className="absolute inset-2 md:inset-3 rounded-xl arcade-scanlines pointer-events-none" />
              )}

              {/* Pause Screen Overlay */}
              {!isPlaying && !gameOver && (
                <div className="absolute inset-2 md:inset-3 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center rounded-xl z-10">
                  <span className="text-xl font-black font-mono tracking-widest text-cyan-400 mb-3 animate-pulse">
                    PAUSED
                  </span>
                  <button
                    onClick={() => setIsPlaying(true)}
                    className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-cyan-900/50"
                  >
                    Resume Play
                  </button>
                </div>
              )}

              {/* Game Over Screen */}
              {gameOver && (
                <div className="absolute inset-2 md:inset-3 bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center rounded-xl p-6 text-center z-10">
                  <span className="text-2xl font-black font-mono tracking-widest text-red-500 mb-2">
                    GAME OVER
                  </span>
                  <div className="space-y-1 mb-4 font-mono text-xs text-slate-400">
                    <p>Final Score: <span className="text-cyan-400 font-bold">{score.toLocaleString()}</span></p>
                    <p>Lines Cleared: <span className="text-white font-bold">{linesCleared}</span></p>
                  </div>
                  <button
                    onClick={restartGame}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-emerald-900/50"
                  >
                    Insert Coin & Play
                  </button>
                </div>
              )}
            </div>

            {/* Right Wing: NEXT PIECE & STATS */}
            <div className="flex flex-row md:flex-col gap-3 order-3 items-center">
              {/* Next Box */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-xl flex flex-col items-center min-w-[100px]">
                <span className="text-xs font-bold font-mono text-cyan-400 uppercase tracking-widest mb-2">
                  NEXT
                </span>
                <canvas
                  ref={nextCanvasRef}
                  width={90}
                  height={70}
                  className="rounded-lg bg-slate-950 border border-slate-800/80"
                />
              </div>

              {/* Live Arcade HUD Stats */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-xl flex flex-col gap-2 min-w-[100px] font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">SCORE</span>
                  <span className="text-sm font-bold text-cyan-400 tabular-nums">
                    {score.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">LINES</span>
                  <span className="text-sm font-bold text-white tabular-nums">
                    {linesCleared}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">LEVEL</span>
                  <span className="text-sm font-bold text-emerald-400 tabular-nums">
                    {level}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Arcade Cabinet Coin Door & Speaker Grille (Shown in Cabinet Mode) */}
          {cabinetMode && (
            <div className="mt-4 pt-4 border-t border-slate-800/80 w-full flex items-center justify-between px-4 text-xs font-mono text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>CABINET #08492</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="hidden sm:inline">STEREO SOUND SYSTEM</span>
                <span className="text-amber-400/90">PRESS 1P START</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Responsive On-Screen Arcade Controls Bar (Touch / Mouse Friendly) */}
      <div className="w-full max-w-xl mx-auto pb-2 flex flex-col items-center gap-2">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <button
            onClick={moveLeft}
            className="p-3 bg-slate-800/90 hover:bg-slate-700 active:bg-cyan-600 rounded-xl text-slate-200 border border-slate-700 transition-colors shadow-md"
            title="Move Left (←)"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            onClick={rotatePiece}
            className="p-3 bg-slate-800/90 hover:bg-slate-700 active:bg-cyan-600 rounded-xl text-slate-200 border border-slate-700 transition-colors shadow-md"
            title="Rotate (↑ / X)"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={dropPiece}
            className="p-3 bg-slate-800/90 hover:bg-slate-700 active:bg-cyan-600 rounded-xl text-slate-200 border border-slate-700 transition-colors shadow-md"
            title="Soft Drop (↓)"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
          <button
            onClick={moveRight}
            className="p-3 bg-slate-800/90 hover:bg-slate-700 active:bg-cyan-600 rounded-xl text-slate-200 border border-slate-700 transition-colors shadow-md"
            title="Move Right (→)"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={hardDrop}
            className="px-4 py-3 bg-cyan-950/70 hover:bg-cyan-900/80 active:bg-cyan-600 border border-cyan-800/60 rounded-xl text-cyan-300 text-xs font-bold uppercase tracking-wider transition-colors shadow-md"
            title="Instant Hard Drop (Space)"
          >
            DROP
          </button>
          <button
            onClick={holdPiece}
            className="px-4 py-3 bg-slate-800/90 hover:bg-slate-700 active:bg-slate-600 border border-slate-700 rounded-xl text-slate-300 text-xs font-bold uppercase tracking-wider transition-colors shadow-md"
            title="Hold Piece (C / Shift)"
          >
            HOLD
          </button>
          <button
            onClick={() => setIsPlaying(prev => !prev)}
            className="p-3 bg-slate-800/90 hover:bg-slate-700 active:bg-slate-600 border border-slate-700 rounded-xl text-slate-300 transition-colors shadow-md"
            title="Pause / Resume (P)"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>

        {/* Discreet footer notice */}
        <div className="text-[11px] font-mono text-slate-500 flex items-center justify-center gap-3">
          <span>Controls: [←][→] Move · [↑] Rotate · [SPACE] Drop · [C] Hold · [F] Fullscreen</span>
        </div>
      </div>
    </div>
  );
};
