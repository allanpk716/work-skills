---
phase: 32
reviewers: [opencode]
reviewed_at: 2026-04-18T15:40:00+08:00
plans_reviewed: [32-01-PLAN.md, 32-02-PLAN.md, 32-03-PLAN.md, 32-04-PLAN.md, 32-05-PLAN.md]
---

# Cross-AI Plan Review — Phase 32

## OpenCode Review

### Plan 32-01: Create Go Calculator Project

**Summary:** Well-structured plan with ideal architecture for testing codepoint V2 (3 flows sharing a pipeline). However, the history flow may not exercise the full shared pipeline, and the shared path boundary contract is under-specified.

**Strengths:**
- Architecture choice is ideal for testing codepoint V2: parse → validate → compute → format with 3 consumers
- Standard library only eliminates dependency management as failure mode
- Two-task split (skeleton + business flows) is logical
- Clear binary pass/fail verification criteria

**Concerns:**
- [MEDIUM] No specification of the shared path boundary contract — if only `Evaluate()` is exported, probe placement granularity is limited
- [MEDIUM] History query flow may not exercise the full shared pipeline — it likely does map lookup only, not re-computation
- [LOW] No specification of error path coverage for error-type probes
- [LOW] Missing explicit mention of `codepoint/` directory creation

**Suggestions:**
- Redefine history flow to re-compute results through shared pipeline
- Specify the exported API surface of `internal/calculator/`
- Add at least 2 error scenarios (division by zero, invalid syntax)
- Make Task 1 explicitly include copying codepoint.go

**Risk Assessment: MEDIUM**

---

### Plan 32-02: Run codepoint scan and verify business flow identification

**Summary:** Plan correctly follows scan's two-phase workflow but is overly optimistic about AI-driven scan producing deterministic output. Lacks fallback steps for incorrect scan results.

**Strengths:**
- Follows the established scan Phase 1/Phase 2 workflow
- Checks the right output structure (index.json, collections/, flows/, points/)
- Verifies shared code point cross-referencing
- Includes human verification checkpoint

**Concerns:**
- [HIGH] Scan is AI-driven, non-deterministic — no fallback if scan output is wrong
- [MEDIUM] No acceptance criteria thresholds for partial correctness
- [MEDIUM] Assumed naming conventions may not match scan output
- [LOW] No mention of density validation as part of scan quality

**Suggestions:**
- Add a "scan correction" step for manual adjustment
- Use structural verification instead of exact name matching
- Include density validation as explicit check
- Define minimum viable scan output gating Plan 32-03

**Risk Assessment: HIGH**

---

### Plan 32-03: Run codepoint plan and verify probe planning quality

**Summary:** Tests plan skill with a scientific calculator extension, but the planned probes can never be verified — Plan 32-04 implements scan-derived probes, not plan-derived ones. This makes Plan 32-03's output orphaned.

**Strengths:**
- Tests a different codepoint V2 entry path (plan vs scan)
- Good verification criteria list (types, positions, reuse, density)
- Scientific functions are a natural extension choice

**Concerns:**
- [HIGH] Planned probes cannot be verified — scientific functions are never implemented, so Plan 32-03 output is never consumed by Plan 32-04
- [MEDIUM] Scope confusion — plan skill is for pre-implementation, running on non-existent feature tests format not utility
- [LOW] No specification of expected plan output structure

**Suggestions:**
- Either implement scientific function stubs or change approach to re-plan existing flows
- If keeping as dry run, explicitly mark it as format/reasoning quality test
- Define concrete quality metrics ("at least 1 entry probe per handler")

**Risk Assessment: HIGH**

---

### Plan 32-04: Run codepoint implement and verify probe compilation and TDD loop

**Summary:** Most technically sound plan in the phase. Correctly follows TDD loop and pragmatic about probe placement. Main concern is upstream dependency risk and flow_id propagation gap.

**Strengths:**
- Correctly follows implement skill's 3-phase TDD process
- Approach A (wrapper) preserves existing API, minimizes invasiveness
- Additive-only verification explicitly checked
- Comprehensive verification checks (build, tests, probe quality, reports)
- Correct probe locations for multi-flow differentiation

**Concerns:**
- [HIGH] Depends on Plans 32-02/32-03 being correct — no upstream validation
- [MEDIUM] Approach A may lose granular stack differentiation within shared path
- [MEDIUM] No specification of how flow_id reaches the wrapper (context? parameter? goroutine-local?)
- [LOW] Toggle file path assumption not validated

**Suggestions:**
- Add pre-flight validation of .codepoints/index.json before implement
- Consider hybrid approach: wrapper for flow identification + lightweight probes in shared functions
- Specify flow_id propagation mechanism (recommend Go context.Context)
- Add toggle state management (disabled during 32-01, enabled for 32-04)

**Risk Assessment: MEDIUM**

---

### Plan 32-05: Multi-flow run verification of stack differences

**Summary:** Critical validation plan proving the entire codepoint V2 system. Good test design but may not work with wrapper-only approach. Integration test complexity adds reliability risk.

**Strengths:**
- Directly addresses SING-05 core requirement
- Three complementary test types (stack, density, metadata)
- Stack trace source checking is well-designed
- Both manual + automated verification

**Concerns:**
- [HIGH] Stack differentiation may not work with Approach A — all stacks show same Evaluate() call frame
- [HIGH] Log file parsing is fragile — no test-specific output directory, format may change
- [MEDIUM] Integration test design is complex — no test isolation strategy
- [MEDIUM] No expected probe density range specified
- [LOW] Missing cleanup step for test artifacts

**Suggestions:**
- Use test-specific codepoint output directory to avoid polluting ~/.codepoint/
- Define expected density ranges for this specific project
- Add test isolation (random ports, temp directories)
- Clarify macro vs micro differentiation requirements
- Add cleanup in TestMain or t.Cleanup()

**Risk Assessment: HIGH**

---

## Consensus Summary

### Agreed Strengths (cross-plan)
1. **Architecture design is sound** — 3 flows sharing parse→validate→compute→format pipeline is the ideal test case for codepoint V2's flow differentiation
2. **TDD loop correctly implemented** — Plan 32-04 accurately mirrors the implement skill's Red→Green→Verify workflow
3. **Human verification checkpoints** — Every plan includes a human review gate, providing necessary manual quality control
4. **Standard library only** — Eliminates dependency issues, keeps focus on codepoint verification

### Agreed Concerns (highest priority)

1. **[HIGH] Plan 32-03 output is orphaned** — Scientific function probes are planned but never implemented. Plan 32-04 consumes scan output, not plan output. This wastes SING-03 verification effort and is the biggest structural issue.

2. **[HIGH] History flow likely doesn't exercise shared pipeline** — History queries that just retrieve stored results skip parse→validate→compute→format. The plan specifies recomputation in HandleHistoryGet (calling `calculator.Evaluate(record.Expression)`), but this detail is buried and may be overlooked during execution.

3. **[HIGH] Scan non-determinism not handled** — `/codepoint:scan` is AI-driven and may produce unexpected results. No correction procedure or minimum viable output threshold is defined.

4. **[MEDIUM] flow_id propagation mechanism unspecified** — Approach A (wrapper) requires flow_id to reach `Evaluate()`, but no mechanism is specified. Context passing is the idiomatic Go solution but not documented.

5. **[MEDIUM] Wrapper-only approach may lose stack granularity** — Probes only in `Evaluate()` show the same shared path frames for all flows. Differentiation is only at the caller layer above.

### Divergent Views
- Plan 32-03's "dry run" approach: reviewer considers it wasteful since output is orphaned. Alternative view: it still validates the plan skill's output format and reasoning quality, which has independent value for SING-03 verification even if probes aren't implemented.

### Top 3 Actions Before Execution
1. **Resolve Plan 32-03's role**: Either implement scientific function stubs so probes can be verified, or restructure to test plan skill against existing code
2. **Ensure history flow recomputes**: Make `HandleHistoryGet`'s recomputation through shared pipeline explicit and verified in acceptance criteria
3. **Add scan correction procedure**: Define what happens when scan output doesn't match expectations (manual adjustment steps, minimum viable output)

---

*Review conducted by: OpenCode (GitHub Copilot)*
*Review date: 2026-04-18*
