# Verification Report: {{FLOW_NAME}}

> Flow ID: `{{FLOW_ID}}`
> Date: {{DATE}}
> Result: {{PASS_OR_FAIL}}

## Summary

| Check | Status |
|-------|--------|
| All code points triggered | {{STATUS}} |
| Stacks complete | {{STATUS}} |
| Execution order correct | {{STATUS}} |
| Boundary cases captured | {{STATUS}} |
| Failure mode observable | {{STATUS}} |

## Normal Flow Verification

- Triggered: {{YES_OR_NO}}
- Code points fired in order: {{SEQUENCE}}
- Stacks captured: {{COUNT}}/{{EXPECTED}}

## Boundary Condition Verification

- Test case: {{BOUNDARY_TEST}}
- Code points triggered: {{TRIGGERED_POINTS}}
- Key debug info captured: {{YES_OR_NO}}

## Failure Mode Verification

- Test case: {{FAILURE_TEST}}
- Error observable in output: {{YES_OR_NO}}
- Stack trace includes error path: {{YES_OR_NO}}
- Supports automated diagnosis: {{YES_OR_NO}}

## Issues Found

{{ISSUES_LIST}}

## Recommendations

{{RECOMMENDATIONS}}
