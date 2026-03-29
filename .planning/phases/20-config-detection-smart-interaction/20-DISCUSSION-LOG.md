# Phase 20: Config Detection & Smart Interaction - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-29
**Phase:** 20-config-detection-smart-interaction
**Areas discussed:** Pushover detection depth, Partial config handling, Skip/Update UX pattern, Display format

---

## Pushover Detection Depth

| Option | Description | Selected |
|--------|-------------|----------|
| Dual-source detection | Check both process.env and registry HKCU\Environment for setx-persisted values | ✓ |
| process.env only | Only check current session, simpler but misses setx values in new terminals | |

**User's choice:** Dual-source detection (recommended)
**Notes:** Current pushover.js only checks process.env. User confirmed need to also check registry for values persisted via setx in previous sessions.

---

## Partial Config Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Per-item handling | Existing items ask skip/update, missing items prompt for input directly | ✓ |
| Treat as unconfigured | Any missing item means whole section is treated as unconfigured, prompt all | |

**User's choice:** Per-item handling (recommended)
**Notes:** Handles edge cases like only PUSHOVER_TOKEN set without PUSHOVER_USER, or only git user.name without email.

---

## Skip/Update UX Pattern

| Option | Description | Selected |
|--------|-------------|----------|
| Confirm prompt | "Keep existing config? (Y/n)" — default Y=skip, N=re-enter. Consistent with pushover.js pattern | ✓ |
| Select three options | "Keep existing / Update / Skip section" — more explicit but more interaction steps | |

**User's choice:** Confirm prompt (recommended)
**Notes:** Need to modify git-user.js which currently returns immediately when configured (no interaction). Will align both configurators to same pattern.

---

## Display Format

| Option | Description | Selected |
|--------|-------------|----------|
| Keep current format | Pushover: first 8 chars + "...", Git user: full name and email | ✓ |
| Stricter masking | Pushover: first 4 chars + "****", User key: fully masked "****" | |

**User's choice:** Keep current format (recommended)
**Notes:** Current masking (first 8 chars) provides enough context for user to recognize their key without being too revealing.

---

## Additional Findings

**REQUIREMENTS.md naming discrepancy:** Requirements specify `PUSHOVER_API_KEY` and `PUSHOVER_USER_KEY`, but the actual code (pushover.js, setx calls, verify-installation.py) uses `PUSHOVER_TOKEN` and `PUSHOVER_USER`. CONTEXT.md uses code as ground truth.

## Claude's Discretion

- Registry read implementation (reg query command vs Node.js approach)
- Confirm prompt message text
- Partial config detection code organization

## Deferred Ideas

None — discussion stayed within phase scope
