# Project Research Summary

**Project:** Work Skills v2.0 -- Frontend Automated Testing with Codepoint Integration
**Domain:** Frontend test planning and verification system for Claude Code skills
**Researched:** 2026-04-20
**Confidence:** HIGH

## Executive Summary

This milestone adds a frontend test planning and verification layer to the existing Codepoint V2 instrumentation system. The system already has a complete probe pipeline (scan/plan/implement skills, multi-language probe libraries, collectors, 5 E2E test projects). The new layer consumes probe runtime output to verify that user interactions trigger the expected codepoint sequences in the correct order. The integration point is the `.codepoints/` directory and `index.json` metadata -- the contract between instrumentation and verification.

The recommended approach is a **parallel verification track**, not a layer on top. The existing skills produce observability data (probes fire, stack traces, execution sequences). The new test skill consumes that data to verify UI behavior against a test plan. Playwright is the right tool for actually executing browser interactions and intercepting probe POST requests, but the core test skill itself is a **verification orchestrator** -- it reads test plans, collects probe output, and compares actual vs expected sequences. No changes to the probe runtime (codepoint.ts, collectors) are needed.

The key risk is the **spec-to-execution gap** (Pitfall 1): test plans that describe "click button, verify response" but lack concrete selectors, probe IDs, or assertion mechanisms to actually run. The mitigation is to design the test specification format around what the execution engine can verify -- probe output (point_id, flow_id, timestamp) and DOM state -- rather than free-form descriptions. A secondary risk is building on top of uncorrected design deviations (CP-01 through CP-05): the scan skill's file-by-file approach and the implement skill's over-engineered TDD loop should be addressed before or alongside the frontend testing build to avoid propagating known weaknesses into test plans.

## Key Findings

### Recommended Stack

The stack is minimal and deliberate. Playwright provides unmatched network interception (`page.route()`, `waitForRequest`) for capturing codepoint probes at the browser level. Vitest handles unit tests for codepoint.ts itself, reusing existing Vite config. Everything else (Testing Library, Cypress, Jest, Selenium) is explicitly excluded -- either because jsdom cannot execute real fetch requests, because the proxy-based interception is inferior, or because it would duplicate existing transform configuration.

**Core technologies:**
- **Playwright 1.59.x**: E2E browser testing -- `page.route()` intercepts `/__codepoint__` POST requests natively; `waitForRequest` captures probe data in real-time; Chromium-only is sufficient
- **Vitest 4.1.x**: Unit/integration tests for codepoint.ts -- reuses existing Vite 8 config with zero setup; Jest-compatible assertions
- **`@playwright/test` 1.59.x**: Test runner -- built-in fixtures, auto-wait, web-first assertions; ships with Playwright

**Deliberately excluded:** @testing-library/react (jsdom cannot execute fetch), Cypress (proxy-based interception less direct), Jest (duplicates Vite config), Selenium (over-engineered).

### Expected Features

Eight table-stakes features form the foundation. The test plan template (TS-01) and click-response-verify format (TS-03) are the most fundamental -- everything else builds on them. Codepoint data model integration (TS-04) reads existing `.codepoints/index.json` to correlate test cases with instrumented flows. Instrumentation guidance (TS-05, TS-06) helps developers place probes during feature development rather than after.

**Must have (table stakes):**
- **TS-01: Structured test plan template** -- repeatable format for "click -> response -> verify" flows
- **TS-03: Click -> response -> verify test case format** -- the fundamental testing primitive
- **TS-04: Integration with Codepoint data model** -- read `.codepoints/` structure, correlate test cases with flows
- **TS-06: Probe code templates for frontend** -- extend existing `references/frontend.md`
- **TS-02: Test plan generation from feature spec** -- accept spec, produce structured test plan
- **TS-05: Instrumentation guidance for new features** -- suggest codepoint placement for testability
- **TS-07: Verification execution guidance** -- guide probe activation and output checking (lightweight per CP-03)
- **TS-08: Full-stack flow test planning** -- span frontend -> API -> backend using cross_language_connections

**Should have (differentiators):**
- **D-01: Auto-correlation of test cases to codepoint flows** -- map test cases to flows automatically
- **D-02: Instrumentation-first test planning** -- plan probes during design, not after implementation
- **D-03: Progressive validation report across projects** -- compare coverage across Go+JS and Python+TS

**Defer (v2+):**
- **D-04: Test plan density analysis** -- needs corpus of test plans to calibrate
- **D-05: Regression test suite generation** -- needs verified test plans as input
- **D-06: Frontend-specific probe patterns library** -- emerges from Phase 1+2 experience

### Architecture Approach

The new features form a **parallel verification track** alongside the existing scan/plan/implement pipeline. The existing skills produce probe definitions and runtime data. The new test skill consumes that data. The contract is `.codepoints/index.json` (flow/point definitions) and `~/.codepoint/<project>/cp-{lang}-*.log` (runtime probe output). No changes to the probe runtime API (`point()`, `pointWithMeta()`, collectors) are required.

**Major components:**
1. **Test Plan Template** (`templates/test-plan.md`) -- structured format for frontend test plans with probe sequence assertions
2. **Plan Skill Extension** (`skills/plan/SKILL.md` Step 5b/5c) -- generates test plans and probe placement guides alongside existing plan output
3. **Implement Skill Extension** (`skills/implement/SKILL.md` validate mode) -- validates existing probes against plan, simplifies Verify per CP-03
4. **Test Skill** (`skills/test/SKILL.md`) -- new verification orchestrator that reads test plans, collects probe output, compares actual vs expected

**Key pattern:** Template-driven output. All new documents follow existing `templates/*.md` format with `{{PLACEHOLDER}}` variables. Test results go into `.codepoints/verification/` alongside existing verification reports.

### Critical Pitfalls

1. **Spec-to-execution gap (Pitfall 1)** -- Build the execution engine first, then design the specification format to match what the engine can verify. Every "verify" step must specify HOW (which probe, what output, what match condition).

2. **Instrumentation overhead in test mode (Pitfall 2)** -- Keep test logic OUT of codepoint.ts entirely. The probe library must not know about tests. Test orchestration happens at the skill level, reading probe output from log files.

3. **SPA route mismatch (Pitfall 3)** -- Already hit in v1.9.1 (SPA fallback caught `/__codepoint__` POSTs). Test skill must verify collector endpoint is reachable before running test cases. Route registration order is a mandatory check.

4. **Windows process lifecycle (Pitfall 4)** -- Coordinating backend + frontend dev server startup/shutdown on Windows is fragile. Prefer embedded frontend (Go `embed.FS`) to eliminate the second process. Always kill existing port holders before starting.

5. **UX complexity explosion (Pitfall 8)** -- Do NOT create a fourth independent command. Extend existing skills (add test verification to implement, add test planning to plan). Keep the user's mental model at three commands: scan/plan/implement.

## Implications for Roadmap

Based on combined research, suggested phase structure:

### Phase 1: Design Review Fixes (CP-01, CP-05)

**Rationale:** The design review identified CP-01 (scan is file-by-file instead of chain-oriented) and CP-05 (density validation not automated) as P0 priorities. Building frontend testing on top of uncorrected scan would propagate the file-by-file bias into test plans. Fixing these first ensures clean foundation data.

**Delivers:** Chain-oriented scan output and automated density validation in SKILL.md methodology

**Addresses:** CP-01 (scan rewrite), CP-05 (auto density), prerequisite for all subsequent phases

**Avoids:** Pitfall 6 (deviation carry-forward) -- addresses root cause before building on top

### Phase 2: Test Plan Templates + Plan Skill Extension

**Rationale:** Templates are the most straightforward new artifact. They extend the existing plan skill's output at a clear extension point (Step 5 generates plan document; Step 5b generates test plan). No runtime infrastructure needed yet.

**Delivers:** `templates/test-plan.md`, `templates/probe-guide.md`, plan skill Step 5b/5c

**Addresses:** TS-01 (template), TS-03 (test case format), TS-06 (probe templates), TS-02 (generation from spec)

**Avoids:** Pitfall 1 (spec-execution gap) -- design spec format around verifiable assertions from the start

**Uses:** Existing `.codepoints/index.json` data model, existing template patterns

### Phase 3: Implement Skill Extension + CP-03 Simplification

**Rationale:** Source-level instrumentation needs the implement skill to support "validate existing probes" mode. This is a Green phase extension, not a new phase. Also includes CP-03 simplification (replace over-engineered TDD loop with lightweight acceptance).

**Delivers:** Implement skill validate mode, simplified Verify phase per CP-03

**Addresses:** TS-05 (instrumentation guidance), TS-07 (verification guidance), CP-03 (implement simplification)

**Avoids:** Pitfall 2 (instrumentation overhead) -- validate mode reads probes, does not modify probe library

### Phase 4: Frontend Test Skill (Core New Component)

**Rationale:** The main new component. Reads test plans (Phase 2), validates probes are in place (Phase 3), then executes interactions, collects probe output, and compares actual vs expected sequences. This is the verification orchestrator.

**Delivers:** `skills/test/SKILL.md`, `templates/test-result.md`, registered in plugin.json

**Addresses:** TS-04 (Codepoint integration), TS-07 (verification execution), TS-08 (full-stack flow planning)

**Avoids:** Pitfall 3 (SPA route mismatch) -- health-check before tests; Pitfall 4 (Windows process) -- embedded mode preferred; Pitfall 5 (toggle state chaos) -- explicit enable/disable with error recovery; Pitfall 7 (output parsing) -- normalize to canonical format; Pitfall 8 (UX explosion) -- test as skill peer, not separate command

**Uses:** Playwright `page.route()` for intercepting probes, existing collector infrastructure, existing probe output format

### Phase 5: Progressive Verification (gojs-calculator pilot)

**Rationale:** Validate the entire pipeline end-to-end on the most documented E2E project (18 codepoints, 3 flows, Go+React, collector already set up). This is the "does it actually work?" phase.

**Delivers:** Test plan for gojs-calculator, probe validation report, test results for Calculator/BatchCalc/History components

**Addresses:** D-02 (instrumentation-first in practice), progressive validation strategy

**Avoids:** Pitfall 9 (frontend pattern mismatch) -- real project reveals template gaps; Pitfall 12 (React strict mode) -- verified probes in event handlers only; Pitfall 13 (data cleanup) -- test run isolation

### Phase 6: Generalize + CP-04 Density Tiers

**Rationale:** After validating on gojs-calculator, apply to pyts-calculator and add project-type-specific density targets per CP-04. This is the "promote to general solution" phase.

**Delivers:** Test plan for pyts-calculator, density tiers by project type in data-model.md, updated templates from pilot learnings

**Addresses:** D-03 (progressive validation report), CP-04 (density tiers)

### Phase Ordering Rationale

- **Dependency chains:** Phase 1 fixes the foundation (scan output quality); Phase 2 builds templates on clean foundation; Phase 3 extends implement to support validate mode; Phase 4 builds the test skill consuming Phase 2+3 outputs; Phase 5 validates on real project; Phase 6 generalizes
- **Grouping by architecture:** Phases 1-3 modify existing skills; Phase 4 adds the new component; Phases 5-6 validate progressively
- **Pitfall avoidance:** Phase 1 addresses the root cause (Pitfall 6); Phase 2 designs spec format to match execution capability (Pitfall 1); Phase 4 handles all runtime pitfalls (3, 4, 5, 7); Phase 5 catches pattern mismatches (Pitfall 9)

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4:** Test execution skill is the most complex new component. Needs research into probe output parsing across all modes (browser POST, Node.js file, collector-reformatted). The format inconsistencies between modes (field name differences like `name` vs `point_id`) require careful handling.
- **Phase 5:** Real-world validation may reveal gaps in the test plan template that were not apparent during design. The gojs-calculator project has specific patterns (batch operations, history panel) that stress the "click -> response -> verify" model.

Phases with standard patterns (skip research-phase):
- **Phase 1:** SKILL.md methodology changes; well-documented chain-oriented approach from design review
- **Phase 2:** Template creation follows existing patterns (collection.md, flow.md, point.md, verification.md)
- **Phase 3:** Skill extension follows clear extension point (Green phase add validate mode)
- **Phase 6:** Generalization is straightforward after Phase 5 validates the approach

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Playwright and Vitest verified via npm and official docs; network interception API verified via Context7; exclusions (Testing Library, Cypress) validated with concrete technical reasons |
| Features | HIGH | Table stakes derived from project codebase analysis, existing E2E data, and design review findings; MVP/defer prioritization aligned with feature dependency graph |
| Architecture | HIGH | Based on direct codebase analysis of all existing components (skills, probe libraries, collectors, E2E projects); integration points verified at source level; no external sources needed |
| Pitfalls | HIGH | 5 critical pitfalls derived from v1.9.1 bug history (SPA fallback, process lifecycle) and design review deviations (CP-01~05); prevention strategies reference specific code locations |

**Overall confidence:** HIGH

### Gaps to Address

- **Test specification format details:** The exact schema for "click -> response -> verify" test cases needs to be defined during Phase 2 implementation. Research identified the elements needed (trigger, expected probes, expected DOM state, pass criteria) but the concrete format must match what Phase 4's execution engine can verify. Design the format and engine together.

- **Probe output normalization:** Browser probes send `name` field; collector reformats to different field names; Node.js probes include `frames` array. The test verification skill needs a canonical format. Decide during Phase 4 whether to parse raw logs or use the collector's output as canonical.

- **Embedded vs dev-server test execution:** gojs-calculator uses Go `embed.FS` (single binary); pyts-calculator uses separate Vite dev server (two processes). The test skill must handle both. Phase 4 design should default to embedded mode and treat dev-server as a configuration variant.

- **Open user decisions:**
  - Is the test skill a separate `/codepoint-test` command or an extension of `/codepoint-implement`? Pitfall 8 recommends extension, but this is a UX preference.
  - Should test plans live in `.codepoints/verification/` or a new `.codepoints/test-plans/` directory? Research recommends `verification/` for consistency, but this affects discoverability.
  - Should the plan skill always generate test plans (Step 5b), or only when explicitly requested? Default-on may clutter output for backend-only projects.

## Sources

### Primary (HIGH confidence)
- Playwright 1.59.1 -- official docs (network interception, waitForRequest, mock API)
- Vitest 4.1.4 -- official docs and npm registry
- Codepoint V2 source code -- all skills, probe libraries, collectors, E2E projects read in full
- Design review (docs/research/codepoint/2026-04-19-design-review.md) -- 5 deviations with E2E evidence

### Secondary (MEDIUM confidence)
- Playwright best practices (playwright.dev/docs/best-practices) -- test user-visible behavior, web-first assertions
- QA Test Planner skill reference (mcpmarket.com) -- structured test plan patterns
- Codepoint methodology (docs/research/codepoint/2026-04-17-methodology.md) -- global thinking, density validation

### Tertiary (context only)
- @testing-library/react, @vitest/browser, Cypress, Selenium -- evaluated and excluded; versions verified on npm
- Existing E2E project configs -- verified from tests/e2e/codepoint-v2/ directory

---
*Research completed: 2026-04-20*
*Ready for roadmap: yes*

# Architecture Research: Frontend Automated Testing with Codepoint Integration

**Domain:** Frontend test planning and verification integrated with Codepoint V2
**Project:** work-skills (v2.0 milestone)
**Researched:** 2026-04-20
**Confidence:** HIGH (based on direct codebase analysis of all existing components)

## Executive Summary

This research analyzes how the v2.0 milestone's four target features (test planning templates, source-level instrumentation, frontend test skill, progressive verification) integrate with the existing Codepoint V2 architecture. The key finding is that the new features form a **parallel track** alongside the existing scan/plan/implement pipeline rather than a layer on top. The existing Codepoint skill produces runtime observability data (stack traces, execution sequences). The new frontend testing layer consumes that data to verify UI behavior against a test plan. The integration point is the `.codepoints/` directory structure and the `index.json` probe metadata -- these are the contract between the two systems.

The design review (docs/research/codepoint/2026-04-19-design-review.md) identified five deviations (CP-01 through CP-05) that should be addressed before or alongside the frontend testing build. CP-01 (scan chain-oriented instead of file-by-file) and CP-05 (automated density validation) are P0 and directly affect the quality of frontend test planning. Building frontend testing on top of uncorrected scan would propagate the "file-by-file" bias into test plans.

## Current Architecture (Codepoint V2)

### Component Inventory

The existing system has these components, all verified by reading source files:

```
Component                   | Location                                    | Role
----------------------------|---------------------------------------------|------
Main skill                  | plugins/codepoint/skills/codepoint/SKILL.md | Entry point, data model definition
Scan skill                  | plugins/codepoint/skills/scan/SKILL.md      | Two-phase codebase scanning
Plan skill                  | plugins/codepoint/skills/plan/SKILL.md      | New feature probe planning
Implement skill             | plugins/codepoint/skills/implement/SKILL.md | TDD-style probe insertion
Data model spec             | plugins/codepoint/references/data-model.md  | Three-layer model (Collection/Flow/Point)
Go probe library            | tests/e2e/codepoint-v2/*/codepoint/codepoint.go | Go runtime probes (Point, PointWithMeta, PointJSON)
Go frontend collector       | tests/e2e/codepoint-v2/gojs-calculator/codepoint/collector.go | HTTP handler receiving browser POSTs
Python frontend collector   | tests/e2e/codepoint-v2/pyts-calculator/codepoint/collector.py | Same for Python backends
TS/JS probe library         | tests/e2e/codepoint-v2/*/frontend/src/lib/codepoint.ts | Browser + Node.js dual-mode probes
Frontend reference          | plugins/codepoint/references/frontend.md    | React/Vue/Node patterns + V2 templates
Go reference                | plugins/codepoint/references/golang.md      | Go probe patterns
Python reference            | plugins/codepoint/references/python.md      | Python probe patterns
Templates                   | plugins/codepoint/templates/*.md, index.json | Document generation templates
5 E2E test projects         | tests/e2e/codepoint-v2/                     | go-calculator, python-calculator, gojs-calculator, pyts-calculator, template-test
```

### Data Flow: Current Codepoint V2 Pipeline

```
User triggers /codepoint-scan
        |
        v
  [Phase 1: Overview] --- Detect project type, directory structure, routes
        |                      Output: candidate Collections and Flows
        v
  [User confirms modules to deep-dive]
        |
        v
  [Phase 2: Deep Dive] --- Trace execution paths, place code points
        |                      Output: .codepoints/ directory (index.json + docs)
        v
  [Density Validation] --- Check overlap between adjacent points
        |                      (currently concept-only, not automated -- CP-05)
        v
  User triggers /codepoint-plan (for new features)
        |
        v
  [Analyze spec] --- Identify flows, determine code point locations
        |                     Output: code point plan document
        v
  User triggers /codepoint-implement
        |
        v
  [Red: Confirm plan] --- Show insertion plan, get user approval
        |
        v
  [Green: Insert probes] --- Generate probe code, insert into source files
        |                       Update index.json (enabled: true)
        v
  [Verify: Run tests] --- Generate test cases, run, analyze output
        |                       Output: verification report
        v
  [Runtime: Toggle ON] --- touch ~/.codepoint/.codepoint-{go,ts,python}
        |
        v
  [Capture] --- Probes fire during test/manual execution
        |           Output: ~/.codepoint/<project>/cp-{lang}-*.log
        v
  [Log Analysis] --- Sub-agent reads logs, diagnoses issues
                       (per codepoint-subagent-log-analysis-design.md)
```

### Probe Runtime Architecture (Frontend)

The frontend probe system has a specific dual-mode design that matters for test integration:

```
Browser (React/Vue app)
  |
  | pointWithMeta('cp-xxx', { point_id, flow_id, ... })
  |
  v
codepoint.ts checks: typeof window !== 'undefined'
  |
  +-- Browser mode --> fetch('/__codepoint__', POST, JSON payload)
  |                      |
  |                      v
  |                   Backend Collector (Go: collector.go / Python: collector.py)
  |                      |
  |                      v
  |                   Checks ~/.codepoint/.codepoint-ts toggle
  |                      |
  |                      +-- Toggle absent --> 404 --> browser stops trying (zero overhead)
  |                      |
  |                      +-- Toggle present --> Extract flow_id from meta
  |                                              |
  |                                              +-- Has flow_id --> Route to per-flow log file
  |                                              +-- No flow_id --> General log file
  |
  +-- Node.js mode --> Check toggle file directly
                        |
                        +-- Enabled --> Write JSON to ~/.codepoint/<project>/cp-ts-*.log
                        +-- Disabled --> No-op (one boolean check)
```

Key design constraint: Frontend probes in event handlers only (not useEffect) to avoid React strict mode double-invocation. This is verified in Calculator.tsx where probes are in `handleSubmit`, not in effects.

## Integration Analysis: New Features vs Existing Architecture

### Integration Point Map

Each v2.0 target feature integrates with existing components at specific points:

```
NEW FEATURE                     INTEGRATES WITH                          INTERFACE
-------------------------------|-----------------------------------------|---------------------------
1. Test Planning Templates     | /codepoint-plan SKILL.md                | Plan output format
                               | .codepoints/index.json                  | Flow/Point definitions
                               | Design review CP-02 (plan repositioned) | Plan is "collection build"
                               |                                         |
2. Source-Level Instrumentation | codepoint.ts (frontend probes)          | pointWithMeta() API
                               | collector.go / collector.py              | POST /__codepoint__
                               | /codepoint-implement SKILL.md            | Green phase insertion
                               | references/frontend.md                  | React/Vue patterns
                               |                                         |
3. Frontend Test Skill         | /codepoint SKILL.md (main entry)        | New skill registration
                               | .codepoints/verification/               | Verification reports
                               | Log analysis sub-agent design           | Phase 7 integration
                               |                                         |
4. Progressive Verification    | E2E test projects (5 projects)          | Existing test harness
                               | Collector flow_id routing               | Per-flow log files
                               | Toggle mechanism                        | Enable/disable probes
```

### Feature 1: Test Planning Templates

**How it relates to Codepoint's scan/plan/implement flow:**

Test planning templates are a **new output type** from the plan skill. Currently `/codepoint-plan` produces a "code point plan document" (probes to insert). The new template extends this to also produce a "test plan document" that defines:

- What user interactions to test (click, input, navigate)
- Expected probe firing sequences for each interaction
- Expected state changes and UI outcomes
- Verification criteria (probe output + visual state)

This is NOT a separate workflow. It is an enrichment of the existing plan skill's output.

**Integration design:**

```
/codepoint-plan (existing)
    |
    +-- Step 5: Generate Plan Document (EXISTING)
    |       Output: code point plan (probes, locations, flows)
    |
    +-- Step 5b: Generate Test Plan (NEW)
            Input: code point plan + frontend component tree
            Output: test-plan.md in .codepoints/verification/
            Format: interaction -> expected probes -> expected state -> pass criteria
```

**New files needed:**
- `plugins/codepoint/templates/test-plan.md` -- Test plan document template
- Modification to `plugins/codepoint/skills/plan/SKILL.md` -- Add Step 5b

**NOT needed:** Separate skill or command. Test plan generation is a natural extension of the plan skill's existing output.

### Feature 2: Source-Level Instrumentation

**How it extends existing codepoint probe insertion:**

The current probe insertion (`/codepoint-implement` Green phase) generates probe code from templates and inserts it into source files at specified locations. For frontend, it already generates `pointWithMeta()` calls.

Source-level instrumentation for testing means inserting probes **during feature development** rather than after. This is a workflow change, not a technical change:

- Current workflow: Write feature code -> Run `/codepoint-plan` -> Run `/codepoint-implement` -> Insert probes
- New workflow: Write feature code WITH probes from the start -> Probes are part of the feature deliverable

**Key insight from existing code:** The Calculator.tsx component already demonstrates this pattern. Probes are embedded in the `handleSubmit` event handler alongside the business logic. The codepoint.ts library already supports this via `pointWithMeta()`.

**What needs to change:**

1. The plan skill should generate a "probe placement guide" that developers can reference while coding, rather than waiting for `/codepoint-implement` to insert probes post-hoc.
2. The implement skill's Green phase should be able to work in "validate existing probes" mode (check that manually-placed probes match the plan) rather than only "insert new probes" mode.

**Integration design:**

```
/codepoint-plan (existing, extended)
    |
    +-- Step 5b (NEW): Generate Probe Placement Guide
            Output: For each flow, list expected probe locations with code snippets
            Format: "In Calculator.tsx handleSubmit, after setState, add: pointWithMeta(...)"

/codepoint-implement (existing, extended)
    |
    +-- Phase 2 Green: NEW MODE "Validate existing"
            Input: Source files with manually-placed probes
            Action: Compare actual probe locations against plan
            Output: Match report (which probes are correctly placed, which are missing/misplaced)
```

### Feature 3: Frontend Test Skill

**How it composes with existing codepoint skill:**

The frontend test skill is a **new skill** under the codepoint plugin, not a modification of existing skills. It consumes the output of scan/plan/implement and the runtime probe data to execute and verify frontend tests.

**Composition pattern:**

```
Existing skills (unchanged):     New skill:
  /codepoint-scan                  /codepoint-test (NEW)
  /codepoint-plan                      |
  /codepoint-implement                 | Reads from:
                                       | - .codepoints/index.json (probe definitions)
                                       | - .codepoints/verification/test-plan.md (test plan)
                                       | - ~/.codepoint/<project>/cp-ts-*.log (probe output)
                                       | - Source files (to verify probe placement)
                                       |
                                       | Outputs to:
                                       | - .codepoints/verification/test-result.md
                                       |
                                       | Depends on:
                                       | - scan/plan/implement must have been run first
                                       | - Probes must be inserted and toggle enabled
```

**New files needed:**
- `plugins/codepoint/skills/test/SKILL.md` -- Frontend test execution skill
- `plugins/codepoint/templates/test-result.md` -- Test result report template
- Update `plugins/codepoint/.claude-plugin/plugin.json` -- Register new skill

**Critical dependency:** This skill requires the codepoint probe infrastructure to be fully operational:
1. Probes must be inserted in frontend source files
2. Backend collector must be running (Go or Python)
3. Toggle must be enabled (`~/.codepoint/.codepoint-ts`)
4. Probe output must be flowing to `~/.codepoint/<project>/cp-ts-*.log`

### Feature 4: Progressive Verification

**How existing test projects support progressive rollout:**

The 5 existing E2E test projects provide a natural progression path:

```
Stage 1: Single-language backend (existing, already verified)
  tests/e2e/codepoint-v2/go-calculator/       -- Go only, 12 codepoints, 3 flows
  tests/e2e/codepoint-v2/python-calculator/    -- Python only

Stage 2: Full-stack cross-language (existing, already verified)
  tests/e2e/codepoint-v2/gojs-calculator/      -- Go + React/TS, 18 codepoints, collector
  tests/e2e/codepoint-v2/pyts-calculator/      -- Python + React/TS, collector

Stage 3: Frontend test planning (NEW, to be built)
  Use gojs-calculator as pilot project:
    1. Run /codepoint-plan to generate test plan for Calculator/BatchCalc/History components
    2. Verify probe placement is correct (Feature 2)
    3. Run /codepoint-test to execute frontend tests against probe output
    4. Validate test results match expected behavior

Stage 4: Generalize to other projects (after Stage 3 validates the approach)
  Apply same pattern to pyts-calculator
  Create template for new projects
```

## Recommended Architecture

### Component Boundaries

```
+------------------------------------------------------------------+
|                    Codepoint Plugin (V2.1)                         |
|                                                                    |
|  +------------------+    +------------------+    +---------------+ |
|  |    scan skill    |    |    plan skill    |    | implement     | |
|  |                  |    |                  |    | skill         | |
|  | Phase 1: Overview|    | Step 1-4: exists |    | Red: confirm  | |
|  | Phase 2: Deep    |    | Step 5: plan doc |    | Green: insert | |
|  |   Dive (MODIFIED |    | Step 5b: test    |    |   (EXTENDED:  | |
|  |   per CP-01)     |    |   plan (NEW)     |    |   validate    | |
|  | Step 6: density  |    | Step 5c: probe   |    |   mode)       | |
|  |   validation     |    |   placement guide|    | Verify: light | |
|  |   (NEW per CP-05)|    |   (NEW)          |    |   accept      | |
|  +------------------+    +------------------+    |   (SIMPLIFIED  | |
|           |                       |              |   per CP-03)   | |
|           v                       v              +--------+------+ |
|     .codepoints/           .codepoints/                   |        |
|       index.json             verification/                |        |
|       collections/           test-plan.md                 |        |
|       flows/                 probe-guide.md               |        |
|       points/                                              |        |
|                                                             |        |
|  +------------------+                                       |        |
|  |   test skill     | <------------------------------------+        |
|  |   (NEW)          |                                                |
|  |                  |                                                |
|  | Step 1: Read     |                                                |
|  |   test plan      |                                                |
|  | Step 2: Enable   |                                                |
|  |   probes         |                                                |
|  | Step 3: Execute  |                                                |
|  |   interactions   |                                                |
|  | Step 4: Collect  |                                                |
|  |   probe output   |                                                |
|  | Step 5: Compare  |                                                |
|  |   vs expected    |                                                |
|  | Step 6: Report   |                                                |
|  +------------------+                                                |
|           |                                                          |
|           v                                                          |
|     .codepoints/                                                     |
|       verification/                                                  |
|         test-result.md                                               |
+------------------------------------------------------------------+
         |
         | Runtime dependency
         v
+------------------------------------------------------------------+
|                    Probe Runtime Layer                              |
|                                                                    |
|  +------------------+    +------------------+                      |
|  | codepoint.ts     |    | codepoint.go     |                      |
|  | (frontend probes)|    | (backend probes) |                      |
|  | point()          |    | Point()          |                      |
|  | pointWithMeta()  |    | PointWithMeta()  |                      |
|  | pointAsync()     |    | PointJSON()      |                      |
|  | CodePointCollector|   | AnalyzeOverlap() |                      |
|  +--------+---------+    +--------+---------+                      |
|           |                       |                                 |
|           v                       v                                 |
|  +------------------+    +------------------+                      |
|  | collector.go     |    | collector.py     |                      |
|  | (Go backend      |    | (Python backend  |                      |
|  |  receives browser|    |  receives browser|                      |
|  |  POSTs)          |    |  POSTs)          |                      |
|  +------------------+    +------------------+                      |
|           |                       |                                 |
|           +-----------+-----------+                                 |
|                       v                                             |
|          ~/.codepoint/<project>/cp-{lang}-*.log                     |
+------------------------------------------------------------------+
```

### Data Flow: Complete Frontend Test Cycle

```
1. PLANNING PHASE
   /codepoint-plan
     |-- Reads spec/design document
     |-- Identifies frontend flows (user interactions)
     |-- Generates test-plan.md:
     |     For each interaction:
     |       - Trigger: "Click Calculate button"
     |       - Expected probes: [cp-fe-calc-submit, cp-api-call-entry, cp-calc-compute, cp-fe-calc-response]
     |       - Expected state: Result field shows "5"
     |       - Pass criteria: All probes fire in sequence, state matches
     |-- Generates probe-guide.md:
     |     For each component:
     |       - Where to place probes
     |       - What metadata to include
     |       - Code snippets for copy-paste

2. INSTRUMENTATION PHASE
   Developer writes feature code with probes
   OR /codepoint-implement inserts probes (existing Green phase)
   OR /codepoint-implement validates existing probes (new validate mode)
     |
     v
   Source files contain pointWithMeta() calls

3. EXECUTION PHASE
   /codepoint-test
     |-- Reads test-plan.md
     |-- Enables probes: touch ~/.codepoint/.codepoint-ts
     |-- Starts backend with collector endpoint
     |-- For each test case in test-plan.md:
     |     1. Navigate to component
     |     2. Perform interaction (trigger)
     |     3. Wait for probe output
     |     4. Read log file from ~/.codepoint/<project>/
     |     5. Parse log entries, match by point_id and flow_id
     |     6. Verify firing sequence matches expected
     |     7. Verify state change matches expected
     |
     |-- Generate test-result.md:
     |     PASS: All probes fired in sequence for "Click Calculate"
     |     FAIL: cp-fe-calc-response not triggered for "Click Calculate"
     |           Expected sequence: [submit, api-entry, compute, response]
     |           Actual sequence:   [submit, api-entry, compute]
     |           Missing: cp-fe-calc-response
     |           Likely cause: Network error or API timeout

4. DIAGNOSIS PHASE (if tests fail)
   Sub-agent log analysis (existing Phase 7 design)
     |-- Reads log files
     |-- Cross-references with source code
     |-- Produces diagnostic report with fix suggestions
```

## New vs Modified Components

### New Components

| Component | Location | Purpose | Dependencies |
|-----------|----------|---------|--------------|
| test skill | `plugins/codepoint/skills/test/SKILL.md` | Execute frontend test plan, collect probe output, compare vs expected | plan skill output, probe runtime, collector |
| test-plan template | `plugins/codepoint/templates/test-plan.md` | Template for frontend test plan documents | Existing template format |
| test-result template | `plugins/codepoint/templates/test-result.md` | Template for test result reports | Existing verification template format |
| probe-placement template | `plugins/codepoint/templates/probe-guide.md` | Template for probe placement guides (source-level instrumentation reference) | references/frontend.md patterns |

### Modified Components

| Component | Location | Change | Reason |
|-----------|----------|--------|--------|
| plan skill | `plugins/codepoint/skills/plan/SKILL.md` | Add Step 5b (test plan generation) and Step 5c (probe placement guide) | Test planning is a natural extension of probe planning |
| implement skill | `plugins/codepoint/skills/implement/SKILL.md` | Add "validate existing" mode to Green phase; simplify Verify per CP-03 | Support source-level instrumentation workflow |
| scan skill | `plugins/codepoint/skills/scan/SKILL.md` | Phase 2 chain-oriented per CP-01; auto density validation per CP-05 | Design review fixes that improve frontend test quality |
| main skill | `plugins/codepoint/skills/codepoint/SKILL.md` | Add `/codepoint-test` to commands table; update Quick Start | Register new skill |
| data model | `plugins/codepoint/references/data-model.md` | Density validation by project type per CP-04 | More accurate density targets for small frontend projects |
| plugin config | `plugins/codepoint/.claude-plugin/plugin.json` | Version bump to 2.1.0 | Reflect new skill |

### Unchanged Components (confirmed stable)

| Component | Location | Why unchanged |
|-----------|----------|---------------|
| codepoint.ts (frontend probe library) | `tests/e2e/*/frontend/src/lib/codepoint.ts` | API is stable: `point()`, `pointWithMeta()`, `pointAsync()` cover all needed patterns |
| collector.go | `tests/e2e/gojs-calculator/codepoint/collector.go` | HTTP handler, flow_id routing, JSON output -- all work as-is |
| collector.py | `tests/e2e/pyts-calculator/codepoint/collector.py` | Same as Go collector, works as-is |
| codepoint.go | `tests/e2e/*/codepoint/codepoint.go` | Backend probes, PointWithMeta with flow_id -- stable |
| E2E test projects | `tests/e2e/codepoint-v2/` | Used as validation targets, not modified |
| Toggle mechanism | `~/.codepoint/.codepoint-{go,ts,python}` | Simple and proven, no change needed |

## Suggested Build Order

The build order follows dependency chains. Each phase produces artifacts that the next phase consumes.

### Phase 1: Fix Design Review Deviations (CP-01, CP-05) -- P0 Prerequisites

These must come first because they directly affect the quality of everything built on top.

**Why first:** The design review (2026-04-19) identified CP-01 (scan file-by-file instead of chain-oriented) and CP-05 (density validation not automated) as P0. Frontend test planning depends on accurate scan output. If scan produces file-level noise instead of clean execution chains, test plans will be noisy too.

**Deliverables:**
- Modified `plugins/codepoint/skills/scan/SKILL.md` -- Phase 2 rewritten to chain-oriented approach
- Modified `plugins/codepoint/references/data-model.md` -- Auto density validation procedure added
- No new runtime code needed -- these are SKILL.md methodology changes that improve AI behavior when the skill is invoked

**Estimated effort:** M (scan rewrite) + L (density validation automation in SKILL.md)

### Phase 2: Test Plan Template + Plan Skill Extension

**Dependencies:** Phase 1 complete (scan produces clean chain data)

**Rationale:** Test plan templates are the most straightforward new artifact. They extend the existing plan skill's output without requiring new runtime infrastructure. The plan skill already has a clear extension point (Step 5 generates plan document; Step 5b generates test plan).

**Deliverables:**
- New `plugins/codepoint/templates/test-plan.md`
- New `plugins/codepoint/templates/probe-guide.md`
- Modified `plugins/codepoint/skills/plan/SKILL.md` -- Add Step 5b, 5c

**Estimated effort:** S (template creation) + S (plan SKILL.md modification)

### Phase 3: Implement Skill Extension (Validate Mode)

**Dependencies:** Phase 2 complete (probe placement guide exists to validate against)

**Rationale:** Source-level instrumentation needs the implement skill to support a "validate existing probes" mode. This is an extension of the existing Green phase, not a new phase. Also includes CP-03 simplification (remove over-engineered Verify, keep lightweight acceptance).

**Deliverables:**
- Modified `plugins/codepoint/skills/implement/SKILL.md` -- Add validate mode to Green phase; simplify Verify per CP-03

**Estimated effort:** S (implement SKILL.md modification)

### Phase 4: Frontend Test Skill (Core New Component)

**Dependencies:** Phase 2 (test plan template), Phase 3 (probes validated or inserted)

**Rationale:** This is the main new component. It reads test plans, executes interactions, collects probe output, and generates test results. It depends on:
1. Test plan template (Phase 2) to know what to test
2. Probes being in place (Phase 3 validates this)
3. Existing collector infrastructure (unchanged, already working)
4. Existing probe runtime (codepoint.ts, unchanged)

**Deliverables:**
- New `plugins/codepoint/skills/test/SKILL.md`
- New `plugins/codepoint/templates/test-result.md`
- Modified `plugins/codepoint/skills/codepoint/SKILL.md` -- Register new command
- Modified `plugins/codepoint/.claude-plugin/plugin.json` -- Version bump

**Estimated effort:** L (new skill design, test execution methodology, result comparison logic)

### Phase 5: Progressive Verification on gojs-calculator

**Dependencies:** Phase 4 complete (test skill functional)

**Rationale:** Use the existing gojs-calculator E2E project as the pilot. It has 18 codepoints across 3 flows with both Go backend and React/TS frontend. The collector is already set up. This validates the entire pipeline end-to-end.

**Deliverables:**
- Test plan for gojs-calculator: `.codepoints/verification/test-plan.md`
- Probe validation report for gojs-calculator
- Test results for Calculator, BatchCalc, History components
- Bug records if any issues found

**Estimated effort:** M (running the pipeline on a real project, iterating on issues)

### Phase 6: Generalize + CP-04 Density Tiers

**Dependencies:** Phase 5 validated successfully

**Rationale:** After validating on gojs-calculator, apply to pyts-calculator and add density tiers per CP-04. This is the "promote to general solution" phase.

**Deliverables:**
- Test plan for pyts-calculator
- Modified `plugins/codepoint/references/data-model.md` -- Project type density tiers
- Updated templates based on pilot learnings

**Estimated effort:** M

### Build Order Diagram

```
Phase 1: Design Review Fixes (CP-01, CP-05)
    |
    v
Phase 2: Test Plan Template + Plan Extension
    |
    v
Phase 3: Implement Skill Extension (validate mode, CP-03)
    |
    v
Phase 4: Frontend Test Skill (NEW core component)
    |
    v
Phase 5: Progressive Verification (gojs-calculator pilot)
    |
    v
Phase 6: Generalize + Density Tiers (CP-04)
```

## Patterns to Follow

### Pattern 1: Skill Extension, Not Forking

The test skill is a new skill under the same plugin, not a forked plugin. It shares the same `.codepoints/` directory, same `index.json`, same probe runtime. The pattern is:

```
Existing skill --> reads/writes .codepoints/
New skill      --> reads .codepoints/ (never writes independently)
```

The test skill is a **consumer** of the codepoint data, not a producer. It reads test plans (written by plan skill) and probe output (written by runtime probes). It writes only test results to `.codepoints/verification/`.

### Pattern 2: Template-Driven Output

All new output documents follow the existing template pattern:
- `templates/test-plan.md` with `{{PLACEHOLDER}}` variables
- `templates/test-result.md` with `{{PLACEHOLDER}}` variables
- `templates/probe-guide.md` with `{{PLACEHOLDER}}` variables

This matches the existing templates (collection.md, flow.md, point.md, verification.md).

### Pattern 3: Progressive Validation Pipeline

The test execution follows the same "enable -> execute -> collect -> analyze" pattern that the existing probe system uses:

```
Existing: touch toggle -> run tests -> read ~/.codepoint/ logs -> analyze
New:      same toggle  -> run interactions -> same logs -> compare vs test plan
```

No new runtime infrastructure needed. The toggle mechanism, collector, and log format are all reused.

### Pattern 4: Frontend Probes in Event Handlers Only

From the E2E project (Calculator.tsx line 10-43), probes go in event handlers (`handleSubmit`), not in `useEffect`. This is a verified pattern that avoids React strict mode double-invocation. The test skill must account for this -- test interactions trigger event handlers which trigger probes.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Building a Test Runner

The test skill is NOT a general-purpose test runner like Jest or Playwright. It is a **verification orchestrator** that:
1. Reads a test plan (what to verify)
2. Tells the developer what interactions to perform (or describes them for AI to execute)
3. Collects probe output from those interactions
4. Compares against expected sequences

It does NOT need a browser automation framework. It does NOT need DOM selectors. It does NOT need screenshot comparison.

**Why:** The probe infrastructure already captures the runtime behavior. The test skill just needs to match probe output against expected sequences. Adding a browser automation layer would be over-engineering for this use case.

### Anti-Pattern 2: Modifying the Probe Runtime API

The `pointWithMeta()` API is stable and proven across 5 E2E projects. Do NOT add test-specific fields to the probe output format. The existing `point_id`, `flow_id`, `timestamp`, `stack`, `metadata` fields are sufficient for test verification.

**Why:** Any change to the probe API would cascade to all language implementations (Go, Python, TypeScript) and all collectors. The test skill should work with the existing output format.

### Anti-Pattern 3: Separate Data Store for Test Results

Test results should go into `.codepoints/verification/` alongside existing verification reports, NOT into a separate test database or artifact store.

**Why:** The `.codepoints/` directory is the single source of truth for all codepoint-related data. Adding a separate location would violate the existing convention and make it harder to correlate test results with probe definitions.

### Anti-Pattern 4: Test Skill That Writes Probes

The test skill should NEVER write probes or modify source files. It is read-only. Probes are written by the implement skill or by the developer manually.

**Why:** Separation of concerns. The test skill verifies; the implement skill instruments. Mixing these responsibilities would make both harder to reason about.

## Scalability Considerations

| Concern | At 1 test project (current) | At 5 test projects | At 20+ projects |
|---------|----------------------------|-------------------|-----------------|
| Test plan generation | Manual trigger per project | Batch plan generation for similar components | Template library with common UI patterns (form submit, CRUD, navigation) |
| Probe output volume | ~20 probes * 3 interactions = ~60 log entries | ~100 probes * 10 interactions = ~1000 entries | Per-flow log routing (already implemented) keeps files manageable |
| Test result comparison | Manual reading of test-result.md | AI-summarized results across projects | Automated pass/fail tracking across CI runs (future) |
| Probe density validation | Per-project manual check | Auto-density per CP-05 | Density regression detection (flag when density drops below threshold) |

## Sources

All findings are based on direct codebase analysis. No external sources were needed.

- `plugins/codepoint/skills/*/SKILL.md` -- Existing skill definitions (read in full)
- `plugins/codepoint/references/frontend.md` -- Frontend probe patterns (read in full, 630 lines)
- `plugins/codepoint/references/data-model.md` -- Three-layer data model (referenced)
- `tests/e2e/codepoint-v2/gojs-calculator/frontend/src/lib/codepoint.ts` -- Frontend probe library (read in full, 195 lines)
- `tests/e2e/codepoint-v2/gojs-calculator/frontend/src/components/Calculator.tsx` -- Probe placement example (read in full, 61 lines)
- `tests/e2e/codepoint-v2/gojs-calculator/codepoint/collector.go` -- Go collector (read in full, 179 lines)
- `tests/e2e/codepoint-v2/gojs-calculator/codepoint/codepoint.go` -- Go probe library (read in full, 330 lines)
- `tests/e2e/codepoint-v2/pyts-calculator/codepoint/collector.py` -- Python collector (read in full, 73 lines)
- `docs/research/codepoint/2026-04-19-design-review.md` -- Design review with CP-01 through CP-05 (read in full, 555 lines)
- `docs/superpowers/specs/2026-04-18-codepoint-subagent-log-analysis-design.md` -- Phase 7 sub-agent design (read in full)
- `docs/superpowers/specs/2026-04-18-codepoint-v2-redesign.md` -- V2 redesign spec (read in full, 226 lines)
- `.planning/PROJECT.md` -- Project context (read in full)

# Technology Stack

**Project:** Work Skills v2.0 -- Frontend Automated Testing with Codepoint Integration
**Researched:** 2026-04-20
**Overall confidence:** HIGH

## Recommended Stack

### Primary Testing Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Playwright | 1.59.x | E2E browser testing | Best fit for Codepoint integration: native `page.route()` intercepts `/__codepoint__` POST requests, `waitForRequest`/`page.on('request')` captures probe data in real-time, `route.fulfill()` can mock backend responses for isolated frontend testing. Cross-browser support not needed (Chromium only), but Playwright's network interception API is unmatched. |

### Supporting Test Libraries

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `@playwright/test` | 1.59.x | Playwright test runner | Built-in fixtures, auto-wait, web-first assertions. Ships with Playwright, no separate install. |
| Vitest | 4.1.x | Unit/integration tests for codepoint.ts | Existing E2E projects use Vite 8 + React 19. Vitest reuses Vite config natively -- zero setup for transforming TS/JSX. Use for testing the codepoint base library itself (overlap analysis, collector, toggle detection). |

### NOT Adding (Deliberate Exclusions)

| Excluded Technology | Why NOT Adding |
|---------------------|---------------|
| `@testing-library/react` | The testing goal is **user-flow verification via Codepoint probes**, not component-level DOM assertions. Playwright operates at the browser level where codepoint.ts sends real POST requests to `/__codepoint__`. Testing Library renders in jsdom which cannot execute `fetch('/__codepoint__')` -- it would require mocking the entire Codepoint pipeline, defeating the purpose. |
| `vitest-browser-react` | While vitest-browser-react 2.1.x is stable (Vitest 4.0+), it adds a second browser testing paradigm alongside Playwright. The Codepoint integration requires `page.route()` network interception which is Playwright-specific. No need for two browser testing layers. |
| Cypress | Playwright's `page.route()` API is more direct for intercepting arbitrary POST endpoints. Cypress's proxy-based interception is less transparent. Also: Playwright test runner has better TypeScript support and built-in trace viewer for debugging. |
| Jest | Vitest already integrates with the Vite config in E2E projects. Adding Jest would mean duplicating transform configuration. Vitest provides Jest-compatible assertions (`expect`) anyway. |
| Selenium/WebDriver | Over-engineered for this use case. Requires browser driver management. Playwright bundles browser binaries and provides a single API. |

## Integration with Existing Codepoint V2 Architecture

### How Playwright Connects to Codepoint

The existing Codepoint V2 frontend probes work by POSTing JSON to `/__codepoint__`:

```typescript
// In codepoint.ts (browser mode)
fetch('/__codepoint__', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name, stack, timestamp, meta }),
});
```

Playwright can intercept, capture, and assert on these requests with three key APIs:

**1. Capture probe data during user interactions:**

```typescript
// Collect all codepoint POST requests during a test
const codepointRequests: any[] = [];
page.on('request', (req) => {
  if (req.url().includes('/__codepoint__') && req.method() === 'POST') {
    codepointRequests.push(JSON.parse(req.postData()!));
  }
});

// Perform user action
await page.getByRole('button', { name: 'Calculate' }).click();

// Assert probes fired
expect(codepointRequests).toHaveLength(3);
expect(codepointRequests.map(r => r.meta?.point_id))
  .toEqual(['cp-fe-calc-submit', 'cp-fe-calc-response', 'cp-fe-calc-error']);
```

**2. Mock backend API while testing frontend-only:**

```typescript
// Mock the calculate API, let codepoint probes pass through to collector
await page.route('*/api/calculate*', async (route) => {
  await route.fulfill({ json: { result: '5', error: '' } });
});
// /__codepoint__ requests are NOT intercepted -- they go to the real collector
```

**3. Wait for specific probes (time-ordered verification):**

```typescript
const requestPromise = page.waitForRequest(
  (req) => req.url().includes('/__codepoint__') && req.method() === 'POST'
);
await page.getByRole('button', { name: 'Calculate' }).click();
const probe = await requestPromise;
const payload = JSON.parse(probe.postData()!);
expect(payload.meta.point_id).toBe('cp-fe-calc-submit');
```

### What Does NOT Need to Change

| Component | Status | Why |
|-----------|--------|-----|
| `codepoint.ts` (dual-mode library) | Unchanged | Browser POST path works as-is. Playwright intercepts at network level, no code changes. |
| Go collector (`collector.go`) | Unchanged | Tests run against the real collector. It receives and logs probes normally. |
| Python collector (`collector.py`) | Unchanged | Same reason as Go collector. |
| Vite config | Unchanged | Playwright runs against the dev server or built assets. |
| React components | Unchanged | Probes in event handlers are exactly what Playwright exercises. |
| `.codepoints/` data model | Unchanged | Test specs reference the same `point_id` and `flow_id` from index.json. |

## Test Specification Format

Frontend test plans should follow this structure, which extends the existing Codepoint flow model:

```markdown
## Frontend Test Plan: [Flow Name]

### Flow Under Test
- Flow ID: flow-api-calculate
- Trigger: User clicks "Calculate" button

### Test Steps (click -> response -> verify)

| Step | Action | Expected Probe | Verify |
|------|--------|---------------|--------|
| 1 | Type "2+3" in input | - | Input value updated |
| 2 | Click "Calculate" button | cp-fe-calc-submit fires | POST to /__codepoint__ with point_id |
| 3 | Wait for response | cp-fe-calc-response fires | Result shows "5" |
| 4 | (error path) Click with empty input | cp-fe-calc-error fires | Error message displayed |

### Probe Sequence Assertion
Expected order: cp-fe-calc-submit -> cp-fe-calc-response
Error order: cp-fe-calc-submit -> cp-fe-calc-error
```

This format maps directly to Playwright test code and reuses the existing `.codepoints/` flow definitions.

## Claude Code Skill Integration

The new frontend testing skill should be added under `plugins/codepoint/` alongside existing skills:

```
plugins/codepoint/skills/
  codepoint/SKILL.md      # Main entry (existing)
  scan/SKILL.md            # Codebase scan (existing)
  plan/SKILL.md            # Plan probes (existing)
  implement/SKILL.md       # Insert probes (existing)
  frontend-test/SKILL.md   # NEW: Frontend test planning + execution
```

The `frontend-test` skill integrates with the existing Codepoint workflow:

```
1. /codepoint-plan       -- Plan code points for new feature (existing)
2. /codepoint-implement  -- Insert probes into source (existing)
3. /codepoint-frontend-test -- Generate and run Playwright tests against probes (NEW)
```

### Skill Responsibilities

The `frontend-test` skill should:
1. Read `.codepoints/index.json` to discover flows and their point sequences
2. Filter for frontend-type points (those using `pointWithMeta` in React components)
3. Generate Playwright test files following the "click -> response -> verify" template
4. Execute tests and verify probe firing order matches flow definitions
5. Output verification results to `.codepoints/verification/` (reusing existing template)

## Installation

```bash
# In the target frontend project (e.g., tests/e2e/codepoint-v2/gojs-calculator/frontend/)
npm install -D @playwright/test@^1.59.0

# Initialize Playwright (creates playwright.config.ts)
npx playwright install chromium

# For unit testing codepoint.ts itself
npm install -D vitest@^4.1.0
```

Note: Only Chromium is needed -- cross-browser testing is not a goal for Codepoint verification.

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| E2E Framework | Playwright | Cypress | Cypress proxy-based interception is less direct than `page.route()`. Playwright also has better TypeScript integration and trace viewer. |
| E2E Framework | Playwright | Puppeteer | No built-in test runner, no `page.route()` equivalent for request interception. Would need Jest/Mocha glue. |
| Component Testing | None (use Playwright E2E) | @testing-library/react | jsdom cannot execute `fetch('/__codepoint__')`. Would need to mock the entire Codepoint pipeline, defeating the integration testing purpose. |
| Component Testing | None | vitest-browser-react | Adds a second browser testing layer. The Codepoint integration specifically needs Playwright's network interception API. |
| Unit Testing | Vitest | Jest | E2E projects already use Vite 8. Vitest reuses the Vite config with zero setup. Jest would require separate transform config. |
| Test Assertion | Playwright built-in expect | Chai/Jest expect | Playwright's `expect()` has auto-retrying web-first assertions. No need for additional assertion libraries. |

## Version Compatibility Matrix

| Package A | Version | Compatible With | Notes |
|-----------|---------|-----------------|-------|
| Playwright | 1.59.x | Vite 8.x | No direct dependency; Playwright connects to dev server via HTTP |
| Playwright | 1.59.x | React 19.x | Tested and supported per Playwright release notes |
| Vitest | 4.1.x | Vite 8.x | Vitest is built on Vite; 4.1.x targets Vite 6.x+ |
| Vitest | 4.1.x | TypeScript 6.x | Full TS support out of box |
| @playwright/test | 1.59.x | TypeScript 6.x | Ships its own type definitions |
| codepoint.ts | (existing) | Playwright 1.59.x | No changes needed; Playwright intercepts at network level |

## Project-Level Configuration

### playwright.config.ts (to be created per E2E project)

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:8080',  // Go/Python backend serves frontend
    trace: 'on-first-retry',           // Trace only on failure
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  webServer: {
    command: 'cd .. && go run .',  // Start backend with embedded frontend
    port: 8080,
    reuseExistingServer: true,
  },
});
```

### Vitest config (for codepoint.ts unit tests)

The existing `vite.config.ts` can be extended:

```typescript
// Add to existing vite.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // ... existing config
  test: {
    include: ['src/lib/**/*.test.ts'],
  },
});
```

## Sources

- Playwright 1.59.1 -- verified via [npm](https://www.npmjs.com/package/playwright) and [official release notes](https://playwright.dev/docs/release-notes) (HIGH confidence)
- Vitest 4.1.4 -- verified via [npm](https://www.npmjs.com/package/vitest) and [official blog](https://vitest.dev/blog/vitest-4-1.html) (HIGH confidence)
- `@vitest/browser` 4.1.3 -- verified via [npm](https://www.npmjs.com/package/@vitest/browser) (HIGH confidence, decided NOT to use)
- `@testing-library/react` 16.3.2 -- verified via [npm](https://www.npmjs.com/package/@testing-library/react) (HIGH confidence, decided NOT to use)
- Playwright network interception -- [official docs](https://playwright.dev/docs/network) and [mock docs](https://playwright.dev/docs/mock) (HIGH confidence)
- Playwright `waitForRequest` API -- verified via Context7 `/microsoft/playwright.dev` docs (HIGH confidence)
- Vitest browser mode component testing -- verified via Context7 `/vitest-dev/vitest` docs (HIGH confidence)
- Codepoint V2 architecture -- verified from project source code `plugins/codepoint/` and E2E test projects (HIGH confidence)
- Existing E2E project configs -- verified from `tests/e2e/codepoint-v2/gojs-calculator/` and `pyts-calculator/` (HIGH confidence)

# Feature Landscape: Frontend Automated Testing with Codepoint Integration

**Domain:** Frontend test planning and verification system for Claude Code skills
**Researched:** 2026-04-20
**Confidence:** HIGH (based on thorough project codebase analysis, existing E2E test data, Codepoint V2 design review, Playwright best practices, and ecosystem survey)

---

## Context

This milestone adds a frontend automated testing layer on top of the existing Codepoint V2 instrumentation system. The project already has:

- **Codepoint V2 three-layer data model** (Collection/Flow/Point) with `.codepoints/` storage
- **Three core skills** (`/codepoint-scan`, `/codepoint-plan`, `/codepoint-implement`)
- **Frontend probe library** (`codepoint.ts`) supporting React, Vue, Node.js, browser+collector dual mode
- **E2E test projects** validating full-stack flows (Go+JS, Python+TS) with cross-language connections
- **Design review findings** (CP-01 to CP-05) identifying improvement priorities for V2.1

The four target features for this milestone are:
1. Standardized test planning templates for frontend (click -> response -> verify flows)
2. Codepoint source-level instrumentation practice for new feature development
3. A dedicated Claude Code skill that guides frontend test planning and verification
4. Progressive validation on existing full-stack projects (Go+JS, Python+TS)

---

## Table Stakes

Features users expect. Missing = the system feels incomplete or unusable.

| # | Feature | Why Expected | Complexity | Dependencies | Notes |
|---|---------|--------------|------------|--------------|-------|
| TS-01 | Structured test plan template | Without a template, every test plan is ad-hoc and inconsistent; developers need a repeatable format | LOW | None | Template must support click -> response -> verify flow pattern with preconditions, steps, expected results |
| TS-02 | Test plan generation from feature spec | The skill must accept a feature spec or design doc and produce a structured test plan | MEDIUM | TS-01 | Reads existing codepoints from `.codepoints/index.json` and correlates spec flows with instrumented flows |
| TS-03 | Click -> response -> verify test case format | This is the fundamental unit of frontend testing; Playwright best practices center on "test user-visible behavior" via act-assert patterns | LOW | TS-01 | Each test case: action (click/input/navigate), expected response (UI state change), verification (assertion on visible output) |
| TS-04 | Integration with existing Codepoint data model | The test plan skill must read `.codepoints/` structure (index.json, flow definitions, point definitions) | MEDIUM | Codepoint V2 | Correlate test cases with flows, reuse existing point definitions as verification checkpoints |
| TS-05 | Instrumentation guidance for new features | When planning a new feature, the skill should suggest where to place codepoints for testability | MEDIUM | Codepoint V2 plan skill | Extend `/codepoint-plan` with frontend-specific probe placement guidance (React event handlers, data fetch hooks, state transitions) |
| TS-06 | Probe code template for frontend | Pre-built probe code snippets for common frontend patterns (button click, form submit, API call, state change) | LOW | Codepoint V2 frontend.md | Already partially exists in `references/frontend.md`; needs test-planning-oriented templates |
| TS-07 | Verification execution guidance | After instrumentation, the skill should guide how to run and verify the probes fire correctly | MEDIUM | TS-04 | Leverage existing `/codepoint-implement` Verify phase but simplified per CP-03 finding (lightweight acceptance, not full TDD) |
| TS-08 | Full-stack flow test planning | Support test plans that span frontend -> API -> backend, not just frontend-only | MEDIUM | TS-04 | Use `cross_language_connections` from index.json to plan end-to-end test flows |

---

## Differentiators

Features that set the system apart. Not expected by default, but highly valuable.

| # | Feature | Value Proposition | Complexity | Dependencies | Notes |
|---|---------|-------------------|------------|--------------|-------|
| D-01 | Auto-correlation of test cases to codepoint flows | Given a test plan, automatically map each test case to the codepoint flow it exercises | HIGH | TS-02, TS-04 | Parses test plan, matches action/verify steps to codepoint sequence in flow definitions; enables "which test cases cover this codepoint?" queries |
| D-02 | Instrumentation-first test planning | Instead of "write code then test", guide developers to plan instrumentation at the same time as feature design | MEDIUM | TS-05 | Aligns with CP-02 improvement (plan as "collection building" not "feature planning"); instrument during design, not after implementation |
| D-03 | Progressive validation report across projects | Run the same test plan template against Go+JS and Python+TS projects, output a comparison report showing coverage gaps | HIGH | TS-08, E2E projects | Demonstrates the system works across different tech stacks; identifies stack-specific patterns |
| D-04 | Test plan density analysis | Analogous to codepoint density validation, analyze test plan coverage density -- are there flows with no test cases? Flows with too many redundant tests? | HIGH | TS-04, CP-05 auto density | Extends density validation concept to test planning; target: every flow has >= 1 normal + 1 boundary + 1 failure test case |
| D-05 | Regression test suite generation from verification results | After probes are verified, auto-generate a regression test suite that can be re-run on code changes | HIGH | TS-07, D-01 | Not full Playwright test generation, but structured test case documents that a developer can implement in their test framework |
| D-06 | Frontend-specific probe placement patterns library | Curated patterns for React hooks, form handling, async data loading, error boundaries, routing transitions | MEDIUM | TS-06 | Goes beyond the generic patterns in `references/frontend.md`; provides testability-specific guidance (which locations give the most verification value) |

---

## Anti-Features

Features to explicitly NOT build.

| # | Anti-Feature | Why Avoid | What to Do Instead |
|---|-------------|-----------|-------------------|
| AF-01 | Full Playwright test code generation | Generating actual Playwright test files is framework-specific, brittle, and outside the "planning and verification" scope; Playwright already has its own codegen tool (`npx playwright codegen`) | Generate structured test case documents (markdown) that a developer translates into Playwright tests; provide Playwright locator guidance but not executable test files |
| AF-02 | Browser automation within the skill | Running actual browsers, taking screenshots, or controlling a browser instance adds massive infrastructure complexity and is not what a Claude Code skill should do | Use codepoint probes as the verification mechanism; probes capture runtime state without needing browser control |
| AF-03 | CI/CD pipeline integration | Hooking into GitHub Actions, Jenkins, etc. is infrastructure-level work, not skill-level work | Keep the skill focused on planning and verification guidance; CI integration is a separate concern |
| AF-04 | Visual regression testing | Comparing screenshots or DOM snapshots requires specialized tools (Percy, Chromatic) and infrastructure | Focus on behavioral verification (did the codepoint fire? in correct order?) not visual comparison |
| AF-05 | Replacing the existing Codepoint V2 skill | The test planning skill should extend, not replace, the existing scan/plan/implement workflow | New skill as a peer to existing skills, reading from `.codepoints/` and adding test-planning-specific guidance |
| AF-06 | Test framework lock-in | Binding to Playwright, Cypress, or any specific test framework limits applicability | Keep test plan templates framework-agnostic; provide "suggested implementation" sections for common frameworks but mark them as optional |
| AF-07 | Complex TDD verification loops | The design review (CP-03) identified that the existing implement skill's TDD loop is over-engineered | Use lightweight acceptance (confirm probes fire, output format correct), not full test matrix generation |

---

## Feature Dependencies

```
TS-01 (template)
  |
  +--> TS-02 (generation from spec)
  |      |
  |      +--> D-01 (auto-correlation)
  |      +--> D-04 (test plan density)
  |
  +--> TS-03 (click/response/verify format)

TS-04 (Codepoint integration) -- depends on --> Codepoint V2 .codepoints/ structure
  |
  +--> TS-05 (instrumentation guidance)
  |      |
  |      +--> D-02 (instrumentation-first planning)
  |      +--> D-06 (frontend probe patterns)
  |
  +--> TS-07 (verification execution)
  |      |
  |      +--> D-05 (regression suite generation)
  |
  +--> TS-08 (full-stack flow planning)
         |
         +--> D-03 (progressive validation report)

TS-06 (probe code templates) -- depends on --> references/frontend.md

Existing system:
  Codepoint V2 skills (scan/plan/implement) -- provides --> .codepoints/ data
  Design review (CP-01 to CP-05) -- provides --> improvement directions
  E2E test projects -- provides --> validation targets
```

---

## Feature Categories

### Category 1: Test Specification (TS-01, TS-03, TS-06)

The foundation. Defines how test plans are structured and formatted. Without this, nothing else works.

**Core output:** A markdown template file (analogous to existing `templates/flow.md`, `templates/point.md`) for frontend test plans.

**Template structure:**
```
Test Plan Document:
  - Feature under test
  - Preconditions
  - Test cases (each: action -> expected response -> verification)
  - Codepoint flow mapping (which flow does each test case exercise)
  - Boundary cases
  - Failure scenarios
```

### Category 2: Instrumentation Guidance (TS-05, TS-06, D-02, D-06)

The "how to instrument for testability" layer. Helps developers place codepoints during feature development, not after.

**Core output:** Probe placement recommendations that consider testability. Goes beyond the existing plan skill's type-based placement (entry/boundary/state-change/concurrency/error) to include testability-specific locations.

**Testability-specific probe locations (not in current plan skill):**
- React event handlers (click, submit, change) -- user-visible actions that trigger flows
- API call boundaries (before fetch, after response) -- verify frontend-backend handoff
- State transitions visible to user (loading -> success, loading -> error) -- verify UI state machines
- Form validation points (before submit, after validation) -- verify error handling UX

### Category 3: Verification Automation (TS-07, D-01, D-04, D-05)

The "did it work" layer. After instrumentation, verify probes fire correctly and test cases pass.

**Core output:** Verification report comparing expected codepoint sequence vs actual runtime capture.

**Approach:** Leverage existing codepoint probe output (JSON with point_id, flow_id, timestamp, stack). Verification = "did the expected codepoints fire in the expected order for this test case?"

### Category 4: Skill UX (TS-02, TS-08, D-03)

The developer experience layer. How developers interact with the skill.

**Core output:** A Claude Code skill (`/test-plan` or similar) that orchestrates the above categories.

**Workflow:**
1. Developer provides feature spec or describes the feature
2. Skill reads existing `.codepoints/index.json` for context
3. Skill generates structured test plan with codepoint correlations
4. Skill suggests instrumentation points for untested paths
5. After implementation, skill guides verification (lightweight acceptance)

---

## MVP Recommendation

**Prioritize (Phase 1 -- Foundation):**
1. **TS-01**: Structured test plan template -- the document format everything else builds on
2. **TS-03**: Click -> response -> verify test case format -- the core testing primitive
3. **TS-04**: Integration with Codepoint data model -- read existing `.codepoints/` structure
4. **TS-06**: Probe code templates for frontend -- extend `references/frontend.md`

**Defer to Phase 2:**
- **D-01**: Auto-correlation (requires TS-04 working end-to-end first)
- **D-02**: Instrumentation-first planning (requires TS-05 which requires Phase 1)
- **D-03**: Progressive validation across projects (requires Phase 1 running on both projects)

**Defer to Phase 3:**
- **D-04**: Test plan density analysis (requires corpus of test plans to calibrate)
- **D-05**: Regression suite generation (requires verified test plans as input)
- **D-06**: Frontend-specific probe patterns library (emerges from Phase 1+2 experience)

---

## Interaction with Existing Codepoint V2 Improvements

The design review identified 5 deviations (CP-01 to CP-05) with improvement priorities. The frontend test planning milestone should account for these:

| Deviation | Impact on Frontend Testing | Recommendation |
|-----------|---------------------------|----------------|
| CP-01 (scan: file-by-file -> chain-oriented) | Scan should identify frontend -> backend chains for test planning | Test planning skill benefits from chain-oriented scan; build assuming CP-01 will be fixed |
| CP-02 (plan: feature-oriented -> collection building) | Test plan should map to collections, not individual features | Align test plan output with collection structure |
| CP-03 (implement: TDD loop -> lightweight acceptance) | Do NOT build heavy verification loops for test plans | Use lightweight acceptance per CP-03 finding |
| CP-04 (density: uniform -> per-project-type) | Test plan density targets should also vary by project type | Defer density analysis (D-04) until CP-04 is resolved |
| CP-05 (density: concept -> automated) | If density becomes automated, test plan density can follow | D-04 depends on CP-05's auto density implementation |

**Key insight:** The frontend test planning system should be built to align with the improved Codepoint V2.1 direction (chain-oriented scan, collection-based plan, lightweight implement), not the current V2 design. This avoids building on top of patterns that are already identified for change.

---

## Existing E2E Validation Targets

Two full-stack projects are available for progressive validation:

### Go+JS Calculator (gojs-calculator)
- 18 codepoints, 3 flows, cross-language (Go + TypeScript)
- `cross_language_connections`: 3 frontend -> API -> backend chains
- Frontend entry points: `cp-fe-calc-submit`, `cp-fe-history-click`, `cp-fe-batch-submit`
- Already has React components with probe-instrumented event handlers

### Python+TS Calculator (pyts-calculator)
- Full-stack FastAPI + React TypeScript
- Toggle four-combination independent verification
- Available for testing the same template on a different backend stack

**Validation strategy:** Build Phase 1 features, validate on gojs-calculator first (more documented), then extend to pyts-calculator to verify cross-stack applicability.

---

## Complexity Assessment

| Feature | Complexity | Why |
|---------|-----------|-----|
| TS-01 (template) | LOW | Markdown template with placeholders, analogous to existing `templates/flow.md` |
| TS-02 (spec -> test plan) | MEDIUM | Requires parsing feature spec, correlating with codepoints, generating structured output |
| TS-03 (test case format) | LOW | Standard act-assert pattern, well-documented in Playwright/Cypress best practices |
| TS-04 (Codepoint integration) | MEDIUM | Read index.json, parse flow/point structures, map to test cases; data format already well-defined |
| TS-05 (instrumentation guidance) | MEDIUM | Requires frontend-specific knowledge of where probes are most valuable for testing |
| TS-06 (probe templates) | LOW | Extension of existing `references/frontend.md` with testability-oriented patterns |
| TS-07 (verification guidance) | MEDIUM | Guide developer through probe activation, trigger flow, check output; simplified from current Verify phase |
| TS-08 (full-stack planning) | MEDIUM | Use `cross_language_connections` from index.json; data already exists |
| D-01 (auto-correlation) | HIGH | Requires matching test case descriptions to codepoint metadata; NLP-like matching |
| D-03 (progressive validation) | HIGH | Requires running on multiple projects, comparing results, generating reports |
| D-04 (test plan density) | HIGH | New concept, needs calibration data from existing test plans |
| D-05 (regression suite) | HIGH | Requires verified test plans as input, format translation |

---

## Sources

- **Project codebase analysis**: Codepoint V2 skills (`plugins/codepoint/skills/`), frontend reference (`references/frontend.md`), data model (`references/data-model.md`), E2E test projects (`tests/e2e/codepoint-v2/`)
- **Design review**: `docs/research/codepoint/2026-04-19-design-review.md` (CP-01 to CP-05, RD-01 to RD-03)
- **Playwright best practices**: [playwright.dev/docs/best-practices](https://playwright.dev/docs/best-practices) -- test user-visible behavior, avoid implementation details, use web-first assertions
- **QA Test Planner skill reference**: [mcpmarket.com/tools/skills/qa-test-planner-1](https://mcpmarket.com/tools/skills/qa-test-planner-1) -- structured test plans, manual test cases, Figma validation
- **Codepoint methodology**: `docs/research/codepoint/2026-04-17-methodology.md` -- global thinking, set theory, density validation
- **Global thinking supplement**: `docs/research/codepoint/2026-04-19-global-thinking.md` -- chain-oriented probe placement, not file-by-file
- **Codepoint V2 redesign spec**: `docs/superpowers/specs/2026-04-18-codepoint-v2-redesign.md`
- **Project context**: `.planning/PROJECT.md` -- v2.0 milestone target features

---

*Last updated: 2026-04-20*

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