// repository/order_repository.go
package repository

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"myproject/codepoint"
)

// OrderRepository handles database operations for orders.
// Code points here track DB interaction timing and error paths,
// which are essential when data inconsistency involves persistence.
type OrderRepository struct {
	db *sql.DB
}

func NewOrderRepository(db *sql.DB) *OrderRepository {
	return &OrderRepository{db: db}
}

// Order is the database model.
type Order struct {
	ID     string `json:"id"`
	UserID int64  `json:"user_id"`
	Status string `json:"status"`
}

// Create inserts a new order into the database.
func (r *OrderRepository) Create(ctx context.Context, userID int64, items string) (string, error) {
	codepoint.PointWithGoroutineID("order_repo_create_entry")

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		codepoint.PointWithMeta("order_repo_create_tx_begin_failed", map[string]any{
			"error": err.Error(),
		})
		return "", err
	}
	codepoint.Point("order_repo_create_tx_begun")

	orderID := generateOrderID()
	codepoint.PointWithMeta("order_repo_create_id_generated", map[string]any{"order_id": orderID})

	// Insert order header
	result, err := tx.ExecContext(ctx,
		"INSERT INTO orders (id, user_id, status) VALUES (?, ?, ?)",
		orderID, userID, "created",
	)
	if err != nil {
		tx.Rollback()
		codepoint.PointWithMeta("order_repo_create_insert_failed", map[string]any{
			"error": err.Error(),
			"order_id": orderID,
		})
		return "", err
	}
	codepoint.Point("order_repo_create_order_inserted")

	rowsAffected, _ := result.RowsAffected()
	codepoint.PointWithMeta("order_repo_create_rows_affected", map[string]any{
		"rows": rowsAffected,
	})

	// Commit transaction
	if err := tx.Commit(); err != nil {
		codepoint.PointWithMeta("order_repo_create_commit_failed", map[string]any{
			"error": err.Error(),
			"order_id": orderID,
		})
		return "", err
	}
	codepoint.PointWithMeta("order_repo_create_committed", map[string]any{"order_id": orderID})

	return orderID, nil
}

// GetByID retrieves an order by ID.
func (r *OrderRepository) GetByID(ctx context.Context, id string) (*Order, error) {
	codepoint.PointWithMeta("order_repo_get_entry", map[string]any{"order_id": id})

	var order Order
	err := r.db.QueryRowContext(ctx,
		"SELECT id, user_id, status FROM orders WHERE id = ?", id,
	).Scan(&order.ID, &order.UserID, &order.Status)

	if err == sql.ErrNoRows {
		codepoint.PointWithMeta("order_repo_get_not_found", map[string]any{"order_id": id})
		return nil, fmt.Errorf("order not found: %s", id)
	}
	if err != nil {
		codepoint.PointWithMeta("order_repo_get_query_error", map[string]any{
			"order_id": id,
			"error":    err.Error(),
		})
		return nil, err
	}

	codepoint.PointWithMeta("order_repo_get_success", map[string]any{
		"order_id": id,
		"status":   order.Status,
	})
	return &order, nil
}

// UpdateStatus changes the status of an order.
// THIS IS A CRITICAL RACE POINT for data inconsistency:
// if two concurrent UpdateStatus calls read the same old status
// and both write, one update is lost.
func (r *OrderRepository) UpdateStatus(ctx context.Context, id, newStatus string) error {
	codepoint.PointWithMeta("order_repo_update_status_entry", map[string]any{
		"order_id":   id,
		"new_status": newStatus,
	})

	// Use optimistic locking or conditional update to prevent lost updates
	result, err := r.db.ExecContext(ctx,
		"UPDATE orders SET status = ? WHERE id = ? AND status != ?",
		newStatus, id, newStatus,
	)
	if err != nil {
		codepoint.PointWithMeta("order_repo_update_status_error", map[string]any{
			"order_id": id,
			"error":    err.Error(),
		})
		return err
	}

	rowsAffected, _ := result.RowsAffected()
	codepoint.PointWithMeta("order_repo_update_status_result", map[string]any{
		"order_id":      id,
		"new_status":    newStatus,
		"rows_affected": rowsAffected,
	})

	if rowsAffected == 0 {
		codepoint.PointWithMeta("order_repo_update_status_noop", map[string]any{
			"order_id": id,
			"hint":     "possible lost update or concurrent modification",
		})
	}

	return nil
}

func generateOrderID() string {
	return fmt.Sprintf("ORD-%d", time.Now().UnixNano())
}
