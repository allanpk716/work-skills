# Flow: {{FLOW_NAME}}

> ID: `{{FLOW_ID}}`
> Collection: `{{COLLECTION_ID}}`
> Created: {{DATE}}

## Overview

{{FLOW_DESCRIPTION}}

## Execution Sequence

```
{{CODE_POINT_1}} → {{CODE_POINT_2}} → {{CODE_POINT_3}} → ...
```

| Step | Code Point | Type | Location |
|------|-----------|------|----------|
| 1 | {{CP_ID}} | {{CP_TYPE}} | {{CP_LOCATION}} |

## Trigger

{{FLOW_TRIGGER}}

## Test Cases

### Normal Flow
- Input: {{NORMAL_INPUT}}
- Expected: All code points triggered in sequence, stacks complete

### Boundary Conditions
- Input: {{BOUNDARY_INPUT}}
- Expected: {{BOUNDARY_EXPECTED}}

### Failure Modes
- Input: {{FAILURE_INPUT}}
- Expected: {{FAILURE_EXPECTED}}

## Notes

{{NOTES}}
