RUN ?= uv run --frozen

.PHONY: test lint typecheck coverage check evals
test:
	$(RUN) python -m unittest discover -s tests -v

lint:
	$(RUN) ruff check .

typecheck:
	$(RUN) mypy

coverage:
	$(RUN) coverage run -m unittest discover -s tests
	$(RUN) coverage report

# Everything CI runs. Agents must get this green before opening a PR.
check: lint typecheck coverage

evals:
	$(RUN) python evals/run_evals.py
