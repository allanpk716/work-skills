---
phase: 28
slug: diagnostics-testing
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-01
---

# Phase 28 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 9.0.2 with unittest.TestCase classes |
| **Config file** | pytest.ini (root) |
| **Quick run command** | `python -m pytest plugins/claude-notify/tests/test_diagnose.py -v --tb=short -x` |
| **Full suite command** | `python -m pytest plugins/claude-notify/tests/ -v --tb=short` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `python -m pytest plugins/claude-notify/tests/test_diagnose.py -v --tb=short -x`
- **After every plan wave:** Run `python -m pytest plugins/claude-notify/tests/ -v --tb=short`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 28-01-01 | 01 | 1 | DIAG-01 | unit | `python -m pytest plugins/claude-notify/tests/test_diagnose.py -x` | ❌ W0 | ⬜ pending |
| 28-01-02 | 01 | 1 | TEST-01, TEST-02 | unit | `python -m pytest plugins/claude-notify/tests/test_flags.py -x` | ✅ exist | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `plugins/claude-notify/tests/test_diagnose.py` — stubs for DIAG-01 display output tests

*Existing infrastructure covers flag logic tests (test_flags.py has 16+ tests).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| None applicable | — | — | All phase behaviors have automated verification |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
