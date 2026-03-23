---
phase: 19
slug: installation-verification
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 19 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.3.0 |
| **Config file** | installer/jest.config.js (自动检测) |
| **Quick run command** | `cd installer && npm test -- tests/verification/index.test.js` |
| **Full suite command** | `cd installer && npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd installer && npm test -- tests/verification/<specific-file>.test.js`
- **After every plan wave:** Run `cd installer && npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 19-01-01 | 01 | 1 | VER-01 | unit | `cd installer && npm test -- tests/verification/runner.test.js` | ❌ W0 | ⬜ pending |
| 19-01-02 | 01 | 1 | VER-02 | unit | `cd installer && npm test -- tests/verification/parser.test.js` | ❌ W0 | ⬜ pending |
| 19-01-03 | 01 | 1 | VER-02, VER-03 | unit | `cd installer && npm test -- tests/verification/formatter.test.js` | ❌ W0 | ⬜ pending |
| 19-01-04 | 01 | 1 | VER-04 | unit | `cd installer && npm test -- tests/verification/index.test.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `installer/tests/verification/index.test.js` — 集成测试,验证完整流程 (VER-04)
- [ ] `installer/tests/verification/runner.test.js` — 测试 Python 脚本执行和错误处理 (VER-01)
- [ ] `installer/tests/verification/parser.test.js` — 测试输出解析逻辑 (VER-02)
- [ ] `installer/tests/verification/formatter.test.js` — 测试表格格式化 (VER-02, VER-03)
- [ ] Framework install: 无需安装,Jest 已在 Phase 14 安装

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 实际 Python 环境验证 | VER-01 | 需要真实的 Python 环境和系统依赖 | 手动运行 `npx @allanpk716/work-skills-setup --verify` 并验证输出 |
| 表格显示效果 | VER-02 | 终端颜色和布局需要人工确认视觉效果 | 手动运行安装器,观察表格格式是否与 Phase 15 一致 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
