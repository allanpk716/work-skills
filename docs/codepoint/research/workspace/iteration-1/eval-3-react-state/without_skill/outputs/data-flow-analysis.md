# React State Management Data Flow Analysis via Code Points

## Architecture Overview

A typical React + Zustand + WebSocket application has three main data flow layers:

```
[WebSocket Server]
       |
       v (real-time messages)
[WebSocket Connection Layer]
       |
       v (parse & transform)
[WS-to-Store Bridge]
       |
       v (setState)
[Zustand Stores]
       |
       v (selectors)
[React Components]
       |
       v (useEffect / derived state)
[Child Components / UI]
```

## Code Point Placement Map

### Layer 1: WebSocket Connection (`codepoint-websocket.ts`)

| Code Point Category | Placement | Traces |
|---|---|---|
| `ws-connection` | `onopen`, `onclose`, `onerror` handlers | Connection lifecycle |
| `ws-message-in` | Message event listener wrapper | Every incoming message with topic, type, payload |
| `ws-message-out` | `send()` method wrapper | Every outgoing message |
| `ws-reconnect` | Reconnection tracker callbacks | Backoff attempts, downtime duration |

**Instrumentation method:**
```ts
const ws = new WebSocket('wss://api.example.com/stream');
const instrumentedWs = instrumentWebSocket(ws, {
  connectionName: 'order-updates',
  topics: ['order.created', 'order.updated', 'order.deleted'],
  capturePayloads: true,
});
```

### Layer 2: WS-to-Store Bridge (`codepoint-websocket.ts` + `codepoint-zustand.ts`)

| Code Point Category | Placement | Traces |
|---|---|---|
| `ws-message-in` | Before `traceWSStoreBridge` | Raw message entering pipeline |
| `data-transform` | Inside `traceWSStoreBridge` | Parse + transform before store update |
| `store-mutation` | Inside `traceWSStoreBridge` after `setState` | Resulting store state diff |
| `cross-store-sync` | Between related store updates | Cascade effects between stores |

**Instrumentation method:**
```ts
ws.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  traceWSStoreBridge('order-updates', 'useOrderStore', data.type, data, (parsed) => {
    useOrderStore.setState({ orders: [...useOrderStore.getState().orders, parsed] });
  });
});
```

### Layer 3: Zustand Store Operations (`codepoint-zustand.ts`)

| Code Point Category | Placement | Traces |
|---|---|---|
| `store-mutation` | `setState` wrapper | Full state diff, action metadata |
| `store-selector` | Hook wrapper around `useStore` | Selector function, result preview |
| `store-subscription` | Component `useEffect` | Which component subscribes to which fields |
| `cross-store-sync` | Inter-store effect functions | Source/target store, trigger conditions |

**Instrumentation method:**
```ts
// Wrap store creation
const useOrderStore = instrumentStore(
  create<OrderState>((set) => ({ ... })),
  'useOrderStore'
);

// Wrap store hook for selector tracing
const useInstrumentedOrderStore = createInstrumentedHook(useOrderStore, 'useOrderStore');
```

### Layer 4: React Component Lifecycle (`codepoint-react.ts`)

| Code Point Category | Placement | Traces |
|---|---|---|
| `component-mount` | `useCodePointMount` | Component initialization |
| `component-unmount` | Cleanup in `useCodePointMount` | Component teardown |
| `component-render` | `useCodePointRender` | Every render with changed prop diff |
| `component-effect` | `useCodePointEffect` | Effect triggers with dep change info |
| `data-dependency` | `useCodePointDataDependency` | Explicit component dependency declaration |
| `data-transform` | `useCodePointMemo` | Memo recomputation events |

**Instrumentation method:**
```ts
function OrderDashboard() {
  const orders = useOrderStore((s) => s.orders);
  const selectedId = useOrderStore((s) => s.selectedId);

  useCodePointMount('OrderDashboard');
  useCodePointRender('OrderDashboard', { orderCount: orders.length, selectedId });
  useCodePointStoreConsumer('OrderDashboard', 'useOrderStore', ['orders', 'selectedId']);

  useCodePointEffect('OrderDashboard', 'fetchOrders', [selectedId], () => {
    if (selectedId) fetchOrderDetails(selectedId);
  });

  return <OrderList orders={orders} />;
}
```

## Data Flow Trace Chains

### Complete trace for "WebSocket order update -> UI re-render":

```
1. [ws-message-in]    "order-updates" - Received message [order.updated] topic=order.updated
2. [data-transform]   "order-updates->useOrderStore" - Transforming WS message for store
3. [store-mutation]   "useOrderStore" - State mutated { orders: [...diff] }
4. [store-selector]   "useOrderStore" - Selector evaluated
5. [component-render] "OrderDashboard" - Re-rendered (changed: orderCount)
6. [component-render] "OrderList" - Re-rendered (changed: orders)
```

### Complete trace for "Cross-store sync after user login":

```
1. [store-mutation]    "useAuthStore" - State mutated { user: {...}, isLoggedIn: true }
2. [cross-store-sync]  "useAuthStore->useOrderStore" - Sync triggered
3. [store-mutation]    "useOrderStore" - State mutated { userId: '123' }
4. [ws-message-out]    "order-updates" - Sending message [subscribe] topic=user.123
5. [ws-connection]     "order-updates" - WebSocket connected
6. [store-subscription] "OrderDashboard" - Subscribed to useOrderStore [orders]
```

## Analysis APIs

### Runtime Diagnostics

```ts
// Store mutation frequency
getStoreMutationStats();
// => { "useOrderStore": { count: 47, avgDuration: 2, lastMutation: 1713000000 } }

// WebSocket message statistics
getWSMessageStats('order-updates');
// => { inboundCount: 234, outboundCount: 12, topicsReceived: { "order.updated": 180, ... } }

// Component render history
getComponentRenderHistory('OrderDashboard');
// => { totalRenders: 15, reRenderCount: 14, changedProps: { orderCount: 8, selectedId: 6 } }

// Hot component detection (performance issues)
findHotComponents(10);
// => [{ componentName: "LiveChart", renderCount: 342, avgInterval: 200 }]
```

### Dependency Graph

```ts
// Build the full component-store-topic dependency graph
const graph = getCodePointManager().buildDependencyGraph();
// => [
//      { id: "OrderDashboard", type: "component", dependencies: ["useOrderStore"] },
//      { id: "useOrderStore", type: "store", subscriptions: [] },
//      { id: "order.updated", type: "ws-topic", subscriptions: [] },
//    ]

// Get store-to-component flow edges
getStoreToComponentFlow();
// => { edges: [{ store: "useOrderStore", component: "OrderDashboard", fields: ["orders"], eventCount: 15 }] }
```

### Coverage Validation

```ts
validateStateManagementCoverage(
  ['useAuthStore', 'useOrderStore', 'useUIStore'],
  ['OrderDashboard', 'OrderList', 'Header', 'LiveChart']
);
// => {
//      covered: ["store:useOrderStore", "component:OrderDashboard"],
//      missing: ["store:useAuthStore", "store:useUIStore", "component:OrderList", ...],
//      score: 0.29,
//      recommendations: [
//        "Add code points to store \"useAuthStore\" mutations",
//        "Add WebSocket instrumentation to trace real-time data flow into stores",
//        ...
//      ]
//    }
```

## Event Buffer & Inspection

All code point events are buffered in the singleton `CodePointManager` (max 10000 by default).

```ts
const manager = getCodePointManager();

// Get all events
manager.getEvents();

// Filter by category and level
manager.getEvents({ categories: ['store-mutation', 'cross-store-sync'], levels: ['warn', 'error'] });

// Subscribe to live events
const token = manager.subscribe((event) => {
  console.log(`[${event.category}] ${event.label}`, event.data);
}, { categories: ['ws-message-in'] });

// Clean up
manager.unsubscribe(token);

// Get causal trace chain
manager.getTraceChain('cp_1713000123_abc1234');

// Clear buffer
manager.clear();
```

## File Inventory

| File | Purpose |
|---|---|
| `codepoint-core.ts` | Core types, CodePointManager singleton, emit/subscribe/filter/trace APIs |
| `codepoint-zustand.ts` | Zustand store wrapper, instrumented selectors, cross-store sync, coverage validation |
| `codepoint-websocket.ts` | WebSocket wrapper, reconnection tracker, WS-to-store bridge, message stats |
| `codepoint-react.ts` | Component lifecycle hooks, render tracking, effect tracking, data dependency, memo profiling |
| `index.ts` | Barrel export |
