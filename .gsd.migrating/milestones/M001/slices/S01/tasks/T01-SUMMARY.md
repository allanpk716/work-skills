---
id: T01
parent: S01
milestone: M001
provides: []
requires: []
affects: []
key_files: []
key_decisions: []
patterns_established: []
observability_surfaces: []
drill_down_paths: []
duration: 
verification_result: passed
completed_at: 2026-04-19T15:45:00.000Z
blocker_discovered: false
---
# T01: 38-e2e-test-migration 01

**# Plan 38-01 Summary: Migrate E2E Test Projects**

## What Happened

# Plan 38-01 Summary: Migrate E2E Test Projects

## Objective
Migrate 5 E2E test projects from tmp/ to tests/e2e/codepoint-v2/ with correct git strategy.

## What Was Done

### Task 1: Tracked Project Migration (git mv)
- Created `tests/e2e/codepoint-v2/` directory structure
- Created `.gitignore` (node_modules/, __pycache__/, *.pyc, *.exe, .playwright-cli/)
- Created `tests/e2e/.gitkeep`
- Cleaned build artifacts from gojs-calculator (node_modules, .exe, .playwright-cli)
- Cleaned build artifacts from pyts-calculator (node_modules, dist, __pycache__)
- `git mv tmp/gojs-calculator tests/e2e/codepoint-v2/gojs-calculator` (42 files tracked)
- `git mv tmp/pyts-calculator tests/e2e/codepoint-v2/pyts-calculator` (31 files tracked)
- Verified gojs-calculator/frontend/dist/ preserved (index.html + assets/ for Go embed)

### Task 2: Untracked Project Copy + Build Verification
- Copied go-calculator, python-calculator, template-test via cp + git add
- Cleaned __pycache__ and .exe artifacts from copied directories
- Go build verification PASSED for go-calculator
- Go build verification PASSED for gojs-calculator
- Committed as migration checkpoint (122 files changed)

## Key Files Created

| Path | Purpose |
|------|---------|
| tests/e2e/codepoint-v2/go-calculator/ | Go single-language calculator test |
| tests/e2e/codepoint-v2/python-calculator/ | Python single-language calculator test |
| tests/e2e/codepoint-v2/gojs-calculator/ | Go+JS fullstack calculator test |
| tests/e2e/codepoint-v2/pyts-calculator/ | Python+TS fullstack calculator test |
| tests/e2e/codepoint-v2/template-test/ | Probe template test project |
| tests/e2e/codepoint-v2/.gitignore | Prevent build artifact commits |
| tests/e2e/.gitkeep | Ensure tests/e2e/ is git tracked |

## Deviations
None. Execution matched plan exactly.

## Self-Check: PASSED
- 5 test project directories present in tests/e2e/codepoint-v2/
- .gitignore with 4 exclusion patterns
- No build artifacts (node_modules, __pycache__, .exe, .playwright-cli)
- gojs-calculator/frontend/dist/ preserved (Go embed)
- Both Go projects build successfully
- Migration committed as recovery point before Plan 02 cleanup
