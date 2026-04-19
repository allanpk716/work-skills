package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"sync"
	"syscall"
	"time"

	"codepoint"
)

// ============================================================================
// Models
// ============================================================================

type Order struct {
	ID        int64     `json:"id"`
	UserID    int64     `json:"user_id"`
	ProductID int64     `json:"product_id"`
	Quantity  int       `json:"quantity"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Version   int       `json:"version"` // optimistic locking version
}

type Inventory struct {
	ID        int64  `json:"id"`
	ProductID int64  `json:"product_id"`
	Stock     int    `json:"stock"`
	Version   int    `json:"version"`
}

// ============================================================================
// Repository Layer
// ============================================================================

type OrderRepository struct {
	db *sql.DB
	mu sync.Mutex // protects in-memory cache / batch operations
}

func NewOrderRepository(db *sql.DB) *OrderRepository {
	return &OrderRepository{db: db}
}

func (r *OrderRepository) Create(ctx context.Context, order *Order) error {
	codepoint.Point("repo_order_create_entry")

	r.mu.Lock()
	codepoint.Point("repo_order_create_lock_acquired")

	// Simulate DB insert
	result, err := r.db.ExecContext(ctx,
		"INSERT INTO orders (user_id, product_id, quantity, status, version) VALUES (?, ?, ?, ?, 1)",
		order.UserID, order.ProductID, order.Quantity, order.Status,
	)

	codepoint.Point("repo_order_create_after_exec")

	if err != nil {
		r.mu.Unlock()
		codepoint.PointWithMeta("repo_order_create_error", map[string]any{"error": err.Error()})
		return fmt.Errorf("order insert failed: %w", err)
	}

	id, _ := result.LastInsertId()
	order.ID = id
	order.Version = 1

	r.mu.Unlock()
	codepoint.PointWithMeta("repo_order_create_lock_released", map[string]any{"order_id": id})
	return nil
}

func (r *OrderRepository) GetByID(ctx context.Context, id int64) (*Order, error) {
	codepoint.PointWithMeta("repo_order_get_entry", map[string]any{"order_id": id})

	row := r.db.QueryRowContext(ctx,
		"SELECT id, user_id, product_id, quantity, status, version FROM orders WHERE id = ?", id,
	)

	var order Order
	err := row.Scan(&order.ID, &order.UserID, &order.ProductID, &order.Quantity, &order.Status, &order.Version)
	if err != nil {
		codepoint.PointWithMeta("repo_order_get_error", map[string]any{"order_id": id, "error": err.Error()})
		return nil, fmt.Errorf("order not found: %w", err)
	}

	codepoint.PointWithMeta("repo_order_get_success", map[string]any{
		"order_id": order.ID,
		"version":  order.Version,
	})
	return &order, nil
}

func (r *OrderRepository) UpdateStatus(ctx context.Context, id int64, status string, expectedVersion int) error {
	codepoint.PointWithMeta("repo_order_update_status_entry", map[string]any{
		"order_id":          id,
		"new_status":        status,
		"expected_version":  expectedVersion,
	})

	r.mu.Lock()
	codepoint.PointWithMeta("repo_order_update_status_lock_acquired", map[string]any{"order_id": id})

	// Optimistic locking check: UPDATE ... WHERE version = expectedVersion
	result, err := r.db.ExecContext(ctx,
		"UPDATE orders SET status = ?, version = version + 1, updated_at = NOW() WHERE id = ? AND version = ?",
		status, id, expectedVersion,
	)

	codepoint.Point("repo_order_update_status_after_exec")

	if err != nil {
		r.mu.Unlock()
		codepoint.PointWithMeta("repo_order_update_status_error", map[string]any{"error": err.Error()})
		return fmt.Errorf("order update failed: %w", err)
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		r.mu.Unlock()
		codepoint.PointWithMeta("repo_order_update_status_version_conflict", map[string]any{
			"order_id":         id,
			"expected_version": expectedVersion,
		})
		return fmt.Errorf("optimistic lock conflict: order %d expected version %d", id, expectedVersion)
	}

	r.mu.Unlock()
	codepoint.PointWithMeta("repo_order_update_status_lock_released", map[string]any{
		"order_id":         id,
		"rows_affected":    rowsAffected,
		"expected_version": expectedVersion,
	})
	return nil
}

// InventoryRepository manages product inventory.
type InventoryRepository struct {
	db *sql.DB
	mu sync.Mutex
}

func NewInventoryRepository(db *sql.DB) *InventoryRepository {
	return &InventoryRepository{db: db}
}

func (r *InventoryRepository) DeductStock(ctx context.Context, productID int64, qty int) error {
	codepoint.PointWithMeta("repo_inventory_deduct_entry", map[string]any{
		"product_id": productID,
		"quantity":   qty,
	})

	r.mu.Lock()
	codepoint.PointWithMeta("repo_inventory_deduct_lock_acquired", map[string]any{"product_id": productID})

	// Read current stock
	var stock, version int
	err := r.db.QueryRowContext(ctx,
		"SELECT stock, version FROM inventory WHERE product_id = ? FOR UPDATE", productID,
	).Scan(&stock, &version)

	codepoint.PointWithMeta("repo_inventory_deduct_after_select", map[string]any{
		"product_id":    productID,
		"current_stock": stock,
		"version":       version,
	})

	if err != nil {
		r.mu.Unlock()
		codepoint.PointWithMeta("repo_inventory_deduct_error", map[string]any{"error": err.Error()})
		return fmt.Errorf("inventory read failed: %w", err)
	}

	if stock < qty {
		r.mu.Unlock()
		codepoint.PointWithMeta("repo_inventory_deduct_insufficient_stock", map[string]any{
			"product_id":    productID,
			"current_stock": stock,
			"requested":     qty,
		})
		return fmt.Errorf("insufficient stock: have %d, need %d", stock, qty)
	}

	newStock := stock - qty
	_, err = r.db.ExecContext(ctx,
		"UPDATE inventory SET stock = ?, version = ? WHERE product_id = ? AND version = ?",
		newStock, version+1, productID, version,
	)

	codepoint.PointWithMeta("repo_inventory_deduct_after_update", map[string]any{
		"product_id":  productID,
		"old_stock":   stock,
		"new_stock":   newStock,
		"new_version": version + 1,
	})

	if err != nil {
		r.mu.Unlock()
		codepoint.PointWithMeta("repo_inventory_deduct_update_error", map[string]any{"error": err.Error()})
		return fmt.Errorf("inventory update failed: %w", err)
	}

	r.mu.Unlock()
	codepoint.PointWithMeta("repo_inventory_deduct_lock_released", map[string]any{
		"product_id": productID,
		"new_stock":  newStock,
	})
	return nil
}

func (r *InventoryRepository) GetStock(ctx context.Context, productID int64) (int, error) {
	codepoint.PointWithMeta("repo_inventory_get_stock_entry", map[string]any{"product_id": productID})

	var stock int
	err := r.db.QueryRowContext(ctx,
		"SELECT stock FROM inventory WHERE product_id = ?", productID,
	).Scan(&stock)

	if err != nil {
		codepoint.PointWithMeta("repo_inventory_get_stock_error", map[string]any{"error": err.Error()})
		return 0, fmt.Errorf("inventory query failed: %w", err)
	}

	codepoint.PointWithMeta("repo_inventory_get_stock_success", map[string]any{
		"product_id": productID,
		"stock":      stock,
	})
	return stock, nil
}

// ============================================================================
// Service Layer
// ============================================================================

type OrderService struct {
	orderRepo     *OrderRepository
	inventoryRepo *InventoryRepository
	mu            sync.Mutex  // protects service-level state / read-modify-write sequences
	workerPool    chan struct{} // goroutine pool limiter
}

func NewOrderService(orderRepo *OrderRepository, inventoryRepo *InventoryRepository, poolSize int) *OrderService {
	return &OrderService{
		orderRepo:     orderRepo,
		inventoryRepo: inventoryRepo,
		workerPool:    make(chan struct{}, poolSize),
	}
}

// acquireWorker blocks until a worker slot is available from the goroutine pool.
func (s *OrderService) acquireWorker(ctx context.Context) error {
	codepoint.Point("service_acquire_worker_wait")
	select {
	case s.workerPool <- struct{}{}:
		codepoint.Point("service_acquire_worker_acquired")
		return nil
	case <-ctx.Done():
		codepoint.PointWithMeta("service_acquire_worker_timeout", map[string]any{"error": ctx.Err().Error()})
		return ctx.Err()
	}
}

// releaseWorker returns a worker slot to the pool.
func (s *OrderService) releaseWorker() {
	codepoint.Point("service_release_worker")
	<-s.workerPool
}

// CreateOrder handles the full order creation flow with inventory deduction.
// This is the critical path where data inconsistency can occur.
func (s *OrderService) CreateOrder(ctx context.Context, userID, productID int64, quantity int) (*Order, error) {
	codepoint.Point("service_order_create_entry")
	codepoint.PointWithMeta("service_order_create_params", map[string]any{
		"user_id":    userID,
		"product_id": productID,
		"quantity":   quantity,
	})

	if err := s.acquireWorker(ctx); err != nil {
		codepoint.PointWithMeta("service_order_create_worker_failed", map[string]any{"error": err.Error()})
		return nil, fmt.Errorf("worker pool exhausted: %w", err)
	}
	defer s.releaseWorker()

	// --- Critical section: read inventory, check stock, deduct ---
	s.mu.Lock()
	codepoint.Point("service_order_create_service_lock_acquired")

	// Step 1: Deduct inventory (contains its own repo-level mutex)
	codepoint.PointWithMeta("service_order_create_before_inventory_deduct", map[string]any{
		"product_id": productID,
		"quantity":   quantity,
	})
	err := s.inventoryRepo.DeductStock(ctx, productID, quantity)

	codepoint.PointWithMeta("service_order_create_after_inventory_deduct", map[string]any{
		"product_id": productID,
		"error":      fmt.Sprintf("%v", err),
	})

	if err != nil {
		s.mu.Unlock()
		codepoint.PointWithMeta("service_order_create_inventory_failed", map[string]any{"error": err.Error()})
		return nil, err
	}

	// Step 2: Create order record
	order := &Order{
		UserID:    userID,
		ProductID: productID,
		Quantity:  quantity,
		Status:    "pending",
	}
	err = s.orderRepo.Create(ctx, order)

	codepoint.PointWithMeta("service_order_create_after_order_save", map[string]any{
		"order_id": order.ID,
		"error":    fmt.Sprintf("%v", err),
	})

	s.mu.Unlock()
	codepoint.Point("service_order_create_service_lock_released")

	if err != nil {
		// NOTE: inventory was deducted but order creation failed -- potential data inconsistency!
		codepoint.PointWithMeta("service_order_create_inconsistency_risk", map[string]any{
			"error":      err.Error(),
			"product_id": productID,
			"quantity":   quantity,
			"issue":      "inventory deducted but order not created -- compensating rollback needed",
		})
		return nil, fmt.Errorf("order creation failed (inventory already deducted, needs rollback): %w", err)
	}

	codepoint.PointWithMeta("service_order_create_success", map[string]any{
		"order_id": order.ID,
		"version":  order.Version,
	})
	return order, nil
}

// ConfirmOrder moves an order from pending to confirmed.
// Race condition risk: two concurrent confirmations on the same order.
func (s *OrderService) ConfirmOrder(ctx context.Context, orderID int64) (*Order, error) {
	codepoint.PointWithMeta("service_order_confirm_entry", map[string]any{"order_id": orderID})

	if err := s.acquireWorker(ctx); err != nil {
		return nil, fmt.Errorf("worker pool exhausted: %w", err)
	}
	defer s.releaseWorker()

	// Read current order to get version for optimistic locking
	currentOrder, err := s.orderRepo.GetByID(ctx, orderID)
	codepoint.PointWithMeta("service_order_confirm_after_get", map[string]any{
		"order_id":         orderID,
		"found":            currentOrder != nil,
		"current_status":   func() string { if currentOrder != nil { return currentOrder.Status }; return "" }(),
		"current_version":  func() int { if currentOrder != nil { return currentOrder.Version }; return 0 }(),
		"error":            fmt.Sprintf("%v", err),
	})

	if err != nil {
		codepoint.PointWithMeta("service_order_confirm_get_error", map[string]any{"error": err.Error()})
		return nil, err
	}

	if currentOrder.Status != "pending" {
		codepoint.PointWithMeta("service_order_confirm_invalid_state", map[string]any{
			"order_id":       orderID,
			"current_status": currentOrder.Status,
		})
		return nil, fmt.Errorf("order %d is not pending (current: %s)", orderID, currentOrder.Status)
	}

	// Update with optimistic locking
	s.mu.Lock()
	codepoint.Point("service_order_confirm_service_lock_acquired")

	err = s.orderRepo.UpdateStatus(ctx, orderID, "confirmed", currentOrder.Version)

	s.mu.Unlock()
	codepoint.Point("service_order_confirm_service_lock_released")

	if err != nil {
		// Likely optimistic lock conflict -- another goroutine confirmed first
		codepoint.PointWithMeta("service_order_confirm_conflict", map[string]any{
			"order_id":         orderID,
			"expected_version": currentOrder.Version,
			"error":            err.Error(),
		})
		return nil, err
	}

	// Re-read to return updated state
	updated, err := s.orderRepo.GetByID(ctx, orderID)
	codepoint.PointWithMeta("service_order_confirm_after_reread", map[string]any{
		"order_id":    orderID,
		"new_status":  func() string { if updated != nil { return updated.Status }; return "" }(),
		"new_version": func() int { if updated != nil { return updated.Version }; return 0 }(),
	})

	return updated, nil
}

// BatchProcessOrders processes multiple orders concurrently using the goroutine pool.
// This is where pool saturation and interleaving bugs manifest.
func (s *OrderService) BatchProcessOrders(ctx context.Context, requests []OrderRequest) []BatchResult {
	codepoint.PointWithMeta("service_batch_process_entry", map[string]any{"batch_size": len(requests)})

	results := make([]BatchResult, len(requests))
	var wg sync.WaitGroup

	for i, req := range requests {
		wg.Add(1)

		// This goroutine competes for pool slots -- interleaving with other requests
		go func(idx int, r OrderRequest) {
			defer wg.Done()
			codepoint.PointWithMeta("service_batch_worker_start", map[string]any{
				"worker_index": idx,
				"user_id":      r.UserID,
				"product_id":   r.ProductID,
				"quantity":     r.Quantity,
			})

			order, err := s.CreateOrder(ctx, r.UserID, r.ProductID, r.Quantity)

			codepoint.PointWithMeta("service_batch_worker_done", map[string]any{
				"worker_index": idx,
				"order_id":     func() int64 { if order != nil { return order.ID }; return 0 }(),
				"error":        fmt.Sprintf("%v", err),
			})

			results[idx] = BatchResult{Order: order, Err: err}
		}(i, req)
	}

	wg.Wait()
	codepoint.PointWithMeta("service_batch_process_complete", map[string]any{"batch_size": len(requests)})
	return results
}

type OrderRequest struct {
	UserID    int64 `json:"user_id"`
	ProductID int64 `json:"product_id"`
	Quantity  int   `json:"quantity"`
}

type BatchResult struct {
	Order *Order
	Err   error
}

// ============================================================================
// Handler Layer
// ============================================================================

type OrderHandler struct {
	service *OrderService
}

func NewOrderHandler(service *OrderService) *OrderHandler {
	return &OrderHandler{service: service}
}

func (h *OrderHandler) CreateOrder(w http.ResponseWriter, r *http.Request) {
	codepoint.Point("handler_order_create_entry")
	codepoint.PointWithMeta("handler_order_create_request", map[string]any{
		"method": r.Method,
		"path":   r.URL.Path,
		"remote": r.RemoteAddr,
	})

	var req OrderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		codepoint.PointWithMeta("handler_order_create_decode_error", map[string]any{"error": err.Error()})
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	codepoint.PointWithMeta("handler_order_create_decoded", map[string]any{
		"user_id":    req.UserID,
		"product_id": req.ProductID,
		"quantity":   req.Quantity,
	})

	order, err := h.service.CreateOrder(r.Context(), req.UserID, req.ProductID, req.Quantity)

	if err != nil {
		codepoint.PointWithMeta("handler_order_create_service_error", map[string]any{"error": err.Error()})
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	codepoint.PointWithMeta("handler_order_create_success", map[string]any{"order_id": order.ID})
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(order)
}

func (h *OrderHandler) ConfirmOrder(w http.ResponseWriter, r *http.Request) {
	codepoint.Point("handler_order_confirm_entry")

	// Extract order_id from path: /api/orders/{id}/confirm
	idStr := r.PathValue("id")
	orderID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		codepoint.PointWithMeta("handler_order_confirm_invalid_id", map[string]any{"raw_id": idStr})
		http.Error(w, "invalid order id", http.StatusBadRequest)
		return
	}
	codepoint.PointWithMeta("handler_order_confirm_parsed", map[string]any{"order_id": orderID})

	order, err := h.service.ConfirmOrder(r.Context(), orderID)

	if err != nil {
		codepoint.PointWithMeta("handler_order_confirm_error", map[string]any{
			"order_id": orderID,
			"error":    err.Error(),
		})
		http.Error(w, err.Error(), http.StatusConflict)
		return
	}

	codepoint.PointWithMeta("handler_order_confirm_success", map[string]any{
		"order_id":    order.ID,
		"new_status":  order.Status,
		"new_version": order.Version,
	})
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(order)
}

func (h *OrderHandler) BatchCreateOrders(w http.ResponseWriter, r *http.Request) {
	codepoint.Point("handler_batch_create_entry")

	var reqs []OrderRequest
	if err := json.NewDecoder(r.Body).Decode(&reqs); err != nil {
		codepoint.PointWithMeta("handler_batch_create_decode_error", map[string]any{"error": err.Error()})
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	codepoint.PointWithMeta("handler_batch_create_decoded", map[string]any{"count": len(reqs)})

	results := h.service.BatchProcessOrders(r.Context(), reqs)

	// Summarize results
	successCount := 0
	failCount := 0
	for _, res := range results {
		if res.Err != nil {
			failCount++
		} else {
			successCount++
		}
	}

	codepoint.PointWithMeta("handler_batch_create_done", map[string]any{
		"total":   len(reqs),
		"success": successCount,
		"failed":  failCount,
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(results)
}

func (h *OrderHandler) GetOrder(w http.ResponseWriter, r *http.Request) {
	codepoint.Point("handler_order_get_entry")

	idStr := r.PathValue("id")
	orderID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		http.Error(w, "invalid order id", http.StatusBadRequest)
		return
	}

	// Need access to the repo directly for simple reads -- in real code, add a GetOrder to service
	// For illustration we skip service and call repo directly here (another potential issue)
	codepoint.PointWithMeta("handler_order_get_skipping_service", map[string]any{
		"order_id": orderID,
		"note":     "handler directly accessing repo -- bypasses service layer locking",
	})

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "use service layer"})
}

// ============================================================================
// Middleware with codepoints
// ============================================================================

func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		codepoint.PointWithMeta("middleware_request_entry", map[string]any{
			"method": r.Method,
			"path":   r.URL.Path,
			"remote": r.RemoteAddr,
		})

		start := time.Now()
		next.ServeHTTP(w, r)
		duration := time.Since(start)

		codepoint.PointWithMeta("middleware_request_done", map[string]any{
			"method":   r.Method,
			"path":     r.URL.Path,
			"duration": duration.String(),
		})
	})
}

// ============================================================================
// Main
// ============================================================================

func main() {
	codepoint.Point("main_start")

	// Simulate DB connection (in real code, use actual database)
	db, err := sql.Open("sqlite3", ":memory:")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	// Initialize tables
	initDB(db)

	// Initialize layers
	orderRepo := NewOrderRepository(db)
	inventoryRepo := NewInventoryRepository(db)
	orderService := NewOrderService(orderRepo, inventoryRepo, 10) // pool size 10
	orderHandler := NewOrderHandler(orderService)

	codepoint.Point("main_dependencies_initialized")

	// Setup routes
	mux := http.NewServeMux()
	mux.HandleFunc("POST /api/orders", orderHandler.CreateOrder)
	mux.HandleFunc("POST /api/orders/{id}/confirm", orderHandler.ConfirmOrder)
	mux.HandleFunc("POST /api/orders/batch", orderHandler.BatchCreateOrders)
	mux.HandleFunc("GET /api/orders/{id}", orderHandler.GetOrder)

	handler := loggingMiddleware(mux)

	server := &http.Server{
		Addr:         ":8080",
		Handler:      handler,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
	}

	codepoint.Point("main_server_starting")

	// Graceful shutdown
	go func() {
		sigCh := make(chan os.Signal, 1)
		signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
		sig := <-sigCh
		codepoint.PointWithMeta("main_shutdown_signal", map[string]any{"signal": sig.String()})
		server.Shutdown(context.Background())
	}()

	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		codepoint.PointWithMeta("main_server_error", map[string]any{"error": err.Error()})
		log.Fatal(err)
	}

	codepoint.Point("main_server_stopped")
}

func initDB(db *sql.DB) {
	codepoint.Point("main_init_db")

	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS orders (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL,
			product_id INTEGER NOT NULL,
			quantity INTEGER NOT NULL,
			status TEXT NOT NULL DEFAULT 'pending',
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			version INTEGER NOT NULL DEFAULT 1
		);
		CREATE TABLE IF NOT EXISTS inventory (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			product_id INTEGER NOT NULL UNIQUE,
			stock INTEGER NOT NULL DEFAULT 100,
			version INTEGER NOT NULL DEFAULT 1
		);
		INSERT OR IGNORE INTO inventory (product_id, stock) VALUES (1, 100);
	`)
	if err != nil {
		log.Fatal(err)
	}

	codepoint.Point("main_init_db_done")
}
