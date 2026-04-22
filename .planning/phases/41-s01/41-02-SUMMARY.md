---
phase: "41"
plan: "02"
---

# T02: Register /codepoint-test-plan command in main codepoint SKILL.md with storage structure update

**Register /codepoint-test-plan command in main codepoint SKILL.md with storage structure update**

## What Happened

Updated the main codepoint SKILL.md (plugins/codepoint/skills/codepoint/SKILL.md) to register the new /codepoint-test-plan skill created in T01. Three changes were made:

1. **Commands table**: Added a new row for `/codepoint-test-plan` with purpose "Generate structured test plans with probe snippets (D-01–D-10) for a flow", positioned between /codepoint-plan and /codepoint-implement to reflect the workflow order.

2. **Storage structure diagram**: Added the `test-plans/` subdirectory with an example file `user-login-test-plan.md`, positioned between `points/` and `verification/` to reflect the actual directory layout.

3. **Quick Start sections**: Both "For Existing Codebase" and "For New Feature Development" workflows now include a step 3 referencing `/codepoint-test-plan`, pushing /codepoint-implement to step 4.

4. **Description and triggers**: Updated the frontmatter description from "three core capabilities" to reflect all four capabilities, and added "codepoint test plan" and "测试计划" trigger keywords.

## Verification

Verified both must-haves:

1. "Developer sees /codepoint-test-plan listed in the main skill command table" — confirmed: the Commands table now has 4 rows including `/codepoint-test-plan` with its purpose description. Verified with grep showing 3 occurrences (command table, Quick Start x2).

2. "Main skill storage structure section shows test-plans/ subdirectory" — confirmed: the Storage Structure tree diagram now includes `test-plans/` with example file. Verified with grep showing 1 occurrence in the tree diagram.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `grep -c 'codepoint-test-plan' plugins/codepoint/skills/codepoint/SKILL.md` | 0 | ✅ pass — 3 occurrences found (command table + both Quick Start sections) | 200ms |
| 2 | `grep -c 'test-plans/' plugins/codepoint/skills/codepoint/SKILL.md` | 0 | ✅ pass — 1 occurrence found in storage structure diagram | 150ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `plugins/codepoint/skills/codepoint/SKILL.md`
