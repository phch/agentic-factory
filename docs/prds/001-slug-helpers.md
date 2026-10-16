# 001: Slug helpers

## Problem
There is no shared way to turn a human-readable title into a safe filename. Callers would each reimplement it slightly differently. We need two small pure helpers in `src/`.

## Goals / Non-goals
Goals:
- Provide `slugify` and `make_filename` as pure, stdlib-only, fully typed functions.

Non-goals:
- Unicode transliteration.
- Length limits.
- Filename collision handling.

## User stories
- As a developer, I want `slugify("Hello, World!")` to give `hello-world` so I can build URL- and filename-safe names.
- As a developer, I want `make_filename` to always return a usable filename, even for an empty or symbol-only title.

## Requirements
1. `slugify(text: str) -> str` lowercases `text`.
2. `slugify` replaces each run of characters that are not ASCII letters or digits (`[a-z0-9]` after lowercasing) with a single `-`. Non-ASCII letters are treated as non-alphanumeric and are not transliterated.
3. `slugify` strips leading and trailing `-` from the result.
4. `slugify` returns `""` for an empty string or a string with no ASCII letters or digits.
5. `make_filename(title: str, ext: str = "md") -> str` returns `slugify(title) + "." + ext`.
6. If `slugify(title)` is empty, `make_filename` uses `"untitled"` as the base name.
7. `make_filename` must call `slugify` rather than duplicate its logic.
8. Both functions are pure (no I/O, no global state), stdlib only, fully type-annotated, and Python 3.12 compatible.
9. Both functions live in a new module `src/slug.py`, importable as `slug`.
10. `make_filename` uses `ext` verbatim: it does not add, remove or validate a leading `.`. Validating `ext` is the caller's responsibility, so `make_filename("a", "")` returns `"a."`.

## Acceptance criteria
- Given `"Hello, World!"`, when `slugify` is called, then the result is `"hello-world"`.
- Given `"  --  "`, when `slugify` is called, then the result is `""`.
- Given `""`, when `slugify` is called, then the result is `""`.
- Given `"Hello, World!"`, when `make_filename` is called, then the result is `"hello-world.md"`.
- Given `"!!!"`, when `make_filename` is called, then the result is `"untitled.md"`.
- Given `"A b"` and ext `"txt"`, when `make_filename` is called, then the result is `"a-b.txt"`.
- Given `"Café"`, when `slugify` is called, then the result is `"caf"`.
- Given `"a"` and ext `""`, when `make_filename` is called, then the result is `"a."`.

## Test plan (unit tests, `unittest`, in `tests/`)
- Req 1: `slugify("ABC")` returns `"abc"`.
- Req 2: `slugify("a  ,.b")` returns `"a-b"` (a run collapses to one `-`).
- Req 3: `slugify("--a--")` returns `"a"`.
- Req 4: `slugify("")`, `slugify("  --  ")` and `slugify("!!!")` return `""`.
- Req 5: `make_filename("Hello, World!")` returns `"hello-world.md"`; `make_filename("A b", "txt")` returns `"a-b.txt"`.
- Req 6: `make_filename("!!!")` and `make_filename("")` return `"untitled.md"`.
- Req 7: patch `slug.slugify` with a stub and assert `make_filename` uses its return value.
- Req 8: enforced by `make check` (ruff, `mypy --strict`, coverage >= 90%).
- Req 9: tests import `from slug import slugify, make_filename`.
- Req 10: `make_filename("a", "")` returns `"a."`; `make_filename("a", ".md")` returns `"a..md"`.
- Req 2 (non-ASCII): `slugify("Café")` returns `"caf"`.
