---
phase: 26
slug: find-up-implementation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-01
---

# Phase 26 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | unittest (stdlib) |
| **Config file** | none |
| **Quick run command** | `cd plugins/claude-notify && python -m unittest discover -s tests -v` |
| **Full suite command** | `cd plugins/claude-notify && python -m unittest discover -s tests -v` |
| **Estimated runtime** | ~1 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd plugins/claude-notify && python -m unittest discover -s tests -v`
- **After every plan wave:** Run `cd plugins/claude-notify && python -m unittest discover -s tests -v`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 26-01-01 | 01 | 1 | FIND-01 | unit | `cd plugins/claude-notify && python -m unittest tests.test_flags -v` | ❌ W0 | ⬜ pending |
| 26-01-02 | 01 | 1 | FIND-01 | unit | `cd plugins/claude-notify && python -m unittest tests.test_flags -v` | ❌ W0 | ⬜ pending |
| 26-02-01 | 02 | 1 | FIND-02 | unit | `cd plugins/claude-notify && python -m unittest tests.test_notify -v` | ✅ | ⬜ pending |
| 26-02-02 | 02 | 1 | FIND-02 | unit | `cd plugins/claude-notify && python -m unittest tests.test_notify_attention -v` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `plugins/claude-notify/tests/test_flags.py` — stubs for FIND-01 (向上查找、深度限制、CLAUDE.md 停止、根目录停止、通道独立)
- [ ] `plugins/claude-notify/tests/test_notify.py` — update existing flag tests for new import path
- [ ] `plugins/claude-notify/tests/test_notify_attention.py` — verify FIND-02 integration (optional)

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| None | - | - | All phase behaviors have automated verification |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
