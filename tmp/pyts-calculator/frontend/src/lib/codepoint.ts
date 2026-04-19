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
