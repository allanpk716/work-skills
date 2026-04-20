# Requirements: v2.0 前端自动化测试体系

**Milestone:** v2.0
**Status:** Active
**Created:** 2026-04-20

---

## Active Requirements

### Category 1: Test Specification (TSPEC)

- [ ] **TSPEC-01**: Developer can use a structured test plan template to plan frontend test flows with preconditions, steps, expected results, and codepoint flow mapping
- [ ] **TSPEC-02**: Developer can write test cases in a standardized click→response→verify format (action, expected UI state change, assertion on visible output)
- [ ] **TSPEC-03**: Developer can use pre-built probe code snippets for common frontend patterns (button click, form submit, API call, state change)

### Category 2: Instrumentation Guidance (INST)

- [ ] **INST-01**: Skill extends /codepoint-plan with frontend-specific probe placement guidance for testability (event handlers, data fetch hooks, state transitions)
- [ ] **INST-02**: Developer can plan instrumentation at the same time as feature design (instrumentation-first), not after implementation
- [ ] **INST-03**: Developer can reference curated probe placement patterns for React hooks, form handling, async data loading, error boundaries, and routing transitions

### Category 3: Verification Automation (VERF)

- [ ] **VERF-01**: Developer can verify probes fire correctly through lightweight acceptance (confirm probe activation, output format, firing order)
- [ ] **VERF-02**: Skill automatically maps each test case to the codepoint flow it exercises, enabling "which test cases cover this codepoint?" queries
- [ ] **VERF-03**: Developer can analyze test plan coverage density — identify flows with no test cases and flows with redundant tests

### Category 4: Skill UX (UX)

- [ ] **UX-01**: Developer can provide a feature spec or describe a feature, and the skill generates a structured test plan reading from .codepoints/index.json
- [ ] **UX-02**: Developer can plan test flows that span frontend→API→backend using cross_language_connections from index.json
- [ ] **UX-03**: Developer can run the same test plan template against Go+JS and Python+TS projects and get a comparison report showing coverage gaps

### Category 5: Codepoint Integration (CPT)

- [ ] **CPT-01**: Skill reads and parses .codepoints/ structure (index.json, flow definitions, point definitions) to correlate test cases with instrumented flows
- [ ] **CPT-02**: Test plan output aligns with collection structure (not individual features), matching the Codepoint V2.1 direction

---

## Future Requirements

- **AF-01**: Auto-generate Playwright test code from test plans (deferred — generate structured markdown, not executable code)
- **AF-02**: Browser automation within the skill (deferred — use probes as verification mechanism)
- **AF-03**: CI/CD pipeline integration (deferred — keep skill focused on planning and verification)
- **AF-04**: Visual regression testing (deferred — focus on behavioral verification)
- **AF-05**: Regression test suite generation from verified test plans (deferred — requires corpus of verified test plans)
- **AF-06**: Test framework lock-in (explicitly excluded — keep templates framework-agnostic)

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Full Playwright test code generation | Generate structured test case documents, not executable test files; Playwright has its own codegen tool |
| Browser automation / screenshot control | Probes capture runtime state without browser control; outside skill scope |
| CI/CD pipeline hooks | Infrastructure-level concern, not skill-level |
| Visual regression testing | Requires specialized tools (Percy, Chromatic); focus on behavioral verification |
| Replacing Codepoint V2 skills | New skill extends existing scan/plan/implement workflow as a peer |
| Test framework lock-in | Templates must be framework-agnostic; Playwright guidance is optional |

---

## Traceability

| REQ-ID | Phase | Plan | Status |
|--------|-------|------|--------|
| TSPEC-01 | Phase 41 | — | pending |
| TSPEC-02 | Phase 41 | — | pending |
| TSPEC-03 | Phase 41 | — | pending |
| INST-01 | Phase 43 | — | pending |
| INST-02 | Phase 43 | — | pending |
| INST-03 | Phase 43 | — | pending |
| VERF-01 | Phase 44 | — | pending |
| VERF-02 | Phase 44 | — | pending |
| VERF-03 | Phase 44 | — | pending |
| UX-01 | Phase 45 | — | pending |
| UX-02 | Phase 45 | — | pending |
| UX-03 | Phase 46 | — | pending |
| CPT-01 | Phase 42 | — | pending |
| CPT-02 | Phase 42 | — | pending |

---

*Last updated: 2026-04-20 — v2.0 requirements mapped to phases 41-46*
