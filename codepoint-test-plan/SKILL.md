---
name: codepoint-test-plan
description: >
  Generate structured frontend test plans using the Action -> Expected Response -> Verify format.
  Guides developers through planning test flows with ready-to-use probe code snippets (D-01 through D-10).
  Works with the codepoint data model (flow_id, point_id) to produce test cases that validate
  runtime probe behavior, UI interactions, and API contracts.
  Triggers on: "test plan", "测试计划", "codepoint test plan", "test flow", "测试流程规划",
  "probe test", "probe verification plan".
---

# Test Plan — Structured Frontend Test Flow Planning

## Overview

This skill generates structured test plans for frontend features that use codepoint probes.
Each test case follows the **Action -> Expected Response -> Verify** format and references
probe snippets from `../codepoint/references/test-probes.md` (D-01 through D-10).

### When to Use

- After code points have been planned (`/codepoint-plan`) or scanned (`/codepoint-scan`)
- Before running `/codepoint-implement` — test plans define what verification should confirm
- When writing E2E or integration tests for flows with codepoint probes
- When onboarding new developers onto a flow's expected runtime behavior

### When NOT to Use

- Unit tests for isolated functions (no UI interaction or API call involved)
- Pure backend Go/Python probe testing (use the language-specific references instead)
- Ad-hoc debugging sessions (use `/codepoint-scan` instead)

## Planning Process

### Step 1: Identify Target Flow

1. Read `.codepoints/index.json` to discover available flows
2. Or ask the user which flow to plan tests for
3. Read the flow definition from `.codepoints/flows/{flow_id}.md`

For each flow, note:
- `flow_id` — used in all test case references
- Code point sequence — defines the expected execution order
- Trigger — defines how to initiate the flow
- Existing test cases outline — normal / boundary / failure

### Step 2: Map Flow to Test Scenarios

For the selected flow, generate test scenarios covering:

| Scenario Type | Purpose | Code Point Coverage |
|---------------|---------|-------------------|
| **Normal flow** | Happy path — all code points fire in order | All points in sequence |
| **Boundary** | Edge inputs — empty, max-length, concurrent | Points at validation boundaries |
| **Error** | Failure paths — network error, invalid data | Error-type code points |
| **State change** | State transitions — before/after mutations | `state-change` type points |
| **API contract** | Request/response shape validation | Points at `boundary` locations |

### Step 3: Write Test Cases

For each scenario, write test cases using this template:

```markdown
## Test Case: {{TEST_CASE_ID}}

> Flow: `{{FLOW_ID}}`
> Scenario: {{normal | boundary | error | state-change | api-contract}}
> Probe Snippet: {{D-XX}}

### Action
{{DESCRIPTION_OF_WHAT_THE_TESTER_OR_AUTOMATION_DOES}}

### Expected Response
{{DESCRIPTION_OF_WHAT_THE_SYSTEM_SHOULD_RETURN_OR_DISPLAY}}

### Verify
{{DESCRIPTION_OF_WHAT_TO_CHECK_IN_PROBE_OUTPUT_AND_UI}}

#### Probe Verification
| Code Point | Must Fire | Expected in Stack |
|-----------|-----------|-------------------|
| {{point_id}} | yes/no | {{expected_frame}} |

#### UI Verification
- [ ] {{visible_state_check}}
- [ ] {{element_state_check}}

#### API Verification
- [ ] Response status: {{expected_status}}
- [ ] Response body contains: {{expected_fields}}
```

### Step 4: Assign Probe Snippets

Map each test case to the appropriate probe snippet from `../codepoint/references/test-probes.md`:

| Scenario | Typical Snippet | Purpose |
|----------|----------------|---------|
| Button click | D-01 | Verify click handler fires and probe captures it |
| Form submit | D-02 | Verify form data flows through probes correctly |
| API call | D-03 / D-04 | Verify request/response probe sequence |
| Navigation | D-05 | Verify route change triggers entry probes |
| State change | D-06 | Verify before/after state captured by probes |
| Error handling | D-07 | Verify error path probes fire with error context |
| Async operation | D-08 | Verify probe sequence across async boundaries |
| WebSocket message | D-09 | Verify message flow through probe chain |
| Data loading | D-10 | Verify loading state probes fire in order |

### Step 5: Generate Test Plan Document

Output the complete test plan to `.codepoints/test-plans/{flow_id}-test-plan.md`:

```
.codepoints/
└── test-plans/
    └── {flow_id}-test-plan.md
```

### Step 6: User Review

Present the test plan to the user for confirmation:

1. Are all code points in the flow covered by at least one test case?
2. Are the probe snippet assignments appropriate?
3. Are boundary and error scenarios sufficient?
4. Does the verification checklist match the team's testing standards?

## Test Plan Output Template

```markdown
# Test Plan: {{FLOW_NAME}}

> Flow ID: `{{FLOW_ID}}`
> Collection: `{{COLLECTION_ID}}`
> Created: {{DATE}}
> Code Points: {{POINT_COUNT}}
> Test Cases: {{TEST_CASE_COUNT}}

## Overview

{{BRIEF_DESCRIPTION_OF_WHAT_THIS_TEST_PLAN_COVERS}}

## Test Environment Setup

```bash
# Enable frontend probes
mkdir -p ~/.codepoint && touch ~/.codepoint/.codepoint-ts

# Start dev server
npm run dev

# Verify toggle is active
ls ~/.codepoint/.codepoint-ts
```

## Test Cases

{{TEST_CASES_FROM_STEP_3}}

## Coverage Matrix

| Code Point | Normal | Boundary | Error | State | API |
|-----------|--------|----------|-------|-------|-----|
| {{point_id}} | TC-01 | TC-04 | TC-07 | — | TC-09 |
| {{point_id}} | TC-01 | TC-05 | TC-08 | TC-10 | — |

## Probe Snippet Reference

See `../codepoint/references/test-probes.md` for complete snippet code (D-01 through D-10).

## Verification Checklist

Before marking this test plan as complete:

- [ ] Every code point in the flow has at least one test case
- [ ] Normal flow test case covers the full sequence
- [ ] At least one boundary test case exists per validation boundary
- [ ] Error test cases cover each error-type code point
- [ ] All probe snippets are from the approved library (D-01 through D-10)
- [ ] UI verification steps reference observable elements
- [ ] API verification steps specify exact status codes and response fields
```

## Integration with Code Point Workflow

```
1. /codepoint-scan or /codepoint-plan → define code points and flows
2. /codepoint-test-plan → generate test plan for each flow  ← THIS SKILL
3. /codepoint-implement → insert probes and run TDD verification
4. Test plan becomes the verification spec for implement phase
```

The test plan is the bridge between planning and implementation:
- It translates abstract code point definitions into concrete test scenarios
- It assigns reusable probe snippets so developers don't write probe code from scratch
- It provides the verification checklist that `/codepoint-implement` uses in its Verify phase

## Important Notes

- Test plans use `flow_id` and `point_id` terminology from the codepoint data model
- All probe code snippets come from `../codepoint/references/test-probes.md` — do not invent new patterns
- Test plans are stored in `.codepoints/test-plans/` and should be committed to version control
- A test plan should cover **every** code point in the flow — no uncovered points
- Boundary and error scenarios are **required**, not optional — they catch the bugs that matter most
