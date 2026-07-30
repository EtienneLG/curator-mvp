import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { resetInboxItemsDb, resetSuggestionsDb } from '../../tests/msw/handlers';
import { server } from '../../tests/msw/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
  resetInboxItemsDb();
  resetSuggestionsDb();
});
afterAll(() => server.close());
