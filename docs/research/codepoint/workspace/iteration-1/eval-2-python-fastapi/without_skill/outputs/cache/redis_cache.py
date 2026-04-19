"""Redis cache layer for order-related data.

Provides caching for user order counts (idempotency check) and product info.
Uses aioredis for async Redis operations.
"""

import json
import logging
from typing import Any, Optional

import redis.asyncio as redis

from codepoint import point, point_json, point_with_meta
from config import settings

logger = logging.getLogger(__name__)


class OrderCache:
    """Async Redis cache for order service operations."""

    def __init__(self):
        self._redis: Optional[redis.Redis] = None

    async def init(self) -> None:
        """Initialize Redis connection pool."""
        point("cache_init_entry")
        self._redis = redis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
        )
        # Test connection
        await self._redis.ping()
        point("cache_init_success")

    async def close(self) -> None:
        """Close Redis connection."""
        point("cache_close_entry")
        if self._redis:
            await self._redis.aclose()
            self._redis = None
        point("cache_close_done")

    @property
    def redis(self) -> redis.Redis:
        if self._redis is None:
            raise RuntimeError("Redis not initialized. Call init() first.")
        return self._redis

    async def get(self, key: str) -> Optional[dict]:
        """Get a cached value as a dict. Returns None on miss."""
        point_json("cache_get_entry", key=key)
        raw = await self.redis.get(key)
        if raw is None:
            point("cache_miss")
            return None
        point_with_meta("cache_hit", key=key)
        return json.loads(raw)

    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Set a cache value with optional TTL."""
        point_json("cache_set_entry", key=key, ttl=ttl or settings.CACHE_TTL_SECONDS)
        await self.redis.set(key, json.dumps(value, ensure_ascii=False), ex=ttl or settings.CACHE_TTL_SECONDS)
        point("cache_set_done")

    async def incr_user_order_count(self, user_id: str) -> int:
        """Atomically increment user's order counter. Returns new count."""
        point_with_meta("cache_incr_entry", user_id=user_id)
        new_count = await self.redis.incr(f"user:{user_id}:order_count")
        point_with_meta("cache_incr_done", user_id=user_id, count=new_count)
        return new_count

    async def get_user_order_count(self, user_id: str) -> int:
        """Get user's current order count."""
        point_with_meta("cache_get_order_count_entry", user_id=user_id)
        count = await self.redis.get(f"user:{user_id}:order_count")
        result = int(count) if count else 0
        point_with_meta("cache_get_order_count_done", user_id=user_id, count=result)
        return result

    async def get_product_info(self, product_id: str) -> Optional[dict]:
        """Get cached product information."""
        point_with_meta("cache_get_product_entry", product_id=product_id)
        result = await self.get(f"product:{product_id}")
        point_with_meta("cache_get_product_done", product_id=product_id, hit=result is not None)
        return result

    async def set_product_info(self, product_id: str, info: dict) -> None:
        """Cache product information."""
        point_with_meta("cache_set_product_entry", product_id=product_id)
        await self.set(f"product:{product_id}", info)
        point("cache_set_product_done")

    async def acquire_order_lock(self, user_id: str, order_key: str, ttl: int = 30) -> bool:
        """Try to acquire a distributed lock for order creation.

        Returns True if lock acquired, False if already held by another process.
        """
        lock_key = f"lock:order:{user_id}:{order_key}"
        point_with_meta("cache_lock_acquire_entry", lock_key=lock_key, ttl=ttl)
        acquired = await self.redis.set(lock_key, "1", nx=True, ex=ttl)
        result = acquired is not None
        point_with_meta("cache_lock_acquire_done", lock_key=lock_key, acquired=result)
        return result

    async def release_order_lock(self, user_id: str, order_key: str) -> None:
        """Release the distributed lock."""
        lock_key = f"lock:order:{user_id}:{order_key}"
        point_with_meta("cache_lock_release_entry", lock_key=lock_key)
        await self.redis.delete(lock_key)
        point("cache_lock_release_done")


# Singleton instance
order_cache = OrderCache()
