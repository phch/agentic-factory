---
description: Generate a PRD from a feature idea and save it to docs/prds/
argument-hint: <feature idea or issue text>
---

Use the prd-writer subagent to turn this idea into a PRD: $ARGUMENTS

Steps:
1. Read CLAUDE.md and skim `src/` and `docs/prds/` so the PRD fits the existing code.
2. Pick the next number NNN (highest existing + 1) and a slug.
3. Write `docs/prds/NNN-slug.md` using this template:

```
# NNN: <Title>
## Problem
## Goals / Non-goals
## User stories
## Requirements (numbered, each testable)
## Acceptance criteria (Given/When/Then)
## Test plan (unit tests that prove each requirement)
## Open questions
```

Do not write implementation code. List open questions instead of guessing.
