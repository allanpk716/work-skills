"""
FastAPI Order Creation - Code Point Placement Example

This file demonstrates how to place code points along the complete execution
chain of an order creation endpoint that uses:
  - async/await throughout
  - Redis caching (cache lookup, cache invalidation)
  - PostgreSQL (insert, transaction)

Execution path traced:
  HTTP Request -> Middleware -> Route Handler -> Validation -> Cache Check
  -> Service Layer -> Pricing -> Inventory Check -> DB Transaction
  -> Cache Invalidation -> Event Publish -> Response

Run with code points enabled:
    CODEPOINT_ENABLED=true uvicorn app.main:app --reload 2> codepoints.log
"""

import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional

import redis.asyncio as aioredis
from fastapi import FastAPI, HTTPException, Request
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from codepoint import point, point_json, point_with_meta

# ---------------------------------------------------------------------------
# Application Setup
# ---------------------------------------------------------------------------

app = FastAPI()


@app.middleware("http")
async def codepoint_middleware(request: Request, call_next):
    """Trace every HTTP request entering and leaving the application."""
    point_with_meta(
        "http_request_entry",
        method=request.method,
        path=request.url.path,
    )
    response = await call_next(request)
    point_with_meta(
        "http_request_done",
        method=request.method,
        path=request.url.path,
        status_code=response.status_code,
    )
    return response


# ---------------------------------------------------------------------------
# Domain Models
# ---------------------------------------------------------------------------


class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"


@dataclass
class OrderItem:
    product_id: str
    quantity: int
    unit_price: float


@dataclass
class OrderCreate:
    user_id: str
    items: list[OrderItem]
    coupon_code: Optional[str] = None


@dataclass
class Order:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = ""
    items: list[OrderItem] = field(default_factory=list)
    total_amount: float = 0.0
    status: OrderStatus = OrderStatus.PENDING
    coupon_code: Optional[str] = None


@dataclass
class PricingResult:
    subtotal: float
    discount: float
    total: float


@dataclass
class InventoryCheckResult:
    available: bool
    product_id: str
    requested: int
    actual_stock: int


# ---------------------------------------------------------------------------
# Dependencies (type stubs representing real infrastructure)
# ---------------------------------------------------------------------------


class RedisClient:
    """Represents an async Redis client."""

    async def get(self, key: str) -> Optional[str]:
        ...

    async def set(self, key: str, value: str, ex: int = 3600) -> None:
        ...

    async def delete(self, key: str) -> None:
        ...


class EventBus:
    """Represents an async event bus."""

    async def publish(self, event_type: str, payload: dict) -> None:
        ...


# ---------------------------------------------------------------------------
# Repository Layer
# ---------------------------------------------------------------------------


class OrderRepository:
    """Handles all PostgreSQL interactions for orders."""

    def __init__(self, session_factory: async_sessionmaker[AsyncSession]):
        self.session_factory = session_factory

    async def insert_order(self, order: Order) -> Order:
        """Insert a new order into PostgreSQL within a transaction."""
        point("repo_order_insert_entry")

        async with self.session_factory() as session:
            async with session.begin():
                point("repo_order_transaction_begin")

                await session.execute(
                    text(
                        "INSERT INTO orders (id, user_id, total_amount, status, coupon_code) "
                        "VALUES (:id, :user_id, :total, :status, :coupon)"
                    ),
                    {
                        "id": order.id,
                        "user_id": order.user_id,
                        "total": order.total_amount,
                        "status": order.status.value,
                        "coupon": order.coupon_code,
                    },
                )
                point("repo_order_after_insert_header")

                # Insert order items
                for item in order.items:
                    await session.execute(
                        text(
                            "INSERT INTO order_items (order_id, product_id, quantity, unit_price) "
                            "VALUES (:order_id, :product_id, :qty, :price)"
                        ),
                        {
                            "order_id": order.id,
                            "product_id": item.product_id,
                            "qty": item.quantity,
                            "price": item.unit_price,
                        },
                    )
                point_with_meta(
                    "repo_order_after_insert_items",
                    item_count=len(order.items),
                    order_id=order.id,
                )

                await session.commit()
                point("repo_order_transaction_committed")

        point("repo_order_insert_done")
        return order


# ---------------------------------------------------------------------------
# Service Layer
# ---------------------------------------------------------------------------


class PricingService:
    """Calculates order pricing with coupon support."""

    async def calculate(self, order: Order, coupon_code: Optional[str] = None) -> PricingResult:
        point_with_meta("pricing_calculate_entry", order_id=order.id)

        subtotal = sum(item.quantity * item.unit_price for item in order.items)
        point_with_meta("pricing_after_subtotal", subtotal=subtotal, order_id=order.id)

        discount = 0.0
        if coupon_code:
            point_with_meta("pricing_coupon_lookup", code=coupon_code, order_id=order.id)
            # Simulate async coupon validation (could be DB or external service call)
            discount = await self._validate_coupon(coupon_code, subtotal)
            point_with_meta(
                "pricing_after_coupon",
                discount=discount,
                code=coupon_code,
                order_id=order.id,
            )

        total = subtotal - discount
        point_with_meta("pricing_calculate_done", total=total, order_id=order.id)
        return PricingResult(subtotal=subtotal, discount=discount, total=total)

    async def _validate_coupon(self, code: str, subtotal: float) -> float:
        """Simulate async coupon validation."""
        point_with_meta("pricing_validate_coupon_start", code=code)
        # In real code this would call a DB or external service
        await asyncio_sleep(0)  # Yield control to event loop
        discount = subtotal * 0.1  # 10% off
        point_with_meta("pricing_validate_coupon_done", code=code, discount=discount)
        return discount


class InventoryService:
    """Checks and reserves inventory."""

    async def check_and_reserve(self, items: list[OrderItem]) -> list[InventoryCheckResult]:
        point_with_meta("inventory_check_entry", item_count=len(items))

        results = []
        for item in items:
            # In real code: SELECT stock FROM products WHERE id = :product_id FOR UPDATE
            point_with_meta(
                "inventory_check_product",
                product_id=item.product_id,
                requested=item.quantity,
            )
            await asyncio_sleep(0)  # Simulate async DB query
            results.append(
                InventoryCheckResult(
                    available=True,
                    product_id=item.product_id,
                    requested=item.quantity,
                    actual_stock=100,  # Simulated
                )
            )

        point_with_meta(
            "inventory_check_done",
            all_available=all(r.available for r in results),
        )
        return results


class OrderService:
    """Core business logic for order creation.

    Execution chain:
      1. Cache lookup (Redis) -> 2. Validation -> 3. Pricing -> 4. Inventory
      -> 5. DB save (PostgreSQL) -> 6. Cache invalidation (Redis) -> 7. Event publish
    """

    CACHE_KEY_PREFIX = "order:user:"

    def __init__(
        self,
        repo: OrderRepository,
        pricing: PricingService,
        inventory: InventoryService,
        redis: RedisClient,
        event_bus: EventBus,
    ):
        self.repo = repo
        self.pricing = pricing
        self.inventory = inventory
        self.redis = redis
        self.event_bus = event_bus

    async def create(self, data: OrderCreate) -> Order:
        """Full order creation flow with code points at every critical boundary."""
        point_with_meta("order_service_create_entry", user_id=data.user_id)

        # --- Phase 1: Cache check (Redis) ---
        cache_key = f"{self.CACHE_KEY_PREFIX}{data.user_id}:recent"
        cached = await self.redis.get(cache_key)
        point_with_meta(
            "order_service_after_cache_check",
            user_id=data.user_id,
            cache_key=cache_key,
            cache_hit=cached is not None,
        )

        # --- Phase 2: Initialize order ---
        order = Order(
            user_id=data.user_id,
            items=data.items,
            coupon_code=data.coupon_code,
        )
        point_with_meta("order_service_after_init", order_id=order.id)

        # --- Phase 3: Validation ---
        self._validate_items(data.items)
        point("order_service_after_validate")

        # --- Phase 4: Inventory check (async) ---
        inventory_results = await self.inventory.check_and_reserve(data.items)
        if not all(r.available for r in inventory_results):
            point("order_service_inventory_failed")
            raise HTTPException(status_code=400, detail="Insufficient inventory")
        point("order_service_after_inventory")

        # --- Phase 5: Pricing (async, potential external call) ---
        pricing = await self.pricing.calculate(order, data.coupon_code)
        order.total_amount = pricing.total
        point_with_meta(
            "order_service_after_pricing",
            order_id=order.id,
            total=order.total_amount,
        )

        # --- Phase 6: Persist to PostgreSQL (async, transactional) ---
        saved_order = await self.repo.insert_order(order)
        point_with_meta("order_service_after_db_save", order_id=saved_order.id)

        # --- Phase 7: Cache invalidation (Redis) ---
        await self.redis.delete(cache_key)
        point_with_meta(
            "order_service_after_cache_invalidate",
            order_id=saved_order.id,
            cache_key=cache_key,
        )

        # --- Phase 8: Publish domain event (async) ---
        await self.event_bus.publish(
            "order.created",
            {"order_id": saved_order.id, "user_id": saved_order.user_id, "total": saved_order.total_amount},
        )
        point_with_meta("order_service_after_event_publish", order_id=saved_order.id)

        return saved_order

    @staticmethod
    def _validate_items(items: list[OrderItem]) -> None:
        """Synchronous validation - no code points needed for pure local logic."""
        if not items:
            raise ValueError("Order must contain at least one item")
        for item in items:
            if item.quantity <= 0:
                raise ValueError(f"Invalid quantity for product {item.product_id}")


# ---------------------------------------------------------------------------
# Helper (avoids importing asyncio for a trivial sleep)
# ---------------------------------------------------------------------------


async def asyncio_sleep(seconds: float = 0) -> None:
    """Minimal stand-in for asyncio.sleep to yield control."""
    import asyncio
    await asyncio.sleep(seconds)


# ---------------------------------------------------------------------------
# Route Handlers
# ---------------------------------------------------------------------------


@app.post("/api/orders", status_code=201)
async def create_order(body: OrderCreate) -> dict:
    """Order creation endpoint - the main entry point for the order creation path."""
    point_with_meta("route_orders_create_entry", user_id=body.user_id)

    # Parse and basic request validation
    if not body.user_id:
        point("route_orders_create_validation_failed")
        raise HTTPException(status_code=400, detail="user_id is required")
    point("route_orders_create_after_parse")

    # Delegate to service layer
    # (In real code this would use dependency injection)
    order = await order_service.create(body)
    point_with_meta("route_orders_create_done", order_id=order.id)

    return {
        "id": order.id,
        "user_id": order.user_id,
        "total_amount": order.total_amount,
        "status": order.status.value,
    }


# ---------------------------------------------------------------------------
# Application wiring (in real code this would be in a DI container or setup)
# ---------------------------------------------------------------------------

# These would normally be created during app startup via dependency injection
order_service = OrderService(
    repo=OrderRepository(session_factory=None),  # type: ignore
    pricing=PricingService(),
    inventory=InventoryService(),
    redis=RedisClient(),
    event_bus=EventBus(),
)
