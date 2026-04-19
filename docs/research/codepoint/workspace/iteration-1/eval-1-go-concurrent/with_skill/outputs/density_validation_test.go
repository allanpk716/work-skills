// density_validation_test.go
// Validates code point density across the handler -> service -> repository layers.
//
// Run with:
//   CODEPOINT_ENABLED=true go test -v -run TestCodePointDensity ./...
//
// This test simulates the actual call chain and measures stack frame overlap
// between adjacent code points to ensure proper density:
//   - overlap > 0.8  => too dense (remove some points)
//   - overlap == 0   => too sparse (add intermediate points)
//   - overlap 0.2-0.6 => good density

package density

import (
	"context"
	"fmt"
	"os"
	"sync"
	"testing"

	"myproject/codepoint"
)

// TestDensity_HandlerToService measures overlap between handler and service layer points.
// These should have moderate overlap because they share HTTP runtime frames
// but differ in application frames.
func TestDensity_HandlerToService(t *testing.T) {
	os.Setenv("CODEPOINT_ENABLED", "true")
	codepoint.Enable()
	defer codepoint.Disable()

	c := codepoint.NewCollector()

	// Simulate handler entry
	collectorFunc1 := func() {
		c.Collect("order_handler_entry")
	}
	// Simulate service entry (called from handler)
	collectorFunc2 := func() {
		simulateHandlerToServiceCall()
		c.Collect("order_service_create_entry")
	}

	collectorFunc1()
	collectorFunc2()

	results := c.AnalyzeDensity()
	for _, r := range results {
		t.Logf("  %s -> %s: overlap=%.4f [%s]",
			r.PointA, r.PointB, r.Overlap, r.Density)

		if r.Density == "too_dense" {
			t.Logf("  WARNING: points %s and %s are too close, consider removing one", r.PointA, r.PointB)
		}
		if r.Density == "too_sparse" {
			t.Logf("  WARNING: no shared frames between %s and %s, add intermediate points", r.PointA, r.PointB)
		}
	}
}

// TestDensity_WithinService measures overlap between points inside the service layer.
// These should show good density as they share service frames with
// meaningful differences at each phase.
func TestDensity_WithinService(t *testing.T) {
	codepoint.Enable()
	defer codepoint.Disable()

	c := codepoint.NewCollector()

	c.Collect("order_service_create_entry")
	c.Collect("order_service_create_after_validate")
	c.Collect("order_service_inventory_before_deduct")
	c.Collect("order_service_inventory_after_deduct")
	c.Collect("order_service_db_create_success")
	c.Collect("order_service_cache_lock_acquired")
	c.Collect("order_service_cache_lock_released")

	results := c.AnalyzeDensity()

	tooDense := 0
	tooSparse := 0
	goodCount := 0

	for _, r := range results {
		t.Logf("  %s -> %s: overlap=%.4f [%s]",
			r.PointA, r.PointB, r.Overlap, r.Density)

		switch r.Density {
		case "too_dense":
			tooDense++
		case "too_sparse":
			tooSparse++
		case "good":
			goodCount++
		}
	}

	t.Logf("Summary: good=%d, too_dense=%d, too_sparse=%d", goodCount, tooDense, tooSparse)

	if tooDense > len(results)/2 {
		t.Errorf("Too many dense pairs (%d/%d). Consider removing redundant code points.", tooDense, len(results))
	}
	if tooSparse > len(results)/2 {
		t.Errorf("Too many sparse pairs (%d/%d). Consider adding intermediate code points.", tooSparse, len(results))
	}
}

// TestDensity_ConcurrencyJunctions measures overlap at lock acquire/release pairs.
// These are intentionally close in the call chain (same function, just a few lines apart).
// A high overlap is expected and acceptable here because the goroutine ID metadata
// differentiates them at runtime.
func TestDensity_ConcurrencyJunctions(t *testing.T) {
	codepoint.Enable()
	defer codepoint.Disable()

	c := codepoint.NewCollector()

	// Simulate lock acquire/release pattern
	var mu sync.Mutex
	collectLockSequence := func(id int) {
		c.Collect(fmt.Sprintf("concurrency_before_lock_%d", id))
		mu.Lock()
		c.Collect(fmt.Sprintf("concurrency_lock_acquired_%d", id))
		mu.Unlock()
		c.Collect(fmt.Sprintf("concurrency_lock_released_%d", id))
	}

	collectLockSequence(1)
	collectLockSequence(2)

	results := c.AnalyzeDensity()
	for _, r := range results {
		t.Logf("  %s -> %s: overlap=%.4f [%s]",
			r.PointA, r.PointB, r.Overlap, r.Density)
	}
}

// TestDensity_GoroutinePoolBoundary measures overlap between pool submit and worker execution.
// These should show ZERO overlap because they run in different goroutines.
// This is a special case where "too sparse" is expected and correct.
func TestDensity_GoroutinePoolBoundary(t *testing.T) {
	codepoint.Enable()
	defer codepoint.Disable()

	c := codepoint.NewCollector()

	taskCh := make(chan func(), 10)
	done := make(chan struct{})

	// Simulate pool submission (caller goroutine)
	c.Collect("worker_pool_submit")

	// Simulate worker execution (different goroutine)
	go func() {
		task := <-taskCh
		c.Collect("worker_pool_task_received")
		task()
		c.Collect("worker_pool_task_completed")
		done <- struct{}{}
	}()

	taskCh <- func() {} // no-op task
	<-done

	results := c.AnalyzeDensity()
	for _, r := range results {
		t.Logf("  %s -> %s: overlap=%.4f [%s]",
			r.PointA, r.PointB, r.Overlap, r.Density)

		// Cross-goroutine boundary pairs are expected to be sparse.
		// This is correct behavior, not a density problem.
		if r.Overlap == 0 {
			t.Logf("  (cross-goroutine pair -- zero overlap is expected here)")
		}
	}
}

// TestDensity_FullChainValidation runs all placement points through density analysis
// and produces a comprehensive report.
func TestDensity_FullChainValidation(t *testing.T) {
	codepoint.Enable()
	defer codepoint.Disable()

	c := codepoint.NewCollector()

	// All code points from the placement, in execution order:
	createOrderPoints := []string{
		"order_handler_entry",
		"order_handler_after_decode",
		"order_handler_pool_worker_start",
		"order_service_create_entry",
		"order_service_create_after_validate",
		"order_service_inventory_before_deduct",
		"order_service_inventory_after_deduct",
		"order_service_db_create_success",
		"order_service_cache_lock_acquired",
		"order_service_cache_lock_released",
		"order_handler_pool_worker_done",
		"order_handler_success",
		"order_handler_response_sent",
	}

	getOrderPoints := []string{
		"order_get_handler_entry",
		"order_get_handler_after_parse",
		"order_service_get_entry",
		"order_service_get_cache_lock_acquired",
		"order_service_get_cache_lock_released",
		"order_service_get_cache_hit", // or miss
	}

	updateOrderPoints := []string{
		"order_update_handler_entry",
		"order_update_handler_after_decode",
		"order_update_pool_worker_start",
		"order_service_update_entry",
		"order_service_update_current_state",
		"order_service_update_transition_validated",
		"order_service_update_db_success",
		"order_service_update_cache_lock_acquired",
		"order_service_update_cache_refreshed",
		"order_service_update_cache_lock_released",
		"order_update_pool_worker_done",
	}

	t.Log("=== Create Order Path ===")
	validatePath(t, c, createOrderPoints)
	c.Reset()

	t.Log("=== Get Order Path ===")
	validatePath(t, c, getOrderPoints)
	c.Reset()

	t.Log("=== Update Order Path ===")
	validatePath(t, c, updateOrderPoints)
}

func validatePath(t *testing.T, c *codepoint.Collector, points []string) {
	for _, p := range points {
		c.Collect(p)
	}

	results := c.AnalyzeDensity()

	t.Logf("  Path: %d code points, %d overlap measurements\n", len(points), len(results))

	good := 0
	other := 0
	for _, r := range results {
		status := "OK"
		if r.Density != "good" {
			status = "REVIEW"
			other++
		} else {
			good++
		}
		t.Logf("  [%s] %s -> %s: %.4f", status, r.PointA, r.PointB, r.Overlap)
	}

	t.Logf("  Result: %d/%d pairs have good density\n", good, len(results))

	if other > 0 {
		t.Logf("  NOTE: %d pairs need review. This may be expected for cross-goroutine boundaries.", other)
	}
}

func simulateHandlerToServiceCall() {
	// Simulates crossing the handler -> service module boundary
}
