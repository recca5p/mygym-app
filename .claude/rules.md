# MyGym rules

`AGENTS.md` at the repository root is authoritative. Read it before edits.

Required finish gate:

```bash
yarn validate
npx expo install --check
yarn audit --groups dependencies
git diff --check
```

Preserve unrelated dirty-tree changes, never drop SQLite user tables, never commit
credentials, and report manual simulator/device checks only when actually run.
