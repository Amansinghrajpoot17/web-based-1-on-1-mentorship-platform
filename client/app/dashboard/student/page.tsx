"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { useRouter } from "next/navigation";

export default function StudentDashboard() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [bookedSessions, setBookedSessions] = useState<any[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [joinRoomId, setJoinRoomId] = useState("");

  const router = useRouter();
  const roomId=crypto.randomUUID();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Sessions
      const { data: sessionData } = await supabase
        .from("sessions")
        .select("*");

      if (sessionData) setSessions(sessionData);

      // Bookings with room_id
      const { data: bookingData } = await supabase
        .from("booking")
        .select("session_id, room_id")
        .eq("student_id", user.id);

      if (bookingData) {
        setBookedSessions(bookingData);
      }
    };

    fetchData();
  }, []);

  const isBooked = (sessionId: string) => {
    return bookedSessions.find((b) => b.session_id === sessionId);
  };

  // ✅ BOOK SESSION
  const bookSession = async (session: any) => {
    setLoadingId(session.id);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (isBooked(session.id)) {
      alert("Already booked ⚠️");
      setLoadingId(null);
      return;
    }

    const roomId = crypto.randomUUID();  // 🔥 generate room id

    const { error } = await supabase.from("booking").insert([
      {
        student_id: user.id,
        session_id: session.id,
        mentor_id: session.mentor_id,
        status: "booked",
        room_id: roomId,
      },
    ]);

    if (error) {
      if (error.code === "23505") {
        alert("Already booked ⚠️");
      } else {
        alert("Booking failed ❌");
      }
    } else {
      setBookedSessions((prev) => [
        ...prev,
        { session_id: session.id, room_id: roomId },
      ]);
    }

    setLoadingId(null);
  };

  // ✅ JOIN SESSION
  const joinSession = (roomId: string) => {
    router.push(`/room/${roomId}`);
  };

  // ✅ MANUAL JOIN
  const handleManualJoin = () => {
    if (!joinRoomId) return alert("Enter Room ID");
    router.push(`/room/${joinRoomId}`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Student Dashboard 🎓</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>

      {/* Manual Join */}
      <div className="bg-white p-4 rounded-xl shadow mb-6 flex gap-3">
        <input
          type="text"
          placeholder="Enter Room ID..."
          value={joinRoomId}
          onChange={(e) => setJoinRoomId(e.target.value)}
          className="border p-2 rounded w-full"
        />
        <button
          onClick={handleManualJoin}
          className="bg-green-500 text-white px-4 rounded"
        >
          Join
        </button>
      </div>

      {/* Sessions */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sessions.map((session: any) => {
          const booking = isBooked(session.id);

          return (
            <div
              key={session.id}
              className="bg-white p-5 rounded-xl shadow"
            >
              <h2 className="text-xl font-semibold">{session.title}</h2>
              <p className="text-gray-600 mb-3">🕒 {session.time}</p>

              {booking ? (
                <div className="space-y-3">
                  <div className="text-green-600 font-semibold">
          Booked ✅
        </div>
                  <button
                    onClick={() => joinSession(booking.room_id)}
                    className="w-full bg-green-500 text-white py-2 rounded"
                  >
                    Join Session 🚀
                  </button>

                  <p className="text-sm text-gray-500 break-all">
                    Room ID: {booking.room_id}
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => bookSession(session)}
                  disabled={loadingId === session.id}
                  className="w-full bg-blue-500 text-white py-2 rounded"
                >
                  {loadingId === session.id ? "Booking..." : "Book Session"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}