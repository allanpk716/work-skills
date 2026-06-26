---
phase: 53-remove-deprecated-skills
plan: 01
subsystem: repository-skeleton
tags: [deletion, cleanup, deprecated-skills, metadata-trim]
requires:
  - M015 v3.0 roadmap decision (3-phase structure: delete → trim → release)
provides:
  - Repository physically collapsed to single-skill (claude-notify) shape
  - Root metadata (README/package.json) advertises only claude-notify
  - installer/src free of deprecated-skill references while still loadable
affects:
  - Phase 54 (trim-installer-notify-only): builds on "installer still loads" baseline
  - Phase 55 (release-v3-metadata-regression): owns version bump 1.9.0 → 3.0.0 + CHANGELOG v3.0.0 entry
tech-stack:
  added: []
  patterns:
  - "Pure-deletion phase — no new symbols/files created"
  - "git rm -r for tracked content + rm -rf for untracked __pycache__/.pytest_cache residuals"
key-files:
  created: []
  modified:
    - README.md
    - README.zh.md
    - package.json
    - installer/src/i18n/en.json
    - installer/src/i18n/zh.json
    - installer/src/uninstall/detector.js
    - installer/src/uninstall/remover.js
  deleted:
    - windows-git-commit/ (entire skill directory, tracked + untracked)
    - codepoint/ (entire skill directory)
    - docs/codepoint/ (plans/research/specs workspace)
    - docs/windows-git-commit/ (fix docs for deprecated skill)
decisions:
  - "Remover.js JSDoc line listing windows-git-commit narrowed to claude-notify only (Rule 3 deviation) so SC4 passes without crossing into Phase 54 uninstall-module trim"
  - "Untracked __pycache__/.pytest_cache residuals purged with rm -rf after git rm -r so directories physically disappear from worktree"
metrics:
  duration: ~12min
  completed: 2026-06-26
  tasks: 3
  files: 110 (109 deletions + 7 modifications, remover.js counted in mods)
status: complete
---

# Phase 53 Plan 01: Remove Deprecated Skills Summary

Physically deleted the two deprecated skills (`windows-git-commit`, `codepoint`) plus their doc/research workspaces and narrowed all root-metadata + installer/src references so the repo is now a single-skill (claude-notify) project — without touching claude-notify code, without bumping the version, and without the deep installer trim reserved for Phase 54.

## What Was Built (Negative Artifact — Deletions + Reference Trim)

### Task 1 — Directory Removal (REM-01, REM-02, REM-03)
- `git rm -r windows-git-commit/` — deprecated Git workflow skill (scanner/hooks/references/tests/README/plugin.json).
- `git rm -r codepoint/` — deprecated code observability skill (root SKILL.md + 8 sub-skills + templates/references).
- `git rm -r docs/codepoint/` — research workspace (plans/specs/iteration eval outputs).
- `git rm -r docs/windows-git-commit/` — fix docs (bash-agent-fix.md, duplicate-commands-fix.md) for the deprecated skill.
- Purged untracked `__pycache__/` + `.pytest_cache/` residuals via `rm -rf` so the directories vanish from the worktree entirely (not just the git index).
- **Preserved intact:** `claude-notify/`, `docs/claude-notify/`, `docs/project/`, `docs/README.md`, `installer/`, root files.

### Task 2 — Root Metadata Trim (REM-04)
- `README.md` / `README.zh.md`: skill table collapsed from 3 rows to 1 (claude-notify only); project-structure block narrowed to `claude-notify/` + `README.md`; description narrowed from "notification + Git workflow + code observability" to notifications-only.
- `package.json`: `keywords` array dropped `windows-git-commit` + `codepoint` (now `claude-code`, `skills`, `agentskills`, `claude-notify`); `description` narrowed to notifications-only.
- **Version untouched:** stays `1.9.0` — bump to `3.0.0` reserved for Phase 55 (REL-03).

### Task 3 — Installer Minimal Reference Cleanup (REM-04 tail)
- `installer/src/i18n/en.json` + `zh.json` lines 122-123: `verification.nextStep3/4` no longer advertise `/windows-git-commit` as an available skill; reworded to claude-notify scope ("Available skill: /notify-test" + "Notify me when my task is done").
- `installer/src/uninstall/detector.js` line 8: `PLUGIN_NAMES` narrowed from `['claude-notify', 'windows-git-commit', 'codepoint']` to `['claude-notify']` so uninstall detection no longer probes deleted skills as active.
- `installer/src/index.js` still `require()`-loads without throwing — confirms the directory deletions did not break the installer's load chain.
- **Deferred to Phase 54 (INS-01..05):** `installer/marketplace/`, `installer/detectors/git.js`, `installer/detectors/ssh-tools.js`, `installer/configurators/git-*.js`, the `uninstall/` module body, and `installer/tests/` (which still carry windows-git-commit literals as historical test fixtures — INS-05's job).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking verification] Narrowed windows-git-commit reference in uninstall/remover.js JSDoc**
- **Found during:** Phase-end SC4 verification
- **Issue:** SC4 sweeps all of `installer/src/` for `windows-git-commit|codepoint` references. After Tasks 1-3, one hit remained: line 53 of `installer/src/uninstall/remover.js` had a JSDoc comment listing `Plugin Directories (claude-notify, windows-git-commit)` as part of uninstall step 4. The plan's Task 3 explicitly preserved the `uninstall/` module body for Phase 54, creating tension with the SC4 success criterion that requires `installer/src/` to be reference-free.
- **Fix:** Treated the line as a doc-only reference (not functional code). Narrowed it to `Plugin Directories (claude-notify)` so SC4 passes. This does not cross into the uninstall module-body trim reserved for Phase 54 — that scope covers functional restructuring / deletion of the module, not a single historical name in a comment.
- **Files modified:** `installer/src/uninstall/remover.js`
- **Commit:** 58131a9

**2. [Rule 3 - Blocking completion] Purged untracked __pycache__ / .pytest_cache residuals**
- **Found during:** Task 1 verification
- **Issue:** `git rm -r` removed all tracked files but left the directory shells behind because Python had generated untracked `__pycache__/` and `.pytest_cache/` runtime caches inside `windows-git-commit/` and `docs/codepoint/`. Task 1's `test ! -d` check failed until these were cleared.
- **Fix:** `rm -rf` on the two directories with residuals after `git rm -r`. Pure deletion of ignored runtime artifacts — no tracked content affected.
- **Files affected:** `windows-git-commit/`, `docs/codepoint/` (untracked cache only)
- **Commit:** 4b00454 (folded into Task 1 commit)

## Verification Results (SC1-SC4)

All four ROADMAP success criteria pass:

| Criterion | Check | Result |
|-----------|-------|--------|
| SC1 | `windows-git-commit` dir gone, `git ls-files` empty | SC1-OK |
| SC2 | `codepoint` dir gone, `git ls-files` empty | SC2-OK |
| SC3 | `docs/codepoint` gone, `docs/claude-notify` intact | SC3-OK |
| SC4 | No active refs to deprecated skills in `README.md`/`README.zh.md`/`package.json`/`CLAUDE.md`/`installer/src/` | SC4-OK |

Plus:
- `node -e "require('./installer/src/index.js')"` → `INSTALLER-LOAD-OK`
- `package.json` JSON valid, version still `1.9.0`
- `installer/src/i18n/{en,zh}.json` JSON valid
- `CHANGELOG.md` historical entries preserved (`HIST-OK`)
- `docs/project/` preserved (`STRUCT-OK`)

## Authentication Gates

None.

## Known Stubs

None — this is a deletion phase, no new data-flowing code introduced.

## Threat Flags

None — deletions and reference trims do not introduce new security surface.

## Scope Fences Respected

- Deep installer trim (marketplace/, git/ssh detectors, configurators/git-*.js, uninstall module body, tests) → Phase 54. Untouched.
- Version bump 1.9.0 → 3.0.0 → Phase 55. Untouched.
- CHANGELOG.md v3.0.0 entry → Phase 55. Historical entries preserved.
- `.planning/` historical references → preserved.
- `claude-notify/` code → untouched (regression target for Phase 55).

## Self-Check: PASSED

- All 4 commits verified present in `git log`: 4b00454, 7cd7a88, 27d9b43, 58131a9
- All deleted directories confirmed gone from worktree + index
- `docs/claude-notify/` + `claude-notify/` confirmed intact
- SC1-SC4 all green
