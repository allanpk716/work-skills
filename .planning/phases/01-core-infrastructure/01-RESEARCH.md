# Phase 1: Core Infrastructure - Research

**Researched:** 2026-02-24
**Domain:** Claude Code Hooks, Pushover API, Windows Toast Notifications, Python Concurrency
**Confidence:** HIGH

## Summary

本阶段实现 Claude Code 任务完成时的通知系统,核心挑战是在 5 秒超时限制内完成 Claude CLI 摘要生成、Pushover 推送和 Windows Toast 通知三个操作。研究结果表明:

1. **Claude Code Hooks** 提供了完善的 Stop 事件钩子,支持异步执行(async: true),非常适合发送通知场景
2. **Pushover API** 是简单的 REST API,单次 POST 请求即可完成,支持优先级控制和错误处理
3. **Windows Toast 通知** 可通过 PowerShell 调用 Windows.UI.Notifications API 或使用 BurntToast 模块实现
4. **Python ThreadPoolExecutor** 适合并行发送两个通知通道,结合 timeout 参数可实现精确的超时控制

**Primary recommendation:** 使用 Python 脚本作为 Hook 命令,通过 `concurrent.futures.ThreadPoolExecutor` 并行执行 Pushover 和 Windows 通知,所有 HTTP 请求和子进程调用都设置明确的超时时间。

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### 通知消息格式
- **Pushover 通知:** 标题显示项目名称,消息体包含 AI 摘要全文(最多 200 字符)
- **Windows Toast 通知:** 标题显示项目名称,消息体包含 AI 摘要全文(最多 200 字符)
- **项目名称获取:** 使用当前工作目录名称(最简单方案)
- **摘要长度限制:** 硬性截断到 200 字符,确保不会因为摘要过长导致超时

#### 降级策略
- **Claude CLI 摘要生成失败时:** 降级消息格式为 "[项目名] 任务已完成"(包含项目名称提供上下文)
- **Claude CLI 摘要超时(>2秒)时:** 仅记录日志,不发送任何通知(避免超时风险)
- **Pushover API 调用失败时:** 记录错误日志但不中断 Hook 执行,不影响 Windows 通知发送
- **Windows Toast 调用失败时:** 降级到固定消息模板(最简单的兜底方案)

#### 并发控制策略
- **通知发送模式:** Pushover 和 Windows 通知并行发送,任一通道成功即返回(平衡速度和可靠性)
- **并发隔离:** 每个会话使用独立的 PID 和日志文件,确保多实例运行时互不干扰
- **错误隔离:** 一个通知通道失败不影响另一个通道,各自独立处理错误

#### 错误处理策略
- **环境变量缺失时(如 PUSHOVER_TOKEN 未设置):** 记录到专用错误日志文件,不发送通知,静默失败不影响 Claude Code 运行
- **日志存储位置:** 写入用户配置目录(如 %APPDATA%\claude-notify\logs)
- **日志文件命名:** claude-notify-YYYYMMDD-HHMMSS-PID.log(包含时间和 PID,易于追踪)
- **日志清理策略:** 自动删除 5 天前的日志文件,避免占用过多磁盘空间

#### 超时时间控制
- **Claude CLI 摘要生成:** 2 秒超时(平衡速度和摘要质量)
- **Pushover API 调用:** 2 秒超时(与 Claude CLI 一致)
- **Windows Toast 调用:** 1 秒超时(快速失败,避免影响总体性能)
- **总体执行时间:** 严格控制在 5 秒内,确保不被 Claude Code 杀死

#### 错误重试策略
- **Pushover API 调用失败:** 不重试,失败即返回(快速失败策略,避免超时)
- **Windows Toast 调用失败:** 不重试,直接降级到固定消息模板
- **Claude CLI 调用失败:** 不重试,直接使用降级消息

#### 特殊字符处理
- **路径编码:** UTF-8 编码,不处理特殊字符(最简单方案,依赖系统默认处理)
- **中文字符支持:** 保持原样,不做转换或替换

#### 通知配置
- **Pushover 优先级:** 正常优先级(0),不发出声音,避免打扰用户
- **Windows Toast 持久性:** 系统默认行为(由 Windows 设置决定),不做特殊配置

### Claude's Discretion
- Claude CLI 摘要生成的具体提示词设计
- Windows.UI.Notifications API 的具体调用方式
- 日志文件的具体格式和详细程度
- 错误日志的具体内容(堆栈跟踪、环境变量值等)

### Deferred Ideas (OUT OF SCOPE)
- 通知图标自定义
- 通知点击后打开项目目录
- 历史通知记录查询
- 通知分组管理
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CORE-01 | Hook 脚本在 Claude Code Stop 事件时自动执行 | Claude Code Hooks Stop 事件配置 |
| CORE-02 | Hook 脚本在 5 秒内完成执行 | ThreadPoolExecutor + 各操作独立 timeout |
| CORE-03 | 通知标题显示项目名称 | 从 `os.getcwd()` 提取目录名 |
| CORE-04 | 支持多实例并发运行(PID 隔离) | 日志文件使用 PID 后缀,无共享状态 |
| PUSH-01 | 用户可通过环境变量配置 PUSHOVER_TOKEN 和 PUSHOVER_USER | `os.environ.get()` 读取环境变量 |
| PUSH-02 | 任务完成时发送 Pushover 通知到用户设备 | `requests.post()` 调用 API |
| PUSH-03 | Pushover 通知优先级为 0 (正常优先级) | API 参数 `priority=0` |
| PUSH-04 | Pushover 通知内容包含项目名称和任务摘要 | API 参数 `title` 和 `message` |
| PUSH-05 | Pushover API 调用失败时记录错误但不中断 Hook 执行 | try/except 捕获异常,记录日志 |
| WIND-01 | 任务完成时发送 Windows Toast 通知 | PowerShell 调用 Windows.UI.Notifications |
| WIND-02 | 使用 PowerShell 调用 Windows.UI.Notifications 或 BurntToast | subprocess.run() 执行 PowerShell |
| WIND-03 | Windows 通知标题显示项目名称 | Toast XML template text 字段 |
| WIND-04 | Windows 通知内容包含任务摘要 | Toast XML template text 字段 |
| WIND-05 | PowerShell 调用失败时降级到固定消息模板 | try/except 捕获异常 |
| SUMM-01 | 使用 Claude CLI 生成任务摘要(调用 claude --print) | subprocess.run() 执行 claude 命令 |
| SUMM-02 | Claude CLI 调用失败时降级到固定消息 | try/except 捕获异常 |
| SUMM-03 | 摘要内容限制在 200 字符以内 | Python 字符串切片 |
| SUMM-04 | 摘要生成在 2 秒内完成 | subprocess.run(timeout=2) |
| PARA-01 | Pushover 和 Windows 通知并行发送 | ThreadPoolExecutor.submit() |
| PARA-02 | 一个通知通道失败不影响另一个通道 | 独立 try/except 块 |
| PARA-03 | 所有通知操作在 5 秒内完成 | ThreadPoolExecutor 等待超时控制 |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Python | 3.8+ | Hook 脚本执行语言 | Claude Code 环境已安装,跨平台支持好 |
| requests | 2.28+ | HTTP 客户端库 | Python HTTP 请求的事实标准,稳定可靠 |
| concurrent.futures | (stdlib) | 并行执行通知 | Python 标准库,无需额外安装 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| subprocess | (stdlib) | 调用 Claude CLI 和 PowerShell | 调用外部命令 |
| os | (stdlib) | 环境变量和路径操作 | 获取项目名称、读取配置 |
| logging | (stdlib) | 日志记录 | 错误和调试日志 |
| json | (stdlib) | JSON 处理 | Hook 输入解析(如果需要) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| requests | urllib3/httpx | requests 更简单易用,社区支持最好 |
| ThreadPoolExecutor | asyncio | ThreadPoolExecutor 更适合 I/O 密集型短任务,代码更简洁 |
| PowerShell Windows.UI.Notifications | BurntToast 模块 | 原生 API 无需安装额外模块,更可靠 |

**Installation:**
```bash
# 仅需安装 requests 库,其他都是标准库
pip install requests
```

## Architecture Patterns

### Recommended Project Structure
```
.claude/
├── settings.json          # Hook 配置(Stop 事件)
└── hooks/
    └── notify.py          # 通知脚本主文件
```

### Pattern 1: Hook 配置 (Stop 事件异步执行)
**What:** 在 Claude Code settings.json 中配置 Stop 事件钩子,使用 `async: true` 避免阻塞 Claude 响应
**When to use:** 所有不需要立即反馈的后台任务
**Example:**
```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python \"$CLAUDE_PROJECT_DIR\\.claude\\hooks\\notify.py\"",
            "async": true,
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```
// Source: https://smartscope.blog/en/generative-ai/claude/claude-code-hooks-guide/

### Pattern 2: 并行通知发送
**What:** 使用 ThreadPoolExecutor 并行发送 Pushover 和 Windows 通知,通过 timeout 控制总体执行时间
**When to use:** 需要在严格时间限制内完成多个独立 I/O 操作
**Example:**
```python
from concurrent.futures import ThreadPoolExecutor, as_completed, TimeoutError
import requests

def send_pushover(title, message, token, user):
    """发送 Pushover 通知"""
    try:
        response = requests.post(
            'https://api.pushover.net/1/messages.json',
            data={
                'token': token,
                'user': user,
                'title': title,
                'message': message,
                'priority': 0
            },
            timeout=2  # 2 秒超时
        )
        return response.status_code == 200
    except requests.exceptions.RequestException:
        return False

def send_windows_toast(title, message):
    """发送 Windows Toast 通知"""
    # PowerShell 调用实现
    pass

# 并行执行
with ThreadPoolExecutor(max_workers=2) as executor:
    pushover_future = executor.submit(send_pushover, title, message, token, user)
    windows_future = executor.submit(send_windows_toast, title, message)

    # 等待所有任务完成,最多等待 4 秒
    try:
        for future in as_completed([pushover_future, windows_future], timeout=4):
            try:
                result = future.result()
            except Exception as e:
                # 记录错误但继续
                pass
    except TimeoutError:
        # 总体超时,但任务已在后台执行
        pass
```
// Source: https://superfastpython.com/threadpoolexecutor-timeouts/

### Pattern 3: Claude CLI 摘要生成
**What:** 调用 `claude --print` 生成任务摘要,带超时控制
**When to use:** 需要利用 Claude 生成上下文相关的摘要
**Example:**
```python
import subprocess
import os

def generate_summary(timeout=2):
    """使用 Claude CLI 生成任务摘要"""
    try:
        result = subprocess.run(
            ['claude', '--print', 'Summarize the completed task in one short sentence (max 200 chars).'],
            capture_output=True,
            text=True,
            timeout=timeout,
            cwd=os.getcwd()
        )
        if result.returncode == 0:
            summary = result.stdout.strip()[:200]
            return summary
        return None
    except subprocess.TimeoutExpired:
        return None
    except Exception:
        return None
```
// Source: https://docs.python.org/3/library/subprocess.html

### Pattern 4: Windows Toast 通知
**What:** 通过 PowerShell 调用 Windows.UI.Notifications API 发送 Toast 通知
**When to use:** 在 Windows 上发送原生桌面通知
**Example:**
```python
import subprocess

def send_windows_toast(title, message, timeout=1):
    """发送 Windows Toast 通知"""
    ps_script = f'''
    [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
    [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null

    $template = @"
    <toast>
        <visual>
            <binding template="ToastText02">
                <text id="1">{title}</text>
                <text id="2">{message}</text>
            </binding>
        </visual>
    </toast>
"@

    $xml = New-Object Windows.Data.Xml.Dom.XmlDocument
    $xml.LoadXml($template)
    $toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
    $appId = '{{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}}\\WindowsPowerShell\\v1.0\\powershell.exe'
    [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($appId).Show($toast)
    '''

    try:
        subprocess.run(
            ['powershell', '-Command', ps_script],
            capture_output=True,
            timeout=timeout,
            text=True
        )
        return True
    except Exception:
        return False
```
// Source: https://github.com/GitHub30/toast-notification-examples

### Anti-Patterns to Avoid
- **阻塞 Claude Code 响应:** 不要在 Stop hook 中使用同步执行(async: false)进行耗时操作
- **无超时控制的 HTTP 请求:** 所有网络请求必须设置 timeout 参数
- **共享全局状态:** 多个 Claude Code 实例可能同时运行,不要使用共享文件或全局变量
- **复杂的错误重试:** 5 秒超时限制下,不要实现重试逻辑,快速失败是正确策略

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTTP 请求 | urllib/sockets | requests | 成熟稳定,自动处理连接池、编码、重定向等 |
| 并行执行 | threading.Thread | concurrent.futures.ThreadPoolExecutor | 更简洁的 API,内置超时控制 |
| Windows Toast | ctypes 调用 Win32 API | PowerShell + Windows.UI.Notifications | 无需处理复杂的 COM 接口 |
| 日志管理 | 自定义文件处理 | logging 模块 | 标准库,支持滚动、格式化等 |

**Key insight:** 本项目的核心挑战是时间控制而非功能复杂性,使用成熟的库和标准模式可以最小化出错风险。

## Common Pitfalls

### Pitfall 1: subprocess.run() 在 Windows 上超时不生效
**What goes wrong:** 使用 `shell=True` 和 `capture_output=True` 时,subprocess.run() 的 timeout 参数可能不生效,进程可能无限等待用户输入
**Why it happens:** Windows 上 shell=True 会启动 cmd.exe,子进程可能继承管道并等待输入
**How to avoid:** 不使用 `shell=True`,直接传递命令列表;或者使用 `subprocess.Popen` 配合 `communicate(timeout=...)`
**Warning signs:** Hook 执行超过 5 秒被 Claude Code 杀死

### Pitfall 2: PowerShell 脚本中的特殊字符转义
**What goes wrong:** 消息中包含引号、换行符等特殊字符时,PowerShell 脚本解析失败
**Why it happens:** PowerShell 字符串转义规则与 Python 不同
**How to avoid:** 使用 base64 编码传递消息,或者在 PowerShell 中使用单引号字符串(不解析变量)
**Warning signs:** Windows Toast 通知发送失败,PowerShell 返回解析错误

### Pitfall 3: ThreadPoolExecutor 等待超时后任务继续执行
**What goes wrong:** `as_completed()` 或 `result()` 超时后,已提交的任务仍在后台执行
**Why it happens:** ThreadPoolExecutor 的超时只影响等待操作,不会取消已提交的任务
**How to avoid:** 这实际上是可接受的行为,确保每个任务都有自己的内部超时控制(如 requests 的 timeout 参数)
**Warning signs:** Hook 脚本退出后仍有网络请求或子进程在运行

### Pitfall 4: Claude CLI 调用耗时过长
**What goes wrong:** `claude --print` 调用可能需要数秒才能返回,导致总体超时
**Why it happens:** Claude API 调用本身需要网络往返和模型推理时间
**How to avoid:** 严格设置 2 秒超时,超时后使用降级消息;考虑使用更简单的提示词
**Warning signs:** 摘要生成经常超时,用户看到降级消息

### Pitfall 5: 环境变量未设置时的错误处理
**What goes wrong:** 当 PUSHOVER_TOKEN 或 PUSHOVER_USER 未设置时,脚本崩溃或打印错误到 stderr
**Why it happens:** `os.environ['KEY']` 在键不存在时抛出 KeyError
**How to avoid:** 使用 `os.environ.get('KEY', default)` 并提供合理的默认值或降级行为
**Warning signs:** Hook 执行失败,Claude Code 显示错误消息

## Code Examples

Verified patterns from official sources:

### Pushover API 调用 (带超时和错误处理)
```python
import requests
from requests.exceptions import Timeout, ConnectionError, HTTPError

def send_pushover_notification(token, user, title, message, timeout=2):
    """
    发送 Pushover 通知

    Args:
        token: Pushover 应用 token
        user: Pushover 用户 key
        title: 通知标题
        message: 通知消息
        timeout: 请求超时时间(秒)

    Returns:
        bool: 发送成功返回 True,失败返回 False
    """
    try:
        response = requests.post(
            'https://api.pushover.net/1/messages.json',
            data={
                'token': token,
                'user': user,
                'title': title,
                'message': message,
                'priority': 0  # 正常优先级
            },
            timeout=timeout
        )
        response.raise_for_status()
        result = response.json()
        return result.get('status') == 1
    except Timeout:
        # 请求超时
        return False
    except ConnectionError:
        # 网络连接错误
        return False
    except HTTPError:
        # HTTP 错误状态码
        return False
    except Exception:
        # 其他未知错误
        return False
```
// Source: https://pushover.net/api/index (Context7)

### Python subprocess 带超时执行
```python
import subprocess

def run_command_with_timeout(cmd, timeout=2):
    """
    执行命令并带超时控制

    Args:
        cmd: 命令列表,如 ['claude', '--print', 'prompt']
        timeout: 超时时间(秒)

    Returns:
        tuple: (success: bool, stdout: str, stderr: str)
    """
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout
        )
        return (result.returncode == 0, result.stdout, result.stderr)
    except subprocess.TimeoutExpired:
        return (False, '', 'Timeout')
    except Exception as e:
        return (False, '', str(e))
```
// Source: https://docs.python.org/3/library/subprocess.html

### ThreadPoolExecutor 并行执行带总体超时
```python
from concurrent.futures import ThreadPoolExecutor, as_completed, TimeoutError

def parallel_execute_with_timeout(funcs, overall_timeout=4):
    """
    并行执行多个函数,带总体超时控制

    Args:
        funcs: 函数列表 [(func1, args1, kwargs1), ...]
        overall_timeout: 总体等待超时时间(秒)

    Returns:
        list: 每个函数的返回值或异常
    """
    results = []

    with ThreadPoolExecutor(max_workers=len(funcs)) as executor:
        futures = []
        for func, args, kwargs in funcs:
            future = executor.submit(func, *args, **kwargs)
            futures.append(future)

        try:
            for future in as_completed(futures, timeout=overall_timeout):
                try:
                    result = future.result()
                    results.append(result)
                except Exception as e:
                    results.append(e)
        except TimeoutError:
            # 总体超时,收集已完成的结果
            for future in futures:
                if future.done():
                    try:
                        results.append(future.result())
                    except Exception as e:
                        results.append(e)

    return results
```
// Source: https://superfastpython.com/threadpoolexecutor-timeouts/

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 同步 Hook 执行 | async: true 异步执行 | 2026-01 (Claude Code) | Hook 不阻塞 Claude 响应,用户体验更好 |
| 串行发送通知 | ThreadPoolExecutor 并行 | 始终 | 减少总体执行时间,提高可靠性 |
| 复杂的重试逻辑 | 快速失败策略 | 本项目 | 简化代码,避免超时风险 |

**Deprecated/outdated:**
- win10toast 库: 不再维护,不支持 Windows 11
- 使用 pywin32 调用 Toast 通知: 复杂且不稳定,推荐使用 PowerShell 或 WinRT

## Open Questions

1. **Claude CLI 摘要生成的提示词优化**
   - What we know: `claude --print` 可以生成摘要,但可能耗时较长
   - What's unclear: 最简洁有效的提示词是什么?是否需要包含上下文?
   - Recommendation: 使用简单提示词 "Briefly summarize the completed task (max 200 chars).",如果超时则使用降级消息

2. **PowerShell Windows.UI.Notifications 在非交互式会话中的行为**
   - What we know: 需要加载 WinRT 程序集才能使用
   - What's unclear: 在 Claude Code 的 Hook 环境中是否正常工作?
   - Recommendation: 实现时测试,如果失败考虑使用 BurntToast 模块作为备选方案

3. **日志文件的并发写入安全**
   - What we know: 多个 Claude Code 实例可能同时写入日志
   - What's unclear: Python logging 模块是否处理文件锁?
   - Recommendation: 使用 PID 后缀确保每个实例写入独立文件,避免并发问题

## Sources

### Primary (HIGH confidence)
- /websites/pushover_net_api - Pushover API 文档,消息发送参数和优先级
- https://smartscope.blog/en/generative-ai/claude/claude-code-hooks-guide/ - Claude Code Hooks 完整指南 (2026-02)
- https://docs.python.org/3/library/subprocess.html - Python subprocess 官方文档
- https://docs.python.org/3/library/concurrent.futures.html - ThreadPoolExecutor 官方文档

### Secondary (MEDIUM confidence)
- https://github.com/GitHub30/toast-notification-examples - Windows Toast PowerShell 示例
- https://www.pdq.com/blog/display-toast-notifications-with-powershell-burnt-toast-module/ - BurntToast 使用教程
- https://superfastpython.com/threadpoolexecutor-timeouts/ - ThreadPoolExecutor 超时控制详解

### Tertiary (LOW confidence)
- https://smsagent.blog/2024/10/29/popping-toast-notifications-in-powershell-core/ - PowerShell Core 中的 Toast 通知 (需验证在 Claude Code 环境中的兼容性)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - 使用成熟的 Python 标准库和广泛使用的第三方库
- Architecture: HIGH - Claude Code Hooks 文档详尽,模式清晰
- Pitfalls: MEDIUM - 部分 Windows 特定问题需要实际测试验证

**Research date:** 2026-02-24
**Valid until:** 2026-03-24 (1 个月,Claude Code Hooks 可能有更新)
