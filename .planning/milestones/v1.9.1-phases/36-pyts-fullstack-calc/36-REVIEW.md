---
phase: 36-pyts-fullstack-calc
reviewed: 2026-04-19T11:15:00Z
depth: standard
files_reviewed: 17
files_reviewed_list:
  - tmp/pyts-calculator/main.py
  - tmp/pyts-calculator/api/server.py
  - tmp/pyts-calculator/calculator/core.py
  - tmp/pyts-calculator/codepoint/__init__.py
  - tmp/pyts-calculator/codepoint/collector.py
  - tmp/pyts-calculator/history/store.py
  - tmp/pyts-calculator/batch/processor.py
  - tmp/pyts-calculator/tests/test_calculator.py
  - tmp/pyts-calculator/tests/conftest.py
  - tmp/pyts-calculator/tests/test_linkage.py
  - tmp/pyts-calculator/tests/test_toggle.py
  - tmp/pyts-calculator/frontend/src/App.tsx
  - tmp/pyts-calculator/frontend/src/api/client.ts
  - tmp/pyts-calculator/frontend/src/lib/codepoint.ts
  - tmp/pyts-calculator/frontend/src/components/Calculator.tsx
  - tmp/pyts-calculator/frontend/src/components/History.tsx
  - tmp/pyts-calculator/frontend/src/components/BatchCalc.tsx
findings:
  critical: 2
  warning: 5
  info: 3
  total: 10
status: issues_found
---

# Phase 36: Code Review Report

**Reviewed:** 2026-04-19T11:15:00Z
**Depth:** standard
**Files Reviewed:** 17
**Status:** issues_found

## Summary

Reviewed 17 source files across Python backend (calculator engine, API, codepoint probes, history, batch) and TypeScript/React frontend (components, API client, codepoint library). The codebase is well-structured with clear separation of concerns, good test coverage, and thoughtful Windows compatibility in test fixtures.

Two critical issues found: a thread-safety race condition in the codepoint writer that can corrupt log output under concurrent FastAPI requests, and a `format_result` function with an unsafe `int()` conversion order that will raise `OverflowError` on infinity values. Five warnings cover API input validation gaps, incorrect exponentiation associativity, type signature inaccuracy, and a shutdown race condition. Three informational items cover deprecated API usage, unnecessary type imports, and a magic port number.

## Critical Issues

### CR-01: Thread-unsafe writes to shared file handle in codepoint `_write()`

**File:** `tmp/pyts-calculator/codepoint/__init__.py:162-167`
**Issue:** The `_write()` function writes to the global `_out_file` handle without any lock. The `CodePointCollector` class properly uses `_lock` for thread safety, but `point_json()` (called from API request handlers via `evaluate()`) calls `_write()` directly. Under concurrent FastAPI requests, multiple threads can interleave `write()` and `flush()` calls, producing corrupted log output. This is a data integrity issue for the codepoint probe system -- the entire purpose of which is reliable diagnostic traces.
**Fix:**
```python
# Add a module-level lock for file writes
_write_lock = threading.Lock()

def _write(content: str) -> None:
    if _out_file and not _out_file.closed:
        with _write_lock:
            _out_file.write(content)
            _out_file.flush()
    else:
        print(content, file=sys.stderr, end="", flush=True)
```

### CR-02: `format_result` crashes on infinity -- `int()` called before `isinf` guard

**File:** `tmp/pyts-calculator/calculator/core.py:163`
**Issue:** The expression `result == int(result) and not math.isinf(result)` evaluates left-to-right. When `result` is `float('inf')`, Python evaluates `int(float('inf'))` first, which raises `OverflowError: cannot convert float infinity to integer`. The `math.isinf` guard is never reached because the exception fires first. Any expression producing infinity (e.g., `1e308^2`, or division producing extremely large values) will crash the server with a 500 error instead of returning a formatted result.
**Fix:**
```python
def format_result(result: float) -> str:
    """Format computation result."""
    if math.isinf(result) or math.isnan(result):
        return str(result)
    if result == int(result):
        return f"{int(result)}.0"
    return f"{result:.4f}"
```

## Warnings

### WR-01: API endpoints use bare `dict` -- no input validation via Pydantic models

**File:** `tmp/pyts-calculator/api/server.py:22,30,104`
**Issue:** Three endpoints (`codepoint_collector`, `calculate`, `batch`) accept `entry: dict` or `body: dict` without Pydantic model validation. This means: (a) any extra/malicious fields are silently accepted; (b) missing fields produce `None` from `.get()` rather than clear 422 errors; (c) FastAPI cannot auto-generate accurate OpenAPI schema. While not directly exploitable for injection in this codebase (expressions are parsed, not eval'd), it violates defense-in-depth and makes the API contract fragile.
**Fix:** Define Pydantic request models:
```python
from pydantic import BaseModel

class CalcRequest(BaseModel):
    expression: str

class BatchRequest(BaseModel):
    expressions: str

class CodePointEntry(BaseModel):
    name: str
    stack: str = ""
    meta: Optional[dict] = None
```

### WR-02: `parse_power` is left-associative -- mathematically incorrect for chained exponentiation

**File:** `tmp/pyts-calculator/calculator/core.py:119-125`
**Issue:** `parse_power` calls `self.parse_unary()` for the exponent instead of `self.parse_power()`. This makes `^` left-associative, so `2^3^2` evaluates as `(2^3)^2 = 64` instead of the standard mathematical right-associative result `2^(3^2) = 512`. While the current test suite does not cover chained exponentiation, users who expect standard math conventions will get incorrect results silently.
**Fix:**
```python
def parse_power(self) -> float:
    base = self.parse_unary()
    if self._peek() == "^":
        self._consume()
        exp = self.parse_power()  # Right-recursive for right-associativity
        return math.pow(base, exp)
    return base
```

### WR-03: `_Parser._peek()` declared return type `str` but returns `None`

**File:** `tmp/pyts-calculator/calculator/core.py:85-88`
**Issue:** The `_peek` method has return type `str` but returns `None` when `pos >= len(tokens)`. This is a type lie that mypy or pyright would flag. More importantly, `_consume()` at line 91 does not bounds-check `self.pos` before indexing `self.tokens[self.pos]`, so if called after `_peek()` returns `None` (i.e., at end of input in an unexpected state), it will raise `IndexError` instead of a descriptive `ValueError`.
**Fix:**
```python
def _peek(self) -> Optional[str]:
    if self.pos < len(self.tokens):
        return self.tokens[self.pos]
    return None

def _consume(self) -> str:
    if self.pos >= len(self.tokens):
        raise ValueError("unexpected end of expression")
    tok = self.tokens[self.pos]
    self.pos += 1
    return tok
```

### WR-04: `close_ts_collector()` races with concurrent `receive()` calls

**File:** `tmp/pyts-calculator/codepoint/collector.py:66-69`
**Issue:** `close_ts_collector()` reads `_ts_out` and calls `.flush()` / `.close()` without acquiring `_ts_lock`. During FastAPI shutdown, if a request is still being processed, `receive()` could be writing to `_ts_out` while `close_ts_collector()` closes it, causing `ValueError: I/O operation on closed file`. The shutdown handler at `server.py:120-123` triggers this path.
**Fix:**
```python
def close_ts_collector() -> None:
    global _ts_out
    with _ts_lock:
        if _ts_out and not _ts_out.closed:
            _ts_out.flush()
            _ts_out.close()
            _ts_out = None
```

### WR-05: Frontend API client does not check HTTP status before parsing JSON

**File:** `tmp/pyts-calculator/frontend/src/api/client.ts:31-58`
**Issue:** All five API functions (`calculate`, `getHistory`, `getHistoryDetail`, `batchCalculate`) call `res.json()` without checking `res.ok` or `res.status`. If the server returns a non-200 status (400, 404, 500), the response JSON is returned as-if it were a success response. For example, `calculate()` would return `{"error": "empty expression"}` with the `CalcResponse` type, and the component would check `resp.error` and show the error. However, a 500 HTML error page would cause `res.json()` to throw an unhandled exception. The TypeScript type system provides a false sense of safety here since the actual runtime type may not match the interface.
**Fix:**
```typescript
export async function calculate(expression: string): Promise<CalcResponse> {
  const res = await fetch('/api/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ expression }),
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}
```

## Info

### IN-01: Deprecated `@app.on_event("shutdown")` lifecycle hook

**File:** `tmp/pyts-calculator/api/server.py:120`
**Issue:** FastAPI has deprecated `@app.on_event("startup")` and `@app.on_event("shutdown")` in favor of the `lifespan` context manager pattern. While it still works, it may be removed in a future FastAPI version.
**Fix:** Use the `lifespan` parameter in `FastAPI()` constructor with an async context manager.

### IN-02: Unnecessary `Tuple` import from `typing`

**File:** `tmp/pyts-calculator/calculator/core.py:5`
**Issue:** `from typing import Tuple` is used on line 168 (`-> Tuple[str, str]`), but since Python 3.9, `tuple[str, str]` is available as a built-in generic. This is a minor style note -- the import is not wrong, just unnecessary on modern Python.
**Fix:** Replace `Tuple[str, str]` with `tuple[str, str]` and remove the `typing` import.

### IN-03: Magic port number 18091

**File:** `tmp/pyts-calculator/main.py:7`
**Issue:** Port `18091` is hardcoded in `main.py` and duplicated as `BASE_URL` in `conftest.py:13`. If the port needs to change, both files must be updated in sync. Consider extracting to a constant or environment variable.
**Fix:** Define `PORT = 18091` in a shared config module or use `os.environ.get("PORT", "18091")`.

---

_Reviewed: 2026-04-19T11:15:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
