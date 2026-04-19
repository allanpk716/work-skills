"""Toggle independence verification tests (FULL-07).

Verifies the 2x2 toggle combination matrix:
- .codepoint-python controls cp-python-*.log output
- .codepoint-ts controls cp-ts-*.log output (via collector)
- Each toggle is independent: changing one does not affect the other
- Toggle requires server restart (module-level toggle check at import time)

Addresses review concerns:
- Windows process management: uses conftest.py start_server/stop_server with PID tracking
- Cleanup on failure: try/finally in each combination ensures server is always stopped
- Test file separation: dedicated file, not mixed with linkage tests
"""
import json
import pytest
import urllib.request
import urllib.error
from pathlib import Path

from conftest import (
    BASE_URL, LOG_DIR, start_server, stop_server,
    PYTHON_TOGGLE, TS_TOGGLE,
)

# Collector probe payload for toggle testing
TOGGLE_TEST_PROBE = {
    "name": "cp-fe-toggle-test",
    "stack": "Error: toggle-test\n    at test_toggle",
    "meta": {"point_id": "cp-fe-toggle-test", "flow_id": "flow-toggle-test"},
}


@pytest.mark.integration
class TestToggleCombinations:
    """Test all 4 toggle combinations with reliable server lifecycle."""

    def _run_calculate(self):
        """Trigger a backend calculate call."""
        body = json.dumps({"expression": "1+1"}).encode("utf-8")
        req = urllib.request.Request(
            f"{BASE_URL}/api/calculate",
            data=body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            return json.loads(resp.read().decode("utf-8")), resp.status

    def _run_collector_probe(self) -> int:
        """POST a frontend probe to collector, return HTTP status."""
        body = json.dumps(TOGGLE_TEST_PROBE).encode("utf-8")
        req = urllib.request.Request(
            f"{BASE_URL}/__codepoint__",
            data=body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=5) as resp:
                return resp.status
        except urllib.error.HTTPError as e:
            return e.code

    def _has_python_log(self) -> bool:
        return bool(list(LOG_DIR.glob("cp-python-*.log")))

    def _has_ts_log(self) -> bool:
        return bool(list(LOG_DIR.glob("cp-ts-*.log")))

    def test_combination_1_both_enabled(self):
        """Both toggles on -> cp-python and cp-ts logs both present."""
        proc = None
        try:
            proc = start_server(toggle_python=True, toggle_ts=True)
            self._run_calculate()
            self._run_collector_probe()
        finally:
            stop_server(proc)

        assert self._has_python_log(), "Expected cp-python-*.log when .codepoint-python exists"
        assert self._has_ts_log(), "Expected cp-ts-*.log when .codepoint-ts exists"

    def test_combination_2_only_python(self):
        """Only .codepoint-python -> only cp-python log, no cp-ts."""
        proc = None
        try:
            proc = start_server(toggle_python=True, toggle_ts=False)
            self._run_calculate()
            status = self._run_collector_probe()
            assert status == 404, f"Expected 404 from disabled collector, got {status}"
        finally:
            stop_server(proc)

        assert self._has_python_log(), "Expected cp-python-*.log when .codepoint-python exists"
        assert not self._has_ts_log(), "Expected NO cp-ts-*.log when .codepoint-ts absent"

    def test_combination_3_only_ts(self):
        """Only .codepoint-ts -> only cp-ts log, no cp-python."""
        proc = None
        try:
            proc = start_server(toggle_python=False, toggle_ts=True)
            self._run_calculate()
            self._run_collector_probe()
        finally:
            stop_server(proc)

        assert not self._has_python_log(), "Expected NO cp-python-*.log when .codepoint-python absent"
        assert self._has_ts_log(), "Expected cp-ts-*.log when .codepoint-ts exists"

    def test_combination_4_both_disabled(self):
        """Neither toggle -> no logs at all."""
        proc = None
        try:
            proc = start_server(toggle_python=False, toggle_ts=False)
            self._run_calculate()
            status = self._run_collector_probe()
            assert status == 404, f"Expected 404 from disabled collector, got {status}"
        finally:
            stop_server(proc)

        assert not self._has_python_log(), "Expected NO cp-python-*.log when both toggles absent"
        assert not self._has_ts_log(), "Expected NO cp-ts-*.log when both toggles absent"
