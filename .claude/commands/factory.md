---
description: Run the whole pipeline locally - PRD, implement, review, validate tests
argument-hint: <feature idea>
---

Run the full factory for: $ARGUMENTS

1. Run `/prd $ARGUMENTS` and show me the PRD path. Stop and ask me to approve it
   if it has open questions.
2. Run `/implement <that PRD path>`.
3. Run `/review`. If it says REQUEST CHANGES, fix the findings and re-review (max 2 loops).
4. Run `/validate-tests <that PRD path>`. If FAIL, fix gaps and re-run (max 2 loops).
5. Print a final report: PRD path, files changed, review verdict, test verdict.
