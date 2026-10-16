#!/usr/bin/env bash
# Moves a task issue between pipeline stages by swapping labels, then unblocks dependents.
# Usage: advance.sh <issue> <from-stage> <to-stage|done|retry> [retry-stage]
# Env:   GH_TOKEN REPO   (use a token that can retrigger workflows)
# Stages: design -> tests -> build -> validate -> done. `retry` re-runs <from-stage>
# (max 2 retries per issue, then factory:needs-human). With a 4th arg, `retry` sends the
# task back to that earlier stage instead.
set -euo pipefail

issue="$1"; from="$2"; to="$3"; target="${4:-$2}"
labels() { gh issue view "$issue" --repo "$REPO" --json labels --jq '.labels[].name'; }

unblock_dependents() {
  gh issue list --repo "$REPO" --label factory:blocked --state open --json number,body --limit 200 |
  jq -c '.[]' | while read -r dep; do
    num=$(jq -r .number <<< "$dep")
    ready=1
    for need in $(jq -r .body <<< "$dep" | grep -oE '^Depends on #[0-9]+' | grep -oE '[0-9]+'); do
      state=$(gh issue view "$need" --repo "$REPO" --json state --jq .state)
      [[ "$state" == "CLOSED" ]] || ready=0
    done
    if [[ $ready == 1 ]]; then
      gh issue edit "$num" --repo "$REPO" --remove-label factory:blocked --add-label factory:stage:design
    fi
  done
}

if [[ "$to" == "retry" ]]; then
  retries=$(labels | grep -c '^factory:retry-' || true)
  if (( retries >= 2 )); then
    gh issue edit "$issue" --repo "$REPO" --remove-label "factory:stage:$from" --add-label factory:needs-human
    gh issue comment "$issue" --repo "$REPO" --body "Stage '$from' failed 3 times. A human needs to take over."
    exit 0
  fi
  gh issue edit "$issue" --repo "$REPO" --remove-label "factory:stage:$from" \
    --add-label "factory:retry-$((retries + 1))"
  # Adding the stage label is what triggers the stage workflow.
  gh issue edit "$issue" --repo "$REPO" --add-label "factory:stage:$target"
elif [[ "$to" == "done" ]]; then
  gh issue edit "$issue" --repo "$REPO" --remove-label "factory:stage:$from" --add-label factory:done
  gh issue close "$issue" --repo "$REPO"
  unblock_dependents
else
  gh issue edit "$issue" --repo "$REPO" --remove-label "factory:stage:$from" \
    --add-label "factory:stage:$to"
fi
