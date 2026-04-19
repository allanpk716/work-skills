package api

import (
	"encoding/json"
	"go-calculator/internal/history"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestHandleCalculate(t *testing.T) {
	store := history.NewHistoryStore()
	srv := NewServer(store)

	tests := []struct {
		name       string
		body       string
		wantStatus int
		wantResult string
		wantError  bool
	}{
		{"valid add", `{"expression":"2+3"}`, http.StatusOK, "5.0", false},
		{"complex", `{"expression":"(2+3)*4"}`, http.StatusOK, "20.0", false},
		{"division by zero", `{"expression":"10/0"}`, http.StatusOK, "", true},
		{"empty expr", `{"expression":""}`, http.StatusBadRequest, "", true},
		{"invalid json", `not json`, http.StatusBadRequest, "", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest("POST", "/api/calculate", strings.NewReader(tt.body))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()
			srv.HandleCalculate(w, req)

			if w.Code != tt.wantStatus {
				t.Errorf("status = %d, want %d", w.Code, tt.wantStatus)
			}

			var resp CalcResponse
			json.NewDecoder(w.Body).Decode(&resp)
			if tt.wantResult != "" && resp.Result != tt.wantResult {
				t.Errorf("result = %s, want %s", resp.Result, tt.wantResult)
			}
			if tt.wantError && resp.Error == "" {
				t.Errorf("expected error, got none")
			}
		})
	}
}

func TestHandleHistoryGet_RecomputesThroughSharedPipeline(t *testing.T) {
	store := history.NewHistoryStore()
	srv := NewServer(store)

	store.Add("2+3", "5.0")
	store.Add("(2+3)*4", "20.0")

	// Route through mux to enable PathValue extraction
	req := httptest.NewRequest("GET", "/api/history/1", nil)
	w := httptest.NewRecorder()
	srv.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusOK)
	}

	var resp HistoryResponse
	json.NewDecoder(w.Body).Decode(&resp)
	if resp.Expression != "2+3" {
		t.Errorf("expression = %s, want 2+3", resp.Expression)
	}
	if resp.Recomputed != "5.0" {
		t.Errorf("recomputed = %s, want 5.0", resp.Recomputed)
	}

	req2 := httptest.NewRequest("GET", "/api/history/2", nil)
	w2 := httptest.NewRecorder()
	srv.ServeHTTP(w2, req2)

	var resp2 HistoryResponse
	json.NewDecoder(w2.Body).Decode(&resp2)
	if resp2.Recomputed != "20.0" {
		t.Errorf("recomputed = %s, want 20.0", resp2.Recomputed)
	}
}

func TestHandleHistoryGet_NotFound(t *testing.T) {
	store := history.NewHistoryStore()
	srv := NewServer(store)

	req := httptest.NewRequest("GET", "/api/history/999", nil)
	w := httptest.NewRecorder()
	srv.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("status = %d, want %d", w.Code, http.StatusNotFound)
	}
}
