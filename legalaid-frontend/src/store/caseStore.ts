import { create } from 'zustand';
import type { Case } from '../types';

interface CaseState {
  selected: Case | null;
  setSelected: (c: Case | null) => void;
}

export const useCaseStore = create<CaseState>((set) => ({
  selected: null,
  setSelected: (c) => set({ selected: c }),
}));
