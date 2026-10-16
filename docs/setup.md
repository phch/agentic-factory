# Factory setup

## One-time repo setup
1. **Secrets:** `ANTHROPIC_API_KEY` and `FACTORY_PUSH_TOKEN`. Pushes, PRs and label changes made
   with the default `GITHUB_TOKEN` do not trigger other workflows, so the factory uses
   `FACTORY_PUSH_TOKEN` (GitHub App installation token, or a fine-grained PAT with Contents,
   Issues, Pull requests: read/write on this repo) for them.
2. **Labels:** run `scripts/bootstrap_labels.sh`.
3. **Settings -> Actions -> General:** allow Actions to create and approve pull requests.
4. **Settings -> General -> Pull Requests:** enable *Allow auto-merge*, *Allow squash merging*,
   and *Automatically delete head branches*.
5. **Branch protection on `main`:** require status checks `quality`, `web`, `secrets`,
   `protected-paths`, and require review from Code Owners. CODEOWNERS covers only protected paths,
   so agent PRs touching `src/`, `tests/` and `docs/` merge on green checks, while anything
   touching `.github/`, `.claude/`, `scripts/`, `evals/`, `web/` or build config needs you.
6. **Pages:** Settings -> Pages -> Source: GitHub Actions.
7. **Variables (optional):** `FACTORY_PAUSED` (kill switch), `FACTORY_MAX_RUNS_PER_DAY` (default 20),
   `FACTORY_MODEL` (agent model, default `claude-sonnet-5-5`), `FACTORY_AUTO_MERGE_PRD=true` to auto-merge PRD PRs too (fully hands-off; default is that you
   review and merge each PRD).
8. **Python deps** use uv: `uv sync` creates `.venv`; `make check` runs everything via `uv run`.

## How a PRD flows (hands-off after the PRD merge)
```
UI "Submit PRD" -> issue [factory:prd]
  -> PRD PR (Source-Issue: #N)  --(you merge, or FACTORY_AUTO_MERGE_PRD)-->  main
  -> decompose: task issues + checklist comment on the PRD issue
  -> per task: design -> tests -> build -> validate -> auto-merge -> done
       (dependent tasks start only after their dependencies are MERGED, so they build on them)
  -> last task merged: PRD checklist fully ticked, PRD issue closed
```
- **Audit trail:** every stage transition, retry, escalation and merge posts a comment (with a link
  to the Actions run) on both the task issue and the PRD issue; the PRD issue also holds a live
  task checklist. The task PR holds the commits and the validator's verdict.
- **Failure handling:** validation FAIL retries up to 2 times, then `factory:needs-human`.
  CI failures after validation are auto-fixed (max 3). CI is expected to be red while tests
  are written before code, so auto-fix is skipped until a task reaches validation.
- **Stop everything:** set `FACTORY_PAUSED=true` (UI Controls tab).

## Using it
Open the UI, connect with a repo-scoped fine-grained token (Issues and Variables: read/write),
submit a feature, and watch the Board. The Board and PRD issue update as it goes.
