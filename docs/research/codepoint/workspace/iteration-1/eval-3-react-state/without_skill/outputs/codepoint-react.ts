/**
 * CodePoint - React Component Instrumentation
 *
 * Instruments React component lifecycles, effects, renders,
 * and data dependencies to trace how state flows through the UI layer.
 */

import { useEffect, useRef, useCallback, useMemo } from 'react';
import { codepoint, getCodePointManager } from './codepoint-core';
import type { CodePointCategory, CodePointEvent } from './codepoint-core';

// ============================================================================
// Component Lifecycle Hooks
// ============================================================================

/**
 * Track component mount lifecycle.
 *
 * Usage:
 *   function MyComponent() {
 *     useCodePointMount('MyComponent');
 *     // ...
 *   }
 */
export function useCodePointMount(componentName: string, data?: Record<string, unknown>): void {
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      codepoint(
        'component-mount',
        componentName,
        `${componentName} mounted`,
        { componentName, ...data },
        { level: 'info', tags: ['lifecycle', 'mount', componentName] }
      );
      mounted.current = true;
    }

    return () => {
      codepoint(
        'component-unmount',
        componentName,
        `${componentName} unmounting`,
        { componentName },
        { level: 'info', tags: ['lifecycle', 'unmount', componentName] }
      );
      mounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

// ============================================================================
// Render Tracking Hook
// ============================================================================

/**
 * Track component renders with prop/state change detection.
 *
 * Usage:
 *   function MyComponent({ orderId }: { orderId: string }) {
 *     useCodePointRender('MyComponent', { orderId });
 *     // ...
 *   }
 */
export function useCodePointRender(
  componentName: string,
  trackedValues?: Record<string, unknown>
): void {
  const prevValues = useRef<Record<string, unknown>>({});
  const renderCount = useRef(0);

  // Capture render in ref (runs synchronously during render, not in effect)
  renderCount.current++;

  const currentValues = trackedValues ?? {};
  const changes: Record<string, { from: unknown; to: unknown }> = {};

  for (const [key, value] of Object.entries(currentValues)) {
    if (prevValues.current[key] !== value) {
      changes[key] = { from: prevValues.current[key], to: value };
    }
  }

  // Use effect to emit after render completes
  useEffect(() => {
    const changedKeys = Object.keys(changes);

    if (changedKeys.length > 0 && renderCount.current > 1) {
      codepoint(
        'component-render',
        componentName,
        `${componentName} re-rendered (render #${renderCount.current}) - changed: ${changedKeys.join(', ')}`,
        {
          componentName,
          renderCount: renderCount.current,
          changedProps: changes,
        },
        { level: 'debug', tags: ['render', componentName] }
      );
    } else if (renderCount.current === 1) {
      codepoint(
        'component-render',
        componentName,
        `${componentName} initial render`,
        {
          componentName,
          renderCount: 1,
          props: currentValues,
        },
        { level: 'info', tags: ['render', 'mount', componentName] }
      );
    }

    prevValues.current = { ...currentValues };
  });
}

// ============================================================================
// Effect Tracking Hook
// ============================================================================

/**
 * Track useEffect triggers with dependency tracking.
 *
 * Usage:
 *   function MyComponent({ userId }: { userId: string }) {
 *     useCodePointEffect('MyComponent', 'fetchUserData', [userId], () => {
 *       fetch(`/api/users/${userId}`);
 *     });
 *   }
 */
export function useCodePointEffect(
  componentName: string,
  effectName: string,
  deps: unknown[],
  effectFn: () => void | (() => void)
): void {
  const prevDeps = useRef<unknown[]>(deps);
  const isFirstRun = useRef(true);

  const changedDeps: number[] = [];
  for (let i = 0; i < deps.length; i++) {
    if (!isFirstRun.current && deps[i] !== prevDeps.current[i]) {
      changedDeps.push(i);
    }
  }

  useEffect(() => {
    const spanId = getCodePointManager().startSpan(
      'component-effect',
      componentName,
      `Effect: ${effectName}`
    );

    codepoint(
      'component-effect',
      componentName,
      `Effect "${effectName}" triggered${!isFirstRun.current && changedDeps.length > 0 ? ` by deps: [${changedDeps.map((i) => `dep[${i}]`).join(', ')}]` : ' (initial mount)'}`,
      {
        componentName,
        effectName,
        isFirstRun: isFirstRun.current,
        changedDepIndices: changedDeps,
        deps: deps.map((d) => (typeof d === 'object' ? '[object]' : d)),
      },
      { level: 'debug', tags: ['effect', componentName, effectName] }
    );

    const cleanup = effectFn();

    getCodePointManager().endSpan(spanId, componentName, `Effect: ${effectName}`);

    if (cleanup) {
      return () => {
        codepoint(
          'component-effect',
          componentName,
          `Effect "${effectName}" cleanup`,
          { componentName, effectName },
          { level: 'trace', tags: ['effect', 'cleanup', componentName, effectName] }
        );
        cleanup();
      };
    }

    prevDeps.current = deps;
    isFirstRun.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

// ============================================================================
// Data Dependency Tracking
// ============================================================================

/**
 * Explicitly declare and track data dependencies between components.
 *
 * Usage:
 *   // In ParentComponent:
 *   useCodePointDataDependency('ParentComponent', 'ChildComponent', 'selectedOrderId');
 *
 *   // This tracks that ChildComponent depends on ParentComponent's selectedOrderId
 */
export function useCodePointDataDependency(
  sourceComponent: string,
  targetComponent: string,
  dataKey: string
): void {
  useEffect(() => {
    codepoint(
      'data-dependency',
      sourceComponent,
      `Data dependency: ${sourceComponent}.${dataKey} -> ${targetComponent}`,
      {
        sourceComponent,
        targetComponent,
        dataKey,
      },
      { level: 'debug', tags: ['dependency', sourceComponent, targetComponent, dataKey] }
    );
  }, [sourceComponent, targetComponent, dataKey]);
}

// ============================================================================
// Store Subscription + Render Correlation
// ============================================================================

/**
 * Combined hook that tracks store subscription, render triggers, and data dependency.
 * This is the primary hook for components that consume Zustand stores.
 *
 * Usage:
 *   function OrderList() {
 *     const orders = useOrderStore((s) => s.orders);
 *
 *     useCodePointStoreConsumer('OrderList', 'useOrderStore', ['orders'], {
 *       triggerData: { orderCount: orders.length },
 *     });
 *   }
 */
export function useCodePointStoreConsumer(
  componentName: string,
  storeName: string,
  fields: string[],
  options?: {
    triggerData?: Record<string, unknown>;
    tags?: string[];
  }
): void {
  // Track subscription
  useEffect(() => {
    codepoint(
      'store-subscription',
      componentName,
      `${componentName} consuming ${storeName} [${fields.join(', ')}]`,
      { componentName, storeName, fields },
      { level: 'debug', tags: ['zustand', 'subscription', componentName, ...(options?.tags ?? [])] }
    );

    return () => {
      codepoint(
        'store-subscription',
        componentName,
        `${componentName} unsubscribed from ${storeName}`,
        { componentName, storeName },
        { level: 'trace', tags: ['zustand', 'subscription', componentName] }
      );
    };
  }, [componentName, storeName, fields.join(','), ...(options?.tags ?? [])]);

  // Track render triggers from store changes
  useCodePointRender(componentName, {
    ...options?.triggerData,
    _storeSource: storeName,
    _fields: fields.join(','),
  });
}

// ============================================================================
// Memoization / Computation Tracker
// ============================================================================

/**
 * Track expensive computations and memoization effectiveness.
 *
 * Usage:
 *   const filteredOrders = useCodePointMemo(
 *     () => orders.filter(o => o.status === 'active'),
 *     [orders],
 *     'OrderList',
 *     'filterActiveOrders'
 *   );
 */
export function useCodePointMemo<T>(
  factory: () => T,
  deps: unknown[],
  componentName: string,
  computationName: string
): T {
  const memoResult = useMemo(factory, deps);
  const prevResult = useRef<{ value: T; deps: unknown[] } | null>(null);

  useEffect(() => {
    const wasRecomputed = prevResult.current === null || prevResult.current.deps !== deps;

    if (wasRecomputed) {
      codepoint(
        'data-transform',
        componentName,
        `Memo "${computationName}" recomputed`,
        {
          componentName,
          computationName,
          resultPreview: truncateForLog(memoResult),
        },
        { level: 'trace', tags: ['memo', 'computation', componentName, computationName] }
      );
      prevResult.current = { value: memoResult, deps };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return memoResult;
}

// ============================================================================
// Performance Profiling Hook
// ============================================================================

/**
 * Profile render performance for a component.
 *
 * Usage:
 *   function HeavyComponent() {
 *     const profileRef = useCodePointProfile('HeavyComponent');
 *
 *     // ... component logic ...
 *
 *     useEffect(() => {
 *       if (profileRef.current) {
 *         profileRef.current.end();
 *       }
 *     });
 *   }
 */
export function useCodePointProfile(componentName: string): React.MutableRefObject<{
  end: () => void;
} | null> {
  const profileRef = useRef<{ end: () => void } | null>(null);

  useEffect(() => {
    const spanId = getCodePointManager().startSpan(
      'component-render',
      componentName,
      `Render profiling`
    );

    profileRef.current = {
      end: () => {
        getCodePointManager().endSpan(spanId, componentName, `Render profiling`);
      },
    };

    return () => {
      profileRef.current = null;
    };
  });

  return profileRef;
}

// ============================================================================
// Analysis Helpers
// ============================================================================

/**
 * Get all render events for a specific component.
 */
export function getComponentRenderHistory(componentName: string): {
  totalRenders: number;
  reRenderCount: number;
  changedProps: Record<string, number>;
  avgRenderInterval: number;
} {
  const manager = getCodePointManager();
  const events = manager.getEvents({
    categories: ['component-render'],
    sources: [componentName],
  });

  const result = {
    totalRenders: events.length,
    reRenderCount: Math.max(0, events.length - 1),
    changedProps: {} as Record<string, number>,
    avgRenderInterval: 0,
  };

  // Count changed prop frequency
  for (const event of events) {
    const data = event.data as { changedProps?: Record<string, { from: unknown; to: unknown }> };
    if (data?.changedProps) {
      for (const key of Object.keys(data.changedProps)) {
        result.changedProps[key] = (result.changedProps[key] || 0) + 1;
      }
    }
  }

  // Calculate average render interval
  if (events.length > 1) {
    const intervals: number[] = [];
    for (let i = 1; i < events.length; i++) {
      intervals.push(events[i].timestamp - events[i - 1].timestamp);
    }
    result.avgRenderInterval = Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length);
  }

  return result;
}

/**
 * Find components that re-render excessively (potential performance issues).
 */
export function findHotComponents(threshold: number = 10): {
  componentName: string;
  renderCount: number;
  avgInterval: number;
}[] {
  const manager = getCodePointManager();
  const renderEvents = manager.getEvents({ categories: ['component-render'] });

  const componentCounts = new Map<string, { count: number; lastTime: number }>();

  for (const event of renderEvents) {
    const existing = componentCounts.get(event.source) ?? { count: 0, lastTime: 0 };
    existing.count++;
    existing.lastTime = Math.max(existing.lastTime, event.timestamp);
    componentCounts.set(event.source, existing);
  }

  return Array.from(componentCounts.entries())
    .filter(([, v]) => v.count >= threshold)
    .map(([name, v]) => ({
      componentName: name,
      renderCount: v.count,
      avgInterval: 0, // Would need timestamps per event to compute
    }))
    .sort((a, b) => b.renderCount - a.renderCount);
}

/**
 * Get a complete data flow diagram from stores to components.
 * Returns adjacency information for visualization.
 */
export function getStoreToComponentFlow(): {
  edges: Array<{ store: string; component: string; fields: string[]; eventCount: number }>;
  orphanComponents: string[];
} {
  const manager = getCodePointManager();
  const subscriptionEvents = manager.getEvents({ categories: ['store-subscription'] });

  const edgesMap = new Map<string, { store: string; component: string; fields: Set<string>; eventCount: number }>();
  const allComponents = new Set<string>();

  for (const event of subscriptionEvents) {
    const data = event.data as { componentName?: string; storeHookName?: string; fields?: string[] };
    if (!data.componentName || !data.storeHookName) continue;

    allComponents.add(data.componentName);
    const key = `${data.storeHookName}->${data.componentName}`;

    if (!edgesMap.has(key)) {
      edgesMap.set(key, {
        store: data.storeHookName,
        component: data.componentName,
        fields: new Set(data.fields ?? []),
        eventCount: 0,
      });
    }

    edgesMap.get(key)!.eventCount++;
  }

  const connectedComponents = new Set(Array.from(edgesMap.values()).map((e) => e.component));
  const orphanComponents = Array.from(allComponents).filter((c) => !connectedComponents.has(c));

  return {
    edges: Array.from(edgesMap.values()).map((e) => ({
      store: e.store,
      component: e.component,
      fields: Array.from(e.fields),
      eventCount: e.eventCount,
    })),
    orphanComponents,
  };
}

// ============================================================================
// Helpers
// ============================================================================

function truncateForLog(data: unknown): unknown {
  const json = JSON.stringify(data);
  if (json.length <= 500) return data;
  return `[Preview: ${json.substring(0, 500)}...]`;
}
