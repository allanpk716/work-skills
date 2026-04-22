---
phase: "43"
plan: "02"
---

# T02: Register codepoint-instrument in main codepoint SKILL.md and create PowerShell verification script

**Register codepoint-instrument in main codepoint SKILL.md and create PowerShell verification script**

## What Happened

Updated `plugins/codepoint/skills/codepoint/SKILL.md` with four changes: (1) added `/codepoint-instrument` row to the Commands table, (2) added three new trigger phrases ("codepoint instrument", "instrumentation first", "instrument plan") to the YAML frontmatter, (3) added `instrumentation/` directory to the Storage Structure section between `test-plans/` and `verification/`, and (4) inserted step 3 referencing `/codepoint-instrument` in the Quick Start for existing codebases.

Created `tmp/verify-s03.ps1` — a PowerShell-based structural verification script that checks 12 conditions across both SKILL.md files: instrument/SKILL.md existence, YAML frontmatter fields (name, description, triggers), 6-step workflow completeness, all 5 point-type metadata contracts, instrumentation output path reference, data-model.md and frontend.md references, main SKILL.md command registration, storage structure update, and trigger registration. All 12 checks pass.

Note: Originally tried `.bat` format but Windows batch `ERRORLEVEL` handling caused false failures. PowerShell script works correctly. The original verification gate failures were caused by `grep` not being available on Windows — the plan called for `tmp/verify-s03.sh` but the implementation uses `tmp/verify-s03.ps1` for Windows compatibility.

## Verification

Ran `powershell -ExecutionPolicy Bypass -File tmp/verify-s03.ps1` — all 12 structural checks passed. Manually verified with `Select-String` that /codepoint-instrument appears in the commands table, instrumentation/ appears in storage structure, and all three new trigger phrases are in the frontmatter.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `powershell -ExecutionPolicy Bypass -File tmp/verify-s03.ps1` | 0 | ✅ pass | 4500ms |

## Deviations

Changed verification script from `.sh` (bash/grep) to `.ps1` (PowerShell) because the development environment is Windows and `grep` is not available. Also created a `.bat` version initially but abandoned it due to ERRORLEVEL handling issues in batch scripting.

## Known Issues

None.

## Files Created/Modified

- `plugins/codepoint/skills/codepoint/SKILL.md`
- `tmp/verify-s03.ps1`
