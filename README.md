# Curator

Curator is a personal **media capture & triage** utility. It removes the friction of saving
things for later — articles, books, movies, games — by pairing a single frictionless input bar
with a rapid classification flow, so your backlog never piles up unsorted.

Capture anything in one box. Triage it into a category when you're ready.

## How It Works

Curator models everything as a single entity, the `MediaItem`, moving through a two-state
lifecycle:

1. **Capture** — paste or type anything (a note or a URL) into the All-Capture Bar. It is saved
   verbatim to the **Inbox**, no questions asked.
2. **Refine & Triage** — open an Inbox item to get best-effort metadata suggestions (a fetched
   page title/description for URLs, or an AI-assisted "determine media" lookup for movies,
   books, games, and articles). Edit the fields, then validate to move the item into the
   **Library** with a category, title, year, creator, and description.
3. **Delete** — remove an Inbox item instantly, without opening the triage modal.

The Library lists organized items with a category filter (`All / Movies / Books / Games /
Articles`) and a sort filter (newest/oldest by capture date, newest/oldest by year, title A-Z/Z-A).

There is no authentication, no file/image uploads, and no user-defined categories — this is a
single-user MVP by design. See [`docs/PROJECT.md`](docs/PROJECT.md) for the full business
domain and [`docs/DECISIONS.md`](docs/DECISIONS.md) for settled engineering decisions.

## Architecture

Curator is a **TypeScript monorepo** using npm workspaces:

- **`apps/web`** — React 18+ SPA (Vite, TypeScript strict, TanStack Query for server state,
  Zustand for UI state, Tailwind CSS, Zod, React Hook Form).
- **`apps/api`** — Node.js backend (Fastify, layered routes -> services -> repository, Prisma,
  Pino structured logging, Zod validation at every boundary).

```
┌─────────────────────────────────────────────────────────────┐
│  apps/web  — React SPA (mobile-first, Tailwind)             │
│  Pages -> Feature Components -> UI primitives               │
│     Custom Hooks -> TanStack Query (server state)           │
│                  -> Zustand (UI state)                      │
│     services/ (typed API client)                            │
└─────────────────────────┬───────────────────────────────────┘
                          │  HTTPS / JSON (REST)
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  apps/api  — Node.js / Fastify (layered)                    │
│  Route -> Handler -> Service -> Repository                  │
│                        └─ suggestions.service               │
│                        (URL fetch, or external media lookup)│
└─────────────────────────┬───────────────────────────────────┘
                          │  Prisma
                          ▼
                  SQLite (MVP) -> PostgreSQL (config swap)
```

Full details, request flows, and complexity guardrails live in
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## API Surface

| Method   | Path                                                       | Purpose                                                                 |
| -------- | ----------------------------------------------------------- | ------------------------------------------------------------------------ |
| `POST`   | `/items`                                                    | Capture a new item; persists raw `content`, sets `status = INBOX`       |
| `GET`    | `/items?status=inbox`                                       | List Inbox items, newest first                                          |
| `GET`    | `/items?status=organized&category={cat}&sort={sort}`        | List Library items with optional category/sort filters                  |
| `GET`    | `/items/{id}/suggestions`                                    | Best-effort metadata suggestions for the refine-metadata modal          |
| `PATCH`  | `/items/{id}`                                                | Triage: set category/title/year/creator/description, `status = ORGANIZED` |
| `DELETE` | `/items/{id}`                                                | Permanently delete an item                                               |
| `GET`    | `/health`                                                    | Health check                                                            |

Interactive Swagger UI is available at the API's `/documentation` route in development.

## Tech Stack

| Layer          | Choices                                                                 |
| -------------- | ------------------------------------------------------------------------ |
| Frontend       | React 19, TypeScript (strict), Vite, TanStack Query, Zustand, Tailwind CSS v4, Zod, React Hook Form, React Router |
| Backend        | Node.js, Fastify 5, Prisma 6, Zod, Pino, `fastify-type-provider-zod`     |
| Database       | SQLite (MVP) — swappable to PostgreSQL via `DATABASE_URL`               |
| Suggestions    | Gemini (content classification), TMDB (movies), IGDB/Twitch (games)     |
| Testing        | Vitest, Testing Library, MSW (frontend); Vitest (backend)                |
| Tooling        | ESLint, Prettier, TypeScript project references                          |

## Getting Started

### Prerequisites

- Node.js 22+ and npm
- API keys for the suggestion pipeline (optional but recommended — see below)

### Installation

```bash
git clone https://github.com/EtienneLG/curator-mvp.git
cd curator-mvp
npm install
```

### Environment Variables

Copy the example env files and fill in the values you need:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

**`apps/api/.env`**

| Variable                | Description                                                              |
| ------------------------ | -------------------------------------------------------------------------- |
| `DATABASE_URL`          | SQLite file path for Prisma (e.g. `file:./dev.db`)                       |
| `PORT`                  | Port the Fastify server listens on                                        |
| `NODE_ENV`              | `development` / `production`                                              |
| `WEB_ORIGIN`            | Origin allowed to call the API via CORS                                   |
| `GEMINI_API_KEY`        | Used only to classify captured content into `{ category, searchQuery }`   |
| `TMDB_API_KEY`          | Movie metadata suggestions                                                 |
| `IGDB_CLIENT_ID` / `IGDB_CLIENT_SECRET` | Game metadata suggestions (IGDB/Twitch OAuth)              |
| `SUGGESTION_TIMEOUT_MS` | Per-call timeout for external suggestion lookups                          |

**`apps/web/.env`**

| Variable       | Description                                   |
| --------------- | ------------------------------------------------ |
| `VITE_API_URL` | Base URL of the `apps/api` backend                |

All external suggestion providers are best-effort: if a key is missing or a lookup fails, the
refine-metadata modal still opens with empty, editable fields.

### Database Setup

```bash
npm run prisma:migrate --workspace=@curator/api
```

This applies Prisma migrations and generates the client against the SQLite database defined by
`DATABASE_URL`.

### Running Locally

Start both apps together from the repo root:

```bash
npm run dev
```

Or run each workspace independently:

```bash
npm run dev --workspace=@curator/api   # http://localhost:3000
npm run dev --workspace=@curator/web   # http://localhost:5173
```

## Testing

```bash
npm run test --workspace=@curator/api
npm run test --workspace=@curator/web
```

Each workspace also exposes `test:watch` and `test:coverage`. See
[`docs/TESTING.md`](docs/TESTING.md) for the testing strategy and coverage expectations.

## Linting & Type Checking

```bash
npm run lint --workspace=@curator/api
npm run lint --workspace=@curator/web
npm run typecheck --workspace=@curator/api
npm run typecheck --workspace=@curator/web
```

## Building for Production

```bash
npm run build --workspace=@curator/api
npm run build --workspace=@curator/web
```

The API compiles with SWC to `apps/api/dist`; the web app builds with Vite to `apps/web/dist`.

## Project Structure

```
curator/
├── apps/
│   ├── api/            # Fastify backend
│   │   ├── src/
│   │   │   ├── routes/       # thin, path + Zod schema definitions
│   │   │   ├── handlers/     # HTTP <-> application mapping
│   │   │   ├── services/     # business logic (capture, triage, suggestions)
│   │   │   ├── repositories/ # Prisma data access
│   │   │   ├── schemas/      # Zod schemas
│   │   │   ├── plugins/      # Fastify plugins
│   │   │   └── config/       # env validation
│   │   └── prisma/           # schema + migrations
│   └── web/             # React SPA
│       └── src/
│           ├── components/   # UI-only components
│           ├── hooks/        # all logic: data fetching, state
│           └── services/     # typed API client
├── docs/                # canonical project documentation
└── .github/instructions/ # path-specific AI coding rules
```

## Documentation

| File                                            | Scope                                            |
| ------------------------------------------------ | --------------------------------------------------- |
| [`docs/PROJECT.md`](docs/PROJECT.md)             | Business domain, `MediaItem`, rules, lifecycle    |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)   | System design, data flow, API surface             |
| [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md)     | Coding standards, naming, structure                |
| [`docs/TESTING.md`](docs/TESTING.md)             | Testing strategy and coverage requirements         |
| [`docs/DECISIONS.md`](docs/DECISIONS.md)         | Settled engineering decisions                      |
| [`docs/AI-RULES.md`](docs/AI-RULES.md)           | Top-level operational AI rules for the monorepo    |
| [`apps/web/AGENTS.md`](apps/web/AGENTS.md)       | Canonical rules for the frontend                   |
| [`apps/api/AGENTS.md`](apps/api/AGENTS.md)       | Canonical rules for the backend                    |
