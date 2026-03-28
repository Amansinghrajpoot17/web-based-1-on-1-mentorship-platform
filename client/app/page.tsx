"use client"
import Image from "next/image";
import React, {  useState } from "react";
import { supabase } from "@/app/lib/supabase";
export default function AuthPage() {
  const[isLogin, setIsLogin]=useState(true)
  const[form, setForm]=useState({
    name:"",
    email:"",
    password:""
  });
  const handleChange=(e:React.ChangeEvent<HTMLInputElement>)=>{
    setForm({
      ...form,
      [e.target.name]:e.target.value,
    });
  };
  
  const [role, setrole]=useState("")
const handleSubmit= async()=>{
  const{name, email,password}=form;
  if (isLogin) {
    const{error}= await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if(error){
      return alert(error.message)
    }
      const {data: userData}=await supabase.auth.getUser()
      const user=userData.user;
      const{data,error:roleError}=await supabase.from("profiles").select("role").eq("id",user?.id).single();
      if(roleError){
        return alert(roleError.message)
      }
        setrole(data.role);
        window.location.href="/dashboard";
  } else {
    const{data,error}=await supabase.auth.signUp({
      email,
      password,
    });
    if(error){
      return alert(error.message)
    }
  } 

}
return(
 <div className="min-h-screen flex">
      
      {/* LEFT SIDE */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-indigo-600 to-purple-700 text-white flex-col justify-center items-center p-10">
        <h1 className="text-4xl font-bold mb-4">MentorConnect</h1>
        <p className="text-lg opacity-80 text-center max-w-md">
          Connect with industry experts, learn faster, and grow your career 🚀
        </p>

        <div className="mt-10 w-60 h-60 bg-white/10 rounded-full blur-2xl"></div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex w-full md:w-1/2 items-center justify-center bg-gray-100">
        
        <div className="backdrop-blur-lg bg-white/70 p-8 rounded-2xl shadow-2xl w-[380px]">
          
          {/* Toggle */}
          <div className="flex mb-6 bg-gray-200 rounded-full p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`w-1/2 py-2 rounded-full transition ${
                isLogin ? "bg-indigo-600 text-white" : "text-gray-600"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`w-1/2 py-2 rounded-full transition ${
                !isLogin ? "bg-indigo-600 text-white" : "text-gray-600"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-semibold text-center mb-4">
            {isLogin ? "Welcome Back 👋" : "Join the Platform 🚀"}
          </h2>

          {/* Role Selector */}
          <div className="flex gap-2 mb-4">
            {["student", "mentor"].map((r) => (
              <button
                key={r}
                onClick={() => setrole(r)}
                className={`flex-1 py-2 rounded-full border text-sm transition ${
                  role === r
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                    : "border-gray-300 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {r === "student" ? "🎓 Student" : "🧑‍🏫 Mentor"}
              </button>
            ))}
          </div>

          {/* Form */}
          <form className="flex flex-col gap-4">
            {!isLogin && (
              <input
                type="text"
                placeholder="Full Name"
                className="border p-3 rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none"
              />
            )}

            <input
              type="email"
              placeholder="Email"
              className="border p-3 rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none"
            />

            <input
              type="password"
              placeholder="Password"
              className="border p-3 rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none"
            />

            <button className="bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-medium shadow-md">
              {isLogin ? "Login" : "Create Account"}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm mt-4 text-gray-500">
            {isLogin ? "New here?" : "Already registered?"}
            <span
              onClick={() => setIsLogin(!isLogin)}
              className="text-indigo-600 cursor-pointer ml-1 font-medium"
            >
              {isLogin ? "Sign Up" : "Login"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}