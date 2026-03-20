---
phase: 15-environment-detection
plan: 02
subsystem: installer
tags: [winreg, registry, ssh, tortoisegit, putty, detection, windows]

# Dependency graph
requires:
  - phase: none
    provides: N/A
provides:
  - SSH tools detection via Windows registry
  - TortoiseGit and PuTTY detection modules
  - i18n keys for SSH tools guidance
affects: [16-python-dependencies, 17-interactive-configuration, 19-installation-verification]

# Tech tracking
tech-stack:
  added: [winreg@1.2.5]
  patterns: [registry-based detection, promise-based async wrappers, combined detector pattern]

key-files:
  created:
    - installer/src/detectors/ssh-tools.js
    - installer/tests/detectors/ssh-tools.test.js
  modified:
    - installer/package.json
    - installer/src/i18n/en.json
    - installer/src/i18n/zh.json

key-decisions:
  - "Use winreg library for registry access instead of REG command execution"
  - "Check both standard and Wow6432Node paths for TortoiseGit (32-bit on 64-bit Windows)"
  - "Accept either TortoiseGit or PuTTY as valid SSH tools (both not required)"
  - "Use promise wrapper for winreg callback-based API"

patterns-established:
  - "Registry detection pattern: HKLM for machine-wide apps, HKCU for user apps"
  - "Combined detector pattern: run multiple checks in parallel with Promise.all"
  - "Fallback pattern: check standard path first, then Wow6432Node for 32-bit compatibility"

requirements-completed: [ENV-03]

# Metrics
duration: 5min
completed: 2026-03-20
---

# Phase 15 Plan 02: SSH Tools Detection Summary

**TortoiseGit and PuTTY registry-based detection with winreg library, supporting both 32-bit and 64-bit Windows installations**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-20T11:41:19Z
- **Completed:** 2026-03-20T11:46:13Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- SSH tools detection module with registry-based detection
- Support for TortoiseGit (HKLM) and PuTTY (HKCU) detection
- 32-bit and 64-bit Windows compatibility via Wow6432Node fallback
- Comprehensive unit tests with 8 passing test cases
- Bilingual i18n support for detection messages and guidance

## Task Commits

Each task was committed atomically:

1. **Task 1: Install winreg dependency** - `269ebb4` (chore)
2. **Task 2: Create SSH tools detector with tests** - `2fb9008` (test - TDD RED), `51b9c4e` (feat - TDD GREEN)
3. **Task 3: Add SSH tools i18n keys** - `a3f87aa` (feat)

**Plan metadata:** pending (docs: complete plan)

_Note: TDD tasks may have multiple commits (test → feat → refactor)_

## Files Created/Modified
- `installer/src/detectors/ssh-tools.js` - SSH tools detection module with detectTortoiseGit, detectPuTTY, detectSSHTools
- `installer/tests/detectors/ssh-tools.test.js` - Unit tests for SSH tools detection (8 tests)
- `installer/package.json` - Added winreg@1.2.5 dependency
- `installer/src/i18n/en.json` - Added SSH tools translation keys
- `installer/src/i18n/zh.json` - Added Chinese translations for SSH tools

## Decisions Made
- **winreg over REG command**: Use winreg library for type-safe registry access instead of parsing REG command output
- **Combined detection**: Accept either TortoiseGit or PuTTY as valid (both not required) for flexibility
- **Registry paths**: HKLM for TortoiseGit (machine-wide), HKCU for PuTTY (user-specific)
- **Wow6432Node fallback**: Check Wow6432Node path for 32-bit TortoiseGit on 64-bit Windows

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed test mock reset issue**
- **Found during:** Task 2 (SSH tools detector tests - GREEN phase)
- **Issue:** Mock for "neither tool installed" test wasn't resetting between tests, causing false positives
- **Fix:** Added jest.resetModules() and re-required the module to get fresh mock instance
- **Files modified:** installer/tests/detectors/ssh-tools.test.js
- **Verification:** All 8 tests pass consistently
- **Committed in:** 51b9c4e (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Test mock fix was necessary for reliable TDD cycle. No scope creep.

## Issues Encountered
- Jest parameter syntax changed from --testPathPattern to positional argument (used correct syntax)
- Test mock isolation required resetModules() for proper test independence

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- SSH tools detection complete and tested
- Ready for integration with environment detection runner (Plan 15-04)
- Can be combined with Python and Git detection for full environment check

---
*Phase: 15-environment-detection*
*Completed: 2026-03-20*

## Self-Check: PASSED

All files and commits verified:
- ssh-tools.js: FOUND
- ssh-tools.test.js: FOUND
- Commit 269ebb4 (winreg dependency): FOUND
- Commit 2fb9008 (failing tests): FOUND
- Commit 51b9c4e (implementation): FOUND
- Commit a3f87aa (i18n keys): FOUND
