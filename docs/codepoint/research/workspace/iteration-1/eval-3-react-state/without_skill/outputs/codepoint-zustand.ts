/**
 * CodePoint - Zustand Store Instrumentation
 *
 * Instruments Zustand stores to trace all state mutations,
 * selector evaluations, and subscription patterns.
 */

import { codepoint, getCodePointManager, type CodePointId } from './codepoint-core';

// ============================================================================
// Zustand Store Wrapper
// ============================================================================

/**
 * Wrap a Zustand store creator to automatically instrument all mutations.
 *
 * Usage:
 *   const useMyStore = instrumentStore(create<MyState>((set, get) => ({
 *     count: 0,
 *     increment: () => set((state) => ({ count: state.count + 1 })),
 *   })));
 */
export function instrumentStore<T>(
  storeCreator: () => ReturnType<typeof import('zustand')['create']<T>>,
  storeName: string
) {
  const store = storeCreator() as ReturnType<typeof import('zustand')['create']<T>>;

  // We need to intercept the store's setState
  // Zustand stores expose getState and setState
  const originalSetState = (store as unknown as { setState: (...args: unknown[]) => void }).setState;
  const originalGetState = (store as unknown as { getState: () => T }).getState;

  if (originalSetState) {
    (store as unknown as { setState: (...args: unknown[]) => void }).setState = (...args: unknown[]) => {
      const prevState = originalGetState();
      const spanId = getCodePointManager().startSpan('store-mutation', storeName, `setState`);

      // Call original
      originalSetState(...args);

      const newState = originalGetState();

      // Compute diff
      const diff = computeStateDiff(prevState, newState);

      codepoint(
        'store-mutation',
        storeName,
        `State mutated`,
        {
          storeName,
          prevState: shallowClone(prevState),
          newState: shallowClone(newState),
          diff,
          ...(args[1] ? { action: args[1] } : {}),
        },
        { level: 'debug', tags: ['zustand', 'mutation'] }
      );

      getCodePointManager().endSpan(spanId, storeName, `setState completed`);
    };
  }

  // Emit store creation event
  codepoint(
    'store-mutation',
    storeName,
    `Store initialized`,
    {
      storeName,
      initialState: shallowClone(originalGetState()),
    },
    { level: 'info', tags: ['zustand', 'init'] }
  );

  return store;
}

// ============================================================================
// Instrumented Selector Hook
// ============================================================================

/**
 * Wrap a Zustand useStore hook to trace selector evaluations and re-renders.
 *
 * Usage:
 *   const useMyStore = create<MyState>(...);
 *   const instrumentedUseStore = createInstrumentedHook(useMyStore, 'MyStore');
 *
 *   // In component:
 *   const count = instrumentedUseStore((s) => s.count);
 */
export function createInstrumentedHook<T>(
  useStore: (selector: (state: T) => unknown) => unknown,
  storeName: string
) {
  return function useInstrumentedStore(
    selector: (state: T) => unknown,
    equalityFn?: (a: unknown, b: unknown) => boolean
  ) {
    // Emit selector evaluation event
    const spanId = getCodePointManager().startSpan('store-selector', storeName, `selector evaluation`);

    const result = useStore(selector, equalityFn);

    getCodePointManager().endSpan(spanId, storeName, `selector evaluation`, {
      result: shallowClone(result as object),
      selectorSource: selector.toString().substring(0, 200),
    });

    codepoint(
      'store-selector',
      storeName,
      `Selector evaluated`,
      {
        storeName,
        selectorPreview: selector.toString().substring(0, 100),
      },
      { level: 'trace', tags: ['zustand', 'selector'] }
    );

    return result;
  };
}

// ============================================================================
// Cross-Store Sync Tracker
// ============================================================================

/**
 * Track when one store's mutation triggers an update in another store.
 *
 * Usage:
 *   useEffect(() => {
 *     const unsub1 = trackCrossStoreSync('OrderStore', 'UserStore', () => {
 *       // Sync logic: e.g., update user's order count when order changes
 *     });
 *     return unsub1;
 *   }, []);
 */
export function trackCrossStoreSync(
  sourceStore: string,
  targetStore: string,
  syncFn: () => void
): () => void {
  const spanId = getCodePointManager().startSpan(
    'cross-store-sync',
    `${sourceStore}->${targetStore}`,
    `Cross-store sync initiated`
  );

  codepoint(
    'cross-store-sync',
    `${sourceStore}->${targetStore}`,
    `Sync triggered from ${sourceStore} to ${targetStore}`,
    { sourceStore, targetStore },
    { level: 'debug', tags: ['zustand', 'sync'] }
  );

  try {
    syncFn();
    getCodePointManager().endSpan(spanId, `${sourceStore}->${targetStore}`, `Cross-store sync completed`);
  } catch (error) {
    getCodePointManager().endSpan(spanId, `${sourceStore}->${targetStore}`, `Cross-store sync failed`, { error });
    codepoint(
      'cross-store-sync',
      `${sourceStore}->${targetStore}`,
      `Sync error: ${error}`,
      { sourceStore, targetStore, error },
      { level: 'error', tags: ['zustand', 'sync', 'error'] }
    );
  }

  // Return a no-op unsubscribe for API consistency
  return () => {};
}

// ============================================================================
// Store Subscription Tracker (for components)
// ============================================================================

/**
 * Track a component's subscription to a store. Call in useEffect.
 *
 * Usage:
 *   useEffect(() => {
 *     return trackSubscription('Dashboard', 'useOrderStore', ['orders', 'filters']);
 *   }, []);
 */
export function trackSubscription(
  componentName: string,
  storeHookName: string,
  fields: string[]
): () => void {
  codepoint(
    'store-subscription',
    componentName,
    `Subscribed to ${storeHookName} [${fields.join(', ')}]`,
    { componentName, storeHookName, fields },
    { level: 'debug', tags: ['zustand', 'subscription', componentName] }
  );

  return () => {
    codepoint(
      'store-subscription',
      componentName,
      `Unsubscribed from ${storeHookName}`,
      { componentName, storeHookName },
      { level: 'trace', tags: ['zustand', 'subscription', componentName] }
    );
  };
}

// ============================================================================
// Store Diff Analysis
// ============================================================================

/**
 * Analyze which store mutations occurred between two time points.
 */
export function getStoreMutationsBetween(
  storeName: string,
  startTime: number,
  endTime: number
): import('./codepoint-core').CodePointEvent[] {
  const manager = getCodePointManager();
  return manager.getEvents({
    categories: ['store-mutation'],
    sources: [storeName],
  }).filter(
    (e) => e.timestamp >= startTime && e.timestamp <= endTime
  );
}

/**
 * Get all stores and their mutation frequency for performance analysis.
 */
export function getStoreMutationStats(): Record<
  string,
  { count: number; avgDuration: number; lastMutation: number }
> {
  const manager = getCodePointManager();
  const mutations = manager.getEvents({ categories: ['store-mutation'] });

  const stats: Record<string, { count: number; totalDuration: number; lastMutation: number }> = {};

  for (const event of mutations) {
    const storeName = (event.data as { storeName?: string })?.storeName ?? event.source;
    if (!stats[storeName]) {
      stats[storeName] = { count: 0, totalDuration: 0, lastMutation: 0 };
    }
    stats[storeName].count++;
    stats[storeName].totalDuration += event.duration ?? 0;
    stats[storeName].lastMutation = Math.max(stats[storeName].lastMutation, event.timestamp);
  }

  const result: Record<string, { count: number; avgDuration: number; lastMutation: number }> = {};
  for (const [key, val] of Object.entries(stats)) {
    result[key] = {
      count: val.count,
      avgDuration: val.count > 0 ? Math.round(val.totalDuration / val.count) : 0,
      lastMutation: val.lastMutation,
    };
  }

  return result;
}

// ============================================================================
// Helpers
// ============================================================================

function computeStateDiff(prev: unknown, next: unknown): Record<string, { from: unknown; to: unknown }> {
  const diff: Record<string, { from: unknown; to: unknown }> = {};

  if (typeof prev !== 'object' || prev === null || typeof next !== 'object' || next === null) {
    return { root: { from: prev, to: next } };
  }

  const allKeys = new Set([
    ...Object.keys(prev as object),
    ...Object.keys(next as object),
  ]);

  for (const key of allKeys) {
    const prevVal = (prev as Record<string, unknown>)[key];
    const nextVal = (next as Record<string, unknown>)[key];

    if (prevVal !== nextVal) {
      diff[key] = { from: prevVal, to: nextVal };
    }
  }

  return diff;
}

function shallowClone(obj: unknown): unknown {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return [...obj];
  return { ...(obj as object) };
}

// ============================================================================
// Density Validation
// ============================================================================

/**
 * Validate that code points cover all critical paths in the state management layer.
 * Returns a report showing coverage gaps.
 */
export function validateStateManagementCoverage(
  storeNames: string[],
  componentNames: string[]
): {
  covered: string[];
  missing: string[];
  score: number;
  recommendations: string[];
} {
  const manager = getCodePointManager();
  const events = manager.getEvents();

  const covered = new Set<string>();

  // Check store coverage
  for (const storeName of storeNames) {
    const hasMutations = events.some(
      (e) => e.category === 'store-mutation' && (e.source === storeName || (e.data as { storeName?: string })?.storeName === storeName)
    );
    const hasSubscriptions = events.some(
      (e) => e.category === 'store-subscription' && (e.data as { storeHookName?: string })?.storeHookName?.includes(storeName)
    );
    if (hasMutations || hasSubscriptions) {
      covered.add(`store:${storeName}`);
    }
  }

  // Check component coverage
  for (const compName of componentNames) {
    const hasEvents = events.some(
      (e) => e.source === compName || e.tags?.includes(compName)
    );
    if (hasEvents) {
      covered.add(`component:${compName}`);
    }
  }

  const total = storeNames.length + componentNames.length;
  const score = total > 0 ? covered.size / total : 0;

  const recommendations: string[] = [];
  for (const storeName of storeNames) {
    if (!covered.has(`store:${storeName}`)) {
      recommendations.push(`Add code points to store "${storeName}" mutations`);
    }
  }
  for (const compName of componentNames) {
    if (!covered.has(`component:${compName}`)) {
      recommendations.push(`Add subscription tracking to component "${compName}"`);
    }
  }

  // Check WebSocket bridge
  const hasWsEvents = events.some((e) => e.category.startsWith('ws-'));
  if (!hasWsEvents) {
    recommendations.push('Add WebSocket instrumentation to trace real-time data flow into stores');
  }

  // Check cross-store sync
  const hasSyncEvents = events.some((e) => e.category === 'cross-store-sync');
  if (!hasSyncEvents && storeNames.length > 1) {
    recommendations.push('Multiple stores detected but no cross-store sync tracking found');
  }

  const missing = storeNames
    .filter((n) => !covered.has(`store:${n}`))
    .map((n) => `store:${n}`)
    .concat(componentNames.filter((n) => !covered.has(`component:${n}`)).map((n) => `component:${n}`));

  return {
    covered: Array.from(covered),
    missing,
    score: Math.round(score * 100) / 100,
    recommendations,
  };
}
