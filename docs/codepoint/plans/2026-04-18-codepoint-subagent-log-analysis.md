# Codepoint Sub-Agent Log Analysis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Phase 7 to the codepoint skill — automatic sub-agent dispatch to analyze codepoint logs after test execution.

**Architecture:** Extend the existing Phase 1-6 workflow in SKILL.md with a new Phase 7 that defines when and how to dispatch a `general-purpose` sub-agent for log analysis, including a prompt template and output format.

**Tech Stack:** Markdown (SKILL.md only), Claude Code Agent tool

---

### Task 1: Insert Phase 7 section into SKILL.md

**Files:**
- Modify: `C:\Users\allan716\.claude\skills\codepoint\SKILL.md` (after line 159, before `## How Many Code Points`)

- [ ] **Step 1: Insert Phase 7 content after Phase 6**

Insert the following content after line 159 (the closing ` ``` ` of Phase 6's code block), before the blank line and `## How Many Code Points`:

```markdown

### Phase 7: Automated Log Analysis (Sub-Agent)

After completing test steps in Phase 6, automatically dispatch a sub-agent to analyze the captured codepoint logs. This phase is integral to the debugging workflow — not optional.

**Trigger**: Test execution completed (user confirms or process exits).

**Steps**:

1. **Discover latest logs** using the Auto-Discovery pattern (see Auto-Discovery section)
2. **Gather context**:
   - Log file paths (support multi-language logs for full-stack projects)
   - Problem description from Phase 1 (the execution paths being investigated)
   - Source files explored during Phase 1-5
3. **Dispatch a `general-purpose` sub-agent** with the prompt template below
4. **Present findings** to the user — they decide whether to act on fix suggestions

**Sub-Agent Prompt Template**:

> [HARD-GATE: Read-only analysis. The sub-agent must NOT modify any source files. It only reads logs and source code to produce a diagnostic report.]

```
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

**Placeholders explained**:
- `{log_paths}` — discovered log file paths, e.g. `~/.codepoint/my-api/cp-go-2026-04-18_10-30-00_123.log`
- `{source_files}` — list of source files explored in Phase 1-5
- `{problem_description}` — the debugging goal from Phase 1

**Sub-agent type**: Use `general-purpose` with the prompt above.

**After sub-agent returns**: Present the diagnostic report to the user. Ask whether they want to proceed with any of the fix suggestions. If yes, transition to implementation. If no, archive the report for reference.
```

- [ ] **Step 2: Verify the insertion**

Read lines 155-210 of the modified SKILL.md to confirm:
- Phase 6 content is intact (lines 147-159)
- Phase 7 follows immediately after
- `## How Many Code Points` comes after Phase 7
- No duplicate blank lines or broken formatting

- [ ] **Step 3: Commit**

```bash
cd C:/WorkSpace/agent/work-skills
git add docs/superpowers/specs/2026-04-18-codepoint-subagent-log-analysis-design.md
git commit -m "docs: add codepoint sub-agent log analysis design spec"
```

---

### Task 2: Update SKILL.md header description to reflect Phase 7

**Files:**
- Modify: `C:\Users\allan716\.claude\skills\codepoint\SKILL.md` (lines 3-12, frontmatter description)

- [ ] **Step 1: Update the frontmatter description**

In the YAML frontmatter, update the `description` field to mention automated log analysis. Change:

```yaml
description: >
  Runtime probe-driven development skill for placing "code points" (stack trace probes) at critical
  execution paths to give AI runtime visibility into your code. Use this skill whenever you need to:
  debug complex or concurrent bugs, understand execution flow in large codebases, set up runtime
  observability for AI-assisted development, or improve AI vibecoding efficiency. Works for Go,
  Frontend (JS/TS/React/Vue), and Python projects. Triggers on: "code point", "埋点", "代码点",
  "runtime probe", "stack trace probe", "add observability", "trace execution", "debug concurrency",
  "runtime tracing", "call stack capture", or any debugging/session where static code search (grep)
  isn't enough to understand what's happening at runtime. Also use when starting a new feature that
  involves complex async/concurrent logic, or when onboarding AI to an existing large codebase.
```

To:

```yaml
description: >
  Runtime probe-driven development skill for placing "code points" (stack trace probes) at critical
  execution paths to give AI runtime visibility into your code. After test execution, automatically
  dispatches a sub-agent to analyze codepoint logs, diagnose problems, and suggest fixes. Use this
  skill whenever you need to: debug complex or concurrent bugs, understand execution flow in large
  codebases, set up runtime observability for AI-assisted development, or improve AI vibecoding
  efficiency. Works for Go, Frontend (JS/TS/React/Vue), and Python projects. Triggers on:
  "code point", "埋点", "代码点", "runtime probe", "stack trace probe", "add observability",
  "trace execution", "debug concurrency", "runtime tracing", "call stack capture", "analyze log",
  "分析代码点日志", or any debugging/session where static code search (grep) isn't enough to
  understand what's happening at runtime. Also use when starting a new feature that involves complex
  async/concurrent logic, or when onboarding AI to an existing large codebase.
```

- [ ] **Step 2: Verify frontmatter is valid YAML**

Read the first 15 lines of SKILL.md to confirm the frontmatter parses correctly (starts with `---`, ends with `---`, no indentation issues).

- [ ] **Step 3: Commit**

```bash
cd C:/WorkSpace/agent/work-skills
git add -A
git commit -m "feat(codepoint): add Phase 7 automated sub-agent log analysis to skill workflow"
```

---

## Self-Review

**Spec coverage**: Both changes from the spec are covered — Phase 7 insertion (Change 1) and description update (Change 2 replaces the "Workflow phase overview" update since the phases are inline subsections).

**Placeholder scan**: No TBD, TODO, or vague steps. All code blocks contain actual content.

**Type consistency**: Not applicable — this is a documentation-only change to a skill markdown file.
