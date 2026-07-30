# MyGym database and exercise data

## Initialization

`src/database/dbConfig.tsx` initializes `mygyma.db` in this order:

1. Enable WAL.
2. Enable foreign keys.
3. Create missing tables from `createTablesQuery`.
4. Run the idempotent legacy migration in a transaction.
5. Create indexes and set `PRAGMA user_version`.
6. Seed exercises only when the exercise table is empty.

Initialization must never drop user tables.

## Schema version 2

Tables:

- `app_settings(key, value)`: persisted active gym and active workout IDs.
- `gym`: user-defined gym locations.
- `profile`: reserved local profile/target data.
- `exercise`: bundled and custom exercise definitions; array-like fields are JSON
  strings.
- `workout`: live, completed, and template records.
- `workout_exercise`: ordered exercise instances within a workout.
- `workout_set`: ordered sets with weight, reps, duration, distance, type, and
  completion state.

Relationships:

```text
gym 1 ── * workout                gym deletion sets workout.gym_id to NULL
workout 1 ── * workout_exercise   workout deletion cascades
exercise 1 ── * workout_exercise
workout_exercise 1 ── * workout_set
workout(template) 1 ── * workout(template_id)
```

Indexes cover exercise name search, gym/status/start workout queries, ordered
workout exercises, and ordered workout sets.

The version-2 migration adds missing `workout.template_id`, `workout.status`, and
`workout_set.set_type`. If a legacy `is_warmup` column exists, warm-up rows are
converted to `set_type = 'warmup'`.

## Schema-change procedure

1. Update `createTablesQuery` for fresh installs.
2. Add an idempotent migration based on current table/column state.
3. Run related statements in `withTransactionAsync`.
4. Increment `DATABASE_VERSION` and `PRAGMA user_version`.
5. Add or adjust indexes for new access patterns.
6. Update domain row interfaces and every affected query.
7. Update seed insertion/defaults when exercise fields change.
8. Test both an empty database and a fixture representing the previous version.
9. Run `PRAGMA foreign_key_check`.
10. Update this reference and `MEMORY.md`.

Never implement a migration by dropping production tables. If SQLite requires a
table rebuild, copy data to a new table, validate it, swap names inside a
transaction, and preserve IDs/relationships.

## Query rules

- Bind every value with positional or named parameters.
- Whitelist dynamic identifiers; they cannot be safely bound.
- Use transactions for operations that must succeed or fail together.
- Batch child collections with `IN (...)` or joins and group them in TypeScript.
- Preserve numeric zero with nullish coalescing; do not use truthiness fallbacks for
  weight, reps, duration, distance, or IDs.
- Use `parseStringArray` from `src/utils/json.ts` at JSON-string boundaries.

## Exercise data pipeline

Files:

- `exercises.json`: original bundled source.
- `exercises_raw_v2.json`: optional fetched external source.
- `exercises_v2.json`: merged seed used when non-empty.
- `scripts/fetchData.js`: fetches external pages.
- `scripts/mergeData.js`: normalizes and merges the sources.
- `src/database/seed.ts`: typed, prepared-statement insertion.

Refresh:

```bash
RAPIDAPI_KEY=your_key node scripts/fetchData.js
node scripts/mergeData.js
```

The key must come from the environment. Never commit it. A failed page fetch must
exit nonzero and leave the previous dataset intact.
