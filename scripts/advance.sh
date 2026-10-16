#!/usr/bin/env bash
# Moves a task issue between pipeline stages by swapping labels, records an audit comment on
# the task issue and on its source PRD issue, and unblocks dependents when a task is done.
# Usage: advance.sh <issue> <from-stage> <to-stage|done|retry> [retry-stage]
# Env:   GH_TOKEN REPO   (use a token that can retrigger workflows)
# Stages: design -> tests -> build -> validate -> merging -> done. `retry` re-runs <from-stage>
# (max 2 retries per issue, then factory:needs-human). With a 4th arg, `retry` sends the
# task back to that earlier stage instead.
set -euo pipefail

issue="$1"; from="$2"; to="$3"; target="${4:-$2}"
run_url="${GITHUB_SERVER_URL:-https://github.com}/${REPO}/actions/runs/${GITHUB_RUN_ID:-0}"
labels() { gh issue view "$issue" --repo "$REPO" --json labels --jq '.labels[].name'; }

body=$(gh issue view "$issue" --repo "$REPO" --json body --jq .body)
source=$(grep -oE '^Source: #[0-9]+' <<< "$body" | grep -oE '[0-9]+' | head -1 || true)

# Audit trail: one line on the task issue and one on the PRD (source) issue.
note() {
  gh issue comment "$issue" --repo "$REPO" --body "$1 ([run]($run_url))"
  if [[ -n "$source" ]]; then
    gh issue comment "$source" --repo "$REPO" --body "#$issue: $1 ([run]($run_url))"
  fi
}

# Tick this task in the PRD's checklist comment; when every box is ticked, close the PRD issue.
tick_checklist() {
  [[ -n "$source" ]] || return 0
  cid=$(gh api "repos/${REPO}/issues/${source}/comments" --paginate \
    --jq '.[] | select(.body | contains("<!-- factory-tasks -->")) | .id' | head -1)
  [[ -n "$cid" ]] || return 0
  new=$(gh api "repos/${REPO}/issues/comments/${cid}" --jq .body | sed "s/^- \[ \] #${issue} /- [x] #${issue} /")
  gh api -X PATCH "repos/${REPO}/issues/comments/${cid}" -f body="$new" > /dev/null
  if ! grep -q '^- \[ \]' <<< "$new"; then
    gh issue comment "$source" --repo "$REPO" --body "All tasks merged. PRD complete. ([run]($run_url))"
    gh issue close "$source" --repo "$REPO"
  fi
}

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
      gh issue comment "$num" --repo "$REPO" --body "Dependencies merged; starting design. ([run]($run_url))"
    fi
  done
}

if [[ "$to" == "retry" ]]; then
  retries=$(labels | grep -c '^factory:retry-' || true)
  if (( retries >= 2 )); then
    gh issue edit "$issue" --repo "$REPO" --remove-label "factory:stage:$from" --add-label factory:needs-human
    note "Stage \`$from\` failed 3 times. A human needs to take over."
    exit 0
  fi
  gh issue edit "$issue" --repo "$REPO" --remove-label "factory:stage:$from" \
    --add-label "factory:retry-$((retries + 1))"
  note "Stage \`$from\` failed; retrying \`$target\` (retry $((retries + 1))/2)."
  # Adding the stage label is what triggers the stage workflow.
  gh issue edit "$issue" --repo "$REPO" --add-label "factory:stage:$target"
elif [[ "$to" == "done" ]]; then
  gh issue edit "$issue" --repo "$REPO" --remove-label "factory:stage:$from" --add-label factory:done
  note "Merged to main. Task complete."
  gh issue close "$issue" --repo "$REPO"
  tick_checklist
  unblock_dependents
else
  gh issue edit "$issue" --repo "$REPO" --remove-label "factory:stage:$from" \
    --add-label "factory:stage:$to"
  note "Stage \`$from\` complete; moving to \`$to\`."
fi
