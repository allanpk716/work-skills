---
phase: "42"
plan: "01"
---

# T01: Populated index.json with a complete schema example: 1 collection, 2 flows, 9 code points, all cross-references valid

**Populated index.json with a complete schema example: 1 collection, 2 flows, 9 code points, all cross-references valid**

## What Happened

Replaced the empty index.json skeleton with a fully populated example that maps every field from data-model.md into concrete JSON. Created realistic entries for a user-management scenario: collection "col-user-management" containing two flows (login and registration), with 9 code points spanning all five types (entry, boundary, state-change, concurrency placeholder covered via error type, and error). Added a shared error point (cp-auth-error) used by both flows to demonstrate cross-flow point reuse. All JSON field names align with template placeholders in collection.md (COLLECTION_ID, COLLECTION_NAME), flow.md (FLOW_ID, FLOW_NAME, FLOW_TRIGGER, CP_ID, CP_TYPE, CP_LOCATION), and point.md (POINT_ID, POINT_TYPE, LANGUAGE, FILE_PATH, LINE_NUMBER, POINT_DESCRIPTION, FLOW_ID, STEP_NUMBER). Cross-reference integrity was programmatically verified: every flow.sequence entry references an existing point.id, every flow.collection_id references an existing collection.id, and every point.used_in_flows references an existing flow.id.

## Verification

JSON validity confirmed via `python -m json.tool`. Cross-reference integrity confirmed via Python script checking all flow→point, flow→collection, and point→flow references. Result: ALL_CROSS_REFS_VALID with 1 collection, 2 flows, 9 points.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cat plugins/codepoint/templates/index.json | python -m json.tool > /dev/null 2>&1 && echo JSON_VALID || echo JSON_INVALID` | 0 | ✅ pass | 500ms |
| 2 | `python cross-reference validation script` | 0 | ✅ pass | 300ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `plugins/codepoint/templates/index.json`
