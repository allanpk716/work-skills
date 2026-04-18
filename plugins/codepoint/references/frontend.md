# Frontend (JS/TS) Code Point Implementation Guide

## Table of Contents
1. [Base Library](#base-library)
2. [React Patterns](#react-patterns)
3. [Vue Patterns](#vue-patterns)
4. [Node.js Backend Patterns](#nodejs-backend-patterns)
5. [Async/Promise Chain Patterns](#asyncpromise-chain-patterns)
6. [Density Validation](#density-validation)
7. [AI Integration](#ai-integration)

## Toggle & Output Convention

**Enable**: `touch ~/.codepoint/.codepoint-ts`
**Disable**: `rm ~/.codepoint/.codepoint-ts`
**Output**: `~/.codepoint/<project-dir-name>/cp-ts-YYYY-MM-DD_HH-MM-SS_mmm.log`

The frontend base library works in two modes:

- **Node.js / Vite dev server**: Reads the toggle file directly from `~/.codepoint/.codepoint-ts`, writes output to the log file automatically.
- **Browser (with backend collector)**: POSTs stack traces to `/__codepoint__` on the backend. The backend (Go, Python, etc.) checks the same toggle file and writes to `cp-ts-*.log`. If the endpoint returns 404, the library stops sending after one attempt — zero overhead. This is the recommended approach for full-stack projects where the frontend is embedded in the backend binary.
- **Browser (standalone)**: Falls back to `console.error` output. Enable via `VITE_CODEPOINT_ENABLED=true` build variable for projects without a backend collector.

## Base Library

Create `src/lib/codepoint.ts`:

```typescript
// Code Point: lightweight runtime probe for AI-assisted debugging
// Zero overhead when disabled:
//   Node.js — one boolean check
//   Browser — one failed fetch, then stops trying

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

interface CodePointEntry {
  name: string;
  timestamp: string;
  stack: string;
  frames: string[];
  meta?: Record<string, unknown>;
}

const isBrowser = typeof window !== 'undefined';

// --- Browser state ---
let _endpointAlive = true;

// --- Node.js state ---
let enabled = false;
let outputPath = '';

function initNode(): void {
  const home = os.homedir();
  const togglePath = path.join(home, '.codepoint', '.codepoint-ts');

  if (!fs.existsSync(togglePath)) return;

  enabled = true;

  const projectName = path.basename(process.cwd());

  const outDir = path.join(home, '.codepoint', projectName);
  fs.mkdirSync(outDir, { recursive: true });

  const now = new Date();
  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  const ts = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
    `_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  const ms = String(now.getMilliseconds()).padStart(3, '0');
  const filename = `cp-ts-${ts}_${ms}.log`;

  outputPath = path.join(outDir, filename);

  const header = `# Code Point Log (TypeScript)\n# Project: ${projectName}\n# Started: ${now.toISOString()}\n# Toggle: ${togglePath}\n\n`;
  fs.writeFileSync(outputPath, header, 'utf-8');
}

if (!isBrowser) {
  initNode();
}

function parseStack(stack: string): string[] {
  return stack
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('at '));
}

function writeNode(content: string): void {
  fs.appendFileSync(outputPath, content + '\n', 'utf-8');
}

function sendToCollector(name: string, stack: string, meta?: Record<string, unknown>): void {
  if (!_endpointAlive) return;
  const payload = JSON.stringify({ name, stack, timestamp: new Date().toISOString(), meta });
  fetch('/__codepoint__', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
  }).catch(() => { _endpointAlive = false; });
}

/**
 * Capture a stack trace at the call site.
 * Disabled = zero cost: one bool check (Node.js) or one failed fetch (browser).
 */
export function point(name: string): void {
  const stack = new Error().stack ?? '';

  if (isBrowser) {
    sendToCollector(name, stack);
    return;
  }

  if (!enabled) return;
  writeNode(`[CODEPOINT] ${name}\n${stack}\n`);
}

/**
 * Capture a stack trace with additional metadata.
 */
export function pointWithMeta(name: string, meta: Record<string, unknown>): void {
  const stack = new Error().stack ?? '';

  if (isBrowser) {
    sendToCollector(name, stack, meta);
    return;
  }

  if (!enabled) return;
  const entry: CodePointEntry = {
    name,
    timestamp: new Date().toISOString(),
    stack,
    frames: parseStack(stack),
    meta,
  };
  writeNode(JSON.stringify(entry));
}

/**
 * Returns the stack as a string for programmatic use.
 */
export function collectStack(name: string): string {
  const stack = new Error().stack ?? '';
  return `[CODEPOINT] ${name}\n${stack}`;
}

/**
 * Async-aware code point — captures the async call chain.
 */
export async function pointAsync(name: string): Promise<void> {
  const stack = new Error().stack ?? '';

  if (isBrowser) {
    sendToCollector(`${name} [async]`, stack);
    return;
  }

  if (!enabled) return;
  writeNode(`[CODEPOINT] ${name} [async]\n${stack}\n`);
}

/**
 * Compute overlap between two captured stacks.
 * Returns 0.0 (no overlap) to 1.0 (identical frames).
 */
export function analyzeOverlap(stack1: string, stack2: string): number {
  const f1 = new Set(parseStack(stack1));
  const f2 = new Set(parseStack(stack2));
  if (f1.size === 0) return 0;
  let overlap = 0;
  for (const frame of f1) {
    if (f2.has(frame)) overlap++;
  }
  return overlap / f1.size;
}

/** Returns whether code points are enabled. */
export function isEnabled(): boolean {
  return isBrowser ? _endpointAlive : enabled;
}

/** Returns the output file path (Node.js only), or '' if disabled/browser. */
export function getOutputPath(): string {
  return outputPath;
}

/**
 * Batch collector — accumulate code point data during a session.
 */
class CodePointCollector {
  private entries: CodePointEntry[] = [];

  collect(name: string, meta?: Record<string, unknown>): void {
    const stack = new Error().stack ?? '';
    this.entries.push({
      name,
      timestamp: new Date().toISOString(),
      stack,
      frames: parseStack(stack),
      meta,
    });
  }

  dump(): CodePointEntry[] {
    return [...this.entries];
  }

  clear(): void {
    this.entries = [];
  }

  toJSON(): string {
    return JSON.stringify(this.entries, null, 2);
  }
}

export const collector = new CodePointCollector();
```

## React Patterns

### Component Lifecycle

```tsx
import { point } from '@/lib/codepoint';

function UserDashboard({ userId }: { userId: string }) {
  useEffect(() => {
    point('dashboard_mount');
    return () => {
      point('dashboard_unmount');
    };
  }, []);

  const handleClick = async () => {
    point('dashboard_button_click');
    const data = await fetchData(userId);
    point('dashboard_data_loaded');
    setState(data);
  };

  return <div onClick={handleClick}>...</div>;
}
```

### Data Fetching with React Query

```tsx
function useUserData(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      point('user_query_start');
      const res = await fetch(`/api/users/${userId}`);
      point('user_query_response');
      if (!res.ok) {
        point('user_query_error');
        throw new Error('Failed to fetch');
      }
      const data = await res.json();
      point('user_query_success');
      return data;
    },
  });
}
```

### State Management (Zustand/Redux)

```tsx
// In a Zustand store
const useStore = create((set, get) => ({
  user: null,
  login: async (credentials) => {
    point('store_login_start');
    const user = await api.login(credentials);
    point('store_login_success');
    set({ user });
  },
  updateProfile: async (data) => {
    point('store_update_profile_start');
    await api.updateProfile(data);
    point('store_update_profile_done');
    set((state) => ({ user: { ...state.user, ...data } }));
  },
}));
```

## Vue Patterns

### Composition API

```typescript
import { point } from '@/lib/codepoint';

export function useOrderWorkflow() {
  const submitOrder = async (order: Order) => {
    point('order_submit_entry');

    const validated = validateOrder(order);
    point('order_after_validate');

    const priced = await calculatePrice(validated);
    point('order_after_price');

    const result = await api.createOrder(priced);
    point('order_after_create');

    return result;
  };

  return { submitOrder };
}
```

### Vue Component

```vue
<script setup lang="ts">
import { point } from '@/lib/codepoint';
import { onMounted, onUnmounted } from 'vue';

onMounted(() => {
  point('component_mounted');
});

const handleSubmit = async () => {
  point('form_submit_start');
  try {
    await submitForm(formData);
    point('form_submit_success');
  } catch (e) {
    point('form_submit_error');
  }
};
</script>
```

## Node.js Backend Patterns

### Express Middleware Chain

```typescript
import { point } from './lib/codepoint';

// Request tracing middleware
app.use((req, res, next) => {
  point(`express_request_entry ${req.method} ${req.path}`);
  res.on('finish', () => {
    point(`express_request_done ${req.method} ${req.path} ${res.statusCode}`);
  });
  next();
});

// Route handlers
app.post('/api/orders', async (req, res) => {
  point('route_orders_create_entry');

  const order = await orderService.create(req.body);
  point('route_orders_create_done');

  res.json(order);
});
```

### Service Layer

```typescript
class PaymentService {
  async processPayment(orderId: string, amount: number): Promise<Payment> {
    point('payment_process_entry');

    const validated = await this.validate(orderId, amount);
    point('payment_after_validate');

    const charge = await this.gateway.charge(validated);
    point('payment_after_charge');

    const record = await this.repo.save(charge);
    point('payment_after_save');

    return record;
  }
}
```

### Event-Driven Architecture

```typescript
class EventBus {
  emit(event: string, payload: unknown): void {
    pointWithMeta('eventbus_emit', { event });
    for (const handler of this.handlers[event] ?? []) {
      handler(payload);
      pointWithMeta('eventbus_handler_done', { event, handler: handler.name });
    }
  }
}
```

## Async/Promise Chain Patterns

### Detecting Promise Chain Issues

```typescript
async function fetchUserData(id: string): Promise<User> {
  point('fetch_user_start');

  try {
    const [profile, settings, activity] = await Promise.all([
      fetchProfile(id).then(d => { point('fetch_user_profile_done'); return d; }),
      fetchSettings(id).then(d => { point('fetch_user_settings_done'); return d; }),
      fetchActivity(id).then(d => { point('fetch_user_activity_done'); return d; }),
    ]);

    point('fetch_user_all_parallel_done');
    return mergeUserData(profile, settings, activity);
  } catch (e) {
    point('fetch_user_error');
    throw e;
  }
}
```

### Tracking WebSocket Message Flow

```typescript
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  pointWithMeta('ws_message_received', { type: msg.type });

  switch (msg.type) {
    case 'order_update':
      point('ws_order_update_start');
      handleOrderUpdate(msg.payload);
      point('ws_order_update_done');
      break;
    case 'payment_result':
      point('ws_payment_result_start');
      handlePaymentResult(msg.payload);
      point('ws_payment_result_done');
      break;
  }
};
```

## Density Validation

```typescript
// codepoint-density.test.ts
import { collectStack, analyzeOverlap, isEnabled, getOutputPath } from './codepoint';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

describe('Code Point Density', () => {
  beforeAll(() => {
    // Force-enable for testing: create toggle file
    const toggleDir = path.join(os.homedir(), '.codepoint');
    fs.mkdirSync(toggleDir, { recursive: true });
    fs.writeFileSync(path.join(toggleDir, '.codepoint-ts'), '');
  });

  afterAll(() => {
    // Cleanup toggle file
    const togglePath = path.join(os.homedir(), '.codepoint', '.codepoint-ts');
    if (fs.existsSync(togglePath)) fs.unlinkSync(togglePath);
  });

  it('should have appropriate density between adjacent points', () => {
    const s1 = collectStack('point_a');
    const s2 = collectStack('point_b');

    const overlap = analyzeOverlap(s1, s2);

    if (overlap > 0.8) console.warn('Too dense, overlap:', overlap);
    if (overlap === 0) console.warn('Too sparse, no overlap');
    expect(overlap).toBeGreaterThanOrEqual(0.2);
    expect(overlap).toBeLessThanOrEqual(0.6);

    console.log('Output at:', getOutputPath());
  });
});
```

## AI Integration

### Enable / Disable

```bash
# Enable TypeScript/JavaScript code points
mkdir -p ~/.codepoint && touch ~/.codepoint/.codepoint-ts

# Disable
rm ~/.codepoint/.codepoint-ts

# Browser standalone (no backend collector):
VITE_CODEPOINT_ENABLED=true npm run dev
```

### Capture & Analyze (Node.js / Full-Stack)

```bash
# 1. Enable (one-time setup)
touch ~/.codepoint/.codepoint-ts

# 2. Run your app — output goes to ~/.codepoint/<project>/cp-ts-*.log automatically
#    Full-stack (Go + embedded frontend):
#      - Go backend checks toggle, opens /__codepoint__ collector endpoint
#      - Browser point() POSTs to /__codepoint__
#      - All output in one place
#    Node.js only:
npm run dev
# or
node --async-stack-traces dist/index.js

# 3. Trigger the scenario (browser / curl)
curl http://localhost:3000/api/orders

# 4. Check output location
ls ~/.codepoint/<project-name>/

# 5. In Claude Code session:
#   "Read ~/.codepoint/my-dashboard/cp-ts-2026-04-17_15-31-00_045.log and trace the execution flow"
```

### Browser Standalone (no backend)

For projects without a backend collector:
1. Set `VITE_CODEPOINT_ENABLED=true` and restart dev server
2. Code points appear in browser console as `console.error` output
3. Filter by `[CODEPOINT]` in DevTools console
4. Copy the output and paste into the AI session

### Output File Location

```
~/.codepoint/
├── .codepoint-ts                                # toggle file (exists = enabled)
├── my-dashboard/                                # Frontend project
│   ├── cp-ts-2026-04-17_15-31-00_045.log
│   └── cp-ts-2026-04-17_16-10-22_789.log
└── my-api/                                      # Node.js backend (same toggle file!)
    └── cp-ts-2026-04-17_15-32-15_123.log
```

### Full-Stack Output (Go + Embedded Frontend)

When using the Go backend collector, both Go and frontend code points land in the same project directory:

```
~/.codepoint/
├── .codepoint-go                                # Go toggle
├── .codepoint-ts                                # Frontend toggle
└── my-project/                                  # Same project
    ├── cp-go-2026-04-17_15-30-45_123.log        # Go code points
    └── cp-ts-2026-04-17_15-30-45_456.log        # Frontend code points (via collector)
```

### Enabling Async Stack Traces (Node.js)

```bash
# For better async stack traces in Node.js:
node --async-stack-traces dist/index.js
```

This makes `new Error().stack` inside async functions show the async call chain, which is critical for debugging promise-based flows.

---

## V2 Probe Templates (with point_id and flow_id)

### Updated pointWithMeta Pattern

```typescript
import { pointWithMeta } from '@/lib/codepoint';

// V2 probe: includes point_id and flow_id
pointWithMeta('cp-auth-check', {
  point_id: 'cp-auth-check',
  flow_id: 'flow-user-login',
});

// V2 probe with additional context
pointWithMeta('cp-order-validate-after', {
  point_id: 'cp-order-validate-after',
  flow_id: 'flow-order-create',
  order_id: order.id,
  status: 'validated',
});
```

### Full Flow Example (V2)

```typescript
class OrderService {
  async create(data: OrderCreate): Promise<Order> {
    pointWithMeta('cp-order-create-entry', {
      point_id: 'cp-order-create-entry',
      flow_id: 'flow-order-create',
    });

    const validated = this.validate(data);
    pointWithMeta('cp-order-after-validate', {
      point_id: 'cp-order-after-validate',
      flow_id: 'flow-order-create',
    });

    const priced = await this.pricing.calculate(validated);
    pointWithMeta('cp-order-after-price', {
      point_id: 'cp-order-after-price',
      flow_id: 'flow-order-create',
    });

    const saved = await this.repo.save(priced);
    pointWithMeta('cp-order-after-save', {
      point_id: 'cp-order-after-save',
      flow_id: 'flow-order-create',
      order_id: saved.id,
    });

    return saved;
  }
}
```
