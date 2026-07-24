# AI Agent Rules — Curator

> **This is the top-level operational guide for AI agents working in the Curator monorepo.**
> Workspace agent entry points (`apps/web/AGENTS.md`, `apps/api/AGENTS.md`, and the
> `.github/copilot-instructions.md` in each) reference this file and the shared `docs/`.
> Never duplicate rules — point here and to the docs below.

## Required Context

Before making any change, read the relevant files:

| File | Purpose |
|------|---------|
| `docs/PROJECT.md` | Product domain: the `MediaItem` entity, lifecycle, business rules, out-of-scope |
| `docs/DECISIONS.md` | Non-negotiable engineering decisions and anti-patterns |
| `docs/ARCHITECTURE.md` | System design, frontend/backend layers, request flow, API surface |
| `docs/CONVENTIONS.md` | Coding standards, naming, structure (universal + per-workspace) |
| `docs/TESTING.md` | Testing strategy and Curator-specific priorities |

Then read the target workspace's `AGENTS.md` for stack-specific quick constraints.

## Monorepo Map

```
curator/
├── docs/            ← shared source of truth (this folder)
├── apps/
│   ├── web/         ← React SPA (frontend)      — see apps/web/AGENTS.md
│   └── api/         ← Node/Fastify service (backend) — see apps/api/AGENTS.md
```

- **Determine your workspace first.** Frontend changes go in `apps/web`, backend in `apps/api`.
- The `MediaItem` contract must stay consistent across both — model it once with Zod and mirror
  the shape on each side.

## Golden Rules (both workspaces)

- **TypeScript strict — never `any`.** Use `unknown` and narrow.
- **Zod is the contract source of truth.** Validate every boundary; infer types with `z.infer`.
- **Do not add dependencies** without explicit mention.
- **Do not build out-of-scope features** (auth, uploads, custom categories, thumbnails — see
  `DECISIONS.md` DEC-013).
- **Keep it simple.** No speculative layers, abstractions, or infrastructure.
- Conventional commits; every behavior change ships with tests.

## Frontend Rules (`apps/web`)

- **Components are UI-only. All logic lives in custom hooks** (the #1 rule).
- TanStack Query for ALL server state — never `useEffect` + `useState` fetching.
- Zustand for global client state (Vault filter, capture input); `useState` for local only.
- Tailwind, mobile-first; no inline styles for static values.
- Named exports; PascalCase components; `use`-prefixed hooks.
- Optimistic updates for triage/delete so cards disappear instantly.

## Backend Rules (`apps/api`)

- Fastify, simple layered structure: routes/handlers thin → services own logic → repository owns
  Prisma access.
- Services never touch HTTP (`reply`) or Prisma directly outside the repository.
- Typed business exceptions + centralized error handler; response shape
  `{ error: { code, message, details } }`.
- Pino only — never `console.log`.
- Link-title extraction is best-effort with a **mandatory raw-link fallback** (DEC-012).

## Common Tasks

- **New endpoint (api)**: Zod schema → route → handler → service → repository (+ unit test).
- **New screen/feature (web)**: page → feature components → hook (TanStack Query) → service →
  Zod types (+ component & hook tests + MSW handler).
- **New validation**: define one Zod schema, infer the type from it.
- **Schema change**: edit `prisma/schema.prisma` → create a migration → update repository.

## Build & Run

```bash
# from repo root (npm workspaces)
npm install
npm run dev                # runs web + api

# backend (apps/api)
npm run dev  --workspace=@curator/api
npm test     --workspace=@curator/api
npx prisma migrate dev --workspace=@curator/api

# frontend (apps/web)
npm run dev  --workspace=@curator/web
npm test     --workspace=@curator/web
npm run build --workspace=@curator/web
```

> Adjust workspace names to match each `package.json`. Run tests after every change.

## Banned Patterns (quick list)

`any` · `console.log` · `useEffect`+`useState` for server data · business logic in
components/handlers · Prisma access outside repositories · Joi/class-validator · Redux/MobX for
server state · Express/NestJS/Winston as defaults · Webpack/Bun defaults · clean-architecture
ceremony · prop drilling > 2 levels · hardcoded secrets · adding deps silently · building
out-of-scope features.
