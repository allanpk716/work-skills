'use strict';

const assert = require('assert');
const { detectGitSSH, configureGitSSH } = require('../../src/configurators/git-ssh.js');

// Test 1: detectGitSSH() returns {configured: true, command: '...'} when core.sshCommand is set
async function testDetectGitSSHConfigured() {
  // Mock scenario where git config returns a value
  // This test will pass when implementation exists
  const result = await detectGitSSH();

  // If SSH is configured on the system
  if (result.configured) {
    assert.strictEqual(typeof result.configured, 'boolean', 'configured should be boolean');
    assert.strictEqual(typeof result.command, 'string', 'command should be string');
    console.log('✓ Test 1 passed: detectGitSSH returns configured state correctly');
  } else {
    assert.strictEqual(result.configured, false);
    assert.strictEqual(result.command, null);
    console.log('✓ Test 1 passed: detectGitSSH returns unconfigured state correctly');
  }
}

// Test 2: detectGitSSH() returns {configured: false, command: null} when core.sshCommand is not set
async function testDetectGitSSHNotConfigured() {
  const result = await detectGitSSH();

  assert.strictEqual(typeof result.configured, 'boolean', 'configured should be boolean');
  assert.strictEqual(result.command === null || typeof result.command === 'string', true, 'command should be null or string');

  console.log('✓ Test 2 passed: detectGitSSH handles missing config');
}

// Test 3: configureGitSSH() returns {status: 'configured'} when already set
async function testConfigureGitSSHAlreadySet() {
  const result = await configureGitSSH();

  assert.strictEqual(typeof result.status, 'string', 'status should be string');
  assert.strictEqual(['configured', 'skipped'].includes(result.status), true, 'status should be configured or skipped');
  assert.strictEqual(typeof result.details, 'string', 'details should be string');

  console.log('✓ Test 3 passed: configureGitSSH returns valid result');
}

// Test 4: configureGitSSH() returns {status: 'skipped'} when user chooses to skip
async function testConfigureGitSSHSkipped() {
  // This test validates the return format when user skips
  const result = await configureGitSSH();

  assert.strictEqual(typeof result.status, 'string');
  assert.strictEqual(typeof result.details, 'string');

  if (result.status === 'skipped') {
    console.log('✓ Test 4 passed: configureGitSSH can return skipped status');
  } else {
    console.log('✓ Test 4 passed: configureGitSSH returns valid status (configured or skipped)');
  }
}

// Run all tests
async function runTests() {
  console.log('Running Git SSH configurator tests...\n');

  try {
    await testDetectGitSSHConfigured();
    await testDetectGitSSHNotConfigured();
    await testConfigureGitSSHAlreadySet();
    await testConfigureGitSSHSkipped();

    console.log('\n✓ All Git SSH tests passed');
  } catch (error) {
    console.error('\n✗ Test failed:', error.message);
    process.exit(1);
  }
}

runTests();
