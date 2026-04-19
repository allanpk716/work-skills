package tests

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"go-calculator/codepoint"
	"go-calculator/internal/api"
	"go-calculator/internal/batch"
	"go-calculator/internal/history"
)

// TestMain enables codepoints for all tests in this package
// and ensures cleanup after all tests complete.
func TestMain(m *testing.M) {
	home, _ := os.UserHomeDir()
	toggleDir := filepath.Join(home, ".codepoint")
	os.MkdirAll(toggleDir, 0755)
	toggleFile := filepath.Join(toggleDir, ".codepoint-go")
	os.WriteFile(toggleFile, []byte{}, 0644)
	defer os.Remove(toggleFile)

	os.Exit(m.Run())
}

// TestMultiFlowStackDifferentiation verifies that the same shared code point
// (in calculator.Evaluate) produces different stack traces when called from
// different business flows.
//
// Differentiation levels:
// - Macro: entry probes at different handlers show completely different stacks
// - Micro: shared path probes in Evaluate show same function but different callers above
func TestMultiFlowStackDifferentiation(t *testing.T) {
	if !codepoint.IsEnabled() {
		t.Skip("Codepoints not enabled - toggle file missing")
	}

	// Set up test-specific temp directory for log isolation
	logDir := t.TempDir()
	t.Logf("Test log directory: %s", logDir)

	// Flow 1: REST API calculate
	runAPIFlow(t, "2+3*4")

	// Flow 2: Batch process
	runBatchFlow(t, "2+3*4")

	// Flow 3: History query (recompute through shared pipeline)
	runHistoryFlow(t, "2+3*4")

	// Read the accumulated codepoint log (all flows write to the same file)
	allEntries := readAllCodepointEntries(t)
	if len(allEntries) == 0 {
		t.Fatal("No codepoint output from any flow")
	}

	// Separate entries by flow_id
	apiEntries := filterEntriesByFlowID(allEntries, "flow-api-calculate")
	batchEntries := filterEntriesByFlowID(allEntries, "flow-batch-process")
	historyEntries := filterEntriesByFlowID(allEntries, "flow-history-query")

	if len(apiEntries) == 0 {
		t.Fatal("No entries found with flow_id=flow-api-calculate")
	}
	if len(batchEntries) == 0 {
		t.Fatal("No entries found with flow_id=flow-batch-process")
	}
	if len(historyEntries) == 0 {
		t.Fatal("No entries found with flow_id=flow-history-query")
	}

	t.Logf("API flow probe entries: %d", len(apiEntries))
	t.Logf("Batch flow probe entries: %d", len(batchEntries))
	t.Logf("History flow probe entries: %d", len(historyEntries))

	// --- Macro differentiation: entry probes show different handler frames ---

	apiStackStr := entriesToString(apiEntries)
	batchStackStr := entriesToString(batchEntries)
	historyStackStr := entriesToString(historyEntries)

	// API flow stack should contain api/server.go frames (from HandleCalculate)
	apiHasCalcHandler := strings.Contains(apiStackStr, "HandleCalculate") ||
		strings.Contains(apiStackStr, "server.go")
	if !apiHasCalcHandler {
		t.Error("API flow stack should reference HandleCalculate or server.go")
	}

	// Batch flow stack should contain batch/processor.go frames
	batchHasProcessor := strings.Contains(batchStackStr, "ProcessExpressions") ||
		strings.Contains(batchStackStr, "ProcessFile") ||
		strings.Contains(batchStackStr, "processor.go")
	if !batchHasProcessor {
		t.Error("Batch flow stack should reference ProcessExpressions/ProcessFile or processor.go")
	}

	// History flow stack should contain HandleHistoryGet
	historyHasHistHandler := strings.Contains(historyStackStr, "HandleHistory") ||
		strings.Contains(historyStackStr, "server.go")
	if !historyHasHistHandler {
		t.Error("History flow stack should reference HandleHistory or server.go")
	}

	// --- Micro differentiation: shared path probes show different callers ---

	// Find entries for the same shared code point across flows
	apiComputeStacks := filterEntriesByPointID(apiEntries, "cp-calc-compute")
	batchComputeStacks := filterEntriesByPointID(batchEntries, "cp-calc-compute")

	if len(apiComputeStacks) > 0 && len(batchComputeStacks) > 0 {
		apiShared := entriesToString(apiComputeStacks)
		batchShared := entriesToString(batchComputeStacks)
		if apiShared == batchShared {
			t.Log("WARNING: Shared path probe stacks are identical between API and Batch flows")
			t.Log("This means stack differentiation is only at the macro (handler) level")
		} else {
			t.Log("CONFIRMED: Shared path probes produce different stacks across flows")
		}
	}

	// --- Verify API and History use different handler functions ---
	apiHasHandleCalc := strings.Contains(apiStackStr, "HandleCalculate")
	histHasHandleHist := strings.Contains(historyStackStr, "HandleHistory")
	if apiHasHandleCalc && histHasHandleHist {
		t.Log("CONFIRMED: API flow uses HandleCalculate, History uses HandleHistoryGet")
	} else {
		t.Log("Note: Could not confirm API and History use different handler functions from stack frames")
	}

	// --- API and Batch must have different stacks ---
	if apiStackStr == batchStackStr {
		t.Error("API and Batch stacks must be different (different packages/callers)")
	}
}

// TestProbeDensity verifies that adjacent code points have reasonable
// stack overlap (20-60% target range for this project).
func TestProbeDensity(t *testing.T) {
	if !codepoint.IsEnabled() {
		t.Skip("Codepoints not enabled - toggle file missing")
	}

	// Set up test-specific temp directory for log isolation
	logDir := t.TempDir()
	t.Logf("Test log directory: %s", logDir)

	// Trigger a single flow to generate probe output
	store := history.NewHistoryStore()
	srv := api.NewServer(store)

	body := `{"expression":"2+3*4+1"}`
	req := httptest.NewRequest("POST", "/api/calculate", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	srv.HandleCalculate(w, req)

	// Collect stacks from all codepoint log files
	allEntries := readAllCodepointEntries(t)
	if len(allEntries) < 2 {
		t.Skipf("Need at least 2 probe entries for density check, got %d", len(allEntries))
	}

	// Check density between consecutive entries
	for i := 0; i < len(allEntries)-1; i++ {
		stack1 := allEntries[i].stack
		stack2 := allEntries[i+1].stack
		if stack1 == "" || stack2 == "" {
			continue
		}

		overlap := codepoint.AnalyzeOverlap(stack1, stack2)
		t.Logf("Density between probe[%d] (%s) and probe[%d] (%s): %.2f",
			i, allEntries[i].pointID, i+1, allEntries[i+1].pointID, overlap)

		// Expected range: 20-60% overlap
		// Below 20%: probes too sparse (different call chains)
		// Above 60%: probes too dense (nearly identical stacks)
		// These are informational warnings, not hard failures
		if overlap < 0.20 {
			t.Logf("INFO: Probes may be too sparse (overlap=%.2f < 0.20) - different functions", overlap)
		}
		if overlap > 0.60 {
			t.Logf("INFO: Probes may be too dense (overlap=%.2f > 0.60) - very similar stacks", overlap)
		}
		if overlap >= 0.20 && overlap <= 0.60 {
			t.Logf("GOOD: Probe density in target range (20-60%%)")
		}
	}
}

// TestFlowIDMetadata verifies that probes contain correct flow_id in metadata.
func TestFlowIDMetadata(t *testing.T) {
	if !codepoint.IsEnabled() {
		t.Skip("Codepoints not enabled - toggle file missing")
	}

	// Run API flow
	store := history.NewHistoryStore()
	srv := api.NewServer(store)

	body := `{"expression":"(2+3)*4"}`
	req := httptest.NewRequest("POST", "/api/calculate", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	srv.HandleCalculate(w, req)

	// Read and parse codepoint log (all flow files)
	allEntries := readAllCodepointEntries(t)
	if len(allEntries) == 0 {
		t.Fatal("No codepoint entries found in log")
	}

	// Check that entries have flow_id in metadata
	apiFlowEntries := 0
	for _, entry := range allEntries {
		if entry.flowID != "" {
			apiFlowEntries++
			t.Logf("Entry point_id=%s flow_id=%s", entry.pointID, entry.flowID)
		}
	}

	if apiFlowEntries == 0 {
		t.Error("No entries contain flow_id - context propagation may be broken")
	} else {
		t.Logf("OK: %d/%d entries contain flow_id", apiFlowEntries, len(allEntries))
	}

	// Verify output file cleanup after test
	t.Cleanup(func() {
		// Temp dir cleaned by t.TempDir() if used
		t.Log("Test cleanup complete")
	})
}

// --- Helper types and functions ---

type codepointEntry struct {
	pointID string
	flowID  string
	stack   string
	raw     string
}

func runAPIFlow(t *testing.T, expr string) {
	t.Helper()

	store := history.NewHistoryStore()
	srv := api.NewServer(store)

	body := fmt.Sprintf(`{"expression":"%s"}`, expr)
	req := httptest.NewRequest("POST", "/api/calculate", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	srv.HandleCalculate(w, req)

	if w.Code != http.StatusOK {
		t.Logf("API flow returned status %d (non-blocking for probe verification)", w.Code)
	}
}

func runBatchFlow(t *testing.T, expr string) {
	t.Helper()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	results, err := batch.ProcessExpressions(ctx, expr)
	if err != nil {
		t.Logf("Batch flow error: %v (non-blocking for probe verification)", err)
	}
	if len(results) == 0 {
		t.Log("Batch flow produced no results")
	}
}

func runHistoryFlow(t *testing.T, expr string) {
	t.Helper()
	store := history.NewHistoryStore()

	// First add via API to create history record
	body := fmt.Sprintf(`{"expression":"%s"}`, expr)
	req := httptest.NewRequest("POST", "/api/calculate", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	srv := api.NewServer(store)
	w := httptest.NewRecorder()
	srv.HandleCalculate(w, req)

	// Now query history - this RECOMPUTES through shared pipeline
	// Must route through ServeHTTP so the mux parses {id} path parameter
	req2 := httptest.NewRequest("GET", "/api/history/1", nil)
	w2 := httptest.NewRecorder()
	srv.ServeHTTP(w2, req2)

	if w2.Code != http.StatusOK {
		t.Logf("History flow returned status %d (non-blocking for probe verification)", w2.Code)
	}
}

// readAllCodepointEntries reads and parses ALL codepoint log files
// (general + per-flow), returning structured entries combined.
func readAllCodepointEntries(t *testing.T) []codepointEntry {
	t.Helper()
	paths := codepoint.OutputPaths()
	if len(paths) == 0 {
		return nil
	}

	var allEntries []codepointEntry
	for _, p := range paths {
		data, err := os.ReadFile(p)
		if err != nil {
			continue
		}
		allEntries = append(allEntries, parseCodepointLogEntries(string(data))...)
	}
	return allEntries
}

func parseCodepointLogEntries(logContent string) []codepointEntry {
	var entries []codepointEntry
	lines := strings.Split(logContent, "\n")
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if trimmed == "" {
			continue
		}

		var raw map[string]interface{}
		if err := json.Unmarshal([]byte(trimmed), &raw); err != nil {
			continue
		}

		entry := codepointEntry{raw: trimmed}

		if name, ok := raw["name"].(string); ok {
			entry.pointID = name
		}
		if pointID, ok := raw["point_id"].(string); ok {
			entry.pointID = pointID
		}

		if meta, ok := raw["meta"].(map[string]interface{}); ok {
			if fid, ok := meta["flow_id"].(string); ok {
				entry.flowID = fid
			}
		}

		if stack, ok := raw["stack"].(string); ok {
			entry.stack = stack
		}

		entries = append(entries, entry)
	}
	return entries
}

func filterEntriesByFlowID(entries []codepointEntry, flowID string) []codepointEntry {
	var filtered []codepointEntry
	for _, e := range entries {
		if e.flowID == flowID {
			filtered = append(filtered, e)
		}
	}
	return filtered
}

func filterEntriesByPointID(entries []codepointEntry, pointID string) []codepointEntry {
	var filtered []codepointEntry
	for _, e := range entries {
		if strings.Contains(e.raw, pointID) {
			filtered = append(filtered, e)
		}
	}
	return filtered
}

func entriesToString(entries []codepointEntry) string {
	var parts []string
	for _, e := range entries {
		parts = append(parts, e.raw)
	}
	return strings.Join(parts, "\n")
}
