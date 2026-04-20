---
name: codepoint-validate
description: >
  Static progressive artifact consistency validation across all pipeline stages.
  Validates index.json schema, cross-reference integrity, instrumentation plans, test plans,
  implementation completeness, and verification status — without requiring runtime probe logs.
  This is the static counterpart to /codepoint-verify (which validates dynamic runtime output).
  Triggers on: "codepoint validate", "validate codepoint", "artifact validation", "code consistency",
  "验证一致性", "代码点校验".
---

# Code Point Validate — Progressive Static Artifact Consistency Validation

## Overview

This skill performs **static artifact consistency validation** across all pipeline stages. It reads only the artifact files (index.json, instrumentation plans, test plans, verification reports) and validates their internal consistency — **no runtime probe logs are needed**.

### Scope Distinction from /codepoint-verify

| Aspect | `/codepoint-validate` (this skill) | `/codepoint-verify` |
|--------|-------------------------------------|---------------------|
| Input | Static artifacts only (index.json, plans, reports) | Runtime probe log files |
| Runtime needed | **No** — pure static analysis | **Yes** — requires probe output |
| Purpose | Catch structural gaps *before* implementation | Confirm probes fire correctly *after* implementation |
| When to run | After any pipeline stage change | After probes are implemented and tests are run |

### When to Use

- After running `/codepoint-scan` or `/codepoint-plan` — validate the generated index.json
- After running `/codepoint-instrument` — verify instrumentation plans reference valid point IDs
- After running `/codepoint-test-plan` — verify test plan coverage against index.json
- After `/codepoint-implement` — check implementation completeness without running probes
- Before `/codepoint-verify` — catch structural issues early, before spending time on runtime testing
- As a CI/quality gate — validate artifact consistency on every change

### When NOT to Use

- When you need to verify actual probe firing order and metadata — use `/codepoint-verify`
- When probes have not been defined yet — use `/codepoint-scan` or `/codepoint-plan`
- When you need to generate new artifacts — use the appropriate creation skill

## 5-Step Validation Workflow

The validation proceeds through 5 progressively deeper passes. Each pass builds on the previous one — a failure in an earlier pass may indicate issues that make later passes unreliable.

```
Pass 1: Index Integrity           ← foundation: is index.json structurally valid?
Pass 2: Instrumentation Consistency ← do instrumentation plans match index.json?
Pass 3: Test Plan Consistency      ← do test plans match index.json + instrumentation?
Pass 4: Implementation Completeness ← do implemented points have required artifacts?
Pass 5: Verification Status        ← are verification reports consistent with status?
```

### Pass 1: Index Integrity

Validate `index.json` schema compliance, cross-reference integrity, sequence coherence, and type distribution.

**Procedure:**

1. Read `.codepoints/index.json` from the project root. If the file does not exist, report FAIL and stop — all subsequent passes require a valid index.
2. **Schema compliance**: Verify all required top-level fields exist: `version`, `project`, `language`, `created`, `updated`, `collections`, `flows`, `points`.
3. **Cross-reference integrity** (three-way check):
   - Every `flow.collection_id` must exist in `collections[].id`
   - Every entry in `flow.sequence` must exist in `points[].id`
   - Every entry in `point.used_in_flows` must exist in `flows[].id`
4. **Sequence coherence**: Each flow's `sequence` must contain at least one `entry`-type point. The sequence order must be non-empty.
5. **Type distribution**: Report the count of each point type (`entry`, `boundary`, `state-change`, `concurrency`, `error`). Warn if any flow has no `entry` or no `error` type point.
6. **Inverse cross-references**: For each point's `used_in_flows`, verify that the corresponding flow's `sequence` actually contains that point ID.

**Findings to Report:**

- Missing top-level fields: "index.json missing required field `{field}`"
- Broken cross-references: "Flow `{flow_id}` references collection `{collection_id}` which does not exist"
- Sequence issues: "Flow `{flow_id}` has empty sequence"
- Type gaps: "Flow `{flow_id}` has no `entry`-type point in sequence"
- Inverse mismatches: "Point `{point_id}` claims to be in flow `{flow_id}`, but flow sequence does not contain it"

**Pass/Fail Criteria:**

- **FAIL** if: any required top-level field is missing, any cross-reference is broken, any flow has an empty sequence
- **PASS** if: all schema, cross-reference, and sequence checks succeed (warnings about type distribution are informational)

### Pass 2: Instrumentation Consistency

Validate that instrumentation plans are internally consistent and align with index.json point definitions.

**Procedure:**

1. For each flow in `index.json`, check if `.codepoints/instrumentation/{flow-id}-instrumentation.md` exists.
2. If an instrumentation plan exists, parse the **Probe Table** and extract:
   - Probe IDs — verify each references a valid `point.id` from `index.json`
   - Metadata fields — verify they match the point type's contract (see table below)
   - Priority values — verify they are one of: `P0`, `P1`, `P2`
3. Parse the **Test Scenario Mapping** and extract:
   - Probes exercised — verify each references a valid probe ID from the Probe Table
   - Category values — verify they are one of: `normal`, `boundary`, `failure`
4. For each flow **without** an instrumentation plan, report an informational gap (not a failure).

**Metadata contracts by point type:**

| Type | Required Fields |
|------|----------------|
| `entry` | `request_method`, `request_path` |
| `boundary` | `upstream_module`, `downstream_module`, `call_duration_ms`, `response_status` |
| `state-change` | `before_state`, `after_state`, `changed_fields`, `entity_id` |
| `concurrency` | `lock_acquired`, `wait_duration_ms` |
| `error` | `error_type`, `error_message` |

**Findings to Report:**

- Missing instrumentation plans: "Flow `{flow_id}` has no instrumentation plan (informational gap)"
- Invalid probe references: "Instrumentation plan for `{flow_id}` references probe `{probe_id}` not found in index.json"
- Metadata contract mismatch: "Probe `{probe_id}` (type={type}) metadata fields `{fields}` do not match type contract"
- Invalid priority: "Probe `{probe_id}` has invalid priority `{value}` (expected P0/P1/P2)"
- Invalid scenario probe: "Test Scenario `{scenario}` references probe `{probe_id}` not found in Probe Table"
- Invalid category: "Test Scenario `{scenario}` has invalid category `{value}`"

**Pass/Fail Criteria:**

- **FAIL** if: any probe in an instrumentation plan references a non-existent point, any metadata field is inconsistent with the point type contract
- **PASS** if: all existing instrumentation plans are internally consistent (missing plans are informational only)

### Pass 3: Test Plan Consistency

Validate that test plans reference valid point IDs and probe snippets, and provide adequate scenario coverage.

**Procedure:**

1. For each flow in `index.json`, check if `.codepoints/test-plans/{flow-id}-test-plan.md` exists.
2. If a test plan exists, parse the **Coverage Matrix** and extract:
   - Code point IDs — verify each references a valid `point.id` from `index.json`
   - Test case IDs — verify format consistency (e.g., `TC-01` through `TC-NN`)
   - Verify each point in the flow's `sequence` appears in the Coverage Matrix
3. Parse **test case definitions** (sections with `## Test Case: {ID}`):
   - Verify each test case references valid point IDs
   - Verify probe snippet references use valid D-XX format (D-01 through D-10)
4. **Coverage check**: For each flow with a test plan, verify:
   - At least one `normal` test case exists
   - At least one `boundary` or `failure` test case exists (or explicit documentation why not)
5. For each flow **without** a test plan, report an informational gap.

**Findings to Report:**

- Missing test plans: "Flow `{flow_id}` has no test plan (informational gap)"
- Invalid point references: "Coverage Matrix for `{flow_id}` references point `{point_id}` not in index.json"
- Missing sequence points: "Point `{point_id}` from flow `{flow_id}` sequence is not in the Coverage Matrix"
- Invalid snippet format: "Test Case `{tc_id}` references invalid probe snippet `{ref}` (expected D-01 through D-10)"
- Coverage gaps: "Flow `{flow_id}` has no boundary test cases"
- Coverage gaps: "Flow `{flow_id}` has no failure test cases"

**Pass/Fail Criteria:**

- **FAIL** if: any test plan references non-existent point IDs, Coverage Matrix omits points from the flow's sequence
- **PASS** if: all existing test plans are internally consistent and cover all sequence points (missing plans are informational only)

### Pass 4: Implementation Completeness

Validate that enabled points have the required implementation artifacts and traceability.

**Procedure:**

1. From `index.json`, identify all points where `enabled = true`.
2. For each enabled point:
   - Verify `location` is non-empty and follows the expected format (`file:line` or descriptive path)
   - If `location` references a specific file path, check whether the file exists in the project
   - Verify `description` is non-empty
3. For each flow with `status = "implemented"` or `status = "verified"`:
   - Verify every point in `flow.sequence` has `enabled = true`
   - Verify the instrumentation plan exists for this flow
   - Verify the test plan exists for this flow
4. **Traceability check**: For each enabled point, verify it appears in at least one flow's `sequence` (orphan points).

**Findings to Report:**

- Missing location: "Enabled point `{point_id}` has no location specified"
- Missing file: "Point `{point_id}` references file `{path}` which does not exist"
- Missing description: "Enabled point `{point_id}` has no description"
- Disabled in implemented flow: "Flow `{flow_id}` (status={status}) includes disabled point `{point_id}` in sequence"
- Missing artifacts: "Flow `{flow_id}` (status=implemented) is missing instrumentation plan"
- Missing artifacts: "Flow `{flow_id}` (status=implemented) is missing test plan"
- Orphan points: "Point `{point_id}` is enabled but not included in any flow sequence"

**Pass/Fail Criteria:**

- **FAIL** if: any enabled point in an implemented/verified flow's sequence lacks location, any implemented flow is missing instrumentation or test plan artifacts
- **PASS** if: all enabled points have locations, all implemented flows have complete artifacts

### Pass 5: Verification Status

Validate that flow status transitions are correct and verification reports reference the right flows.

**Procedure:**

1. From `index.json`, identify all flows with `status = "verified"`.
2. For each verified flow:
   - Check if `.codepoints/verification/{flow-id}-verify.md` exists
   - If the verification report exists, verify it references the correct `flow-id`
3. **Status transition validation**: Verify that status values follow the correct progression:
   - `active` → `implemented` → `verified`
   - A flow cannot have status `verified` without having been `implemented` first (check for existence of instrumentation plan and test plan as proxies for having gone through implementation)
4. **Stale status check**: If a flow is `implemented` but its instrumentation plan or test plan has been modified more recently than the flow's `updated` timestamp, report a potential staleness warning.

**Findings to Report:**

- Missing verification report: "Flow `{flow_id}` (status=verified) has no verification report"
- Wrong flow reference: "Verification report for `{flow_id}` references incorrect flow ID `{actual_id}`"
- Invalid transition: "Flow `{flow_id}` has status=verified but no instrumentation plan found (skipped implementation?)"
- Stale status: "Flow `{flow_id}` (status={status}) may be stale — artifact `{file}` was modified after the flow was last updated"

**Pass/Fail Criteria:**

- **FAIL** if: any verified flow lacks a verification report, any verified flow has no instrumentation or test plan (suggesting invalid status transition)
- **PASS** if: all verified flows have matching verification reports and valid status progression

## Summary Report

After all 5 passes complete, produce a summary report:

```
=== Code Point Validation Summary ===

Pass 1 — Index Integrity:           PASS / FAIL [N findings]
Pass 2 — Instrumentation Consistency: PASS / FAIL [N findings]
Pass 3 — Test Plan Consistency:      PASS / FAIL [N findings]
Pass 4 — Implementation Completeness: PASS / FAIL [N findings]
Pass 5 — Verification Status:        PASS / FAIL [N findings]

Overall: PASS (all 5 passes passed) / FAIL (one or more passes failed)

Total findings: N
  - Critical (FAIL-causing): N
  - Informational: N
```

**Overall result determination:**
- **PASS**: All 5 validation passes returned PASS
- **FAIL**: Any validation pass returned FAIL
- Informational findings do not affect the overall result

## Windows Compatibility

- File paths in `index.json` use forward slashes — on Windows, normalize both `\` and `/` when checking file existence
- The `.codepoints/` directory is at the project root regardless of platform
- All file I/O should handle both `\` and `/` as path separators
- PowerShell-compatible output format (no bash-specific syntax)

## Integration with Code Point Workflow

```
1. /codepoint-scan or /codepoint-plan → define code points and flows
   └── /codepoint-validate → check index.json integrity (Pass 1)
2. /codepoint-instrument → generate instrumentation plans
   └── /codepoint-validate → check instrumentation consistency (Pass 1-2)
3. /codepoint-test-plan → generate test plans
   └── /codepoint-validate → check test plan consistency (Pass 1-3)
4. /codepoint-implement → insert probes, run tests
   └── /codepoint-validate → check implementation completeness (Pass 1-4)
5. /codepoint-verify → validate against actual probe logs
   └── /codepoint-validate → check verification status (Pass 1-5) ← full coverage
```

This skill can be run at **any stage** of the pipeline — it validates all artifacts that exist at the time of execution. Earlier stages only trigger relevant passes; missing artifacts from later stages are reported as informational gaps.
