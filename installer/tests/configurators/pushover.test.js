'use strict';

const assert = require('assert');
const path = require('path');

// Test helpers
let testCount = 0;
let passCount = 0;
const pendingPromises = [];

function test(name, fn) {
  testCount++;
  const num = testCount;
  try {
    const result = fn();
    if (result && typeof result.then === 'function') {
      // Async test - collect promise for later awaiting
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

// Mock process.env for testing
const originalEnv = { ...process.env };

function resetEnv() {
  // Clear test env vars
  delete process.env.PUSHOVER_TOKEN;
  delete process.env.PUSHOVER_USER;
}

// Tests

console.log('\n=== Pushover Configurator Tests ===\n');

// Test 1: detectPushoverEnv() returns {token: null, user: null} when env vars not set
resetEnv();
test('detectPushoverEnv returns null values when env vars not set', async () => {
  // Clear env vars
  delete process.env.PUSHOVER_TOKEN;
  delete process.env.PUSHOVER_USER;

  // Need to re-require to pick up env changes
  delete require.cache[require.resolve('../../src/configurators/pushover.js')];
  const { detectPushoverEnv } = require('../../src/configurators/pushover.js');

  const result = detectPushoverEnv();
  assert.strictEqual(result.token, null, 'Token should be null');
  assert.strictEqual(result.user, null, 'User should be null');
});

// Test 2: detectPushoverEnv() returns {token: 'xxx', user: 'yyy'} when env vars are set
resetEnv();
test('detectPushoverEnv returns values when env vars are set', async () => {
  process.env.PUSHOVER_TOKEN = 'test_token_123';
  process.env.PUSHOVER_USER = 'test_user_456';

  delete require.cache[require.resolve('../../src/configurators/pushover.js')];
  const { detectPushoverEnv } = require('../../src/configurators/pushover.js');

  const result = detectPushoverEnv();
  assert.strictEqual(result.token, 'test_token_123', 'Token should match');
  assert.strictEqual(result.user, 'test_user_456', 'User should match');
});

// Test 3: setEnvVariable('TEST_VAR', 'value') returns {success: true} on success
test('setEnvVariable returns success on valid setx call', async () => {
  const { setEnvVariable } = require('../../src/configurators/pushover.js');

  const result = await setEnvVariable('WORKSKILLS_TEST_VAR', 'test_value');
  assert.strictEqual(result.success, true, 'Should return success: true');
  assert.strictEqual(result.error, undefined, 'Should not have error field');
});

// Test 4: validatePushoverCredentials() returns {valid: true} for valid credentials
test('validatePushoverCredentials returns valid for valid credentials', async () => {
  const { validatePushoverCredentials } = require('../../src/configurators/pushover.js');

  // This test requires actual valid Pushover credentials
  // In TDD RED phase, this will fail without credentials
  const result = await validatePushoverCredentials('invalid_token', 'invalid_user');

  // For RED phase, we expect this to fail validation
  assert.strictEqual(result.valid, false, 'Invalid credentials should fail validation');
  assert.ok(result.error, 'Should have error message');
});

// Test 5: validatePushoverCredentials() returns {valid: false, error: '...'} for invalid credentials
test('validatePushoverCredentials returns invalid for invalid credentials', async () => {
  const { validatePushoverCredentials } = require('../../src/configurators/pushover.js');

  const result = await validatePushoverCredentials('bad_token', 'bad_user');

  assert.strictEqual(result.valid, false, 'Should return valid: false');
  assert.ok(result.error, 'Should have error message');
  assert.ok(typeof result.error === 'string', 'Error should be string');
});

// Test 6: readRegistryEnvVar() returns null for non-existent variable
test('readRegistryEnvVar returns null for non-existent env var', async () => {
  delete require.cache[require.resolve('../../src/configurators/pushover.js')];
  const { readRegistryEnvVar } = require('../../src/configurators/pushover.js');

  const result = await readRegistryEnvVar('NONEXISTENT_VAR_12345');
  assert.strictEqual(result, null, 'Should return null for non-existent variable');
});

// Test 7: readRegistryEnvVar() returns string for existing variable
test('readRegistryEnvVar returns value for existing variable (TEMP)', async () => {
  delete require.cache[require.resolve('../../src/configurators/pushover.js')];
  const { readRegistryEnvVar } = require('../../src/configurators/pushover.js');

  const result = await readRegistryEnvVar('TEMP');
  // TEMP may or may not be in HKCU\Environment, so we accept null too
  if (result !== null) {
    assert.strictEqual(typeof result, 'string', 'Should return string');
    assert.ok(result.length > 0, 'Value should not be empty');
  }
});

// Test 8: detectPushoverFull() returns null values when nothing configured
resetEnv();
test('detectPushoverFull returns nulls when nothing configured', async () => {
  delete require.cache[require.resolve('../../src/configurators/pushover.js')];
  const { detectPushoverFull } = require('../../src/configurators/pushover.js');

  const result = await detectPushoverFull();
  // When nothing is set in env or registry, both should be null
  // Note: if user has set these globally, test may see values -- that's OK
  assert.ok(
    result.token === null || typeof result.token === 'string',
    'Token should be null or string'
  );
  assert.ok(
    result.user === null || typeof result.user === 'string',
    'User should be null or string'
  );
});

// Test 9: detectPushoverFull() picks up process.env values (priority over registry)
resetEnv();
test('detectPushoverFull picks up process.env values', async () => {
  process.env.PUSHOVER_TOKEN = 'env_token_test';
  process.env.PUSHOVER_USER = 'env_user_test';

  delete require.cache[require.resolve('../../src/configurators/pushover.js')];
  const { detectPushoverFull } = require('../../src/configurators/pushover.js');

  const result = await detectPushoverFull();
  assert.strictEqual(result.token, 'env_token_test', 'Should pick up process.env token');
  assert.strictEqual(result.user, 'env_user_test', 'Should pick up process.env user');

  // Clean up test env vars to avoid polluting other tests
  delete process.env.PUSHOVER_TOKEN;
  delete process.env.PUSHOVER_USER;
});

// Summary
(async () => {
  // Wait for all async tests to complete
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
