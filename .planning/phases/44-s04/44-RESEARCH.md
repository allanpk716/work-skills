# S04: Verification Automation — Research

**Date:** 2026-04-20

## Summary

S04 creates a dedicated `/codepoint-verify` skill — the missing verification automation capability in the codepoint V2 pipeline. Currently, the implement skill (implement/SKILL.md) has a Phase 3 (Verify) that describes manual verification steps: generate test cases, run tests, analyze output, generate report. But this is embedded inside the implement workflow and not a standalone capability. A dedicated verify skill would consume the outputs of upstream skills (instrument plans, test plans, index.json) and automate the comparison of actual probe output against expected behavior.

The verification skill reads from three upstream sources: (1) `.codepoints/index.json` for the expected probe definitions and flow sequences, (2) `.codepoints/instrumentation/{flow-id}-instrumentation.md` from S03 for probe priority and metadata contracts, (3) `.codepoints/test-plans/{flow-id}-test-plan.md` from S01 for test case definitions and expected observations. It then reads the actual probe output log files (e.g., `~/.codepoint/<project>/cp-go-*.log` or `cp-ts-*.log`) and validates: probe firing order matches flow sequence, stack traces are complete, metadata contracts are satisfied, test scenario expectations are met.

## Recommendation

Create a new `codepoint-verify` skill (`plugins/codepoint/skills/verify/SKILL.md`) with a structured verification workflow. This is a standalone skill (not embedded in implement) because: (a) verification may need to run independently after manual code changes, (b) the implement skill's Phase 3 Verify is already described as a high-level outline and a dedicated skill can go deeper, (c) S05 (Skill UX Orchestration) will likely need to chain verify as an independent step.

The skill should have these core capabilities:
1. **Load expectations** — Read index.json flow sequences, instrumentation plans (probe priorities/metadata), and test plans (expected observations)
2. **Collect actual output** — Read probe log files from `~/.codepoint/<project>/`, parse JSON entries
3. **Validate sequence** — Check that probe firing order matches the flow's `sequence` array in index.json
4. **Validate completeness** — Check that all probes in the flow sequence actually fired
5. **Validate metadata** — Check that each probe's metadata satisfies the instrumentation plan's contract for its point type
6. **Validate coverage** — Cross-reference against test plan scenarios (normal/boundary/error)
7. **Generate verification report** — Output to `.codepoints/verification/{flow-id}-verify.md` using the existing `templates/verification.md` template
8. **Update index.json** — Set flow `status` to `verified` on PASS

Update the main codepoint SKILL.md to register `/codepoint-verify` in the commands table, add trigger keywords, and include verify in the workflow chains.

## Implementation Landscape

### Key Files

- `plugins/codepoint/skills/verify/SKILL.md` — **NEW**. The core deliverable. Define the verification workflow steps. Follows established SKILL.md pattern (frontmatter with name/description/triggers).
- `plugins/codepoint/skills/codepoint/SKILL.md` — **MODIFY**. Register `/codepoint-verify` in commands table, add trigger keywords to frontmatter, add `verification/` to storage structure (already exists in the storage diagram), include verify step in Quick Start workflows.
- `plugins/codepoint/templates/verification.md` — **READ ONLY**. Existing verification report template. The verify skill should produce output matching this template's structure.
- `plugins/codepoint/skills/implement/SKILL.md` — **READ ONLY**. Reference Phase 3 Verify section to ensure the new verify skill is complementary, not duplicative. The implement skill's Verify phase should reference `/codepoint-verify` for detailed verification rather than embedding it.
- `plugins/codepoint/skills/instrument/SKILL.md` — **READ ONLY**. S03's output format (per-flow instrumentation plans with Probe Table, Test Scenario Mapping, Density Analysis) is a key input for the verify skill. The verify skill must parse these structured markdown sections.
- `plugins/codepoint/skills/test-plan/SKILL.md` — **READ ONLY**. S01's test plan output (test cases with Action/Response/Verify, coverage matrix) provides the expected behavior spec the verify skill validates against.
- `plugins/codepoint/references/data-model.md` — **READ ONLY**. Probe output format V2 (JSON with point_id, flow_id, timestamp, stack, metadata) defines what the verify skill parses from log files.
- `plugins/codepoint/templates/index.json` — **READ ONLY**. Example data with 1 collection, 2 flows, 9 points. Used as input for structural verification.

### Build Order

1. **Create `plugins/codepoint/skills/verify/SKILL.md`** — The core deliverable. Define a multi-step verification workflow: (1) load expectations from index.json, instrumentation plans, and test plans, (2) collect actual probe output from log files, (3) validate probe sequence, completeness, metadata, and coverage, (4) generate verification report, (5) update index.json flow status.
2. **Update `plugins/codepoint/skills/codepoint/SKILL.md`** — Register `/codepoint-verify` in commands table, add trigger keywords, include verify in Quick Start workflows (after implement).
3. **Create `tmp/verify-s04.ps1`** — Structural verification script (PowerShell, following S03's Windows-compatible pattern) confirming SKILL.md exists with proper frontmatter, workflow steps reference upstream skills, output format matches verification template, and main SKILL.md is updated.

### Verification Approach

- Structural verification script (PowerShell, following S03's .ps1 pattern) checking: verify/SKILL.md exists with proper frontmatter, references index.json, instrumentation plans, test plans, and probe log files; output format aligns with templates/verification.md; main codepoint SKILL.md has /codepoint-verify registered.
- Cross-reference validation: ensure the verify skill's input sources match the actual output formats of S01 (test-plans/), S02 (index.json), and S03 (instrumentation/).
- Verify that the skill references all 5 point types and their metadata contracts from the instrument skill.

## Constraints

- Must follow the established SKILL.md format (YAML frontmatter with name/description/triggers).
- Must work on Windows — verification script uses PowerShell (.ps1), not bash (.sh).
- The verification template already exists at `templates/verification.md` — the verify skill must produce output matching its structure (Summary table, Normal/Boundary/Failure sections, Issues, Recommendations).
- The `verification/` directory is already listed in the main SKILL.md storage structure but no skill currently writes to it — S04 fills this gap.
- Must reference the V2 probe output format (JSON with point_id, flow_id, timestamp, stack, metadata) from data-model.md and frontend.md.
- Must not duplicate the implement skill's Phase 3 — instead, the implement skill's Verify phase should be a thin wrapper that invokes `/codepoint-verify` concepts.

## Common Pitfalls

- **Duplicating implement's Verify phase** — The implement skill already describes verification at a high level. The verify skill should go deeper (parsing actual log files, comparing against instrumentation plans) rather than repeating the same Red/Green/Verify cycle description.
- **Not handling the log file format** — Probe output files have a specific format (header comment lines + JSON entries). The verify skill must specify how to parse these files, handle the per-flow file routing (V2), and deal with missing or malformed entries.
- **Ignoring cross-flow points** — Points like `cp-auth-error` that are shared across multiple flows need special handling. The verify skill must check each flow's sequence independently while accounting for shared points.
- **Hardcoding log file paths** — The output directory uses the project module name (from go.mod/package.json), not the CWD. The verify skill must specify how to locate the log files.

## Open Risks

- The verification skill needs to parse structured markdown from instrumentation plans and test plans. The heading structure from S03's Step 5 output must be stable — if S03's format changes, S04 parsers would need updating. S03's SUMMARY flags this explicitly: "S04 should consume the output format from Step 5. If heading structure changes, S04 parsers will need updating."
- No actual probe log files exist to test against — verification will be structural only (same as S01-S03).
