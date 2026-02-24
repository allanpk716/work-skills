# Stack Research

**Domain:** Claude Code 全局技能 - 任务完成通知系统
**Researched:** 2026-02-24
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Python | 3.6+ | 核心开发语言 | Claude Code hooks 的标准语言,Windows 10+ 预装,无需额外依赖 |
| pathlib | 内置 | 路径操作 | 现代 Python 推荐方式,跨平台兼容,优于 os.path |
| urllib.request | 内置 | HTTP 请求 | 无外部依赖,标准库,5 秒超时限制内可完成,不需要 requests 库 |
| subprocess | 内置 | 调用外部命令 | 调用 Claude CLI 生成摘要,Windows PowerShell 通知 |
| os.environ | 内置 | 环境变量访问 | 全局技能配置的标准方式,安全存储 API 密钥 |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| json | 内置 | JSON 处理 | 解析 Claude CLI 输出,缓存会话数据 |
| datetime, timedelta | 内置 | 时间处理 | 日志轮转,缓存过期检测,时间戳生成 |
| re | 内置 | 正则表达式 | 日志文件名模式匹配,日期提取 |
| concurrent.futures.ThreadPoolExecutor | 内置 | 并行通知 | 同时发送 Pushover 和 Windows 通知 |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Claude Code CLI | AI 摘要生成 | 使用 `claude --print` 快速生成任务摘要 |
| PowerShell | Windows 通知 | 使用 BurntToast 或 Windows.UI.Notifications |
| Pushover API | 移动推送 | 通过 HTTP POST 发送通知 |

## Installation

```bash
# 无需安装任何外部包
# 所有依赖都是 Python 标准库

# 可选: 配置环境变量
# Windows PowerShell
$env:PUSHOVER_TOKEN="your_api_token_here"
$env:PUSHOVER_USER="your_user_key_here"

# Windows CMD
set PUSHOVER_TOKEN=your_api_token_here
set PUSHOVER_USER=your_user_key_here
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| urllib.request | requests | 如果需要复杂的 HTTP 功能(cookie、session、重定向),但增加了外部依赖 |
| pathlib | os.path | os.path 是旧代码,但 pathlib 提供更清晰的面向对象接口 |
| subprocess.run() | subprocess.Popen | run() 是推荐的高级 API,Popen 仅在需要实时交互时使用 |
| 标准库 logging | print() | 仅用于简单调试,生产环境必须使用 logging 模块 |
| PowerShell 通知 | win10toast | win10toast 需要安装,PowerShell 无需依赖且支持 Windows 10/11 |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| requests 库 | 增加外部依赖,全局技能应保持最小依赖 | urllib.request (标准库) |
| 第三方通知库 (win10toast, winotify) | 需要安装,可能不兼容新 Windows 版本 | PowerShell BurntToast 或 Windows.UI.Notifications |
| 硬编码 API 密钥 | 安全风险,不便于多环境部署 | os.environ.get() 读取环境变量 |
| print() 调试 | 生产环境无日志记录,难以排查问题 | logging 模块 |
| os.path | 旧式路径操作,跨平台兼容性差 | pathlib.Path |
| 全局配置文件 | 全局技能无法使用项目级配置 | 环境变量 |

## Stack Patterns by Variant

**如果需要支持 Linux/macOS:**
- 使用 `notify-send` (Linux) 或 `osascript` (macOS) 代替 PowerShell
- 使用 platform.system() 检测操作系统
- 路径分隔符已由 pathlib 自动处理

**如果需要 HTTP/2 或更复杂功能:**
- 可以使用 httpx 库 (支持 HTTP/2,连接池)
- 但需要在技能安装时确保依赖安装
- 当前 urllib.request 足够用于简单的 Pushover API 调用

**如果 Claude CLI 不可用:**
- 降级为简单的固定消息模板
- 例如: "Claude Code task completed"
- 从 CLAUDE_PROJECT_DIR 提取项目名

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Python 3.6+ | Windows 10/11 | Windows 10 预装 Python 3.x |
| pathlib | Python 3.4+ | Python 3.6+ 已完全支持 |
| urllib.request | Python 2.x/3.x | Python 3.x 推荐使用 |
| subprocess.run() | Python 3.5+ | 替代旧的 subprocess.call() |
| ThreadPoolExecutor | Python 3.2+ | Python 3.x 标准库 |

## Claude Code 技能架构说明

### 技能文件结构
```
skills/claude-notify/
├── SKILL.md           # 技能定义和说明
├── notify.py          # 主通知脚本 (Python)
└── VERSION            # 版本信息
```

### Hook 配置位置
- **全局技能**: `~/.claude/skills/claude-notify/` (所有项目可用)
- **项目技能**: `.claude/skills/claude-notify/` (仅当前项目)

### Hook 触发方式
Claude Code 提供的 Hook 点:
- **Stop**: 任务完成时触发 (推荐)
- **Notification**: 需要用户关注时触发 (可选)
- **SessionStart**: 会话开始时触发 (不适用)

### 环境变量获取
Claude Code 提供的环境变量:
- `CLAUDE_PROJECT_DIR`: 项目根目录路径 (用于提取项目名)
- 自定义环境变量: `PUSHOVER_TOKEN`, `PUSHOVER_USER`

### 超时限制
- Hook 命令必须在 **5 秒内** 完成
- 使用 ThreadPoolExecutor 并行发送通知
- Claude CLI 摘要生成通过 subprocess 异步调用

## Sources

- `/websites/python_3_15` — Python 3.15 标准库文档 (urllib.request, pathlib, subprocess, os.environ)
- https://www.stuartellis.name/articles/python-modern-practices/ — 现代 Python 开发最佳实践 (HIGH confidence)
- https://dagster.io/blog/python-environment-variables — Python 环境变量管理最佳实践 (HIGH confidence)
- https://www.python-httpx.org/advanced/clients/ — HTTPX 客户端连接池说明 (HTTP 优化参考)
- https://docs.python.org/3.15/library/logging.html — Python logging 模块官方文档 (HIGH confidence)
- Claude Code 官方文档 — 技能开发和 Hook 配置 (HIGH confidence)
- 原项目 `C:/WorkSpace/cc-pushover-hook` — 已验证的实现模式 (HIGH confidence)

---

*Stack research for: Claude Code 全局技能 - 任务完成通知系统*
*Researched: 2026-02-24*
