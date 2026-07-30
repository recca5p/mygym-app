# MyGym project skill entry point

Read `AGENTS.md` at the repository root before editing. It is the authoritative
source for project structure, coding standards, database safety, dependency
management, validation, and handoff.

For implementation work, use:

```text
.agents/skills/mygyma-maintainer/SKILL.md
```

That skill routes to the current architecture, database, and workflow references.
Do not duplicate version tables or migration instructions here; inspect
`package.json`, `src/database/schema.ts`, and `src/database/dbConfig.tsx` directly.
