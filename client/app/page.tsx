"use client";
import React, { useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();

  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState("student");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { name, email, password } = form;

    // ================= LOGIN =================
    if (isLogin) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        
      });

      if (error) return alert(error.message);

      const user = data.user;
      if (!user) return;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError) return alert("Error fetching profile");

      if (profile.role === "mentor") {
        router.push("/dashboard/mentor");
      } else {
        router.push("/dashboard/student");
      }
    }

    // ================= SIGNUP =================
    else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) return alert(error.message);

      if (data.user) {
        const { error: insertError } = await supabase.from("profiles").insert([
          {
            id: data.user.id,
            name,
            role,
            email,
          },
        ]);

        if (insertError) {
          console.log(insertError);
          return alert("Error saving user profile");
        }
      }

      alert("Signup successful! Now login.");
      setIsLogin(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-700">
      
      {/* LEFT */}
      <div className="hidden md:flex w-1/2 text-white flex-col justify-center items-center p-10">
        <h1 className="text-5xl font-bold mb-4">MentorConnect</h1>
        <p className="text-lg opacity-80 text-center max-w-md">
          Connect with industry experts, learn faster, and grow your career 🚀
        </p>
      </div>

      {/* RIGHT */}
      <div className="flex w-full md:w-1/2 items-center justify-center p-6">
        <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-[380px] border border-white/20">

          {/* Toggle */}
          <div className="flex mb-6 bg-white/20 rounded-full p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`w-1/2 py-2 rounded-full ${
                isLogin ? "bg-white text-indigo-600" : "text-white"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`w-1/2 py-2 rounded-full ${
                !isLogin ? "bg-white text-indigo-600" : "text-white"
              }`}
            >
              Sign Up
            </button>
          </div>

          <h2 className="text-xl text-white text-center mb-4">
            {isLogin ? "Welcome Back 👋" : "Create Account 🚀"}
          </h2>

          {/* Role */}
          <div className="flex gap-3 mb-4">
            {["student", "mentor"].map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`flex-1 py-2 rounded-full text-sm ${
                  role === r
                    ? "bg-white text-indigo-600"
                    : "bg-white/20 text-white"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {!isLogin && (
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={form.name}
                onChange={handleChange}
                className="p-3 rounded-lg bg-white/20 text-white placeholder-gray-300 outline-none"
              />
            )}

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              className="p-3 rounded-lg bg-white/20 text-white placeholder-gray-300 outline-none"
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className="p-3 rounded-lg bg-white/20 text-white placeholder-gray-300 outline-none"
            />

            <button className="bg-white text-indigo-600 py-3 rounded-lg font-semibold">
              {isLogin ? "Login" : "Sign Up"}
            </button>
          </form>

          <p className="text-center text-sm text-white mt-4">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <span
              onClick={() => setIsLogin(!isLogin)}
              className="ml-1 underline cursor-pointer"
            >
              {isLogin ? "Sign Up" : "Login"}
            </span>
          </p>

        </div>
      </div>
    </div>
  );
}