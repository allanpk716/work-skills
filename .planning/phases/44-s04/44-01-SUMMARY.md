---
phase: "44"
plan: "01"
---

# T01: Created verify/SKILL.md with complete 7-step verification automation workflow

**Created verify/SKILL.md with complete 7-step verification automation workflow**

## What Happened

Created `plugins/codepoint/skills/verify/SKILL.md` — a standalone verification automation skill that reads upstream artifacts (index.json, instrumentation plans, test plans) and actual probe output logs, then validates across four passes (sequence, completeness, metadata, coverage).

The skill follows the established SKILL.md pattern with YAML frontmatter (name: codepoint-verify, multi-line description, trigger keywords in both English and Chinese). It contains the full 7-step workflow:

1. **Load Expectations** — Reads index.json, validates cross-reference integrity (flow.collection_id → collections, flow.sequence → points), identifies cross-flow points.

2. **Load Instrumentation Plans** — Parses Probe Table and Test Scenario Mapping from per-flow instrumentation markdown files. Extracts metadata contracts per probe. Handles missing plans gracefully.

3. **Load Test Plans** — Extracts Coverage Matrix and test case Action/Expected Response/Verify triples. Maps point IDs to test scenarios by category. Handles missing plans gracefully.

4. **Collect Actual Probe Output** — Locates V2 per-flow log files in ~/.codepoint/<project>/ using the naming pattern cp-{lang}-flow-{sanitized-flow-id}-{timestamp}.log. Parses header comments for flow context. Parses JSON entries for point_id, flow_id, timestamp, stack, metadata. Handles missing/malformed entries gracefully. Handles cross-flow points correctly.

5. **Validate** — Four independent validation passes: sequence (relative order matching), completeness (all probes in sequence fired), metadata (per-type required fields from instrument skill contracts), coverage (test plan scenarios matched against actual output).

6. **Generate Verification Report** — Writes to .codepoints/verification/{flow-id}-verify.md using the templates/verification.md structure with Summary table, Normal/Boundary/Failure verification sections, Issues Found, Recommendations. PASS only if all validation passes succeed.

7. **Update Index** — On PASS, updates flow status from "implemented" to "verified" in index.json. Preserves all other content. Never downgrades status.

Additional sections: Point Type Reference table with all 5 types and their required/optional metadata fields, V2 Log File Format Reference, Windows Compatibility notes, and Integration workflow diagram.

## Verification

Verified the created file against all task plan constraints:
1. YAML frontmatter contains name: codepoint-verify ✓
2. Multi-line description with Triggers on: keywords ✓
3. All 7 steps present (Load Expectations, Load Instrumentation Plans, Load Test Plans, Collect Actual Probe Output, Validate with 4 passes, Generate Verification Report, Update Index) ✓
4. All 5 point types referenced (entry, boundary, state-change, concurrency, error) ✓
5. V2 log file format referenced with header comments + JSON entries ✓
6. Cross-flow point handling described ✓
7. Windows/PowerShell compatibility section present ✓
8. Metadata contracts reference instrument skill's per-type fields ✓
9. Does not duplicate implement skill's Phase 3 — goes deeper (parses actual logs, cross-references plans) ✓
10. Uses project module name for log directory, not CWD ✓
11. Verification report follows templates/verification.md structure ✓

No automated test script exists yet (tmp/verify-s04.ps1 not present) — this is expected as it's likely created in a subsequent task.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| — | No verification commands discovered | — | — | — |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `plugins/codepoint/skills/verify/SKILL.md`
