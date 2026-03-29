---
phase: 23
slug: detection-regression-verification
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-29
---

# Phase 23 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | installer/package.json (scripts.test) |
| **Quick run command** | `cd installer && npx jest --testPathPattern plugin-installer --no-coverage` |
| **Full suite command** | `cd installer && npx jest --no-coverage` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd installer && npx jest --testPathPattern plugin-installer --no-coverage`
- **After every plan wave:** Run `cd installer && npx jest --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 23-01-01 | 01 | 1 | DETECT-01 | manual | `node -e "const p=require('path'); const f=require('fs'); console.log(f.existsSync(p.join(require('os').homedir(), '.claude/skills/windows-git-commit/SKILL.md')))"` | N/A | ⬜ pending |
| 23-01-02 | 01 | 1 | DETECT-02 | manual | Run installer twice, verify [installed] marker | N/A | ⬜ pending |
| 23-01-03 | 01 | 1 | DETECT-03 | manual | `node -e "const p=require('path'); const f=require('fs'); console.log(f.existsSync(p.join(require('os').homedir(), '.claude/skills/claude-notify/SKILL.md')))"` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Existing infrastructure covers all phase requirements — no new test files needed

*Existing infrastructure covers all phase requirements. Phase 23 is a verification-only phase with manual testing.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| isPluginInstalled('windows-git-commit') returns true after install | DETECT-01 | Requires running actual installer (npx) and checking filesystem | 1. Run `npx @allanpk716/work-skills-setup` 2. Check `~/.claude/skills/windows-git-commit/SKILL.md` exists |
| [installed] marker shown on re-run | DETECT-02 | Requires interactive terminal UI (MultiSelect) | 1. Run installer again 2. Verify windows-git-commit shows [installed] and is not selectable |
| isPluginInstalled('claude-notify') unaffected | DETECT-03 | Regression check requiring pre/post comparison | 1. Check claude-notify detection before and after windows-git-commit install 2. Both must return true |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
