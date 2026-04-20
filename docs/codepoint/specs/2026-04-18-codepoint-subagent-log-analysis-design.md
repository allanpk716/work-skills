# Codepoint Skill: Automated Log Analysis via Sub-Agent

**Date**: 2026-04-18
**Status**: Approved

## Summary

Add Phase 7 to the codepoint skill's workflow: after test execution completes in Phase 6, automatically dispatch a `general-purpose` sub-agent to read and analyze codepoint log files. The sub-agent extracts key findings, diagnoses problems against source code, and returns a structured diagnostic report with fix suggestions. The main agent presents findings to the user for decision.

## Design Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Trigger mechanism | Automatic, built into debug flow | User requested it as an integral part of the debugging workflow |
| Analysis depth | Extract + Diagnose + Fix suggestions | Full value chain — from raw logs to actionable fixes |
| Context passing | Medium: log paths + problem description + source file list | Sufficient for diagnosis without bloating the sub-agent prompt |
| Sub-agent type | `general-purpose` (reused) | No need for a custom agent type; prompt template handles specialization |
| Approach | New Phase 7 after existing Phase 6 | Natural extension of the phased workflow structure |

## Changes

### Change 1: Add Phase 7 section to SKILL.md

Insert after Phase 6 (Capture and Feed to AI):

```markdown
### Phase 7: Automated Log Analysis (Sub-Agent)

After completing test steps in Phase 6, automatically dispatch a sub-agent to analyze the captured codepoint logs.

**Trigger**: Test execution completed (user confirms or process exits).

**Steps**:

1. **Discover latest logs** using the Auto-Discovery pattern (Phase 6 / Auto-Discovery section)
2. **Gather context**:
   - Log file paths (support multi-language logs for full-stack projects)
   - Problem description from Phase 1 (the execution paths being investigated)
   - Source files explored during Phase 1-5
3. **Dispatch a `general-purpose` sub-agent** with the prompt template below
4. **Present findings** to the user — they decide whether to act on fix suggestions

**Sub-Agent Prompt Template**:

[HARD-GATE: Read-only analysis. The sub-agent must NOT modify any source files. It only reads logs and source code to produce a diagnostic report.]

You are a codepoint log analysis agent. Complete these tasks:

1. **Read log files**: {log_paths}
   - Parse all [CODEPOINT] entries
   - Extract trigger sequence and timing

2. **Extract key findings**:
   - Code point trigger sequence vs expected sequence
   - Exceptions / error call chains
   - Concurrency issues (goroutine/thread interleaving, lock contention)
   - Async chain breaks (expected code points never reached)

3. **Cross-reference with source files**: {source_files}
   - Match call stacks in logs against actual source logic
   - Identify execution path mismatches

4. **Produce diagnostic report** in this format:

   ## Execution Path Summary
   - Triggered / expected code points count
   - Whether execution path matches expectations

   ## Issues Found
   | # | Severity | Code Point | Location | Description |
   |---|----------|------------|----------|-------------|

   ## Root Cause Analysis
   [Per-issue root cause explanation]

   ## Fix Suggestions
   [Code-level fix proposals]

**Problem context**: {problem_description}

**Important**: This is a read-only analysis. Do NOT modify any files.

**Full-stack projects**: Read all relevant language logs (cp-go-*.log, cp-ts-*.log, cp-python-*.log) together to trace the complete request lifecycle.
```

### Change 2: Update Workflow Phase overview

Add Phase 7 description to the Workflow section's phase listing so the full workflow reads Phase 1 through Phase 7.

## Files Modified

| File | Change |
|------|--------|
| `~/.claude/skills/codepoint/SKILL.md` | Add Phase 7 section after Phase 6; update Workflow phase overview |

## Out of Scope

- Language reference files (golang.md, frontend.md, python.md) — no changes needed
- Toggle mechanism — unchanged
- Auto-Discovery section — unchanged, Phase 7 reuses its logic
- Sub-agent agent type registration — reusing `general-purpose`
