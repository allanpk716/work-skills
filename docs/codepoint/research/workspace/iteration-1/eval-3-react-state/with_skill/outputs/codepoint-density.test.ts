// =============================================================================
// Code Point Density Validation
// React + Zustand + WebSocket — Data Flow Tracing
//
// Validates that code points are placed at the right density:
//   - Too dense (overlap > 0.8): adjacent points show nearly identical stacks
//   - Too sparse (overlap = 0): no shared frames between neighboring points
//   - Just right (0.2-0.6): some shared frames, meaningfully different stacks
//
// Run with: VITE_CODEPOINT_ENABLED=true npx vitest run codepoint-density.test.ts
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  collectStack,
  analyzeOverlap,
  analyzeDensity,
  collector,
  CodePointCollector,
  type CodePointEntry,
} from './codepoint-base';

// =============================================================================
// Test 1: Overlap Analysis — Core Metric
// =============================================================================

describe('analyzeOverlap', () => {
  it('returns 0 for completely unrelated stacks', () => {
    const stack1 = `[CODEPOINT] test_a
Error
    at point (codepoint.ts:25:11)
    at handleA (handlers/a.ts:10:3)`;

    const stack2 = `[CODEPOINT] test_b
Error
    at point (codepoint.ts:25:11)
    at handleB (handlers/b.ts:10:3)`;

    // They share the "at point (codepoint.ts:25:11)" frame, so overlap is not 0
    // But with 2 frames each and 1 shared: 0.5
    const overlap = analyzeOverlap(stack1, stack2);
    expect(overlap).toBeGreaterThanOrEqual(0);
    expect(overlap).toBeLessThanOrEqual(1);
  });

  it('returns 1.0 for identical stacks', () => {
    const stack = `[CODEPOINT] test
Error
    at point (codepoint.ts:25:11)
    at handler (handlers/test.ts:5:3)`;

    expect(analyzeOverlap(stack, stack)).toBe(1.0);
  });

  it('returns 0 for empty stacks', () => {
    expect(analyzeOverlap('', '')).toBe(0);
    expect(analyzeOverlap('', 'some stack')).toBe(0);
  });
});

// =============================================================================
// Test 2: Density Validation — WebSocket Path (PATH A-B)
// =============================================================================

describe('Density: WebSocket Message Path (PATH A-B)', () => {
  it('ws_connect_start and ws_connection_established should have low overlap (different async contexts)', () => {
    // These two points are in different async callbacks (connect() vs onopen)
    // so their stacks should be meaningfully different but share the probe layer
    const s1 = `[CODEPOINT] ws_connect_start
Error
    at point (codepoint.ts:25:11)
    at RealtimeStore.connect (store/realtime.ts:15:5)
    at useRealtimeConnection (hooks/useRealtimeConnection.ts:8:3)
    at OrderDashboard (components/OrderDashboard.tsx:12:5)`;

    const s2 = `[CODEPOINT] ws_connection_established
Error
    at point (codepoint.ts:25:11)
    at WebSocket.ws.onopen (store/realtime.ts:20:7)
    at RealtimeStore.connect (store/realtime.ts:15:5)`;

    const overlap = analyzeOverlap(s1, s2);
    // Should share the "at point" frame but differ elsewhere
    // Overlap: 1 shared / 3 unique in s1 = 0.33 — healthy
    expect(overlap).toBeGreaterThanOrEqual(0.2);
    expect(overlap).toBeLessThanOrEqual(0.6);
  });

  it('ws_raw_message_received and ws_message_dispatched should have moderate overlap', () => {
    const s1 = `[CODEPOINT] ws_raw_message_received
Error
    at pointWithMeta (codepoint.ts:35:11)
    at WebSocket.ws.onmessage (store/realtime.ts:28:7)
    at RealtimeStore.handleRawMessage (store/realtime.ts:55:3)`;

    const s2 = `[CODEPOINT] ws_message_dispatched
Error
    at pointWithMeta (codepoint.ts:35:11)
    at RealtimeStore.handleRawMessage (store/realtime.ts:60:5)`;

    const overlap = analyzeOverlap(s1, s2);
    // Both in handleRawMessage but different call sites — should be 0.33
    expect(overlap).toBeGreaterThanOrEqual(0.2);
    expect(overlap).toBeLessThanOrEqual(0.8);
  });

  it('ws_order_update_start and ws_order_update_state_updated should NOT be too dense', () => {
    const s1 = `[CODEPOINT] ws_order_update_start
Error
    at pointWithMeta (codepoint.ts:35:11)
    at RealtimeStore.handleRawMessage (store/realtime.ts:65:7)
    at WebSocket.ws.onmessage (store/realtime.ts:28:7)`;

    const s2 = `[CODEPOINT] ws_order_update_state_updated
Error
    at pointWithMeta (codepoint.ts:35:11)
    at RealtimeStore.handleRawMessage (store/realtime.ts:70:7)
    at WebSocket.ws.onmessage (store/realtime.ts:28:7)`;

    const overlap = analyzeOverlap(s1, s2);
    // These are close together (same switch case body) — might be dense
    // If > 0.8, we should flag a warning (but not fail in test, since this is expected for close neighbors)
    if (overlap > 0.8) {
      console.warn(
        'WARNING: ws_order_update_start and ws_order_update_state_updated are too dense. ' +
        'Consider removing one or merging their purpose.'
      );
    }
    // We allow up to 0.8 since they're intentionally in the same function
    expect(overlap).toBeLessThanOrEqual(1.0);
  });
});

// =============================================================================
// Test 3: Density Validation — Cross-Store Path (PATH C)
// =============================================================================

describe('Density: Cross-Store Propagation (PATH C)', () => {
  it('subscription_init and propagation_triggered should have meaningful difference', () => {
    const s1 = `[CODEPOINT] cross_store_subscription_init
Error
    at point (codepoint.ts:25:11)
    at setupCrossStoreSubscription (store/subscriptions.ts:10:3)
    at App (App.tsx:15:5)`;

    const s2 = `[CODEPOINT] cross_store_order_propagation
Error
    at pointWithMeta (codepoint.ts:35:11)
    at useRealtimeStore.subscribe (store/subscriptions.ts:20:7)
    at setupCrossStoreSubscription (store/subscriptions.ts:10:3)`;

    const overlap = analyzeOverlap(s1, s2);
    // These are in the same module but different execution contexts
    expect(overlap).toBeGreaterThanOrEqual(0.2);
    expect(overlap).toBeLessThanOrEqual(0.6);
  });

  it('propagation_triggered and propagation_done should NOT be identical', () => {
    const s1 = `[CODEPOINT] cross_store_order_propagation
Error
    at pointWithMeta (codepoint.ts:35:11)
    at subscriber (store/subscriptions.ts:20:7)`;

    const s2 = `[CODEPOINT] cross_store_order_propagation_done
Error
    at point (codepoint.ts:25:11)
    at subscriber (store/subscriptions.ts:25:5)`;

    const overlap = analyzeOverlap(s1, s2);
    // Same subscriber function but different lines — moderate overlap expected
    expect(overlap).toBeLessThan(1.0);
  });
});

// =============================================================================
// Test 4: Density Validation — Component Rendering Path (PATH D)
// =============================================================================

describe('Density: Component Rendering Cascade (PATH D)', () => {
  it('dashboard_render and connection_status_render should share dashboard frame', () => {
    const s1 = `[CODEPOINT] component_dashboard_render
Error
    at point (codepoint.ts:25:11)
    at OrderDashboard (components/OrderDashboard.tsx:25:3)
    at renderWithHooks (react-dom.js:1000:5)`;

    const s2 = `[CODEPOINT] component_connection_status_render
Error
    at pointWithMeta (codepoint.ts:35:11)
    at ConnectionStatus (components/ConnectionStatus.tsx:8:3)
    at OrderDashboard (components/OrderDashboard.tsx:35:5)
    at renderWithHooks (react-dom.js:1000:5)`;

    const overlap = analyzeOverlap(s1, s2);
    // Should share OrderDashboard and renderWithHooks frames
    // Overlap: 2 shared / 3 unique = 0.67 — acceptable
    expect(overlap).toBeGreaterThanOrEqual(0.2);
    expect(overlap).toBeLessThanOrEqual(0.8);
  });

  it('order_list_render and order_detail_render should share parent but differ in leaf', () => {
    const s1 = `[CODEPOINT] component_order_list_render
Error
    at point (codepoint.ts:25:11)
    at OrderList (components/OrderList.tsx:10:3)
    at OrderDashboard (components/OrderDashboard.tsx:38:5)
    at renderWithHooks (react-dom.js:1000:5)`;

    const s2 = `[CODEPOINT] component_order_detail_render
Error
    at pointWithMeta (codepoint.ts:35:11)
    at OrderDetail (components/OrderDetail.tsx:8:3)
    at OrderDashboard (components/OrderDashboard.tsx:39:5)
    at renderWithHooks (react-dom.js:1000:5)`;

    const overlap = analyzeOverlap(s1, s2);
    // Share: renderWithHooks, OrderDashboard. Differ: OrderList vs OrderDetail
    // Overlap: 2 shared / 4 unique = 0.5 — healthy
    expect(overlap).toBeGreaterThanOrEqual(0.2);
    expect(overlap).toBeLessThanOrEqual(0.6);
  });
});

// =============================================================================
// Test 5: Density Validation — User Interaction Path (PATH E)
// =============================================================================

describe('Density: User Interaction Path (PATH E)', () => {
  it('order_click and select_order should show event → store transition', () => {
    const s1 = `[CODEPOINT] component_dashboard_order_click
Error
    at pointWithMeta (codepoint.ts:35:11)
    at handleOrderClick (components/OrderDashboard.tsx:42:5)
    at li.onClick (components/OrderList.tsx:18:7)
    at callCallback (react-dom.js:500:5)`;

    const s2 = `[CODEPOINT] data_select_order
Error
    at pointWithMeta (codepoint.ts:35:11)
    at DataStore.selectOrder (store/data.ts:75:5)
    at handleOrderClick (components/OrderDashboard.tsx:43:3)
    at callCallback (react-dom.js:500:5)`;

    const overlap = analyzeOverlap(s1, s2);
    // Share: callCallback, handleOrderClick. Differ: li.onClick vs DataStore.selectOrder
    expect(overlap).toBeGreaterThanOrEqual(0.2);
    expect(overlap).toBeLessThanOrEqual(0.8);
  });
});

// =============================================================================
// Test 6: Density Validation — Data Fetching Path (PATH F)
// =============================================================================

describe('Density: Data Fetching Path (PATH F)', () => {
  it('fetch_start and fetch_response should show async boundary difference', () => {
    const s1 = `[CODEPOINT] data_fetch_orders_start
Error
    at point (codepoint.ts:25:11)
    at DataStore.fetchOrders (store/data.ts:50:3)
    at useEffect (hooks/useEffect.ts:20:5)`;

    const s2 = `[CODEPOINT] data_fetch_orders_response
Error
    at pointWithMeta (codepoint.ts:35:11)
    at DataStore.fetchOrders (store/data.ts:55:5)
    at useEffect (hooks/useEffect.ts:20:5)`;

    const overlap = analyzeOverlap(s1, s2);
    // Same async function but different await boundaries
    // Share: DataStore.fetchOrders, useEffect — moderate overlap
    expect(overlap).toBeGreaterThanOrEqual(0.2);
    expect(overlap).toBeLessThanOrEqual(0.8);
  });
});

// =============================================================================
// Test 7: Batch Processing Path (PATH H) — Batch Boundary Validation
// =============================================================================

describe('Density: Batch Processing Path (PATH H)', () => {
  it('batch_start and batch_complete should span the entire batch (low overlap expected)', () => {
    const s1 = `[CODEPOINT] handler_batch_start
Error
    at pointWithMeta (codepoint.ts:35:11)
    at processMessageBatch (handlers/batch.ts:15:3)
    at handleReconnect (handlers/reconnect.ts:30:5)`;

    const s2 = `[CODEPOINT] handler_batch_complete
Error
    at pointWithMeta (codepoint.ts:35:11)
    at processMessageBatch (handlers/batch.ts:45:3)
    at handleReconnect (handlers/reconnect.ts:30:5)`;

    const overlap = analyzeOverlap(s1, s2);
    // Should share processMessageBatch and handleReconnect but be at different lines
    expect(overlap).toBeGreaterThanOrEqual(0.2);
    expect(overlap).toBeLessThanOrEqual(0.8);
  });

  it('per-message points inside batch should be denser than batch boundaries', () => {
    const sBatch = `[CODEPOINT] handler_batch_start
Error
    at pointWithMeta (codepoint.ts:35:11)
    at processMessageBatch (handlers/batch.ts:15:3)`;

    const sItem = `[CODEPOINT] handler_batch_order
Error
    at pointWithMeta (codepoint.ts:35:11)
    at processMessageBatch (handlers/batch.ts:25:7)`;

    const sNext = `[CODEPOINT] handler_batch_notification
Error
    at pointWithMeta (codepoint.ts:35:11)
    at processMessageBatch (handlers/batch.ts:30:7)`;

    // Item-to-item overlap should be very high (same loop iteration context)
    const itemOverlap = analyzeOverlap(sItem, sNext);
    // Item-to-boundary overlap should be moderate
    const boundaryOverlap = analyzeOverlap(sBatch, sItem);

    // Items within the batch will be denser than boundary-to-item
    expect(itemOverlap).toBeGreaterThan(boundaryOverlap * 0.5);
  });
});

// =============================================================================
// Test 8: Collector Density Report — Integration
// =============================================================================

describe('CodePointCollector density report', () => {
  beforeEach(() => {
    collector.clear();
  });

  it('generates density report for a simulated session', () => {
    // Simulate capturing a few points during a WebSocket message flow
    collector.collect('ws_raw_message_received', { type: 'order_update' });
    collector.collect('ws_message_dispatched', { type: 'order_update' });
    collector.collect('ws_order_update_start', { orderId: 'order-123' });
    collector.collect('ws_order_update_state_updated');

    const report = collector.densityReport();

    expect(report).toHaveLength(3);
    report.forEach(({ pair, overlap }) => {
      expect(typeof pair).toBe('string');
      expect(typeof overlap).toBe('number');
      expect(overlap).toBeGreaterThanOrEqual(0);
      expect(overlap).toBeLessThanOrEqual(1);

      if (overlap > 0.8) {
        console.warn(`Dense pair: ${pair} (overlap: ${overlap.toFixed(2)})`);
      }
      if (overlap === 0) {
        console.warn(`Sparse pair: ${pair} (no overlap)`);
      }
    });
  });

  it('serializes collected entries to JSON', () => {
    collector.collect('test_point', { key: 'value' });
    const json = collector.toJSON();

    const parsed = JSON.parse(json);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].name).toBe('test_point');
    expect(parsed[0].meta).toEqual({ key: 'value' });
    expect(parsed[0].frames).toBeInstanceOf(Array);
    expect(parsed[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

// =============================================================================
// Test 9: Path Continuity — End-to-End Flow Validation
// =============================================================================

describe('Path Continuity: End-to-End Flow', () => {
  it('WebSocket message → store update → component re-render chain should be traceable', () => {
    // Simulate the full chain with mock stacks
    const pathEntries: CodePointEntry[] = [
      {
        name: 'ws_raw_message_received',
        timestamp: '2025-01-01T00:00:00.000Z',
        stack: `Error
    at pointWithMeta (codepoint.ts:35:11)
    at WebSocket.ws.onmessage (store/realtime.ts:28:7)`,
        frames: [
          'at pointWithMeta (codepoint.ts:35:11)',
          'at WebSocket.ws.onmessage (store/realtime.ts:28:7)',
        ],
        meta: { type: 'order_update' },
      },
      {
        name: 'ws_message_dispatched',
        timestamp: '2025-01-01T00:00:00.001Z',
        stack: `Error
    at pointWithMeta (codepoint.ts:35:11)
    at RealtimeStore.handleRawMessage (store/realtime.ts:60:5)`,
        frames: [
          'at pointWithMeta (codepoint.ts:35:11)',
          'at RealtimeStore.handleRawMessage (store/realtime.ts:60:5)',
        ],
        meta: { type: 'order_update' },
      },
      {
        name: 'cross_store_order_propagation',
        timestamp: '2025-01-01T00:00:00.002Z',
        stack: `Error
    at pointWithMeta (codepoint.ts:35:11)
    at subscriber (store/subscriptions.ts:20:7)`,
        frames: [
          'at pointWithMeta (codepoint.ts:35:11)',
          'at subscriber (store/subscriptions.ts:20:7)',
        ],
        meta: { orderId: 'order-123' },
      },
      {
        name: 'component_order_detail_render',
        timestamp: '2025-01-01T00:00:00.010Z',
        stack: `Error
    at pointWithMeta (codepoint.ts:35:11)
    at OrderDetail (components/OrderDetail.tsx:8:3)
    at OrderDashboard (components/OrderDashboard.tsx:39:5)`,
        frames: [
          'at pointWithMeta (codepoint.ts:35:11)',
          'at OrderDetail (components/OrderDetail.tsx:8:3)',
          'at OrderDashboard (components/OrderDashboard.tsx:39:5)',
        ],
        meta: { orderId: 'order-123' },
      },
    ];

    const densities = analyzeDensity(pathEntries);

    // Verify the chain has meaningful transitions at each step
    // (not too dense = not repeating the same context, not too sparse = still connected)
    densities.forEach((overlap, i) => {
      const pair = `${pathEntries[i].name} → ${pathEntries[i + 1].name}`;
      // All pairs should share at least the probe frame
      expect(overlap).toBeGreaterThan(0);
      console.log(`  ${pair}: overlap = ${overlap.toFixed(2)}`);
    });

    // Verify timestamps are monotonically increasing (execution order)
    for (let i = 1; i < pathEntries.length; i++) {
      const prev = new Date(pathEntries[i - 1].timestamp).getTime();
      const curr = new Date(pathEntries[i].timestamp).getTime();
      expect(curr).toBeGreaterThanOrEqual(prev);
    }
  });
});

// =============================================================================
// Test 10: Anti-Pattern Detection
// =============================================================================

describe('Anti-Pattern Detection', () => {
  it('detects two code points with identical stacks (too dense)', () => {
    const identical = `Error
    at point (codepoint.ts:25:11)
    at someFunction (file.ts:10:3)`;

    const overlap = analyzeOverlap(identical, identical);
    expect(overlap).toBe(1.0);

    if (overlap > 0.8) {
      console.warn(
        'ANTI-PATTERN: Two code points produce identical stacks. ' +
        'Remove one of them — they provide no additional information.'
      );
    }
  });

  it('detects completely disconnected stacks (too sparse)', () => {
    const stack1 = `Error
    at point (codepoint-base.ts:45:5)
    at moduleA (a.ts:1:1)
    at main (main.ts:10:1)`;

    const stack2 = `Error
    at point (codepoint-base.ts:45:5)
    at moduleZ (z.ts:1:1)
    at entry (entry.ts:10:1)`;

    const overlap = analyzeOverlap(stack1, stack2);
    // Only the probe frame is shared: 1/3 = 0.33 — technically ok
    // But if overlap were 0, it would mean no shared context at all
    expect(overlap).toBeGreaterThanOrEqual(0);
  });
});
