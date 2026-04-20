---
name: codepoint-run
description: >
  Orchestration skill that chains all codepoint sub-skills into a single guided workflow.
  Automatically detects entry point (existing codebase starts with scan, new feature starts with plan),
  resumes from the last completed step by checking for artifacts, tracks progress, and handles errors
  with continuation prompts. Triggers on: "codepoint run", "codepoint-run", "run codepoint",
  "full codepoint", "codepoint workflow", "codepoint pipeline", "run full codepoint",
  "complete codepoint", "codepoint end to end", "代码点全流程", "埋点全流程".
---

# Code Point Run — Full Orchestration Workflow

## Overview

This skill orchestrates the complete codepoint workflow by chaining all 6 sub-skills in dependency order.
It supports two entry points based on project context, detects existing artifacts for resumption,
tracks progress through each phase, and handles errors gracefully.

## Entry Points

### Entry Point A: Existing Codebase

Use when adding observability to an existing project with running code.

```
scan → instrument → test-plan → implement → verify
```

**Detection rule**: Project has source code (go.mod, package.json, requirements.txt, etc.) but
no `.codepoints/` directory or an empty/missing `index.json`.

### Entry Point B: New Feature

Use when planning code points alongside a new feature before or during implementation.

```
plan → instrument → test-plan → implement → verify
```

**Detection rule**: User provides a feature spec, design document, or describes a new feature.
The `.codepoints/` directory may or may not exist.

### Automatic Detection

If the user does not specify an entry point:

1. Check if `.codepoints/index.json` exists with content
2. If **no** — check for project source files (go.mod, package.json, etc.)
   - Source files found → **Entry Point A** (existing codebase)
   - No source files → ask user to clarify
3. If **yes** — check if the user mentions a "new feature", "plan", or provides a spec
   - New feature context → **Entry Point B**
   - Otherwise → **Entry Point A** (continue scanning/existing work)

## Pipeline Stages

### Stage 1: Scan (Entry Point A only)

**Skill**: `/codepoint-scan`
**Output artifacts**:
- `.codepoints/index.json` — collections, flows, and points
- `.codepoints/collections/*.md` — collection documents
- `.codepoints/flows/*.md` — flow documents
- `.codepoints/points/*.md` — point documents

**Resumption check**: If `.codepoints/index.json` exists with `collections` and `flows` arrays,
Stage 1 is already complete. Skip to Stage 2.

**On error**: Report scan failure details. Prompt:
> Scan failed: {error_summary}. Options:
> 1. Retry scan with adjusted scope
> 2. Skip to manual plan entry (`/codepoint-plan`)
> 3. Abort workflow

### Stage 2: Plan (Entry Point B only)

**Skill**: `/codepoint-plan`
**Output artifacts**:
- `.codepoints/index.json` — updated with planned points
- `.codepoints/collections/*.md` — new or updated collection documents
- `.codepoints/flows/*.md` — new flow documents
- `.codepoints/points/*.md` — new point documents

**Resumption check**: If `.codepoints/index.json` contains points matching the described feature
(i.e., `points[].name` references match the feature context), Stage 2 is already complete. Skip to Stage 3.

**On error**: Report plan failure details. Prompt:
> Plan failed: {error_summary}. Options:
> 1. Retry with a more detailed spec
> 2. Switch to scan mode (if code now exists)
> 3. Abort workflow

### Stage 3: Instrument

**Skill**: `/codepoint-instrument`
**Depends on**: Stage 1 or Stage 2 completion (points must exist in index.json)
**Output artifacts**:
- `.codepoints/instrumentation/{flow-id}-instrumentation.md` — per-flow instrumentation plans

**Resumption check**: If `.codepoints/instrumentation/` directory exists with at least one
`*-instrumentation.md` file matching each flow in `index.json`, Stage 3 is complete. If only
some flows have instrumentation plans, resume by generating plans for the remaining flows.

**On error**: Report instrumentation failure. Prompt:
> Instrumentation planning failed for flow {flow-id}: {error_summary}. Options:
> 1. Retry with adjusted coverage settings
> 2. Skip this flow and continue with others
> 3. Abort workflow

### Stage 4: Test Plan

**Skill**: `/codepoint-test-plan`
**Depends on**: Stage 3 (instrumentation plans define metadata contracts for test cases)
**Output artifacts**:
- `.codepoints/test-plans/{flow-id}-test-plan.md` — per-flow test plans

**Resumption check**: If `.codepoints/test-plans/` directory exists with at least one
`*-test-plan.md` file matching each flow, Stage 4 is complete. If only some flows have
test plans, resume by generating plans for the remaining flows.

**On error**: Report test plan failure. Prompt:
> Test plan generation failed for flow {flow-id}: {error_summary}. Options:
> 1. Retry with adjusted scenarios
> 2. Skip this flow and continue with others
> 3. Abort workflow

### Stage 5: Implement

**Skill**: `/codepoint-implement`
**Depends on**: Stage 4 (test plans define verification criteria)
**Output artifacts**:
- Source files with inserted probe code
- Updated `.codepoints/index.json` with `enabled: true` for implemented points
- `.codepoints/verification/{flow-id}-verify.md` — basic verification report (Phase 3 of implement)

**Resumption check**: If all points in `index.json` have `enabled: true`, Stage 5 is complete.
If some points are enabled and others are not, resume by implementing the remaining points.

**On error**: Report implementation failure. Prompt:
> Implementation failed for {point_id}: {error_summary}. Options:
> 1. Retry with adjusted probe location
> 2. Skip this probe and continue with remaining
> 3. Abort workflow

### Stage 6: Verify

**Skill**: `/codepoint-verify`
**Depends on**: Stage 5 (probes must be implemented and tests run)
**Output artifacts**:
- `.codepoints/verification/{flow-id}-verify.md` — detailed verification report
- Updated `.codepoints/index.json` with flow `status: "verified"` on PASS

**Resumption check**: If all flows in `index.json` have `status: "verified"`, Stage 6 is complete.
If some flows are verified and others are not, resume by verifying the remaining flows.

**On error**: Report verification failure. Prompt:
> Verification failed for flow {flow-id}: {error_summary}. Options:
> 1. View detailed report and fix issues
> 2. Re-run `/codepoint-implement` for this flow
> 3. Accept current state with known gaps
> 4. Abort workflow

## Progress Tracking

After each stage completes, output a progress summary:

```
## Codepoint Workflow Progress

| Stage | Status | Artifacts |
|-------|--------|-----------|
| Scan | ✅ Complete | 3 collections, 7 flows, 18 points |
| Plan | — Skipped | (existing codebase entry) |
| Instrument | ✅ Complete | 7 instrumentation plans |
| Test Plan | ✅ Complete | 7 test plans |
| Implement | 🔄 In Progress | 12/18 probes enabled |
| Verify | ⬜ Pending | — |
```

Status indicators:
- `✅ Complete` — Stage finished successfully
- `🔄 In Progress` — Stage is currently executing
- `⬜ Pending` — Stage has not started
- `— Skipped` — Stage not applicable for this entry point
- `❌ Failed` — Stage encountered an error (see error prompt above)

## Resumption Logic

When the skill is triggered and artifacts already exist:

1. **Read `.codepoints/index.json`** to determine current state
2. **Check each stage's artifacts** in reverse dependency order (Stage 6 → 1)
3. **Find the first incomplete stage** — that's where to resume
4. **Report resumption** to the user:
   > Resuming codepoint workflow at Stage {N} ({stage_name}). Previous stages have artifacts:
   > {list of found artifacts}

If the user explicitly requests starting from scratch:

> Warning: This will overwrite existing codepoint artifacts. Confirm?
> 1. Yes — start fresh (delete `.codepoints/` and begin from Stage 1)
> 2. No — resume from last checkpoint

## Error Handling

### Stage-Level Errors

Each stage can fail independently. The workflow:

1. Reports the specific error with context
2. Presents continuation options (retry / skip / abort)
3. Waits for user decision before proceeding
4. Continues from the failed stage (does not restart from the beginning)

### Cross-Stage Errors

If a stage fails because an upstream artifact is corrupted or missing:

1. Identify the corrupted/missing artifact
2. Offer to re-run the upstream stage that produced it
3. After re-running the upstream stage, continue from the failed stage

### User Interruption

If the user interrupts the workflow (e.g., closes the session):

1. Artifacts produced so far are preserved in `.codepoints/`
2. Next invocation of `/codepoint-run` will detect existing artifacts and resume
3. Progress tracking summary shows what was completed

## Workflow Diagram

### Existing Codebase Path

```
/codepoint-run (existing codebase)
│
├─ Stage 1: /codepoint-scan
│  └─ Phase 1: Overview scan
│  └─ Phase 2: Deep dive (user selects modules)
│  └─ Output: index.json, collections/, flows/, points/
│
├─ Stage 3: /codepoint-instrument
│  └─ Step 1-6: Analyze coverage, prioritize, define metadata
│  └─ Output: instrumentation/*.md
│
├─ Stage 4: /codepoint-test-plan
│  └─ Step 1-6: Map flows to scenarios, write test cases
│  └─ Output: test-plans/*.md
│
├─ Stage 5: /codepoint-implement
│  └─ Red: Confirm probe plan
│  └─ Green: Insert probe code
│  └─ Verify: Run tests, basic validation
│  └─ Output: source files with probes, verification/*.md
│
└─ Stage 6: /codepoint-verify
   └─ Step 1-7: Validate sequence, completeness, metadata, coverage
   └─ Output: verification/*.md, index.json status=verified
```

### New Feature Path

```
/codepoint-run (new feature)
│
├─ Stage 2: /codepoint-plan
│  └─ Step 1-6: Analyze spec, identify flows, place points
│  └─ Output: index.json, collections/, flows/, points/
│
├─ Stage 3: /codepoint-instrument
│  └─ (same as above)
│
├─ Stage 4: /codepoint-test-plan
│  └─ (same as above)
│
├─ Stage 5: /codepoint-implement
│  └─ (same as above)
│
└─ Stage 6: /codepoint-verify
   └─ (same as above)
```

## Output Summary

When the workflow completes successfully:

```
## Codepoint Workflow Complete ✅

| Metric | Value |
|--------|-------|
| Collections | {count} |
| Flows | {count} |
| Code Points | {count} |
| Instrumentation Plans | {count} |
| Test Plans | {count} |
| Implemented Probes | {count} |
| Verified Flows | {count} |

### Artifacts
- `.codepoints/index.json` — master index (all flows: status=verified)
- `.codepoints/collections/` — {count} collection documents
- `.codepoints/flows/` — {count} flow documents
- `.codepoints/points/` — {count} point documents
- `.codepoints/instrumentation/` — {count} instrumentation plans
- `.codepoints/test-plans/` — {count} test plans
- `.codepoints/verification/` — {count} verification reports

### Next Steps
- Probes are implemented but disabled by default (zero production overhead)
- Enable probes with the toggle mechanism when debugging is needed
- Run `/codepoint-verify` anytime to re-validate after code changes
```

## Usage

User triggers this skill with `/codepoint-run`. The AI then:

1. Detects the entry point (existing codebase or new feature)
2. Checks for existing artifacts to determine resumption point
3. Executes each stage in order, skipping completed stages
4. Reports progress after each stage
5. Handles errors with continuation prompts
6. Outputs a final summary when all stages complete

### Example Invocations

- `/codepoint-run` — Auto-detect entry point, resume from last checkpoint
- `/codepoint-run --existing` — Force existing codebase path
- `/codepoint-run --new-feature "user authentication flow"` — Force new feature path with spec
- `/codepoint-run --from instrument` — Resume from Stage 3 specifically
- `/codepoint-run --fresh` — Delete existing artifacts and start over

## Important Notes

- This skill orchestrates — it does **not** modify files directly. Each stage delegates to its
  respective sub-skill which handles the actual file I/O
- Artifacts are cumulative — each stage adds files without removing previous stage outputs
- The workflow is idempotent — running it again after completion detects all artifacts and
  reports "Workflow already complete"
- Stage 3 (instrument) is always executed regardless of entry point — it reads index.json
  and generates plans for all defined points, whether they came from scan or plan
