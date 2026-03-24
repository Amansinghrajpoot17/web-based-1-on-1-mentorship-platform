import Image from "next/image";
import {  useState } from "react";
import { supabase } from "@/app/lib/supabase";
export default function Home() {
  const[email,setemail]=useState("")
  const [password, setPassword] = useState("");
  const signup=async()=>{
    
  }
}