---
phase: 32
plan: 32-04
status: complete
started: "2026-04-18T16:55:00.000Z"
completed: "2026-04-18T17:10:00.000Z"
---

# Plan 32-04 Summary: 运行 codepoint implement

## What was built

在 Go 计算器源文件中插入了 V2 探针代码（PointWithMeta + point_id + flow_id），flow_id 通过 context.Context 传播。

### Probes inserted

- **server.go**: cp-api-calc-entry, cp-api-calc-done (HandleCalculate), cp-history-entry, cp-history-lookup, cp-history-done (HandleHistoryGet)
- **processor.go**: cp-batch-entry (ProcessExpressions)
- **calculator.go**: cp-calc-parse, cp-calc-validate, cp-calc-compute, cp-calc-format (shared path in Evaluate)

### Verification

- `go build ./...` — PASS
- `go test ./... -count=1` — ALL PASS
- Probes are purely additive — no business logic modified

### key-files

- modified:
  - tmp/go-calculator/internal/calculator/calculator.go (shared path probes + FlowIDKey + GetFlowID)
  - tmp/go-calculator/internal/api/server.go (entry/done probes + flow_id context propagation)
  - tmp/go-calculator/internal/batch/processor.go (entry probe + flow_id context propagation)
