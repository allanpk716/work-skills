"""Business logic service for order management.

Orchestrates validation, caching, pricing, persistence, and event publishing
for the order creation workflow. This is where the core domain logic lives.
"""

import hashlib
import logging
import uuid
from typing import Optional

from codepoint import point, point_json, point_with_meta
from cache.redis_cache import order_cache
from models import Order, OrderStatus
from repositories.order_repo import OrderRepository
from schemas import OrderCreate

logger = logging.getLogger(__name__)

# Business rules
MAX_DAILY_ORDERS_PER_USER = 50


class OrderServiceError(Exception):
    """Base exception for order service business logic errors."""
    pass


class DuplicateOrderError(OrderServiceError):
    """Raised when a duplicate order is detected via idempotency key."""
    pass


class DailyLimitExceededError(OrderServiceError):
    """Raised when user exceeds daily order creation limit."""
    pass


class OrderService:
    """Service layer for order operations.

    Coordinates between cache, database, and external services.
    """

    def __init__(self):
        self.repo = OrderRepository()

    def _build_idempotency_key(self, data: OrderCreate) -> str:
        """Build a deterministic idempotency key from order data."""
        raw = f"{data.user_id}:{data.currency}:{data.remark or ''}:"
        raw += ",".join(
            f"{i.product_id}:{i.quantity}:{i.unit_price}" for i in sorted(data.items, key=lambda x: str(x.product_id))
        )
        return hashlib.sha256(raw.encode()).hexdigest()[:16]

    async def _validate_daily_limit(self, user_id: uuid.UUID) -> None:
        """Check if user has exceeded the daily order creation limit."""
        point_with_meta("service_validate_limit_entry", user_id=str(user_id))

        # First check Redis cache
        cached_count = await order_cache.get_user_order_count(str(user_id))
        point_with_meta("service_cache_order_count", user_id=str(user_id), count=cached_count)

        if cached_count >= MAX_DAILY_ORDERS_PER_USER:
            point("service_limit_exceeded_from_cache")
            raise DailyLimitExceededError(
                f"User {user_id} has exceeded daily limit of {MAX_DAILY_ORDERS_PER_USER} orders"
            )

        # Cross-check with database for accuracy
        async with OrderRepository() as db_check:
            db_count = await db_check.count_user_orders_today(user_id)
        point_with_meta("service_db_order_count", user_id=str(user_id), count=db_count)

        # Sync cache if drift detected
        if db_count != cached_count:
            point_with_meta("service_cache_drift_detected", cached=cached_count, actual=db_count)
            # Update cache to match reality
            await order_cache.redis.set(
                f"user:{user_id}:order_count",
                str(db_count),
            )
            point("service_cache_synced")

        if db_count >= MAX_DAILY_ORDERS_PER_USER:
            point("service_limit_exceeded_from_db")
            raise DailyLimitExceededError(
                f"User {user_id} has exceeded daily limit of {MAX_DAILY_ORDERS_PER_USER} orders"
            )

        point("service_validate_limit_passed")

    async def _validate_items(self, data: OrderCreate) -> None:
        """Validate order items against product catalog (via cache)."""
        point_json("service_validate_items_entry", item_count=len(data.items))

        product_ids = [str(item.product_id) for item in data.items]
        unique_ids = set(product_ids)

        # Check product info cache for each unique product
        for pid in unique_ids:
            product_info = await order_cache.get_product_info(pid)
            if product_info is None:
                # In a real system, this would call the product service
                # For now we simulate by caching a default
                point_with_meta("service_product_cache_miss", product_id=pid)
                await order_cache.set_product_info(pid, {
                    "id": pid,
                    "name": "Unknown Product",
                    "available": True,
                    "price": 0.0,
                })
            else:
                point_with_meta("service_product_cache_hit", product_id=pid)

        point("service_validate_items_done")

    async def _acquire_idempotency_lock(
        self, user_id: uuid.UUID, idempotency_key: str
    ) -> bool:
        """Try to acquire a distributed lock for duplicate prevention."""
        point_with_meta("service_idempotency_entry", user_id=str(user_id), key=idempotency_key)
        acquired = await order_cache.acquire_order_lock(str(user_id), idempotency_key)
        point_with_meta("service_idempotency_done", acquired=acquired)
        if not acquired:
            raise DuplicateOrderError(
                f"Duplicate order detected for user {user_id} with key {idempotency_key}"
            )
        return acquired

    async def create_order(self, data: OrderCreate) -> Order:
        """Create a new order with full validation, caching, and persistence.

        Execution chain:
        1. Build idempotency key
        2. Acquire distributed lock (Redis)
        3. Validate daily limit (Redis + DB cross-check)
        4. Validate items (Redis product cache)
        5. Calculate totals
        6. Persist order + items (PostgreSQL)
        7. Increment user order counter (Redis)
        8. Cache new order info (Redis)
        9. Release lock (Redis)
        """
        point_json("service_create_order_entry", user_id=str(data.user_id))

        # Step 1: Build idempotency key
        idempotency_key = self._build_idempotency_key(data)
        point_with_meta("service_idempotency_key_built", key=idempotency_key)

        # Step 2: Acquire distributed lock
        await self._acquire_idempotency_lock(data.user_id, idempotency_key)
        point("service_lock_acquired")

        try:
            # Step 3: Validate daily limit
            await self._validate_daily_limit(data.user_id)
            point("service_daily_limit_validated")

            # Step 4: Validate items
            await self._validate_items(data)
            point("service_items_validated")

            # Step 5: Calculate totals (already done in schema, but explicit here)
            total_amount = data.total_amount
            point_with_meta("service_totals_calculated", total=total_amount)

            # Step 6: Persist to database
            point("service_persist_start")
            async with self.repo as repo:
                # Create order header
                order = await repo.create_order(
                    user_id=data.user_id,
                    total_amount=total_amount,
                    currency=data.currency,
                    remark=data.remark,
                )
                point_with_meta("service_order_header_saved", order_id=str(order.id))

                # Create order items
                for item_data in data.items:
                    await repo.create_order_item(
                        order_id=order.id,
                        product_id=item_data.product_id,
                        product_name=item_data.product_name,
                        quantity=item_data.quantity,
                        unit_price=item_data.unit_price,
                        subtotal=item_data.subtotal,
                    )
                point_with_meta("service_all_items_saved", order_id=str(order.id), count=len(data.items))

                # Reload with items for complete object
                saved_order = await repo.get_order_by_id(order.id)
                point_with_meta("service_order_reloaded", order_id=str(order.id))
            # context manager handles commit/rollback automatically
            point("service_persist_done")

            # Step 7: Increment user order counter in Redis
            new_count = await order_cache.incr_user_order_count(str(data.user_id))
            point_with_meta("service_user_count_incremented", user_id=str(data.user_id), count=new_count)

            # Step 8: Cache the new order summary
            await order_cache.set(
                f"order:{saved_order.id}",
                {
                    "id": str(saved_order.id),
                    "user_id": str(saved_order.user_id),
                    "status": saved_order.status.value,
                    "total": saved_order.total_amount,
                },
            )
            point_with_meta("service_order_cached", order_id=str(saved_order.id))

            point("service_create_order_success")
            return saved_order

        except Exception:
            # On error, release lock and re-raise
            point_with_meta("service_create_order_error", error="order creation failed")
            await order_cache.release_order_lock(str(data.user_id), idempotency_key)
            point("service_lock_released_on_error")
            raise

        finally:
            # Always release lock on success path
            # (error path already released above)
            await order_cache.release_order_lock(str(data.user_id), idempotency_key)
            point("service_lock_released")

    async def get_order(self, order_id: uuid.UUID) -> Optional[Order]:
        """Retrieve an order, checking cache first."""
        point_json("service_get_order_entry", order_id=str(order_id))

        # Check cache first
        cached = await order_cache.get(f"order:{order_id}")
        if cached:
            point_with_meta("service_get_order_cache_hit", order_id=str(order_id))
            # Still fetch from DB for full data with items
            async with OrderRepository() as repo:
                order = await repo.get_order_by_id(order_id)
            point_with_meta("service_get_order_done", order_id=str(order_id), source="cache_hit")
            return order

        point("service_get_order_cache_miss")
        async with OrderRepository() as repo:
            order = await repo.get_order_by_id(order_id)
            if order:
                await order_cache.set(
                    f"order:{order_id}",
                    {
                        "id": str(order.id),
                        "user_id": str(order.user_id),
                        "status": order.status.value,
                        "total": order.total_amount,
                    },
                )
                point_with_meta("service_get_order_cached_after_miss", order_id=str(order_id))

        point_with_meta("service_get_order_done", order_id=str(order_id), source="db", found=order is not None)
        return order
