package batch

import (
	"context"
	"strings"
	"testing"
	"time"
)

func TestMain(m *testing.M) {
	m.Run()
}

func TestProcessExpressions(t *testing.T) {
	input := `2+3
10/2
# comment line
(2+3)*4`

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	results, err := ProcessExpressions(ctx, input)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(results) != 3 {
		t.Fatalf("expected 3 results, got %d", len(results))
	}

	if results[0].Output != "5.0" {
		t.Errorf("line 1 = %s, want 5.0", results[0].Output)
	}
	if results[1].Output != "5.0" {
		t.Errorf("line 2 = %s, want 5.0", results[1].Output)
	}
	if results[2].Output != "20.0" {
		t.Errorf("line 3 = %s, want 20.0", results[2].Output)
	}
}

func TestProcessExpressions_ErrorScenarios(t *testing.T) {
	input := `2++3
10/0`

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	results, err := ProcessExpressions(ctx, input)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if results[0].Error == "" {
		t.Error("expected error for '2++3' (invalid syntax)")
	}
	if results[1].Error == "" {
		t.Error("expected error for '10/0' (division by zero)")
	}
}

func TestFormatResults(t *testing.T) {
	results := []Result{
		{LineNumber: 1, Expression: "2+3", Output: "5.0", Duration: time.Millisecond},
		{LineNumber: 2, Expression: "bad", Error: "parse error", Duration: time.Millisecond},
	}

	output := FormatResults(results)
	if !strings.Contains(output, "Line 1: 2+3 = 5.0") {
		t.Errorf("missing success line in output:\n%s", output)
	}
	if !strings.Contains(output, "ERROR: parse error") {
		t.Errorf("missing error line in output:\n%s", output)
	}
}
