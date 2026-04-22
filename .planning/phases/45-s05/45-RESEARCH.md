# S05: Skill UX Orchestration — Research

**Date:** 2026-04-20

## Summary

S05 delivers a unified orchestration skill (`/codepoint-run`) that chains the 5 existing sub-skills (scan → plan → instrument → test-plan → implement → verify) into a single guided workflow with progress tracking, error handling, and continuation prompts. Currently, users must manually invoke each `/codepoint-*` command in the correct sequence and understand dependencies between them — this is the UX gap S05 closes.

The work is **light research**. The project has an established SKILL.md pattern (frontmatter with name/description/triggers, structured step sections, references to upstream artifacts) and a consistent structural verification script pattern (tmp/verify-sXX.ps1 with Check function). S05 follows these exact same conventions — it's a new skill file plus registration in the main SKILL.md, which is the same 2-task pattern every prior slice used.

## Recommendation

Create a `plugins/codepoint/skills/run/SKILL.md` file that defines a `/codepoint-run` orchestration workflow. The skill should:
1. Accept a mode argument (e.g., "existing" for scanning an existing codebase, "new" for planning new features)
2. Chain sub-skills in the correct dependency order with automatic progress reporting
3. Handle errors gracefully — if a step fails, report the error and let the user decide whether to continue or stop
4. Support resumption — detect which steps have already been completed (by checking for artifacts like index.json, instrumentation plans, test plans) and skip them
5. Be registered in the main `codepoint/SKILL.md` commands table, triggers, and quick start

Then create a structural verification script (`tmp/verify-s05.ps1`) following the established Check function pattern.

## Implementation Landscape

### Key Files

- `plugins/codepoint/skills/codepoint/SKILL.md` — Main skill file that needs `/codepoint-run` added to commands table, triggers list in frontmatter, quick start section, and storage structure. This file was modified by every prior slice (S01–S04).
- `plugins/codepoint/skills/run/SKILL.md` — **New file** to create. The orchestration skill with the full pipeline workflow.
- `tmp/verify-s05.ps1` — **New file** to create. Structural verification script following the established pattern from S03/S04.

### Existing Skills to Reference (read-only, do not modify)

- `plugins/codepoint/skills/scan/SKILL.md` — 2-phase scan (overview + deep dive). Produces `.codepoints/index.json`, collections/, flows/, points/.
- `plugins/codepoint/skills/plan/SKILL.md` — Plans code points for new features. Reads feature specs, generates code point definitions.
- `plugins/codepoint/skills/instrument/SKILL.md` — 6-step instrumentation planning. Reads index.json, produces `.codepoints/instrumentation/` plans.
- `plugins/codepoint/skills/test-plan/SKILL.md` — 6-step test plan generation. Reads index.json + flow definitions, produces `.codepoints/test-plans/`.
- `plugins/codepoint/skills/implement/SKILL.md` — TDD-style 3-phase probe insertion (Red/Green/Verify). Reads plans, inserts probe code, runs tests.
- `plugins/codepoint/skills/verify/SKILL.md` — 7-step verification against actual probe logs. Reads instrumentation + test plans + logs, produces verification reports.

### Dependency Order

1. **T01: Create run/SKILL.md** — The orchestration skill itself. This unblocks T02.
2. **T02: Register + verify** — Register `/codepoint-run` in main SKILL.md and create verification script. Depends on T01.

### Verification Approach

1. Run `tmp/verify-s05.ps1` — structural checks (SKILL.md frontmatter, all pipeline stages referenced, registered in main SKILL.md)
2. Manual review — confirm the orchestration workflow correctly chains all 6 sub-skills in proper dependency order
3. Verify artifact detection logic — confirm the skill references the correct artifact paths to detect completed steps

## Constraints

- The orchestration skill must be **read-only** with respect to sub-skills — it delegates to them, does not reimplement their logic
- Must follow the exact same SKILL.md frontmatter format (name, description with triggers)
- Must reference artifact paths exactly as they exist in the .codepoints/ directory structure (index.json, instrumentation/, test-plans/, verification/)
- Windows-compatible verification (PowerShell, not bash)
- No new dependencies — the orchestration is pure SKILL.md documentation that guides the LLM

## Common Pitfalls

- **Don't reimplement sub-skill logic** — the orchestration skill should reference sub-skills by name (e.g., "Run /codepoint-scan") not duplicate their steps
- **Don't forget triggers** — the main SKILL.md frontmatter must include orchestration-related trigger phrases (e.g., "codepoint run", "运行代码点", "full pipeline")
- **Respect the "existing" vs "new" distinction** — existing codebases start with scan, new features start with plan. The orchestration skill must handle both entry points.
