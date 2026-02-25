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

                    <button type="submit" className="btn-primary mt-4 flex-center gap-2" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? "Giriş Yap" : "Kayıt Ol")}
                        {!loading && <ArrowRight size={18} />}
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
