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
    meta = entry.get("meta")
    with _ts_lock:
        if meta:
            import json as _json
            _ts_out.write(f"[CODEPOINT] {name}\n{stack}\nmeta: {_json.dumps(meta)}\n")
        else:
            _ts_out.write(f"[CODEPOINT] {name}\n{stack}\n")
        _ts_out.flush()
    return True


def close_ts_collector() -> None:
    if _ts_out and not _ts_out.closed:
        _ts_out.flush()
        _ts_out.close()


_init_ts_collector()
