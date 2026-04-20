# Phase 41: Test Specification Foundation - Research

**Researched:** 2026-04-20
**Status:** Complete

## Research Question

What do I need to know to PLAN Phase 41 well?

---

## 1. Existing Sub-Skill Structure Pattern

All three existing sub-skills follow the same SKILL.md pattern:

```
plugins/codepoint/skills/{name}/SKILL.md
├── YAML frontmatter (name, description with trigger keywords)
├── Title heading (# Code Point {Name} — {Subtitle})
├── Overview section (when to use / when NOT to use)
├── Process/Workflow section (numbered steps)
├── Output Format section (template example)
└── Integration section (how it fits with other skills)
```

**Key structural observations:**
- `scan/SKILL.md` — 2-phase approach (overview → deep-dive), user selects scope
- `plan/SKILL.md` — 6-step planning process with user review gate
- `implement/SKILL.md` — TDD-style 3-phase loop (Red → Green → Verify)

The test-plan SKILL.md should follow this same pattern:
- YAML frontmatter with trigger keywords (e.g., "test plan", "测试计划", "test-plan")
- Overview section explaining when to use / when NOT to use
- Step-by-step workflow
- Output template showing the 6-segment structure
- Integration section showing where it fits (after plan, alongside implement)

## 2. Data Model Integration Points

### Terminology Alignment

The test plan template must use these established terms from `data-model.md`:

| Test Plan Term | Codepoint Equivalent | Source |
|----------------|---------------------|--------|
| Flow ID | `flow.id` (e.g., "flow-user-login") | data-model.md |
| Codepoint Sequence | `flow.sequence[]` (ordered point IDs) | data-model.md |
| Point ID | `cp.id` (e.g., "cp-auth-check") | data-model.md |
| Collection | `collection.id` (e.g., "col-user-management") | data-model.md |

### index.json Integration

When `.codepoints/index.json` exists, test plans should:
- Read flow definitions to get the ordered codepoint sequence
- Use point definitions to map test case assertions to specific probe outputs
- Reference collection structure for organization (not individual features)

When no index.json exists (greenfield projects):
- Test plans are standalone and define their own flow_id/codepoint sequence
- Later when scan/plan runs, the flow definitions should align with test plan IDs

### Storage Convention

New subdirectory `.codepoints/test-plans/` follows the existing pattern:
```
.codepoints/
├── index.json
├── collections/
├── flows/
├── points/
├── verification/
└── test-plans/          ← NEW
    ├── flow-user-login.md
    └── flow-order-create.md
```

One test plan file per Flow (matching D-03 decision from CONTEXT.md).

## 3. Six-Segment Test Plan Template Design

Based on D-05 decision and TSPEC-01 requirement:

```
Segment 1: Title & Metadata
  - Flow name, Flow ID, collection, author, date
  - Maps to flow.id in index.json

Segment 2: Preconditions
  - System state requirements before testing
  - Data setup, user state, feature flags
  - Maps to flow.trigger in data model

Segment 3: Test Case List
  - Each case uses 3-segment format (D-04)
  - Ordered by execution sequence
  - Covers normal, boundary, failure modes (from data-model.md test_cases)

Segment 4: Codepoint Mapping Table
  - Columns: Test Case ID | Codepoint Sequence | Expected Firing Order
  - Explicit mapping per D-10 decision
  - Uses point_id terminology from data model

Segment 5: Probe Snippet References
  - Links to test-probes.md sections
  - Format: `plugins/codepoint/references/test-probes.md#button-click`
  - Guides developer to copy relevant probe patterns

Segment 6: Notes & Deviations
  - Optional section for project-specific notes
  - Known gaps, deferred test cases
```

## 4. Three-Segment Test Case Format Design

Based on D-04 decision and TSPEC-02 requirement:

```
### TC-{N}: {Test Case Title}

**Action:** User clicks "Submit" button on login form
**Expected Response:** Form validates, loading spinner appears, API call initiated
**Verify:** Success message displayed OR error message shown with correct text
```

Key design decisions:
- **Action** = what the user does (not code-level, but behavioral)
- **Expected Response** = UI state change (visible to user/developer)
- **Verify** = assertion on visible output (per TSPEC-02: "assertion on visible output")
- NOT code-level assertions — this is a planning format, not executable test code

Test case categories (from data-model.md test_cases pattern):
- **Normal**: Valid inputs, happy path
- **Boundary**: Empty inputs, max-length, edge values
- **Failure**: Invalid inputs, error states, timeout

## 5. Probe Code Snippet Categories (TSPEC-03)

Four categories per D-07 decision, framework-agnostic per D-08:

### Category 1: Button Click
```javascript
// Probe: button click handler
pointWithMeta('cp-{flow}-button-click', {
  point_id: 'cp-{flow}-button-click',
  flow_id: 'flow-{name}',
  button_id: buttonElement.id,
  timestamp: Date.now()
});
```

### Category 2: Form Submit
```javascript
// Probe: form submission
pointWithMeta('cp-{flow}-form-submit', {
  point_id: 'cp-{flow}-form-submit',
  flow_id: 'flow-{name}',
  form_data_keys: Object.keys(formData),
  validation_result: isValid
});
```

### Category 3: API Call
```javascript
// Probe: API call start/end
pointWithMeta('cp-{flow}-api-call', {
  point_id: 'cp-{flow}-api-call',
  flow_id: 'flow-{name}',
  endpoint: '/api/endpoint',
  method: 'POST',
  status: response.status
});
```

### Category 4: State Change
```javascript
// Probe: state transition
pointWithMeta('cp-{flow}-state-change', {
  point_id: 'cp-{flow}-state-change',
  flow_id: 'flow-{name}',
  from_state: previousState,
  to_state: newState
});
```

Each category needs 1-2 variants (basic + with error handling), all using pure JS/TS with `pointWithMeta` from `frontend.md`.

## 6. Skill Workflow Design

Based on D-02 (interactive generation workflow):

```
Step 1: Read Context
  - If .codepoints/index.json exists → read flows, points, collections
  - If not → ask developer to describe the flow

Step 2: Define Test Scope
  - Developer specifies which Flow to test (or describes a new one)
  - Skill extracts preconditions from flow definition

Step 3: Generate Test Cases
  - For each stage in the flow's codepoint sequence:
    - Generate Action → Expected Response → Verify triplet
  - Cover normal, boundary, failure modes

Step 4: Build Mapping Table
  - Auto-generate the codepoint mapping table from flow.sequence
  - Map each test case to the codepoints it exercises

Step 5: Attach Probe References
  - For each test case category, link the relevant probe snippet
  - Developer can copy directly into their codebase

Step 6: Output Test Plan
  - Write the 6-segment markdown file to .codepoints/test-plans/
  - Present to developer for review
```

## 7. File Inventory

Files to create:
1. `plugins/codepoint/skills/test-plan/SKILL.md` — Skill definition (D-01)
2. `plugins/codepoint/references/test-probes.md` — Probe snippet library (D-06)

Files to reference (read-only, no modification):
- `plugins/codepoint/skills/codepoint/SKILL.md` — Main skill for command table update
- `plugins/codepoint/references/data-model.md` — Terminology and structure
- `plugins/codepoint/references/frontend.md` — Existing probe patterns to build on
- `plugins/codepoint/skills/scan/SKILL.md` — Structure reference
- `plugins/codepoint/skills/plan/SKILL.md` — Structure reference
- `plugins/codepoint/skills/implement/SKILL.md` — Structure reference

## 8. Dependencies & Risks

### Dependencies
- None external — this is the first v2.0 phase
- Relies on existing codepoint infrastructure (scan/plan/implement skills)
- Relies on existing data model conventions (flow_id, point_id terminology)

### Risks
- **Template over-engineering**: Keep the 6-segment format lean — developers should want to use it, not feel burdened. The design review (CP-01 deviation) warns about over-structured templates losing practitioner buy-in.
- **Framework lock-in**: D-08 explicitly requires framework-agnostic snippets. Resist adding React/Vue-specific patterns in test-probes.md — those belong in frontend.md.
- **Spec-to-execution gap**: Design review warns about generating specs that never get executed. The test plan template should include a "verify this plan was exercised" step, laying groundwork for Phase 44's verification automation.

## 9. Design Review Alignment

From `2026-04-19-design-review.md`, key principles affecting this phase:

| Principle | Impact on Test Plan Design |
|-----------|---------------------------|
| CP-01: Global thinking first | Test plans should be Flow-level (global view), not per-component |
| CP-02: Density matters | Codepoint mapping table helps assess if test cases have good flow coverage |
| CP-03: Human judgment required | SKILL.md must include explicit user review gates (don't auto-accept all test cases) |
| Collection-first organization | Test plans organized by Flow (within Collection), not by UI component |

---

## RESEARCH COMPLETE

Research covers: sub-skill structure pattern, data model integration, template design, probe snippet scope, skill workflow, file inventory, dependencies, and design review alignment. All 10 CONTEXT.md decisions (D-01 to D-10) validated against codebase patterns.