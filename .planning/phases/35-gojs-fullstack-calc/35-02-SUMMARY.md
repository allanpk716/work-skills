---
phase: 35-gojs-fullstack-calc
plan: 02
subsystem: frontend
tags: [react, vite, typescript, codepoint.ts, event-handler-probes, flow_id, go:embed]

# Dependency graph
requires:
  - phase: 35-01
    provides: Go backend at tmp/gojs-calculator/ with 3 API flows, enhanced collector, go:embed placeholder
provides:
  - React frontend at tmp/gojs-calculator/frontend/ with 3 UI components and event-handler probes
  - codepoint.ts base library in browser mode (POST to /__codepoint__)
  - API client for calculate, history, batch endpoints
  - Frontend build output at frontend/dist/ for go:embed embedding
affects: [35-03-codepoint-scan, 35-04-e2e-validation]

# Tech tracking
tech-stack:
  added: [Vite 8.x, React 19.x, TypeScript 5.x, @vitejs/plugin-react]
  patterns: [event-handler probe placement (NOT useEffect), pointWithMeta with flow_id in meta, tab navigation without router]

key-files:
  created:
    - tmp/gojs-calculator/frontend/package.json
    - tmp/gojs-calculator/frontend/vite.config.ts
    - tmp/gojs-calculator/frontend/tsconfig.json
    - tmp/gojs-calculator/frontend/tsconfig.app.json
    - tmp/gojs-calculator/frontend/index.html
    - tmp/gojs-calculator/frontend/src/main.tsx
    - tmp/gojs-calculator/frontend/src/App.tsx
    - tmp/gojs-calculator/frontend/src/index.css
    - tmp/gojs-calculator/frontend/src/vite-env.d.ts
    - tmp/gojs-calculator/frontend/src/lib/codepoint.ts
    - tmp/gojs-calculator/frontend/src/api/client.ts
    - tmp/gojs-calculator/frontend/src/components/Calculator.tsx
    - tmp/gojs-calculator/frontend/src/components/History.tsx
    - tmp/gojs-calculator/frontend/src/components/BatchCalc.tsx
  modified:
    - tmp/gojs-calculator/frontend/tsconfig.app.json (added 'node' to types)

key-decisions:
  - "All frontend probes placed in event handlers (onClick, onKeyDown), NOT in useEffect -- prevents React strict mode double-invocation"
  - "codepoint.ts copied verbatim from frontend.md template -- dual-mode (browser + Node.js) with zero-cost disabled path"
  - "Tab navigation uses useState without router library -- simple and sufficient for 3 views"
  - "Vite base: '/' for Go server root serving, outDir: 'dist' for go:embed frontend/dist/*"

patterns-established:
  - "Pattern: Frontend probes in event handlers only -- handleSubmit/onClick/onKeyDown and their async continuations, never useEffect"
  - "Pattern: V2 probe with point_id + flow_id -- every pointWithMeta call includes both for cross-language correlation"
  - "Pattern: History data loading in useEffect without probes -- data fetch on mount is not a user action, probes only on click"

requirements-completed: [FULL-01]

# Metrics
duration: 5.5min
completed: 2026-04-18
---

# Phase 35 Plan 02: React Frontend with Event-Handler Probes Summary

**Vite+React+TS frontend with 3 UI components (Calculator/History/Batch), codepoint.ts browser-mode probes with flow_id correlation, and go:embed integration**

## Performance

- **Duration:** 5.5 min
- **Started:** 2026-04-18T15:38:49Z
- **Completed:** 2026-04-18T15:44:19Z
- **Tasks:** 3
- **Files modified:** 15

## Accomplishments
- React frontend project at tmp/gojs-calculator/frontend/ with Vite build pipeline producing dist/ for go:embed
- Three UI components with event-handler probes: Calculator (flow-api-calculate), History (flow-history-query), Batch (flow-batch-process)
- codepoint.ts base library in browser mode POSTing to /__codepoint__, with zero-cost disabled path
- Fullstack smoke test verified: POST /api/calculate returns correct JSON, GET / serves React app, POST /__codepoint__ returns 204

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Vite+React frontend with codepoint.ts and API client** - `ef44608` (feat)
2. **Task 2: Create Calculator, History, and Batch components with event-handler probes** - `e3016eb` (feat)
3. **Task 3: Build frontend and verify fullstack integration with collector smoke test** - `b17bf89` (chore)

## Files Created/Modified
- `tmp/gojs-calculator/frontend/package.json` - Vite+React+TS project dependencies
- `tmp/gojs-calculator/frontend/vite.config.ts` - base: '/', outDir: 'dist' for go:embed
- `tmp/gojs-calculator/frontend/tsconfig.app.json` - Added 'node' to types for codepoint.ts
- `tmp/gojs-calculator/frontend/index.html` - Vite HTML entry point
- `tmp/gojs-calculator/frontend/src/main.tsx` - React root with StrictMode
- `tmp/gojs-calculator/frontend/src/App.tsx` - Tab navigation between Calculator/History/Batch
- `tmp/gojs-calculator/frontend/src/index.css` - Minimal styling for calculator UI
- `tmp/gojs-calculator/frontend/src/vite-env.d.ts` - Vite client type reference
- `tmp/gojs-calculator/frontend/src/lib/codepoint.ts` - Frontend probe library (browser + Node.js dual mode)
- `tmp/gojs-calculator/frontend/src/api/client.ts` - API client (calculate, getHistory, getHistoryDetail, batchCalculate)
- `tmp/gojs-calculator/frontend/src/components/Calculator.tsx` - Calculator UI with flow-api-calculate probes
- `tmp/gojs-calculator/frontend/src/components/History.tsx` - History UI with flow-history-query probes
- `tmp/gojs-calculator/frontend/src/components/BatchCalc.tsx` - Batch UI with flow-batch-process probes

## Decisions Made
- All frontend probes placed in event handlers (onClick, onKeyDown), NOT in useEffect -- React 18 strict mode double-invokes effects, which would produce duplicate probes and misleading stack traces
- codepoint.ts copied verbatim from frontend.md template -- preserves the dual-mode design (browser POST to /__codepoint__ + Node.js file write) with zero-cost disabled path
- Tab navigation uses useState without router library -- only 3 views, a full router would be over-engineering

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] TypeScript build failed: missing Node.js type definitions for codepoint.ts**
- **Found during:** Task 3 (frontend build with `npm run build`)
- **Issue:** `tsc -b` (which Vite's build script runs) could not resolve `node:fs`, `node:os`, `node:path` imports in codepoint.ts. The tsconfig.app.json had `"types": ["vite/client"]` but not `"node"`, so the browser-only tsconfig did not include Node.js type definitions.
- **Fix:** Added `"node"` to the `types` array in tsconfig.app.json: `"types": ["vite/client", "node"]`. @types/node was already available in the project.
- **Files modified:** `tmp/gojs-calculator/frontend/tsconfig.app.json`
- **Verification:** `npm run build` succeeds (tsc -b + vite build)
- **Committed in:** `b17bf89` (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Minimal -- a single tsconfig configuration fix. No scope or design changes.

## Issues Encountered
- Port 8080 was already in use during smoke test (likely by a previously started gojs-calculator instance). Used port 18090 for testing. All endpoints verified correctly on the alternate port.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- React frontend builds to frontend/dist/ and embeds correctly in Go binary via go:embed
- All three UI components emit pointWithMeta probes with correct flow_id matching backend flows
- Collector endpoint (POST /__codepoint__) confirmed working -- accepts frontend probe data
- Real browser verification (React stack traces, event handler firing) deferred to Plan 04 checkpoint
- Plan 03 (codepoint scan) can now scan both Go and TS source files in the project

## Known Stubs

None -- all components are functional with real API calls and probe integration.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: xss-input | src/components/Calculator.tsx, BatchCalc.tsx | User-typed expressions rendered as text content (not innerHTML). Risk: minimal since React escapes JSX by default. Mitigated by Go backend calculator.Validate(). |

## Self-Check: PASSED

- All 15 source files verified as FOUND
- SUMMARY.md verified as FOUND
- Commit ef44608 verified as FOUND (Task 1)
- Commit e3016eb verified as FOUND (Task 2)
- Commit b17bf89 verified as FOUND (Task 3)
- No accidental file deletions (dist/.gitkeep deletion was intentional)
- All pre-existing untracked files are unrelated to this plan

---
*Phase: 35-gojs-fullstack-calc*
*Completed: 2026-04-18*
