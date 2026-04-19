package api

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"gojs-calculator/codepoint"
	"gojs-calculator/internal/batch"
	"gojs-calculator/internal/calculator"
	"gojs-calculator/internal/history"
)

type Server struct {
	store *history.HistoryStore
	mux   *http.ServeMux
}

type CalcRequest struct {
	Expression string `json:"expression"`
}

type CalcResponse struct {
	Expression string `json:"expression"`
	Result     string `json:"result"`
	Error      string `json:"error,omitempty"`
}

type HistoryResponse struct {
	ID         int    `json:"id"`
	Expression string `json:"expression"`
	Result     string `json:"result"`
	Recomputed string `json:"recomputed,omitempty"`
	Error      string `json:"error,omitempty"`
}

type BatchRequest struct {
	Expressions []string `json:"expressions"`
}

type BatchItemResponse struct {
	Expression string `json:"expression"`
	Output     string `json:"output,omitempty"`
	Error      string `json:"error,omitempty"`
}

type BatchResponse struct {
	Results []BatchItemResponse `json:"results"`
}

func NewServer(store *history.HistoryStore) *Server {
	s := &Server{store: store, mux: http.NewServeMux()}
	s.routes()
	return s
}

func (s *Server) routes() {
	s.mux.HandleFunc("POST /api/calculate", s.HandleCalculate)
	s.mux.HandleFunc("GET /api/history", s.HandleHistoryList)
	s.mux.HandleFunc("GET /api/history/{id}", s.HandleHistoryGet)
	s.mux.HandleFunc("POST /api/batch", s.HandleBatch)
}

func (s *Server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	s.mux.ServeHTTP(w, r)
}

// HandleCalculate handles POST /api/calculate
// Flow: REST API -> Parse -> Validate -> Compute -> Format -> JSON response
func (s *Server) HandleCalculate(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var req CalcRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(CalcResponse{Error: "invalid request body"})
		return
	}

	expr := strings.TrimSpace(req.Expression)
	if expr == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(CalcResponse{Error: "empty expression"})
		return
	}

	ctx := context.WithValue(r.Context(), calculator.FlowIDKey{}, "flow-api-calculate")
	codepoint.PointWithMeta("cp-api-calc-entry", map[string]any{
		"point_id": "cp-api-calc-entry",
		"flow_id":  "flow-api-calculate",
		"expr":     expr,
	})

	// Shared code path: Evaluate runs Parse -> Validate -> Compute -> Format
	result, calcErr := calculator.Evaluate(ctx, expr)

	resp := CalcResponse{Expression: expr}
	if calcErr != nil {
		resp.Error = calcErr.Error()
		s.store.Add(expr, calcErr.Error())
	} else {
		resp.Result = result
		s.store.Add(expr, result)
	}

	codepoint.PointWithMeta("cp-api-calc-done", map[string]any{
		"point_id": "cp-api-calc-done",
		"flow_id":  "flow-api-calculate",
		"result":   resp.Result,
		"error":    resp.Error,
	})

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(resp)
}

// HandleHistoryList handles GET /api/history
func (s *Server) HandleHistoryList(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	records := s.store.GetAll()
	json.NewEncoder(w).Encode(records)
}

// HandleHistoryGet handles GET /api/history/{id}
// Flow: History query -> Store.Lookup -> RECOMPUTE through shared pipeline -> History response
// IMPORTANT: This handler RECOMPUTES the stored expression via calculator.Evaluate(),
// exercising the full shared code path (Parse -> Validate -> Compute -> Format).
// This is NOT a simple cache lookup -- it deliberately re-executes the full pipeline
// so that codepoint probes on the shared path fire during history queries too.
func (s *Server) HandleHistoryGet(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	ctx := context.WithValue(r.Context(), calculator.FlowIDKey{}, "flow-history-query")
	codepoint.PointWithMeta("cp-history-entry", map[string]any{
		"point_id": "cp-history-entry",
		"flow_id":  "flow-history-query",
	})

	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(HistoryResponse{Error: "invalid id"})
		return
	}

	record, ok := s.store.Get(id)
	if !ok {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(HistoryResponse{Error: "not found"})
		return
	}

	codepoint.PointWithMeta("cp-history-lookup", map[string]any{
		"point_id": "cp-history-lookup",
		"flow_id":  "flow-history-query",
		"expr":     record.Expression,
	})

	// CRITICAL: Recompute through shared code path (Parse -> Validate -> Compute -> Format)
	// This ensures history flow exercises the same probes as API and batch flows.
	recomputed, calcErr := calculator.Evaluate(ctx, record.Expression)
	resp := HistoryResponse{
		ID:         record.ID,
		Expression: record.Expression,
		Result:     fmt.Sprintf("%v", record.Result),
	}

	if calcErr != nil {
		resp.Recomputed = "error: " + calcErr.Error()
	} else {
		resp.Recomputed = recomputed
	}

	codepoint.PointWithMeta("cp-history-done", map[string]any{
		"point_id": "cp-history-done",
		"flow_id":  "flow-history-query",
		"recomputed": resp.Recomputed,
	})

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(resp)
}

// HandleBatch handles POST /api/batch
// Flow: REST API -> Parse input -> Evaluate each expression (Parse->Validate->Compute->Format) -> JSON array response
func (s *Server) HandleBatch(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var req BatchRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(BatchResponse{Results: []BatchItemResponse{{Error: "invalid request body"}}})
		return
	}

	if len(req.Expressions) == 0 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(BatchResponse{Results: []BatchItemResponse{{Error: "no expressions provided"}}})
		return
	}

	ctx := context.WithValue(r.Context(), calculator.FlowIDKey{}, "flow-batch-process")
	codepoint.PointWithMeta("cp-batch-entry", map[string]any{
		"point_id": "cp-batch-entry",
		"flow_id":  "flow-batch-process",
		"count":    len(req.Expressions),
	})

	// Build multi-line input for ProcessExpressions
	var lines []string
	for _, expr := range req.Expressions {
		lines = append(lines, strings.TrimSpace(expr))
	}
	input := strings.Join(lines, "\n")

	results, procErr := batch.ProcessExpressions(ctx, input)
	if procErr != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(BatchResponse{Results: []BatchItemResponse{{Error: procErr.Error()}}})
		return
	}

	var respItems []BatchItemResponse
	for _, r := range results {
		item := BatchItemResponse{Expression: r.Expression}
		if r.Error != "" {
			item.Error = r.Error
		} else {
			item.Output = r.Output
		}
		respItems = append(respItems, item)
		// Store each result in history
		if r.Error != "" {
			s.store.Add(r.Expression, r.Error)
		} else {
			s.store.Add(r.Expression, r.Output)
		}
	}

	codepoint.PointWithMeta("cp-batch-done", map[string]any{
		"point_id": "cp-batch-done",
		"flow_id":  "flow-batch-process",
		"count":    len(respItems),
	})

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(BatchResponse{Results: respItems})
}
