# MyGym architecture

## Runtime shape

MyGym is a local-first Expo Router application. SQLite is the persistence layer;
there is no application API or remote account state.

The root provider order is:

```text
ThemeProvider
└── SQLiteProvider(databaseName="mygyma.db", onInit=initializeDatabase)
    └── GymProvider
        └── WorkoutProvider
            └── RootNavigator
```

The database must be ready before gym/session providers query it. `RootNavigator`
redirects to onboarding when no gym exists.

## Route map

```text
app/_layout.tsx              provider composition and root stack
app/onboarding.tsx           first-gym creation
app/(tabs)/_layout.tsx       Home, Workout, Exercises, History
app/(tabs)/index.tsx         real dashboard summary and recent workouts
app/(tabs)/workout.tsx       quick start and templates
app/(tabs)/exercises.tsx     paginated exercise library
app/(tabs)/history.tsx       workout calendar/history
app/exercise/[id].tsx        exercise detail
app/workout/active.tsx       live workout session
app/workout/[id].tsx         completed workout detail
```

Use Expo Router route objects and public compatibility modules:

- `expo-router` for `Stack`, `Tabs`, `router`, `Href`, hooks
- `expo-router/react-navigation` for theme and compatible primitives
- `expo-router/js-tabs` for tab bar types

Do not import `@react-navigation/*` directly in application code.

## Ownership boundaries

### Route screens

Own navigation, screen-level loading/empty/error presentation, and composition.
Delegate reusable forms, pickers, rows, and modals to `src/components`. Avoid
embedding reusable SQL in screens.

### Feature components

`src/components` contains gym, exercise, workout-set, template, history, and
time-edit UI. Mount form bodies conditionally when their state should reset each
time a modal opens.

`components` and `hooks` at the root contain cross-feature themed/platform
primitives inherited from the Expo application shell.

### Domain hooks

- `useExercises`: paginated/filterable exercise reads and custom-exercise CRUD.
- `useWorkouts`: workout, set, template, summary, and history operations.

Keep SQLite row interfaces next to the domain hook that returns them. Type every
joined row and normalize SQLite booleans at the boundary.

### Stores

- `GymContext`: gym collection, active gym, persisted `active_gym_id`, onboarding.
- `WorkoutContext`: one resumable active workout, persisted `active_workout_id`,
  session refresh, finish/cancel, and elapsed time.

Do not duplicate these states in another hook. Derive elapsed time from the stored
start timestamp and a timer tick; do not persist a counter every second.

## Data flows

```text
screen interaction
→ feature component or context action
→ typed domain hook
→ parameterized expo-sqlite query/transaction
→ context refresh or screen query
→ rendered state
```

Dashboard and history data must be queried from SQLite. Do not add mock activity,
calorie, count, or date values to production routes.

## UI conventions

- Get the scheme from `@/hooks/use-color-scheme`; it is normalized to `light` or
  `dark`.
- Use existing tokens and themed primitives where they fit.
- Use scoped packages from `@react-native-vector-icons`.
- Give icon-only buttons accessibility labels.
- Show truthful loading and empty states.
- Cancel or ignore stale asynchronous screen and search results.
