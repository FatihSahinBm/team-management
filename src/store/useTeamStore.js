import { create } from 'zustand';

export const useTeamStore = create((set) => ({
  user: null,
  activeTeam: null,
  setUser: (user) => set({ user }),
  setActiveTeam: (team) => set({ activeTeam: team }),
  logout: () => set({ user: null, activeTeam: null }),
}));
