---
phase: 31
reviewers: [opencode]
reviewed_at: 2026-04-08T21:35:00+08:00
plans_reviewed: [31-01-PLAN.md, 31-02-PLAN.md]
---

# Cross-AI Plan Review — Phase 31

## OpenCode Review

### Plan 31-01: flags.py — Add get_git_branch() and fix find_project_root()

**Summary**
A focused, well-scoped plan that addresses two distinct concerns: adding branch detection capability and fixing a pre-existing worktree bug in project root detection. The TDD approach and wave-1 positioning (no upstream dependencies) are appropriate. The plan correctly identifies `git branch --show-current` as the right tool and includes sensible timeout protection.

**Strengths**
- Fixing the pre-existing `.is_dir()` → `.exists()` bug alongside the new feature is pragmatic and well-motivated by D-05
- `git branch --show-current` is the correct modern command — handles worktrees, detached HEAD, and non-git dirs gracefully
- subprocess.run with list args (no shell=True) and 1s timeout demonstrates good security practice
- TDD with 5 branch tests + 1 worktree fix test gives reasonable coverage

**Concerns**
- **[MEDIUM] FileNotFoundError handling**: If git is not on PATH, `subprocess.run` will raise `FileNotFoundError`. The plan should wrap this in a try/except returning `None`, or explicitly document this as an acceptable edge case.
- **[MEDIUM] Encoding parameters**: On Windows, `subprocess.run` default encoding can vary. Should explicitly pass `encoding='utf-8'` or `text=True` to avoid bytes-vs-string issues.
- **[LOW] Return value for detached HEAD**: `git branch --show-current` returns empty string for detached HEAD. The plan should clarify whether empty string → `None`/falsy → degrade. Given D-01/D-02, this seems correct, but should be explicit.
- **[LOW] stderr handling**: Branch name may include warning output on stderr for unusual repo states. `stderr=subprocess.DEVNULL` would be cleaner.

**Suggestions**
- Wrap subprocess call in `try/except (FileNotFoundError, subprocess.TimeoutExpired)` returning `None`
- Add `encoding='utf-8'` and `stderr=subprocess.DEVNULL` to subprocess.run call
- Add a test case for detached HEAD confirming it degrades to `[project]`
- Consider a single-line docstring clarifying return contract: `str | None`

---

### Plan 31-02: notify.py and notify-attention.py — Title format upgrade

**Summary**
A clean extraction plan that centralizes title-building logic into helper functions, with proper fallback behavior when git branch is unavailable. The wave-2 dependency on Plan 31-01 is correct. WTREE-02 (session_id) is confirmed pre-satisfied by existing code, avoiding unnecessary changes.

**Strengths**
- Extracting `build_title()` / `build_attention_title()` as dedicated functions keeps call sites clean and testable
- Explicit confirmation that WTREE-02 is already satisfied avoids scope creep
- The `git_branch=None` parameter pattern provides clean opt-in behavior
- 6 tests in TestWorktreeTitleFormat covering both files and both formats is thorough

**Concerns**
- **[HIGH] Duplication between notify.py and notify-attention.py**: Both files get nearly identical title-building functions. This violates DRY — if the title format changes, both files must be updated in lockstep. Consider a shared utility.
- **[MEDIUM] get_git_branch() call location**: The plan should specify where `get_git_branch()` is called. If called inside `build_title()`, it runs per notification (lazy evaluation). If called at module level, it runs once at import.
- **[LOW] XML escaping of branch names**: Pushover titles may not need XML escaping. Verify the escape is applied at the right layer.

**Suggestions**
- Extract a single `build_notification_title(project_name, git_branch=None, suffix=None)` in a shared location (flags.py is fine since it already has project detection logic)
- Ensure `get_git_branch()` is called inside `build_title()`, not at module level
- Add a test for branch names with special characters (e.g., `feature/JIRA-123:fix`)
- Consider a test for very long branch names near the Pushover 250-char limit

---

### Overall Risk Assessment: **LOW**

**Justification**: The scope is small and well-bounded — two files modified, no new dependencies, no schema/API changes. The pre-existing bug fix (`.is_dir()` → `.exists()`) is low-risk and independently testable. The main risk is the DRY duplication in Plan 31-02, which is a maintainability concern rather than a functional one. Git branch detection is a well-understood problem with a mature command (`--show-current` since git 2.22, user on 2.45). The fallback path (non-git → `[project]`) ensures zero impact on existing users.

**Key recommendation**: Consolidate the title-building logic into a single shared function before implementation, rather than maintaining parallel copies in two files.

---

## Consensus Summary

> Note: This review was conducted by 1 external AI system (OpenCode). Claude was skipped as the current runtime.

### Agreed Strengths
- Well-scoped phase with clear wave dependencies
- Correct choice of `git branch --show-current` with timeout protection
- TDD approach with comprehensive test coverage planned
- Pragmatic fix of pre-existing bug alongside new feature
- DRY concern: title-building functions duplicated across two files (HIGH severity)
- FileNotFoundError and encoding handling need explicit attention (MEDIUM severity)

### Agreed Concerns
1. **[HIGH] DRY violation**: `build_title()` and `build_attention_title()` are near-identical functions in two files → recommend consolidating into `flags.py`
2. **[MEDIUM] Encoding on Windows**: subprocess.run should explicitly set `encoding='utf-8'` to avoid bytes-vs-string issues
3. **[MEDIUM] FileNotFoundError**: git not on PATH should be caught and degrade gracefully

### Divergent Views
- No divergence (single reviewer)

### Action Items for Plan Revision
1. Move title-building logic to `flags.py` as a shared `build_notification_title()` function
2. Add explicit `encoding='utf-8'` and `stderr=subprocess.DEVNULL` to subprocess.run
3. Verify FileNotFoundError is handled in get_git_branch() implementation
4. Add test for special characters in branch names
