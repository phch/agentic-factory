---
description: Review the current branch diff against its PRD
argument-hint: [base branch, default main]
---

Use the reviewer subagent to review `git diff ${ARGUMENTS:-main}...HEAD`.

Check, in order:
1. Correctness bugs and unhandled edge cases.
2. Does the diff satisfy every requirement in the related PRD? List gaps.
3. Security issues and secrets.
4. Convention violations from CLAUDE.md.

Output findings as `[severity] file:line - problem - suggested fix`, most severe
first. End with a verdict: APPROVE or REQUEST CHANGES. Do not edit files.
