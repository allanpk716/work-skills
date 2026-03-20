'use strict';

const { checkPlatform } = require('./platform.js');
const { parseArgs } = require('./cli.js');
const { showWelcome } = require('./welcome.js');

/**
 * Main entry point for the installer
 */
function main() {
  // Step 1: Check platform (exits if not Windows)
  checkPlatform();

  // Step 2: Parse command line arguments
  const options = parseArgs();

  // Step 3: Show welcome banner
  showWelcome({ useColors: options.useColors });

  // Step 4: More features will be added in later phases
  // - Environment detection (Phase 15)
  // - Python dependency installation (Phase 16)
  // - Interactive configuration (Phase 17)
  // - Marketplace integration (Phase 18)
  // - Installation verification (Phase 19)
}

module.exports = {
  main
};
