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
  const createPeerConnectionRef = useRef<
    | ((peerId: string, isInitiator: boolean) => Promise<RTCPeerConnection>)
    | null
  >(null);
  const handleOfferRef = useRef<
    ((offer: RTCSessionDescriptionInit, from: string) => Promise<void>) | null
  >(null);
  const handleAnswerRef = useRef<
    ((answer: RTCSessionDescriptionInit, from: string) => Promise<void>) | null
  >(null);
  const handleIceCandidateRef = useRef<
    ((candidate: RTCIceCandidateInit, from: string) => Promise<void>) | null
  >(null);

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
          dataChannelRef.current = dataChannel;
        };

        dataChannel.onmessage = (event) => {
          const data = JSON.parse(event.data);

          // Handle player info messages
          if (data.type === "player-info") {
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

          // Handle paddle moves
          if (data.direction && onPaddleMoveRef.current) {
            onPaddleMoveRef.current(data.direction, data.playerSide);
          }
        };
      } else {
        peerConnection.ondatachannel = (event) => {
          const dataChannel = event.channel;
          dataChannel.onopen = () => {
            dataChannelRef.current = dataChannel;
          };

          dataChannel.onmessage = (event) => {
            const data = JSON.parse(event.data);

            // Handle player info messages
            if (data.type === "player-info") {
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

            // Handle paddle moves
            if (data.direction && onPaddleMoveRef.current) {
              onPaddleMoveRef.current(data.direction, data.playerSide);
            }
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

  // Update the refs whenever functions change
  useEffect(() => {
    onPaddleMoveRef.current = onPaddleMove;
    createPeerConnectionRef.current = createPeerConnection;
    handleOfferRef.current = handleOffer;
    handleAnswerRef.current = handleAnswer;
    handleIceCandidateRef.current = handleIceCandidate;
  }, [
    onPaddleMove,
    createPeerConnection,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
  ]);

  useEffect(() => {
    // Only connect if we have a roomId
    if (!roomId) {
      return;
    }

    // Initialize socket connection
    const socket = io("http://192.168.1.189:3000", {
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
      setIsConnected(true);
      socket.emit("join-room", roomId);
    });

    socket.on("disconnect", (reason) => {
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      setIsConnected(false);
    });

    socket.on("peer-joined", (peerId: string) => {
      setPeers((prev) => [...prev, peerId]);

      if (isHost && createPeerConnectionRef.current) {
        createPeerConnectionRef.current(peerId, true);
      }
    });

    socket.on(
      "offer",
      async (data: {
        offer: RTCSessionDescriptionInit;
        from: string;
        to: string;
      }) => {
        if (data.to === socket.id && handleOfferRef.current) {
          await handleOfferRef.current(data.offer, data.from);
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
        if (data.to === socket.id && handleAnswerRef.current) {
          await handleAnswerRef.current(data.answer, data.from);
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
        if (data.to === socket.id && handleIceCandidateRef.current) {
          await handleIceCandidateRef.current(data.candidate, data.from);
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
        if (onPaddleMoveRef.current) {
          onPaddleMoveRef.current(data.direction, data.playerSide);
        }
      }
    );

    socket.on(
      "player-info",
      (data: {
        playerSide: "left" | "right";
        playerId: string;
        from: string;
      }) => {
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
    );

    return () => {
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
  }, [roomId, isHost]);

  const sendPaddleMove = (
    direction: "up" | "down" | "stop",
    playerSide?: "left" | "right"
  ) => {
    if (
      dataChannelRef.current &&
      dataChannelRef.current.readyState === "open"
    ) {
      const dataToSend = {
        direction,
        playerSide,
        playerId,
      };
      dataChannelRef.current.send(JSON.stringify(dataToSend));
    } else if (socketRef.current) {
      // Fallback to socket if data channel is not available
      const dataToSend = {
        direction,
        playerSide,
        playerId,
        roomId,
      };
      socketRef.current.emit("paddle-move", dataToSend);
    }
  };

  const sendPlayerInfo = (playerSide: "left" | "right") => {
    if (
      dataChannelRef.current &&
      dataChannelRef.current.readyState === "open"
    ) {
      const dataToSend = {
        type: "player-info",
        playerSide,
        playerId,
      };
      dataChannelRef.current.send(JSON.stringify(dataToSend));
    } else if (socketRef.current) {
      // Fallback to socket if data channel is not available
      const dataToSend = {
        playerSide,
        playerId,
        roomId,
      };
      socketRef.current.emit("player-info", dataToSend);
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
