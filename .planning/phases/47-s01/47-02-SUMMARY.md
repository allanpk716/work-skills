---
phase: "47"
plan: "02"
---

# T02: Moved 9 codepoint sub-skills from plugins/codepoint/skills/ to root-level directories, relocated shared resources to codepoint/, and updated reference paths

**Moved 9 codepoint sub-skills from plugins/codepoint/skills/ to root-level directories, relocated shared resources to codepoint/, and updated reference paths**

## What Happened

Created root-level `codepoint/` directory containing the main SKILL.md plus shared resources (references/ with 5 docs, templates/ with 5 template files, .claude-plugin/plugin.json). Created 8 separate root-level sub-skill directories (codepoint-scan, codepoint-plan, codepoint-implement, codepoint-instrument, codepoint-test-plan, codepoint-validate, codepoint-verify, codepoint-run), each with their own SKILL.md. Updated reference paths in 4 sub-skills that reference shared resources: codepoint-implement references `../codepoint/references/{golang,python,frontend}.md`, codepoint-instrument references `../codepoint/references/{data-model,frontend}.md`, codepoint-test-plan references `../codepoint/references/test-probes.md` (4 occurrences), and codepoint-verify references `../codepoint/templates/verification.md`. The other 4 sub-skills (scan, plan, run, validate) had no shared resource references and were copied without modification. All 9 codepoint skills pass `npx skills-ref validate` — combined with T01's 2 skills, all 11 skills in the repository now validate successfully at root level.

## Verification

Ran the exact verification command from the task plan: chained `npx skills-ref validate` for all 9 codepoint skills (codepoint, codepoint-scan, codepoint-plan, codepoint-implement, codepoint-instrument, codepoint-test-plan, codepoint-validate, codepoint-verify, codepoint-run). All 9 returned "Valid skill: {name}" with exit code 0. Also verified the full 11-skill set (including claude-notify and windows-git-commit from T01) all pass validation. Confirmed all expected output files exist: codepoint/SKILL.md, codepoint/references/*.md (5 files), codepoint/templates/* (5 files), codepoint/.claude-plugin/plugin.json, and 8 sub-skill SKILL.md files.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx skills-ref validate codepoint` | 0 | ✅ pass | 3000ms |
| 2 | `npx skills-ref validate codepoint-scan` | 0 | ✅ pass | 2800ms |
| 3 | `npx skills-ref validate codepoint-plan` | 0 | ✅ pass | 2800ms |
| 4 | `npx skills-ref validate codepoint-implement` | 0 | ✅ pass | 2800ms |
| 5 | `npx skills-ref validate codepoint-instrument` | 0 | ✅ pass | 2800ms |
| 6 | `npx skills-ref validate codepoint-test-plan` | 0 | ✅ pass | 2800ms |
| 7 | `npx skills-ref validate codepoint-validate` | 0 | ✅ pass | 2800ms |
| 8 | `npx skills-ref validate codepoint-verify` | 0 | ✅ pass | 2800ms |
| 9 | `npx skills-ref validate codepoint-run` | 0 | ✅ pass | 2800ms |

## Deviations

Also copied templates/collection.md, templates/flow.md, templates/point.md, and templates/verification.md into codepoint/templates/ — the plan only listed index.json but the verify sub-skill references templates/verification.md so these shared templates are needed.

## Known Issues

None.

## Files Created/Modified

- `codepoint/SKILL.md`
- `codepoint/references/data-model.md`
- `codepoint/references/golang.md`
- `codepoint/references/python.md`
- `codepoint/references/frontend.md`
- `codepoint/references/test-probes.md`
- `codepoint/templates/index.json`
- `codepoint/.claude-plugin/plugin.json`
- `codepoint-scan/SKILL.md`
- `codepoint-plan/SKILL.md`
- `codepoint-implement/SKILL.md`
- `codepoint-instrument/SKILL.md`
- `codepoint-test-plan/SKILL.md`
- `codepoint-validate/SKILL.md`
- `codepoint-verify/SKILL.md`
- `codepoint-run/SKILL.md`
