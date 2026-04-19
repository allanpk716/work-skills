---
phase: 37
plan: 02
subsystem: codepoint-templates
tags: [documentation, golang, python, collector, flow-routing, spa-fallback]
dependency_graph:
  requires: [37-01]
  provides: [updated-golang-md, updated-python-md]
  affects: [plugins/codepoint/references/golang.md, plugins/codepoint/references/python.md]
tech_stack:
  added: []
  patterns: [per-flow-file-routing, meta-json-writing, path.Clean-for-embed-FS]
key_files:
  created: []
  modified:
    - plugins/codepoint/references/golang.md
    - plugins/codepoint/references/python.md
decisions:
  - Enhanced Go collector uses sync.Mutex, tsFlowFiles map, and getOrCreateTsFlowFile for per-flow routing
  - SPA fallback fix documented as separate sub-section with path.Clean (NOT filepath.Clean)
  - Python receive() writes meta as JSON line for flow_id cross-language correlation
metrics:
  duration: 161s
  completed: 2026-04-19T03:49:46Z
  tasks: 2
  files: 2
---

# Phase 37 Plan 02: Update Skill Reference Templates Summary

Updated golang.md and python.md skill reference templates with enhanced collector implementations proven in gojs-calculator and pyts-calculator test projects.

## Changes

### Task 1: golang.md Collector Template

Replaced the simple collector with the enhanced version from `tmp/gojs-calculator/codepoint/collector.go`:

- **sync.Mutex** protecting `tsFlowFiles` map and file writes from concurrent browser requests
- **Per-flow file routing**: entries with `flow_id` in meta are written to `cp-ts-flow-<id>-*.log`
- **JSON output** for meta-bearing entries; legacy plain-text for non-meta entries
- **`getOrCreateTsFlowFile`** with `sanitizeFlowID` for safe filenames
- **`CloseCollector`** closes all file handles on server shutdown

Added three new sub-sections:
1. **Windows SPA Fallback Fix** -- explains `path.Clean` vs `filepath.Clean` for embed.FS
2. **Integration Notes** -- how backend cp-go-flow-* and frontend cp-ts-flow-* files share flow_id
3. Updated **Integration with Go Server** -- uses `path.Clean` and `fs.Sub` pattern

Updated **How It Works** to show per-flow file routing in output listing.

### Task 2: python.md Collector Template

Updated `receive()` in the Frontend Collector section:
- Extracts `meta` dict from entry via `entry.get("meta")`
- Writes meta as JSON line (`meta: {_json.dumps(meta)}`) for flow_id correlation
- Preserves legacy plain-text format for non-meta entries (backward compatibility)
- Thread-safe via existing `threading.Lock`

## Deviations from Plan

None -- plan executed exactly as written.

## Acceptance Criteria

All criteria verified:
- `getOrCreateTsFlowFile` in golang.md: 3 occurrences
- `sync.Mutex` in golang.md: 2 occurrences
- `path.Clean` in golang.md: 5 occurrences
- `sanitizeFlowID` in golang.md: 5 occurrences
- `filepath.Clean` as executable code: 0 (3 references are all "do NOT use" documentation)
- Inline comments (`// `) in golang.md: 66
- SPA/SPA fallback references: 11
- Integration Notes / PointWithMeta: 17
- `sessionState` in golang.md: 4 (Base Library untouched)
- `_json.dumps(meta)` in python.md: 1
- `entry.get("meta")` in python.md: 1
- `threading.Lock` in python.md: 2
- `sessionState` in python.md: 0 (not applicable; Base Library untouched)

## Self-Check: PASSED

- plugins/codepoint/references/golang.md: EXISTS (modified)
- plugins/codepoint/references/python.md: EXISTS (modified)
- Commit d1c51f6: FOUND (golang.md)
- Commit 4aa1d44: FOUND (python.md)
