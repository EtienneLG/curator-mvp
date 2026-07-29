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
**Why:** Minimal boilerplate for a small CRUD app; TanStack Query maps the Inbox/Library screens
directly; the same TS + Zod as the backend.
**Do not:** Use Next.js / App Router, or class components.

## DEC-003 — Backend: Node.js + Fastify, Simple Layered Structure
**Status:** Accepted
**Date:** 2026-07-24
**Decision:** Fastify with a simple layered structure: `routes/handlers → services →
repository`, plus shared plugins. No clean/hexagonal architecture.
**Why:** The domain is a single entity with one non-trivial concern (refine-time metadata
suggestions). Clean architecture would be pure overhead here.
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
**Decision:** TanStack Query owns all server state (Inbox/Library lists, capture/triage/delete
mutations with optimistic updates). Zustand owns the little UI state (Library filters, input buffer).
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
via `app.inject()`. Frontend: RTL + MSW, test behavior, co-located tests. Prioritize the
suggestions branch (URL fetch vs. media lookup), its best-effort fallback, triage transition,
and Library filtering/sorting.
**Why:** These paths carry the real risk; route-by-route E2E suites are brittle and low value.
**Do not:** Build a full endpoint E2E suite, Playwright, or Gherkin/BDD by default.

## DEC-013 — Explicitly Deferred (Out of Scope for the MVP)
**Status:** Accepted (amended by DEC-016)
**Date:** 2026-07-24
**Decision:** No authentication/accounts, no image/upload/camera, no custom categories (closed
enum), no link/media thumbnails or poster art. Also deferred: i18n, Docker/nginx/BFF proxy,
analytics/monitoring SDKs, and multi-environment deploy pipelines. **Amended by DEC-016:**
text-based web metadata suggestions (title/year/creator/description) are in-scope — only
un-defers *text* metadata lookup; images/thumbnails/posters remain deferred.
**Why:** Protect the MVP timeline (PRD §4).
**Do not:** Add code paths, dependencies, or schema fields for these without an explicit new
decision recorded here.

## DEC-014 — Fastify Route Validation: `fastify-type-provider-zod`
**Status:** Accepted
**Date:** 2026-07-27
**Decision:** Added `fastify-type-provider-zod` (pinned `^5.x` — required for `zod@^4.2+`
support) as the bridge between Zod schemas and Fastify. Routes attach Zod schemas directly to
`schema: { body, response, params, querystring }` via `app.withTypeProvider<ZodTypeProvider>()`,
with `setValidatorCompiler`/`setSerializerCompiler` wired once in `app.ts`. `@fastify/swagger`
uses the package's `jsonSchemaTransform` so the OpenAPI spec is generated from the same Zod
schemas. Handlers no longer call `.parse()` directly — invalid requests never reach them.
**Why:** DEC-005 already mandates Zod at every API boundary. Previously, `items.route.ts`
validated the body manually inside the handler because no Zod↔Fastify bridge was installed; this
meant `@fastify/swagger` (already a dependency) couldn't document request/response shapes, and
every route would repeat the same manual-parse boilerplate. `fastify-type-provider-zod` is the
standard, officially-recommended way to use Zod with Fastify's native schema/validation/OpenAPI
pipeline, keeping routes thin per DEC-003 and the error envelope unchanged per DEC-009 (the
centralized error handler maps both `ZodError` and the package's Fastify-native validation
errors to the same `{ error: { code: 'VALIDATION_ERROR', ... } }` shape).
**Do not:** Call `Schema.parse(request.body)` manually inside handlers/routes for HTTP-boundary
validation going forward — attach the schema to the route instead. Do not downgrade to
`fastify-type-provider-zod@^4` (Zod v3 only) or bypass the type provider's validator/serializer
compilers.

## DEC-015 — Rename "Library" to "Library"
**Status:** Accepted
**Date:** 2026-07-28
**Decision:** Renamed the second main screen from "Library" to "Library" everywhere: docs, the
`/library` route (→ `/library`), component/hook/file names, Zustand store fields, and TanStack
Query keys (`['items', 'library', ...]` → `['items', 'library', ...]`).
**Why:** Naming change requested by the product owner; used pervasively enough to track so
agents don't reintroduce "Library" in new code.
**Do not:** Leave mixed naming (e.g., a `LibraryView` importing from a `library/` folder) — this is
a full rename, not an alias.

## DEC-016 — Refine-Time Web Suggestions & Unified Capture Input
**Status:** Accepted (provider mapping finalized 2026-07-29)
**Date:** 2026-07-28
**Decision:** `MediaItem` has no `type`/`url` fields or `MediaType` enum — `content` is the only
captured input (free text or URL, no upfront distinction), and `POST /items` is a pure
validate-and-persist operation with no link detection or metadata lookup. All metadata
resolution happens later, in `suggestions.service`, triggered only when the user opens the
refine-metadata modal (`GET /items/{id}/suggestions`): if `content` parses as a URL, fetch the
page and extract title/description; otherwise, call an external "determine media" lookup to
suggest category/title/year/creator/description. Both branches are best-effort — any failure
(timeout, malformed response, no match) returns an empty/partial suggestion and never blocks the
modal or triage. Suggestion fields are plain text only (no images/posters/thumbnails). The
Inbox card UI is a single `ItemCard` (no `TextCard`/`LinkCard` split); it may still cosmetically
auto-linkify URL-shaped `content` client-side, but this is presentational only.

**Media-lookup provider mapping (resolved 2026-07-29):** the non-URL branch uses **Gemini**
(`@google/genai`, the current official SDK — `@google/generative-ai` is deprecated) strictly as
a **classifier**: given raw `content`, it returns `{ category, searchQuery }` only — it never
invents title/year/creator/description itself, so a hallucinated Gemini guess can never leak into
a MOVIE/BOOK/GAME item's metadata. The classified category then routes to exactly one
category-specific provider via a small registry:
- `MOVIE` → **TMDB**
- `BOOK` → **Open Library**
- `GAME` → **IGDB** (Twitch OAuth client-credentials token, cached/refreshed — not a plain API key)
- `ARTICLE` → **no provider** — Gemini's own guess (`searchQuery`) is used as-is for `title`,
  other fields stay `null`

Every external call (classifier + each provider) shares one timeout + best-effort wrapper: on
timeout/error/no-match it degrades to a partial/empty suggestion, never an exception. `@google/genai`
is the only new npm dependency — TMDB/Open Library/IGDB have no official Node SDKs and are called
via plain `fetch`.
**Why:** The product needs richer per-item metadata (year/creator/description) and computed
"suggestions from the web" to reduce manual triage entry, without treating text vs. link as a
first-class capture-time concept — URL-shape only matters when choosing a suggestion source.
This simplifies the schema (drops `type`/`url`/`MediaType`), consolidates the former
capture-time link-title-extraction logic into one refine-time service, and removes a
card-rendering branch. It also introduces a new external dependency, which per `AI-RULES.md`
requires an explicit decision rather than silent addition. Splitting "classify + build a query"
(Gemini) from "fetch the authoritative facts" (category-specific provider) keeps each system
doing only what it's good at, and a category-specific provider registry is simpler to read/test
than branching logic while staying proportionate to the closed 4-value `Category` enum.
**Do not:** Reintroduce `type`/`url` as stored fields or branch on them at capture time. Do not
run any network fetch during `POST /items`. Do not keep `TextCard`/`LinkCard` as separate
components. Do not let Gemini return or be trusted for title/year/creator/description outside
the `ARTICLE` no-provider case. Do not let a failed/slow suggestion lookup block capture or
triage. Do not fetch or store images/thumbnails as part of this feature — remains out of scope
per DEC-013. Do not add `@google/generative-ai` (deprecated) or unofficial TMDB/IGDB/Open
Library SDK wrappers.

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
