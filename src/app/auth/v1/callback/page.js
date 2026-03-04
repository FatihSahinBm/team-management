"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTeamStore } from "@/store/useTeamStore";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const setUser = useTeamStore((state) => state.setUser);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Supabase will automatically process the hash fragment containing the session.
    // We just need to wait for it or explicitly request the session.
    let isMounted = true;
    let authListener = null;

    const processSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        if (sessionError) {
          throw sessionError;
        }

        const handleSessionTokens = async (activeSession) => {
            if (activeSession?.provider_token) {
                // Save the Google provider token and refresh token to our database
                // We use upsert so it updates existing rows
                await supabase.from('user_tokens').upsert({
                    user_id: activeSession.user.id,
                    email: activeSession.user.email,
                    provider_token: activeSession.provider_token,
                    provider_refresh_token: activeSession.provider_refresh_token || null, // Might be null on subsequent logins if prompt='consent' wasn't used
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' }).catch(err => console.error("Token upsert error:", err));
            }
        };

        if (session) {
          await handleSessionTokens(session);
          setUser(session.user);
          router.push("/dashboard");
        } else {
          // Listen for onAuthStateChange in case it takes a moment
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
              if (newSession) {
                await handleSessionTokens(newSession);
                setUser(newSession.user);
                router.push("/dashboard");
              } else if (event === "SIGNED_OUT") {
                router.push("/");
              }
            }
          );
          authListener = subscription;
        }
      } catch (err) {
        console.error("Auth callback error:", err);
        if (isMounted) {
            setError("Giriş yapılırken bir hata oluştu: " + err.message);
            setTimeout(() => router.push("/"), 3000);
        }
      }
    };

    processSession();

    return () => {
      isMounted = false;
      if (authListener) {
        authListener.unsubscribe();
      }
    };
  }, [router, setUser]);

  if (error) {
    return (
      <div className="flex-center" style={{ minHeight: "100vh", flexDirection: 'column', gap: '1rem' }}>
        <p style={{ color: "var(--danger)" }}>{error}</p>
        <p className="text-muted" style={{ fontSize: "0.875rem" }}>Ana sayfaya yönlendiriliyorsunuz...</p>
      </div>
    );
  }

  return (
    <div className="flex-center" style={{ minHeight: "100vh", flexDirection: 'column', gap: '1rem' }}>
      <Loader2 className="animate-spin" size={48} color="var(--primary)" />
      <p className="text-muted">Giriş işlemi tamamlanıyor...</p>
    </div>
  );
}
