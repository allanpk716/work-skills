package codepoint

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"testing"
	"time"
)

func TestMain(m *testing.M) {
	// Ensure toggle files exist
	home, _ := os.UserHomeDir()
	if home != "" {
		toggleDir := filepath.Join(home, ".codepoint")
		os.MkdirAll(toggleDir, 0755)
		for _, name := range []string{".codepoint-go", ".codepoint-ts"} {
			os.WriteFile(filepath.Join(toggleDir, name), []byte{}, 0644)
		}
	}
	m.Run()
}

// TestCollectorRoutesFlowId verifies that entries with flow_id are routed to flow-specific files.
func TestCollectorRoutesFlowId(t *testing.T) {
	if !tsEnabled || tsOutFile == nil {
		t.Skip("collector not enabled (no .codepoint-ts toggle)")
	}

	handler := CollectorHandler()

	// Send entry with flow_id
	entry := FrontendEntry{
		Name:      "cp-fe-calc-submit",
		Stack:     "Error at test\n    at testFunc",
		Timestamp: time.Now().Format(time.RFC3339Nano),
		Meta: map[string]interface{}{
			"flow_id":   "flow-api-calculate",
			"point_id":  "cp-fe-calc-submit",
			"expr":      "2+3",
		},
	}
	body, _ := json.Marshal(entry)
	req := httptest.NewRequest("POST", "/__codepoint__", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	handler(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Errorf("expected 204, got %d", rec.Code)
	}

	// Verify flow-specific file was created
	tsMu.Lock()
	flowFile, exists := tsFlowFiles["flow-api-calculate"]
	tsMu.Unlock()

	if !exists {
		t.Fatal("expected flow-specific file for flow-api-calculate to be created")
	}

	// Read flow file content
	flowFile.Seek(0, 0)
	content, _ := os.ReadFile(flowFile.Name())
	contentStr := string(content)

	if !strings.Contains(contentStr, "cp-fe-calc-submit") {
		t.Error("flow file should contain the entry name")
	}
	if !strings.Contains(contentStr, "flow-api-calculate") {
		t.Error("flow file should contain the flow_id")
	}
	// Should contain "Flow:" header
	if !strings.Contains(contentStr, "Flow: flow-api-calculate") {
		t.Error("flow file should have flow header")
	}

	// Send entry without flow_id
	entryNoFlow := FrontendEntry{
		Name:      "cp-fe-no-flow",
		Stack:     "Error at test\n    at testFunc",
		Timestamp: time.Now().Format(time.RFC3339Nano),
	}
	body2, _ := json.Marshal(entryNoFlow)
	req2 := httptest.NewRequest("POST", "/__codepoint__", bytes.NewReader(body2))
	req2.Header.Set("Content-Type", "application/json")
	rec2 := httptest.NewRecorder()
	handler(rec2, req2)

	if rec2.Code != http.StatusNoContent {
		t.Errorf("expected 204, got %d", rec2.Code)
	}

	// Verify general file has the no-flow entry (plain text format)
	tsMu.Lock()
	if tsOutFile == nil {
		tsMu.Unlock()
		t.Fatal("general output file should still exist")
	}
	generalName := tsOutFile.Name()
	tsMu.Unlock()

	generalContent, _ := os.ReadFile(generalName)
	generalStr := string(generalContent)
	if !strings.Contains(generalStr, "[CODEPOINT] cp-fe-no-flow") {
		t.Error("general file should contain plain text entry for no-flow entry")
	}
}

// TestCollectorFlowIdJsonFormat verifies JSON output for meta-bearing entries.
func TestCollectorFlowIdJsonFormat(t *testing.T) {
	if !tsEnabled || tsOutFile == nil {
		t.Skip("collector not enabled (no .codepoint-ts toggle)")
	}

	handler := CollectorHandler()

	entry := FrontendEntry{
		Name:      "cp-fe-json-test",
		Stack:     "Error\n    at func",
		Timestamp: "2026-04-18T12:00:00Z",
		Meta: map[string]interface{}{
			"flow_id":  "flow-test-json",
			"point_id": "cp-fe-json-test",
			"custom":   "value",
		},
	}
	body, _ := json.Marshal(entry)
	req := httptest.NewRequest("POST", "/__codepoint__", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	handler(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Errorf("expected 204, got %d", rec.Code)
	}

	// Read the flow file and verify JSON format
	tsMu.Lock()
	flowFile, exists := tsFlowFiles["flow-test-json"]
	tsMu.Unlock()

	if !exists {
		t.Fatal("expected flow file for flow-test-json")
	}

	content, _ := os.ReadFile(flowFile.Name())
	lines := strings.Split(strings.TrimSpace(string(content)), "\n")

	// Find the JSON data line (skip header lines starting with #)
	var dataLine string
	for _, line := range lines {
		if !strings.HasPrefix(line, "#") && line != "" {
			dataLine = line
			break
		}
	}

	if dataLine == "" {
		t.Fatal("no data line found in flow file")
	}

	// Parse as JSON
	var parsed map[string]interface{}
	if err := json.Unmarshal([]byte(dataLine), &parsed); err != nil {
		t.Fatalf("expected JSON format, got: %s\nparse error: %v", dataLine, err)
	}

	if parsed["name"] != "cp-fe-json-test" {
		t.Errorf("JSON name = %v, want cp-fe-json-test", parsed["name"])
	}
	if parsed["timestamp"] != "2026-04-18T12:00:00Z" {
		t.Errorf("JSON timestamp = %v, want 2026-04-18T12:00:00Z", parsed["timestamp"])
	}

	meta, ok := parsed["meta"].(map[string]interface{})
	if !ok {
		t.Fatal("JSON should have meta object")
	}
	if meta["flow_id"] != "flow-test-json" {
		t.Errorf("meta.flow_id = %v, want flow-test-json", meta["flow_id"])
	}
	if meta["custom"] != "value" {
		t.Errorf("meta.custom = %v, want value", meta["custom"])
	}
	if _, hasStack := parsed["stack"]; !hasStack {
		t.Error("JSON should have stack field")
	}
}

// TestCollectorNoMetaPlainText verifies plain text output for entries without meta.
func TestCollectorNoMetaPlainText(t *testing.T) {
	if !tsEnabled || tsOutFile == nil {
		t.Skip("collector not enabled (no .codepoint-ts toggle)")
	}

	handler := CollectorHandler()

	entry := FrontendEntry{
		Name:      "cp-fe-plain",
		Stack:     "Error at line 1\n    at func\n    at main",
		Timestamp: time.Now().Format(time.RFC3339Nano),
	}
	body, _ := json.Marshal(entry)
	req := httptest.NewRequest("POST", "/__codepoint__", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	handler(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Errorf("expected 204, got %d", rec.Code)
	}

	// Verify general file has plain text format
	tsMu.Lock()
	generalName := tsOutFile.Name()
	tsMu.Unlock()

	content, _ := os.ReadFile(generalName)
	contentStr := string(content)

	if !strings.Contains(contentStr, "[CODEPOINT] cp-fe-plain") {
		t.Error("general file should contain [CODEPOINT] prefix for plain text entry")
	}
	if !strings.Contains(contentStr, "Error at line 1") {
		t.Error("general file should contain stack trace for plain text entry")
	}
}

// TestCollectorMetaWithoutFlowId verifies JSON output for entries with meta but no flow_id.
func TestCollectorMetaWithoutFlowId(t *testing.T) {
	if !tsEnabled || tsOutFile == nil {
		t.Skip("collector not enabled (no .codepoint-ts toggle)")
	}

	handler := CollectorHandler()

	entry := FrontendEntry{
		Name:      "cp-fe-meta-no-flow",
		Stack:     "Error\n    at func",
		Timestamp: "2026-04-18T12:00:00Z",
		Meta: map[string]interface{}{
			"custom_key": "custom_value",
		},
	}
	body, _ := json.Marshal(entry)
	req := httptest.NewRequest("POST", "/__codepoint__", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	handler(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Errorf("expected 204, got %d", rec.Code)
	}

	// Verify general file has JSON format (meta without flow_id)
	tsMu.Lock()
	generalName := tsOutFile.Name()
	tsMu.Unlock()

	content, _ := os.ReadFile(generalName)
	contentStr := string(content)

	// Should NOT be plain text [CODEPOINT] format since it has meta
	// Instead should be JSON with "custom_key"
	if !strings.Contains(contentStr, "custom_key") {
		t.Error("general file should contain JSON with meta keys")
	}
	if !strings.Contains(contentStr, "custom_value") {
		t.Error("general file should contain meta value")
	}
}

// TestCollectorConcurrentWrites verifies thread safety under concurrent writes.
// Run with -race flag to detect data races.
func TestCollectorConcurrentWrites(t *testing.T) {
	if !tsEnabled || tsOutFile == nil {
		t.Skip("collector not enabled (no .codepoint-ts toggle)")
	}

	handler := CollectorHandler()
	numGoroutines := 20
	numEntriesPer := 10

	var wg sync.WaitGroup
	wg.Add(numGoroutines)

	for i := 0; i < numGoroutines; i++ {
		go func(idx int) {
			defer wg.Done()
			for j := 0; j < numEntriesPer; j++ {
				flowID := "flow-concurrent-" + string(rune('A'+idx%5))
				entry := FrontendEntry{
					Name:      "cp-concurrent",
					Stack:     "stack trace",
					Timestamp: time.Now().Format(time.RFC3339Nano),
					Meta: map[string]interface{}{
						"flow_id": flowID,
						"iter":    idx*numEntriesPer + j,
					},
				}
				body, _ := json.Marshal(entry)
				req := httptest.NewRequest("POST", "/__codepoint__", bytes.NewReader(body))
				req.Header.Set("Content-Type", "application/json")
				rec := httptest.NewRecorder()
				handler(rec, req)

				if rec.Code != http.StatusNoContent {
					t.Errorf("goroutine %d entry %d: expected 204, got %d", idx, j, rec.Code)
				}
			}
		}(i)
	}

	wg.Wait()

	// Verify flow files were created
	tsMu.Lock()
	flowFileCount := len(tsFlowFiles)
	tsMu.Unlock()

	if flowFileCount < 5 {
		t.Errorf("expected at least 5 flow files, got %d", flowFileCount)
	}
}

// TestCollectorDisabled verifies 404 response when toggle is absent.
func TestCollectorDisabled(t *testing.T) {
	// This test would require modifying tsEnabled, which is not easily testable
	// since init() runs once. We verify the handler behavior when enabled.
	if !tsEnabled {
		// If somehow disabled, handler should return 404
		handler := CollectorHandler()
		body := []byte(`{"name":"test","stack":"stack"}`)
		req := httptest.NewRequest("POST", "/__codepoint__", bytes.NewReader(body))
		rec := httptest.NewRecorder()
		handler(rec, req)
		if rec.Code != http.StatusNotFound {
			t.Errorf("expected 404 when disabled, got %d", rec.Code)
		}
	} else {
		t.Skip("collector is enabled, cannot test disabled behavior in same process")
	}
}

// TestCollectorInvalidBody verifies 400 for malformed JSON.
func TestCollectorInvalidBody(t *testing.T) {
	handler := CollectorHandler()

	req := httptest.NewRequest("POST", "/__codepoint__", strings.NewReader("not json"))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	handler(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", rec.Code)
	}
}
