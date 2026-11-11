import React, { useState, useEffect, useRef } from 'react';
import { Gamepad2, Trophy, RotateCcw, Copy, Check, Volume2, VolumeX, Sparkles, Award, ShieldAlert, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Play } from 'lucide-react';
import confetti from 'canvas-confetti';
import contentData from '../data/contentData.json';

interface GamesSectionProps {
  onBackToHome: () => void;
}

export const GamesSection: React.FC<GamesSectionProps> = ({ onBackToHome }) => {
  const [selectedGame, setSelectedGame] = useState<'flappy' | 'snake'>('flappy');

  return (
    <div className="space-y-6">
      {/* Game Selector Tabs */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-[#ED1C24]">
            Cấu phần 6 • Mini Games Giải Trí Tại Quầy
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">
            Thử Thách Săn Voucher Xăng Cùng VietinBank
          </h2>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setSelectedGame('flappy')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              selectedGame === 'flappy'
                ? 'bg-[#003B70] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Game 1: Flappy Bird (Mascot Bay)
          </button>
          <button
            onClick={() => setSelectedGame('snake')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              selectedGame === 'snake'
                ? 'bg-[#003B70] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Game 2: Rắn Săn Mồi (Snake Challenge)
          </button>
        </div>
      </div>

      {/* Render Active Game */}
      {selectedGame === 'flappy' ? (
        <FlappyBirdGame onBackToHome={onBackToHome} />
      ) : (
        <SnakeGame onBackToHome={onBackToHome} />
      )}
    </div>
  );
};

/* ==========================================================
 * GAME 1: FLAPPY BIRD ("Chờ vui – Chơi hay – Nhận quà liền tay")
 * ========================================================== */
const FlappyBirdGame: React.FC<{ onBackToHome: () => void }> = ({ onBackToHome }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Game config variables required by prompt:
  const WIN_SCORE = 20;
  const GRAVITY = 0.28;
  const JUMP_FORCE = -5.8;
  const PIPE_SPEED = 2.1;
  const PIPE_GAP = 160; // wide enough for casual bank customers!
  const VOUCHER_TEXT = 'Voucher 2 lít xăng';
  const BRAND_NAME = 'VietinBank';
  const GAME_TITLE = 'Chờ vui – Chơi hay – Nhận quà liền tay';

  const [gameState, setGameState] = useState<'start' | 'playing' | 'won' | 'lost'>('start');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    return parseInt(localStorage.getItem('vtb_flappy_highScore') || '0', 10);
  });
  const [latestVoucher, setLatestVoucher] = useState<string | null>(() => {
    return localStorage.getItem('vtb_flappy_lastVoucher');
  });
  const [copied, setCopied] = useState<boolean>(false);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);

  // Game loop refs
  const animationFrameId = useRef<number | null>(null);
  const birdRef = useRef<{ x: number; y: number; vy: number; radius: number; angle: number }>({
    x: 80,
    y: 180,
    vy: 0,
    radius: 16,
    angle: 0,
  });
  const pipesRef = useRef<Array<{ x: number; top: number; bottom: number; passed: boolean }>>([]);
  const frameCountRef = useRef<number>(0);
  const wonRef = useRef<boolean>(false);
  const scoreRef = useRef<number>(0);

  // Web Audio Synth for gentle retro sounds
  const playBeep = (freq: number, type: OscillatorType = 'sine', duration: number = 0.1) => {
    if (!audioEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // AudioContext may be restricted
    }
  };

  const generateVoucherCode = (): string => {
    const num = Math.floor(100000 + Math.random() * 900000);
    return `VB-${num}`;
  };

  const copyVoucherCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#003B70', '#ED1C24', '#FBBF24', '#ffffff'],
      });
    } catch {
      // Ignore if confetti fails
    }
  };

  const winGame = () => {
    wonRef.current = true;
    setGameState('won');
    playBeep(650, 'triangle', 0.3);
    triggerConfetti();

    const voucherCode = generateVoucherCode();
    setLatestVoucher(voucherCode);
    localStorage.setItem('vtb_flappy_lastVoucher', voucherCode);

    if (scoreRef.current > highScore) {
      setHighScore(scoreRef.current);
      localStorage.setItem('vtb_flappy_highScore', scoreRef.current.toString());
    }

    if (typeof (window as any).onFlappyVoucherWin === 'function') {
      (window as any).onFlappyVoucherWin({
        score: WIN_SCORE,
        voucherCode,
        reward: VOUCHER_TEXT,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const endGame = () => {
    setGameState('lost');
    playBeep(180, 'sawtooth', 0.25);

    if (scoreRef.current > highScore) {
      setHighScore(scoreRef.current);
      localStorage.setItem('vtb_flappy_highScore', scoreRef.current.toString());
    }

    if (typeof (window as any).onFlappyVoucherLose === 'function') {
      (window as any).onFlappyVoucherLose({
        score: scoreRef.current,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const resetGame = () => {
    birdRef.current = { x: 90, y: 180, vy: 0, radius: 16, angle: 0 };
    pipesRef.current = [];
    frameCountRef.current = 0;
    scoreRef.current = 0;
    wonRef.current = false;
    setScore(0);
    setGameState('playing');
  };

  const jump = () => {
    if (gameState === 'start' || gameState === 'lost' || gameState === 'won') {
      resetGame();
      return;
    }
    if (gameState === 'playing') {
      birdRef.current.vy = JUMP_FORCE;
      playBeep(420, 'sine', 0.08);
    }
  };

  // Main canvas game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      const width = canvas.width;
      const height = canvas.height;

      // 1. Draw Sky Background
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#e0f2fe');
      skyGrad.addColorStop(0.7, '#f0f9ff');
      skyGrad.addColorStop(1, '#ffffff');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Distant clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.beginPath();
      ctx.arc(80, 70, 30, 0, Math.PI * 2);
      ctx.arc(115, 60, 38, 0, Math.PI * 2);
      ctx.arc(150, 70, 30, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(360, 90, 24, 0, Math.PI * 2);
      ctx.arc(390, 80, 32, 0, Math.PI * 2);
      ctx.arc(420, 90, 24, 0, Math.PI * 2);
      ctx.fill();

      // Ground grass strip
      const groundY = height - 32;
      ctx.fillStyle = '#003B70';
      ctx.fillRect(0, groundY, width, 6);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, groundY + 6, width, 26);

      // 2. Physics & Logic when playing
      if (gameState === 'playing' && !wonRef.current) {
        frameCountRef.current++;

        // Bird update
        birdRef.current.vy += GRAVITY;
        birdRef.current.y += birdRef.current.vy;
        birdRef.current.angle = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, birdRef.current.vy * 0.08));

        // Spawn Pipes
        if (frameCountRef.current % 95 === 0) {
          const minPipe = 50;
          const maxPipe = groundY - PIPE_GAP - minPipe;
          const topH = Math.floor(minPipe + Math.random() * (maxPipe - minPipe));
          pipesRef.current.push({
            x: width,
            top: topH,
            bottom: groundY - (topH + PIPE_GAP),
            passed: false,
          });
        }

        // Pipe update & collision
        for (let i = pipesRef.current.length - 1; i >= 0; i--) {
          const p = pipesRef.current[i];
          p.x -= PIPE_SPEED;

          // Check if bird passed pipe
          if (!p.passed && p.x + 52 < birdRef.current.x) {
            p.passed = true;
            scoreRef.current += 1;
            setScore(scoreRef.current);
            playBeep(520, 'sine', 0.1);

            if (scoreRef.current >= WIN_SCORE) {
              winGame();
              break;
            }
          }

          // Collision detection with pipe
          const bird = birdRef.current;
          const pipeWidth = 52;
          if (
            bird.x + bird.radius > p.x &&
            bird.x - bird.radius < p.x + pipeWidth
          ) {
            if (
              bird.y - bird.radius < p.top ||
              bird.y + bird.radius > groundY - p.bottom
            ) {
              endGame();
              break;
            }
          }

          // Remove offscreen pipes
          if (p.x < -60) {
            pipesRef.current.splice(i, 1);
          }
        }

        // Collision with ceiling or ground
        if (birdRef.current.y + birdRef.current.radius >= groundY || birdRef.current.y - birdRef.current.radius <= 0) {
          endGame();
        }
      }

      // 3. Draw Pipes (VietinBank styled columns)
      pipesRef.current.forEach((p) => {
        const pipeWidth = 52;
        // Top pipe
        const gradTop = ctx.createLinearGradient(p.x, 0, p.x + pipeWidth, 0);
        gradTop.addColorStop(0, '#003B70');
        gradTop.addColorStop(0.5, '#005ba3');
        gradTop.addColorStop(1, '#00264d');
        ctx.fillStyle = gradTop;
        ctx.fillRect(p.x, 0, pipeWidth, p.top);
        // Top pipe collar
        ctx.fillStyle = '#ED1C24';
        ctx.fillRect(p.x - 3, p.top - 16, pipeWidth + 6, 16);

        // Bottom pipe
        const bottomY = groundY - p.bottom;
        const gradBot = ctx.createLinearGradient(p.x, 0, p.x + pipeWidth, 0);
        gradBot.addColorStop(0, '#003B70');
        gradBot.addColorStop(0.5, '#005ba3');
        gradBot.addColorStop(1, '#00264d');
        ctx.fillStyle = gradBot;
        ctx.fillRect(p.x, bottomY, pipeWidth, p.bottom);
        // Bottom pipe collar
        ctx.fillStyle = '#ED1C24';
        ctx.fillRect(p.x - 3, bottomY, pipeWidth + 6, 16);
      });

      // 4. Draw Mascot (Flying VietinBank Chip Card / Bird)
      const b = birdRef.current;
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.angle);

      // Card body with rounded rect
      const cardW = 38;
      const cardH = 26;
      ctx.fillStyle = '#003B70';
      ctx.beginPath();
      ctx.roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 4);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Card gold chip
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(-cardW / 2 + 5, -4, 9, 8);

      // Card red VietinBank accent curve
      ctx.fillStyle = '#ED1C24';
      ctx.beginPath();
      ctx.arc(cardW / 2 - 8, 0, 6, 0, Math.PI * 2);
      ctx.fill();

      // Little wing
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(-2, 4 + Math.sin(frameCountRef.current * 0.3) * 3, 8, 4, 0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Loop
      if (gameState === 'playing' && !wonRef.current) {
        animationFrameId.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      isRunning = false;
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [gameState]);

  // Handle keyboard jump
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Encouraging messages based on score
  const getEncouragement = (s: number) => {
    if (s < 5) return 'Khởi động nhẹ nhàng!';
    if (s < 10) return 'Tốt lắm, tiếp tục nào!';
    if (s < 15) return 'Một nửa chặng đường rồi!';
    if (s < 20) return 'Sắp nhận quà rồi!';
    return 'Xuất sắc!';
  };

  return (
    <div
      id="flappy-voucher-game"
      ref={containerRef}
      className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 select-none"
      style={{ touchAction: 'manipulation' }}
    >
      {/* Header Info Bar */}
      <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{GAME_TITLE}</h3>
          <p className="text-xs text-slate-500">
            Vượt qua 20 chướng ngại vật để nhận voucher xăng 2 lít
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            title={audioEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-semibold">KỶ LỤC CỦA BẠN</span>
            <span className="text-xs font-bold text-[#003B70]">{highScore} điểm</span>
          </div>
        </div>
      </div>

      {/* Score and Progress Banner */}
      <div className="bg-slate-50 rounded-xl p-3 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 border border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-[#003B70] text-white rounded-lg text-sm font-extrabold tracking-tight">
            Điểm: {score}/{WIN_SCORE}
          </div>
          <span className="text-xs font-semibold text-slate-600">
            {getEncouragement(score)}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full sm:w-48 bg-slate-200 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-600 to-emerald-500 h-full transition-all duration-150"
            style={{ width: `${Math.min(100, (score / WIN_SCORE) * 100)}%` }}
          />
        </div>
      </div>

      {/* Canvas Game Area */}
      <div className="relative mx-auto max-w-2xl rounded-2xl overflow-hidden border-2 border-slate-300 shadow-inner bg-sky-50">
        <canvas
          ref={canvasRef}
          width={560}
          height={380}
          onClick={jump}
          className="w-full h-auto cursor-pointer block touch-none"
        />

        {/* Start Overlay */}
        {gameState === 'start' && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#003B70] to-[#ED1C24] flex items-center justify-center mb-3 shadow-lg">
              <Gamepad2 className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-xl sm:text-2xl font-extrabold mb-1">{GAME_TITLE}</h4>
            <p className="text-xs sm:text-sm text-blue-100 max-w-md mb-4">
              Vượt qua 20 thử thách để nhận voucher 2 lít xăng tại quầy VietinBank.
            </p>
            <button
              onClick={resetGame}
              className="px-6 py-3 bg-[#ED1C24] hover:bg-red-700 active:scale-95 text-white font-extrabold text-sm rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>Bắt đầu chơi</span>
            </button>
            <span className="text-xs text-white/80 mt-3 font-medium">
              Chạm màn hình hoặc nhấn phím Space để bay
            </span>
          </div>
        )}

        {/* Lose Overlay */}
        {gameState === 'lost' && (
          <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white animate-in fade-in">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center mb-2">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h4 className="text-lg sm:text-xl font-bold mb-1">
              Rất tiếc, bạn đã vượt qua {score}/{WIN_SCORE} thử thách
            </h4>
            <p className="text-xs sm:text-sm text-slate-300 mb-5">
              Chỉ còn một chút nữa thôi, hãy thử lại nhé!
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={resetGame}
                className="px-5 py-2.5 bg-[#ED1C24] hover:bg-red-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Chơi lại</span>
              </button>
              <button
                onClick={onBackToHome}
                className="px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all cursor-pointer"
              >
                Về màn hình chính
              </button>
            </div>
          </div>
        )}

        {/* Win Overlay */}
        {gameState === 'won' && (
          <div className="absolute inset-0 bg-gradient-to-b from-[#003B70]/90 to-slate-900/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center mb-2 shadow-lg animate-bounce">
              <Trophy className="w-8 h-8" />
            </div>
            <h4 className="text-2xl font-black text-amber-300 mb-1">Chúc mừng!</h4>
            <p className="text-xs sm:text-sm text-blue-100 max-w-sm mb-3">
              Bạn đã vượt qua 20 thử thách và đủ điều kiện nhận {VOUCHER_TEXT}.
            </p>

            {/* Generated Voucher Code Card */}
            <div className="bg-white text-slate-900 p-4 rounded-xl shadow-xl max-w-xs w-full mb-4 border-2 border-amber-300">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                MÃ QUÀ TẶNG CỦA BẠN
              </div>
              <div className="text-2xl font-extrabold text-[#ED1C24] tracking-widest font-mono py-1">
                {latestVoucher}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Vui lòng chụp màn hình hoặc đưa mã này cho nhân viên để nhận quà.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => latestVoucher && copyVoucherCode(latestVoucher)}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Đã sao chép mã!' : 'Sao chép mã'}</span>
              </button>
              <button
                onClick={resetGame}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Chơi lại</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tap control on mobile hint */}
      <div className="text-center mt-3 text-xs text-slate-400 font-medium">
        Mẹo: Nhấn chuột hoặc chạm vào màn hình game để nhân vật bay lên.
      </div>

      {/* Latest Saved Voucher if available */}
      {latestVoucher && (
        <div className="mt-4 p-3.5 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-600" />
            <span className="font-semibold text-amber-900">Mã voucher gần nhất của bạn:</span>
            <span className="font-mono font-bold text-[#ED1C24] bg-white px-2 py-0.5 rounded border border-amber-200">
              {latestVoucher}
            </span>
          </div>
          <button
            onClick={() => copyVoucherCode(latestVoucher)}
            className="text-amber-800 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
          </button>
        </div>
      )}
    </div>
  );
};

/* ==========================================================
 * GAME 2: RẮN SĂN MỒI ("VietinBank Snake Challenge")
 * ========================================================== */
const SnakeGame: React.FC<{ onBackToHome: () => void }> = ({ onBackToHome }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const GRID_SIZE = 16;
  const CELL_COUNT = 24; // 24x24 = 384px

  const [gameState, setGameState] = useState<'idle' | 'running' | 'ended'>('idle');
  const [score, setScore] = useState<number>(0);
  const [voucherReward, setVoucherReward] = useState<string | null>(null);
  const [finishTime, setFinishTime] = useState<string>('');
  const [direction, setDirection] = useState<'UP' | 'DOWN' | 'LEFT' | 'RIGHT'>('RIGHT');

  const snakeRef = useRef<Array<{ x: number; y: number }>>([
    { x: 8, y: 12 },
    { x: 7, y: 12 },
    { x: 6, y: 12 },
  ]);
  const foodRef = useRef<{ x: number; y: number }>({ x: 16, y: 12 });
  const dirRef = useRef<'UP' | 'DOWN' | 'LEFT' | 'RIGHT'>('RIGHT');
  const scoreRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);

  const spawnFood = () => {
    let newX = Math.floor(Math.random() * CELL_COUNT);
    let newY = Math.floor(Math.random() * CELL_COUNT);
    foodRef.current = { x: newX, y: newY };
  };

  const startGame = () => {
    snakeRef.current = [
      { x: 8, y: 12 },
      { x: 7, y: 12 },
      { x: 6, y: 12 },
    ];
    dirRef.current = 'RIGHT';
    setDirection('RIGHT');
    scoreRef.current = 0;
    setScore(0);
    setVoucherReward(null);
    setFinishTime('');
    spawnFood();
    setGameState('running');
  };

  const gameOver = () => {
    setGameState('ended');
    const finalScore = scoreRef.current;
    const now = new Date();
    setFinishTime(now.toLocaleTimeString('vi-VN') + ' - ' + now.toLocaleDateString('vi-VN'));

    if (finalScore >= 40) {
      setVoucherReward('02 voucher xăng (mỗi voucher trị giá 2 lít)');
    } else if (finalScore >= 20) {
      setVoucherReward('01 voucher xăng trị giá 2 lít');
    } else {
      setVoucherReward(null);
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (gameState !== 'running') return;
      if (e.key === 'ArrowUp' && dirRef.current !== 'DOWN') {
        dirRef.current = 'UP';
        setDirection('UP');
      } else if (e.key === 'ArrowDown' && dirRef.current !== 'UP') {
        dirRef.current = 'DOWN';
        setDirection('DOWN');
      } else if (e.key === 'ArrowLeft' && dirRef.current !== 'RIGHT') {
        dirRef.current = 'LEFT';
        setDirection('LEFT');
      } else if (e.key === 'ArrowRight' && dirRef.current !== 'LEFT') {
        dirRef.current = 'RIGHT';
        setDirection('RIGHT');
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameState]);

  // Main game tick
  useEffect(() => {
    if (gameState !== 'running') return;

    const interval = setInterval(() => {
      const snake = [...snakeRef.current];
      const head = { ...snake[0] };

      if (dirRef.current === 'UP') head.y -= 1;
      if (dirRef.current === 'DOWN') head.y += 1;
      if (dirRef.current === 'LEFT') head.x -= 1;
      if (dirRef.current === 'RIGHT') head.x += 1;

      // Check wall collision
      if (head.x < 0 || head.x >= CELL_COUNT || head.y < 0 || head.y >= CELL_COUNT) {
        gameOver();
        return;
      }

      // Check self-collision
      for (let i = 0; i < snake.length; i++) {
        if (snake[i].x === head.x && snake[i].y === head.y) {
          gameOver();
          return;
        }
      }

      snake.unshift(head);

      // Check food eaten
      if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
        scoreRef.current += 1;
        setScore(scoreRef.current);
        spawnFood();
      } else {
        snake.pop();
      }

      snakeRef.current = snake;

      // Draw onto canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Grid lines
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
          for (let x = 0; x < canvas.width; x += GRID_SIZE) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
          }
          for (let y = 0; y < canvas.height; y += GRID_SIZE) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
          }

          // Food (Golden VietinBank Coin)
          const fx = foodRef.current.x * GRID_SIZE + GRID_SIZE / 2;
          const fy = foodRef.current.y * GRID_SIZE + GRID_SIZE / 2;
          ctx.fillStyle = '#F59E0B';
          ctx.beginPath();
          ctx.arc(fx, fy, GRID_SIZE / 2 - 1, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('V', fx, fy);

          // Snake Body
          snake.forEach((segment, idx) => {
            if (idx === 0) {
              // Snake head
              ctx.fillStyle = '#ED1C24'; // VietinBank Red
            } else {
              // Body gradient
              ctx.fillStyle = idx % 2 === 0 ? '#003B70' : '#005ba3'; // VietinBank Blue
            }
            ctx.beginPath();
            ctx.roundRect(
              segment.x * GRID_SIZE + 1,
              segment.y * GRID_SIZE + 1,
              GRID_SIZE - 2,
              GRID_SIZE - 2,
              idx === 0 ? 4 : 2
            );
            ctx.fill();
          });
        }
      }
    }, 115); // Friendly moderate speed for counter customers

    return () => clearInterval(interval);
  }, [gameState]);

  const changeDir = (d: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    if (gameState !== 'running') return;
    if (d === 'UP' && dirRef.current !== 'DOWN') {
      dirRef.current = 'UP';
      setDirection('UP');
    } else if (d === 'DOWN' && dirRef.current !== 'UP') {
      dirRef.current = 'DOWN';
      setDirection('DOWN');
    } else if (d === 'LEFT' && dirRef.current !== 'RIGHT') {
      dirRef.current = 'LEFT';
      setDirection('LEFT');
    } else if (d === 'RIGHT' && dirRef.current !== 'LEFT') {
      dirRef.current = 'RIGHT';
      setDirection('RIGHT');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6">
      {/* Title & Instructions Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-slate-900">VietinBank Snake Challenge</h3>
          <p className="text-xs text-slate-500">Chơi vui tại quầy – Săn voucher xăng hấp dẫn</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-lg bg-blue-50 border border-blue-100 text-xs font-bold text-[#003B70]">
            Mốc 20: 1 Voucher (2L)
          </div>
          <div className="px-3 py-1 rounded-lg bg-red-50 border border-red-100 text-xs font-bold text-[#ED1C24]">
            Mốc 40: 2 Voucher (4L)
          </div>
        </div>
      </div>

      {/* Live Status Header */}
      <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl mb-4 border border-slate-200 text-xs font-semibold">
        <div className="flex items-center gap-2">
          <span>Điểm hiện tại:</span>
          <span className="text-base font-extrabold text-[#003B70]">{score}</span>
        </div>
        <div>
          <span>Mốc thưởng: </span>
          <span className="font-bold text-[#ED1C24]">
            {score >= 40 ? '2 Voucher Xăng (4L)' : score >= 20 ? '1 Voucher Xăng (2L)' : 'Chưa đạt mốc 20'}
          </span>
        </div>
        <div>
          <span>Trạng thái: </span>
          <span className="text-slate-700">
            {gameState === 'running' ? 'Đang chơi' : gameState === 'ended' ? 'Đã kết thúc' : 'Sẵn sàng'}
          </span>
        </div>
      </div>

      {/* Main Game Screen and Canvas */}
      <div className="flex flex-col lg:flex-row items-center justify-center gap-6">
        {/* Canvas Area */}
        <div className="relative rounded-2xl overflow-hidden border-4 border-slate-800 shadow-xl bg-slate-950">
          <canvas
            ref={canvasRef}
            width={384}
            height={384}
            className="block"
          />

          {gameState === 'idle' && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white">
              <h4 className="text-xl font-extrabold mb-2">VietinBank Snake Challenge</h4>
              <p className="text-xs text-slate-300 max-w-xs mb-5">
                Dùng phím mũi tên hoặc bàn phím ảo bên dưới để điều khiển rắn ăn xu vàng VietinBank.
              </p>
              <button
                onClick={startGame}
                className="px-6 py-2.5 bg-[#ED1C24] hover:bg-red-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Bắt đầu chơi</span>
              </button>
            </div>
          )}

          {gameState === 'ended' && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white animate-in zoom-in-95">
              <h4 className="text-xl font-bold mb-1">Kết Thúc Lượt Chơi!</h4>
              <p className="text-xs text-slate-300 mb-3">
                Điểm số đạt được: <strong className="text-white text-base">{score} điểm</strong>
              </p>

              {/* Award Result Box */}
              {voucherReward ? (
                <div className="p-3 bg-white text-slate-900 rounded-xl mb-4 border-2 border-amber-300 max-w-xs w-full shadow-lg">
                  <div className="text-[10px] font-bold uppercase text-slate-400">PHẦN THƯỞNG ĐẠT ĐƯỢC</div>
                  <div className="text-sm font-extrabold text-[#ED1C24] py-1">{voucherReward}</div>
                  <p className="text-[11px] text-slate-500">
                    Vui lòng chụp màn hình hoặc thông báo với giao dịch viên để nhận quà.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-white/10 rounded-xl mb-4 max-w-xs text-xs text-slate-200">
                  Rất tiếc, Quý khách chưa đạt mốc nhận voucher. Hãy thử lại để chinh phục mốc 20 điểm!
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={startGame}
                  className="px-5 py-2.5 bg-[#ED1C24] hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Chơi lại</span>
                </button>
                <button
                  onClick={onBackToHome}
                  className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Về trang chủ
                </button>
              </div>
            </div>
          )}
        </div>

        {/* On-screen D-Pad for Mobile and Touch devices */}
        <div className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-200/90">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Điều hướng cảm ứng
          </span>
          <button
            onClick={() => changeDir('UP')}
            className="w-14 h-12 bg-white active:bg-blue-100 rounded-xl border border-slate-200 shadow-xs flex items-center justify-center font-bold text-slate-700 hover:text-[#003B70]"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => changeDir('LEFT')}
              className="w-14 h-12 bg-white active:bg-blue-100 rounded-xl border border-slate-200 shadow-xs flex items-center justify-center font-bold text-slate-700 hover:text-[#003B70]"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => changeDir('DOWN')}
              className="w-14 h-12 bg-white active:bg-blue-100 rounded-xl border border-slate-200 shadow-xs flex items-center justify-center font-bold text-slate-700 hover:text-[#003B70]"
            >
              <ArrowDown className="w-5 h-5" />
            </button>
            <button
              onClick={() => changeDir('RIGHT')}
              className="w-14 h-12 bg-white active:bg-blue-100 rounded-xl border border-slate-200 shadow-xs flex items-center justify-center font-bold text-slate-700 hover:text-[#003B70]"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Official Voucher Confirmation Slip (Phiếu xác nhận quà tặng) */}
      {gameState === 'ended' && voucherReward && (
        <div className="mt-6 p-6 bg-amber-50/70 border-2 border-dashed border-amber-300 rounded-2xl">
          <div className="max-w-md mx-auto bg-white p-5 rounded-xl border border-amber-200 shadow-sm text-center space-y-2">
            <div className="inline-block px-3 py-1 bg-[#003B70] text-white rounded-md text-[10px] font-extrabold uppercase tracking-wider">
              PHIẾU XÁC NHẬN QUÀ TẶNG TẠI QUẦY
            </div>
            <h4 className="text-lg font-black text-slate-900 pt-1">
              VietinBank Chi nhánh Kiên Giang
            </h4>
            <div className="py-2 border-y border-slate-100 space-y-1 text-xs text-left">
              <div className="flex justify-between">
                <span className="text-slate-500">Điểm số hoàn thành:</span>
                <strong className="text-slate-900 font-bold">{score} điểm</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mức quà tặng:</span>
                <strong className="text-[#ED1C24] font-bold">{voucherReward}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Thời gian ghi nhận:</span>
                <span className="text-slate-700">{finishTime}</span>
              </div>
            </div>
            <p className="text-xs text-amber-900 font-semibold pt-1">
              “Vui lòng chụp màn hình hoặc thông báo với giao dịch viên để nhận quà.”
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
