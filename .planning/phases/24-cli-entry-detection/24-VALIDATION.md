---
phase: 24
slug: cli-entry-detection
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-30
---

# Phase 24 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest ^30.3.0 |
| **Config file** | package.json scripts.test |
| **Quick run command** | `cd installer && npx jest tests/cli.test.js tests/uninstall/ -x` |
| **Full suite command** | `cd installer && npm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd installer && npx jest tests/cli.test.js tests/uninstall/ -x`
- **After every plan wave:** Run `cd installer && npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 24-01-01 | 01 | 1 | CLI-01 | unit | `cd installer && npx jest tests/cli.test.js -t "uninstall" -x` | Partial | pending |
| 24-01-02 | 01 | 1 | CLI-02 | unit | `cd installer && npx jest tests/cli.test.js -t "help" -x` | Needs new | pending |
| 24-01-03 | 01 | 1 | CLI-03 | unit | `cd installer && npx jest tests/cli.test.js -t "version" -x` | Existing | pending |
| 24-02-01 | 02 | 1 | PLUG-01 | unit | `cd installer && npx jest tests/uninstall/detector.test.js -x` | Wave 0 | pending |
| 24-02-02 | 02 | 1 | ENV-01 | unit | `cd installer && npx jest tests/uninstall/detector.test.js -x` | Wave 0 | pending |
| 24-03-01 | 03 | 1 | UX-04 | unit | `cd installer && npx jest tests/uninstall/formatter.test.js -x` | Wave 0 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `installer/tests/uninstall/detector.test.js` — stubs for PLUG-01, ENV-01
- [ ] `installer/tests/uninstall/formatter.test.js` — stubs for UX-04
- [ ] `installer/tests/uninstall/index.test.js` — stubs for CLI-01 integration
- [ ] `installer/tests/cli.test.js` — add --uninstall test cases
- [ ] `installer/tests/index.test.js` — add uninstallOnly routing test case

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| npx --uninstall triggers uninstall flow | CLI-01 | Requires actual npx execution | Run `npx @allanpk716/work-skills-setup --uninstall` manually |
| Bilingual output respects system language | UX-04 | Requires locale switching | Run with --lang en and --lang zh |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
