---
phase: 32
plan: 32-01
status: complete
started: "2026-04-18T16:15:00.000Z"
completed: "2026-04-18T16:30:00.000Z"
---

# Plan 32-01 Summary: 创建 Go 计算器项目

## What was built

Go 计算器测试项目 (`tmp/go-calculator/`)，包含 3 个业务流程共享核心计算路径的架构。

### Project structure

- `codepoint/codepoint.go` — Codepoint V2 base library (PointWithMeta, AnalyzeOverlap, etc.)
- `internal/calculator/` — Core shared computation: Parse, Validate, Compute, Format, Evaluate
- `internal/api/` — REST API handlers: HandleCalculate, HandleHistoryGet (recomputes through shared pipeline)
- `internal/batch/` — Batch processor: ProcessExpressions, ProcessFile
- `internal/history/` — In-memory history store
- `main.go` — CLI entry point (server + batch + single expr modes)

### Key design decisions

1. **Shared pipeline**: `calculator.Evaluate()` is the single entry point called by all 3 flows
2. **History recomputes**: `HandleHistoryGet` explicitly re-runs `calculator.Evaluate()` on stored expressions
3. **Context propagation**: `Evaluate(ctx context.Context, expr)` accepts context for future flow_id propagation
4. **Codepoint library**: Extracted top-level `Frame` type to fix type mismatch between `parseGoStack` return and `PointJSON` usage

## Verification results

- `go build ./...` — PASS (zero errors)
- `go test ./... -v -count=1` — ALL PASS (31 test cases across 4 packages)
- Error scenarios verified: division by zero, invalid syntax

## Deviations from plan

1. **codepoint.go Frame type fix**: `parseGoStack` returned anonymous struct incompatible with `PointJSON`'s local `Frame` type. Fixed by promoting `Frame` to package-level type.
2. **Unused import**: `history/store.go` had unused `fmt` import. Removed.
3. **Test expectation fix**: `(2+3)*4-10/2` expected `10.0` but correct answer is `15.0`. Fixed test expectation.
4. **API test routing**: History tests called handler directly, bypassing mux `PathValue` extraction. Fixed to route through `srv.ServeHTTP()`.

## key-files

- created:
  - tmp/go-calculator/go.mod
  - tmp/go-calculator/main.go
  - tmp/go-calculator/codepoint/codepoint.go
  - tmp/go-calculator/internal/calculator/calculator.go
  - tmp/go-calculator/internal/calculator/calculator_test.go
  - tmp/go-calculator/internal/api/server.go
  - tmp/go-calculator/internal/api/server_test.go
  - tmp/go-calculator/internal/batch/processor.go
  - tmp/go-calculator/internal/batch/processor_test.go
  - tmp/go-calculator/internal/history/store.go
  - tmp/go-calculator/internal/history/store_test.go
