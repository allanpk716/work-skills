'use strict';
/**
 * Tests for Git user configuration
 * Covers: CONF-07 (detect and configure user.name, user.email)
 */

const assert = require('assert');

// These will be implemented in Wave 2
// const { detectGitUser, configureGitUser } = require('../src/configurators/git-user.js');

async function testDetectGitUserBothSet() {
  // Test CONF-07: Returns values when both are set
  // Mock: execa returns { stdout: 'Alice' } for user.name
  // Mock: execa returns { stdout: 'alice@example.com' } for user.email
  // Expected: { name: 'Alice', email: 'alice@example.com' }
  console.log('  [ ] testDetectGitUserBothSet - pending implementation');
}

async function testDetectGitUserNeitherSet() {
  // Test CONF-07: Returns nulls when neither is set
  // Mock: execa returns { stdout: '' } for both
  // Expected: { name: null, email: null }
  console.log('  [ ] testDetectGitUserNeitherSet - pending implementation');
}

async function testDetectGitUserOnlyNameSet() {
  // Test CONF-07: Returns name only when email not set
  // Mock: execa returns { stdout: 'Alice' } for user.name
  // Mock: execa returns { stdout: '' } for user.email
  // Expected: { name: 'Alice', email: null }
  console.log('  [ ] testDetectGitUserOnlyNameSet - pending implementation');
}

async function testConfigureGitUserAlreadySet() {
  // Test CONF-07: When both are set, shows status
  // Mock: detectGitUser returns { name: 'Alice', email: 'a@b.c' }
  // Expected: { status: 'configured', name: 'Alice', email: 'a@b.c' }
  console.log('  [ ] testConfigureGitUserAlreadySet - pending implementation');
}

async function testConfigureGitUserPromptAndSet() {
  // Test CONF-07: Prompts for input and sets config
  // Mock: detectGitUser returns nulls
  // Mock: Input prompts return 'Bob' and 'bob@example.com'
  // Mock: execa git config succeeds
  // Expected: { status: 'configured', name: 'Bob', email: 'bob@example.com' }
  console.log('  [ ] testConfigureGitUserPromptAndSet - pending implementation');
}

async function testConfigureGitUserFailed() {
  // Test CONF-07: Git config command fails
  // Mock: detectGitUser returns nulls
  // Mock: Input prompts return values
  // Mock: execa git config throws error
  // Expected: { status: 'failed' }
  console.log('  [ ] testConfigureGitUserFailed - pending implementation');
}

async function runTests() {
  console.log('Git User Tests:');
  await testDetectGitUserBothSet();
  await testDetectGitUserNeitherSet();
  await testDetectGitUserOnlyNameSet();
  await testConfigureGitUserAlreadySet();
  await testConfigureGitUserPromptAndSet();
  await testConfigureGitUserFailed();
  console.log('Git User Tests: Done');
}

module.exports = { runTests };
