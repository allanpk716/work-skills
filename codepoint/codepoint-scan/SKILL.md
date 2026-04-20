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

After creating the file, commit:
```bash
git add plugins/codepoint/skills/scan/SKILL.md
git commit -m "feat(codepoint): add scan skill for existing codebase analysis

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```