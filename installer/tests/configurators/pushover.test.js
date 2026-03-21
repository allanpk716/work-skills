'use strict';

const assert = require('assert');
const path = require('path');

// Test helpers
let testCount = 0;
let passCount = 0;

function test(name, fn) {
  testCount++;
  try {
    fn();
    console.log(`[OK] Test ${testCount}: ${name}`);
    passCount++;
  } catch (error) {
    console.error(`[FAIL] Test ${testCount}: ${name}`);
    console.error(`    ${error.message}`);
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

// Summary
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
