---
phase: 31
slug: worktree
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-08
---

# Phase 31 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 9.0.2 |
| **Config file** | pytest.ini (project root) |
| **Quick run command** | `python -m pytest plugins/claude-notify/tests/test_flags.py plugins/claude-notify/tests/test_notify.py -v` |
| **Full suite command** | `python -m pytest plugins/claude-notify/tests/ -v` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `python -m pytest plugins/claude-notify/tests/test_flags.py plugins/claude-notify/tests/test_notify.py -v`
- **After every plan wave:** Run `python -m pytest plugins/claude-notify/tests/ -v`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 31-01-01 | 01 | 1 | WTREE-01 | T-31-01 | subprocess.run with timeout + returncode check | unit | `python -m pytest plugins/claude-notify/tests/test_flags.py::TestGetGitBranch -v` | ❌ W0 | ⬜ pending |
| 31-01-02 | 01 | 1 | WTREE-01 | — | N/A | unit | `python -m pytest plugins/claude-notify/tests/test_flags.py::TestFindProjectRootWorktree -v` | ❌ W0 | ⬜ pending |
| 31-02-01 | 02 | 1 | WTREE-01 | T-31-01 | Branch name only used for string formatting | unit | `python -m pytest plugins/claude-notify/tests/test_notify.py -v` | ⚠️ Partial | ⬜ pending |
| 31-02-02 | 02 | 1 | WTREE-02 | — | session_id is non-sensitive identifier | unit | `python -m pytest plugins/claude-notify/tests/test_notify.py -v` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `plugins/claude-notify/tests/test_flags.py` — 新增 `TestGetGitBranch` 测试类和 `TestFindProjectRootWorktree` 测试类
- [ ] `plugins/claude-notify/tests/test_notify.py` — 新增标题格式测试和 session_id 展示测试

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Pushover 通知实际显示 `[project:branch]` 格式 | WTREE-01 | 需要 Pushover API key 和实际推送 | 1. 运行 Stop hook 触发通知 2. 检查手机推送标题 |
| Attention 通知在 Pushover 中包含 session_id | WTREE-02 | 需要 Notification hook 触发 | 1. 运行 Attention hook 触发通知 2. 检查消息体 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
