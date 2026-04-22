---
phase: "50"
plan: "02"
---

# T02: Rewrote docs/README.md as skill-category index and updated 3 active guides to use flat root directory structure

**Rewrote docs/README.md as skill-category index and updated 3 active guides to use flat root directory structure**

## What Happened

Replaced docs/README.md content with a clean skill-category index pointing to claude-notify/, windows-git-commit/, codepoint/, and project/ subdirectories. Then updated 3 active project guides (plugin-development-best-practices.md, plugin-quick-reference.md, plugin-version-management.md) to reflect the current flat root directory structure where skills live at `<skill-name>/` instead of the old `plugins/<plugin-name>/` pattern. All `plugins/<name>/` project-path references were replaced with `<skill-name>/` flat root references. Remaining `plugins/` occurrences are Claude Code system cache paths (`~/.claude/plugins/cache/`, `~/.claude/plugins/marketplaces/`) which are actual filesystem paths of the Claude Code plugin system and must not be changed. Terminology updated from "插件" to "技能" where referring to project skills to match the new flat structure terminology.

## Verification

Ran the verification bash script: README.md contains all 4 category sections (claude-notify, windows-git-commit, codepoint, 项目通用) and has no plugins/ references. plugin-version-management.md has 0 plugins/ project-path references. plugin-development-best-practices.md has 8 remaining plugins/ occurrences (all Claude Code system cache paths like ~/.claude/plugins/cache/). plugin-quick-reference.md has 6 remaining plugins/ occurrences (all Claude Code system cache paths). All project-path plugins/ references successfully updated.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `grep -q "claude-notify" docs/README.md && grep -q "windows-git-commit" docs/README.md && grep -q "codepoint" docs/README.md && grep -q "项目通用" docs/README.md` | 0 | ✅ pass | 500ms |
| 2 | `! grep -q "plugins/" docs/README.md` | 0 | ✅ pass | 200ms |
| 3 | `grep -c "plugins/" docs/project/plugin-version-management.md` | 0 | ✅ pass (0 occurrences) | 200ms |
| 4 | `grep -c "plugins/" docs/project/plugin-development-best-practices.md` | 8 | ✅ pass (8 remaining are all ~/.claude/plugins/ system paths) | 200ms |
| 5 | `grep -c "plugins/" docs/project/plugin-quick-reference.md` | 6 | ✅ pass (6 remaining are all ~/.claude/plugins/ system paths) | 200ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `docs/README.md`
- `docs/project/plugin-development-best-practices.md`
- `docs/project/plugin-quick-reference.md`
- `docs/project/plugin-version-management.md`
