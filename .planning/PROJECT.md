# Work Skills - Claude Code 个人技能集

## What This Is

Work Skills 是一个 Claude Code 技能集合项目,为日常开发工作提供自动化工具。目前包含 Git 工作流自动化(windows-git-commit)和任务完成通知(claude-notify)两个插件,帮助开发者在 Windows 环境下提高工作效率。

## Core Value

**为 Windows 开发者提供即开即用的 Claude Code 技能,自动化重复性工作,让开发者专注于创造性任务。**

## Requirements

### Validated

**v1.0 - Claude Notify 插件:**
- ✓ 将 cc-pushover-hook 重构为全局技能
- ✓ 支持从 CLAUDE_PROJECT_DIR 提取项目名称
- ✓ Pushover 推送通知
- ✓ Windows 系统通知
- ✓ AI 生成任务摘要
- ✓ 环境变量管理 API 密钥
- ✓ 多实例并发运行(PID 隔离)
- ✓ 完整的安装和配置文档

**v1.1 - Phase 7 扫描执行与报告:**
- ✓ 在 git commit 之前自动扫描暂存区内容
- ✓ 发现敏感信息时阻止提交并显示详细提示
- ✓ 支持基于 .gitignore 的自定义排除规则
- ✓ 彩色表格格式的问题报告(按严重性分级)
- ✓ 敏感信息脱敏显示和可操作的修复建议

### Active

**v1.1 - Windows Git Commit 安全扫描(继续):**
- [ ] 检测 AWS、Git 服务、通用 API 密钥等凭证 (Phase 6)
- [ ] 检测缓存文件、编译产物、临时文件 (Phase 6)
- [ ] 检测配置文件泄露(.env、credentials 等) (Phase 6)
- [ ] 检测内部信息(内网 IP、内部域名、邮箱) (Phase 8)
- [ ] 完整集成到 windows-git-commit 技能 (Phase 8)

### Out of Scope

**v1.1 排除:**
- 自动修复问题(只检测和提示)
- Linux/macOS 支持(专注 Windows)
- 独立的配置文件格式(复用 .gitignore)
- 实时文件监控(只在提交时扫描)

## Context

**项目背景:**
- 多技能集合仓库,为个人开发工作提供 Claude Code 技能
- v1.0 完成了 claude-notify 通知插件,已发布并投入使用
- v1.1 将为 windows-git-commit 添加安全扫描功能

**技术环境:**
- 目标系统: Windows 10/11
- 开发语言: Python 3.6+, Bash scripts
- 依赖工具: Git, TortoiseGit/PuTTY, Node.js
- 分发方式: Claude Code 插件市场

**当前状态:**
- claude-notify: v1.0 已完成并归档
- windows-git-commit: 基础功能稳定,准备添加安全扫描

## Current Milestone: v1.1 Git 安全扫描

**Goal:** 为 windows-git-commit 添加提交前安全扫描,防止敏感信息泄露

**Target features:**
- 敏感信息检测(密钥、密码、私钥)
- 缓存文件检测(Python、Node.js、编译产物)
- 配置文件泄露检测
- 内部信息检测(IP、域名、邮箱)
- 基于 .gitignore 的自定义规则
- 详细的问题提示和修复建议

## Constraints

- **系统平台**: 主要支持 Windows 系统,需兼容 Windows 10+
- **Python 版本**: 需要 Python 3.6 或更高版本
- **扫描性能**: 不能显著增加提交流程时间(目标 <2 秒)
- **误报率**: 需要平衡检测严格度和误报率
- **兼容性**: 不能破坏现有的 git 工作流

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 在 git commit 前扫描 | 能捕获已暂存的问题,避免进入版本历史 | ✓ Validated (Phase 7) |
| 复用 .gitignore 格式 | 无需学习新语法,用户熟悉 | ✓ Validated (Phase 7) |
| 阻止提交而非警告 | 强制用户处理安全问题,更安全 | ✓ Validated (Phase 7) |
| 显示详细问题信息 | 帮助用户快速定位和修复问题 | ✓ Validated (Phase 7) |
| 内置规则 + 自定义 | 覆盖常见场景,同时支持项目定制 | ✓ Validated (Phase 7) |
| ASCII 字符替代 Unicode | Windows GBK 编码兼容性 | ✓ Applied (Phase 7) |
| Fail-open 错误处理 | 允许扫描错误时继续提交 | ✓ Applied (Phase 7) |

---
*Last updated: 2026-02-26 after Phase 7 completion*
