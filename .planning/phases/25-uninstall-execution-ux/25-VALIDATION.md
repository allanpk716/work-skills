---
phase: 25
slug: uninstall-execution-ux
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-30
---

# Phase 25 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest ^30.3.0 |
| **Config file** | None (uses Jest defaults) |
| **Quick run command** | `cd installer && npm test -- --testPathPattern="uninstall"` |
| **Full suite command** | `cd installer && npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd installer && npm test -- --testPathPattern="uninstall"`
- **After every plan wave:** Run `cd installer && npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 25-01-01 | 01 | 1 | UX-02 | unit | `cd installer && npm test -- --testPathPattern="uninstall/index"` | ✅ | ⬜ pending |
| 25-02-01 | 02 | 1 | PLUG-02, PLUG-03, PLUG-04, ENV-02, UX-05 | unit | `cd installer && npm test -- --testPathPattern="uninstall/remover"` | ❌ W0 | ⬜ pending |
| 25-03-01 | 03 | 1 | UX-03 | unit | `cd installer && npm test -- --testPathPattern="uninstall/reporter"` | ❌ W0 | ⬜ pending |
| 25-04-01 | 04 | 1 | UX-01, UX-06 | unit | `cd installer && npm test -- --testPathPattern="uninstall/index"` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `installer/tests/uninstall/remover.test.js` — stubs for PLUG-02, PLUG-03, PLUG-04, ENV-02, UX-05
- [ ] `installer/tests/uninstall/reporter.test.js` — stubs for UX-03

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| None | — | — | — |

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
