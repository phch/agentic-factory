#!/usr/bin/env bash
# One-time setup: create the factory labels. Requires gh authenticated with repo access.
# Usage: bootstrap_labels.sh [OWNER/REPO]   (defaults to the current repo)
set -euo pipefail
repo_args=()
[[ -n "${1:-}" ]] && repo_args=(--repo "$1")

while IFS='|' read -r name color desc; do
  gh label create "$name" --color "$color" --description "$desc" --force "${repo_args[@]}"
done <<'LABELS'
factory:prd|5319e7|Start the PRD stage from this issue
factory:implement|5319e7|Start single-shot implementation from a PRD
factory:task|0e8a16|Task issue managed by the factory pipeline
factory:blocked|b60205|Waiting on dependency tasks
factory:stage:design|1d76db|Design stage
factory:stage:tests|1d76db|Test-authoring stage
factory:stage:build|1d76db|Implementation stage
factory:stage:validate|1d76db|Validation stage
factory:done|0e8a16|Validated and complete
factory:needs-human|d93f0b|Pipeline gave up; human needed
factory:retry-1|fbca04|First retry used
factory:retry-2|fbca04|Second retry used
LABELS
