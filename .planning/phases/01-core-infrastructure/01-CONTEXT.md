# Phase 1: Core Infrastructure - Context

**Gathered:** 2026-02-24
**Status:** Ready for planning

<domain>
## Phase Boundary

在 Claude Code 任务完成时发送 Pushover 推送和 Windows 桌面通知,包含项目名称和 AI 生成的任务摘要,支持多实例并发运行。所有通知操作必须在 5 秒内完成,不会因为超时被 Claude Code 杀死。

</domain>

<decisions>
## Implementation Decisions

### 通知消息格式
- **Pushover 通知:** 标题显示项目名称,消息体包含 AI 摘要全文(最多 200 字符)
- **Windows Toast 通知:** 标题显示项目名称,消息体包含 AI 摘要全文(最多 200 字符)
- **项目名称获取:** 使用当前工作目录名称(最简单方案)
- **摘要长度限制:** 硬性截断到 200 字符,确保不会因为摘要过长导致超时

### 降级策略
- **Claude CLI 摘要生成失败时:** 降级消息格式为 "[项目名] 任务已完成"(包含项目名称提供上下文)
- **Claude CLI 摘要超时(>2秒)时:** 仅记录日志,不发送任何通知(避免超时风险)
- **Pushover API 调用失败时:** 记录错误日志但不中断 Hook 执行,不影响 Windows 通知发送
- **Windows Toast 调用失败时:** 降级到固定消息模板(最简单的兜底方案)

### 并发控制策略
- **通知发送模式:** Pushover 和 Windows 通知并行发送,任一通道成功即返回(平衡速度和可靠性)
- **并发隔离:** 每个会话使用独立的 PID 和日志文件,确保多实例运行时互不干扰
- **错误隔离:** 一个通知通道失败不影响另一个通道,各自独立处理错误

### 错误处理策略
- **环境变量缺失时(如 PUSHOVER_TOKEN 未设置):** 记录到专用错误日志文件,不发送通知,静默失败不影响 Claude Code 运行
- **日志存储位置:** 写入用户配置目录(如 %APPDATA%\claude-notify\logs)
- **日志文件命名:** claude-notify-YYYYMMDD-HHMMSS-PID.log(包含时间和 PID,易于追踪)
- **日志清理策略:** 自动删除 5 天前的日志文件,避免占用过多磁盘空间

### 超时时间控制
- **Claude CLI 摘要生成:** 2 秒超时(平衡速度和摘要质量)
- **Pushover API 调用:** 2 秒超时(与 Claude CLI 一致)
- **Windows Toast 调用:** 1 秒超时(快速失败,避免影响总体性能)
- **总体执行时间:** 严格控制在 5 秒内,确保不被 Claude Code 杀死

### 错误重试策略
- **Pushover API 调用失败:** 不重试,失败即返回(快速失败策略,避免超时)
- **Windows Toast 调用失败:** 不重试,直接降级到固定消息模板
- **Claude CLI 调用失败:** 不重试,直接使用降级消息

### 特殊字符处理
- **路径编码:** UTF-8 编码,不处理特殊字符(最简单方案,依赖系统默认处理)
- **中文字符支持:** 保持原样,不做转换或替换

### 通知配置
- **Pushover 优先级:** 正常优先级(0),不发出声音,避免打扰用户
- **Windows Toast 持久性:** 系统默认行为(由 Windows 设置决定),不做特殊配置

### Claude's Discretion
- Claude CLI 摘要生成的具体提示词设计
- Windows.UI.Notifications API 的具体调用方式
- 日志文件的具体格式和详细程度
- 错误日志的具体内容(堆栈跟踪、环境变量值等)

</decisions>

<specifics>
## Specific Ideas

- 通知应该简洁明了,用户一眼就能看出是哪个项目完成了任务
- 多个 Claude Code 会话同时运行时,各会话的通知应该独立,不能互相干扰
- 错误处理要安静,不能因为配置问题影响 Claude Code 的正常使用
- 超时控制要严格,5 秒限制是硬性约束,不能因为任何原因超时

</specifics>

<deferred>
## Deferred Ideas

- 通知图标自定义 — 属于 Phase 2 或 Phase 3 的增强功能
- 通知点击后打开项目目录 — 属于 Phase 2 的交互增强
- 历史通知记录查询 — 属于未来版本的功能
- 通知分组管理 — 属于未来版本的功能

</deferred>

---

*Phase: 01-core-infrastructure*
*Context gathered: 2026-02-24*
