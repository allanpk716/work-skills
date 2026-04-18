---
phase: 35
slug: gojs-fullstack-calc
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-18
---

# Phase 35 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Go testing + Go vet (后端), Vitest (前端) |
| **Config file** | Go: 无需额外配置; 前端: vitest.config.ts (Wave 0) |
| **Quick run command** | `cd tmp/gojs-calculator && go build ./...` |
| **Full suite command** | `cd tmp/gojs-calculator && go test ./... -v` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd tmp/gojs-calculator && go build ./... && go vet ./...`
- **After every plan wave:** Run `cd tmp/gojs-calculator && go test ./... -v`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 35-01-01 | 01 | 1 | FULL-01 | — | N/A | smoke | `cd tmp/gojs-calculator && go build ./...` | ❌ W0 | ⬜ pending |
| 35-01-02 | 01 | 1 | FULL-01 | — | N/A | smoke | `cd tmp/gojs-calculator/frontend && npm run build` | ❌ W0 | ⬜ pending |
| 35-01-03 | 01 | 1 | FULL-01 | — | API 输入验证 | integration | `curl -X POST localhost:8080/api/calculate -d '{"expression":"2+3"}'` | ❌ W0 | ⬜ pending |
| 35-02-01 | 02 | 2 | FULL-02 | — | N/A | manual | `/codepoint:scan` in project directory | ❌ W0 | ⬜ pending |
| 35-03-01 | 03 | 2 | FULL-03 | — | Collector 无认证（测试项目可接受） | integration | 检查 `~/.codepoint/gojs-calculator/cp-ts-*.log` 存在且非空 | ❌ W0 | ⬜ pending |
| 35-04-01 | 04 | 3 | FULL-04 | — | N/A | manual | `grep "flow-api-calculate" ~/.codepoint/gojs-calculator/*.log` | ❌ W0 | ⬜ pending |
| 35-04-02 | 04 | 3 | FULL-04 | — | N/A | manual | 对比 cp-go-flow-api-calculate vs cp-go-flow-history-query 中共享代码点堆栈 | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tmp/gojs-calculator/codepoint/codepoint.go` — 复用自 go-calculator
- [ ] `tmp/gojs-calculator/codepoint/collector.go` — 从 golang.md 模板（需增强 flow_id 路由）
- [ ] `tmp/gojs-calculator/internal/calculator/calculator.go` — 复用自 go-calculator
- [ ] `tmp/gojs-calculator/internal/calculator/calculator_test.go` — 复用测试
- [ ] `tmp/gojs-calculator/internal/api/server_test.go` — API 端点测试
- [ ] `tmp/gojs-calculator/frontend/` — Vite+React 项目脚手架
- [ ] `tmp/gojs-calculator/frontend/src/lib/codepoint.ts` — 前端探针库
- [ ] Go module init: `cd tmp/gojs-calculator && go mod init gojs-calculator`
- [ ] npm init: `cd tmp/gojs-calculator/frontend && npm create vite@latest . -- --template react-ts && npm install`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| scan 识别前后端业务流 | FULL-02 | codepoint:scan 是交互式技能，需在项目目录运行 | 1. 在 gojs-calculator 目录运行 /codepoint:scan 2. 验证输出包含前后端业务流 |
| 同一 flow_id 出现在 cp-go 和 cp-ts 日志 | FULL-04 | 需启动全栈服务并执行多个业务流后检查日志 | 1. 启动 server 2. 执行三个业务流 3. grep flow_id 在日志中验证 |
| 不同流程堆栈差异 | FULL-04 | 需人工对比多个 flow-specific 日志中的堆栈内容 | 对比 cp-go-flow-api-calculate vs cp-go-flow-history-query 中 cp-calc-compute 的堆栈 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
