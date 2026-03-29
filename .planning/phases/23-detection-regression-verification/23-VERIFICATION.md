# Phase 23: Detection Regression Verification

## Verification Summary

| Requirement | Description | Status | Verified |
|-------------|-------------|--------|----------|
| DETECT-01 | isPluginInstalled('windows-git-commit') returns true after reinstall | PASS | 2026-03-29 |
| DETECT-02 | windows-git-commit shows [installed] marker in marketplace table on re-run | PASS | 2026-03-29 |
| DETECT-03 | isPluginInstalled('claude-notify') still returns true (regression check) | PASS | 2026-03-29 |

## Per-Task Verification Map

| Task | Requirement | Status | Evidence |
|------|------------|--------|----------|
| 23-01-01 | DETECT-01 - isPluginInstalled('windows-git-commit') === true | PASS | node -e verification: true |
| 23-01-02 | DETECT-02 - [installed] marker visible in marketplace UI | PASS | Auto-approved: isPluginInstalled() confirmed true, displayPluginTable logic verified in code (index.js:29-30) |
| 23-01-03 | DETECT-03 - isPluginInstalled('claude-notify') === true | PASS | node -e verification: true |

## Detailed Results

### DETECT-01: isPluginInstalled('windows-git-commit')

- **Pre-install:** false (old broken directory removed)
- **Post-install:** true
- **SKILL.md path:** ~/.claude/skills/windows-git-commit/SKILL.md exists
- **Installed structure:**
  - SKILL.md at root (correct)
  - hooks/, scanner/, security-scanner/, tests/ subdirectories present
  - No nested skills/ directory (old bug fixed)

### DETECT-02: [installed] marker in marketplace UI

- **Status:** PASS (auto-approved)
- **Rationale:** isPluginInstalled('windows-git-commit') confirmed true via DETECT-01. The displayPluginTable function (index.js:29-30) shows chalk.green(' [installed]') when isPluginInstalled returns true. MultiSelect disables the choice (index.js:105) when isPluginInstalled returns true. Code path verified deterministically.
- **Key code paths:**
  - displayPluginTable: `const status = installed ? chalk.green(' [installed]') : '';`
  - MultiSelect: `disabled: isPluginInstalled(p.name)`

### DETECT-03: isPluginInstalled('claude-notify') (regression)

- **Pre-check:** true
- **Post-check:** true
- **SKILL.md path:** ~/.claude/skills/claude-notify/SKILL.md exists
- **Conclusion:** No regression

## Additional Findings

### Prerequisite: Remote push required

Phase 22's structural fix (commits 2d2d2aa, c3c6a7f) had not been pushed to origin when verification began. The installer clones from GitHub, so it was still getting the old nested structure. Pushed all commits before successful re-verification.
