PY ?= python3
BIN := $(if $(wildcard .venv/bin),.venv/bin/,)

.PHONY: test lint typecheck coverage check evals
test:
	$(PY) -m unittest discover -s tests -v

lint:
	$(BIN)ruff check .

typecheck:
	$(BIN)mypy

coverage:
	$(BIN)coverage run -m unittest discover -s tests
	$(BIN)coverage report

# Everything CI runs. Agents must get this green before opening a PR.
check: lint typecheck coverage

evals:
	$(PY) evals/run_evals.py
