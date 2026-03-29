---
phase: 20
slug: config-detection-smart-interaction
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-29
---

# Phase 20 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest ^30.3.0 |
| **Config file** | installer/jest.config.js |
| **Quick run command** | `cd installer && npm test -- --testPathPattern="configurators" --no-coverage` |
| **Full suite command** | `cd installer && npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd installer && npm test -- --testPathPattern="configurators" --no-coverage`
- **After every plan wave:** Run `cd installer && npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 20-01-01 | 01 | 1 | CFGD-01 | unit | `cd installer && npm test -- --testPathPattern="pushover" --no-coverage` | ✅ | ⬜ pending |
| 20-02-01 | 02 | 1 | CFGD-02, INTX-01 | unit | `cd installer && npm test -- --testPathPattern="git-user" --no-coverage` | ✅ | ⬜ pending |
| 20-03-01 | 03 | 1 | INTX-01, INTX-02, INTX-03 | unit | `cd installer && npm test -- --testPathPattern="configurators" --no-coverage` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `installer/tests/configurators/pushover.test.js` — 扩展：readRegistryEnvVar 测试、双源检测测试、逐项处理测试
- [ ] `installer/tests/configurators/git-user.test.js` — 扩展：Confirm 交互测试、部分配置测试、保留/重新输入测试

*Note: 现有测试使用自执行脚本格式（assert + test helper），Phase 20 测试应遵循相同格式保持一致性。*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 注册表读取实际值 | CFGD-01 | 需要 Windows 注册表有实际值 | `setx PUSHOVER_TOKEN test_value` → 运行安装器 → 验证检测到值 → `reg delete "HKCU\Environment" /v PUSHOVER_TOKEN` 清理 |
| Git user Confirm 交互 | INTX-02 | 需要 git config 有实际值 | `git config --global user.name "Test"` → 运行安装器 → 验证显示确认提示 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
