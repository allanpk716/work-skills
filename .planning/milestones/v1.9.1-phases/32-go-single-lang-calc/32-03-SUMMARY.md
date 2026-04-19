---
phase: 32
plan: 32-03
status: complete
started: "2026-04-18T16:45:00.000Z"
completed: "2026-04-18T16:55:00.000Z"
---

# Plan 32-03 Summary: 运行 codepoint plan 并验证探针规划质量

## What was built

对现有 3 个业务流重新规划探针位置，添加 flow_id 传播策略，确保 plan 输出可直接被 implement 消费。

### Plan quality verification

| Criterion | Minimum | Actual | Status |
|-----------|---------|--------|--------|
| Entry probes per flow | >= 1 | 1-2 each | PASS |
| Shared path probes in calculator.go | >= 1 | 5 | PASS |
| Total probes across all flows | >= 6 | 12 | PASS |
| Error-type probes | >= 1 | 1 | PASS |
| Flows reusing existing scan points | >= 1 | 3 (all) | PASS |

### flow_id propagation strategy

- **Mechanism:** context.Context values via `flowIDKey{}`
- **Set at:** Each flow entry handler (HandleCalculate, ProcessExpressions, HandleHistoryGet)
- **Read at:** `calculator.Evaluate()` extracts via `GetFlowID(ctx)`
- **Coverage:** All shared path probes receive flow_id from context

### Plan-implement compatibility

- index.json valid with all flow sequences
- Flow documents have complete sequences with point IDs, types, locations
- Point documents have id, location (file:line), type, description
- Structure matches what `/codepoint:implement` expects as input

## key-files

- updated:
  - tmp/go-calculator/.codepoints/flows/flow-api-calculate.md (plan refinements)
  - tmp/go-calculator/.codepoints/flows/flow-batch-process.md (plan refinements)
  - tmp/go-calculator/.codepoints/flows/flow-history-query.md (plan refinements)
