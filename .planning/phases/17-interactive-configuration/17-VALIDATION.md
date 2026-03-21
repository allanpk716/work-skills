---
phase: 17
slug: interactive-configuration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 17 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in assert + execa for command testing |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `node installer/tests/{test-file}.js` |
| **Full suite command** | `node installer/tests/run-all.js` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node installer/tests/{task-specific-test}.js`
- **After every plan wave:** Run `node installer/tests/run-all.js`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 17-01-01 | 01 | 1 | CONF-01 | unit | `node tests/config-pushover-detect.js` | ❌ W0 | ⬜ pending |
| 17-01-02 | 01 | 1 | CONF-02 | integration | `node tests/config-pushover-input.js` | ❌ W0 | ⬜ pending |
| 17-01-03 | 01 | 1 | CONF-03 | integration | `node tests/config-pushover-save.js` | ❌ W0 | ⬜ pending |
| 17-02-01 | 02 | 1 | CONF-04 | unit | `node tests/config-git-ssh-detect.js` | ❌ W0 | ⬜ pending |
| 17-02-02 | 02 | 1 | CONF-05 | unit | `node tests/config-git-ssh-guide.js` | ❌ W0 | ⬜ pending |
| 17-02-03 | 02 | 1 | CONF-06 | integration | `node tests/config-git-user-detect.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `installer/tests/config-pushover-detect.js` — stubs for CONF-01
- [ ] `installer/tests/config-pushover-input.js` — stubs for CONF-02
- [ ] `installer/tests/config-pushover-save.js` — stubs for CONF-03
- [ ] `installer/tests/config-git-ssh-detect.js` — stubs for CONF-04
- [ ] `installer/tests/config-git-ssh-guide.js` — stubs for CONF-05
- [ ] `installer/tests/config-git-user-detect.js` — stubs for CONF-06
- [ ] `installer/tests/run-all.js` — test runner

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Pushover credential validation success | CONF-02 | Requires valid Pushover API credentials | 1. Run installer with test credentials<br>2. Verify API validation succeeds<br>3. Check environment variables set |
| Pushover credential validation failure | CONF-02 | Requires invalid credentials and retry flow | 1. Run installer with invalid credentials<br>2. Verify error message shown<br>3. Verify retry prompt appears |
| Environment variable persistence | CONF-03 | Requires terminal restart to verify setx effect | 1. Complete Pushover config<br>2. Restart terminal<br>3. Run `echo %PUSHOVER_TOKEN%` to verify |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
