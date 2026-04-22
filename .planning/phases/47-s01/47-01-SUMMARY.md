---
phase: "47"
plan: "01"
---

# T01: Move claude-notify and windows-git-commit to root level, remove non-compliant version field from frontmatter

**Move claude-notify and windows-git-commit to root level, remove non-compliant version field from frontmatter**

## What Happened

Moved `plugins/claude-notify/` to `claude-notify/` and `plugins/windows-git-commit/` to `windows-git-commit/` using `git mv` to preserve history. Removed the non-compliant `version: 2.0.0` field from `claude-notify/SKILL.md` frontmatter — the only allowed fields are `name`, `description`, `allowed-tools`, `compatibility`, `license`, and `metadata`. The `windows-git-commit/SKILL.md` already had compliant frontmatter (only `name` and `description`). Had to remove a stale `.git/index.lock` file that was blocking the second `git mv`. Both skills now pass `skills-ref validate` at their new root-level paths.

## Verification

Ran `npx skills-ref validate claude-notify` → "Valid skill: claude-notify" (exit 0). Ran `npx skills-ref validate windows-git-commit` → "Valid skill: windows-git-commit" (exit 0). Verified all expected files exist at the new paths (SKILL.md, hooks/, scripts/, tests/, .claude-plugin/plugin.json).

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx skills-ref validate claude-notify` | 0 | ✅ pass | 3000ms |
| 2 | `npx skills-ref validate windows-git-commit` | 0 | ✅ pass | 2800ms |

## Deviations

Removed stale `.git/index.lock` before second `git mv` — a leftover from a prior interrupted git operation.

## Known Issues

None.

## Files Created/Modified

- `claude-notify/SKILL.md`
- `windows-git-commit/SKILL.md`
