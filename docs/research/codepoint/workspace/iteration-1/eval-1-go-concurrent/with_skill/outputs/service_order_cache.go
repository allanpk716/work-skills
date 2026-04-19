// service/order_cache.go
package service

import (
	"sync"
	"time"
)

// OrderCache is a thread-safe in-memory cache for orders.
// This is a common source of data inconsistency:
// - Cache can become stale if DB is updated by another process
// - Concurrent reads during cache write can see partial state
// - Mutex scope errors can allow reads during writes
type OrderCache struct {
	mu    sync.RWMutex
	items map[string]*CachedOrder
}

type CachedOrder struct {
	ID        string
	Status    string
	UserID    int64
	UpdatedAt time.Time
}

func NewOrderCache() *OrderCache {
	return &OrderCache{
		items: make(map[string]*CachedOrder),
	}
}

func (c *OrderCache) Get(id string) *CachedOrder {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.items[id]
}

func (c *OrderCache) Set(id string, order *CachedOrder) {
	order.UpdatedAt = time.Now()
	c.items[id] = order
}

func (c *OrderCache) Delete(id string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	delete(c.items, id)
}

func (c *OrderCache) GetAll() map[string]*CachedOrder {
	c.mu.RLock()
	defer c.mu.RUnlock()
	result := make(map[string]*CachedOrder, len(c.items))
	for k, v := range c.items {
		result[k] = v
	}
	return result
}
