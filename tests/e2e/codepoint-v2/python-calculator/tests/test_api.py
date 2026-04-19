"""Tests for REST API handlers."""

import json
import io
from http.server import BaseHTTPRequestHandler
from unittest.mock import MagicMock

from api.server import create_handler
from history.store import HistoryStore


class MockRequest:
    """Helper to simulate HTTP requests for testing."""
    def __init__(self, method, path, body=None):
        self.method = method
        self.path = path
        self.body = body or {}


def make_request(handler_class, method, path, body=None):
    """Execute a request against the handler and capture the response."""
    store = HistoryStore()
    handler_class = create_handler(store)

    response_data = {}
    wfile_buffer = io.BytesIO()

    def mock_send_response(code):
        response_data["status"] = code

    def mock_send_header(key, value):
        pass

    def mock_end_headers():
        pass

    # Build the handler instance manually
    handler = handler_class.__new__(handler_class)
    handler.path = path
    handler.send_response = mock_send_response
    handler.send_header = mock_send_header
    handler.end_headers = mock_end_headers
    handler.wfile = wfile_buffer
    handler.log_message = lambda *args: None

    if body is not None:
        raw = json.dumps(body).encode("utf-8")
        handler.rfile = io.BytesIO(raw)
        handler.headers = {"Content-Length": str(len(raw))}
    else:
        handler.rfile = io.BytesIO(b"")
        handler.headers = {"Content-Length": "0"}

    if method == "POST":
        handler.do_POST()
    elif method == "GET":
        handler.do_GET()

    wfile_buffer.seek(0)
    try:
        resp_body = json.loads(wfile_buffer.read().decode("utf-8"))
    except json.JSONDecodeError:
        resp_body = {}

    return response_data.get("status", 0), resp_body, store


class TestCalculateAPI:
    def test_simple_addition(self):
        status, body, _ = make_request(None, "POST", "/api/calculate", {"expression": "2+3"})
        assert status == 200
        assert body["result"] == "5.0"
        assert body.get("error", "") == ""

    def test_precedence(self):
        status, body, _ = make_request(None, "POST", "/api/calculate", {"expression": "2+3*4"})
        assert status == 200
        assert body["result"] == "14.0"

    def test_empty_expression(self):
        status, body, _ = make_request(None, "POST", "/api/calculate", {"expression": ""})
        assert status == 400

    def test_invalid_expression(self):
        status, body, _ = make_request(None, "POST", "/api/calculate", {"expression": "2++3"})
        assert body.get("error") != ""

    def test_division_by_zero(self):
        status, body, _ = make_request(None, "POST", "/api/calculate", {"expression": "1/0"})
        assert "division by zero" in body.get("error", "")


class TestHistoryAPI:
    def test_history_list_empty(self):
        status, body, _ = make_request(None, "GET", "/api/history")
        assert status == 200
        assert body == []

    def test_history_after_calculation(self):
        status, body, store = make_request(None, "POST", "/api/calculate", {"expression": "2+3"})
        assert status == 200

        # Check history list
        records = store.get_all()
        assert len(records) == 1
        assert records[0]["expression"] == "2+3"
        assert records[0]["result"] == "5.0"

    def test_history_get_recomputes(self):
        # Add a record via calculate
        _, _, store = make_request(None, "POST", "/api/calculate", {"expression": "6*7"})
        record = store.get(1)
        assert record is not None

        # Query history - should recompute
        status, body, _ = make_request(None, "GET", "/api/history/1")
        # The handler was created with a new store, so record won't exist
        # We need to test with the same store

    def test_history_get_with_shared_store(self):
        store = HistoryStore()
        store.add("6*7", "42.0")

        handler_class = create_handler(store)
        wfile_buffer = io.BytesIO()
        response_data = {}

        handler = handler_class.__new__(handler_class)
        handler.path = "/api/history/1"
        handler.send_response = lambda code: response_data.update({"status": code})
        handler.send_header = lambda k, v: None
        handler.end_headers = lambda: None
        handler.wfile = wfile_buffer
        handler.rfile = io.BytesIO(b"")
        handler.headers = {"Content-Length": "0"}
        handler.log_message = lambda *args: None

        handler.do_GET()

        wfile_buffer.seek(0)
        body = json.loads(wfile_buffer.read().decode("utf-8"))
        assert response_data["status"] == 200
        assert body["id"] == 1
        assert body["expression"] == "6*7"
        assert body["recomputed"] == "42.0"

    def test_history_not_found(self):
        store = HistoryStore()
        handler_class = create_handler(store)

        handler = handler_class.__new__(handler_class)
        handler.path = "/api/history/999"
        response_data = {}
        handler.send_response = lambda code: response_data.update({"status": code})
        handler.send_header = lambda k, v: None
        handler.end_headers = lambda: None
        handler.wfile = io.BytesIO()
        handler.rfile = io.BytesIO(b"")
        handler.headers = {"Content-Length": "0"}
        handler.log_message = lambda *args: None

        handler.do_GET()

        assert response_data["status"] == 404

    def test_history_invalid_id(self):
        store = HistoryStore()
        handler_class = create_handler(store)

        handler = handler_class.__new__(handler_class)
        handler.path = "/api/history/abc"
        response_data = {}
        handler.send_response = lambda code: response_data.update({"status": code})
        handler.send_header = lambda k, v: None
        handler.end_headers = lambda: None
        handler.wfile = io.BytesIO()
        handler.rfile = io.BytesIO(b"")
        handler.headers = {"Content-Length": "0"}
        handler.log_message = lambda *args: None

        handler.do_GET()

        assert response_data["status"] == 400
