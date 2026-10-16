#!/usr/bin/env python3
"""Validate the PM agent's tasks.json and create one GitHub issue per task.

Runs in a job that holds issues:write; the agent that produced tasks.json never does.
Usage: create_tasks.py <tasks.json> --repo OWNER/REPO [--dry-run]
Env:   GH_TOKEN (token whose label changes should trigger downstream workflows)
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src"))

from tasks import Task, TaskGraphError, parse_tasks, prd_requirements, topo_order  # noqa: E402


def body(task: Task, prd: str, issue_of: dict[str, int]) -> str:
    deps = "".join(f"Depends on #{issue_of[d]}\n" for d in task.depends_on)
    acceptance = "\n".join(f"- {a}" for a in task.acceptance)
    hints = ", ".join(task.files_hint) or "none"
    return (
        f"PRD: `{prd}` (requirements {', '.join(map(str, task.requirements))})\n"
        f"Kind: {task.kind}\nFiles hint: {hints}\n\n"
        f"## Acceptance\n{acceptance}\n\n{deps}"
    )


def create_issue(repo: str, title: str, text: str, labels: list[str]) -> int:
    cmd = ["gh", "issue", "create", "--repo", repo, "--title", title, "--body", text]
    for label in labels:
        cmd += ["--label", label]
    url = subprocess.run(cmd, check=True, capture_output=True, text=True).stdout.strip()
    return int(url.rsplit("/", 1)[1])


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("tasks_json")
    ap.add_argument("--repo", required=True)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    doc = json.loads(Path(args.tasks_json).read_text())
    prd = Path(ROOT / str(doc.get("prd", "")))
    # The PRD path comes from agent output: it must stay inside docs/prds/.
    if not prd.resolve().is_relative_to(ROOT / "docs" / "prds") or not prd.is_file():
        print(f"invalid prd path: {doc.get('prd')!r}")
        return 1
    try:
        ordered = topo_order(parse_tasks(doc, prd_requirements(prd.read_text())))
    except TaskGraphError as e:
        print(f"invalid decomposition: {e}")
        return 1

    issue_of: dict[str, int] = {}
    for t in ordered:
        stage = "factory:blocked" if t.depends_on else "factory:stage:design"
        labels = ["factory:task", stage]
        text = body(t, str(doc["prd"]), issue_of)
        if args.dry_run:
            print(f"[dry-run] {t.id} {t.title!r} labels={labels} deps={list(t.depends_on)}")
            issue_of[t.id] = 0
        else:
            issue_of[t.id] = create_issue(args.repo, f"{t.id}: {t.title}", text, labels)
            print(f"created #{issue_of[t.id]} for {t.id}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
