---
phase: 35
reviewers: [opencode]
reviewed_at: 2026-04-18T23:30:00+08:00
plans_reviewed: [35-01-PLAN.md, 35-02-PLAN.md, 35-03-PLAN.md, 35-04-PLAN.md]
---

# Cross-AI Plan Review — Phase 35

## OpenCode Review (glm-5.1)

### Plan 01: Go Backend — Calculator + API + Enhanced Collector + go:embed + Tests

**Summary**

Plan 01 addresses the most critical gap in the codepoint system — the collector discarding `flow_id` from frontend probes. The approach of adapting the proven `go-calculator` codebase and enhancing the collector with per-flow routing is sound and well-scoped. The wave ordering correctly places this as the foundation for all subsequent plans.

**Strengths**
- Identifies and fixes the root cause: collector template line 692 discards `entry.Meta` entirely
- Route registration order is critical and correct: collector + API before SPA fallback
- Reuses proven code from `tmp/go-calculator/`
- Both toggle files ensured on startup
- Tests included in same plan for early validation

**Concerns**
- **MEDIUM** — Collector thread safety: `tsFlowFiles` map needs `sync.Mutex` for concurrent HTTP requests
- **MEDIUM** — Enhanced collector output format: must ensure JSON format for meta-bearing entries matches Go-side `PointWithMeta` output
- **LOW** — go:embed placeholder: confirm it doesn't interfere with actual builds
- **LOW** — `detectModuleName()` scope: ensure `gojs-calculator` doesn't collide with existing `go-calculator` output directory

**Suggestions**
- Add `sync.Mutex` to protect `tsFlowFiles` map and file writes
- Make enhanced collector write JSON format for entries with `meta`
- Ensure `CloseCollector()` defer in `main()` flushes frontend log files
- Document expected log file naming convention for cross-reference with Plan 04

**Risk: MEDIUM**

---

### Plan 02: React Frontend — Vite Build + codepoint.ts + 3 Components

**Summary**

Plan 02 creates the React frontend with clean 1:1 mapping to backend flows. The build+integration verification catches go:embed issues early. Main risk is ensuring browser-mode `codepoint.ts` sends correct payloads after Vite build + Go embedding.

**Strengths**
- Three components match three backend flows exactly
- V2 probe pattern (`pointWithMeta` with `point_id` + `flow_id`) is correct
- Build verification in same wave catches go:embed issues early
- codepoint.ts copied from proven template

**Concerns**
- **HIGH** — Browser codepoint.ts `sendToCollector` sends `meta` but collector must be enhanced first (Plan 01 dependency)
- **MEDIUM** — No actual browser testing: curl smoke test doesn't verify React components render and probes fire in browser
- **MEDIUM** — Frontend probe placement: React strict mode double-invokes effects; probes should be in event handlers, not useEffect
- **LOW** — Vite proxy config not mentioned for development experience

**Suggestions**
- Specify probe placement in event handlers (onClick, onSubmit), not useEffect
- Consider adding minimal Playwright or manual browser test step
- Verify `sendToCollector` payload structure matches enhanced collector expectations

**Risk: MEDIUM**

---

### Plan 03: codepoint:scan Cross-Language Flow Identification

**Summary**

Plan 03 validates the scan skill on a fullstack project. Correctly identifies the open question about dual-language detection but lacks a fallback strategy if scan can't detect Go+JS as one project.

**Strengths**
- Tests the scan skill itself — right approach
- Human verification checkpoint for first-of-its-kind scenario
- Honest about uncertainty

**Concerns**
- **HIGH** — No fallback if scan fails: scan may detect as Go-only, Node.js-only, or fail to recognize cross-language nature. Without fallback, FULL-02 goal is at risk.
- **MEDIUM** — Scan may not understand go:embed: frontend code at `frontend/src/` may not be recognized as part of the same project
- **LOW** — Scope uncertainty: expected output structure not specified

**Suggestions**
- Define fallback plan: manual `.codepoints/` creation matching go-calculator pattern
- Specify expected scan output (collections, flows, points counts)
- Treat as "scan skill validation test" — failure indicates scan skill bug, not Phase 35 issue
- Formalize pass/fail criteria

**Risk: HIGH**

---

### Plan 04: Collector Correlation + Multi-Flow Stack Integrity

**Summary**

Plan 04 is the critical E2E verification. Curl simulation tests the collector routing mechanism but doesn't test real browser stack traces, which is a gap against FULL-04's "complete call chain including frontend and backend parts."

**Strengths**
- Tests the core value proposition: same codepoint, different stacks per flow
- Three flows tested independently for clear pass/fail
- Specific verification criteria (per-flow files, matching flow_id, different stacks)
- Human verification checkpoint

**Concerns**
- **HIGH** — Curl simulation doesn't produce real React stack traces: FULL-04 requires "frontend and backend parts" but curl sends hardcoded JSON stacks
- **MEDIUM** — Log file discovery: no clear stale data management (need to clear directory before test)
- **MEDIUM** — Stack comparison methodology: "different stacks" not quantified; should reference `TestMultiFlowStackDifferentiation` pattern
- **LOW** — Race condition: collector may be flushing when tests read log files

**Suggestions**
- Add minimal browser test step (even manual) to validate real React stacks
- Clear `~/.codepoint/gojs-calculator/` before each test run
- Reference `TestMultiFlowStackDifferentiation` from go-calculator as template
- Define "different stacks" quantitatively: handler-level frames differ, shared calculator frames present in all
- Add sleep/flush between probe sending and log reading

**Risk: MEDIUM-HIGH**

---

### Overall Phase Assessment

| Dimension | Assessment |
|-----------|------------|
| Goal alignment | Plans directly address all 4 requirements (FULL-01 through FULL-04) |
| Wave ordering | Correct: Backend foundation → Frontend → Scan → E2E verification |
| Dependency management | Plan 01 → Plan 02 → Plan 04 clear. Plan 03 independent but blocking FULL-02. |
| Scope | Well-bounded. Temp project avoids polluting main codebase. |
| Risk distribution | Heaviest in Plan 03 (scan untested) and Plan 04 (browser stacks) |

---

## Consensus Summary

### Top 3 Shared Concerns

1. **Scan skill fullstack support (Plan 03)** — HIGH risk. No fallback if scan can't detect cross-language flows. Could block FULL-02.
2. **Collector thread safety (Plan 01)** — MEDIUM risk. `tsFlowFiles` map needs mutex for concurrent HTTP requests.
3. **No real browser stack validation (Plan 04)** — MEDIUM-HIGH risk. Curl simulation doesn't produce actual React component stack traces. FULL-04 may not be truly satisfied.

### Agreed Strengths
- Wave ordering and dependency chain is correct
- Enhanced collector addresses root cause (flow_id discard)
- Reuse of proven go-calculator patterns reduces risk
- Research thoroughly identified 5 common pitfalls

### Divergent Views
- No divergent views from single reviewer

### Top 3 Actionable Suggestions

1. **Add fallback to Plan 03**: If scan fails, manually create `.codepoints/` index. Document scan skill gap as follow-up.
2. **Add mutex to enhanced collector (Plan 01)**: Protect `tsFlowFiles` from concurrent access.
3. **Add minimal browser test to Plan 04**: Even manual step (open browser, click, check log) validates end-to-end path for FULL-04.
