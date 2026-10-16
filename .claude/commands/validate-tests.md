---
description: Run the tests and judge whether they actually validate the PRD
argument-hint: [path to PRD]
---

Use the test-validator subagent. PRD (optional): $ARGUMENTS

Steps:
1. Run `make test` and report pass/fail with output for failures.
2. Map each PRD requirement / acceptance criterion to a test. List any uncovered.
3. Flag weak tests: no assertions, asserting only that code runs, over-mocking,
   tests that would still pass if the implementation were broken.
4. Mutation check by hand: for 2-3 key functions, name a small code change that
   should break a test, and confirm a test would catch it.
5. Verdict: PASS (green and covered) or FAIL, with the specific gaps.
Do not edit files.
