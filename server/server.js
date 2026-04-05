const { createServer } = require("http");
const { Server } = require("socket.io");
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://wadohqsksjkivdvjkikf.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhZG9ocXNrc2praXZkdmpraWtmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDI4MTAyMiwiZXhwIjoyMDg5ODU3MDIyfQ.3AhHDdIH2SGdUbElUHplQ2HdyD6mwP-2kMVfWYrLEbA";
const supabase = createClient(supabaseUrl, supabaseKey);

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
  socket.on("send-message", async ({ roomId, message }) => {
      console.log("MSG:", message);

      // Persist to DB
      const { error } = await supabase
        .from('messages')
        .insert({
          room_id: roomId,
          sender_id: socket.id,
          content: message
        });

      if (error) console.error('DB insert error:', error);

      // Broadcast
      io.to(roomId).emit("receive-message", {
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