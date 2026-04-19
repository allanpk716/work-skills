// service/order_service.go
package service

import (
	"context"
	"errors"
	"sync"

	"myproject/codepoint"
	"myproject/repository"
)

type CreateOrderRequest struct {
	UserID int64        `json:"user_id"`
	Items  []OrderItem  `json:"items"`
}

type UpdateOrderRequest struct {
	Status string `json:"status"`
}

type OrderItem struct {
	ProductID int64 `json:"product_id"`
	Quantity  int   `json:"quantity"`
}

type OrderResult struct {
	OrderID string `json:"order_id"`
	Status  string `json:"status"`
}

type OrderService struct {
	repo         repository.OrderRepository
	cache        *OrderCache // shared in-memory cache
	mu           sync.Mutex  // protects cache writes
	inventorySvc *InventoryService
}

func NewOrderService(repo repository.OrderRepository, cache *OrderCache, inv *InventoryService) *OrderService {
	return &OrderService{
		repo:         repo,
		cache:        cache,
		inventorySvc: inv,
	}
}

// CreateOrder creates a new order. This is the core write path where
// data inconsistency is likely to occur under concurrent access.
func (s *OrderService) CreateOrder(ctx context.Context, req *CreateOrderRequest) (*OrderResult, error) {
	codepoint.PointWithGoroutineID("order_service_create_entry")

	// Step 1: Validate request
	if err := s.validateCreate(req); err != nil {
		codepoint.PointWithMeta("order_service_create_validation_failed", map[string]any{
			"error": err.Error(),
		})
		return nil, err
	}
	codepoint.Point("order_service_create_after_validate")

	// Step 2: Deduct inventory (critical: can race with other orders)
	codepoint.PointWithMeta("order_service_inventory_before_deduct", map[string]any{
		"user_id": req.UserID,
		"items":   len(req.Items),
	})
	if err := s.inventorySvc.Deduct(ctx, req.Items); err != nil {
		// --- Code point: compensating action on failure ---
		codepoint.PointWithMeta("order_service_inventory_deduct_failed", map[string]any{
			"error": err.Error(),
		})
		return nil, err
	}
	codepoint.Point("order_service_inventory_after_deduct")

	// Step 3: Persist to database
	orderID, err := s.repo.Create(ctx, req)
	if err != nil {
		// --- Code point: critical error path -- must rollback inventory ---
		codepoint.PointWithMeta("order_service_db_create_failed", map[string]any{
			"error": err.Error(),
		})
		s.inventorySvc.Restore(ctx, req.Items)
		codepoint.Point("order_service_inventory_restored_after_db_fail")
		return nil, err
	}
	codepoint.PointWithMeta("order_service_db_create_success", map[string]any{"order_id": orderID})

	// Step 4: Update in-memory cache (critical: mutex-protected, race-prone)
	s.mu.Lock()
	codepoint.PointWithGoroutineID("order_service_cache_lock_acquired")

	s.cache.Set(orderID, &CachedOrder{
		ID:     orderID,
		Status: "created",
		UserID: req.UserID,
	})

	s.mu.Unlock()
	codepoint.PointWithGoroutineID("order_service_cache_lock_released")

	return &OrderResult{OrderID: orderID, Status: "created"}, nil
}

// GetOrder retrieves an order, first from cache then from DB.
func (s *OrderService) GetOrder(ctx context.Context, id string) (*OrderResult, error) {
	codepoint.PointWithMeta("order_service_get_entry", map[string]any{"order_id": id})

	// Try cache first
	s.mu.Lock()
	codepoint.PointWithGoroutineID("order_service_get_cache_lock_acquired")

	cached, found := s.cache.Get(id)

	s.mu.Unlock()
	codepoint.PointWithGoroutineID("order_service_get_cache_lock_released")

	if found {
		codepoint.PointWithMeta("order_service_get_cache_hit", map[string]any{"order_id": id})
		return &OrderResult{OrderID: id, Status: cached.Status}, nil
	}

	codepoint.PointWithMeta("order_service_get_cache_miss", map[string]any{"order_id": id})

	// Fall back to database
	order, err := s.repo.GetByID(ctx, id)
	if err != nil {
		codepoint.PointWithMeta("order_service_get_db_error", map[string]any{
			"order_id": id,
			"error":    err.Error(),
		})
		return nil, err
	}
	codepoint.PointWithMeta("order_service_get_db_success", map[string]any{"order_id": id})

	// Populate cache for future reads
	s.mu.Lock()
	s.cache.Set(id, &CachedOrder{
		ID:     id,
		Status: order.Status,
		UserID: order.UserID,
	})
	s.mu.Unlock()
	codepoint.Point("order_service_get_cache_populated")

	return &OrderResult{OrderID: id, Status: order.Status}, nil
}

// UpdateOrder changes order status. Critical race point:
// concurrent updates to the same order can cause lost updates.
func (s *OrderService) UpdateOrder(ctx context.Context, id string, req *UpdateOrderRequest) (*OrderResult, error) {
	codepoint.PointWithMeta("order_service_update_entry", map[string]any{
		"order_id": id,
		"new_status": req.Status,
	})

	// Validate state transition
	current, err := s.repo.GetByID(ctx, id)
	if err != nil {
		codepoint.PointWithMeta("order_service_update_load_failed", map[string]any{
			"order_id": id,
			"error":    err.Error(),
		})
		return nil, err
	}
	codepoint.PointWithMeta("order_service_update_current_state", map[string]any{
		"order_id":    id,
		"old_status":  current.Status,
		"new_status":  req.Status,
	})

	if !isValidTransition(current.Status, req.Status) {
		codepoint.PointWithMeta("order_service_update_invalid_transition", map[string]any{
			"order_id":   id,
			"old_status": current.Status,
			"new_status": req.Status,
		})
		return nil, errors.New("invalid state transition")
	}
	codepoint.Point("order_service_update_transition_validated")

	// Persist update
	err = s.repo.UpdateStatus(ctx, id, req.Status)
	if err != nil {
		codepoint.PointWithMeta("order_service_update_db_error", map[string]any{
			"order_id": id,
			"error":    err.Error(),
		})
		return nil, err
	}
	codepoint.PointWithMeta("order_service_update_db_success", map[string]any{"order_id": id})

	// Update cache (critical: must invalidate before/after to catch stale reads)
	s.mu.Lock()
	codepoint.PointWithGoroutineID("order_service_update_cache_lock_acquired")

	old := s.cache.Get(id)
	s.cache.Set(id, &CachedOrder{
		ID:     id,
		Status: req.Status,
		UserID: current.UserID,
	})

	s.mu.Unlock()
	codepoint.PointWithMeta("order_service_update_cache_refreshed", map[string]any{
		"order_id":    id,
		"old_status":  func() string { if old != nil { return old.Status }; return "nil" }(),
		"new_status":  req.Status,
	})

	return &OrderResult{OrderID: id, Status: req.Status}, nil
}

func (s *OrderService) validateCreate(req *CreateOrderRequest) error {
	if req.UserID <= 0 {
		return errors.New("invalid user_id")
	}
	if len(req.Items) == 0 {
		return errors.New("empty items")
	}
	return nil
}

func isValidTransition(from, to string) bool {
	transitions := map[string][]string{
		"created":  {"paid", "cancelled"},
		"paid":     {"shipped", "cancelled"},
		"shipped":  {"delivered"},
		"delivered": {},
		"cancelled": {},
	}
	for _, valid := range transitions[from] {
		if valid == to {
			return true
		}
	}
	return false
}
