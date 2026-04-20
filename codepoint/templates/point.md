# Code Point: {{POINT_NAME}}

> ID: `{{POINT_ID}}`
> Type: `{{POINT_TYPE}}`
> Language: `{{LANGUAGE}}`
> Created: {{DATE}}

## Location

`{{FILE_PATH}}:{{LINE_NUMBER}}`

## Description

{{POINT_DESCRIPTION}}

## Probe Code

```{{LANGUAGE}}
{{PROBE_CODE}}
```

## Used In Flows

| Flow ID | Flow Name | Position in Sequence |
|---------|-----------|---------------------|
| {{FLOW_ID}} | {{FLOW_NAME}} | Step {{STEP_NUMBER}} |

## Expected Output

```json
{
  "point_id": "{{POINT_ID}}",
  "flow_id": "{{FLOW_ID}}",
  "timestamp": "...",
  "stack": ["..."],
  "metadata": {}
}
```

## Notes

{{NOTES}}
