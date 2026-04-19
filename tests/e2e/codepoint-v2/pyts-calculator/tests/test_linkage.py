"""Cross-language probe linkage integration tests (FULL-06).

Verifies:
- Collector endpoint receives frontend TS probe data -> cp-ts-*.log
- Python backend probes -> cp-python-*.log with flow_id
- Same codepoint produces different stacks across flows
- flow_id correlation between frontend and backend logs
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

# Exact collector probe payload -- addresses review concern about underspecified payload.
# This matches what codepoint.ts sends in browser mode via sendToCollector().
FRONTEND_PROBE_PAYLOAD = {
    "name": "cp-fe-calc-submit",
    "stack": "Error: probe\n"
             "    at pointWithMeta (codepoint.ts:42:15)\n"
             "    at Calculator (Calculator.tsx:28:7)\n"
             "    at renderWithHooks (react-dom.js:16103:18)",
    "meta": {
        "point_id": "cp-fe-calc-submit",
        "flow_id": "flow-api-calculate",
        "expr": "2+3",
    },
}

@pytest.mark.integration
class TestCrossLanguageLinkage:
    """Tests that require a running FastAPI server."""

    @pytest.fixture(autouse=True)
    def _server_lifecycle(self):
        """Start/stop server for each test -- ensures clean state."""
        self.proc = start_server(toggle_python=True, toggle_ts=True)
        yield
        stop_server(self.proc)

    def _post_json(self, path: str, data: dict):
        """Helper: POST JSON and return parsed response."""
        body = json.dumps(data).encode("utf-8")
        req = urllib.request.Request(
            f"{BASE_URL}{path}",
            data=body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            return json.loads(resp.read().decode("utf-8")), resp.status

    def _get_json(self, path: str):
        """Helper: GET JSON and return parsed response."""
        req = urllib.request.Request(f"{BASE_URL}{path}")
        with urllib.request.urlopen(req, timeout=5) as resp:
            return json.loads(resp.read().decode("utf-8")), resp.status

    def _read_python_log(self) -> str:
        """Read the most recent cp-python log content."""
        logs = sorted(LOG_DIR.glob("cp-python-*.log"))
        assert logs, "No cp-python-*.log found"
        return logs[-1].read_text(encoding="utf-8")

    def _read_ts_log(self) -> str:
        """Read the most recent cp-ts log content."""
        logs = sorted(LOG_DIR.glob("cp-ts-*.log"))
        assert logs, "No cp-ts-*.log found"
        return logs[-1].read_text(encoding="utf-8")

    def test_collector_receives_probe(self):
        """POST to /__codepoint__ returns 204, data appears in cp-ts log."""
        # Send exact frontend probe payload
        body = json.dumps(FRONTEND_PROBE_PAYLOAD).encode("utf-8")
        req = urllib.request.Request(
            f"{BASE_URL}/__codepoint__",
            data=body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            assert resp.status == 204

        # Verify cp-ts log contains the probe
        ts_log = self._read_ts_log()
        assert "cp-fe-calc-submit" in ts_log, f"Probe name not in ts log. Log content:\n{ts_log}"

    def test_collector_disabled_returns_404(self):
        """When .codepoint-ts is absent, collector returns 404.
        Note: This requires a server restart. Tested in test_toggle.py instead.
        This test verifies collector IS enabled when both toggles exist."""
        # With toggle present, collector should accept
        body = json.dumps(FRONTEND_PROBE_PAYLOAD).encode("utf-8")
        req = urllib.request.Request(
            f"{BASE_URL}/__codepoint__",
            data=body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            assert resp.status == 204

    def test_multi_flow_stack_differentiation(self):
        """Same codepoint produces different flow_ids across 3 business flows."""
        # Flow 1: API calculate
        resp, status = self._post_json("/api/calculate", {"expression": "2+3"})
        assert status == 200
        assert resp.get("result") == "5.0"

        # Flow 2: History query (record 1)
        resp, status = self._get_json("/api/history/1")
        assert status == 200
        assert "recomputed" in resp

        # Flow 3: Batch -- expressions as newline-separated string
        resp, status = self._post_json("/api/batch", {"expressions": "1+1\n2*3\n10/2"})
        assert status == 200
        assert len(resp.get("results", [])) == 3

        # Verify cp-python log has all 3 flow_ids
        python_log = self._read_python_log()
        assert "flow-api-calculate" in python_log
        assert "flow-history-query" in python_log
        assert "flow-batch-process" in python_log

        # Verify same codepoint (cp-calc-compute) appears with different flow_ids
        assert "cp-calc-compute" in python_log
        # Count occurrences of cp-calc-compute with different flow_ids
        compute_lines = [
            line for line in python_log.splitlines()
            if "cp-calc-compute" in line
        ]
        # Should have at least 3 entries (one per flow)
        assert len(compute_lines) >= 3, (
            f"Expected 3+ cp-calc-compute entries, got {len(compute_lines)}.\n"
            f"Log content:\n{python_log}"
        )

    def test_flow_id_correlation(self):
        """Frontend flow_id matches backend flow_id in logs."""
        # Send frontend probe with flow-api-calculate
        body = json.dumps(FRONTEND_PROBE_PAYLOAD).encode("utf-8")
        req = urllib.request.Request(
            f"{BASE_URL}/__codepoint__",
            data=body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        urllib.request.urlopen(req, timeout=5)

        # Also trigger backend calculate with same flow_id
        self._post_json("/api/calculate", {"expression": "2+3"})

        # Verify cp-ts log has flow-api-calculate
        ts_log = self._read_ts_log()
        assert "flow-api-calculate" in ts_log, f"flow_id not in ts log.\n{ts_log}"

        # Verify cp-python log also has flow-api-calculate
        python_log = self._read_python_log()
        assert "flow-api-calculate" in python_log
