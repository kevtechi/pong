"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

interface Player {
  id: string;
  side: "left" | "right";
  isConnected: boolean;
}

interface UseWebRTCOptions {
  roomId: string;
  isHost?: boolean;
  onPaddleMove?: (
    direction: "up" | "down" | "stop",
    playerSide?: "left" | "right"
  ) => void;
}

export function useWebRTC({
  roomId,
  isHost = false,
  onPaddleMove,
}: UseWebRTCOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [peers, setPeers] = useState<string[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerId] = useState(() =>
    Math.random().toString(36).substring(2, 15)
  );
  const socketRef = useRef<Socket | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const onPaddleMoveRef = useRef(onPaddleMove);

  // Update the ref whenever onPaddleMove changes
  useEffect(() => {
    onPaddleMoveRef.current = onPaddleMove;
  }, [onPaddleMove]);

  const createPeerConnection = useCallback(
    async (peerId: string, isInitiator: boolean) => {
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      });

      peerConnectionsRef.current.set(peerId, peerConnection);

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit("ice-candidate", {
            candidate: event.candidate,
            roomId,
            targetId: peerId,
          });
        }
      };

      // Handle data channel for mobile controller
      if (isHost && isInitiator) {
        const dataChannel = peerConnection.createDataChannel("paddle-control", {
          ordered: true,
        });

        dataChannel.onopen = () => {
          console.log("Data channel opened");
          dataChannelRef.current = dataChannel;
        };

        dataChannel.onmessage = (event) => {
          const data = JSON.parse(event.data);

          // Handle paddle moves
          if (data.direction && onPaddleMoveRef.current) {
            onPaddleMoveRef.current(data.direction, data.playerSide);
          }

          // Update player information (from paddle moves or player info)
          if (data.playerId && data.playerSide) {
            setPlayers((prev) => {
              const existingPlayer = prev.find((p) => p.id === data.playerId);
              if (existingPlayer) {
                return prev.map((p) =>
                  p.id === data.playerId
                    ? { ...p, side: data.playerSide, isConnected: true }
                    : p
                );
              } else {
                return [
                  ...prev,
                  {
                    id: data.playerId,
                    side: data.playerSide,
                    isConnected: true,
                  },
                ];
              }
            });
          }
        };
      } else {
        peerConnection.ondatachannel = (event) => {
          const dataChannel = event.channel;
          dataChannel.onopen = () => {
            console.log("Data channel opened");
            dataChannelRef.current = dataChannel;
          };
        };
      }

      // Create offer if we're the initiator
      if (isInitiator) {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        if (socketRef.current) {
          socketRef.current.emit("offer", {
            offer,
            roomId,
            targetId: peerId,
          });
        }
      }

      return peerConnection;
    },
    [roomId, isHost]
  );

  const handleOffer = useCallback(
    async (offer: RTCSessionDescriptionInit, from: string) => {
      const peerConnection = await createPeerConnection(from, false);
      await peerConnection.setRemoteDescription(offer);

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      if (socketRef.current) {
        socketRef.current.emit("answer", {
          answer,
          roomId,
          targetId: from,
        });
      }
    },
    [roomId, createPeerConnection]
  );

  const handleAnswer = useCallback(
    async (answer: RTCSessionDescriptionInit, from: string) => {
      const peerConnection = peerConnectionsRef.current.get(from);
      if (peerConnection) {
        await peerConnection.setRemoteDescription(answer);
      }
    },
    []
  );

  const handleIceCandidate = useCallback(
    async (candidate: RTCIceCandidateInit, from: string) => {
      const peerConnection = peerConnectionsRef.current.get(from);
      if (peerConnection) {
        await peerConnection.addIceCandidate(candidate);
      }
    },
    []
  );

  useEffect(() => {
    // Only connect if we have a roomId
    if (!roomId) {
      return;
    }

    // Initialize socket connection
    console.log("Connecting to signaling server");
    const socket = io("http://192.168.1.88:3000", {
      path: "/api/socket",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
    });

    socketRef.current = socket;

    // Store references for cleanup
    const peerConnections = peerConnectionsRef.current;
    const dataChannel = dataChannelRef.current;

    socket.on("connect", () => {
      console.log("Connected to signaling server");
      setIsConnected(true);
      socket.emit("join-room", roomId);
    });

    socket.on("disconnect", (reason) => {
      console.log("Disconnected from signaling server:", reason);
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      setIsConnected(false);
    });

    socket.on("peer-joined", (peerId: string) => {
      console.log("Peer joined:", peerId);
      setPeers((prev) => [...prev, peerId]);

      if (isHost) {
        createPeerConnection(peerId, true);
      }
    });

    socket.on(
      "offer",
      async (data: {
        offer: RTCSessionDescriptionInit;
        from: string;
        to: string;
      }) => {
        console.log("Offer received:", data.offer);
        if (data.to === socket.id) {
          await handleOffer(data.offer, data.from);
        }
      }
    );

    socket.on(
      "answer",
      async (data: {
        answer: RTCSessionDescriptionInit;
        from: string;
        to: string;
      }) => {
        console.log("Answer received:", data.answer);
        if (data.to === socket.id) {
          await handleAnswer(data.answer, data.from);
        }
      }
    );

    socket.on(
      "ice-candidate",
      async (data: {
        candidate: RTCIceCandidateInit;
        from: string;
        to: string;
      }) => {
        console.log("ICE candidate received:", data.candidate);
        if (data.to === socket.id) {
          await handleIceCandidate(data.candidate, data.from);
        }
      }
    );

    socket.on(
      "paddle-move",
      (data: {
        direction: "up" | "down" | "stop";
        playerSide?: "left" | "right";
        from: string;
      }) => {
        console.log(
          "Paddle move received:",
          data.direction,
          "for player:",
          data.playerSide
        );
        if (onPaddleMoveRef.current) {
          onPaddleMoveRef.current(data.direction, data.playerSide);
        }
      }
    );

    return () => {
      console.log("Disconnecting from signaling server");
      socket.removeAllListeners();
      socket.disconnect();
      // Close all peer connections
      peerConnections.forEach((pc) => {
        pc.close();
      });
      peerConnections.clear();
      // Clear data channel reference
      if (dataChannel) {
        dataChannel.close();
        dataChannelRef.current = null;
      }
    };
  }, [
    roomId,
    isHost,
    createPeerConnection,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
  ]);

  const sendPaddleMove = (
    direction: "up" | "down" | "stop",
    playerSide?: "left" | "right"
  ) => {
    if (
      dataChannelRef.current &&
      dataChannelRef.current.readyState === "open"
    ) {
      dataChannelRef.current.send(
        JSON.stringify({
          direction,
          playerSide,
          playerId,
        })
      );
    } else if (socketRef.current) {
      // Fallback to socket if data channel is not available
      socketRef.current.emit("paddle-move", {
        direction,
        playerSide,
        playerId,
        roomId,
      });
    }
  };

  const sendPlayerInfo = (playerSide: "left" | "right") => {
    if (
      dataChannelRef.current &&
      dataChannelRef.current.readyState === "open"
    ) {
      dataChannelRef.current.send(
        JSON.stringify({
          type: "player-info",
          playerSide,
          playerId,
        })
      );
    } else if (socketRef.current) {
      // Fallback to socket if data channel is not available
      socketRef.current.emit("player-info", {
        playerSide,
        playerId,
        roomId,
      });
    }
  };

  return {
    isConnected,
    peers,
    players,
    playerId,
    sendPaddleMove,
    sendPlayerInfo,
  };
}
