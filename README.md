# MyGym

MyGym is a local-first workout tracker built with Expo. It supports multiple gyms,
live workout sessions, reusable templates, set logging, workout history, exercise
search, and custom exercises across iOS, Android, and web.

## Stack

- Expo SDK 57 and Expo Router
- React Native 0.86 and React 19.2
- `expo-sqlite` with idempotent local migrations
- Strict TypeScript 6 and ESLint 9
- Yarn Classic

The app has no backend. User data is stored in the device-local `mygyma.db`.

## Setup

Requirements:

- Node.js 22.13 or newer
- Yarn 1.22.22

```bash
yarn install
yarn start
```

Use `yarn ios`, `yarn android`, or `yarn web` to target a platform.

## Quality commands

```bash
yarn lint          # ESLint, zero warnings allowed
yarn typecheck     # Strict TypeScript
yarn doctor        # Expo dependency/project diagnostics
yarn build:web     # Static web export
yarn validate      # All commands above
```

For changes to Expo, routing, Metro, icons/fonts, or native modules, also run:

```bash
npx expo install --check
yarn audit --groups dependencies
output_dir=$(mktemp -d /tmp/mygyma-export.XXXXXX)
npx expo export --platform all --output-dir "$output_dir"
```

## Architecture

```text
app/                screens and file-based navigation
src/components/     workout/exercise/gym feature UI
src/store/          GymContext and active WorkoutContext
src/hooks/          typed SQLite domain operations
src/database/       schema, migrations, indexes, and exercise seed
src/utils/          pure shared helpers
components/         shared themed primitives
hooks/              theme/platform hooks
scripts/            offline exercise-data refresh and merge tools
```

Provider order is:

```text
ThemeProvider
└── SQLiteProvider
    └── GymProvider
        └── WorkoutProvider
            └── Expo Router stack
```

See [AGENTS.md](./AGENTS.md) for working rules and
[the MyGym maintainer skill](./.agents/skills/mygyma-maintainer/SKILL.md) for the
implementation workflow and detailed architecture/database references.

## Database

Database initialization enables WAL and foreign keys, creates missing tables, runs
idempotent migrations, creates indexes, and seeds exercises only when the exercise
table is empty. It must not drop user tables.

Current schema version is `2`. Schema work must update both
`src/database/schema.ts` and the migration path in `src/database/dbConfig.tsx`.

## Exercise data maintenance

Exercise data is bundled into the app. Refreshing the optional external source
requires a RapidAPI key in the shell environment:

```bash
RAPIDAPI_KEY=your_key node scripts/fetchData.js
node scripts/mergeData.js
```

Never place the key in source, JSON, logs, or documentation. The fetch script exits
without saving partial results if any request fails.

## Agent handoff

- `AGENTS.md`: authoritative project rules
- `.agents/skills/mygyma-maintainer/`: reusable workflow and detailed references
- `MEMORY.md`: current implementation snapshot and known next work
- `CLAUDE.md` and `.claude/rules.md`: compatibility pointers for Claude-based agents
