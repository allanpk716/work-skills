---
phase: "49"
plan: "02"
---

# T02: Fix all stale ../codepoint/ and plugins/codepoint/ references in 5 SKILL.md files and CLAUDE.md

**Fix all stale ../codepoint/ and plugins/codepoint/ references in 5 SKILL.md files and CLAUDE.md**

## What Happened

Fixed all broken relative path references and stale plugins/ references after the T01 directory restructuring (8 codepoint sub-skills moved into codepoint/).

**Path reference fixes (../codepoint/ → ../):**
- `codepoint-implement/SKILL.md`: Fixed 3 references (golang.md, python.md, frontend.md)
- `codepoint-instrument/SKILL.md`: Fixed 2 references (data-model.md, frontend.md)
- `codepoint-test-plan/SKILL.md`: Fixed 4 references (test-probes.md × 4)
- `codepoint-verify/SKILL.md`: Fixed 1 reference (verification.md template)

**plugins/ stale reference fixes:**
- `codepoint-implement/SKILL.md`: `git add plugins/codepoint/skills/implement/SKILL.md` → `git add codepoint/codepoint-implement/SKILL.md`
- `codepoint-scan/SKILL.md`: `git add plugins/codepoint/skills/scan/SKILL.md` → `git add codepoint/codepoint-scan/SKILL.md`
- `CLAUDE.md`: Updated 3 lines in Plugin Development section — `plugins/<name>/skills/<skill>/SKILL.md` → `<name>/<skill>/SKILL.md`, and development/publish phase references updated from "plugins/ directory" to "skills root directory"

All 11 SKILL.md files pass `npx skills-ref validate`. Root-level skill discovery shows claude-notify, codepoint, and windows-git-commit.

Note: The verification command `grep -r "../codepoint/" codepoint/` shows a false positive in `codepoint/references/golang.md` due to grep regex matching (`.` matches any character), matching `./codepoint/...` in Go build commands. All actual SKILL.md files are verified clean.

## Verification

1. `grep -r "../codepoint/" codepoint/*/SKILL.md` — zero matches (all 10 SKILL.md files clean)
2. `grep -r "plugins/codepoint/" codepoint/` — zero matches (all codepoint/ files clean)
3. `npx skills-ref validate` — all 11 SKILL.md files pass validation
4. `npx skills add . --list` — discovers claude-notify, codepoint, windows-git-commit at root level
5. CLAUDE.md updated with corrected directory structure guidance

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `grep -r '../codepoint/' codepoint/*/SKILL.md -l | wc -l | xargs test 0 -eq && echo CLEAN` | 0 | ✅ pass | 500ms |
| 2 | `grep -r 'plugins/codepoint/' codepoint/ --include='*.md' -l | wc -l | xargs test 0 -eq && echo CLEAN` | 0 | ✅ pass | 500ms |
| 3 | `npx skills-ref validate on all 11 SKILL.md files` | 0 | ✅ pass | 3000ms |
| 4 | `npx skills add . --list` | 0 | ✅ pass | 5000ms |

## Deviations

The task plan's verification command uses `test` (Unix) which fails on Windows. Used `bash -c` wrapper for Windows compatibility. Also, the grep pattern `../codepoint/` produces a false positive in `codepoint/references/golang.md` due to regex `.` matching `./codepoint/...` in Go build commands — not an actual stale reference. Verified SKILL.md files specifically are clean.

## Known Issues

None.

## Files Created/Modified

- `codepoint/codepoint-implement/SKILL.md`
- `codepoint/codepoint-instrument/SKILL.md`
- `codepoint/codepoint-test-plan/SKILL.md`
- `codepoint/codepoint-verify/SKILL.md`
- `codepoint/codepoint-scan/SKILL.md`
- `CLAUDE.md`
