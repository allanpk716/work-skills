// =============================================================================
// Code Point Placement Examples
// React + Zustand + WebSocket + Complex Data Dependencies
//
// This file demonstrates how to place code points across all layers of a
// React application that uses:
//   - Zustand for global state management
//   - WebSocket for real-time data push
//   - Complex inter-component data dependencies
// =============================================================================

import { point, pointWithMeta, pointAsync, collector } from './codepoint-base';

// =============================================================================
// 1. ZUSTAND STORE — State transitions are critical handoff boundaries
// =============================================================================

// ---------------------------------------------------------------------------
// 1a. WebSocket-connected store slice
// ---------------------------------------------------------------------------

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface RealtimeSlice {
  // State
  wsStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  messages: IncomingMessage[];
  lastMessageAt: number | null;

  // Actions
  connect: (url: string) => void;
  disconnect: () => void;
  handleRawMessage: (raw: unknown) => void;
  setWsStatus: (status: RealtimeSlice['wsStatus']) => void;
}

export const useRealtimeStore = create<RealtimeSlice>()(
  subscribeWithSelector((set, get) => ({
    wsStatus: 'disconnected',
    messages: [],
    lastMessageAt: null,

    connect(url: string) {
      // CP-01: WebSocket connection initiated — entry point for the realtime path
      point('ws_connect_start');
      get().setWsStatus('connecting');

      const ws = new WebSocket(url);

      ws.onopen = () => {
        // CP-02: WebSocket handshake complete
        point('ws_connection_established');
        set({ wsStatus: 'connected' });
      };

      ws.onmessage = (event) => {
        // CP-03: Raw message received from server — async boundary
        pointWithMeta('ws_raw_message_received', {
          dataType: typeof event.data,
          size: typeof event.data === 'string' ? event.data.length : 'blob',
        });
        get().handleRawMessage(event.data);
      };

      ws.onerror = (err) => {
        // CP-04: WebSocket error — error path
        pointWithMeta('ws_connection_error', { error: String(err) });
        set({ wsStatus: 'error' });
      };

      ws.onclose = (event) => {
        // CP-05: WebSocket closed — state transition
        pointWithMeta('ws_connection_closed', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });
        set({ wsStatus: 'disconnected' });
      };
    },

    disconnect() {
      point('ws_disconnect_initiated');
      // ... close logic
    },

    handleRawMessage(raw: unknown) {
      // CP-06: Message parsing — module boundary (wire → app layer)
      point('ws_message_parse_start');
      try {
        const msg = JSON.parse(raw as string) as IncomingMessage;

        // CP-07: Message dispatched by type — concurrency junction (switch routing)
        pointWithMeta('ws_message_dispatched', { type: msg.type, id: msg.id });

        switch (msg.type) {
          case 'order_update':
            // CP-08: Order update flow start
            pointWithMeta('ws_order_update_start', { orderId: msg.payload.orderId });
            set((state) => ({
              messages: [...state.messages, msg],
              lastMessageAt: Date.now(),
            }));
            // CP-09: Order update stored — state transition
            point('ws_order_update_state_updated');
            break;

          case 'notification':
            // CP-10: Notification flow start
            point('ws_notification_received');
            set((state) => ({
              messages: [...state.messages, msg],
              lastMessageAt: Date.now(),
            }));
            point('ws_notification_state_updated');
            break;

          case 'sync_response':
            // CP-11: Sync response — async boundary (request-response over WS)
            point('ws_sync_response_received');
            set((state) => ({
              messages: [...state.messages, msg],
              lastMessageAt: Date.now(),
            }));
            point('ws_sync_response_state_updated');
            break;

          default:
            // CP-12: Unknown message type — error path
            pointWithMeta('ws_unknown_message_type', { type: (msg as any).type });
        }
      } catch (err) {
        // CP-13: Message parse failure — error path
        pointWithMeta('ws_message_parse_error', { error: String(err) });
      }
    },

    setWsStatus(status) {
      // CP-14: Status transition — state machine
      pointWithMeta('ws_status_transition', { from: get().wsStatus, to: status });
      set({ wsStatus: status });
    },
  }))
);

// ---------------------------------------------------------------------------
// 1b. Data/domain store slice (depends on realtime store)
// ---------------------------------------------------------------------------

interface DataSlice {
  orders: Order[];
  notifications: Notification[];
  selectedOrderId: string | null;
  isLoading: boolean;

  // Derived data access
  getSelectedOrder: () => Order | undefined;
  getOrdersByStatus: (status: OrderStatus) => Order[];

  // Actions
  fetchOrders: () => Promise<void>;
  selectOrder: (orderId: string) => void;
  acknowledgeNotification: (id: string) => void;
}

export const useDataStore = create<DataSlice>()((set, get) => ({
  orders: [],
  notifications: [],
  selectedOrderId: null,
  isLoading: false,

  getSelectedOrder() {
    // CP-15: Derived data access — dependency boundary
    const { orders, selectedOrderId } = get();
    pointWithMeta('data_get_selected_order', {
      selectedOrderId,
      totalOrders: orders.length,
    });
    return orders.find((o) => o.id === selectedOrderId);
  },

  getOrdersByStatus(status) {
    // CP-16: Filtered data access
    const result = get().orders.filter((o) => o.status === status);
    pointWithMeta('data_get_orders_by_status', { status, count: result.length });
    return result;
  },

  async fetchOrders() {
    // CP-17: API fetch start — async boundary
    point('data_fetch_orders_start');
    set({ isLoading: true });

    try {
      const res = await fetch('/api/orders');
      // CP-18: API response received — module boundary (API → store)
      pointWithMeta('data_fetch_orders_response', { status: res.status });
      const data = await res.json();

      // CP-19: Data merged into store — state transition
      pointWithMeta('data_fetch_orders_success', { count: data.length });
      set({ orders: data, isLoading: false });
    } catch (err) {
      // CP-20: API fetch error — error path
      pointWithMeta('data_fetch_orders_error', { error: String(err) });
      set({ isLoading: false });
    }
  },

  selectOrder(orderId) {
    // CP-21: Selection state change — state transition with dependency impact
    const prev = get().selectedOrderId;
    pointWithMeta('data_select_order', { from: prev, to: orderId });
    set({ selectedOrderId: orderId });
  },

  acknowledgeNotification(id) {
    // CP-22: Notification acknowledged — mutation path
    pointWithMeta('data_ack_notification', { notificationId: id });
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, acknowledged: true } : n
      ),
    }));
  },
}));

// =============================================================================
// 2. CROSS-STORE SUBSCRIPTION — Data dependencies between stores
// =============================================================================

/**
 * When the realtime store receives an order_update message, we need to
 * update the data store. This cross-store subscription is a critical
 * dependency boundary.
 */
export function setupCrossStoreSubscription() {
  // CP-23: Cross-store subscription setup — dependency boundary
  point('cross_store_subscription_init');

  useRealtimeStore.subscribe(
    // Select only order_update messages
    (state) =>
      state.messages.filter((m) => m.type === 'order_update'),
    (orderUpdates) => {
      if (orderUpdates.length === 0) return;

      // CP-24: Cross-store propagation triggered — module boundary
      const latest = orderUpdates[orderUpdates.length - 1];
      pointWithMeta('cross_store_order_propagation', {
        orderId: latest.payload.orderId,
        totalUpdates: orderUpdates.length,
      });

      useDataStore.setState((state) => ({
        orders: state.orders.map((order) =>
          order.id === latest.payload.orderId
            ? { ...order, ...latest.payload }
            : order
        ),
      }));

      // CP-25: Cross-store propagation complete — state transition
      point('cross_store_order_propagation_done');
    },
    { equalityFn: (a, b) => a.length === b.length } // fire on new messages
  );
}

// =============================================================================
// 3. CUSTOM HOOKS — Component-to-store interaction boundaries
// =============================================================================

import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook: Connect to WebSocket on mount, subscribe to store changes.
 * This is where component lifecycle meets realtime data.
 */
export function useRealtimeConnection(url: string) {
  const connect = useRealtimeStore((s) => s.connect);
  const disconnect = useRealtimeStore((s) => s.disconnect);
  const wsStatus = useRealtimeStore((s) => s.wsStatus);

  useEffect(() => {
    // CP-26: Hook mount — lifecycle entry point
    point('hook_realtime_mount');
    connect(url);

    return () => {
      // CP-27: Hook unmount — lifecycle cleanup
      point('hook_realtime_unmount');
      disconnect();
    };
  }, [url, connect, disconnect]);

  return wsStatus;
}

/**
 * Hook: Auto-sync selected order with URL or parent state.
 * Shows data dependency between URL/props and store state.
 */
export function useOrderSync(orderId: string | null) {
  const selectOrder = useDataStore((s) => s.selectOrder);
  const orders = useDataStore((s) => s.orders);
  const order = orders.find((o) => o.id === orderId);

  const prevOrderId = useRef(orderId);

  useEffect(() => {
    if (orderId && orderId !== prevOrderId.current) {
      // CP-28: Order sync triggered by prop change — dependency boundary
      pointWithMeta('hook_order_sync_from_prop', {
        from: prevOrderId.current,
        to: orderId,
      });
      selectOrder(orderId);
      prevOrderId.current = orderId;
    }
  }, [orderId, selectOrder]);

  useEffect(() => {
    if (orderId && !order) {
      // CP-29: Order not found — potential race condition
      pointWithMeta('hook_order_not_found', { orderId, totalOrders: orders.length });
    }
  }, [orderId, order, orders.length]);

  return order;
}

/**
 * Hook: Watch for realtime updates to the selected order.
 * Shows the reactive dependency: realtime message → store → component.
 */
export function useOrderRealtimeUpdates(orderId: string | null) {
  const order = useDataStore((s) =>
    s.orders.find((o) => o.id === orderId)
  );
  const lastMessageAt = useRealtimeStore((s) => s.lastMessageAt);
  const prevVersion = useRef<string | null>(null);

  useEffect(() => {
    if (order && order.version !== prevVersion.current) {
      // CP-30: Order updated via realtime — state propagation verified
      pointWithMeta('hook_order_realtime_update', {
        orderId,
        version: order.version,
        prevVersion: prevVersion.current,
      });
      prevVersion.current = order.version;
    }
  }, [order, orderId]);

  useEffect(() => {
    if (lastMessageAt) {
      // CP-31: New message arrived — triggers potential re-render cascade
      point('hook_new_message_renders_pending');
    }
  }, [lastMessageAt]);

  return order;
}

/**
 * Hook: Batch state updates with debouncing.
 * Shows concurrency control at the store-consumer boundary.
 */
export function useDebouncedOrders(delay: number = 500) {
  const orders = useDataStore((s) => s.orders);
  const [debouncedOrders, setDebouncedOrders] = useState<Order[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    // CP-32: Debounce timer set — concurrency junction
    point('hook_debounce_timer_set');
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      // CP-33: Debounce timer fired — state transition
      pointWithMeta('hook_debounce_timer_fired', { orderCount: orders.length });
      setDebouncedOrders(orders);
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [orders, delay]);

  return debouncedOrders;
}

// Need this import for useDebouncedOrders
import { useState } from 'react';

// =============================================================================
// 4. REACT COMPONENTS — Rendering boundaries and user interaction
// =============================================================================

/**
 * OrderDashboard — Top-level component that orchestrates multiple data sources.
 * Critical because it's where multiple dependency streams converge.
 */
export function OrderDashboard({ initialOrderId }: { initialOrderId: string | null }) {
  // CP-34: Dashboard render start — rendering boundary
  point('component_dashboard_render');

  const wsStatus = useRealtimeConnection('wss://api.example.com/realtime');
  const selectedOrderId = useDataStore((s) => s.selectedOrderId);
  const isLoading = useDataStore((s) => s.isLoading);
  const fetchOrders = useDataStore((s) => s.fetchOrders);

  const order = useOrderRealtimeUpdates(selectedOrderId);

  useEffect(() => {
    // CP-35: Initial data fetch — entry point for data loading path
    point('component_dashboard_initial_fetch');
    fetchOrders();
  }, []);

  useEffect(() => {
    if (initialOrderId) {
      // CP-36: Initial order selection from prop — dependency boundary
      pointWithMeta('component_dashboard_initial_select', { orderId: initialOrderId });
      useDataStore.getState().selectOrder(initialOrderId);
    }
  }, []);

  const handleOrderClick = useCallback((orderId: string) => {
    // CP-37: User interaction — entry point
    pointWithMeta('component_dashboard_order_click', { orderId });
    useDataStore.getState().selectOrder(orderId);
  }, []);

  return (
    <div>
      <ConnectionStatus status={wsStatus} />
      <OrderList onSelect={handleOrderClick} />
      {isLoading ? <LoadingSpinner /> : <OrderDetail order={order} />}
    </div>
  );
}

/**
 * ConnectionStatus — Shows WebSocket status, re-renders on status change.
 * Important for tracking realtime dependency propagation.
 */
export function ConnectionStatus({ status }: { status: string }) {
  // CP-38: ConnectionStatus render — dependency re-render
  pointWithMeta('component_connection_status_render', { status });

  const messages = useRealtimeStore((s) => s.messages.length);

  return (
    <div>
      <span>Status: {status}</span>
      <span>Messages: {messages}</span>
    </div>
  );
}

/**
 * OrderList — Renders order list, depends on data store.
 * Potential performance bottleneck if parent causes unnecessary re-renders.
 */
export function OrderList({ onSelect }: { onSelect: (id: string) => void }) {
  // CP-39: OrderList render — dependency re-render
  point('component_order_list_render');

  const orders = useDebouncedOrders();
  const selectedOrderId = useDataStore((s) => s.selectedOrderId);

  return (
    <ul>
      {orders.map((order) => (
        <li
          key={order.id}
          className={order.id === selectedOrderId ? 'selected' : ''}
          onClick={() => onSelect(order.id)}
        >
          {order.id} — {order.status}
        </li>
      ))}
    </ul>
  );
}

/**
 * OrderDetail — Renders the selected order's details.
 * Re-renders triggered by: selection change OR realtime update.
 */
export function OrderDetail({ order }: { order?: Order }) {
  // CP-40: OrderDetail render — dependency re-render
  pointWithMeta('component_order_detail_render', {
    hasOrder: !!order,
    orderId: order?.id ?? 'none',
  });

  if (!order) return <div>Select an order</div>;

  return (
    <div>
      <h2>Order {order.id}</h2>
      <p>Status: {order.status}</p>
      <p>Version: {order.version}</p>
    </div>
  );
}

/**
 * LoadingSpinner — Simple wrapper to track loading state transitions.
 */
export function LoadingSpinner() {
  // CP-41: Loading state rendered — state machine visualization
  point('component_loading_render');
  return <div>Loading...</div>;
}

// =============================================================================
// 5. WEBSOCKET MESSAGE HANDLERS — Complex message processing
// =============================================================================

/**
 * Processes a batch of WebSocket messages (e.g., after reconnection).
 * Batch boundary is important for avoiding per-item code points.
 */
export async function processMessageBatch(messages: IncomingMessage[]): Promise<void> {
  // CP-42: Batch processing start — batch boundary (NOT per-message)
  pointWithMeta('handler_batch_start', { count: messages.length });

  try {
    for (const msg of messages) {
      switch (msg.type) {
        case 'order_update': {
          // CP-43: Batch item processing (order) — inside batch boundary
          pointWithMeta('handler_batch_order', { orderId: msg.payload.orderId });
          useDataStore.setState((state) => ({
            orders: state.orders.map((o) =>
              o.id === msg.payload.orderId ? { ...o, ...msg.payload } : o
            ),
          }));
          break;
        }
        case 'notification': {
          pointWithMeta('handler_batch_notification', { id: msg.payload.id });
          useDataStore.setState((state) => ({
            notifications: [...state.notifications, msg.payload],
          }));
          break;
        }
        case 'sync_response': {
          // CP-44: Sync response in batch — async boundary
          await pointAsync('handler_batch_sync_response');
          useDataStore.setState((state) => ({
            orders: msg.payload.orders,
          }));
          break;
        }
      }
    }
    // CP-45: Batch processing complete — state transition
    pointWithMeta('handler_batch_complete', { count: messages.length });
  } catch (err) {
    // CP-46: Batch processing error — error path
    pointWithMeta('handler_batch_error', { error: String(err) });
  }
}

/**
 * Optimistic update handler: applies local state change immediately,
 * then reconciles when the server confirms via WebSocket.
 * Classic race condition zone.
 */
export function handleOptimisticUpdate(
  localUpdate: Partial<Order>,
  expectedServerVersion: number
) {
  // CP-47: Optimistic update start — concurrency junction (local vs server)
  pointWithMeta('handler_optimistic_start', {
    orderId: localUpdate.id,
    expectedVersion: expectedServerVersion,
  });

  // Apply optimistic update immediately
  useDataStore.setState((state) => ({
    orders: state.orders.map((o) =>
      o.id === localUpdate.id
        ? { ...o, ...localUpdate, pending: true }
        : o
    ),
  }));

  // CP-48: Optimistic state applied — state transition
  point('handler_optimistic_applied');

  // The reconciliation happens in the cross-store subscription (CP-24)
  // when the server pushes the confirmed state via WebSocket.
  // This is where race conditions can occur if the server push arrives
  // before or after other state changes.
}

// =============================================================================
// 6. SUMMARY: Data Flow Map
// =============================================================================
//
// The code points above trace these core execution paths:
//
// PATH A — WebSocket Connection Lifecycle
//   CP-01 connect_start → CP-02 connection_established → CP-05 connection_closed
//   Branches: CP-04 error, CP-14 status_transition
//
// PATH B — Message Receive & Dispatch (the main realtime data flow)
//   CP-03 raw_message_received → CP-06 parse_start → CP-07 dispatched
//     → CP-08 order_update_start → CP-09 state_updated
//     → CP-10 notification_received → CP-11 notification_state_updated
//     → CP-11 sync_response → CP-12 sync_response_state_updated
//   Error: CP-13 parse_error
//
// PATH C — Cross-Store Propagation (realtime → data store)
//   CP-23 subscription_init → CP-24 propagation_triggered → CP-25 propagation_done
//   Depends on: PATH B (message must arrive first)
//
// PATH D — Component Rendering Cascade (store changes → UI updates)
//   CP-34 dashboard_render → CP-38 connection_status_render
//                         → CP-39 order_list_render
//                         → CP-40 order_detail_render
//   Triggered by: CP-09/CP-11/CP-12 (state changes) → CP-26 hook mount → re-renders
//
// PATH E — User Interaction (click → selection → rendering)
//   CP-37 order_click → CP-21 select_order → CP-40 order_detail_render
//
// PATH F — Data Fetching (API → store → rendering)
//   CP-17 fetch_start → CP-18 response → CP-19 success → CP-34 dashboard_render
//   Error: CP-20 fetch_error
//
// PATH G — Optimistic Update (local → server confirm)
//   CP-47 optimistic_start → CP-48 optimistic_applied
//   Reconciled by: PATH B + PATH C (server push → cross-store sync)
//
// PATH H — Batch Processing (reconnection / catch-up)
//   CP-42 batch_start → CP-43/44 batch items → CP-45 batch_complete
//   Error: CP-46 batch_error
//
// =============================================================================
// Types used in this file (for reference)
// =============================================================================

type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

interface Order {
  id: string;
  status: OrderStatus;
  version: number;
  pending?: boolean;
  [key: string]: any;
}

interface Notification {
  id: string;
  message: string;
  acknowledged: boolean;
  timestamp: number;
}

interface IncomingMessage {
  type: 'order_update' | 'notification' | 'sync_response';
  id: string;
  payload: any;
}
