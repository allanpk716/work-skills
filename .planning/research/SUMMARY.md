# Project Research Summary

**Project:** Claude Code Global Skill - Task Notification System (claude-notify)
**Domain:** Claude Code Skills / Developer Tooling / Notification Infrastructure
**Researched:** 2026-02-24
**Confidence:** HIGH

## Executive Summary

这是一个 Claude Code 全局技能项目，用于在任务完成时发送通知（移动推送和桌面通知）。与传统的应用软件不同，通知系统是"基础设施"类型的产品——用户只在它失败或过度打扰时才会注意到它。因此，**静默成功**是核心目标，可靠性比功能丰富更重要。

研究显示，成功的通知技能需要：**快速执行（5秒超时限制）、多通道冗余（Pushover + Windows Toast）、优雅降级（可选功能失败不影响核心通知）**。技术选型上，应使用 Python 标准库（urllib.request、pathlib）避免外部依赖，使用 ThreadPoolExecutor 并行发送通知以满足超时要求。关键风险包括：Hook 超时导致通知丢失、Windows 路径编码问题、环境变量作用域混淆。这些风险必须在 Phase 1 设计阶段就予以解决。

## Key Findings

### Recommended Stack

**核心理念：零外部依赖，使用 Python 标准库。**

全局技能应该保持最小依赖，避免用户安装复杂的环境。Python 3.6+ 在 Windows 10+ 预装，所有功能都可通过标准库实现。

**Core technologies:**
- **Python 3.6+ (标准库)**: 核心开发语言 — Claude Code hooks 标准语言，Windows 10+ 预装
- **urllib.request (标准库)**: HTTP 请求 — 调用 Pushover API，无需安装 requests 库
- **pathlib (标准库)**: 路径操作 — 跨平台兼容，面向对象接口，优于 os.path
- **subprocess.run (标准库)**: 调用外部命令 — 执行 Claude CLI 生成摘要，PowerShell 发送通知
- **ThreadPoolExecutor (标准库)**: 并行执行 — 同时发送 Pushover 和 Windows 通知，满足 5 秒超时
- **os.environ (标准库)**: 环境变量 — 安全存储 API 密钥（PUSHOVER_TOKEN, PUSHOVER_USER）

### Expected Features

**与竞争对手分析：** cc-pushover-hook 已有成熟实现，本研究目标是将其转化为全局技能，降低安装复杂度。

**Must have (table stakes / MVP v1):**
- **Task completion notification (Stop hook)** — 用户核心需求：知道 AI 任务何时完成
- **Pushover remote notification** — 移动推送，开发者离开电脑时也能收到通知
- **Windows desktop notification (PowerShell/BurntToast)** — 桌面通知，本地提醒
- **Environment variable configuration** — 安全配置，API 密钥不应硬编码
- **Project name extraction** — 使用 CLAUDE_PROJECT_DIR 提取项目名，通知中显示上下文
- **Hook timeout compliance** — 5 秒内完成，否则 Claude Code 会杀死 Hook 进程
- **Basic error handling** — 失败静默，日志记录用于调试

**Should have (differentiators / v1.x):**
- **AI-generated task summaries (Claude CLI)** — 丰富的通知内容，但可能超时，需要降级策略
- **Smart notification filtering** — 过滤 idle_prompt，减少噪音，避免通知疲劳
- **Multi-instance support (PID isolation)** — 多个 Claude Code 会话并发运行
- **Per-project disable controls (.no-pushover, .no-windows)** — 细粒度控制，零配置退出机制
- **Automatic log rotation** — 自动清理旧日志，防止磁盘空间耗尽

**Defer (v2+):**
- **Additional notification channels (Slack, Discord, Telegram)** — 扩展渠道，但增加复杂度
- **Cross-platform support (macOS, Linux)** — 跨平台，但稀释焦点
- **Notification history dashboard** — 历史记录，需要持久化存储和 UI

### Architecture Approach

Claude Code 使用**插件生态系统架构**，支持 Skills、Hooks、Commands、Plugins、MCP 等多种扩展机制。本项目作为**全局技能**，安装在 `~/.claude/skills/claude-notify/`，通过 **Stop Hook** 在任务完成时触发通知脚本。

**Major components:**

1. **Skill Definition (SKILL.md)** — 技能元数据和核心指令，采用**渐进式披露**模式（Layer 1: 元数据 → Layer 2: 完整指令 → Layer 3: 资源文件 → Layer 4: 执行）
2. **Notification Script (notify.py)** — 主执行脚本，读取 stdin JSON（Hook 输入），并行发送 Pushover + Windows 通知，处理超时和错误
3. **Hook Configuration (~/.claude/settings.json)** — 注册 Stop Hook，配置命令和超时（5 秒）
4. **Environment Variables (System Level)** — 存储 PUSHOVER_TOKEN 和 PUSHOVER_USER，全局技能无法使用项目级 .env 文件
5. **Debug Logs (~/.claude/logs/claude-notify/)** — 调试日志，按日期轮转，保留最近 5 天

**数据流：**
```
[Claude Code Stop Event]
  → [Hook reads stdin JSON] (cwd, session_id, etc.)
  → [Extract project name from CLAUDE_PROJECT_DIR]
  → [Optional: Generate AI summary via Claude CLI]
  → [ThreadPoolExecutor: Parallel send Pushover + Windows]
  → [Log results, exit within 5s]
```

### Critical Pitfalls

**Top 5 pitfalls with prevention strategies:**

1. **Hook Timeout Violations** — Hook 超过 5 秒被 Claude Code 杀死，通知从未发送
   - **预防:** 使用 `ThreadPoolExecutor` 并行发送，所有 subprocess 调用设置 `timeout=10`，考虑 `async: true` 非阻塞执行

2. **Environment Variable Scope Confusion** — 全局技能无法访问项目级 .env 文件，配置失败
   - **预防:** 要求系统级环境变量（Windows: System Properties > Environment Variables），提供诊断脚本验证配置

3. **Windows Path Encoding Issues** — stdin JSON 包含未转义的反斜杠（`C:\path`），`json.loads()` 失败
   - **预防:** 预处理 stdin 数据 `stdin_data.replace("\\", "\\\\")`，强制 UTF-8 编码，记录原始输入用于调试

4. **Multiple Notification Channel Fallback Failures** — 一个通道失败（Pushover API 不可用），整个 Hook 失败
   - **预防:** 每个通道独立捕获异常，使用 ThreadPoolExecutor 的 futures 独立执行，返回 `{"pushover": True, "windows": False}` 状态字典

5. **Alert Fatigue (通知疲劳)** — 过度通知导致用户忽略重要提醒
   - **预防:** 仅在 Stop（任务完成）和 Notification（需要用户关注）时发送，过滤 idle_prompt，使用 `.no-pushover` 文件让用户控制

## Implications for Roadmap

基于研究，建议分为 3 个阶段：

### Phase 1: Core Implementation (MVP)

**Rationale:** 必须首先实现核心通知功能，验证架构可行性。全局技能的安装和配置是基础，5 秒超时限制必须在设计阶段解决（并行执行、错误隔离）。

**Delivers:** 可工作的全局通知技能，支持 Pushover + Windows 通知，基本错误处理

**Addresses:**
- Table stakes features: Task completion notification, Pushover notification, Windows desktop notification, Environment variable config, Project name extraction, Hook timeout compliance

**Avoids:**
- Pitfall 1 (Hook timeout) — 设计并行执行架构
- Pitfall 2 (Environment variable scope) — 清晰文档说明系统级环境变量设置
- Pitfall 3 (Windows path encoding) — 预处理 stdin JSON
- Pitfall 4 (Fallback failures) — 每个通道独立错误处理

**Key decisions:**
- 使用 Python 标准库，零外部依赖
- 全局技能模式（~/.claude/skills/claude-notify/），而非项目级安装
- ThreadPoolExecutor 并行发送通知
- 降级策略：Claude CLI 摘要失败时使用固定消息模板

### Phase 2: Testing & Polish (v1.x features)

**Rationale:** 核心功能稳定后，添加提升用户体验的功能：AI 摘要、智能过滤、多实例支持、项目级控制。

**Delivers:** 增强版通知技能，AI 生成摘要，智能过滤噪音，多会话并发支持

**Uses:**
- Claude CLI (subprocess.run) for AI summaries
- PID-based file isolation for multi-instance
- .no-pushover / .no-windows files for per-project control

**Implements:**
- Architecture Pattern 3 (Hook-based Event System) — 支持 UserPromptSubmit Hook 缓存用户提示
- Smart filtering logic — 解析 hook event 类型，过滤 idle_prompt

**Avoids:**
- Pitfall 5 (Alert fatigue) — 实现智能过滤
- Log file bloat — 自动日志轮转

**Features from FEATURES.md:**
- AI-generated task summaries (v1.x)
- Smart notification filtering (v1.x)
- Multi-instance support (v1.x)
- Per-project disable controls (v1.x)
- Automatic log rotation (v1.x)

### Phase 3: Documentation & Distribution (Production-ready)

**Rationale:** 技能功能完整后，需要完善文档、诊断工具、安装脚本，使其达到生产就绪状态。

**Delivers:** 完整的用户文档、诊断脚本、安装脚本、测试用例

**Features:**
- diagnose.py — 验证环境变量、网络连接、Windows 通知权限
- test-pushover.py / test-windows.py — 独立测试每个通知通道
- README.md — 清晰的安装步骤、配置说明、故障排查
- Plugin marketplace 配置 — 支持通过 `/plugin install` 分发

**Addresses:**
- UX Pitfalls from PITFALLS.md — 提供诊断工具，避免 "It doesn't work" 无从下手
- Documentation gaps — 新用户能够跟随指南完成安装和配置

### Phase Ordering Rationale

1. **Phase 1 优先级最高** — 核心通知功能是价值基础，必须验证 5 秒超时约束下的可行性
2. **Phase 2 基于稳定性** — 在核心功能稳定后，添加增强功能（AI 摘要可能超时，需要降级策略）
3. **Phase 3 最后完善** — 文档和工具在生产就绪时才需要，MVP 阶段可以简化

**依赖关系：**
- Phase 2 的 AI 摘要依赖 Phase 1 的降级策略（Claude CLI 失败时使用模板）
- Phase 2 的多实例支持依赖 Phase 1 的日志系统设计
- Phase 3 的诊断工具依赖 Phase 1 和 Phase 2 的所有功能

**架构模式应用：**
- Phase 1: Pattern 3 (Hook-based Event System) — Stop Hook 触发通知
- Phase 1: Pattern 4 (Global vs Project Scope) — 全局技能安装
- Phase 2: Pattern 2 (Subagent Isolation) — 可选，如果 AI 摘要执行时间长，考虑子代理
- All phases: Pattern 1 (Progressive Disclosure) — SKILL.md 分层文档结构

### Research Flags

**Phases likely needing deeper research during planning:**

- **Phase 1 (Core Implementation):**
  - **Windows PowerShell 通知细节** — BurntToast vs Windows.UI.Notifications vs 经典气球通知，需要实际测试三种方法的兼容性（Windows 10 vs 11）
  - **Claude CLI 超时处理** — `claude --print` 生成摘要的典型执行时间，需要实测决定是否在 Phase 1 实现
  - **stdin JSON 格式** — Claude Code Stop Hook 的 stdin 格式文档不完整，需要实际捕获和验证

- **Phase 2 (Testing & Polish):**
  - **多实例并发冲突** — PID-based 文件隔离的实际测试，确保日志和缓存不冲突
  - **智能过滤规则** — idle_prompt vs permission_prompt vs elicitation_dialog 的区分规则，需要实际 Hook 事件数据

**Phases with standard patterns (skip research-phase):**

- **Phase 3 (Documentation & Distribution):**
  - 文档和诊断脚本有成熟的最佳实践，无需额外研究
  - Plugin marketplace 配置遵循 Claude Code 官方规范

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Python 标准库方案基于官方文档和现有实现（cc-pushover-hook），已验证可行 |
| Features | MEDIUM | 功能列表基于竞争对手分析和用户需求推断，但缺少实际用户访谈验证 |
| Architecture | HIGH | Claude Code 插件架构基于官方文档和社区资源，渐进式披露模式有成熟实践 |
| Pitfalls | HIGH | 陷阱基于 Claude Code 官方文档、社区讨论、现有实现的 bug 修复经验 |

**Overall confidence:** HIGH

### Gaps to Address

**Gap 1: 实际用户需求验证**
- **问题:** FEATURES.md 的功能优先级基于推断和竞争对手分析，未与真实用户验证
- **如何处理:** Phase 1 完成后，收集早期用户反馈，调整 Phase 2 和 Phase 3 的功能优先级

**Gap 2: Claude CLI 摘要执行时间**
- **问题:** AI 生成摘要可能超过 5 秒超时，但实际执行时间未知
- **如何处理:** Phase 1 实现时，使用 `timeout=30` 参数测试 Claude CLI 调用，如果典型耗时 < 3 秒则在 Phase 2 启用，否则降级为模板消息

**Gap 3: Windows 通知兼容性矩阵**
- **问题:** BurntToast、Windows.UI.Notifications、经典气球通知在不同 Windows 版本的兼容性未验证
- **如何处理:** Phase 1 实现三级降级（BurntToast → WinRT → Classic），在 Phase 3 测试 Windows 10/11 各版本的兼容性

**Gap 4: Hook stdin JSON 格式**
- **问题:** Claude Code 官方文档未完整描述 Stop Hook 的 stdin JSON 格式
- **如何处理:** Phase 1 实现时，记录原始 stdin 数据，更新文档以描述实际格式

**Gap 5: 跨版本 Python 兼容性**
- **问题:** Windows 10 预装的 Python 版本可能有差异（3.6, 3.7, 3.8 等）
- **如何处理:** Phase 1 仅使用 Python 3.6+ 兼容的标准库特性，Phase 3 测试多个 Python 版本的兼容性

## Sources

### Primary (HIGH confidence)

- **Claude Code 官方文档** — Hooks, Skills, Plugin 系统
  - https://claudefa.st/blog/tools/hooks/hooks-guide
  - https://code.claude.com/docs
- **Python 3.15 官方文档** — urllib.request, pathlib, subprocess, logging
  - `/websites/python_3_15`
- **原项目实现** — cc-pushover-hook
  - `C:/WorkSpace/cc-pushover-hook/` — 已验证的实现模式
- **Claude Code 技能架构** — 掘金、CSDN 技术分析
  - https://juejin.cn/post/7592540388298375231
  - https://m.blog.csdn.net/starzhou/article/details/157359729

### Secondary (MEDIUM confidence)

- **现代 Python 开发最佳实践** — Stuart Ellis
  - https://www.stuartellis.name/articles/python-modern-practices/
- **Python 环境变量管理** — Dagster
  - https://dagster.io/blog/python-environment-variables
- **Windows BurntToast 模块** — PowerShell 通知
  - https://github.com/Windos/BurntToast
- **Pushover API 文档** — 官方 API 参考
  - https://pushover.net/api
- **Claude Code Hooks Guardrails** — Paddo.dev
  - https://paddo.dev/blog/claude-code-hooks-guardrails/

### Tertiary (LOW confidence)

- **ClaudeLog Hooks Implementation** — 社区实现经验
  - https://www.claudelog.com/mechanics/hooks/
- **Notifiers Python Library** — 通知 SDK 比较参考
  - https://pypi.org/project/notifiers
- **AWS Well-Architected Framework** — 告警反模式
  - https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_monitor_aws_resources_notification_monitor.html
- **Atlassian IT Alerting Best Practices** — 通知疲劳研究
  - https://www.atlassian.com/incident-management/on-call/it-alerting

---

*Research completed: 2026-02-24*
*Ready for roadmap: yes*
