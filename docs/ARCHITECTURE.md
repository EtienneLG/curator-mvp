# Architecture Overview

Curator is a **TypeScript monorepo** with two workspaces:

- `apps/web` — React SPA (frontend)
- `apps/api` — Node.js / Fastify service (backend)

Shared documentation lives in this root `docs/` folder (single source of truth). Stack-specific
agent entry points (`AGENTS.md`, `.github/copilot-instructions.md`) live inside each workspace
and reference these files.

**Guiding principle:** use the lightest architecture that satisfies the PRD. This is a
single-user CRUD app with one non-trivial concern (link-title extraction). Do not add
speculative layers, abstractions, or infrastructure.

---

## System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  apps/web  — React SPA (mobile-first, Tailwind)             │
│                                                              │
│  Pages ── Feature Components ── UI primitives                │
│     │            │                                           │
│     └── Custom Hooks ──► TanStack Query (server state)       │
│              │            Zustand (UI state: filter, input)  │
│              └──► services/ (typed API client)               │
└────────────────────────┬─────────────────────────────────────┘
                         │  HTTPS / JSON (REST)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  apps/api  — Node.js / Fastify (layered)                    │
│                                                              │
│   Route ──► Handler ──► Service ──► Repository               │
│                           │                                  │
│                           └─► linkMetadata.service           │
│                               (fetch + parse <title>)        │
└────────────────────────────────────┬────────────────────────┘
                                      │  Prisma
                                      ▼
                            ┌───────────────────┐
                            │  SQLite (MVP)     │
                            │  → PostgreSQL     │
                            │    (config swap)  │
                            └───────────────────┘
```

---

## Frontend Architecture (`apps/web`)

### Layers

```
┌─────────────────────────────────────────┐
│  UI Components — pages, feature, ui/     │  render + user interaction only
├─────────────────────────────────────────┤
│  Custom Hooks — data fetching, state     │  ALL logic lives here
├─────────────────────────────────────────┤
│  Services — typed API client functions   │  HTTP calls to apps/api
├─────────────────────────────────────────┤
│  State — TanStack Query + Zustand + URL  │  server vs client vs URL state
└─────────────────────────────────────────┘
```

### The #1 Rule

**Components are UI-only. All logic (data fetching, state, side effects) lives in custom hooks.**

### State Assignment (strict)

| State | Tool | Example in Curator |
|-------|------|--------------------|
| Server state | TanStack Query | Inbox list, Vault list, capture/triage/delete mutations |
| Global client state | Zustand | Active Vault filter, capture-bar input buffer |
| Local component state | `useState` | Transient toggles inside a single card |
| URL state | `useSearchParams` | (optional) Vault filter reflected in the URL |

### Data Flow

1. Route renders page component
2. Page component uses custom hooks for data
3. Custom hooks call TanStack Query with service functions
4. Service functions make typed HTTP requests to `app/api/`
5. Data flows down via props, actions flow up via callbacks
6. Global state in Zustand stores, accessed via hooks

### Component Communication

- Parent → Child: Props
- Child → Parent: Callback props (`onSubmit`, `onChange`)
- Siblings: Shared hook or Zustand store
- Deep tree: Context or Zustand (avoid prop drilling > 2 levels)

### Error Flow

1. API error returned from service
2. TanStack Query captures in `error` state
3. Component renders error UI or Error Boundary catches
4. User actions show toast notification on failure
5. Critical errors: Error Boundary with fallback UI

### Routing Strategy (Vite SPA)

- React Router with lazy-loaded routes
- Layout routes for shared UI
- Error boundaries at route level
- Protected routes via auth guard component

### API Integration

- Centralized API client in `services/api-client.ts`; base URL from `VITE_API_URL`.
- Validate API responses with Zod at the service boundary for the `MediaItem` contract.
- Optimistic updates for triage/delete so cards disappear instantly, then invalidate queries.

---

## Backend Architecture (`apps/api`)

A **simple layered structure** (not clean/hexagonal — the domain is a single entity):

```
┌────────────────────────────────────────────┐
│ Routes    — paths, methods, Zod schemas    │  thin
├────────────────────────────────────────────┤
│ Handlers  — HTTP ↔ application mapping     │  thin: validate → delegate → respond
├────────────────────────────────────────────┤
│ Services  — business rules                 │  capture / triage / delete / list
│             linkMetadata.service           │  fetch URL + parse <title> (fallback)
├────────────────────────────────────────────┤
│ Repository— Prisma data access             │  ordering, filtering, persistence
└────────────────────────────────────────────┘
```

### Non-Negotiable Boundaries

1. **Handlers are thin**: validate input, call a service, send the response.
2. **Services own business logic**: link detection, title resolution, lifecycle transitions.
3. **Repository owns persistence**: all Prisma access, `ORDER BY createdAt DESC`, Vault filters.
4. **Zod validates every boundary**: body, params, query, and external (fetched HTML is treated
   as untrusted — only the parsed title is used).
5. **Business failures are typed exceptions** mapped by a centralized Fastify error handler.
6. **No gratuitous layers.** No clean-architecture ceremony, no generic repository abstractions.

### Request Flow (capture a link)

1. `POST /items` hits a Fastify route with Zod validation.
2. Handler extracts typed input and delegates to `items.service`.
3. Service detects a link, calls `linkMetadata.service` to resolve the `<title>`; on any failure
   it falls back to the raw link (`title = null`).
4. Repository persists the `MediaItem` via Prisma with `status = INBOX`.
5. Response returns; the client invalidates the Inbox query so it re-renders newest-first.

### Error Flow

1. A service throws a typed business exception.
2. The centralized Fastify error handler maps it to `{ error: { code, message, details } }`.
3. Pino logs once with request context; stack traces are never exposed in responses.

### Configuration & Observability

- Validate env vars with Zod at startup; fail fast on missing/malformed config.
- `DATABASE_URL` (SQLite file for MVP), `PORT`.
- Pino structured JSON logs; attach a request ID at the Fastify boundary.
- Expose `GET /health`.

---

## API Surface (contract)

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/items` | Capture a new item (text or link); server resolves title, sets `status = INBOX` |
| `GET` | `/items?status=inbox` | List Inbox items, `createdAt DESC` |
| `GET` | `/items?status=organized&category={cat}` | List Vault items; `category` omitted ⇒ "All" |
| `PATCH` | `/items/{id}` | Triage: set `category` + `status = ORGANIZED` |
| `DELETE` | `/items/{id}` | Permanently delete an item |

---

## Data Layer

- **Prisma** is the single source of truth for the schema (`prisma/schema.prisma`).
- **SQLite** for the MVP (zero-config, single file). All schema changes go through committed
  Prisma migrations.
- The `MediaItem` model + `MediaType` / `Category` / `Status` enums mirror `PROJECT.md`.
- **PostgreSQL migration** later is a `provider` + `DATABASE_URL` change, not a rewrite.

## Complexity Guardrails

- No RxJS, event buses, Redux, or generic repository/adapter layers.
- No auth, upload, or thumbnail infrastructure (out of scope).
- Prefer explicit, boring code over clever abstractions.
