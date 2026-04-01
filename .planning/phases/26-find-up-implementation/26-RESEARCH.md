# Phase 26: Find-up Implementation - Research

**Researched:** 2026-04-01
**Domain:** Python pathlib directory traversal, notification flag file detection
**Confidence:** HIGH

## Summary

Phase 26 将 `check_notification_flags()` 从仅检查 CWD 扩展为逐级向上遍历父目录查找 `.no-xxx` 标志文件。当前两个脚本 `notify.py` 和 `notify-attention.py` 各自持有独立的 `check_notification_flags()` 副本，需要提取为共享模块以消除历史已证明的同步遗漏问题。

核心技术方案已由 CONTEXT.md 锁定：使用 `Path.parent` 逐级向上，`CLAUDE.md` 作为项目根标记停止查找，最大深度 10 层。Windows 上 `Path.parent == Path.self` 可靠检测文件系统根目录。向上遍历的性能开销可忽略（最多 30 次 `is_file()` 调用，毫秒级完成）。

**Primary recommendation:** 提取 `flags.py` 共享模块到 `hooks/scripts/` 目录，实现向上查找版本的 `check_notification_flags()`，两个通知脚本统一导入。测试沿用现有 MagicMock + `__truediv__` 模式扩展。

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** 从 CWD 开始逐级向上检查 `.no-pushover` 和 `.no-windows` 文件
- **D-02:** 每层同时检查 `.no-xxx` 文件和 `CLAUDE.md` 文件。`.no-xxx` 优先级高于 `CLAUDE.md` -- 同一目录两者都存在时按找到 `.no-xxx` 处理
- **D-03:** 只有 `CLAUDE.md` 存在且没有 `.no-xxx` 时，停止向上查找（已到项目根）
- **D-04:** 最大遍历深度 10 层，防止无限向上
- **D-05:** `CLAUDE.md` 作为项目根标记
- **D-06:** 提取共享模块（如 `flags.py`）放在 `hooks/scripts/` 目录下
- **D-07:** `notify.py` 和 `notify-attention.py` 统一从共享模块导入
- **D-08:** 共享模块的必要性已由历史 bug 验证
- **D-09:** 返回值扩展为包含路径信息：`pushover_path`、`windows_path`（Optional[Path]）
- **D-10:** 现有调用方需适配新的返回值结构
- **D-11:** 无需特殊性能优化

### Claude's Discretion
- 共享模块的具体文件名和内部函数拆分
- 向上遍历的具体实现方式（while loop / Path.parents）
- 是否在共享模块中添加 CLAUDE.md 检测为独立函数
- 日志中记录查找过程的详细程度

### Deferred Ideas (OUT OF SCOPE)
- 全局 `~/.claude/.no-xxx` 控制 -- Phase 27
- 诊断模式显示查找结果 -- Phase 28
- 测试覆盖全局查找场景 -- Phase 28
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FIND-01 | `check_notification_flags()` 向上遍历父目录查找 `.no-xxx` 文件 | 见 "Architecture Patterns - Find-up 遍历算法" 和 "Code Examples" |
| FIND-02 | `notify-attention.py` 同步支持向上查找 | 见 "Architecture Patterns - 共享模块提取" 和 "Integration Points" |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pathlib (stdlib) | Python 3.10+ | 文件路径操作和目录遍历 | 项目已全面使用 Path 对象，无需额外依赖 |
| unittest.mock (stdlib) | Python 3.10+ | 模拟文件系统操作 | 现有测试已使用 MagicMock + `__truediv__` 模式 |
| logging (stdlib) | Python 3.10+ | 日志记录 | 两个脚本已配置 PID 隔离的日志系统 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| typing (stdlib) | Python 3.10+ | Optional, Dict 类型注解 | 返回值结构定义 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| 手动 while loop 遍历 | `Path.parents` 序列迭代 | `Path.parents` 更简洁但遍历深度控制需要 enumerate+slice；while loop 更直观且与 D-04（最大深度 10 层）配合更自然。推荐 while loop |
| 共享 .py 模块 | pip installable package | 过度工程化，项目只有两个消费者，同一目录下的 .py 文件最简单 |

**Installation:**
无新依赖需要安装。全部使用 Python 标准库。

## Architecture Patterns

### Recommended Project Structure
```
plugins/claude-notify/
  hooks/
    scripts/
      flags.py              # NEW: 共享标志检测模块
      notify.py             # MODIFIED: 导入 flags 模块
      notify-attention.py   # MODIFIED: 导入 flags 模块
  scripts/
    notify-disable.py       # UNCHANGED: 仍在 CWD 创建标志
    notify-enable.py        # UNCHANGED: 仍在 CWD 删除标志
  tests/
    test_flags.py           # NEW: 测试向上查找逻辑
    test_notify.py          # MODIFIED: 适配新的导入和返回值
    test_notify_attention.py # NEW (可选): 验证 attention 脚本集成
```

### Pattern 1: Find-up 遍历算法
**What:** 从 CWD 开始向上查找 `.no-xxx` 文件，以 `CLAUDE.md` 为项目根标记
**When to use:** 每次发送通知前调用
**Implementation approach (while loop, recommended):**

```python
def check_notification_flags():
    """
    Check for notification disable flags, searching from CWD upward.

    Traversal rules:
    1. At each directory, check .no-pushover and .no-windows
    2. If found, record and stop searching for that flag
    3. If CLAUDE.md found without .no-xxx, stop searching entirely
    4. Maximum 10 levels to prevent runaway traversal
    5. Stop at filesystem root (parent == self)

    Returns:
        dict with keys:
            pushover_disabled (bool), pushover_path (Optional[Path]),
            windows_disabled (bool), windows_path (Optional[Path])
    """
    current = Path.cwd()
    depth = 0
    max_depth = 10

    pushover_disabled = False
    windows_disabled = False
    pushover_path = None
    windows_path = None

    while depth <= max_depth:
        # Check flag files at current level
        if not pushover_disabled:
            flag = current / '.no-pushover'
            if flag.is_file():
                pushover_disabled = True
                pushover_path = flag

        if not windows_disabled:
            flag = current / '.no-windows'
            if flag.is_file():
                windows_disabled = True
                windows_path = flag

        # Both found, no need to go further
        if pushover_disabled and windows_disabled:
            break

        # Check for project root marker (D-03)
        has_claude_md = (current / 'CLAUDE.md').is_file()
        # .no-xxx takes priority over CLAUDE.md (D-02)
        if has_claude_md and not pushover_disabled and not windows_disabled:
            break

        # Move up
        parent = current.parent
        if parent == current:  # filesystem root
            break
        current = parent
        depth += 1

    # Log results
    if pushover_disabled:
        logger.info(f"Pushover disabled by {pushover_path}")
    if windows_disabled:
        logger.info(f"Windows disabled by {windows_path}")

    return {
        'pushover_disabled': pushover_disabled,
        'windows_disabled': windows_disabled,
        'pushover_path': pushover_path,
        'windows_path': windows_path,
    }
```

**Key design note for D-02 edge case:** 当同一目录既有 `.no-xxx` 又有 `CLAUDE.md` 时，`.no-xxx` 优先。上例中，如果 `.no-pushover` 存在但 `.no-windows` 不存在，遍历会继续向上查找 `.no-windows`，即使当前目录有 `CLAUDE.md`。只有当 `CLAUDE.md` 存在且**没有**找到任何 `.no-xxx` 时才停止（D-03 原文）。

更精确的实现：对每个 flag 独立判断停止条件：
- 每个通道独立追踪 found 状态
- `CLAUDE.md` 只在**两个通道都未找到**时停止遍历
- 如果只找到一个通道的 flag，继续向上找另一个通道（除非到了根或 max_depth）

### Pattern 2: 共享模块提取
**What:** 将 `check_notification_flags()` 提取到独立模块
**When to use:** `notify.py` 和 `notify-attention.py` 都需要导入

```python
# hooks/scripts/flags.py
import logging
from pathlib import Path
from typing import Dict, Optional

logger = logging.getLogger(__name__)

def check_notification_flags() -> Dict[str, Optional[Path] | bool]:
    """..."""
    # 向上查找实现
    ...

# hooks/scripts/notify.py (修改)
# 删除本地的 check_notification_flags()
from flags import check_notification_flags

# hooks/scripts/notify-attention.py (修改)
# 删除本地的 check_notification_flags()
from flags import check_notification_flags
```

**Import 路径注意：** 因为 `notify.py`、`notify-attention.py` 和 `flags.py` 都在同一目录 `hooks/scripts/` 下，直接 `from flags import ...` 即可。测试中已使用 `sys.path.insert(0, ...)` 将此目录加入 path，无需修改。

### Pattern 3: 测试向上查找
**What:** 扩展现有 MagicMock 模式测试向上遍历
**When to use:** 验证多级目录查找行为

现有测试模式使用 `mock_path_class.cwd.return_value` 和 `__truediv__` 模拟单层查找。向上查找需要模拟 `parent` 属性链：

```python
@patch('flags.Path')
def test_find_flag_in_parent_directory(self, mock_path_class):
    """Test finding .no-pushover in parent directory."""
    # Simulate: CWD = /project/src, .no-pushover at /project/
    mock_cwd = MagicMock()
    mock_parent = MagicMock()
    mock_cwd.parent = mock_parent
    mock_parent.parent = mock_parent  # root stops traversal

    # CWD level: no flags, no CLAUDE.md
    def cwd_div(key):
        m = MagicMock()
        m.is_file.return_value = False
        return m
    mock_cwd.__truediv__ = cwd_div

    # Parent level: has .no-pushover
    pushover_found = MagicMock()
    pushover_found.is_file.return_value = True

    def parent_div(key):
        if key == '.no-pushover':
            return pushover_found
        m = MagicMock()
        m.is_file.return_value = False
        return m
    mock_parent.__truediv__ = parent_div

    mock_path_class.cwd.return_value = mock_cwd

    result = check_notification_flags()
    self.assertTrue(result['pushover_disabled'])
```

### Anti-Patterns to Avoid
- **不要在遍历中使用 os.chdir()** -- 多进程环境下不安全，Claude Code 可能有多个并发会话
- **不要使用递归实现向上查找** -- 虽然深度有限（10层），但迭代更清晰且无栈溢出风险
- **不要在共享模块中硬编码日志文件路径** -- 日志配置仍在各脚本中，共享模块只需 `getLogger(__name__)`
- **不要修改 notify-disable/enable 脚本** -- 它们在 CWD 创建/删除标志文件，这是正确行为，不受向上查找影响

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 路径规范化 | 手动拼接路径字符串 | `Path.resolve()` | 处理符号链接、`.`、`..` 等边界情况 |
| 根目录检测 | 检查路径长度或盘符 | `Path.parent == Path.self` | 跨平台兼容，Windows/Linux 均正确 |
| 类型注解 | 使用 dict 字面量类型 | `typing.Dict`, `typing.Optional` | Phase 28 的 diagnose 需要清晰的返回值类型 |

**Key insight:** 这个改动的核心复杂度不在算法本身（简单的 while loop），而在正确处理 D-02/D-03 的优先级边界条件和确保两个脚本的导入路径正确。

## Common Pitfalls

### Pitfall 1: CLAUDE.md 优先级处理错误
**What goes wrong:** 代码逻辑错误地让 CLAUDE.md 存在时就停止查找，忽略了同目录有 `.no-xxx` 的情况
**Why it happens:** D-02/D-03 的交互微妙：只在 CLAUDE.md 存在且**没有** `.no-xxx` 时停止
**How to avoid:** 测试用例必须覆盖 "CLAUDE.md 和 .no-xxx 同目录" 的边界情况
**Warning signs:** 在有 CLAUDE.md 的项目根目录放 `.no-pushover`，子目录中的会话如果仍然发送通知就说明逻辑错误

### Pitfall 2: Import 路径在生产环境失败
**What goes wrong:** `from flags import ...` 在开发环境正常但部署后 ImportError
**Why it happens:** 安装器将脚本复制到 `~/.claude/hooks/`，如果 `flags.py` 没有一起复制，导入失败
**How to avoid:** 确认安装器的 `copyScripts()` 是复制整个 `hooks/scripts/` 目录还是逐文件复制。如果逐文件，需要更新安装器以包含 `flags.py`
**Warning signs:** 部署后通知完全停止发送（脚本因 ImportError 在启动时崩溃）

### Pitfall 3: 测试中 MagicMock 的 parent 链构建不完整
**What goes wrong:** 测试通过但实际行为错误，因为 mock 的 parent 链没有正确模拟根目录停止条件
**Why it happens:** MagicMock 默认返回新 MagicMock 对象，`parent.parent.parent...` 永远不会等于 self
**How to avoid:** 显式设置 `mock_parent.parent = mock_parent` 来模拟根目录，每个测试都必须设置停止条件
**Warning signs:** 测试中 while loop 无限执行或深度超过预期

### Pitfall 4: 返回值结构变更破坏现有调用方
**What goes wrong:** `notify.py` 的 `main()` 访问 `flags['pushover_disabled']` 但新版本返回值 key 不同
**Why it happens:** D-09 扩展了返回值结构，增加了 `pushover_path` 和 `windows_path`
**How to avoid:** 保持原有 key 名称不变（`pushover_disabled`, `windows_disabled`），只增加新 key。这是向后兼容的扩展
**Warning signs:** KeyError 或 AttributeError 在运行时出现

### Pitfall 5: Windows 路径大小写敏感性
**What goes wrong:** 在某些情况下 `CLAUDE.md` vs `claude.md` 检测不一致
**Why it happens:** Windows 文件系统通常不区分大小写，但 `Path.is_file()` 在 Windows 上会正确处理大小写
**How to avoid:** 使用 `.no-pushover`、`.no-windows`、`CLAUDE.md` 精确名称即可，Windows 上 `is_file()` 本身就是不区分大小写的
**Warning signs:** Linux CI（如有）可能行为不同

## Code Examples

### Example 1: 当前实现（需要替换）
```python
# notify.py lines 96-116 (current, single-level only)
def check_notification_flags():
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
```

### Example 2: notify.py main() 调用方（需保持兼容）
```python
# notify.py lines 395-411 (current consumers)
flags = check_notification_flags()
# Uses: flags['pushover_disabled'], flags['windows_disabled']
# New return adds: flags['pushover_path'], flags['windows_path']
# Existing key names unchanged -- backward compatible
```

### Example 3: notify-attention.py main() 调用方（需保持兼容）
```python
# notify-attention.py lines 222, 242-250 (current consumers)
flags = check_notification_flags()
# Same key access pattern as notify.py
# Will automatically get find-up behavior after import change
```

## Integration Points

### 1. 安装器兼容性
安装器 `installer/src/hooks/hooks-installer.js` 的 `copyScripts()` 将 `hooks/scripts/` 下的 Python 脚本复制到 `~/.claude/hooks/`。新增的 `flags.py` 必须被包含在复制列表中。

**需要验证：** `copyScripts()` 是复制整个目录还是逐文件列举？如果是逐文件列举，需要更新安装器。

### 2. sys.path 兼容性
测试文件 `test_notify.py` 使用 `sys.path.insert(0, str(Path(__file__).parent.parent / 'hooks' / 'scripts'))` 将脚本目录加入 path。`flags.py` 在同一目录下，导入 `from flags import check_notification_flags` 可以直接工作。

### 3. 日志系统
共享模块使用 `logger = logging.getLogger(__name__)`，日志配置在调用方（notify.py / notify-attention.py）的 `logging.basicConfig()` 中完成。`__name__` 会是 `flags`，日志会正确路由到各自脚本的 FileHandler。

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 仅 CWD 检查 `.no-xxx` | 向上遍历父目录查找 | Phase 26 (this phase) | 子目录会话也能响应标志文件 |
| 独立维护两份 `check_notification_flags()` | 共享 `flags.py` 模块 | Phase 26 (this phase) | 消除同步遗漏问题 |

**Deprecated/outdated:**
- `notify-attention.py` 中的本地 `check_notification_flags()` 副本 -- 将被替换为从 `flags.py` 导入

## Open Questions

1. **安装器是否需要更新？**
   - What we know: 安装器将 hooks/scripts/ 下的脚本复制到 `~/.claude/hooks/`
   - What's unclear: 是复制整个目录内容还是逐文件列举
   - Recommendation: 实现时先检查安装器源码，如果逐文件列举则添加 `flags.py`

2. **CLAUDE.md 与 .no-xxx 同目录时的精确行为**
   - What we know: D-02 说 `.no-xxx` 优先级高于 `CLAUDE.md`
   - What's unclear: 如果只找到一个 flag（如只有 `.no-pushover`），另一个 flag 的搜索是否继续穿过 CLAUDE.md 向上
   - Recommendation: 按最严格理解实现 -- 找到一个 flag 不阻止另一个 flag 的搜索继续向上。只有两个都未找到时 CLAUDE.md 才停止搜索

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Python | 运行通知脚本 | Yes | 3.10.11 | -- |
| pathlib | 路径操作 | Yes (stdlib) | -- | -- |
| unittest.mock | 测试 | Yes (stdlib) | -- | -- |
| requests | 通知发送 | Yes | -- | -- |
| pytest | 可选测试运行器 | No | -- | unittest (stdlib) |

**Missing dependencies with no fallback:**
- None

**Missing dependencies with fallback:**
- pytest: 使用 `python -m unittest discover -s tests -v` 替代（项目已有 test.bat 使用此方式）

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | unittest (stdlib) |
| Config file | none |
| Quick run command | `cd plugins/claude-notify && python -m unittest discover -s tests -v` |
| Full suite command | `cd plugins/claude-notify && python -m unittest discover -s tests -v` |

### Phase Requirements -> Test Map
| ID | Behavior | Test Type | Automated Command | File Exists? |
|----|----------|-----------|-------------------|-------------|
| FIND-01 | 向上查找 `.no-xxx` 在父目录 | unit | `python -m unittest tests.test_flags -v` | No -- Wave 0 |
| FIND-01 | 最大深度 10 层限制 | unit | `python -m unittest tests.test_flags -v` | No -- Wave 0 |
| FIND-01 | CLAUDE.md 停止查找 | unit | `python -m unittest tests.test_flags -v` | No -- Wave 0 |
| FIND-01 | 文件系统根停止查找 | unit | `python -m unittest tests.test_flags -v` | No -- Wave 0 |
| FIND-01 | 两个通道独立查找 | unit | `python -m unittest tests.test_flags -v` | No -- Wave 0 |
| FIND-02 | notify-attention.py 导入共享模块 | unit | `python -m unittest tests.test_notify_attention -v` | No -- Wave 0 |
| FIND-02 | 返回值结构包含路径信息 | unit | `python -m unittest tests.test_flags -v` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `cd plugins/claude-notify && python -m unittest discover -s tests -v`
- **Per wave merge:** Same command (full suite is fast, ~0.03s for 23 tests)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `plugins/claude-notify/tests/test_flags.py` -- covers FIND-01 向上查找逻辑（多种边界条件）
- [ ] `plugins/claude-notify/tests/test_notify.py` -- update existing flag tests to use new import path
- [ ] Optionally: `plugins/claude-notify/tests/test_notify_attention.py` -- verify FIND-02 integration

## Sources

### Primary (HIGH confidence)
- 源码分析: `plugins/claude-notify/hooks/scripts/notify.py` -- 当前 `check_notification_flags()` 实现（第 96-116 行）
- 源码分析: `plugins/claude-notify/hooks/scripts/notify-attention.py` -- 副本实现（第 168-188 行）
- 源码分析: `plugins/claude-notify/tests/test_notify.py` -- 现有测试模式
- Python stdlib 验证: Windows 上 `Path.parent == Path.self` 根目录检测（实际运行验证）

### Secondary (MEDIUM confidence)
- Bug 历史: `.planning/debug/no-windows-notification-ignored.md` -- 验证共享模块必要性
- CONTEXT.md: D-01 到 D-11 完整决策锁定

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- 全部使用项目已在使用的 Python stdlib，无需新依赖
- Architecture: HIGH -- 算法简单，实现细节在源码中已验证
- Pitfalls: HIGH -- 基于 bug 历史和实际代码分析

**Research date:** 2026-04-01
**Valid until:** 2026-04-30 (stable domain, no fast-moving dependencies)
