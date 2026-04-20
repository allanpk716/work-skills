---
phase: 41
reviewers: [opencode]
reviewed_at: 2026-04-20T12:00:00Z
plans_reviewed: [41-01-PLAN.md, 41-02-PLAN.md]
---

# Cross-AI Plan Review — Phase 41

## OpenCode Review

### Plan 41-01: Create test-plan SKILL.md and test-probes.md reference

**Summary:**
Plan 41-01 creates two new files following established plugin conventions. The SKILL.md structure mirrors existing sub-skills (scan/plan/implement), and the test-probes.md reference file follows the same pattern as frontend.md/golang.md/python.md. The plan is well-scoped and aligns with all 10 locked decisions. However, there are gaps in the test case format specification and probe snippet completeness that need attention.

**Strengths:**
- Convention alignment: Follows the exact frontmatter format, workflow structure, and output conventions of existing sub-skills
- Decision coverage: All 10 decisions (D-01 through D-10) are explicitly addressed
- Practical probe patterns: The 4 categories cover the most common frontend testing scenarios, with basic + error variants
- Correct API usage: Uses `pointWithMeta` with `point_id` and `flow_id` consistent with V2 format
- Clean integration: References existing sub-skills for a cohesive workflow

**Concerns:**
- **[MEDIUM] Missing test case edge case categories**: The plan says "normal/boundary/failure" for test case generation but doesn't specify how these map to the Action -> Expected Response -> Verify format. A "boundary" case for a button click — what's the expected response? The template example should demonstrate all three variants explicitly.
- **[MEDIUM] Probe snippets lack context metadata**: The plan specifies only `point_id` and `flow_id` in metadata. For realistic testing, probes should capture enough context to verify the test assertion (e.g., form data, validation state, status code).
- **[LOW] No template file in templates/ directory**: Existing pattern has template files in `templates/`. This plan embeds the template in SKILL.md rather than creating a standalone template file, breaking the established separation.
- **[LOW] Unclear test-probes.md relationship to frontend.md**: Doesn't clarify what happens if a developer needs a pattern not covered by the 4 base categories.
- **[LOW] Missing `test_cases` structure alignment**: data-model.md already defines `test_cases` with normal/boundary/failure on Flow entities. The test plan template should explicitly reference or extend this existing structure.

**Suggestions:**
- Include domain-specific metadata in probe snippets (button_id, form_data, status_code, previous_state)
- Add the template as a standalone file in `plugins/codepoint/templates/test-plan.md`
- Show all three test case variants (normal, boundary, failure) in the output template example
- Define a clear fallback strategy for patterns not covered by 4 base categories
- Link to data-model.md test_cases to avoid data duplication

**Risk Assessment: LOW**

### Plan 41-02: Register test-plan skill in main SKILL.md command table

**Summary:**
Plan 41-02 is a straightforward modification to the main codepoint SKILL.md — adding the fourth sub-skill to the command table, Quick Start section, and storage structure. The task is well-defined with clear acceptance criteria.

**Strengths:**
- Explicit preservation constraint: "Do NOT modify other sections" prevents scope creep
- Detailed acceptance criteria: Each change point has a verifiable criterion
- Correct dependency ordering: Wave 2 correctly depends on 41-01
- Consistent terminology: Uses bilingual keywords matching existing skills

**Concerns:**
- **[LOW] Storage structure insertion point ambiguity**: First time `test-plans/` appears — ensure insertion doesn't accidentally reorganize other directories
- **[LOW] Missing frontmatter trigger keyword pattern**: Should include more trigger variants like `"test plan"`, `"test specification"`, `"测试规划"` for consistency

**Suggestions:**
- Add complete trigger keywords in both languages (4-5 each)
- Consider whether plugin.json description should also be updated

**Risk Assessment: LOW**

---

## Consensus Summary

### Agreed Strengths
- Both plans are well-scoped with clean separation (new files first, registration second)
- Strong convention alignment with existing codepoint sub-skills
- All 10 locked decisions (D-01 through D-10) are addressed
- Acceptance criteria are specific and verifiable
- Overall phase risk is LOW

### Agreed Concerns
1. **[MEDIUM] Probe snippet metadata too minimal** — only `point_id`/`flow_id` in snippets; real testing needs domain context (form_data, status_code, etc.)
2. **[MEDIUM] Test case variant demonstration gap** — output template should show all three variants (normal/boundary/failure) explicitly
3. **[LOW] Template file separation** — standalone template file in `templates/` would match existing convention better than embedding in SKILL.md
4. **[LOW] Fallback strategy for uncovered patterns** — developers may need patterns beyond the 4 base categories

### Divergent Views
- No divergent views (single reviewer). For more robust consensus, consider re-running with additional reviewers when available.

---

*Reviewed by OpenCode on 2026-04-20*
