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
bad=$(git diff --name-only "${base}...HEAD" | grep -E "$protected" || true)

if [[ -n "$bad" ]]; then
  echo "Agent branch modified protected paths:"
  echo "$bad"
  exit 1
fi
echo "No protected paths touched."
