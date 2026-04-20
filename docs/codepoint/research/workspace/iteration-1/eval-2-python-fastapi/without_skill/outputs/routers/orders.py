"""FastAPI router for order endpoints.

Handles HTTP layer: request parsing, response serialization, error mapping.
Delegates business logic to OrderService.
"""

import logging
import uuid

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from codepoint import point, point_json, point_with_meta
from schemas import OrderCreate, OrderResponse, OrderItemResponse
from services.order_service import OrderService, OrderServiceError, DailyLimitExceededError, DuplicateOrderError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/orders", tags=["orders"])

# Singleton service instance
_order_service = OrderService()


def _order_to_response(order) -> OrderResponse:
    """Convert ORM Order to response schema."""
    return OrderResponse(
        id=order.id,
        user_id=order.user_id,
        status=order.status,
        total_amount=order.total_amount,
        currency=order.currency,
        remark=order.remark,
        created_at=order.created_at,
        updated_at=order.updated_at,
        items=[
            OrderItemResponse(
                id=item.id,
                product_id=item.product_id,
                product_name=item.product_name,
                quantity=item.quantity,
                unit_price=item.unit_price,
                subtotal=item.subtotal,
            )
            for item in order.items
        ],
    )


@router.post(
    "",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new order",
    description="Creates a new order with item validation, daily limit check, and idempotency support.",
)
async def create_order(request: OrderCreate) -> OrderResponse:
    """Handle POST /api/v1/orders - Create a new order.

    Full execution chain with code points:
    1. HTTP request entry (middleware)
    2. Route handler entry
    3. After Pydantic validation
    4. Service layer entry
    5. Idempotency lock (Redis)
    6. Daily limit check (Redis + DB)
    7. Item validation (Redis cache)
    8. Order persistence (PostgreSQL)
    9. Cache updates (Redis)
    10. Lock release (Redis)
    11. Response serialization
    12. HTTP response exit (middleware)
    """
    point_json("route_order_create_entry", user_id=str(request.user_id))

    try:
        # Pydantic has already validated the request body at this point
        point("route_order_after_pydantic_validation")

        # Delegate to service layer
        order = await _order_service.create_order(request)
        point_with_meta("route_order_service_success", order_id=str(order.id))

        # Serialize response
        response = _order_to_response(order)
        point_with_meta("route_order_serialized", order_id=str(response.id))

        return response

    except DuplicateOrderError as e:
        point_with_meta("route_order_duplicate_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e),
        )

    except DailyLimitExceededError as e:
        point_with_meta("route_order_limit_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=str(e),
        )

    except OrderServiceError as e:
        point_with_meta("route_order_business_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )

    except Exception as e:
        point_with_meta("route_order_unexpected_error", error=str(e), type=type(e).__name__)
        logger.exception("Unexpected error in create_order")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


@router.get(
    "/{order_id}",
    response_model=OrderResponse,
    summary="Get order by ID",
    description="Retrieve an order with all its items.",
)
async def get_order(order_id: uuid.UUID) -> OrderResponse:
    """Handle GET /api/v1/orders/{order_id} - Get an order by ID."""
    point_json("route_order_get_entry", order_id=str(order_id))

    order = await _order_service.get_order(order_id)

    if order is None:
        point_with_meta("route_order_not_found", order_id=str(order_id))
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order {order_id} not found",
        )

    response = _order_to_response(order)
    point_with_meta("route_order_get_success", order_id=str(order_id))
    return response


# --- Health check for code point validation ---

class HealthResponse(BaseModel):
    status: str
    codepoint_enabled: bool


@router.get("/health/codepoint", response_model=HealthResponse)
async def codepoint_health():
    """Check if codepoints are enabled. Useful for debugging the instrumentation."""
    from codepoint import is_enabled
    return HealthResponse(
        status="ok",
        codepoint_enabled=is_enabled(),
    )
