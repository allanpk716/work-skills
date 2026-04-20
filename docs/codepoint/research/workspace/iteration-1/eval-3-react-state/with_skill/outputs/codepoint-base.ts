// =============================================================================
// Code Point Base Library — Frontend (JS/TS/React)
// Lightweight runtime probe for AI-assisted debugging.
// Zero overhead when disabled (one boolean check).
//
// Enable in Vite:  VITE_CODEPOINT_ENABLED=true npm run dev 2>&1 | tee codepoints.log
// Enable in CRA:   CODEPOINT_ENABLED=true npm start 2>&1 | tee codepoints.log
// Enable in Next:  NEXT_PUBLIC_CODEPOINT=true npm run dev 2>&1 | tee codepoints.log
// Browser:         Filter DevTools Console by "[CODEPOINT]" to isolate output
// =============================================================================

const enabled: boolean =
  typeof import.meta !== 'undefined'
    ? import.meta.env?.VITE_CODEPOINT_ENABLED === 'true' ||
      import.meta.env?.CODEPOINT_ENABLED === 'true'
    : typeof process !== 'undefined'
      ? process.env.CODEPOINT_ENABLED === 'true' ||
        process.env.NEXT_PUBLIC_CODEPOINT === 'true'
      : false;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CodePointEntry {
  name: string;
  timestamp: string;
  stack: string;
  frames: string[];
  meta?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Stack helpers
// ---------------------------------------------------------------------------

export function parseStack(stack: string): string[] {
  return stack
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('at '));
}

// ---------------------------------------------------------------------------
// Core probe functions
// ---------------------------------------------------------------------------

/**
 * Capture a stack trace at the call site.
 * Disabled = zero cost (one bool check).
 *
 * @param name  Descriptive name prefixed by workflow, e.g. "ws_message_entry"
 */
export function point(name: string): void {
  if (!enabled) return;
  const stack = new Error().stack ?? '';
  const output = `[CODEPOINT] ${name}\n${stack}\n`;
  console.error(output);
}

/**
 * Capture a stack trace with additional metadata.
 * Use when you need to attach contextual data (e.g. message type, store slice).
 *
 * @param name  Descriptive name prefixed by workflow
 * @param meta  Key-value pairs that describe the runtime context
 */
export function pointWithMeta(name: string, meta: Record<string, unknown>): void {
  if (!enabled) return;
  const stack = new Error().stack ?? '';
  const entry: CodePointEntry = {
    name,
    timestamp: new Date().toISOString(),
    stack,
    frames: parseStack(stack),
    meta,
  };
  console.error(JSON.stringify(entry));
}

/**
 * Returns the stack as a string for programmatic use (e.g. density tests).
 * Does NOT print to console — use for testing / analysis only.
 */
export function collectStack(name: string): string {
  if (!enabled) return '';
  const stack = new Error().stack ?? '';
  return `[CODEPOINT] ${name}\n${stack}`;
}

/**
 * Async-aware code point — captures the async call chain.
 * Use in async functions to capture the promise chain context.
 * For Node.js, run with --async-stack-traces for full async chains.
 */
export async function pointAsync(name: string): Promise<void> {
  if (!enabled) return;
  const stack = new Error().stack ?? '';
  const output = `[CODEPOINT] ${name} [async]\n${stack}\n`;
  console.error(output);
}

// ---------------------------------------------------------------------------
// Density analysis
// ---------------------------------------------------------------------------

/**
 * Compute overlap between two captured stacks.
 * Returns 0.0 (no overlap) to 1.0 (identical frames).
 *
 * Guidelines:
 *   > 0.8  → too dense (remove redundant points)
 *   0      → too sparse (add intermediate points)
 *   0.2-0.6 → healthy density
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

/**
 * Analyze density across a batch of collected stacks.
 * Returns an array of pairwise overlaps between consecutive entries.
 */
export function analyzeDensity(entries: CodePointEntry[]): number[] {
  const overlaps: number[] = [];
  for (let i = 1; i < entries.length; i++) {
    overlaps.push(analyzeOverlap(entries[i - 1].stack, entries[i].stack));
  }
  return overlaps;
}

// ---------------------------------------------------------------------------
// Batch collector — accumulate code point data during a session
// ---------------------------------------------------------------------------

export class CodePointCollector {
  private entries: CodePointEntry[] = [];

  collect(name: string, meta?: Record<string, unknown>): void {
    if (!enabled) return;
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

  /** Return density report between consecutive entries */
  densityReport(): { pair: string; overlap: number }[] {
    return analyzeDensity(this.entries).map((overlap, i) => ({
      pair: `${this.entries[i].name} → ${this.entries[i + 1].name}`,
      overlap,
    }));
  }
}

/** Singleton collector instance */
export const collector = new CodePointCollector();
