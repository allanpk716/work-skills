# Phase 31: Worktree 区分 - Context

**Gathered:** 2026-04-08
**Status:** Ready for planning

<domain>
## Phase Boundary

用户在多个 worktree 并行工作时，能从通知标题区分来源项目和分支，且 Attention 通知可追溯到具体会话。具体包括：通知标题格式升级为 `[project:branch]`，非 git 场景退化为 `[project]`，Attention 通知消息体包含 session_id。

</domain>

<decisions>
## Implementation Decisions

### 通知标题格式
- **D-01:** Stop hook 通知标题格式为 `[project:branch]`，非 git 仓库退化格式为 `[project]`
- **D-02:** Attention hook 通知标题也包含分支，格式为 `[project:branch] Attention Needed`，与 Stop hook 保持一致
- **D-03:** 分支名完整显示，不做截断处理（实际分支名通常 10-30 字符，远低于 Pushover 250 字符限制）

### session_id 展示
- **D-04:** session_id 保持当前消息体格式（第三行 `Session: {session_id}`），不需要更醒目的展示方式，已满足 WTREE-02 要求

### pre-existing bug 修复
- **D-05:** `find_project_root()` 需修复 worktree 场景：`.git` 在 worktree 中是文件而非目录，当前 `.is_dir()` 检查会失败。改为 `.exists()` 同时覆盖两种情况

### Claude's Discretion
- `get_git_branch()` 的日志格式和详细程度
- 测试类/方法命名和结构
- 错误消息的具体措辞

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Worktree 分支检测
- `.planning/phases/31-worktree/31-RESEARCH.md` — git 命令选择、worktree 场景分析、pitfall 列表、代码示例
- `.planning/ROADMAP.md` §Phase 31 — 成功标准、需求映射、依赖关系

### 需求定义
- `.planning/REQUIREMENTS.md` §WTREE-01, WTREE-02 — 需求详细描述和验收标准

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `flags.py` `find_project_root()` / `get_project_name()`: 已有向上遍历逻辑，新增 `get_git_branch()` 复用同一模块
- `notify.py` `main()` 第 353-373 行: 项目名获取和通知发送逻辑，需修改标题构建
- `notify-attention.py` 第 187 行: 标题构建逻辑，需添加分支

### Established Patterns
- `subprocess.run` + `capture_output=True` + `timeout`: 已用于 notify.py 调用 claude CLI，新函数保持相同模式
- 通知标题直接用 `project_name` 作为 `title` 参数传入 `send_*_notification()`: 需改为传入完整标题字符串

### Integration Points
- `flags.py` 是共享模块，notify.py 和 notify-attention.py 都 import 它
- 两个通知脚本的 `send_*_notification(title, message)` 函数签名不变，只改传入的 title 内容
- `find_project_root()` 被 `get_project_name()` 调用，修复 `.is_dir()` 为 `.exists()` 影响所有调用者

</code_context>

<specifics>
## Specific Ideas

- 分支检测用 `git branch --show-current`（git 2.22+，用户环境 2.45.1），subprocess.run 1s 超时
- 非 git / DETACHED HEAD / 超时 场景统一退化为 `[project]`，不显示任何占位符

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 31-worktree*
*Context gathered: 2026-04-08*
