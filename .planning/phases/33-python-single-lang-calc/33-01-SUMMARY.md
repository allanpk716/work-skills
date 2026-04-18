---
phase: 33
plan: "33-01"
status: completed
---

# Plan 33-01 Summary: Python Calculator Project

## Completed

- Python calculator project with 3 business flows (REST API, Batch, History) sharing core calculator code
- Core pipeline: `parse -> validate -> compute -> format` via `evaluate()` function
- History query RECOMPUTES through shared pipeline (not just returns stored result)
- codepoint V2 base library integrated from `references/python.md`
- Toggle mechanism: `~/.codepoint/.codepoint-python`
- REST API using `http.server` standard library (no Flask/FastAPI)
- `flow_id` propagation via explicit parameter passing
- 49 unit tests passing (38 core + 11 API)

## Files Created

| File | Description |
|------|-------------|
| `main.py` | CLI entry point |
| `calculator/__init__.py` | Package init |
| `calculator/core.py` | Core: parse, validate, compute, format_result, evaluate |
| `api/__init__.py` | Package init |
| `api/server.py` | REST API handlers (http.server) |
| `batch/__init__.py` | Package init |
| `batch/processor.py` | Batch processing |
| `history/__init__.py` | Package init |
| `history/store.py` | In-memory history storage |
| `codepoint/__init__.py` | codepoint V2 base library |
| `tests/__init__.py` | Package init |
| `tests/test_calculator.py` | Core pipeline tests |
| `tests/test_api.py` | API handler tests |

## Key Design Decisions

- **Recursive descent parser** matching Go calculator behavior (precedence: +/- < */÷ < ^ < unary)
- **Explicit flow_id parameter** instead of Go's context.Context
- **http.server** for zero external dependencies
- **Thread-safe HistoryStore** with threading.Lock
