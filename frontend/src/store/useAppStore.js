import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Lightweight global UI state: theme + the currently active import that
// the Generate/Review pages operate on.
export const useAppStore = create(
  persist(
    (set) => ({
      theme: 'light',
      activeImportId: null,
      toggleTheme: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
      setActiveImport: (id) => set({ activeImportId: id }),
    }),
    { name: 'outreach-ui' }
  )
);
