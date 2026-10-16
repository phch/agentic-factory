---
description: Implement a PRD with tests, then run the test suite
argument-hint: <path to PRD, e.g. docs/prds/001-foo.md>
---

Use the implementer subagent to implement the PRD at: $ARGUMENTS

Steps:
1. Read the PRD and CLAUDE.md.
2. Write failing unit tests first, one per requirement / acceptance criterion.
3. Implement the minimum code to pass them.
4. Run `make check` (lint, types, tests, coverage >= 90%) until green. Do not weaken or delete tests to get there.
5. Summarize what changed and map each requirement to its test.
