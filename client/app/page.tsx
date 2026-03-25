"use client"
import Image from "next/image";
import {  useState } from "react";
import { supabase } from "@/app/lib/supabase";
export default function Home() {
  const[email,setemail]=useState("")
  const [password, setPassword] = useState("");
  const signup=async()=>{
    
    const{data, error}=await supabase.auth.signUp({
      email,
      password
    });
    if (error)  {
     alert (error?.message)
     return;
    } 
    if(data.user){
     ([
      {
        id:data.user.id,
        email:data.user.email,
        
      },
      
      
     ]);
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
  const [role, setrole]=useState("student")
  return(
    <div className="p-10 ">
      
      <h1 className="text-xl mb-4">Auth</h1>
      <form 
      onSubmit={(e)=>{
        e.preventDefault()
        signup();
      }}
      >
      <input className="border p-2 block mb-2"
      placeholder="email"
      autoComplete="email"
      onChange={(e)=> setemail(e.target.value)} />
      <input className="border p-2 block mb-2"
      type="password"
      placeholder="password"
      autoComplete="current-password"
      onChange={(e)=>setPassword(e.target.value)} />
      <div className="inline-flex space-x-4">
<button 

className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded">Sign up</button>
<button
onClick={SignIN}
className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 border-b-4 border-green-700 hover:border-green-500 rounded"
>LOGIN</button>
<select className="border p-2 block mb-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" value={role} onChange={(e) => setrole(e.target.value)}>
  <option value="student">Student</option>
  <option value="mentor">Mentor</option>
  
</select>
</div>

</form>
 
 </div>
  )

}
