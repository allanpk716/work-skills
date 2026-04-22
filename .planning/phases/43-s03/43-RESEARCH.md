# S03: Instrumentation First Planning — Research

**Date:** 2026-04-20

## Summary

S03 creates the "instrumentation first planning" capability for the codepoint system — the bridge between the data model (S02's index.json schema) and downstream skills (test-plan, implement). Currently, the codepoint system has four skills: `scan`, `plan`, `test-plan`, and `implement`. There's a gap: no skill generates a structured **instrumentation plan** from an existing index.json that prioritizes probe placement, defines per-probe metadata contracts, and maps test scenarios to probes before any code is written.

The "instrumentation first" methodology means planning probes (what, where, why, what metadata) BEFORE writing test plans or implementation code. The deliverable is a new skill (`codepoint-instrument`) or an enhancement to the existing `plan` skill that reads index.json and produces a structured instrumentation plan. Given the existing skill structure, the cleanest approach is creating a new skill file `plugins/codepoint/skills/instrument/SKILL.md` — following the established pattern of one-skill-per-file.

Verification will be structural: the SKILL.md exists, follows the established frontmatter/schema format, references the index.json schema documented in the main codepoint SKILL.md, and a verification script confirms structural integrity (same 33-check pattern from S02's tmp/verify-s02.sh).

## Recommendation

Create a new `codepoint-instrument` skill (`plugins/codepoint/skills/instrument/SKILL.md`) that reads `.codepoints/index.json` and produces a structured instrumentation plan. This skill:
1. Reads index.json and identifies all enabled points grouped by flow
2. Prioritizes probes: entry points first, then boundaries, then state-change, then concurrency, then error
3. Defines per-probe metadata contracts (what additional data each probe type should capture)
4. Maps test scenarios from flow.test_cases to specific probes
5. Outputs a markdown instrumentation plan document to `.codepoints/instrumentation/`
6. Updates the main codepoint SKILL.md to register the new skill

This approach reuses the established patterns from S01 and S02 (frontmatter, step-based workflow, template output, verification script) and keeps the instrument skill as a standalone unit that downstream skills (test-plan, implement) can consume.

## Implementation Landscape

### Key Files

- `plugins/codepoint/templates/index.json` — The concrete data contract with 1 collection, 2 flows, 9 codepoints. S03 reads this to generate instrumentation plans. The skill must handle all point types (entry, boundary, state-change, concurrency, error) and respect the `enabled` field.
- `plugins/codepoint/skills/codepoint/SKILL.md` — Main skill registry with command table, storage structure, and index.json schema reference. Must be updated to add `/codepoint-instrument` command and `instrumentation/` directory to storage diagram.
- `plugins/codepoint/skills/plan/SKILL.md` — Existing plan skill for new features. S03's instrument skill is complementary: `plan` is for greenfield (no index.json yet), `instrument` is for existing data models (index.json already populated from scan or manual entry).
- `plugins/codepoint/references/data-model.md` — Defines point types, probe output format, density validation rules. S03's instrumentation plan must reference these types and density rules.
- `plugins/codepoint/references/frontend.md` — V2 probe template patterns (`pointWithMeta` with point_id/flow_id). S03 should reference these patterns when defining per-probe metadata contracts.
- `plugins/codepoint/templates/point.md` — Point document template. S03 may generate point-specific instrumentation documents following this template.
- `plugins/codepoint/templates/flow.md` — Flow document template. S03 should reference flow sequence ordering when prioritizing probes.

### Build Order

1. **Create `plugins/codepoint/skills/instrument/SKILL.md`** — The core deliverable. Define the 6-step workflow: (1) load index.json, (2) analyze point coverage by flow, (3) prioritize probes by type and flow position, (4) define per-probe metadata contracts, (5) generate instrumentation plan document, (6) user review.
2. **Update `plugins/codepoint/skills/codepoint/SKILL.md`** — Register `/codepoint-instrument` in the command table, add trigger keywords, add `instrumentation/` to storage structure.
3. **Create `tmp/verify-s03.sh`** — Structural verification script (same pattern as S02's verify-s02.sh) confirming SKILL.md exists, has correct frontmatter, references index.json schema, and main codepoint SKILL.md is updated.

### Verification Approach

- Structural verification script (tmp/verify-s03.sh) checking: instrument/SKILL.md exists with proper frontmatter, 6-step workflow present, index.json references, metadata contract definitions, probe type prioritization, and main codepoint SKILL.md registration.
- Cross-reference check: ensure the skill's output format is compatible with downstream test-plan and implement skills.
- Follow S02's 33-check pattern adapted for this slice's deliverables.

## Constraints

- Must follow the established SKILL.md format (frontmatter with name/description/triggers, markdown body with step-based workflow).
- Must reference the index.json schema documented in the main codepoint SKILL.md — no hardcoding field names, use the canonical schema reference.
- Must work with the existing probe patterns from references/frontend.md, golang.md, python.md — no new probe API calls.
- Storage output must go into `.codepoints/instrumentation/` following the existing storage convention.
- The plan skill (`plan/SKILL.md`) is for new features without index.json; the instrument skill is for existing data models. They should not overlap.

## Common Pitfalls

- **Confusing instrument with plan** — The `plan` skill creates code points from a feature spec (top-down, spec → points). The `instrument` skill creates an instrumentation plan from existing code points (bottom-up, points → instrumentation strategy). Keep them distinct.
- **Not referencing the index.json schema** — The skill must read from `.codepoints/index.json` using the schema documented in the main codepoint SKILL.md. Don't duplicate field definitions.
- **Metadata contract vagueness** — Each point type (entry, boundary, state-change, concurrency, error) should have specific metadata fields recommended. Vague "add context" instructions aren't actionable for downstream implement skill.

## Open Risks

- The instrumentation plan output format needs to be compatible with S04 (Verification Automation). Since S04 hasn't been built yet, we need to design the output to be machine-parseable (structured markdown with predictable headings) so S04 can consume it.
- No existing examples of `.codepoints/instrumentation/` directory — the storage convention is new and needs to be consistent with the existing `.codepoints/` structure.
