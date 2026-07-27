---
applyTo: "apps/web/src/components/**/*.tsx"
---
# React Components

> Detailed rules in `AGENTS.md` → Component Rules.

## Rules
- Functional components only, one per file, under 200 lines
- Props interface defined above component declaration
- Named exports (default export only for page components)
- Logic belongs in custom hooks — components are UI-only
- Tailwind CSS for styling (mobile-first)
- No prop drilling > 2 levels — use context or Zustand
- `React.memo` only when profiler confirms re-render issues

## Anti-patterns
- Do NOT call APIs directly inside components
- Do NOT create stateful side effects in visual components
- Do NOT optimize with `React.memo` without profiler evidence
