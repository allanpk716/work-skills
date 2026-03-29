# Work Skills - Claude Code 个人技能集

## What This Is

Work Skills 是一个 Claude Code 技能集合项目,包含通知插件(claude-notify)、Git 安全扫描(windows-git-commit)和独立 NPX 安装器。安装器支持智能配置检测,能自动识别已有环境配置并适配首次安装或重复运行场景。用户通过 `npx @allanpk716/work-skills-setup` 一键完成环境检测、依赖安装、配置引导和插件安装。

## Core Value

**为 Windows 开发者提供即开即用的 Claude Code 技能,自动化重复性工作,让开发者专注于创造性任务。**

## Requirements

### Validated

**v1.0 - Claude Notify 插件 (shipped 2026-02-24):**
- ✓ 将 cc-pushover-hook 重构为全局技能
- ✓ 支持从 CLAUDE_PROJECT_DIR 提取项目名称
- ✓ Pushover 推送通知
- ✓ Windows 系统通知
- ✓ AI 生成任务摘要
- ✓ 环境变量管理 API 密钥
- ✓ 多实例并发运行(PID 隔离)
- ✓ 完整的安装和配置文档

**v1.1 - Git Security Scanning (shipped 2026-02-27):**
- ✓ 敏感信息检测(密钥、密码、私钥、PGP、PEM) - Phase 6, 11
- ✓ 缓存文件检测(Python、Node.js、编译产物、临时文件) - Phase 6
- ✓ 配置文件泄露检测(.env、credentials 等) - Phase 6
- ✓ 内部信息检测(IP、域名、邮箱) - Phase 8
- ✓ 在 git commit 前自动扫描暂存区 - Phase 7
- ✓ 发现敏感信息时阻止提交并显示详细提示 - Phase 7
- ✓ 彩色表格格式的问题报告(按严重性分级) - Phase 7, 10
- ✓ 双语支持(中英文提示) - Phase 10
- ✓ 基于 .gitignore 的自定义规则和白名单 - Phase 7, 8
- ✓ Windows 性能优化(16.77ms 扫描时间,比要求快 116 倍) - Phase 9
- ✓ 紧急跳过扫描选项(带明确风险警告) - Phase 9, 12

**v1.2 - Installer (shipped 2026-03-28):**
- ✓ NPX 安装器 — `npx @allanpk716/work-skills-setup` 一键安装
- ✓ Windows 系统检测与错误提示 - Phase 14
- ✓ 双语支持 (中英文, 自动检测系统语言) - Phase 14
- ✓ 欢迎横幅和功能介绍 (boxen 美化) - Phase 14
- ✓ CLI 选项 (--help, --version, --lang, --no-color, --verify) - Phase 14, 19
- ✓ 环境依赖检测 (Python, Git, TortoiseGit/PuTTY, pip packages) - Phase 15
- ✓ 交互式 Python 依赖安装 (pip --user, 错误检测) - Phase 16
- ✓ Pushover 凭证配置 (API 验证, setx 持久化) - Phase 17
- ✓ Git SSH 和用户配置引导 - Phase 17
- ✓ Claude Code 技能市场集成 (注册, 发现, 安装插件) - Phase 18
- ✓ 安装后自动验证 (--verify 独立重验) - Phase 19
- ✓ 通知渠道切换命令 (/notify-enable, /notify-disable) - Phase 13

**v1.3 - 智能配置检测 (shipped 2026-03-29):**
- ✓ Pushover 凭证双源检测 — process.env + Windows 注册表回退 - Phase 20
- ✓ Git 用户信息检测 — git config --global 读取 - Phase 20
- ✓ Per-item Confirm 交互 — 4 种场景(双有/仅有 token/仅有 user/均无) - Phase 20
- ✓ 统一安装流程 — 首次安装和重复运行自动适配,零检测开销 - Phase 21
- ✓ 14 个集成测试覆盖全部 UFLOW 场景 - Phase 21

**v1.4 - 修复插件安装检测 (shipped 2026-03-29):**
- ✓ windows-git-commit 插件目录结构扁平化 - Phase 22
- ✓ 安装器 isPluginInstalled() 检测与实际插件结构一致 - Phase 23
- ✓ 重复运行安装器自动跳过已安装插件 - Phase 23

### Active

*(No active requirements — v1.4 milestone complete)*

### Out of Scope

| Feature | Reason |
|---------|--------|
| Linux/macOS 支持 | 项目专注于 Windows 开发环境 |
| 自动下载安装 Python/Git | 超出安装器职责范围,只提供检测和指导 |
| GUI 安装界面 | CLI 交互已足够,GUI 增加复杂度 |
| 自动配置 Pageant 密钥 | 需要用户手动操作,安全考虑 |
| 静默安装模式 (--quiet) | 未来版本考虑 |
| 配置文件导出/导入 | 未来版本考虑 |
| Git SSH 配置检测 | v1.3 明确排除,SSH 配置仍走原始引导流程 |
| 已安装插件检测 | v1.3 明确排除,在 v1.4 中修复 |

## Context

**项目背景:**
- 多技能集合仓库,为个人开发工作提供 Claude Code 技能
- v1.0 完成了 claude-notify 通知插件,已发布并投入使用
- v1.1 完成了 windows-git-commit 安全扫描功能,生产就绪
- v1.2 完成了独立 NPX 安装器,实现一步到位的安装体验
- v1.3 完成了智能配置检测,安装器能自动适配首次安装和重复运行

**技术环境:**
- 目标系统: Windows 10/11
- 开发语言: Python 3.6+, Bash scripts, Node.js/JavaScript (CJS)
- 依赖工具: Git, TortoiseGit/PuTTY, Node.js
- 分发方式: NPX 安装器 + Claude Code 插件市场

**当前状态 (v1.4 完成):**
- v1.4 milestone 完成 — 插件安装检测已修复并验证
- Phase 22: 插件结构扁平化 ✓
- Phase 23: 检测回归验证 ✓
- 所有里程碑均已完成

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| NPX 独立安装器 | 用户无需克隆仓库,一键安装 | ✓ Validated (v1.2) |
| TDD 开发流程 (Wave 0 测试骨架) | 测试先行,减少 bug | ✓ Validated (Phase 16, 19) |
| CJS 而非 ESM | chalk/boxen 兼容性 | ✓ Applied (Phase 14) |
| enquirer 交互提示 | 简单 API,维护良好 | ✓ Validated (Phase 16-18) |
| pip --user 标志 | 避免 Windows 权限问题 | ✓ Validated (Phase 16) |
| Pushover API 验证后保存 | 确保凭证有效 | ✓ Validated (Phase 17) |
| Git shallow clone (--depth 1) | 插件安装更快速 | ✓ Validated (Phase 18) |
| 在 git commit 前扫描 | 能捕获已暂存的问题 | ✓ Validated (Phase 7) |
| 阻止提交而非警告 | 强制用户处理安全问题 | ✓ Validated (Phase 7) |
| ASCII 字符替代 Unicode | Windows GBK 编码兼容性 | ✓ Applied (Phase 7) |
| 双语支持 | 提升用户体验 | ✓ Validated (Phase 10, 14) |
| 并行检测 (Promise.all) | 提高环境检测速度 | ✓ Validated (Phase 15) |
| 双源检测 (process.env + registry) | setx 持久化值不在当前 process.env 中 | ✓ Validated (Phase 20) |
| Per-item Confirm 模式 | 每项独立处理,支持部分配置 | ✓ Validated (Phase 20) |
| 统一流程 (无单独 update 命令) | 减少用户认知负担 | ✓ Validated (Phase 21) |
| Detection-level 测试策略 | 避免交互式 prompt mock 复杂度 | ✓ Applied (Phase 21) |

## Current Milestone: v1.4 修复插件安装检测

**Goal:** 修复 windows-git-commit 插件重复运行时始终提示安装的问题。

**Target features:**
- 修复 windows-git-commit 插件 SKILL.md 路径结构
- 确保 isPluginInstalled() 检测与实际安装路径一致
- 更新安装时自动跳过已安装且无需更新的插件

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-29 — v1.4 milestone complete*
