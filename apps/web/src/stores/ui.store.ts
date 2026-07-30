import { create } from 'zustand';

import type { Category } from '../types/media-item.types';

// 'ALL' is a synthetic value (not part of the closed Category enum) meaning "no filter applied".
export type LibraryCategoryFilter = Category | 'ALL';

interface UIState {
  libraryCategoryFilter: LibraryCategoryFilter;
  setLibraryCategoryFilter: (category: LibraryCategoryFilter) => void;
}

export const useUIStore = create<UIState>((set) => ({
  libraryCategoryFilter: 'ALL',
  setLibraryCategoryFilter: (category) => set({ libraryCategoryFilter: category }),
}));
