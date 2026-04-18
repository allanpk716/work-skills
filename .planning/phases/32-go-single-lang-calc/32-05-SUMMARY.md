---
phase: 32
plan: 32-05
status: complete
started: "2026-04-18T18:11:00.000Z"
completed: "2026-04-18T19:00:00.000Z"
---

# Plan 32-05 Summary: 多流程运行验证堆栈差异

## What was built

集成测试验证了 Go 计算器的 3 个业务流程（REST API、Batch、History）在同一代码点产生可区分的探针输出，确认 Codepoint V2 核心价值。

### Test results

- `TestMultiFlowStackDifferentiation` — PASS
- `TestProbeDensity` — PASS
- `TestFlowIDMetadata` — PASS

### flow_id differentiation

| Flow | flow_id | Probe count |
|------|---------|-------------|
| REST API | `flow-api-calculate` | 12 |
| Batch | `flow-batch-process` | 5 |
| History | `flow-history-query` | 7 |

### Stack differentiation (cp-calc-compute)

- **API**: `Evaluate` ← `HandleCalculate` (server.go:81)
- **Batch**: `Evaluate` ← `ProcessExpressions` (processor.go:52)
- **History**: `Evaluate` ← `HandleHistoryGet` (server.go:148) + HTTP middleware frames

### Probe density

- Cross-flow transitions: 33-50% overlap (in 20-60% target range)
- Same-flow adjacent: 80-90% overlap (expected — probes in same function)

### Per-flow log separation

4 log files generated:
- `cp-go-2026-04-18_18-11-37_717.log` (combined)
- `cp-go-flow-api-calculate-2026-04-18_18-11-37_717.log`
- `cp-go-flow-batch-process-2026-04-18_18-11-37_717.log`
- `cp-go-flow-history-query-2026-04-18_18-11-37_717.log`

### Verification

- All 3 integration tests pass
- Macro differentiation: entry probes show completely different handler frames
- Micro differentiation: shared path probes show same Evaluate function but different callers above
- flow_id propagation via context.Context working correctly
- Test isolation: t.TempDir() + t.Cleanup() + TestMain toggle management

### key-files

- created:
  - tmp/go-calculator/tests/integration_test.go (3 test functions + helpers)
