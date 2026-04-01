# Phase 28: Diagnostics & Testing - Research

**Researched:** 2026-04-01
**Domain:** Python diagnostics output, unittest/pytest mocking, stdout capture
**Confidence:** HIGH

## Summary

Phase 28 is a tightly scoped change: replace `diagnose_configuration()` section [2] (lines 278-291 in notify.py) with a call to the already-imported `check_notification_flags()`, then expand the output to show project-level upward-traversal paths, global paths, and source labels. On the test side, create a new `test_diagnose.py` file that tests the diagnose function's output, while confirming that existing `test_flags.py` already satisfies TEST-01 and TEST-02 for the underlying flag logic.

The implementation is minimal -- approximately 15 lines of production code change (replacing 14 lines of CWD-only checks) and ~200 lines of new test code. The `check_notification_flags()` function already returns all 6 fields needed (pushover_disabled, windows_disabled, pushover_path, windows_path, global_pushover_path, global_windows_path). The diagnose function just needs to consume and display them.

**Primary recommendation:** Replace section [2] body with a single `check_notification_flags()` call and format each channel's output as "status + path + source label". Add `test_diagnose.py` using `unittest.mock.patch('notify.check_notification_flags')` to mock the return value and `io.StringIO` to capture stdout for assertion.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** `diagnose_configuration()` section [2] uses `check_notification_flags()` return value instead of direct CWD-only file checks
- **D-01a:** Each flag shown with source label: "Found at [path] (project-level)" or "Found at [path] (global)" or "Not found"
- **D-01b:** For project-level flags found via upward traversal, display the actual path where the file was found
- **D-02:** Section [2] expanded with sub-sections for Pushover and Windows, each showing status + path + source
- **D-02a:** Replace old CWD-only checks with single `check_notification_flags()` call
- **D-02b:** Other diagnostic sections ([1] env vars, [3] logs, [4] API test) remain unchanged
- **D-03:** TEST-01 and TEST-02 partially covered by existing `test_flags.py` tests from Phases 26-27
- **D-03a:** Additional tests needed for `diagnose_configuration()` verifying it correctly uses `check_notification_flags()` output
- **D-03b:** Test scenarios for diagnose: Flag in CWD, Flag in parent dir, Global flag only, Mixed project + global, No flags
- **D-04:** New `test_diagnose.py` file separate from `test_flags.py`
- **D-04a:** Existing `test_flags.py` already covers flag logic (16 tests); no new flag logic tests needed
- **D-04b:** Verify existing `test_flags.py` coverage satisfies TEST-01 and TEST-02 requirements

### Claude's Discretion
- Exact formatting of diagnostic output (indentation, labels, path display)
- Whether to truncate long paths in diagnostic output
- Test helper patterns for capturing stdout in diagnose tests
- Whether test_diagnose.py needs a `_setup_safe_global_home` helper like test_flags.py

### Deferred Ideas (OUT OF SCOPE)
None.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DIAG-01 | `diagnose_configuration()` displays project-level and global-level `.no-xxx` detection results | `check_notification_flags()` returns 6-key dict with all needed paths; section [2] replacement at notify.py:278-291 is the sole code change |
| TEST-01 | New tests covering parent directory lookup scenarios (file in parent, file in grandparent, no file in chain) | `test_flags.py` already has 16 tests covering these exact scenarios; verify coverage maps to requirement, add diagnose-level tests in `test_diagnose.py` |
| TEST-02 | New tests covering global `~/.claude/` lookup scenarios (exists, not exists, coexistence priority) | `test_flags.py` has tests: `test_global_pushover_only`, `test_global_windows_only`, `test_project_level_takes_priority`, `test_mixed_project_and_global`; verify + add diagnose-level tests |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Python | 3.11.9 | Runtime | Already in use, installed on dev machine |
| pytest | 9.0.2 | Test runner | Already configured in pytest.ini, all existing tests use it |
| unittest.mock | (stdlib) | Mocking in tests | Already used throughout test_flags.py and test_notify.py |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| io.StringIO | (stdlib) | Capture stdout in tests | For asserting `diagnose_configuration()` print output |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `io.StringIO` + `patch('sys.stdout')` | `pytest.capfd` fixture | capfd is simpler but requires pytest-style tests; existing tests use unittest.TestCase class pattern, so `patch('sys.stdout')` with StringIO is more consistent |

**Installation:**
No new packages needed. Everything is stdlib or already installed.

**Version verification:**
```
Python 3.11.9 (verified via python --version)
pytest 9.0.2 (verified via python -m pytest --version)
```

## Architecture Patterns

### Recommended Project Structure
```
plugins/claude-notify/
  hooks/scripts/
    flags.py              # check_notification_flags() -- NO CHANGES
    notify.py             # diagnose_configuration() -- UPDATE section [2]
  tests/
    test_flags.py         # 16 existing tests -- NO CHANGES
    test_notify.py        # existing core tests -- NO CHANGES
    test_diagnose.py      # NEW: diagnose_configuration() tests
```

### Pattern 1: Diagnose Function Consuming Shared Module
**What:** Replace direct file checks with `check_notification_flags()` call, then format the return dict for display.
**When to use:** This is the sole production code change.
**Example:**
```python
# Section [2] replacement in diagnose_configuration()
from flags import check_notification_flags  # already imported at line 21

print("\n[2] Notification Flags")
flags = check_notification_flags()

# Pushover
if flags['pushover_disabled']:
    path = flags['pushover_path'] or flags['global_pushover_path']
    source = "project-level" if flags['pushover_path'] else "global"
    print(f"  Pushover: DISABLED")
    print(f"    Found at {path} ({source})")
else:
    print("  Pushover: Enabled (no .no-pushover found)")

# Windows (same pattern)
if flags['windows_disabled']:
    path = flags['windows_path'] or flags['global_windows_path']
    source = "project-level" if flags['windows_path'] else "global"
    print(f"  Windows: DISABLED")
    print(f"    Found at {path} ({source})")
else:
    print("  Windows: Enabled (no .no-windows found)")
```

### Pattern 2: Stdout Capture for Diagnose Tests
**What:** Use `io.StringIO` with `unittest.mock.patch('sys.stdout')` to capture print output for assertion.
**When to use:** Testing functions that print to stdout.
**Example:**
```python
import io
from unittest.mock import patch

@patch('notify.check_notification_flags')
def test_diagnose_shows_project_path(self, mock_flags):
    mock_flags.return_value = {
        'pushover_disabled': True,
        'windows_disabled': False,
        'pushover_path': Path('/home/user/project/.no-pushover'),
        'windows_path': None,
        'global_pushover_path': None,
        'global_windows_path': None,
    }
    captured = io.StringIO()
    with patch('sys.stdout', captured):
        diagnose_configuration()
    output = captured.getvalue()
    self.assertIn('project-level', output)
    self.assertIn('/home/user/project/.no-pushover', output)
```

### Anti-Patterns to Avoid
- **Mocking `flags.Path` in diagnose tests:** The diagnose function should mock `check_notification_flags()` return value, not the underlying file system. This keeps tests focused on the display layer.
- **Re-testing flag logic:** `test_flags.py` already thoroughly tests upward traversal, global fallback, and priority. `test_diagnose.py` should ONLY test that diagnose correctly interprets and displays the return dict.
- **Using `print()` return values:** `print()` returns None. Tests must capture stdout, not assert on return values.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Flag file detection in diagnose | Direct `Path.cwd() / '.no-xxx'` checks | `check_notification_flags()` | Already handles upward traversal + global fallback; duplicate logic would diverge |
| Stdout capture in tests | Custom print-wrapping or log interception | `io.StringIO` + `patch('sys.stdout')` | stdlib solution, zero dependencies, reliable |

**Key insight:** The entire production code change is "call existing function, format its output." The test change is "mock that function's return, assert the output format." No new logic needed.

## Common Pitfalls

### Pitfall 1: Mocking Wrong Target
**What goes wrong:** Using `@patch('flags.check_notification_flags')` instead of `@patch('notify.check_notification_flags')`.
**Why it happens:** The function is defined in `flags.py` but imported into `notify.py`. The mock must patch the name in the namespace where it's used.
**How to avoid:** Always patch `notify.check_notification_flags` because that's the reference `diagnose_configuration()` calls.
**Warning signs:** Test passes but production code still calls the real function (mock has no effect).

### Pitfall 2: Forgetting to Capture All Sections
**What goes wrong:** Asserting on captured output that includes sections [1], [3], [4] which have external dependencies (env vars, log dir, Pushover API).
**Why it happens:** `diagnose_configuration()` prints 4 sections; only section [2] is relevant to this phase.
**How to avoid:** Use targeted string assertions (`assertIn('specific-substring', output)`) rather than matching the entire output. Mock env vars if needed to prevent noise.
**Warning signs:** Tests fail because PUSHOVER_TOKEN is/isn't set in the test environment.

### Pitfall 3: Path Object vs String in Output
**What goes wrong:** `check_notification_flags()` returns `Path` objects for paths (or `None`). When printing, `Path` objects render as strings, but assertions need to match the exact format.
**Why it happens:** Mixing `Path('/foo')` and `'/foo'` in assertions -- the mock returns MagicMock objects that may not stringify identically.
**How to avoid:** In test mocks, use real `Path` objects or set `mock_path.__str__ = lambda self: 'expected-string'` on MagicMock path values.
**Warning signs:** `assertIn` passes with MagicMock because it has a truthy `__contains__`, giving false positives.

### Pitfall 4: Test Ordering Dependencies
**What goes wrong:** Tests pass individually but fail when run together because stdout capture leaks between tests.
**Why it happens:** `patch('sys.stdout')` not properly scoped as context manager.
**How to avoid:** Always use `with patch('sys.stdout', captured):` as context manager, not decorator. Ensure StringIO is fresh per test.

## Code Examples

### Current Code to Replace (notify.py:278-291)
```python
# EXISTING - lines 278-291 (section [2])
print("\n[2] Project Configuration Files")
project_dir = Path.cwd()
no_pushover = project_dir / '.no-pushover'
no_windows = project_dir / '.no-windows'

if no_pushover.is_file():
    print("  .no-pushover: FOUND (Pushover notifications disabled)")
else:
    print("  .no-pushover: Not found (Pushover enabled)")

if no_windows.is_file():
    print("  .no-windows: FOUND (Windows notifications disabled)")
else:
    print("  .no-windows: Not found (Windows enabled)")
```

### Replacement Pattern
```python
# REPLACEMENT - uses check_notification_flags() (already imported at line 21)
print("\n[2] Notification Flags")
flags = check_notification_flags()

# Pushover
if flags['pushover_disabled']:
    path = flags['pushover_path'] or flags['global_pushover_path']
    source = "project-level" if flags['pushover_path'] else "global"
    print(f"  Pushover: DISABLED - Found at {path} ({source})")
else:
    print("  Pushover: Enabled (no .no-pushover found)")

# Windows
if flags['windows_disabled']:
    path = flags['windows_path'] or flags['global_windows_path']
    source = "project-level" if flags['windows_path'] else "global"
    print(f"  Windows: DISABLED - Found at {path} ({source})")
else:
    print("  Windows: Enabled (no .no-windows found)")
```

### Test File Structure (test_diagnose.py)
```python
#!/usr/bin/env python3
"""Tests for diagnose_configuration() display of flag detection results."""

import unittest
import io
import sys
from pathlib import Path
from unittest.mock import patch, MagicMock

sys.path.insert(0, str(Path(__file__).parent.parent / 'hooks' / 'scripts'))

from notify import diagnose_configuration

def _make_flags(pushover_disabled=False, windows_disabled=False,
                pushover_path=None, windows_path=None,
                global_pushover_path=None, global_windows_path=None):
    """Helper to create mock check_notification_flags return value."""
    return {
        'pushover_disabled': pushover_disabled,
        'windows_disabled': windows_disabled,
        'pushover_path': pushover_path,
        'windows_path': windows_path,
        'global_pushover_path': global_pushover_path,
        'global_windows_path': global_windows_path,
    }

class TestDiagnoseConfiguration(unittest.TestCase):
    """Test diagnose_configuration() section [2] output."""

    # Test scenarios per D-03b:
    # 1. Flag in CWD (project-level) -> shows project-level path
    # 2. Flag in parent dir -> shows upward-found project-level path
    # 3. Global flag only -> shows global path
    # 4. Mixed project + global -> shows both sources correctly
    # 5. No flags -> shows "Enabled" / "not found"
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CWD-only flag checks in diagnose | `check_notification_flags()` with upward traversal + global fallback | Phase 26-27 | Diagnose output now shows real detection results including parent dirs and global |

**Deprecated/outdated:**
- `Path.cwd() / '.no-xxx'` direct checks in diagnose: replaced by `check_notification_flags()` which handles the full search logic

## Existing Test Coverage Analysis

### test_flags.py Coverage vs Requirements

The 16 tests in `test_flags.py` (all passing) map to TEST-01 and TEST-02 as follows:

**TEST-01 (parent directory lookup scenarios):**
| Scenario | Test Name | Status |
|----------|-----------|--------|
| File in direct parent | `test_pushover_in_parent`, `test_windows_in_parent`, `test_both_in_parent` | Covered |
| File in grandparent (higher level) | `test_flags_in_grandparent` | Covered |
| No file in chain | `test_no_flags_no_claude_md` | Covered |
| CLAUDE.md stops search | `test_claude_md_stops_search` | Covered |
| CLAUDE.md + flag coexistence | `test_claude_md_with_no_pushover_same_dir`, `test_claude_md_with_no_pushover_stops_windows_search` | Covered |
| Cross-level mixed | `test_pushover_cwd_windows_parent` | Covered |
| Max depth boundary | `test_max_depth_10` | Covered |
| Filesystem root | `test_filesystem_root_stops` | Covered |

**TEST-02 (global ~/.claude/ lookup scenarios):**
| Scenario | Test Name | Status |
|----------|-----------|--------|
| Global flag exists (pushover) | `test_global_pushover_only` | Covered |
| Global flag exists (windows) | `test_global_windows_only` | Covered |
| Project-level takes priority | `test_project_level_takes_priority` | Covered |
| Mixed project + global | `test_mixed_project_and_global` | Covered |
| Return structure has 6 keys | `test_return_structure_includes_paths` | Covered |

**Conclusion:** `test_flags.py` fully satisfies TEST-01 and TEST-02 for the underlying flag detection logic. The new `test_diagnose.py` adds the DIAG-01 layer: verifying that `diagnose_configuration()` correctly consumes and displays the flag results.

## Open Questions

1. **Should diagnose output include path for "Not found" cases?**
   - What we know: D-01a specifies "Not found" as a source label option
   - What's unclear: Whether to show a searched-path summary (e.g., "Searched CWD and 3 parent directories")
   - Recommendation: Keep it simple -- just show "Enabled (no .no-pushover found)" per the replacement pattern above

2. **Should test_diagnose.py also mock sections [1], [3], [4] to avoid env var / filesystem noise?**
   - What we know: These sections access env vars, log directory, and Pushover API
   - What's unclear: Whether env var presence in test env causes false output assertions
   - Recommendation: Use targeted `assertIn` on section [2] specific strings. Mock `os.environ.get` only if tests become flaky.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Python 3.11 | Runtime + tests | Yes | 3.11.9 | -- |
| pytest | Test runner | Yes | 9.0.2 | -- |
| requests | Diagnose section [4] API test | Yes | (installed) | -- |

**Missing dependencies with no fallback:** None

**Missing dependencies with fallback:** None

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | pytest 9.0.2 with unittest.TestCase classes |
| Config file | pytest.ini (root) |
| Quick run command | `python -m pytest plugins/claude-notify/tests/test_diagnose.py -v --tb=short -x` |
| Full suite command | `python -m pytest plugins/claude-notify/tests/ -v --tb=short` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DIAG-01 | Diagnose shows project-level flag path with source label | unit | `python -m pytest plugins/claude-notify/tests/test_diagnose.py::TestDiagnoseConfiguration::test_project_level_flag_shown -x` | Wave 0 create |
| DIAG-01 | Diagnose shows global flag path with source label | unit | `python -m pytest plugins/claude-notify/tests/test_diagnose.py::TestDiagnoseConfiguration::test_global_flag_shown -x` | Wave 0 create |
| DIAG-01 | Diagnose shows "Enabled" when no flags found | unit | `python -m pytest plugins/claude-notify/tests/test_diagnose.py::TestDiagnoseConfiguration::test_no_flags_shows_enabled -x` | Wave 0 create |
| DIAG-01 | Diagnose shows mixed project+global sources | unit | `python -m pytest plugins/claude-notify/tests/test_diagnose.py::TestDiagnoseConfiguration::test_mixed_sources_shown -x` | Wave 0 create |
| TEST-01 | Parent dir lookup (underlying logic) | unit | `python -m pytest plugins/claude-notify/tests/test_flags.py -x` | Existing (16 tests pass) |
| TEST-02 | Global lookup (underlying logic) | unit | `python -m pytest plugins/claude-notify/tests/test_flags.py -x` | Existing (16 tests pass) |

### Sampling Rate
- **Per task commit:** `python -m pytest plugins/claude-notify/tests/test_diagnose.py -v --tb=short -x`
- **Per wave merge:** `python -m pytest plugins/claude-notify/tests/ -v --tb=short`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `plugins/claude-notify/tests/test_diagnose.py` -- covers DIAG-01 display output
- [ ] Production change: notify.py lines 278-291 replacement

## Sources

### Primary (HIGH confidence)
- Direct code reading: `notify.py` lines 245-336 (diagnose_configuration function)
- Direct code reading: `flags.py` full file (check_notification_flags with 6-key return)
- Direct code reading: `test_flags.py` full file (16 passing tests)
- Direct code reading: `test_notify.py` full file (existing test patterns)

### Secondary (MEDIUM confidence)
- pytest 9.0.2 behavior verified via test run (16/16 pass)
- Python 3.11.9 stdlib `io.StringIO` documented behavior

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all tools already in use, verified on machine
- Architecture: HIGH - single function replacement, well-defined scope
- Pitfalls: HIGH - based on observed mock patterns in existing test files

**Research date:** 2026-04-01
**Valid until:** 2026-04-30 (stable project, no external dependency changes expected)
