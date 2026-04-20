# Domain Pitfalls: Adding Frontend Automated Testing to Codepoint V2

**Domain:** Adding frontend test planning + verification features to an existing codepoint instrumentation system
**Researched:** 2026-04-20
**Context:** v2.0 milestone — frontend automated testing system built on Codepoint V2 (scan/plan/implement)
**Confidence:** HIGH (based on analysis of 5 E2E test projects, design review with 5 deviations, and 12 bugs fixed in v1.9.1)

---

## Critical Pitfalls

Mistakes that cause rewrites, lost work, or fundamental architecture problems.

---

### Pitfall 1: Test Specification vs Execution Gap

**What goes wrong:** The frontend test plan describes "click button X, verify response Y" in structured markdown, but when the test skill tries to execute it, the specification lacks the concrete selectors, API endpoints, or state assertions needed to actually run. The plan becomes documentation that cannot be converted into executable verification.

**Why it happens:** The Codepoint V2 system already has this exact problem at a smaller scale. The design review deviation CP-03 identified that the implement skill's Verify phase generates complex test matrices (normal flow, boundary conditions, failure modes) that in practice reduce to "did the probe fire and output valid JSON?" The gap between "describe what should be tested" and "automatically verify it" is the central tension of this entire milestone.

**Consequences:**
- Test plans become shelfware — written but never executed
- Manual verification steps creep in, defeating the purpose of automation
- The skill generates impressive-looking verification reports that are actually just reformatted specs
- Users lose trust in the system and revert to manual testing

**Prevention:**
1. Define the test specification format to be directly executable — every "verify" step must have a concrete assertion mechanism (probe output check, DOM query, API response match)
2. Build the execution engine FIRST, then design the specification format to match what the engine can actually verify
3. Keep the spec-to-execution mapping 1:1 — avoid any specification element that requires "interpretation" by the AI
4. Use the existing probe output format (point_id + flow_id + timestamp + stack + metadata) as the assertion vocabulary

**Detection:**
- If a test plan has any step that says "verify that..." without specifying HOW (which probe, what output, what match condition), it has the gap
- If verification requires the AI to "check" or "analyze" output rather than mechanically compare it, the gap exists

**Phase assignment:** Phase 1 (design/spec) — this is a foundational design decision that affects everything downstream

---

### Pitfall 2: Frontend Probe Instrumentation Overhead in Test Mode

**What goes wrong:** Adding test-specific probe instrumentation (extra metadata, assertion markers, test case identifiers) bloats the lightweight codepoint.ts library beyond its "zero overhead when disabled" contract. Or worse, the test instrumentation only works when codepoints are "enabled," forcing developers to run with probes active during testing.

**Why it happens:** The current codepoint.ts is carefully designed for zero overhead:
- Node.js: one boolean check (`enabled`)
- Browser: one failed fetch, then stops (`_endpointAlive = false`)

Adding test-specific features (like assertion tracking, test case correlation, step counters) creates a second dimension of toggle state. The existing toggle file mechanism (`~/.codepoint/.codepoint-ts`) is binary — probes are either on or off. Test mode needs a third state: "probes are on AND collecting test-specific data."

**Consequences:**
- The probe library becomes complex with multiple code paths (disabled / normal / test)
- Performance regression in development mode when test instrumentation is active
- The clean separation between "probe code" and "business code" blurs
- Test infrastructure leaks into production builds

**Prevention:**
1. Keep test instrumentation OUT of codepoint.ts entirely — the probe library should not know about tests
2. Use the existing probe output as the test data source — read the log files, don't modify the probes
3. Test orchestration happens at the skill level (Claude Code reads probe output and compares to expected), not at the library level
4. If additional metadata is needed, add it as fields in `pointWithMeta()` calls that are already part of the probe pattern — no new API surface

**Detection:**
- If codepoint.ts gains a new export function or a new conditional branch for "test mode," this pitfall has been hit
- If the probe output format changes between "normal" and "test" runs, the separation has been violated

**Phase assignment:** Phase 2 (implementation) — architecture decision during probe template design

---

### Pitfall 3: SPA Route Mismatch Between Test Plan and Runtime

**What goes wrong:** The test plan specifies interactions with frontend routes (e.g., "navigate to /dashboard, click settings"), but the SPA serves `index.html` for all routes via fallback. The test execution hits the route before the SPA has hydrated, or the route doesn't exist as a real endpoint. This was already discovered and fixed as a bug in v1.9.1 — the SPA fallback handler in `main.go` had to be registered AFTER the API routes and codepoint collector endpoint.

**Why it happens:** The gojs-calculator E2E project already demonstrated this exact bug (v1.9.1 bug: "SPA fallback catches /__codepoint__ POST requests, preventing frontend probes from reaching the collector"). The fix required careful route registration order:

```
// CRITICAL: Register collector and API BEFORE SPA fallback
mux.HandleFunc("POST /__codepoint__", codepoint.CollectorHandler())
mux.Handle("/api/", server)
// SPA fallback LAST
```

When adding test execution that navigates routes and triggers probes, the same ordering problem recurs at a higher level: test actions must complete before the SPA route handler redirects them.

**Consequences:**
- Test execution silently fails — probes never fire because requests are caught by SPA fallback
- Flaky tests that pass when the server is fast (SPA hydrates quickly) and fail when it's slow
- Debugging nightmare — the probe output file is empty, but there's no error message explaining why

**Prevention:**
1. Include route registration order validation as a mandatory step in the test setup checklist
2. The test skill should verify `/__codepoint__` endpoint is reachable BEFORE running any test cases
3. Add a health-check probe (a test-only probe that fires once at startup to confirm the collector is working)
4. Document the SPA fallback ordering as a "MUST CHECK" item in the test execution skill

**Detection:**
- If a test runs but produces zero probe output, immediately check route registration order
- If probe output is missing for frontend probes but present for backend probes, SPA fallback is intercepting

**Phase assignment:** Phase 2 (implementation) — during test execution skill development

---

### Pitfall 4: Windows Process Lifecycle Timing

**What goes wrong:** Frontend tests require starting both the backend server (Go or Python) AND the frontend dev server (Vite), waiting for both to be ready, then running test actions, then shutting down cleanly. On Windows, process management is fundamentally different from Unix: `Ctrl+C` propagation is unreliable, child processes may outlive parents, and port release after process kill has a delay (TCP TIME_WAIT).

**Why it happens:** The pyts-calculator E2E project already encountered this: the v1.9.1 milestone noted "Windows process management" as a key challenge. Python's FastAPI server and Node's Vite dev server both need to be coordinated. On Windows:

- `taskkill /F` is needed because graceful shutdown often doesn't work
- Port 8080 (or whatever port) may not be immediately available after killing the previous process
- Background process spawning in bash-on-Windows (Git Bash) behaves differently from native cmd
- The `start` command in cmd creates new console windows that are hard to track

**Consequences:**
- Tests fail because the server from the previous run is still listening on the port
- Zombie processes accumulate, consuming memory and ports
- Test flakiness — sometimes passes, sometimes fails, depending on port availability
- CI-like automation becomes impossible without reliable process cleanup

**Prevention:**
1. Always kill existing processes on the target port BEFORE starting a new server
2. Use port auto-detection (`netstat -ano | findstr :PORT`) rather than assuming the port is free
3. Implement a "wait for ready" health check (HTTP GET to `/api/health` or similar) with timeout rather than fixed sleep
4. Use Go's `embed.FS` approach (compile frontend into backend binary) to eliminate the need for a separate frontend dev server in test mode
5. For the separate dev server case, use a PID file and explicit cleanup in the test skill

**Detection:**
- "Address already in use" errors during test setup
- Test output from a previous run appearing in the current probe log files
- Processes remaining after test completion (`tasklist | findstr node` or `tasklist | findstr python`)

**Phase assignment:** Phase 1 (design) for architecture decision (embedded vs separate), Phase 2 for implementation

---

### Pitfall 5: Toggle State Chaos in Multi-Project Testing

**What goes wrong:** The codepoint system uses file-based toggles (`~/.codepoint/.codepoint-ts`, `~/.codepoint/.codepoint-go`, `~/.codepoint/.codepoint-python`). When running tests across multiple E2E projects (gojs-calculator, pyts-calculator), the toggle state is GLOBAL — enabling codepoints for one project enables them for ALL projects that share the same home directory. Test execution order affects results.

**Why it happens:** The toggle mechanism was designed for "enable once, use across the session" — not for sequential test execution across multiple projects. The pyts-calculator E2E tests validated "Toggle four-combination independent verification" (on/off for both Go and TS toggles), which proves the toggles work individually but also proves that cross-project interference is possible.

In v2.0, the test skill needs to:
1. Enable toggles
2. Run the application
3. Execute test actions
4. Collect probe output
5. Disable toggles

If step 5 fails (process crash, Windows kill issue from Pitfall 4), toggles remain enabled globally. The next test project starts with stale state.

**Consequences:**
- Test pollution — project A's test data contaminates project B's probe output
- False positives — probes fire in projects where they shouldn't be active
- Probe output directory confusion — `~/.codepoint/gojs-calculator/` gets data meant for `~/.codepoint/pyts-calculator/`

**Prevention:**
1. The test skill should explicitly manage toggle state: enable before test, verify enabled, then disable after test (with error handling)
2. Use project-specific output directories (already implemented via `path.basename(process.cwd())`) as a safety net
3. Before collecting probe output, verify the output file's timestamp matches the current test run
4. Consider a "test session ID" in probe output to disambiguate runs

**Detection:**
- Probe output files with timestamps from before the current test started
- More probe entries than expected (data from multiple projects mixed together)
- Toggle files present when they shouldn't be after a test run fails

**Phase assignment:** Phase 2 (implementation) — test execution skill must include toggle management

---

## Moderate Pitfalls

---

### Pitfall 6: Design Review Deviations Carried Forward Unexamined

**What goes wrong:** The v2.0 milestone is built on Codepoint V2 which has 5 known design deviations (CP-01 through CP-05). If the frontend testing feature is built ON TOP of the current (deviated) scan/plan/implement structure, then fixing those deviations later may require reworking the test features too. Specifically:
- CP-01 (scan is file-by-file instead of link-oriented) means the test planning skill may inherit the wrong mental model
- CP-03 (implement is TDD-style instead of one-shot) means test verification may be conflated with probe verification

**Why it happens:** The design review (docs/research/codepoint/2026-04-19-design-review.md) identified improvement priorities (P0: CP-01, CP-05; P1: CP-02, CP-04; P2: CP-03) but v2.0 starts WITHOUT these fixes applied. The frontend test features will be designed against the current, imperfect skill structure.

**Prevention:**
1. Acknowledge which deviations the test feature depends on and design accordingly
2. If CP-01 changes the scan output format, the test planning skill should consume the format-agnostic "flow + point" abstraction rather than parsing scan output directly
3. If CP-03 simplifies the implement phase, the test verification should be designed to work with both TDD-style and simplified implement flows
4. Document the coupling points so that when deviations are fixed, the test feature can be updated predictably

**Phase assignment:** Phase 1 (design) — make coupling to existing deviations explicit

---

### Pitfall 7: Probe Output Parsing Assumptions

**What goes wrong:** The test verification logic assumes a specific probe output format (JSON with point_id, flow_id, timestamp, stack, metadata) but the actual output varies across modes:
- Browser probes via collector: JSON with `name`, `stack`, `timestamp`, `meta` (note: `name` not `point_id`)
- Node.js probes: JSON with `name`, `timestamp`, `stack`, `frames`, `meta`
- Plain text probes: `[CODEPOINT] name\nstack\n`
- Flow-routed probes: per-flow log files with different naming patterns

The v1.9.1 E2E tests already revealed format inconsistencies that required fixes. Building test verification on format assumptions that work in one mode but not another creates fragile tests.

**Why it happens:** The frontend probe has dual mode (browser + Node.js), and the Go collector reformats the data slightly when writing to files. The test verification skill needs to parse these files, and any assumption about field names or structure that doesn't match the actual output causes verification failures.

**Prevention:**
1. Normalize probe output to a canonical format BEFORE verification, don't parse raw logs
2. Use the collector's output format (the Go-side `CollectorHandler` output) as the canonical format for test verification
3. Add a "probe output schema" to the test verification skill that documents the exact fields and types expected
4. Test the parser against all existing E2E project outputs before relying on it

**Detection:**
- Verification reports showing "probe not fired" when the probe actually fired but in a different format
- JSON parse errors when reading probe log files
- Missing fields in parsed output that the verification logic expects

**Phase assignment:** Phase 2 (implementation) — probe output parser is a foundational component

---

### Pitfall 8: Skill UX Complexity Explosion

**What goes wrong:** Adding a frontend testing skill creates a fourth command (`/codepoint-test` or similar) on top of the existing three (`/codepoint-scan`, `/codepoint-plan`, `/codepoint-implement`). Users now need to understand when to use which command, and the commands may have overlapping responsibilities. The test skill might duplicate scanning functionality (to understand the frontend), duplicate planning functionality (to generate test cases), and duplicate implementation functionality (to insert test-specific probes).

**Why it happens:** The existing three-command structure already shows signs of overlap — the design review deviation CP-02 identified that "plan" should be "collection building" rather than "feature planning." Adding "test" as a fourth creates a 4x4 matrix of "can I do X with command Y?" confusion.

The v2.0 milestone target says "frontend test specialized skill — Claude Code skill for assisting frontend test planning and verification." If this becomes a separate skill with its own SKILL.md, it fragments the user experience.

**Prevention:**
1. Do NOT create a fourth independent skill — extend the existing implement skill with a "test verification" phase, or add test planning as a mode within the plan skill
2. The test feature should be triggered by context (the skill detects it's a frontend project and offers test planning) rather than requiring a separate command
3. Keep the user's mental model at three commands: scan (understand code), plan (define codepoints), implement (insert + verify + test)
4. Any test-specific functionality should be integrated INTO the implement skill's verification phase

**Detection:**
- If the skill tree grows beyond 4 leaf skills (codepoint/scan/plan/implement), complexity has exploded
- If users ask "which command should I use for X?" more than once per feature, the UX is confused
- If two skills share more than 30% of their instruction text, they should be merged

**Phase assignment:** Phase 1 (design) — skill structure is a foundational decision

---

### Pitfall 9: Test Plan Template Does Not Match Frontend Interaction Patterns

**What goes wrong:** The test plan template is designed around backend flow patterns (entry -> boundary -> state-change -> error) but frontend interactions have fundamentally different patterns: user action -> state update -> re-render -> side effect. The "click -> response -> verify" sequence described in the v2.0 milestone requires capturing asynchronous state transitions that don't map cleanly to the current flow sequence model.

**Why it happens:** The existing flow model (from data-model.md) defines flows as "ordered sequences of code points" with a trigger like "POST /api/login." Frontend flows are triggered by user actions (click, input, scroll), have asynchronous state transitions (React state updates, API calls), and the "verify" step often needs to check DOM state rather than just probe output.

The E2E test projects use `pointWithMeta` in event handlers (e.g., `handleSubmit` in Calculator.tsx), which works for capturing "user clicked submit" but doesn't capture "the UI updated to show the result" — that's a different moment in the async chain.

**Prevention:**
1. Add a frontend-specific flow type that captures: trigger (user action) -> intermediate state (loading, error) -> final state (UI updated)
2. Include DOM query verification as a first-class assertion type alongside probe output verification
3. The test plan template for frontend should have: action, expected probe sequence, expected DOM state, expected API calls — not just probe sequence
4. Use the existing `pointWithMeta` pattern to capture both the action trigger and the response handling, verifying both probe entries appear in the correct order

**Detection:**
- If test plans for frontend features only check "probes fired" without verifying UI state, the template is too backend-oriented
- If the test execution skill cannot verify "the result display shows '5'" without a probe at that exact point, the model is incomplete

**Phase assignment:** Phase 1 (design) — the frontend test plan template is a core deliverable

---

## Minor Pitfalls

---

### Pitfall 10: GBK Encoding in Probe Output File Names

**What goes wrong:** Windows Chinese locale uses GBK encoding. If the project directory name contains Chinese characters (common in Chinese development teams), the probe output path `~/.codepoint/<project-dir-name>/cp-ts-*.log` may fail or produce garbled filenames. The current codepoint.ts uses `path.basename(process.cwd())` which returns UTF-8 strings on Windows, but `fs.writeFileSync` behavior with non-ASCII paths varies.

**Prevention:** Test the probe output with a Chinese-named project directory. Ensure `fs.mkdirSync` with `recursive: true` handles non-ASCII paths on Windows. The project has already adopted ASCII-only in scripts (CLAUDE.md rule: "don't include Chinese in scripts"), so this is more about documentation than code fix.

**Phase assignment:** Phase 2 (implementation) — quick validation during test execution development

---

### Pitfall 11: Embedded Frontend vs Dev Server Test Modes

**What goes wrong:** The gojs-calculator project uses Go's `embed.FS` to compile the frontend into the binary, while pyts-calculator uses a separate Vite dev server. The test execution skill needs to handle both modes, and the setup/teardown logic is fundamentally different:
- Embedded: start one binary, everything is available
- Dev server: start backend + start frontend + wait for both + coordinate shutdown

If the test skill only supports one mode, half the E2E projects become untestable.

**Prevention:** Design the test execution flow with a "server mode" detection step that determines whether one or two processes are needed. The embedded mode should be the primary/recommended approach; dev server mode as fallback.

**Phase assignment:** Phase 1 (design) — affects test execution architecture

---

### Pitfall 12: React Strict Mode Double Invocation

**What goes wrong:** React 18 Strict Mode double-invokes effects and renders in development. If codepoint probes are placed in `useEffect`, they fire twice per mount, producing duplicate entries that confuse test verification (expecting N probes but getting 2N).

**Why it happens:** The E2E projects already addressed this: the frontend reference explicitly notes "Frontend probes in event handlers only (not useEffect)." But the test planning skill may not enforce this constraint, and users following the test plan may place verification probes in `useEffect` without realizing the duplication.

**Prevention:** Include a hardcoded rule in the test planning skill: "NEVER place codepoint probes in useEffect or useLayoutEffect — always use event handlers or explicit function calls." Auto-detect `useEffect` usage in probe placement and flag it.

**Phase assignment:** Phase 1 (design) — rule goes into the test planning skill's guidelines

---

### Pitfall 13: Test Data Cleanup Between Runs

**What goes wrong:** Each test run produces probe output files in `~/.codepoint/<project>/`. These files accumulate across test runs. When the test verification skill reads the "latest" output, it may read stale data from a previous run, producing false positive or false negative results.

**Why it happens:** The probe output file naming includes timestamps (`cp-ts-YYYY-MM-DD_HH-MM-SS_mmm.log`), so files don't overwrite each other. But the test verification skill needs to know WHICH file corresponds to the current test run. If it just reads "the newest file," it might pick up a file from a concurrent run or a previous failed run.

**Prevention:**
1. Record the probe output filename at test start (before any probes fire)
2. Delete or move existing probe output files in the project's `.codepoint/` directory before starting a test run
3. Use the session timestamp as a filter — only read files created AFTER the test session started

**Phase assignment:** Phase 2 (implementation) — test execution cleanup logic

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Test specification design | Pitfall 1: Spec vs execution gap | Build executor first, design spec format to match |
| Probe template changes | Pitfall 2: Instrumentation overhead | Keep test logic out of codepoint.ts |
| Test execution skill | Pitfall 3: SPA route mismatch | Add collector health-check before tests |
| Test execution skill | Pitfall 4: Windows process lifecycle | Use embedded frontend, PID tracking, port cleanup |
| Toggle management | Pitfall 5: Toggle state chaos | Explicit enable/disable with error recovery |
| Skill structure | Pitfall 8: UX complexity explosion | Extend existing skills, don't add new ones |
| Frontend test templates | Pitfall 9: Frontend pattern mismatch | Add DOM verification as first-class assertion |
| Integration with existing deviations | Pitfall 6: Deviation dependencies | Document coupling points explicitly |
| Output parsing | Pitfall 7: Format assumptions | Normalize to canonical format before verification |
| Cross-project testing | Pitfall 13: Data cleanup | Record file timestamps, clean before each run |

---

## Dependency Map

```
Pitfall 1 (spec-execution gap)
  <- drives design of: Pitfall 9 (frontend template), Pitfall 8 (skill structure)

Pitfall 4 (Windows process)
  -> blocks: Pitfall 5 (toggle state)
  -> blocks: Pitfall 13 (data cleanup)

Pitfall 2 (instrumentation overhead)
  <- must be decided before: Pitfall 7 (output parsing)

Pitfall 6 (deviation carry-forward)
  <- affects: All other pitfalls (the foundation has cracks)

Pitfall 3 (SPA route mismatch)
  -> already encountered in v1.9.1
  -> regression risk in v2.0
```

---

## Sources

- `docs/research/codepoint/2026-04-19-design-review.md` — 5 deviations (CP-01~05) with E2E evidence
- `tests/e2e/codepoint-v2/gojs-calculator/main.go` — SPA fallback route ordering bug (v1.9.1 fix)
- `tests/e2e/codepoint-v2/gojs-calculator/frontend/src/lib/codepoint.ts` — dual-mode probe library
- `tests/e2e/codepoint-v2/gojs-calculator/frontend/src/components/Calculator.tsx` — event handler probe pattern
- `tests/e2e/codepoint-v2/gojs-calculator/codepoint/collector.go` — sync.Mutex + flow_id routing
- `plugins/codepoint/references/frontend.md` — frontend probe implementation guide
- `.planning/PROJECT.md` — v2.0 milestone definition
- `.planning/STATE.md` — deferred items (7 debug sessions from previous milestones)
- `.planning/MILESTONES.md` — v1.9.1 E2E test results (12 bugs fixed, SPA fallback, batch unwrap)
