# Flow: REST API Calculation

**ID:** flow-api-calculate
**Trigger:** POST /api/calculate
**Entry:** `internal/api/server.go` — `HandleCalculate`

## Description

REST API synchronous calculation flow. Client sends JSON expression, server evaluates through shared pipeline and returns result.

## Code Point Sequence

| # | Point ID | Type | Location | Description |
|---|----------|------|----------|-------------|
| 1 | cp-api-calc-entry | entry | server.go:65 | Request received, JSON decoded |
| 2 | cp-calc-parse | boundary | calculator.go:16 | Shared: Tokenize expression |
| 3 | cp-calc-validate | boundary | calculator.go:52 | Shared: Validate token syntax |
| 4 | cp-calc-compute | state-change | calculator.go:103 | Shared: Evaluate expression |
| 5 | cp-calc-format | boundary | calculator.go:116 | Shared: Format result |
| 6 | cp-api-calc-done | state-change | server.go:80 | Result stored, response sent |

## Test Cases

### Normal
- `"2+3"` → `{"result": "5.0"}`
- `"(2+3)*4"` → `{"result": "20.0"}`

### Boundary
- `"2.5+3.5"` → float result
- `"2^-3"` → negative power

### Failure
- `"10/0"` → division by zero error
- `""` → empty expression error
- invalid JSON → 400 Bad Request

## Stack Profile

```
main -> http.ListenAndServe -> Server.ServeHTTP -> HandleCalculate
  -> calculator.Evaluate -> Parse -> Validate -> Compute -> Format
```

## Plan Refinements

### flow_id Propagation
- **Strategy:** context.Context values
- **Set at:** HandleCalculate entry: `ctx := context.WithValue(r.Context(), flowIDKey{}, "flow-api-calculate")`
- **Read at:** calculator.Evaluate: `flowID := GetFlowID(ctx)`
- **All shared path probes include flow_id in meta**

### Probe Quality
- Entry probe (cp-api-calc-entry): captures unique handler stack frame
- Shared path probes (cp-calc-*): same function but different caller above Evaluate()
- Done probe (cp-api-calc-done): captures result state

### Reused Existing Points
- cp-calc-parse: from scan, shared across 3 flows
- cp-calc-validate: from scan, shared across 3 flows
- cp-calc-compute: from scan, shared across 3 flows
- cp-calc-format: from scan, shared across 3 flows
