"use client"
import Image from "next/image";
import {  useState } from "react";
import { supabase } from "@/app/lib/supabase";
export default function Home() {
  const[email,setemail]=useState("")
  const [password, setPassword] = useState("");
  const signup=async()=>{
    const{error}=await supabase.auth.signUp({
      email,
      password
    });
    if (error)  {
     alert (error?.message)
    } else {
      alert("check your email")
    }
  }
  const SignIN= async()=>{
    const{error}=await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) {
      alert(error.message)
    } else {
      alert("Login Successfully")
    }
  }
  return(
    <div className="p-10">
      <h1 className="text xl mb-4">Auth</h1>
      <form >
      <input className="border p-2 block mb-2"
      placeholder="email"
      onChange={(e)=> setemail(e.target.value)} />
      <input className="border p-2 block mb-2"
      type="password"
      onChange={(e)=>setPassword(e.target.value)} />
<button 
onClick={signup}
className="bg-green-500 text-white px--4 py-2">Sign up</button>

 
<button
onClick={SignIN}
className="bg-blue-500 text-white px--4 py-2"
>LOGIN</button>
</form>

    </div>
  )
}