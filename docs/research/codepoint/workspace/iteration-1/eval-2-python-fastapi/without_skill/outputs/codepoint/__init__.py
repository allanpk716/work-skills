"""Code Point: lightweight runtime probe for AI-assisted debugging.

Zero overhead when disabled (one bool check).
Enable with: CODEPOINT_ENABLED=true
"""

import json
import os
import sys
import threading
import traceback
from datetime import datetime, timezone
from typing import Any, Optional


_enabled: bool = os.environ.get("CODEPOINT_ENABLED", "").lower() == "true"


def is_enabled() -> bool:
    return _enabled


def point(name: str) -> None:
    """Capture a stack trace at the call site. Zero cost when disabled."""
    if not _enabled:
        return
    stack = "".join(traceback.format_stack())
    output = f"[CODEPOINT] {name}\n{stack}\n"
    print(output, file=sys.stderr, flush=True)


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
    print(json.dumps(entry, ensure_ascii=False), file=sys.stderr, flush=True)


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


def _extract_frames(stack: str) -> set[str]:
    """Extract function+file:line identifiers from a stack string."""
    frames = set()
    for line in stack.split("\n"):
        line = line.strip()
        # Python traceback format: File "path", line N, in func
        if line.startswith('File "') and ", line " in line:
            frames.add(line)
    return frames
