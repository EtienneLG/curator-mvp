import type { Category } from '../types/media-item.types';

/**
 * App-wide constants (e.g. category labels, route paths). Add values here
 * instead of hardcoding magic strings/numbers in components or hooks.
 */

/**
 * Display labels for the closed `Category` set (docs/PROJECT.md → Fixed
 * Enumerations). Order here drives the triage button order in the UI.
 */
export const CATEGORY_LABELS: Record<Category, string> = {
  MOVIE: 'Movie',
  BOOK: 'Book',
  GAME: 'Game',
  ARTICLE: 'Article',
};

export const CATEGORIES: Category[] = ['MOVIE', 'BOOK', 'GAME', 'ARTICLE'];
