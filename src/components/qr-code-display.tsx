"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

interface QRCodeDisplayProps {
  roomId: string;
}

export default function QRCodeDisplay({ roomId }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && roomId) {
      // const controllerUrl = `${window.location.origin}/controller?room=${roomId}`;
      const controllerUrl = `http://192.168.1.189:3000/controller?room=${roomId}`;

      QRCode.toCanvas(
        canvasRef.current,
        controllerUrl,
        {
          width: 200,
          margin: 2,
          color: {
            dark: "#ffffff",
            light: "#000000",
          },
        },
        (error) => {
          if (error) {
            // Error generating QR code
          }
        }
      );
    }
  }, [roomId]);

  return (
    <div className="flex flex-col items-center">
      <canvas ref={canvasRef} className="border border-gray-600 rounded" />
      <p className="text-xs text-gray-500 mt-2 max-w-xs break-all">
        {/* {window.location.origin}/controller?room={roomId} */}
        http://192.168.1.189:3000/controller?room={roomId}
      </p>
    </div>
  );
}
