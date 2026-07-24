# GitHub Copilot Instructions — React TypeScript

> **All rules live in `AGENTS.md` (single source of truth).** Read it before making changes.
> Also read `../../../docs/PROJECT.md`, `../../../docs/ARCHITECTURE.md`, `../../../docs/CONVENTIONS.md`, and `../../../docs/TESTING.md`.
> Formatting source of truth: `.editorconfig`.

## THE #1 RULE
Components are UI-only. All logic lives in custom hooks.

## Quick Reference (details in AGENTS.md)
- React 18+ with TypeScript strict, no `any`
- TanStack Query for all server state (never `useEffect` + `useState` fetching)
- Zustand for global client state
- React Hook Form + Zod for forms
- Tailwind CSS, mobile-first
- Vitest + RTL + MSW for testing — test behavior, query by role/label
- Named exports, PascalCase components, `use`-prefixed hooks

## Banned
- Class components | `any` | `dangerouslySetInnerHTML` without sanitization
- `useEffect` + `useState` for server data | Prop drilling > 2 levels
- Inline styles for static values | Business logic in components | `@ts-ignore` without justification
