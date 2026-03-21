'use strict';
/**
 * Tests for Git SSH configuration detection
 * Covers: CONF-05 (detect core.sshCommand)
 */

const assert = require('assert');

// These will be implemented in Wave 2
// const { detectGitSSH } = require('../src/configurators/git-ssh.js');

async function testDetectGitSSHConfigured() {
  // Test CONF-05: Returns command when core.sshCommand is set
  // Mock: execa returns { stdout: 'C:/Program Files/TortoiseGit/bin/TortoisePlink.exe' }
  // Expected: { configured: true, command: 'C:/Program Files/TortoiseGit/bin/TortoisePlink.exe' }
  console.log('  [ ] testDetectGitSSHConfigured - pending implementation');
}

async function testDetectGitSSHNotConfigured() {
  // Test CONF-05: Returns null when core.sshCommand is not set
  // Mock: execa returns { stdout: '' }
  // Expected: { configured: false, command: null }
  console.log('  [ ] testDetectGitSSHNotConfigured - pending implementation');
}

async function runTests() {
  console.log('Git SSH Detection Tests:');
  await testDetectGitSSHConfigured();
  await testDetectGitSSHNotConfigured();
  console.log('Git SSH Detection Tests: Done');
}

module.exports = { runTests };
