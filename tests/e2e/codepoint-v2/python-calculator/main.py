"""CLI entry point for batch processing."""
import sys

from batch.processor import process_expressions


def main():
    if len(sys.argv) > 1:
        # Single expression mode
        expr = sys.argv[1]
        from calculator.core import evaluate
        result, err = evaluate(expr, flow_id="flow-cli-single")
        if err:
            print(f"Error: {err}")
        else:
            print(f"Result: {result}")
    else:
        # Batch mode from stdin
        print("Enter expressions (one per line, Ctrl+D/Ctrl+Z to end):")
        try:
            expressions = sys.stdin.read()
        except EOFError:
            return
        results = process_expressions(expressions)
        for r in results:
            if r["error"]:
                print(f"{r['expr']}: Error: {r['error']}")
            else:
                print(f"{r['expr']} = {r['result']}")


if __name__ == "__main__":
    main()
