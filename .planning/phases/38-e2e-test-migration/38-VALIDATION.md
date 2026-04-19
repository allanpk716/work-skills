---
phase: 38
slug: e2e-test-migration
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-19
---

# Phase 38 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | go test + filesystem verification (ls, test, grep) |
| **Config file** | none — uses per-project standard configs |
| **Quick run command** | `ls tests/e2e/codepoint-v2/` |
| **Full suite command** | `cd tests/e2e/codepoint-v2/go-calculator && go build ./... && cd C:/WorkSpace/agent/work-skills && cd tests/e2e/codepoint-v2/gojs-calculator && go build ./...` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `ls tests/e2e/codepoint-v2/` + targeted `go build`
- **After every plan wave:** Full directory listing + all verification commands
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 38-01-01 | 01 | 1 | R1 | N/A | N/A | smoke | `test -d tests/e2e/codepoint-v2 && test -f tests/e2e/codepoint-v2/.gitignore && test -f tests/e2e/codepoint-v2/gojs-calculator/frontend/dist/index.html` | ✅ W0 | ⬜ pending |
| 38-01-02 | 01 | 1 | R1, R3 | N/A | N/A | unit | `cd tests/e2e/codepoint-v2/go-calculator && go build ./... && cd C:/WorkSpace/agent/work-skills && cd tests/e2e/codepoint-v2/gojs-calculator && go build ./...` | ✅ W0 | ⬜ pending |
| 38-02-01 | 02 | 2 | R1 | N/A | N/A | smoke | `! test -d tmp/go-calculator && ! test -d tmp/gojs-calculator && ls tests/e2e/codepoint-v2/ | grep -q go-calculator && cd tests/e2e/codepoint-v2/go-calculator && go build ./...` | ✅ W0 | ⬜ pending |
| 38-02-02 | 02 | 2 | R1, R3 | N/A | N/A | smoke | `grep -q "\- \[x\] R1:" .planning/PROJECT.md && grep -q "tests/e2e/codepoint-v2/" .planning/PROJECT.md && grep -q "迁移已完成" .planning/STATE.md` | ✅ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No test framework installation needed — this is a migration phase verified through build commands and filesystem checks.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| R3 directory structure matches spec | R3 | Visual inspection of directory hierarchy | Verify tests/e2e/codepoint-v2/ contains 5 named directories matching research spec |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
