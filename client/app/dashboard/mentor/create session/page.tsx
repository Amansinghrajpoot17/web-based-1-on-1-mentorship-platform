"use client";
import { useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { useRouter } from "next/navigation";
import { title } from "process";
import { time } from "console";
export default function CreateSession(){
 const [form, setform]= useState({
    title:"",
    description:"",
    Date:"",
    time:"",
 });
 const router= useRouter();
 const handleChange=(e:any)=>{
    setform({...form,[e.target.name]:e.target.value})

 };
 const handleCreate=async()=>{
   const {data:userData}= await supabase.auth.getUser();
   const user= userData.user;
   if(!user){
      return alert("please login to create a session");
   }
   const {error}= await supabase.from("sessions").insert([{
     mentor_id:user.id,
     ...form,
   },]);
   if(error){
      console.log("error", error);
      return alert("error crreating session");
      
   }
   alert("session created successfully");
   router.push("/dashboard/mentor/sessions");
   
 }
 return(
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Create Session</h1>

      <input name="title" placeholder="Title" onChange={handleChange} className="border p-2 mb-2 w-full" />
      <textarea name="description" placeholder="Description" onChange={handleChange} className="border p-2 mb-2 w-full" />
      <input type="date" name="date" onChange={handleChange} className="border p-2 mb-2 w-full" />
      <input type="time" name="time" onChange={handleChange} className="border p-2 mb-2 w-full" />

      <button onClick={handleCreate} className="bg-indigo-600 text-white px-4 py-2 rounded">
        Create
      </button>
    </div>
 )
}
