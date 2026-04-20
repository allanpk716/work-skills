// concurrency_probe_test.go
// Integration test that exercises concurrent code paths and collects
// code point output for AI analysis.
//
// Run with:
//   CODEPOINT_ENABLED=true go test -v -run TestConcurrentProbe ./... 2> concurrency_probes.log
//
// The resulting concurrency_probes.log file contains runtime call stacks
// from multiple goroutines, which can be fed to AI to detect:
//   - Lock contention patterns (goroutine ID appearing at lock_acquire for same lock)
//   - Out-of-order execution (unexpected sequence of code points)
//   - Lost updates (cache status != DB status after concurrent updates)
//   - Goroutine pool saturation (submit without corresponding task_received)

package concurrency

import (
	"fmt"
	"os"
	"sync"
	"testing"
	"time"

	"myproject/codepoint"
)

// TestConcurrentCreateOrder simulates multiple concurrent order creations
// and captures the runtime execution pattern.
func TestConcurrentCreateOrder(t *testing.T) {
	codepoint.Enable()
	defer codepoint.Disable()

	c := codepoint.NewCollector()
	var mu sync.Mutex
	stock := map[int64]int{1: 100} // product 1 has 100 units
	var orders []string

	const concurrentRequests = 20

	var wg sync.WaitGroup
	for i := 0; i < concurrentRequests; i++ {
		wg.Add(1)
		go func(requestID int) {
			defer wg.Done()

			c.Collect(fmt.Sprintf("req_%d_handler_entry", requestID))

			// Simulate mutex-protected inventory deduction
			mu.Lock()
			c.Collect(fmt.Sprintf("req_%d_inventory_lock_acquired", requestID))

			if stock[1] >= 1 {
				stock[1]--
				c.Collect(fmt.Sprintf("req_%d_inventory_deducted", requestID))
			} else {
				c.Collect(fmt.Sprintf("req_%d_inventory_insufficient", requestID))
				mu.Unlock()
				return
			}

			mu.Unlock()
			c.Collect(fmt.Sprintf("req_%d_inventory_lock_released", requestID))

			// Simulate DB write (no lock)
			orderID := fmt.Sprintf("ORD-%d-%d", requestID, time.Now().UnixNano())
			c.Collect(fmt.Sprintf("req_%d_db_write_start", requestID))
			time.Sleep(time.Microsecond * time.Duration(requestID%5)) // simulate latency variance
			c.Collect(fmt.Sprintf("req_%d_db_write_end", requestID))

			// Simulate cache update (separate mutex)
			mu.Lock()
			c.Collect(fmt.Sprintf("req_%d_cache_lock_acquired", requestID))
			orders = append(orders, orderID)
			mu.Unlock()
			c.Collect(fmt.Sprintf("req_%d_cache_lock_released", requestID))

			c.Collect(fmt.Sprintf("req_%d_complete", requestID))
		}(i)
	}

	wg.Wait()

	t.Logf("=== Concurrent Create Order Results ===")
	t.Logf("Total orders created: %d", len(orders))
	t.Logf("Remaining stock: %d", stock[1])

	// Analyze density
	results := c.AnalyzeDensity()
	t.Logf("Code point pairs analyzed: %d", len(results))

	// Print all captured points with timing for sequence analysis
	allPoints := c.GetAll()
	for i, p := range allPoints {
		t.Logf("  [%d] %s @ %s", i, p.Name, p.Timestamp.Format("15:04:05.000000000"))
	}

	// Check for potential issues
	t.Log("\n=== Diagnostic Analysis ===")

	// Group by request ID to verify each request completes all phases
	phaseCounts := make(map[string]int)
	for _, p := range allPoints {
		prefix := extractRequestPrefix(p.Name)
		phaseCounts[prefix]++
	}
	for req, count := range phaseCounts {
		if count < 7 {
			t.Logf("  WARNING: %s only has %d phases (expected 7-9). Possible incomplete execution.", req, count)
		}
	}

	t.Log("\nTo analyze runtime call chains, inspect concurrency_probes.log")
}

// TestConcurrentReadWriteConflict simulates concurrent reads and writes
// to detect stale cache reads.
func TestConcurrentReadWriteConflict(t *testing.T) {
	codepoint.Enable()
	defer codepoint.Disable()

	c := codepoint.NewCollector()
	var mu sync.RWMutex
	cache := map[string]string{"order_1": "created"}
	dbStatus := "paid"

	// Writer goroutine: updates DB then cache
	done := make(chan struct{})
	go func() {
		c.Collect("writer_start")

		// Update DB (simulated)
		dbStatus = "shipped"
		c.Collect("writer_db_updated")

		// Update cache
		mu.Lock()
		cache["order_1"] = "shipped"
		mu.Unlock()
		c.Collect("writer_cache_updated")

		done <- struct{}{}
	}()

	// Reader goroutines: read from cache then DB
	for i := 0; i < 5; i++ {
		go func(readerID int) {
			c.Collect(fmt.Sprintf("reader_%d_start", readerID))

			mu.RLock()
			cached := cache["order_1"]
			mu.RUnlock()
			c.CollectWithMeta(fmt.Sprintf("reader_%d_cache_read", readerID), map[string]any{
				"cached_status": cached,
			})

			if cached != dbStatus {
				c.CollectWithMeta(fmt.Sprintf("reader_%d_stale_detected", readerID), map[string]any{
					"cached": cached,
					"db":     dbStatus,
				})
			}

			c.Collect(fmt.Sprintf("reader_%d_done", readerID))
		}(i)
	}

	<-done

	allPoints := c.GetAll()
	t.Logf("=== Concurrent Read-Write Points ===")
	for _, p := range allPoints {
		t.Logf("  %s @ %s", p.Name, p.Timestamp.Format("15:04:05.000000000"))
	}
}

// TestGoroutinePoolSaturation simulates pool saturation to detect
// tasks that are submitted but never picked up.
func TestGoroutinePoolSaturation(t *testing.T) {
	codepoint.Enable()
	defer codepoint.Disable()

	c := codepoint.NewCollector()
	taskCh := make(chan func(), 5)
	const workers = 3

	var wg sync.WaitGroup

	// Start workers
	for i := 0; i < workers; i++ {
		wg.Add(1)
		go func(workerID int) {
			defer wg.Done()
			for task := range taskCh {
				c.CollectWithMeta("worker_task_received", map[string]any{"worker_id": workerID})
				task()
				c.CollectWithMeta("worker_task_completed", map[string]any{"worker_id": workerID})
			}
		}(i)
	}

	// Submit more tasks than workers
	const totalTasks = 10
	submitted := make(chan string, totalTasks)

	for i := 0; i < totalTasks; i++ {
		c.Collect(fmt.Sprintf("submit_task_%d", i))
		taskCh <- func() {
			time.Sleep(time.Millisecond)
		}
		submitted <- fmt.Sprintf("task_%d", i)
	}
	close(taskCh)
	wg.Wait()

	// Count submits vs completions
	allPoints := c.GetAll()
	submits := 0
	received := 0
	completed := 0
	for _, p := range allPoints {
		switch {
		case p.Name == "worker_task_received":
			received++
		case p.Name == "worker_task_completed":
			completed++
		}
	}

	// Count submits from collector (they have unique names)
	for _, p := range allPoints {
		if len(p.Name) >= 6 && p.Name[:6] == "submit" {
			submits++
		}
	}

	t.Logf("Pool saturation: submitted=%d received=%d completed=%d", submits, received, completed)

	if submitted != totalTasks {
		t.Errorf("Expected %d submits, got %d", totalTasks, submits)
	}
	if received != totalTasks {
		t.Errorf("Expected %d task_received events, got %d. Pool may have dropped tasks.", totalTasks, received)
	}
	if completed != totalTasks {
		t.Errorf("Expected %d task_completed events, got %d. Workers may have crashed.", totalTasks, completed)
	}
}

func extractRequestPrefix(name string) string {
	// Extract "req_N" from names like "req_3_handler_entry"
	for i := 0; i < len(name)-1; i++ {
		if name[i] == '_' && i > 0 {
			// Found second underscore
			return name[:i]
		}
	}
	return name
}

// Collector needs CollectWithMeta method for the test.
// In the base library, we use PointWithMeta directly via codepoint package.
// For the test's Collector wrapper, we capture via CollectStack.
func (c *codepoint.Collector) CollectWithMeta(name string, meta map[string]any) {
	if !codepoint.IsEnabled() {
		return
	}
	codepoint.PointWithMeta(name, meta)
	// Also record in collector for analysis
	c.Collect(name)
}
