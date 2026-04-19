"""Pydantic schemas for request/response validation."""

import uuid
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field, field_validator


class OrderStatusSchema(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PAID = "paid"
    SHIPPED = "shipped"
    CANCELLED = "cancelled"


# --- Request schemas ---

class OrderItemCreate(BaseModel):
    product_id: uuid.UUID
    product_name: str = Field(min_length=1, max_length=255)
    quantity: int = Field(gt=0, le=9999)
    unit_price: float = Field(gt=0)

    @field_validator("quantity")
    @classmethod
    def validate_quantity(cls, v: int) -> int:
        if v < 1:
            raise ValueError("Quantity must be at least 1")
        return v

    @property
    def subtotal(self) -> float:
        return round(self.quantity * self.unit_price, 2)


class OrderCreate(BaseModel):
    user_id: uuid.UUID
    items: list[OrderItemCreate] = Field(min_length=1, max_length=100)
    currency: str = Field(default="CNY", pattern=r"^[A-Z]{3}$")
    remark: str | None = Field(default=None, max_length=1000)

    @property
    def total_amount(self) -> float:
        return round(sum(item.subtotal for item in self.items), 2)


# --- Response schemas ---

class OrderItemResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    product_name: str
    quantity: int
    unit_price: float
    subtotal: float

    model_config = {"from_attributes": True}


class OrderResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    status: OrderStatusSchema
    total_amount: float
    currency: str
    remark: str | None
    created_at: datetime
    updated_at: datetime
    items: list[OrderItemResponse]

    model_config = {"from_attributes": True}
