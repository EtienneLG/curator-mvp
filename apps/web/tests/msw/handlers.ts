import { type HttpHandler } from 'msw';

/**
 * Shared MSW request handlers. Add per-feature handlers here (or compose
 * from feature-local handler files) as API integrations are built — see
 * docs/TESTING.md → Frontend Testing.
 */
export const handlers: HttpHandler[] = [];
