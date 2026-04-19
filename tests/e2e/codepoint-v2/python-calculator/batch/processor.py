"""Batch processor for expressions."""

from calculator.core import evaluate
from codepoint import point_json


def process_expressions(expressions: str, flow_id: str = "flow-batch-process") -> list:
    """Process multiple expressions (one per line) through the shared calculator pipeline."""
    point_json("cp-batch-entry", {
        "point_id": "cp-batch-entry",
        "flow_id": flow_id,
    })

    results = []
    for line in expressions.strip().split("\n"):
        expr = line.strip()
        if not expr or expr.startswith("#"):
            continue
        result, err = evaluate(expr, flow_id=flow_id)
        results.append({"expr": expr, "result": result, "error": err})

    point_json("cp-batch-done", {
        "point_id": "cp-batch-done",
        "flow_id": flow_id,
        "count": len(results),
    })
    return results
