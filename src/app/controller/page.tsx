"use client";

import { useEffect, useState } from "react";
import { useWebRTC } from "@/hooks/useWebRTC";

interface ControllerPageProps {
  searchParams: {
    room?: string;
  };
}

export default function ControllerPage({}: ControllerPageProps) {
  const [roomId, setRoomId] = useState<string>("");
  const [isPressing, setIsPressing] = useState<"up" | "down" | null>(null);
  const [playerSide, setPlayerSide] = useState<"left" | "right" | null>(null);

  const { isConnected, sendPaddleMove, sendPlayerInfo, playerId } = useWebRTC({
    roomId,
    isHost: false,
    onPaddleMove: () => {}, // We don't need to handle incoming moves on the controller
  });

  useEffect(() => {
    // Get room ID from URL params or generate one
    const urlParams = new URLSearchParams(window.location.search);
    const roomFromUrl = urlParams.get("room");

    if (roomFromUrl) {
      setRoomId(roomFromUrl);
    }
  }, []);

  const handleTouchStart = (direction: "up" | "down") => {
    if (!playerSide) return;
    setIsPressing(direction);
    sendPaddleMove(direction, playerSide);
  };

  const handleTouchEnd = () => {
    if (!playerSide) return;
    setIsPressing(null);
    sendPaddleMove("stop", playerSide);
  };

  const handleMouseDown = (direction: "up" | "down") => {
    handleTouchStart(direction);
  };

  const handleMouseUp = () => {
    handleTouchEnd();
  };

  const handlePlayerSideSelection = (side: "left" | "right") => {
    setPlayerSide(side);
    // Send player info immediately when side is selected
    sendPlayerInfo(side);
  };

  if (!roomId) {
    return (
      <div className="controller-no-scroll bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Pong Mobile Controller</h1>
          <p className="text-gray-400">No room ID provided</p>
        </div>
      </div>
    );
  }

  if (!playerSide) {
    return (
      <div className="controller-no-scroll bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold mb-4">Choose Your Side</h1>
          <p className="text-gray-400 mb-6">
            Select which player you want to control
          </p>

          <div className="space-y-3">
            <button
              onClick={() => handlePlayerSideSelection("left")}
              className="w-full bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-lg text-lg font-semibold transition-colors duration-200"
            >
              Left Player
            </button>
            <button
              onClick={() => handlePlayerSideSelection("right")}
              className="w-full bg-red-600 hover:bg-red-500 px-6 py-3 rounded-lg text-lg font-semibold transition-colors duration-200"
            >
              Right Player
            </button>
          </div>

          <div className="mt-6 text-xs text-gray-500">
            <p>Room: {roomId}</p>
            <p className="flex items-center justify-center gap-2 mt-1">
              <span>📱</span>
              <span>Your ID: {playerId.substring(0, 8)}</span>
            </p>
            <div className="flex items-center justify-center gap-2 mt-1">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>
              <span>{isConnected ? "Connected" : "Disconnected"}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="controller-no-scroll bg-black text-white flex flex-col">
      {/* Header - Portrait only */}
      <div className="p-2 text-center border-b border-gray-800 flex-shrink-0 portrait:block landscape:hidden">
        <h1 className="text-sm font-bold">Pong Controller</h1>
        <p className="text-xs text-gray-400">Room: {roomId}</p>
        <p className="text-xs font-semibold mt-1">
          {playerSide === "left" ? "🔵 Left Player" : "🔴 Right Player"}
        </p>
        <div
          className={`inline-block px-1 py-0.5 rounded text-xs mt-1 ${
            isConnected ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {isConnected ? "Connected" : "Disconnected"}
        </div>
        <button
          onClick={() => {
            setPlayerSide(null);
          }}
          className="block mx-auto mt-1 text-xs text-gray-400 hover:text-white underline"
        >
          Change Side
        </button>
      </div>

      {/* Header - Landscape only */}
      <div className="p-2 text-center border-b border-gray-800 flex-shrink-0 portrait:hidden landscape:block">
        <div className="flex items-center justify-between">
          <div className="text-left">
            <h1 className="text-sm font-bold">Pong Controller</h1>
            <p className="text-xs text-gray-400">Room: {roomId}</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold">
              {playerSide === "left" ? "🔵 Left Player" : "🔴 Right Player"}
            </p>
            <div
              className={`inline-block px-1 py-0.5 rounded text-xs mt-1 ${
                isConnected ? "bg-green-600" : "bg-red-600"
              }`}
            >
              {isConnected ? "Connected" : "Disconnected"}
            </div>
          </div>
          <button
            onClick={() => {
              setPlayerSide(null);
            }}
            className="text-xs text-gray-400 hover:text-white underline"
          >
            Change Side
          </button>
        </div>
      </div>

      {/* Control Buttons - Portrait Layout */}
      <div className="flex-1 flex flex-col justify-center items-center space-y-16 p-4 portrait:flex landscape:hidden">
        {/* Up Button */}
        <button
          className={`w-32 h-32 rounded-full text-4xl font-bold transition-all duration-150 ${
            isPressing === "up"
              ? "bg-green-600 scale-110 shadow-lg"
              : "bg-gray-700 hover:bg-gray-600 active:bg-green-600"
          }`}
          onTouchStart={() => handleTouchStart("up")}
          onTouchEnd={handleTouchEnd}
          onMouseDown={() => handleMouseDown("up")}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          ↑
        </button>

        {/* Down Button */}
        <button
          className={`w-32 h-32 rounded-full text-4xl font-bold transition-all duration-150 ${
            isPressing === "down"
              ? "bg-green-600 scale-110 shadow-lg"
              : "bg-gray-700 hover:bg-gray-600 active:bg-green-600"
          }`}
          onTouchStart={() => handleTouchStart("down")}
          onTouchEnd={handleTouchEnd}
          onMouseDown={() => handleMouseDown("down")}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          ↓
        </button>
      </div>

      {/* Control Buttons - Landscape Layout */}
      <div className="flex-1 flex flex-row justify-center items-center space-x-16 p-4 portrait:hidden landscape:flex">
        {/* Up Button (Left) */}
        <button
          className={`w-24 h-24 rounded-full text-3xl font-bold transition-all duration-150 ${
            isPressing === "up"
              ? "bg-green-600 scale-110 shadow-lg"
              : "bg-gray-700 hover:bg-gray-600 active:bg-green-600"
          }`}
          onTouchStart={() => handleTouchStart("up")}
          onTouchEnd={handleTouchEnd}
          onMouseDown={() => handleMouseDown("up")}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          ↑
        </button>

        {/* Down Button (Right) */}
        <button
          className={`w-24 h-24 rounded-full text-3xl font-bold transition-all duration-150 ${
            isPressing === "down"
              ? "bg-green-600 scale-110 shadow-lg"
              : "bg-gray-700 hover:bg-gray-600 active:bg-green-600"
          }`}
          onTouchStart={() => handleTouchStart("down")}
          onTouchEnd={handleTouchEnd}
          onMouseDown={() => handleMouseDown("down")}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          ↓
        </button>
      </div>

      {/* Footer - Portrait only */}
      <div className="p-2 text-center border-t border-gray-800 flex-shrink-0 portrait:block landscape:hidden">
        <p className="text-xs text-gray-500">Touch and hold to move paddle</p>
      </div>
    </div>
  );
}
