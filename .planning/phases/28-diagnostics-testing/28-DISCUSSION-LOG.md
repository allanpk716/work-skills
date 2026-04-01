# Phase 28: Diagnostics & Testing - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md -- this log preserves the alternatives considered.

**Date:** 2026-04-01
**Phase:** 28-diagnostics-testing
**Areas discussed:** Diagnostic output format, Section structure, Test coverage scope, Test organization
**Mode:** Auto (--auto flag)

---

## Diagnostic Output Format

| Option | Description | Selected |
|--------|-------------|----------|
| Detailed | Show found path, traversal depth, source type for each flag | |
| Summary with source labels | Show "Found at [path] (project-level/global)" or "Not found" per channel | ✓ |
| Table format | Render results in ASCII table with columns | |

**User's choice:** Summary with source labels (auto-selected, recommended)
**Notes:** Balances information richness with readability. Path display makes it clear where the flag was found.

---

## Diagnostic Section Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Expand [2] with sub-sections | Clear visual separation between project-level and global results | ✓ |
| Split into [2] + [2b] | Separate numbered sections for project and global | |
| Keep single section, add source annotation | Minimal change, just annotate existing output | |

**User's choice:** Expand [2] with sub-sections (auto-selected, recommended)
**Notes:** Sub-sections provide clear visual hierarchy without increasing the total number of top-level sections.

---

## Test Coverage Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Add diagnose-specific tests | Test diagnose_configuration() output uses check_notification_flags() correctly | ✓ |
| Add integration tests | Full pipeline from flags to diagnose output | |
| Verify existing coverage only | Check test_flags.py covers requirements, no new tests | |

**User's choice:** Add diagnose-specific tests (auto-selected, recommended)
**Notes:** test_flags.py already covers flag logic (17 tests). New tests focus on diagnose function consuming flag results correctly.

---

## Test Organization

| Option | Description | Selected |
|--------|-------------|----------|
| New test_diagnose.py | Separate file for diagnose tests, clean separation | ✓ |
| Extend test_flags.py | Add diagnose tests to existing file | |
| Add to test_notify.py | Add alongside existing notify tests | |

**User's choice:** New test_diagnose.py (auto-selected, recommended)
**Notes:** Diagnose testing is a separate concern from flag logic testing. Keeps test files focused.

---

## Claude's Discretion

- Exact diagnostic output formatting details
- Path truncation in output
- Test helper patterns for stdout capture
- Whether test_diagnose.py needs _setup_safe_global_home helper

## Deferred Ideas

None
