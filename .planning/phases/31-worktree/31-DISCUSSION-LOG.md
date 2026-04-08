# Phase 31: Worktree 区分 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-08
**Phase:** 31-worktree
**Areas discussed:** Attention 标题格式, session_id 展示方式, 分支名长度处理

---

## Attention 标题格式

| Option | Description | Selected |
|--------|-------------|----------|
| A. 加分支 | `[project:branch] Attention Needed` — 与 Stop hook 一致，多 worktree 时能区分 | ✓ |
| B. 不加分支 | `[project] Attention Needed` — 保持现状，简洁 | |

**User's choice:** A. 加分支
**Notes:** Attention 标题与 Stop hook 保持一致的 `[project:branch]` 格式，多 worktree 并行时能区分来源

---

## session_id 展示方式

| Option | Description | Selected |
|--------|-------------|----------|
| A. 当前位置足够 | 保持 `Session: xxx` 在消息体第三行，已经可追溯 | ✓ |
| B. 提到标题中 | 放在第一行，如 `[Session: abc123...] Attention Needed` | |
| C. 标题+消息双显 | 消息体第一行 + 标题中截断显示前 8 位 | |

**User's choice:** A. 当前位置足够
**Notes:** 当前 `notify-attention.py` 第 195 行的 `Session: {session_id}` 格式已满足 WTREE-02 要求

---

## 分支名长度处理

| Option | Description | Selected |
|--------|-------------|----------|
| A. 完整显示 | 分支名通常很短（10-30字符），实际不会超限 | ✓ |
| B. 30字符截断 | 超过 30 字符时截断加...，防止极端情况 | |
| C. 50字符截断 | 超过 50 字符时截断加... | |

**User's choice:** A. 完整显示
**Notes:** 实际分支名远低于 Pushover 250 字符限制，无需截断逻辑增加复杂度

---

## Claude's Discretion

- `get_git_branch()` 的日志格式和详细程度
- 测试类/方法命名和结构
- 错误消息的具体措辞

## Deferred Ideas

None — discussion stayed within phase scope
