'use strict';

const { checkPlatform } = require('./platform.js');

/**
 * Main entry point for the installer
 */
function main() {
  // Step 1: Check platform (exits if not Windows)
  checkPlatform();

  // Step 2: More features will be added in Plan 14-02
  // For now, just acknowledge platform check passed
  console.log('Platform check passed: Windows detected');
}

module.exports = {
  main
};
