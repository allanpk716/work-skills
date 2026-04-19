# Collection: Calculator System

**ID:** col-calculator
**Description:** Arithmetic expression calculator with REST API, batch processing, and history query flows

## Business Area

Core calculator functionality providing arithmetic expression evaluation through multiple interfaces:
- REST API (synchronous HTTP)
- Batch processing (CLI-driven file/input processing)
- History query (GET with recompute through shared pipeline)

## Shared Code Points

All 3 flows share the core computation pipeline in `internal/calculator/calculator.go`:
- `Parse()` — Tokenizes arithmetic expressions
- `Validate()` — Validates token syntax
- `Compute()` — Evaluates via recursive descent parser
- `Format()` — Formats result for display

The shared `Evaluate()` function orchestrates: Parse -> Validate -> Compute -> Format.

## Flows

| Flow | Trigger | Entry Point | Shared Points |
|------|---------|-------------|---------------|
| flow-api-calculate | POST /api/calculate | HandleCalculate | Parse, Validate, Compute, Format |
| flow-batch-process | CLI --batch/--expr | ProcessExpressions | Parse, Validate, Compute, Format |
| flow-history-query | GET /api/history/{id} | HandleHistoryGet | Parse, Validate, Compute, Format (RECOMPUTE) |

## Density Analysis

- Entry probes to shared path: ~30-40% stack overlap (different handlers call same Evaluate)
- Shared path internal probes (Parse->Validate->Compute->Format): ~50-60% stack overlap
- All values within 20-60% target range
