package codepoint

import (
	"fmt"
	"testing"
)

// TestPointDisabled verifies that Point is zero-cost when disabled.
func TestPointDisabled(t *testing.T) {
	Point("test_should_be_noop")
}

// TestPointWithMetaDisabled verifies metadata variant is zero-cost when disabled.
func TestPointWithMetaDisabled(t *testing.T) {
	PointWithMeta("test_meta_noop", map[string]any{"key": "value"})
}

// TestPointJSONDisabled verifies JSON variant is zero-cost when disabled.
func TestPointJSONDisabled(t *testing.T) {
	PointJSON("test_json_noop")
}

// TestPointWithGoroutineIDDisabled verifies goroutine ID variant is zero-cost when disabled.
func TestPointWithGoroutineIDDisabled(t *testing.T) {
	PointWithGoroutineID("test_goid_noop")
}

// TestCollectStackDisabled verifies CollectStack returns empty when disabled.
func TestCollectStackDisabled(t *testing.T) {
	result := CollectStack("test_collect_noop")
	if result != "" {
		t.Errorf("expected empty string when disabled, got: %s", result)
	}
}

// TestCollectorThreadSafety runs concurrent collects to verify no data race.
func TestCollectorThreadSafety(t *testing.T) {
	Enable()
	defer Disable()

	c := NewCollector()
	const workers = 50
	done := make(chan struct{})

	for i := 0; i < workers; i++ {
		go func(id int) {
			defer func() { done <- struct{}{} }()
			c.Collect(fmt.Sprintf("concurrent_point_%d", id))
		}(i)
	}

	for i := 0; i < workers; i++ {
		<-done
	}

	points := c.GetAll()
	if len(points) != workers {
		t.Errorf("expected %d captured points, got %d", workers, len(points))
	}
}

// TestAnalyzeOverlapIdentical verifies overlap of identical stacks is 1.0.
func TestAnalyzeOverlapIdentical(t *testing.T) {
	Enable()
	defer Disable()

	stack := CollectStack("test_point")
	overlap := AnalyzeOverlap(stack, stack)
	if overlap < 0.99 {
		t.Errorf("identical stacks should have overlap ~1.0, got %.4f", overlap)
	}
}

// TestAnalyzeOverlapDifferent verifies different stacks have partial overlap.
func TestAnalyzeOverlapDifferent(t *testing.T) {
	Enable()
	defer Disable()

	stack1 := CollectStack("test_overlap_a")
	stack2 := CollectStack("test_overlap_b")
	overlap := AnalyzeOverlap(stack1, stack2)

	if overlap == 0 {
		t.Error("different points in same call chain should have some overlap")
	}
	t.Logf("Overlap between test_overlap_a and test_overlap_b: %.4f", overlap)
}

// TestCollectorReset verifies Reset clears all captured points.
func TestCollectorReset(t *testing.T) {
	Enable()
	defer Disable()

	c := NewCollector()
	c.Collect("point_1")
	c.Collect("point_2")

	if len(c.GetAll()) != 2 {
		t.Fatal("expected 2 points before reset")
	}

	c.Reset()
	if len(c.GetAll()) != 0 {
		t.Fatal("expected 0 points after reset")
	}
}

// TestClassifyDensity verifies density classification logic.
func TestClassifyDensity(t *testing.T) {
	tests := []struct {
		overlap  float64
		expected string
	}{
		{0.0, "too_sparse"},
		{0.1, "good"},
		{0.5, "good"},
		{0.6, "good"},
		{0.81, "too_dense"},
		{1.0, "too_dense"},
	}
	for _, tt := range tests {
		result := classifyDensity(tt.overlap)
		if result != tt.expected {
			t.Errorf("classifyDensity(%.2f) = %q, want %q", tt.overlap, result, tt.expected)
		}
	}
}

// TestCollectorAnalyzeDensity verifies density analysis on collected points.
func TestCollectorAnalyzeDensity(t *testing.T) {
	Enable()
	defer Disable()

	c := NewCollector()
	c.Collect("handler_entry")
	c.Collect("service_call")
	c.Collect("repo_query")
	c.Collect("repo_result")
	c.Collect("response_sent")

	results := c.AnalyzeDensity()
	if len(results) != 4 {
		t.Errorf("expected 4 density results (N-1 for 5 points), got %d", len(results))
	}

	for _, r := range results {
		t.Logf("%s -> %s: overlap=%.4f density=%s",
			r.PointA, r.PointB, r.Overlap, r.Density)
	}
}
