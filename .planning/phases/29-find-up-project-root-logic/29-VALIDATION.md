---
phase: 29
slug: find-up-project-root-logic
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-04
---

# Phase 29 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 9.0.2 |
| **Config file** | none — existing |
| **Quick run command** | `python -m pytest tests/test_flags.py -x -q` |
| **Full suite command** | `python -m pytest tests/test_flags.py -v` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `python -m pytest tests/test_flags.py -x -q`
- **After every plan wave:** Run `python -m pytest tests/test_flags.py -v`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 29-01-01 | 01 | 1 | PROJ-07 | unit | `python -m pytest tests/test_flags.py::TestFindProjectRoot -v` | ❌ W0 | ⬜ pending |
| 29-01-02 | 01 | 1 | PROJ-07 | unit | `python -m pytest tests/test_flags.py::TestGetProjectName -v` | ❌ W0 | ⬜ pending |
| 29-02-01 | 02 | 1 | PROJ-01 | unit | `python -m pytest tests/test_flags.py::TestFindProjectRoot -v` | ✅ | ⬜ pending |
| 29-02-02 | 02 | 1 | PROJ-02 | unit | `python -m pytest tests/test_flags.py::TestFindProjectRoot -v` | ✅ | ⬜ pending |
| 29-02-03 | 02 | 1 | PROJ-03 | unit | `python -m pytest tests/test_flags.py::TestGetProjectName -v` | ✅ | ⬜ pending |
| 29-02-04 | 02 | 1 | PROJ-06 | unit | `python -m pytest tests/test_flags.py::TestGetProjectName::test_fallback_cwd_basename -v` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/test_flags.py` — stubs for TestFindProjectRoot and TestGetProjectName test classes

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| None | — | — | — |

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
