---
name: mygyma-maintainer
description: Maintain and extend the MyGym Expo application. Use when implementing or reviewing MyGym routes, screens, components, gym/workout/exercise state, SQLite schemas or queries, exercise seed tooling, dependency or Expo SDK upgrades, debugging, verification, documentation, or handoff work in this repository.
---

# MyGym Maintainer

Use this workflow to make safe, consistent changes in the MyGym repository while
preserving local user data and unfinished work.

## Orient before editing

1. Confirm the repository root and read `AGENTS.md` completely.
2. Run `git status --short` and `git diff --stat`.
3. Treat every pre-existing modification or untracked file as user work.
4. Read the target files, their callers, and the relevant types before designing a
   change.
5. Establish the smallest useful baseline check for the task.

Do not clean the tree, discard unrelated changes, or copy stale dependency/schema
facts from chat history.

## Load task-specific context

- Read [architecture.md](references/architecture.md) for routes, provider state,
  ownership boundaries, or UI work.
- Read [database.md](references/database.md) for schema, migration, query, seed,
  exercise-data, or persistence work.
- Read [workflow.md](references/workflow.md) for dependency upgrades, broad
  refactors, validation selection, and handoff.

Load only the references relevant to the request, but read each selected reference
fully.

## Implement within project boundaries

- Keep `app/` files focused on routing and screen composition.
- Put reusable feature UI in `src/components`.
- Put SQLite reads/writes and domain row types in `src/hooks`.
- Put cross-screen gym or active-session state in `src/store`.
- Put schema creation, migrations, indexes, and seeds in `src/database`.
- Put pure parsing and transformations in `src/utils`.

Use strict types, parameterized SQL, typed Expo Router routes, normalized theme
hooks, real data, honest empty states, and accessible controls. Avoid `any`,
unchecked casts, dynamic `require`, direct `@react-navigation/*` app imports, and
deprecated `@expo/vector-icons`.

## Protect persisted data

Never drop user tables during initialization. Make migrations idempotent, keep them
transactional, bump `PRAGMA user_version`, and update schema creation plus TypeScript
types and documentation together.

Whitelist SQL identifiers before interpolation. Bind values. Use transactions for
multi-step mutations and batch reads to prevent N+1 query patterns.

## Upgrade dependencies safely

Use `npx expo install` for Expo/native packages and select the latest versions
compatible with the current Expo SDK. Read official migration notes before an SDK
upgrade. Do not force registry-latest TypeScript, ESLint, React Native, or native
packages through incompatible peer ranges.

Refresh the lockfile, inspect warnings, audit transitive dependencies, and document
every security resolution with its compatibility check.

## Verify and hand off

Run checks in proportion to risk. The default finish gate is:

```bash
yarn validate
npx expo install --check
yarn audit --groups dependencies
git diff --check
```

Run `npx expo export --platform all` for dependency, routing, Metro, font/icon, or
native-module changes. Add targeted database and manual flow checks when relevant.

Before finishing:

1. Inspect the final diff and search for deprecated imports, secrets, and stale
   documentation.
2. Update `AGENTS.md`, `README.md`, references, and `MEMORY.md` if durable project
   facts changed.
3. State what changed and what actually passed.
4. List simulator/device or workflow validation that remains unperformed.
