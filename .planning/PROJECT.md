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

**v1.1 - Windows Git Commit Security Scanning (2026-02-27):**
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
- ✓ 完整的测试覆盖(12/12 测试通过) - Phase 9

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
- v1.1 完成了 windows-git-commit 安全扫描功能,生产就绪

**技术环境:**
- 目标系统: Windows 10/11
- 开发语言: Python 3.6+, Bash scripts
- 依赖工具: Git, TortoiseGit/PuTTY, Node.js
- 分发方式: Claude Code 插件市场

**当前状态(v1.1 完成后):**
- claude-notify: v1.0 已完成并归档
- windows-git-commit: v1.1 安全扫描功能完成,生产就绪
- 代码量: ~2,000 行 Python 代码
- 测试覆盖: 12/12 测试通过
- 性能: 16.77ms 扫描时间(比目标快 116 倍)

## Next Milestone

**v1.2 待规划**

可能的增强方向:
- 性能监控和分析工具
- 代码质量检查集成
- 团队协作功能
- 更多检测规则(数据库连接串、加密货币钱包等)

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
| 分阶段交付检测器 | 降低复杂度,先核心再高级 | ✓ Validated (Phase 6-8) |
| 使用 Python 标准库 | 无外部依赖,Windows 预装 | ✓ Validated (Phase 6) |
| 双语支持 | 提升用户体验 | ✓ Validated (Phase 10) |
| 8KB 二进制文件采样 | 平衡性能和准确性 | ✓ Validated (Phase 9) |
| 紧急跳过机制 | 生产环境应急通道 | ✓ Validated (Phase 9, 12) |

---
*Last updated: 2026-02-27 after v1.1 milestone completion*
