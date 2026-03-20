---
phase: 14
slug: installer-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 或 Vitest (Node.js CLI 测试) |
| **Config file** | installer/jest.config.js 或 installer/vitest.config.ts |
| **Quick run command** | `npm test -- --testPathPattern=installer` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10 seconds |

**Note:** 现有项目使用 Python pytest,安装器是独立的 Node.js 项目,需要独立的测试框架。

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --testPathPattern=<affected-file>`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 14-01-01 | 01 | 1 | INST-01 | integration | `npm test -- --testNamePattern="npx execution"` | ❌ W0 | ⬜ pending |
| 14-01-02 | 01 | 1 | INST-02 | unit | `npm test -- --testNamePattern="platform detection"` | ❌ W0 | ⬜ pending |
| 14-02-01 | 02 | 1 | INST-04 | unit | `npm test -- --testNamePattern="welcome"` | ❌ W0 | ⬜ pending |
| 14-02-02 | 02 | 1 | INST-03 | unit | `npm test -- --testNamePattern="i18n"` | ❌ W0 | ⬜ pending |
| 14-02-03 | 02 | 1 | INST-05 | unit | `npm test -- --testNamePattern="help\|version"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `installer/package.json` - npm 包配置
- [ ] `installer/jest.config.js` 或 `installer/vitest.config.ts` - 测试框架配置
- [ ] `installer/tests/setup.js` - 测试环境设置
- [ ] `installer/tests/cli.test.js` - CLI 命令测试
- [ ] Framework install: `npm install --save-dev jest` 或 `vitest`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| npx 实际执行 | INST-01 | 需要 npm registry 发布或本地 link | 1. `npm link` 2. `npx @allanpk716/work-skills-setup` 3. 验证输出 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
