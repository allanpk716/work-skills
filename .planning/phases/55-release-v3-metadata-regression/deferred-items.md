# Deferred Items — Phase 55

Out-of-scope discoveries logged during execution. Not fixed (outside plan scope fences).

## 1. docs/README.md still references removed skills (windows-git-commit, codepoint)

- **Found during:** Task 1 (REL-01 README scope)
- **File:** `docs/README.md` (separate from root `README.md` / `README.zh.md`)
- **Issue:** `docs/README.md` lines 11 and 17 still list `## windows-git-commit` and `## codepoint` as category headers with links to `docs/windows-git-commit/fixes/` and `docs/codepoint/plans/` etc.
- **Why not fixed:**
  - Task 1's `files_modified` is strictly `README.md` + `README.zh.md` (root).
  - Scope fence: this plan only edits the 5 listed files; `docs/` is not among them.
  - Phase 53 (commit 4b00454) removed `docs/codepoint/` and `docs/windows-git-commit/` directories and the skill files, but did NOT rewrite the `docs/README.md` index that points at them.
- **Impact:** `docs/README.md` is a developer-facing docs index, not user-facing release metadata. Broken/legacy category headers do not affect v3.0 release correctness (README/CHANGELOG/package.json all reflect single-skill form).
- **Suggested follow-up:** A future docs-cleanup phase should rewrite `docs/README.md` to remove the windows-git-commit + codepoint category sections (the directories they link to no longer exist).
