---
phase: 36-pyts-fullstack-calc
plan: 02
subsystem: testing
tags: [fastapi, react, typescript, codepoint, cross-language, toggle, integration-test, windows-process-management]

# Dependency graph
requires:
  - phase: 36-pyts-fullstack-calc plan 01
    provides: complete Python+TS fullstack calculator project
provides:
  - Server management fixtures (conftest.py) with PID tracking, readiness polling, Windows taskkill cleanup
  - Cross-language linkage tests (test_linkage.py) verifying collector + multi-flow stacks + flow_id correlation
  - Toggle 4-combination tests (test_toggle.py) verifying independent frontend/backend probe control
  - Fixed collector.py receive() to write meta field for flow_id correlation
affects: [codepoint-v2-e2e, phase-37]

# Tech tracking
tech-stack:
  added: [pytest-integration, netstat-port-kill]
  patterns: [try-finally-server-lifecycle, permission-error-tolerant-cleanup, port-holder-pre-kill]

key-files:
  created:
    - tmp/pyts-calculator/tests/conftest.py
    - tmp/pyts-calculator/tests/test_linkage.py
    - tmp/pyts-calculator/tests/test_toggle.py
  modified:
    - tmp/pyts-calculator/codepoint/collector.py

key-decisions:
  - "collector.py receive() fixed to write meta JSON to cp-ts log for flow_id correlation"
  - "_kill_port_holder() added to conftest.py to kill orphaned processes holding port 18091 before start_server"
  - "Batch test sends newline-separated string, not array, to match Python backend batch endpoint format"
  - "PermissionError on log file cleanup ignored on Windows -- new server creates a new timestamped file"

patterns-established:
  - "start_server/stop_server with try/finally per test for guaranteed server cleanup"
  - "netstat + taskkill for pre-start port cleanup on Windows"

requirements-completed: [FULL-06, FULL-07]

# Metrics
duration: 9min
completed: 2026-04-19
---

# Phase 36 Plan 02: Cross-Language Linkage + Toggle Verification Summary

**Integration tests verifying cross-language probe linkage (collector + multi-flow stacks + flow_id correlation) and 2x2 toggle independence in Python+TS fullstack calculator**

## Performance

- **Duration:** 9 min
- **Started:** 2026-04-19T02:34:57Z
- **Completed:** 2026-04-19T02:44:04Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Server management infrastructure (conftest.py) with PID tracking, readiness polling via /api/history, and Windows taskkill /F /T cleanup
- Cross-language linkage tests: collector receives frontend probes and writes to cp-ts log, 3 business flows produce different flow_ids, cp-calc-compute appears 3+ times with distinct stacks
- Toggle 4-combination tests: all combinations verified (both on, only Python, only TS, both disabled), each toggle independent
- Fixed collector.py receive() to write meta field (including flow_id) to cp-ts log for cross-language flow_id correlation

## Task Commits

Each task was committed atomically:

1. **Task 1: Server management infrastructure + cross-language linkage tests** - `ad80b1e` (feat)
2. **Task 2: Toggle 4-combination independence verification** - `b38ea81` (feat)

## Files Created/Modified
- `tmp/pyts-calculator/tests/conftest.py` - Server process management fixtures with PID tracking, netstat port holder kill, readiness polling, taskkill /F /T cleanup, PermissionError handling
- `tmp/pyts-calculator/tests/test_linkage.py` - 4 integration tests: collector receives probe, collector enabled check, multi-flow stack differentiation, flow_id correlation
- `tmp/pyts-calculator/tests/test_toggle.py` - 4 integration tests: both enabled, only Python, only TS, both disabled
- `tmp/pyts-calculator/codepoint/collector.py` - Fixed receive() to write meta JSON (flow_id) to cp-ts log

## Decisions Made
- collector.py receive() fixed to write meta field to cp-ts log so flow_id is available for cross-language correlation (previously only wrote name and stack)
- _kill_port_holder() helper added to conftest.py using netstat + taskkill to prevent orphaned server processes from blocking port 18091
- Batch test uses newline-separated string (not array) because Python backend process_expressions() splits on newlines
- PermissionError on log file deletion tolerated on Windows -- held by previous process, new server creates new timestamped file

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] collector.py receive() did not write meta field to cp-ts log**
- **Found during:** Task 1 -- test_flow_id_correlation failed because flow_id was not in TS log
- **Issue:** receive() only wrote name and stack, discarding the meta dict which contains flow_id
- **Fix:** Added meta extraction and JSON serialization to receive() output
- **Files modified:** codepoint/collector.py
- **Commit:** ad80b1e

**2. [Rule 3 - Blocking] Orphaned server process caused PermissionError on log cleanup**
- **Found during:** Task 1 -- start_server failed to delete previous log files held by zombie process
- **Issue:** Previous manual server process still held file handles on Windows
- **Fix:** Added _kill_port_holder() to kill processes on port 18091 before start_server, and PermissionError handling for log cleanup
- **Files modified:** tests/conftest.py
- **Commit:** ad80b1e

**3. [Rule 1 - Bug] Batch test sent array instead of newline-separated string**
- **Found during:** Task 1 -- manual verification showed batch endpoint expects newline-separated string
- **Issue:** Plan test code used `{"expressions": ["1+1", "2*3", "10/2"]}` but backend expects `{"expressions": "1+1\n2*3\n10/2"}`
- **Fix:** Changed test_linkage.py batch test to send newline-separated string
- **Files modified:** tests/test_linkage.py
- **Commit:** ad80b1e

## Issues Encountered
- Toggle files removed by last test (both disabled); restored after test completion

## User Setup Required
None -- no external service configuration required.

## Next Phase Readiness
- Phase 36 fully complete (2/2 plans)
- All 8 integration tests passing
- Cross-language probe linkage verified for Python+TS stack
- Toggle mechanism verified with 4-combination matrix
- Ready for Phase 37: fullstack issue repair

## Self-Check: PASSED

All 4 key files verified to exist on disk. Both task commits (ad80b1e, b38ea81) verified in git log. Both toggle files restored.

---
*Phase: 36-pyts-fullstack-calc*
*Completed: 2026-04-19*
