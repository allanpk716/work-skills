# Phase 27: Global Control - Research

**Researched:** 2026-04-01
**Domain:** Notification flag global fallback in Python pathlib
**Confidence:** HIGH

## Summary

Phase 27 在已有的 `flags.py:check_notification_flags()` 函数末尾追加全局回退逻辑：当项目级向上遍历未找到 `.no-xxx` 标志时，检查 `~/.claude/.no-pushover` 和 `~/.claude/.no-windows`。核心改动集中在 1 个文件（flags.py），加上 3 个斜杠命令脚本（notify-enable、notify-disable、notify-status）添加 `--global` 参数支持。

改动范围小且明确：flags.py 的 while 循环结束后、return 之前插入约 10 行全局检测代码；返回值新增 2 个字段。调用方（notify.py、notify-attention.py）不需要改动，因为它们只读 `pushover_disabled`/`windows_disabled` 布尔值。

**Primary recommendation:** 在 `flags.py` 的 return 语句前（第 99 行后）追加全局回退检测块，使用 `Path.home() / '.claude'` 构建全局路径。斜杠命令用 `argparse` 或简单的 `sys.argv` 解析添加 `--global` 布尔标志。

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-11:** 全局检测内置在 `check_notification_flags()` 中。项目级向上遍历结束后，对仍为 `disabled=False` 的渠道自动检查 `~/.claude/.no-xxx`。调用方无需改动调用方式
- **D-11a:** 检测顺序：先项目级遍历，后全局回退。项目级找到的标志优先级高于全局（GLOB-02）
- **D-11b:** `~/.claude/` 路径通过 `Path.home() / '.claude'` 获取，跨平台兼容
- **D-12:** 返回值新增 `global_pushover_path` 和 `global_windows_path` 字段（Optional[Path]）。`pushover_path`/`windows_path` 始终指项目级路径，`global_*` 单独记录全局路径
- **D-12a:** 完整返回值结构：
  ```python
  {
      'pushover_disabled': bool,
      'windows_disabled': bool,
      'pushover_path': Optional[Path],      # 项目级路径
      'windows_path': Optional[Path],       # 项目级路径
      'global_pushover_path': Optional[Path],  # ~/.claude/.no-pushover 路径
      'global_windows_path': Optional[Path],   # ~/.claude/.no-windows 路径
  }
  ```
- **D-12b:** Phase 28 诊断模式可直接通过 `global_*_path is not None` 区分来源
- **D-13:** `notify-enable` / `notify-disable` 命令本 phase 一并支持 `--global` 参数
- **D-13a:** `--global` 模式下操作 `~/.claude/.no-xxx` 文件而非项目级 `.no-xxx` 文件
- **D-13b:** 无 `--global` 时行为不变（操作项目级文件）

### Claude's Discretion
- `check_notification_flags()` 内部全局检测的具体代码位置（函数末尾 vs 循环后独立段）
- `notify-enable.py` / `notify-disable.py` 中 `--global` 参数的解析方式
- 日志中记录全局检测结果的详细程度
- `notify-status.py` 是否需要同步显示全局标志状态

### Deferred Ideas (OUT OF SCOPE)
- 诊断模式显示全局查找结果 -- Phase 28
- 测试覆盖全局查找场景 -- Phase 28
- 交互式全局通知开关命令 -- Out of Scope（REQUIREMENTS.md）
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GLOB-01 | 支持 `~/.claude/.no-pushover` 和 `~/.claude/.no-windows` 文件作为全局通知屏蔽，对所有项目生效 | flags.py return 前追加全局检测块，使用 `Path.home() / '.claude'` 构建路径 |
| GLOB-02 | 查找优先级：项目级（当前目录向上）优先，`~/.claude/` 全局作为回退 | while 循环已完成项目级检测后，仅对 `disabled=False` 的渠道检查全局标志 |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pathlib (stdlib) | Python 3.10+ | Path manipulation for flag file detection | stdlib, no dependency, `Path.home()` is canonical |
| unittest.mock (stdlib) | Python 3.10+ | Mocking filesystem in tests | Existing test pattern in test_flags.py |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| pytest | 9.0.2 | Test runner | All test files, already in use |
| logging (stdlib) | Python 3.10+ | Diagnostic output | Already used in flags.py |

**Installation:**
No new packages needed. All dependencies are Python stdlib or already installed.

## Architecture Patterns

### Current Code Structure
```
plugins/claude-notify/
  hooks/scripts/
    flags.py          # <-- PRIMARY modification target
    notify.py         # Caller, reads flags['pushover_disabled'] etc.
    notify-attention.py  # Caller, same pattern
  scripts/
    notify-enable.py  # Add --global flag
    notify-disable.py # Add --global flag
    notify-status.py  # Optional: display global status
  tests/
    test_flags.py         # 12 tests, extend return structure check
    test_notify_enable.py # Extend for --global
    test_notify_disable.py # Extend for --global
    test_notify_status.py  # Optional: global status display
```

### Pattern 1: Global Fallback in check_notification_flags()
**What:** After the while loop completes project-level traversal, check global paths for any channel still not disabled.
**When to use:** This is the D-11 locked decision.
**Implementation point:** flags.py lines 99-104 (after logging, before return).

```python
# Source: flags.py, inserted before return statement
# Global fallback: check ~/.claude/.no-xxx for channels not found at project level
global_dir = Path.home() / '.claude'
global_pushover_path = None
global_windows_path = None

if not pushover_disabled:
    global_flag = global_dir / '.no-pushover'
    if global_flag.is_file():
        pushover_disabled = True
        global_pushover_path = global_flag
        logger.info(f"Pushover disabled by global flag {global_flag}")

if not windows_disabled:
    global_flag = global_dir / '.no-windows'
    if global_flag.is_file():
        windows_disabled = True
        global_windows_path = global_flag
        logger.info(f"Windows disabled by global flag {global_flag}")
```

### Pattern 2: --global Flag in Slash Commands
**What:** Add `--global` optional flag to notify-enable.py and notify-disable.py.
**When to use:** This is the D-13 locked decision.
**Example:**
```python
# notify-disable.py with --global support
import sys
from pathlib import Path

VALID_CHANNELS = {'pushover', 'windows'}

def disable_channel(channel: str, use_global: bool = False) -> str:
    if use_global:
        flag_file = Path.home() / '.claude' / f".no-{channel}"
    else:
        flag_file = Path.cwd() / f".no-{channel}"
    # ... rest unchanged

def main():
    args = sys.argv[1:]
    use_global = '--global' in args
    args = [a for a in args if a != '--global']

    if len(args) != 1:
        print("用法:/notify-disable <pushover|windows> [--global]")
        sys.exit(1)

    channel = args[0].lower()
    if channel not in VALID_CHANNELS:
        print(f"错误:无效参数 '{channel}'。")
        sys.exit(1)

    result = disable_channel(channel, use_global=use_global)
    print(result)
```

### Anti-Patterns to Avoid
- **Checking global BEFORE project-level:** Must be fallback only (D-11a). Project-level flags take priority.
- **Modifying callers (notify.py, notify-attention.py):** These should remain untouched. They only read `pushover_disabled`/`windows_disabled` which will now correctly reflect global state.
- **Adding global paths to `pushover_path`/`windows_path`:** These must stay project-level only. Use separate `global_*` fields (D-12).
- **Creating the ~/.claude/ directory:** Only check if files exist. Don't mkdir. The directory already exists for Claude Code users.
- **Over-engineering argparse:** Keep simple `sys.argv` parsing consistent with existing pattern. No need for argparse module.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Home directory resolution | Custom env var parsing | `Path.home()` | Handles Windows/Linux/macOS, handles edge cases |
| Cross-platform path construction | String concatenation with `/` or `\` | `Path.home() / '.claude'` | pathlib handles separators correctly |
| Global vs project path selection | Complex path abstraction | Simple `if use_global:` branch | Two clearly distinct locations, no abstraction needed |

**Key insight:** This phase is straightforward because all the hard work (upward traversal, channel independence, CLAUDE.md detection) was done in Phase 26. Global is just a two-line check per channel after the loop.

## Common Pitfalls

### Pitfall 1: Existing test_return_structure_includes_paths will break
**What goes wrong:** `test_flags.py::test_return_structure_includes_paths` (line 449-492) asserts `set(result.keys())` equals exactly `{'pushover_disabled', 'windows_disabled', 'pushover_path', 'windows_path'}`. Adding `global_*` fields will fail this test.
**Why it happens:** The test hardcodes the expected key set.
**How to avoid:** Update this test's expected key set to include `global_pushover_path` and `global_windows_path`. Also assert they are `None` (since the mock doesn't set up global paths).
**Warning signs:** Test runner shows AssertionError on key set comparison.

### Pitfall 2: notify-status.py only checks CWD
**What goes wrong:** `notify-status.py:get_channel_status()` only checks `Path.cwd() / f".no-{channel}"`. It does not use `check_notification_flags()`. If the user expects `/notify-status` to reflect global state, it will be wrong.
**Why it happens:** notify-status was written before the find-up and global features.
**How to avoid:** This is Claude's discretion per CONTEXT.md. Options: (a) update to use `check_notification_flags()`, (b) add separate global status display, (c) leave as-is. Recommend (a) for consistency.
**Warning signs:** User creates `~/.claude/.no-pushover`, runs `/notify-status`, sees "enabled" despite notifications being blocked.

### Pitfall 3: Mocking Path.home() in tests
**What goes wrong:** Existing tests mock `flags.Path` class. `Path.home()` is a class method that must also be mocked to test global behavior.
**Why it happens:** The existing mock pattern uses `@patch('flags.Path')` which replaces the entire class, including `home()`.
**How to avoid:** When adding global tests, ensure `mock_path_class.home()` returns a mock path whose `__truediv__` returns the expected global flag mock. Alternatively, use the Phase 28 test approach (already deferred).
**Warning signs:** Tests get AttributeError or return unexpected values for global checks.

### Pitfall 4: --global flag order in sys.argv
**What goes wrong:** User types `/notify-disable --global pushover` but existing code expects channel as first positional arg.
**Why it happens:** `sys.argv[1]` is hardcoded as the channel.
**How to avoid:** Parse args flexibly: filter out `--global`, then treat remaining args as positional.
**Warning signs:** "invalid parameter '--global'" error message.

## Code Examples

### Global Fallback Block (verified against flags.py structure)

```python
# Insert at flags.py line 99, BEFORE the return statement
# (after the logging block for project-level results)

# Global fallback: ~/.claude/.no-xxx for channels not disabled at project level
global_dir = Path.home() / '.claude'
global_pushover_path = None
global_windows_path = None

if not pushover_disabled:
    global_flag = global_dir / '.no-pushover'
    if global_flag.is_file():
        pushover_disabled = True
        global_pushover_path = global_flag
        logger.info(f"Pushover disabled by global flag {global_flag}")

if not windows_disabled:
    global_flag = global_dir / '.no-windows'
    if global_flag.is_file():
        windows_disabled = True
        global_windows_path = global_flag
        logger.info(f"Windows disabled by global flag {global_flag}")
```

### Updated Return Statement

```python
return {
    'pushover_disabled': pushover_disabled,
    'windows_disabled': windows_disabled,
    'pushover_path': pushover_path,
    'windows_path': windows_path,
    'global_pushover_path': global_pushover_path,
    'global_windows_path': global_windows_path,
}
```

### --global in notify-disable.py (minimal change pattern)

```python
def main():
    args = sys.argv[1:]
    use_global = '--global' in args
    args = [a for a in args if a != '--global']

    if len(args) != 1:
        print("用法:/notify-disable <pushover|windows> [--global]")
        sys.exit(1)

    channel = args[0].lower()
    if channel not in VALID_CHANNELS:
        print(f"错误:无效参数 '{channel}'。")
        print(f"可用选项:{', '.join(sorted(VALID_CHANNELS))}")
        print(f"用法:/notify-disable <pushover|windows> [--global]")
        sys.exit(1)

    result = disable_channel(channel, use_global=use_global)
    print(result)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CWD-only flag check | Upward traversal + global fallback | Phase 26 + 27 | Full project hierarchy coverage |

**Deprecated/outdated:**
- None relevant -- this is an additive feature.

## Open Questions

1. **notify-status.py global display**
   - What we know: Current implementation only checks `Path.cwd()`, doesn't use `check_notification_flags()`. CONTEXT.md lists this under "Claude's Discretion."
   - What's unclear: Whether to update it to reflect global state or leave as-is.
   - Recommendation: Update `notify-status.py` to call `check_notification_flags()` and display both project-level and global status. This prevents user confusion when global flags exist but `/notify-status` reports "enabled."

## Environment Availability

Step 2.6: SKIPPED (no external dependencies identified -- all changes use Python stdlib pathlib)

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | pytest 9.0.2 |
| Config file | pytest.ini (project root) |
| Quick run command | `python -m pytest plugins/claude-notify/tests/test_flags.py -x -q` |
| Full suite command | `python -m pytest plugins/claude-notify/tests/ -v` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GLOB-01 | Global .no-xxx files disable notifications when no project-level flags exist | unit | `python -m pytest plugins/claude-notify/tests/test_flags.py -x -q` | Wave 0 (extend existing) |
| GLOB-01 | Global flag does NOT override project-level enabled state | unit | `python -m pytest plugins/claude-notify/tests/test_flags.py -x -q` | Wave 0 (new test) |
| GLOB-02 | Project-level flag takes priority over global | unit | `python -m pytest plugins/claude-notify/tests/test_flags.py -x -q` | Wave 0 (new test) |
| GLOB-01 | notify-disable --global creates file in ~/.claude/ | unit | `python -m pytest plugins/claude-notify/tests/test_notify_disable.py -x -q` | Wave 0 (extend existing) |
| GLOB-01 | notify-enable --global removes file from ~/.claude/ | unit | `python -m pytest plugins/claude-notify/tests/test_notify_enable.py -x -q` | Wave 0 (extend existing) |

### Sampling Rate
- **Per task commit:** `python -m pytest plugins/claude-notify/tests/test_flags.py plugins/claude-notify/tests/test_notify_enable.py plugins/claude-notify/tests/test_notify_disable.py -x -q`
- **Per wave merge:** `python -m pytest plugins/claude-notify/tests/ -v`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `test_flags.py` -- Must update `test_return_structure_includes_paths` for 6-key return dict
- [ ] `test_flags.py` -- Need new test cases for global fallback (global-only, global+project priority)
- [ ] `test_notify_disable.py` -- Need tests for `--global` flag
- [ ] `test_notify_enable.py` -- Need tests for `--global` flag
- [ ] `test_notify_status.py` -- May need updates if status display changes

## Sources

### Primary (HIGH confidence)
- `plugins/claude-notify/hooks/scripts/flags.py` -- Full source read, exact line numbers for insertion point
- `plugins/claude-notify/scripts/notify-enable.py` -- Full source read, arg parsing pattern
- `plugins/claude-notify/scripts/notify-disable.py` -- Full source read, arg parsing pattern
- `plugins/claude-notify/scripts/notify-status.py` -- Full source read, CWD-only pattern identified
- `plugins/claude-notify/tests/test_flags.py` -- 12 existing tests, return structure assertion at line 479
- `plugins/claude-notify/hooks/scripts/notify.py` -- Lines 372-389, reads only `pushover_disabled`/`windows_disabled`
- `plugins/claude-notify/hooks/scripts/notify-attention.py` -- Line 200, same read pattern
- Python stdlib docs -- `Path.home()`, `Path.is_file()` are stable across Python 3.10+

### Secondary (MEDIUM confidence)
- `.planning/phases/27-global-control/27-CONTEXT.md` -- User decisions D-11 through D-13
- `.planning/REQUIREMENTS.md` -- GLOB-01, GLOB-02 definitions

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All stdlib, no external dependencies, verified with running tests
- Architecture: HIGH - Insertion point verified by reading exact source lines, caller patterns confirmed
- Pitfalls: HIGH - Identified concrete test that will break (test_return_structure_includes_paths), verified by reading test source

**Research date:** 2026-04-01
**Valid until:** 2026-04-30 (stable -- stdlib APIs, no external dependencies)
