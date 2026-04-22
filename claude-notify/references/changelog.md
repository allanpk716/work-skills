# 版本历史

> 返回 [SKILL.md](../SKILL.md) 主文档

## Version 2.0.0 (2026-03-29)

**架构变更: 全局 Hooks 注册**

**问题:**
- 在 marketplace 源仓库（work-skills）项目中,通知功能完全不工作
- marketplace 插件机制会跳过加载自身 hooks（自引用防护）
- 修改 hooks.json 后需要清理缓存才能生效

**解决方案:**
- 仿照 GSD 模式,将 hooks 注册到全局 `~/.claude/settings.json`
- 通知脚本复制到 `~/.claude/hooks/` 目录
- 集成到 npx 安装流程,同一条命令完成安装和更新
- 删除 marketplace 的 `hooks/hooks.json`,避免双重通知

**变更:**
- 通知脚本不再通过 marketplace 插件加载,改为全局 hooks
- 安装/更新统一通过 `npx skills add allanpk716/work-skills/claude-notify` 完成
- 新增 `installer/src/hooks/` 模块处理 hooks 注册
- 删除 `hooks/hooks.json`、`notify-wait.py`、`notify.py.backup`、`.no-pushover`
- 更新验证脚本检查全局 hooks 而非 marketplace hooks

**影响:**
- 所有项目（包括 work-skills 自身）都能正常收到通知
- 安装和更新流程统一,用户体验更好
- 不再需要手动清理 marketplace 缓存

## Version 1.3.0 (2026-03-16)

**新功能: 环境检查命令**

**问题:**
- 在新机器上安装插件后,用户不知道如何验证环境配置
- 通知功能不工作时,用户难以定位问题原因
- 缺少自动化的环境诊断工具

**解决方案:**
- 新增 `/check-notify-env` 斜杠命令
- 自动检查 Python 环境、依赖包、环境变量和 hooks 配置
- 提供具体的修复步骤和建议

**新增功能:**
- `/check-notify-env` - 一键环境检查和诊断
- 自动检测 Python 依赖包是否安装
- 自动检测 hooks 是否正确配置到 settings.json
- 智能诊断报告,包含修复建议

**文档改进:**
- 在"前提条件"中明确说明 Python 依赖要求
- 在"步骤 3: 验证安装"中推荐使用 `/check-notify-env`
- 在"常见问题"中添加快速诊断指引
- 在"斜杠命令"部分添加详细使用说明

**影响:**
- 新用户可以快速验证环境配置
- 遇到问题时可以自动诊断并获取修复建议
- 减少因环境配置导致的通知失败问题

## Version 1.2.1 (2026-02-28)

**Bug 修复**

**问题:**
- 修改 `hooks/hooks.json` 后，Notification hook 未生效
- 插件缓存机制导致配置更新未加载

**解决方案:**
- 添加缓存清理脚本 `scripts/clear-cache.bat`
- 在文档中添加故障排查指南（插件缓存相关）
- 说明修改 hooks.json 后需要清理缓存并重启

**新增功能:**
- `scripts/clear-cache.bat` - 一键清理插件缓存

**文档改进:**
- FAQ 新增"插件缓存未更新"问题说明
- 添加缓存验证步骤
- 添加清理缓存的方法说明

## Version 1.0.0 (2026-02-24)

**初始发布**

**功能:**
- Pushover 推送通知集成
- Windows Toast 桌面通知
- AI 驱动的任务摘要(Claude CLI)
- 并行通知发送(ThreadPoolExecutor)
- 优雅降级策略
- 环境变量配置(PUSHOVER_TOKEN, PUSHOVER_USER)
- 项目级控制开关(.no-pushover, .no-windows)
- 自动日志清理(5 天保留)
- 诊断工具(verify-installation.py, --diagnose)

**技术特性:**
- 超时保护: Claude CLI (2s), Pushover (2s), Windows (1s), 总体 (4s)
- 并发支持: PID 隔离的日志文件
- 零外部依赖(除 requests 库)
- Python 3.6+ 兼容

**已知限制:**
- 仅支持 Windows 系统(Toast 通知)
- 不支持 Linux/macOS 系统通知
- 不支持项目级安装模式(仅全局技能)
- 需要 Claude CLI 用于 AI 摘要(可选)
