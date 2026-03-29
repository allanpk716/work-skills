# Phase 23: Detection & Regression Verification - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-29
**Phase:** 23-detection-regression-verification
**Areas discussed:** Verification approach, Old install cleanup, Test coverage

---

## Verification Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Run actual installer | 运行 npx 安装器，实际检查 SKILL.md 和 [installed] 标记 | ✓ |
| Automated tests only | 添加自动化测试模拟安装+检测流程 | |
| Both: tests + manual | 先写测试再手动确认 | |

**User's choice:** Run actual installer
**Notes:** 最小验证范围 — 只确认 DETECT-01/02/03 三个成功标准

## Old Install Cleanup

| Option | Description | Selected |
|--------|-------------|----------|
| No cleanup needed | cpSync 覆盖整个目录，旧结构自动被替换 | ✓ |
| Detect & warn old installs | 安装前检测旧结构并提示 | |
| Delete & reinstall | 安装前删除旧目录再重新安装 | |

**User's choice:** No cleanup needed
**Notes:** 安装器 cpSync 行为天然处理了旧结构覆盖问题

## Test Coverage

| Option | Description | Selected |
|--------|-------------|----------|
| No new tests | 手动验证足以确认修复有效 | ✓ |
| Add plugin-specific tests | 添加针对实际插件结构的测试用例 | |

**User's choice:** No new tests
**Notes:** 此阶段是验证性的，现有测试已覆盖基本 isPluginInstalled() 逻辑

## Claude's Discretion

- 手动验证的具体步骤和操作顺序
- 验证结果的记录方式

## Deferred Ideas

None — discussion stayed within phase scope

## Reviewed Todos (not folded)

- "Add slash commands to toggle notification channels" — Phase 13 已完成，关键词误匹配
