---
phase: 27
slug: global-control
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-01
---

# Phase 27 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 9.x |
| **Config file** | None (default) |
| **Quick run command** | `python -m pytest plugins/claude-notify/tests/test_flags.py plugins/claude-notify/tests/test_notify_enable.py plugins/claude-notify/tests/test_notify_disable.py -x -q` |
| **Full suite command** | `python -m pytest plugins/claude-notify/tests/ -x -q` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `python -m pytest plugins/claude-notify/tests/test_flags.py -x -q`
- **After every plan wave:** Run `python -m pytest plugins/claude-notify/tests/ -x -q`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 27-01-01 | 01 | 1 | GLOB-01, GLOB-02 | unit | `python -m pytest plugins/claude-notify/tests/test_flags.py -x -q` | ✅ | ⬜ pending |
| 27-01-02 | 01 | 1 | GLOB-01, GLOB-02 | unit | `python -m pytest plugins/claude-notify/tests/test_flags.py -x -q` | ✅ | ⬜ pending |
| 27-02-01 | 02 | 1 | GLOB-01 | unit | `python -m pytest plugins/claude-notify/tests/test_notify_enable.py plugins/claude-notify/tests/test_notify_disable.py -x -q` | ✅ | ⬜ pending |
| 27-02-02 | 02 | 1 | GLOB-01 | unit | `python -m pytest plugins/claude-notify/tests/test_notify_status.py -x -q` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `plugins/claude-notify/tests/test_flags.py` — add global flag test cases
- [ ] `plugins/claude-notify/tests/test_notify_enable.py` — add `--global` test cases
- [ ] `plugins/claude-notify/tests/test_notify_disable.py` — add `--global` test cases

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| None | - | - | - |

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
