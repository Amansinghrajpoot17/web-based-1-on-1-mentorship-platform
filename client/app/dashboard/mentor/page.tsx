"use client"
import{useEffect,useState} from "react"
import { supabase } from "@/app/lib/supabase"
import { title } from "process"
import { log, time } from "console"

export default function mentorDashboard(){
    const [form, setform]=useState({
        title:"",
        date:"",
        time:"",

    });
    const [sessions, setsessions]=useState<any[]>([]);
    useEffect(()=>{
      fetchSessions();
    },[])
    const fetchSessions=async()=>{
        const {data:{user}}= await supabase.auth.getUser();
        if (!user) return;
        const {data, error}= await supabase
        .from("sessions")
        .select()
        .eq("mentor_id", user.id)
        if (error) {
            console.error("Error fetching sessions:", error);
        } else {
            setsessions(data || []);
        }try {
            
        } catch (error) {
            console.log("error fetching sessions", error);
            
        } 
        

    }
    const handleCreate= async()=>{
        const {data:{user}}= await supabase.auth.getUser();
        if (!user) return;
        const {error}= await supabase
        .from("sessions")
        .insert({
            title: form.title,
            date: form.date,
            time: form.time,
            mentor_id: user.id
        })
        if (error) {
            console.error("Error creating session:", error);
        } else {
            fetchSessions();
        }
    }

    return(
        <div className="p-6">
            <h1 className="text-2x1-font-bold">MENTOR DASHBOARD</h1>
            <p className="mt-2">Manage your sessions</p>
            <div className="mb-6">
                <input type="text"
                placeholder="Session Title" 
                onChange={(e)=> setform({...form, title:e.target.value})}/>
                <input type="date"
                placeholder="Session Date " 
                onChange={(e)=>setform({...form, date:e.target.value})}/>
                <input type="time" 
                placeholder="Session Time"
                onChange={(e)=>setform({...form, time:e.target.value})}/>
                <button type="button" className="text-heading bg-gradient-to-r from-lime-200 via-lime-400 to-lime-500 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-lime-300 dark:focus:ring-lime-800 font-medium rounded-base text-sm px-4 py-2.5 text-center leading-5" onClick={handleCreate}>Create Sessions</button>
            </div>
            {/* view sessions */}
            <h2 className="mb-4 text-3xl font-bold text-heading md:text-5xl lg:text-6xl"><span className="text-transparent bg-clip-text bg-gradient-to-r to-emerald-600 from-sky-400"></span> Your sessions </h2>
         {sessions.map((s) => (
        <div key={s.id} className="border p-3 mb-2">
          <p>{s.title}</p>
          <p>{s.date} - {s.time}</p>
          <p>Status: {s.is_booked ? "Booked" : "Available"}</p>
        </div>
      ))}
    </div>
  );
}
        
    
