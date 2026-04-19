/**
 * CodePoint - React State Management Data Flow Tracer
 *
 * Instrumentation library for tracing Zustand state mutations,
 * WebSocket message flows, and component data dependencies.
 */

// ============================================================================
// Core Types
// ============================================================================

/** Unique identifier for a code point */
export type CodePointId = string;

/** Severity levels for code points */
export type CodePointLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';

/** Categories of instrumentation points */
export type CodePointCategory =
  | 'store-mutation'       // Zustand store state changes
  | 'store-selector'       // Selector computation
  | 'store-subscription'   // Component subscribing to store
  | 'ws-message-in'        // WebSocket incoming message
  | 'ws-message-out'       // WebSocket outgoing message
  | 'ws-connection'        // WebSocket connection lifecycle
  | 'ws-reconnect'         // WebSocket reconnection
  | 'component-render'     // Component render cycle
  | 'component-mount'      // Component mount
  | 'component-unmount'    // Component unmount
  | 'component-effect'     // useEffect / useLayoutEffect trigger
  | 'data-transform'       // Data transformation / derivation
  | 'data-dependency'      // Explicit data dependency between components
  | 'cross-store-sync'     // Cross-store synchronization
  | 'error-boundary';      // Error boundary trigger

/** A single code point event */
export interface CodePointEvent {
  id: CodePointId;
  timestamp: number;
  category: CodePointCategory;
  level: CodePointLevel;
  source: string;           // file / module path
  label: string;            // human-readable description
  data?: unknown;           // payload (store state diff, WS message, etc.)
  parent?: CodePointId;     // causal parent for tracing chains
  tags?: string[];          // searchable tags
  duration?: number;        // elapsed ms (for spans)
}

/** A span represents a duration between two code points */
export interface CodePointSpan {
  id: CodePointId;
  startEvent: CodePointEvent;
  endEvent?: CodePointEvent;
  category: CodePointCategory;
}

/** Observer callback for code point events */
export type CodePointObserver = (event: CodePointEvent) => void;

/** Filter for code point subscription */
export interface CodePointFilter {
  categories?: CodePointCategory[];
  levels?: CodePointLevel[];
  tags?: string[];
  sources?: string[];
}

// ============================================================================
// CodePoint Manager (Singleton)
// ============================================================================

class CodePointManager {
  private static instance: CodePointManager;
  private observers: Map<Symbol, CodePointObserver> = new Map();
  private events: CodePointEvent[] = [];
  private spans: Map<CodePointId, CodePointSpan> = new Map();
  private enabled: boolean = true;
  private maxBufferSize: number = 10000;
  private activeSpans: Map<CodePointId, { start: number; category: CodePointCategory }> = new Map();

  private constructor() {}

  static getInstance(): CodePointManager {
    if (!CodePointManager.instance) {
      CodePointManager.instance = new CodePointManager();
    }
    return CodePointManager.instance;
  }

  /** Enable or disable all code point collection */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /** Set max buffer size before oldest events are evicted */
  setMaxBufferSize(size: number): void {
    this.maxBufferSize = size;
  }

  /**
   * Record a single code point event.
   */
  emit(event: Omit<CodePointEvent, 'id' | 'timestamp'>): CodePointEvent {
    if (!this.enabled) {
      // Return a no-op event
      return { ...event, id: 'noop', timestamp: Date.now() } as CodePointEvent;
    }

    const fullEvent: CodePointEvent = {
      ...event,
      id: this.generateId(),
      timestamp: Date.now(),
    };

    // Buffer management
    if (this.events.length >= this.maxBufferSize) {
      this.events.shift();
    }
    this.events.push(fullEvent);

    // Notify observers
    for (const observer of this.observers.values()) {
      try {
        observer(fullEvent);
      } catch (err) {
        console.warn('[CodePoint] Observer error:', err);
      }
    }

    return fullEvent;
  }

  /**
   * Start a timed span. Returns the span ID to use with endSpan.
   */
  startSpan(
    category: CodePointCategory,
    source: string,
    label: string,
    tags?: string[]
  ): CodePointId {
    const spanId = this.generateId();
    this.activeSpans.set(spanId, {
      start: Date.now(),
      category,
    });

    // Emit the start event
    this.emit({
      category,
      level: 'trace',
      source,
      label: `[SPAN START] ${label}`,
      tags,
    });

    return spanId;
  }

  /**
   * End a previously started span.
   */
  endSpan(
    spanId: CodePointId,
    source: string,
    label: string,
    data?: unknown
  ): void {
    const active = this.activeSpans.get(spanId);
    if (!active) {
      console.warn(`[CodePoint] No active span found: ${spanId}`);
      return;
    }

    const duration = Date.now() - active.start;
    this.activeSpans.delete(spanId);

    // Store span
    this.spans.set(spanId, {
      id: spanId,
      startEvent: { id: spanId, timestamp: active.start, category: active.category, level: 'trace', source, label },
      endEvent: undefined, // populated below
      category: active.category,
    });

    this.emit({
      category: active.category,
      level: 'trace',
      source,
      label: `[SPAN END] ${label} (${duration}ms)`,
      data,
      duration,
    });
  }

  /**
   * Subscribe to code point events with an optional filter.
   */
  subscribe(observer: CodePointObserver, filter?: CodePointFilter): Symbol {
    const token = Symbol('codepoint-observer');

    const wrappedObserver: CodePointObserver = (event) => {
      if (filter) {
        if (filter.categories && !filter.categories.includes(event.category)) return;
        if (filter.levels && !filter.levels.includes(event.level)) return;
        if (filter.tags && !event.tags?.some((t) => filter.tags!.includes(t))) return;
        if (filter.sources && !filter.sources.includes(event.source)) return;
      }
      observer(event);
    };

    this.observers.set(token, wrappedObserver);
    return token;
  }

  /** Unsubscribe from code point events */
  unsubscribe(token: Symbol): void {
    this.observers.delete(token);
  }

  /** Get all buffered events */
  getEvents(filter?: CodePointFilter): CodePointEvent[] {
    if (!filter) return [...this.events];

    return this.events.filter((e) => {
      if (filter.categories && !filter.categories.includes(e.category)) return false;
      if (filter.levels && !filter.levels.includes(e.level)) return false;
      if (filter.tags && !e.tags?.some((t) => filter.tags!.includes(t))) return false;
      if (filter.sources && !filter.sources.includes(e.source)) return false;
      return true;
    });
  }

  /** Get completed spans */
  getSpans(): CodePointSpan[] {
    return Array.from(this.spans.values());
  }

  /** Get a data flow trace (chain of parent-child events) */
  getTraceChain(rootId: CodePointId): CodePointEvent[] {
    const chain: CodePointEvent[] = [];
    const eventMap = new Map(this.events.map((e) => [e.id, e]));

    let current = eventMap.get(rootId);
    while (current) {
      chain.push(current);
      current = current.parent ? eventMap.get(current.parent) : undefined;
    }

    return chain;
  }

  /** Build a dependency graph between components and stores */
  buildDependencyGraph(): DependencyGraphNode[] {
    const nodes = new Map<string, DependencyGraphNode>();
    const edges = new Map<string, Set<string>>();

    for (const event of this.events) {
      if (event.category === 'store-subscription' || event.category === 'data-dependency') {
        const source = event.source;
        if (!nodes.has(source)) {
          nodes.set(source, { id: source, type: 'component', subscriptions: [], dependencies: [] });
        }
        if (event.data && typeof event.data === 'object' && 'storeName' in event.data) {
          const storeName = (event.data as { storeName: string }).storeName;
          nodes.get(source)!.subscriptions.push(storeName);

          if (!edges.has(source)) edges.set(source, new Set());
          edges.get(source)!.add(storeName);
        }
      }

      if (event.category === 'store-mutation' && event.data && typeof event.data === 'object' && 'storeName' in event.data) {
        const storeName = (event.data as { storeName: string }).storeName;
        if (!nodes.has(storeName)) {
          nodes.set(storeName, { id: storeName, type: 'store', subscriptions: [], dependencies: [] });
        }
      }

      if (event.category === 'ws-message-in' && event.data && typeof event.data === 'object' && 'topic' in event.data) {
        const topic = (event.data as { topic: string }).topic;
        if (!nodes.has(topic)) {
          nodes.set(topic, { id: topic, type: 'ws-topic', subscriptions: [], dependencies: [] });
        }
      }
    }

    // Wire edges into dependency lists
    for (const [source, targets] of edges) {
      const node = nodes.get(source);
      if (node) {
        node.dependencies = Array.from(targets);
      }
    }

    return Array.from(nodes.values());
  }

  /** Clear all buffered events and spans */
  clear(): void {
    this.events = [];
    this.spans.clear();
    this.activeSpans.clear();
  }

  private generateId(): string {
    return `cp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

/** Dependency graph node for component/store analysis */
export interface DependencyGraphNode {
  id: string;
  type: 'component' | 'store' | 'ws-topic';
  subscriptions: string[];
  dependencies: string[];
}

// ============================================================================
// Convenience API
// ============================================================================

/** Get the singleton CodePoint manager */
export function getCodePointManager(): CodePointManager {
  return CodePointManager.getInstance();
}

/** Emit a code point event (shorthand) */
export function codepoint(
  category: CodePointCategory,
  source: string,
  label: string,
  data?: unknown,
  options?: { level?: CodePointLevel; parent?: CodePointId; tags?: string[] }
): CodePointEvent {
  return CodePointManager.getInstance().emit({
    category,
    level: options?.level ?? 'debug',
    source,
    label,
    data,
    parent: options?.parent,
    tags: options?.tags,
  });
}

export default codepoint;
