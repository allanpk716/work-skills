---
phase: "43"
plan: "01"
---

# T01: Create codepoint-instrument SKILL.md with 6-step workflow, probe prioritization, and per-type metadata contracts

**Create codepoint-instrument SKILL.md with 6-step workflow, probe prioritization, and per-type metadata contracts**

## What Happened

Created `plugins/codepoint/skills/instrument/SKILL.md` — the core instrumentation-first planning skill. The file follows the established SKILL.md pattern (YAML frontmatter with name, description, triggers) and contains a complete 6-step workflow:

1. **Load index.json** — reads `.codepoints/index.json`, parses collections/flows/points, validates all cross-references (flow→collection, flow.sequence→points, point.used_in_flows→flows)
2. **Analyze Coverage** — groups points by flow, detects sequence gaps, calculates type distribution, flags missing coverage (especially missing error/entry/boundary points)
3. **Prioritize Probes** — applies a 5-level priority system (P1 entry → P2 boundary → P3 state-change → P4 concurrency → P5 error) with documented rationale for each level, plus a tiebreaker rule favoring flows with fewer probes
4. **Define Metadata Contracts** — specifies concrete required/optional fields for all 5 point types: entry (request_method, request_path, request_headers sanitized, user_id, request_id), boundary (upstream_module, downstream_module, call_duration_ms, response_status, request_payload_size), state-change (before_state, after_state, changed_fields, entity_id), concurrency (lock_acquired, wait_duration_ms, concurrent_count, lock_type), error (error_type, error_message, error_code, retry_count, recovery_action)
5. **Generate Plan** — outputs per-flow markdown documents to `.codepoints/instrumentation/{flow-id}-instrumentation.md` with Probe Table, Test Scenario Mapping, and Density Analysis sections in a machine-parseable format
6. **User Review** — presents plan for confirmation on probe placement, priority alignment, metadata completeness, and coverage gaps

Includes clear When to Use / When NOT to Use section distinguishing from `/codepoint-plan`, and references to `references/data-model.md` and `references/frontend.md` for type definitions and probe patterns.

## Verification

Ran the task plan's verification command: `test -f plugins/codepoint/skills/instrument/SKILL.md && grep -q "name: codepoint-instrument" SKILL.md && grep -c "^### Step" SKILL.md` — returned 6 (all 6 steps present). Additional manual checks confirmed: all 5 point types have specific metadata contract fields with required/optional annotations, priority rationale is documented for each level, output format section defines the markdown structure with predictable headings (Probe Table, Test Scenario Mapping, Density Analysis), references to data-model.md and frontend.md are present, and When to Use / When NOT to Use section is included.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `test -f plugins/codepoint/skills/instrument/SKILL.md && grep -q "name: codepoint-instrument" plugins/codepoint/skills/instrument/SKILL.md && grep -c "^### Step" plugins/codepoint/skills/instrument/SKILL.md` | 0 | ✅ pass | 120ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `plugins/codepoint/skills/instrument/SKILL.md`
