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
