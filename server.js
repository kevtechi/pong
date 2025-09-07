const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
// const hostname = "0.0.0.0";
const hostname = "192.168.1.189";
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer, {
    path: "/api/socket",
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 45000,
  });

  // Log server startup

  io.on("connection", (socket) => {
    socket.on("join-room", (roomId) => {
      socket.join(roomId);

      // Notify other clients in the room
      socket.to(roomId).emit("peer-joined", socket.id);
    });

    socket.on("offer", (data) => {
      socket.to(data.roomId).emit("offer", {
        offer: data.offer,
        from: socket.id,
        to: data.targetId,
      });
    });

    socket.on("answer", (data) => {
      socket.to(data.roomId).emit("answer", {
        answer: data.answer,
        from: socket.id,
        to: data.targetId,
      });
    });

    socket.on("ice-candidate", (data) => {
      socket.to(data.roomId).emit("ice-candidate", {
        candidate: data.candidate,
        from: socket.id,
        to: data.targetId,
      });
    });

    socket.on("paddle-move", (data) => {
      socket.to(data.roomId).emit("paddle-move", {
        direction: data.direction,
        playerSide: data.playerSide,
        from: socket.id,
      });
    });

    socket.on("player-info", (data) => {
      socket.to(data.roomId).emit("player-info", {
        playerSide: data.playerSide,
        playerId: data.playerId,
        from: socket.id,
      });
    });

    socket.on("disconnect", (reason) => {});
  });

  httpServer
    .once("error", (err) => {
      process.exit(1);
    })
    .listen(port, () => {});
});
