/**
 * CodePoint - WebSocket Instrumentation
 *
 * Instruments WebSocket connections to trace message flows,
 * connection lifecycle, and the bridge between real-time data and Zustand stores.
 */

import { codepoint, getCodePointManager } from './codepoint-core';
import type { CodePointEvent } from './codepoint-core';

// ============================================================================
// Types
// ============================================================================

export interface WebSocketCodePointConfig {
  /** Identifier for this WebSocket connection (e.g., 'notifications', 'market-data') */
  connectionName: string;
  /** Message topics/channels to track */
  topics?: string[];
  /** Whether to capture full message payloads (default: true, use false for sensitive data) */
  capturePayloads?: boolean;
  /** Maximum payload size to capture in bytes (default: 10KB) */
  maxPayloadSize?: number;
  /** Custom transform for outgoing messages before capture */
  transformOutgoing?: (msg: unknown) => unknown;
  /** Custom transform for incoming messages before capture */
  transformIncoming?: (msg: unknown) => unknown;
}

export interface WSMessageTrace {
  connectionName: string;
  direction: 'in' | 'out';
  timestamp: number;
  topic?: string;
  type?: string;
  payload?: unknown;
  correlationId?: string;
}

export interface WSLifecycleEvent {
  connectionName: string;
  event: 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error' | 'closed';
  timestamp: number;
  details?: unknown;
}

// ============================================================================
// WebSocket Wrapper
// ============================================================================

/**
 * Wrap a WebSocket instance with code point instrumentation.
 *
 * Usage:
 *   const ws = new WebSocket('wss://api.example.com/stream');
 *   const instrumented = instrumentWebSocket(ws, {
 *     connectionName: 'order-updates',
 *     topics: ['order.created', 'order.updated'],
 *   });
 */
export function instrumentWebSocket(
  ws: WebSocket,
  config: WebSocketCodePointConfig
): WebSocket {
  const {
    connectionName,
    topics = [],
    capturePayloads = true,
    maxPayloadSize = 10240,
    transformIncoming,
    transformOutgoing,
  } = config;

  // ---- Connection Lifecycle ----

  codepoint(
    'ws-connection',
    connectionName,
    `WebSocket connecting to ${ws.url}`,
    { url: ws.url, connectionName },
    { level: 'info', tags: ['websocket', 'lifecycle', connectionName] }
  );

  const originalOnOpen = ws.onopen;
  ws.onopen = (event) => {
    codepoint(
      'ws-connection',
      connectionName,
      `WebSocket connected`,
      {
        connectionName,
        url: ws.url,
        protocol: ws.protocol,
        readyState: ws.readyState,
      },
      { level: 'info', tags: ['websocket', 'lifecycle', connectionName] }
    );

    if (originalOnOpen) {
      (originalOnOpen as Function).call(ws, event);
    }
  };

  const originalOnClose = ws.onclose;
  ws.onclose = (event) => {
    codepoint(
      'ws-connection',
      connectionName,
      `WebSocket closed`,
      {
        connectionName,
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
      },
      { level: 'info', tags: ['websocket', 'lifecycle', connectionName] }
    );

    if (originalOnClose) {
      (originalOnClose as Function).call(ws, event);
    }
  };

  const originalOnError = ws.onerror;
  ws.onerror = (event) => {
    codepoint(
      'ws-connection',
      connectionName,
      `WebSocket error`,
      {
        connectionName,
        error: event instanceof ErrorEvent ? event.message : 'Unknown error',
      },
      { level: 'error', tags: ['websocket', 'lifecycle', 'error', connectionName] }
    );

    if (originalOnError) {
      (originalOnError as Function).call(ws, event);
    }
  };

  // ---- Message Interception ----

  const originalAddEventListener = ws.addEventListener.bind(ws);
  ws.addEventListener = (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => {
    if (type === 'message') {
      const wrappedListener: EventListener = (event) => {
        const messageEvent = event as MessageEvent;
        let parsedData: unknown;

        try {
          parsedData = JSON.parse(messageEvent.data);
        } catch {
          parsedData = messageEvent.data;
        }

        const transformedData = transformIncoming ? transformIncoming(parsedData) : parsedData;
        const payload = capturePayloads
          ? truncatePayload(transformedData, maxPayloadSize)
          : '[payload omitted]';

        // Extract topic and type from structured messages
        const topic = extractTopic(parsedData, topics);
        const msgType = extractType(parsedData);

        const spanId = getCodePointManager().startSpan(
          'ws-message-in',
          connectionName,
          `Incoming WS message: ${msgType ?? 'unknown'}`
        );

        codepoint(
          'ws-message-in',
          connectionName,
          `Received message [${msgType ?? 'unknown'}]${topic ? ` topic=${topic}` : ''}`,
          {
            connectionName,
            topic,
            type: msgType,
            payload,
            size: typeof messageEvent.data === 'string' ? messageEvent.data.length : messageEvent.data.size,
          },
          { level: 'debug', tags: ['websocket', 'message', 'inbound', connectionName, ...(topic ? [topic] : [])] }
        );

        // Call original listener
        (listener as EventListener)(event);

        getCodePointManager().endSpan(spanId, connectionName, `Incoming message processed`, {
          topic,
          type: msgType,
        });
      };

      return originalAddEventListener(type, wrappedListener, options);
    }

    return originalAddEventListener(type, listener, options);
  };

  // ---- Send Interception ----

  const originalSend = ws.send.bind(ws);
  (ws as any).send = (data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
    let parsedData: unknown;
    try {
      parsedData = JSON.parse(data as string);
    } catch {
      parsedData = data;
    }

    const transformedData = transformOutgoing ? transformOutgoing(parsedData) : parsedData;
    const payload = capturePayloads
      ? truncatePayload(transformedData, maxPayloadSize)
      : '[payload omitted]';

    const topic = extractTopic(parsedData, topics);
    const msgType = extractType(parsedData);

    codepoint(
      'ws-message-out',
      connectionName,
      `Sending message [${msgType ?? 'unknown'}]${topic ? ` topic=${topic}` : ''}`,
      {
        connectionName,
        topic,
        type: msgType,
        payload,
      },
      { level: 'debug', tags: ['websocket', 'message', 'outbound', connectionName] }
    );

    return originalSend(data);
  };

  return ws;
}

// ============================================================================
// Reconnection Tracker
// ============================================================================

/**
 * Track WebSocket reconnection attempts and backoff behavior.
 *
 * Usage:
 *   const reconnectTracker = createReconnectTracker('order-updates');
 *
 *   // On disconnect:
 *   reconnectTracker.onDisconnect();
 *
 *   // On reconnect attempt:
 *   reconnectTracker.onReconnectAttempt(1);
 *
 *   // On successful reconnect:
 *   reconnectTracker.onReconnected();
 */
export function createReconnectTracker(connectionName: string) {
  let attemptCount = 0;
  let disconnectTime = 0;

  return {
    onDisconnect(details?: unknown) {
      disconnectTime = Date.now();
      attemptCount = 0;

      codepoint(
        'ws-reconnect',
        connectionName,
        `Connection lost, preparing for reconnection`,
        { connectionName, details },
        { level: 'warn', tags: ['websocket', 'reconnect', connectionName] }
      );
    },

    onReconnectAttempt(attempt: number, backoffMs?: number) {
      attemptCount = attempt;

      codepoint(
        'ws-reconnect',
        connectionName,
        `Reconnection attempt #${attempt}${backoffMs ? ` (backoff: ${backoffMs}ms)` : ''}`,
        {
          connectionName,
          attempt,
          backoffMs,
          timeSinceDisconnect: Date.now() - disconnectTime,
        },
        { level: 'warn', tags: ['websocket', 'reconnect', connectionName] }
      );
    },

    onReconnected() {
      const totalDowntime = Date.now() - disconnectTime;

      codepoint(
        'ws-reconnect',
        connectionName,
        `Reconnected after ${attemptCount} attempts (${totalDowntime}ms downtime)`,
        {
          connectionName,
          attempts: attemptCount,
          totalDowntime,
        },
        { level: 'info', tags: ['websocket', 'reconnect', connectionName] }
      );
    },

    onReconnectFailed() {
      codepoint(
        'ws-reconnect',
        connectionName,
        `Reconnection failed after ${attemptCount} attempts`,
        {
          connectionName,
          attempts: attemptCount,
          totalDowntime: Date.now() - disconnectTime,
        },
        { level: 'error', tags: ['websocket', 'reconnect', 'error', connectionName] }
      );
    },
  };
}

// ============================================================================
// WS-to-Store Bridge Tracker
// ============================================================================

/**
 * Track the data flow from WebSocket messages into Zustand store mutations.
 * This is the critical bridge point between real-time data and application state.
 *
 * Usage:
 *   useEffect(() => {
 *     const unsub = ws.addEventListener('message', (event) => {
 *       const data = JSON.parse(event.data);
 *       traceWSStoreBridge('order-updates', 'useOrderStore', data.type, data, (parsed) => {
 *         // Store update logic
 *         useOrderStore.setState({ orders: [...useOrderStore.getState().orders, parsed] });
 *       });
 *     });
 *     return () => unsub();
 *   }, []);
 */
export function traceWSStoreBridge(
  wsConnectionName: string,
  storeName: string,
  messageType: string,
  rawMessage: unknown,
  storeUpdateFn: (parsed: unknown) => void
): void {
  const bridgeSpanId = getCodePointManager().startSpan(
    'data-transform',
    `${wsConnectionName}->${storeName}`,
    `WS-to-Store bridge: ${messageType}`
  );

  // Incoming WS event (already captured by instrumentWebSocket, but link it)
  const wsEventId = codepoint(
    'ws-message-in',
    wsConnectionName,
    `[BRIDGE] Message entering store pipeline: ${messageType}`,
    {
      wsConnectionName,
      storeName,
      messageType,
      rawMessage: truncatePayload(rawMessage, 2048),
    },
    { level: 'debug', tags: ['websocket', 'bridge', 'zustand', wsConnectionName, storeName, messageType] }
  );

  // Data transform event
  codepoint(
    'data-transform',
    `${wsConnectionName}->${storeName}`,
    `Transforming WS message for store: ${messageType}`,
    {
      wsConnectionName,
      storeName,
      messageType,
    },
    { level: 'trace', tags: ['websocket', 'bridge', 'transform', storeName], parent: wsEventId.id }
  );

  try {
    storeUpdateFn(rawMessage);

    codepoint(
      'data-transform',
      `${wsConnectionName}->${storeName}`,
      `Store update completed for: ${messageType}`,
      {
        wsConnectionName,
        storeName,
        messageType,
        success: true,
      },
      { level: 'debug', tags: ['websocket', 'bridge', 'zustand', storeName], parent: wsEventId.id }
    );
  } catch (error) {
    codepoint(
      'data-transform',
      `${wsConnectionName}->${storeName}`,
      `Store update FAILED for: ${messageType}`,
      {
        wsConnectionName,
        storeName,
        messageType,
        error,
      },
      { level: 'error', tags: ['websocket', 'bridge', 'error', storeName], parent: wsEventId.id }
    );
  }

  getCodePointManager().endSpan(bridgeSpanId, `${wsConnectionName}->${storeName}`, `Bridge completed`);
}

// ============================================================================
// Analysis Helpers
// ============================================================================

/**
 * Get message frequency stats for a WebSocket connection.
 */
export function getWSMessageStats(connectionName: string): {
  inboundCount: number;
  outboundCount: number;
  topicsReceived: Record<string, number>;
  typesReceived: Record<string, number>;
  avgPayloadSize: number;
  errorCount: number;
} {
  const manager = getCodePointManager();
  const events = manager.getEvents({
    sources: [connectionName],
    categories: ['ws-message-in', 'ws-message-out', 'ws-connection'],
  });

  const stats = {
    inboundCount: 0,
    outboundCount: 0,
    topicsReceived: {} as Record<string, number>,
    typesReceived: {} as Record<string, number>,
    avgPayloadSize: 0,
    errorCount: 0,
  };

  let totalPayloadSize = 0;

  for (const event of events) {
    if (event.category === 'ws-message-in') {
      stats.inboundCount++;
      const data = event.data as { topic?: string; type?: string; size?: number };
      if (data?.topic) {
        stats.topicsReceived[data.topic] = (stats.topicsReceived[data.topic] || 0) + 1;
      }
      if (data?.type) {
        stats.typesReceived[data.type] = (stats.typesReceived[data.type] || 0) + 1;
      }
      if (data?.size) {
        totalPayloadSize += data.size;
      }
    } else if (event.category === 'ws-message-out') {
      stats.outboundCount++;
    } else if (event.category === 'ws-connection' && event.level === 'error') {
      stats.errorCount++;
    }
  }

  stats.avgPayloadSize = stats.inboundCount > 0 ? Math.round(totalPayloadSize / stats.inboundCount) : 0;

  return stats;
}

/**
 * Get the full message trace chain from WebSocket to store for a specific message type.
 */
export function getWSStoreTrace(
  connectionName: string,
  messageType: string
): CodePointEvent[] {
  const manager = getCodePointManager();
  return manager.getEvents().filter(
    (e) =>
      e.tags?.includes('bridge') &&
      e.tags?.includes(connectionName) &&
      (e.tags?.includes(messageType) ||
        (e.data as { messageType?: string })?.messageType === messageType)
  );
}

// ============================================================================
// Helpers
// ============================================================================

function extractTopic(data: unknown, knownTopics: string[]): string | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const obj = data as Record<string, unknown>;

  // Check common topic field names
  for (const field of ['topic', 'channel', 'event', 'type', 'action', 'msgType']) {
    if (typeof obj[field] === 'string') {
      const val = obj[field] as string;
      if (knownTopics.length === 0 || knownTopics.includes(val)) {
        return val;
      }
    }
  }
  return undefined;
}

function extractType(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const obj = data as Record<string, unknown>;
  return (obj.type ?? obj.action ?? obj.event ?? obj.msgType) as string | undefined;
}

function truncatePayload(data: unknown, maxSizeBytes: number): unknown {
  const json = JSON.stringify(data);
  if (json.length <= maxSizeBytes) return data;
  try {
    return JSON.parse(json.substring(0, maxSizeBytes) + '..."TRUNCATED"');
  } catch {
    return `[TRUNCATED: ${maxSizeBytes} bytes limit]`;
  }
}
