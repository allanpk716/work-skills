# Go HTTP Microservice -- Codepoint Instrumentation for Concurrent Data Inconsistency

## Architecture Overview

```
HTTP Handler  -->  Service Layer  -->  Repository Layer
   (sync.Mutex)     (sync.Mutex)       (sync.Mutex)
                    (goroutine pool)
```

Three-layer Go microservice handling order creation, confirmation, and batch processing.
Uses `sync.Mutex` at both service and repository layers, plus a goroutine pool for concurrency control.

## Root Causes of Data Inconsistency (Suspected)

1. **Double locking without transaction boundary**: Service holds `s.mu`, then repository acquires `r.mu` inside -- if inventory deduct succeeds but order insert fails, inventory is already consumed with no rollback.
2. **Optimistic locking race on order status**: Two concurrent `ConfirmOrder` calls read the same version, both try to update -- one gets a version conflict.
3. **Goroutine pool + batch interleaving**: `BatchProcessOrders` spawns goroutines that compete for pool slots and mutexes, causing non-deterministic execution order.
4. **Lock ordering violations**: Different code paths acquire `s.mu` and `r.mu` in potentially different orders (inventory.DeductStock acquires `r.mu` while `s.mu` is already held).

## Codepoint Placement Strategy

### Total: 42 code points across 3 layers

### Layer 1: HTTP Handler (8 points)

| Point Name | Location | Purpose |
|---|---|---|
| `handler_order_create_entry` | POST /api/orders entry | Track when request arrives |
| `handler_order_create_request` | After entry, before decode | Capture request metadata (method, path, remote) |
| `handler_order_create_decode_error` | On JSON decode failure | Error path |
| `handler_order_create_decoded` | After successful decode | Verify request parameters |
| `handler_order_create_service_error` | On service failure | Track service-layer errors surfacing |
| `handler_order_create_success` | On success response | Track successful completion |
| `handler_order_confirm_entry` | POST /api/orders/{id}/confirm | Track confirm request |
| `handler_batch_create_entry` | POST /api/orders/batch | Track batch request arrival |
| `handler_batch_create_decoded` | After batch decode | Verify batch size |
| `handler_batch_create_done` | After batch complete | Track success/fail counts |

### Layer 2: Service Layer (16 points)

| Point Name | Location | Purpose |
|---|---|---|
| `service_acquire_worker_wait` | Before pool slot acquisition | Detect pool contention |
| `service_acquire_worker_acquired` | After pool slot acquired | Confirm pool not exhausted |
| `service_acquire_worker_timeout` | On ctx cancellation during wait | Detect pool timeout |
| `service_order_create_entry` | CreateOrder start | Entry point |
| `service_order_create_params` | After entry | Log input parameters |
| `service_order_create_service_lock_acquired` | After s.mu.Lock() | **Critical**: Detect lock contention |
| `service_order_create_before_inventory_deduct` | Before inventory call | **Critical**: State before repo call |
| `service_order_create_after_inventory_deduct` | After inventory call | **Critical**: Detect inventory failure |
| `service_order_create_after_order_save` | After order creation | **Critical**: Detect save failure |
| `service_order_create_service_lock_released` | After s.mu.Unlock() | Lock release |
| `service_order_create_inconsistency_risk` | On inventory-ok/order-fail path | **KEY**: This is the exact inconsistency point |
| `service_order_confirm_entry` | ConfirmOrder start | Entry |
| `service_order_confirm_service_lock_acquired` | After s.mu.Lock() | Detect lock contention on confirm |
| `service_order_confirm_conflict` | On optimistic lock failure | **KEY**: Detect version conflict race |
| `service_batch_worker_start` | Each batch goroutine start | **KEY**: Trace interleaving |
| `service_batch_worker_done` | Each batch goroutine done | **KEY**: Trace completion order |

### Layer 3: Repository Layer (14 points)

| Point Name | Location | Purpose |
|---|---|---|
| `repo_order_create_entry` | Create entry | |
| `repo_order_create_lock_acquired` | After r.mu.Lock() | **Critical**: Repo lock contention |
| `repo_order_create_after_exec` | After DB exec | Track DB timing |
| `repo_order_create_error` | On insert failure | Error path |
| `repo_order_create_lock_released` | After r.mu.Unlock() | Lock release |
| `repo_order_update_status_entry` | Update entry with version | Track optimistic lock attempt |
| `repo_order_update_status_lock_acquired` | After r.mu.Lock() | Detect contention |
| `repo_order_update_status_version_conflict` | On 0 rows affected | **KEY**: Optimistic lock violation |
| `repo_inventory_deduct_entry` | Inventory deduct entry | |
| `repo_inventory_deduct_lock_acquired` | After r.mu.Lock() | **Critical**: Detect lock contention on inventory |
| `repo_inventory_deduct_after_select` | After SELECT FOR UPDATE | **Critical**: See current stock before deduct |
| `repo_inventory_deduct_insufficient_stock` | On stock check failure | Track underflow |
| `repo_inventory_deduct_after_update` | After UPDATE | Verify new stock value |
| `repo_inventory_deduct_lock_released` | After r.mu.Unlock() | Lock release |

### Middleware (4 points)

| Point Name | Location | Purpose |
|---|---|---|
| `middleware_request_entry` | Before handler chain | Request lifecycle start |
| `middleware_request_done` | After handler chain | Request lifecycle end + duration |

## Key Codepoint Patterns for Concurrency Debugging

### Pattern 1: Lock Acquire/Release Pairs
Every mutex operation has a paired code point:
- `*_lock_acquired` immediately after `Lock()`
- `*_lock_released` immediately after `Unlock()`

When analyzing captured output, look for:
- Long time gaps between acquire and release (lock held too long)
- Acquired without matching released (deadlock or panic)
- Multiple goroutines waiting at acquire points (contention)

### Pattern 2: Before/After Repository Calls
Service-layer code points before and after each repository call:
- `service_order_create_before_inventory_deduct`
- `service_order_create_after_inventory_deduct`

This reveals if the repository call failed or took too long.

### Pattern 3: Inconsistency Detection Point
The `service_order_create_inconsistency_risk` point is placed at the exact code path where inventory was deducted but order creation failed. This is the most likely root cause of data inconsistency.

### Pattern 4: Optimistic Lock Conflict
The `repo_order_update_status_version_conflict` and `service_order_confirm_conflict` points capture when two concurrent confirmations race on the same order.

### Pattern 5: Batch Worker Interleaving
The `service_batch_worker_start` and `service_batch_worker_done` points (with `worker_index` metadata) reveal the execution order of goroutines in the pool, which is non-deterministic.

## How to Use

```bash
# 1. Enable code points and capture to file
CODEPOINT_ENABLED=true go run ./... 2> codepoints.log

# 2. In another terminal, send concurrent requests:
# Simulate race condition on order confirmation:
curl -X POST http://localhost:8080/api/orders/1/confirm &
curl -X POST http://localhost:8080/api/orders/1/confirm &

# Simulate batch interleaving:
curl -X POST http://localhost:8080/api/orders/batch \
  -d '[{"user_id":1,"product_id":1,"quantity":5},{"user_id":2,"product_id":1,"quantity":3}]'

# 3. Stop the server, then analyze codepoints.log
```

## Analysis Guide

When reviewing codepoints.log:

1. **Sort by timestamp** to see actual execution order across goroutines
2. **Group by goroutine ID** to trace individual request lifecycles
3. **Look for lock_acquired without lock_released** -- potential deadlock
4. **Check inventory_deduct_after_update stock values** -- should monotonically decrease
5. **Check for inconsistency_risk entries** -- these are the smoking gun
6. **Check batch worker_start/done ordering** -- reveals pool scheduling behavior
7. **Look for version_conflict entries** -- confirms optimistic lock races

## Files

- `codepoint/codepoint.go` -- Base library (stack capture, JSON output, overlap analysis)
- `main.go` -- Instrumented microservice (handler -> service -> repository)
- `codepoint_test.go` -- Density validation tests
