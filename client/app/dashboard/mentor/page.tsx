"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/app/lib/supabase"
import { useRouter } from "next/navigation"

export default function MentorDashboard() {
  const [form, setForm] = useState({
    title: "",
    date: "",
    time: "",
  })
  const router = useRouter()
  const [sessions, setSessions] = useState<any[]>([])

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data, error } = await supabase
      .from("sessions")
      .select()
      .eq("mentor_id", user.id)
      .order("created_at", { ascending: false })
    if (error) {
      console.error("Error fetching sessions:", error)
    } else {
      setSessions(data || [])
    }
  }

  const handleCreate = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    if(!form.title || !form.date || !form.time){
      alert("please fill all the fields")
      return;
    }
    const { error } = await supabase
      .from("sessions")
      .insert({
        title: form.title,
        date: form.date,
        time: form.time,
        mentor_id: user.id,
        room_id: crypto.randomUUID(),
        status:"available"
      })
    if (error) {
      console.error("Error creating session:", error)
    } else {
      fetchSessions()
      setForm({ title: "", date: "", time: "" })
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-2xl p-6">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Mentor Dashboard
          </h1>
          <button 
            onClick={handleLogout}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
          >
            Logout
          </button>
        </div>

        {/* Create Session */}
        <div className="bg-gray-50 p-4 rounded-xl shadow-sm mb-6">
          <h2 className="text-lg font-semibold mb-3 text-gray-700">
            Create Session
          </h2>

          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Session Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="flex-1 min-w-[200px] border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
            />

            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="border rounded-lg px-3 py-2"
            />

            <input
              type="time"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
              className="border rounded-lg px-3 py-2"
            />

          <button 
              onClick={handleCreate}
              className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-lg transition"
            >
              Create
            </button>
            
          </div>
        </div>

        {/* Sessions List */}
        <div>
          <h2 className="text-xl font-bold mb-4 text-gray-800">
            Your Sessions
          </h2>
          

          {sessions.length > 0 ? (
            sessions.map((session) => (
              <div key={session.id} className="border rounded-xl p-4 shadow-sm hover:shadow-md transition bg-white mb-3">
                <h3 className="text-lg font-semibold text-gray-700">
                  {session.title}
                </h3>

                <p className="text-gray-500 text-sm mt-1">
                  {session.date} • {session.time}
                </p>

                <div className="mt-3 flex gap-2">
                 
                  <span className={`inline-block mt-2 px-3 py-1 text-sm rounded-full ${session.status === "available" 
                        ? "bg-green-100 text-green-700" 
                        : "bg-red-100 text-red-600"}`}>
                    {session.status === "available" ? "Available" : "Unavailable"}
                  </span>
                </div>
                {session.status === "available" && (
                  <button
                    onClick={() => router.push(`/room/${session.room_id}`)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                  >
                    Join Session
                  </button>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500">No sessions created yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
        
    
