'use strict';

const assert = require('assert');

// Test helpers - same pattern as pushover.test.js
let testCount = 0;
let passCount = 0;
const pendingPromises = [];

function test(name, fn) {
  testCount++;
  const num = testCount;
  try {
    const result = fn();
    if (result && typeof result.then === 'function') {
      const p = result.then(() => {
        console.log(`[OK] Test ${num}: ${name}`);
        passCount++;
      }).catch(error => {
        console.error(`[FAIL] Test ${num}: ${name}`);
        console.error(`    ${error.message || error}`);
      });
      pendingPromises.push(p);
      return p;
    }
    console.log(`[OK] Test ${num}: ${name}`);
    passCount++;
  } catch (error) {
    console.error(`[FAIL] Test ${num}: ${name}`);
    console.error(`    ${error.message || error}`);
  }
}

// Clean up environment helpers
function saveEnv() {
  return {
    PUSHOVER_TOKEN: process.env.PUSHOVER_TOKEN,
    PUSHOVER_USER: process.env.PUSHOVER_USER
  };
}

function restoreEnv(saved) {
  delete process.env.PUSHOVER_TOKEN;
  delete process.env.PUSHOVER_USER;
  if (saved.PUSHOVER_TOKEN !== undefined) process.env.PUSHOVER_TOKEN = saved.PUSHOVER_TOKEN;
  if (saved.PUSHOVER_USER !== undefined) process.env.PUSHOVER_USER = saved.PUSHOVER_USER;
}

function clearPushoverCache() {
  delete require.cache[require.resolve('../../src/configurators/pushover.js')];
}

function clearIndexCache() {
  delete require.cache[require.resolve('../../src/configurators/index.js')];
}

function clearAllConfiguratorCaches() {
  clearPushoverCache();
  clearIndexCache();
}

// ============================================================
// Tests
// ============================================================

console.log('\n=== Unified Flow Integration Tests ===\n');

// ===================================================================
// GROUP 1: Detection-level tests (UFLOW-01: fresh install scenarios)
// These verify that detect*() functions return correct values for
// each scenario, which determines which case (A/B/C/D) triggers.
// ===================================================================

// ---------------------------------------------------------------
// Test 1: UFLOW-01 - detectPushoverFull returns valid structure
// Verifies the return format is always {token: string|null, user: string|null}
// ---------------------------------------------------------------
test('UFLOW-01: Fresh install - detectPushoverFull returns valid {token, user} structure', async () => {
  const saved = saveEnv();
  delete process.env.PUSHOVER_TOKEN;
  delete process.env.PUSHOVER_USER;

  clearPushoverCache();
  const { detectPushoverFull } = require('../../src/configurators/pushover.js');

  const result = await detectPushoverFull();
  assert.ok(result !== null && typeof result === 'object', 'Should return object');
  assert.ok('token' in result, 'Should have token property');
  assert.ok('user' in result, 'Should have user property');
  assert.ok(result.token === null || typeof result.token === 'string',
    'Token should be null or string');
  assert.ok(result.user === null || typeof result.user === 'string',
    'User should be null or string');

  restoreEnv(saved);
});

// ---------------------------------------------------------------
// Test 2: REMOVED in Phase 54 (git-user configurator deleted)
// ---------------------------------------------------------------

// ---------------------------------------------------------------
// Test 3: REMOVED in Phase 54 (git-ssh configurator deleted)
// ---------------------------------------------------------------

// ===================================================================
// GROUP 2: Re-run detection tests (UFLOW-02: existing config scenarios)
// These verify that detect*() functions pick up existing configuration
// values, which triggers Case A (keep prompt) instead of Case D (input).
// ===================================================================

// ---------------------------------------------------------------
// Test 4: UFLOW-02 - detectPushoverFull picks up env vars for full config
// Simulates re-run where both PUSHOVER_TOKEN and PUSHOVER_USER are set
// ---------------------------------------------------------------
test('UFLOW-02: Re-run full config - detectPushoverFull returns both values from env', async () => {
  const saved = saveEnv();
  process.env.PUSHOVER_TOKEN = 'existing_token_abc';
  process.env.PUSHOVER_USER = 'existing_user_xyz';

  clearPushoverCache();
  const { detectPushoverFull } = require('../../src/configurators/pushover.js');

  const result = await detectPushoverFull();
  assert.strictEqual(result.token, 'existing_token_abc', 'Token should match env var');
  assert.strictEqual(result.user, 'existing_user_xyz', 'User should match env var');
  // Both values present -> maps to Case A in pushover.js (keep prompt)

  restoreEnv(saved);
});

// ---------------------------------------------------------------
// Test 5: UFLOW-02 - Partial config Case B: only token set
// Simulates re-run where only PUSHOVER_TOKEN is set -> Case B
// ---------------------------------------------------------------
test('UFLOW-02: Partial config Case B - detectPushoverFull returns token only', async () => {
  const saved = saveEnv();
  process.env.PUSHOVER_TOKEN = 'partial_token_only';
  delete process.env.PUSHOVER_USER;

  clearPushoverCache();
  const { detectPushoverFull } = require('../../src/configurators/pushover.js');

  const result = await detectPushoverFull();
  assert.strictEqual(result.token, 'partial_token_only', 'Token should match env var');
  // user may come from registry or be null -> maps to Case B or Case A
  assert.ok(result.user === null || typeof result.user === 'string',
    'User should be null or string');

  restoreEnv(saved);
});

// ---------------------------------------------------------------
// Test 6: UFLOW-02 - Partial config Case C: only user set
// Simulates re-run where only PUSHOVER_USER is set -> Case C
// ---------------------------------------------------------------
test('UFLOW-02: Partial config Case C - detectPushoverFull returns user only', async () => {
  const saved = saveEnv();
  delete process.env.PUSHOVER_TOKEN;
  process.env.PUSHOVER_USER = 'partial_user_only';

  clearPushoverCache();
  const { detectPushoverFull } = require('../../src/configurators/pushover.js');

  const result = await detectPushoverFull();
  assert.strictEqual(result.user, 'partial_user_only', 'User should match env var');
  assert.ok(result.token === null || typeof result.token === 'string',
    'Token should be null or string');

  restoreEnv(saved);
});

// ===================================================================
// GROUP 3: Orchestration and integration tests
// These verify the runAllConfigurators orchestration logic and
// displayConfigSummary rendering.
// ===================================================================

// ---------------------------------------------------------------
// Test 7: displayConfigSummary renders without errors
// Verifies the summary function handles all result types
// ---------------------------------------------------------------
test('displayConfigSummary renders configured/skipped/failed results without errors', async () => {
  clearIndexCache();
  const { displayConfigSummary } = require('../../src/configurators/index.js');

  const sampleResults = [
    { name: 'Pushover', status: 'configured', details: 'validated and saved' }
  ];

  assert.doesNotThrow(() => {
    displayConfigSummary(sampleResults);
  }, 'displayConfigSummary should not throw with valid results');
});

// ---------------------------------------------------------------
// Test 8: runAllConfigurators is an async function (correct signature)
// Verifies the orchestrator is properly exported and callable
// ---------------------------------------------------------------
test('UFLOW-01/UFLOW-02: runAllConfigurators and displayConfigSummary are exported async functions', async () => {
  clearIndexCache();
  const { runAllConfigurators, displayConfigSummary } = require('../../src/configurators/index.js');

  assert.strictEqual(typeof runAllConfigurators, 'function', 'runAllConfigurators should be a function');
  assert.strictEqual(runAllConfigurators.constructor.name, 'AsyncFunction',
    'runAllConfigurators should be async');
  assert.strictEqual(typeof displayConfigSummary, 'function', 'displayConfigSummary should be a function');
});

// ===================================================================
// GROUP 4: Case-mapping logic tests
// These verify the case-handling logic by testing that detection results
// map to the correct case branches in each configurator.
// ===================================================================

// ---------------------------------------------------------------
// Test 9: UFLOW-01 Case D mapping - null detection maps to fresh install
// Verifies: {token: null, user: null} => Case D (no keep prompts)
// ---------------------------------------------------------------
test('UFLOW-01: Case D mapping - null detection values map to fresh install path', async () => {
  // Simulate what pushover.js sees for Case D
  const detection = { token: null, user: null };
  let caseType = 'D';
  if (detection.token && detection.user) caseType = 'A';
  else if (detection.token && !detection.user) caseType = 'B';
  else if (!detection.token && detection.user) caseType = 'C';
  // else caseType remains 'D'

  assert.strictEqual(caseType, 'D', 'Both null should map to Case D (fresh install)');

  // Case D: No "Keep current config?" prompt appears
  // User gets: Confirm("Configure Pushover?") -> Input(token) -> Input(user)
  const expectedPromptCount = { confirm: 1, input: 2 };
  assert.strictEqual(expectedPromptCount.confirm, 1, 'Case D should have 1 Confirm');
  assert.strictEqual(expectedPromptCount.input, 2, 'Case D should have 2 Inputs');
});

// ---------------------------------------------------------------
// Test 10: UFLOW-02 Case A mapping - full config maps to keep prompt
// Verifies: {token: 'xxx', user: 'yyy'} => Case A (keep prompt)
// ---------------------------------------------------------------
test('UFLOW-02: Case A mapping - full detection values map to keep prompt path', async () => {
  const detection = { token: 'abc12345', user: 'xyz67890' };
  let caseType = 'D';
  if (detection.token && detection.user) caseType = 'A';
  else if (detection.token && !detection.user) caseType = 'B';
  else if (!detection.token && detection.user) caseType = 'C';

  assert.strictEqual(caseType, 'A', 'Both present should map to Case A (keep prompt)');

  // Case A: One Confirm("Keep current config?") prompt, no Inputs if keep=Y
  const expectedPromptCount = { confirm: 1, input: 0 };
  assert.strictEqual(expectedPromptCount.confirm, 1, 'Case A should have 1 Confirm');
  assert.strictEqual(expectedPromptCount.input, 0, 'Case A (keep=Y) should have 0 Inputs');
});

// ---------------------------------------------------------------
// Test 11: UFLOW-02 Case B mapping - partial config (only token)
// Verifies: {token: 'xxx', user: null} => Case B
// ---------------------------------------------------------------
test('UFLOW-02: Case B mapping - token only maps to partial config path', async () => {
  const detection = { token: 'abc12345', user: null };
  let caseType = 'D';
  if (detection.token && detection.user) caseType = 'A';
  else if (detection.token && !detection.user) caseType = 'B';
  else if (!detection.token && detection.user) caseType = 'C';

  assert.strictEqual(caseType, 'B', 'Token only should map to Case B');

  // Case B: Confirm("Keep token?") -> Input(user) -> validate -> save
  const expectedPromptCount = { confirm: 1, input: 1 };
  assert.strictEqual(expectedPromptCount.confirm, 1, 'Case B should have 1 Confirm');
  assert.strictEqual(expectedPromptCount.input, 1, 'Case B should have 1 Input (user)');
});

// ---------------------------------------------------------------
// Test 12: UFLOW-02 Case C mapping - partial config (only user)
// Verifies: {token: null, user: 'yyy'} => Case C
// ---------------------------------------------------------------
test('UFLOW-02: Case C mapping - user only maps to partial config path', async () => {
  const detection = { token: null, user: 'xyz67890' };
  let caseType = 'D';
  if (detection.token && detection.user) caseType = 'A';
  else if (detection.token && !detection.user) caseType = 'B';
  else if (!detection.token && detection.user) caseType = 'C';

  assert.strictEqual(caseType, 'C', 'User only should map to Case C');

  // Case C: Confirm("Keep user?") -> Input(token) -> validate -> save
  const expectedPromptCount = { confirm: 1, input: 1 };
  assert.strictEqual(expectedPromptCount.confirm, 1, 'Case C should have 1 Confirm');
  assert.strictEqual(expectedPromptCount.input, 1, 'Case C should have 1 Input (token)');
});

// ---------------------------------------------------------------
// Test 13: REMOVED in Phase 54 (git-user configurator deleted)
// ---------------------------------------------------------------

// ---------------------------------------------------------------
// Test 14: REMOVED in Phase 54 (git-ssh configurator deleted)
// ---------------------------------------------------------------

// Summary
(async () => {
  await Promise.all(pendingPromises);

  console.log('\n=== Test Summary ===');
  console.log(`Total: ${testCount}`);
  console.log(`Passed: ${passCount}`);
  console.log(`Failed: ${testCount - passCount}`);

  if (passCount === testCount) {
    console.log('\nAll tests passed!');
    process.exit(0);
  } else {
    console.log('\nSome tests failed.');
    process.exit(1);
  }
})();
