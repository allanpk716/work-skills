"""PostgreSQL repository layer for order persistence.

Handles all database operations using SQLAlchemy async sessions.
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import selectinload

from codepoint import point, point_json, point_with_meta
from config import settings
from models import Order, OrderItem, OrderStatus, Base

logger = logging.getLogger(__name__)

# Async engine and session factory
_engine = create_async_engine(settings.DATABASE_URL, echo=settings.DATABASE_ECHO)
_session_factory = async_sessionmaker(_engine, class_=AsyncSession, expire_on_commit=False)


async def init_db() -> None:
    """Create database tables on startup."""
    point("db_init_entry")
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    point("db_init_done")


async def close_db() -> None:
    """Dispose of the database engine."""
    point("db_close_entry")
    await _engine.dispose()
    point("db_close_done")


class OrderRepository:
    """Async repository for Order and OrderItem CRUD operations."""

    def __init__(self):
        self._session: Optional[AsyncSession] = None

    async def __aenter__(self) -> "OrderRepository":
        point("repo_session_open")
        self._session = _session_factory()
        point("repo_session_opened")
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        point("repo_session_close_entry")
        if exc_type:
            point_with_meta("repo_session_closing_with_error", error=str(exc_val))
            await self._session.rollback()
            point("repo_session_rollback_done")
        else:
            await self._session.commit()
            point("repo_session_commit_done")
        await self._session.close()
        self._session = None
        point("repo_session_closed")

    @property
    def session(self) -> AsyncSession:
        if self._session is None:
            raise RuntimeError("Repository must be used as async context manager.")
        return self._session

    async def create_order(
        self,
        user_id: uuid.UUID,
        total_amount: float,
        currency: str,
        remark: Optional[str],
        status: OrderStatus = OrderStatus.PENDING,
    ) -> Order:
        """Persist a new Order row."""
        point_json("repo_create_order_entry", user_id=str(user_id))
        order = Order(
            user_id=user_id,
            total_amount=total_amount,
            currency=currency,
            remark=remark,
            status=status,
        )
        self.session.add(order)
        await self.session.flush()  # Flush to get the auto-generated id
        point_with_meta("repo_create_order_flushed", order_id=str(order.id))
        return order

    async def create_order_item(
        self,
        order_id: uuid.UUID,
        product_id: uuid.UUID,
        product_name: str,
        quantity: int,
        unit_price: float,
        subtotal: float,
    ) -> OrderItem:
        """Persist a new OrderItem row."""
        point_json(
            "repo_create_item_entry",
            order_id=str(order_id),
            product_id=str(product_id),
        )
        item = OrderItem(
            order_id=order_id,
            product_id=product_id,
            product_name=product_name,
            quantity=quantity,
            unit_price=unit_price,
            subtotal=subtotal,
        )
        self.session.add(item)
        await self.session.flush()
        point_with_meta("repo_create_item_flushed", item_id=str(item.id))
        return item

    async def get_order_by_id(self, order_id: uuid.UUID) -> Optional[Order]:
        """Fetch an order with its items by primary key."""
        point_json("repo_get_order_entry", order_id=str(order_id))
        stmt = (
            select(Order)
            .options(selectinload(Order.items))
            .where(Order.id == order_id)
        )
        result = await self.session.execute(stmt)
        order = result.scalar_one_or_none()
        point_with_meta("repo_get_order_done", order_id=str(order_id), found=order is not None)
        return order

    async def count_user_orders_today(self, user_id: uuid.UUID) -> int:
        """Count how many orders a user created today."""
        point_json("repo_count_orders_entry", user_id=str(user_id))
        today_start = datetime.now(timezone.utc).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        stmt = (
            select(func.count())
            .select_from(Order)
            .where(Order.user_id == user_id, Order.created_at >= today_start)
        )
        result = await self.session.execute(stmt)
        count = result.scalar() or 0
        point_with_meta("repo_count_orders_done", user_id=str(user_id), count=count)
        return count

    async def update_order_status(
        self, order_id: uuid.UUID, new_status: OrderStatus
    ) -> Optional[Order]:
        """Update the status of an existing order."""
        point_with_meta("repo_update_status_entry", order_id=str(order_id), status=new_status.value)
        order = await self.get_order_by_id(order_id)
        if order is None:
            point("repo_update_status_order_not_found")
            return None
        old_status = order.status
        order.status = new_status
        await self.session.flush()
        point_with_meta(
            "repo_update_status_done",
            order_id=str(order_id),
            old_status=old_status.value,
            new_status=new_status.value,
        )
        return order
