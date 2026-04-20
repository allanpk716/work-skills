---
name: codepoint-plan
description: >
  Plan code points for a new feature being developed. Analyzes the feature's spec or design document
  to determine optimal probe locations, maps them to business flows, and generates a code point plan.
  Triggers on: "codepoint plan", "规划埋点", "新功能代码点", "plan codepoint", "代码点规划".
---

# Code Point Plan — New Feature Code Point Planning

## Overview

This skill is used during new feature development to plan code points before or alongside implementation.

### When to Use

- After a feature's spec/design is finalized (brainstorming, GSD spec phase, etc.)
- Before or during implementation — code points are part of the feature's deliverables
- When the feature involves complex logic: async, concurrent, multi-module, stateful

### When NOT to Use

- Simple CRUD endpoints with no business logic
- Pure UI changes with no backend interaction
- One-off scripts or utilities

## Planning Process

### Step 1: Analyze Feature Spec

Read the feature's design document, spec, or discuss with the user to understand:

1. **Business flows**: What are the main execution paths this feature introduces?
2. **Module interactions**: Which existing modules does this feature touch?
3. **Complexity areas**: Where are the concurrency, state, or error-prone zones?
4. **Integration points**: Where does this feature connect to external systems?

### Step 2: Identify Flows and Collections

For the new feature:

1. Define which Collection it belongs to (existing or new)
2. Break the feature into one or more Flows
3. For each Flow, define:
   - Entry point (how is this flow triggered?)
   - Key stages (what happens at each step?)
   - Exit point (what's the final state?)

### Step 3: Determine Code Points

For each Flow, place code points at:

| Location Type | Why | Example |
|---------------|-----|---------|
| `entry` | Know when the flow starts | Handler entry, event listener start |
| `boundary` | Track cross-module handoffs | Feature service → existing module |
| `state-change` | Catch state transitions | Before/after database write |
| `concurrency` | Detect race conditions | Before lock, after goroutine spawn |
| `error` | Capture failure paths | Error handler, validation failure |

### Step 4: Check Existing Points

Before creating new code points:

1. Read `.codepoints/index.json` (if exists)
2. Check if any existing code points are on paths this feature will use
3. Reuse existing points where the execution path overlaps
4. Only create new points for genuinely new code paths

### Step 5: Generate Plan Document

Output a plan containing:

```
## Code Point Plan: {{FEATURE_NAME}}

### Collection: {{COLLECTION_NAME}}
> {{EXISTING_OR_NEW}}

### Flow: {{FLOW_NAME}}
> Trigger: {{TRIGGER}}
> Sequence: {{CP_IDS}}

#### Code Points

| ID | Type | Location | Description |
|----|------|----------|-------------|
| cp-xxx | entry | src/xxx.go:42 | Entry point for ... |
| cp-xxx | boundary | src/xxx.go:58 | Handoff to ... |

#### Existing Points Reused
- cp-existing-xxx: Used in flow-xxx, also relevant here because ...

#### Test Case Outline
- Normal: {{description}}
- Boundary: {{description}}
- Failure: {{description}}
```

### Step 6: User Review

Present the plan to the user for confirmation:

1. Are the flow definitions correct?
2. Are the code point locations appropriate?
3. Are the test case outlines sufficient?

## Integration with Development Workflow

This skill is independent — it does not modify brainstorming, GSD, or other skills.

Typical usage:
1. User completes feature design (via brainstorming, GSD spec, etc.)
2. User calls `/codepoint-plan` with the feature spec
3. AI generates the code point plan
4. User implements the feature (with or without AI)
5. User calls `/codepoint-implement` to insert probes and verify

The code point plan can be stored alongside the feature's design documents for reference during implementation.