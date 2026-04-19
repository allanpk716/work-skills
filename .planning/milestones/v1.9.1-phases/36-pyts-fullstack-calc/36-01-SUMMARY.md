---
phase: 36-pyts-fullstack-calc
plan: 01
subsystem: testing
tags: [fastapi, react, typescript, codepoint, fullstack, cross-language]

# Dependency graph
requires:
  - phase: 35-gojs-fullstack-calc
    provides: gojs-calculator frontend reference for React TS component copy
provides:
  - tmp/pyts-calculator/ complete Python+TS fullstack calculator project
  - FastAPI backend with 5 routes + collector + StaticFiles
  - React TS frontend with 3 components (Calculator, History, BatchCalc)
  - Core calculator pipeline shared across 3 business flows
affects: [36-02, codepoint-v2-e2e]

# Tech tracking
tech-stack:
  added: [fastapi, uvicorn]
  patterns: [fastapi-staticfiles-integration, dual-mode-codepoint-ts, thread-safe-collector]

key-files:
  created:
    - tmp/pyts-calculator/main.py
    - tmp/pyts-calculator/api/server.py
    - tmp/pyts-calculator/calculator/core.py
    - tmp/pyts-calculator/codepoint/collector.py
    - tmp/pyts-calculator/history/store.py
    - tmp/pyts-calculator/batch/processor.py
    - tmp/pyts-calculator/frontend/src/App.tsx
    - tmp/pyts-calculator/frontend/src/api/client.ts
    - tmp/pyts-calculator/frontend/src/lib/codepoint.ts
    - tmp/pyts-calculator/frontend/src/components/Calculator.tsx
    - tmp/pyts-calculator/frontend/src/components/History.tsx
    - tmp/pyts-calculator/frontend/src/components/BatchCalc.tsx

key-decisions:
  - "BatchResult interface stripped of lineNumber/duration fields to match Python backend output"
  - "batchCalculate sends expressions as newline-joined string to match Python batch endpoint"
  - "Port 18091 chosen to avoid conflict with gojs-calculator on 18090"

patterns-established:
  - "FastAPI create_app() factory with StaticFiles mount after all API routes"
  - "Shutdown handler via @app.on_event for collector file handle flush on Windows"

requirements-completed: [FULL-05]

# Metrics
duration: 5min
completed: 2026-04-19
---

# Phase 36 Plan 01: Python+TS Fullstack Calculator Summary

**Python+TS fullstack calculator with FastAPI backend (5 routes + collector + StaticFiles) and React TS frontend, 3 business flows sharing parse->validate->compute->format pipeline**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-19T02:24:02Z
- **Completed:** 2026-04-19T02:29:09Z
- **Tasks:** 2
- **Files modified:** 27

## Accomplishments
- FastAPI backend with create_app() factory, 5 API routes (calculate, history list, history detail, batch, collector), thread-safe history store, and StaticFiles integration
- React TS frontend built and verified, served by FastAPI StaticFiles mount at root path
- End-to-end smoke test passed: root returns HTML, /api/calculate returns correct JSON result, collector endpoint active
- Core calculator pipeline (parse->validate->compute->format) shared across 3 business flows with flow_id probes
- 38 unit tests passing for core calculator logic

## Task Commits

Each task was committed atomically:

1. **Task 1: Python backend (FastAPI + core modules + collector)** - `c1b73e5` (feat)
2. **Task 2: React TS frontend + build integration** - `9deccbe` (feat)

## Files Created/Modified
- `tmp/pyts-calculator/main.py` - FastAPI entry point with uvicorn on port 18091
- `tmp/pyts-calculator/api/server.py` - FastAPI app with 5 routes, collector, StaticFiles, shutdown handler
- `tmp/pyts-calculator/calculator/core.py` - Core calculator pipeline with 4 codepoint probes per flow
- `tmp/pyts-calculator/codepoint/__init__.py` - Python codepoint library with point_json, point_with_meta
- `tmp/pyts-calculator/codepoint/collector.py` - TS frontend collector with thread-safe writes
- `tmp/pyts-calculator/history/store.py` - Thread-safe in-memory history store
- `tmp/pyts-calculator/batch/processor.py` - Batch expression processor with flow_id
- `tmp/pyts-calculator/tests/test_calculator.py` - 38 unit tests for core pipeline
- `tmp/pyts-calculator/frontend/src/App.tsx` - Root app with "Python+TS Calculator" title
- `tmp/pyts-calculator/frontend/src/api/client.ts` - API client with BatchResult (no lineNumber/duration)
- `tmp/pyts-calculator/frontend/src/lib/codepoint.ts` - Dual-mode codepoint probe (browser POST + Node.js)
- `tmp/pyts-calculator/frontend/src/components/Calculator.tsx` - Calculator component with flow probes
- `tmp/pyts-calculator/frontend/src/components/History.tsx` - History component with flow-history-query
- `tmp/pyts-calculator/frontend/src/components/BatchCalc.tsx` - Batch component with flow-batch-process

## Decisions Made
- BatchResult interface removed lineNumber and duration fields to match Python backend output format (Go backend produces these but Python does not)
- batchCalculate in client.ts joins string array with newlines to match Python backend's expected input format
- Port 18091 used to avoid conflict with Phase 35 gojs-calculator on port 18090
- vite.config.ts copied verbatim from gojs-calculator (base: '/' compatible with FastAPI StaticFiles)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- tmp/ directory is gitignored; used `git add -f` to force-stage test project files (expected per project convention for test artifacts)

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Complete Python+TS fullstack calculator project ready for codepoint scan/plan/implement E2E verification
- Three business flows (API calculate, history query, batch process) share core pipeline with flow_id probes
- Frontend dist/ built and served by FastAPI StaticFiles, ready for browser testing

## Self-Check: PASSED

All 7 key files verified to exist on disk. Both task commits (c1b73e5, 9deccbe) verified in git log.

---
*Phase: 36-pyts-fullstack-calc*
*Completed: 2026-04-19*
