"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTeamStore } from "@/store/useTeamStore";
import { X, Loader2, KeyRound } from "lucide-react";

export default function JoinTeamModal({ isOpen, onClose, onSuccess }) {
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const user = useTeamStore((state) => state.user);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Find the team by code
            const { data: teamData, error: findError } = await supabase
                .from('teams')
                .select('*')
                .eq('code', code.toUpperCase())
                .single();

            if (findError) throw new Error("Bu koda sahip bir ekip bulunamadı.");
            if (!teamData) throw new Error("Ekip bulunamadı.");

            // 2. Insert into team_members
            const { error: joinError } = await supabase
                .from('team_members')
                .insert([{
                    team_id: teamData.id,
                    user_id: user.id,
                    role: 'member',
                    user_email: user.email
                }]);

            if (joinError) {
                if (joinError.code === '23505') {
                    throw new Error("Zaten bu ekibe üyesiniz.");
                }
                throw joinError;
            }

            onSuccess(teamData);
            onClose();
            setCode("");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content animate-fade-in">
                <button
                    onClick={onClose}
                    className="btn-icon-small"
                    style={{ position: 'absolute', top: 20, right: 20, border: 'none', background: 'transparent' }}
                >
                    <X size={24} />
                </button>

                <div className="flex-center mb-6">
                    <div className="btn-icon-small" style={{ width: 64, height: 64, background: "rgba(168, 85, 247, 0.1)", borderColor: "var(--secondary)" }}>
                        <KeyRound size={32} color="var(--secondary)" />
                    </div>
                </div>

                <h2 className="text-center mb-2">Ekibe Katıl</h2>
                <p className="text-muted text-center mb-6">Size verilen 6 haneli kod ile mevcut bir ekibe katılın.</p>

                {error && (
                    <div className="mb-4 p-3 rounded-xl text-center" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", color: "var(--danger)", border: "1px solid rgba(239, 68, 68, 0.2)", fontSize: "0.875rem" }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex-col gap-4">
                    <input
                        type="text"
                        placeholder="Ekip Kodu (Örn: AB12C3)"
                        className="input-field text-center font-bold"
                        style={{ letterSpacing: '2px', fontSize: '1.2rem' }}
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        required
                        autoFocus
                    />

                    <button type="submit" className="btn-primary mt-2" style={{ background: "linear-gradient(135deg, var(--secondary) 0%, var(--accent) 100%)" }} disabled={loading}>
                        {loading ? <Loader2 className="animate-spin mx-auto" size={24} /> : "Katıl"}
                    </button>
                </form>
            </div>
        </div>
    );
}
