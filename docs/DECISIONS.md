# Engineering Decisions

This file is the **authoritative log of significant engineering decisions** for the Curator
monorepo. **Agents must read this before proposing structural or tooling changes.** If you are
considering reversing or working around a decision below, stop and ask first.

---

## DEC-001 — Single-Language TypeScript Monorepo (npm workspaces)
**Status:** Accepted
**Date:** 2026-07-24
**Decision:** One repo, two workspaces managed by npm workspaces: `apps/web` (React) and
`apps/api` (Node/Fastify). Shared docs live in root `docs/`; stack-specific agent configs live
in each workspace.
**Why:** One language, one type system, and shared Zod contracts eliminate translation overhead —
the fastest, lowest-friction path to the MVP. npm workspaces add zero extra tooling.
**Do not:** Introduce a second backend language, or a heavier monorepo tool (Nx/Turborepo/Lerna)
for a two-package project.

## DEC-002 — Frontend: React 18+ (Vite SPA)
**Status:** Accepted
**Date:** 2026-07-24
**Decision:** React 18+ with TypeScript strict, built with Vite as an SPA.
**Why:** Minimal boilerplate for a small CRUD app; TanStack Query maps the Inbox/Vault screens
directly; the same TS + Zod as the backend.
**Do not:** Use Next.js / App Router, or class components.

## DEC-003 — Backend: Node.js + Fastify, Simple Layered Structure
**Status:** Accepted
**Date:** 2026-07-24
**Decision:** Fastify with a simple layered structure: `routes/handlers → services →
repository`, plus shared plugins. No clean/hexagonal architecture.
**Why:** The domain is a single entity with one non-trivial concern (title extraction). Clean
architecture would be pure overhead here.
**Do not:** Introduce Express/NestJS, or add manager/facade/use-case/generic-repository layers.

## DEC-004 — Database: SQLite via Prisma, PostgreSQL-Ready
**Status:** Accepted
**Date:** 2026-07-24
**Decision:** Prisma ORM with a SQLite datasource for the MVP. `prisma/schema.prisma` is the
schema source of truth; all changes go through committed migrations.
**Why:** SQLite is zero-config and single-file — the fastest start for a single-user app. Prisma
makes a later move to PostgreSQL a `provider` + `DATABASE_URL` change, not a rewrite.
**Do not:** Hand-write SQL in business logic, or access the DB outside repositories.

## DEC-005 — TypeScript Strict + Zod as the Contract Source of Truth
**Status:** Accepted
**Date:** 2026-07-24
**Decision:** TypeScript strict mode across both workspaces. Zod validates every boundary
(API body/params/query, config, API responses, form input) and DTO types are inferred with
`z.infer`.
**Why:** Runtime validation plus compile-time inference keeps the `MediaItem` contract honest
across the client/server split. Hand-maintained duplicate types drift.
**Do not:** Use `any`, Joi, class-validator, or hand-written duplicate DTO interfaces.

## DEC-006 — Server State: TanStack Query; Client State: Zustand
**Status:** Accepted
**Date:** 2026-07-24
**Decision:** TanStack Query owns all server state (Inbox/Vault lists, capture/triage/delete
mutations with optimistic updates). Zustand owns the little UI state (Vault filter, input buffer).
**Why:** Clear separation, minimal boilerplate, optimistic updates give the instant triage UX the
PRD requires.
**Do not:** Fetch server data with `useEffect` + `useState`; use Redux/MobX; use Zustand for
server data.

## DEC-007 — Styling: Tailwind CSS, Mobile-First
**Status:** Accepted
**Date:** 2026-07-24
**Decision:** Tailwind utility-first CSS with mobile-first responsive design.
**Why:** The primary surface is mobile; Tailwind is fast to iterate, tree-shakes well, and is
AI-agent-friendly.
**Do not:** Use inline styles for static values; introduce a separate design-system/Atomic Design
hierarchy in the MVP.

## DEC-008 — Component-Driven Architecture: UI-Only Components, Logic in Hooks
**Status:** Accepted
**Date:** 2026-07-24
**Decision:** Components render UI only; all data fetching, state, and side effects live in custom
hooks.
**Why:** Keeps components small and testable; hooks are composable and reusable.
**Do not:** Put business logic or data fetching directly in components.

## DEC-009 — Typed Business Exceptions + Centralized Error Handler (Backend)
**Status:** Accepted
**Date:** 2026-07-24
**Decision:** Services throw typed exceptions; a centralized Fastify error handler maps them to
`{ error: { code, message, details } }` and logs once.
**Why:** Keeps services framework-agnostic and failure paths consistent.
**Do not:** Return `reply` from services; add `try/catch` in every handler; expose stack traces.

## DEC-010 — Logging: Pino (Backend)
**Status:** Accepted
**Date:** 2026-07-24
**Decision:** Pino structured JSON logging for the backend.
**Why:** Fast, structured, integrates naturally with Fastify.
**Do not:** Use `console.log` in production paths or introduce Winston.

## DEC-011 — Testing: Logic & Failure Modes First
**Status:** Accepted
**Date:** 2026-07-24
**Decision:** Vitest across both workspaces. Backend: unit-test services + focused integration
via `app.inject()`. Frontend: RTL + MSW, test behavior, co-located tests. Prioritize link
detection, title fallback, triage transition, and Vault filtering.
**Why:** These paths carry the real risk; route-by-route E2E suites are brittle and low value.
**Do not:** Build a full endpoint E2E suite, Playwright, or Gherkin/BDD by default.

## DEC-012 — Link Title Extraction Is Best-Effort with a Mandatory Fallback
**Status:** Accepted
**Date:** 2026-07-24
**Decision:** The backend fetches a submitted URL and parses its `<title>` with a short timeout.
Any failure falls back to storing/displaying the raw link (`title = null`). Fetched HTML is
treated as untrusted; only the parsed title string is used.
**Why:** Capture must never be blocked or fail because a remote page is slow or malformed (PRD).
**Do not:** Make a capture depend on successful extraction; render thumbnails or fetch images.

## DEC-013 — Explicitly Deferred (Out of Scope for the MVP)
**Status:** Accepted
**Date:** 2026-07-24
**Decision:** No authentication/accounts, no image/upload/camera, no custom categories (closed
enum), no link thumbnails. Also deferred: i18n, Docker/nginx/BFF proxy, analytics/monitoring
SDKs, and multi-environment deploy pipelines.
**Why:** Protect the MVP timeline (PRD §4).
**Do not:** Add code paths, dependencies, or schema fields for these without an explicit new
decision recorded here.

---

## Working Defaults

### Must
- TypeScript strict in both workspaces; Zod for all boundaries with inferred types.
- React + TanStack Query + Zustand + Tailwind (frontend); Fastify + Prisma + Pino (backend).
- SQLite via Prisma with committed migrations.
- Typed business exceptions + centralized error handler (backend).
- UI-only components, logic in hooks (frontend).

### Should
- Keep the backend layered and thin; keep the frontend flat (no design system).
- Optimistic updates for triage/delete.
- Conventional commits; PRs < 400 lines with tests.

### Avoid
- `any`, Joi/class-validator, duplicate DTO types.
- `useEffect`+`useState` fetching, Redux/MobX, prop drilling > 2 levels.
- Express/NestJS, Winston, `console.log`, Webpack, Bun as defaults.
- Clean/hexagonal ceremony, generic repositories, RxJS, event buses.
- Auth, uploads, thumbnails, i18n, Next.js — deferred per DEC-013.

---

<!-- TEMPLATE — copy and fill in for new decisions
## DEC-XXX — Title
**Status:** Proposed | Accepted | Superseded by DEC-YYY · **Date:** YYYY-MM-DD
**Decision:** One paragraph.
**Why:** Reasoning, including alternatives considered.
**Do not:** What agents and developers must avoid as a result.
-->
