"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTeamStore } from "@/store/useTeamStore";
import Auth from "@/components/Auth";
import { Loader2 } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const setUser = useTeamStore((state) => state.setUser);
  const user = useTeamStore((state) => state.user);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        router.push("/dashboard");
      } else {
        setLoading(false);
      }
    };
    
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        router.push("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [router, setUser]);

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: "100vh" }}>
        <Loader2 className="animate-spin" size={48} color="var(--primary)" />
      </div>
    );
  }

  return (
    <main>
      <Auth />
    </main>
  );
}
