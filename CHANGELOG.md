# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2026-06-26

### Removed
- **windows-git-commit 技能** — 移除 deprecated 的 Windows Git 工作流技能（scanner/hooks/references/tests/README/plugin.json 全部删除）
- **codepoint 技能链** — 移除 deprecated 的代码可观测性技能（根 SKILL.md + 8 个子技能 + templates/references）
- **docs/codepoint 与 docs/windows-git-commit 文档工作区** — 删除已弃用技能的调研/修复文档
- **installer git/ssh 检测器与配置器** — 移除 detectors/git.js、detectors/ssh-tools.js、configurators/git-ssh.js、configurators/git-user.js（仅服务已删技能）
- **installer marketplace 集成** — 移除整个 marketplace/ 目录（4 文件：index/config-manager/plugin-discovery/plugin-installer）
- **uninstall 中 marketplace 组件** — 卸载流程裁剪为仅清理 claude-notify 通知组件（5 类 / 5 步），移除 marketplace source 检测与移除类别

### Changed
- **installer 收窄为仅服务 claude-notify** — 单技能安装器形态，主流程去掉 marketplace 步骤与 git/ssh 配置步骤
- **i18n / welcome 横幅收窄** — en.json / zh.json 删除约 50 个 git/marketplace/多技能键，welcome 仅展示 claude-notify 通知特性
- **项目回归单一通知技能形态** — 根 README / package.json 元数据仅宣传 claude-notify
- **版本号 1.9.0 → 3.0.0** — v3.0 为破坏性变更（2/3 技能下线），主版本号升级

## [1.6.0] - 2026-04-01

### Added
- **通知标志文件向上查找** — `.no-pushover`/`.no-windows` 文件支持在父目录中向上查找，子目录中的 Claude Code 会话也能正确响应通知屏蔽
- **全局通知控制** — 在 `~/.claude/` 目录放置 `.no-xxx` 文件即可全局屏蔽所有项目的通知，无需逐项目配置
- **`--global` 参数** — `notify-enable`/`notify-disable` 命令支持 `--global` 参数操作全局标志
- **`notify-status` 来源标注** — 显示通知屏蔽来源（项目级/全局）和文件路径
- **诊断模式增强** — `diagnose_configuration()` 显示项目级和全局级的标志文件检测结果
- **共享 flags.py 模块** — 提取公共的 `check_notification_flags()` 为独立模块，消除 notify.py 和 notify-attention.py 中的重复代码

### Changed
- 通知标志文件查找优先级：项目级 > 全局级（`~/.claude/`）
- `check_notification_flags()` 返回值扩展为 6 个键，新增 `global_pushover_path` 和 `global_windows_path`

### Tests
- 72 个 Python 测试覆盖所有场景（新增 16 个 find-up、global fallback、diagnose 测试）

## [1.5.0] - 2026-03-30

### Added
- **NPX 卸载功能** — `npx @allanpk716/work-skills-setup --uninstall` 一键卸载所有已安装组件
- 7 类组件检测（插件/钩子脚本/钩子注册/命令/市场源/环境变量）
- 彩色 ASCII 表格展示检测结果
- 7 步容错卸载执行（remover.js + reporter.js）
- 双语 i18n 支持（中英文卸载提示）

## [1.4.0] - 2026-03-30

### Fixed
- windows-git-commit 插件目录结构扁平化，修复安装检测
- 安装器 `isPluginInstalled()` 检测与实际插件结构一致
- 重复运行安装器自动跳过已安装插件

## [1.3.0] - 2026-03-29

### Added
- Pushover 凭证双源检测（process.env + Windows 注册表回退）
- Git 用户信息检测（git config --global）
- Per-item Confirm 交互模式，4 种场景自适应
- 统一安装流程，首次安装和重复运行零检测开销

## [1.2.0] - 2026-03-28

### Added
- NPX 安装器 — `npx @allanpk716/work-skills-setup` 一键安装
- Windows 系统检测与错误提示
- 双语支持（中英文，自动检测系统语言）
- 环境依赖检测（Python, Git, TortoiseGit/PuTTY, pip packages）
- 交互式 Python 依赖安装
- Pushover 凭证配置（API 验证, setx 持久化）
- Git SSH 和用户配置引导
- Claude Code 技能市场集成
- 安装后自动验证（`--verify`）

## [1.1.0] - 2026-02-27

### Added
- 敏感信息检测（密钥、密码、私钥、PGP、PEM）
- 缓存文件检测（Python、Node.js、编译产物、临时文件）
- 配置文件泄露检测（.env、credentials 等）
- 内部信息检测（IP、域名、邮箱）
- git commit 前自动扫描暂存区
- 发现敏感信息时阻止提交并显示详细提示
- 彩色表格格式的问题报告（按严重性分级）
- 双语支持（中英文提示）
- 基于 .gitignore 的自定义规则和白名单
- Windows 性能优化（16.77ms 扫描时间）
- 紧急跳过扫描选项

## [1.0.0] - 2026-02-24

### Added
- claude-notify 通知插件
  - Pushover 推送通知
  - Windows 系统通知
  - AI 生成任务摘要
  - 环境变量管理 API 密钥
  - 多实例并发运行（PID 隔离）

## [0.1.0] - 2026-02-08

### Added
- Initial release of work-skills
- **windows-git-commit** skill for automated Git operations on Windows
  - Command-line git with plink + PPK authentication
  - Auto-analyze changes and generate commit messages
  - Subagent execution to preserve context
  - Auto-detection and configuration of TortoisePlink.exe
  - Comprehensive troubleshooting documentation

[3.0.0]: https://github.com/allanpk716/work-skills/releases/tag/v3.0
[1.6.0]: https://github.com/allanpk716/work-skills/releases/tag/v1.6
[1.5.0]: https://github.com/allanpk716/work-skills/releases/tag/v1.5
[1.4.0]: https://github.com/allanpk716/work-skills/releases/tag/v1.4
[1.3.0]: https://github.com/allanpk716/work-skills/releases/tag/v1.3
[1.2.0]: https://github.com/allanpk716/work-skills/releases/tag/v1.2
[1.1.0]: https://github.com/allanpk716/work-skills/releases/tag/v1.1
[1.0.0]: https://github.com/allanpk716/work-skills/releases/tag/v1.0
[0.1.0]: https://github.com/allanpk716/work-skills/releases/tag/v0.1.0
