"use client"

import { useEffect,useRef ,useState } from "react"
import { supabase } from "@/app/lib/supabase"
import { useRouter } from "next/navigation"
import { RealtimeChannel } from "@supabase/supabase-js"

interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

export default function MentorDashboard() {
  const [form, setForm] = useState({
    title: "",
    date: "",
    time: "",
  })
  const router = useRouter()
  const [sessions, setSessions] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([]);
  const channelsRef = useRef<Map<string, RealtimeChannel>>(new Map())
  const [messagesByRoom, setMessagesByRoom] = useState<Record<string, Message[]>>({});


  useEffect(() => {
    fetchSessions();
    fetchBookings();
  }, []);

  const fetchMessages = async (roomId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Fetch messages error:', error);
    } else {
      setMessagesByRoom(prev => ({
        ...prev,
        [roomId]: data || []
      }));
    }
  };

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
      // Fetch messages for each session (roomId = session.id)
      data?.forEach((session: any) => {
        fetchMessages(session.id);
      });
    }
  }
  const fetchBookings = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data } = await supabase
    .from("booking")
    .select("*")
    .eq("mentor_id", user.id);

  if (data) setBookings(data);
};

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

  // Realtime messages for sessions
  useEffect(() => {
   // Clean up old channels
    channelsRef.current.forEach((channel) => {
      supabase.removeChannel(channel)
    })
    channelsRef.current.clear()

    sessions.forEach((session: any) => {
      const roomId = session.id
      
      // Create unique channel name
      const channelName = `messages:room_id=eq.${roomId}`
      
      const channel = supabase
        .channel(channelName, {
          config: {
            broadcast: { self: false },
            presence: { key: roomId },
          },
        })
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `room_id=eq.${roomId}`,
          },
          (payload) => {
            console.log('New message received:', payload)
            // Add new message instead of refetching all
            setMessagesByRoom((prev) => ({
              ...prev,
              [roomId]: [
                ...(prev[roomId] || []),
                payload.new as Message,
              ],
            }))
          }
        )
        .subscribe((status) => {
          console.log(`Channel ${roomId} status:`, status)
          if (status === 'CHANNEL_ERROR') {
            console.error(`Failed to subscribe to room ${roomId}`)
            console.error('Check: 1. Realtime enabled on messages table')
            console.error('Check: 2. RLS policies allow SELECT')
            console.error('Check: 3. Room ID is valid UUID')
          }
        })

      channelsRef.current.set(roomId, channel)
    })

    // Cleanup on unmount
    return () => {
      channelsRef.current.forEach((channel) => {
        supabase.removeChannel(channel)
      })
    }
  }, [sessions])

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

                {session.status === "available" ? (
                  <button
                    onClick={() => router.push(`/room/${session.id}`)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                  >
                    Join Session
                  </button>
                ) : null}

                {/* Recent Messages Preview */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-sm mb-2 text-gray-800">Recent Messages ({(messagesByRoom[session.id] || []).length})</h4>
                  <div className="max-h-24 overflow-y-auto space-y-1 text-xs">
                    {(messagesByRoom[session.id] || []).slice(0, 3).map((msg: Message) => (
                      <div key={msg.id} className="flex items-start gap-2">
                        <span className="font-bold text-gray-600 w-20 truncate">
                          {msg.sender_id.slice(0, 8)}...
                        </span>
                        <span className="flex-1 text-gray-900 truncate pr-2" title={msg.message}>
                          {msg.message.length > 40 ? `${msg.message.slice(0, 40)}...` : msg.message}
                        </span>
                      </div>
                    ))}
                    {(messagesByRoom[session.id] || []).length === 0 && (
                      <p className="text-gray-500 text-xs italic">No messages</p>
                    )}
                  </div>
                </div>

              </div>
            ))
          ) : (
            <p className="text-gray-500">No sessions created yet.</p>
          )}
        </div>

        {/* Bookings Section */}
        {bookings.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Booked Sessions</h2>
            {bookings.map((booking: any) => (
              <div key={booking.id} className="border rounded-xl p-4 shadow-sm bg-white mb-3">
                <p className="text-sm text-gray-500">Session ID: {booking.session_id}</p>
                <p className="text-sm text-gray-500">Room ID: {booking.room_id}</p>
                <button
                  onClick={() => router.push(`/room/${booking.room_id}`)}
                  className="mt-2 bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded text-sm"
                >
                  Join Booking Room
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
        
    
