# Factory setup

1. **Secrets**: `ANTHROPIC_API_KEY`, and `FACTORY_PUSH_TOKEN`. Pushes and label changes made with
   the default `GITHUB_TOKEN` do not trigger other workflows, so stage transitions need a
   GitHub App installation token (recommended) or a fine-grained PAT with Contents, Issues and
   Pull requests read/write on this repo.
2. **Labels**: run `scripts/bootstrap_labels.sh` (creates all `factory:*` labels).
3. **Branch protection** on `main`: require CI and Code Owner review (CODEOWNERS is `@phch`).
4. **Variables**: `FACTORY_PAUSED` (kill switch), `FACTORY_MAX_RUNS_PER_DAY` (default 20).
5. **Pages**: Settings -> Pages -> Source: GitHub Actions. The UI deploys from `web/` on push to main.
6. **Using it**: open the UI, paste a fine-grained PAT scoped to this repo (Issues, Actions
   variables read/write) and `owner/repo`, submit a feature. Flow: issue labelled `factory:prd` ->
   PRD PR -> you merge it -> tasks are created -> stages run -> Board shows progress.

The PRD PR merge is the human gate; everything after it is automated within the budgets above.

7. **Python deps** use uv: `uv sync` creates `.venv`; `make check` runs everything via `uv run`.
