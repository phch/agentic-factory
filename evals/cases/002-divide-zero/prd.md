# 002: Safe divide

## Problem
The app has no division, and dividing by zero must be handled explicitly.

## Requirements
1. `divide(a, b)` in `src/app.py` returns `a / b` as a float.
2. `divide(a, 0)` raises `ValueError` with the message "division by zero".

## Acceptance criteria
- Given 10 and 4, divide returns 2.5.
- Given 1 and 0, divide raises ValueError("division by zero").

## Test plan
Unit tests in `tests/` covering both criteria.
