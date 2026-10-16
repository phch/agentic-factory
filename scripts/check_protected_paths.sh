#!/usr/bin/env bash
# Fails if an agent-authored branch (factory/*) touches paths only humans may change.
# Usage: check_protected_paths.sh <base-ref> <head-branch>
set -euo pipefail

base="$1"
branch="$2"

if [[ "$branch" != factory/* ]]; then
  echo "Not an agent branch; skipping."
  exit 0
fi

protected='^(\.github/|\.claude/|scripts/|evals/|CODEOWNERS|Makefile|pyproject\.toml|requirements-dev\.txt)'
# Fail closed: if the diff itself errors (bad ref, shallow clone), the check fails.
changed=$(git diff --name-only "${base}...HEAD") || { echo "git diff failed; refusing to pass"; exit 2; }
bad=$(grep -E "$protected" <<< "$changed" || true)

if [[ -n "$bad" ]]; then
  echo "Agent branch modified protected paths:"
  echo "$bad"
  exit 1
fi
echo "No protected paths touched."
