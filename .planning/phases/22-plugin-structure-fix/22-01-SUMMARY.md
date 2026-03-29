---
phase: 22-plugin-structure-fix
plan: 01
subsystem: plugins
tags: [plugin-structure, git-mv, directory-flatten, installer-detection]

# Dependency graph
requires: []
provides:
  - "windows-git-commit plugin with SKILL.md at root level (installer-detectable)"
  - "Flattened plugin directory matching claude-notify pattern"
affects: [phase-23-detection-regression-verification]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Plugin root structure: SKILL.md + hooks/ + scanner/ + tests/ at plugin root"

key-files:
  created: []
  modified:
    - "plugins/windows-git-commit/SKILL.md (moved from skills/windows-git-commit/, path refs updated)"
    - "plugins/windows-git-commit/hooks/pre-commit (moved from skills/windows-git-commit/hooks/)"
    - "plugins/windows-git-commit/scanner/ (moved from skills/windows-git-commit/scanner/)"
    - "plugins/windows-git-commit/tests/ (moved from skills/windows-git-commit/tests/)"

key-decisions:
  - "Used git mv to preserve history tracking during directory restructure"
  - "Did not modify installer code; fixed plugin structure to match installer expectations"

patterns-established:
  - "Plugin root layout: plugins/<name>/SKILL.md at root, matching claude-notify working pattern"

requirements-completed: [STRUCT-01, STRUCT-02]

# Metrics
duration: 5min
completed: 2026-03-29
---

# Phase 22 Plan 01: Flatten Plugin Directory Summary

**Flattened windows-git-commit plugin from nested skills/windows-git-commit/ to root level, matching claude-notify structure for installer isPluginInstalled() detection**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-29T14:17:48Z
- **Completed:** 2026-03-29T14:22:53Z
- **Tasks:** 2
- **Files modified:** 36 (moved) + 1 (path refs updated)

## Accomplishments
- Moved SKILL.md, hooks/, scanner/, tests/ from nested skills/windows-git-commit/ to plugin root using git mv
- Updated 2 stale path references in SKILL.md (line 202 and line 851)
- Verified zero remaining references to old skills/windows-git-commit/ path
- Confirmed all 9 functional tests pass after restructure (3 benchmark tests skipped due to missing pytest-benchmark, pre-existing)

## Task Commits

Each task was committed atomically:

1. **Task 1: Flatten plugin directory structure** - `2d2d2aa` (refactor)
2. **Task 2: Update SKILL.md path references and verify scanner** - `c3c6a7f` (fix)

## Files Created/Modified
- `plugins/windows-git-commit/SKILL.md` - Skill definition, moved to root + path refs updated
- `plugins/windows-git-commit/hooks/pre-commit` - Pre-commit hook, moved to root
- `plugins/windows-git-commit/scanner/` - Scanner module (17 files), moved to root
- `plugins/windows-git-commit/tests/` - Test suite (5 files), moved to root

## Decisions Made
- Used `git mv` instead of manual copy to preserve full Git history tracking
- Did not modify installer code; the fix was purely structural to match installer's expected layout
- Left pre-existing pytest-benchmark dependency issue as out-of-scope (not caused by this restructure)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- pytest tests initially failed due to missing `pathspec` and `tabulate` packages in the current Python environment (pre-existing, not caused by restructure). After installing them, 9/12 tests passed. The 3 remaining errors require `pytest-benchmark` plugin which is a pre-existing environment gap, unrelated to the directory restructure.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Plugin structure now matches claude-notify pattern with SKILL.md at root
- Ready for Phase 23: Detection & Regression Verification
- isPluginInstalled() should now correctly detect windows-git-commit after cpSync installation

## Self-Check: PASSED

All files verified present, all commits verified in git log.

---
*Phase: 22-plugin-structure-fix*
*Completed: 2026-03-29*
