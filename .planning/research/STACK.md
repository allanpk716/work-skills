# Technology Stack

**Project:** Work Skills v2.0 -- Frontend Automated Testing with Codepoint Integration
**Researched:** 2026-04-20
**Overall confidence:** HIGH

## Recommended Stack

### Primary Testing Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Playwright | 1.59.x | E2E browser testing | Best fit for Codepoint integration: native `page.route()` intercepts `/__codepoint__` POST requests, `waitForRequest`/`page.on('request')` captures probe data in real-time, `route.fulfill()` can mock backend responses for isolated frontend testing. Cross-browser support not needed (Chromium only), but Playwright's network interception API is unmatched. |

### Supporting Test Libraries

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `@playwright/test` | 1.59.x | Playwright test runner | Built-in fixtures, auto-wait, web-first assertions. Ships with Playwright, no separate install. |
| Vitest | 4.1.x | Unit/integration tests for codepoint.ts | Existing E2E projects use Vite 8 + React 19. Vitest reuses Vite config natively -- zero setup for transforming TS/JSX. Use for testing the codepoint base library itself (overlap analysis, collector, toggle detection). |

### NOT Adding (Deliberate Exclusions)

| Excluded Technology | Why NOT Adding |
|---------------------|---------------|
| `@testing-library/react` | The testing goal is **user-flow verification via Codepoint probes**, not component-level DOM assertions. Playwright operates at the browser level where codepoint.ts sends real POST requests to `/__codepoint__`. Testing Library renders in jsdom which cannot execute `fetch('/__codepoint__')` -- it would require mocking the entire Codepoint pipeline, defeating the purpose. |
| `vitest-browser-react` | While vitest-browser-react 2.1.x is stable (Vitest 4.0+), it adds a second browser testing paradigm alongside Playwright. The Codepoint integration requires `page.route()` network interception which is Playwright-specific. No need for two browser testing layers. |
| Cypress | Playwright's `page.route()` API is more direct for intercepting arbitrary POST endpoints. Cypress's proxy-based interception is less transparent. Also: Playwright test runner has better TypeScript support and built-in trace viewer for debugging. |
| Jest | Vitest already integrates with the Vite config in E2E projects. Adding Jest would mean duplicating transform configuration. Vitest provides Jest-compatible assertions (`expect`) anyway. |
| Selenium/WebDriver | Over-engineered for this use case. Requires browser driver management. Playwright bundles browser binaries and provides a single API. |

## Integration with Existing Codepoint V2 Architecture

### How Playwright Connects to Codepoint

The existing Codepoint V2 frontend probes work by POSTing JSON to `/__codepoint__`:

```typescript
// In codepoint.ts (browser mode)
fetch('/__codepoint__', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name, stack, timestamp, meta }),
});
```

Playwright can intercept, capture, and assert on these requests with three key APIs:

**1. Capture probe data during user interactions:**

```typescript
// Collect all codepoint POST requests during a test
const codepointRequests: any[] = [];
page.on('request', (req) => {
  if (req.url().includes('/__codepoint__') && req.method() === 'POST') {
    codepointRequests.push(JSON.parse(req.postData()!));
  }
});

// Perform user action
await page.getByRole('button', { name: 'Calculate' }).click();

// Assert probes fired
expect(codepointRequests).toHaveLength(3);
expect(codepointRequests.map(r => r.meta?.point_id))
  .toEqual(['cp-fe-calc-submit', 'cp-fe-calc-response', 'cp-fe-calc-error']);
```

**2. Mock backend API while testing frontend-only:**

```typescript
// Mock the calculate API, let codepoint probes pass through to collector
await page.route('*/api/calculate*', async (route) => {
  await route.fulfill({ json: { result: '5', error: '' } });
});
// /__codepoint__ requests are NOT intercepted -- they go to the real collector
```

**3. Wait for specific probes (time-ordered verification):**

```typescript
const requestPromise = page.waitForRequest(
  (req) => req.url().includes('/__codepoint__') && req.method() === 'POST'
);
await page.getByRole('button', { name: 'Calculate' }).click();
const probe = await requestPromise;
const payload = JSON.parse(probe.postData()!);
expect(payload.meta.point_id).toBe('cp-fe-calc-submit');
```

### What Does NOT Need to Change

| Component | Status | Why |
|-----------|--------|-----|
| `codepoint.ts` (dual-mode library) | Unchanged | Browser POST path works as-is. Playwright intercepts at network level, no code changes. |
| Go collector (`collector.go`) | Unchanged | Tests run against the real collector. It receives and logs probes normally. |
| Python collector (`collector.py`) | Unchanged | Same reason as Go collector. |
| Vite config | Unchanged | Playwright runs against the dev server or built assets. |
| React components | Unchanged | Probes in event handlers are exactly what Playwright exercises. |
| `.codepoints/` data model | Unchanged | Test specs reference the same `point_id` and `flow_id` from index.json. |

## Test Specification Format

Frontend test plans should follow this structure, which extends the existing Codepoint flow model:

```markdown
## Frontend Test Plan: [Flow Name]

### Flow Under Test
- Flow ID: flow-api-calculate
- Trigger: User clicks "Calculate" button

### Test Steps (click -> response -> verify)

| Step | Action | Expected Probe | Verify |
|------|--------|---------------|--------|
| 1 | Type "2+3" in input | - | Input value updated |
| 2 | Click "Calculate" button | cp-fe-calc-submit fires | POST to /__codepoint__ with point_id |
| 3 | Wait for response | cp-fe-calc-response fires | Result shows "5" |
| 4 | (error path) Click with empty input | cp-fe-calc-error fires | Error message displayed |

### Probe Sequence Assertion
Expected order: cp-fe-calc-submit -> cp-fe-calc-response
Error order: cp-fe-calc-submit -> cp-fe-calc-error
```

This format maps directly to Playwright test code and reuses the existing `.codepoints/` flow definitions.

## Claude Code Skill Integration

The new frontend testing skill should be added under `plugins/codepoint/` alongside existing skills:

```
plugins/codepoint/skills/
  codepoint/SKILL.md      # Main entry (existing)
  scan/SKILL.md            # Codebase scan (existing)
  plan/SKILL.md            # Plan probes (existing)
  implement/SKILL.md       # Insert probes (existing)
  frontend-test/SKILL.md   # NEW: Frontend test planning + execution
```

The `frontend-test` skill integrates with the existing Codepoint workflow:

```
1. /codepoint-plan       -- Plan code points for new feature (existing)
2. /codepoint-implement  -- Insert probes into source (existing)
3. /codepoint-frontend-test -- Generate and run Playwright tests against probes (NEW)
```

### Skill Responsibilities

The `frontend-test` skill should:
1. Read `.codepoints/index.json` to discover flows and their point sequences
2. Filter for frontend-type points (those using `pointWithMeta` in React components)
3. Generate Playwright test files following the "click -> response -> verify" template
4. Execute tests and verify probe firing order matches flow definitions
5. Output verification results to `.codepoints/verification/` (reusing existing template)

## Installation

```bash
# In the target frontend project (e.g., tests/e2e/codepoint-v2/gojs-calculator/frontend/)
npm install -D @playwright/test@^1.59.0

# Initialize Playwright (creates playwright.config.ts)
npx playwright install chromium

# For unit testing codepoint.ts itself
npm install -D vitest@^4.1.0
```

Note: Only Chromium is needed -- cross-browser testing is not a goal for Codepoint verification.

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| E2E Framework | Playwright | Cypress | Cypress proxy-based interception is less direct than `page.route()`. Playwright also has better TypeScript integration and trace viewer. |
| E2E Framework | Playwright | Puppeteer | No built-in test runner, no `page.route()` equivalent for request interception. Would need Jest/Mocha glue. |
| Component Testing | None (use Playwright E2E) | @testing-library/react | jsdom cannot execute `fetch('/__codepoint__')`. Would need to mock the entire Codepoint pipeline, defeating the integration testing purpose. |
| Component Testing | None | vitest-browser-react | Adds a second browser testing layer. The Codepoint integration specifically needs Playwright's network interception API. |
| Unit Testing | Vitest | Jest | E2E projects already use Vite 8. Vitest reuses the Vite config with zero setup. Jest would require separate transform config. |
| Test Assertion | Playwright built-in expect | Chai/Jest expect | Playwright's `expect()` has auto-retrying web-first assertions. No need for additional assertion libraries. |

## Version Compatibility Matrix

| Package A | Version | Compatible With | Notes |
|-----------|---------|-----------------|-------|
| Playwright | 1.59.x | Vite 8.x | No direct dependency; Playwright connects to dev server via HTTP |
| Playwright | 1.59.x | React 19.x | Tested and supported per Playwright release notes |
| Vitest | 4.1.x | Vite 8.x | Vitest is built on Vite; 4.1.x targets Vite 6.x+ |
| Vitest | 4.1.x | TypeScript 6.x | Full TS support out of box |
| @playwright/test | 1.59.x | TypeScript 6.x | Ships its own type definitions |
| codepoint.ts | (existing) | Playwright 1.59.x | No changes needed; Playwright intercepts at network level |

## Project-Level Configuration

### playwright.config.ts (to be created per E2E project)

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:8080',  // Go/Python backend serves frontend
    trace: 'on-first-retry',           // Trace only on failure
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  webServer: {
    command: 'cd .. && go run .',  // Start backend with embedded frontend
    port: 8080,
    reuseExistingServer: true,
  },
});
```

### Vitest config (for codepoint.ts unit tests)

The existing `vite.config.ts` can be extended:

```typescript
// Add to existing vite.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // ... existing config
  test: {
    include: ['src/lib/**/*.test.ts'],
  },
});
```

## Sources

- Playwright 1.59.1 -- verified via [npm](https://www.npmjs.com/package/playwright) and [official release notes](https://playwright.dev/docs/release-notes) (HIGH confidence)
- Vitest 4.1.4 -- verified via [npm](https://www.npmjs.com/package/vitest) and [official blog](https://vitest.dev/blog/vitest-4-1.html) (HIGH confidence)
- `@vitest/browser` 4.1.3 -- verified via [npm](https://www.npmjs.com/package/@vitest/browser) (HIGH confidence, decided NOT to use)
- `@testing-library/react` 16.3.2 -- verified via [npm](https://www.npmjs.com/package/@testing-library/react) (HIGH confidence, decided NOT to use)
- Playwright network interception -- [official docs](https://playwright.dev/docs/network) and [mock docs](https://playwright.dev/docs/mock) (HIGH confidence)
- Playwright `waitForRequest` API -- verified via Context7 `/microsoft/playwright.dev` docs (HIGH confidence)
- Vitest browser mode component testing -- verified via Context7 `/vitest-dev/vitest` docs (HIGH confidence)
- Codepoint V2 architecture -- verified from project source code `plugins/codepoint/` and E2E test projects (HIGH confidence)
- Existing E2E project configs -- verified from `tests/e2e/codepoint-v2/gojs-calculator/` and `pyts-calculator/` (HIGH confidence)
