---
phase: 35
plan: 04
status: complete
self_check: PASSED
---

## Summary

Cross-language probe correlation verified through both automated curl tests and Playwright browser automation.

### Key Results

- **FULL-03 (collector collects frontend data)**: PASS — cp-ts-flow-*.log files created for all 3 flows with real browser stack traces
- **FULL-04 (same codepoint, different stacks per flow)**: PASS — cp-calc-compute shows HandleCalculate/HandleHistoryGet/HandleBatch differentiation; shared Evaluate/Parse/Validate/Compute/Format frames present in all flows
- **Browser automation**: All 3 UI flows tested via Playwright — Calculator (2+3=5.0), History (recomputed 5.0), Batch (1+1=2.0, 2*3=6.0, 10/2=5.0)

### Bugs Fixed During Verification

1. **Windows path separator**: `filepath.Clean` converts `/` to `\` breaking `embed.FS.Open` — fixed with `path.Clean`
2. **JSON field mapping**: `history.Record` missing JSON tags caused uppercase field names — fixed with `json:"id"` tags
3. **Batch response unwrap**: API returns `{"results":[...]}` but client expected array — fixed with `data.results || data`

### Log Files Created (browser test)

- cp-go-flow-api-calculate, cp-go-flow-history-query, cp-go-flow-batch-process
- cp-ts-flow-api-calculate, cp-ts-flow-history-query, cp-ts-flow-batch-process
- Same flow_id in both cp-go and cp-ts files confirmed

### Deviations

- Port 18090 used instead of 8080 (port conflict with dirbackup.exe)
- Race flag unavailable on Windows CGO setup — thread safety validated via concurrent write test (200 entries)
