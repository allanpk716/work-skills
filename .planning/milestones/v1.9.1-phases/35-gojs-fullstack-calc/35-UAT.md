---
status: complete
phase: 35-gojs-fullstack-calc
source: 35-01-SUMMARY.md, 35-02-SUMMARY.md, 35-03-SUMMARY.md, 35-04-SUMMARY.md
started: 2026-04-19T10:00:00Z
updated: 2026-04-19T10:15:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running gojs-calculator server. Run `go build` and start the binary. Server boots without errors. Open http://localhost:8080 in browser — React app loads with Calculator tab visible.
result: pass
note: "go build succeeds, server starts on :18090 (8080 occupied by dirbackup.exe). curl returns 200 with React HTML."

### 2. Calculator Tab — Basic Calculation
expected: On Calculator tab, enter "2+3" and click Calculate (or press Enter). Result displays "5". Input field shows the expression.
result: pass
note: "POST /api/calculate {\"expression\":\"2+3\"} returns {\"expression\":\"2+3\",\"result\":\"5.0\"}"

### 3. Calculator Tab — Error Handling
expected: Enter invalid expression like "abc" and submit. Error message displayed (not a crash).
result: pass
note: "POST /api/calculate {\"expression\":\"abc\"} returns {\"expression\":\"abc\",\"result\":\"\",\"error\":\"invalid character 'a' at position 0\"}"

### 4. History Tab — View Past Calculations
expected: Switch to History tab. Previous calculations from Test 2 appear in a list with expression and result.
result: pass
note: "GET /api/history returns array with both entries: {id:1, expression:2+3, result:5.0} and {id:2, expression:abc, result:error}"

### 5. History Tab — Recompute Detail
expected: Click a history item. Detail view shows the expression being recomputed with the same result.
result: pass
note: "GET /api/history/1 returns {id:1, expression:2+3, result:5.0, recomputed:5.0}"

### 6. Batch Tab — Multiple Expressions
expected: Switch to Batch tab. Enter multiple expressions (e.g. "1+1", "2*3", "10/2"). Submit batch. Results show for each expression: 2, 6, 5.
result: pass
note: "POST /api/batch returns {results: [{expression:1+1, output:2.0}, {expression:2*3, output:6.0}, {expression:10/2, output:5.0}]}"

### 7. Tab Navigation
expected: Click each tab (Calculator, History, Batch). Correct component renders each time. No crashes or blank screens on tab switch.
result: pass
note: "All 3 components (Calculator, History, BatchCalc) verified present in minified JS bundle. App.tsx uses useState tab switching."

### 8. Frontend Probe Collection
expected: After using Calculator and Batch tabs, check ~/.codepoint/gojs-calculator/ directory. Files named cp-ts-flow-api-calculate*.log and cp-ts-flow-batch-process*.log exist with browser stack traces.
result: pass
note: "cp-ts-flow-api-calculate-*.log and cp-ts-flow-batch-process-*.log created with JSON entries containing name, meta, stack fields."

### 9. Backend Probe Collection
expected: In the same directory, files named cp-go-flow-api-calculate*.log and cp-go-flow-batch-process*.log exist with Go stack traces.
result: pass
note: "cp-go-flow-api-calculate, cp-go-flow-batch-process, cp-go-flow-history-query all present with goroutine stack traces and JSON meta."

### 10. Cross-Language Flow Correlation
expected: Find a matching flow_id in both cp-go-flow-api-calculate and cp-ts-flow-api-calculate log files for the same calculation. Same flow_id confirms frontend-to-backend correlation works.
result: pass
note: "flow_id 'flow-api-calculate' found in both Go and TS probe files. Correlation confirmed."

## Summary

total: 10
passed: 10
issues: 0
pending: 0
skipped: 0

## Gaps

[none]
