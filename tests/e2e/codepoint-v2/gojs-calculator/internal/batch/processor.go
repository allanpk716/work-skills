package batch

import (
	"context"
	"fmt"
	"os"
	"strings"
	"time"

	"gojs-calculator/codepoint"
	"gojs-calculator/internal/calculator"
)

// Result holds the result of processing a single expression.
type Result struct {
	LineNumber int
	Expression string
	Output     string
	Error      string
	Duration   time.Duration
}

// ProcessExpressions reads expressions from input (one per line),
// evaluates each through the shared calculator pipeline, and returns results.
// Flow: CLI --batch -> ReadLines -> Evaluate (Parse->Validate->Compute->Format) -> WriteOutput
func ProcessExpressions(ctx context.Context, input string) ([]Result, error) {
	ctx = context.WithValue(ctx, calculator.FlowIDKey{}, "flow-batch-process")

	codepoint.PointWithMeta("cp-batch-entry", map[string]any{
		"point_id": "cp-batch-entry",
		"flow_id":  "flow-batch-process",
	})

	lines := strings.Split(strings.TrimSpace(input), "\n")
	if len(lines) == 0 {
		return nil, fmt.Errorf("no expressions to process")
	}

	var results []Result
	for i, line := range lines {
		select {
		case <-ctx.Done():
			return results, ctx.Err()
		default:
		}

		expr := strings.TrimSpace(line)
		if expr == "" || strings.HasPrefix(expr, "#") {
			continue
		}

		start := time.Now()
		output, err := calculator.Evaluate(ctx, expr)
		duration := time.Since(start)

		r := Result{
			LineNumber: i + 1,
			Expression: expr,
			Output:     output,
			Duration:   duration,
		}
		if err != nil {
			r.Error = err.Error()
		}
		results = append(results, r)
	}

	return results, nil
}

// ProcessFile reads expressions from a file and processes them.
func ProcessFile(ctx context.Context, filePath string) ([]Result, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to read file: %w", err)
	}
	return ProcessExpressions(ctx, string(data))
}

// FormatResults formats batch results as text output.
func FormatResults(results []Result) string {
	var sb strings.Builder
	for _, r := range results {
		if r.Error != "" {
			fmt.Fprintf(&sb, "Line %d: %s = ERROR: %s (%s)\n", r.LineNumber, r.Expression, r.Error, r.Duration)
		} else {
			fmt.Fprintf(&sb, "Line %d: %s = %s (%s)\n", r.LineNumber, r.Expression, r.Output, r.Duration)
		}
	}
	return sb.String()
}
