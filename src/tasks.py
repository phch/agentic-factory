"""Validation of the PM agent's task graph (tasks.json) before any issue is created."""

from __future__ import annotations

import re
from dataclasses import dataclass

KINDS = frozenset({"feature", "chore", "bugfix"})


class TaskGraphError(ValueError):
    """The decomposition is malformed; nothing should be created from it."""


@dataclass(frozen=True)
class Task:
    id: str
    title: str
    kind: str
    depends_on: tuple[str, ...]
    requirements: tuple[int, ...]
    acceptance: tuple[str, ...]
    files_hint: tuple[str, ...]


def _list_of(raw: dict[str, object], key: str, kind: type) -> tuple[object, ...]:
    value = raw.get(key)
    if not isinstance(value, list) or not all(isinstance(v, kind) for v in value):
        raise TaskGraphError(f"task {raw.get('id')!r}: {key} must be a list of {kind.__name__}")
    return tuple(value)


def _parse_task(raw: object) -> Task:
    if not isinstance(raw, dict):
        raise TaskGraphError("each task must be an object")
    for key in ("id", "title", "kind"):
        if not isinstance(raw.get(key), str) or not raw[key]:
            raise TaskGraphError(f"task {raw.get('id')!r}: missing or invalid {key}")
    if raw["kind"] not in KINDS:
        raise TaskGraphError(f"task {raw['id']!r}: invalid kind {raw['kind']!r}")
    acceptance = _list_of(raw, "acceptance", str)
    if not acceptance:
        raise TaskGraphError(f"task {raw['id']!r}: acceptance must not be empty")
    return Task(
        id=raw["id"],
        title=raw["title"],
        kind=raw["kind"],
        depends_on=tuple(str(v) for v in _list_of(raw, "depends_on", str)),
        requirements=tuple(int(str(v)) for v in _list_of(raw, "requirements", int)),
        acceptance=tuple(str(v) for v in acceptance),
        files_hint=tuple(str(v) for v in _list_of(raw, "files_hint", str)),
    )


def _check_cycles(tasks: list[Task]) -> None:
    deps = {t.id: t.depends_on for t in tasks}
    done: set[str] = set()
    visiting: set[str] = set()

    def visit(node: str) -> None:
        if node in done:
            return
        if node in visiting:
            raise TaskGraphError(f"dependency cycle involving {node}")
        visiting.add(node)
        for dep in deps[node]:
            visit(dep)
        visiting.discard(node)
        done.add(node)

    for t in tasks:
        visit(t.id)


def parse_tasks(doc: dict[str, object], prd_requirements: set[int]) -> list[Task]:
    """Parse and validate a decomposition; raise TaskGraphError on any problem."""
    raw_tasks = doc.get("tasks")
    if not isinstance(raw_tasks, list) or not raw_tasks:
        raise TaskGraphError("document must contain a non-empty 'tasks' list")
    tasks = [_parse_task(r) for r in raw_tasks]

    ids = [t.id for t in tasks]
    if len(set(ids)) != len(ids):
        raise TaskGraphError("duplicate task id")
    for t in tasks:
        for dep in t.depends_on:
            if dep not in ids:
                raise TaskGraphError(f"task {t.id}: unknown dependency {dep}")
    _check_cycles(tasks)

    missing = prd_requirements - {r for t in tasks for r in t.requirements}
    if missing:
        raise TaskGraphError(f"uncovered requirements: {sorted(missing)}")
    return tasks


def topo_order(tasks: list[Task]) -> list[Task]:
    """Order tasks so every task appears after its dependencies."""
    by_id = {t.id: t for t in tasks}
    ordered: list[Task] = []
    seen: set[str] = set()

    def visit(task: Task) -> None:
        if task.id in seen:
            return
        seen.add(task.id)
        for dep in task.depends_on:
            visit(by_id[dep])
        ordered.append(task)

    for t in tasks:
        visit(t)
    return ordered


def prd_requirements(text: str) -> set[int]:
    """Numbers of the numbered items under a PRD's '## Requirements' heading."""
    nums: set[int] = set()
    in_section = False
    for line in text.splitlines():
        if line.startswith("## "):
            in_section = line.lower().startswith("## requirements")
        elif in_section and (m := re.match(r"\s*(\d+)[.)]\s", line)):
            nums.add(int(m.group(1)))
    return nums


CHECKLIST_MARKER = "<!-- factory-tasks -->"


def render_checklist(created: list[tuple[int, Task]]) -> str:
    """PRD roll-up comment: one unchecked box per created task issue."""
    lines = [CHECKLIST_MARKER, "Tasks created from this PRD:", ""]
    lines += [f"- [ ] #{number} {t.id}: {t.title}" for number, t in created]
    return "\n".join(lines)
