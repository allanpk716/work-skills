---
name: codepoint
description: >
  Code point V2 skill — collection-based runtime observability for AI-assisted development.
  Provides core capabilities: scan existing code to identify business flows and probe locations,
  plan code points for new features, generate structured test plans, and implement probes
  with TDD-style automated verification.
  Triggers on: "code point", "代码点", "埋点", "codepoint", "runtime probe", "codepoint scan",
  "codepoint plan", "codepoint test plan", "codepoint implement", "扫描代码点", "规划埋点",
  "测试计划", "埋点验收".
---

# Code Point V2 — Collection-Based Runtime Observability

## Core Principle

Given a prompt + a collection of code points, the LLM filters a subset to locate and solve problems.
Code points form collections organized by business flows, enabling targeted debugging in seconds instead of minutes.

## Three-Layer Data Model

```
CodePoint (independent probe)
Flow (ordered combination of code points)
Collection (group of related flows)
```

All data stored in `.codepoints/` directory at project root:
- Markdown documents for human readability
- `index.json` for AI fast query and filtering

See `references/data-model.md` for full specification.

## Commands

| Command | Purpose |
|---------|---------|
| `/codepoint-scan` | Scan existing codebase, identify business flows, suggest probe locations |
| `/codepoint-plan` | Plan code points for a new feature being developed |
| `/codepoint-test-plan` | Generate structured test plans with probe snippets (D-01–D-10) for a flow |
| `/codepoint-implement` | Execute probe insertion with TDD-style automated verification |

## Quick Start

### For Existing Codebase

1. Run `/codepoint-scan` to analyze your codebase
2. Review the generated collection/flow/point documents
3. Run `/codepoint-test-plan` to create test plans for each flow
4. Run `/codepoint-implement` to insert probes and verify

### For New Feature Development

1. Run `/codepoint-plan` with your feature spec or design document
2. Review the proposed code points
3. Run `/codepoint-test-plan` to generate test plans before implementation
4. After feature implementation, run `/codepoint-implement` to insert and verify

## Toggle Mechanism

File-based toggle (same as V1):

| Language | Enable | Disable |
|----------|--------|---------|
| Go | `touch ~/.codepoint/.codepoint-go` | `rm ~/.codepoint/.codepoint-go` |
| TypeScript/JS | `touch ~/.codepoint/.codepoint-ts` | `rm ~/.codepoint/.codepoint-ts` |
| Python | `touch ~/.codepoint/.codepoint-python` | `rm ~/.codepoint/.codepoint-python` |

## Storage Structure

```
.codepoints/
├── index.json                  # Global index
├── collections/
│   └── user-management.md
├── flows/
│   ├── user-login.md
│   └── user-register.md
├── points/
│   ├── cp-auth-check.md
│   └── cp-login-entry.md
├── test-plans/
│   └── user-login-test-plan.md
└── verification/
    └── user-login-verify.md
```

## Probe Output Format (V2)

Each probe outputs structured JSON:

```json
{
  "point_id": "cp-auth-check",
  "flow_id": "flow-user-login",
  "timestamp": "2026-04-18T10:30:00.000Z",
  "stack": ["main.handleLogin", "auth.Check"],
  "metadata": {}
}
```

## Key Principles

1. Code points are independent — they belong to flows through reference, not ownership
2. Business flows define ordered sequences of code points
3. Every probe must be verified — no unverified probes in the collection
4. Code point density matters — validate with overlap analysis (target 20%-60%)
5. The collection is a living document — update when architecture changes

## index.json Schema

All codepoint data is indexed in `.codepoints/index.json`. Downstream skills (`/codepoint-scan`, `/codepoint-plan`, `/codepoint-test-plan`, `/codepoint-implement`) read and write this file. The canonical example lives at `templates/index.json`.

### Top-Level Fields

| Field | Type | Description |
|-------|------|-------------|
| `version` | string | Schema version, e.g. `"2.0"` |
| `project` | string | Project identifier |
| `language` | string | Primary language: `go`, `python`, `typescript` |
| `created` | string | ISO date the index was created |
| `updated` | string | ISO date the index was last modified |
| `collections` | array | Collection objects (see below) |
| `flows` | array | Flow objects (see below) |
| `points` | array | Code point objects (see below) |

### Collection

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier, format `col-{slug}` |
| `name` | string | Human-readable name |
| `description` | string | What this collection covers |
| `created` | string | ISO creation date |

Template placeholders: `{{COLLECTION_ID}}`, `{{COLLECTION_NAME}}`, `{{COLLECTION_DESCRIPTION}}`

### Flow

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier, format `flow-{slug}` |
| `name` | string | Human-readable name |
| `collection_id` | string | Foreign key → `collections[].id` |
| `trigger` | string | What initiates this flow (e.g. `POST /api/login`) |
| `sequence` | array[string] | Ordered list of `points[].id` values |
| `test_cases` | object | `{ normal: [...], boundary: [...], failure: [...] }` |
| `status` | string | Implementation state: `active`, `implemented`, `verified` |

Template placeholders: `{{FLOW_ID}}`, `{{FLOW_NAME}}`, `{{FLOW_TRIGGER}}`, `{{COLLECTION_ID}}`, `{{CP_ID}}`, `{{CP_TYPE}}`, `{{CP_LOCATION}}`

### Point

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier, format `cp-{slug}` |
| `name` | string | Human-readable name |
| `type` | string | One of: `entry`, `boundary`, `state-change`, `concurrency`, `error` |
| `location` | string | File path and line, e.g. `src/auth/handler.go:42` |
| `language` | string | Probe language: `go`, `python`, `typescript` |
| `description` | string | What this probe observes |
| `enabled` | boolean | Whether the probe is active (required by `/codepoint-implement`) |
| `used_in_flows` | array[string] | Foreign keys → `flows[].id` |

Template placeholders: `{{POINT_ID}}`, `{{POINT_TYPE}}`, `{{LANGUAGE}}`, `{{FILE_PATH}}`, `{{LINE_NUMBER}}`, `{{POINT_DESCRIPTION}}`, `{{FLOW_ID}}`, `{{STEP_NUMBER}}`

### Cross-Reference Integrity

- Every `flow.collection_id` must exist in `collections[].id`
- Every entry in `flow.sequence` must exist in `points[].id`
- Every entry in `point.used_in_flows` must exist in `flows[].id`

## Language Support

See language-specific reference files:
- Go: `references/golang.md`
- Python: `references/python.md`
- TypeScript/JS: `references/frontend.md`