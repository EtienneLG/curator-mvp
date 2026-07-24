# Testing Guide — Curator

Shared testing strategy for both workspaces. Keep the suite lean and focused on real risk — a
larger test suite is not automatically a better one.

---

## Core Principles

- Test **behavior**, not implementation details.
- Prioritize the code that carries real risk: link detection, title-extraction fallback, the
  triage lifecycle transition, and Vault filtering.
- Tests must be **deterministic** — no flaky, time-based waits.
- Every meaningful behavior change ships with tests.

## Curator-Specific Priorities (test these first)

| Area | Why it matters |
|------|----------------|
| **Link detection** | Text vs link classification drives card rendering and title extraction. |
| **Title extraction fallback** | Must degrade to the raw link on fetch/parse failure — never block a capture. |
| **Triage transition** | `PATCH` must set `category` + `status = ORGANIZED` and remove the item from the Inbox. |
| **Inbox/Vault ordering & filtering** | Newest-first ordering and per-category Vault filtering. |
| **Delete** | Permanent, immediate removal. |

---

## Frontend Testing (`apps/web`)

### Frameworks
- **Vitest** (runner) + **React Testing Library** + **MSW** (network mocking) + **user-event**.

### What to Test
- **Component tests** (co-located, e.g., `LinkCard.test.tsx`): render text vs link cards,
  category selector triggers the triage callback, delete button triggers deletion.
- **Hook tests**: `useInboxItems` / `useVaultItems` fetch and cache; `useCaptureItem` mutation
  invalidates the Inbox; optimistic removal on triage/delete.
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
- **Unit — services**: link detection, `link-metadata.service` fallback behavior, triage rules.
  Mock the repository and outbound fetch.
- **Focused integration**: repository + SQLite interaction (ordering, filtering); Fastify error
  mapping for a business exception; the capture → title-resolution path with a mocked fetch.

```typescript
import { describe, expect, it, vi } from 'vitest';
import { ItemsService } from '../../src/services/items.service';

describe('ItemsService', () => {
  it('falls back to the raw link when title extraction fails', async () => {
    const repo = { create: vi.fn(async (x) => x) };
    const metadata = { fetchTitle: vi.fn().mockRejectedValue(new Error('timeout')) };
    const service = new ItemsService(repo as any, metadata as any);

    const item = await service.capture({ content: 'https://example.com' });

    expect(item.type).toBe('LINK');
    expect(item.title).toBeNull();
    expect(item.url).toBe('https://example.com');
  });
});
```

### Rules
- Arrange / Act / Assert; clear mocks in `afterEach`.
- Prefer `app.inject()` over browser-like E2E stacks.
- `describe('ItemsService')` for units, `describe('[PATCH /items/:id]')` for HTTP integration.

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
