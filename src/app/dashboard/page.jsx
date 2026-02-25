"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useTeamStore } from "@/store/useTeamStore";
import CreateTeamModal from "@/components/CreateTeamModal";
import JoinTeamModal from "@/components/JoinTeamModal";
import { Plus, Key, LogOut, Users, ArrowRight, Loader2, Crown } from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
    const router = useRouter();
    const user = useTeamStore((state) => state.user);
    const logout = useTeamStore((state) => state.logout);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isJoinOpen, setIsJoinOpen] = useState(false);

    // Redirect if not logged in
    useEffect(() => {
        if (!user) {
            router.push("/");
        }
    }, [user, router]);

    // Fetch teams the user is member of
    const { data: teams, isLoading, error, refetch } = useQuery({
        queryKey: ['teams', user?.id],
        queryFn: async () => {
            const { data, error: fetchError } = await supabase
                .from('team_members')
                .select(`
          role,
          teams (
            id,
            name,
            code,
            admin_id
          )
        `)
                .eq('user_id', user.id);

            if (fetchError) throw fetchError;
            return (data || []).map(item => ({ ...item.teams, myRole: item.role }));
        },
        enabled: !!user,
    });

    const handleLogout = async () => {
        await supabase.auth.signOut();
        logout();
        router.push("/");
    };

    if (!user) return null;

    return (
        <div className="dashboard-container">
            <header className="flex-between mb-8">
                <div>
                    <h1 className="text-gradient" style={{ fontSize: "2rem" }}>Ekiplerim</h1>
                    <p className="text-muted mt-2">Çalışma alanlarınızı buradan yönetin.</p>
                </div>

                <div className="flex-center gap-4">
                    <div className="glass-panel" style={{ padding: "8px 16px", borderRadius: "20px" }}>
                        <span className="text-muted" style={{ fontSize: "0.875rem" }}>{user.email}</span>
                    </div>
                    <button onClick={handleLogout} className="btn-icon-small" title="Çıkış Yap" style={{ border: 'none', background: 'transparent' }}>
                        <LogOut size={20} className="text-muted" />
                    </button>
                </div>
            </header>

            <div className="grid-2 mb-12">
                <div
                    className="glass-panel"
                    style={{ padding: "32px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", borderStyle: "dashed", borderColor: "var(--primary)" }}
                    onClick={() => setIsCreateOpen(true)}
                >
                    <div className="btn-icon-small mb-4" style={{ width: 56, height: 56, background: "rgba(99, 102, 241, 0.1)", borderColor: "var(--primary)" }}>
                        <Plus size={28} color="var(--primary)" />
                    </div>
                    <h3>Yeni Ekip Oluştur</h3>
                    <p className="text-muted mt-2" style={{ fontSize: "0.9rem" }}>Takımınız için sıfırdan bir alan yaratın.</p>
                </div>

                <div
                    className="glass-panel"
                    style={{ padding: "32px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", borderStyle: "dashed", borderColor: "var(--secondary)" }}
                    onClick={() => setIsJoinOpen(true)}
                >
                    <div className="btn-icon-small mb-4" style={{ width: 56, height: 56, background: "rgba(168, 85, 247, 0.1)", borderColor: "var(--secondary)" }}>
                        <Key size={28} color="var(--secondary)" />
                    </div>
                    <h3>Ekibe Katıl</h3>
                    <p className="text-muted mt-2" style={{ fontSize: "0.9rem" }}>Size verilen 6 haneli davet kodunu girin.</p>
                </div>
            </div>

            <div className="teams-list">
                <h2 className="mb-6" style={{ fontSize: "1.5rem" }}>Aktif Ekiplerim</h2>

                {isLoading ? (
                    <div className="flex-center" style={{ padding: "40px" }}>
                        <Loader2 className="animate-spin text-primary" size={32} color="var(--primary)" />
                    </div>
                ) : error ? (
                    <div className="p-4 rounded-xl" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", color: "var(--danger)", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                        Ekipler yüklenirken bir sorun oluştu: {error.message}
                    </div>
                ) : !teams || teams.length === 0 ? (
                    <div className="glass-panel" style={{ padding: "40px", textAlign: "center" }}>
                        <Users size={48} color="var(--text-muted)" style={{ opacity: 0.5, margin: "0 auto 16px" }} />
                        <p className="text-muted">Henüz hiçbir ekibe dahil değilsiniz.</p>
                    </div>
                ) : (
                    <div className="grid-2">
                        {teams.map(team => (
                            <div key={team.id} className="glass-panel task-card" style={{ padding: "24px", flexDirection: "column", alignItems: "flex-start", gap: "16px", position: "relative" }}>
                                <div className="flex-between" style={{ width: "100%" }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div className="btn-icon-small" style={{ pointerEvents: 'none' }}>
                                            {team.myRole === 'admin' ? <Crown size={18} color="var(--warning)" /> : <Users size={18} color="var(--primary)" />}
                                        </div>
                                        <h3 style={{ fontSize: "1.25rem", margin: 0 }}>{team.name}</h3>
                                    </div>
                                    {team.myRole === 'admin' ? (
                                        <div className="flex-center gap-2">
                                            <span className="badge badge-admin">Yönetici</span>
                                            <button
                                                onClick={async (e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    if (confirm("Bu ekibi silmek istediğinize emin misiniz? Tüm üyeler ve görevler silinecektir.")) {
                                                        await supabase.from('teams').delete().eq('id', team.id);
                                                        refetch();
                                                    }
                                                }}
                                                className="btn-icon-small"
                                                title="Ekibi Sil"
                                                style={{ width: "28px", height: "28px", borderColor: "var(--danger)", color: "var(--danger)", background: "rgba(239, 68, 68, 0.1)" }}
                                            >
                                                <LogOut size={14} style={{ transform: "rotate(180deg)" }} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={async (e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (confirm("Bu ekipten ayrılmak istediğinize emin misiniz?")) {
                                                    await supabase.from('team_members').delete().match({ team_id: team.id, user_id: user.id });
                                                    refetch();
                                                }
                                            }}
                                            className="btn-icon-small"
                                            title="Ekipten Ayrıl"
                                            style={{ width: "28px", height: "28px", borderColor: "var(--warning)", color: "var(--warning)", background: "rgba(245, 158, 11, 0.1)" }}
                                        >
                                            <LogOut size={14} />
                                        </button>
                                    )}
                                </div>

                                <div className="flex-between mt-2" style={{ width: "100%", padding: "12px", background: "rgba(0,0,0,0.2)", borderRadius: "12px" }}>
                                    <span className="text-muted" style={{ fontSize: "0.875rem" }}>Ekip Kodu</span>
                                    <strong style={{ letterSpacing: "1px", color: "var(--text-main)" }}>{team.code}</strong>
                                </div>

                                <Link href={`/team/${team.id}`} className="flex-between mt-auto pt-2" style={{ width: "100%", borderTop: "1px solid var(--border-glass)", textDecoration: "none" }}>
                                    <span className="text-muted" style={{ fontSize: "0.875rem" }}>Panoya Git</span>
                                    <ArrowRight size={18} color="var(--primary)" />
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <CreateTeamModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSuccess={() => refetch()}
            />

            <JoinTeamModal
                isOpen={isJoinOpen}
                onClose={() => setIsJoinOpen(false)}
                onSuccess={() => refetch()}
            />
        </div>
    );
}
