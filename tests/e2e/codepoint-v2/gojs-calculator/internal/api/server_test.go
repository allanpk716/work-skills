package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"gojs-calculator/internal/history"
)

func TestMain(m *testing.M) {
	// Ensure toggle files exist so codepoint probes don't crash
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

func TestHandleCalculate(t *testing.T) {
	store := history.NewHistoryStore()
	server := NewServer(store)

	body := `{"expression": "2+3"}`
	req := httptest.NewRequest("POST", "/api/calculate", stringsReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	server.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}

	var resp CalcResponse
	json.NewDecoder(rec.Body).Decode(&resp)
	if resp.Result != "5.0" {
		t.Errorf("expected 5.0, got %s", resp.Result)
	}
}

func TestHandleCalculate_EmptyExpression(t *testing.T) {
	store := history.NewHistoryStore()
	server := NewServer(store)

	body := `{"expression": ""}`
	req := httptest.NewRequest("POST", "/api/calculate", stringsReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	server.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", rec.Code)
	}
}

func TestHandleCalculate_InvalidBody(t *testing.T) {
	store := history.NewHistoryStore()
	server := NewServer(store)

	body := `not json`
	req := httptest.NewRequest("POST", "/api/calculate", stringsReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	server.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", rec.Code)
	}
}

func TestHandleCalculate_InvalidExpression(t *testing.T) {
	store := history.NewHistoryStore()
	server := NewServer(store)

	body := `{"expression": "2++3"}`
	req := httptest.NewRequest("POST", "/api/calculate", stringsReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	server.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200 (error in body), got %d", rec.Code)
	}

	var resp CalcResponse
	json.NewDecoder(rec.Body).Decode(&resp)
	if resp.Error == "" {
		t.Error("expected error for invalid expression")
	}
}

func TestHandleHistoryGet_AfterCalculate(t *testing.T) {
	store := history.NewHistoryStore()
	server := NewServer(store)

	// First, add a calculation
	body := `{"expression": "(2+3)*4"}`
	req := httptest.NewRequest("POST", "/api/calculate", stringsReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	server.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("calculate failed: %d", rec.Code)
	}

	// Then get history by ID (ID = 1)
	req2 := httptest.NewRequest("GET", "/api/history/1", nil)
	rec2 := httptest.NewRecorder()
	server.ServeHTTP(rec2, req2)

	if rec2.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec2.Code)
	}

	var resp HistoryResponse
	json.NewDecoder(rec2.Body).Decode(&resp)
	if resp.Recomputed != "20.0" {
		t.Errorf("expected recomputed 20.0, got %s", resp.Recomputed)
	}
}

func TestHandleHistoryGet_InvalidID(t *testing.T) {
	store := history.NewHistoryStore()
	server := NewServer(store)

	req := httptest.NewRequest("GET", "/api/history/abc", nil)
	rec := httptest.NewRecorder()
	server.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", rec.Code)
	}
}

func TestHandleHistoryGet_NotFound(t *testing.T) {
	store := history.NewHistoryStore()
	server := NewServer(store)

	req := httptest.NewRequest("GET", "/api/history/999", nil)
	rec := httptest.NewRecorder()
	server.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Errorf("expected 404, got %d", rec.Code)
	}
}

func TestHandleHistoryList(t *testing.T) {
	store := history.NewHistoryStore()
	server := NewServer(store)

	// Add a calculation first
	body := `{"expression": "2+3"}`
	req := httptest.NewRequest("POST", "/api/calculate", stringsReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	server.ServeHTTP(rec, req)

	// List all history
	req2 := httptest.NewRequest("GET", "/api/history", nil)
	rec2 := httptest.NewRecorder()
	server.ServeHTTP(rec2, req2)

	if rec2.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec2.Code)
	}

	var records []history.Record
	json.NewDecoder(rec2.Body).Decode(&records)
	if len(records) != 1 {
		t.Errorf("expected 1 record, got %d", len(records))
	}
}

func TestHandleBatch(t *testing.T) {
	store := history.NewHistoryStore()
	server := NewServer(store)

	body := `{"expressions": ["2+3", "(1+2)*3", "10/2"]}`
	req := httptest.NewRequest("POST", "/api/batch", stringsReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	server.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}

	var resp BatchResponse
	json.NewDecoder(rec.Body).Decode(&resp)
	if len(resp.Results) != 3 {
		t.Fatalf("expected 3 results, got %d", len(resp.Results))
	}
	if resp.Results[0].Output != "5.0" {
		t.Errorf("expected 5.0, got %s", resp.Results[0].Output)
	}
	if resp.Results[1].Output != "9.0" {
		t.Errorf("expected 9.0, got %s", resp.Results[1].Output)
	}
	if resp.Results[2].Output != "5.0" {
		t.Errorf("expected 5.0, got %s", resp.Results[2].Output)
	}
}

func TestHandleBatch_EmptyExpressions(t *testing.T) {
	store := history.NewHistoryStore()
	server := NewServer(store)

	body := `{"expressions": []}`
	req := httptest.NewRequest("POST", "/api/batch", stringsReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	server.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", rec.Code)
	}
}

func TestHandleBatch_InvalidBody(t *testing.T) {
	store := history.NewHistoryStore()
	server := NewServer(store)

	body := `not json`
	req := httptest.NewRequest("POST", "/api/batch", stringsReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	server.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", rec.Code)
	}
}

// stringsReader is a helper to avoid importing strings in tests
type stringsReader string

func (s stringsReader) Read(b []byte) (int, error) {
	copy(b, []byte(s))
	return len(s), nil
}
