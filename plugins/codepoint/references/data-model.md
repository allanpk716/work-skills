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

## Density Validation

- Too dense (overlap > 80%): Remove points
- Too sparse (overlap = 0%): Add intermediate points
- Target range: 20%-60% overlap between adjacent points
