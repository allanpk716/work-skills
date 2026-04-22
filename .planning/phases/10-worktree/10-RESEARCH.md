# Phase 31: Worktree 区分 - Research

**Researched:** 2026-04-08
**Domain:** Git worktree 分支检测 + Claude Code hooks session_id
**Confidence:** HIGH

## Summary

Phase 31 需要修改 `notify.py`(Stop hook)和 `notify-attention.py`(Notification hook)两个通知脚本,以及它们共享的 `flags.py` 模块。核心改动有两处:一是从 git 仓库检测当前分支名并附加到通知标题;二是从 Notification hook 的 JSON 输入中提取 `session_id` 字段写入通知消息。

根据 Claude Code 官方 hooks 文档 [VERIFIED: code.claude.com/docs/en/hooks],Stop hook 的输入 JSON 包含 `session_id`、`cwd`、`hook_event_name` 等字段,Notification hook 同样包含 `session_id`。`git branch --show-current` 命令在 worktree 中正确返回该 worktree 检出的分支名,在非 git 目录返回 exit code 128,是可靠的分支检测方式。

**Primary recommendation:** 在 `flags.py` 中新增 `get_git_branch()` 函数,复用已有的向上遍历逻辑检测 git 仓库并获取分支名。修改两个通知脚本的标题/消息格式,添加分支和 session_id 信息。

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| WTREE-01 | 通知标题包含 git 分支名,格式如 `[project:branch]`,多 worktree 并行时可区分来源 | `flags.py` 新增 `get_git_branch()` 函数;`notify.py` 修改标题格式;`git branch --show-current` 在 worktree 中返回正确分支 |
| WTREE-02 | Attention 通知内容包含 session_id,便于追溯是哪个会话需要关注 | `notify-attention.py` 已从 hook input JSON 读取 `session_id`;当前消息体已包含 `Session: {session_id}`,需确认是否足够 |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| subprocess (stdlib) | Python 3.6+ | 调用 git 命令获取分支名 | 已用于 notify.py 调用 claude CLI,无新依赖 |
| pathlib (stdlib) | Python 3.6+ | 路径操作和目录遍历 | 已用于 flags.py 向上遍历 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| requests | 已安装 | Pushover API 调用 | 已有,无需变更 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `git branch --show-current` | `git symbolic-ref --short HEAD` | `--show-current` 在 DETACHED HEAD 返回空而非报错,更安全 [VERIFIED: git docs] |
| `git branch --show-current` | GitPython 库 | 无需引入第三方依赖,subprocess.run 一行即可,保持零额外依赖原则 |

**Installation:** 无需安装新依赖,全部使用 Python 标准库。

## Architecture Patterns

### Recommended Modification Points

```
plugins/claude-notify/hooks/scripts/
├── flags.py              # 新增 get_git_branch() 函数
├── notify.py             # 修改标题格式 [project:branch]
└── notify-attention.py   # 确认 session_id 已在消息中

plugins/claude-notify/tests/
├── test_flags.py         # 新增 get_git_branch 测试
└── test_notify.py        # 新增 worktree 标题格式测试
```

### Pattern 1: get_git_branch() 函数
**What:** 检测当前工作目录是否在 git 仓库中,如果是则返回当前分支名
**When to use:** 构建 Stop hook 通知标题时
**Example:**
```python
# Source: [VERIFIED: git documentation + manual testing]
import subprocess
from pathlib import Path

def get_git_branch():
    """
    Get current git branch name.

    Returns:
        Optional[str]: Branch name, or None if not in a git repo
    """
    try:
        result = subprocess.run(
            ['git', 'branch', '--show-current'],
            capture_output=True, text=True, timeout=1
        )
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip()
        return None
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return None
```

### Pattern 2: 通知标题格式
**What:** 标题格式从 `[project]` 变为 `[project:branch]`
**When to use:** Stop hook 标题构建
**Example:**
```python
# Source: [ASSUMED] - 设计决策
def build_title(project_name, git_branch=None):
    if git_branch:
        return f"[{project_name}:{git_branch}]"
    return f"[{project_name}]"
```

### Pattern 3: Attention hook session_id 展示
**What:** session_id 已在 notify-attention.py 中提取,当前消息格式为 `Session: {session_id}`
**When to use:** Notification hook 消息构建
**Note:** `notify-attention.py` 第 171 行已从 `hook_input.get('session_id', 'unknown')` 读取 session_id,第 195 行消息体已包含 `Session: {session_id}`。WTREE-02 要求"通知内容包含 session_id 字段",当前实现可能已满足,需确认格式是否需要调整。

### Anti-Patterns to Avoid
- **不要用 `git symbolic-ref --short HEAD`**: 在 DETACHED HEAD 状态会报错 (exit code 128),不如 `--show-current` 稳健
- **不要引入 GitPython 或其他第三方 git 库**: 项目保持零额外依赖原则 (只有 `requests`),subprocess 调用 git 完全够用
- **不要把分支检测放在 notify-attention.py 中**: attention hook 超时只有 5s,分支检测应放在 flags.py 共享模块
- **不要在非 git 场景下显示分支占位符**: 非仓库场景应退化到 `[project]`,而非 `[project:N/A]` 或 `[project:none]`

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Git 分支检测 | 解析 `.git/HEAD` 文件 | `git branch --show-current` | git worktree 场景下 `.git` 可能是文件而非目录,手动解析容易出错 |
| Git worktree 检测 | 检查 `.git` 是文件还是目录 | `git branch --show-current` 直接工作 | git CLI 已处理所有 worktree 边界情况 |
| session_id 提取 | 解析 transcript_path | `hook_input.get('session_id')` | Claude Code hooks 已在 JSON input 中提供 `session_id` 字段 [VERIFIED: official docs] |

**Key insight:** `git branch --show-current` 是 git 2.22+ 引入的命令,专门为脚本检测当前分支设计。它在 worktree、DETACHED HEAD、非 git 目录三种场景都有正确行为 (返回分支名/空字符串/exit 128)。用户环境 git version 2.45.1 远高于 2.22 [VERIFIED: `git --version` 输出]。

## Common Pitfalls

### Pitfall 1: git 分支检测超时
**What goes wrong:** 在大仓库或网络驱动器上 `git branch --show-current` 可能慢
**Why it happens:** git 需要读取仓库元数据,网络文件系统延迟
**How to avoid:** 设置 1s 超时,超时或失败时返回 None,退化为 `[project]` 格式
**Warning signs:** Stop hook 整体超过 5s

### Pitfall 2: .git 是文件不是目录 (worktree 场景)
**What goes wrong:** `find_project_root()` 检查 `.git` 是否为目录,但 worktree 中 `.git` 是一个指向主仓库的文件
**Why it happens:** `git worktree add` 创建的 worktree 中 `.git` 是一个包含 `gitdir: ...` 的文本文件
**How to avoid:** `find_project_root()` 已使用 `.is_dir()` 检查。需确认: 当前 `flags.py` 第 151 行 `(current / '.git').is_dir()` 在 worktree 场景下能否正确检测项目根。
**Warning signs:** 通知标题显示子目录名而非项目根目录名

**关键发现:** 让我验证 `find_project_root()` 在 worktree 场景下的行为。worktree 中 `.git` 是一个文件(不是目录),包含 `gitdir: /path/to/main-repo/.git/worktrees/name`。这意味着 `flags.py` 第 151 行的 `.is_dir()` 检查会在 worktree 中失败,导致项目根检测可能不正确。这是一个需要在 Phase 31 修复的 pre-existing bug [VERIFIED: git worktree documentation]。

### Pitfall 3: 非 git 项目退化处理
**What goes wrong:** 在没有 git 的项目中,分支检测报错导致通知失败
**Why it happens:** `subprocess.run` 的 stderr 包含 `fatal: not a git repository`
**How to avoid:** 使用 `capture_output=True` 捕获 stderr,检查 returncode,非 0 时返回 None
**Warning signs:** 非 git 项目中通知不发送

### Pitfall 4: DETACHED HEAD 状态
**What goes wrong:** 在 DETACHED HEAD 状态 (如 rebase、checkout commit) 下分支名为空
**Why it happens:** `git branch --show-current` 在 DETACHED HEAD 返回空字符串 (exit 0)
**How to avoid:** 空字符串视为无分支,退化为 `[project]` 格式

### Pitfall 5: 分支名中的特殊字符
**What goes wrong:** 分支名包含 `/`、`#` 等字符可能在通知系统中显示异常
**Why it happens:** Git 允许分支名包含特殊字符,但 Pushover/Windows Toast 对标题格式有限制
**How to avoid:** 分支名直接使用 git 输出,不做额外转义。`git branch --show-current` 返回的是人类可读的分支名,一般不含危险字符。Pushover title 限制 250 字符,实际分支名远不会超限。

## Code Examples

### get_git_branch() 实现参考
```python
# Source: [VERIFIED: manual testing on Windows + git docs]
import subprocess
import logging
from typing import Optional

logger = logging.getLogger(__name__)

def get_git_branch() -> Optional[str]:
    """
    Get current git branch name via subprocess.

    Uses 'git branch --show-current' which correctly handles:
    - Normal branches: returns branch name
    - DETACHED HEAD: returns empty string (exit 0)
    - Not a git repo: exit code 128
    - Worktrees: returns the worktree's checked-out branch

    Returns:
        Optional[str]: Branch name or None if not available
    """
    try:
        result = subprocess.run(
            ['git', 'branch', '--show-current'],
            capture_output=True,
            text=True,
            timeout=1,
            encoding='utf-8'
        )
        if result.returncode == 0 and result.stdout.strip():
            branch = result.stdout.strip()
            logger.info(f"Detected git branch: {branch}")
            return branch
        return None
    except subprocess.TimeoutExpired:
        logger.warning("Git branch detection timeout (1s)")
        return None
    except FileNotFoundError:
        logger.warning("Git not found in PATH")
        return None
    except Exception as e:
        logger.error(f"Failed to detect git branch: {e}")
        return None
```

### 修改 notify.py 标题构建
```python
# Source: [ASSUMED] - 基于 notify.py 当前结构
# 当前代码 (notify.py 第 369 行):
futures[executor.submit(send_pushover_notification, project_name, summary)] = 'pushover'
futures[executor.submit(send_windows_notification, project_name, summary)] = 'windows'

# 修改后:
branch = get_git_branch()
if branch:
    title = f"[{project_name}:{branch}]"
else:
    title = f"[{project_name}]"

futures[executor.submit(send_pushover_notification, title, summary)] = 'pushover'
futures[executor.submit(send_windows_notification, title, summary)] = 'windows'
```

### 修改 notify-attention.py 标题构建
```python
# Source: [ASSUMED] - 基于 notify-attention.py 当前结构
# 当前代码 (第 187 行):
title = f"[{project_name}] Attention Needed"

# 修改后:
branch = get_git_branch()
if branch:
    title = f"[{project_name}:{branch}] Attention Needed"
else:
    title = f"[{project_name}] Attention Needed"
```

### get_claude_summary fallback 消息修改
```python
# Source: [ASSUMED] - 基于 notify.py 第 48 行
# 当前:
fallback_message = f"[{project_name}] Task completed"

# 修改后需匹配新标题格式:
# fallback_message 不需要改,它是 message body 不是 title
# 但注意 get_claude_summary 的参数 project_name 仅用于 fallback 消息体,
# 实际标题由 main() 函数中的 project_name 构建
```

### 修复 find_project_root() 支持 worktree
```python
# Source: [VERIFIED: git worktree documentation]
# 当前 flags.py 第 151 行:
if (current / '.git').is_dir():
    return current

# 修改后:
git_path = current / '.git'
if git_path.is_dir() or git_path.is_file():
    return current
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `git symbolic-ref --short HEAD` | `git branch --show-current` | git 2.22 (2019) | 更安全,DETACHED HEAD 不报错 |
| 解析 `.git/HEAD` | 使用 git CLI | always | 避免手动解析 worktree 场景 |

**Deprecated/outdated:**
- `git rev-parse --abbrev-ref HEAD`: 在 DETACHED HEAD 返回 `HEAD`,不如 `--show-current` 返回空字符串直观

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `find_project_root()` 在 worktree 中因 `.is_dir()` 检查失败 | Pitfall 2 | 如果实际 `.is_dir()` 在 worktree 的 `.git` file 上返回 True,则不需要修复 |
| A2 | WTREE-02 要求的 session_id 已在 notify-attention.py 中实现 | Phase Requirements | 如果用户希望更醒目的格式 (如标题中显示),需要调整 |
| A3 | Pushover title 格式 `[project:branch]` 不会超出 250 字符限制 | Code Examples | 极端分支名可能超限,需截断 |
| A4 | `notify.py` 中的 `get_claude_summary()` 返回的 fallback 消息格式不影响标题 | Code Examples | fallback 消息体包含 `[project]`,可能和标题格式冲突 |

## Open Questions

1. **find_project_root() worktree 兼容性**
   - What we know: worktree 中 `.git` 是文件不是目录;`flags.py` 用 `.is_dir()` 检查
   - What's unclear: 是否影响实际使用中的项目名检测
   - Recommendation: 修改 `.is_dir()` 为 `.is_dir() or .is_file()` 以同时覆盖 worktree 场景

2. **WTREE-02 session_id 格式**
   - What we know: notify-attention.py 已在消息体中包含 `Session: {session_id}`
   - What's unclear: 这个格式是否满足需求,还是需要更显眼的展示方式
   - Recommendation: 当前实现已满足 WTREE-02 要求,如果用户希望更显眼可以调整

3. **fallback 消息中的 `[project]` 前缀**
   - What we know: `get_claude_summary()` 的 fallback 消息是 `[project] Task completed`
   - What's unclear: 如果标题变为 `[project:branch]`,fallback 消息体中的 `[project]` 是否需要同步改为 `[project:branch]`
   - Recommendation: fallback 消息体是通知内容的一部分,与标题独立,可以保持不变

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| git | Branch detection | Yes | 2.45.1.windows.1 | None (degrades to [project] format) |
| Python | Hook scripts | Yes | 3.10.11 / 3.11.9 | - |
| pytest | Tests | Yes | 9.0.2 | - |
| requests | Pushover API | Yes | installed | - |

**Missing dependencies with no fallback:** None

**Missing dependencies with fallback:** None

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | pytest 9.0.2 |
| Config file | pytest.ini (project root) |
| Quick run command | `python -m pytest plugins/claude-notify/tests/test_flags.py plugins/claude-notify/tests/test_notify.py -v` |
| Full suite command | `python -m pytest plugins/claude-notify/tests/ -v` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| WTREE-01 | git 分支检测返回分支名 | unit | `python -m pytest plugins/claude-notify/tests/test_flags.py::TestGetGitBranch -v` | No - Wave 0 |
| WTREE-01 | 非 git 目录返回 None | unit | `python -m pytest plugins/claude-notify/tests/test_flags.py::TestGetGitBranch -v` | No - Wave 0 |
| WTREE-01 | 通知标题格式 [project:branch] | unit | `python -m pytest plugins/claude-notify/tests/test_notify.py -v` | Partial - exists, needs new tests |
| WTREE-02 | session_id 出现在 attention 通知消息中 | unit | `python -m pytest plugins/claude-notify/tests/test_notify.py -v` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `python -m pytest plugins/claude-notify/tests/test_flags.py plugins/claude-notify/tests/test_notify.py -v`
- **Per wave merge:** `python -m pytest plugins/claude-notify/tests/ -v`
- **Phase gate:** Full suite (85 tests) green before verify

### Wave 0 Gaps
- [ ] `test_flags.py` -- 新增 `TestGetGitBranch` 测试类覆盖: 有分支/无分支/非 git/DETACHED HEAD/超时/FileNotFoundError
- [ ] `test_flags.py` -- 新增 `TestFindProjectRootWorktree` 覆盖 worktree 场景 (`.git` 为文件)
- [ ] `test_notify.py` -- 新增标题格式测试: `[project:branch]` / `[project]` 退化

## Security Domain

> Phase 仅修改通知标题和消息格式,不引入新的安全风险。git 分支名是公开信息,不涉及敏感数据。session_id 是 Claude Code 生成的会话标识符,不包含认证信息。

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | N/A |
| V3 Session Management | no | N/A |
| V4 Access Control | no | N/A |
| V5 Input Validation | yes | subprocess.run with timeout + returncode check |
| V6 Cryptography | no | N/A |

### Known Threat Patterns for Notification Scripts

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Command injection via branch name | Tampering | Branch name 仅用于字符串拼接,不传递给 shell 命令 |
| Path traversal via worktree | Tampering | `.git` 路径检查不涉及用户输入 |

## Sources

### Primary (HIGH confidence)
- Claude Code hooks reference - [VERIFIED: https://code.claude.com/docs/en/hooks] - Stop/Notification hook JSON input schema with session_id
- `git branch --show-current` behavior - [VERIFIED: manual testing on Windows + git 2.45.1]
- `git --version` output - [VERIFIED: 2.45.1.windows.1]
- `python --version` output - [VERIFIED: 3.10.11 / 3.11.9]
- 85 个现有测试全部通过 - [VERIFIED: pytest run]

### Secondary (MEDIUM confidence)
- Git worktree `.git` file format - [CITED: git-scm.com/docs/git-worktree] - `.git` is a file containing `gitdir:` pointer

### Tertiary (LOW confidence)
- Pushover title 250 字符限制 - [ASSUMED] - 需确认,但分支名极不可能超限

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - 无新依赖,仅使用 subprocess + stdlib
- Architecture: HIGH - 修改点明确 (flags.py + notify.py + notify-attention.py)
- Pitfalls: HIGH - 已通过手动测试验证 git 命令行为

**Research date:** 2026-04-08
**Valid until:** 2026-05-08 (stable - 纯 stdlib + git CLI,无快速变化的依赖)

---

## Key Files to Modify

| File | Change | Priority |
|------|--------|----------|
| `plugins/claude-notify/hooks/scripts/flags.py` | 新增 `get_git_branch()`;修复 `find_project_root()` 支持 worktree | P0 |
| `plugins/claude-notify/hooks/scripts/notify.py` | 标题格式 `[project:branch]`;调用 `get_git_branch()` | P0 |
| `plugins/claude-notify/hooks/scripts/notify-attention.py` | 标题格式 `[project:branch]`;确认 session_id 展示 | P0 |
| `plugins/claude-notify/tests/test_flags.py` | 新增 `get_git_branch` 和 worktree 测试 | P0 |
| `plugins/claude-notify/tests/test_notify.py` | 新增标题格式测试 | P1 |

## Pre-existing Bug Found

**`find_project_root()` 不支持 git worktree 场景**

`flags.py` 第 151 行:
```python
if (current / '.git').is_dir():
    return current
```

在 git worktree 中,`.git` 是一个文件 (包含 `gitdir: /path/to/main-repo/.git/worktrees/name`),而非目录。`.is_dir()` 返回 False,导致 worktree 中向上遍历会跳过 `.git` 标记,可能错误地将父目录识别为项目根。

**修复:** 将 `.is_dir()` 改为 `.is_dir() or .is_file()`,或者更精确地检查 `.git` 存在即可:
```python
if (current / '.git').exists():
    return current
```

**影响范围:** Phase 29 实现的 `find_project_root()` 和 `get_project_name()` 在 worktree 场景下行为可能不正确。Phase 31 修复此 bug 属于同一需求域 (WTREE-01 依赖于正确的项目根检测)。