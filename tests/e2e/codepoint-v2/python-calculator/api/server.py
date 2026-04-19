"""REST API handlers using http.server standard library."""

import json
from http.server import BaseHTTPRequestHandler

from calculator.core import evaluate
from codepoint import point_json


def create_handler(history_store):
    """Create request handler class bound to a history store."""

    class CalculatorHandler(BaseHTTPRequestHandler):
        def do_POST(self):
            if self.path == "/api/calculate":
                self._handle_calculate()
            else:
                self._send_json(404, {"error": "not found"})

        def do_GET(self):
            if self.path == "/api/history":
                self._handle_history_list()
            elif self.path.startswith("/api/history/"):
                self._handle_history_get()
            else:
                self._send_json(404, {"error": "not found"})

        def _handle_calculate(self):
            flow_id = "flow-api-calculate"
            point_json("cp-api-calc-entry", {
                "point_id": "cp-api-calc-entry",
                "flow_id": flow_id,
            })

            body = self._read_body()
            if body is None:
                return
            expr = body.get("expression", "").strip()
            if not expr:
                self._send_json(400, {"error": "empty expression"})
                return

            result, err = evaluate(expr, flow_id=flow_id)

            resp = {"expression": expr}
            if err:
                resp["error"] = err
                history_store.add(expr, err)
            else:
                resp["result"] = result
                history_store.add(expr, result)

            point_json("cp-api-calc-done", {
                "point_id": "cp-api-calc-done",
                "flow_id": flow_id,
                "result": resp.get("result", ""),
                "error": resp.get("error", ""),
            })
            self._send_json(200, resp)

        def _handle_history_list(self):
            records = history_store.get_all()
            self._send_json(200, records)

        def _handle_history_get(self):
            flow_id = "flow-history-query"
            point_json("cp-history-entry", {
                "point_id": "cp-history-entry",
                "flow_id": flow_id,
            })

            try:
                record_id = int(self.path.split("/")[-1])
            except ValueError:
                self._send_json(400, {"error": "invalid id"})
                return

            record = history_store.get(record_id)
            if record is None:
                self._send_json(404, {"error": "not found"})
                return

            point_json("cp-history-lookup", {
                "point_id": "cp-history-lookup",
                "flow_id": flow_id,
                "expr": record["expression"],
            })

            # CRITICAL: Recompute through shared pipeline (parse -> validate -> compute -> format)
            recomputed, calc_err = evaluate(record["expression"], flow_id=flow_id)

            resp = {
                "id": record["id"],
                "expression": record["expression"],
                "result": record["result"],
            }
            if calc_err:
                resp["recomputed"] = "error: " + calc_err
            else:
                resp["recomputed"] = recomputed

            point_json("cp-history-done", {
                "point_id": "cp-history-done",
                "flow_id": flow_id,
                "recomputed": resp["recomputed"],
            })
            self._send_json(200, resp)

        def _read_body(self):
            length = int(self.headers.get("Content-Length", 0))
            if length == 0:
                self._send_json(400, {"error": "empty body"})
                return None
            raw = self.rfile.read(length)
            try:
                return json.loads(raw)
            except json.JSONDecodeError:
                self._send_json(400, {"error": "invalid JSON"})
                return None

        def _send_json(self, status, data):
            body = json.dumps(data).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def log_message(self, format, *args):
            pass  # suppress default logging

    return CalculatorHandler
