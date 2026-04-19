---
phase: 37-fullstack-fix
plan: 01
status: complete
completed: 2026-04-19
---

# Plan 37-01: Create 37-DEFECTS.yaml

## What was built

Created `.planning/phases/37-fullstack-fix/37-DEFECTS.yaml` — a structured YAML record of all 8 defects discovered during Phase 35 (Go+JS) and Phase 36 (Python+TS) fullstack E2E testing.

## Defect breakdown

| Category | Count | IDs |
|----------|-------|-----|
| template | 3 | DEV-FS-01, DEV-FS-02, DEV-FS-03 |
| test_project | 5 | DEV-FS-04, DEV-FS-05, DEV-FS-06, DEV-FS-07, DEV-FS-08 |

**Severity distribution:** 2 high, 3 medium, 3 low

## Key decisions

- Added `root_cause` field per cross-AI review feedback (37-REVIEWS.md) — explains why each defect escaped earlier validation phases
- Template defects (golang.md, python.md) categorized separately from test project defects to guide Plan 37-02 scope
- All defects marked as fixed in test project code; template updates deferred to Plan 37-02

## Verification

- YAML parses without error
- 8 defects total: 3 template + 5 test_project
- Every defect has root_cause field

## key-files

### created
- `.planning/phases/37-fullstack-fix/37-DEFECTS.yaml` — Structured defect record (8 entries with root_cause)
