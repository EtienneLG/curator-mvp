import { http, HttpResponse, type HttpHandler } from 'msw';

import type { MediaItem } from '../../src/types/media-item.types';
import type { Suggestion } from '../../src/types/suggestion.types';

/**
 * Shared MSW request handlers. Add per-feature handlers here (or compose
 * from feature-local handler files) as API integrations are built — see
 * docs/TESTING.md → Frontend Testing.
 */

export const inboxItemsFixture: MediaItem[] = [
  {
    id: '1',
    content: 'Remember to buy milk',
    title: null,
    category: null,
    year: null,
    creator: null,
    description: null,
    status: 'INBOX',
    createdAt: new Date('2026-01-02T10:00:00.000Z'),
  },
  {
    id: '2',
    content: 'https://example.com/article',
    title: null,
    category: null,
    year: null,
    creator: null,
    description: null,
    status: 'INBOX',
    createdAt: new Date('2026-01-01T10:00:00.000Z'),
  },
];

export const libraryItemsFixture: MediaItem[] = [
  {
    id: '3',
    content: 'Dune',
    title: 'Dune',
    category: 'BOOK',
    year: 1965,
    creator: 'Frank Herbert',
    description: 'A science fiction novel.',
    status: 'ORGANIZED',
    createdAt: new Date('2026-01-04T10:00:00.000Z'),
  },
  {
    id: '4',
    content: 'https://example.com/movie',
    title: 'Example Movie',
    category: 'MOVIE',
    year: 2020,
    creator: 'A Director',
    description: 'A short synopsis.',
    status: 'ORGANIZED',
    createdAt: new Date('2026-01-03T10:00:00.000Z'),
  },
];

export const emptySuggestionFixture: Suggestion = {
  category: null,
  title: null,
  year: null,
  creator: null,
  description: null,
};

export const movieSuggestionFixture: Suggestion = {
  category: 'MOVIE',
  title: 'Suggested Movie Title',
  year: 1999,
  creator: 'Suggested Director',
  description: 'A suggested synopsis.',
};

export const partialSuggestionFixture: Suggestion = {
  category: 'MOVIE',
  title: 'Suggested Movie Title',
  year: 1999,
  creator: null,
  description: 'A suggested synopsis.',
};

// Per-item override map so individual tests can control what `GET
// /items/:id/suggestions` returns without touching the shared handler.
let suggestionsById: Record<string, Suggestion> = {};

/** Resets suggestion overrides to empty — call from `afterEach` alongside `resetInboxItemsDb`. */
export function resetSuggestionsDb() {
  suggestionsById = {};
}

/** Lets a test set the suggestion returned for a given item id. */
export function setSuggestionForItem(id: string, suggestion: Suggestion) {
  suggestionsById[id] = suggestion;
}

// In-memory fake "database", seeded from the fixtures above. Mutated by
// PATCH/DELETE so that a subsequent GET reflects prior mutations, mirroring
// real backend behavior for cache-invalidation-driven tests.
let itemsDb: MediaItem[] = [];

/** Resets the fake DB to the fixtures — call from `afterEach` in test setup. */
export function resetInboxItemsDb() {
  itemsDb = [...inboxItemsFixture, ...libraryItemsFixture].map((item) => ({ ...item }));
}

resetInboxItemsDb();

export const handlers: HttpHandler[] = [
  http.get('*/items', ({ request }) => {
    const status = new URL(request.url).searchParams.get('status');

    if (status === 'inbox') {
      return HttpResponse.json(itemsDb.filter((item) => item.status === 'INBOX'));
    }

    if (status === 'organized') {
      return HttpResponse.json(itemsDb.filter((item) => item.status === 'ORGANIZED'));
    }

    return HttpResponse.json([]);
  }),

  http.get('*/items/:id/suggestions', ({ params }) => {
    const suggestion = suggestionsById[params.id as string] ?? emptySuggestionFixture;
    return HttpResponse.json(suggestion);
  }),

  http.patch('*/items/:id', async ({ params, request }) => {
    const body = (await request.json()) as {
      category: string;
      title: string;
      year: number | null;
      creator: string | null;
      description: string | null;
    };
    const index = itemsDb.findIndex((existing) => existing.id === params.id);
    const existing = itemsDb[index];

    if (!existing) {
      return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Item not found' } }, { status: 404 });
    }

    const updated: MediaItem = {
      ...existing,
      category: body.category as MediaItem['category'],
      title: body.title,
      year: body.year,
      creator: body.creator,
      description: body.description,
      status: 'ORGANIZED',
    };
    itemsDb[index] = updated;

    return HttpResponse.json(updated);
  }),

  http.delete('*/items/:id', ({ params }) => {
    itemsDb = itemsDb.filter((item) => item.id !== params.id);

    // Mirror the real backend's 204 No Content (see `apiFetch`'s no-body handling).
    return new HttpResponse(null, { status: 204 });
  }),

  http.post('*/items', async ({ request }) => {
    const body = (await request.json()) as { content: string };

    if (!body.content || body.content.trim().length === 0) {
      return HttpResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'content is required' } },
        { status: 400 },
      );
    }

    const created: MediaItem = {
      id: `captured-${itemsDb.length + 1}`,
      content: body.content,
      title: null,
      category: null,
      year: null,
      creator: null,
      description: null,
      status: 'INBOX',
      createdAt: new Date(),
    };
    itemsDb = [created, ...itemsDb];

    return HttpResponse.json(created, { status: 201 });
  }),
];
