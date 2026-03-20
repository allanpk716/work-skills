---
phase: 15
slug: environment-detection
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.3.0 |
| **Config file** | installer/jest.config.js |
| **Quick run command** | `cd installer && npm test -- --testPathPattern=detectors` |
| **Full suite command** | `cd installer && npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd installer && npm test -- --testPathPattern=<module>`
- **After every plan wave:** Run `cd installer && npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 15-01-01 | 01 | 1 | ENV-01 | unit | `npm test -- python.test.js` | ❌ W0 | ⬜ pending |
| 15-01-02 | 01 | 1 | ENV-02 | unit | `npm test -- git.test.js` | ❌ W0 | ⬜ pending |
| 15-02-01 | 02 | 1 | ENV-03 | unit | `npm test -- ssh-tools.test.js` | ❌ W0 | ⬜ pending |
| 15-03-01 | 03 | 1 | ENV-04 | unit | `npm test -- pip-package.test.js` | ❌ W0 | ⬜ pending |
| 15-04-01 | 04 | 1 | ENV-05 | unit | `npm test -- index.test.js` | ❌ W0 | ⬜ pending |
| 15-04-02 | 04 | 1 | ENV-06 | unit | `npm test -- index.test.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `installer/tests/detectors/python.test.js` — stubs for ENV-01
- [ ] `installer/tests/detectors/git.test.js` — stubs for ENV-02
- [ ] `installer/tests/detectors/ssh-tools.test.js` — stubs for ENV-03
- [ ] `installer/tests/detectors/pip-package.test.js` — stubs for ENV-04
- [ ] `installer/tests/detectors/index.test.js` — stubs for ENV-05, ENV-06
- [ ] `npm install winreg` — if not installed

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real environment detection on Windows | ENV-01..06 | Jest mocks external commands | Run `node installer/src/index.js` on real Windows machine |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
