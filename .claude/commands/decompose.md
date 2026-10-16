---
description: Decompose a PRD into dependency-ordered tasks as JSON
argument-hint: <path to PRD, e.g. docs/prds/001-foo.md>
---

Use the tech-pm subagent to decompose the PRD at: $ARGUMENTS

Steps:
1. Read the PRD, CLAUDE.md, and skim `src/` and `tests/`.
2. Write `tasks.json` at the repo root, matching exactly:

```
{"prd": "<path>", "tasks": [
  {"id": "T1", "title": "...", "kind": "feature|chore|bugfix",
   "depends_on": ["T0"], "requirements": [1, 2],
   "acceptance": ["Given/When/Then ..."], "files_hint": ["src/..."]}
]}
```

3. Check: ids unique, no cycles, every PRD requirement number appears in some task.
Do not write implementation code. Do not create issues; a script does that.
