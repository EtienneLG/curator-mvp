# GitHub Copilot Instructions — Curator Monorepo

This is a monorepo with two workspaces:
- `apps/web` — frontend (React 18+, TypeScript strict, TanStack Query, Zustand, Tailwind)
- `apps/api` — backend (Fastify, layered routes → services → repository, Prisma)

## Required Reading

Read the canonical instructions for the workspace you're editing **before making changes**:

| File | Scope |
|------|-------|
| `apps/web/AGENTS.md` | Canonical rules for `apps/web` (frontend) |
| `apps/api/AGENTS.md` | Canonical rules for `apps/api` (backend) |
| `docs/AI-RULES.md` | Top-level operational AI rules for the monorepo |
| `docs/PROJECT.md` | Business domain (`MediaItem`), rules, lifecycle |
| `docs/ARCHITECTURE.md` | System design, data flow, API surface |
| `docs/CONVENTIONS.md` | Coding standards, naming, structure |
| `docs/TESTING.md` | Testing strategy and coverage requirements |
| `docs/DECISIONS.md` | Settled engineering decisions — read before proposing changes |

Path-specific rules for components, hooks, routes, and services live in
`.github/instructions/*.instructions.md` and apply automatically based on file path.

## Monorepo-Wide Non-Negotiables

- TypeScript strict mode everywhere — never use `any` (use `unknown` if truly needed)
- Zod for all validation / runtime schemas; infer TypeScript types from Zod schemas
- Never use `console.log` — `apps/api` uses Pino; `apps/web` uses toast notifications for errors
- `.editorconfig` is the source of truth for formatting (2-space indent, LF line endings)
- Do not add dependencies without explicit mention
- Commit format: Conventional Commits (`type(scope): description`)
