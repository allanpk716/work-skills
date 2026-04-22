---
phase: "41"
plan: "01"
---

# T01: Created test-plan skill (SKILL.md) and probe snippet library (test-probes.md) with 10 reusable frontend test patterns (D-01 through D-10)

**Created test-plan skill (SKILL.md) and probe snippet library (test-probes.md) with 10 reusable frontend test patterns (D-01 through D-10)**

## What Happened

Created two files for the codepoint test specification foundation:

1. **`plugins/codepoint/skills/test-plan/SKILL.md`** — The `/codepoint-test-plan` skill with a 6-step workflow: (1) identify target flow from `.codepoints/index.json`, (2) map flow to test scenarios (normal/boundary/error/state-change/api-contract), (3) write test cases in Action -> Expected Response -> Verify format, (4) assign probe snippets D-01 through D-10, (5) generate test plan document to `.codepoints/test-plans/`, (6) user review. The skill includes a full output template with coverage matrix, probe verification table, UI verification checklist, and API verification checklist. It uses `flow_id` and `point_id` terminology from the codepoint data model throughout.

2. **`plugins/codepoint/references/test-probes.md`** — 10 ready-to-use probe code snippets with accompanying test case templates:
   - D-01: Button Click — verify click handler and probe capture
   - D-02: Form Submit — verify validation/API/result probe sequence (includes valid + invalid data variants)
   - D-03: API Call (success) — verify request/response/parsed probe sequence on 2xx
   - D-04: API Call (error) — verify error status and error caught probes on 4xx/5xx
   - D-05: Navigation/Route Change — verify route entry probe firing
   - D-06: State Change — verify before/after state mutation probes
   - D-07: Error Handling — verify error boundary and try/catch probe capture
   - D-08: Async Operation — verify probe sequence across async boundaries
   - D-09: WebSocket Message — verify message received/handled probe chain
   - D-10: Data Loading — verify loading/success/error/complete probe order (includes success + error variants)

Both files follow existing codepoint plugin conventions: frontmatter with name/description/triggers, consistent markdown structure, and integration notes linking to the parent workflow (/codepoint-scan → /codepoint-plan → /codepoint-test-plan → /codepoint-implement).

## Verification

Verified all 4 must-haves:
1. Developer can invoke /codepoint-test-plan — skill registered with name `codepoint-test-plan`, includes 6-step workflow
2. Developer can write test cases in Action -> Expected Response -> Verify format — both SKILL.md and test-probes.md include test case templates with these 3 sections (3 occurrences in SKILL.md, 36 in test-probes.md)
3. Developer can copy probe code snippets for button click (D-01), form submit (D-02), API call (D-03/D-04), and state change (D-06) — all confirmed present
4. Test plan template uses flow_id and point_id terminology — confirmed (9 occurrences in SKILL.md, 59 in test-probes.md)

All 10 probe snippets (D-01 through D-10) verified present. File structure follows existing codepoint plugin conventions.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| — | No verification commands discovered | — | — | — |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `plugins/codepoint/skills/test-plan/SKILL.md`
- `plugins/codepoint/references/test-probes.md`
