# CLAUDE.md

## Project

Magen is a real-time crisis monitoring dashboard for Israel.

## Context files

1. `tasks.md` — active work
2. `plan.md` — architecture and product decisions
3. `progress.md` — latest session state

Check `tasks.md` before starting work.

## Stack

Next.js 16, TypeScript, Tailwind CSS, shadcn/ui, Zustand, mapcn/MapLibre, Supabase, Zod, Railway workers, next-intl, Vitest, React Testing Library, ESLint

## Product rules

- Official alerts are highest priority.
- Keep official alerts, official guidance, and news visually separate.
- Live streams are secondary context, not source of truth.
- Do not hide the newest alert only inside a tab.
- Build with RTL readiness from the start.

## Engineering rules

- Prefer simple solutions over premature abstraction.
- Validate external data with Zod.
- Do not add heavy infrastructure unless explicitly needed.
- Avoid unrelated refactors.
- Do not use `any` — use `unknown` and narrow safely.
- Prefer explicit types, inferred types, and shared schema-derived types.

## React Compiler

- Prefer simple, pure components and hooks.
- Avoid unnecessary `useMemo`, `useCallback`, and manual memoization.
- Use `useEffect` only for real side effects.
- Derive values in render when possible instead of syncing duplicated state.
- Follow React hook rules strictly.

## Workflow

- Work from `tasks.md`.
- Update task statuses as you go: `[ ]` `[-]` `[x]` `[!]`
- At the end of a session, update `tasks.md` and `progress.md`.

## Validation

After each meaningful task, run lint and relevant tests. Before ending a session or marking major work complete, run:

```sh
npm run lint
npm run test
npm run typecheck
npm run build
```

## Notes

- Use `mapcn` for the map.
- Use `next-intl` for strings that may need translation.
- When unsure, follow `tasks.md` first, then `plan.md`.
