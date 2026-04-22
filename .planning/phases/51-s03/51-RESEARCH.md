# S03 Research: README 层

## 1. Current State

### Root README.md / README.zh.md
Both files are ~160 lines with **significant issues**:

1. **Stale structure**: References `plugins/` directory tree (line 159 both files) — S01 eliminated `plugins/`, skills now live at root level
2. **Broken link**: `[skill documentation](plugins/claude-notify/SKILL.md)` (line 153 both files)
3. **Missing codepoint**: "Available Plugins" table lists only 2 items, codepoint skill is absent entirely
4. **Duplicate content**: Full skill documentation (features, usage, prerequisites, setup) is inlined for each skill — belongs in per-skill READMEs
5. **Structure mismatch**: Project tree shows `plugins/` subdirectory that no longer exists

### Per-Skill READMEs
**None exist.** All three skill directories lack README.md:
- `claude-notify/README.md` — does not exist
- `windows-git-commit/README.md` — does not exist
- `codepoint/README.md` — does not exist

## 2. Source Material for README Content

### claude-notify/SKILL.md (~200 lines)
Key README content:
- Description: Hook-triggered notifications (Pushover + Windows Toast) when Claude Code tasks complete
- Prerequisites: Python 3.8+, `requests` lib, optional Pushover account
- Install: `npx github:allanpk716/work-skills#main` (registers global hooks to `~/.claude/settings.json`)
- Config: Environment vars `PUSHOVER_TOKEN`, `PUSHOVER_USER`
- Verification: `/check-notify-env` or `python scripts/verify-installation.py`
- Slash commands: `/notify-enable`, `/notify-disable`, `/notify-status`, `/check-notify-env`
- Detailed docs: `references/` (setup.md, faq.md, technical.md, changelog.md, commands.md)

### windows-git-commit/SKILL.md (~300 lines)
Key README content:
- Description: Automated Git commit/push on Windows using plink + PPK auth
- Prerequisites: Pageant running with PPK key, TortoiseGit installed
- Install: `npx github:allanpk716/work-skills#main`
- Usage: Natural language invocation ("Use windows-git-commit...")
- Features: Auto-change analysis, commit message generation, security scanning, background execution
- Security: Pre-commit scanner with whitelist comments (`# gitcheck:ignore-line`)
- Detailed docs: `references/` (security-scanner.md, setup.md, tortoisegit.md, troubleshooting.md)

### codepoint/SKILL.md (~200 lines)
Key README content:
- Description: Collection-based runtime observability for AI-assisted development
- Commands: 8 sub-skills (`/codepoint-scan`, `/codepoint-plan`, `/codepoint-test-plan`, `/codepoint-implement`, `/codepoint-instrument`, `/codepoint-verify`, `/codepoint-validate`, `/codepoint-run`)
- Toggle: File-based (`touch ~/.codepoint/.codepoint-go` etc.)
- Storage: `.codepoints/` directory with markdown + index.json
- Language support: Go, Python, TypeScript/JS
- Detailed docs: `references/` (data-model.md, golang.md, python.md, frontend.md, test-probes.md)
- Sub-skills: 8 nested skills under `codepoint/`

## 3. Install Command

Unified install for all skills:
```bash
npx github:allanpk716/work-skills#main
```

The installer (v1.9.0) auto-detects platform, registers hooks, and configures Claude Code. Update command is the same.

## 4. plugins/ References Audit

| File | Line | Reference | Action |
|------|------|-----------|--------|
| README.md | 153 | `[skill documentation](plugins/claude-notify/SKILL.md)` | Remove (moved inline) |
| README.md | 159 | `plugins/` in project tree | Update to current structure |
| README.zh.md | 153 | `[技能文档](plugins/claude-notify/SKILL.md)` | Remove (moved inline) |
| README.zh.md | 159 | `plugins/` in project tree | Update to current structure |

Historical docs (docs/fixes/, docs/plans/) have plugins/ references but are not in scope for this slice — they are historical records.

## 5. Implementation Plan

### Task Breakdown

**T01: Root README.md + README.zh.md rewrite**
- Trim to: project intro, 3-skill navigation table, install command, project structure tree, license
- Remove all inlined skill documentation
- Remove `plugins/` references
- Add codepoint to navigation
- Update project tree to current structure
- Keep README.zh.md in sync (Chinese version)

**T02: claude-notify/README.md**
- Extract from SKILL.md: description, features list, prerequisites, install, config, verification, usage, slash commands
- Link to `SKILL.md` for full details and `references/` for deep docs
- Keep concise (~100 lines)

**T03: windows-git-commit/README.md**
- Extract from SKILL.md: description, features, prerequisites, install, usage patterns, security scanning
- Link to `SKILL.md` for full implementation details and `references/` for deep docs
- Keep concise (~100 lines)

**T04: codepoint/README.md**
- Extract from SKILL.md: description, data model overview, command table, quick start, toggle mechanism
- Note 8 sub-skills under `codepoint/`
- Link to `references/` for language-specific docs
- Keep concise (~100 lines)

### Key Decisions Needed (None)
All decisions are clear from the acceptance criteria and existing content. No ambiguity.

### Dependencies
- S01 complete (confirmed: correct directory structure, no plugins/)
- No other slice dependencies

## 6. Risk Assessment

**Low risk**: All content exists in SKILL.md files. READMEs are pure content extraction with no code changes. The main risk is keeping README.md/README.zh.md in sync — mitigated by writing both in the same task.
