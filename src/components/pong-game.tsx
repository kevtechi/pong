"use client";

import { useEffect, useRef, useState } from "react";

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

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const PADDLE_WIDTH = 15;
const PADDLE_HEIGHT = 80;
const BALL_SIZE = 10;
const PADDLE_SPEED = 5;
const BALL_SPEED = 4;

export default function PongGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState>({
    ball: {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      dx: BALL_SPEED,
      dy: BALL_SPEED,
    },
    leftPaddle: {
      y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
      dy: 0,
    },
    rightPaddle: {
      y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
      dy: 0,
    },
    score: {
      left: 0,
      right: 0,
    },
    gameStarted: false,
  });

  const [gameState, setGameState] = useState(gameStateRef.current);

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
        Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, state.leftPaddle.y)
      );
      state.rightPaddle.y = Math.max(
        0,
        Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, state.rightPaddle.y)
      );

      if (state.gameStarted) {
        // Update ball position
        state.ball.x += state.ball.dx;
        state.ball.y += state.ball.dy;

        // Ball collision with top and bottom walls
        if (state.ball.y <= 0 || state.ball.y >= CANVAS_HEIGHT - BALL_SIZE) {
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
          state.ball.x + BALL_SIZE >= CANVAS_WIDTH - PADDLE_WIDTH &&
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
        } else if (state.ball.x > CANVAS_WIDTH) {
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
      state.ball.x = CANVAS_WIDTH / 2;
      state.ball.y = CANVAS_HEIGHT / 2;
      state.ball.dx = (Math.random() > 0.5 ? 1 : -1) * BALL_SPEED;
      state.ball.dy = (Math.random() - 0.5) * BALL_SPEED;
    };

    const render = (ctx: CanvasRenderingContext2D, state: GameState) => {
      // Clear canvas
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw center line
      ctx.setLineDash([10, 10]);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(CANVAS_WIDTH / 2, 0);
      ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw paddles
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, state.leftPaddle.y, PADDLE_WIDTH, PADDLE_HEIGHT);
      ctx.fillRect(
        CANVAS_WIDTH - PADDLE_WIDTH,
        state.rightPaddle.y,
        PADDLE_WIDTH,
        PADDLE_HEIGHT
      );

      // Draw ball
      ctx.fillRect(state.ball.x, state.ball.y, BALL_SIZE, BALL_SIZE);

      // Draw score
      ctx.font = "48px monospace";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.fillText(state.score.left.toString(), CANVAS_WIDTH / 4, 60);
      ctx.fillText(state.score.right.toString(), (3 * CANVAS_WIDTH) / 4, 60);

      // Draw start message
      if (!state.gameStarted) {
        ctx.font = "24px monospace";
        ctx.fillText(
          "Press SPACE to start",
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 + 40
        );
      }
    };

    // Start the game loop
    gameLoop();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
      <h1 className="text-4xl font-bold mb-8">PONG</h1>
      <div className="mb-4 text-center">
        <p className="text-lg mb-2">Controls:</p>
        <p className="text-sm">Left Player: W (up) / S (down)</p>
        <p className="text-sm">Right Player: ↑ (up) / ↓ (down)</p>
        <p className="text-sm">Start: SPACE</p>
      </div>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-2 border-white"
      />
      <div className="mt-4 text-center">
        <p className="text-lg">
          Score: {gameState.score.left} - {gameState.score.right}
        </p>
      </div>
    </div>
  );
}
