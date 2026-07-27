import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { resetInboxItemsDb } from '../../tests/msw/handlers';
import { server } from '../../tests/msw/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  resetInboxItemsDb();
});
afterAll(() => server.close());
