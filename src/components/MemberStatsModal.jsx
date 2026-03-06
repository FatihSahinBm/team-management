"use client";

import { X, CheckCircle, Clock, AlertCircle, TrendingUp } from "lucide-react";

export default function MemberStatsModal({ isOpen, onClose, userName, userEmail, memberTasks }) {
    if (!isOpen) return null;

    const totalTasks = memberTasks.length;
    const completedTasks = memberTasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = memberTasks.filter(t => t.status === 'in-progress').length;
    const pendingTasks = memberTasks.filter(t => t.status === 'pending').length;

    const completedPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const inProgressPercentage = totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0;
    const pendingPercentage = totalTasks > 0 ? Math.round((pendingTasks / totalTasks) * 100) : 0;

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
            <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                <button
                    onClick={onClose}
                    className="btn-icon-small"
                    style={{ position: 'absolute', top: 20, right: 20, border: 'none', background: 'transparent' }}
                >
                    <X size={24} />
                </button>

                <div className="flex-center mb-6">
                    <div className="btn-icon-small" style={{ width: 64, height: 64, background: "rgba(16, 185, 129, 0.1)", borderColor: "var(--success)" }}>
                        <TrendingUp size={32} color="var(--success)" />
                    </div>
                </div>

                <h2 className="text-center mb-1">{userName} adlı üyenin İstatistikleri</h2>
                <p className="text-muted text-center mb-8">{userEmail}</p>

                <div className="grid-2 mb-6" style={{ gap: '16px' }}>
                    <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{totalTasks}</div>
                        <div className="text-muted" style={{ fontSize: '0.85rem' }}>Toplam Görev</div>
                    </div>
                    <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>{completedPercentage}%</div>
                        <div className="text-muted" style={{ fontSize: '0.85rem' }}>Başarı Oranı</div>
                    </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Görev Dağılımı</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Completed */}
                        <div>
                            <div className="flex-between mb-1">
                                <span className="flex-center gap-2" style={{ fontSize: '0.9rem', color: 'var(--success)' }}>
                                    <CheckCircle size={16} /> Tamamlanan ({completedTasks})
                                </span>
                                <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{completedPercentage}%</span>
                            </div>
                            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${completedPercentage}%`, background: 'var(--success)', borderRadius: '4px', transition: 'width 1s ease-out' }}></div>
                            </div>
                        </div>

                        {/* In Progress */}
                        <div>
                            <div className="flex-between mb-1">
                                <span className="flex-center gap-2" style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>
                                    <Clock size={16} /> Devam Eden ({inProgressTasks})
                                </span>
                                <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{inProgressPercentage}%</span>
                            </div>
                            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${inProgressPercentage}%`, background: 'var(--primary)', borderRadius: '4px', transition: 'width 1s ease-out' }}></div>
                            </div>
                        </div>

                        {/* Pending */}
                        <div>
                            <div className="flex-between mb-1">
                                <span className="flex-center gap-2" style={{ fontSize: '0.9rem', color: 'var(--warning)' }}>
                                    <AlertCircle size={16} /> Bekleyen ({pendingTasks})
                                </span>
                                <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{pendingPercentage}%</span>
                            </div>
                            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${pendingPercentage}%`, background: 'var(--warning)', borderRadius: '4px', transition: 'width 1s ease-out' }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {totalTasks === 0 && (
                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', textAlign: 'center' }}>
                        <p className="text-muted" style={{ fontSize: '0.9rem' }}>Bu üyeye ait henüz bir görev istatistiği oluşturulamadı.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
