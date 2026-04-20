"""SQLAlchemy models for the order management system."""

import uuid
from datetime import datetime, timezone
from enum import Enum

from sqlalchemy import (
    Column, String, Float, Integer, DateTime, ForeignKey, Enum as SAEnum,
    Text
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PAID = "paid"
    SHIPPED = "shipped"
    CANCELLED = "cancelled"


class Order(Base):
    __tablename__ = "orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    status = Column(
        SAEnum(OrderStatus, name="order_status"),
        default=OrderStatus.PENDING,
        nullable=False,
    )
    total_amount = Column(Float, nullable=False, default=0.0)
    currency = Column(String(3), nullable=False, default="CNY")
    remark = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    items = relationship("OrderItem", back_populates="order", lazy="selectin")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(
        UUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
    )
    product_id = Column(UUID(as_uuid=True), nullable=False)
    product_name = Column(String(255), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)

    order = relationship("Order", back_populates="items")
