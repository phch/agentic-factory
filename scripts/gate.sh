#!/usr/bin/env bash
# Decides whether an agent job may run. Writes allowed=true|false to $GITHUB_OUTPUT.
# Env: GH_TOKEN REPO ACTOR EVENT_NAME PAUSED MAX_RUNS WORKFLOW [IS_FORK]
set -euo pipefail

deny() {
  echo "DENIED: $1"
  echo "allowed=false" >> "${GITHUB_OUTPUT:-/dev/stdout}"
  exit 0
}

# 1. Kill switch: set repo variable FACTORY_PAUSED=true to stop everything.
[[ "${PAUSED:-}" == "true" ]] && deny "FACTORY_PAUSED is true"

# 2. Forks never get agent runs (no secrets, and the code is untrusted).
[[ "${IS_FORK:-false}" == "true" ]] && deny "pull request from a fork"

# 3. Only maintainers can trigger label-driven stages.
if [[ "$EVENT_NAME" == "issues" ]]; then
  perm=$(gh api "repos/${REPO}/collaborators/${ACTOR}/permission" --jq .permission 2>/dev/null || echo none)
  case "$perm" in
    admin|maintain|write) ;;
    *) deny "actor ${ACTOR} has permission '${perm}'" ;;
  esac
fi

# 4. Daily run cap (cost control).
today=$(date -u +%F)
runs=$(gh run list --repo "$REPO" --workflow "$WORKFLOW" --created ">=${today}" \
  --limit 200 --json databaseId --jq length)
if (( runs > ${MAX_RUNS:-20} )); then
  deny "daily cap reached (${runs} runs today, max ${MAX_RUNS:-20})"
fi

echo "ALLOWED (actor=${ACTOR:-n/a}, runs today=${runs})"
echo "allowed=true" >> "${GITHUB_OUTPUT:-/dev/stdout}"
