# MyGym handoff snapshot

Last refreshed: 2026-07-30.

This file records durable current state and known follow-up work. `AGENTS.md` is the
authoritative rule source.

## Current baseline

- Expo SDK 57.0.9, React Native 0.86.2, React 19.2.3.
- TypeScript 6.0.3 and ESLint 9.39.5 are the latest versions compatible with the
  installed Expo lint toolchain. TypeScript 7 and ESLint 10 currently violate its
  peer ranges.
- Direct Expo/native versions pass `npx expo install --check`.
- `uuid@11.1.1` is intentionally enforced through Yarn `resolutions` to patch the
  transitive `xcode` dependency. Its CommonJS `v4()` API was verified.
- Dependency audit currently reports zero vulnerabilities.
- iOS, Android, and web production exports succeed.

## Architecture state

- The main tabs are Home, Workout, Exercises, and History.
- Dashboard counts and recent workouts come from SQLite; no fake activity metrics
  remain.
- `GymContext` owns gym selection and onboarding state.
- `WorkoutContext` owns the resumable active workout and derived timer.
- `useWorkouts` owns typed workout/template queries and mutations.
- `useExercises` owns paginated search and custom exercise mutations.
- Expo Router integrations use its public compatibility exports; app code has no
  direct `@react-navigation/*` imports.
- Icons use scoped `@react-native-vector-icons` packages.

## Database state

- Schema version is `2`.
- Initialization is non-destructive and enables WAL plus foreign keys.
- The version-2 legacy migration adds `workout.template_id`, `workout.status`, and
  `workout_set.set_type`, converts legacy warm-up flags, and creates query indexes.
- Multi-step workout/template mutations are transactional.
- Full-workout loading batches set rows instead of issuing one query per exercise.

## Security state

- The RapidAPI credential was removed from `scripts/fetchData.js`; the script now
  requires `RAPIDAPI_KEY` from the environment and does not save partial failures.
- Rotate any RapidAPI credential that was previously stored in a local copy or
  exposed elsewhere.

## Known next work

- Add automated tests. The repository currently relies on lint, typecheck, Expo
  diagnostics, exports, a migration smoke test, and manual flows.
- Run the full workout regression checklist on real iOS and Android targets; the
  upgrade was bundle-verified but no simulator/device interaction is recorded here.
- Consider adding a repeatable SQLite migration test fixture to the repository.
- Revisit the `uuid` resolution when Expo's `xcode` dependency accepts a patched
  release directly.

## Working tree note

The dependency/refactor work was performed on top of pre-existing uncommitted
feature files. Future agents must inspect `git status` and preserve those changes;
do not assume every current diff came from one task.
