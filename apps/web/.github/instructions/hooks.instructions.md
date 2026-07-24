---
applyTo: "src/hooks/**/*.ts"
---
# Custom Hooks

> Detailed rules in `AGENTS.md` → Hooks Rules.

## Rules
- TanStack Query for ALL server data fetching (`useQuery`, `useMutation`)
- Query keys: `['entity', 'action', params]`
- Return consistent shapes: `{ data, isLoading, error }`
- Never call hooks conditionally
- `useMutation` with `onSuccess` for cache invalidation

## Anti-patterns
- Do NOT fetch server data with `useEffect` + `useState`
- Do NOT return inconsistent shapes across hooks
- Do NOT hide side effects that make hooks non-deterministic
