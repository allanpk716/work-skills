# 技术参考

> 返回 [SKILL.md](../SKILL.md) 主文档

## 超时策略

| 操作 | 超时时间 | 说明 |
|------|---------|------|
| Claude CLI 摘要 | 2 秒 | 生成任务摘要,失败后降级到固定消息 |
| Pushover API | 4 秒 | HTTP POST 请求到 api.pushover.net:443 (适应网络延迟) |
| Windows Toast | 1 秒 | PowerShell 调用 Windows.UI.Notifications |
| **总体执行** | **5 秒** | **小于 Claude Code 的 5 秒限制** |

## 并行执行架构

使用 Python `concurrent.futures.ThreadPoolExecutor` 实现:

```python
with ThreadPoolExecutor(max_workers=2) as executor:
    pushover_future = executor.submit(send_pushover, ...)
    windows_future = executor.submit(send_windows, ...)
```

**优势:**
- 两个通知通道完全独立
- 一个失败不影响另一个
- 总耗时等于最慢的通道,而非两者之和

## 错误码列表

脚本使用标准 Python 异常,无自定义错误码。常见错误类型:

| 异常类型 | 含义 | 处理策略 |
|---------|------|---------|
| `EnvironmentError` | 环境变量未设置 | 记录警告,跳过 Pushover 通知 |
| `requests.Timeout` | Pushover API 超时 | 记录错误,继续发送 Windows Toast |
| `subprocess.TimeoutExpired` | Claude CLI 超时 | 使用固定消息模板 |
| `OSError` | 文件或目录操作失败 | 记录错误,继续执行 |
| `UnicodeEncodeError` | 路径编码问题 | 使用 UTF-8 编码处理 |

## 日志文件

**位置:** `%APPDATA%\claude-notify\logs\`

**命名:** `notify-YYYYMMDD-PID.log`

**示例:** `notify-20260224-12345.log`

**内容格式:**
```
[2026-02-24 14:30:15] INFO: Starting notification for project: work-skills
[2026-02-24 14:30:15] INFO: Generating summary with Claude CLI
[2026-02-24 14:30:16] INFO: Summary generated: "完成了用户认证功能实现"
[2026-02-24 14:30:16] INFO: Sending Pushover notification
[2026-02-24 14:30:17] INFO: Pushover notification sent successfully (1.2s)
[2026-02-24 14:30:17] INFO: Sending Windows Toast notification
[2026-02-24 14:30:17] INFO: Windows Toast sent successfully (0.3s)
[2026-02-24 14:30:17] INFO: Total execution time: 2.1 seconds
```

**自动清理:**
- 保留最近 5 天的日志
- 每次脚本启动时执行清理
- 删除超过 5 天的 `.log` 文件

## 诊断命令

**完整诊断:**
```bash
python skills/claude-notify/hooks/scripts/notify.py --diagnose
```

**输出内容:**
- 环境变量检查(PUSHOVER_TOKEN, PUSHOVER_USER)
- Python 版本验证
- 必需文件存在性检查
- Pushover API 连接测试(发送真实测试通知)
- Windows Toast 功能测试

**仅检查环境:**
```bash
python skills/claude-notify/scripts/verify-installation.py
```

**手动测试 Pushover:**
```bash
python -c "import requests; requests.post('https://api.pushover.net/1/messages.json', data={'token': 'YOUR_TOKEN', 'user': 'YOUR_USER', 'message': 'Test'})"
```

## 系统要求

| 组件 | 最低要求 | 推荐配置 |
|------|---------|---------|
| Python | 3.6+ | 3.10+ |
| 操作系统 | Windows 10 | Windows 10 1903+ |
| 网络 | 能访问 api.pushover.net:443 | 稳定互联网连接 |
| Claude CLI | 可选 | 最新版本 |
| Pushover 账号 | 可选 | 免费 7,500 条/月 |

## 配置文件位置

| 文件/目录 | 位置 | 用途 |
|----------|------|------|
| 全局 Hooks 注册 | `~/.claude/settings.json` | Stop 和 Notification hooks 全局配置 |
| 通知脚本 | `~/.claude/hooks/notify-stop.py` | 任务完成通知脚本 |
| 通知脚本 | `~/.claude/hooks/notify-attention.py` | 用户注意力通知脚本 |
| 通知脚本 | `skills/claude-notify/hooks/scripts/notify.py` | 主通知逻辑 |
| 验证脚本 | `skills/claude-notify/scripts/verify-installation.py` | 安装验证工具 |
| 日志目录 | `%APPDATA%\claude-notify\logs\` | 调试日志 |
| Pushover 控制文件 | 项目根目录 `.no-pushover` | 禁用 Pushover |
| Windows 控制文件 | 项目根目录 `.no-windows` | 禁用 Windows Toast |

## 依赖关系

**Python 标准库(无需安装):**
- `concurrent.futures`: 并行执行
- `logging`: 日志记录
- `os`: 环境变量和文件操作
- `pathlib`: 路径处理
- `subprocess`: 调用 Claude CLI 和 PowerShell
- `time`: 计时

**第三方依赖:**
- `requests`: HTTP 请求到 Pushover API (必需)
- `win10toast`: Windows Toast 通知 (可选,已内置)

**安装依赖:**

**推荐方法 - 使用 pip:**
```bash
python -m pip install requests
```

**或使用 requirements.txt:**
```bash
pip install -r requirements.txt
```

**注意:** 在新机器上安装插件后,建议运行 `/check-notify-env` 命令来自动检查依赖是否已安装。

## 性能指标

**典型执行时间(良好网络):**
- Claude CLI 摘要: 0.5-1.5 秒
- Pushover API: 0.3-1.0 秒
- Windows Toast: 0.1-0.3 秒
- **总耗时: 1.0-2.5 秒**

**最坏情况(超时降级):**
- Claude CLI 超时: 2.0 秒 → 降级到固定消息
- Pushover 超时: 2.0 秒 → 跳过
- Windows Toast 超时: 1.0 秒 → 跳过
- **总耗时: 4.0 秒**(仍在 5 秒限制内)

## 安全考虑

**凭据安全:**
- 环境变量存储在用户配置文件中(非明文文件)
- 日志文件中凭据被遮蔽(仅显示前 4 和后 4 字符)
- 不在代码中硬编码任何凭据

**网络通信:**
- Pushover API 使用 HTTPS (TLS 1.2+)
- 不发送敏感项目数据,仅项目名称和任务摘要

**执行安全:**
- Hook 脚本以当前用户权限运行
- 不执行任何提升权限的操作
- 严格的超时保护,防止资源耗尽
