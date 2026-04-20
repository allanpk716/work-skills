# codepoint

Collection-based runtime observability for AI-assisted development. Scan existing code to identify business flows and probe locations, plan code points for new features, generate structured test plans, and implement probes with TDD-style automated verification.

## Features

- **Codebase scanning** — analyze existing code to identify business flows and probe locations
- **Feature planning** — plan code points for new features before implementation
- **Test plan generation** — create structured test plans with probe snippets
- **TDD-style implementation** — insert probes with automated verification
- **Instrumentation plans** — generate probe placement and metadata contracts
- **Artifact validation** — progressive consistency checks across all pipeline stages

## Prerequisites

- Project with a supported language: Go, TypeScript/JavaScript, or Python
- Git repository (recommended for tracking changes)

## Install

```bash
npx github:allanpk716/work-skills#main
```

## Toggle Mechanism

Enable or disable codepoint support per language using file-based toggles:

| Language | Enable | Disable |
|----------|--------|---------|
| Go | `touch ~/.codepoint/.codepoint-go` | `rm ~/.codepoint/.codepoint-go` |
| TypeScript/JS | `touch ~/.codepoint/.codepoint-ts` | `rm ~/.codepoint/.codepoint-ts` |
| Python | `touch ~/.codepoint/.codepoint-python` | `rm ~/.codepoint/.codepoint-python` |

## Commands

| Command | Purpose |
|---------|---------|
| `/codepoint-run` | Full pipeline — auto-detect entry, chain all stages, resume from artifacts |
| `/codepoint-scan` | Scan existing codebase, identify flows, suggest probe locations |
| `/codepoint-plan` | Plan code points for a new feature |
| `/codepoint-test-plan` | Generate structured test plans with probe snippets |
| `/codepoint-implement` | Insert probes with TDD-style automated verification |
| `/codepoint-instrument` | Generate instrumentation plans from existing code points |
| `/codepoint-verify` | Validate probe output against plans and generate reports |
| `/codepoint-validate` | Progressive artifact consistency validation across pipeline stages |

## Quick Start

### One-Command Workflow

Run `/codepoint-run` to execute the full pipeline automatically.

### For Existing Codebase

1. `/codepoint-scan` — analyze your codebase
2. `/codepoint-instrument` — generate instrumentation plans
3. `/codepoint-validate` — verify artifact consistency
4. `/codepoint-test-plan` — create test plans for each flow
5. `/codepoint-implement` — insert probes and verify
6. `/codepoint-validate` — check implementation completeness
7. `/codepoint-verify` — confirm probes are working

### For New Feature Development

1. `/codepoint-plan` — plan code points from your spec
2. `/codepoint-test-plan` — generate test plans before implementation
3. Build the feature, then `/codepoint-implement` to insert probes
4. `/codepoint-validate` → `/codepoint-verify` to confirm everything works

## Data Model

```
CodePoint (independent probe)
Flow (ordered combination of code points)
Collection (group of related flows)
```

All data stored in `.codepoints/` at project root:

```
.codepoints/
├── index.json                  # Global index for AI fast query
├── collections/
├── flows/
├── points/
├── test-plans/
├── instrumentation/
└── verification/
```

See `references/data-model.md` for full specification.

## Language Support

- **Go**: `references/golang.md`
- **Python**: `references/python.md`
- **TypeScript/JS**: `references/frontend.md`
