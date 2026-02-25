"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTeamStore } from "@/store/useTeamStore";
import { X, Loader2, Users } from "lucide-react";

export default function CreateTeamModal({ isOpen, onClose, onSuccess }) {
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const user = useTeamStore((state) => state.user);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Generate a quick random code
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();

        try {
            // 1. Insert into teams table
            const { data: teamData, error: teamError } = await supabase
                .from('teams')
                .insert([{ name, code, admin_id: user.id }])
                .select()
                .single();

            if (teamError) throw teamError;

            // 2. Insert admin into team_members
            const { error: memberError } = await supabase
                .from('team_members')
                .insert([{
                    team_id: teamData.id,
                    user_id: user.id,
                    role: 'admin',
                    user_email: user.email
                }]);

            if (memberError) throw memberError;

            onSuccess(teamData);
            onClose();
            setName("");
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
                    <div className="btn-icon-small" style={{ width: 64, height: 64, background: "rgba(99, 102, 241, 0.1)", borderColor: "var(--primary)" }}>
                        <Users size={32} color="var(--primary)" />
                    </div>
                </div>

                <h2 className="text-center mb-2">Yeni Ekip Oluştur</h2>
                <p className="text-muted text-center mb-6">Projeniz için yeni bir çalışma alanı başlatın.</p>

                {error && (
                    <div className="mb-4 p-3 rounded-xl text-center" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", color: "var(--danger)", border: "1px solid rgba(239, 68, 68, 0.2)", fontSize: "0.875rem" }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex-col gap-4">
                    <input
                        type="text"
                        placeholder="Ekip Adı (Örn: Frontend Takımı)"
                        className="input-field"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        autoFocus
                    />

                    <button type="submit" className="btn-primary mt-2" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin mx-auto" size={24} /> : "Oluştur"}
                    </button>
                </form>
            </div>
        </div>
    );
}
