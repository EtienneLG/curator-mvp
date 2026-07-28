# Coding Conventions

Shared standards for both workspaces. Where rules differ, they are split into **Frontend**
(`apps/web`) and **Backend** (`apps/api`) sections. `.editorconfig` in each workspace is the
source of truth for formatting.

---

## Universal

### Formatting
- 2-space indentation for TS/JS/JSON/YAML/CSS/Markdown.
- `lf` line endings; every file ends with a final newline.
- Prettier + ESLint. Do not mix broad formatting-only changes into feature commits.

### Language
- **TypeScript strict mode** everywhere. Never use `any` — use `unknown` and narrow.
- **Zod** is the source of truth for validation; infer types with `z.infer<typeof Schema>`.
  Do not hand-write duplicate DTO/interface types when inference suffices.
- ES Modules (`import`/`export`).

### Naming
- **Files**: kebab-case for utilities/modules (`suggestions.service.ts`, `format-date.ts`);
  PascalCase for React components (`InboxView.tsx`).
- **Components**: PascalCase. **Hooks**: camelCase, `use` prefix (`useInboxItems`).
- **Classes**: PascalCase. **Functions/variables**: camelCase. **Constants**: UPPER_SNAKE_CASE.
- **Types/interfaces**: PascalCase, no `I` prefix (`MediaItem`, `CaptureInput`).
- **Enums**: prefer string-literal unions; the domain enums are `Category`, `Status` (no
  `MediaType` — see DECISIONS.md DEC-016).

### Domain Vocabulary (use these exact names)
- Entity: `MediaItem`. Fields: `content`, `title`, `category`, `year`, `creator`,
  `description`, `status`, `createdAt`. No `type`/`url` fields (removed per DEC-016).
- Categories: `MOVIE`, `BOOK`, `GAME`, `ARTICLE`. Statuses: `INBOX`, `ORGANIZED`. Types: `TEXT`, `LINK`.
- Screens: `Inbox`, `Library` (previously "Library" — see DECISIONS.md DEC-015; do not reintroduce
  "Library" naming in new code).

### Git & Review
- Conventional commits: `type(scope): description` (e.g., `feat(inbox): add link card`).
- PRs < 400 lines of production code; every behavior change adds/updates tests.
- `// @ts-ignore` and `eslint-disable` require a short justification comment.

### Security
- Never hardcode secrets; keep `.env*` out of version control.
- Validate all external input with Zod (client **and** server).
- No auth/upload code — out of scope.

---

## Frontend Conventions (`apps/web`)

### Framework
- React 18+, TypeScript strict, **Vite SPA** (no Next.js).
- Functional components only (no class components).

### Project Structure (flat — no design system in the MVP)

```
src/
├── app/                     # App shell, router, providers
├── components/
│   ├── ui/                  # Generic primitives (Button, CardFrame, Dropdown)
│   ├── layout/              # Header / shell layout
│   └── features/            # Feature components
│       ├── capture/         # CaptureBar
│       ├── inbox/           # InboxView, ItemCard, RefineMetadataModal, DeleteButton
│       └── library/         # LibraryView, CategoryFilter, SortFilter
├── hooks/                   # Custom hooks (useInboxItems, useLibraryItems, useCaptureItem, useSuggestions…)
├── services/                # api-client.ts, item.service.ts
├── types/                   # Zod schemas + inferred types (media-item.types.ts)
├── lib/                     # utils.ts, constants.ts
├── stores/                  # Zustand stores (ui.store.ts)
└── styles/                  # globals.css (Tailwind directives)
```

> No Atomic Design / design-system hierarchy in the MVP — use the flat structure above.

### Component Rules
- **Components are UI-only. All logic lives in custom hooks** (the #1 rule).
- One component per file, under ~200 lines; extract sub-components if larger.
- Props interface declared above the component. Named exports (default export only for pages).
- Event handlers: `handle` prefix; callback props: `on` prefix.
- No prop drilling beyond 2 levels — use a hook or Zustand.
- `React.memo` / `useMemo` / `useCallback` only when the profiler proves a need.

### Hooks Rules
- File naming `use{Name}.ts`; never call hooks conditionally.
- **TanStack Query for ALL server state** — never `useEffect` + `useState` for fetching.
- Query key convention: `['items', 'inbox']`, `['items', 'library', { category, sort }]`,
  `['items', 'suggestions', id]`.
- `useMutation` with `onSuccess` invalidation; optimistic updates for triage/delete.
- Return consistent shapes: `{ data, isLoading, error }`.

### State Management
- Server state → TanStack Query. Global client state → Zustand. Local → `useState`.
- Forms: for anything non-trivial use **React Hook Form + Zod resolver**. The Capture Bar is a
  single input and may be a simple controlled field — do not over-engineer it.
- URL state (`useSearchParams`) is acceptable for the Library category/sort filters.

### Styling
- **Tailwind CSS**, mobile-first (the primary surface is mobile).
- No inline styles except truly dynamic values. Extract repeated patterns into `components/ui/`.

### Error Handling & Accessibility
- Error boundaries at route/feature level; toast on action failure; never swallow errors.
- Semantic HTML, ARIA labels on icon-only controls (e.g., delete) and the refine-metadata modal
  (focus trap, `Escape` to close, labeled form fields), keyboard navigable, WCAG AA color
  contrast. Triage/validate controls must be tap-friendly.

### Banned (Frontend)
- Class components · `any` · `dangerouslySetInnerHTML` without sanitization ·
  `useEffect`+`useState` for server data · prop drilling > 2 levels ·
  inline styles for static values · business logic in components · Redux/MobX for server data.

---

## Backend Conventions (`apps/api`)

### Runtime & Tooling
- Stable Node.js LTS, TypeScript 5.x strict, ES Modules.
- `tsx` for development, `swc` for production builds. No Webpack. No Bun as default.

### Project Structure (simple layered)

```
src/
├── routes/          # items.route.ts — paths, methods, Zod schemas
├── handlers/        # items.handler.ts — thin HTTP mapping
├── services/        # items.service.ts, suggestions.service.ts — business rules
├── repositories/    # items.repository.ts — Prisma access
├── schemas/         # item.schema.ts — Zod contracts (shared shape with frontend)
├── plugins/         # Fastify plugins (logging, request IDs, swagger)
├── lib/             # prisma.ts, logger.ts
├── config/          # env validation (Zod)
├── app.ts           # build app, register plugins/routes
└── server.ts        # bootstrap / listen
prisma/
└── schema.prisma    # MediaItem model + enums; datasource = SQLite
```

### Fastify Rules
- `*.route.ts` registers endpoints and attaches Zod schemas directly to `schema: { body,
  response, params, querystring }` via `fastify-type-provider-zod` (see DEC-014) —
  `app.withTypeProvider<ZodTypeProvider>()`. Fastify validates/serializes; handlers never call
  `.parse()` themselves.
- `*.handler.ts` receives `(request, reply)` and delegates immediately — keep handlers boring.
- Plugins export `FastifyPluginAsync` and are registered explicitly in `app.ts`. Any plugin whose
  hooks (e.g. `onRoute`, `onError`) must apply repo-wide (not just to its own encapsulated
  children) sets the `Symbol.for('skip-override')` flag to hoist to the root context — see
  `error-handler.plugin.ts` and `swagger.plugin.ts`.
- Hooks: `onRequest` for request/correlation IDs; `onError` for centralized mapping.

### Validation & Errors
- Zod validates body/params/query/config and the parsed link metadata.
- Define typed business exceptions in one place; throw from services; map centrally.
- Response shape: `{ error: { code, message, details } }`. Never expose stack traces.
- No `try/catch` in handlers unless translating a low-level error right at a boundary.

### Database (Prisma)
- All DB access lives in repositories — never in handlers or services directly.
- `prisma/schema.prisma` is the schema source of truth; all changes go through migrations.
- Newest-first ordering (`orderBy: { createdAt: 'desc' }`) by default, plus category and sort
  filtering (`year`, `title`) for the Library, live in the repository.

### Logging & Docs
- **Pino** only — never `console.log`. Structured objects, never log raw PII.
- `@fastify/swagger` for API docs, transformed via `fastify-type-provider-zod`'s
  `jsonSchemaTransform` so the OpenAPI spec is generated directly from route Zod schemas
  (see DEC-014); use `.describe()` on schema fields for extra OpenAPI detail.

### Async
- `async`/`await` only; `Promise.all` for independent calls. No `setTimeout` for core flow.

### Banned (Backend)
- `console.log` · `any` · business logic in routes/handlers · Prisma access in services/handlers ·
  Joi/class-validator · Express/NestJS by default · Winston · RxJS · Webpack · Bun ·
  route-by-route end-to-end suites as the default.

---

## Deferred / Not in MVP

The following appeared in the source templates but are **out of scope** for Curator and must not
be introduced without an explicit decision: i18n, Docker/nginx/BFF proxy, Application
Insights / analytics SDKs, authentication (JWT/OAuth/Keycloak), Atomic Design/design system,
Next.js App Router, Kafka/messaging, and multi-environment deploy pipelines.
