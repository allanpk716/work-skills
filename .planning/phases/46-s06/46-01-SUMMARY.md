---
phase: "46"
plan: "01"
---

# T01: Created validate/SKILL.md with 5-pass progressive static artifact validation workflow and registered /codepoint-validate in main SKILL.md

**Created validate/SKILL.md with 5-pass progressive static artifact validation workflow and registered /codepoint-validate in main SKILL.md**

## What Happened

Created the core progressive validation sub-skill at plugins/codepoint/skills/validate/SKILL.md. This skill performs static artifact consistency validation across all pipeline stages without requiring runtime probe logs — filling the gap identified in S05.

The validate skill defines 5 progressive validation passes:
1. **Index Integrity** — schema compliance, cross-reference integrity (flow.collection_id → collections, flow.sequence → points, point.used_in_flows → flows), sequence coherence, type distribution
2. **Instrumentation Consistency** — every flow has instrumentation plan, Probe Table references valid point IDs, metadata fields match point type contracts, Test Scenario Mapping references valid probe IDs
3. **Test Plan Consistency** — Coverage Matrix references valid point IDs, test case definitions reference valid point IDs and probe snippets (D-01 through D-10), at least one normal/boundary/failure test case per flow
4. **Implementation Completeness** — enabled=true points have locations, referenced files exist, implemented flows have instrumentation and test plans
5. **Verification Status** — verified flows have verification reports, status transitions follow correct order

Each pass has clear Procedure, Findings to Report, and Pass/Fail criteria sections. A Summary Report structure shows all 5 passes with PASS/FAIL results.

The main codepoint/SKILL.md was updated with:
- `/codepoint-validate` command row in the Commands table
- 6 new trigger phrases (English + Chinese) added to frontmatter
- Validate steps integrated into both Quick Start sections (existing codebase and new feature workflows)

Clear scope distinction from /codepoint-verify is maintained throughout: static vs dynamic, no runtime needed vs requires probe logs.

## Verification

All 4 verification checks from the task plan passed:
1. validate/SKILL.md exists: True
2. Contains >= 5 '### Pass' headings: 5 found (Pass 1 through Pass 5)
3. Main SKILL.md contains '/codepoint-validate' references: 5 found (command table, triggers, 2 quick start sections, and quick reference)
4. validate/SKILL.md contains 'Triggers on:' line: 1 found

The combined verification command also passed (returned True).

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `powershell -Command "test-path plugins/codepoint/skills/validate/SKILL.md"` | 0 | ✅ pass | 500ms |
| 2 | `powershell -Command "(Select-String -Path plugins/codepoint/skills/validate/SKILL.md -Pattern '^### Pass').Count"` | 0 | ✅ pass (5 passes found) | 600ms |
| 3 | `powershell -Command "(Select-String -Path plugins/codepoint/skills/codepoint/SKILL.md -Pattern '/codepoint-validate').Count"` | 0 | ✅ pass (5 references found) | 600ms |
| 4 | `powershell -Command "(Select-String -Path plugins/codepoint/skills/validate/SKILL.md -Pattern 'Triggers on:').Count"` | 0 | ✅ pass (1 found) | 500ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `plugins/codepoint/skills/validate/SKILL.md`
- `plugins/codepoint/skills/codepoint/SKILL.md`
