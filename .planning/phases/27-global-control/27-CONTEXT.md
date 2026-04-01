# Phase 27: Global Control - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

支持用户通过 `~/.claude/.no-pushover` 和 `~/.claude/.no-windows` 文件全局屏蔽所有项目的通知。查找优先级：项目级（向上遍历）优先，`~/.claude/` 全局作为回退。同时更新 notify-enable/notify-disable 命令支持 `--global` 参数。

不包含诊断模式更新（Phase 28）和新增测试覆盖（Phase 28）。

</domain>

<decisions>
## Implementation Decisions

### 全局检测集成
- **D-11:** 全局检测内置在 `check_notification_flags()` 中。项目级向上遍历结束后，对仍为 `disabled=False` 的渠道自动检查 `~/.claude/.no-xxx`。调用方（notify.py、notify-attention.py）无需改动调用方式
- **D-11a:** 检测顺序：先项目级遍历，后全局回退。项目级找到的标志优先级高于全局（GLOB-02）
- **D-11b:** `~/.claude/` 路径通过 `Path.home() / '.claude'` 获取，跨平台兼容

### 返回值设计
- **D-12:** 返回值新增 `global_pushover_path` 和 `global_windows_path` 字段（Optional[Path]）。`pushover_path`/`windows_path` 始终指项目级路径，`global_*` 单独记录全局路径
- **D-12a:** 完整返回值结构：
  ```python
  {
      'pushover_disabled': bool,
      'windows_disabled': bool,
      'pushover_path': Optional[Path],      # 项目级路径
      'windows_path': Optional[Path],       # 项目级路径
      'global_pushover_path': Optional[Path],  # ~/.claude/.no-pushover 路径
      'global_windows_path': Optional[Path],   # ~/.claude/.no-windows 路径
  }
  ```
- **D-12b:** Phase 28 诊断模式可直接通过 `global_*_path is not None` 区分来源

### 斜杠命令支持
- **D-13:** `notify-enable` / `notify-disable` 命令本 phase 一并支持 `--global` 参数
- **D-13a:** `--global` 模式下操作 `~/.claude/.no-xxx` 文件而非项目级 `.no-xxx` 文件
- **D-13b:** 无 `--global` 时行为不变（操作项目级文件）

### Claude's Discretion
- `check_notification_flags()` 内部全局检测的具体代码位置（函数末尾 vs 循环后独立段）
- `notify-enable.py` / `notify-disable.py` 中 `--global` 参数的解析方式
- 日志中记录全局检测结果的详细程度
- `notify-status.py` 是否需要同步显示全局标志状态

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Notification flag system
- `plugins/claude-notify/hooks/scripts/flags.py` — 共享 flags 模块，`check_notification_flags()` 实现位置，全局检测的改造目标
- `plugins/claude-notify/hooks/scripts/notify.py` — notify.py 调用方（第 372-373 行），验证无需改调用方式
- `plugins/claude-notify/hooks/scripts/notify-attention.py` — notify-attention.py 调用方，同上

### Slash commands
- `plugins/claude-notify/scripts/notify-enable.py` — 需添加 `--global` 支持
- `plugins/claude-notify/scripts/notify-disable.py` — 需添加 `--global` 支持
- `plugins/claude-notify/scripts/notify-status.py` — 可能需同步显示全局标志状态

### Tests
- `plugins/claude-notify/tests/test_flags.py` — 现有 flags 模块测试，需扩展全局场景
- `plugins/claude-notify/tests/test_notify_enable.py` — notify-enable 测试
- `plugins/claude-notify/tests/test_notify_disable.py` — notify-disable 测试
- `plugins/claude-notify/tests/test_notify_status.py` — notify-status 测试

### Prior context
- `.planning/phases/26-find-up-implementation/26-CONTEXT.md` — Phase 26 决策（D-01~D-10），向上遍历实现细节
- `.planning/phases/02-configuration-diagnostics/02-CONTEXT.md` — `.no-xxx` 文件机制设计
- `.planning/phases/13-add-slash-commands-notify-enable-and-notify-disable-to-claude-notify-plugin-for-toggling-notification-channels-pushover-windows/13-CONTEXT.md` — 斜杠命令操作标志文件的方式

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `flags.py:check_notification_flags()`: 已完成向上遍历逻辑，全局检测直接追加在函数末尾
- `test_flags.py`: 现有测试模式可扩展用于全局场景测试
- `notify-enable.py` / `notify-disable.py`: 已有参数解析模式可复用于 `--global`

### Established Patterns
- `Path.home()` 获取用户主目录
- `Path.is_file()` 检查文件存在
- 静默失败 + 日志记录的错误处理模式
- 测试使用 `unittest.mock.patch` 模拟文件系统

### Integration Points
- `flags.py` 函数末尾（第 99-104 行 return 之前）— 全局检测插入点
- `notify-enable.py` / `notify-disable.py` — 参数解析和文件操作逻辑
- Phase 28 的 `diagnose_configuration()` 将使用 `global_*` 字段

</code_context>

<specifics>
## Specific Ideas

- 全局路径 `~/.claude/` 与 Claude Code 配置目录一致，用户容易理解和定位
- 项目级优先于全局的设计让用户能精细控制：全局屏蔽但特定项目允许

</specifics>

<deferred>
## Deferred Ideas

- 诊断模式显示全局查找结果 — Phase 28
- 测试覆盖全局查找场景 — Phase 28
- 交互式全局通知开关命令 — Out of Scope（REQUIREMENTS.md）

</deferred>

---

*Phase: 27-global-control*
*Context gathered: 2026-04-01*
