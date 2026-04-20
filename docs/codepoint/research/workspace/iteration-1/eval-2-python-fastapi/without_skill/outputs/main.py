"""FastAPI application entry point.

Wires together middleware, database, Redis, and routes.
"""

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from codepoint import point, point_json, point_with_meta
from cache.redis_cache import order_cache
from repositories.order_repo import init_db, close_db

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """Application lifecycle: startup and shutdown."""
    # --- Startup ---
    point("app_startup_entry")
    logger.info("Starting Order Service...")

    await init_db()
    point("app_db_initialized")

    await order_cache.init()
    point("app_redis_initialized")

    logger.info("Order Service started successfully")
    point("app_startup_done")

    yield

    # --- Shutdown ---
    point("app_shutdown_entry")
    logger.info("Shutting down Order Service...")

    await order_cache.close()
    point("app_redis_closed")

    await close_db()
    point("app_db_closed")

    logger.info("Order Service shut down")
    point("app_shutdown_done")


app = FastAPI(
    title="Order Service",
    description="Order management API with Redis caching and PostgreSQL persistence",
    version="1.0.0",
    lifespan=lifespan,
)


# --- Middleware ---

@app.middleware("http")
async def codepoint_http_middleware(request: Request, call_next):
    """HTTP middleware that places code points at the request boundary.

    This captures the entry and exit of every HTTP request, giving AI
    visibility into the middleware chain execution.
    """
    point_json("http_request_entry", method=request.method, path=str(request.url.path))

    response = await call_next(request)

    point_with_meta(
        "http_request_done",
        method=request.method,
        path=str(request.url.path),
        status_code=response.status_code,
    )
    return response


# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Routes ---
from routers.orders import router as orders_router

app.include_router(orders_router)


# --- Root endpoint ---
@app.get("/")
async def root():
    return {"service": "Order Service", "version": "1.0.0"}
