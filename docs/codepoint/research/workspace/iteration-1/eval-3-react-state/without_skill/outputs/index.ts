/**
 * CodePoint - React State Management Data Flow Tracer
 *
 * Complete instrumentation library for analyzing data flow in React applications
 * that use Zustand for state management, WebSocket for real-time data, and
 * have complex inter-component data dependencies.
 *
 * @module codepoint-react-state
 */

// Core
export {
  codepoint,
  getCodePointManager,
  CodePointManager,
} from './codepoint-core';
export type {
  CodePointId,
  CodePointLevel,
  CodePointCategory,
  CodePointEvent,
  CodePointSpan,
  CodePointObserver,
  CodePointFilter,
  DependencyGraphNode,
} from './codepoint-core';

// Zustand instrumentation
export {
  instrumentStore,
  createInstrumentedHook,
  trackCrossStoreSync,
  trackSubscription,
  getStoreMutationsBetween,
  getStoreMutationStats,
  validateStateManagementCoverage,
} from './codepoint-zustand';

// WebSocket instrumentation
export {
  instrumentWebSocket,
  createReconnectTracker,
  traceWSStoreBridge,
  getWSMessageStats,
  getWSStoreTrace,
} from './codepoint-websocket';
export type {
  WebSocketCodePointConfig,
  WSMessageTrace,
  WSLifecycleEvent,
} from './codepoint-websocket';

// React component instrumentation
export {
  useCodePointMount,
  useCodePointRender,
  useCodePointEffect,
  useCodePointDataDependency,
  useCodePointStoreConsumer,
  useCodePointMemo,
  useCodePointProfile,
  getComponentRenderHistory,
  findHotComponents,
  getStoreToComponentFlow,
} from './codepoint-react';
