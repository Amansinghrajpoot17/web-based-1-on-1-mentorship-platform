"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { useRouter, usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      // ❌ Not logged in
      if (!user) {
        router.push("/");
        return;
      }

      // ✅ Get role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      const role = profile?.role;

      // ❌ If user tries wrong dashboard
      if (pathname.includes("mentor") && role !== "mentor") {
        router.push("/dashboard/student");
      }

      if (pathname.includes("student") && role !== "student") {
        router.push("/dashboard/mentor");
      }

      setLoading(false);
    };

    checkUser();
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        Checking access...
      </div>
    );
  }

  return <>{children}</>;
}