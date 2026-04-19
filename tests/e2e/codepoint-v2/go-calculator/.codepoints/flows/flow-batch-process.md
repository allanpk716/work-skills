# Flow: Batch Processing

**ID:** flow-batch-process
**Trigger:** CLI `--batch <file>` or `--expr <expression>`
**Entry:** `internal/batch/processor.go` — `ProcessExpressions`

## Description

Batch expression processing flow. Reads multiple expressions from file or stdin, evaluates each through shared pipeline, outputs results with timing.

## Code Point Sequence

| # | Point ID | Type | Location | Description |
|---|----------|------|----------|-------------|
| 1 | cp-batch-entry | entry | processor.go:27 | Batch processing started |
| 2 | cp-calc-parse | boundary | calculator.go:16 | Shared: Tokenize expression |
| 3 | cp-calc-validate | boundary | calculator.go:52 | Shared: Validate token syntax |
| 4 | cp-calc-compute | state-change | calculator.go:103 | Shared: Evaluate expression |
| 5 | cp-calc-format | boundary | calculator.go:116 | Shared: Format result |
| 6 | cp-batch-done | state-change | processor.go:55 | Single expression complete |

## Test Cases

### Normal
- Multi-line: `"2+3\n10/2\n(2+3)*4"` → 3 results
- With comments: lines starting with `#` skipped

### Boundary
- Single expression via `--expr`
- Empty lines skipped

### Failure
- `"10/0"` → error per line (non-blocking)
- `"2++3"` → invalid syntax error per line

## Stack Profile

```
main -> runBatchFile/runSingleExpr -> ProcessExpressions
  -> calculator.Evaluate -> Parse -> Validate -> Compute -> Format
```

## Plan Refinements

### flow_id Propagation
- **Strategy:** context.Context values
- **Set at:** ProcessExpressions entry: `ctx = context.WithValue(ctx, flowIDKey{}, "flow-batch-process")`
- **Read at:** calculator.Evaluate: `flowID := GetFlowID(ctx)`
- **All shared path probes include flow_id in meta**

### Probe Quality
- Entry probe (cp-batch-entry): captures unique processor stack frame
- Shared path probes (cp-calc-*): same function but caller is ProcessExpressions (not HandleCalculate)
- Done probe (cp-batch-done): captures per-expression result

### Reused Existing Points
- cp-calc-parse: from scan, shared across 3 flows
- cp-calc-validate: from scan, shared across 3 flows
- cp-calc-compute: from scan, shared across 3 flows
- cp-calc-format: from scan, shared across 3 flows
