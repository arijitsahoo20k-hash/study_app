import { create } from 'zustand'

interface UIState {
  commandOpen: boolean
  activeProject: string | null
  setCommandOpen: (open: boolean) => void
  setActiveProject: (id: string | null) => void
  toggleCommand: () => void
}

export const useUIStore = create<UIState>((set) => ({
  commandOpen: false,
  activeProject: null,
  setCommandOpen: (open) => set({ commandOpen: open }),
  setActiveProject: (id) => set({ activeProject: id }),
  toggleCommand: () => set((s) => ({ commandOpen: !s.commandOpen })),
}))
