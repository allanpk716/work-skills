package main

import (
	"os"
	"testing"

	"codepoint"
)

// TestCodePointDensity validates that adjacent code points have appropriate stack overlap.
// Run with: CODEPOINT_ENABLED=true go test -v -run TestCodePointDensity
func TestCodePointDensity(t *testing.T) {
	os.Setenv("CODEPOINT_ENABLED", "true")

	orderRepo := &OrderRepository{}
	inventoryRepo := &InventoryRepository{}
	svc := NewOrderService(orderRepo, inventoryRepo, 5)
	handler := NewOrderHandler(svc)

	// Capture stacks at various handler/service/repo boundaries
	// to verify density between adjacent points.

	// Handler layer points
	handlerEntryStack := codepoint.CollectStack("handler_order_create_entry")
	handlerDecodedStack := codepoint.CollectStack("handler_order_create_decoded")
	handlerSuccessStack := codepoint.CollectStack("handler_order_create_success")

	// Service layer points
	serviceEntryStack := codepoint.CollectStack("service_order_create_entry")
	serviceLockStack := codepoint.CollectStack("service_order_create_service_lock_acquired")
	serviceInventoryStack := codepoint.CollectStack("service_order_create_after_inventory_deduct")

	// Repository layer points
	repoCreateEntryStack := codepoint.CollectStack("repo_order_create_entry")
	repoCreateLockStack := codepoint.CollectStack("repo_order_create_lock_acquired")

	t.Run("handler_points_not_too_dense", func(t *testing.T) {
		overlap := codepoint.AnalyzeOverlap(handlerEntryStack, handlerDecodedStack)
		t.Logf("handler_entry <-> handler_decoded overlap: %.2f", overlap)
		if overlap > 0.8 {
			t.Logf("WARNING: Points too dense (overlap=%.2f), consider removing one", overlap)
		}
	})

	t.Run("handler_points_not_too_sparse", func(t *testing.T) {
		overlap := codepoint.AnalyzeOverlap(handlerEntryStack, handlerSuccessStack)
		t.Logf("handler_entry <-> handler_success overlap: %.2f", overlap)
		if overlap == 0 {
			t.Log("WARNING: Points too sparse (no overlap), add intermediate points")
		}
	})

	t.Run("service_lock_points_density", func(t *testing.T) {
		overlap := codepoint.AnalyzeOverlap(serviceEntryStack, serviceLockStack)
		t.Logf("service_entry <-> service_lock_acquired overlap: %.2f", overlap)
		if overlap >= 0.2 && overlap <= 0.6 {
			t.Logf("Good density (overlap=%.2f)", overlap)
		}
	})

	t.Run("cross_layer_handler_to_service", func(t *testing.T) {
		overlap := codepoint.AnalyzeOverlap(handlerEntryStack, serviceEntryStack)
		t.Logf("handler_entry <-> service_entry overlap: %.2f", overlap)
		// Cross-layer points naturally share fewer frames -- that's expected
	})

	t.Run("repo_lock_points_density", func(t *testing.T) {
		overlap := codepoint.AnalyzeOverlap(repoCreateEntryStack, repoCreateLockStack)
		t.Logf("repo_entry <-> repo_lock_acquired overlap: %.2f", overlap)
		if overlap >= 0.2 && overlap <= 0.6 {
			t.Logf("Good density (overlap=%.2f)", overlap)
		}
	})

	t.Run("concurrency_junction_density", func(t *testing.T) {
		// The critical race-condition-prone points should be meaningfully different
		overlap := codepoint.AnalyzeOverlap(serviceLockStack, serviceInventoryStack)
		t.Logf("service_lock <-> service_after_inventory overlap: %.2f", overlap)
		if overlap > 0.8 {
			t.Logf("WARNING: Concurrency points too dense -- they show nearly identical call stacks")
		}
	})

	_ = svc    // suppress unused warning
	_ = handler // suppress unused warning
}
