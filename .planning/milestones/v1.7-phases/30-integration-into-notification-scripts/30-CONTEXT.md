# Phase 30: Integration into Notification Scripts - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

将 notify.py 和 notify-attention.py 中的本地 `get_project_name()` 函数替换为 flags.py 中基于向上查找的新版本。两个脚本在子目录中触发通知时显示项目根目录名称（如 "work-skills"），而非子目录名。

不包含新的查找逻辑实现（Phase 29 已完成）或新的通知功能。

</domain>

<decisions>
## Implementation Decisions

### 迁移策略
- **D-01:** 删除 notify.py 和 notify-attention.py 中的本地 `get_project_name()` 函数（各 14 行）
- **D-02:** 在两个脚本的现有 `from flags import check_notification_flags` 行中添加 `get_project_name`
- **D-03:** 调用点（notify.py:369, notify-attention.py:197）无需修改 — 函数签名相同（无参数，返回 str）

### 错误处理
- **D-04:** 保留调用点的 try/except 结构和 logger.info 日志，但调用 `get_project_name()` 时实际使用 flags.py 版本
- **D-05:** 异常回退值 "Claude Code" 保持不变 — 这是通知显示的安全网

### 测试策略
- **D-06:** 更新 test_notify.py 中的 3 个 `get_project_name` 测试，mock `flags.find_project_root` 替代 `os.getcwd`
- **D-07:** test_flags.py 已有 4 个测试覆盖 flags.py 的 `get_project_name()`，不需重复
- **D-08:** E2E 验证：从子目录触发通知，确认显示正确的项目根名称

### Claude's Discretion
- 具体的 mock 修改方式（patch 路径、返回值构造）
- 是否添加额外的集成测试
- 日志消息的精确措辞

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Implementation targets
- `plugins/claude-notify/hooks/scripts/notify.py` — 本地 `get_project_name()` 需删除（38-51 行），调用点在 369 行
- `plugins/claude-notify/hooks/scripts/notify-attention.py` — 本地 `get_project_name()` 需删除（38-51 行），调用点在 197 行
- `plugins/claude-notify/hooks/scripts/flags.py` — 新的 `get_project_name()` 实现（168-182 行），基于 `find_project_root()`

### Tests
- `plugins/claude-notify/tests/test_notify.py` — 需更新的 3 个测试（28-44 行），mock `os.getcwd` 需改为 mock `flags.find_project_root`
- `plugins/claude-notify/tests/test_flags.py` — 已有完整覆盖（13 个 TDD 测试），不需修改

### Prior context
- `.planning/phases/26-find-up-implementation/26-CONTEXT.md` — 共享模块模式决策（D-06/D-07/D-08）
- `.planning/phases/29-find-up-project-root-logic/29-VERIFICATION.md` — Phase 29 验证报告，确认函数实现正确

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `flags.py::get_project_name()`: Phase 29 实现的向上查找版本，已在 flags.py 中就绪
- `flags.py::find_project_root()`: 核心遍历逻辑，使用与 `check_notification_flags()` 相同的模式

### Established Patterns
- 两个脚本已有 `from flags import check_notification_flags` — 只需扩展导入列表
- test_notify.py 使用 `unittest.mock.patch` 模式，需保持一致
- 错误处理模式：try/except + logger + "Claude Code" 回退值

### Integration Points
- notify.py line 21: `from flags import check_notification_flags` — 添加 `get_project_name`
- notify.py line 369: `project_name = get_project_name()` — 调用点不变
- notify-attention.py line 21: 同上
- notify-attention.py line 197: 同上

</code_context>

<specifics>
## Specific Ideas

- 迁移后从项目子目录（如 `plugins/claude-notify/hooks/scripts/`）触发通知，应显示 "work-skills" 而非 "scripts"
- 这是最后一步 — Phase 29 实现逻辑，Phase 30 集成使用，里程碑 v1.7 完成

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 30-integration-into-notification-scripts*
*Context gathered: 2026-04-04*
