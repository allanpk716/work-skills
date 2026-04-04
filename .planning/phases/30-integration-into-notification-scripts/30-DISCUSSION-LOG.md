# Phase 30: Integration into Notification Scripts - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-04
**Phase:** 30-integration-into-notification-scripts
**Areas discussed:** Migration strategy, Error handling, Test update
**Mode:** Auto (--auto flag)

---

## Migration Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Delete local functions, expand flags import | Consistent with D-06/D-07/D-08 from Phase 26 | Yes |
| Keep local functions as wrappers to flags.py | Extra indirection, unnecessary | |
| Replace only notify.py, defer notify-attention.py | Inconsistent, defeats shared module purpose | |

**Auto-selected:** Delete local functions, expand flags import (consistent with established pattern)

---

## Error Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Keep try/except at call sites with logging | Preserves "Claude Code" fallback and logger.info | Yes |
| Rely solely on flags.py error handling | Loses logging and fallback value | |
| Add error handling to flags.py | Violates separation — flags.py is pure logic | |

**Auto-selected:** Keep try/except at call sites with logging

---

## Test Update

| Option | Description | Selected |
|--------|-------------|----------|
| Update test_notify.py tests to mock flags.find_project_root | Tests remain useful, verify integration wiring | Yes |
| Remove test_notify.py tests for get_project_name | test_flags.py already covers thoroughly | |
| Add new integration tests | Overkill for a simple import change | |

**Auto-selected:** Update test_notify.py tests to mock flags.find_project_root

---

## Claude's Discretion

- Exact mock modification approach
- Whether to add extra integration tests
- Log message wording

## Deferred Ideas

None.
