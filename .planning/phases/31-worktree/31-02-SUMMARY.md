---
phase: 31-worktree
plan: 02
subsystem: notification
tags: [git, worktree, title-formatting, DRY, integration]

# Dependency graph
requires:
  - phase: 31-01
    provides: flags.py with get_git_branch(), build_notification_title()
provides:
  - notify.py with [project:branch] title format
  - notify-attention.py with [project:branch] Attention Needed format
  - TestWorktreeTitleFormat integration test class
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: [shared-title-consumption, worktree-aware-notification-title]

key-files:
  created: []
  modified:
    - plugins/claude-notify/hooks/scripts/notify.py
    - plugins/claude-notify/hooks/scripts/notify-attention.py
    - plugins/claude-notify/tests/test_notify.py

key-decisions:
  - "Both scripts delegate title construction entirely to flags.build_notification_title() for DRY compliance"
  - "notify.py uses build_notification_title(project_name, git_branch) for [project:branch] format"
  - "notify-attention.py uses build_notification_title(project_name, git_branch, suffix='Attention Needed')"

patterns-established:
  - "Notification title pattern: both hooks import get_git_branch + build_notification_title from flags.py"

requirements-completed: [WTREE-01, WTREE-02]

# Metrics
duration: 6min
completed: 2026-04-08
---

# Phase 31 Plan 02: Worktree Title Integration Summary

**notify.py and notify-attention.py use shared build_notification_title() from flags.py for [project:branch] title format; both scripts import get_git_branch() for worktree-aware notification titles; 6 integration tests added in TestWorktreeTitleFormat class**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-08T14:13:50Z
- **Completed:** 2026-04-08T14:19:53Z
- **Tasks:** 1 (TDD: RED + GREEN)
- **Files modified:** 3

## Accomplishments
- Updated notify.py to import get_git_branch + build_notification_title, use `title` variable in send calls
- Updated notify-attention.py to import get_git_branch + build_notification_title, construct title with suffix
- Added TestWorktreeTitleFormat with 6 tests covering title format, session_id, and DRY verification
- All 105 tests passing (99 existing + 6 new)
- DRY concern resolved: no local title builder functions in either script

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): Add failing tests** - `f652f8f` (test)
2. **Task 1 (GREEN): Implement shared title integration** - `715cd99` (feat)

_Note: TDD task with RED and GREEN commits_

## Files Created/Modified
- `plugins/claude-notify/hooks/scripts/notify.py` - Import get_git_branch + build_notification_title; use title in send calls instead of project_name
- `plugins/claude-notify/hooks/scripts/notify-attention.py` - Import get_git_branch + build_notification_title; build title with suffix="Attention Needed"
- `plugins/claude-notify/tests/test_notify.py` - Added TestWorktreeTitleFormat class with 6 tests; added `import flags` for mock patching

## Decisions Made
- Both scripts delegate title construction entirely to `flags.build_notification_title()` -- no local title builder functions (DRY resolved)
- `notify.py` uses `build_notification_title(project_name, git_branch)` for plain [project:branch] format
- `notify-attention.py` uses `build_notification_title(project_name, git_branch, suffix="Attention Needed")` for [project:branch] Attention Needed format
- Tests use `flags.get_project_name()` and `flags.get_git_branch()` (module-level access) for correct mock patching

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Restored accidentally removed check_notification_flags() call in notify-attention.py**
- **Found during:** Task 1 (GREEN phase)
- **Issue:** Replacing the title construction block in notify-attention.py accidentally removed the `flags = check_notification_flags()` call, which would cause a NameError when the script checks `flags['pushover_disabled']`
- **Fix:** Re-added `flags = check_notification_flags()` after the title construction, before notification_message processing
- **Files modified:** notify-attention.py
- **Verification:** All 105 tests pass
- **Committed in:** 715cd99 (part of GREEN commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug fix for accidentally removed function call)
**Impact on plan:** Minimal - restored a line that was inadvertently removed during edit.

## Issues Encountered
None beyond the deviation documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Both notification scripts now produce worktree-aware titles [project:branch]
- DRY resolved: both scripts use shared build_notification_title() from flags.py
- session_id confirmed in attention notification message body
- Phase 31 Plan 01 + Plan 02 together deliver WTREE-01 and WTREE-02

---
*Phase: 31-worktree*
*Completed: 2026-04-08*

## Self-Check: PASSED
- FOUND: plugins/claude-notify/hooks/scripts/notify.py
- FOUND: plugins/claude-notify/hooks/scripts/notify-attention.py
- FOUND: plugins/claude-notify/tests/test_notify.py
- FOUND: .planning/phases/31-worktree/31-02-SUMMARY.md
- FOUND: f652f8f (RED)
- FOUND: 715cd99 (GREEN)
