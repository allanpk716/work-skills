---
phase: 24-cli-entry-detection
plan: 01
subsystem: cli
tags: [commander, i18n, uninstall, cli-routing, tdd]

# Dependency graph
requires:
  - phase: 19-installation-verification
    provides: "--verify CLI routing pattern and parseArgs() return structure"
  - phase: 23-fix-plugin-install-detection
    provides: "isPluginInstalled() detection functions"
provides:
  - "--uninstall CLI flag parsed via parseArgs() returning uninstallOnly boolean"
  - "main() routing to runUninstallDetection() before verifyOnly check"
  - "18 uninstall.* i18n keys in en.json and zh.json"
  - "Stub uninstall/index.js entry point for Plan 02"
affects: [24-02, 25]

# Tech tracking
tech-stack:
  added: []
  patterns: [cli-flag-routing, tdd-red-green-commit]

key-files:
  created:
    - installer/src/uninstall/index.js
  modified:
    - installer/src/cli.js
    - installer/src/index.js
    - installer/src/i18n/en.json
    - installer/src/i18n/zh.json
    - installer/tests/cli.test.js
    - installer/tests/index.test.js

key-decisions:
  - "Mocked parseArgs in index.test.js instead of mutating process.argv to avoid Jest flag interference"
  - "Kept --uninstall help description as static English string (consistent with --verify pattern)"
  - "Created stub uninstall/index.js entry point for index.js require; full implementation deferred to Plan 02"

patterns-established:
  - "CLI flag routing: add option in cli.js, add boolean in return, check in main() before other flows"
  - "i18n key naming: uninstall.* with dot-notation matching existing patterns"

requirements-completed: [CLI-01, CLI-02, CLI-03, UX-04]

# Metrics
duration: 10min
completed: 2026-03-30
---

# Phase 24 Plan 01: CLI Entry & i18n Summary

**--uninstall CLI flag with Commander.js routing and 18 bilingual i18n keys for uninstall detection output**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-30T06:47:10Z
- **Completed:** 2026-03-30T06:57:25Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Added --uninstall flag to cli.js parseArgs() following existing --verify pattern
- main() routes to runUninstallDetection() with priority over --verify when both specified
- 18 matching uninstall.* i18n keys added to both en.json and zh.json
- TDD approach: 7 new tests (4 CLI + 1 routing + 2 regression) all passing

## Task Commits

Each task was committed atomically:

1. **Task 1: Add --uninstall CLI option and routing** - `49e773e` (feat) [TDD]
2. **Task 2: Add uninstall.* i18n translation keys** - `14b7d8c` (feat)

## Files Created/Modified
- `installer/src/cli.js` - Added --uninstall option and uninstallOnly boolean to return object
- `installer/src/index.js` - Added require for uninstall module and routing block before --verify
- `installer/src/uninstall/index.js` - Stub entry point exporting runUninstallDetection (new)
- `installer/src/i18n/en.json` - 18 uninstall.* keys with English values
- `installer/src/i18n/zh.json` - 18 uninstall.* keys with Chinese values
- `installer/tests/cli.test.js` - 5 new tests for --uninstall flag parsing
- `installer/tests/index.test.js` - Restructured with mocks, added uninstall routing test

## Decisions Made
- Mocked parseArgs in index.test.js instead of mutating process.argv, because Jest's --no-coverage flag was being parsed by Commander and causing errors
- Kept --uninstall help description as static English string consistent with --verify pattern (i18n keys are for detection output, not help text)
- Created stub uninstall/index.js to satisfy index.js require; full implementation is Plan 02's scope

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Restructured index.test.js to mock parseArgs**
- **Found during:** Task 1 (TDD GREEN phase)
- **Issue:** Setting process.argv to ['node', 'setup.js', '--uninstall'] caused Commander to fail because Jest passes its own flags (e.g., --no-coverage) via process.argv, which the test overwrote but then other tests reused original argv containing Jest flags
- **Fix:** Added jest.mock('../src/cli.js') with controlled mockReturnValue, and mocked all other index.js dependencies to isolate the routing test
- **Files modified:** installer/tests/index.test.js
- **Verification:** All 14 tests pass (7 new + 7 existing)
- **Committed in:** 49e773e (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Test restructuring necessary for reliable test isolation. No scope creep.

## Issues Encountered
- npm dependencies not installed in worktree (installed via `npm install`)
- Pre-existing test failures in unrelated test suites (empty test suites in configurators/, bin test failure) - documented and deferred

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 02 can now build on the CLI entry point and i18n keys to create the full uninstall detection module
- The stub uninstall/index.js needs to be replaced with actual detection logic
- All 18 i18n keys are ready for the detection output formatter

---
*Phase: 24-cli-entry-detection*
*Completed: 2026-03-30*

## Self-Check: PASSED

All 8 files verified present. Both commit hashes (49e773e, 14b7d8c) verified in git log.
