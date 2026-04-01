# Phase 28: Diagnostics & Testing - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Update `diagnose_configuration()` to display project-level upward traversal results and global `~/.claude/` detection results. Add test coverage for all new find-up and global lookup scenarios.

Does not include: changes to flag detection logic (Phase 26-27 complete), new notification features, or installer changes.

</domain>

<decisions>
## Implementation Decisions

### Diagnostic Output Format
- **D-01:** `diagnose_configuration()` section [2] expanded to use `check_notification_flags()` return value instead of direct CWD-only file checks
- **D-01a:** Each flag shown with source label: "Found at [path] (project-level)" or "Found at [path] (global)" or "Not found"
- **D-01b:** For project-level flags found via upward traversal, display the actual path where the file was found (e.g., `C:\Users\xxx\.no-pushover` found 2 levels up)

### Diagnostic Section Structure
- **D-02:** Section [2] expanded with sub-sections:
  - `[2] Notification Flags`
    - `Pushover:` status + path + source (project-level / global / not found)
    - `Windows:` status + path + source (project-level / global / not found)
- **D-02a:** Replace old CWD-only `.no-pushover`/`.no-windows` checks with single `check_notification_flags()` call
- **D-02b:** Other diagnostic sections ([1] env vars, [3] logs, [4] API test) remain unchanged

### Test Coverage Scope
- **D-03:** Requirements TEST-01 and TEST-02 partially covered by existing `test_flags.py` tests from Phases 26-27
- **D-03a:** Additional tests needed for `diagnose_configuration()` verifying it correctly uses `check_notification_flags()` output
- **D-03b:** Test scenarios for diagnose:
  - Flag in CWD → shows project-level path
  - Flag in parent dir → shows upward-found project-level path
  - Global flag only → shows global path
  - Mixed project + global → shows both sources correctly
  - No flags → shows "Not found" / enabled

### Test Organization
- **D-04:** New `test_diagnose.py` file for `diagnose_configuration()` tests — separate from `test_flags.py`
- **D-04a:** Existing `test_flags.py` already covers flag logic thoroughly (17 tests); no new flag logic tests needed unless gaps found
- **D-04b:** Verify existing `test_flags.py` coverage satisfies TEST-01 and TEST-02 requirements (it should — parent dir, grandparent, global, mixed, priority tests all exist)

### Claude's Discretion
- Exact formatting of diagnostic output (indentation, labels, path display)
- Whether to truncate long paths in diagnostic output
- Test helper patterns for capturing stdout in diagnose tests
- Whether test_diagnose.py needs a `_setup_safe_global_home` helper like test_flags.py

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Core implementation files
- `plugins/claude-notify/hooks/scripts/notify.py` -- `diagnose_configuration()` at lines 245-336, the function to update; also imports `check_notification_flags` from flags module
- `plugins/claude-notify/hooks/scripts/flags.py` -- `check_notification_flags()` returning 6-key dict with project-level and global paths; the source of truth for flag state

### Existing tests
- `plugins/claude-notify/tests/test_flags.py` -- 17 existing tests covering upward traversal + global fallback; verify these satisfy TEST-01 and TEST-02
- `plugins/claude-notify/tests/test_notify.py` -- existing notify tests; reference for test patterns

### Prior context
- `.planning/phases/26-find-up-implementation/26-CONTEXT.md` -- D-01~D-10: upward traversal design, return value structure
- `.planning/phases/27-global-control/27-CONTEXT.md` -- D-11~D-13: global fallback design, return value expansion (global_* fields)
- `.planning/phases/02-configuration-diagnostics/02-CONTEXT.md` -- original `diagnose_configuration()` design decisions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `flags.py:check_notification_flags()`: returns all 6 fields needed — `pushover_disabled`, `windows_disabled`, `pushover_path`, `windows_path`, `global_pushover_path`, `global_windows_path`
- `test_flags.py:_setup_safe_global_home()`: helper pattern for mocking `Path.home()` to avoid false global flag detection in tests
- `test_flags.py` test structure: `@patch('flags.Path')` with MagicMock `__truediv__` pattern for simulating directory traversal

### Established Patterns
- Diagnostic output uses `print()` with section headers `[N]` and indentation
- Tests use `unittest.mock.patch` for file system mocking
- `Path.is_file()` for existence checks, `Path.cwd()` for current directory
- Error handling: silent failure + logging

### Integration Points
- `diagnose_configuration()` at notify.py:245 — replace lines 278-291 (section [2]) with `check_notification_flags()` call
- `diagnose_configuration()` currently only checks `Path.cwd() / '.no-xxx'` — needs to use the shared module
- Test files in `plugins/claude-notify/tests/` — add `test_diagnose.py`

</code_context>

<specifics>
## Specific Ideas

- Diagnostic output should make it obvious WHERE the flag was found (show full path) and at WHAT LEVEL (project vs global)
- Users running diagnostics in subdirectories should see the parent directory path where the flag was actually found

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 28-diagnostics-testing*
*Context gathered: 2026-04-01*
