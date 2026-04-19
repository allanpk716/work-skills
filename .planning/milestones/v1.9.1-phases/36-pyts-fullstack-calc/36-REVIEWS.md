---
phase: 36
reviewers: [opencode]
reviewed_at: 2026-04-19T10:00:00+08:00
plans_reviewed: [36-01-PLAN.md, 36-02-PLAN.md]
---

# Cross-AI Plan Review — Phase 36

## OpenCode Review

### Plan 36-01: Create Python+TS Full-Stack Calculator Project

**Summary**

This plan is a well-structured port of the existing Go+JS full-stack calculator (Phase 35) to a Python+TS stack, leveraging extensive code reuse from the single-language `python-calculator` and `gojs-calculator` projects. The approach is pragmatic — copy proven code, adapt the HTTP framework from `http.server` to FastAPI, and add the frontend collector. The plan achieves its goal with minimal new code, but has a few gaps around startup orchestration, error handling during build integration, and the StaticFiles ordering constraint.

**Strengths**
- Maximum code reuse identified: Core calculator, history store, batch processor, frontend components, and probe libraries are all copied verbatim — reducing risk and ensuring behavioral consistency with Phase 35
- Clear dependency on Phase 35 artifacts: The plan explicitly references `gojs-calculator` as the template, making the pattern concrete and verifiable
- Threat model included: Even for a test project, T-36-01 through T-36-03 acknowledge the attack surface and explicitly accept risks where appropriate
- Critical pitfalls from research are addressed: StaticFiles mount ordering, port conflict avoidance (18091), `pathlib.Path` usage, and flow_id consistency are all called out
- Collector endpoint design mirrors proven Go pattern: POST `/__codepoint__` with 404-on-disabled is the same zero-overhead approach validated in Phase 35

**Concerns**
- **[MEDIUM] No `__init__.py` files mentioned for Python packages**: Plan says "copy files" but doesn't explicitly list creating `__init__.py` files for `api/`, `calculator/`, `history/`, `batch/` packages
- **[MEDIUM] FastAPI startup/shutdown lifecycle for collector**: Plan doesn't mention calling `close_ts_collector()` on FastAPI shutdown. Without it, log file handles may not be flushed properly on Windows
- **[MEDIUM] No `ensureCodepointToggle()` equivalent**: No auto-creation of toggle files at startup. If toggles are missing, probe library silently disables itself
- **[LOW] `BatchResult` interface change is underspecified**: Doesn't specify what the Python batch API actually returns
- **[LOW] npm install failure mode not handled**: No fallback if `npm install` fails
- **[LOW] No mention of `fastapi`, `uvicorn` dependency management**: No `requirements.txt` mentioned

**Suggestions**
- Add a `requirements.txt` with `fastapi`, `uvicorn`, and `pytest`
- Add FastAPI shutdown event handler to call `close_ts_collector()`
- Explicitly list all `__init__.py` files to create as a checklist item
- Add toggle auto-creation logic in `main.py`
- Define the Python batch API response format explicitly

### Plan 36-02: Cross-Language Linkage Verification

**Summary**

This verification plan covers the two critical test dimensions — cross-language probe linkage (Python backend + TS frontend through collector) and the 2x2 toggle independence matrix. The four-combination toggle test is correctly designed with process restart between each combination (respecting the module-level toggle check constraint). The plan is thorough and directly addresses all three success criteria, though it lacks some operational robustness around server lifecycle management on Windows.

**Strengths**
- Toggle restart constraint is correctly identified and handled: Each combination has a full start-test-stop cycle
- Complete 2x2 coverage: All four combinations tested, including "both disabled" confirming probes are truly no-ops
- Multi-flow stack differentiation is tested: Same code point produces different call stacks across three flows
- Log restoration after testing: Good cleanup practice
- pytest integration: Using `@pytest.mark.integration` follows existing test patterns

**Concerns**
- **[HIGH] Windows process management for server start/stop**: Requires starting/stopping FastAPI 5 times. On Windows, orphan processes can cause `Address already in use` errors
- **[MEDIUM] No timing/retry logic for server readiness**: No health-check polling after starting FastAPI
- **[MEDIUM] Collector frontend probe simulation is underspecified**: Exact JSON payload not specified
- **[LOW] No cleanup of port occupation on failure**: If test fails mid-combination, server may block subsequent tests
- **[LOW] `test_integration.py` scope creep risk**: Could become a monolithic test file

**Suggestions**
- Use a subprocess management fixture with PID tracking
- Add a `wait_for_server(url, timeout=10)` helper
- Specify the exact collector POST payload in the plan
- Add `try/finally` blocks around each toggle combination
- Consider splitting into `test_linkage.py` and `test_toggle.py`

### Overall Risk Assessment

**Risk Level: MEDIUM**

**Justification:**

The plans are well-designed with strong foundations — extensive code reuse, correct understanding of the toggle restart constraint, and comprehensive test coverage. The primary risks are:

1. **Operational risk on Windows** (HIGH impact, MEDIUM likelihood): Server process management across 5+ start/stop cycles is fragile on Windows
2. **Missing dependency/package setup** (MEDIUM impact, HIGH likelihood if not addressed): No explicit Python dependency installation step
3. **Collector lifecycle on Windows** (LOW impact, MEDIUM likelihood): Missing `close_ts_collector()` on shutdown could cause incomplete log files

---

## Consensus Summary

> Note: Only one reviewer (OpenCode) was available for this review cycle.

### Key Findings Requiring Attention

1. **`__init__.py` files** — Plan 36-01 Step 3 actually does say "Create empty `__init__.py` files in: api/, calculator/, history/, batch/" so this concern is already addressed in the plan. No action needed.

2. **FastAPI shutdown handler** — The RESEARCH.md code example includes `@app.on_event("shutdown")` calling `close_ts_collector()`, and Plan 36-01 Step 5 says "Shutdown handler: close_ts_collector()". Already addressed. No action needed.

3. **`requirements.txt`** — Plan 36-01 Step 7 explicitly says "Install FastAPI: `python -m pip install fastapi`". The project is a test project in `tmp/` with no long-term dependency management needs. Low priority but could add for convenience.

4. **Windows process management** — This is the most actionable concern. Plan 36-02's toggle verification requires reliable process start/stop. The executor should implement PID-based process management.

5. **Server readiness polling** — Plan 36-02 Step 3 says "Wait for Uvicorn running on http://0.0.0.0:18091 in stderr output" but doesn't specify a retry mechanism. Executor should add readiness polling.

### Divergent Views

Single reviewer — no divergent views.
