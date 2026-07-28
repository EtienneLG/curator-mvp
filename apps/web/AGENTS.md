# AGENTS.md — React TypeScript (Single Source of Truth)

> **This file is the canonical agent instruction set.** All tool-specific config files
> (`CLAUDE.md`, `GEMINI.md`, `.cursorrules`, `.windsurfrules`, `.github/copilot-instructions.md`)
> reference this file. Edit rules HERE, not in those files.

## Project Overview

This is the **frontend** workspace (`apps/web`) of the **Curator** monorepo — a mobile-first
personal media capture & triage app. React 18+ with TypeScript (strict), TanStack Query for
server state, Zustand for client state, Tailwind CSS, and React Hook Form + Zod for non-trivial
forms. Component-driven architecture with custom hooks for logic encapsulation.

The backend (`apps/api`) exposes a small REST API over a single `MediaItem` entity.
For full business context, see `../../docs/PROJECT.md`.

## Required Reading (Before Any Change)

Shared docs live in the repo-root `docs/` folder — the single source of truth.

| File | What It Contains |
|------|-----------------|
| `../../docs/PROJECT.md` | Business domain (`MediaItem`), rules, lifecycle, out-of-scope |
| `../../docs/ARCHITECTURE.md` | System design, state architecture, data flow, API surface |
| `../../docs/CONVENTIONS.md` | Coding standards, naming, structure, patterns |
| `../../docs/TESTING.md` | Testing strategy, frameworks, coverage requirements |
| `../../docs/DECISIONS.md` | Engineering decisions — read before proposing architectural changes |
| `../../docs/AI-RULES.md` | Top-level operational AI rules for the monorepo |

## Build & Test

```bash
npm run dev                # Dev server
npm run build              # Production build
npm test                   # All tests
npm run test:coverage      # With coverage
npm run lint               # Lint check
```

## The #1 Rule

**Components are UI-only. All logic lives in custom hooks.**

If you add data fetching, state management, or business logic directly in a component,
you are violating the architecture. Extract it into a custom hook.

## Package Map

```
src/
├── app/                     # Pages / routes (React Router — Vite SPA)
├── components/
│   ├── ui/                  # Generic UI primitives (Button, CardFrame, Dropdown)
│   ├── layout/              # Layout components (Header / app shell)
│   └── features/            # Feature-specific components
│       ├── capture/         # CaptureBar.tsx
│       ├── inbox/           # InboxView.tsx, ItemCard.tsx, RefineMetadataModal.tsx, DeleteButton.tsx
│       └── library/         # LibraryView.tsx, CategoryFilter.tsx, SortFilter.tsx
├── hooks/                   # Custom hooks (data fetching, state, side effects)
│   ├── useInboxItems.ts
│   ├── useLibraryItems.ts
│   ├── useSuggestions.ts
│   └── useCaptureItem.ts
├── services/                # Typed API client functions
│   ├── api-client.ts        # Configured fetch instance (base URL from VITE_API_URL)
│   └── item.service.ts
├── types/                   # Zod schemas + inferred TypeScript types
│   ├── media-item.types.ts
│   └── api.types.ts
├── lib/                     # Utility functions
│   ├── utils.ts
│   └── constants.ts
├── stores/                  # Zustand stores for global client state
│   └── ui.store.ts          # active Library filters (category + sort), capture input buffer
└── styles/
    └── globals.css
```

## Architecture Rules

### State Management (Strict Assignments)

| State Type | Tool | Location | Never |
|-----------|------|----------|-------|
| Server state | TanStack Query | `hooks/` | `useEffect` + `useState` for fetching |
| Global client state | Zustand | `stores/` | Redux, MobX, or Context for complex state |
| Local component state | `useState` / `useReducer` | component | Global store for local-only state |
| Form state | React Hook Form + Zod | component / `hooks/` | Manual form state tracking |
| URL state | `useSearchParams` | component / `hooks/` | Zustand for filters/pagination |

### Data Flow

1. Route renders page component
2. Page component calls custom hooks for data
3. Hooks call TanStack Query with service functions
4. Services make typed HTTP requests
5. Data flows down via props, actions flow up via callbacks
6. Global state in Zustand stores, accessed via hooks

### Query Key Convention

```typescript
// Pattern: ['entity', 'action', params]
['items', 'inbox']
['items', 'library', { category: 'MOVIE', sort: 'createdAt:desc' }]
```

## Component Rules

- Functional components only, one per file, under 200 lines
- Props interface defined above the component declaration
- Named exports (default export only for page-level components)
- Event handlers: `handle` prefix (`handleSubmit`), callback props: `on` prefix (`onSubmit`)
- `React.memo` only when profiler confirms re-render issues
- No prop drilling beyond 2 levels — use context or Zustand
- Composition over inheritance — compose simple components

## Hooks Rules

- File naming: `use{Name}.ts`
- TanStack Query for ALL data fetching (`useQuery`, `useMutation`)
- Return consistent shapes: `{ data, isLoading, error }` or similar
- Never call hooks conditionally
- Compose smaller hooks into feature hooks
- `useMutation` with `onSuccess` for cache invalidation
- Optimistic updates where appropriate for better UX

## Code Style

- TypeScript strict mode — never use `any` (use `unknown` if truly needed)
- PascalCase for components (`OrderList.tsx`), kebab-case for utils (`format-date.ts`)
- `use` prefix for hooks (`useOrders.ts`)
- Zod schemas for runtime validation, infer TypeScript types from them
- `.editorconfig` is the source of truth for formatting (2-space indent, LF line endings)

## Styling

- Tailwind CSS utility classes (mobile-first responsive design)
- Never inline styles for static values
- Extract repeated UI patterns into reusable components in `components/ui/`

## Error Handling

- Error Boundaries at route and feature level
- TanStack Query captures API errors in `error` state
- Toast notifications for action failures
- Never swallow errors silently
- Type error responses from the API

## Testing

- **Frameworks**: Vitest + React Testing Library + MSW + user-event
- Test behavior, not implementation details
- Query by role/label/text (not test-ids unless necessary)
- Mock at network level with MSW, not module level
- Test files co-located: `OrderList.test.tsx` next to `OrderList.tsx`
- Coverage: 80% hooks/services, 70% components, 90% utilities

## Git Workflow

- Commit format: `type(scope): description` (e.g., `feat(inbox): add link preview card`)
- PR size: < 400 lines of production code
- Every PR must include tests
- Document significant architectural decisions in `../../docs/DECISIONS.md`

## Common Tasks

### New Feature Page

1. Create page in `app/` (or route config)
2. Create feature components in `components/features/{feature}/`
3. Create custom hook in `hooks/use{Feature}.ts`
4. Create service function in `services/{feature}.service.ts`
5. Define Zod schema + types in `types/{feature}.types.ts`
6. Write tests: component test + hook test + MSW handler
7. Record rationale in `../../docs/DECISIONS.md` if the decision is significant

### New API Integration

1. Add service function in `services/`
2. Create TanStack Query hook in `hooks/`
3. Use hook in component
4. Add MSW handler for tests

### New Form

1. Define Zod schema in `types/`
2. Create hook with React Hook Form + `zodResolver`
3. Create form component using the hook
4. Add validation error display

### New Global State

1. Create Zustand store in `stores/`
2. Access via hook in components
3. Never access store directly outside hooks

## What NOT To Do

- Do NOT use class components
- Do NOT use `any` type — use `unknown` or proper types
- Do NOT use `dangerouslySetInnerHTML` without sanitization
- Do NOT fetch data with `useEffect` + `useState` (use TanStack Query)
- Do NOT prop drill beyond 2 levels
- Do NOT use `// @ts-ignore` without justification
- Do NOT add dependencies without explicit mention
- Do NOT use inline styles for static values
- Do NOT put business logic in components
- Do NOT use Redux, MobX, or manual state management for server data

## Merge Request Checklist

Before any Merge Request, verify:
- Code follows component + hooks architecture (UI-only components, logic in hooks)
- No explicit `any` in the code
- TanStack Query used for all server state, Zustand for global client state
- API calls go through centralized API client in `services/`
- Zod schemas defined in `types/`, TypeScript types inferred from them
- Tests written/updated (component tests + hook tests + MSW handlers)
- Commit follows **Conventional Commits** format
- No hardcoded environment variables or API keys
- Existing UI components reused from `components/ui/` when relevant
- ESLint passes without errors
- Coverage meets thresholds (80% hooks/services, 70% components)
- PR size < 400 lines of production code
