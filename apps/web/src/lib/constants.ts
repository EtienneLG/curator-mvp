import type { Category } from '../types/media-item.types';

// Order here drives the triage button order in the UI.
export const CATEGORY_LABELS: Record<Category, string> = {
  MOVIE: 'Movie',
  BOOK: 'Book',
  GAME: 'Game',
  ARTICLE: 'Article',
};

export const CATEGORIES: Category[] = ['MOVIE', 'BOOK', 'GAME', 'ARTICLE'];
