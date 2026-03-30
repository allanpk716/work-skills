# Phase 25: Uninstall Execution & UX - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-30
**Phase:** 25-uninstall-execution-ux
**Areas discussed:** Confirmation flow, Summary before removal, Result report format, Removal order & abort handling

---

## Confirmation Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Y/N Confirm | 复用 enquirer Confirm，与 pushover.js/git-user.js 一致 | ✓ |
| Type-to-confirm | 要求用户输入 'yes'/'confirm'，更谨慎但增加操作成本 | |
| Two-step: table + confirm | 先展示表格再确认，本质等同于推荐方案 | |

**User's choice:** Y/N Confirm (enquirer Confirm)
**Notes:** 确认后一次性移除所有组件 (all-at-once)，不逐类别确认

---

## Confirmation Prompt Mode

| Option | Description | Selected |
|--------|-------------|----------|
| All-at-once | 一次确认后移除所有已安装组件 | ✓ |
| Per-category confirm | 每个类别单独确认，更安全但交互更多 | |

**User's choice:** All-at-once
**Notes:** 简化用户体验，一次确认完成所有操作

---

## Summary Before Removal

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse detection table | 直接复用 Phase 24 formatDetectionTable() | ✓ |
| New simplified 'will remove' list | 只显示将要删除的项目，不显示未安装的 | |

**User's choice:** Reuse detection table
**Notes:** 已有代码，无需重写。表格下方紧跟确认提示。

---

## Result Report Format

| Option | Description | Selected |
|--------|-------------|----------|
| Result table | 类似检测表格的 ASCII table，状态用 [v]/[x]/[-] 图标 | ✓ |
| Plain list | 简单列表：`* Plugin claude-notify... removed` | |
| Summary only (counts) | 只显示计数 | |

**User's choice:** Result table with green/red/gray icons
**Notes:** [v] Removed (绿) / [x] Failed (红) / [-] Skipped (灰)，末尾总结行

---

## Removal Order

| Option | Description | Selected |
|--------|-------------|----------|
| Functional first, env last | hooks→commands→plugins→marketplace→env vars | ✓ |
| Config first, files last | env vars→marketplace→hooks registration→文件 | |
| Order doesn't matter | 只要容错处理正确即可 | |

**User's choice:** Functional first, env last
**Notes:** 1.hook scripts 2.hook registration 3.commands 4.plugins 5.marketplace cache 6.marketplace source 7.env vars

---

## Ctrl+C Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Accept partial state | 标准CLI行为，Ctrl+C 中断后部分已移除，不回滚 | ✓ |
| Try to complete on interrupt | 尝试完成剩余操作（不实际可行） | |

**User's choice:** Accept partial state
**Notes:** 标准CLI行为

---

## Claude's Discretion

- 表格具体边框样式和列宽
- i18n 翻译键命名 (uninstall.remove.*)
- 移除函数的代码组织方式
- Ctrl+C 中断时的退出消息措辞
- Nothing-installed 场景已由 Phase 24 detector 处理

## Deferred Ideas

None — discussion stayed within phase scope
