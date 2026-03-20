---
phase: 15-environment-detection
plan: 03
subsystem: environment-detection
tags: [python, pip, package-detection, execa, i18n]

requires:
  - phase: 15-01
    provides: Python detector with execa pattern

provides:
  - Python pip package detection with version extraction
  - Dynamic guidance key generation based on package name
  - i18n support for installation guidance

affects: [15-04]

tech-stack:
  added: []
  patterns:
    - "Pip package detection via execa(python, ['-m', 'pip', 'show', packageName])"
    - "Regex parsing for pip show output: /Name:\\s*(.+)/i and /Version:\\s*(.+)/i"
    - "Dynamic guidance key: guidance.install${PackageName}"

key-files:
  created:
    - installer/src/detectors/pip-package.js
    - installer/tests/detectors/pip-package.test.js
  modified:
    - installer/src/i18n/en.json
    - installer/src/i18n/zh.json
    - installer/package.json
    - installer/package-lock.json

key-decisions:
  - "Use execa 9.6.1 with --experimental-vm-modules for Jest ESM support"
  - "Generate dynamic guidance keys based on package name with capitalization"
  - "Reuse python detector pattern for consistency"

patterns-established:
  - "Detector return type: {name, installed, version, meetsMinimum, guidance}"
  - "Mock pattern: jest.mock('execa') + const execa = require('execa')"
  - "TDD cycle: RED (failing test) -> GREEN (minimal implementation) -> REFACTOR"

requirements-completed: [ENV-04]

duration: 11 min
completed: 2026-03-20
---

# Phase 15 Plan 03: pip-package Detection Summary

**Python pip package detector with version extraction and dynamic i18n guidance**

## Performance

- **Duration:** 11 min
- **Started:** 2026-03-20T11:42:02Z
- **Completed:** 2026-03-20T11:53:01Z
- **Tasks:** 1
- **Files modified:** 4

## Accomplishments

- Created pip package detector module using execa to run `python -m pip show <package>`
- Implemented version extraction from pip show output using regex patterns
- Added dynamic guidance key generation based on package name (e.g., guidance.installRequests)
- Upgraded execa from 5.1.1 to 9.6.1 for ESM module support
- Configured Jest with --experimental-vm-modules flag
- All 7 unit tests pass for pip-package detector

## Task Commits

Each task was committed atomically:

1. **Task 1: Create pip package detector with tests** - `4ba6aaf` (test), `295bd6b` (feat), `c0e3c57` (feat)
   - RED: Added failing tests for pip package detection
   - GREEN: Implemented detectPipPackage function with version extraction
   - FEAT: Added i18n keys for requests package guidance

**Plan metadata:** `c0e3c57` (docs: complete plan - pending)

## Files Created/Modified

- `installer/src/detectors/pip-package.js` - Pip package detection module with execa integration
- `installer/tests/detectors/pip-package.test.js` - Unit tests for pip package detection (7 tests)
- `installer/src/i18n/en.json` - Added guidance.installRequests key
- `installer/src/i18n/zh.json` - Added guidance.installRequests key (Chinese)
- `installer/package.json` - Upgraded execa to 9.6.1, added --experimental-vm-modules to test script
- `installer/package-lock.json` - Dependency lockfile update

## Decisions Made

- **Use execa 9.6.1:** Upgraded from incorrectly downgraded 5.1.1 to match RESEARCH.md recommendation and support ESM modules
- **Dynamic guidance keys:** Generate package-specific guidance keys with capitalization (e.g., `requests` → `guidance.installRequests`)
- **Follow python detector pattern:** Maintain consistency with existing detector implementation for easier maintenance

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Upgraded execa from 5.1.1 to 9.6.1**
- **Found during:** Task 1 (test execution)
- **Issue:** execa was downgraded to 5.1.1 in package.json, but python.js requires execa 9.x with dynamic import support. Jest failed with ESM import errors.
- **Fix:** Upgraded execa to 9.6.1 (as per RESEARCH.md and original 15-01 commit 269ebb4), added `--experimental-vm-modules` flag to Jest configuration in package.json test script
- **Files modified:** installer/package.json, installer/package-lock.json
- **Verification:** `npm test -- pip-package.test.js` passes all 7 tests
- **Committed in:** 295bd6b (Task 1 commit)

**2. [Rule 3 - Blocking] Fixed Jest ESM module support**
- **Found during:** Task 1 (test execution after execa upgrade)
- **Issue:** Jest encountered "Cannot use import statement outside a module" error when loading execa 9.x (ESM module)
- **Fix:** Updated package.json test script to use `node --experimental-vm-modules ./node_modules/jest/bin/jest.js` instead of plain `jest` command
- **Files modified:** installer/package.json
- **Verification:** Jest successfully loads execa ESM module, all tests pass
- **Committed in:** 295bd6b (Task 1 commit)

**3. [Rule 1 - Bug] Simplified test mock pattern**
- **Found during:** Task 1 (test implementation)
- **Issue:** Initial test file used complex mock pattern with dynamic import (`const execaModule = await import('execa')`), but this pattern failed because execaMock was undefined in tests
- **Fix:** Simplified to use python.test.js pattern: `const execa = require('execa'); jest.mock('execa');` - this pattern works with both execa 9.x ESM and Jest mocking
- **Files modified:** installer/tests/detectors/pip-package.test.js
- **Verification:** All 7 tests pass with simplified mock pattern
- **Committed in:** 295bd6b (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (3 blocking, 0 architectural, 0 missing critical)
**Impact on plan:** All auto-fixes necessary for test execution and module compatibility. execa upgrade restored intended version from 15-01. No scope creep.

## Issues Encountered

- **Jest ESM module compatibility:** Required `--experimental-vm-modules` flag for Jest 30.3.0 to load execa 9.x ESM modules. This is a known Jest limitation when mixing CommonJS test files with ESM dependencies.
- **execa version inconsistency:** package.json showed execa 5.1.1 but RESEARCH.md and git history (269ebb4) indicated 9.6.1 should be installed. Restored to 9.6.1.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- pip-package detector ready for use by detection orchestrator (15-04)
- execa 9.6.1 properly configured for all future detectors
- Test infrastructure validated with --experimental-vm-modules support
- No blockers for subsequent plans

---
*Phase: 15-environment-detection*
*Completed: 2026-03-20*

## Self-Check: PASSED

- All key files created/modified verified on disk
- All task commits present in git history (4ba6aaf, 295bd6b, c0e3c57)
- All pip-package tests passing (7/7)
