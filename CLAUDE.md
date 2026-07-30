# Claude entry point

Read and follow `AGENTS.md` before changing this repository. It is the authoritative
source for structure, coding rules, database safety, dependency management,
verification, and handoff.

For substantial MyGym work, also read
`.agents/skills/mygyma-maintainer/SKILL.md` and load only the reference files it
routes to for the current task.

Do not rely on older conversation memory for dependency versions or migration
behavior. Inspect `package.json`, `src/database/schema.ts`, and
`src/database/dbConfig.tsx` directly.
