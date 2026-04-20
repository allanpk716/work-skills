# Test Probe Snippets (D-01 through D-10)

Ready-to-use probe code snippets for frontend test flow planning. Each snippet demonstrates
how to verify a specific interaction pattern using codepoint probes.

All snippets use `pointWithMeta()` from the codepoint base library with `point_id` and `flow_id`
following the V2 data model convention.

## Quick Reference

| Snippet | Pattern | Primary Use |
|---------|---------|-------------|
| D-01 | Button Click | Verify click handler execution and probe capture |
| D-02 | Form Submit | Verify form data flows through probes correctly |
| D-03 | API Call (success) | Verify request/response probe sequence on 2xx |
| D-04 | API Call (error) | Verify error path probes fire with error context |
| D-05 | Navigation / Route Change | Verify route change triggers entry probes |
| D-06 | State Change | Verify before/after state captured by probes |
| D-07 | Error Handling | Verify error boundary probes fire with error info |
| D-08 | Async Operation | Verify probe sequence across async boundaries |
| D-09 | WebSocket Message | Verify message flow through probe chain |
| D-10 | Data Loading | Verify loading state probes fire in order |

---

## D-01: Button Click

Verifies that a button click triggers the expected handler and the probe captures the event.

### Probe Code

```typescript
import { pointWithMeta } from '@/lib/codepoint';

function handleClick(): void {
  pointWithMeta('cp-btn-click', {
    point_id: 'cp-btn-click',
    flow_id: 'flow-user-action',
    element: 'submit-button',
    timestamp: Date.now(),
  });

  // ... handler logic
}
```

### Test Case Template

```markdown
## Test Case: TC-01 — Button Click

> Probe Snippet: D-01

### Action
Click the submit button on the form.

### Expected Response
Button click handler executes. Form submission begins.

### Verify
#### Probe Verification
| Code Point | Must Fire | Expected in Stack |
|-----------|-----------|-------------------|
| cp-btn-click | yes | handleClick |

#### UI Verification
- [ ] Button shows loading state
- [ ] Form fields are still visible
```

---

## D-02: Form Submit

Verifies that form submission flows through validation, API call, and result probes in order.

### Probe Code

```typescript
import { pointWithMeta } from '@/lib/codepoint';

async function handleSubmit(formData: FormData): Promise<void> {
  // Entry probe
  pointWithMeta('cp-form-submit-entry', {
    point_id: 'cp-form-submit-entry',
    flow_id: 'flow-form-submit',
    fields: Object.keys(formData),
  });

  // After validation
  const validated = validateForm(formData);
  pointWithMeta('cp-form-after-validate', {
    point_id: 'cp-form-after-validate',
    flow_id: 'flow-form-submit',
    valid: validated.isValid,
    errors: validated.errors,
  });

  if (!validated.isValid) return;

  // After API call
  const result = await api.submit(validated.data);
  pointWithMeta('cp-form-after-submit', {
    point_id: 'cp-form-after-submit',
    flow_id: 'flow-form-submit',
    status: result.status,
    data_id: result.id,
  });
}
```

### Test Case Template

```markdown
## Test Case: TC-02 — Form Submit (Valid Data)

> Probe Snippet: D-02

### Action
Fill in all required form fields with valid data and submit.

### Expected Response
Form validates successfully. API call returns 200. Success message displayed.

### Verify
#### Probe Verification
| Code Point | Must Fire | Expected in Stack |
|-----------|-----------|-------------------|
| cp-form-submit-entry | yes | handleSubmit |
| cp-form-after-validate | yes | handleSubmit → validateForm |
| cp-form-after-submit | yes | handleSubmit → api.submit |

#### UI Verification
- [ ] Success notification appears
- [ ] Form resets to empty state
- [ ] New data appears in the list

## Test Case: TC-02b — Form Submit (Invalid Data)

> Probe Snippet: D-02

### Action
Submit the form with required fields left empty.

### Expected Response
Validation fails. Error messages displayed next to fields.

### Verify
#### Probe Verification
| Code Point | Must Fire | Expected in Stack |
|-----------|-----------|-------------------|
| cp-form-submit-entry | yes | handleSubmit |
| cp-form-after-validate | yes | handleSubmit → validateForm |
| cp-form-after-submit | no | — |

#### UI Verification
- [ ] Validation error messages appear
- [ ] Form data is preserved (not cleared)
```

---

## D-03: API Call (Success)

Verifies the probe sequence for a successful API request.

### Probe Code

```typescript
import { pointWithMeta } from '@/lib/codepoint';

async function fetchData(params: QueryParams): Promise<Data> {
  pointWithMeta('cp-api-request-start', {
    point_id: 'cp-api-request-start',
    flow_id: 'flow-data-fetch',
    method: 'GET',
    endpoint: '/api/data',
    params,
  });

  const response = await fetch(`/api/data?${new URLSearchParams(params)}`);

  pointWithMeta('cp-api-response-received', {
    point_id: 'cp-api-response-received',
    flow_id: 'flow-data-fetch',
    status: response.status,
    ok: response.ok,
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const data = await response.json();

  pointWithMeta('cp-api-data-parsed', {
    point_id: 'cp-api-data-parsed',
    flow_id: 'flow-data-fetch',
    record_count: data.length,
  });

  return data;
}
```

### Test Case Template

```markdown
## Test Case: TC-03 — API Call Success (200)

> Probe Snippet: D-03

### Action
Trigger a data fetch with valid parameters.

### Expected Response
API returns 200 with expected data shape. Data renders in UI.

### Verify
#### Probe Verification
| Code Point | Must Fire | Expected in Stack |
|-----------|-----------|-------------------|
| cp-api-request-start | yes | fetchData |
| cp-api-response-received | yes | fetchData → fetch |
| cp-api-data-parsed | yes | fetchData → response.json |

#### API Verification
- [ ] Response status: 200
- [ ] Response body contains: data array
- [ ] Content-Type: application/json
```

---

## D-04: API Call (Error)

Verifies that error path probes fire when an API call fails.

### Probe Code

```typescript
import { pointWithMeta } from '@/lib/codepoint';

async function fetchWithErrorHandling(params: QueryParams): Promise<Data> {
  pointWithMeta('cp-api-request-start', {
    point_id: 'cp-api-request-start',
    flow_id: 'flow-data-fetch',
    method: 'GET',
    endpoint: '/api/data',
  });

  try {
    const response = await fetch(`/api/data?${new URLSearchParams(params)}`);

    pointWithMeta('cp-api-response-received', {
      point_id: 'cp-api-response-received',
      flow_id: 'flow-data-fetch',
      status: response.status,
      ok: response.ok,
    });

    if (!response.ok) {
      pointWithMeta('cp-api-error-status', {
        point_id: 'cp-api-error-status',
        flow_id: 'flow-data-fetch',
        status: response.status,
        statusText: response.statusText,
      });
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    pointWithMeta('cp-api-error-caught', {
      point_id: 'cp-api-error-caught',
      flow_id: 'flow-data-fetch',
      error_type: error instanceof Error ? error.constructor.name : 'Unknown',
      error_message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
```

### Test Case Template

```markdown
## Test Case: TC-04 — API Call Error (500)

> Probe Snippet: D-04

### Action
Trigger a data fetch when the server returns 500.

### Expected Response
Error is caught and displayed. Retry option shown.

### Verify
#### Probe Verification
| Code Point | Must Fire | Expected in Stack |
|-----------|-----------|-------------------|
| cp-api-request-start | yes | fetchWithErrorHandling |
| cp-api-response-received | yes | fetchWithErrorHandling → fetch |
| cp-api-error-status | yes | fetchWithErrorHandling |
| cp-api-error-caught | yes | fetchWithErrorHandling → catch |

#### UI Verification
- [ ] Error message is displayed to the user
- [ ] Retry button is visible and enabled
- [ ] Loading spinner is hidden

#### API Verification
- [ ] Response status: 500
- [ ] Error contains: message field
```

---

## D-05: Navigation / Route Change

Verifies that route changes trigger the expected entry probes on the target page.

### Probe Code

```typescript
import { pointWithMeta } from '@/lib/codepoint';

// In route guard or page component
function onPageEnter(route: Route): void {
  pointWithMeta('cp-route-enter', {
    point_id: 'cp-route-enter',
    flow_id: 'flow-page-navigation',
    path: route.path,
    params: route.params,
    from: route.referrer,
  });
}

// In link click handler
function handleNavigation(to: string): void {
  pointWithMeta('cp-nav-click', {
    point_id: 'cp-nav-click',
    flow_id: 'flow-page-navigation',
    target: to,
    timestamp: Date.now(),
  });

  router.push(to);
}
```

### Test Case Template

```markdown
## Test Case: TC-05 — Navigation to Target Page

> Probe Snippet: D-05

### Action
Click the navigation link to the target page.

### Expected Response
Route changes to the target page. Target page component mounts.

### Verify
#### Probe Verification
| Code Point | Must Fire | Expected in Stack |
|-----------|-----------|-------------------|
| cp-nav-click | yes | handleNavigation |
| cp-route-enter | yes | onPageEnter |

#### UI Verification
- [ ] URL changes to the target path
- [ ] Target page content is visible
- [ ] Navigation highlight updates to current page
```

---

## D-06: State Change

Verifies that state mutations are captured with before/after values.

### Probe Code

```typescript
import { pointWithMeta } from '@/lib/codepoint';

function useOrderStore() {
  const updateOrderStatus = (orderId: string, newStatus: string): void => {
    const current = getOrder(orderId);

    // Before state change
    pointWithMeta('cp-state-change-before', {
      point_id: 'cp-state-change-before',
      flow_id: 'flow-order-status-update',
      order_id: orderId,
      current_status: current.status,
      target_status: newStatus,
    });

    // Perform the mutation
    setOrderStatus(orderId, newStatus);

    // After state change
    pointWithMeta('cp-state-change-after', {
      point_id: 'cp-state-change-after',
      flow_id: 'flow-order-status-update',
      order_id: orderId,
      previous_status: current.status,
      new_status: newStatus,
    });
  };

  return { updateOrderStatus };
}
```

### Test Case Template

```markdown
## Test Case: TC-06 — State Change

> Probe Snippet: D-06

### Action
Update the order status from "pending" to "confirmed".

### Expected Response
Order status changes in the store. UI reflects the new status.

### Verify
#### Probe Verification
| Code Point | Must Fire | Expected in Stack |
|-----------|-----------|-------------------|
| cp-state-change-before | yes | updateOrderStatus |
| cp-state-change-after | yes | updateOrderStatus → setOrderStatus |

#### Probe Metadata Check
- [ ] `cp-state-change-before`: current_status = "pending", target_status = "confirmed"
- [ ] `cp-state-change-after`: previous_status = "pending", new_status = "confirmed"

#### UI Verification
- [ ] Order status badge changes from "Pending" to "Confirmed"
- [ ] Action buttons update to reflect the new status
```

---

## D-07: Error Handling

Verifies that error boundary or try/catch probes capture error details.

### Probe Code

```typescript
import { pointWithMeta } from '@/lib/codepoint';

class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    pointWithMeta('cp-error-boundary', {
      point_id: 'cp-error-boundary',
      flow_id: 'flow-error-handling',
      error_type: error.constructor.name,
      error_message: error.message,
      component_stack: info.componentStack,
    });
  }
}

// Or in a try/catch
async function safeExecute<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    pointWithMeta('cp-error-caught', {
      point_id: 'cp-error-caught',
      flow_id: 'flow-error-handling',
      error_type: error instanceof Error ? error.constructor.name : 'Unknown',
      error_message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
```

### Test Case Template

```markdown
## Test Case: TC-07 — Error Boundary Triggered

> Probe Snippet: D-07

### Action
Render a component that throws during render.

### Expected Response
Error boundary catches the error. Fallback UI displayed.

### Verify
#### Probe Verification
| Code Point | Must Fire | Expected in Stack |
|-----------|-----------|-------------------|
| cp-error-boundary | yes | ErrorBoundary.componentDidCatch |

#### Probe Metadata Check
- [ ] `cp-error-boundary`: error_type = "Error"
- [ ] `cp-error-boundary`: error_message contains the thrown message
- [ ] `cp-error-boundary`: component_stack is non-empty

#### UI Verification
- [ ] Error fallback component is displayed
- [ ] "Try again" button is visible
- [ ] Original broken component is NOT visible
```

---

## D-08: Async Operation

Verifies probe sequence across async boundaries (Promises, async/await).

### Probe Code

```typescript
import { pointWithMeta } from '@/lib/codepoint';

async function processOrder(orderId: string): Promise<OrderResult> {
  pointWithMeta('cp-async-start', {
    point_id: 'cp-async-start',
    flow_id: 'flow-order-process',
    order_id: orderId,
  });

  // Step 1: Validate
  const validated = await validateOrder(orderId);
  pointWithMeta('cp-async-validate-done', {
    point_id: 'cp-async-validate-done',
    flow_id: 'flow-order-process',
    order_id: orderId,
    valid: true,
  });

  // Step 2: Process payment
  const payment = await processPayment(orderId);
  pointWithMeta('cp-async-payment-done', {
    point_id: 'cp-async-payment-done',
    flow_id: 'flow-order-process',
    order_id: orderId,
    payment_id: payment.id,
    amount: payment.amount,
  });

  // Step 3: Confirm
  const result = await confirmOrder(orderId, payment.id);
  pointWithMeta('cp-async-complete', {
    point_id: 'cp-async-complete',
    flow_id: 'flow-order-process',
    order_id: orderId,
    result_status: result.status,
  });

  return result;
}
```

### Test Case Template

```markdown
## Test Case: TC-08 — Async Operation (Full Sequence)

> Probe Snippet: D-08

### Action
Submit an order for processing.

### Expected Response
Order goes through validation, payment, and confirmation in sequence.

### Verify
#### Probe Verification
| Code Point | Must Fire | Expected in Stack |
|-----------|-----------|-------------------|
| cp-async-start | yes | processOrder |
| cp-async-validate-done | yes | processOrder → validateOrder |
| cp-async-payment-done | yes | processOrder → processPayment |
| cp-async-complete | yes | processOrder → confirmOrder |

#### Probe Sequence Check
- [ ] Probes fire in order: start → validate → payment → complete
- [ ] No probe fires before its dependency probe
- [ ] All probes include the same order_id
```

---

## D-09: WebSocket Message

Verifies that WebSocket message flow is captured through the probe chain.

### Probe Code

```typescript
import { pointWithMeta } from '@/lib/codepoint';

function setupWebSocket(url: string): WebSocket {
  const ws = new WebSocket(url);

  ws.onopen = () => {
    pointWithMeta('cp-ws-connected', {
      point_id: 'cp-ws-connected',
      flow_id: 'flow-ws-messaging',
      url,
    });
  };

  ws.onmessage = (event: MessageEvent) => {
    const message = JSON.parse(event.data);

    pointWithMeta('cp-ws-message-received', {
      point_id: 'cp-ws-message-received',
      flow_id: 'flow-ws-messaging',
      message_type: message.type,
      message_id: message.id,
    });

    // Dispatch to handler
    handleMessage(message);

    pointWithMeta('cp-ws-message-handled', {
      point_id: 'cp-ws-message-handled',
      flow_id: 'flow-ws-messaging',
      message_type: message.type,
      message_id: message.id,
    });
  };

  ws.onerror = (event) => {
    pointWithMeta('cp-ws-error', {
      point_id: 'cp-ws-error',
      flow_id: 'flow-ws-messaging',
      error_type: 'WebSocketError',
      url,
    });
  };

  return ws;
}
```

### Test Case Template

```markdown
## Test Case: TC-09 — WebSocket Message Flow

> Probe Snippet: D-09

### Action
Connect to WebSocket and receive a message of type "order_update".

### Expected Response
Connection established. Message received and dispatched to handler.

### Verify
#### Probe Verification
| Code Point | Must Fire | Expected in Stack |
|-----------|-----------|-------------------|
| cp-ws-connected | yes | ws.onopen |
| cp-ws-message-received | yes | ws.onmessage |
| cp-ws-message-handled | yes | ws.onmessage → handleMessage |

#### Probe Metadata Check
- [ ] `cp-ws-message-received`: message_type = "order_update"
- [ ] `cp-ws-message-handled`: message_type = "order_update"

#### UI Verification
- [ ] Order list updates with the new data from the message
```

---

## D-10: Data Loading

Verifies that loading state probes fire in the correct order during data fetching.

### Probe Code

```typescript
import { pointWithMeta } from '@/lib/codepoint';

function useDataLoader<T>(
  key: string,
  fetcher: () => Promise<T>,
): { data: T | null; loading: boolean; error: Error | null } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    pointWithMeta('cp-load-start', {
      point_id: 'cp-load-start',
      flow_id: 'flow-data-loading',
      data_key: key,
    });

    setLoading(true);
    setError(null);

    try {
      const result = await fetcher();

      pointWithMeta('cp-load-success', {
        point_id: 'cp-load-success',
        flow_id: 'flow-data-loading',
        data_key: key,
        has_data: result !== null && result !== undefined,
      });

      setData(result);
    } catch (err) {
      pointWithMeta('cp-load-error', {
        point_id: 'cp-load-error',
        flow_id: 'flow-data-loading',
        data_key: key,
        error_message: err instanceof Error ? err.message : String(err),
      });

      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);

      pointWithMeta('cp-load-complete', {
        point_id: 'cp-load-complete',
        flow_id: 'flow-data-loading',
        data_key: key,
        success: error === null,
      });
    }
  }, [key, fetcher]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error };
}
```

### Test Case Template

```markdown
## Test Case: TC-10 — Data Loading (Success)

> Probe Snippet: D-10

### Action
Mount a component that triggers data loading.

### Expected Response
Loading indicator shown, then data displayed.

### Verify
#### Probe Verification
| Code Point | Must Fire | Expected in Stack |
|-----------|-----------|-------------------|
| cp-load-start | yes | load |
| cp-load-success | yes | load → fetcher |
| cp-load-complete | yes | load → finally |

#### UI Verification
- [ ] Loading spinner appears during fetch
- [ ] Data renders after loading completes
- [ ] No error message shown

## Test Case: TC-10b — Data Loading (Error)

> Probe Snippet: D-10

### Action
Mount a component that triggers data loading when the API returns an error.

### Expected Response
Loading indicator shown, then error message displayed.

### Verify
#### Probe Verification
| Code Point | Must Fire | Expected in Stack |
|-----------|-----------|-------------------|
| cp-load-start | yes | load |
| cp-load-error | yes | load → catch |
| cp-load-complete | yes | load → finally |

#### UI Verification
- [ ] Loading spinner appears during fetch
- [ ] Error message is displayed after loading fails
- [ ] Retry button is visible

#### Probe Metadata Check
- [ ] `cp-load-complete`: success = false
```
