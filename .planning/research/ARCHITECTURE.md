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
