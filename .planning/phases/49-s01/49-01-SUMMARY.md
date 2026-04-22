---
phase: "49"
plan: "01"
---

# T01: Delete 7 obsolete files/dirs and git-mv 8 codepoint sub-skills into codepoint/

**Delete 7 obsolete files/dirs and git-mv 8 codepoint sub-skills into codepoint/**

## What Happened

Removed 7 obsolete files/directories from the project root using `git rm`: `.claude-plugin/marketplace.json`, `scripts/` (2 files), `pytest.ini`, `tests/` (~100 files including e2e test fixtures), `INSTALLATION.md`, `INSTALLATION.zh.md`, and `QUICK-START.md`. Also cleaned up untracked residual files in `tests/` (`__pycache__` and empty `e2e/` directories) that `git rm` left behind.

Then moved all 8 codepoint-* sub-skill directories into `codepoint/` using `git mv` to preserve history: `codepoint-implement`, `codepoint-instrument`, `codepoint-plan`, `codepoint-run`, `codepoint-scan`, `codepoint-test-plan`, `codepoint-validate`, and `codepoint-verify`.

The root directory now cleanly shows only `claude-notify/`, `windows-git-commit/`, `codepoint/`, plus infrastructure dirs (`docs/`, `installer/`, `node_modules/`, `tmp/`). The `codepoint/` directory contains all 8 sub-skill directories plus its original `references/` and `templates/` directories.

## Verification

Ran the task plan's verification command which checks all 7 obsolete paths are gone and all 8 sub-skill directories exist under `codepoint/`. Result: PASS. Also manually verified root directory listing and codepoint/ contents match the expected structure.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `bash -c 'test ! -f .claude-plugin/marketplace.json && test ! -d scripts && test ! -f pytest.ini && test ! -d tests && test ! -f INSTALLATION.md && test ! -f INSTALLATION.zh.md && test ! -f QUICK-START.md && test -d codepoint/codepoint-implement && test -d codepoint/codepoint-instrument && test -d codepoint/codepoint-plan && test -d codepoint/codepoint-run && test -d codepoint/codepoint-scan && test -d codepoint/codepoint-test-plan && test -d codepoint/codepoint-validate && test -d codepoint/codepoint-verify && echo PASS || echo FAIL'` | 0 | ✅ pass | 1500ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `codepoint/codepoint-implement/`
- `codepoint/codepoint-instrument/`
- `codepoint/codepoint-plan/`
- `codepoint/codepoint-run/`
- `codepoint/codepoint-scan/`
- `codepoint/codepoint-test-plan/`
- `codepoint/codepoint-validate/`
- `codepoint/codepoint-verify/`
