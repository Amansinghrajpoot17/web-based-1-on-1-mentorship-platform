"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import Editor from "@monaco-editor/react";

export default function RoomPage() {
  const { id: roomIdParam } = useParams() as { id?: string };
  const roomId = roomIdParam ?? "";
  const localvideoRef= useRef<HTMLVideoElement>(null);
  const remotevideoRef= useRef<HTMLVideoElement>(null);
  const peerConnectionRef= useRef<RTCPeerConnection | null>(null);

  const [socket, setSocket] = useState<Socket | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const[code,setcode]=useState("// Write your code here...")
  const [language,setlanguage]=useState("javascript");

  useEffect(() => {
    const newSocket = io(
      "https://humble-funicular-jjg4q95xx4q5c5g65-5000.app.github.dev",
      {
        path: "/socket.io",
        transports: ["polling", "websocket"],
        secure: true,
      }
    );

    setSocket(newSocket);

    const start = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      if (localvideoRef.current) {
        localvideoRef.current.srcObject = stream;
      }

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      peerConnectionRef.current = pc;

      // Add tracks
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Remote stream
      pc.ontrack = (event) => {
        if (remotevideoRef.current) {
          remotevideoRef.current.srcObject = event.streams[0];
        }
      };

      // ICE
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          newSocket.emit("ice-candidate", {
            candidate: event.candidate,
            roomId,
          });
        }
      };

      // Join room ONCE
      newSocket.emit("join-room", roomId);

      // 🔥 When other user joins → create offer
      newSocket.on("user-joined", async () => {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        newSocket.emit("offer", { offer, roomId });
      });

      // Receive offer
      newSocket.on("offer", async (offer) => {
        await pc.setRemoteDescription(offer);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        newSocket.emit("answer", { answer, roomId });
      });

      // Receive answer
      newSocket.on("answer", async (answer) => {
        await pc.setRemoteDescription(answer);
      });

      // ICE candidate
      newSocket.on("ice-candidate", async (candidate) => {
        await pc.addIceCandidate(candidate);
      });
    };

    newSocket.on("connect", () => {
      console.log("connected", newSocket.id);
    });

    newSocket.on("connect_error", (err) => {
      console.log("connect error", err.message);
    });

    start();

    return () => {
      newSocket.disconnect();
    };
  }, [roomId]);

  useEffect(() => {
    if (!socket || !roomId) return;
     
   socket.on("receive-message", (data) => {
  setMessages((prev) => [
    ...prev,
    `${data.sender}: ${data.message}`,
  ]);
});

    socket.on("user-joined", () => {
      setMessages((prev) => [...prev, "👤 Someone joined"]);
    });
socket.on("code-change", (data)=>{
  setcode(data.code);
  if(data.language){
    setlanguage(data.language)
  }
});
    return () => {
      socket.off("connect");
      socket.off("receive-message");
      socket.off("user-joined");
      socket.off("code-change");
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
  const handleEditorChange = (value: string | undefined) => {
  if (!value) return;

  if (value !== code) {
    setcode(value);

    socket?.emit("code-change", {
      roomId,
      code: value,
      language,
    });
  }
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
       <video ref={localvideoRef} autoPlay muted className="w-1/2 border" />
      <video ref={remotevideoRef} autoPlay className="w-1/2 border" />
      <div className="mt-6">
  <h2 className="text-lg font-bold mb-2">💻 Live Code Editor</h2>
<div className="mb-2">
  <label className="mr-2 font-semibold">Language:</label>

  <select
  value={language}
  onChange={(e) => {
    const newLang = e.target.value;
    setlanguage(newLang);

    socket?.emit("code-change", {
      roomId,
      code,
      language: newLang,
    });
  }}
    className="border p-1"
  >
    <option value="javascript">JavaScript</option>
    <option value="typescript">TypeScript</option>
    <option value="python">Python</option>
    <option value="java">Java</option>
    <option value="cpp">C++</option>
    <option value="c">C</option>
    <option value="json">JSON</option>
    <option value="html">HTML</option>
    <option value="css">CSS</option>
  </select>
</div>

  <Editor
    height="400px"
    defaultLanguage="javascript"
    language={language}
    theme="vs-dark"
    value={code}
    onChange={handleEditorChange}
  />
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