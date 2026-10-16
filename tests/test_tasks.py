import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from tasks import TaskGraphError, parse_tasks, prd_requirements, topo_order


def doc(tasks: list[dict[str, object]]) -> dict[str, object]:
    return {"prd": "docs/prds/001-x.md", "tasks": tasks}


def task(
    tid: str, deps: list[str] | None = None, reqs: list[int] | None = None
) -> dict[str, object]:
    return {
        "id": tid,
        "title": f"title {tid}",
        "kind": "feature",
        "depends_on": deps or [],
        "requirements": reqs if reqs is not None else [1],
        "acceptance": ["Given a When b Then c"],
        "files_hint": [],
    }


class TestParseTasks(unittest.TestCase):
    def test_valid_graph(self) -> None:
        tasks = parse_tasks(doc([task("T1"), task("T2", ["T1"], [2])]), {1, 2})
        self.assertEqual([t.id for t in tasks], ["T1", "T2"])
        self.assertEqual(tasks[1].depends_on, ("T1",))

    def test_duplicate_id(self) -> None:
        with self.assertRaisesRegex(TaskGraphError, "duplicate"):
            parse_tasks(doc([task("T1"), task("T1")]), {1})

    def test_unknown_dependency(self) -> None:
        with self.assertRaisesRegex(TaskGraphError, "unknown dependency"):
            parse_tasks(doc([task("T1", ["T9"])]), {1})

    def test_cycle(self) -> None:
        with self.assertRaisesRegex(TaskGraphError, "cycle"):
            parse_tasks(doc([task("T1", ["T2"]), task("T2", ["T1"])]), {1})

    def test_self_dependency_is_cycle(self) -> None:
        with self.assertRaisesRegex(TaskGraphError, "cycle"):
            parse_tasks(doc([task("T1", ["T1"])]), {1})

    def test_uncovered_requirement(self) -> None:
        with self.assertRaisesRegex(TaskGraphError, "uncovered"):
            parse_tasks(doc([task("T1", reqs=[1])]), {1, 2})

    def test_bad_kind(self) -> None:
        bad = task("T1")
        bad["kind"] = "epic"
        with self.assertRaisesRegex(TaskGraphError, "kind"):
            parse_tasks(doc([bad]), {1})

    def test_missing_field(self) -> None:
        bad = task("T1")
        del bad["title"]
        with self.assertRaisesRegex(TaskGraphError, "title"):
            parse_tasks(doc([bad]), {1})

    def test_empty_acceptance(self) -> None:
        bad = task("T1")
        bad["acceptance"] = []
        with self.assertRaisesRegex(TaskGraphError, "acceptance"):
            parse_tasks(doc([bad]), {1})

    def test_not_an_object(self) -> None:
        with self.assertRaisesRegex(TaskGraphError, "tasks"):
            parse_tasks({"prd": "x"}, set())

    def test_wrong_field_types(self) -> None:
        bad = task("T1")
        bad["depends_on"] = "T0"
        with self.assertRaisesRegex(TaskGraphError, "depends_on"):
            parse_tasks(doc([bad]), {1})


class TestTopoOrder(unittest.TestCase):
    def test_dependencies_first(self) -> None:
        tasks = parse_tasks(
            doc([task("T3", ["T2"], [3]), task("T2", ["T1"], [2]), task("T1")]), {1, 2, 3}
        )
        self.assertEqual([t.id for t in topo_order(tasks)], ["T1", "T2", "T3"])


class TestPrdRequirements(unittest.TestCase):
    def test_only_requirements_section(self) -> None:
        text = "# P\n## Goals\n1. g\n## Requirements\n1. a\n2) b\n  3. c\n## Test plan\n4. t\n"
        self.assertEqual(prd_requirements(text), {1, 2, 3})

    def test_no_section(self) -> None:
        self.assertEqual(prd_requirements("# P\n1. x\n"), set())


if __name__ == "__main__":
    unittest.main()
