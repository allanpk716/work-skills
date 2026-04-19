"""FastAPI application with API routes, collector endpoint, and static file serving."""

from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import JSONResponse, Response
from fastapi.staticfiles import StaticFiles

from calculator.core import evaluate
from codepoint import point_json
from codepoint.collector import receive, is_ts_enabled, close_ts_collector
from history.store import HistoryStore
from batch.processor import process_expressions


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    app = FastAPI(title="PyTS Calculator")
    store = HistoryStore()

    @app.post("/__codepoint__")
    async def codepoint_collector(entry: dict):
        """Receive frontend code point entries. Returns 404 if TS collector disabled."""
        if not is_ts_enabled():
            return JSONResponse(status_code=404, content={"error": "collector disabled"})
        receive(entry)
        return Response(status_code=204)

    @app.post("/api/calculate")
    async def calculate(body: dict):
        """Calculate expression through shared pipeline."""
        flow_id = "flow-api-calculate"
        point_json("cp-api-calc-entry", {
            "point_id": "cp-api-calc-entry",
            "flow_id": flow_id,
        })

        expr = body.get("expression", "").strip()
        if not expr:
            return JSONResponse(status_code=400, content={"error": "empty expression"})

        result, err = evaluate(expr, flow_id=flow_id)

        resp = {"expression": expr}
        if err:
            resp["error"] = err
            store.add(expr, err)
        else:
            resp["result"] = result
            store.add(expr, result)

        point_json("cp-api-calc-done", {
            "point_id": "cp-api-calc-done",
            "flow_id": flow_id,
            "result": resp.get("result", ""),
            "error": resp.get("error", ""),
        })
        return resp

    @app.get("/api/history")
    async def history_list():
        """Return all calculation history records."""
        return store.get_all()

    @app.get("/api/history/{record_id}")
    async def history_detail(record_id: int):
        """Retrieve a specific history record and recompute through shared pipeline."""
        flow_id = "flow-history-query"
        point_json("cp-history-entry", {
            "point_id": "cp-history-entry",
            "flow_id": flow_id,
        })

        record = store.get(record_id)
        if record is None:
            return JSONResponse(status_code=404, content={"error": "not found"})

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
        return resp

    @app.post("/api/batch")
    async def batch(body: dict):
        """Process multiple expressions (one per line) through shared pipeline."""
        flow_id = "flow-batch-process"
        input_text = body.get("expressions", "")
        results = process_expressions(input_text, flow_id=flow_id)

        formatted = []
        for r in results:
            formatted.append({
                "expression": r["expr"],
                "output": r["result"],
                "error": r["error"],
            })
        return {"results": formatted}

    @app.on_event("shutdown")
    def shutdown():
        """Flush and close TS collector file handle on shutdown."""
        close_ts_collector()

    # StaticFiles mount LAST — all API routes must be registered before this
    dist_dir = Path(__file__).resolve().parent.parent / "frontend" / "dist"
    if dist_dir.is_dir():
        app.mount("/", StaticFiles(directory=str(dist_dir), html=True), name="static")

    return app
