"""Eval harness for the factory itself.

Each case in evals/cases/<name>/ has:
  prd.md              the PRD handed to /implement
  acceptance_test.py  a HELD-OUT test the agent never sees; dropped in after the run

A case passes when the agent's output passes the held-out test AND `make check`.
Run after any change to .claude/ prompts or agents, and compare pass rates.

Env:
  CLAUDE_BIN             claude executable (default: claude)
  EVAL_MODEL             model id (default: claude-sonnet-5-5, same as the workflows)
  EVAL_MAX_TURNS         per-case turn cap (default: 30)
  EVAL_MAX_BUDGET_USD    optional per-case spend cap passed to claude
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CASES = ROOT / "evals" / "cases"
RESULTS = ROOT / "evals" / "results"
IGNORE = shutil.ignore_patterns(
    ".git", ".venv", "__pycache__", ".mypy_cache", ".ruff_cache", ".coverage", "results"
)
ALLOWED_TOOLS = "Read,Glob,Grep,Edit,Write,Bash(make:*)"


def run_case(case: Path) -> dict[str, object]:
    start = time.time()
    with tempfile.TemporaryDirectory(prefix="factory-eval-") as tmp:
        work = Path(tmp) / "repo"
        shutil.copytree(ROOT, work, ignore=IGNORE)
        # Reuse the repo's venv tools if present.
        if (ROOT / ".venv").exists():
            (work / ".venv").symlink_to(ROOT / ".venv")
        prd = work / "docs" / "prds" / "001-eval.md"
        prd.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy(case / "prd.md", prd)

        cmd = [
            os.environ.get("CLAUDE_BIN", "claude"),
            "-p",
            "/implement docs/prds/001-eval.md",
            "--model",
            os.environ.get("EVAL_MODEL", "claude-sonnet-5-5"),
            "--max-turns",
            os.environ.get("EVAL_MAX_TURNS", "30"),
            "--permission-mode",
            "acceptEdits",
            "--allowedTools",
            ALLOWED_TOOLS,
        ]
        if budget := os.environ.get("EVAL_MAX_BUDGET_USD"):
            cmd += ["--max-budget-usd", budget]
        agent = subprocess.run(cmd, cwd=work, capture_output=True, text=True, check=False)

        # Held-out acceptance test goes in only after the agent is done.
        shutil.copy(case / "acceptance_test.py", work / "tests" / "test_acceptance.py")
        accept = subprocess.run(
            ["make", "test"], cwd=work, capture_output=True, text=True, check=False
        )
        quality = subprocess.run(
            ["make", "check"], cwd=work, capture_output=True, text=True, check=False
        )

    return {
        "case": case.name,
        "passed": accept.returncode == 0 and quality.returncode == 0,
        "agent_exit": agent.returncode,
        "acceptance_ok": accept.returncode == 0,
        "quality_ok": quality.returncode == 0,
        "seconds": round(time.time() - start, 1),
        "acceptance_tail": accept.stdout[-400:] + accept.stderr[-400:],
        "quality_tail": quality.stdout[-400:] + quality.stderr[-400:],
    }


def main() -> int:
    only = sys.argv[1:]
    cases = sorted(p for p in CASES.iterdir() if p.is_dir() and (not only or p.name in only))
    if not cases:
        print("No eval cases found.")
        return 1

    results = [run_case(c) for c in cases]
    RESULTS.mkdir(parents=True, exist_ok=True)
    out = RESULTS / f"{int(time.time())}.json"
    out.write_text(json.dumps(results, indent=2))

    for r in results:
        print(f"{'PASS' if r['passed'] else 'FAIL'}  {r['case']}  ({r['seconds']}s)")
    passed = sum(1 for r in results if r["passed"])
    print(f"\n{passed}/{len(results)} passed. Report: {out}")
    return 0 if passed == len(results) else 1


if __name__ == "__main__":
    sys.exit(main())
