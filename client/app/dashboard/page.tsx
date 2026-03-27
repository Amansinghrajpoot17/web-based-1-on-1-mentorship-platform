"use client"
import { useState,useEffect } from "react";
import { supabase } from "../lib/supabase";
export default function dashboard(){
    const[user,setuser]=useState("null")
    useEffect(()=>{
        const getuser=async()=>{
            const {data}= await supabase.auth.getUser()
            if(!data.user){
                window.location.href="/"

            }
            else{
                setuser(data.user)
            }
            
        }
        getuser();
    },[])
    return(
        <div className="p-10">
            <h1 className="text-x1 mb-4">Dashboard</h1>
            <p>Welcome {user?.email}</p>
        </div>
    )
}