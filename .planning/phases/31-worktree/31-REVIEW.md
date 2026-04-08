---
phase: 31-worktree
reviewed: 2026-04-08T14:26:37Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - plugins/claude-notify/hooks/scripts/flags.py
  - plugins/claude-notify/hooks/scripts/notify-attention.py
  - plugins/claude-notify/hooks/scripts/notify.py
  - plugins/claude-notify/tests/test_flags.py
  - plugins/claude-notify/tests/test_notify.py
findings:
  critical: 1
  warning: 3
  info: 3
  total: 7
status: issues_found
---

# Phase 31: Code Review Report

**Reviewed:** 2026-04-08T14:26:37Z
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

Reviewed 5 files in the claude-notify plugin: 3 source modules (`flags.py`, `notify.py`, `notify-attention.py`) and 2 test files (`test_flags.py`, `test_notify.py`). The codebase implements a notification system with Pushover and Windows Toast channels, worktree-aware title formatting, and upward directory traversal for flag detection.

The most significant finding is a **command injection vulnerability** in `notify.py` where user-controlled strings are interpolated directly into a PowerShell command template without XML escaping. The sibling file `notify-attention.py` correctly escapes these values with `xml.sax.saxutils.escape()`, confirming this is a missed fix rather than a design choice.

Additional findings include variable shadowing in `notify.py`, code duplication across the notification scripts, and a test that does not validate what its name claims.

## Critical Issues

### CR-01: XML/PowerShell Injection in notify.py send_windows_notification

**File:** `plugins/claude-notify/hooks/scripts/notify.py:147-160`
**Issue:** The `send_windows_notification` function interpolates `title` and `message` directly into a PowerShell here-string containing XML without any escaping. If the title or message contains characters like `<`, `>`, `"`, or `&`, the XML becomes invalid. More critically, PowerShell special characters like `` ` `` or `$()` in the message could lead to code execution in the PowerShell context. The title comes from `build_notification_title()` (git branch names, project names) and the message comes from Claude CLI output -- both attacker-influencable surfaces.

The sibling file `notify-attention.py` at lines 105-106 correctly applies `xml.sax.saxutils.escape()` to both `title` and `message` before interpolation, confirming this is a missed fix rather than an intentional design.

**Fix:**
```python
# Add import at top of file
import xml.sax.saxutils

# In send_windows_notification(), escape before interpolation (lines 105-106 equivalent)
def send_windows_notification(title, message):
    try:
        logger.info("Sending Windows Toast notification...")

        # Escape XML special characters to prevent injection
        title_escaped = xml.sax.saxutils.escape(title)
        message_escaped = xml.sax.saxutils.escape(message)

        ps_script = f'''
        ...
            <text id="1">{title_escaped}</text>
            <text id="2">{message_escaped}</text>
        ...
'''
```

## Warnings

### WR-01: Variable Shadowing -- log_file (module-level vs loop variable)

**File:** `plugins/claude-notify/hooks/scripts/notify.py:26,212`
**Issue:** The module-level variable `log_file` (line 26, the active log file path) is shadowed by the `for log_file in log_dir.glob(...)` loop variable in `cleanup_old_logs()` (line 212). While Python scoping rules mean the module-level `log_file` is not actually mutated (the loop variable is local to the function), this shadowing creates confusion and could lead to subtle bugs if `cleanup_old_logs` were ever refactored to reference the module-level `log_file`.

**Fix:**
```python
# Line 212 - rename loop variable to avoid shadowing module-level log_file
    for old_log in log_dir.glob('claude-notify-*.log'):
        if old_log.is_file():
            file_mtime = old_log.stat().st_mtime
            if file_mtime < cutoff_timestamp:
                try:
                    old_log.unlink()
                    logger.debug(f"Deleted old log file: {old_log.name}")
```

### WR-02: Duplicated send_pushover_notification and send_windows_notification across files

**File:** `plugins/claude-notify/hooks/scripts/notify.py:81-129,132-188` and `plugins/claude-notify/hooks/scripts/notify-attention.py:38-87,90-150`
**Issue:** Both notification functions are duplicated between `notify.py` and `notify-attention.py` with only minor differences (e.g., `priority` parameter defaults). The codebase already extracted `build_notification_title` into `flags.py` to reduce duplication, but the notification senders were not similarly consolidated. This caused the security issue in CR-01 -- the fix was applied in `notify-attention.py` but missed in `notify.py`. Consolidating these into a shared module (e.g., `notify_utils.py`) would prevent such desync.

**Fix:** Extract notification senders into `flags.py` or a new shared module. At minimum, ensure both copies have identical XML escaping.

### WR-03: Test test_name_with_chinese does not test Chinese characters

**File:** `plugins/claude-notify/tests/test_flags.py:1148-1156`
**Issue:** The test method `test_name_with_chinese` in `TestGetProjectName` sets `mock_root.name = "my-project"` -- a plain ASCII string. The test name implies it should test Chinese characters (like the equivalent test in `test_notify.py` line 44 which uses `"测试项目"`), but it does not. This means the Chinese character handling in `get_project_name()` is not actually tested in the flags test suite.

**Fix:**
```python
    @patch('flags.find_project_root')
    @patch('flags.Path')
    def test_name_with_chinese(self, mock_path_class, mock_find_root):
        """Project root .name with Chinese chars -> returns name correctly."""
        mock_root = MagicMock()
        mock_root.name = "测试项目"
        mock_find_root.return_value = mock_root

        result = get_project_name()

        self.assertEqual(result, "测试项目")
```

## Info

### IN-01: Unused import -- `import subprocess` at module level in test_flags.py

**File:** `plugins/claude-notify/tests/test_flags.py:1159`
**Issue:** Line 1159 has `import subprocess` at module level, placed after the `TestGetProjectName` class definition. The import is used inside `TestGetGitBranch` (line 1196: `subprocess.TimeoutExpired`), so it is not truly unused, but its placement at line 1159 -- between two class definitions and after the main test code -- is unusual and reads like an afterthought. Convention would place it with the other imports at the top of the file.

**Fix:** Move `import subprocess` to the top-level import block (around line 10).

### IN-02: notify.py imports `sys` and `argparse` but never uses `sys`

**File:** `plugins/claude-notify/hooks/scripts/notify.py:12`
**Issue:** `import sys` is present but `sys` is never referenced in the file. The `sys.exit(main())` call at line 414 uses `sys`, so this is actually used -- disregard this item. (Upon closer inspection, `sys` IS used at line 414.)

### IN-03: Missing test coverage for notify-attention.py main() and message formatting

**File:** `plugins/claude-notify/tests/test_notify.py`
**Issue:** The test file has no tests for `notify-attention.py`'s `main()` function, including the `idle_prompt` skip logic (line 176-178), the JSON stdin parsing, or the session_id message formatting beyond a basic string assertion. The `test_attention_message_contains_session_id` test (line 184-189) constructs a message string locally rather than calling the actual `main()` function, so it only validates the test's own string formatting, not the production code.

**Fix:** Consider adding integration-style tests that mock `sys.stdin` and verify the actual `main()` flow in `notify-attention.py`.

---

_Reviewed: 2026-04-08T14:26:37Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
