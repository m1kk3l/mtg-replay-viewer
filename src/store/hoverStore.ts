import { create } from 'zustand';

interface HoverState {
  grpId: number | null;
  setHovered: (grpId: number | null) => void;
}

export const useHoverStore = create<HoverState>((set) => ({
  grpId: null,
  setHovered: (grpId) => set({ grpId }),
}));
