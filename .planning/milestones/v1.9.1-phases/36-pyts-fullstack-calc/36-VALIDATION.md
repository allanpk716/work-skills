---
phase: 36
slug: pyts-fullstack-calc
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-19
---

# Phase 36 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest (Python) + curl/bash (integration) |
| **Config file** | none — Wave 0 creates test files |
| **Quick run command** | `python -m pytest tests/ -x -q` |
| **Full suite command** | `python -m pytest tests/ -v` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `python -m pytest tests/ -x -q`
- **After every plan wave:** Run `python -m pytest tests/ -v` + frontend `npm run build`
- **Before `/gsd-verify-work`:** Full suite must be green + Toggle 四组合验证通过
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 36-01-01 | 01 | 1 | FULL-05 | — | N/A | unit | `python -m pytest tests/test_calculator.py -x` | ❌ W0 | ⬜ pending |
| 36-01-02 | 01 | 1 | FULL-05 | — | N/A | smoke | `curl http://localhost:18091/` | ❌ W0 | ⬜ pending |
| 36-02-01 | 02 | 2 | FULL-06 | — | N/A | integration | `curl -X POST http://localhost:18091/__codepoint__ -d '{"name":"test"}'` | ❌ W0 | ⬜ pending |
| 36-02-02 | 02 | 2 | FULL-07 | — | N/A | manual+script | Toggle verification script | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tmp/pyts-calculator/tests/test_calculator.py` — unit tests for core pipeline (copy from python-calculator)
- [ ] `tmp/pyts-calculator/tests/test_api.py` — FastAPI route integration tests
- [ ] `tmp/pyts-calculator/tests/test_integration.py` — cross-language probe correlation tests
- [ ] FastAPI install: `python -m pip install fastapi`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Toggle 四组合独立控制 | FULL-07 | 需要启动/停止服务 + 删除/创建 toggle 文件 + 检查日志输出 | 1. 启动服务 2. 测试四组合 3. 检查 cp-python-*.log 和 cp-ts-*.log 是否符合预期 |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
