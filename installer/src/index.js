'use strict';

const { checkPlatform } = require('./platform.js');
const { parseArgs } = require('./cli.js');
const { showWelcome } = require('./welcome.js');
const { runAllDetectors } = require('./detectors/index.js');

/**
 * Main entry point for the installer
 */
async function main() {
  // Step 1: Check platform (exits if not Windows)
  checkPlatform();

  // Step 2: Parse command line arguments
  const options = parseArgs();

  // Step 3: Show welcome banner
  showWelcome({ useColors: options.useColors });

  // Step 4: Run environment detection
  const allPassed = await runAllDetectors();

  // Step 5: More features will be added in later phases
  // - Python dependency installation (Phase 16)
  // - Interactive configuration (Phase 17)
  // - Marketplace integration (Phase 18)
  // - Installation verification (Phase 19)
}

module.exports = {
  main
};
