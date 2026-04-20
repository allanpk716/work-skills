# 代码点技能 V2 重构实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将代码点技能从独立的运行时探针重构为集合化的代码库扫描、埋点规划、TDD 验收闭环系统。

**Architecture:** 三层数据模型（代码点独立 → 流程引用组合 → 集合分组），四个独立技能命令（scan/plan/implement/主入口），Markdown 文档 + JSON 索引双存储，探针代码模板升级支持 point_id 和 flow_id。

**Tech Stack:** Claude Code 技能系统（SKILL.md + plugin.json），Go/Python/TypeScript 探针代码模板

---

## File Structure

```
plugins/codepoint/
├── .claude-plugin/
│   └── plugin.json              # 更新版本号和技能注册
├── skills/
│   ├── codepoint/
│   │   └── SKILL.md             # 主入口技能
│   ├── scan/
│   │   └── SKILL.md             # 扫描已有代码
│   ├── plan/
│   │   └── SKILL.md             # 规划新功能埋点
│   └── implement/
│       └── SKILL.md             # 执行埋点+验收
├── references/
│   ├── data-model.md            # 数据模型规范（新增）
│   ├── golang.md                # Go 探针模板 V2
│   ├── python.md                # Python 探针模板 V2
│   └── frontend.md              # TS/JS 探针模板 V2
└── templates/
    ├── index.json               # index.json 模板
    ├── collection.md            # 集合文档模板
    ├── flow.md                  # 流程文档模板
    ├── point.md                 # 代码点文档模板
    └── verification.md          # 验收报告模板
```

旧文件 `plugins/codepoint/SKILL.md` 删除，所有内容分散到 skills/ 子目录中。

---

### Task 1: 创建目录结构和数据模型规范

**Files:**
- Create: `plugins/codepoint/references/data-model.md`
- Create: `plugins/codepoint/templates/index.json`
- Create: `plugins/codepoint/templates/collection.md`
- Create: `plugins/codepoint/templates/flow.md`
- Create: `plugins/codepoint/templates/point.md`
- Create: `plugins/codepoint/templates/verification.md`

- [ ] **Step 1: 创建 templates 和 skills 子目录**

```bash
mkdir -p plugins/codepoint/skills/codepoint
mkdir -p plugins/codepoint/skills/scan
mkdir -p plugins/codepoint/skills/plan
mkdir -p plugins/codepoint/skills/implement
mkdir -p plugins/codepoint/templates
```

- [ ] **Step 2: 创建数据模型规范**

Create `plugins/codepoint/references/data-model.md`:

```markdown
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
```

- [ ] **Step 3: 创建 index.json 模板**

Create `plugins/codepoint/templates/index.json`:

```json
{
  "version": "2.0",
  "project": "{{PROJECT_NAME}}",
  "language": "{{LANGUAGE}}",
  "created": "{{DATE}}",
  "updated": "{{DATE}}",
  "collections": [],
  "flows": [],
  "points": []
}
```

- [ ] **Step 4: 创建集合文档模板**

Create `plugins/codepoint/templates/collection.md`:

```markdown
# Collection: {{COLLECTION_NAME}}

> ID: `{{COLLECTION_ID}}`
> Created: {{DATE}}

## Overview

{{COLLECTION_DESCRIPTION}}

## Flows

| Flow ID | Name | Trigger |
|---------|------|---------|
| {{FLOW_ID}} | {{FLOW_NAME}} | {{FLOW_TRIGGER}} |

## Notes

{{NOTES}}
```

- [ ] **Step 5: 创建流程文档模板**

Create `plugins/codepoint/templates/flow.md`:

```markdown
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
```

- [ ] **Step 6: 创建代码点文档模板**

Create `plugins/codepoint/templates/point.md`:

```markdown
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
```

- [ ] **Step 7: 创建验收报告模板**

Create `plugins/codepoint/templates/verification.md`:

```markdown
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
```

- [ ] **Step 8: Commit**

```bash
git add plugins/codepoint/references/data-model.md plugins/codepoint/templates/
git commit -m "feat(codepoint): add V2 data model spec and document templates"
```

---

### Task 2: 创建主入口技能 SKILL.md

**Files:**
- Create: `plugins/codepoint/skills/codepoint/SKILL.md`

- [ ] **Step 1: 创建主入口技能文件**

Create `plugins/codepoint/skills/codepoint/SKILL.md`:

```markdown
---
name: codepoint
description: >
  Code point V2 skill — collection-based runtime observability for AI-assisted development.
  Provides three core capabilities: scan existing code to identify business flows and probe locations,
  plan code points for new features, and implement probes with TDD-style automated verification.
  Triggers on: "code point", "代码点", "埋点", "codepoint", "runtime probe", "codepoint scan",
  "codepoint plan", "codepoint implement", "扫描代码点", "规划埋点", "埋点验收".
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
| `/codepoint-implement` | Execute probe insertion with TDD-style automated verification |

## Quick Start

### For Existing Codebase

1. Run `/codepoint-scan` to analyze your codebase
2. Review the generated collection/flow/point documents
3. Run `/codepoint-implement` to insert probes and verify

### For New Feature Development

1. Run `/codepoint-plan` with your feature spec or design document
2. Review the proposed code points
3. After feature implementation, run `/codepoint-implement` to insert and verify

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

## Language Support

See language-specific reference files:
- Go: `references/golang.md`
- Python: `references/python.md`
- TypeScript/JS: `references/frontend.md`
```

- [ ] **Step 2: Commit**

```bash
git add plugins/codepoint/skills/codepoint/SKILL.md
git commit -m "feat(codepoint): add V2 main entry skill"
```

---

### Task 3: 创建 scan 技能 SKILL.md

**Files:**
- Create: `plugins/codepoint/skills/scan/SKILL.md`

- [ ] **Step 1: 创建扫描技能文件**

Create `plugins/codepoint/skills/scan/SKILL.md`:

```markdown
---
name: codepoint-scan
description: >
  Scan existing codebase to identify business flows, functional modules, and optimal probe locations.
  Two-phase approach: Phase 1 generates an overview of all modules and candidate flows,
  Phase 2 deep-dives into user-selected modules to define specific code points.
  Triggers on: "codepoint scan", "扫描代码点", "代码点扫描", "scan codepoint", "代码点分析".
---

# Code Point Scan — Analyze Existing Codebase

## Overview

Two-phase scanning process:

1. **Phase 1 (Overview)**: Scan directory structure, entry points, routes → identify all modules and business areas → output candidate collections and flows for user review
2. **Phase 2 (Deep Dive)**: User selects modules to analyze → trace code execution paths → determine code point locations → generate full `.codepoints/` directory structure

## Phase 1: Overview Scan

### Steps

1. **Detect project type**
   - Check for language indicators: `go.mod`, `package.json`, `requirements.txt`, `pyproject.toml`
   - Check for framework indicators: `net/http`, `gin`, `echo` (Go); `express`, `fastapi`, `django` (Python/TS)
   - Determine primary language and framework

2. **Scan directory structure**
   - List top-level directories and their purpose
   - Identify entry points: `main.go`, `app.py`, `index.ts`, `cmd/`, `src/`
   - Identify route definitions: `routes/`, `handlers/`, `controllers/`, `api/`

3. **Identify business areas**
   - Group related handlers/controllers/services into business areas
   - Each business area is a candidate Collection
   - Each route/handler chain is a candidate Flow

4. **Generate overview document**
   - Output a summary of all discovered modules, their relationships, and candidate flows
   - Present to user for review and confirmation

### Output Format

Present the overview as a structured list:

```
## Discovered Collections

### col-user-management (User Management)
- flow-user-login: POST /api/login → auth.check → session.create
- flow-user-register: POST /api/register → validate → user.create
- flow-user-update: PUT /api/users/:id → auth.check → validate → user.update

### col-order-system (Order System)
- flow-order-create: POST /api/orders → validate → price → save → event
- flow-order-cancel: DELETE /api/orders/:id → auth.check → status.check → cancel

## Pending User Confirmation

Please review:
1. Are the collection groupings correct?
2. Are any business areas missing?
3. Which collections should we deep-dive into first?
```

## Phase 2: Deep Dive Scan

### Steps

1. **Select target module** — Based on user's Phase 1 confirmation

2. **Trace execution paths**
   - For each Flow in the selected Collection:
     - Read the entry point handler/controller function
     - Trace function calls through service layer, repository layer, external calls
     - Identify module boundaries, state changes, concurrency points, error paths
   - Record file paths and line numbers for each key location

3. **Determine code point locations**
   - At each traced location, evaluate if a code point is needed based on type:
     - `entry`: Function/flow entry point
     - `boundary`: Cross-module handoff (service → repo, controller → service)
     - `state-change`: State mutation (before/after)
     - `concurrency`: Lock/async/goroutine junction
     - `error`: Error handling path
   - Check density: adjacent points should have 20-60% stack overlap

4. **Generate code point definitions**
   - Assign IDs following convention: `cp-{module}-{action}-{position}`
   - Record: id, location (file:line), description, type, language

5. **Write `.codepoints/` structure**
   - Create `index.json` with all collections, flows, and points
   - Create `collections/{name}.md` for each collection
   - Create `flows/{name}.md` for each flow
   - Create `points/{id}.md` for each code point

### Code Point Naming Convention

```
cp-{module}-{action}-{position}

Examples:
cp-auth-check-entry        # Entry to auth check
cp-order-validate-after    # After order validation
cp-user-save-before        # Before user save
cp-payment-charge-error    # Payment charge error path
```

## Density Validation

After placing code points, validate density:

- Run overlap analysis on adjacent points in each flow
- Too dense (>80% overlap): flag for removal
- Too sparse (0% overlap): flag for intermediate points
- Good range: 20-60% overlap

## Usage

User triggers this skill, then:

1. AI performs Phase 1 scan automatically
2. User reviews and confirms/adjusts the overview
3. User selects which collections to deep-dive
4. AI performs Phase 2 for each selected collection
5. User reviews generated code point definitions
6. AI writes `.codepoints/` directory structure

After scan is complete, user can proceed with `/codepoint-implement` to insert the probes.
```

- [ ] **Step 2: Commit**

```bash
git add plugins/codepoint/skills/scan/SKILL.md
git commit -m "feat(codepoint): add scan skill for existing codebase analysis"
```

---

### Task 4: 创建 plan 技能 SKILL.md

**Files:**
- Create: `plugins/codepoint/skills/plan/SKILL.md`

- [ ] **Step 1: 创建规划技能文件**

Create `plugins/codepoint/skills/plan/SKILL.md`:

```markdown
---
name: codepoint-plan
description: >
  Plan code points for a new feature being developed. Analyzes the feature's spec or design document
  to determine optimal probe locations, maps them to business flows, and generates a code point plan.
  Triggers on: "codepoint plan", "规划埋点", "新功能代码点", "plan codepoint", "代码点规划".
---

# Code Point Plan — New Feature Code Point Planning

## Overview

This skill is used during new feature development to plan code points before or alongside implementation.

### When to Use

- After a feature's spec/design is finalized (brainstorming, GSD spec phase, etc.)
- Before or during implementation — code points are part of the feature's deliverables
- When the feature involves complex logic: async, concurrent, multi-module, stateful

### When NOT to Use

- Simple CRUD endpoints with no business logic
- Pure UI changes with no backend interaction
- One-off scripts or utilities

## Planning Process

### Step 1: Analyze Feature Spec

Read the feature's design document, spec, or discuss with the user to understand:

1. **Business flows**: What are the main execution paths this feature introduces?
2. **Module interactions**: Which existing modules does this feature touch?
3. **Complexity areas**: Where are the concurrency, state, or error-prone zones?
4. **Integration points**: Where does this feature connect to external systems?

### Step 2: Identify Flows and Collections

For the new feature:

1. Define which Collection it belongs to (existing or new)
2. Break the feature into one or more Flows
3. For each Flow, define:
   - Entry point (how is this flow triggered?)
   - Key stages (what happens at each step?)
   - Exit point (what's the final state?)

### Step 3: Determine Code Points

For each Flow, place code points at:

| Location Type | Why | Example |
|---------------|-----|---------|
| `entry` | Know when the flow starts | Handler entry, event listener start |
| `boundary` | Track cross-module handoffs | Feature service → existing module |
| `state-change` | Catch state transitions | Before/after database write |
| `concurrency` | Detect race conditions | Before lock, after goroutine spawn |
| `error` | Capture failure paths | Error handler, validation failure |

### Step 4: Check Existing Points

Before creating new code points:

1. Read `.codepoints/index.json` (if exists)
2. Check if any existing code points are on paths this feature will use
3. Reuse existing points where the execution path overlaps
4. Only create new points for genuinely new code paths

### Step 5: Generate Plan Document

Output a plan containing:

```
## Code Point Plan: {{FEATURE_NAME}}

### Collection: {{COLLECTION_NAME}}
> {{EXISTING_OR_NEW}}

### Flow: {{FLOW_NAME}}
> Trigger: {{TRIGGER}}
> Sequence: {{CP_IDS}}

#### Code Points

| ID | Type | Location | Description |
|----|------|----------|-------------|
| cp-xxx | entry | src/xxx.go:42 | Entry point for ... |
| cp-xxx | boundary | src/xxx.go:58 | Handoff to ... |

#### Existing Points Reused
- cp-existing-xxx: Used in flow-xxx, also relevant here because ...

#### Test Case Outline
- Normal: {{description}}
- Boundary: {{description}}
- Failure: {{description}}
```

### Step 6: User Review

Present the plan to the user for confirmation:

1. Are the flow definitions correct?
2. Are the code point locations appropriate?
3. Are the test case outlines sufficient?

## Integration with Development Workflow

This skill is independent — it does not modify brainstorming, GSD, or other skills.

Typical usage:
1. User completes feature design (via brainstorming, GSD spec, etc.)
2. User calls `/codepoint-plan` with the feature spec
3. AI generates the code point plan
4. User implements the feature (with or without AI)
5. User calls `/codepoint-implement` to insert probes and verify

The code point plan can be stored alongside the feature's design documents for reference during implementation.
```

- [ ] **Step 2: Commit**

```bash
git add plugins/codepoint/skills/plan/SKILL.md
git commit -m "feat(codepoint): add plan skill for new feature code point planning"
```

---

### Task 5: 创建 implement 技能 SKILL.md

**Files:**
- Create: `plugins/codepoint/skills/implement/SKILL.md`

- [ ] **Step 1: 创建执行技能文件**

Create `plugins/codepoint/skills/implement/SKILL.md`:

```markdown
---
name: codepoint-implement
description: >
  Execute code point insertion with TDD-style automated verification. Three-phase process:
  Red (confirm plan) → Green (insert probe code) → Verify (run tests and validate output).
  Generates test cases for normal flow, boundary conditions, and failure modes.
  Triggers on: "codepoint implement", "执行代码点", "埋点验收", "implement codepoint",
  "代码点验证", "verify codepoint".
---

# Code Point Implement — TDD-Style Probe Insertion and Verification

## Overview

TDD-style three-phase loop:

```
Red    → Confirm the probe plan (what to insert, where)
Green  → Auto-generate probe code and insert at specified locations
Verify → Run tests, validate output, generate verification report
```

## Phase 1: Red — Plan Confirmation

### Steps

1. **Read the code point plan**
   - Check `.codepoints/index.json` for pending (unimplemented) code points
   - Or read a plan generated by `/codepoint-plan` or `/codepoint-scan`

2. **Present confirmation**
   - Show each code point to be inserted: ID, location, type, probe code
   - Highlight any potential issues (file not found, location changed since scan)

3. **Get user approval**
   - User confirms the plan as-is, or adjusts locations/code points

### Output

```
## Probe Insertion Plan

| # | Code Point | File:Line | Type | Action |
|---|-----------|-----------|------|--------|
| 1 | cp-auth-entry | src/auth/handler.go:42 | entry | INSERT |
| 2 | cp-auth-check | src/auth/service.go:88 | boundary | INSERT |
| 3 | cp-auth-error | src/auth/handler.go:67 | error | INSERT |

Proceed with insertion? (User confirms)
```

## Phase 2: Green — Probe Code Generation and Insertion

### Steps

1. **Read language template**
   - Go: `references/golang.md` — use `PointWithMeta()` with point_id and flow_id
   - Python: `references/python.md` — use `point_json()` with point_id and flow_id
   - TypeScript: `references/frontend.md` — use `pointWithMeta()` with point_id and flow_id

2. **Generate probe code for each code point**

   For each point, generate a probe call that includes:
   - `point_id`: The unique code point ID
   - `flow_id`: The flow this point belongs to (primary flow)
   - Metadata: Any relevant context (user_id, request_id, etc.)

3. **Insert probe code into source files**
   - Read the target file
   - Insert the probe call at the specified line
   - Ensure proper import statement is added
   - Do NOT modify the existing logic — probes are additive only

4. **Update `.codepoints/index.json`**
   - Mark each code point as `enabled: true`
   - Record the actual insertion timestamp

### Probe Code Templates

#### Go

```go
// Before:
func (s *AuthService) Check(ctx context.Context, token string) (*User, error) {

// After insertion:
func (s *AuthService) Check(ctx context.Context, token string) (*User, error) {
    codepoint.PointWithMeta("cp-auth-check", map[string]any{
        "point_id": "cp-auth-check",
        "flow_id":  "flow-user-login",
    })
```

#### Python

```python
# Before:
def check_token(token: str) -> User:

# After insertion:
def check_token(token: str) -> User:
    point_json("cp-auth-check", {"point_id": "cp-auth-check", "flow_id": "flow-user-login"})
```

#### TypeScript

```typescript
// Before:
async function checkToken(token: string): Promise<User> {

// After insertion:
async function checkToken(token: string): Promise<User> {
  pointWithMeta('cp-auth-check', { point_id: 'cp-auth-check', flow_id: 'flow-user-login' });
```

## Phase 3: Verify — Automated Verification

### Steps

1. **Generate test cases**

   For each flow, generate three types of test cases:

   **Normal Flow Test:**
   - Trigger the flow normally
   - Verify all code points fire in the expected sequence
   - Verify each code point output contains complete stack trace
   - Verify the execution order matches the flow definition

   **Boundary Condition Tests:**
   - Test with empty inputs, max-length inputs, edge values
   - Verify code points still fire and capture relevant state
   - Verify no code point is skipped due to early return

   **Failure Mode Tests:**
   - Inject invalid data, simulate errors, trigger exception paths
   - Verify error-type code points fire
   - Verify stack traces include the error path
   - Verify the output is sufficient for automated diagnosis

2. **Run verification**

   ```bash
   # Enable code points
   touch ~/.codepoint/.codepoint-{{LANGUAGE}}

   # Run the test suite
   # Go: go test ./...
   # Python: pytest tests/
   # TypeScript: npm test

   # Collect code point output from ~/.codepoint/<project>/
   ```

3. **Analyze output**

   For each test case:
   - Read the code point log file
   - Check each code point in the flow fired (or intentionally didn't fire for error paths)
   - Validate stack traces are complete and meaningful
   - Compare actual execution order vs expected sequence

4. **Generate verification report**

   Write report to `.codepoints/verification/{flow-name}-verify.md` using the verification template.

   Report includes:
   - Per-code-point trigger status
   - Stack completeness check
   - Execution order validation
   - Boundary test results
   - Failure mode observability assessment
   - Overall PASS/FAIL verdict

5. **Present results to user**

   ```
   ## Verification Result: flow-user-login

   | Check | Status |
   |-------|--------|
   | All code points triggered (normal) | PASS |
   | Execution order correct | PASS |
   | Stacks complete | PASS |
   | Boundary cases captured | PASS |
   | Failure mode observable | PASS |
   | Overall | **PASS** |

   Report saved to .codepoints/verification/user-login-verify.md
   ```

## Verification Failure Handling

If verification fails:

1. **Missing code point**: Probe code not reached — check if insertion location is correct
2. **Wrong order**: Different execution path — update flow definition to match reality
3. **Incomplete stack**: Stack depth limit — increase buffer size in base library
4. **Failure not observable**: Error handled before reaching probe — move probe closer to error source

User decides whether to fix and re-verify, or accept the current state with known gaps.

## Integration with Development Workflow

Typical flow after feature implementation:

```
1. Feature code is written and tested (via normal dev workflow)
2. Run /codepoint-implement
3. Red phase: Review and confirm probe locations
4. Green phase: Probes auto-inserted into source files
5. Verify phase: Tests run, output validated, report generated
6. If PASS: Probes are production-ready (disabled by default, zero overhead)
7. If FAIL: Fix issues and re-run /codepoint-implement
```

## Important Notes

- Probes are **additive only** — they never modify existing logic
- Probes are **disabled by default** — zero overhead in production
- Verification tests are **generated alongside** the probes — commit them with the code
- The `.codepoints/` directory should be **committed to version control** — it's the team's runtime map
```

- [ ] **Step 2: Commit**

```bash
git add plugins/codepoint/skills/implement/SKILL.md
git commit -m "feat(codepoint): add implement skill with TDD-style verification"
```

---

### Task 6: 更新语言参考文件（探针模板 V2）

**Files:**
- Modify: `plugins/codepoint/references/golang.md`
- Modify: `plugins/codepoint/references/python.md`
- Modify: `plugins/codepoint/references/frontend.md`

- [ ] **Step 1: 更新 Go 参考文件**

在现有 `plugins/codepoint/references/golang.md` 的基础上，添加 V2 探针代码模板。

在文件末尾追加以下内容：

```markdown

---

## V2 Probe Templates (with point_id and flow_id)

V2 probes include `point_id` and `flow_id` in metadata, enabling collection-based querying.

### Updated PointWithMeta Pattern

```go
// V2 probe: includes point_id and flow_id for collection indexing
codepoint.PointWithMeta("cp-auth-check", map[string]any{
    "point_id": "cp-auth-check",
    "flow_id":  "flow-user-login",
})

// V2 probe with additional context
codepoint.PointWithMeta("cp-order-validate-after", map[string]any{
    "point_id": "cp-order-validate-after",
    "flow_id":  "flow-order-create",
    "order_id": order.ID,
    "status":   "validated",
})
```

### Full Flow Example (V2)

```go
func (s *OrderService) CreateOrder(ctx context.Context, req *CreateOrderReq) (*Order, error) {
    codepoint.PointWithMeta("cp-order-create-entry", map[string]any{
        "point_id": "cp-order-create-entry",
        "flow_id":  "flow-order-create",
    })

    validated, err := s.validate(req)
    codepoint.PointWithMeta("cp-order-after-validate", map[string]any{
        "point_id": "cp-order-after-validate",
        "flow_id":  "flow-order-create",
    })
    if err != nil {
        codepoint.PointWithMeta("cp-order-validate-error", map[string]any{
            "point_id": "cp-order-validate-error",
            "flow_id":  "flow-order-create",
            "error":    err.Error(),
        })
        return nil, err
    }

    priced, err := s.pricingEngine.Calculate(ctx, validated)
    codepoint.PointWithMeta("cp-order-after-price", map[string]any{
        "point_id": "cp-order-after-price",
        "flow_id":  "flow-order-create",
    })

    saved, err := s.repo.Save(ctx, priced)
    codepoint.PointWithMeta("cp-order-after-save", map[string]any{
        "point_id": "cp-order-after-save",
        "flow_id":  "flow-order-create",
        "order_id": saved.ID,
    })

    return saved, nil
}
```
```

- [ ] **Step 2: 更新 Python 参考文件**

在 `plugins/codepoint/references/python.md` 末尾追加 V2 模板：

```markdown

---

## V2 Probe Templates (with point_id and flow_id)

### Updated point_json Pattern

```python
from codepoint import point_json

# V2 probe: includes point_id and flow_id
point_json("cp-auth-check", {
    "point_id": "cp-auth-check",
    "flow_id": "flow-user-login",
})

# V2 probe with additional context
point_json("cp-order-validate-after", {
    "point_id": "cp-order-validate-after",
    "flow_id": "flow-order-create",
    "order_id": order.id,
    "status": "validated",
})
```

### Full Flow Example (V2)

```python
class OrderService:
    async def create(self, data: OrderCreate) -> Order:
        point_json("order-service-create-entry", {
            "point_id": "cp-order-create-entry",
            "flow_id": "flow-order-create",
        })

        validated = self._validate(data)
        point_json("order-service-after-validate", {
            "point_id": "cp-order-after-validate",
            "flow_id": "flow-order-create",
        })

        priced = await self.pricing.calculate(validated)
        point_json("order-service-after-price", {
            "point_id": "cp-order-after-price",
            "flow_id": "flow-order-create",
        })

        saved = await self.repo.save(priced)
        point_json("order-service-after-save", {
            "point_id": "cp-order-after-save",
            "flow_id": "flow-order-create",
            "order_id": saved.id,
        })

        return saved
```
```

- [ ] **Step 3: 更新 TypeScript 参考文件**

在 `plugins/codepoint/references/frontend.md` 末尾追加 V2 模板：

```markdown

---

## V2 Probe Templates (with point_id and flow_id)

### Updated pointWithMeta Pattern

```typescript
import { pointWithMeta } from '@/lib/codepoint';

// V2 probe: includes point_id and flow_id
pointWithMeta('cp-auth-check', {
  point_id: 'cp-auth-check',
  flow_id: 'flow-user-login',
});

// V2 probe with additional context
pointWithMeta('cp-order-validate-after', {
  point_id: 'cp-order-validate-after',
  flow_id: 'flow-order-create',
  order_id: order.id,
  status: 'validated',
});
```

### Full Flow Example (V2)

```typescript
class OrderService {
  async create(data: OrderCreate): Promise<Order> {
    pointWithMeta('cp-order-create-entry', {
      point_id: 'cp-order-create-entry',
      flow_id: 'flow-order-create',
    });

    const validated = this.validate(data);
    pointWithMeta('cp-order-after-validate', {
      point_id: 'cp-order-after-validate',
      flow_id: 'flow-order-create',
    });

    const priced = await this.pricing.calculate(validated);
    pointWithMeta('cp-order-after-price', {
      point_id: 'cp-order-after-price',
      flow_id: 'flow-order-create',
    });

    const saved = await this.repo.save(priced);
    pointWithMeta('cp-order-after-save', {
      point_id: 'cp-order-after-save',
      flow_id: 'flow-order-create',
      order_id: saved.id,
    });

    return saved;
  }
}
```
```

- [ ] **Step 4: Commit**

```bash
git add plugins/codepoint/references/golang.md plugins/codepoint/references/python.md plugins/codepoint/references/frontend.md
git commit -m "feat(codepoint): add V2 probe templates to language references"
```

---

### Task 7: 更新 plugin.json 和删除旧 SKILL.md

**Files:**
- Modify: `plugins/codepoint/.claude-plugin/plugin.json`
- Delete: `plugins/codepoint/SKILL.md`

- [ ] **Step 1: 更新 plugin.json**

Replace `plugins/codepoint/.claude-plugin/plugin.json` with:

```json
{
  "name": "codepoint",
  "description": "Collection-based runtime observability: scan codebases, plan probe locations, implement with TDD verification. Supports Go, Python, and TypeScript.",
  "version": "2.0.0",
  "author": {
    "name": "allanpk716",
    "email": "allanpk716@gmail.com"
  }
}
```

- [ ] **Step 2: 删除旧的单体 SKILL.md**

```bash
rm plugins/codepoint/SKILL.md
```

- [ ] **Step 3: Commit**

```bash
git add plugins/codepoint/.claude-plugin/plugin.json
git rm plugins/codepoint/SKILL.md
git commit -m "feat(codepoint): update to V2 multi-skill structure, remove legacy SKILL.md"
```

---

### Task 8: 更新 marketplace.json 版本号

**Files:**
- Modify: `.claude-plugin/marketplace.json`

- [ ] **Step 1: 更新 marketplace.json 中 codepoint 条目**

在 `.claude-plugin/marketplace.json` 中，将 codepoint 的 version 从 `1.0.0` 改为 `2.0.0`，description 同步更新：

```json
{
  "name": "codepoint",
  "description": "Collection-based runtime observability: scan codebases, plan probe locations, implement with TDD verification",
  "source": "./plugins/codepoint",
  "category": "development",
  "version": "2.0.0",
  "author": {
    "name": "allanpk716",
    "email": "allanpk716@gmail.com"
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add .claude-plugin/marketplace.json
git commit -m "chore(codepoint): bump marketplace version to 2.0.0"
```

---

### Task 9: 验证插件加载

**Files:** None (verification only)

- [ ] **Step 1: 验证目录结构正确**

```bash
find plugins/codepoint -type f | sort
```

Expected output should show:
```
plugins/codepoint/.claude-plugin/plugin.json
plugins/codepoint/references/data-model.md
plugins/codepoint/references/frontend.md
plugins/codepoint/references/golang.md
plugins/codepoint/references/python.md
plugins/codepoint/skills/codepoint/SKILL.md
plugins/codepoint/skills/scan/SKILL.md
plugins/codepoint/skills/plan/SKILL.md
plugins/codepoint/skills/implement/SKILL.md
plugins/codepoint/templates/collection.md
plugins/codepoint/templates/flow.md
plugins/codepoint/templates/index.json
plugins/codepoint/templates/point.md
plugins/codepoint/templates/verification.md
```

- [ ] **Step 2: 验证旧 SKILL.md 已删除**

```bash
test -f plugins/codepoint/SKILL.md && echo "ERROR: old SKILL.md still exists" || echo "OK: old SKILL.md removed"
```

Expected: `OK: old SKILL.md removed`

- [ ] **Step 3: 验证 plugin.json 版本**

```bash
cat plugins/codepoint/.claude-plugin/plugin.json | grep version
```

Expected: `"version": "2.0.0"`

- [ ] **Step 4: 验证技能可以被识别**

重启 Claude Code 或重新加载插件，检查 `/codepoint`、`/codepoint-scan`、`/codepoint-plan`、`/codepoint-implement` 命令是否可用。

---

## Self-Review

**1. Spec Coverage:**
- Data model (CodePoint/Flow/Collection): Task 1 (data-model.md), Task 2 (main SKILL.md)
- Two-phase scan: Task 3 (scan SKILL.md)
- New feature planning: Task 4 (plan SKILL.md)
- TDD implement loop: Task 5 (implement SKILL.md)
- Language templates V2: Task 6
- Plugin structure update: Task 7
- Marketplace update: Task 8
- Verification: Task 9

**2. Placeholder Scan:** No TBD/TODO found. All templates have concrete `{{PLACEHOLDER}}` format that is standard for template files.

**3. Type Consistency:**
- point_id format `cp-{module}-{action}-{position}` consistent across all files
- flow_id format `flow-{module}-{action}` consistent
- collection_id format `col-{module}` consistent
- JSON output format with `point_id`, `flow_id`, `timestamp`, `stack`, `metadata` consistent across all language templates
