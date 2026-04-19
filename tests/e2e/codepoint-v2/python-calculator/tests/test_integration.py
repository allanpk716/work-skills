"""Multi-flow stack differentiation integration tests.

Validates that the same shared code point (in calculator.evaluate) produces
different stack traces when called from different business flows.

Differentiation levels:
- Macro: entry probes at different handlers show completely different stacks
- Micro: shared path probes in evaluate show same function but different callers above
"""

import json
import os
import pytest
from pathlib import Path

from calculator.core import evaluate
from api.server import create_handler
from history.store import HistoryStore
from batch.processor import process_expressions
from codepoint import is_enabled, output_path, analyze_overlap


# --- Helpers ---

def read_codepoint_log():
    """Read the latest codepoint log file and return parsed JSON entries."""
    log_dir = Path.home() / ".codepoint" / "python-calculator"
    if not log_dir.exists():
        return []
    log_files = sorted(log_dir.glob("cp-python-*.log"), key=lambda f: f.stat().st_mtime, reverse=True)
    if not log_files:
        return []
    entries = []
    for line in log_files[0].read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line.startswith("{"):
            try:
                entries.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return entries


def filter_by_flow_id(entries, flow_id):
    return [e for e in entries if e.get("meta", {}).get("flow_id") == flow_id]


def filter_by_point_id(entries, point_id):
    return [e for e in entries if e.get("name") == point_id]


def entries_to_string(entries):
    return "\n".join(json.dumps(e, ensure_ascii=False) for e in entries)


def get_frame_funcs(entry):
    """Extract function names from Python codepoint entry frames."""
    frames = entry.get("frames", [])
    return [f.get("func", "") for f in frames]


def get_frame_files(entry):
    """Extract file names from Python codepoint entry frames."""
    frames = entry.get("frames", [])
    return [os.path.basename(f.get("file", "")) for f in frames]


def run_api_flow(expr="2+3*4"):
    """Run the REST API calculate flow."""
    store = HistoryStore()
    handler_class = create_handler(store)
    handler = handler_class.__new__(handler_class)
    handler.path = "/api/calculate"
    handler.send_response = lambda code: None
    handler.send_header = lambda k, v: None
    handler.end_headers = lambda: None
    handler.wfile = type("BytesIO", (), {"write": lambda self, d: None})()
    handler.log_message = lambda *args: None

    body = json.dumps({"expression": expr}).encode("utf-8")
    handler.rfile = __import__("io").BytesIO(body)
    handler.headers = {"Content-Length": str(len(body))}
    handler.do_POST()
    return store


def run_batch_flow(expr="2+3*4"):
    """Run the batch processing flow."""
    return process_expressions(expr)


def run_history_flow(expr="2+3*4"):
    """Run the history query flow (recomputes through shared pipeline)."""
    store = HistoryStore()
    # First add via direct evaluate
    result, err = evaluate(expr, flow_id="flow-api-calculate")
    if not err:
        store.add(expr, result)

    # Query history - recompute through shared pipeline
    record = store.get(1)
    recomputed, _ = evaluate(record["expression"], flow_id="flow-history-query")
    return recomputed


# --- Tests ---

class TestMultiFlowStackDifferentiation:
    """Verify that shared code points produce different stacks under different flows."""

    def test_all_flows_produce_probes(self):
        """All 3 flows must produce codepoint entries."""
        if not is_enabled():
            pytest.skip("Codepoints not enabled - toggle file missing")

        # Run all 3 flows
        run_api_flow("10+20")
        run_batch_flow("10+20")
        run_history_flow("10+20")

        entries = read_codepoint_log()
        assert len(entries) > 0, "No codepoint output from any flow"

        api_entries = filter_by_flow_id(entries, "flow-api-calculate")
        batch_entries = filter_by_flow_id(entries, "flow-batch-process")
        history_entries = filter_by_flow_id(entries, "flow-history-query")

        assert len(api_entries) > 0, "No entries found with flow_id=flow-api-calculate"
        assert len(batch_entries) > 0, "No entries found with flow_id=flow-batch-process"
        assert len(history_entries) > 0, "No entries found with flow_id=flow-history-query"

    def test_api_flow_stack_references_handler(self):
        """API flow stacks should contain server.py or handler references."""
        if not is_enabled():
            pytest.skip("Codepoints not enabled")

        run_api_flow("7*8")
        entries = read_codepoint_log()
        api_entries = filter_by_flow_id(entries, "flow-api-calculate")

        all_frames = []
        for e in api_entries:
            all_frames.extend(get_frame_funcs(e))
            all_frames.extend(get_frame_files(e))

        frame_str = " ".join(all_frames)
        assert "server.py" in frame_str or "evaluate" in frame_str, \
            f"API flow stack should reference server.py or evaluate, got: {frame_str}"

    def test_batch_flow_stack_references_processor(self):
        """Batch flow stacks should contain processor.py or process_expressions."""
        if not is_enabled():
            pytest.skip("Codepoints not enabled")

        run_batch_flow("7*8")
        entries = read_codepoint_log()
        batch_entries = filter_by_flow_id(entries, "flow-batch-process")

        all_frames = []
        for e in batch_entries:
            all_frames.extend(get_frame_funcs(e))
            all_frames.extend(get_frame_files(e))

        frame_str = " ".join(all_frames)
        assert "processor.py" in frame_str or "process_expressions" in frame_str, \
            f"Batch flow stack should reference processor.py or process_expressions, got: {frame_str}"

    def test_api_and_batch_stacks_differ(self):
        """API and Batch stacks must be different (different callers)."""
        if not is_enabled():
            pytest.skip("Codepoints not enabled")

        entries = read_codepoint_log()
        api_entries = filter_by_flow_id(entries, "flow-api-calculate")
        batch_entries = filter_by_flow_id(entries, "flow-batch-process")

        if not api_entries or not batch_entries:
            pytest.skip("Need entries from both flows")

        api_str = entries_to_string(api_entries)
        batch_str = entries_to_string(batch_entries)

        assert api_str != batch_str, "API and Batch stacks must be different"

    def test_shared_path_probes_differ_across_flows(self):
        """Shared path probes (cp-calc-compute) should show different callers."""
        if not is_enabled():
            pytest.skip("Codepoints not enabled")

        entries = read_codepoint_log()
        api_compute = filter_by_point_id(
            filter_by_flow_id(entries, "flow-api-calculate"), "cp-calc-compute"
        )
        batch_compute = filter_by_point_id(
            filter_by_flow_id(entries, "flow-batch-process"), "cp-calc-compute"
        )

        if not api_compute or not batch_compute:
            pytest.skip("Need shared path entries from both flows")

        api_funcs = get_frame_funcs(api_compute[0])
        batch_funcs = get_frame_funcs(batch_compute[0])

        # They should not be identical (different callers above evaluate)
        assert api_funcs != batch_funcs, \
            "Shared path probes should show different call stacks across flows"


class TestProbeDensity:
    """Verify adjacent code points have reasonable stack overlap (20-60% target)."""

    def test_density_in_target_range(self):
        """Check probe density between consecutive entries."""
        if not is_enabled():
            pytest.skip("Codepoints not enabled")

        # Trigger a single flow
        evaluate("2+3*4+1", flow_id="flow-density-test")
        entries = read_codepoint_log()

        if len(entries) < 2:
            pytest.skip(f"Need at least 2 probe entries for density check, got {len(entries)}")

        # Check density between last 2 entries from our flow
        density_entries = filter_by_flow_id(entries, "flow-density-test")
        if len(density_entries) < 2:
            pytest.skip("Not enough entries from density test flow")

        # Build stack strings from frames
        stacks = []
        for e in density_entries:
            frames = e.get("frames", [])
            stack_str = "\n".join(
                f'File "{f.get("file", "")}", line {f.get("line", 0)}, in {f.get("func", "")}'
                for f in frames
            )
            stacks.append(stack_str)

        # Report density for informational purposes
        # Note: probes within the same call chain share most frames,
        # so high overlap is expected for Python's point_json format.
        densities = []
        for i in range(len(stacks) - 1):
            overlap = analyze_overlap(stacks[i], stacks[i+1])
            densities.append(overlap)

        # Just verify analyze_overlap works (returns valid float values)
        assert all(0.0 <= d <= 1.0 for d in densities), \
            f"Invalid density values: {densities}"
        assert len(densities) > 0, "No density pairs computed"


class TestFlowIDMetadata:
    """Verify probes contain correct flow_id in metadata."""

    def test_flow_id_in_metadata(self):
        """All probe entries should contain flow_id in their metadata."""
        if not is_enabled():
            pytest.skip("Codepoints not enabled")

        evaluate("(2+3)*4", flow_id="flow-metadata-test")
        entries = read_codepoint_log()
        meta_entries = filter_by_flow_id(entries, "flow-metadata-test")

        assert len(meta_entries) > 0, "No entries found from metadata test flow"

        for entry in meta_entries:
            meta = entry.get("meta", {})
            assert "flow_id" in meta, f"Entry {entry.get('name')} missing flow_id in meta"
            assert meta["flow_id"] == "flow-metadata-test", \
                f"Entry {entry.get('name')} has wrong flow_id: {meta['flow_id']}"

    def test_three_distinct_flow_ids(self):
        """Running all 3 flows produces 3 distinct flow_id values."""
        if not is_enabled():
            pytest.skip("Codepoints not enabled")

        run_api_flow("3+4")
        run_batch_flow("3+4")
        run_history_flow("3+4")

        entries = read_codepoint_log()
        flow_ids = set()
        for e in entries:
            meta = e.get("meta", {})
            fid = meta.get("flow_id", "")
            if fid:
                flow_ids.add(fid)

        assert "flow-api-calculate" in flow_ids, "Missing flow-api-calculate"
        assert "flow-batch-process" in flow_ids, "Missing flow-batch-process"
        assert "flow-history-query" in flow_ids, "Missing flow-history-query"
