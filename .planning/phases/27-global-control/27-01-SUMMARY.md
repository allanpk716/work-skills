---
phase: 27-global-control
plan: 01
subsystem: notification-flags
tags: [python, pathlib, unittest, mock, tdd]

# Dependency graph
requires:
  - phase: 26-find-up-implementation
    provides: check_notification_flags() with upward traversal and shared flags module
provides:
  - Global fallback detection in check_notification_flags() for ~/.claude/.no-xxx
  - 6-key return dict with global_pushover_path and global_windows_path fields
  - 4 new global fallback test cases
affects: [28-diagnostics-update, notify-enable, notify-disable, notify-status]

# Tech tracking
tech-stack:
  added: []
  patterns: [global-fallback-after-traversal, _setup_safe_global_home test helper]

key-files:
  created: []
  modified:
    - plugins/claude-notify/hooks/scripts/flags.py
    - plugins/claude-notify/tests/test_flags.py

key-decisions:
  - "Global check uses Path.home() / '.claude' as fallback only when project-level traversal finds nothing"
  - "Project-level flags take priority -- global check skipped for already-disabled channels"
  - "_setup_safe_global_home helper prevents MagicMock truthy default from triggering false global detection"

patterns-established:
  - "Global fallback pattern: check Path.home() / '.claude' / '.no-xxx' only for channels where disabled=False after upward traversal"
  - "Test helper pattern: _setup_safe_global_home() configures mock Path.home() to prevent cross-test contamination"

requirements-completed: [GLOB-01, GLOB-02]

# Metrics
duration: 9min
completed: 2026-04-01
---

# Phase 27 Plan 01: Global Fallback Detection Summary

**Global ~/.claude/.no-xxx fallback detection with project-level priority, 6-key return dict, and 4 new test cases**

## Performance

- **Duration:** 9 min
- **Started:** 2026-04-01T05:17:09Z
- **Completed:** 2026-04-01T05:26:02Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Added global fallback block in check_notification_flags() that checks ~/.claude/.no-pushover and ~/.claude/.no-windows after upward traversal
- Return dict expanded from 4 to 6 keys (added global_pushover_path and global_windows_path)
- Project-level flags take priority over global flags -- global check only runs for channels not disabled at project level
- All 55 tests pass (16 flags tests + 39 other), zero regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Add global fallback tests (TDD RED)** - `a67b74b` (test)
2. **Task 2: Implement global fallback (TDD GREEN)** - `87b724f` (feat)

_Note: TDD flow produced test-first then implementation commits_

## Files Created/Modified
- `plugins/claude-notify/hooks/scripts/flags.py` - Added global fallback block after upward traversal loop, expanded return dict to 6 keys, updated docstring
- `plugins/claude-notify/tests/test_flags.py` - Added 4 new global test cases, updated return structure test to expect 6 keys, added _setup_safe_global_home helper, fixed all existing tests for global-aware mocking

## Decisions Made
- Global check only runs for channels where `disabled=False` after project-level traversal (per D-11a priority rule)
- `pushover_path`/`windows_path` remain project-level only; global paths tracked in separate `global_*` fields (per D-12)
- `_setup_safe_global_home` helper added to class to prevent MagicMock default truthy behavior from falsely triggering global detection in existing tests

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Existing tests falsely detected global flags due to MagicMock truthy defaults**
- **Found during:** Task 2 (implement global fallback)
- **Issue:** After adding global fallback code, 12 existing tests failed because mock_path_class.home() returned a generic MagicMock whose chained .is_file() returned a truthy MagicMock, falsely triggering global detection
- **Fix:** Added _setup_safe_global_home() helper method that configures mock Path.home() to return safe mocks where .is_file() returns False, applied to all 12 existing tests
- **Files modified:** plugins/claude-notify/tests/test_flags.py
- **Verification:** All 16 flags tests pass
- **Committed in:** 87b724f (Task 2 commit)

**2. [Rule 1 - Bug] __truediv__ mock functions missing self parameter**
- **Found during:** Task 2 (running tests after implementation)
- **Issue:** Mock __truediv__ functions in global tests used 1-parameter signature (key) instead of 2-parameter (self, key), causing TypeError when Python called the dunder method
- **Fix:** Added self parameter to all claude_dir_div functions in global test methods
- **Files modified:** plugins/claude-notify/tests/test_flags.py
- **Verification:** All 16 flags tests pass
- **Committed in:** 87b724f (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both auto-fixes necessary for correctness. Mock infrastructure needed updating to support the new global detection code. No scope creep.

## Issues Encountered
- MagicMock's default return value (a truthy MagicMock) silently caused global flag detection in tests not explicitly testing global behavior. Resolved by creating a shared test helper that configures safe home() mocks.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Global fallback detection is complete and tested
- Return dict now includes global_* fields ready for Phase 28 diagnostics mode to display
- Phase 27 Plan 02 (--global flag for notify-enable/notify-disable commands) can proceed independently

## Self-Check: PASSED
- plugins/claude-notify/hooks/scripts/flags.py: FOUND
- plugins/claude-notify/tests/test_flags.py: FOUND
- .planning/phases/27-global-control/27-01-SUMMARY.md: FOUND
- Commit a67b74b (test): FOUND
- Commit 87b724f (feat): FOUND

---
*Phase: 27-global-control*
*Completed: 2026-04-01*
