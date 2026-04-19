"""Shared test fixtures for pyts-calculator integration tests.

Provides reliable server start/stop on Windows with PID tracking,
readiness polling, and guaranteed cleanup via try/finally.
"""
import os
import subprocess
import time
import urllib.request
import urllib.error
from pathlib import Path

BASE_URL = "http://localhost:18091"
PROJECT_DIR = Path(__file__).parent.parent
CODEPOINT_DIR = Path.home() / ".codepoint"
PYTHON_TOGGLE = CODEPOINT_DIR / ".codepoint-python"
TS_TOGGLE = CODEPOINT_DIR / ".codepoint-ts"
LOG_DIR = CODEPOINT_DIR / "pyts-calculator"

def _kill_port_holder(port: int) -> None:
    """Kill any process listening on the given port. Windows-specific.

    Uses netstat to find the PID and taskkill to terminate it.
    This prevents 'Address already in use' errors from orphaned server processes.
    """
    if os.name != "nt":
        return
    try:
        result = subprocess.run(
            ["netstat", "-ano"],
            capture_output=True, text=True, timeout=5,
        )
        for line in result.stdout.splitlines():
            if f":{port}" in line and "LISTENING" in line:
                parts = line.split()
                pid = parts[-1]
                if pid.isdigit():
                    subprocess.run(
                        ["taskkill", "/F", "/T", "/PID", pid],
                        capture_output=True, timeout=5,
                    )
                    time.sleep(1)  # Wait for port release
                break
    except (subprocess.TimeoutExpired, FileNotFoundError):
        pass


def wait_for_server(url: str = BASE_URL, timeout: float = 15.0, interval: float = 0.5) -> bool:
    """Poll server until it responds. Returns True if server ready, False on timeout.

    Addresses review concern: no timing/retry logic for server readiness.
    Polls /api/history (lightweight GET endpoint) until it returns 200.
    """
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            req = urllib.request.Request(f"{url}/api/history")
            with urllib.request.urlopen(req, timeout=2) as resp:
                if resp.status == 200:
                    return True
        except (urllib.error.URLError, ConnectionRefusedError, OSError):
            pass
        time.sleep(interval)
    return False

def start_server(toggle_python: bool = True, toggle_ts: bool = True) -> subprocess.Popen:
    """Start FastAPI server with specified toggle configuration.

    Addresses review concern: Windows process management.
    - Sets toggle files BEFORE starting process (module-level toggle check)
    - Starts uvicorn as subprocess
    - Captures PID for reliable cleanup
    - Polls for readiness before returning

    Args:
        toggle_python: Create .codepoint-python toggle file
        toggle_ts: Create .codepoint-ts toggle file

    Returns:
        subprocess.Popen with the server process
    """
    # Set toggle state BEFORE starting server
    CODEPOINT_DIR.mkdir(parents=True, exist_ok=True)
    if toggle_python:
        PYTHON_TOGGLE.touch()
    else:
        PYTHON_TOGGLE.unlink(missing_ok=True)
    if toggle_ts:
        TS_TOGGLE.touch()
    else:
        TS_TOGGLE.unlink(missing_ok=True)

    # Kill any previous server process holding port 18091
    _kill_port_holder(18091)

    # Clean previous log files (ignore PermissionError on Windows if file is still held)
    if LOG_DIR.exists():
        for f in LOG_DIR.glob("cp-*.log"):
            try:
                f.unlink()
            except PermissionError:
                pass  # File held by previous server; new server will create a new file

    proc = subprocess.Popen(
        ["python", "main.py"],
        cwd=str(PROJECT_DIR),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name == "nt" else 0,
    )

    if not wait_for_server():
        # Server failed to start -- clean up
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()
            proc.wait()
        raise RuntimeError(
            f"FastAPI server failed to start within 15s. "
            f"stderr: {proc.stderr.read().decode() if proc.stderr else 'N/A'}"
        )

    return proc

def stop_server(proc: subprocess.Popen) -> None:
    """Stop FastAPI server reliably on Windows.

    Addresses review concern: orphaned processes causing 'Address already in use'.
    Uses taskkill /F /T on Windows for reliable process tree cleanup.
    Falls back to proc.kill() on non-Windows.
    """
    if proc.poll() is not None:
        return  # Already stopped

    if os.name == "nt":
        # Windows: use taskkill for reliable process tree cleanup
        try:
            subprocess.run(
                ["taskkill", "/F", "/T", "/PID", str(proc.pid)],
                capture_output=True, timeout=5,
            )
        except (subprocess.TimeoutExpired, FileNotFoundError):
            proc.kill()
    else:
        proc.terminate()

    try:
        proc.wait(timeout=5)
    except subprocess.TimeoutExpired:
        proc.kill()
        proc.wait()
