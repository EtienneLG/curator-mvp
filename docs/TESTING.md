# Testing Guide — Curator

Shared testing strategy for both workspaces. Keep the suite lean and focused on real risk — a
larger test suite is not automatically a better one.

---

## Core Principles

- Test **behavior**, not implementation details.
- Prioritize the code that carries real risk: the suggestions branch (URL fetch vs. media
  lookup), its best-effort fallback, the triage lifecycle transition, and Library
  filtering/sorting.
- Tests must be **deterministic** — no flaky, time-based waits.
- Every meaningful behavior change ships with tests.

## Curator-Specific Priorities (test these first)

| Area | Why it matters |
|------|----------------|
| **Suggestions branch (URL vs. media lookup)** | `content` shape decides whether `suggestions.service` fetches a webpage or calls the external media lookup — both branches must be exercised. |
| **Web-suggestions fallback** | A failed/slow/empty suggestion lookup must never block the refine-metadata modal from opening or being submitted. |
| **Triage transition** | `PATCH` must set `category`, `title`, `year`, `creator`, `description` + `status = ORGANIZED` and remove the item from the Inbox. |
| **Inbox/Library ordering, filtering & sorting** | Newest-first default ordering, per-category Library filtering, and the date/year/title sort options. |
| **Delete** | Permanent, immediate removal. |

---

## Frontend Testing (`apps/web`)

### Frameworks
- **Vitest** (runner) + **React Testing Library** + **MSW** (network mocking) + **user-event**.

### What to Test
- **Component tests** (co-located, e.g., `ItemCard.test.tsx`): render the unified card (with
  cosmetic client-side link styling when `content` looks like a URL), the refine-metadata modal
  opens on card tap and pre-fills suggestions, its **Validate** action triggers triage with the
  edited fields, delete button triggers deletion.
- **Hook tests**: `useInboxItems` / `useLibraryItems` fetch and cache; `useCaptureItem` mutation
  invalidates the Inbox; `useSuggestions` handles the best-effort fetch (including
  failure/empty-result cases); optimistic removal on triage/delete.
- **MSW handlers** mock `apps/api` endpoints at the network level (never mock modules).

### Rules
- Query by role/label/text — avoid `data-testid` unless nothing else works.
- Test files co-located next to the component/hook.

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { CategorySelector } from './CategorySelector';

describe('CategorySelector', () => {
  it('emits the chosen category on tap', async () => {
    const onSelect = vi.fn();
    render(<CategorySelector onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button', { name: /movie/i }));
    expect(onSelect).toHaveBeenCalledWith('MOVIE');
  });
});
```

### Coverage Targets
- Hooks/services: 80%+ · Components: 70%+ · Utilities: 90%+.

### Do NOT Test (Frontend)
- Third-party internals (TanStack Query cache, router), CSS details, state variable names.

---

## Backend Testing (`apps/api`)

### Frameworks
- **Vitest** for unit + focused integration. **Fastify `app.inject()`** for HTTP integration.

### What to Test First
- **Unit — services**: `suggestions.service` branch selection (URL → page fetch, else → media
  lookup) and its best-effort fallback (failure/timeout/empty result never throws, only ever
  returns partial/empty suggestions); `items.service` triage rules (atomic multi-field update);
  capture (`items.service.capture`) does a plain persist with no side effects. Mock the
  repository and outbound fetch.
- **Focused integration**: repository + SQLite interaction (ordering, category filtering, sort
  options); Fastify error mapping for a business exception; the refine flow
  (`GET /items/{id}/suggestions`) with a mocked fetch/external API for both branches.

```typescript
import { describe, expect, it, vi } from 'vitest';
import { SuggestionsService } from '../../src/services/suggestions.service';

describe('SuggestionsService', () => {
  it('falls back to an empty suggestion when the URL fetch fails', async () => {
    const fetcher = { fetchPage: vi.fn().mockRejectedValue(new Error('timeout')) };
    const mediaLookup = { search: vi.fn() };
    const service = new SuggestionsService(fetcher as any, mediaLookup as any);

    const suggestion = await service.suggest({ content: 'https://example.com' });

    expect(suggestion.title).toBeNull();
    expect(mediaLookup.search).not.toHaveBeenCalled();
  });
});
```

### Rules
- Arrange / Act / Assert; clear mocks in `afterEach`.
- Prefer `app.inject()` over browser-like E2E stacks.
- `describe('ItemsService')` / `describe('SuggestionsService')` for units,
  `describe('[PATCH /items/:id]')` for HTTP integration.

### Do NOT Test (Backend)
- Thin handlers whose only job is validate → delegate → respond.
- Framework internals Fastify already guarantees; low-value happy-path route tests for coverage.

---

## Structure

```
apps/web/
├── src/**/<Name>.test.tsx      # co-located component/hook tests
└── tests/msw/                  # MSW handlers, shared test setup

apps/api/
└── tests/
    ├── unit/
    ├── integration/
    ├── fixtures/
    └── helpers/
```

## Coverage Philosophy

Treat coverage as a signal, not a goal. Aim for strong coverage on business logic and error
paths; do not inflate it with trivial handler or framework-glue tests.

## Anti-Patterns (both workspaces)

- Time-based waits (`setTimeout`, `waitForTimeout`).
- Over-mocking until the test proves nothing.
- Asserting implementation details instead of behavior.
- Route-by-route end-to-end suites as the default strategy.
- BDD/Gherkin, Playwright E2E, PACT contract tests — not part of the MVP; add only if a concrete
  need arises.
