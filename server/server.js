const { createServer } = require("http");
const { Server } = require("socket.io");

const httpServer = createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Socket server is running");
});

const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // =========================
  // JOIN ROOM
  // =========================
  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-joined", socket.id);
  });

  // =========================
  // WEBRTC
  // =========================
  socket.on("offer", ({ roomId, offer }) => {
    socket.to(roomId).emit("offer", offer);
  });

  socket.on("answer", ({ roomId, answer }) => {
    socket.to(roomId).emit("answer", answer);
  });

  socket.on("ice-candidate", ({ roomId, candidate }) => {
    socket.to(roomId).emit("ice-candidate", candidate);
  });

  // =========================
  // CHAT
  // =========================
  socket.on("send-message", ({ roomId, message }) => {
      console.log("MSG:", message);

    socket.to(roomId).emit("receive-message", {
      sender: socket.id,
      message,
    });
  });

  // =========================
  // ✅ MONACO (FIXED POSITION)
  // =========================
  socket.on("code-change", ({ roomId, code, language }) => {
      console.log("CODE SYNC");

    socket.to(roomId).emit("code-change", {
      code,
      language,
    });
  });

  // =========================
  // DISCONNECT
  // =========================
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

httpServer.listen(5000, "0.0.0.0", () => {
  console.log("🚀 Socket server running on port 5000");
});