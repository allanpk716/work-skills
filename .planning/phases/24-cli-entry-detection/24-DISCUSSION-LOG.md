# Phase 24: CLI Entry & Detection - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-30
**Phase:** 24-cli-entry-detection
**Areas discussed:** Detection scope, Output format

---

## Detection Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Full detection | 检测全部 7 类安装痕迹（plugins, hooks, commands, marketplace, env vars, settings hooks, settings skills），Phase 25 不需要重复检测 | ✓ |
| Minimal detection | 只检测 plugins + env vars（如 requirements 所述），Phase 25 自行检测 hooks/commands/marketplace | |

**User's choice:** Full detection
**Notes:** Phase 25 需要清理所有 7 类组件，在 Phase 24 统一检测避免重复逻辑，也让用户在确认前看到完整清单。

---

## Detection Output Format

| Option | Description | Selected |
|--------|-------------|----------|
| Table (like Phase 15) | 按类别分组的表格，每行显示名称+状态+路径，彩色状态图标 | ✓ |
| Compact list | 简洁列表，每行一个检测项，图标标记已安装/未安装 | |
| Found-only list | 只列出已安装项目，未安装不显示 | |

**User's choice:** Table (like Phase 15)
**Notes:** 与已有环境检测报告风格一致，整齐专业。

---

## Claude's Discretion

- 表格具体样式（边框、列宽、颜色方案）
- i18n 翻译键命名规范 (uninstall.*)
- 检测函数代码组织方式
- Nothing-installed 时退出消息措辞
- --uninstall 与 --verify 互斥时的优先级处理

## Deferred Ideas

None — discussion stayed within phase scope
