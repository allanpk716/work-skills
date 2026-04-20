# Code Point V2 Data Model Specification

## Three-Layer Structure

Code points are independent entities. Business flows reference code points as ordered combinations. Collections group flows.

```
CodePoint (independent unit)
├── id: "cp-user-auth-check"
├── location: "src/auth/handler.go:42"
├── description: "User authentication check entry"
├── type: "entry | boundary | state-change | concurrency | error"
├── language: "go | python | typescript"
└── enabled: true/false

Flow (ordered combination of code points)
├── id: "flow-user-login"
├── name: "User Login Flow"
├── collection_id: "col-user-management"
├── sequence: [cp-login-entry, cp-auth-check, cp-session-create, cp-login-complete]
├── trigger: "POST /api/login"
└── test_cases:
    - normal: valid credentials
    - boundary: empty password, max-length input
    - failure: wrong credentials, expired token

Collection (group of flows)
├── id: "col-user-management"
├── name: "User Management"
└── flows: [flow-user-login, flow-user-register, flow-user-update]
```

## Code Point Types

| Type | When to Use | Examples |
|------|-------------|---------|
| `entry` | Function/flow entry point | HTTP handler start, message consumer start |
| `boundary` | Module/cross-component boundary | Service → Repository, Controller → UseCase |
| `state-change` | Before/after state mutation | State machine transition, config update |
| `concurrency` | Lock/async/goroutine junction | Before mutex acquire, goroutine spawn |
| `error` | Error/failure path | Error handler, catch block, fallback |

## Probe Output Format (V2)

Each probe outputs JSON with point_id and flow_id:

```json
{
  "point_id": "cp-auth-check",
  "flow_id": "flow-user-login",
  "timestamp": "2026-04-18T10:30:00.000Z",
  "stack": ["main.handleLogin", "auth.Check", "..."],
  "metadata": {}
}
```

## Per-Flow File Output (V2)

When V2 probes include `flow_id` in metadata, entries are routed to **flow-specific log files** instead of a single mixed file. This makes per-flow analysis immediate — the filename tells you which flow the data belongs to.

### Routing Rules

| Call | flow_id | Target File |
|------|---------|-------------|
| `Point(name)` | N/A | General file |
| `PointJSON(name)` | N/A | General file |
| `PointWithMeta(name, meta)` | non-empty string | Flow-specific file |
| `PointWithMeta(name, meta)` | empty / missing / non-string | General file |

### File Naming

All files in the same session share a timestamp for correlation:

```
~/.codepoint/<project>/
├── cp-go-2026-04-18_17-22-46_982.log                        ← general (no flow_id)
├── cp-go-flow-api-calculate-2026-04-18_17-22-46_982.log     ← flow-api-calculate
├── cp-go-flow-batch-process-2026-04-18_17-22-46_982.log     ← flow-batch-process
└── cp-go-flow-history-query-2026-04-18_17-22-46_982.log     ← flow-history-query
```

- General: `cp-{lang}-{timestamp}.log`
- Per-flow: `cp-{lang}-{sanitized-flow-id}-{timestamp}.log`

### Directory Naming

Output directory uses the **project module name** (e.g., from `go.mod`), not the CWD basename. Falls back to CWD basename if no module file found.

### Flow ID Sanitization

Flow IDs are sanitized for filesystem safety: only `[a-zA-Z0-9._-]` preserved, all other characters replaced with `-`, consecutive dashes collapsed.

### Flow File Headers

Each flow file includes a header identifying the flow:

```
# Code Point Log (Go) — Flow: flow-api-calculate
# Project: my-api
# Session: 2026-04-18T17:22:46.982+08:00
# Flow ID: flow-api-calculate
```

## Density Validation

- Too dense (overlap > 80%): Remove points
- Too sparse (overlap = 0%): Add intermediate points
- Target range: 20%-60% overlap between adjacent points
