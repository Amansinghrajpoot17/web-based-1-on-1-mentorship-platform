"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

export default function StudentDashboard() {
  const [session, setsession] = useState<any[]>([]);

  useEffect(() => {
    const fetchSessions = async () => {
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("status", "available");

      if (error) {
        console.log(error);
        setsession([]);
      } else {
        console.log(data);
        setsession(data);
      }
    };

    fetchSessions();
  }, []);

  const bookSession = async (sessions: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("bookings").insert([
      {
        student_id: user.id,
        session_id: sessions.id,
        mentor_id: sessions.mentor_id,
        status: "booked"
      }
    ]);

    if (error) {
      console.error(error);
      alert("Booking failed");
    } else {
      await supabase
        .from("sessions")
        .update({ status: "booked" })
        .eq("id", sessions.id);

      alert("Session booked successfully");
    }
  };

  return (
    <div>
      <h2>Available Sessions</h2>

      {session.map((sessions: any) => (
        <div key={sessions.id} style={{ border: "1px solid", margin: 10 }}>
          <p>Title: {sessions.title}</p>
          <p>Time: {sessions.time}</p>

          <button onClick={() => bookSession(sessions)}>
            Book Session
          </button>
        </div>
      ))}
    </div>
  );
}