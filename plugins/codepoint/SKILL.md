---
name: codepoint
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
---

# Code Point — Runtime Probe Skill for AI-Assisted Development

## The Core Problem

AI coding assistants (Claude Code, Cursor, Copilot) work with **static source code text**. Their primary tool is search (grep, file reads). But the hardest bugs — race conditions, wrong async sequences, state machine transitions, deadlock — only manifest at **runtime**. No amount of grep will find them because they don't live in a single file; they live in the *interaction* between modules at execution time.

Code points bridge this gap: they capture **runtime call stacks** at critical locations and expose them as text that AI can consume.

## What Is a Code Point

A code point is a lightweight runtime probe placed at a strategically chosen location in the code. When enabled:

1. It captures the current call stack (who called this function, and who called that caller, etc.)
2. It outputs the stack as structured text to a log file
3. AI reads the log alongside the source code to understand the **real execution path**

When disabled (production), it costs exactly one boolean check — zero overhead.

## Toggle Mechanism (File-Based)

Code points use **file presence** as the toggle — no environment variables needed. The toggle files live in `~/.codepoint/`.

| Language | Enable | Disable | Toggle File |
|---|---|---|---|
| **Go** | `touch ~/.codepoint/.codepoint-go` | `rm ~/.codepoint/.codepoint-go` | `~/.codepoint/.codepoint-go` |
| **TypeScript / JS** | `touch ~/.codepoint/.codepoint-ts` | `rm ~/.codepoint/.codepoint-ts` | `~/.codepoint/.codepoint-ts` |
| **Python** | `touch ~/.codepoint/.codepoint-python` | `rm ~/.codepoint/.codepoint-python` | `~/.codepoint/.codepoint-python` |
| *Java* | `touch ~/.codepoint/.codepoint-java` | `rm ~/.codepoint/.codepoint-java` | `~/.codepoint/.codepoint-java` |
| *Rust* | `touch ~/.codepoint/.codepoint-rust` | `rm ~/.codepoint/.codepoint-rust` | `~/.codepoint/.codepoint-rust` |

**How it works**: At startup, the base library checks if the toggle file exists. If yes → enabled. If no → disabled. Every `point()` call starts with `if !enabled { return }` — one bool check, zero cost.

## Output Convention

All code point output goes to `~/.codepoint/<project-name>/` automatically, organized by project and timestamped.

**Output path**: `~/.codepoint/<project-dir-name>/cp-<lang>-YYYY-MM-DD_HH-MM-SS_mmm.log`

**Project name** is determined by the current working directory basename.

```
~/.codepoint/
├── .codepoint-go                                    # Go toggle
├── .codepoint-ts                                    # TS toggle
├── .codepoint-python                                # Python toggle
├── my-api/                                          # Go project
│   ├── cp-go-2026-04-17_15-30-45_123.log
│   └── cp-go-2026-04-17_16-22-10_456.log
├── frontend-dashboard/                              # Frontend project
│   └── cp-ts-2026-04-17_15-31-00_045.log
└── order-service/                                   # Python project
    └── cp-python-2026-04-17_15-32-15_789.log
```

The base library auto-creates directories and opens the log file on first use. No manual redirection needed.

## Full-Stack Projects (Backend + Frontend)

When the frontend is served by a backend — Go (via `go:embed`), Python (FastAPI/Flask/Django), or Node.js — the backend acts as a collector for browser code points:

1. Backend registers `POST /__codepoint__` — receives frontend stack traces
2. Frontend `point()` POSTs to this endpoint — auto-stops on 404 (zero overhead in production)
3. Same toggle file `~/.codepoint/.codepoint-ts` controls everything
4. All log files (`cp-go-*.log`, `cp-python-*.log`, `cp-ts-*.log`) land in `~/.codepoint/<project>/`

No build-time configuration needed. See `references/golang.md` (Frontend Collector), `references/python.md` (Frontend Collector), and `references/frontend.md` for implementation.

## When to Place Code Points

Place code points when:

- **Debugging concurrency issues** — race conditions, deadlocks, goroutine leaks, promise chains
- **Understanding complex call chains** — large codebases where tracing "who calls whom" across modules is hard
- **AI onboarding to legacy code** — give AI runtime context so it doesn't have to guess execution flow
- **New feature development with complex logic** — especially async/event-driven/stateful features
- **Performance profiling** — understanding which paths are hot at runtime

## The Workflow

### Phase 1: Identify Core Execution Paths

Before writing any code point, map the system's core execution paths. Ask yourself:

1. What are the 3-5 main workflows in this system? (e.g., HTTP request handling, database query, message consumption)
2. For each workflow, what are the key stages/phases?
3. Where are the module boundaries (where one component hands off to another)?
4. Where does concurrency/async happen?

Output: A list of paths, each with 5-10 key checkpoints.

### Phase 2: Select Probe Locations

For each execution path, place code points at:

| Location Type | Why | Example |
|---|---|---|
| **Entry points** | Know when a path starts | HTTP handler, message consumer, CLI command |
| **Module boundaries** | Track cross-module handoffs | Service → Repository, Controller → UseCase |
| **State transitions** | Catch wrong state machines | Before/after state changes |
| **Concurrency junctions** | Detect race conditions | Before lock acquire, after goroutine spawn |
| **Error paths** | Capture failure call chains | In error handlers, catch blocks |
| **Async boundaries** | Trace promise/callback chains | Before/after await, promise resolution |

### Phase 3: Implement the Base Library

Read the language-specific reference file for your project:

- **Go**: `references/golang.md`
- **Frontend (JS/TS)**: `references/frontend.md`
- **Python**: `references/python.md`

Each reference contains the complete base library implementation with file-based toggle detection and auto-output.

### Phase 4: Place Code Points

Follow these principles:

1. **Use descriptive names**: `http_request_entry`, `db_query_after_parse`, `user_service_before_save`
2. **Keep it minimal**: One line per point, no logging logic
3. **Gate with the enable switch**: The base library handles this, but confirm
4. **Tag by path**: Prefix names with the workflow (e.g., `order_create_*`, `payment_process_*`)

### Phase 5: Validate Density

After placing points, validate their density:

- **Too dense** (stack overlap > 80%): Adjacent points show nearly identical stacks. Remove some.
- **Too sparse** (stack overlap = 0%): No shared frames between neighboring points. Add intermediate ones.
- **Just right** (stack overlap 20-60%): Some shared frames but meaningfully different stacks.

The base library includes an overlap analysis function. Use it.

### Phase 6: Capture and Feed to AI

```bash
# 1. Enable code points for your language
touch ~/.codepoint/.codepoint-go    # or .codepoint-ts, .codepoint-python

# 2. Run your project normally — output goes to ~/.codepoint/<project>/ automatically

# 3. Trigger the business scenario you want to analyze

# 4. Feed the log file to AI alongside relevant source files
#    In Claude Code: "Read ~/.codepoint/my-api/cp-go-*.log and analyze the execution paths"
```

## How Many Code Points

| Project Complexity | Lines of Code | Recommended Points |
|---|---|---|
| Simple CRUD API | < 10K | 10-15 |
| Medium web service | 10K-100K | 20-50 |
| Complex distributed system | 100K+ | 50-200+ |
| Database / OLTP engine | 100K+ | 200+ |

Rule of thumb: each core execution path needs 5-10 points. A Tomcat-class project (~300K lines) needs ~20 points. A database needs ~200+.

## Integration with AI Coding Workflows

When using Claude Code, Cursor, or similar tools:

1. **Before debugging session**: `touch ~/.codepoint/.codepoint-<lang>`, reproduce the issue
2. **During the session**: Tell AI to read `~/.codepoint/<project>/cp-<lang>-*.log` — it contains the exact runtime call chains
3. **AI sees**: Both the source code AND the runtime execution path, enabling precise diagnosis
4. **After fix**: `rm ~/.codepoint/.codepoint-<lang>`, commit the fix. The code point infrastructure stays for future use.

This is especially powerful for:
- Concurrent bugs that grep cannot find
- Understanding "how does this feature actually execute end-to-end"
- Onboarding AI to a new codebase — instead of guessing, AI reads the real call chains

## Auto-Discovery of Log Files

When debugging or developing with code points, the AI should proactively discover and read the relevant log files — do not wait for the user to tell you where they are.

**Log file location is deterministic:**

```
~/.codepoint/<current-directory-basename>/cp-<lang>-YYYY-MM-DD_HH-MM-SS_mmm.log
```

Where `<current-directory-basename>` is the name of the project's root directory.

**Always do this when code points are active:**

1. Find the latest log files:
   ```bash
   ls -t ~/.codepoint/<project>/cp-*.log | head -5
   ```
2. Read the most recent log for each relevant language (Go, TS, Python)
3. Match the timestamps in the log with the user's described scenario
4. Cross-reference the stack traces with the source code to understand the execution path

**For full-stack projects**, both backend and frontend logs will be in the same directory:
```
ls -t ~/.codepoint/<project>/cp-go-*.log | head -1    # latest Go log
ls -t ~/.codepoint/<project>/cp-ts-*.log | head -1    # latest frontend log
ls -t ~/.codepoint/<project>/cp-python-*.log | head -1 # latest Python log
```

Read all relevant logs together to trace the full request lifecycle from frontend button click through API call to backend processing.

## Quick Reference: Enable / Disable

```bash
# Enable (create toggle file)
mkdir -p ~/.codepoint
touch ~/.codepoint/.codepoint-go       # Go
touch ~/.codepoint/.codepoint-ts       # TypeScript / JavaScript
touch ~/.codepoint/.codepoint-python   # Python

# Disable (remove toggle file)
rm ~/.codepoint/.codepoint-go
rm ~/.codepoint/.codepoint-ts
rm ~/.codepoint/.codepoint-python

# Check status
ls ~/.codepoint/.codepoint-*

# View output logs
ls ~/.codepoint/*/
cat ~/.codepoint/my-api/cp-go-*.log
```

## Key Principles

1. **Code points are placed by someone who understands the system architecture** — they require global thinking, not local optimization
2. **Disabled = invisible** — a bool check in production is free; this is not logging
3. **Stack traces are the payload** — the value is in showing AI the runtime call chain, not in logging messages
4. **Density matters** — validate with overlap analysis, not gut feeling
5. **Maintenance is minimal** — code points rarely need updating unless the core architecture changes
6. **They complement, not replace** — use alongside tests, logging, and monitoring, not instead of them
7. **File toggle is portable** — works across shells, CI environments, and IDEs without env var setup

## Anti-Patterns to Avoid

- Don't place code points inside tight loops (per-item in a batch) — place at the batch boundary
- Don't use code points for general logging — they capture stacks, not data
- Don't skip density validation — too many points is as bad as too few
- Don't try to automate placement — this requires human architectural judgment
- Don't remove code points after debugging — they're reusable infrastructure
- Don't use environment variables for toggling — the file-based toggle is simpler and more portable
