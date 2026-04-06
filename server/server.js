const { createServer } = require("http");
const { Server } = require("socket.io");
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://wadohqsksjkivdvjkikf.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhZG9ocXNrc2praXZkdmpraWtmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDI4MTAyMiwiZXhwIjoyMDg5ODU3MDIyfQ.[...]";
const supabase = createClient(supabaseUrl, supabaseKey);

// Track users per room with their roles
const roomUsers = new Map(); // roomId -> Map(socketId -> {role, userId, name})

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

  // ===== JOIN ROOM WITH USER INFO =====
  socket.on("join-room", async ({ roomId, userId, role, userName }) => {
    socket.join(roomId);
    
    // Initialize room if not exists
    if (!roomUsers.has(roomId)) {
      roomUsers.set(roomId, new Map());
    }
    
    // Store user info
    roomUsers.get(roomId).set(socket.id, { role, userId, userName });
    
    console.log(`User ${userName} (${role}) joined room ${roomId}`);
    
    // Notify others
    socket.to(roomId).emit("user-joined", {
      socketId: socket.id,
      userName,
      role,
    });
    
    // Send current users in room
    const roomUsersList = Array.from(roomUsers.get(roomId).values());
    io.to(roomId).emit("room-users", roomUsersList);
  });

  // ===== WEBRTC =====
  socket.on("offer", ({ roomId, offer }) => {
    socket.to(roomId).emit("offer", offer);
  });

  socket.on("answer", ({ roomId, answer }) => {
    socket.to(roomId).emit("answer", answer);
  });

  socket.on("ice-candidate", ({ roomId, candidate }) => {
    socket.to(roomId).emit("ice-candidate", candidate);
  });

  // ===== CHAT WITH USER INFO =====
  socket.on("send-message", async ({ roomId, message, userName, role }) => {
    console.log(`MSG from ${userName} (${role}):`, message);

    // Persist to DB
    const { data: insertedMsg, error } = await supabase
      .from('messages')
      .insert({
        room_id: roomId,
        sender_id: socket.id,
        sender_name: userName,
        sender_role: role,
        content: message,
      })
      .select()
      .single();

    if (error) {
      console.error('DB insert error:', error);
    } else {
      // Broadcast to all users in room
      io.to(roomId).emit("receive-message", {
        id: insertedMsg.id,
        sender: socket.id,
        senderName: userName,
        senderRole: role,
        message,
        timestamp: insertedMsg.created_at,
      });
    }
  });

  // ===== CODE EDITOR SYNC WITH ROLE RESTRICTIONS =====
  socket.on("code-change", ({ roomId, code, language, role }) => {
    console.log(`CODE SYNC from ${role}:`, language);

    // Broadcast code change to all users
    socket.to(roomId).emit("code-change", {
      code,
      language,
      editedBy: role,
    });
  });

  // ===== CURSOR POSITION SYNC =====
  socket.on("cursor-move", ({ roomId, position, userName, role }) => {
    socket.to(roomId).emit("cursor-update", {
      userName,
      role,
      position,
    });
  });

  // ===== DISCONNECT =====
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    
    // Remove from all rooms
    for (const [roomId, users] of roomUsers.entries()) {
      if (users.has(socket.id)) {
        const userData = users.get(socket.id);
        users.delete(socket.id);
        io.to(roomId).emit("user-left", {
          userName: userData.userName,
          role: userData.role,
        });
      }
    }
  });
});

httpServer.listen(5000, "0.0.0.0", () => {
  console.log("🚀 Socket server running on port 5000");
});