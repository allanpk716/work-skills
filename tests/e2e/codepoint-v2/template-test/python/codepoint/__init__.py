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