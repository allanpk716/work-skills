# Claude Notify - Claude Code 全局通知技能

## What This Is

Claude Notify 是一个 Claude Code 全局技能,为所有 Claude Code 项目提供任务完成通知功能。当 Claude Code 完成任务响应或需要人工关注时,通过 Pushover 和 Windows 系统通知提醒用户,帮助开发者及时了解任务进度,特别适用于长时间运行的任务或需要权限审批的场景。

## Core Value

**让开发者在 Claude Code 执行任务时能够离开电脑,在任务完成或需要关注时及时收到通知。**

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] 将现有的 cc-pushover-hook 重构为 Claude Code 全局技能
- [ ] 支持从环境变量 CLAUDE_PROJECT_DIR 提取项目名称用于通知标题
- [ ] 保留 Pushover 推送通知功能
- [ ] 保留 Windows 系统通知功能
- [ ] 保留使用 AI 生成任务摘要的功能
- [ ] 通过环境变量管理 Pushover API 密钥 (PUSHOVER_TOKEN, PUSHOVER_USER)
- [ ] 支持多实例并发运行 (PID 隔离)
- [ ] 提供全局技能的安装和配置文档

### Out of Scope

- 项目级安装模式 (install.py 方式) — 本次只实现全局技能模式
- 需要关注通知 (Notification hook) — 简化实现,只保留任务完成通知
- Linux/macOS 系统通知 — 先专注 Windows 平台
- 配置文件管理方式 — 只支持环境变量配置

## Context

**原项目背景:**
- 源项目: `C:\WorkSpace\cc-pushover-hook`
- 原设计: 项目级安装,每个项目需要运行 install.py 安装 hook
- 已有功能: Pushover 通知、Windows 通知、AI 摘要、多实例支持

**迁移动机:**
1. 全局技能可以让所有项目自动获得通知能力,无需逐个项目安装
2. 之前在另一台电脑部署时遇到 hook 脚本路径不存在的问题
3. 需要验证全局安装模式下能否正确获取项目名称

**技术环境:**
- 目标系统: Windows 11
- Python 3.6+
- Claude Code CLI
- Pushover API

## Constraints

- **系统平台**: 主要支持 Windows 系统,需兼容 Windows 10+
- **Python 版本**: 需要 Python 3.6 或更高版本
- **网络依赖**: Pushover 通知需要能访问 api.pushover.net
- **环境变量**: 需要用户配置 PUSHOVER_TOKEN 和 PUSHOVER_USER 环境变量
- **Claude Code 限制**: Hook 命令必须能在 5 秒内完成 (timeout=5)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 使用环境变量存储 API 密钥 | 全局技能无法使用项目级配置,环境变量是标准做法 | — Pending |
| 技能名称改为 claude-notify | 更简洁通用,不局限于 pushover | — Pending |
| 移除项目级安装模式 | 简化实现,专注全局技能场景 | — Pending |
| 使用 CLAUDE_PROJECT_DIR 获取项目名 | Claude Code 提供的环境变量,包含完整路径可提取项目名 | — Pending |
| 保留多实例 PID 隔离 | 防止并发运行时的文件冲突,已在原项目中验证有效 | — Pending |

---
*Last updated: 2026-02-24 after initialization*
