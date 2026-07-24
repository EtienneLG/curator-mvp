# GitHub Copilot Instructions

Read these files in order before suggesting code:

1. `AGENTS.md` — quick operating rules and context map
2. `../../../docs/AI-RULES.md` — operational AI guidance for the monorepo
3. `../../../docs/PROJECT.md` — business domain and critical rules
4. `../../../docs/DECISIONS.md` — settled engineering decisions and defaults
5. `../../../docs/ARCHITECTURE.md` — request flow, boundaries, and patterns
6. `../../../docs/CONVENTIONS.md` — naming, structure, and coding rules
7. `../../../docs/TESTING.md` — testing strategy and priorities

Formatting source of truth: `.editorconfig`.

## Quick Constraints

- Fastify with a simple layered structure: routes/handlers → services → repository.
- TypeScript strict, never `any`, Zod for all validation and DTO inference.
- Services never own transport or persistence details; Prisma access lives in repositories.
- Centralized error middleware, no try/catch in routes by default.
- Pino logger only — never `console.log`.
- Vitest first, Arrange / Act / Assert, focused integration only when useful.
- Formatting: `.editorconfig` is the source of truth.
