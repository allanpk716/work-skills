# M012-S06 Research: Progressive Validation

## Summary

S06 delivers a `/codepoint-validate` sub-skill that performs **progressive artifact validation** across all pipeline stages. Unlike `/codepoint-verify` (which requires actual runtime probe logs and does deep validation against instrumentation/test plans), this new skill performs **static artifact consistency validation** — it reads all `.codepoints/` artifacts and validates cross-stage integrity without needing to run any code or have probe logs. This fills the gap identified in S05: "Runtime validation of the full 6-stage pipeline is deferred to S06 Progressive Validation."

The work follows the exact same pattern established by S01–S05: create a SKILL.md sub-skill following the established frontmatter conventions, register it in the main codepoint/SKILL.md, and produce a PowerShell structural verification script. No new technology, no unfamiliar APIs — this is straightforward application of the codepoint sub-skill pattern with clear scope from the upstream assessment artifacts.

## Recommendation

Create `/codepoint-validate` as a new sub-skill that performs 5 progressive validation passes, one per pipeline stage boundary. Each pass reads the stage's output artifacts and validates them against the schema and cross-reference rules defined in the data model. The skill should be callable at any point in the pipeline (not just at the end), making it useful for catching issues early. Follow the established SKILL.md pattern exactly — YAML frontmatter with name/description/triggers, structured workflow steps, artifact references, and error handling guidance.

## Implementation Landscape

### Key Files

- `plugins/codepoint/skills/validate/SKILL.md` — **new file**. The progressive validation sub-skill with 5 validation passes (index integrity, instrumentation consistency, test-plan consistency, implementation completeness, verification status).
- `plugins/codepoint/skills/codepoint/SKILL.md` — **modify**. Add `/codepoint-validate` to the Commands table, add trigger phrases to frontmatter, add validation guidance to Quick Start sections, update storage structure if needed.
- `tmp/verify-s06.ps1` — **new file**. Structural verification script following the established Check function pattern from verify-s03/04/05.ps1.
- `plugins/codepoint/references/data-model.md` — **read only**. Reference for index.json schema, cross-reference integrity rules, and V2 probe format.
- `plugins/codepoint/skills/run/SKILL.md` — **read only**. Reference for pipeline stage definitions, artifact paths, and resumption logic. The validate skill should complement run's resumption checks.

### Validation Passes (5 stages)

**Pass 1: Index Integrity** — Validate `.codepoints/index.json`:
- Schema compliance: required fields on collections, flows, points
- Cross-reference integrity: flow.collection_id → collections[].id, flow.sequence → points[].id, point.used_in_flows → flows[].id
- Sequence coherence: each flow has at least one entry-type point
- Type distribution: flag flows missing error/entry points

**Pass 2: Instrumentation Consistency** — Validate `.codepoints/instrumentation/{flow-id}-instrumentation.md`:
- Every flow in index.json has a corresponding instrumentation plan
- Probe Table references valid point IDs from index.json
- Metadata fields match point type contracts (entry → request_method/request_path, boundary → upstream_module/downstream_module/call_duration_ms/response_status, etc.)
- Test Scenario Mapping references valid probe IDs

**Pass 3: Test Plan Consistency** — Validate `.codepoints/test-plans/{flow-id}-test-plan.md`:
- Every flow in index.json has a corresponding test plan
- Coverage Matrix references valid point IDs
- Test case definitions reference valid point IDs and probe snippets (D-01 through D-10)
- At least one normal, one boundary, and one failure test case per flow

**Pass 4: Implementation Completeness** — Validate probe implementation status:
- Points marked `enabled: true` in index.json match what's described in instrumentation plans
- Implemented point locations reference files that exist in the project
- At least one test case exists for each implemented point

**Pass 5: Verification Status** — Validate verification reports:
- Verified flows have corresponding verification reports in `.codepoints/verification/`
- Flow status transitions follow the correct order: active → implemented → verified
- Verification reports reference the correct flow IDs

### Build Order

1. **Create validate/SKILL.md first** — This is the core deliverable. Follow the exact pattern from verify/SKILL.md (7-step workflow structure, detailed procedural content, Windows compatibility notes).
2. **Update main codepoint/SKILL.md** — Register the new command and triggers. Simple wiring, no design decisions.
3. **Create tmp/verify-s06.ps1** — Structural verification of the validate skill itself. Follow verify-s05.ps1 pattern exactly.

### Verification Approach

- Run `powershell -File tmp/verify-s06.ps1` — all checks must pass (following established pattern of 12-15 structural checks)
- Manual review: confirm validate/SKILL.md follows the same structure and conventions as all other sub-skills
- Verify main codepoint/SKILL.md has the new command entry, triggers, and storage structure reference

## Constraints

- SKILL.md format must match established conventions exactly (YAML frontmatter, markdown sections, no executable code)
- The validate skill is a prompt for Claude Code — it describes *what to do*, not *how to do it programmatically*
- Must reference existing file paths and naming conventions (`.codepoints/`, `index.json`, `instrumentation/`, `test-plans/`, `verification/`)
- Windows-compatible — no bash-specific syntax in examples
- Must not duplicate `/codepoint-verify` scope — validate checks artifact consistency (static), verify checks runtime probe output (dynamic)

## Common Pitfalls

- **Duplicating verify scope** — The validate skill checks artifact schema and cross-references (static). Verify checks actual runtime probe logs against plans (dynamic). Keep these separate.
- **Over-specifying validation logic** — SKILL.md is a prompt guide, not executable code. Describe validation steps as instructions for Claude Code to follow, not as algorithms.
- **Missing trigger phrases** — All previous skills include Chinese trigger phrases. Include `验证一致性`, `代码点校验`, `artifact validation` or similar.
- **Forgetting to update main SKILL.md** — Every sub-skill since S03 has registered in the main codepoint/SKILL.md. This is part of the established pattern.

## Open Risks

- None — this is a well-defined skill creation task following established patterns. The scope, format, and validation approach are all clearly defined by the upstream artifacts and existing code.
