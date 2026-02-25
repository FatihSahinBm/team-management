"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { X, Loader2, Calendar } from "lucide-react";

export default function TaskAssignmentModal({ isOpen, onClose, onSuccess, teamId, userId, userName }) {
    const [title, setTitle] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error: insertError } = await supabase
                .from('tasks')
                .insert([{
                    team_id: teamId,
                    user_id: userId,
                    title,
                    due_date: dueDate
                }]);

            if (insertError) throw insertError;

            onSuccess();
            onClose();
            setTitle("");
            setDueDate("");
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
                    <div className="btn-icon-small" style={{ width: 64, height: 64, background: "rgba(236, 72, 153, 0.1)", borderColor: "var(--accent)" }}>
                        <Calendar size={32} color="var(--accent)" />
                    </div>
                </div>

                <h2 className="text-center mb-2">Görev Ata</h2>
                <p className="text-muted text-center mb-6">
                    <strong style={{ color: "var(--text-main)" }}>{userName}</strong> adlı kullanıcıya yeni bir görev atıyorsunuz.
                </p>

                {error && (
                    <div className="mb-4 p-3 rounded-xl text-center" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", color: "var(--danger)", border: "1px solid rgba(239, 68, 68, 0.2)", fontSize: "0.875rem" }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex-col gap-4">
                    <div>
                        <label className="text-muted mb-2" style={{ display: "block", fontSize: "0.875rem" }}>Görev Başlığı</label>
                        <input
                            type="text"
                            placeholder="Örn: Frontend UI Tasarımını Bitir"
                            className="input-field"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="text-muted mb-2" style={{ display: "block", fontSize: "0.875rem" }}>Bitiş Tarihi</label>
                        <input
                            type="date"
                            className="input-field"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            required
                            min={new Date().toISOString().split("T")[0]} // Disable past dates
                        />
                    </div>

                    <button type="submit" className="btn-primary mt-4" style={{ background: "linear-gradient(135deg, var(--accent) 0%, var(--secondary) 100%)" }} disabled={loading}>
                        {loading ? <Loader2 className="animate-spin mx-auto" size={24} /> : "Görevi Ata"}
                    </button>
                </form>
            </div>
        </div>
    );
}
