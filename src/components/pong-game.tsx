"use client";

import { useEffect, useRef, useState } from "react";
import { useWebRTC } from "@/hooks/useWebRTC";

interface GameState {
  ball: {
    x: number;
    y: number;
    dx: number;
    dy: number;
  };
  leftPaddle: {
    y: number;
    dy: number;
  };
  rightPaddle: {
    y: number;
    dy: number;
  };
  score: {
    left: number;
    right: number;
  };
  gameStarted: boolean;
}

// Base dimensions - will be scaled based on viewport
const BASE_CANVAS_WIDTH = 800;
const BASE_CANVAS_HEIGHT = 400;
const PADDLE_WIDTH = 15;
const PADDLE_HEIGHT = 80;
const BALL_SIZE = 10;
const PADDLE_SPEED = 5;
const BALL_SPEED = 4;

interface PongGameProps {
  ballType?: "emoji" | "image";
  ballValue?: string;
  onBackToConfig?: () => void;
  enableMobileControl?: boolean;
  roomId?: string;
}

export default function PongGame({
  ballType = "emoji",
  ballValue = "🎾",
  onBackToConfig,
  enableMobileControl = false,
  roomId = "",
}: PongGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ballImageRef = useRef<HTMLImageElement | null>(null);
  const gameStateRef = useRef<GameState>({
    ball: {
      x: BASE_CANVAS_WIDTH / 2,
      y: BASE_CANVAS_HEIGHT / 2,
      dx: BALL_SPEED,
      dy: BALL_SPEED,
    },
    leftPaddle: {
      y: BASE_CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
      dy: 0,
    },
    rightPaddle: {
      y: BASE_CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
      dy: 0,
    },
    score: {
      left: 0,
      right: 0,
    },
    gameStarted: false,
  });

  const [gameState, setGameState] = useState(gameStateRef.current);
  const [canvasDimensions, setCanvasDimensions] = useState({
    width: BASE_CANVAS_WIDTH,
    height: BASE_CANVAS_HEIGHT,
    scale: 1,
  });
  const [gameRoomId] = useState(
    () => roomId || Math.random().toString(36).substring(2, 15)
  );

  // WebRTC connection for mobile control
  const { isConnected, peers, players } = useWebRTC({
    roomId: gameRoomId,
    isHost: true,
    onPaddleMove: (direction, playerSide) => {
      const state = gameStateRef.current;
      if (playerSide === "left") {
        if (direction === "up") {
          state.leftPaddle.dy = -PADDLE_SPEED;
        } else if (direction === "down") {
          state.leftPaddle.dy = PADDLE_SPEED;
        } else if (direction === "stop") {
          state.leftPaddle.dy = 0;
        }
      } else if (playerSide === "right") {
        if (direction === "up") {
          state.rightPaddle.dy = -PADDLE_SPEED;
        } else if (direction === "down") {
          state.rightPaddle.dy = PADDLE_SPEED;
        } else if (direction === "stop") {
          state.rightPaddle.dy = 0;
        }
      }
    },
  });

  const resetGame = () => {
    const state = gameStateRef.current;
    state.ball.x = canvasDimensions.width / 2;
    state.ball.y = canvasDimensions.height / 2;
    state.ball.dx = (Math.random() > 0.5 ? 1 : -1) * BALL_SPEED;
    state.ball.dy = (Math.random() - 0.5) * BALL_SPEED;
    state.leftPaddle.y = canvasDimensions.height / 2 - PADDLE_HEIGHT / 2;
    state.rightPaddle.y = canvasDimensions.height / 2 - PADDLE_HEIGHT / 2;
    state.score.left = 0;
    state.score.right = 0;
    state.gameStarted = false;
    setGameState({ ...state });
  };

  // Calculate canvas dimensions based on viewport
  useEffect(() => {
    const calculateDimensions = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Reserve space for UI elements (header, controls, score)
      const availableWidth = viewportWidth - 100; // 50px margin on each side
      const availableHeight = viewportHeight - 300; // space for header, controls, score

      // Calculate scale to fit the canvas while maintaining aspect ratio
      const scaleX = availableWidth / BASE_CANVAS_WIDTH;
      const scaleY = availableHeight / BASE_CANVAS_HEIGHT;
      const scale = Math.min(scaleX, scaleY, 3); // Max scale of 3x for very large screens

      const width = BASE_CANVAS_WIDTH * scale;
      const height = BASE_CANVAS_HEIGHT * scale;

      setCanvasDimensions({ width, height, scale });
    };

    calculateDimensions();
    window.addEventListener("resize", calculateDimensions);

    return () => window.removeEventListener("resize", calculateDimensions);
  }, []);

  // Update game state when canvas dimensions change
  useEffect(() => {
    const state = gameStateRef.current;
    // Scale the ball position proportionally
    state.ball.x = (state.ball.x / BASE_CANVAS_WIDTH) * canvasDimensions.width;
    state.ball.y =
      (state.ball.y / BASE_CANVAS_HEIGHT) * canvasDimensions.height;
    state.leftPaddle.y =
      (state.leftPaddle.y / BASE_CANVAS_HEIGHT) * canvasDimensions.height;
    state.rightPaddle.y =
      (state.rightPaddle.y / BASE_CANVAS_HEIGHT) * canvasDimensions.height;

    setGameState({ ...state });
  }, [canvasDimensions]);

  // Load ball image when ballValue changes
  useEffect(() => {
    if (ballType === "image" && ballValue) {
      const img = new Image();
      img.onload = () => {
        ballImageRef.current = img;
      };
      img.src = ballValue;
    } else {
      ballImageRef.current = null;
    }
  }, [ballType, ballValue]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const state = gameStateRef.current;

      switch (e.key.toLowerCase()) {
        case "w":
          state.leftPaddle.dy = -PADDLE_SPEED;
          break;
        case "s":
          state.leftPaddle.dy = PADDLE_SPEED;
          break;
        case "arrowup":
          state.rightPaddle.dy = -PADDLE_SPEED;
          break;
        case "arrowdown":
          state.rightPaddle.dy = PADDLE_SPEED;
          break;
        case " ":
          if (!state.gameStarted) {
            state.gameStarted = true;
          }
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const state = gameStateRef.current;

      switch (e.key.toLowerCase()) {
        case "w":
        case "s":
          state.leftPaddle.dy = 0;
          break;
        case "arrowup":
        case "arrowdown":
          state.rightPaddle.dy = 0;
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    const gameLoop = () => {
      const state = gameStateRef.current;

      // Update paddle positions
      state.leftPaddle.y += state.leftPaddle.dy;
      state.rightPaddle.y += state.rightPaddle.dy;

      // Keep paddles within bounds
      state.leftPaddle.y = Math.max(
        0,
        Math.min(canvasDimensions.height - PADDLE_HEIGHT, state.leftPaddle.y)
      );
      state.rightPaddle.y = Math.max(
        0,
        Math.min(canvasDimensions.height - PADDLE_HEIGHT, state.rightPaddle.y)
      );

      if (state.gameStarted) {
        // Update ball position
        state.ball.x += state.ball.dx;
        state.ball.y += state.ball.dy;

        // Ball collision with top and bottom walls
        if (
          state.ball.y <= 0 ||
          state.ball.y >= canvasDimensions.height - BALL_SIZE
        ) {
          state.ball.dy = -state.ball.dy;
        }

        // Ball collision with left paddle
        if (
          state.ball.x <= PADDLE_WIDTH &&
          state.ball.y + BALL_SIZE >= state.leftPaddle.y &&
          state.ball.y <= state.leftPaddle.y + PADDLE_HEIGHT &&
          state.ball.dx < 0
        ) {
          state.ball.dx = -state.ball.dx;
          // Add some angle based on where the ball hits the paddle
          const hitPos = (state.ball.y - state.leftPaddle.y) / PADDLE_HEIGHT;
          state.ball.dy = (hitPos - 0.5) * 8;
        }

        // Ball collision with right paddle
        if (
          state.ball.x + BALL_SIZE >= canvasDimensions.width - PADDLE_WIDTH &&
          state.ball.y + BALL_SIZE >= state.rightPaddle.y &&
          state.ball.y <= state.rightPaddle.y + PADDLE_HEIGHT &&
          state.ball.dx > 0
        ) {
          state.ball.dx = -state.ball.dx;
          // Add some angle based on where the ball hits the paddle
          const hitPos = (state.ball.y - state.rightPaddle.y) / PADDLE_HEIGHT;
          state.ball.dy = (hitPos - 0.5) * 8;
        }

        // Ball out of bounds - scoring
        if (state.ball.x < 0) {
          state.score.right++;
          resetBall();
        } else if (state.ball.x > canvasDimensions.width) {
          state.score.left++;
          resetBall();
        }
      }

      // Render the game
      render(ctx, state);
      setGameState({ ...state });

      animationId = requestAnimationFrame(gameLoop);
    };

    const resetBall = () => {
      const state = gameStateRef.current;
      state.ball.x = canvasDimensions.width / 2;
      state.ball.y = canvasDimensions.height / 2;
      state.ball.dx = (Math.random() > 0.5 ? 1 : -1) * BALL_SPEED;
      state.ball.dy = (Math.random() - 0.5) * BALL_SPEED;
    };

    const render = (ctx: CanvasRenderingContext2D, state: GameState) => {
      // Clear canvas
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvasDimensions.width, canvasDimensions.height);

      // Draw center line
      ctx.setLineDash([
        10 * canvasDimensions.scale,
        10 * canvasDimensions.scale,
      ]);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2 * canvasDimensions.scale;
      ctx.beginPath();
      ctx.moveTo(canvasDimensions.width / 2, 0);
      ctx.lineTo(canvasDimensions.width / 2, canvasDimensions.height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw paddles
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, state.leftPaddle.y, PADDLE_WIDTH, PADDLE_HEIGHT);
      ctx.fillRect(
        canvasDimensions.width - PADDLE_WIDTH,
        state.rightPaddle.y,
        PADDLE_WIDTH,
        PADDLE_HEIGHT
      );

      // Draw ball (emoji or image)
      if (ballType === "emoji") {
        ctx.font = `${BALL_SIZE * 2 * canvasDimensions.scale}px monospace`;
        ctx.fillText(ballValue, state.ball.x, state.ball.y + BALL_SIZE);
      } else if (ballType === "image" && ballImageRef.current) {
        ctx.drawImage(
          ballImageRef.current,
          state.ball.x,
          state.ball.y,
          BALL_SIZE * 2,
          BALL_SIZE * 2
        );
      }

      // Draw score
      ctx.font = `${48 * canvasDimensions.scale}px monospace`;
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.fillText(
        state.score.left.toString(),
        canvasDimensions.width / 4,
        60 * canvasDimensions.scale
      );
      ctx.fillText(
        state.score.right.toString(),
        (3 * canvasDimensions.width) / 4,
        60 * canvasDimensions.scale
      );

      // Draw start message
      if (!state.gameStarted) {
        ctx.font = `${24 * canvasDimensions.scale}px monospace`;
        ctx.fillText(
          "Press SPACE to start",
          canvasDimensions.width / 2,
          canvasDimensions.height / 2 + 40 * canvasDimensions.scale
        );
      }
    };

    // Start the game loop
    gameLoop();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [ballType, ballValue, canvasDimensions]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
      <div className="flex items-center justify-between w-full max-w-4xl mb-4">
        <h1 className="text-4xl font-bold">PONG</h1>
        <div className="flex gap-3">
          {enableMobileControl && (
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>
              <span className="text-sm">
                {isConnected
                  ? `Mobile Connected (${peers.length})`
                  : "Mobile Disconnected"}
              </span>
            </div>
          )}
          <button
            onClick={resetGame}
            className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm transition-colors duration-200"
          >
            🔄 Restart
          </button>
          {onBackToConfig && (
            <button
              onClick={onBackToConfig}
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm transition-colors duration-200"
            >
              ← Back to Config
            </button>
          )}
        </div>
      </div>
      <div className="mb-4 text-center">
        <p className="text-lg mb-2">Controls:</p>
        <p className="text-sm">
          Left Player: W (up) / S (down) {enableMobileControl && "(or Mobile)"}
        </p>
        <p className="text-sm">
          Right Player: ↑ (up) / ↓ (down) {enableMobileControl && "(or Mobile)"}
        </p>
        <p className="text-sm">Start: SPACE</p>
        {enableMobileControl && (
          <div className="mt-4">
            <p className="text-sm text-gray-400 mb-2">
              Connected mobile players: {players.length}/2
            </p>
            {players.length > 0 && (
              <div className="flex items-center justify-center gap-4 text-xs">
                {players.map((player) => (
                  <div key={player.id} className="flex items-center gap-1">
                    <span>📱</span>
                    <span
                      className={`px-2 py-1 rounded ${
                        player.side === "left" ? "bg-blue-900" : "bg-red-900"
                      }`}
                    >
                      {player.side === "left" ? "🔵" : "🔴"}{" "}
                      {player.id.substring(0, 6)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {players.length >= 2 && (
              <p className="text-sm text-green-400 mt-2">
                ✓ Both players connected via mobile!
              </p>
            )}
          </div>
        )}
      </div>
      <canvas
        ref={canvasRef}
        width={canvasDimensions.width}
        height={canvasDimensions.height}
        className="border-2 border-white"
        style={{
          maxWidth: "100%",
          height: "auto",
        }}
      />
      <div className="mt-4 text-center">
        <p className="text-lg">
          Score: {gameState.score.left} - {gameState.score.right}
        </p>
      </div>
    </div>
  );
}
