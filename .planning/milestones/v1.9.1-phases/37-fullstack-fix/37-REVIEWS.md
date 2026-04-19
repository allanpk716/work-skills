---
phase: 37
reviewers: [opencode]
reviewed_at: 2026-04-19T00:00:00Z
plans_reviewed: [37-01-PLAN.md, 37-02-PLAN.md, 37-03-PLAN.md]
---

# Cross-AI Plan Review — Phase 37

## OpenCode Review (glm-5.1)

### Plan 37-01: Create 37-DEFECTS.yaml

#### Summary

This is a straightforward documentation plan that catalogs 8 defects (3 template-level, 5 test-project-level) discovered during Phases 35 and 36. The plan follows the established format from Phase 34's `34-DEFECTS.yaml`, and the defect list is well-cross-referenced with the bug discovery summaries from both phases. The categorization into template vs. test_project defects is a sound structural decision that guides later verification scope.

#### Strengths

- Clear severity classification (HIGH/MEDIUM/LOW) aligned with blast radius — template defects are higher severity since they affect all skill users
- Each defect includes `steps_to_reproduce`, `expected`, and `actual` fields — excellent for regression testing
- Reuses the proven YAML schema from Phase 34's defect file
- Dependencies are minimal (Wave 1, no prior plan dependency), enabling downstream plans to start quickly

#### Concerns

- **[MEDIUM] No root cause analysis field**: The defect schema lacks a `root_cause` or `why_missed` field. Since these defects were found in E2E testing after templates were supposedly validated in earlier phases, understanding *why* they escaped earlier review (e.g., "single-language testing doesn't exercise collector integration") would strengthen future prevention.
- **[LOW] Template defect scope may be incomplete**: The defect list captures 3 template defects, but the review should confirm that the Base Library sections in golang.md and python.md were thoroughly audited during Phases 35/36. The plans explicitly say "Do NOT change Base Library section" — if no one verified the base library, there could be latent issues.
- **[LOW] Missing `fix_commit` tracking**: Unlike `34-DEFECTS.yaml` which presumably tracks fix status post-hoc, there's no mechanism to link defects back to the specific template line changes or test commits that fix them.

#### Suggestions

- Add a `root_cause` field to each defect entry, even if brief (e.g., "Single-language E2E doesn't exercise cross-language collector paths")
- Add a `phase_discovered` or `discovered_in` field that references the specific test session or summary file
- Consider a `verification_method` field describing how each defect will be confirmed as fixed (links to Plan 37-03 tasks)

#### Risk Assessment: **LOW**

This is a documentation-only plan with no code changes. The main risk is completeness of the defect catalog, but the source material (Phase 35/36 summaries) is well-defined and already available.

---

### Plan 37-02: Update golang.md and python.md Templates

#### Summary

This plan updates the two skill reference templates to incorporate the proven enhanced implementations from the test projects. The scope is tightly bounded — only Frontend Collector sections are modified, with explicit "Do NOT change Base Library" constraints. The enhanced implementations already exist and are verified in `tmp/gojs-calculator/` and `tmp/pyts-calculator/`, making this primarily a backport operation.

#### Strengths

- **Evidence-based approach**: The template updates are not speculative — they're copied from working test project code that passed full E2E testing in Phases 35 and 36
- Explicit scoping constraint prevents accidental Base Library regressions
- The golang.md update addresses three independent concerns (mutex/safety, flow_id routing, Windows path fix) in a single coherent task
- The python.md update is minimal and backward-compatible (meta-presence check with fallback)

#### Concerns

- **[HIGH] Template code must be standalone and well-commented**: Unlike test project code (which has IDE navigation, imports, and test coverage), template reference code in markdown must be self-contained and educational. The plan says "replace with enhanced version" but doesn't specify whether explanatory comments, usage notes, or integration guidance will be added. Users of the skill will copy this code — if the enhanced collector is more complex (sync.Mutex, flow file maps), it needs proportionally better documentation.
- **[MEDIUM] No regression strategy for template updates**: The plan updates templates but has no mechanism to verify the templates *themselves* are correct after editing. Plan 37-03 verifies the test projects, but the test projects already have the enhanced code — they're not regenerated from the updated templates. There's a gap: who confirms the markdown templates produce working code when followed by a user?
- **[MEDIUM] golang.md SPA fallback fix is tangential**: DEV-FS-03 (path.Clean) is a web server issue, not a codepoint probe/collector issue. Including it in the collector template update mixes concerns. It's correct to fix it, but the plan should acknowledge this is a web framework concern, not a debugging instrumentation concern.
- **[LOW] python.md `receive()` backward compatibility not explicitly tested**: The plan says "when meta absent: write plain text (backward compatible)" but there's no explicit test that the plain-text path still works after the change.

#### Suggestions

- Add a sub-task: "Add inline comments to enhanced collector code in golang.md explaining sync.Mutex purpose, flow_id routing logic, and meta vs non-meta handling"
- Consider adding an integration note to golang.md's Frontend Collector section explaining how the enhanced collector coordinates with the base library's `PointWithMeta` function
- Plan 37-03 should include a spot-check: read the updated template files and confirm key code patterns (sync.Mutex, _json.dumps) are present — this is cheap insurance against copy-paste errors
- Split the SPA fallback fix into a separate task or at least a clearly delineated sub-section to keep the collector update focused

#### Risk Assessment: **MEDIUM**

The updates themselves are low-risk (copying proven code), but the gap between "template is updated" and "template produces working code when followed by a user" is not closed by these plans. A user could still encounter issues because no plan regenerates a project from the updated templates.

---

### Plan 37-03: Re-verify All Fixes

#### Summary

This verification plan runs the existing test suites for both fullstack projects and performs targeted code inspections to confirm all 8 defects are fixed. It's well-structured with specific grep-able verification targets (e.g., `getOrCreateTsFlowFile`, `_json.dumps(meta)`, `data.results || data`).

#### Strengths

- Targeted verification points map 1:1 to specific defect IDs — traceability is excellent
- Both compile-time checks (go build/vet, pytest) and code-level inspections are included
- Explicit test count expectations (24 Go tests, 38 Python unit tests, 8 integration tests) provide clear pass/fail criteria
- The `collect-only` approach for integration tests is pragmatic for environments where full browser testing is flaky

#### Concerns

- **[HIGH] Verification confirms test projects, not template fixes**: The most critical gap in this plan. Plan 37-02 updates templates, but Plan 37-03 verifies the *test projects* that were already fixed in Phases 35/36. The test projects are not regenerated from the updated templates. This means Plan 37-03 confirms Phase 35/36 fixes are still in place (valuable) but does **not** confirm Plan 37-02's template edits are correct.
- **[MEDIUM] Integration tests are collected but not run**: The plan says "Collect-only 8 integration tests (4 linkage + 4 toggle)" — this lists them without running. If integration tests are flaky on the current environment, the plan should document why they're excluded and what the acceptance criteria are instead.
- **[MEDIUM] No Windows-specific verification**: DEV-FS-03 and DEV-FS-07 are Windows-specific defects. The plan runs `go vet` and `pytest` but doesn't explicitly verify Windows behavior (e.g., path separators in generated log files, process cleanup). Since the dev environment is Windows, at minimum a spot-check for path.Clean output would be valuable.
- **[LOW] Toggle test (DEV-FS-08) verification is implicit**: The plan mentions "verify toggle restoration" but the actual fix in pyts-calculator's conftest.py restores toggle state. The verification should confirm the toggle file exists and has the expected state after tests complete.

#### Suggestions

- **Critical**: Add a Task 3 that reads the updated golang.md and python.md template files and confirms the key code patterns are present (sync.Mutex, getOrCreateTsFlowFile, `_json.dumps`, `path.Clean`). This is a lightweight check that closes the verification gap.
- For integration tests, either run them with a timeout and accept partial results, or document the specific environment constraint that prevents running them and what manual verification was done instead
- Add explicit Windows-specific checks: verify log file paths use forward slashes, verify no `filepath.Clean` remains in golang.md's SPA section
- Add a final summary task that cross-references each defect ID (DEV-FS-01 through DEV-FS-08) with its verification result

#### Risk Assessment: **MEDIUM**

The verification is solid for confirming test project fixes but has a significant blind spot: it doesn't verify the template updates from Plan 37-02. Given that the phase's success criteria include "frontend probe templates generate code that runs in the browser and correctly integrates," this is a meaningful gap.

---

### Overall Phase Assessment

#### Dependency Graph

```
37-01 (DEFECTS.yaml) ──┬──> 37-02 (Update templates)
                        └──> 37-03 (Re-verify fixes)
```

Plans 37-02 and 37-03 can run in parallel (both Wave 2, both depend only on 37-01), which is efficient.

#### Key Risk: Template-to-User Gap

The most significant structural concern across all three plans is that **no plan regenerates a project from the updated templates and verifies it works**. The workflow is:

1. Defects found in test projects (Phases 35/36) ✅
2. Defects recorded (Plan 37-01) ✅
3. Templates updated to match proven implementations (Plan 37-02) ⚠️
4. Test projects re-verified (Plan 37-03) ✅
5. Updated templates used to generate a fresh project and verified ❌ (missing step)

Step 5 is the true "close the loop" verification for FIX2-03. Without it, there's an assumption that copying code from working test projects into markdown templates produces equivalently working results — which is not guaranteed (markdown formatting issues, missing imports, unclear context boundaries, etc.).

#### Recommendation

**Overall Risk: MEDIUM**

The plans are well-structured and the defect catalog is comprehensive. The main gap is a missing "template smoke test" — a lightweight verification that reads the updated templates and confirms key patterns are present. Adding this as a sub-task in Plan 37-03 would close the loop without significant additional effort.

**Minimum viable improvement**: Add a verification step in Plan 37-03 that grep-checks the updated golang.md and python.md for the key code patterns (`sync.Mutex`, `_json.dumps`, `path.Clean`). This is cheap, fast, and directly addresses FIX2-03.

---

## Consensus Summary

### Agreed Strengths
- Clear defect categorization (template vs test_project) with severity alignment
- Evidence-based template updates from proven implementations
- Excellent traceability with defect-to-verification mapping
- Efficient parallel Wave 2 execution for Plans 37-02 and 37-03

### Agreed Concerns
1. **Template verification gap [HIGH]**: Plan 37-03 verifies test projects but not the updated templates themselves. Adding grep-based pattern checks in golang.md/python.md would close this gap cheaply.
2. **Integration tests not run [MEDIUM]**: 8 integration tests are collected but not executed, leaving cross-language linkage unverified at runtime.
3. **No root cause analysis [MEDIUM]**: Defect records lack `root_cause`/`why_missed` fields, limiting future prevention value.

### Divergent Views
No significant disagreements — single reviewer with thorough analysis.
