# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.3 — 智能配置检测

**Shipped:** 2026-03-29
**Phases:** 2 | **Plans:** 3 | **Sessions:** 2

### What Was Built
- Dual-source Pushover credential detection (process.env + Windows registry fallback)
- Per-item Confirm interaction for both Pushover and Git user configurators (4-case handling)
- Unified install flow: fresh install and re-run auto-adapt with zero detection overhead
- 14 integration tests covering all UFLOW scenarios with detection-level testing strategy

### What Worked
- Focused scope (2 phases) delivered quickly — 2 days from requirements to shipped
- Detection-level testing strategy avoided the complexity of mocking interactive enquirer prompts
- Per-item Confirm pattern (4-case: both/only token/only user/neither) proved reusable across configurators
- GSD audit caught all gaps before milestone completion (7/7 requirements, 12/12 integration)

### What Was Inefficient
- Phase 20 started then paused at WIP stage, requiring a session restart to complete
- Test helper needed async fix (Promise.all) — latent issue from earlier phases that surfaced here
- npm test (Jest) doesn't run configurator tests (pre-existing) — self-executing scripts workaround

### Patterns Established
- Dual-source detection: process.env priority + registry fallback for setx-persisted values
- Per-item Confirm: initial:true default keep, fall-through to full input on decline
- Detection-level integration tests: test detect*() functions + orchestration structure, not interactive prompts
- Unified save block: single persistence point after all cases determine final values

### Key Lessons
1. Small milestones (2-3 phases) ship faster and are easier to audit — keep scope tight
2. Testing interactive CLI flows at the detection/orchestration level is more reliable than mocking prompts
3. GSD milestone audit before completion catches integration gaps early (12/12 exports verified)

### Cost Observations
- Model mix: ~70% sonnet, ~30% opus
- Sessions: 2
- Notable: v1.3 was the fastest milestone — 2 days, 2 phases, demonstrating the value of tight scope

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.2 | 8 | 7 | NPX installer foundation, full TDD workflow |
| v1.3 | 2 | 2 | Tight scope, fast delivery, audit-first |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.2 | 128+ | Full | 0 new deps |
| v1.3 | 163+ | Full | 0 new deps |

### Top Lessons (Verified Across Milestones)

1. CJS + zero new dependencies keeps the installer lightweight and compatible
2. Bilingual support (en + zh) should be added alongside features, not retrofitted
3. Detection-level testing is the right abstraction for interactive CLI features
