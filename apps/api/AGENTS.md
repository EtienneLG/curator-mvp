# AGENTS.md

> Universal AI agent instructions. Read by GitHub Copilot, Cursor, Claude, and others.

## Primary Reference

This is the **backend** workspace (`apps/api`) of the Curator monorepo. Shared docs live in
the repo-root `docs/` folder — the single source of truth.

Read and follow `../../docs/AI-RULES.md` for operational guidance covering:
- Architecture (Fastify, simple layered structure: routes/handlers → services → repository)
- Code style (TypeScript strict, Zod, ES Modules, `tsx` + `swc`)
- Error handling (typed business exceptions, centralized error handler)
- Testing (logic-first, focused integration only)
- Banned patterns (`any`, `console.log`, gratuitous complexity)
- Build commands and common tasks

## Context Files (repo-root `docs/`)

| File | When to Read |
|------|-------------|
| `../../docs/PROJECT.md` | Before touching business logic or the `MediaItem` domain |
| `../../docs/DECISIONS.md` | Before changing architecture, tooling, or defaults |
| `../../docs/ARCHITECTURE.md` | Before creating new layers or changing request flow |
| `../../docs/CONVENTIONS.md` | Before creating files, naming things, or structuring code |
| `../../docs/TESTING.md` | Before writing or modifying tests |

## Quick Constraints

- Fastify with a simple layered structure: routes/handlers → services → repository.
- Routes/handlers are thin: validate → delegate → respond.
- TypeScript strict, never `any`, Zod for all validation and DTO inference.
- All Prisma/DB access lives in repositories — never in handlers or services.
- Metadata suggestions are resolved only at refine time (never at capture) and are best-effort
  with a mandatory empty-result fallback (see DEC-016).
- Pino logger only — never `console.log`.
- Prefer unit tests for logic and error handling over broad endpoint suites.
- Run `npm test` after every change.
