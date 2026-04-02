"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export default function RoomPage() {
  const params = useParams();
  const roomId = params.id as string;

  const [socket, setSocket] = useState<Socket | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    const newSocket = io(
      "https://humble-funicular-jjg4q95xx4q5c5g65-5000.app.github.dev",
      {
        transports: ["websocket"],
      }
    );

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket || !roomId) return;

    socket.emit("join-room", roomId);

    socket.on("receive-message", (msg: string) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("user-joined", () => {
      setMessages((prev) => [...prev, "👤 Someone joined"]);
    });

    return () => {
      socket.off("receive-message");
      socket.off("user-joined");
    };
  }, [socket, roomId]);

  const sendMessage = () => {
    if (!socket || !message) return;

    socket.emit("send-message", {
      roomId,
      message,
    });

    setMessages((prev) => [...prev, `You: ${message}`]);
    setMessage("");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        Room: {roomId}
      </h1>

      <div className="border h-80 overflow-y-auto p-3 mb-4 bg-gray-100">
        {messages.map((msg, i) => (
          <p key={i}>{msg}</p>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="border p-2 flex-1"
          placeholder="Type message..."
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4"
        >
          Send
        </button>
      </div>
    </div>
  );
}