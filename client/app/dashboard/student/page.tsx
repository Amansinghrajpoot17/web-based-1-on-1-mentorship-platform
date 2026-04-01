"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { useRouter } from "next/navigation";

export default function StudentDashboard() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [bookedSessions, setBookedSessions] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // ✅ Fetch all sessions
      const { data: sessionData, error: sessionError } = await supabase
        .from("sessions")
        .select("*");

      if (!sessionError && sessionData) {
        setSessions(sessionData);
      }

      // ✅ Fetch bookings of current user
      const { data: bookingData, error: bookingError } = await supabase
        .from("booking")
        .select("session_id")
        .eq("student_id", user.id);

      if (!bookingError && bookingData) {
        const ids = bookingData.map((b: any) => b.session_id);
        setBookedSessions(ids);
      }
    };

    fetchData();
  }, []);

  // ✅ Book Session
  const bookSession = async (session: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("booking").insert([
      {
        student_id: user.id,
        session_id: session.id,
        mentor_id: session.mentor_id,
        status: "booked"
      }
    ]);

    if (error) {
      console.error(error);
      alert("Booking failed");
    } else {
      // ✅ update UI instantly
      setBookedSessions((prev) => [...prev, session.id]);
      alert("Session booked successfully ✅");
    }
  };
  const handlelogout= async()=>{
    await supabase.auth.signOut();
    router.push("/")
  }

  return (
    <div>
      <h2>Available Sessions</h2>

      {sessions.map((session: any) => (
        <div key={session.id} style={{ border: "1px solid", margin: 10, padding: 10 }}>
          <p><b>Title:</b> {session.title}</p>
          <p><b>Time:</b> {session.time}</p>

          {bookedSessions.includes(session.id) ? (
            <button disabled style={{ backgroundColor: "gray", cursor: "not-allowed" }}>
              Booked ✅
            </button>
          ) : (
            <><button onClick={() => bookSession(session)}>
                Book Session
              </button><button onClick={handlelogout}
              style={{
    backgroundColor: "red",
    color: "white",
    padding: "8px 12px",
    border: "none",
    cursor: "pointer"
  }}>
                  Logout
                </button></>

          )}
        </div>
      ))}
    </div>
  );
}