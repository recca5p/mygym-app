# MyGym Agent Guide

This is the authoritative working agreement for coding agents in this repository.
Read it before editing. Treat `package.json`, the source code, and the database
migrations as the source of truth when this guide and implementation ever differ.

## First five minutes

1. Run `git status --short` and `git diff --stat`.
2. Preserve all existing changes. This repository may contain unfinished user work.
3. Read the files directly involved in the request and their callers before editing.
4. For substantial work, load the project skill at
   `.agents/skills/mygyma-maintainer/SKILL.md`.
5. Establish a baseline with the smallest relevant check before changing behavior.

Never reset, discard, reformat, or overwrite unrelated work to obtain a clean tree.

## Product and stack

MyGym is a local-first workout tracker for iOS, Android, and web. It supports
multiple gyms, workout templates and live sessions, exercise search and custom
exercises, workout history, and light/dark themes.

- Expo SDK 57, React Native 0.86, React 19.2
- Expo Router with typed, file-based routes
- `expo-sqlite`; there is no application backend
- Strict TypeScript and ESLint flat config
- React Context for cross-screen gym and active-workout state
- Yarn Classic; Node.js 22.13 or newer

Use `package.json` for exact versions.

## Structure and ownership

```text
app/                    Expo Router route components and layouts
components/             Cross-feature themed UI primitives
hooks/                  Cross-feature theme/platform hooks
constants/              Shared design tokens
src/components/         MyGym feature components and modals
src/store/              Long-lived cross-screen state providers
src/hooks/              SQLite query/mutation APIs and domain types
src/database/           Schema, idempotent migrations, indexes, and seed data
src/utils/              Pure helpers with no React or database dependency
scripts/                Offline exercise-data maintenance
.agents/skills/         Reusable project workflow for future agents
```

Keep route files focused on composition, navigation, and screen-level state. Put
reusable feature UI in `src/components`, database access in `src/hooks`, persistent
session orchestration in `src/store`, and pure transformations in `src/utils`.

Read `.agents/skills/mygyma-maintainer/references/architecture.md` for the current
route map, provider tree, and data-flow boundaries.

## Coding rules

### TypeScript and React

- Keep strict TypeScript clean. Do not add `any`, unchecked assertions, or
  `require()` calls to bypass the type system.
- Type SQLite result rows and route objects explicitly. Use `unknown` at untrusted
  JSON boundaries and narrow it.
- Import project files through `@/` unless a same-directory relative import is
  clearer.
- Use the normalized `useColorScheme` from `@/hooks/use-color-scheme`; it always
  returns `light` or `dark`.
- Use effects only to synchronize with external systems. Derive render values during
  render, clean up subscriptions/timers, and guard async work against stale results.
- Do not ship placeholder metrics, dates, or history. Query real data or render an
  honest empty state.
- Conditionally mount modal form bodies when local form state must reset on open.
- Add accessibility labels to icon-only controls and keep tap targets usable.

### Navigation and Expo

- Import navigation integration through Expo Router:
  `expo-router`, `expo-router/react-navigation`, or `expo-router/js-tabs`.
- Do not add direct `@react-navigation/*` application imports.
- Use typed `Href`/route objects instead of `as any`.
- Use scoped `@react-native-vector-icons/*`; do not restore deprecated
  `@expo/vector-icons`.

### SQLite

- Initialization must never drop user tables or erase data.
- Make every migration idempotent, run multi-step changes in a transaction, and
  increment `PRAGMA user_version`.
- Keep `PRAGMA foreign_keys = ON` and WAL initialization.
- Bind all values. SQL identifiers cannot be bound, so whitelist dynamic column
  names before interpolating them.
- Wrap related writes in `withTransactionAsync`.
- Avoid N+1 reads; fetch collections in batches and group them in TypeScript.
- When the schema changes, update the create schema, migration, indexes, result
  types, seed path, and database reference together.

Read `.agents/skills/mygyma-maintainer/references/database.md` before schema,
migration, seed, or non-trivial query work.

### Dependencies and security

- Use `npx expo install <package>` for Expo/native runtime packages.
- Upgrade to the newest versions compatible with the current Expo SDK; registry
  “latest” is not valid when Expo or peer ranges reject it.
- For an SDK bump, read the official changelog/migration notes, then run
  `npx expo install --fix` and `npx expo-doctor@latest`.
- Explain and test any Yarn `resolutions`; they are deliberate transitive security
  overrides.
- Never commit credentials. `scripts/fetchData.js` reads `RAPIDAPI_KEY` only from the
  environment and must fail rather than save partial data when a fetch fails.

## Delivery workflow

1. Inspect the dirty tree and establish the relevant baseline.
2. Make the smallest coherent change that fully handles the request.
3. Update documentation when routes, boundaries, migrations, commands, or
   architectural decisions change.
4. Run the required automated checks.
5. Report what changed, what was verified, and any manual/native validation still
   outstanding. Never claim a simulator or device test that was not run.

Minimum completion gate:

```bash
yarn validate
npx expo install --check
yarn audit --groups dependencies
git diff --check
```

Run an all-platform export after dependency, routing, Metro, icon/font, or native
module changes:

```bash
output_dir=$(mktemp -d /tmp/mygyma-export.XXXXXX)
npx expo export --platform all --output-dir "$output_dir"
```

For user-visible workout changes, manually exercise the affected flow when a
simulator/device is available: onboarding, gym switching, starting/resuming a
workout, adding/updating/removing sets, finishing/cancelling, history/detail,
templates, exercise search/custom exercise, and both color schemes.

## Handoff

`MEMORY.md` is the current snapshot and known-next-work list, not a rule source.
Update it only for durable handoff information. Do not use it as a chronological
log. Keep `README.md`, this guide, and the project skill aligned after structural
changes.
