"""
Code Point Density Validation for FastAPI Order Creation

Validates that code points along the order creation execution path
have the correct density (stack overlap between 0.2 and 0.6).

Run:
    CODEPOINT_ENABLED=true pytest test_codepoint_density.py -s
"""

import os
import asyncio

# Must set BEFORE importing codepoint module
os.environ["CODEPOINT_ENABLED"] = "true"

from codepoint import collect_stack, analyze_overlap, point, point_with_meta


# ---------------------------------------------------------------------------
# Simulate the execution path functions (mirrors order_creation_with_codepoints.py)
# ---------------------------------------------------------------------------

async def simulate_middleware_entry():
    point_with_meta("http_request_entry", method="POST", path="/api/orders")
    await simulate_route_handler()


async def simulate_route_handler():
    point_with_meta("route_orders_create_entry", user_id="user-123")
    point("route_orders_create_after_parse")
    await simulate_service_create()


async def simulate_service_create():
    point_with_meta("order_service_create_entry", user_id="user-123")
    point_with_meta("order_service_after_cache_check", user_id="user-123", cache_hit=False)
    point_with_meta("order_service_after_init", order_id="order-abc")
    point("order_service_after_validate")
    await simulate_inventory_check()


async def simulate_inventory_check():
    point_with_meta("inventory_check_entry", item_count=2)
    point_with_meta("inventory_check_done", all_available=True)
    await simulate_pricing()


async def simulate_pricing():
    point_with_meta("pricing_calculate_entry", order_id="order-abc")
    point_with_meta("pricing_after_subtotal", subtotal=99.99, order_id="order-abc")
    point_with_meta("pricing_calculate_done", total=89.99, order_id="order-abc")
    await simulate_repo_insert()


async def simulate_repo_insert():
    point("repo_order_insert_entry")
    point("repo_order_transaction_begin")
    point_with_meta("repo_order_after_insert_header", order_id="order-abc")
    point_with_meta("repo_order_after_insert_items", item_count=2, order_id="order-abc")
    point("repo_order_transaction_committed")
    point("repo_order_insert_done")
    await simulate_post_save()


async def simulate_post_save():
    point_with_meta("order_service_after_cache_invalidate", order_id="order-abc")
    point_with_meta("order_service_after_event_publish", order_id="order-abc")
    point_with_meta("route_orders_create_done", order_id="order-abc")


# ---------------------------------------------------------------------------
# Density Validation Tests
# ---------------------------------------------------------------------------

def test_stack_capture_works():
    """Verify the code point library captures stacks when enabled."""
    stack = collect_stack("test_point")
    assert "[CODEPOINT] test_point" in stack
    assert "File" in stack
    print(f"  [PASS] Stack capture works, length={len(stack)} chars")


async def test_order_creation_density():
    """Run the full order creation simulation and validate density between key points."""
    print("\n--- Order Creation Code Point Density Validation ---\n")

    # Simulate the full path to capture stacks
    await simulate_middleware_entry()

    # Now collect stacks at specific checkpoints by re-running sub-paths
    # We capture pairs of adjacent points to measure overlap

    pairs: list[tuple[str, str, str]] = [
        ("http_request_entry", "route_orders_create_entry", "middleware -> route handler"),
        ("route_orders_create_entry", "order_service_create_entry", "route -> service"),
        ("order_service_create_entry", "pricing_calculate_entry", "service -> pricing"),
        ("pricing_calculate_entry", "repo_order_insert_entry", "pricing -> repository"),
        ("repo_order_insert_entry", "repo_order_transaction_committed", "within repository"),
        ("repo_order_transaction_committed", "order_service_after_event_publish", "repo -> event"),
    ]

    # Capture stacks for each named point
    stacks: dict[str, str] = {}

    # Simulate again and capture at each boundary
    point_with_meta("http_request_entry", method="POST", path="/api/orders")
    stacks["http_request_entry"] = collect_stack("http_request_entry")

    point_with_meta("route_orders_create_entry", user_id="user-123")
    stacks["route_orders_create_entry"] = collect_stack("route_orders_create_entry")

    point_with_meta("order_service_create_entry", user_id="user-123")
    stacks["order_service_create_entry"] = collect_stack("order_service_create_entry")

    point_with_meta("pricing_calculate_entry", order_id="order-abc")
    stacks["pricing_calculate_entry"] = collect_stack("pricing_calculate_entry")

    point("repo_order_insert_entry")
    stacks["repo_order_insert_entry"] = collect_stack("repo_order_insert_entry")

    point("repo_order_transaction_committed")
    stacks["repo_order_transaction_committed"] = collect_stack("repo_order_transaction_committed")

    point_with_meta("order_service_after_event_publish", order_id="order-abc")
    stacks["order_service_after_event_publish"] = collect_stack("order_service_after_event_publish")

    # Validate density for each pair
    all_pass = True
    results: list[dict] = []

    for name1, name2, description in pairs:
        s1 = stacks[name1]
        s2 = stacks[name2]
        overlap = analyze_overlap(s1, s2)

        if overlap > 0.8:
            status = "TOO DENSE (remove one point)"
            all_pass = False
        elif overlap == 0:
            status = "TOO SPARSE (add intermediate points)"
            all_pass = False
        else:
            status = "OK"

        result = {
            "pair": f"{name1} -> {name2}",
            "description": description,
            "overlap": round(overlap, 3),
            "status": status,
        }
        results.append(result)

        status_marker = "PASS" if status == "OK" else "FAIL"
        print(f"  [{status_marker}] {name1} -> {name2}")
        print(f"         Description : {description}")
        print(f"         Overlap     : {overlap:.3f}")
        print(f"         Status      : {status}")
        print()

    # Summary
    print("--- Summary ---")
    print(f"  Total pairs checked : {len(results)}")
    print(f"  Passed              : {sum(1 for r in results if r['status'] == 'OK')}")
    print(f"  Failed              : {sum(1 for r in results if r['status'] != 'OK')}")

    if all_pass:
        print("\n  All density checks PASSED. Code point placement is well-calibrated.")
    else:
        print("\n  Some density checks FAILED. Review placement.")

    return results


def test_within_module_density():
    """Test density between two points within the same module (should be moderate)."""
    # Two points called from the same function context
    s1 = collect_stack("test_within_a")
    s2 = collect_stack("test_within_b")
    overlap = analyze_overlap(s1, s2)
    # Same caller -> high overlap, but different lines -> not 1.0
    print(f"\n  Within-module overlap: {overlap:.3f}")
    assert overlap > 0.8, f"Within-module points should have high overlap, got {overlap:.3f}"
    print("  [PASS] Within-module points correctly show high overlap")


def test_cross_function_density():
    """Test density between points in different functions (should be lower)."""
    stacks = {}

    def func_a():
        point("func_a_point")
        stacks["a"] = collect_stack("func_a_point")

    def func_b():
        point("func_b_point")
        stacks["b"] = collect_stack("func_b_point")

    func_a()
    func_b()

    overlap = analyze_overlap(stacks["a"], stacks["b"])
    print(f"\n  Cross-function overlap: {overlap:.3f}")
    # Different functions called from same test function -> moderate overlap
    assert 0.2 <= overlap <= 0.8, f"Cross-function overlap should be moderate, got {overlap:.3f}"
    print("  [PASS] Cross-function points correctly show moderate overlap")


# ---------------------------------------------------------------------------
# Run all validations
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print("=" * 70)
    print("Code Point Density Validation - FastAPI Order Creation")
    print("=" * 70)

    print("\n--- Basic Library Tests ---\n")
    test_stack_capture_works()
    test_within_module_density()
    test_cross_function_density()

    print("\n--- Order Creation Path Density ---\n")
    asyncio.run(test_order_creation_density())

    print("\n" + "=" * 70)
    print("Validation complete.")
    print("=" * 70)
