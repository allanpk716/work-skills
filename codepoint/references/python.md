# Python Code Point Implementation Guide

## Table of Contents
1. [Base Library](#base-library)
2. [FastAPI / Flask Patterns](#fastapi--flask-patterns)
3. [Django Patterns](#django-patterns)
4. [Async Patterns (asyncio)](#async-patterns-asyncio)
5. [Concurrency Patterns (threading/multiprocessing)](#concurrency-patterns)
6. [Data Pipeline Patterns](#data-pipeline-patterns)
7. [Frontend Collector (Python+Frontend Projects)](#frontend-collector)
8. [Density Validation](#density-validation)
9. [AI Integration](#ai-integration)

## Toggle & Output Convention

**Enable**: `touch ~/.codepoint/.codepoint-python`
**Disable**: `rm ~/.codepoint/.codepoint-python`
**Output**: `~/.codepoint/<project-dir-name>/cp-python-YYYY-MM-DD_HH-MM-SS_mmm.log`

The base library detects the toggle file at import time and auto-creates the output directory + log file. All code point output goes to the log file automatically — no stderr redirection needed.

## Base Library

Create `codepoint/__init__.py`:

```python
"""Code Point: lightweight runtime probe for AI-assisted debugging.

Zero overhead when disabled (one bool check).
Enable:  touch ~/.codepoint/.codepoint-python
Disable: rm   ~/.codepoint/.codepoint-python
"""

import atexit
import json
import os
import sys
import threading
import traceback
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional, TextIO


# --- Toggle & Output Setup ---

_toggle_path: Path = Path.home() / ".codepoint" / ".codepoint-python"
_enabled: bool = _toggle_path.exists()
_out_file: Optional[TextIO] = None
_output_path: str = ""


def _init_output() -> None:
    global _out_file, _output_path
    if not _enabled:
        return

    # Project name = current working directory basename
    project_name = Path.cwd().name

    # Output directory: ~/.codepoint/<project>/
    out_dir = Path.home() / ".codepoint" / project_name
    out_dir.mkdir(parents=True, exist_ok=True)

    # Output file: cp-python-YYYY-MM-DD_HH-MM-SS_mmm.log
    now = datetime.now()
    ts = now.strftime("%Y-%m-%d_%H-%M-%S")
    ms = f"{now.microsecond // 1000:03d}"
    filename = f"cp-python-{ts}_{ms}.log"

    _output_path = str(out_dir / filename)
    _out_file = open(_output_path, "a", encoding="utf-8")

    # Write header
    _out_file.write(
        f"# Code Point Log (Python)\n"
        f"# Project: {project_name}\n"
        f"# Started: {now.isoformat()}\n"
        f"# Toggle: {_toggle_path}\n\n"
    )
    _out_file.flush()

    # Register cleanup
    atexit.register(_close_output)


def _close_output() -> None:
    if _out_file and not _out_file.closed:
        _out_file.flush()
        _out_file.close()


_init_output()


# --- Public API ---

def is_enabled() -> bool:
    return _enabled


def output_path() -> str:
    return _output_path


def point(name: str) -> None:
    """Capture a stack trace at the call site. Zero cost when disabled."""
    if not _enabled:
        return
    stack = "".join(traceback.format_stack())
    output = f"[CODEPOINT] {name}\n{stack}\n"
    _write(output)


def collect_stack(name: str) -> str:
    """Return the stack as a string for programmatic use."""
    if not _enabled:
        return ""
    stack = "".join(traceback.format_stack())
    return f"[CODEPOINT] {name}\n{stack}"


def point_json(name: str, meta: Optional[dict[str, Any]] = None) -> None:
    """Emit a structured JSON code point entry."""
    if not _enabled:
        return
    frames = traceback.extract_stack()
    # Remove the last 2 frames (this function + extract_stack)
    frame_list = [
        {"file": f.filename, "line": f.lineno, "func": f.name, "code": f.line}
        for f in frames[:-2]
    ]
    entry = {
        "name": name,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "thread": threading.current_thread().name,
        "thread_id": threading.current_thread().ident,
        "frames": frame_list,
    }
    if meta:
        entry["meta"] = meta
    _write(json.dumps(entry, ensure_ascii=False) + "\n")


def point_with_meta(name: str, **meta: Any) -> None:
    """Capture stack with key-value metadata."""
    point_json(name, meta)


def analyze_overlap(stack1: str, stack2: str) -> float:
    """Compute stack frame overlap between two captured stacks.

    Returns 0.0 (no overlap) to 1.0 (identical frames).
    """
    f1 = _extract_frames(stack1)
    f2 = _extract_frames(stack2)
    if not f1:
        return 0.0
    overlap = sum(1 for f in f1 if f in f2)
    return overlap / len(f1)


class CodePointCollector:
    """Thread-safe collector for batch capture of code points."""

    def __init__(self):
        self._entries: list[dict] = []
        self._lock = threading.Lock()

    def collect(self, name: str, meta: Optional[dict[str, Any]] = None) -> None:
        if not _enabled:
            return
        frames = traceback.extract_stack()
        entry = {
            "name": name,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "thread": threading.current_thread().name,
            "frames": [
                {"file": f.filename, "line": f.lineno, "func": f.name}
                for f in frames[:-2]
            ],
        }
        if meta:
            entry["meta"] = meta
        with self._lock:
            self._entries.append(entry)

    def dump(self) -> list[dict]:
        with self._lock:
            return list(self._entries)

    def clear(self) -> None:
        with self._lock:
            self._entries.clear()

    def to_json(self) -> str:
        return json.dumps(self.dump(), indent=2, ensure_ascii=False)


# Module-level collector instance
collector = CodePointCollector()


# --- Internal ---

def _write(content: str) -> None:
    if _out_file and not _out_file.closed:
        _out_file.write(content)
        _out_file.flush()
    else:
        print(content, file=sys.stderr, end="", flush=True)


def _extract_frames(stack: str) -> set[str]:
    """Extract function+file:line identifiers from a stack string."""
    frames = set()
    for line in stack.split("\n"):
        line = line.strip()
        # Python traceback format: File "path", line N, in func
        if line.startswith('File "') and ", line " in line:
            frames.add(line)
    return frames
```

## Quick Import Check

After copying the base library to your project, verify it imports:

```bash
cd your-project
python -c "import codepoint; print('OK')"
```

Expected: `OK`.

This catches syntax errors and missing dependencies before you start adding probes.

## FastAPI / Flask Patterns

### FastAPI Middleware Chain

```python
from codepoint import point, point_json
from fastapi import FastAPI, Request

app = FastAPI()

@app.middleware("http")
async def codepoint_middleware(request: Request, call_next):
    point(f"http_request_entry {request.method} {request.url.path}")
    response = await call_next(request)
    point(f"http_request_done {request.method} {request.url.path} {response.status_code}")
    return response

@app.post("/api/orders")
async def create_order(order: OrderCreate):
    point("route_orders_create_entry")

    validated = validate_order(order)
    point("route_orders_after_validate")

    result = await order_service.create(validated)
    point("route_orders_after_create")

    return result
```

### Flask Route

```python
from codepoint import point

@app.route("/api/users", methods=["POST"])
def create_user():
    point("flask_users_create_entry")

    data = request.get_json()
    point("flask_users_after_parse")

    user = user_service.create(data)
    point("flask_users_after_create")

    return jsonify(user.to_dict()), 201
```

### Service Layer

```python
class OrderService:
    async def create(self, data: OrderCreate) -> Order:
        point("order_service_create_entry")

        order = Order(**data.dict())
        point("order_service_after_init")

        validated = self._validate(order)
        point("order_service_after_validate")

        priced = await self.pricing.calculate(validated)
        point("order_service_after_price")

        saved = await self.repo.save(priced)
        point("order_service_after_save")

        await self.event_bus.publish(OrderCreatedEvent(id=saved.id))
        point("order_service_after_event")
        return saved
```

## Django Patterns

### View Function

```python
from codepoint import point

class OrderCreateView(APIView):
    def post(self, request):
        point("django_order_create_entry")

        serializer = OrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        point("django_order_after_validate")

        order = serializer.save()
        point("django_order_after_save")

        return Response(OrderSerializer(order).data, status=201)
```

### Django Signal Handler

```python
from codepoint import point_with_meta
from django.db.models.signals import post_save

@receiver(post_save, sender=Order)
def on_order_saved(sender, instance, created, **kwargs):
    point_with_meta("signal_order_saved", order_id=instance.id, created=created)
    if created:
        point("signal_order_created")
        send_order_confirmation(instance)
```

### Django Middleware

```python
class CodePointMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        point(f"django_request_entry {request.method} {request.path}")
        response = self.get_response(request)
        point(f"django_request_done {request.method} {request.path} {response.status_code}")
        return response
```

## Async Patterns (asyncio)

### Async Task Chain

```python
import asyncio
from codepoint import point, point_json

async def process_pipeline(items: list[Item]) -> list[Result]:
    point("pipeline_entry")

    # Fan-out
    tasks = [process_item(item) for item in items]
    point(f"pipeline_fanout count={len(tasks)}")

    results = await asyncio.gather(*tasks)
    point("pipeline_all_done")

    return results

async def process_item(item: Item) -> Result:
    point_json("worker_start", item_id=item.id)

    enriched = await enrich(item)
    point(f"worker_after_enrich item={item.id}")

    result = await transform(enriched)
    point(f"worker_done item={item.id}")
    return result
```

### Async Lock/Semaphore

```python
async def update_shared_state(key: str, value: str):
    point_with_meta("async_state_before_lock", key=key)

    async with state_lock:
        point("async_state_lock_acquired")
        state[key] = value
        point("async_state_modified")

    point("async_state_lock_released")
```

## Concurrency Patterns

### Threading

```python
from codepoint import point_json
import threading

def worker(task_queue: queue.Queue):
    point_json("thread_worker_start", thread=threading.current_thread().name)

    while True:
        item = task_queue.get()
        if item is None:
            break

        point_json("thread_task_start", item_id=item.id)
        process(item)
        point_json("thread_task_done", item_id=item.id)
        task_queue.task_done()

    point("thread_worker_exit")

# Spawn workers
threads = []
for i in range(4):
    t = threading.Thread(target=worker, args=(task_queue,), name=f"worker-{i}")
    t.start()
    threads.append(t)
```

### Multiprocessing

```python
from codepoint import point_json
import multiprocessing as mp

def process_chunk(chunk_id: int, data: list):
    # Each process checks its own toggle file
    point_json("mp_chunk_start", chunk_id=chunk_id, pid=os.getpid())

    result = transform(data)
    point_json("mp_chunk_done", chunk_id=chunk_id)

    return result

with mp.Pool(4) as pool:
    results = pool.starmap(process_chunk, enumerate(chunks))
    point("mp_all_chunks_done")
```

## Data Pipeline Patterns

### ETL Pipeline

```python
def run_etl_pipeline(source: str):
    point("etl_pipeline_entry")

    raw = extract(source)
    point("etl_after_extract")

    cleaned = clean(raw)
    point("etl_after_clean")

    transformed = transform(cleaned)
    point("etl_after_transform")

    load(transformed)
    point("etl_after_load")
```

### ML Training Loop

```python
def train_epoch(model, dataloader, epoch: int):
    point_json("train_epoch_start", epoch=epoch)

    for batch_idx, (x, y) in enumerate(dataloader):
        if batch_idx % 100 == 0:
            point_json("train_batch", epoch=epoch, batch=batch_idx)
        loss = model.train_step(x, y)

    point_json("train_epoch_done", epoch=epoch, final_loss=loss)
```

## Frontend Collector (Python+Frontend Projects)

When the frontend is served by a Python backend (FastAPI, Flask, Django), the Python server can act as a collector for browser code points — same pattern as the Go collector.

### Collector Module

Create `codepoint/collector.py`:

```python
"""Frontend code point collector — receives browser stack traces via HTTP
and writes them to cp-ts-*.log.

Enable:  touch ~/.codepoint/.codepoint-ts
Disable: rm   ~/.codepoint/.codepoint-ts

Works with FastAPI, Flask, Django, and any Python web framework.
"""

import threading
from datetime import datetime
from pathlib import Path
from typing import Any, Optional, TextIO

_ts_toggle: Path = Path.home() / ".codepoint" / ".codepoint-ts"
_ts_enabled: bool = _ts_toggle.exists()
_ts_out: Optional[TextIO] = None
_ts_lock = threading.Lock()


def _init_ts_collector() -> None:
    global _ts_out
    if not _ts_enabled:
        return

    project_name = Path.cwd().name
    out_dir = Path.home() / ".codepoint" / project_name
    out_dir.mkdir(parents=True, exist_ok=True)

    now = datetime.now()
    ts = now.strftime("%Y-%m-%d_%H-%M-%S")
    ms = f"{now.microsecond // 1000:03d}"
    filename = f"cp-ts-{ts}_{ms}.log"

    _ts_out = open(out_dir / filename, "a", encoding="utf-8")
    _ts_out.write(
        f"# Code Point Log (TypeScript via Python Collector)\n"
        f"# Project: {project_name}\n"
        f"# Started: {now.isoformat()}\n"
        f"# Toggle: {_ts_toggle}\n\n"
    )
    _ts_out.flush()


def is_ts_enabled() -> bool:
    return _ts_enabled


def receive(entry: dict[str, Any]) -> bool:
    """Write a frontend code point entry. Thread-safe. Returns False if disabled."""
    if not _ts_enabled or _ts_out is None:
        return False
    name = entry.get("name", "unknown")
    stack = entry.get("stack", "")
    meta = entry.get("meta")  # Extract meta dict containing flow_id for cross-language correlation
    with _ts_lock:
        if meta:
            import json as _json
            # Write meta as JSON line so flow_id is available for matching across language boundaries
            _ts_out.write(f"[CODEPOINT] {name}\n{stack}\nmeta: {_json.dumps(meta)}\n")
        else:
            # No meta -- use legacy plain-text format for backward compatibility
            _ts_out.write(f"[CODEPOINT] {name}\n{stack}\n")
        _ts_out.flush()
    return True


def close_ts_collector() -> None:
    if _ts_out and not _ts_out.closed:
        _ts_out.flush()
        _ts_out.close()


_init_ts_collector()
```

### FastAPI Integration

```python
from codepoint.collector import receive, is_ts_enabled
from fastapi import FastAPI, Request, Response

app = FastAPI()

@app.post("/__codepoint__")
async def codepoint_collector(request: Request):
    if not is_ts_enabled():
        return Response(status_code=404)
    entry = await request.json()
    receive(entry)
    return Response(status_code=204)
```

### Flask Integration

```python
from codepoint.collector import receive, is_ts_enabled
from flask import Flask, request

app = Flask(__name__)

@app.route("/__codepoint__", methods=["POST"])
def codepoint_collector():
    if not is_ts_enabled():
        return "", 404
    entry = request.get_json()
    receive(entry)
    return "", 204
```

### Django Integration

```python
# views.py
import json
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from codepoint.collector import receive, is_ts_enabled

@csrf_exempt
@require_POST
def codepoint_collector(request):
    if not is_ts_enabled():
        return HttpResponse(status=404)
    entry = json.loads(request.body)
    receive(entry)
    return HttpResponse(status=204)

# urls.py
urlpatterns = [
    path("__codepoint__", codepoint_collector),
    # ... other routes ...
]
```

### How It Works

1. **Python starts**, checks `~/.codepoint/.codepoint-ts`:
   - Exists → opens `cp-ts-*.log`, endpoint returns 204
   - Absent → endpoint returns 404
2. **Browser loads frontend**, calls `point("some_name")`:
   - POSTs to `/__codepoint__`
   - If 2xx → stack trace written to `cp-ts-*.log`
   - If 404 → stops sending (production or toggle off)
3. **Result**: Both Python and frontend code points in `~/.codepoint/<project>/`:
   ```
   ~/.codepoint/my-project/
   ├── cp-python-2026-04-17_15-32-15_789.log   ← Python backend
   └── cp-ts-2026-04-17_15-32-15_456.log       ← Frontend (via collector)
   ```

## Density Validation

```python
# conftest.py or test_codepoint_density.py
from pathlib import Path
from codepoint import is_enabled, collect_stack, analyze_overlap, output_path


def setup_module():
    """Force-enable code points for testing by creating the toggle file."""
    toggle_dir = Path.home() / ".codepoint"
    toggle_dir.mkdir(parents=True, exist_ok=True)
    (toggle_dir / ".codepoint-python").touch()


def teardown_module():
    """Cleanup toggle file after tests."""
    toggle = Path.home() / ".codepoint" / ".codepoint-python"
    if toggle.exists():
        toggle.unlink()


def test_adjacent_points():
    """Validate density between two adjacent code points."""
    if not is_enabled():
        import pytest
        pytest.skip("Code points not enabled (toggle file may need module reload)")

    s1 = collect_stack("point_a")
    s2 = collect_stack("point_b")

    overlap = analyze_overlap(s1, s2)

    if overlap > 0.8:
        print(f"WARNING: Too dense (overlap={overlap:.2f}), remove one point")
    if overlap == 0:
        print("WARNING: Too sparse (no overlap), add intermediate points")
    assert 0.2 <= overlap <= 0.6, f"Bad density: overlap={overlap:.2f}"

    print(f"Output at: {output_path()}")
```

## AI Integration

### Enable / Disable

```bash
# Enable Python code points
mkdir -p ~/.codepoint && touch ~/.codepoint/.codepoint-python

# Disable Python code points
rm ~/.codepoint/.codepoint-python
```

### Capture & Analyze

```bash
# 1. Enable (one-time setup)
touch ~/.codepoint/.codepoint-python

# 2. Run your app — output goes to ~/.codepoint/<project>/cp-python-*.log automatically
python -m your_app
# or
uvicorn app:app --reload

# 3. Trigger the scenario
curl -X POST http://localhost:8000/api/orders -d '{"item": "test"}'

# 4. Check where the output went
ls ~/.codepoint/<project-name>/

# 5. In Claude Code session, feed the log to AI:
#   "Read ~/.codepoint/order-service/cp-python-2026-04-17_15-32-15_123.log and trace the execution path"
```

### pytest Integration

```bash
# Toggle file controls enable/disable — no env vars needed
# Create toggle before running tests:
touch ~/.codepoint/.codepoint-python

pytest tests/ -s

# Output goes to ~/.codepoint/<project>/cp-python-*.log
```

### Output File Location

```
~/.codepoint/
├── .codepoint-python                                # toggle file (exists = enabled)
├── order-service/                                   # Python project
│   ├── cp-python-2026-04-17_15-32-15_123.log
│   └── cp-python-2026-04-17_16-45-00_789.log
```

### Output Format

```
# Code Point Log (Python)
# Project: order-service
# Started: 2026-04-17T15:32:15.123456+08:00
# Toggle: /home/user/.codepoint/.codepoint-python

[CODEPOINT] route_orders_create_entry
  File "/app/handlers/orders.py", line 15, in create_order
    point("route_orders_create_entry")
  File "/app/.venv/lib/python3.12/site-packages/fastapi/routing.py", line 278, in app
    await dependant.call(**values)
  File "/app/.venv/lib/python3.12/site-packages/fastapi/routing.py", line 235, in serialize_response
    return JSONResponse(content=response_content)
  ...
```

### Structured JSON Output

`point_json()` writes structured JSON to the same log file:

```json
{"name": "route_orders_create_entry", "timestamp": "...", "thread": "MainThread", "frames": [{"file": "/app/handlers/orders.py", "line": 15, "func": "create_order", "code": "..."}]}
```

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
