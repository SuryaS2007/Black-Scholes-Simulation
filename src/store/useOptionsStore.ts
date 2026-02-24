import { create } from 'zustand';
import type { OptionType, PageId } from '../types';
import type { Preset } from '../types';

interface OptionsStore {
  // ─── BS Parameters ───────────────────────────────────────────────────────
  S: number;
  K: number;
  T: number;
  r: number;
  sigma: number;
  optionType: OptionType;

  // ─── Navigation ──────────────────────────────────────────────────────────
  currentPage: PageId;
  sidebarCollapsed: boolean;

  // ─── Dark/Light mode ─────────────────────────────────────────────────────
  darkMode: boolean;

  // ─── Setters ─────────────────────────────────────────────────────────────
  setS: (v: number) => void;
  setK: (v: number) => void;
  setT: (v: number) => void;
  setR: (v: number) => void;
  setSigma: (v: number) => void;
  setOptionType: (v: OptionType) => void;
  setCurrentPage: (v: PageId) => void;
  setSidebarCollapsed: (v: boolean) => void;
  toggleDarkMode: () => void;
  applyPreset: (p: Preset) => void;
}

export const useOptionsStore = create<OptionsStore>((set) => ({
  S: 100,
  K: 100,
  T: 0.5,
  r: 0.05,
  sigma: 0.20,
  optionType: 'call',
  currentPage: 'calculator',
  sidebarCollapsed: false,
  darkMode: true,

  setS: (v) => set({ S: v }),
  setK: (v) => set({ K: v }),
  setT: (v) => set({ T: v }),
  setR: (v) => set({ r: v }),
  setSigma: (v) => set({ sigma: v }),
  setOptionType: (v) => set({ optionType: v }),
  setCurrentPage: (v) => set({ currentPage: v }),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
  applyPreset: (p) => set({ S: p.S, K: p.K, T: p.T, r: p.r, sigma: p.sigma }),
}));
