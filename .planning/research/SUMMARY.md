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
