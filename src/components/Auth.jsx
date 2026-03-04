"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTeamStore } from "@/store/useTeamStore";
import { Mail, Lock, Loader2, ArrowRight } from "lucide-react";

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const router = useRouter();
    const setUser = useTeamStore((state) => state.setUser);

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                setUser(data.user);
                router.push("/dashboard");
            } else {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;

                // If email confirmation is enabled on Supabase, user session might be null.
                if (data?.user?.identities?.length === 0 || !data.session) {
                    setError("Kayıt başarılı! Lütfen giriş yapmadan önce e-posta adresinize gelen onay bağlantısına tıklayın.");
                    setIsLogin(true); // Switch to login screen
                } else {
                    setUser(data.user);
                    router.push("/dashboard");
                }
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card glass-panel animate-fade-in">
                <div className="text-center mb-8">
                    <div className="flex-center mb-4">
                        <div className="btn-icon-small" style={{ width: 48, height: 48, background: "var(--primary)", borderColor: "var(--primary)" }}>
                            <Lock size={24} color="white" />
                        </div>
                    </div>
                    <h2 className="text-gradient">Ekip Yönetim Sistemi</h2>
                    <p className="text-muted mt-2">
                        {isLogin ? "Hesabınıza giriş yapın" : "Yeni bir hesap oluşturun"}
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-xl" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", color: "var(--danger)", border: "1px solid rgba(239, 68, 68, 0.2)", fontSize: "0.875rem" }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleAuth} className="flex-col gap-4">
                    <div style={{ position: "relative" }}>
                        <Mail size={18} color="var(--text-muted)" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
                        <input
                            type="email"
                            placeholder="E-posta adresi"
                            className="input-field"
                            style={{ paddingLeft: 44 }}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div style={{ position: "relative" }}>
                        <Lock size={18} color="var(--text-muted)" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
                        <input
                            type="password"
                            placeholder="Şifre (min 6 karakter)"
                            className="input-field"
                            style={{ paddingLeft: 44 }}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>

                    <button type="submit" className="btn-primary mt-4 flex-center gap-2" disabled={loading} style={{ width: "100%" }}>
                        {loading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? "Giriş Yap" : "Kayıt Ol")}
                        {!loading && <ArrowRight size={18} />}
                    </button>

                    <div className="flex-center my-4" style={{ gap: "12px", width: "100%", opacity: 0.6 }}>
                        <div style={{ height: "1px", background: "var(--border-glass)", flex: 1 }}></div>
                        <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px" }}>veya</span>
                        <div style={{ height: "1px", background: "var(--border-glass)", flex: 1 }}></div>
                    </div>

                    <button
                        type="button"
                        className="btn-secondary flex-center gap-2"
                        style={{ width: "100%", background: "white", color: "#333", border: "none" }}
                        onClick={async () => {
                            try {
                                const { error } = await supabase.auth.signInWithOAuth({
                                    provider: 'google',
                                    options: {
                                        scopes: 'https://www.googleapis.com/auth/calendar.events',
                                        queryParams: {
                                            access_type: 'offline',
                                            prompt: 'consent',
                                        },
                                        // Use redirectTo to explicitly set the callback URL if needed.
                                        // Note: If accessing from a local IP (e.g. 192.168.x.x) instead of localhost,
                                        // that IP MUST be added to Supabase Dashboard -> Authentication -> URL Configuration -> Redirect URLs
                                        redirectTo: `${window.location.origin}/auth/v1/callback`
                                    }
                                });
                                if (error) throw error;
                            } catch (err) {
                                setError("Google ile giriş başarısız: " + err.message);
                            }
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M47.532 24.5528C47.532 22.9214 47.3997 21.2811 47.1175 19.6761H24.48V28.9181H37.4434C36.9055 31.8988 35.177 34.5356 32.6461 36.2111V42.2078H40.3801C44.9217 38.0278 47.532 31.8547 47.532 24.5528Z" fill="#4285F4" />
                            <path d="M24.48 48.0016C30.9525 48.0016 36.4116 45.8764 40.3888 42.2078L32.6549 36.2111C30.5031 37.675 27.7252 38.5039 24.4888 38.5039C18.2275 38.5039 12.9187 34.2798 11.0139 28.6006H3.03296V34.7825C7.10718 42.8868 15.4056 48.0016 24.48 48.0016Z" fill="#34A853" />
                            <path d="M11.0051 28.6006C9.99973 25.6199 9.99973 22.3922 11.0051 19.4115V13.2296H3.03296C-0.371021 20.0112 -0.371021 28.0009 3.03296 34.7825L11.0051 28.6006Z" fill="#FBBC05" />
                            <path d="M24.48 9.49932C27.9016 9.44641 31.2086 10.7339 33.6866 13.0973L40.5387 6.24523C36.2 2.17101 30.4418 -0.068932 24.48 0.00161733C15.4056 0.00161733 7.10718 5.11644 3.03296 13.2296L11.0051 19.4115C12.901 13.7235 18.2187 9.49932 24.48 9.49932Z" fill="#EA4335" />
                        </svg>
                        <span style={{ fontWeight: 600 }}>Google ile Giriş Yap</span>
                    </button>
                </form>

                <div className="text-center mt-6">
                    <button
                        type="button"
                        className="text-muted"
                        style={{ background: "none", border: "none", fontSize: "0.875rem", cursor: "pointer" }}
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError(null);
                        }}
                    >
                        {isLogin ? "Hesabınız yok mu? " : "Zaten hesabınız var mı? "}
                        <span style={{ color: "var(--secondary)", fontWeight: 600 }}>
                            {isLogin ? "Kayıt Ol" : "Giriş Yap"}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}
