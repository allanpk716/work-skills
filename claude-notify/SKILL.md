---
name: claude-notify
description: 当 Claude Code 任务完成或等待输入时发送 Pushover 推送通知和 Windows Toast 通知。通过环境变量 PUSHOVER_TOKEN 和 PUSHOVER_USER 配置。支持斜杠命令控制通知通道。包含环境检查命令 `/check-notify-env` 用于快速诊断配置问题。
---

# Claude Notify 技能

自动化通知系统,当 Claude Code 完成任务时自动触发。通过 Pushover 接收即时移动推送通知,在 Windows 系统上接收桌面 Toast 通知。

## 功能特性

- **Pushover 集成**: 向移动设备发送推送通知
- **Windows Toast 通知**: Windows 系统桌面通知
- **AI 驱动摘要**: 使用 Claude CLI 自动生成简洁的任务摘要
- **并行执行**: 同时发送通知以获得最快速度
- **优雅降级**: 即使未配置 Pushover 凭据也能工作
- **超时保护**: 在 5 秒内完成,避免阻塞 Claude Code

## 工作原理

此技能是 **Hook 触发型** - 当 Claude Code 完成任务或等待输入时自动运行。无需手动调用。

### 任务完成通知 (Stop Hook)

1. Claude Code 在任务完成时触发 `Stop` hook
2. 通知脚本在后台运行(异步模式)
3. 脚本使用 Claude CLI 生成任务摘要
4. Pushover 和 Windows Toast 通知并行发送
5. 您在设备上即时接收通知

### 等待输入通知 (PostToolUse Hook - 实验性功能)

当 Claude 在多轮交互中等待您输入时(例如使用 `/gsd:discuss` 或 AskUserQuestion):

1. Claude Code 触发 `PostToolUse` hook (tool_name: AskUserQuestion)
2. 脚本提取问题内容并发送"Question for You"通知(高优先级)
3. 通知不会阻塞您的操作

**⚠️ 实验性功能说明:**
- 此功能使用 `PostToolUse` hook 检测 `AskUserQuestion` 工具调用
- 这是 Claude Code 的未文档化行为,未来版本可能变更
- 如果此功能失效,请关注 GitHub Issue #15872 的官方支持进展

**通知消息示例:**
```
标题: [work-skills] Question for You
消息: Which phase would you like to discuss next?
```

## 快速开始

### 前提条件

- **Python**: 3.8 或更高版本
- **Python 依赖**: `requests` 库 (用于 Pushover API)
- **操作系统**: Windows (用于 Toast 通知)
- **Pushover 账号**: 可选 (仅移动通知需要)
- **Claude CLI**: 可选 (用于 AI 驱动的摘要)

**安装 Python 依赖:**
```bash
python -m pip install requests
```

或使用环境检查命令自动检测并提示安装:
```bash
/check-notify-env
```

### 步骤 1: 安装插件

使用 npx 安装命令（推荐）:
```bash
npx skills add allanpk716/work-skills/claude-notify
```

此命令将:
- 自动注册全局通知 hooks 到 `~/.claude/settings.json`
- 复制通知脚本到 `~/.claude/hooks/`
- 安装 claude-notify 技能

### 步骤 2: 配置环境变量

设置 Pushover 凭据(移动通知必需):

**Windows (命令提示符):**
```cmd
setx PUSHOVER_TOKEN "your-pushover-app-token"
setx PUSHOVER_USER "your-pushover-user-key"
```

**Windows (PowerShell):**
```powershell
[Environment]::SetEnvironmentVariable("PUSHOVER_TOKEN", "your-pushover-app-token", "User")
[Environment]::SetEnvironmentVariable("PUSHOVER_USER", "your-pushover-user-key", "User")
```

**重要提示:** 设置环境变量后,需要**重启命令行窗口**或**重新打开终端**才能生效。

**获取 Pushover 凭据:**
1. 在 https://pushover.net 创建 Pushover 账号
2. 在 Pushover 控制面板中创建新应用
3. 复制 **API Token**(这是 `PUSHOVER_TOKEN`)
4. 从控制面板复制您的 **User Key**(这是 `PUSHOVER_USER`)

**注意:** Windows Toast 通知无需任何配置即可工作。

详细的 Pushover 配置步骤、项目级控制开关和配置示例场景,请参阅 → [配置指南](references/setup.md)

### 步骤 3: 验证安装

**推荐方法 - 使用环境检查命令:**

运行环境检查斜杠命令来验证所有配置:

```bash
/check-notify-env
```

此命令会自动检查:
- ✓ Python 版本兼容性
- ✓ 必需的 Python 库 (requests, win10toast)
- ✓ 环境变量配置 (PUSHOVER_TOKEN, PUSHOVER_USER)
- ✓ Hooks 配置是否正确安装

**示例输出:**
```
=== Claude Notify 环境检查 ===

✓ Python 版本: 3.11.9 (满足要求 >= 3.8)
✓ requests 库: 2.32.5 (已安装)
✓ 环境变量 PUSHOVER_TOKEN: 已设置
✓ 环境变量 PUSHOVER_USER: 已设置
✓ Stop hook: 已配置
✓ Notification hook: 已配置

所有检查通过! 通知功能已准备就绪。
```

**如果有检查失败,命令会提供具体的修复步骤。**

---

**手动验证脚本 (可选):**

运行验证脚本进行更详细的检查:

```bash
python skills/claude-notify/scripts/verify-installation.py
```

此脚本将检查:
- Python 版本兼容性
- 必需的 Python 库
- 环境变量配置
- Pushover API 连接性
- Windows Toast 通知功能

**示例输出:**
```
✓ Python 版本: 3.10.0 (满足要求 >= 3.8)
✓ 环境变量 PUSHOVER_TOKEN 已设置
✓ 环境变量 PUSHOVER_USER 已设置
✓ Pushover API 连接测试成功
✓ Windows Toast 通知测试成功

所有检查通过!通知功能已准备就绪。
```

### 步骤 4: 测试

安装后 Hook 会自动激活。在 Claude Code 中完成任何任务,您应该会收到通知。

> **注意:** 从 v2.0.0 开始,通知 hooks 通过全局 `~/.claude/settings.json` 注册,而非 marketplace 插件机制。这样确保在所有项目中都能正常工作。

**预期行为:**
- 任务完成时,您会在手机上收到 Pushover 推送通知(如果已配置)
- 同时在 Windows 桌面收到 Toast 通知
- 通知标题显示项目名称,内容包含任务摘要

## 使用说明

无需手动操作 - 通知在 Claude Code 任务完成时自动发送。

**示例通知:**
```
标题: work-skills
消息: 完成了使用 JWT 令牌实现用户认证功能
```

**通知内容:**
- **标题**: 当前项目名称(从 `CLAUDE_PROJECT_DIR` 环境变量提取)
- **消息**: AI 生成的任务摘要(或 Claude CLI 失败时的降级消息)
- **优先级**: 正常优先级(Pushover priority 0)

## 斜杠命令

提供便捷的斜杠命令来控制通知通道和检查环境配置:

| 命令 | 说明 |
|------|------|
| `/check-notify-env` | 检查运行环境是否满足要求 |
| `/notify-enable <pushover\|windows>` | 启用指定的通知通道 |
| `/notify-disable <pushover\|windows>` | 禁用指定的通知通道 |
| `/notify-status` | 查看所有通知通道的当前状态 |

详细的命令说明和项目级控制开关,请参阅 → [斜杠命令详情](references/commands.md)

## 参考文档

详细文档已拆分至 `references/` 目录,按需查阅:

| 文档 | 说明 |
|------|------|
| [配置指南](references/setup.md) | Pushover 详细配置、环境变量、项目级控制开关、配置示例场景 |
| [常见问题 (FAQ)](references/faq.md) | 通知不工作、性能问题、日志排查等常见问题解答 |
| [技术参考](references/technical.md) | 超时策略、并行架构、错误码、系统要求、性能指标、安全考虑 |
| [版本历史](references/changelog.md) | 各版本变更记录(v2.0.0、v1.3.0、v1.2.1、v1.0.0) |
| [斜杠命令详情](references/commands.md) | 所有斜杠命令的用法、参数、输出示例和项目级控制开关 |

## 支持

如有问题或功能请求,请检查项目仓库或文档。

## 许可证

本插件为 Claude Code 用户提供。详见仓库许可证详情。
