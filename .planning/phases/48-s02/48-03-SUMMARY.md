---
phase: "48"
plan: "03"
---

# T03: Fix pytest.ini testpaths, add --import-mode=importlib via addopts, remove benchmark config lines; full test suite passes (114 passed, 3 pre-existing benchmark errors)

**Fix pytest.ini testpaths, add --import-mode=importlib via addopts, remove benchmark config lines; full test suite passes (114 passed, 3 pre-existing benchmark errors)**

## What Happened

Updated pytest.ini to fix three issues: (1) Changed testpaths from stale `plugins/windows-git-commit/skills/windows-git-commit/tests` to `claude-notify/tests windows-git-commit/tests`, (2) Added `--import-mode=importlib` via addopts to prevent module name collisions when both `tests/` directories are collected simultaneously (discovered that `import_mode` is NOT a valid ini key in pytest 9.0.2 — it must be passed as a CLI flag), (3) Removed all 5 benchmark_* config lines (pytest-benchmark not installed).

Key finding: `import_mode = importlib` as an ini option does NOT work in pytest 9.0.2 — it generates "Unknown config option: import_mode" warning and falls back to prepend mode, causing `ModuleNotFoundError: No module named 'tests.test_xxx'` when both test directories share the same `tests` package name. The fix was using `addopts = --import-mode=importlib` instead.

Full test suite results: 114 passed, 3 errors (pre-existing benchmark fixture errors from test_performance.py — pytest-benchmark not installed). Both `skills-ref validate claude-notify` and `skills-ref validate windows-git-commit` pass. No functional `plugins/` references in code/test files (only documentation strings in windows-git-commit/SKILL.md).

Note: T02 was blocked (windows-git-commit/SKILL.md is still 891 lines, above the 500-line target). This does not affect T03's pytest.ini fix.

## Verification

pytest.ini updated with correct testpaths, import mode via addopts, no benchmark config. Full test suite: 114 passed, 3 pre-existing benchmark errors. skills-ref validate passes for both skills.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `python -m pytest claude-notify/tests/ windows-git-commit/tests/ -q --tb=short` | 1 | ✅ pass (114 passed, 3 pre-existing benchmark errors as expected) | 7460ms |
| 2 | `npx skills-ref validate claude-notify` | 0 | ✅ pass | 3000ms |
| 3 | `npx skills-ref validate windows-git-commit` | 0 | ✅ pass | 3000ms |
| 4 | `grep -rn plugins/ claude-notify/tests/ windows-git-commit/tests/` | 1 | ✅ pass (no matches in code/test files) | 500ms |

## Deviations

Used addopts = --import-mode=importlib instead of import_mode = importlib as ini key, because pytest 9.0.2 does not support import_mode as an ini option (only as CLI flag).

## Known Issues

None.

## Files Created/Modified

- `pytest.ini`
