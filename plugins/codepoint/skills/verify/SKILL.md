---
name: codepoint-verify
description: >
  Standalone verification automation that reads upstream artifacts (index.json, instrumentation plans,
  test plans) and actual probe output logs, validates sequence/completeness/metadata/coverage, generates
  verification reports using the existing template, and updates index.json flow status to verified on PASS.
  This skill goes deeper than the implement skill's Phase 3 — it parses actual log files and cross-references
  them against instrumentation plans and test plans for thorough validation.
  Triggers on: "codepoint verify", "验证代码点", "verify codepoint", "verification report",
  "验证报告", "probe validation", "verify probes", "codepoint verification".
---

# Code Point Verify — Automated Verification Against Plans and Logs

## Overview

This skill performs **standalone verification automation** against existing codepoint artifacts and real probe output. Unlike `/codepoint-implement`'s Phase 3 (which does basic insertion-level checks), this skill:

- Reads **actual probe log files** from `~/.codepoint/<project>/`
- Cross-references against **instrumentation plans** (per-type metadata contracts)
- Cross-references against **test plans** (scenario coverage matrices)
- Validates **sequence, completeness, metadata, and coverage** in four independent passes
- Generates a **structured verification report** per flow
- Updates `index.json` flow status to `verified` on PASS

### When to Use

- After probes have been implemented and tests have been run
- After `/codepoint-implement` completes — this skill validates the real output
- When you need a formal verification report for a flow
- When auditing whether probe output matches the instrumentation and test plans

### When NOT to Use

- Before probes are implemented — use `/codepoint-implement` instead
- Without instrumentation or test plan artifacts — this skill requires them
- For code point definition or scanning — use `/codepoint-plan` or `/codepoint-scan` instead

## 7-Step Verification Workflow

### Step 1: Load Expectations

Read `.codepoints/index.json` from the project root. Parse and extract:

1. **Flow definitions**: For each target flow, extract `id`, `name`, `sequence`, `test_cases`, `status`
2. **Point definitions**: Extract `id`, `name`, `type`, `location`, `language`, `enabled`, `used_in_flows` for every point
3. **Collection context**: Resolve `collection_id` references to get collection names

**Validation checks:**
- Verify each `flow.collection_id` exists in `collections[].id`
- Verify every entry in `flow.sequence` exists in `points[].id`
- Verify every entry in `point.used_in_flows` exists in `flows[].id`
- Verify each flow has at least one entry-type point in its sequence
- Identify cross-flow points (points referenced in multiple flows' sequences)

If cross-reference integrity fails, report the specific broken reference and stop — the index must be consistent before verification.

### Step 2: Load Instrumentation Plans

Read `.codepoints/instrumentation/{flow-id}-instrumentation.md` for each target flow.

**Parse the Probe Table** (markdown table with columns: Probe ID, Type, Priority, Location, Metadata Fields):
- Extract each probe's ID, type, priority, and the list of expected metadata fields
- Build a per-probe metadata contract: a map of `{point_id → {type, required_fields[]}}`
- Validate that every probe in the instrumentation plan exists in `index.json` points

**Parse the Test Scenario Mapping** (markdown table with columns: Test Case, Category, Probes Exercised, Expected Observation):
- Extract scenario name, category (`normal`, `boundary`, `failure`), and the ordered list of probes exercised
- Extract the expected observation description
- Build a map of `{scenario_name → {category, probe_sequence[], expected_observation}}`

**Handle missing plans gracefully:**
- If no instrumentation plan exists for a flow, report it as a verification gap (cannot validate metadata contracts)
- Continue verification for flows that do have plans

### Step 3: Load Test Plans

Read `.codepoints/test-plans/{flow-id}-test-plan.md` for each target flow.

**Extract the Coverage Matrix** (markdown table mapping code points to test scenarios):
- Parse columns: Code Point, Normal, Boundary, Error, State, API
- Each cell contains a test case ID (e.g., `TC-01`) or is empty
- Build a map of `{point_id → {normal_tc, boundary_tc[], error_tc[], state_tc[], api_tc[]}}`

**Extract test case definitions** (sections with `## Test Case: {ID}`):
- Parse the Action / Expected Response / Verify triples
- Parse the Probe Verification sub-table (Code Point, Must Fire, Expected in Stack)
- Note the probe snippet reference (D-XX)

**Handle missing plans gracefully:**
- If no test plan exists for a flow, report it as a coverage validation gap
- Skip coverage validation (Step 5 pass 4) for flows without test plans

### Step 4: Collect Actual Probe Output

Locate and parse probe log files from `~/.codepoint/<project>/`.

**Directory discovery:**
- The `<project>` directory name is derived from the project's module name (e.g., `go.mod` module path, `package.json` name), not the CWD basename
- If no module file is found, fall back to CWD basename
- List all files matching the V2 per-flow pattern: `cp-{lang}-flow-{sanitized-flow-id}-{timestamp}.log`

**File selection:**
- Match flow IDs to log files by parsing the `{sanitized-flow-id}` portion of the filename
- For each target flow, use the most recent log file (latest timestamp)
- If multiple sessions exist, prefer the latest unless a specific session is requested

**Parse log file contents:**

1. **Header comments** (lines starting with `#`):
   - Extract `Flow ID`, `Project`, and `Session` fields
   - Validate the Flow ID matches the target flow

2. **JSON entries** (non-comment lines):
   - Parse each line as a JSON object
   - Extract required fields: `point_id`, `flow_id`, `timestamp`, `stack`, `metadata`
   - Sort entries by `timestamp` to establish actual firing order
   - Skip malformed JSON lines and report them as parse errors (do not abort)
   - Handle missing optional fields gracefully (e.g., `metadata` may be `{}`)

3. **Cross-flow point handling:**
   - Points like `cp-auth-error` may appear in multiple flows
   - Only count a probe as "fired for this flow" if its `flow_id` matches the target flow
   - Or if the point appears in a flow-specific log file for the target flow

**Error handling for missing or empty logs:**
- If no log file exists for a flow, report: "No probe output found for flow `{flow-id}`"
- If log file exists but contains no JSON entries, report: "Probe output file is empty for flow `{flow-id}`"
- Continue with other flows; do not abort the entire verification

### Step 5: Validate

Run four independent validation passes. Each pass produces a PASS/FAIL verdict with specific findings.

#### Pass 1: Sequence Validation

Compare actual probe firing order against `flow.sequence` from `index.json`.

**Procedure:**
1. Sort actual probe entries by `timestamp` (ascending)
2. Extract the `point_id` from each entry to get the actual sequence
3. Compare against `flow.sequence` (expected order)
4. Allow for additional probes not in the sequence (cross-flow points that fired during the same flow execution)
5. Verify the **relative order** is preserved: if sequence says `[A, B, C]`, actual must show A before B before C (even if other probes interleave)

**Findings to report:**
- Out-of-order probes: "Expected `{A}` before `{B}`, but `{B}` fired first at {timestamp}"
- Extra probes (not in sequence but present in log): informational, not a failure
- Relative order violations are FAIL; exact match is not required

#### Pass 2: Completeness Validation

Check that every expected probe actually fired.

**Procedure:**
1. For each `point_id` in `flow.sequence`, check if it appears in the actual probe output
2. A point is "present" if any JSON entry has a matching `point_id` and the correct `flow_id`
3. For cross-flow points (shared across multiple flows), verify presence in the flow-specific log file

**Findings to report:**
- Missing probes: "Probe `{point_id}` from flow sequence did not fire — no matching entry found"
- Total: "X of Y probes in sequence fired"
- Any missing probe is a FAIL for this pass

#### Pass 3: Metadata Validation

For each probe that fired, validate its metadata against the instrumentation plan's contract.

**Metadata contracts by point type** (from instrument skill Step 4):

| Type | Required Fields |
|------|----------------|
| `entry` | `request_method`, `request_path` |
| `boundary` | `upstream_module`, `downstream_module`, `call_duration_ms`, `response_status` |
| `state-change` | `before_state`, `after_state`, `changed_fields`, `entity_id` |
| `concurrency` | `lock_acquired`, `wait_duration_ms` |
| `error` | `error_type`, `error_message` |

**Procedure:**
1. For each fired probe, look up its `type` from `index.json` points
2. If an instrumentation plan exists, use the plan's metadata fields list (superset of the type-level defaults)
3. Check that all required fields for that type are present in the probe's `metadata` object
4. Verify field types: strings are strings, numbers are numbers, arrays are arrays, booleans are booleans
5. Flag fields present in metadata but not in the contract (informational, not a failure)

**Findings to report:**
- Missing required fields: "Probe `{point_id}` (type={type}) is missing required field `{field}`"
- Type mismatches: "Probe `{point_id}` field `{field}` expected {expected_type}, got {actual_type}"
- Empty metadata: "Probe `{point_id}` has empty metadata — no fields captured"
- Any missing required field is a FAIL for this pass

#### Pass 4: Coverage Validation

Cross-reference test plan scenarios against actual probe output.

**Procedure:**
1. For each test scenario in the test plan, extract the expected probes exercised
2. Check that each expected probe appears in the actual output
3. Map scenarios to categories (normal, boundary, failure)
4. Verify that for each category, at least one scenario's probes are fully covered
5. Cross-reference with the Coverage Matrix: verify points listed in the matrix have corresponding log entries

**Findings to report:**
- Uncovered scenarios: "Test scenario `{name}` (category={category}) expected probe `{point_id}` but it did not fire"
- Category gaps: "No boundary test scenarios have complete probe coverage"
- Matrix mismatches: "Coverage Matrix lists `{point_id}` under Boundary as TC-04, but TC-04 probes were not found"
- Skip this pass entirely if no test plan exists for the flow

### Step 6: Generate Verification Report

Write the verification report to `.codepoints/verification/{flow-id}-verify.md` using the established template structure.

**Report structure** (following `templates/verification.md`):

```markdown
# Verification Report: {Flow Name}

> Flow ID: `{flow-id}`
> Date: {ISO timestamp}
> Result: {PASS_OR_FAIL}

## Summary

| Check | Status |
|-------|--------|
| All code points triggered | {PASS/FAIL} |
| Stacks complete | {PASS/FAIL} |
| Execution order correct | {PASS/FAIL} |
| Boundary cases captured | {PASS/FAIL/N/A} |
| Failure mode observable | {PASS/FAIL/N/A} |
| Metadata contracts met | {PASS/FAIL/N/A} |
| Test coverage validated | {PASS/FAIL/N/A} |

## Normal Flow Verification

- Triggered: {YES/NO}
- Code points fired in order: {actual_sequence}
- Stacks captured: {count}/{expected_count}
- Sequence validation: {PASS/FAIL — details}

## Boundary Condition Verification

- Test cases evaluated: {count}
- Code points triggered: {list}
- Key debug info captured: {YES/NO}
- Coverage validation: {PASS/FAIL — details}

## Failure Mode Verification

- Test cases evaluated: {count}
- Error observable in output: {YES/NO}
- Stack trace includes error path: {YES/NO}
- Supports automated diagnosis: {YES/NO}
- Metadata validation: {PASS/FAIL — details}

## Issues Found

{numbered list of all issues across all validation passes, or "None."}

## Recommendations

{numbered list of actionable recommendations based on findings, or "No recommendations — all validations passed."}
```

**Overall result determination:**
- **PASS**: All four validation passes (sequence, completeness, metadata, coverage) returned PASS
- **FAIL**: Any validation pass returned FAIL
- If coverage validation was skipped (no test plan), it does not count against the overall result

**Stack completeness check:**
- For each probe entry, verify `stack` is a non-empty array
- Flag probes with empty or missing stacks

### Step 7: Update Index

If the verification result is **PASS**, update the flow's `status` field in `.codepoints/index.json`.

**Update procedure:**
1. Read `.codepoints/index.json`
2. Locate the target flow by `id`
3. Change `status` from `"implemented"` to `"verified"`
4. Update the `updated` field to the current date
5. Write back the entire `index.json` with the status change
6. **Preserve all other content** — only the flow's `status` and the top-level `updated` field change

**Constraints:**
- Only update status to `"verified"` — never downgrade from `"verified"` to a lower status
- If the flow is not in `"implemented"` status, report the current status and skip the update
- If verification result is FAIL, do not modify `index.json`
- Validate the JSON is well-formed after writing (parse it back to confirm)

## Point Type Reference

This skill validates metadata for all 5 point types:

| Type | Required Metadata Fields | Notes |
|------|-------------------------|-------|
| `entry` | `request_method`, `request_path` | Optional: `request_headers`, `user_id`, `request_id` |
| `boundary` | `upstream_module`, `downstream_module`, `call_duration_ms`, `response_status` | Optional: `request_payload_size` |
| `state-change` | `before_state`, `after_state`, `changed_fields`, `entity_id` | All fields required |
| `concurrency` | `lock_acquired`, `wait_duration_ms` | Optional: `concurrent_count`, `lock_type` |
| `error` | `error_type`, `error_message` | Optional: `error_code`, `retry_count`, `recovery_action` |

Cross-flow points (e.g., `cp-auth-error` shared across `flow-user-login` and `flow-user-register`) are validated against the metadata contract for their type regardless of which flow they appear in.

## Log File Format Reference (V2)

Probe output files follow the V2 per-flow format:

**File naming:** `cp-{lang}-flow-{sanitized-flow-id}-{timestamp}.log`
- Located in `~/.codepoint/<project>/`
- `<project>` is the module name from `go.mod` or `package.json` (falls back to CWD basename)
- `{sanitized-flow-id}` preserves only `[a-zA-Z0-9._-]`, replaces all other chars with `-`, collapses consecutive dashes

**File contents:**
```
# Code Point Log (Go) — Flow: flow-api-calculate
# Project: my-api
# Session: 2026-04-18T17:22:46.982+08:00
# Flow ID: flow-api-calculate
{"point_id":"cp-calc-entry","flow_id":"flow-api-calculate","timestamp":"2026-04-18T10:30:00.000Z","stack":["main.Calculate","handler.Process"],"metadata":{"request_method":"POST","request_path":"/api/calc"}}
{"point_id":"cp-calc-validate","flow_id":"flow-api-calculate","timestamp":"2026-04-18T10:30:00.050Z","stack":["main.Calculate","validator.Check"],"metadata":{"upstream_module":"handler","downstream_module":"validator","call_duration_ms":12,"response_status":"ok"}}
```

- Header lines start with `#`
- Each data line is a JSON object with `point_id`, `flow_id`, `timestamp`, `stack`, `metadata`
- Entries are ordered by firing time (may not be strictly chronological within a millisecond)

## Output Artifacts

After running all 7 steps, the following artifacts are produced:

```
.codepoints/
├── verification/
│   ├── {flow-id}-verify.md      # Per-flow verification report
│   ├── {flow-id}-verify.md
│   └── ...
└── index.json                    # Updated: flow status → "verified" (on PASS only)
```

## Windows Compatibility

- Log file paths use forward slashes in JSON output but are stored using the OS path separator
- The `~/.codepoint/` directory resolves to `%USERPROFILE%\.codepoint\` on Windows
- All file I/O should handle both `\` and `/` as path separators
- PowerShell-compatible output format (no bash-specific syntax)

## Integration with Code Point Workflow

```
1. /codepoint-scan or /codepoint-plan → define code points and flows
2. /codepoint-instrument → generate instrumentation plans with metadata contracts
3. /codepoint-test-plan → generate test plans with coverage matrices
4. /codepoint-implement → insert probes, run tests, basic verify (Phase 3)
5. /codepoint-verify → deep verification against plans + actual logs  ← THIS SKILL
```

This skill is the final quality gate before a flow is considered verified. It runs after implementation and test execution, reading the real probe output to confirm the entire instrumentation chain works correctly.

## Important Notes

- This skill is **read-heavy** — it reads artifacts and logs but only writes verification reports and status updates
- Verification is **non-destructive** — failed verification never modifies source code or probe code
- The `index.json` update (Step 7) only changes the flow's `status` field and the top-level `updated` timestamp
- Cross-flow points are validated for each flow they appear in independently
- If an instrumentation plan or test plan is missing, the corresponding validation pass is skipped with a reported gap (not a failure)
