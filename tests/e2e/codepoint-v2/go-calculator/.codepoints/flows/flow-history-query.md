# Flow: History Query with Recompute

**ID:** flow-history-query
**Trigger:** GET /api/history/{id}
**Entry:** `internal/api/server.go` — `HandleHistoryGet`

## Description

History query flow that RECOMPUTES stored expressions through the full shared pipeline. Not a simple cache lookup — deliberately re-evaluates to exercise codepoint probes on the shared path.

## Code Point Sequence

| # | Point ID | Type | Location | Description |
|---|----------|------|----------|-------------|
| 1 | cp-history-entry | entry | server.go:101 | History request received |
| 2 | cp-history-lookup | boundary | server.go:112 | Store lookup for record |
| 3 | cp-calc-parse | boundary | calculator.go:16 | Shared: Tokenize expression |
| 4 | cp-calc-validate | boundary | calculator.go:52 | Shared: Validate token syntax |
| 5 | cp-calc-compute | state-change | calculator.go:103 | Shared: Evaluate expression |
| 6 | cp-calc-format | boundary | calculator.go:116 | Shared: Format result |
| 7 | cp-history-done | state-change | server.go:127 | Recompute complete, response sent |

## Test Cases

### Normal
- GET /api/history/1 after POST → recomputed result matches original
- Multiple history entries, each recomputed

### Boundary
- GET /api/history (list all)

### Failure
- GET /api/history/999 → 404 Not Found
- GET /api/history/invalid → 400 Bad Request

## Stack Profile

```
main -> http.ListenAndServe -> Server.ServeHTTP -> HandleHistoryGet
  -> store.Get -> calculator.Evaluate -> Parse -> Validate -> Compute -> Format
```

## Key Differentiator

This flow re-enters the shared pipeline through `HandleHistoryGet` instead of `HandleCalculate`, producing a different call stack above `Evaluate()`. This is the critical path for stack differentiation testing.

## Plan Refinements

### flow_id Propagation
- **Strategy:** context.Context values
- **Set at:** HandleHistoryGet entry: `ctx := context.WithValue(r.Context(), flowIDKey{}, "flow-history-query")`
- **Read at:** calculator.Evaluate: `flowID := GetFlowID(ctx)`
- **All shared path probes include flow_id in meta**

### Probe Quality
- Entry probe (cp-history-entry): captures unique handler stack frame (HandleHistoryGet, not HandleCalculate)
- Boundary probe (cp-history-lookup): cross-module boundary (API -> history store)
- Shared path probes (cp-calc-*): RECOMPUTE path — same Evaluate but stack above has HandleHistoryGet instead of HandleCalculate
- Done probe (cp-history-done): captures recomputed result

### Reused Existing Points
- cp-calc-parse: from scan, shared across 3 flows
- cp-calc-validate: from scan, shared across 3 flows
- cp-calc-compute: from scan, shared across 3 flows
- cp-calc-format: from scan, shared across 3 flows
