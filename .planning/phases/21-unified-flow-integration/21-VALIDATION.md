---
phase: 21
slug: unified-flow-integration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-29
---

# Phase 21 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.3.0 (existing self-executing test scripts) |
| **Config file** | installer/jest.config.js |
| **Quick run command** | `cd installer && node tests/configurators/pushover.test.js && node tests/configurators/git-user.test.js` |
| **Full suite command** | `cd installer && npm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd installer && node tests/configurators/pushover.test.js && node tests/configurators/git-user.test.js`
- **After every plan wave:** Run `cd installer && npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 21-01-01 | 01 | 1 | UFLOW-01 | integration | `cd installer && node tests/configurators/unified-flow.test.js` | W0 | pending |
| 21-01-02 | 01 | 1 | UFLOW-02 | integration | `cd installer && node tests/configurators/unified-flow.test.js` | W0 | pending |
| 21-01-03 | 01 | 1 | UFLOW-01 | integration | `cd installer && node tests/configurators/unified-flow.test.js` | W0 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `installer/tests/configurators/unified-flow.test.js` — integration test stubs for UFLOW-01, UFLOW-02
- [ ] Mock mechanism for enquirer Confirm/Input to avoid interactive hangs

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| End-to-end `npx` run with fresh environment | UFLOW-01 | Requires clean system state | Run installer with no env vars set, verify full prompts appear |
| End-to-end `npx` re-run with existing config | UFLOW-02 | Requires persisted env vars | Run installer after first setup, verify skip/update prompts |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
