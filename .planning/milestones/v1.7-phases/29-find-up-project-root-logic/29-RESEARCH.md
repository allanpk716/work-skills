# Phase 29: Find-up Project Root Logic - Research

**Researched:** 2026-04-04
**Domain:** Python filesystem traversal, project root detection
**Confidence:** HIGH

## Summary

Phase 29 implements intelligent project root detection by reusing the upward directory traversal pattern established in Phase 28's `flags.py`. The core function `find_project_root()` will walk from CWD upward, looking for `.git` directories or `CLAUDE.md` files as project root markers. When found, it returns the directory name. When nothing is found (max depth exceeded, filesystem root reached), it falls back to `os.path.basename(os.getcwd())`.

The implementation is straightforward because `flags.py` already provides a battle-tested traversal loop with the exact same stopping conditions (max depth 10, filesystem root, CLAUDE.md marker). The new function extracts the traversal skeleton into a reusable pattern and adds `.git` directory detection alongside the existing `CLAUDE.md` file detection.

**Primary recommendation:** Add `find_project_root()` to `flags.py` (the shared module that already owns upward traversal), using the same while-loop pattern. Create TDD tests in `test_flags.py` following the existing mock-based `@patch('flags.Path')` convention.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PROJ-01 | `get_project_name()` 通过向上查找 `.git` 目录或 `CLAUDE.md` 文件定位项目根目录 | flags.py traversal pattern documented below; `.git` uses `is_dir()`, `CLAUDE.md` uses `is_file()` |
| PROJ-02 | 向上查找逻辑复用 flags.py 中的遍历模式（最大深度、根目录停止、CLAUDE.md 标记） | Pattern extraction strategy documented; same while-loop with `parent == current` root check, max_depth=10 |
| PROJ-03 | 找到项目根目录时返回该目录的文件夹名称作为项目名 | Use `current.name` from pathlib.Path to extract directory name |
| PROJ-06 | 所有查找失败时回退到现有的 `os.getcwd()` 行为 | Return `Path.cwd().name` as fallback -- same result as current `os.path.basename(os.getcwd())` |
| PROJ-07 | 向上查找项目根的 TDD 测试覆盖（子目录、嵌套项目、根目录等场景） | Test scenarios mapped below; use existing `@patch('flags.Path')` mock pattern from test_flags.py |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pathlib | stdlib | Path manipulation, parent traversal, directory name extraction | Already used by flags.py; `Path.is_dir()`, `Path.is_file()`, `Path.parent`, `Path.name` |
| unittest | stdlib | Test framework | Already used by all existing tests in this project |
| unittest.mock | stdlib | Mocking Path for isolated traversal tests | Established pattern in test_flags.py (16 tests using `@patch('flags.Path')`) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| pytest | 9.0.2 | Test runner (executes unittest tests) | Running all tests via `python -m pytest` |
| os | stdlib | `os.getcwd()` fallback behavior | Fallback when no project root markers found |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| pathlib traversal | `git rev-parse --show-toplevel` | git command spawns subprocess (slow, requires git installed, fails in non-git dirs) |
| Custom traversal function | Extract generic `walk_up()` helper | Over-engineering for 2 functions; keep it simple with explicit loop |

**Installation:** No new packages needed -- all stdlib + existing pytest.

## Architecture Patterns

### Recommended Project Structure
```
plugins/claude-notify/
  hooks/scripts/
    flags.py              <-- ADD find_project_root() here
    notify.py             <-- unchanged this phase
    notify-attention.py   <-- unchanged this phase
  tests/
    test_flags.py         <-- ADD find_project_root tests here
    test_notify.py        <-- unchanged this phase
```

### Pattern 1: Upward Traversal Loop (from flags.py)
**What:** Walk from CWD upward through parent directories, checking conditions at each level.
**When to use:** Any "find the nearest X above CWD" operation.
**Example (existing pattern from flags.py lines 47-93):**
```python
current = Path.cwd()
depth = 0
max_depth = 10

while depth <= max_depth:
    # Check conditions at current level
    if (current / '.git').is_dir():
        return current  # or current.name

    if (current / 'CLAUDE.md').is_file():
        return current  # or current.name

    # Move up to parent directory
    parent = current.parent
    if parent == current:  # filesystem root
        break
    current = parent
    depth += 1
```

### Pattern 2: Mock-Based Path Testing (from test_flags.py)
**What:** Mock `flags.Path` to simulate directory hierarchies without touching the real filesystem.
**When to use:** All traversal tests -- this is the established pattern in this project.
**Example:**
```python
@patch('flags.Path')
def test_git_dir_in_parent(self, mock_path_class):
    mock_cwd = MagicMock()
    mock_parent = MagicMock()
    mock_cwd.parent = mock_parent
    mock_parent.parent = mock_parent  # root stops traversal

    git_dir = MagicMock()
    git_dir.is_dir.return_value = True

    def cwd_div(self, key):
        m = MagicMock()
        m.is_dir.return_value = False
        m.is_file.return_value = False
        return m

    def parent_div(self, key):
        if key == '.git':
            return git_dir
        m = MagicMock()
        m.is_dir.return_value = False
        m.is_file.return_value = False
        return m

    mock_cwd.__truediv__ = cwd_div
    mock_parent.__truediv__ = parent_div
    mock_path_class.cwd.return_value = mock_cwd

    result = find_project_root()
    self.assertEqual(result, mock_parent)
```

### Key Design Decision: `.git` uses `is_dir()`, `CLAUDE.md` uses `is_file()`

This is critical and easy to get wrong:
- `.git` is a **directory** (at least in non-bare repos, which is the target use case) -- use `(current / '.git').is_dir()`
- `CLAUDE.md` is a **file** -- use `(current / 'CLAUDE.md').is_file()`
- Verified on this project: `C:/WorkSpace/agent/work-skills/.git` returns `is_dir()=True, is_file()=False`

### Anti-Patterns to Avoid
- **Don't use `os.path.exists()` for `.git`:** It returns True for both files and directories. Use `is_dir()` to be specific.
- **Don't extract a generic `walk_up()` generator:** Over-engineering for 2 call sites. Keep the while-loop explicit in each function.
- **Don't create a separate module:** `flags.py` already owns upward traversal. Adding `find_project_root()` there keeps the traversal logic co-located.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Path root detection | Custom string comparison for `C:\` or `/` | `Path.parent == Path` (parent == self) | Platform-independent, already proven in flags.py |
| Directory name extraction | `os.path.split()` or string slicing | `Path.name` | Handles edge cases (trailing slashes, UNC paths) |
| Git root detection | `subprocess.run(['git', 'rev-parse', '--show-toplevel'])` | Path traversal for `.git` directory | No subprocess overhead, works without git installed |

**Key insight:** The traversal pattern is already proven by 16 passing tests in test_flags.py. Reuse the exact same loop structure.

## Common Pitfalls

### Pitfall 1: Mocking `is_dir` vs `is_file` on Same Path
**What goes wrong:** In test mocks, setting up `is_dir()` but forgetting to also set `is_file()` (or vice versa) can cause false positives because MagicMock returns a truthy MagicMock for unconfigured methods.
**Why it happens:** The mock `__truediv__` returns a fresh MagicMock whose `.is_dir()` and `.is_file()` both return truthy MagicMock objects.
**How to avoid:** Always set BOTH `is_dir.return_value = False` AND `is_file.return_value = False` on every mock path, then explicitly override only the one you need.
**Warning signs:** Test passes without any specific assertions; both conditions trigger simultaneously.

### Pitfall 2: Nested Project Returning Wrong Root
**What goes wrong:** In a nested project (e.g., `C:/projects/vendor/my-project/.git`), the function might return `vendor` instead of `my-project` if it checks for some marker at a higher level.
**Why it happens:** The traversal doesn't stop at the FIRST found marker; or checks `.git` and `CLAUDE.md` in wrong priority.
**How to avoid:** The traversal should return the FIRST directory that has EITHER `.git` (as dir) OR `CLAUDE.md` (as file). "First found" means closest to CWD, not highest in the tree. The upward loop naturally finds the closest first.
**Warning signs:** Nested git repos return the outer project name.

### Pitfall 3: Forgetting to Handle `.git` as File (Submodule)
**What goes wrong:** In git worktrees or submodules, `.git` can be a **file** (not a directory) containing a reference to the actual git dir.
**Why it happens:** The implementation only checks `is_dir()` for `.git`.
**How to avoid:** Check `(.git).exists()` or check BOTH `is_dir()` and `is_file()` for `.git`. However, for this project's use case (Windows developers with standard repos), `is_dir()` is sufficient. Submodules are rare and out of scope for this phase.
**Warning signs:** Projects using git worktrees or submodules return fallback name instead of project name.

### Pitfall 4: Windows Drive Root Behavior
**What goes wrong:** On Windows, `Path('C:/').parent == Path('C:/')` returns True (correct), but `Path('C:').parent` returns `Path('C:\\')` which may differ.
**Why it happens:** Windows has drive-relative paths vs absolute paths.
**How to avoid:** Use `Path.cwd()` which always returns absolute paths. The `parent == current` check works correctly for all Windows root scenarios (verified: `C:/.parent == C:/` is True).
**Warning signs:** Infinite loop on Windows root paths.

### Pitfall 5: Returning Path Object Instead of String
**What goes wrong:** `find_project_root()` returns a `Path` object but callers expect a string name.
**Why it happens:** Mixing `Path.name` (returns string) with `Path` object (returns Path).
**How to avoid:** `find_project_root()` should return the `Path` object (for flexibility), and `get_project_name()` should call `.name` on the result. Or have `find_project_root()` return the Path and a wrapper extracts the name. Keep the interface clear.
**Warning signs:** TypeError when concatenating project name into notification strings.

## Code Examples

### Proposed find_project_root() Implementation
```python
# In flags.py -- add after check_notification_flags()

def find_project_root():
    """
    Find the project root directory by searching upward from CWD.

    Looks for .git directory or CLAUDE.md file as project root markers.
    Returns the first (closest) directory containing either marker.

    Traversal stops when:
    - .git directory or CLAUDE.md file is found
    - Filesystem root is reached (parent == self)
    - Maximum traversal depth (10) exceeded

    Returns:
        Path: The project root directory, or None if no markers found
    """
    current = Path.cwd()
    depth = 0
    max_depth = 10

    while depth <= max_depth:
        # Check for .git directory (standard git repo)
        if (current / '.git').is_dir():
            return current

        # Check for CLAUDE.md file (Claude Code project marker)
        if (current / 'CLAUDE.md').is_file():
            return current

        # Move up to parent directory
        parent = current.parent
        if parent == current:  # filesystem root
            break
        current = parent
        depth += 1

    return None  # No project root markers found
```

### Proposed get_project_name() Wrapper
```python
# In flags.py -- add after find_project_root()

def get_project_name():
    """
    Get the current project name by finding the project root directory.

    Returns the directory name of the project root. Falls back to
    the current working directory's basename if no project root
    markers (.git or CLAUDE.md) are found.

    Returns:
        str: Project name (directory name)
    """
    root = find_project_root()
    if root is not None:
        return root.name
    return Path.cwd().name
```

### TDD Test Scenarios (Required by PROJ-07)
```python
# Test cases to add to test_flags.py:

class TestFindProjectRoot(unittest.TestCase):
    """Test find_project_root() upward traversal for project root detection."""

    # 1. CWD has .git -> returns CWD
    def test_git_in_cwd(self)

    # 2. CWD has CLAUDE.md -> returns CWD
    def test_claude_md_in_cwd(self)

    # 3. Parent has .git -> returns parent
    def test_git_in_parent(self)

    # 4. Parent has CLAUDE.md -> returns parent
    def test_claude_md_in_parent(self)

    # 5. .git takes priority over CLAUDE.md at same level (order check)
    def test_git_priority_over_claude_md(self)

    # 6. Nested project: .git at depth 2, another at depth 5 -> returns depth 2
    def test_nested_project_returns_closest(self)

    # 7. No markers anywhere -> returns None
    def test_no_markers_returns_none(self)

    # 8. Max depth 10 -> marker at depth 11 not found
    def test_max_depth_limit(self)

    # 9. Filesystem root stops traversal
    def test_filesystem_root_stops(self)

class TestGetProjectName(unittest.TestCase):
    """Test get_project_name() returns correct directory name."""

    # 1. Project root found -> returns directory name
    def test_returns_dir_name(self)

    # 2. No project root -> returns cwd basename
    def test_fallback_to_cwd_basename(self)

    # 3. Project name with spaces
    def test_name_with_spaces(self)

    # 4. Project name with Chinese characters
    def test_name_with_chinese(self)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `os.path.basename(os.getcwd())` | Upward find for `.git`/`CLAUDE.md` | Phase 29 (this phase) | Accurate project name even from subdirectories |

**Deprecated/outdated:**
- Using `os.getcwd()` directly for project name: Unreliable when Claude Code runs from a project subdirectory.

## Open Questions

1. **Should `find_project_root()` live in `flags.py` or a new shared module?**
   - What we know: `flags.py` already owns upward traversal. ROADMAP says "flags.py or shared module".
   - Recommendation: Add to `flags.py`. It's the established traversal module. Creating a new module for one function violates the project principle of avoiding unnecessary files.

2. **Should `.git` file (submodule/worktree) be detected?**
   - What we know: `.git` can be a file in submodules/worktrees, but this is rare for the target audience (Windows developers).
   - Recommendation: Only check `is_dir()` for now. This covers the 99% case. If needed, can add `.git` file support later without breaking the API.

3. **Should `get_project_name()` also be added to `flags.py` or remain in notify scripts?**
   - What we know: PROJ-04/PROJ-05 (Phase 30) will replace the existing `get_project_name()` in notify.py and notify-attention.py.
   - Recommendation: Add `get_project_name()` to `flags.py` now as the canonical implementation. Phase 30 will import it from there.

## Environment Availability

Step 2.6: SKIPPED (no external dependencies identified -- all stdlib Python, no services, no databases, no CLI tools beyond Python itself)

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Python 3 | Runtime + Tests | Yes | 3.10.11 / 3.11.9 | -- |
| pytest | Test runner | Yes | 9.0.2 | -- |
| pathlib | Traversal | Yes | stdlib | -- |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | unittest (stdlib) via pytest runner |
| Config file | pytest.ini at project root |
| Quick run command | `python -m pytest plugins/claude-notify/tests/test_flags.py -v --tb=short` |
| Full suite command | `python -m pytest plugins/claude-notify/tests/ -v --tb=short` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PROJ-01 | `.git` dir / `CLAUDE.md` file detection upward | unit | `python -m pytest plugins/claude-notify/tests/test_flags.py::TestFindProjectRoot -v` | Wave 0 (create) |
| PROJ-02 | Traversal pattern reuse (max depth, root stop, CLAUDE.md) | unit | `python -m pytest plugins/claude-notify/tests/test_flags.py::TestFindProjectRoot -v` | Wave 0 (create) |
| PROJ-03 | Returns directory name of found root | unit | `python -m pytest plugins/claude-notify/tests/test_flags.py::TestGetProjectName -v` | Wave 0 (create) |
| PROJ-06 | Falls back to cwd basename when no markers | unit | `python -m pytest plugins/claude-notify/tests/test_flags.py::TestGetProjectName::test_fallback_to_cwd_basename -v` | Wave 0 (create) |
| PROJ-07 | Full TDD coverage (subdirectory, nested, root, fallback) | unit | `python -m pytest plugins/claude-notify/tests/test_flags.py -v` | Wave 0 (create) |

### Sampling Rate
- **Per task commit:** `python -m pytest plugins/claude-notify/tests/test_flags.py -v --tb=short`
- **Per wave merge:** `python -m pytest plugins/claude-notify/tests/ -v --tb=short`
- **Phase gate:** Full suite green, all 16 existing flags tests + new tests pass

### Wave 0 Gaps
- [ ] `plugins/claude-notify/tests/test_flags.py` -- add `TestFindProjectRoot` and `TestGetProjectName` test classes to existing file
- [ ] No new conftest.py needed (existing test_flags.py uses `sys.path.insert` pattern)
- [ ] No framework install needed (pytest 9.0.2 already installed)

## Sources

### Primary (HIGH confidence)
- `plugins/claude-notify/hooks/scripts/flags.py` -- existing traversal pattern (lines 47-93), max_depth=10, root detection via `parent == current`
- `plugins/claude-notify/tests/test_flags.py` -- 16 existing tests with `@patch('flags.Path')` mock pattern, all passing
- `plugins/claude-notify/hooks/scripts/notify.py` -- current `get_project_name()` implementation (lines 38-51), uses `os.path.basename(os.getcwd())`
- `plugins/claude-notify/hooks/scripts/notify-attention.py` -- identical `get_project_name()` implementation (lines 38-51)
- `pytest.ini` -- test configuration, test discovery settings

### Secondary (MEDIUM confidence)
- Python pathlib documentation (stdlib) -- `Path.parent`, `Path.name`, `Path.is_dir()`, `Path.is_file()` behavior verified experimentally on Windows
- Windows root detection verified: `Path('C:/').parent == Path('C:/')` returns True

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all stdlib, already in use by the project
- Architecture: HIGH - pattern established in Phase 28, this phase extends it
- Pitfalls: HIGH - identified from reviewing existing test mocks and Windows-specific behavior
- Test approach: HIGH - existing test_flags.py provides the exact mock pattern to follow

**Research date:** 2026-04-04
**Valid until:** 2026-05-04 (stable -- stdlib APIs don't change)
