# Point: cp-calc-validate

- **ID:** cp-calc-validate
- **Location:** `internal/calculator/calculator.go:52`
- **Type:** boundary
- **Language:** go
- **Description:** Shared code point — token syntax validation. Called by all 3 flows through Evaluate().
- **Flows:** flow-api-calculate, flow-batch-process, flow-history-query
- **Shared:** true
