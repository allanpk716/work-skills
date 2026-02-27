# Phase 13: Add slash commands /notify-enable and /notify-disable to claude-notify plugin for toggling notification channels (pushover/windows) - Research

**Researched:** 2026-02-27
**Domain:** Claude Code plugin development, slash commands, file-based state management
**Confidence:** HIGH

## Summary

This phase adds user-friendly slash commands to control notification channel states in the claude-notify plugin. The implementation leverages existing flag-file infrastructure (`.no-pushover`, `.no-windows`) and follows Claude Code plugin best practices for slash command definition.

**Primary recommendation:** Implement slash commands as Python scripts invoked from SKILL.md, manipulating flag files with idempotent operations and providing clear bilingual feedback.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### 状态查询命令
- 添加 `/notify-status` 命令,用于查看当前通知通道状态
- 不支持参数,始终显示所有通道(pushover + windows)的状态
- 使用简洁状态显示:每个通道的启用/禁用状态
- 使用图标符号(✓/✗)表示状态,直观明了
- 示例输出格式:
  ```
  Pushover 通知: ✓ 已启用
  Windows 通知: ✗ 已禁用
  ```

#### 命令参数设计
- `/notify-enable` 和 `/notify-disable` 命令**强制要求参数**(pushover 或 windows)
- 不支持无参数调用,必须明确指定要操作的通道
- 这确保操作的明确性,避免意外批量操作
- 示例:`/notify-disable pushover`(正确)、`/notify-disable`(错误)

#### 操作反馈详细度
- 使用简洁确认消息,仅显示操作结果
- 幂等操作时明确提示"已处于该状态"
  - 例如:`/notify-disable pushover`(已是禁用状态)→ "Pushover 通知已处于禁用状态"
- 无批量操作反馈(因强制参数设计,不存在批量操作场景)
- 使用纯文本格式,不使用图标或 emoji,保持与 Claude 其他消息的一致性
- 反馈示例:
  - 成功禁用:"Pushover 通知已禁用"
  - 已处于该状态:"Pushover 通知已处于禁用状态"
  - 成功启用:"Windows 通知已启用"

#### 错误处理策略
- **无效参数**:显示详细帮助信息
  - 错误消息 + 正确用法示例 + 可用选项列表
  - 示例:`/notify-disable email` → "错误:无效参数 'email'。可用选项:pushover, windows。用法:/notify-disable <pushover|windows>"
- **文件操作失败**:立即停止执行
  - 权限问题、磁盘满等错误时,显示错误信息并停止
  - 不尝试继续执行其他操作
- **错误信息格式**:简洁明了
  - 避免技术术语,使用用户友好的语言
  - 包含明确的解决建议
- **参数缺失**:显示错误提示
  - 强制参数设计,无参数时提示用法
  - 示例:`/notify-disable` → "错误:缺少参数。用法:/notify-disable <pushover|windows>"

#### 幂等性保证
- 所有命令操作都是幂等的
- 多次执行相同命令不会产生副作用
- 状态检查在操作前执行,避免不必要的文件操作
- 示例:
  - 已禁用时再次 disable → 提示已处于该状态,不重复创建文件
  - 已启用时再次 enable → 提示已处于该状态,不尝试删除不存在的文件

### Claude's Discretion

Implementation details not specified by user:
- Script location and naming
- Error handling for edge cases (file permission errors, disk full)
- Logging and debugging support
- Integration testing approach

### Deferred Ideas (OUT OF SCOPE)

- Toggle 切换命令(如 `/notify-toggle`)— 当前使用明确的 enable/disable 更清晰,避免用户不确定当前状态
- 全局通知控制(所有项目统一设置)— 当前仅支持项目级控制,全局控制需要额外的配置管理
- 通知延迟/定时发送 — 这属于通知调度功能,与当前的状态切换功能不同
- 通知通道扩展(邮件、Slack 等)— 属于新的通知渠道集成,是独立的功能模块

</user_constraints>

## Standard Stack

### Core
| Library/Tool | Version | Purpose | Why Standard |
|--------------|---------|---------|--------------|
| Python | 3.8+ | Command implementation | Existing plugin uses Python, Windows pre-installed |
| pathlib | stdlib | Path manipulation | Cross-platform, modern Python API |
| os | stdlib | File operations | Direct file existence checks and creation/deletion |

### Supporting
| Library/Tool | Version | Purpose | When to Use |
|--------------|---------|---------|-------------|
| sys | stdlib | CLI argument parsing | Parsing command parameters (pushover/windows) |
| typing | stdlib | Type hints | Better code documentation and IDE support |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Python scripts | PowerShell scripts | Python consistent with existing notify.py, easier maintenance |
| File flags | JSON config | Flag files simpler, no parsing, existing pattern |
| SKILL.md commands | Separate command files | SKILL.md follows best practices, avoids duplication |

**Installation:**
No new dependencies required - uses Python standard library only.

## Architecture Patterns

### Recommended Project Structure
```
plugins/claude-notify/
├── .claude-plugin/
│   └── plugin.json
├── skills/
│   └── claude-notify/
│       └── SKILL.md              # Slash command definitions
├── scripts/
│   ├── notify-enable.py          # Enable channel script
│   ├── notify-disable.py         # Disable channel script
│   ├── notify-status.py          # Query status script
│   └── verify-installation.py    # Existing verification script
└── tests/
    ├── test_notify_enable.py
    ├── test_notify_disable.py
    └── test_notify_status.py
```

### Pattern 1: Slash Command Definition in SKILL.md
**What:** Define slash commands directly in SKILL.md using `<slash_commands>` section
**When to use:** All plugin commands should use this pattern
**Example:**
```markdown
<slash_commands>

## /notify-enable

Enable a notification channel.

**Usage:**
```
/notify-enable <pushover|windows>
```

**Parameters:**
- `pushover` - Enable Pushover notifications
- `windows` - Enable Windows Toast notifications

**Examples:**
```
/notify-enable pushover
/notify-enable windows
```

**How it works:**
This command calls `scripts/notify-enable.py` which:
1. Validates the parameter
2. Checks if the channel is already enabled
3. Removes the `.no-{channel}` flag file if needed
4. Returns status message

## /notify-disable

Disable a notification channel.

**Usage:**
```
/notify-disable <pushover|windows>
```

**Parameters:**
- `pushover` - Disable Pushover notifications
- `windows` - Disable Windows Toast notifications

**Examples:**
```
/notify-disable pushover
/notify-disable windows
```

## /notify-status

Show current notification channel status.

**Usage:**
```
/notify-status
```

**Output:**
```
Pushover 通知: ✓ 已启用
Windows 通知: ✗ 已禁用
```

</slash_commands>
```

### Pattern 2: File-Based State Management
**What:** Use presence/absence of flag files to represent state
**When to use:** Binary on/off state management for notification channels
**Example:**
```python
from pathlib import Path

# Get flag file path
flag_file = Path.cwd() / ".no-pushover"

# Check if disabled (file exists)
is_disabled = flag_file.exists()

# Enable (remove file)
if is_disabled:
    flag_file.unlink()
    print("Pushover 通知已启用")

# Disable (create file)
if not is_disabled:
    flag_file.touch()
    print("Pushover 通知已禁用")
```

### Pattern 3: Idempotent Operations with State Checking
**What:** Check current state before performing operations
**When to use:** All enable/disable operations to avoid unnecessary file ops
**Example:**
```python
def enable_channel(channel: str) -> None:
    flag_file = Path.cwd() / f".no-{channel}"

    if not flag_file.exists():
        # Already enabled
        print(f"{channel.capitalize()} 通知已处于启用状态")
        return

    # Perform enable operation
    flag_file.unlink()
    print(f"{channel.capitalize()} 通知已启用")
```

### Anti-Patterns to Avoid
- **Creating separate command files in commands/ directory**: Causes command duplication, use SKILL.md instead
- **Non-idempotent operations**: Repeatedly running same command should have same result
- **Missing parameter validation**: Accept invalid channel names without clear error
- **Silent operations**: No user feedback on success/failure
- **Batch operations without explicit request**: Operating on all channels when only one specified

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Path manipulation | String concatenation | `pathlib.Path` | Handles Windows paths correctly, cross-platform |
| File existence checks | `os.path.exists()` | `Path.exists()` | More readable, object-oriented |
| File creation | `open(file, 'w')` | `Path.touch()` | Simpler API for flag files |
| Argument parsing | Custom split/logic | `sys.argv` + validation | Standard Python pattern |

**Key insight:** Flag file operations are simple enough that custom state management adds unnecessary complexity.

## Common Pitfalls

### Pitfall 1: Not Validating Channel Parameters
**What goes wrong:** User typos like `/notify-disable pushoverr` silently fail or create wrong flag files
**Why it happens:** Missing input validation, assuming user always provides correct parameters
**How to avoid:**
```python
VALID_CHANNELS = {'pushover', 'windows'}

if channel not in VALID_CHANNELS:
    print(f"错误:无效参数 '{channel}'。可用选项:pushover, windows。用法:/notify-disable <pushover|windows>")
    sys.exit(1)
```
**Warning signs:** Flag files with wrong names appearing, users confused why commands don't work

### Pitfall 2: Non-Idempotent Operations
**What goes wrong:** Repeated disable commands show "已禁用" multiple times instead of "已处于该状态"
**Why it happens:** Not checking current state before operation
**How to avoid:**
```python
# BAD
flag_file.touch()
print("已禁用")

# GOOD
if flag_file.exists():
    print("已处于禁用状态")
else:
    flag_file.touch()
    print("已禁用")
```
**Warning signs:** Users unsure if operation succeeded, repeated messages on re-run

### Pitfall 3: Missing Error Messages
**What goes wrong:** Command fails silently, user doesn't know what went wrong
**Why it happens:** Relying on Python exceptions without user-friendly messages
**How to avoid:**
```python
try:
    if channel == 'pushover':
        flag_file = Path.cwd() / ".no-pushover"
    elif channel == 'windows':
        flag_file = Path.cwd() / ".no-windows"
    else:
        print(f"错误:无效参数 '{channel}'。可用选项:pushover, windows")
        sys.exit(1)
except Exception as e:
    print(f"错误:操作失败 - {e}")
    sys.exit(1)
```
**Warning signs:** Users retrying commands, confusion about current state

### Pitfall 4: File Permission Errors on Windows
**What goes wrong:** `PermissionError` when creating/deleting flag files in protected directories
**Why it happens:** Running in system directories, antivirus interference, file locks
**How to avoid:**
```python
try:
    flag_file.unlink()
except PermissionError:
    print(f"错误:无法删除文件 {flag_file}。请检查文件权限。")
    sys.exit(1)
except FileNotFoundError:
    # File already deleted, that's fine
    pass
```
**Warning signs:** Commands work in some directories but not others, random failures

## Code Examples

Verified patterns from existing claude-notify codebase:

### Flag File Check (from notify.py)
```python
# Source: plugins/claude-notify/hooks/scripts/notify.py:96-116
import os
from pathlib import Path

def should_send_pushover() -> bool:
    """Check if Pushover notifications should be sent."""
    no_pushover_file = Path.cwd() / ".no-pushover"
    return not no_pushover_file.exists()

def should_send_windows() -> bool:
    """Check if Windows Toast notifications should be sent."""
    no_windows_file = Path.cwd() / ".no-windows"
    return not no_windows_file.exists()
```

### File Creation Pattern (Windows-compatible)
```python
# Create flag file (disable channel)
from pathlib import Path

def disable_channel(channel: str) -> str:
    """Disable a notification channel by creating flag file."""
    flag_file = Path.cwd() / f".no-{channel}"

    if flag_file.exists():
        return f"{channel.capitalize()} 通知已处于禁用状态"

    try:
        flag_file.touch()
        return f"{channel.capitalize()} 通知已禁用"
    except OSError as e:
        return f"错误:无法创建标志文件 - {e}"
```

### Parameter Validation Pattern
```python
# Validate channel parameter
import sys

VALID_CHANNELS = {'pushover', 'windows'}

def validate_channel(channel: str) -> bool:
    """Validate channel parameter and show error if invalid."""
    if channel not in VALID_CHANNELS:
        print(f"错误:无效参数 '{channel}'。")
        print(f"可用选项:{', '.join(sorted(VALID_CHANNELS))}")
        print(f"用法:/notify-disable <pushover|windows>")
        return False
    return True

# Usage
if len(sys.argv) < 2:
    print("错误:缺少参数。用法:/notify-disable <pushover|windows>")
    sys.exit(1)

channel = sys.argv[1].lower()
if not validate_channel(channel):
    sys.exit(1)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual file creation | Slash commands | This phase | Improved UX, reduced errors |
| Separate command files | SKILL.md definitions | 2026-02-25 | Avoids duplication, follows best practices |

**Deprecated/outdated:**
- `commands/` directory for slash commands: Causes duplication, use SKILL.md instead

## Open Questions

1. **Should commands support abbreviated channel names?**
   - What we know: User constraint specifies full names (pushover/windows)
   - What's unclear: Whether to accept abbreviations (p/w, push/win)
   - Recommendation: No - stick to full names for clarity, matches user requirement

2. **Should status command show environment variable configuration?**
   - What we know: Status shows enabled/disabled state
   - What's unclear: Whether to also show PUSHOVER_TOKEN/PUSHOVER_USER status
   - Recommendation: No - status focuses on channel state, env vars are configuration

3. **Error handling for concurrent file access?**
   - What we know: Flag files can be accessed by multiple processes
   - What's unclear: How to handle race conditions (two processes creating file simultaneously)
   - Recommendation: Accept race condition - operations are idempotent, rare edge case

## Sources

### Primary (HIGH confidence)
- plugins/claude-notify/hooks/scripts/notify.py:96-116 - Existing flag file pattern
- plugins/claude-notify/SKILL.md - Plugin structure and documentation
- docs/plugin-development-best-practices.md - Slash command best practices

### Secondary (MEDIUM confidence)
- .planning/todos/pending/2026-02-25-add-slash-commands-to-toggle-notification-channels.md - Original feature request

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Uses existing Python stdlib patterns, consistent with codebase
- Architecture: HIGH - Follows established plugin patterns, clear structure
- Pitfalls: HIGH - Based on actual Windows file operations, known error cases

**Research date:** 2026-02-27
**Valid until:** 30 days (stable Python stdlib APIs, no fast-moving dependencies)
