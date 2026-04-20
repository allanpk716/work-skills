// handler/order_handler.go
package handler

import (
	"encoding/json"
	"net/http"

	"myproject/codepoint"
	"myproject/service"
)

type OrderHandler struct {
	orderService *service.OrderService
	pool         *WorkerPool
}

func NewOrderHandler(s *service.OrderService, pool *WorkerPool) *OrderHandler {
	return &OrderHandler{orderService: s, pool: pool}
}

// CreateOrder handles POST /api/orders
func (h *OrderHandler) CreateOrder(w http.ResponseWriter, r *http.Request) {
	codepoint.PointWithGoroutineID("order_handler_entry")

	var req service.CreateOrderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		codepoint.PointWithMeta("order_handler_decode_error", map[string]any{
			"error": err.Error(),
		})
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	codepoint.Point("order_handler_after_decode")

	// Submit to goroutine pool for processing
	resultCh := make(chan *service.OrderResult)
	errCh := make(chan error)

	h.pool.Submit(func() {
		// --- Code point: goroutine pool worker starts ---
		codepoint.PointWithGoroutineID("order_handler_pool_worker_start")

		result, err := h.orderService.CreateOrder(r.Context(), &req)
		if err != nil {
			errCh <- err
			return
		}
		resultCh <- result

		// --- Code point: goroutine pool worker done ---
		codepoint.PointWithGoroutineID("order_handler_pool_worker_done")
	})

	select {
	case result := <-resultCh:
		codepoint.Point("order_handler_success")
		json.NewEncoder(w).Encode(result)
	case err := <-errCh:
		codepoint.PointWithMeta("order_handler_service_error", map[string]any{
			"error": err.Error(),
		})
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}

	codepoint.Point("order_handler_response_sent")
}

// GetOrder handles GET /api/orders/:id
func (h *OrderHandler) GetOrder(w http.ResponseWriter, r *http.Request) {
	codepoint.PointWithGoroutineID("order_get_handler_entry")

	id := r.URL.Query().Get("id")
	codepoint.PointWithMeta("order_get_handler_after_parse", map[string]any{"order_id": id})

	order, err := h.orderService.GetOrder(r.Context(), id)
	if err != nil {
		codepoint.PointWithMeta("order_get_handler_error", map[string]any{
			"order_id": id,
			"error":    err.Error(),
		})
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	codepoint.Point("order_get_handler_success")
	json.NewEncoder(w).Encode(order)
}

// UpdateOrder handles PUT /api/orders/:id
func (h *OrderHandler) UpdateOrder(w http.ResponseWriter, r *http.Request) {
	codepoint.PointWithGoroutineID("order_update_handler_entry")

	id := r.URL.Query().Get("id")
	codepoint.PointWithMeta("order_update_handler_id_parsed", map[string]any{"order_id": id})

	var req service.UpdateOrderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		codepoint.PointWithMeta("order_update_handler_decode_error", map[string]any{
			"error": err.Error(),
		})
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	codepoint.Point("order_update_handler_after_decode")

	resultCh := make(chan *service.OrderResult)
	errCh := make(chan error)

	h.pool.Submit(func() {
		codepoint.PointWithGoroutineID("order_update_pool_worker_start")

		result, err := h.orderService.UpdateOrder(r.Context(), id, &req)
		if err != nil {
			errCh <- err
			return
		}
		resultCh <- result

		codepoint.PointWithGoroutineID("order_update_pool_worker_done")
	})

	select {
	case result := <-resultCh:
		codepoint.Point("order_update_handler_success")
		json.NewEncoder(w).Encode(result)
	case err := <-errCh:
		codepoint.PointWithMeta("order_update_handler_error", map[string]any{
			"order_id": id,
			"error":    err.Error(),
		})
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}
