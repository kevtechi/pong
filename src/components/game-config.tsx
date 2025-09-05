"use client";

import { useState, useEffect } from "react";

interface GameConfigProps {
  onStartGame: (ballType: "emoji" | "image", ballValue: string) => void;
}

const EMOJI_OPTIONS = [
  "🎾", // tennis ball (default)
  "⚽", // soccer ball
  "🏀", // basketball
  "🏐", // volleyball
  "🎯", // target
  "🔴", // red circle
  "🟡", // yellow circle
  "🟢", // green circle
  "🔵", // blue circle
  "🟣", // purple circle
  "⚫", // black circle
  "⚪", // white circle
  "😎", // sunglasses face
  "🤖", // robot
  "👾", // alien monster
  "🎮", // video game
];

const STORAGE_KEY = "pong-game-config";

export default function GameConfig({ onStartGame }: GameConfigProps) {
  const [selectedEmoji, setSelectedEmoji] = useState("🎾");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [ballType, setBallType] = useState<"emoji" | "image">("emoji");

  // Load saved configuration from localStorage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem(STORAGE_KEY);
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        if (
          config.ballType === "emoji" &&
          config.ballEmoji &&
          EMOJI_OPTIONS.includes(config.ballEmoji)
        ) {
          setSelectedEmoji(config.ballEmoji);
          setBallType("emoji");
        } else if (config.ballType === "image" && config.ballImage) {
          setSelectedImage(config.ballImage);
          setBallType("image");
        }
      } catch (error) {
        console.error("Error loading saved configuration:", error);
      }
    }
  }, []);

  // Save configuration to localStorage whenever selection changes
  useEffect(() => {
    const config = {
      ballType,
      ballEmoji: selectedEmoji,
      ballImage: selectedImage,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [ballType, selectedEmoji, selectedImage]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setSelectedImage(result);
        setBallType("image");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStartGame = () => {
    if (ballType === "emoji") {
      onStartGame("emoji", selectedEmoji);
    } else if (ballType === "image" && selectedImage) {
      onStartGame("image", selectedImage);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl w-full">
        <h1 className="text-6xl font-bold mb-8 text-center">PONG</h1>

        <div className="bg-gray-900 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 text-center">
            Game Configuration
          </h2>

          {/* Ball Type Selection */}
          <div className="mb-8">
            <h3 className="text-xl font-medium mb-4 text-center">
              Choose Ball Type
            </h3>
            <div className="flex justify-center gap-4 mb-6">
              <button
                onClick={() => setBallType("emoji")}
                className={`px-6 py-3 rounded-lg border-2 transition-all duration-200 ${
                  ballType === "emoji"
                    ? "border-white bg-white text-black"
                    : "border-gray-600 hover:border-gray-400 hover:bg-gray-800"
                }`}
              >
                Emoji
              </button>
              <button
                onClick={() => setBallType("image")}
                className={`px-6 py-3 rounded-lg border-2 transition-all duration-200 ${
                  ballType === "image"
                    ? "border-white bg-white text-black"
                    : "border-gray-600 hover:border-gray-400 hover:bg-gray-800"
                }`}
              >
                Custom Image
              </button>
            </div>
          </div>

          {/* Emoji Selection */}
          {ballType === "emoji" && (
            <div className="mb-8">
              <h3 className="text-xl font-medium mb-4 text-center">
                Select Ball Emoji
              </h3>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setSelectedEmoji(emoji)}
                    className={`
                      w-16 h-16 text-3xl rounded-lg border-2 transition-all duration-200
                      flex items-center justify-center
                      ${
                        selectedEmoji === emoji
                          ? "border-white bg-white text-black"
                          : "border-gray-600 hover:border-gray-400 hover:bg-gray-800"
                      }
                    `}
                    aria-label={`Select ${emoji} as ball emoji`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Image Upload */}
          {ballType === "image" && (
            <div className="mb-8">
              <h3 className="text-xl font-medium mb-4 text-center">
                Upload Ball Image
              </h3>
              <div className="flex flex-col items-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg border-2 border-gray-600 hover:border-gray-400 cursor-pointer transition-all duration-200"
                >
                  Choose Image File
                </label>
                {selectedImage && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-400 mb-2">Preview:</p>
                    <img
                      src={selectedImage}
                      alt="Ball preview"
                      className="w-16 h-16 object-cover rounded-lg border-2 border-gray-600"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="text-center mb-8">
            <p className="text-lg mb-4">Preview:</p>
            <div className="bg-gray-800 rounded-lg p-6 border-2 border-gray-600">
              {ballType === "emoji" ? (
                <div className="text-4xl mb-2">Ball: {selectedEmoji}</div>
              ) : selectedImage ? (
                <div className="flex flex-col items-center">
                  <img
                    src={selectedImage}
                    alt="Ball preview"
                    className="w-16 h-16 object-cover rounded-lg mb-2"
                  />
                  <div className="text-lg">Custom Image</div>
                </div>
              ) : (
                <div className="text-lg text-gray-400">No image selected</div>
              )}
              <p className="text-sm text-gray-400 mt-2">
                This {ballType === "emoji" ? "emoji" : "image"} will be used as
                the ball in the game
              </p>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={handleStartGame}
              className="bg-white text-black px-8 py-4 rounded-lg text-xl font-semibold hover:bg-gray-200 transition-colors duration-200"
            >
              Start Game
            </button>
          </div>
        </div>

        <div className="text-center text-gray-400">
          <p className="text-sm">
            Your configuration will be saved automatically
          </p>
        </div>
      </div>
    </div>
  );
}
