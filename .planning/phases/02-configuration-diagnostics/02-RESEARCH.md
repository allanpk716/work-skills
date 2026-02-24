# Phase 2: Configuration & Diagnostics - Research

**Researched:** 2026-02-24
**Domain:** Python Configuration Management, Logging Cleanup, Diagnostic Tools, File-based Control Flags
**Confidence:** HIGH

## Summary

本阶段为 Claude Notify 系统添加配置管理和诊断能力,让用户能够验证环境配置、管理日志文件生命周期、针对特定项目禁用通知。核心实现基于 Python 标准库(pathlib, argparse, logging, os, datetime),不引入额外依赖。

关键技术发现:
1. **环境变量管理** - 使用 `os.environ.get()` 安全读取配置,缺失时记录日志但不崩溃,符合静默失败原则
2. **文件存在性检查** - 使用 `pathlib.Path.is_file()` 检测项目级禁用标志文件(.no-pushover, .no-windows)
3. **日志清理** - 使用 `pathlib.Path` 遍历日志目录,结合 `datetime` 和文件修改时间删除旧日志
4. **诊断模式** - 使用 `argparse` 添加 `--diagnose` 参数,集成到现有 notify.py 而非创建独立脚本

**Primary recommendation:** 在现有 notify.py 中添加诊断功能和日志清理,使用 Python 标准库实现,保持简单可靠。

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### 环境变量配置
- 仅使用系统环境变量配置 Pushover API 凭据(PUSHOVER_TOKEN 和 PUSHOVER_USER)
- 不支持 .env 文件或配置文件,保持简单直接
- 环境变量缺失时记录错误日志但不崩溃,继续执行

#### 诊断工具设计
- 在现有 notify.py 中添加 `--diagnose` 参数,而非创建独立脚本
- 诊断输出使用文本格式,简单明了,适合命令行查看
- 诊断功能仅在用户手动运行时执行,不自动触发
- 诊断检查内容:
  - 环境变量检查(显示前4位用于确认)
  - Pushover API 连接测试(发送测试通知)
  - 项目配置文件检测(.no-pushover, .no-windows)
  - 日志文件路径和状态显示
- 测试通知内容: "Test notification from Claude Code"

#### 日志管理
- 保持当前方案:每次运行创建独立的日志文件(按日期和PID命名)
- 日志清理策略:保留最近 5 天的日志文件
- 清理触发时机:每次 notify.py 运行时自动执行清理
- 不引入额外的日志库依赖,使用 Python 标准库实现

#### 项目级通知控制
- 使用 .no-pushover 和 .no-windows 文件禁用特定项目的通知
- 保持简单明确,不引入额外的配置文件格式
- 不集成到 Claude Code 的 settings.json,保持独立性

#### 错误处理和用户体验
- 环境变量缺失时:记录错误日志 + 继续执行(静默失败)
- 日志中提示用户设置环境变量,不显示完整配置步骤
- 不干扰 Claude Code 正常运行,无弹窗或中断

### Claude's Discretion
- 日志清理的具体实现逻辑(如何判断5天前的文件)
- 诊断输出的具体格式和布局
- 测试通知的标题和详细内容
- 错误日志的具体措辞

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CONF-01 | 通过系统环境变量配置 API 密钥(PUSHOVER_TOKEN, PUSHOVER_USER) | `os.environ.get()` 安全读取,支持默认值 |
| CONF-02 | 环境变量未设置时记录错误日志但不崩溃 | try/except + logger.error(),静默失败模式 |
| CONF-03 | 支持通过 .no-pushover 文件禁用 Pushover 通知(项目级) | `Path.is_file()` 检测文件存在性 |
| CONF-04 | 支持通过 .no-windows 文件禁用 Windows 通知(项目级) | `Path.is_file()` 检测文件存在性 |
| LOG-01 | 所有错误和警告写入调试日志文件 | Python logging 模块配置文件处理器 |
| LOG-02 | 日志文件按日期和 PID 命名 (debug.YYYY-MM-DD-pid-{pid}.log) | datetime + os.getpid() + f-string 格式化 |
| LOG-03 | 自动清理 5 天前的旧日志文件 | pathlib 遍历 + stat().st_mtime + 时间计算 |
| LOG-04 | 提供诊断脚本验证环境配置和 API 连接 | argparse 添加 --diagnose 参数,诊断逻辑集成到 notify.py |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Python | 3.8+ | 脚本执行语言 | Claude Code 环境已安装,跨平台支持好 |
| pathlib | (stdlib) | 路径操作和文件管理 | Python 3.4+ 标准库,面向对象路径处理 |
| argparse | (stdlib) | 命令行参数解析 | 标准库,支持子命令和可选参数 |
| os | (stdlib) | 环境变量访问 | 标准库,`os.environ.get()` 安全读取 |
| datetime | (stdlib) | 时间和日期计算 | 标准库,日志文件时间判断 |
| logging | (stdlib) | 日志记录 | 已在 Phase 1 使用,继续沿用 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| time | (stdlib) | 时间戳转换 | 计算文件修改时间差 |
| sys | (stdlib) | 命令行参数和退出码 | 诊断模式退出处理 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| pathlib | os.path | pathlib 更现代,API 更直观,支持链式调用 |
| argparse | click/typer | argparse 是标准库,无需额外安装,对于简单诊断参数足够 |
| logging | loguru | 用户明确要求使用标准库,不引入额外依赖 |

**Installation:**
```bash
# 无需安装额外依赖,全部使用 Python 标准库
```

## Architecture Patterns

### Recommended Project Structure
```
.claude/hooks/
└── notify.py          # 通知脚本(包含诊断功能和日志清理)
```

### Pattern 1: 环境变量安全读取
**What:** 使用 `os.environ.get()` 读取环境变量,提供默认值或 None,避免 KeyError
**When to use:** 读取可选配置或需要静默失败的场景
**Example:**
```python
import os
import logging

logger = logging.getLogger(__name__)

def get_pushover_credentials():
    """
    安全读取 Pushover 凭据,缺失时记录日志但不崩溃

    Returns:
        tuple: (token, user) 或 (None, None)
    """
    token = os.environ.get('PUSHOVER_TOKEN')
    user = os.environ.get('PUSHOVER_USER')

    if not token or not user:
        logger.warning(
            "Pushover credentials not configured. "
            "Set PUSHOVER_TOKEN and PUSHOVER_USER environment variables."
        )
        return None, None

    logger.info("Pushover credentials found")
    return token, user

# 使用示例
token, user = get_pushover_credentials()
if token and user:
    # 发送通知
    pass
else:
    # 跳过通知,静默失败
    pass
```
// Source: Python os module documentation

### Pattern 2: 项目级禁用文件检测
**What:** 使用 `pathlib.Path.is_file()` 检测项目目录中的禁用标志文件
**When to use:** 需要根据文件存在性控制功能的场景
**Example:**
```python
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

def should_send_pushover_notification():
    """
    检查是否应该发送 Pushover 通知

    Returns:
        bool: True 表示应该发送,False 表示应该禁用
    """
    project_dir = Path.cwd()
    no_pushover_file = project_dir / '.no-pushover'

    if no_pushover_file.is_file():
        logger.info(f"Pushover notifications disabled (.no-pushover file found)")
        return False

    return True

def should_send_windows_notification():
    """
    检查是否应该发送 Windows 通知

    Returns:
        bool: True 表示应该发送,False 表示应该禁用
    """
    project_dir = Path.cwd()
    no_windows_file = project_dir / '.no-windows'

    if no_windows_file.is_file():
        logger.info(f"Windows notifications disabled (.no-windows file found)")
        return False

    return True

# 使用示例
if should_send_pushover_notification():
    send_pushover_notification(title, message)
```
// Source: Python pathlib documentation

### Pattern 3: 日志文件清理
**What:** 遍历日志目录,删除修改时间早于指定天数的文件
**When to use:** 需要定期清理旧日志文件的场景
**Example:**
```python
from pathlib import Path
from datetime import datetime, timedelta
import time
import logging

logger = logging.getLogger(__name__)

def cleanup_old_logs(log_dir, days_to_keep=5):
    """
    清理旧日志文件

    Args:
        log_dir: 日志目录路径(Path 对象)
        days_to_keep: 保留最近几天的日志(默认 5 天)
    """
    if not log_dir.exists():
        logger.debug(f"Log directory does not exist: {log_dir}")
        return

    # 计算截止时间(当前时间 - N 天)
    cutoff_time = time.time() - (days_to_keep * 86400)  # 86400 秒/天
    cutoff_date = datetime.fromtimestamp(cutoff_time)
    logger.info(f"Cleaning up log files older than {cutoff_date.strftime('%Y-%m-%d %H:%M:%S')}")

    deleted_count = 0
    kept_count = 0

    # 遍历日志目录中的所有文件
    for log_file in log_dir.glob('claude-notify-*.log'):
        if log_file.is_file():
            file_mtime = log_file.stat().st_mtime

            if file_mtime < cutoff_time:
                try:
                    log_file.unlink()  # 删除文件
                    logger.debug(f"Deleted old log file: {log_file.name}")
                    deleted_count += 1
                except Exception as e:
                    logger.error(f"Failed to delete log file {log_file.name}: {e}")
            else:
                kept_count += 1

    logger.info(f"Log cleanup complete: {deleted_count} deleted, {kept_count} kept")

# 使用示例
log_dir = Path(os.environ.get('APPDATA', '.')) / 'claude-notify' / 'logs'
cleanup_old_logs(log_dir, days_to_keep=5)
```
// Source: pathlib glob pattern, datetime timedelta

### Pattern 4: 诊断模式集成
**What:** 使用 argparse 添加可选的 `--diagnose` 参数,运行诊断逻辑后退出
**When to use:** 需要在同一脚本中提供诊断功能而不影响正常执行流程
**Example:**
```python
import argparse
import sys
from pathlib import Path
import os
import logging

logger = logging.getLogger(__name__)

def diagnose_configuration():
    """
    运行配置诊断,检查环境变量、API 连接、项目配置等
    """
    print("=" * 60)
    print("Claude Notify - Configuration Diagnostics")
    print("=" * 60)

    # 1. 环境变量检查
    print("\n[1] Environment Variables")
    token = os.environ.get('PUSHOVER_TOKEN')
    user = os.environ.get('PUSHOVER_USER')

    if token:
        print(f"  PUSHOVER_TOKEN: {token[:4]}...{token[-4:]} (length: {len(token)})")
    else:
        print("  PUSHOVER_TOKEN: NOT SET")

    if user:
        print(f"  PUSHOVER_USER: {user[:4]}...{user[-4:]} (length: {len(user)})")
    else:
        print("  PUSHOVER_USER: NOT SET")

    # 2. Pushover API 连接测试
    print("\n[2] Pushover API Connection")
    if token and user:
        try:
            import requests
            response = requests.post(
                'https://api.pushover.net/1/messages.json',
                data={
                    'token': token,
                    'user': user,
                    'title': 'Claude Notify Diagnostics',
                    'message': 'Test notification from Claude Code',
                    'priority': 0
                },
                timeout=5
            )
            if response.status_code == 200:
                print("  Status: SUCCESS - Test notification sent")
            else:
                print(f"  Status: FAILED - HTTP {response.status_code}")
                print(f"  Error: {response.text}")
        except Exception as e:
            print(f"  Status: FAILED - {e}")
    else:
        print("  Status: SKIPPED - Credentials not configured")

    # 3. 项目配置文件检测
    print("\n[3] Project Configuration Files")
    project_dir = Path.cwd()
    no_pushover = project_dir / '.no-pushover'
    no_windows = project_dir / '.no-windows'

    print(f"  .no-pushover: {'FOUND (Pushover disabled)' if no_pushover.is_file() else 'Not found'}")
    print(f"  .no-windows: {'FOUND (Windows disabled)' if no_windows.is_file() else 'Not found'}")

    # 4. 日志文件状态
    print("\n[4] Log Files")
    log_dir = Path(os.environ.get('APPDATA', '.')) / 'claude-notify' / 'logs'
    if log_dir.exists():
        log_files = list(log_dir.glob('claude-notify-*.log'))
        print(f"  Log directory: {log_dir}")
        print(f"  Total log files: {len(log_files)}")
        if log_files:
            latest = max(log_files, key=lambda f: f.stat().st_mtime)
            print(f"  Latest log: {latest.name}")
    else:
        print(f"  Log directory does not exist: {log_dir}")

    print("\n" + "=" * 60)
    print("Diagnostics complete.")

def main():
    """主函数,支持诊断模式和正常通知模式"""
    parser = argparse.ArgumentParser(
        description='Claude Code Notification Script'
    )
    parser.add_argument(
        '--diagnose',
        action='store_true',
        help='Run configuration diagnostics and exit'
    )
    args = parser.parse_args()

    if args.diagnose:
        # 诊断模式
        diagnose_configuration()
        return 0

    # 正常通知模式
    # ... (现有的通知逻辑)

if __name__ == '__main__':
    sys.exit(main())
```
// Source: Python argparse documentation

### Anti-Patterns to Avoid
- **直接使用 `os.environ['KEY']` 而不检查存在性:** 会导致 KeyError 崩溃
- **使用 `Path.exists()` 而非 `Path.is_file()` 可能误判目录:** 如果恰好有同名目录会返回 True
- **硬编码日志保留天数而不提供参数:** 应该允许调用者自定义清理策略
- **诊断模式抛出异常而非优雅退出:** 诊断应该报告所有问题而不是遇到第一个错误就退出

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 路径拼接和文件操作 | 字符串拼接 + os.path | pathlib.Path | pathlib 处理跨平台路径分隔符,API 更清晰 |
| 命令行参数解析 | sys.argv 手动解析 | argparse | argparse 自动生成帮助信息,支持类型转换 |
| 时间差计算 | 手动计算秒数 | datetime.timedelta | timedelta 可读性好,自动处理闰年等边界情况 |
| 日志文件清理 | 自定义文件遍历 | pathlib.Path.glob() | glob 模式匹配更简洁,支持通配符 |

**Key insight:** 配置管理和日志清理是常见需求,Python 标准库提供了完善的工具,无需引入第三方依赖或手写复杂逻辑。

## Common Pitfalls

### Pitfall 1: 环境变量读取时的 KeyError
**What goes wrong:** 使用 `os.environ['KEY']` 直接访问不存在的环境变量会抛出 KeyError
**Why it happens:** `os.environ` 是字典,访问不存在的键会抛出异常
**How to avoid:** 始终使用 `os.environ.get('KEY', default)` 或检查 `if 'KEY' in os.environ`
**Warning signs:** 脚本在缺少环境变量时崩溃,显示 KeyError traceback

### Pitfall 2: 文件存在性检查时混淆文件和目录
**What goes wrong:** 使用 `Path.exists()` 检查文件时,如果存在同名目录也会返回 True
**Why it happens:** `exists()` 对文件和目录都返回 True
**How to avoid:** 使用 `Path.is_file()` 检查文件,使用 `Path.is_dir()` 检查目录
**Warning signs:** 禁用文件检测失败,即使创建了 .no-pushover 目录仍然发送通知

### Pitfall 3: 日志清理时的时间比较错误
**What goes wrong:** 比较 `datetime` 对象和 `time.time()` 时间戳导致类型错误
**Why it happens:** `stat().st_mtime` 返回 Unix 时间戳(float),而 `datetime` 对象是不同的类型
**How to avoid:** 统一使用时间戳比较,或将时间戳转换为 datetime 对象后再比较
**Warning signs:** 日志清理时抛出 TypeError,或错误地删除了新日志文件

### Pitfall 4: argparse 参数命名不一致
**What goes wrong:** 长选项和短选项命名不清晰,或与其他工具的惯例不符
**Why it happens:** 没有遵循常见的命令行工具命名惯例
**How to avoid:** 使用常见的命名模式,如 `--diagnose` / `-d`,`--verbose` / `-v`
**Warning signs:** 用户不知道如何调用诊断功能,需要查看源码

### Pitfall 5: 诊断输出在 Windows 上编码错误
**What goes wrong:** 诊断输出包含特殊字符时在 Windows 命令行显示乱码
**Why it happens:** Windows 默认使用 GBK/CP1252 编码,而脚本使用 UTF-8
**How to avoid:** 诊断输出使用 ASCII 字符,或在脚本开头设置 `sys.stdout` 编码为 UTF-8
**Warning signs:** 诊断输出在 Windows 上显示乱码或抛出 UnicodeEncodeError

## Code Examples

Verified patterns from official sources:

### 环境变量安全读取 + 静默失败
```python
import os
import logging

logger = logging.getLogger(__name__)

def get_pushover_credentials():
    """
    安全读取 Pushover 凭据,缺失时记录日志但不崩溃

    Returns:
        tuple: (token, user) 或 (None, None)
    """
    token = os.environ.get('PUSHOVER_TOKEN')
    user = os.environ.get('PUSHOVER_USER')

    if not token or not user:
        logger.warning(
            "Pushover credentials not configured. "
            "Set PUSHOVER_TOKEN and PUSHOVER_USER environment variables."
        )
        return None, None

    logger.info("Pushover credentials found")
    return token, user

# 使用示例
token, user = get_pushover_credentials()
if token and user:
    # 发送通知
    send_pushover_notification(title, message, token, user)
else:
    # 跳过通知,静默失败
    logger.info("Skipping Pushover notification (credentials not configured)")
```
// Source: Python os module documentation - https://docs.python.org/3/library/os.html#os.environ

### 文件存在性检查 + 项目级控制
```python
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

def check_notification_flags():
    """
    检查项目级通知禁用标志

    Returns:
        dict: {'pushover': bool, 'windows': bool}
    """
    project_dir = Path.cwd()

    flags = {
        'pushover_disabled': (project_dir / '.no-pushover').is_file(),
        'windows_disabled': (project_dir / '.no-windows').is_file()
    }

    if flags['pushover_disabled']:
        logger.info("Pushover notifications disabled by .no-pushover file")

    if flags['windows_disabled']:
        logger.info("Windows notifications disabled by .no-windows file")

    return flags

# 使用示例
flags = check_notification_flags()

if not flags['pushover_disabled']:
    send_pushover_notification(title, message)

if not flags['windows_disabled']:
    send_windows_notification(title, message)
```
// Source: Python pathlib documentation - https://docs.python.org/3/library/pathlib.html

### 日志文件清理(保留最近 N 天)
```python
from pathlib import Path
from datetime import datetime, timedelta
import time
import logging

logger = logging.getLogger(__name__)

def cleanup_old_logs(log_dir, days_to_keep=5):
    """
    清理旧日志文件,保留最近 N 天

    Args:
        log_dir: 日志目录路径(Path 对象或字符串)
        days_to_keep: 保留最近几天的日志(默认 5 天)
    """
    log_dir = Path(log_dir)

    if not log_dir.exists():
        logger.debug(f"Log directory does not exist: {log_dir}")
        return

    # 计算截止时间戳(当前时间 - N 天)
    cutoff_timestamp = time.time() - (days_to_keep * 86400)
    cutoff_date = datetime.fromtimestamp(cutoff_timestamp)

    logger.info(
        f"Cleaning up log files older than "
        f"{cutoff_date.strftime('%Y-%m-%d %H:%M:%S')}"
    )

    deleted_count = 0
    kept_count = 0

    # 遍历匹配的日志文件
    for log_file in log_dir.glob('claude-notify-*.log'):
        if log_file.is_file():
            file_mtime = log_file.stat().st_mtime

            if file_mtime < cutoff_timestamp:
                try:
                    log_file.unlink()
                    logger.debug(f"Deleted old log file: {log_file.name}")
                    deleted_count += 1
                except Exception as e:
                    logger.error(f"Failed to delete {log_file.name}: {e}")
            else:
                kept_count += 1

    logger.info(f"Log cleanup: {deleted_count} deleted, {kept_count} kept")

# 使用示例
log_dir = Path(os.environ.get('APPDATA', '.')) / 'claude-notify' / 'logs'
cleanup_old_logs(log_dir, days_to_keep=5)
```
// Source: pathlib glob + datetime + time modules

### argparse 诊断模式集成
```python
import argparse
import sys

def main():
    """主函数,支持 --diagnose 参数"""
    parser = argparse.ArgumentParser(
        description='Claude Code Notification Script',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument(
        '--diagnose', '-d',
        action='store_true',
        help='Run configuration diagnostics and exit'
    )

    args = parser.parse_args()

    if args.diagnose:
        # 诊断模式
        diagnose_configuration()
        return 0

    # 正常通知模式
    # ... (现有的通知逻辑)

def diagnose_configuration():
    """运行配置诊断"""
    print("=" * 60)
    print("Claude Notify - Configuration Diagnostics")
    print("=" * 60)

    # 检查环境变量
    print("\n[1] Environment Variables")
    token = os.environ.get('PUSHOVER_TOKEN')
    user = os.environ.get('PUSHOVER_USER')

    if token:
        print(f"  PUSHOVER_TOKEN: {token[:4]}...{token[-4:]}")
    else:
        print("  PUSHOVER_TOKEN: NOT SET")

    # ... 更多诊断检查

    print("\nDiagnostics complete.")

if __name__ == '__main__':
    sys.exit(main())
```
// Source: Python argparse documentation - https://docs.python.org/3/library/argparse.html

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 直接访问 `os.environ['KEY']` | `os.environ.get('KEY', default)` | 本项目 | 避免 KeyError,支持静默失败 |
| 使用 `os.path` 模块 | `pathlib.Path` | Python 3.4+ | 面向对象 API,代码更清晰 |
| 手动计算时间差(秒) | `datetime.timedelta` | 始终推荐 | 可读性更好,减少计算错误 |

**Deprecated/outdated:**
- `os.path.join()` → 推荐 `Path() / 'subdir'` (pathlib 更直观)
- 字符串格式化 `%s` → 推荐 f-string (Python 3.6+,更清晰)

## Open Questions

1. **诊断输出的详细程度**
   - What we know: 需要显示环境变量(部分掩码)、API 连接状态、项目配置、日志状态
   - What's unclear: 是否需要显示更多细节(如 API 响应时间、文件大小等)?
   - Recommendation: 保持简洁,仅显示关键信息。用户如需更多细节可查看日志文件。

2. **日志清理的时机**
   - What we know: 每次 notify.py 运行时执行清理
   - What's unclear: 是否应该在诊断模式下也执行清理?
   - Recommendation: 诊断模式仅报告日志状态,不执行清理。清理仅在正常通知模式下进行。

3. **环境变量掩码的安全性**
   - What we know: 显示前4位和后4位字符用于确认
   - What's unclear: 对于短 token(如<10字符)如何处理?
   - Recommendation: 如果 token 长度<10,仅显示前2位和后2位;如果<5,显示 "****" 完全掩码。

4. **错误日志的具体措辞**
   - What we know: 需要提示用户设置环境变量
   - What's unclear: 是否应该包含完整的配置步骤?
   - Recommendation: 简短提示 + 指向文档。例如: "Set PUSHOVER_TOKEN and PUSHOVER_USER env vars. See: [URL]"

## Sources

### Primary (HIGH confidence)
- https://docs.python.org/3/library/os.html#os.environ - Python os.environ 官方文档
- https://docs.python.org/3/library/pathlib.html - Python pathlib 官方文档
- https://docs.python.org/3/library/argparse.html - Python argparse 官方文档
- https://docs.python.org/3/library/datetime.html - Python datetime 官方文档

### Secondary (MEDIUM confidence)
- https://www.geeksforgeeks.org/python/delete-files-older-than-n-days-in-python/ - 删除旧文件的多种方法
- https://docs.python.org/3/library/logging.html - Python logging 官方文档

### Tertiary (LOW confidence)
- CSDN 掘金等中文社区博客 - 需要验证代码示例的正确性和时效性

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - 全部使用 Python 标准库,文档完整,示例丰富
- Architecture: HIGH - 模式清晰,标准库提供了完善的工具
- Pitfalls: MEDIUM - 部分边界情况(如短 token 掩码)需要实际测试验证

**Research date:** 2026-02-24
**Valid until:** 2026-08-24 (6 个月,Python 标准库 API 稳定)
