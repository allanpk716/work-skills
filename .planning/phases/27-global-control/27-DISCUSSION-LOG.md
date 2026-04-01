# Phase 27: Global Control - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-01
**Phase:** 27-global-control
**Areas discussed:** 全局检测位置, 返回值设计, 斜杠命令支持

---

## 全局检测位置

| Option | Description | Selected |
|--------|-------------|----------|
| 内置同一函数 | 遍历结束后自动回退到 ~/.claude/，调用方无感知 | ✓ |
| 拆成独立函数 | 新增 check_global_flags()，调用方手动调用 | |

**User's choice:** 内置同一函数
**Notes:** 更简洁，notify.py/notify-attention.py 不需要改调用方式

---

## 返回值设计

| Option | Description | Selected |
|--------|-------------|----------|
| 新增 global_* 字段 | 添加 global_pushover_path / global_windows_path，与项目级路径分离 | ✓ |
| 复用现有字段 + 布尔标记 | 添加 is_global 标记区分来源 | |

**User's choice:** 新增 global_* 字段
**Notes:** Phase 28 诊断可直接区分来源，且不丢失"两个级别都有文件"的情况

---

## 斜杠命令支持

| Option | Description | Selected |
|--------|-------------|----------|
| 本 phase 实现 | 检测逻辑和命令操作都做好 | ✓ |
| 延后实现 | 只做检测逻辑，命令更新单独作为后续任务 | |

**User's choice:** 本 phase 实现
**Notes:** 完整功能交付，用户可直接用 /notify-disable --global 全局屏蔽

---

## Claude's Discretion

- flags.py 内部全局检测的具体代码位置
- notify-enable/disable 中 --global 参数的解析方式
- 日志中记录全局检测结果的详细程度
- notify-status.py 是否需要同步显示全局标志状态

## Deferred Ideas

None — discussion stayed within phase scope
