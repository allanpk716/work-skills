'use strict';
/**
 * Test runner for all Phase 17 configuration tests
 * Run with: node installer/tests/run-all.js
 */

const pushoverDetect = require('./config-pushover-detect.js');
const pushoverInput = require('./config-pushover-input.js');
const pushoverSave = require('./config-pushover-save.js');
const gitSSHDetect = require('./config-git-ssh-detect.js');
const gitSSHGuide = require('./config-git-ssh-guide.js');
const gitUser = require('./config-git-user-detect.js');

async function runAllTests() {
  console.log('='.repeat(60));
  console.log('Phase 17 Configuration Tests');
  console.log('='.repeat(60));
  console.log('');

  try {
    await pushoverDetect.runTests();
    console.log('');
    await pushoverInput.runTests();
    console.log('');
    await pushoverSave.runTests();
    console.log('');
    await gitSSHDetect.runTests();
    console.log('');
    await gitSSHGuide.runTests();
    console.log('');
    await gitUser.runTests();
    console.log('');
    console.log('='.repeat(60));
    console.log('All Phase 17 tests completed');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('Test runner error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests };
