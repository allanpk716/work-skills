// service/inventory_service.go
package service

import (
	"context"
	"sync"

	"myproject/codepoint"
)

// InventoryService manages product inventory.
// This is a high-risk area for data inconsistency: concurrent deductions
// on the same product can exceed stock if the mutex isn't properly scoped.
type InventoryService struct {
	stockMu  sync.Mutex                    // protects stock map
	stock    map[int64]int                 // product_id -> available qty
	dbLock   sync.Mutex                    // serializes DB writes
	repo     InventoryRepository           // database layer
}

func NewInventoryService(repo InventoryRepository) *InventoryService {
	return &InventoryService{
		stock: make(map[int64]int),
		repo:  repo,
	}
}

// Deduct reduces inventory for a batch of items.
// This is the most likely source of data inconsistency:
// - If stockMu scope is wrong, concurrent deductions can race
// - If DB write fails after lock release, stock is inconsistent with DB
func (s *InventoryService) Deduct(ctx context.Context, items []OrderItem) error {
	codepoint.PointWithMeta("inventory_deduct_entry", map[string]any{
		"item_count": len(items),
	})

	// --- Code point: BEFORE lock acquire ---
	// This is critical. If two goroutines both print this before acquiring,
	// we know they are contending for the same lock.
	codepoint.PointWithGoroutineID("inventory_deduct_before_lock")

	s.stockMu.Lock()
	codepoint.PointWithGoroutineID("inventory_deduct_lock_acquired")

	// Check all items have sufficient stock
	for _, item := range items {
		current := s.stock[item.ProductID]
		if current < item.Quantity {
			s.stockMu.Unlock()
			codepoint.PointWithMeta("inventory_deduct_insufficient_stock", map[string]any{
				"product_id": item.ProductID,
				"requested":  item.Quantity,
				"available":  current,
			})
			return errInsufficientStock
		}
	}
	codepoint.Point("inventory_deduct_stock_verified")

	// Apply deductions in memory
	for _, item := range items {
		s.stock[item.ProductID] -= item.Quantity
		codepoint.PointWithMeta("inventory_deduct_memory_applied", map[string]any{
			"product_id":     item.ProductID,
			"quantity":       item.Quantity,
			"remaining":      s.stock[item.ProductID],
		})
	}

	s.stockMu.Unlock()
	codepoint.PointWithGoroutineID("inventory_deduct_lock_released")

	// Persist to database (outside lock -- potential race here!)
	// This is a KEY diagnostic point: if DB write fails, memory state diverges
	s.dbLock.Lock()
	codepoint.PointWithGoroutineID("inventory_deduct_db_lock_acquired")

	err := s.repo.BatchDeduct(ctx, items)

	s.dbLock.Unlock()
	codepoint.PointWithGoroutineID("inventory_deduct_db_lock_released")

	if err != nil {
		// --- CRITICAL: Compensating action required but stockMu already released ---
		codepoint.PointWithMeta("inventory_deduct_db_write_failed", map[string]any{
			"error":      err.Error(),
			"items":      len(items),
			"needs_rollback": true,
		})
		// Must re-acquire stockMu to rollback
		return err
	}

	codepoint.PointWithMeta("inventory_deduct_complete", map[string]any{"item_count": len(items)})
	return nil
}

// Restore returns inventory to memory and DB (compensating action).
func (s *InventoryService) Restore(ctx context.Context, items []OrderItem) {
	codepoint.PointWithMeta("inventory_restore_entry", map[string]any{
		"item_count": len(items),
	})

	s.stockMu.Lock()
	codepoint.PointWithGoroutineID("inventory_restore_lock_acquired")

	for _, item := range items {
		s.stock[item.ProductID] += item.Quantity
		codepoint.PointWithMeta("inventory_restore_memory_applied", map[string]any{
			"product_id": item.ProductID,
			"quantity":   item.Quantity,
			"new_stock":  s.stock[item.ProductID],
		})
	}

	s.stockMu.Unlock()
	codepoint.PointWithGoroutineID("inventory_restore_lock_released")

	// Best-effort DB restore
	s.dbLock.Lock()
	err := s.repo.BatchRestore(ctx, items)
	s.dbLock.Unlock()

	if err != nil {
		codepoint.PointWithMeta("inventory_restore_db_failed", map[string]any{
			"error":      err.Error(),
			"item_count": len(items),
		})
	}

	codepoint.Point("inventory_restore_complete")
}

var errInsufficientStock = &stockError{msg: "insufficient stock"}

type stockError struct {
	msg string
}

func (e *stockError) Error() string { return e.msg }

// InventoryRepository is the database interface.
type InventoryRepository interface {
	BatchDeduct(ctx context.Context, items []OrderItem) error
	BatchRestore(ctx context.Context, items []OrderItem) error
}
