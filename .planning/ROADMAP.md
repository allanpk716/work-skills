# ROADMAP: Claude Notify

**Created:** 2026-02-24
**Depth:** standard
**Core Value:** 让开发者在 Claude Code 执行任务时能够离开电脑,在任务完成或需要关注时及时收到通知

## Overview

Claude Notify 是一个 Claude Code 全局技能,通过 Pushover 和 Windows 系统通知为所有项目提供任务完成通知功能。本路线图将 29 个 v1 需求分为 3 个阶段,优先实现核心通知能力,然后完善配置和诊断,最后提供完整的文档和测试。

## Phases

- [ ] **Phase 1: Core Infrastructure** - 实现核心通知功能(Pushover + Windows),支持 AI 摘要和多实例并发
- [ ] **Phase 2: Configuration & Diagnostics** - 实现环境变量配置、项目级控制开关和诊断工具
- [ ] **Phase 3: Documentation & Testing** - 提供完整的安装文档、配置指南和测试验证脚本

## Phase Details

### Phase 1: Core Infrastructure

**Goal:** 用户能够在 Claude Code 任务完成时收到 Pushover 推送和 Windows 桌面通知

**Depends on:** Nothing (first phase)

**Requirements:**
- CORE-01: Hook 脚本在 Claude Code Stop 事件时自动执行
- CORE-02: Hook 脚本在 5 秒内完成执行
- CORE-03: 通知标题显示项目名称
- CORE-04: 支持多实例并发运行(PID 隔离)
- PUSH-01: 用户可通过环境变量配置 PUSHOVER_TOKEN 和 PUSHOVER_USER
- PUSH-02: 任务完成时发送 Pushover 通知到用户设备
- PUSH-03: Pushover 通知优先级为 0 (正常优先级)
- PUSH-04: Pushover 通知内容包含项目名称和任务摘要
- PUSH-05: Pushover API 调用失败时记录错误但不中断 Hook 执行
- WIND-01: 任务完成时发送 Windows Toast 通知
- WIND-02: 使用 PowerShell 调用 Windows.UI.Notifications 或 BurntToast
- WIND-03: Windows 通知标题显示项目名称
- WIND-04: Windows 通知内容包含任务摘要
- WIND-05: PowerShell 调用失败时降级到固定消息模板
- SUMM-01: 使用 Claude CLI 生成任务摘要
- SUMM-02: Claude CLI 调用失败时降级到固定消息
- SUMM-03: 摘要内容限制在 200 字符以内
- SUMM-04: 摘要生成在 2 秒内完成
- PARA-01: Pushover 和 Windows 通知并行发送
- PARA-02: 一个通知通道失败不影响另一个通道
- PARA-03: 所有通知操作在 5 秒内完成

**Success Criteria:**
1. 用户运行 Claude Code 任务后,任务完成时在手机上收到 Pushover 推送通知
2. 用户运行 Claude Code 任务后,任务完成时在 Windows 桌面收到 Toast 通知
3. 通知标题显示当前项目名称,通知内容包含任务摘要(或降级消息)
4. Hook 脚本在 5 秒内完成,不会因为超时被 Claude Code 杀死
5. 多个 Claude Code 会话同时运行时,各会话的通知互不干扰

**Plans:** 1 plan

- [ ] 01-01-PLAN.md — 实现 Claude Code 任务完成时的核心通知功能(Hook 配置、Claude CLI 摘要、Pushover 推送、Windows Toast 通知)

---

### Phase 01.1: 将 Hook 通知功能打包为可重用的 Claude Code Skill 插件 (INSERTED)

**Goal:** [Urgent work - to be planned]
**Depends on:** Phase 1
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd:plan-phase 01.1 to break down)

### Phase 2: Configuration & Diagnostics

**Goal:** 用户能够通过环境变量配置通知服务,使用诊断工具验证配置,并能够针对特定项目禁用通知

**Depends on:** Phase 1

**Requirements:**
- CONF-01: 通过系统环境变量配置 API 密钥
- CONF-02: 环境变量未设置时记录错误日志但不崩溃
- CONF-03: 支持通过 .no-pushover 文件禁用 Pushover 通知
- CONF-04: 支持通过 .no-windows 文件禁用 Windows 通知
- LOG-01: 所有错误和警告写入调试日志文件
- LOG-02: 日志文件按日期和 PID 命名
- LOG-03: 自动清理 5 天前的旧日志文件
- LOG-04: 提供诊断脚本验证环境配置和 API 连接

**Success Criteria:**
1. 用户可以通过 Windows 系统环境变量设置 PUSHOVER_TOKEN 和 PUSHOVER_USER
2. 用户可以在项目根目录创建 .no-pushover 文件禁用该项目的 Pushover 通知
3. 用户可以运行诊断脚本,验证环境变量配置和 Pushover API 连接状态
4. 错误和警告被记录到日志文件中,日志文件按日期自动轮转并保留最近 5 天
5. 环境变量缺失时,Hook 脚本记录错误但不崩溃,不影响 Claude Code 正常运行

**Plans:** TBD

---

### Phase 3: Documentation & Testing

**Goal:** 新用户能够通过文档完成安装和配置,开发者能够通过测试脚本验证功能正确性

**Depends on:** Phase 2

**Requirements:** None (this phase is documentation-focused)

**Success Criteria:**
1. 新用户能够按照 README.md 在 10 分钟内完成全局技能安装和环境变量配置
2. 新用户能够使用诊断脚本验证配置正确性,并在配置错误时获得清晰的错误提示
3. 开发者能够运行测试脚本验证 Pushover 通知、Windows 通知和 AI 摘要功能
4. 用户能够查阅故障排查文档解决常见问题(如超时、路径编码、API 连接失败)
5. 技能符合 Claude Code 插件市场规范,支持通过 /plugin install 安装

**Plans:** TBD

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Core Infrastructure | 0/3 | Not started | - |
| 2. Configuration & Diagnostics | 0/3 | Not started | - |
| 3. Documentation & Testing | 0/3 | Not started | - |

## Notes

- **技术选型:** 使用 Python 标准库,零外部依赖
- **核心约束:** Hook 脚本必须在 5 秒内完成执行
- **架构模式:** 全局技能安装,ThreadPoolExecutor 并行发送通知
- **降级策略:** Claude CLI 摘要失败时使用固定消息模板

---

*Roadmap created: 2026-02-24*
*Last updated: 2026-02-24*
