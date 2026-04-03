const { createServer } =require("http");
const { Server } =require ("socket.io");

const httpServer = createServer((req, res)=>{
  res.writeHead(200, {"Content-Type": "text/plain"});
  res.end("Socket server is running");
});

const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-joined", socket.id);
  });

  socket.on("send-message", ({ roomId, message }) => {
socket.on("receive-message", (msg) => {
    });
    console.log("Joined room", roomId);
    
  });
});

httpServer.listen(5000, "0.0.0.0", () => {
  console.log("Socket server running on port 5000");
}); 