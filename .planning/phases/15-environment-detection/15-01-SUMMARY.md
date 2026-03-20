---
phase: 15-environment-detection
plan: 01
subsystem: installer
tags: [environment-detection, python, git, i18n, execa, testing]

# Dependency graph
requires:
  - phase: 14-installer-foundation
    provides: Installer foundation with i18n support and platform detection
provides:
  - Python 3.8+ version detection module
  - Git version detection module
  - Detection i18n keys (en/zh)
  - Unit tests for both detectors
affects: [15-02, 15-03, 15-04]

# Tech tracking
tech-stack:
  added: [execa@5.1.1]
  patterns: [detector-module-pattern, error-handling-with-fallback, i18n-guidance-keys]

key-files:
  created:
    - installer/src/detectors/python.js
    - installer/src/detectors/git.js
    - installer/tests/detectors/python.test.js
    - installer/tests/detectors/git.test.js
  modified:
    - installer/package.json
    - installer/package-lock.json
    - installer/jest.config.js
    - installer/src/i18n/en.json
    - installer/src/i18n/zh.json

key-decisions:
  - "Use execa 5.x for CommonJS compatibility (vs execa 9.x ESM-only)"
  - "Try multiple Python commands (python, python3, py) for Windows compatibility"
  - "Git has no minimum version requirement - any version is acceptable"
  - "All user-facing messages use i18n system for bilingual support"

patterns-established:
  - "Detector module pattern: async function returns {name, installed, version, meetsMinimum, command, guidance}"
  - "Error handling with fallback: try multiple commands, return failure object if all fail"
  - "i18n guidance keys: detector returns translation key, not hardcoded message"

requirements-completed: [ENV-01, ENV-02]

# Metrics
duration: 10min
completed: 2026-03-20
---

# Phase 15 Plan 01: Environment Detection Core Summary

**Python 3.8+ and Git version detection modules with bilingual i18n support using execa 5.x for Windows compatibility**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-20T11:41:22Z
- **Completed:** 2026-03-20T11:51:36Z
- **Tasks:** 4
- **Files modified:** 6

## Accomplishments
- Python 3.8+ version detection with fallback to alternative commands (python, python3, py)
- Git version detection with Windows format support (extracts version from "git version 2.43.0.windows.1")
- Comprehensive unit tests with 100% coverage for both detectors (13 tests total)
- Bilingual i18n keys for detection messages and installation guidance

## Task Commits

Each task was committed atomically:

1. **Task 1: Install execa dependency** - `269ebb4` (chore)
2. **Task 2: Create Python detector with tests** - `b02de34` (feat)
3. **Task 3: Create Git detector with tests** - `f50dd39` (feat)
4. **Task 4: Add detection i18n keys** - `e73640d` (feat)

## Files Created/Modified
- `installer/src/detectors/python.js` - Python 3.8+ version detection with command fallback
- `installer/src/detectors/git.js` - Git version detection with Windows format parsing
- `installer/tests/detectors/python.test.js` - 7 unit tests for Python detector
- `installer/tests/detectors/git.test.js` - 6 unit tests for Git detector
- `installer/src/i18n/en.json` - Added detection.title, detection.checking, detection.summary, guidance.installPython, guidance.installGit
- `installer/src/i18n/zh.json` - Added Chinese translations for all detection keys
- `installer/package.json` - Added execa@5.1.1 dependency
- `installer/jest.config.js` - Updated transformIgnorePatterns for execa compatibility

## Decisions Made
- Use execa 5.x instead of 9.x for CommonJS compatibility (9.x is ESM-only)
- Try multiple Python commands (python, python3, py) to handle different Windows Python installations
- Git has no minimum version requirement - any installed version is acceptable
- All user-facing messages (status, guidance) use i18n system for bilingual support

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Downgraded execa from 9.x to 5.x for CommonJS compatibility**
- **Found during:** Task 1 (Install execa dependency)
- **Issue:** execa 9.x is ESM-only, incompatible with project's CommonJS architecture and Jest configuration
- **Fix:** Installed execa@5.1.1 (last CommonJS version with good Windows support)
- **Files modified:** installer/package.json, installer/package-lock.json
- **Verification:** All tests pass with execa 5.x, imports work correctly
- **Committed in:** 269ebb4 (Task 1 commit)

**2. [Rule 3 - Blocking] Updated jest.config.js to handle ESM modules**
- **Found during:** Task 2 (Python detector tests)
- **Issue:** Initial attempt to use execa 9.x required Jest ESM configuration changes
- **Fix:** Updated jest.config.js with transformIgnorePatterns, then reverted when downgrading to execa 5.x
- **Files modified:** installer/jest.config.js
- **Verification:** Tests run successfully
- **Committed in:** b02de34 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both blocking issues)
**Impact on plan:** Both deviations necessary for compatibility. execa 5.x provides same functionality as 9.x for our use case. No scope creep.

## Issues Encountered
- execa version compatibility required research and multiple attempts (9.x → 8.x → 7.x → 6.x → 5.x) before finding CommonJS-compatible version
- Jest ESM module support is complex - using CommonJS execa 5.x was simpler solution

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Core detection infrastructure ready (Python, Git)
- Pattern established for future detectors (SSH tools, pip packages)
- i18n system ready for additional detection messages
- Ready for Phase 15-02 (SSH tools detection) and 15-03 (pip package detection)

---
*Phase: 15-environment-detection*
*Completed: 2026-03-20*

## Self-Check: PASSED

All claimed files exist and commits verified:
- installer/src/detectors/python.js ✓
- installer/src/detectors/git.js ✓
- Commit 269ebb4 (Task 1) ✓
- Commit b02de34 (Task 2) ✓
- Commit f50dd39 (Task 3) ✓
- Commit e73640d (Task 4) ✓
