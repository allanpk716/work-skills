'use strict';
/**
 * Tests for Git SSH configuration guidance
 * Covers: CONF-06 (Git SSH guidance when not configured)
 */

const assert = require('assert');

// These will be implemented in Wave 2
// const { configureGitSSH } = require('../src/configurators/git-ssh.js');

async function testConfigureGitSSHAlreadySet() {
  // Test: When SSH is already configured, shows status
  // Mock: detectGitSSH returns { configured: true, command: '...' }
  // Expected: { status: 'configured', details: '...' }
  console.log('  [ ] testConfigureGitSSHAlreadySet - pending implementation');
}

async function testConfigureGitSSHNotConfiguredSkip() {
  // Test CONF-06: Shows guidance and allows skip
  // Mock: detectGitSSH returns { configured: false }
  // Mock: Confirm prompt returns true (skip)
  // Expected: { status: 'skipped', details: 'user skipped' }
  console.log('  [ ] testConfigureGitSSHNotConfiguredSkip - pending implementation');
}

async function testConfigureGitSSHNotConfiguredContinue() {
  // Test CONF-06: Shows guidance, user continues
  // Mock: detectGitSSH returns { configured: false }
  // Mock: Confirm prompt returns false (don't skip, show guidance)
  // Expected: { status: 'configured', details: 'guidance shown' }
  console.log('  [ ] testConfigureGitSSHNotConfiguredContinue - pending implementation');
}

async function runTests() {
  console.log('Git SSH Guide Tests:');
  await testConfigureGitSSHAlreadySet();
  await testConfigureGitSSHNotConfiguredSkip();
  await testConfigureGitSSHNotConfiguredContinue();
  console.log('Git SSH Guide Tests: Done');
}

module.exports = { runTests };
