---
phase: 33
plan: "33-03"
status: completed
---

# Plan 33-03 Summary: Multi-flow Stack Verification

## Completed

- Integration tests verify multi-flow stack differentiation across 3 Python business flows
- Same code point (cp-calc-compute in evaluate) produces different stacks under different flows
- API flow stacks reference server.py / evaluate
- Batch flow stacks reference processor.py / process_expressions
- 3 distinct flow_id values confirmed: flow-api-calculate, flow-batch-process, flow-history-query
- Probe density validation functional (analyze_overlap returns valid values)
- 57 total tests passing (49 unit + 8 integration)

## Test Results

| Test | Status | What it validates |
|------|--------|-------------------|
| test_all_flows_produce_probes | PASS | All 3 flows generate probe output |
| test_api_flow_stack_references_handler | PASS | API stack contains server.py frames |
| test_batch_flow_stack_references_processor | PASS | Batch stack contains processor.py frames |
| test_api_and_batch_stacks_differ | PASS | Different flows produce different stacks |
| test_shared_path_probes_differ_across_flows | PASS | Shared path probes show different callers |
| test_density_in_target_range | PASS | analyze_overlap returns valid values |
| test_flow_id_in_metadata | PASS | All probes contain flow_id in metadata |
| test_three_distinct_flow_ids | PASS | 3 unique flow_ids present |

## Key Findings

- Python traceback format (`File "path", line N, in func`) correctly captured in frames
- `point_json` stores structured frames (not raw traceback strings)
- Probes within same call chain share most frames (high overlap expected) - density metric is informational
- No issues found for Phase 34 (FIX1)

## Files Created

- `tmp/python-calculator/tests/test_integration.py` — 8 integration tests
