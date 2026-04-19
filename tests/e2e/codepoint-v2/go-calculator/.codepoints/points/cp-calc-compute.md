# Point: cp-calc-compute

- **ID:** cp-calc-compute
- **Location:** `internal/calculator/calculator.go:103`
- **Type:** state-change
- **Language:** go
- **Description:** Shared code point — expression evaluation via recursive descent. Called by all 3 flows through Evaluate(). Key state mutation point.
- **Flows:** flow-api-calculate, flow-batch-process, flow-history-query
- **Shared:** true
