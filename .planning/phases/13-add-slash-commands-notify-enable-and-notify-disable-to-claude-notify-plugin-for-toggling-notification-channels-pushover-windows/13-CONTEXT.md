# Phase 13: Add slash commands /notify-enable and /notify-disable to claude-notify plugin for toggling notification channels (pushover/windows) - Context

**Gathered:** 2026-02-27
**Status:** Ready for planning

<domain>
## Phase Boundary

为 claude-notify 插件创建三个斜杠命令（`/notify-enable`、`/notify-disable`、`/notify-status`），用于控制 Pushover 和 Windows Toast 通知通道的启用/禁用状态及查询当前状态。这些命令通过操作项目根目录的 `.no-pushover` 和 `.no-windows` 标志文件来实现控制。不包括添加新的通知通道或修改现有通知系统的核心功能。

</domain>

<decisions>
## Implementation Decisions

### 状态查询命令
- 添加 `/notify-status` 命令，用于查看当前通知通道状态
- 不支持参数，始终显示所有通道（pushover + windows）的状态
- 使用简洁状态显示：每个通道的启用/禁用状态
- 使用图标符号（✓/✗）表示状态，直观明了
- 示例输出格式：
  ```
  Pushover 通知: ✓ 已启用
  Windows 通知: ✗ 已禁用
  ```

### 命令参数设计
- `/notify-enable` 和 `/notify-disable` 命令**强制要求参数**（pushover 或 windows）
- 不支持无参数调用，必须明确指定要操作的通道
- 这确保操作的明确性，避免意外批量操作
- 示例：`/notify-disable pushover`（正确）、`/notify-disable`（错误）

### 操作反馈详细度
- 使用简洁确认消息，仅显示操作结果
- 幂等操作时明确提示"已处于该状态"
  - 例如：`/notify-disable pushover`（已是禁用状态）→ "Pushover 通知已处于禁用状态"
- 无批量操作反馈（因强制参数设计，不存在批量操作场景）
- 使用纯文本格式，不使用图标或 emoji，保持与 Claude 其他消息的一致性
- 反馈示例：
  - 成功禁用："Pushover 通知已禁用"
  - 已处于该状态："Pushover 通知已处于禁用状态"
  - 成功启用："Windows 通知已启用"

### 错误处理策略
- **无效参数**：显示详细帮助信息
  - 错误消息 + 正确用法示例 + 可用选项列表
  - 示例：`/notify-disable email` → "错误：无效参数 'email'。可用选项：pushover, windows。用法：/notify-disable <pushover|windows>"
- **文件操作失败**：立即停止执行
  - 权限问题、磁盘满等错误时，显示错误信息并停止
  - 不尝试继续执行其他操作
- **错误信息格式**：简洁明了
  - 避免技术术语，使用用户友好的语言
  - 包含明确的解决建议
- **参数缺失**：显示错误提示
  - 强制参数设计，无参数时提示用法
  - 示例：`/notify-disable` → "错误：缺少参数。用法：/notify-disable <pushover|windows>"

### 幂等性保证
- 所有命令操作都是幂等的
- 多次执行相同命令不会产生副作用
- 状态检查在操作前执行，避免不必要的文件操作
- 示例：
  - 已禁用时再次 disable → 提示已处于该状态，不重复创建文件
  - 已启用时再次 enable → 提示已处于该状态，不尝试删除不存在的文件

</decisions>

<specifics>
## Specific Ideas

- 命令数量：3 个斜杠命令
  - `/notify-enable <pushover|windows>` - 启用指定通道
  - `/notify-disable <pushover|windows>` - 禁用指定通道
  - `/notify-status` - 查询所有通道状态
- 标志文件位置：项目根目录（`.no-pushover`、`.no-windows`）
- 状态表示：文件存在 = 禁用，文件不存在 = 启用
- 用户体验优先：提供清晰的状态反馈和错误提示，避免用户困惑

</specifics>

<deferred>
## Deferred Ideas

- Toggle 切换命令（如 `/notify-toggle`）— 当前使用明确的 enable/disable 更清晰，避免用户不确定当前状态
- 全局通知控制（所有项目统一设置）— 当前仅支持项目级控制，全局控制需要额外的配置管理
- 通知延迟/定时发送 — 这属于通知调度功能，与当前的状态切换功能不同
- 通知通道扩展（邮件、Slack 等）— 属于新的通知渠道集成，是独立的功能模块

</deferred>

---

*Phase: 13-add-slash-commands-notify-enable-and-notify-disable-to-claude-notify-plugin-for-toggling-notification-channels-pushover-windows*
*Context gathered: 2026-02-27*
