# MyGym maintenance workflow

## Choose validation by risk

Always run:

```bash
yarn lint
yarn typecheck
git diff --check
```

Run the full gate for completed implementation work:

```bash
yarn validate
npx expo install --check
yarn audit --groups dependencies
```

Add an all-platform export for dependency, Expo SDK, routing, Metro, icons/fonts,
or native-module work:

```bash
output_dir=$(mktemp -d /tmp/mygyma-export.XXXXXX)
npx expo export --platform all --output-dir "$output_dir"
```

Add a database fixture test and `PRAGMA foreign_key_check` for migrations. Add
manual iOS/Android flows for user-visible or native behavior. Record unperformed
manual checks explicitly.

## Dependency upgrade workflow

1. Capture direct versions, Node/Yarn versions, `expo install --check`,
   `expo-doctor`, and audit results.
2. Check the official Expo SDK compatibility table and changelogs.
3. Upgrade the Expo SDK first, then run `npx expo install --fix`.
4. Remove deprecated configuration and update breaking imports/APIs.
5. Upgrade non-Expo packages within compatible peer ranges.
6. Refresh transitive packages with Yarn and inspect warnings.
7. Use a `resolutions` override only when:
   - a relevant advisory remains;
   - a patched release exists;
   - the consumed API was checked for compatibility; and
   - lint, typecheck, doctor, audit, and exports still pass.
8. Document why each forced resolution exists and when it can be removed.

Do not call a registry-major “latest” if the current Expo SDK or
`@typescript-eslint` rejects it. Report it as latest compatible and name the
constraint.

## Refactor workflow

1. Identify the behavior and data ownership before moving code.
2. Fix correctness/security issues before cosmetic restructuring.
3. Keep route, UI, state, database, and pure-helper boundaries explicit.
4. Replace duplicated parsing/query logic with a typed helper.
5. Guard async searches and screen loads against stale completion.
6. Make multi-write domain operations transactional.
7. Remove dead starter routes/components only after verifying they have no imports
   or navigation references.
8. Re-run the narrow check after each coherent slice, then the full gate.

## Review checklist

- No unrelated user changes were discarded.
- No credentials or secret values are present.
- No `any`, type-system bypass, or unvalidated dynamic SQL was introduced.
- No database initialization path drops user data.
- Queries use indexes/batches for list and nested data paths.
- UI renders real data or an honest empty state.
- Routes and navigation objects are typed.
- Light/dark behavior and icon accessibility remain intact.
- Documentation matches the actual structure and commands.

## Handoff format

Report:

1. Outcome and major behavior changes.
2. Dependency baseline and any compatibility exceptions.
3. Database migration/security implications.
4. Exact automated checks that passed.
5. Manual/device checks not run.
6. Concrete known-next-work, without inventing a roadmap.

Update `MEMORY.md` only when those facts will help the next agent. Keep it concise
and replace obsolete facts rather than appending a running transcript.
