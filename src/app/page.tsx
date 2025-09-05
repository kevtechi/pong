"use client";

import { useState } from "react";
import GameConfig from "@/components/game-config";
import PongGame from "@/components/pong-game";

export default function Home() {
  const [showGame, setShowGame] = useState(false);
  const [ballType, setBallType] = useState<"emoji" | "image">("emoji");
  const [ballValue, setBallValue] = useState("🎾");

  const handleStartGame = (type: "emoji" | "image", value: string) => {
    setBallType(type);
    setBallValue(value);
    setShowGame(true);
  };

  const handleBackToConfig = () => {
    setShowGame(false);
  };

  if (showGame) {
    return (
      <PongGame
        ballType={ballType}
        ballValue={ballValue}
        onBackToConfig={handleBackToConfig}
      />
    );
  }

  return <GameConfig onStartGame={handleStartGame} />;
}
