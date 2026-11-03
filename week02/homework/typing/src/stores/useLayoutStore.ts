import { create } from 'zustand'

interface LayoutState {
  menuOpen: boolean
  setMenuOpen: (open: boolean) => void
}

export const useLayoutStore = create<LayoutState>((set) => ({
  menuOpen: false,
  setMenuOpen: (menuOpen) => set({ menuOpen }),
}))
