# S02: Codepoint Data Integration — Research

**Date:** 2026-04-20

## Summary

S02 defines the concrete `index.json` data schema that all codepoint skills consume and produce. Currently the codepoint plugin has a conceptual 3-layer data model (CodePoint → Flow → Collection) in `references/data-model.md`, but the actual `index.json` template is an empty skeleton with `collections: []`, `flows: []`, `points: []` — no field definitions for what each array entry contains. Meanwhile, 4 of the 5 skills reference `index.json` for reading or writing: `/codepoint-scan` writes it, `/codepoint-plan` reads it, `/codepoint-test-plan` reads it (to discover flows), and `/codepoint-implement` reads and updates it. This disconnect means no skill has a contract for what the JSON structure actually looks like.

The work is **targeted** — we need to define a concrete JSON schema that maps the data-model.md conceptual model into actual JSON field definitions, update the `index.json` template, and write unit tests that prove the schema is complete and consistent. The tests should validate that a sample `index.json` can be correctly parsed by downstream skills and that all the cross-references (flow→points, collection→flows) work. This is a documentation + test slice, following the same pattern as S01 (which was also documentation-only with structural verification).

## Recommendation

Define a concrete `index.json` schema based on the fields already described in `references/data-model.md`, update the template, and write validation tests that prove schema completeness. The schema should capture:

**For each collection:** `id`, `name`, `description`, `created`
**For each flow:** `id`, `name`, `collection_id`, `trigger`, `sequence` (ordered point_ids), `test_cases` (normal/boundary/failure outlines), `status`
**For each point:** `id`, `name`, `type` (entry|boundary|state-change|concurrency|error), `location` (file:line), `language`, `description`, `enabled`, `used_in_flows`

Tests should validate:
1. A populated sample `index.json` conforms to the schema
2. Cross-reference integrity (every `sequence` entry references a valid point_id, every `collection_id` references a valid collection)
3. The schema supports all skill workflows (scan can write, plan can read+extend, test-plan can discover flows, implement can mark points as enabled)

## Implementation Landscape

### Key Files

- `plugins/codepoint/references/data-model.md` — Source of truth for the conceptual model; fields defined here must map 1:1 into the JSON schema
- `plugins/codepoint/templates/index.json` — Currently an empty skeleton; needs to be updated with concrete field definitions and example entries
- `plugins/codepoint/skills/codepoint/SKILL.md` — Main skill doc; references `index.json` as "AI fast query and filtering" — may need a schema reference section
- `plugins/codepoint/skills/scan/SKILL.md` — Phase 2 Step 5 says "Create index.json with all collections, flows, and points" — needs to know the exact field layout
- `plugins/codepoint/skills/plan/SKILL.md` — Step 4 says "Read index.json (if exists)" — needs to know what fields to expect
- `plugins/codepoint/skills/test-plan/SKILL.md` — Step 1 says "Read index.json to discover available flows" — needs to know how to enumerate flows and their point sequences
- `plugins/codepoint/skills/implement/SKILL.md` — Phase 1 reads index.json for "pending (unimplemented) code points", Phase 2 Step 4 updates it marking points `enabled: true`
- `plugins/codepoint/templates/collection.md`, `flow.md`, `point.md`, `verification.md` — Markdown templates for `.codepoints/` directory; their fields should align with the JSON schema

### Build Order

1. **Define the JSON schema** — Extract all fields from `data-model.md` into a concrete schema definition. Add example entries to the `index.json` template showing what populated data looks like
2. **Write schema validation tests** — Create a test file that validates: schema completeness (all data-model fields are covered), cross-reference integrity (flow sequences reference valid points, collection_ids reference valid collections), and skill workflow compatibility (all 4 consuming skills can extract the data they need)
3. **Add schema reference to main SKILL.md** — Include a brief section pointing to the schema so the AI knows the exact field layout when executing skills

### Verification Approach

1. Structural check: `templates/index.json` contains non-empty arrays with example entries
2. Field coverage: every field in `data-model.md` has a corresponding JSON field in the schema
3. Cross-reference validation: a test that creates a sample index.json with 2 collections, 3 flows, 6 points and validates all foreign keys resolve correctly
4. Skill compatibility: verify each skill's documented workflow can extract the data it needs from the schema (scan writes, plan reads, test-plan discovers flows, implement marks enabled)

## Constraints

- This is a **Claude Code plugin** — tests must be structural (grep, file existence, JSON validation), not runtime execution. There is no Node.js test runner or test framework set up for this plugin. S01 established the pattern: verification is done via grep/file checks, not npm test
- The JSON schema must stay human-readable since Claude Code reads it directly as a reference document
- Must be backward-compatible with the existing `data-model.md` conceptual model — no field renaming or restructuring that would invalidate the references

## Common Pitfalls

- **Over-engineering the schema** — The index.json is a reference file for Claude Code, not a runtime API. Don't add validation keywords, `$schema`, or JSON Schema draft-07 metadata. Keep it simple and readable
- **Inconsistency between markdown templates and JSON** — The fields in `templates/flow.md` (trigger, sequence, test_cases) and `templates/point.md` (id, type, location, language) must exactly match what's in the JSON schema
- **Forgetting the `enabled` field** — `data-model.md` defines `enabled: true/false` on CodePoint, and `/codepoint-implement` specifically marks points as `enabled: true`. This is a required field, not optional

## Open Risks

- None. This is a well-defined documentation task following established patterns from S01.
