"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { supabase } from "@/app/lib/supabase";
import Editor from "@monaco-editor/react";
import { Content } from "next/font/google";

interface MessageDB {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

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

  const [dbMessages, setDbMessages] = useState<MessageDB[]>([]);

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

    // Load past messages from DB
    const loadHistory = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Load history error:', error);
      } else {
        setDbMessages(data || []);
        // Convert to string format for display
        const historyStrings = (data || []).map(msg => `${msg.sender_id.slice(0,6)}... : ${msg.content}`);
        setMessages(historyStrings);
      }
    };

    loadHistory();

    newSocket.on("connect", () => {
      console.log("connected", newSocket.id);
            newSocket.emit("join-room", roomId);
start();
    });

    newSocket.on("connect_error", (err) => {
      console.log("connect error", err.message);
    });

    

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
  <div className="h-screen bg-gray-900 text-white p-3 flex gap-3">

    {/* LEFT SIDE */}
    <div className="flex-1 flex flex-col gap-3">

      {/* EDITOR */}
      <div className="bg-gray-800 rounded-xl p-3 flex-1 flex flex-col">
        
        <div className="flex justify-between mb-2">
          <h2 className="font-semibold">💻 Code Editor</h2>

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
            className="text-black px-2 py-1 rounded"
          >
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>
        </div>

        <div className="flex-1">
          <Editor
            height="100%"
            language={language}
            theme="vs-dark"
            value={code}
            onChange={handleEditorChange}
          />
        </div>
      </div>

      {/* VIDEO */}
      <div className="flex gap-3 h-40">
        <video ref={localvideoRef} autoPlay muted className="w-1/2 rounded-xl object-cover" />
        <video ref={remotevideoRef} autoPlay className="w-1/2 rounded-xl object-cover" />
      </div>

    </div>

    {/* RIGHT CHAT */}
    <div className="w-80 bg-gray-800 rounded-xl p-3 flex flex-col">
      <h2 className="font-semibold mb-2">💬 Chat</h2>

      <div className="flex-1 overflow-y-auto bg-gray-900 p-2 rounded mb-2 text-sm">
        {messages.map((msg, i) => (
          <p key={i}>{msg}</p>
        ))}
      </div>

      {/* 🔥 FIX HERE */}
      <div className="flex gap-2">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 p-2 rounded text-black"
          placeholder="Type message..."
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 px-4 rounded"
        >
          Send
        </button>
      </div>
    </div>

  </div>
);}