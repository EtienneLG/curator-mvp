import { http, HttpResponse, type HttpHandler } from 'msw';

import type { MediaItem } from '../../src/types/media-item.types';

/**
 * Shared MSW request handlers. Add per-feature handlers here (or compose
 * from feature-local handler files) as API integrations are built — see
 * docs/TESTING.md → Frontend Testing.
 */

export const inboxItemsFixture: MediaItem[] = [
  {
    id: '1',
    content: 'Remember to buy milk',
    type: 'TEXT',
    url: null,
    title: null,
    category: null,
    status: 'INBOX',
    createdAt: new Date('2026-01-02T10:00:00.000Z'),
  },
  {
    id: '2',
    content: 'https://example.com/article',
    type: 'LINK',
    url: 'https://example.com/article',
    title: 'Example Article',
    category: null,
    status: 'INBOX',
    createdAt: new Date('2026-01-01T10:00:00.000Z'),
  },
];

// In-memory fake "database", seeded from the fixture above. Mutated by
// PATCH/DELETE so that a subsequent GET reflects prior mutations, mirroring
// real backend behavior for cache-invalidation-driven tests.
let itemsDb: MediaItem[] = [];

/** Resets the fake DB to the fixture — call from `afterEach` in test setup. */
export function resetInboxItemsDb() {
  itemsDb = inboxItemsFixture.map((item) => ({ ...item }));
}

resetInboxItemsDb();

export const handlers: HttpHandler[] = [
  http.get('*/items', ({ request }) => {
    const status = new URL(request.url).searchParams.get('status');

    if (status === 'inbox') {
      return HttpResponse.json(itemsDb.filter((item) => item.status === 'INBOX'));
    }

    return HttpResponse.json([]);
  }),

  http.patch('*/items/:id', async ({ params, request }) => {
    const body = (await request.json()) as { category: string };
    const index = itemsDb.findIndex((existing) => existing.id === params.id);

    if (index === -1) {
      return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Item not found' } }, { status: 404 });
    }

    itemsDb[index] = { ...itemsDb[index], category: body.category as MediaItem['category'], status: 'ORGANIZED' };

    return HttpResponse.json(itemsDb[index]);
  }),

  http.delete('*/items/:id', ({ params }) => {
    itemsDb = itemsDb.filter((item) => item.id !== params.id);

    // Respond with a JSON body (not 204) so `apiFetch`'s `response.json()`
    // call always has something to parse.
    return HttpResponse.json({}, { status: 200 });
  }),
];
