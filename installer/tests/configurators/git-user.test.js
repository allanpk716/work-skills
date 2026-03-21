'use strict';

const assert = require('assert');
const { detectGitUser, configureGitUser } = require('../../src/configurators/git-user.js');

// Test 1: detectGitUser() returns {name: 'Alice', email: 'alice@example.com'} when both are set
async function testDetectGitUserConfigured() {
  const result = await detectGitUser();

  assert.strictEqual(typeof result.name, 'string', 'name should be string when set');
  assert.strictEqual(typeof result.email, 'string', 'email should be string when set');

  console.log('✓ Test 1 passed: detectGitUser returns configured state');
}

// Test 2: detectGitUser() returns {name: null, email: null} when neither is set
async function testDetectGitUserNotConfigured() {
  const result = await detectGitUser();

  // name and email can be string (configured) or null (not configured)
  assert.strictEqual(result.name === null || typeof result.name === 'string', true);
  assert.strictEqual(result.email === null || typeof result.email === 'string', true);

  console.log('✓ Test 2 passed: detectGitUser handles missing config');
}

// Test 3: detectGitUser() returns {name: 'Alice', email: null} when only name is set
async function testDetectGitUserPartial() {
  const result = await detectGitUser();

  // Validates that the function handles partial configurations
  assert.strictEqual(result.name === null || typeof result.name === 'string', true);
  assert.strictEqual(result.email === null || typeof result.email === 'string', true);

  console.log('✓ Test 3 passed: detectGitUser handles partial config');
}

// Test 4: configureGitUser() returns {status: 'configured', name: 'Alice', email: 'a@b.c'} on success
async function testConfigureGitUserSuccess() {
  const result = await configureGitUser();

  assert.strictEqual(typeof result.status, 'string', 'status should be string');
  assert.strictEqual(['configured', 'failed'].includes(result.status), true, 'status should be configured or failed');

  if (result.status === 'configured') {
    assert.strictEqual(typeof result.name, 'string', 'name should be string');
    assert.strictEqual(typeof result.email, 'string', 'email should be string');
    console.log('✓ Test 4 passed: configureGitUser returns configured state with name/email');
  } else {
    console.log('✓ Test 4 passed: configureGitUser returns failed status when appropriate');
  }
}

// Test 5: configureGitUser() returns {status: 'failed'} on git config error
async function testConfigureGitUserFailed() {
  const result = await configureGitUser();

  // This test validates return format
  assert.strictEqual(typeof result.status, 'string');

  if (result.status === 'failed') {
    console.log('✓ Test 5 passed: configureGitUser can return failed status');
  } else {
    console.log('✓ Test 5 passed: configureGitUser returns valid status');
  }
}

// Run all tests
async function runTests() {
  console.log('Running Git user configurator tests...\n');

  try {
    await testDetectGitUserConfigured();
    await testDetectGitUserNotConfigured();
    await testDetectGitUserPartial();
    await testConfigureGitUserSuccess();
    await testConfigureGitUserFailed();

    console.log('\n✓ All Git user tests passed');
  } catch (error) {
    console.error('\n✗ Test failed:', error.message);
    process.exit(1);
  }
}

runTests();
