---
name: codepoint-instrument
description: >
  Reads .codepoints/index.json, analyzes point coverage, prioritizes probes, defines per-type
  metadata contracts, and outputs a structured instrumentation plan for each flow. Use this after
  code points are defined (via /codepoint-scan or /codepoint-plan) and before probe implementation.
  Triggers on: "codepoint instrument", "instrument plan", "instrumentation first", "probe plan",
  "instrument codepoint".
---

# Code Point Instrument — Instrumentation-First Planning

## Overview

This skill generates a **structured instrumentation plan** from an existing `.codepoints/index.json`. It analyzes point coverage across flows, prioritizes probe placement, defines concrete per-type metadata contracts, and maps test scenarios to probes — all *before* any implementation code is written.

### When to Use

- After code points are defined via `/codepoint-scan` or `/codepoint-plan`
- Before running `/codepoint-implement` — this skill produces the plan that implementation follows
- When you need to understand *what* each probe should capture and *why*, independent of language
- When you want to prioritize which probes to implement first based on observability value

### When NOT to Use

- Greenfield features with no code points yet — use `/codepoint-plan` instead
- Direct probe insertion without upfront planning — use `/codepoint-implement` instead
- Codebase scanning to discover flows — use `/codepoint-scan` instead

## 6-Step Workflow

### Step 1: Load index.json

Read `.codepoints/index.json` from the project root. Parse and validate:

1. **Collections**: Verify each collection has `id`, `name`, `description`, `created`
2. **Flows**: Verify each flow has `id`, `name`, `collection_id`, `trigger`, `sequence`, `test_cases`, `status`
3. **Points**: Verify each point has `id`, `name`, `type`, `location`, `language`, `description`, `enabled`, `used_in_flows`
4. **Cross-reference integrity**:
   - Every `flow.collection_id` must exist in `collections[].id`
   - Every entry in `flow.sequence` must exist in `points[].id`
   - Every entry in `point.used_in_flows` must exist in `flows[].id`

If validation fails, report the specific integrity error and stop — the index must be consistent before instrumentation planning.

### Step 2: Analyze Coverage

Group points by flow and assess structural coverage:

1. **Per-flow grouping**: For each flow, collect the points listed in its `sequence` array
2. **Sequence gap detection**: Check whether the flow's sequence forms a coherent execution path — missing intermediate points (e.g., a `state-change` point between two `boundary` points that modify data) should be flagged
3. **Type distribution**: Calculate the count of each point type (`entry`, `boundary`, `state-change`, `concurrency`, `error`) per flow
4. **Missing type coverage**: Flag flows that lack certain point types — especially:
   - Flows with no `error` point (failure paths are invisible)
   - Flows with no `entry` point (no way to know when the flow starts)
   - Flows with no `boundary` point (cross-module handoffs are untracked)

Output a coverage summary table showing each flow's type distribution and any gaps.

### Step 3: Prioritize Probes

Apply prioritization rules to rank probes by observability value. Higher priority probes are implemented first during `/codepoint-implement`.

**Priority levels** (highest to lowest):

| Priority | Type | Rationale |
|----------|------|-----------|
| P1 — Critical | `entry` | Flow entry points are the first thing to instrument. Without them, you cannot determine whether a flow was triggered, when it started, or correlate downstream observations back to an invocation. Every flow must have at least one entry probe. |
| P2 — High | `boundary` | Cross-module boundaries are the most common source of integration bugs. Probes here reveal whether data was correctly passed between modules, measure call latency, and expose interface contract violations. |
| P3 — Medium | `state-change` | State mutations are where business logic takes effect. Probes here capture before/after snapshots, making it possible to reconstruct what changed and why during debugging. |
| P4 — Low | `concurrency` | Race conditions and lock contention are important but typically affect specific subsystems. Instrument these after the critical path is observable. |
| P5 — Diagnostic | `error` | Error paths are essential for production debugging but are secondary during initial instrumentation. Once the happy path is observable, error probes complete the picture. |

Within the same priority level, probes in flows with fewer existing probes take precedence — maximize the number of flows with at least partial coverage before adding density.

### Step 4: Define Metadata Contracts

For each point type, specify the exact metadata fields the probe must capture. These contracts ensure consistent, machine-parseable output across all implementations.

#### `entry` — Flow Entry Points

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `request_method` | string | Yes | HTTP method or operation verb (e.g., `POST`, `SUBSCRIBE`) |
| `request_path` | string | Yes | URL path or event topic (e.g., `/api/login`) |
| `request_headers` | object | No | Selected headers with sensitive values sanitized (strip `Authorization`, `Cookie`) |
| `user_id` | string | No | Authenticated user identifier, if the flow requires authentication |
| `request_id` | string | No | Correlation ID for distributed tracing |

#### `boundary` — Cross-Module Boundaries

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `upstream_module` | string | Yes | Name of the calling module (e.g., `auth-handler`) |
| `downstream_module` | string | Yes | Name of the called module (e.g., `user-store`) |
| `call_duration_ms` | number | Yes | Wall-clock duration of the cross-module call in milliseconds |
| `response_status` | string | Yes | Result status (e.g., `ok`, `not_found`, `timeout`) |
| `request_payload_size` | number | No | Size of the request payload in bytes (for throughput analysis) |

#### `state-change` — State Mutations

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `before_state` | string | Yes | Serialized state before mutation (JSON string or summary hash) |
| `after_state` | string | Yes | Serialized state after mutation (JSON string or summary hash) |
| `changed_fields` | array | Yes | List of field names that changed (e.g., `["status", "updated_at"]`) |
| `entity_id` | string | Yes | Identifier of the entity being mutated |

#### `concurrency` — Locks and Async Junctions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `lock_acquired` | boolean | Yes | Whether the lock/resource was successfully acquired |
| `wait_duration_ms` | number | Yes | Time spent waiting to acquire the lock in milliseconds |
| `concurrent_count` | number | No | Number of concurrent actors at this junction |
| `lock_type` | string | No | Type of synchronization primitive (e.g., `mutex`, `rwlock`, `channel`, `semaphore`) |

#### `error` — Failure Paths

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `error_type` | string | Yes | Error category (e.g., `validation`, `auth`, `timeout`, `internal`) |
| `error_message` | string | Yes | Original error message text |
| `error_code` | string | No | Machine-readable error code (e.g., `AUTH_INVALID_CREDENTIALS`) |
| `retry_count` | number | No | Number of retry attempts before this error was surfaced |
| `recovery_action` | string | No | What the system did in response (e.g., `fallback`, `circuit_open`, `escalate`) |

### Step 5: Generate Plan

Output a structured markdown document to `.codepoints/instrumentation/{flow-id}-instrumentation.md` for each flow.

**Output document format:**

```markdown
# Instrumentation Plan: {Flow Name}

> Flow ID: `{flow-id}`
> Collection: `{collection-name}` ({collection-id})
> Trigger: `{trigger}`
> Generated: {ISO timestamp}

## Probe Table

| Probe ID | Type | Priority | Location | Metadata Fields |
|----------|------|----------|----------|-----------------|
| cp-login-entry | entry | P1 — Critical | src/auth/handler.go:15 | request_method, request_path, user_id |
| cp-auth-check | boundary | P2 — High | src/auth/service.go:42 | upstream_module, downstream_module, call_duration_ms, response_status |
| cp-session-create | state-change | P3 — Medium | src/auth/session.go:88 | before_state, after_state, changed_fields, entity_id |
| cp-login-complete | entry | P1 — Critical | src/auth/handler.go:67 | request_method, request_path, request_id |

## Test Scenario Mapping

| Test Case | Category | Probes Exercised | Expected Observation |
|-----------|----------|------------------|----------------------|
| Valid email and password | normal | cp-login-entry → cp-auth-check → cp-session-create → cp-login-complete | All probes fire in sequence; session metadata shows user_id |
| Empty password field | boundary | cp-login-entry → cp-auth-check | Flow stops at auth-check; boundary probe reports validation failure |
| Wrong password | failure | cp-login-entry → cp-auth-check → cp-auth-error | Error probe fires with error_type=auth |
| Expired authentication token | failure | cp-login-entry → cp-auth-check → cp-auth-error | Error probe fires with error_type=auth, error_code=TOKEN_EXPIRED |

## Density Analysis

- Total probes: 4
- Sequence length: 4
- Type coverage: entry (2), boundary (1), state-change (1), concurrency (0), error (0 via shared cp-auth-error)
- Coverage gaps: No dedicated concurrency probe (acceptable if flow is synchronous)
- Recommended density: 4 probes across ~60 lines = appropriate density
```

**Document structure requirements:**
- Heading level 1: Flow name
- Probe Table with columns: Probe ID, Type, Priority, Location, Metadata Fields
- Test Scenario Mapping with columns: Test Case, Category, Probes Exercised, Expected Observation
- Density Analysis with gap assessment and recommendations
- Format must be machine-parseable by downstream skills (e.g., `/codepoint-implement`)

### Step 6: User Review

Present the instrumentation plan to the user for confirmation:

1. **Probe placement**: Are the proposed probe locations correct and accessible in the codebase?
2. **Priority alignment**: Should any probes be promoted or demoted based on current project concerns?
3. **Metadata completeness**: Are the metadata contracts sufficient, or do specific probes need additional context fields?
4. **Coverage gaps**: Is the user comfortable with the identified gaps, or should additional probes be planned?

Adjust the plan based on feedback, regenerate affected documents, and confirm readiness for `/codepoint-implement`.

## Output Template

After running all 6 steps, the following artifacts are produced:

```
.codepoints/
├── instrumentation/
│   ├── {flow-id}-instrumentation.md    # Per-flow instrumentation plan
│   ├── {flow-id}-instrumentation.md
│   └── ...
└── index.json                           # Unchanged — plan is read-only on the index
```

## References

- **Point types and data model**: `../codepoint/references/data-model.md` — defines the 5 point types, their semantics, and the three-layer structure (Collection → Flow → Point)
- **V2 probe pattern (pointWithMeta)**: `../codepoint/references/frontend.md` — shows how `pointWithMeta(name, meta)` is used to emit structured probe data with `point_id` and `flow_id` for per-flow file routing
