---
phase: 22
slug: plugin-structure-fix
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-29
---

# Phase 22 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest (installer tests) / pytest (scanner tests) |
| **Config file** | `installer/jest.config.js` |
| **Quick run command** | `cd installer && npx jest --testPathPattern="plugin-installer" --no-coverage` |
| **Full suite command** | `cd installer && npx jest && cd ../plugins/windows-git-commit && python -m pytest tests/` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `test -f plugins/windows-git-commit/SKILL.md`
- **After every plan wave:** Run `cd installer && npx jest --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 22-01-01 | 01 | 1 | STRUCT-01 | filesystem | `test -f plugins/windows-git-commit/SKILL.md` | ✅ | ⬜ pending |
| 22-01-02 | 01 | 1 | STRUCT-01 | filesystem | `test -d plugins/windows-git-commit/hooks` | ✅ | ⬜ pending |
| 22-01-03 | 01 | 1 | STRUCT-01 | filesystem | `test -d plugins/windows-git-commit/scanner` | ✅ | ⬜ pending |
| 22-02-01 | 02 | 1 | STRUCT-02 | integration | `cd installer && npx jest --testPathPattern="plugin-installer"` | ✅ | ⬜ pending |
| 22-02-02 | 02 | 1 | STRUCT-01 | grep | `grep -c "plugins/windows-git-commit/SKILL.md" plugins/windows-git-commit/SKILL.md` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Pre-commit hook runs correctly after restructuring | STRUCT-01 | Requires live git commit attempt | Stage a file, run `git commit -m "test"`, verify scanner output |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
