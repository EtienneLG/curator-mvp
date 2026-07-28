import { create } from 'zustand';

/**
 * Placeholder global UI store (e.g. active Library filter, capture input
 * buffer). Add feature state here as needed — never access this store
 * directly outside hooks (see AGENTS.md → State Management).
 */
type UIState = Record<string, never>;

export const useUIStore = create<UIState>(() => ({}));
