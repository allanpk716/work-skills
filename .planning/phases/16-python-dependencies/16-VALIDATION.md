---
phase: 16
slug: python-dependencies
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-20
revised: 2026-03-20
---

# Phase 16 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.3.0 |
| **Config file** | installer/jest.config.js |
| **Quick run command** | `cd installer && npm test -- --testPathPattern=installers` |
| **Full suite command** | `cd installer && npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd installer && npm test -- --testPathPattern=installers`
- **After every plan wave:** Run `cd installer && npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 16-00-01 | 00 | 0 | — | unit | `test -f installer/tests/installers/pip-installer.test.js` | ✅ W0 | ⬜ pending |
| 16-00-02 | 00 | 0 | — | unit | `test -f installer/tests/installers/index.test.js` | ✅ W0 | ⬜ pending |
| 16-01-01 | 01 | 1 | DEPS-01 | unit | `npm test -- pip-installer.test.js` | ✅ W0 | ⬜ pending |
| 16-01-02 | 01 | 1 | DEPS-02 | unit | `npm test -- pip-installer.test.js` | ✅ W0 | ⬜ pending |
| 16-01-03 | 01 | 1 | DEPS-03 | unit | `npm test -- pip-installer.test.js` | ✅ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `installer/tests/installers/pip-installer.test.js` — 10 test cases for installPipPackage and getErrorGuidance
- [x] `installer/tests/installers/index.test.js` — 6 test cases for runInstaller and promptAndInstall
- [ ] `installer/src/installers/index.js` — installer module entry (Wave 1)
- [ ] `installer/src/installers/pip-installer.js` — pip installation logic (Wave 1)
- [ ] i18n keys for install messages in `installer/src/i18n/en.json` and `installer/src/i18n/zh.json` (Wave 1)

*Wave 0 test skeletons created. Implementation files created in Wave 1.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 实际 pip 安装到系统 | DEPS-02 | 单元测试使用 mock | 手动运行安装器,检查 requests 库是否真实安装 |
| 用户交互确认提示 | DEPS-01 | 需要 TTY 交互 | 手动运行安装器,验证确认提示显示和响应 |

*If none: "All phase behaviors have automated verification."*

---

## TDD Flow (Nyquist Compliant)

### Wave 0: RED Phase (Test Skeletons)
- Plan 16-00 creates test files with expected behavior
- Tests fail because implementation doesn't exist yet
- Commit: `test(16): add test skeletons for pip installer`

### Wave 1: GREEN Phase (Implementation)
- Plan 16-01 implements against test contracts
- Tests pass after implementation complete
- Commit: `feat(16): implement pip package auto-installation`

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
