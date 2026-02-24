# Requirements: Claude Notify

**Defined:** 2026-02-24
**Core Value:** 让开发者在 Claude Code 执行任务时能够离开电脑,在任务完成或需要关注时及时收到通知

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Core Notification

- [ ] **CORE-01**: Hook 脚本在 Claude Code Stop 事件时自动执行
- [ ] **CORE-02**: Hook 脚本在 5 秒内完成执行(Claude Code 超时要求)
- [ ] **CORE-03**: 通知标题显示项目名称(从 CLAUDE_PROJECT_DIR 环境变量提取)
- [ ] **CORE-04**: 支持多实例并发运行(PID 隔离,避免缓存冲突)

### Pushover Integration

- [ ] **PUSH-01**: 用户可通过环境变量配置 PUSHOVER_TOKEN 和 PUSHOVER_USER
- [ ] **PUSH-02**: 任务完成时发送 Pushover 通知到用户设备
- [ ] **PUSH-03**: Pushover 通知优先级为 0 (正常优先级)
- [ ] **PUSH-04**: Pushover 通知内容包含项目名称和任务摘要
- [ ] **PUSH-05**: Pushover API 调用失败时记录错误但不中断 Hook 执行

### Windows Desktop Notification

- [ ] **WIND-01**: 任务完成时发送 Windows Toast 通知
- [ ] **WIND-02**: 使用 PowerShell 调用 Windows.UI.Notifications 或 BurntToast
- [ ] **WIND-03**: Windows 通知标题显示项目名称
- [ ] **WIND-04**: Windows 通知内容包含任务摘要
- [ ] **WIND-05**: PowerShell 调用失败时降级到固定消息模板

### AI Summary

- [ ] **SUMM-01**: 使用 Claude CLI 生成任务摘要(调用 claude --print)
- [ ] **SUMM-02**: Claude CLI 调用失败时降级到固定消息 "Claude task completed"
- [ ] **SUMM-03**: 摘要内容限制在 200 字符以内(Pushover 限制)
- [ ] **SUMM-04**: 摘要生成在 2 秒内完成(为其他操作留出时间)

### Configuration

- [ ] **CONF-01**: 通过系统环境变量配置 API 密钥(PUSHOVER_TOKEN, PUSHOVER_USER)
- [ ] **CONF-02**: 环境变量未设置时记录错误日志但不崩溃
- [ ] **CONF-03**: 支持通过 .no-pushover 文件禁用 Pushover 通知(项目级)
- [ ] **CONF-04**: 支持通过 .no-windows 文件禁用 Windows 通知(项目级)

### Logging & Diagnostics

- [ ] **LOG-01**: 所有错误和警告写入调试日志文件
- [ ] **LOG-02**: 日志文件按日期和 PID 命名 (debug.YYYY-MM-DD-pid-{pid}.log)
- [ ] **LOG-03**: 自动清理 5 天前的旧日志文件
- [ ] **LOG-04**: 提供诊断脚本验证环境配置和 API 连接

### Parallel Execution

- [ ] **PARA-01**: Pushover 和 Windows 通知并行发送(ThreadPoolExecutor)
- [ ] **PARA-02**: 一个通知通道失败不影响另一个通道
- [ ] **PARA-03**: 所有通知操作在 5 秒内完成

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Enhanced Features

- **ENHC-01**: 智能过滤 idle_prompt 通知(减少通知噪音)
- **ENHC-02**: 需要关注通知(Notification hook,高优先级)
- **ENHC-03**: 逐项目配置文件支持(.claude-notify.json)
- **ENHC-04**: 通知历史记录和查看功能
- **ENHC-05**: 支持自定义通知声音

### Platform Expansion

- **PLAT-01**: Linux 系统通知支持 (libnotify)
- **PLAT-02**: macOS 系统通知支持 (osascript)
- **PLAT-03**: 通知分组和批量发送

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| 每次工具使用都通知 | 导致通知过载,引起通知疲劳 |
| 配置文件管理 | 全局技能没有项目目录存放配置,使用环境变量 |
| 富 HTML 通知 | 跨平台支持不一致,增加复杂度 |
| 实时进度更新 | 超出 5 秒超时限制 |
| 响应内容包含在通知中 | 字符限制和隐私问题 |
| 项目级安装模式 | 维护负担,每个项目都要安装/更新 |
| 声音自定义 | 平台特定,复杂度高但价值低 |
| 多通知服务支持 (Telegram, Slack) | v1 专注 Pushover,验证需求后再扩展 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CORE-01 | Phase 1 | Pending |
| CORE-02 | Phase 1 | Pending |
| CORE-03 | Phase 1 | Pending |
| CORE-04 | Phase 1 | Pending |
| PUSH-01 | Phase 1 | Pending |
| PUSH-02 | Phase 1 | Pending |
| PUSH-03 | Phase 1 | Pending |
| PUSH-04 | Phase 1 | Pending |
| PUSH-05 | Phase 1 | Pending |
| WIND-01 | Phase 1 | Pending |
| WIND-02 | Phase 1 | Pending |
| WIND-03 | Phase 1 | Pending |
| WIND-04 | Phase 1 | Pending |
| WIND-05 | Phase 1 | Pending |
| SUMM-01 | Phase 1 | Pending |
| SUMM-02 | Phase 1 | Pending |
| SUMM-03 | Phase 1 | Pending |
| SUMM-04 | Phase 1 | Pending |
| CONF-01 | Phase 1 | Pending |
| CONF-02 | Phase 1 | Pending |
| CONF-03 | Phase 1 | Pending |
| CONF-04 | Phase 1 | Pending |
| LOG-01 | Phase 1 | Pending |
| LOG-02 | Phase 1 | Pending |
| LOG-03 | Phase 1 | Pending |
| LOG-04 | Phase 1 | Pending |
| PARA-01 | Phase 1 | Pending |
| PARA-02 | Phase 1 | Pending |
| PARA-03 | Phase 1 | Pending |

**Coverage:**
- v1 requirements: 29 total
- Mapped to phases: 29
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-24*
*Last updated: 2026-02-24 after initial definition*
