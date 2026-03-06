"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTeamStore } from "@/store/useTeamStore";
import TaskAssignmentModal from "@/components/TaskAssignmentModal";
import MemberStatsModal from "@/components/MemberStatsModal";
import { Users, Crown, Calendar, CheckCircle, Clock, Plus, ArrowLeft, Loader2, Key, Trash2, UserMinus } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export default function TeamDetailPage() {
    const router = useRouter();
    const params = useParams();
    const teamId = params.id;
    const user = useTeamStore((state) => state.user);

    const [assignmentModal, setAssignmentModal] = useState({
        isOpen: false,
        userId: null,
        userName: ""
    });

    const [statsModal, setStatsModal] = useState({
        isOpen: false,
        userName: "",
        userEmail: "",
        memberTasks: []
    });

    useEffect(() => {
        if (!user) {
            router.push("/");
        }
    }, [user, router]);

    // Fetch Team Info
    const { data: team, isLoading: teamLoading, error: teamError } = useQuery({
        queryKey: ['team', teamId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('teams')
                .select('*')
                .eq('id', teamId)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: !!teamId,
    });

    // Fetch Team Members
    const { data: members, isLoading: membersLoading, refetch: refetchMembers } = useQuery({
        queryKey: ['team_members', teamId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('team_members')
                .select('*')
                .eq('team_id', teamId);
            if (error) throw error;
            return data;
        },
        enabled: !!teamId,
    });

    // Fetch Tasks
    const { data: tasks, isLoading: tasksLoading, refetch: refetchTasks } = useQuery({
        queryKey: ['team_tasks', teamId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('team_id', teamId)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        },
        enabled: !!teamId,
    });

    if (!user || teamLoading || membersLoading || tasksLoading) {
        return (
            <div className="flex-center" style={{ minHeight: "100vh" }}>
                <Loader2 className="animate-spin text-primary" size={48} color="var(--primary)" />
            </div>
        );
    }

    if (teamError) {
        return (
            <div className="dashboard-container">
                <Link href="/dashboard" className="btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
                    <ArrowLeft size={18} /> Geri Dön
                </Link>
                <div className="p-4 rounded-xl" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", color: "var(--danger)", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                    Takım bilgisi alınamadı veya bu takıma erişiminiz yok.
                </div>
            </div>
        );
    }

    const isAdmin = team.admin_id === user.id;

    // Group tasks by user
    const tasksByUser = tasks?.reduce((acc, task) => {
        if (!acc[task.user_id]) acc[task.user_id] = [];
        acc[task.user_id].push(task);
        return acc;
    }, {}) || {};

    const handleStatusChange = async (taskId, newStatus) => {
        try {
            const { error } = await supabase
                .from('tasks')
                .update({ status: newStatus })
                .eq('id', taskId);

            if (error) throw error;
            refetchTasks();
        } catch (err) {
            alert("Görev güncellenirken bir hata oluştu: " + err.message);
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm("Bu görevi silmek istediğinize emin misiniz?")) {
            return;
        }

        try {
            // 1. Delete from Supabase
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', taskId);

            if (error) throw error;

            refetchTasks();
        } catch (err) {
            alert("Görev silinirken bir hata oluştu: " + err.message);
        }
    };

    const handleRemoveMember = async (memberId, memberEmail) => {
        if (!window.confirm(`${memberEmail} kullanıcısını ekipten çıkarmak istediğinize emin misiniz?`)) {
            return;
        }

        try {
            const { error } = await supabase
                .from('team_members')
                .delete()
                .match({ team_id: teamId, user_id: memberId });

            if (error) throw error;

            refetchMembers();
            // İsteğe bağlı: Üyenin task'larını silmek ya da pending'e çevirmek.
            // Orijinal istekte sadece çıkarma istendiği için sadece ekipten çıkarıyoruz.
        } catch (err) {
            alert("Üye çıkarılırken bir hata oluştu: " + err.message);
        }
    };

    const statusMap = {
        'pending': { label: 'Bekliyor', color: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.2)' },
        'in-progress': { label: 'Devam Ediyor', color: 'var(--primary)', bg: 'rgba(99, 102, 241, 0.2)' },
        'completed': { label: 'Tamamlandı', color: 'var(--success)', bg: 'rgba(16, 185, 129, 0.2)' }
    };

    return (
        <div className="dashboard-container">
            <Link href="/dashboard" className="text-muted flex-center" style={{ display: "inline-flex", gap: "8px", marginBottom: "24px", transition: "color 0.2s" }}>
                <ArrowLeft size={18} /> <span style={{ fontSize: "0.9rem" }}>Dashboard'a Dön</span>
            </Link>

            <header className="glass-panel flex-between mb-8" style={{ padding: "32px" }}>
                <div>
                    <h1 className="text-gradient" style={{ fontSize: "2.5rem", marginBottom: "8px" }}>{team.name}</h1>
                    <div className="flex-center" style={{ justifyContent: "flex-start", gap: "16px" }}>
                        <span className="badge badge-primary flex-center gap-2" style={{ background: "rgba(255,255,255,0.05)" }}>
                            <Key size={14} /> Davet Kodu: <strong style={{ letterSpacing: "2px" }}>{team.code}</strong>
                        </span>
                        <span className="badge flex-center gap-2" style={{ background: "rgba(255,255,255,0.05)" }}>
                            <Users size={14} /> {members?.length || 0} Üye
                        </span>
                        {isAdmin && (
                            <span className="badge badge-admin flex-center gap-2">
                                <Crown size={14} /> Yönetici
                            </span>
                        )}
                    </div>
                </div>
            </header>

            <div className="mb-6">
                <h2 style={{ fontSize: "1.5rem", marginBottom: "16px" }}>Ekip Üyeleri ve Görevler</h2>
                <div className="grid-2">
                    {members?.map(member => {
                        const memberTasks = tasksByUser[member.user_id] || [];
                        const isMemberAdmin = member.user_id === team.admin_id;
                        const isMe = member.user_id === user.id;

                        return (
                            <div key={member.id} className="glass-panel" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px", alignSelf: "start" }}>
                                <div className="flex-between" style={{ borderBottom: "1px solid var(--border-glass)", paddingBottom: "16px" }}>
                                    <div
                                        style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flex: 1 }}
                                        onClick={() => setStatsModal({
                                            isOpen: true,
                                            userName: member.user_email?.split('@')[0] || 'Kullanıcı',
                                            userEmail: member.user_email,
                                            memberTasks: memberTasks
                                        })}
                                        title="Kullanıcı istatistiklerini gör"
                                    >
                                        <div className="btn-icon-small" style={{ pointerEvents: 'none', background: isMemberAdmin ? "var(--warning)" : "var(--bg-glass)", borderColor: isMemberAdmin ? "var(--warning)" : "var(--border-glass)", color: isMemberAdmin ? "black" : "white" }}>
                                            {isMemberAdmin ? <Crown size={16} /> : <Users size={16} />}
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: "1.1rem", transition: "color 0.2s" }} className="hover-text-primary">
                                                {member.user_email ? member.user_email.split('@')[0] : 'Kullanıcı'}
                                                {isMe && <span className="text-muted" style={{ fontSize: "0.8rem", marginLeft: "8px" }}>(Sen)</span>}
                                            </h3>
                                            <span className="text-muted" style={{ fontSize: "0.8rem" }}>{member.user_email}</span>
                                        </div>
                                    </div>

                                    {isAdmin && !isMemberAdmin && (
                                        <div style={{ display: "flex", gap: "8px" }}>
                                            <button
                                                className="btn-icon-small"
                                                title="Görev Ata"
                                                style={{ background: "var(--primary)", borderColor: "var(--primary)", color: "white" }}
                                                onClick={() => setAssignmentModal({
                                                    isOpen: true,
                                                    userId: member.user_id,
                                                    userName: member.user_email?.split('@')[0] || 'Kullanıcı',
                                                    userEmail: member.user_email
                                                })}
                                            >
                                                <Plus size={20} />
                                            </button>
                                            <button
                                                className="btn-icon-small"
                                                title="Üyeyi Çıkar"
                                                style={{ background: "rgba(239, 68, 68, 0.1)", borderColor: "transparent", color: "var(--danger)" }}
                                                onClick={() => handleRemoveMember(member.user_id, member.user_email)}
                                            >
                                                <UserMinus size={20} />
                                            </button>
                                        </div>
                                    )}
                                    {isAdmin && isMemberAdmin && (
                                        <button
                                            className="btn-icon-small"
                                            title="Görev Ata"
                                            style={{ background: "var(--primary)", borderColor: "var(--primary)", color: "white" }}
                                            onClick={() => setAssignmentModal({
                                                isOpen: true,
                                                userId: member.user_id,
                                                userName: member.user_email?.split('@')[0] || 'Kullanıcı',
                                                userEmail: member.user_email
                                            })}
                                        >
                                            <Plus size={20} />
                                        </button>
                                    )}
                                </div>

                                <div className="tasks-container" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                    <h4 className="text-muted" style={{ fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "8px" }}>
                                        <Calendar size={14} /> Atanan Görevler ({memberTasks.length})
                                    </h4>

                                    {memberTasks.length === 0 ? (
                                        <div style={{ padding: "16px", textAlign: "center", background: "rgba(0,0,0,0.2)", borderRadius: "12px" }}>
                                            <span className="text-muted" style={{ fontSize: "0.85rem" }}>Henüz görev atanmamış.</span>
                                        </div>
                                    ) : (
                                        memberTasks.map(task => {
                                            const isOverdue = task.status !== 'completed' && new Date(task.due_date) < new Date(new Date().toDateString());

                                            return (
                                                <div key={task.id} style={{
                                                    padding: "16px",
                                                    background: isOverdue ? "rgba(239, 68, 68, 0.15)" : "rgba(255,255,255,0.03)",
                                                    border: isOverdue ? "1px solid rgba(239, 68, 68, 0.5)" : "1px solid var(--border-glass)",
                                                    borderRadius: "12px",
                                                    transition: "all 0.3s",
                                                    position: "relative"
                                                }}>
                                                    {isOverdue && (
                                                        <div style={{
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            gap: "6px",
                                                            background: "rgba(239, 68, 68, 0.9)",
                                                            color: "#fff",
                                                            fontSize: "0.7rem",
                                                            fontWeight: "700",
                                                            padding: "4px 10px",
                                                            borderRadius: "6px",
                                                            marginBottom: "10px",
                                                            letterSpacing: "0.5px",
                                                            animation: "pulse 2s infinite"
                                                        }}>
                                                            ⚠ Görev Tarihi Geçti
                                                        </div>
                                                    )}
                                                    <div className="flex-between mb-2">
                                                        <h5 style={{ fontSize: "1rem", fontWeight: "500", lineHeight: "1.4", paddingRight: "8px" }}>{task.title}</h5>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                            {(isAdmin || isMe) && (
                                                                <select
                                                                    onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                                                    style={{
                                                                        background: statusMap[task.status].bg,
                                                                        color: statusMap[task.status].color,
                                                                        border: `1px solid ${statusMap[task.status].color}`,
                                                                        borderRadius: "8px",
                                                                        padding: "4px 8px",
                                                                        fontSize: "0.75rem",
                                                                        fontWeight: "600",
                                                                        outline: "none",
                                                                        cursor: "pointer"
                                                                    }}
                                                                >
                                                                    <option value="pending">Bekliyor</option>
                                                                    <option value="in-progress">Devam Ediyor</option>
                                                                    <option value="completed">Tamamlandı</option>
                                                                </select>
                                                            )}
                                                            {!isAdmin && !isMe && (
                                                                <span className="badge" style={{ background: statusMap[task.status].bg, color: statusMap[task.status].color, border: `1px solid ${statusMap[task.status].color}` }}>
                                                                    {statusMap[task.status].label}
                                                                </span>
                                                            )}
                                                            {isAdmin && (
                                                                <button
                                                                    onClick={() => handleDeleteTask(task.id)}
                                                                    className="btn-icon-small"
                                                                    title="Görevi Sil"
                                                                    style={{
                                                                        background: "rgba(239, 68, 68, 0.1)",
                                                                        borderColor: "transparent",
                                                                        color: "var(--danger)",
                                                                        padding: "6px",
                                                                        width: "auto",
                                                                        height: "auto",
                                                                        justifyContent: "center"
                                                                    }}
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex-center" style={{ justifyContent: "flex-start", gap: "8px" }}>
                                                        <Clock size={14} color={isOverdue ? "rgba(239, 68, 68, 0.9)" : "var(--text-muted)"} />
                                                        <span style={{ fontSize: "0.85rem", color: isOverdue ? "rgba(239, 68, 68, 0.9)" : "var(--text-muted)", fontWeight: isOverdue ? "600" : "400" }}>
                                                            Bitiş: {format(new Date(task.due_date), "d MMM yyyy", { locale: tr })}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <TaskAssignmentModal
                isOpen={assignmentModal.isOpen}
                teamId={teamId}
                userId={assignmentModal.userId}
                userName={assignmentModal.userName}
                userEmail={assignmentModal.userEmail}
                onClose={() => setAssignmentModal({ ...assignmentModal, isOpen: false })}
                onSuccess={() => refetchTasks()}
            />

            <MemberStatsModal
                isOpen={statsModal.isOpen}
                onClose={() => setStatsModal({ ...statsModal, isOpen: false })}
                userName={statsModal.userName}
                userEmail={statsModal.userEmail}
                memberTasks={statsModal.memberTasks}
            />
        </div >
    );
}
