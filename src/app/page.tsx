"use client";

import { useState } from "react";
import GameConfig from "@/components/game-config";
import PongGame from "@/components/pong-game";

export default function Home() {
  const [showGame, setShowGame] = useState(false);
  const [ballType, setBallType] = useState<"emoji" | "image">("emoji");
  const [ballValue, setBallValue] = useState("🎾");
  const [enableMobileControl, setEnableMobileControl] = useState(false);
  const [roomId, setRoomId] = useState("");

  const handleStartGame: (
    ballType: "emoji" | "image",
    ballValue: string,
    enableMobileControl: boolean,
    roomId: string
  ) => void = (type, value, mobileControl, gameRoomId) => {
    setBallType(type);
    setBallValue(value);
    setEnableMobileControl(mobileControl);
    setRoomId(gameRoomId);
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
        enableMobileControl={enableMobileControl}
        roomId={roomId}
      />
    );
  }

  return <GameConfig onStartGame={handleStartGame} />;
}
